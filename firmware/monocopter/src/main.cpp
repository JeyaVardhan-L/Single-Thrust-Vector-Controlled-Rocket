// MC-1 monocopter: attitude-hold flight software (Phase 1). Teensy 4.1.
//
// Control: angle mode on roll/pitch (PID, derivative on gyro), rate mode on yaw. Output -> vane mixer -> 4 servos.
// Safety: arm only with throttle low and RC link alive; RC loss > 250 ms or switch off => motor off, vanes centred.
//
// Before flight run docs/phase1-monocopter/06-bench-tests.md, especially the sign checks, with the PROPELLER REMOVED.
#include <Arduino.h>
#include <SD.h>
#include <SPI.h>
#include <Servo.h>

#include "ahrs.h"
#include "crsf.h"
#include "icm42688.h"
#include "mixers.h"
#include "pid.h"
#include "pins.h"

using namespace tvc;

// ---------------- tunables (start here; see the PID lab and docs) ----------------
constexpr float LOOP_HZ = 500.f;
constexpr float DT = 1.f / LOOP_HZ;
constexpr float MAX_ANGLE_RAD = 15.f * 0.0174533f;     // stick -> angle setpoint
constexpr float MAX_YAW_RATE = 90.f * 0.0174533f;      // rad/s
constexpr float YAW_KP = 0.25f;                        // vane units per rad/s
constexpr float YAW_TRIM = 0.0f;                       // static vane trim that cancels prop torque (find on the tether)
constexpr float MIN_AUTH_THROTTLE = 0.12f;             // below this the prop wash is too weak: vanes centred
constexpr uint32_t RC_TIMEOUT_MS = 250;
constexpr float VANE_SIGN[4] = {1.f, 1.f, 1.f, 1.f};   // flip a servo if its linkage is mirrored (bench test!)

static Icm42688 imu(PIN_IMU_CS);
static Mahony ahrs(2.0f, 0.0f);
static CrsfParser crsf;
static Pid pidRoll({2.8f, 0.8f, 0.78f, 1.f, 0.3f});
static Pid pidPitch({2.8f, 0.8f, 0.78f, 1.f, 0.3f});
static Servo vane[4];
static ServoMap servoMap[4];
static float gyroBias[3] = {0, 0, 0};
static uint32_t lastRcMs = 0;
static bool armed = false;
static File logFile;
static elapsedMicros loopTimer;

static void escWriteUs(float us) {
  // 12-bit PWM at 400 Hz: period 2500 us
  analogWrite(PIN_ESC, (int)(us / 2500.f * 4095.f));
}

static void centreVanes() { for (int i = 0; i < 4; ++i) vane[i].writeMicroseconds((int)servoMap[i].centerUs); }

static void calibrateGyro() {
  float g[3], a[3], sum[3] = {0, 0, 0};
  const int N = 1000;
  for (int i = 0; i < N; ++i) { imu.read(g, a); for (int k = 0; k < 3; ++k) sum[k] += g[k]; delay(2); }
  for (int k = 0; k < 3; ++k) gyroBias[k] = sum[k] / N;
}

void setup() {
  Serial.begin(115200);
  Serial1.begin(420000);
  pinMode(PIN_LED, OUTPUT); pinMode(PIN_BUZZER, OUTPUT);
  analogWriteResolution(12); analogWriteFrequency(PIN_ESC, 400);
  escWriteUs(1000);                                  // motor off before anything else
  for (int i = 0; i < 4; ++i) vane[i].attach(PIN_VANE[i], 900, 2100);
  centreVanes();
  if (!imu.begin()) { while (true) { digitalWrite(PIN_LED, !digitalRead(PIN_LED)); delay(100); } }   // fast blink = IMU fault
  Serial.println("Calibrating gyro: keep the vehicle still...");
  calibrateGyro();
  if (SD.begin(BUILTIN_SDCARD)) logFile = SD.open("flight.csv", FILE_WRITE);
  if (logFile) logFile.println("ms,armed,roll,pitch,gx,gy,gz,thr,v1,v2,v3,v4");
  loopTimer = 0;
}

void loop() {
  if (loopTimer < (uint32_t)(DT * 1e6f)) return;
  loopTimer -= (uint32_t)(DT * 1e6f);

  // --- receiver ---
  while (Serial1.available()) if (crsf.feed(Serial1.read())) lastRcMs = millis();
  const bool rcOk = (millis() - lastRcMs) < RC_TIMEOUT_MS;

  // --- sensors + attitude ---
  float g[3], a[3];
  imu.read(g, a);
  for (int k = 0; k < 3; ++k) g[k] -= gyroBias[k];
  ahrs.update(g[0], g[1], g[2], a[0], a[1], a[2], DT);

  // --- arming ---
  const float thr = constrain((crsf.us(CH_THROTTLE) - 1000.f) / 1000.f, 0.f, 1.f);
  const bool armSw = crsf.us(CH_ARM) > 1700.f;
  if (!rcOk || !armSw) { if (armed) { pidRoll.reset(); pidPitch.reset(); } armed = false; }
  else if (!armed && thr < 0.05f && fabsf(ahrs.roll()) < 0.35f && fabsf(ahrs.pitch()) < 0.35f) armed = true;   // < 20 deg

  float v[4] = {0, 0, 0, 0};
  if (armed) {
    const float rollSp = crsf.norm(CH_ROLL) * MAX_ANGLE_RAD;
    const float pitchSp = crsf.norm(CH_PITCH) * MAX_ANGLE_RAD;
    const float yawRateSp = crsf.norm(CH_YAW) * MAX_YAW_RATE;
    const bool auth = thr > MIN_AUTH_THROTTLE;
    float cr = 0.f, cp = 0.f, cy = 0.f;
    if (auth) {
      cr = pidRoll.update(rollSp - ahrs.roll(), g[0], DT);
      cp = pidPitch.update(pitchSp - ahrs.pitch(), g[1], DT);
      cy = constrain(YAW_KP * (yawRateSp - g[2]) + YAW_TRIM, -1.f, 1.f);
    } else {
      pidRoll.reset(); pidPitch.reset();
    }
    mixMonocopter(cr, cp, cy, v);
    escWriteUs(1000.f + thr * 1000.f);
  } else {
    escWriteUs(1000.f);
  }
  for (int i = 0; i < 4; ++i) vane[i].writeMicroseconds((int)vaneToUs(v[i] * VANE_SIGN[i], servoMap[i]));
  digitalWrite(PIN_LED, armed);

  // --- logging (100 Hz) and console (10 Hz) ---
  static uint32_t n = 0; ++n;
  if (logFile && (n % 5 == 0)) {
    logFile.printf("%lu,%d,%.4f,%.4f,%.3f,%.3f,%.3f,%.3f,%.3f,%.3f,%.3f,%.3f\n", millis(), armed, ahrs.roll(), ahrs.pitch(), g[0], g[1], g[2], thr, v[0], v[1], v[2], v[3]);
    if (n % 500 == 0) logFile.flush();
  }
  if (n % 50 == 0) Serial.printf("armed=%d rc=%d roll=%.1f pitch=%.1f thr=%.2f\n", armed, rcOk, ahrs.roll() * 57.296f, ahrs.pitch() * 57.296f, thr);
}
