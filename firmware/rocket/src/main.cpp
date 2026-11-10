// RK-1 TVC rocket: flight computer (Phase 2). Teensy 4.1.
//
// Electric thrust-vector vehicle: a coaxial pair of brushless motors on a two-axis servo gimbal.
// Loop @ 500 Hz: CRSF + IMU -> Mahony AHRS -> flight-state machine -> nose-tilt PID -> gimbal servos,
// throttle + spin PID -> two ESCs.
// Safety: motors run only in FLIGHT; link loss, arm switch off, tilt > 35 deg or a fault cuts the motors and centres the gimbal.
// Before the first spin run docs/phase2-rocket/05-gimbal-design.md (Gate A) with the PROPS REMOVED.
#include <Adafruit_BMP3XX.h>
#include <Arduino.h>
#include <SD.h>
#include <SPI.h>
#include <Servo.h>
#include <Wire.h>

#include "ahrs.h"
#include "crsf.h"
#include "flight_state.h"
#include "icm42688.h"
#include "mixers.h"
#include "pid.h"
#include "pins.h"

using namespace tvc;

constexpr float LOOP_HZ = 500.f;
constexpr float DT = 1.f / LOOP_HZ;
constexpr float RAD2DEG = 57.2957795f;
constexpr float DEG2RAD = 0.0174533f;
constexpr uint32_t RC_TIMEOUT_MS = 250;

// ---- tunables ----
// Gimbal gains from the PID lab rocket preset (hover thrust ~11 N, G ~ 53 rad/s^2 per rad). Output in rad of gimbal angle.
constexpr PidGains GAINS_TILT{1.2f, 0.2f, 0.21f, 6.5f * DEG2RAD, 0.03f};
constexpr float HOVER_THROTTLE = 0.60f;                // gimbal authority scales with thrust (about throttle^2): gains are scheduled around this
constexpr float MAX_STICK_TILT = 5.f * DEG2RAD;        // pitch / roll stick -> tilt set-point offset
constexpr float MAX_SPIN_RATE = 90.f * DEG2RAD;        // yaw stick -> spin rate set-point about the nose axis
constexpr float SPIN_KP = 0.08f;                       // differential throttle per rad/s of spin-rate error
constexpr float MAX_THROTTLE = 0.90f;                  // headroom so the differential never clips

static Icm42688 imu(PIN_IMU_CS);
static Adafruit_BMP3XX bmp;
static Mahony ahrs(2.0f, 0.0f);
static CrsfParser crsf;
static FlightStateMachine fsm;
static Pid pidPitch(GAINS_TILT), pidYaw(GAINS_TILT);
static Servo servoAxis1, servoAxis2;
static GimbalMap map1, map2;           // set sign = -1 on a mirrored axis after the bench sign test
static File logFile;
static float gyroBias[3] = {0, 0, 0};
static float groundAlt = 0.f, altM = 0.f;
static uint32_t lastRcMs = 0;
static elapsedMicros loopTimer;

static float pressureToAlt(float pa) { return 44330.f * (1.f - powf(pa / 101325.f, 0.1903f)); }

static void escWrite(int pin, float duty01) {              // 12-bit PWM at 400 Hz: period 2500 us
  const float us = 1000.f + constrain(duty01, 0.f, 1.f) * 1000.f;
  analogWrite(pin, (int)(us / 2500.f * 4095.f));
}
static void motorsOff() { escWrite(PIN_ESC_UPPER, 0.f); escWrite(PIN_ESC_LOWER, 0.f); }
static void centreGimbal() {
  servoAxis1.writeMicroseconds((int)map1.toUs(0.f));
  servoAxis2.writeMicroseconds((int)map2.toUs(0.f));
}
static void calibrateGyro() {
  float g[3], a[3], sum[3] = {0, 0, 0};
  for (int i = 0; i < 1000; ++i) { imu.read(g, a); for (int k = 0; k < 3; ++k) sum[k] += g[k]; delay(2); }
  for (int k = 0; k < 3; ++k) gyroBias[k] = sum[k] / 1000.f;
}

void setup() {
  Serial.begin(115200);
  Serial1.begin(420000);   // ELRS receiver
  Serial2.begin(9600);     // GPS
  pinMode(PIN_LED, OUTPUT); pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_RBF, INPUT_PULLUP); pinMode(PIN_ARM_SWITCH, INPUT_PULLUP);
  analogWriteResolution(12);
  analogWriteFrequency(PIN_ESC_UPPER, 400); analogWriteFrequency(PIN_ESC_LOWER, 400);
  motorsOff();                                            // motors off before anything else
  servoAxis1.attach(PIN_SERVO_AXIS1, 900, 2100);
  servoAxis2.attach(PIN_SERVO_AXIS2, 900, 2100);
  centreGimbal();
  if (!imu.begin()) { while (true) { digitalWrite(PIN_LED, !digitalRead(PIN_LED)); delay(100); } }   // fast blink = IMU fault
  Wire.begin();
  if (bmp.begin_I2C(0x76)) { bmp.setPressureOversampling(BMP3_OVERSAMPLING_8X); bmp.setOutputDataRate(BMP3_ODR_25_HZ); }
  Serial.println("Calibrating gyro: keep the vehicle still...");
  calibrateGyro();
  if (bmp.performReading()) groundAlt = pressureToAlt(bmp.pressure);
  if (SD.begin(BUILTIN_SDCARD)) logFile = SD.open("flight.csv", FILE_WRITE);
  if (logFile) logFile.println("ms,state,tilt_deg,thr,err_pitch,err_yaw,gimbal1_deg,gimbal2_deg,spin_cmd,alt_m");
  loopTimer = 0;
}

void loop() {
  if (loopTimer < (uint32_t)(DT * 1e6f)) return;
  loopTimer -= (uint32_t)(DT * 1e6f);

  // ---- receiver ----
  while (Serial1.available()) if (crsf.feed(Serial1.read())) lastRcMs = millis();
  const bool rcOk = (millis() - lastRcMs) < RC_TIMEOUT_MS;
  const float thr = constrain((crsf.us(CH_THROTTLE) - 1000.f) / 1000.f, 0.f, 1.f);

  // ---- sensors + attitude ----
  float g[3], a[3];
  imu.read(g, a);
  for (int k = 0; k < 3; ++k) g[k] -= gyroBias[k];
  ahrs.update(g[0], g[1], g[2], a[0], a[1], a[2], DT);
  static uint32_t n = 0; ++n;
  if (n % 20 == 0 && bmp.performReading()) altM = pressureToAlt(bmp.pressure) - groundAlt;   // 25 Hz

  // ---- flight state ----
  FlightInputs in;
  in.throttle = thr;
  in.tiltDeg = ahrs.noseTilt() * RAD2DEG;
  in.armSwitch = digitalRead(PIN_ARM_SWITCH) == LOW && crsf.us(CH_ARM) > 1700.f;   // both switches must be on
  in.rbfInserted = digitalRead(PIN_RBF) == LOW;
  in.rcOk = rcOk;
  in.fault = false;                                       // set from health monitors: IMU timeout, pack voltage, SD failure
  fsm.update(in, DT);

  // ---- attitude error of the nose axis relative to vertical (body-frame small-angle vector) ----
  const Quat& q = ahrs.q;
  const float errPitch = q.w * q.w - q.x * q.x - q.y * q.y + q.z * q.z;   // about body Y
  const float errYaw = -2.f * (q.y * q.z + q.w * q.x);                    // about body Z

  // ---- control ----
  float gim1 = 0.f, gim2 = 0.f, spinCmd = 0.f, mUp = 0.f, mDn = 0.f;
  if (fsm.gimbalEnabled()) {
    const float gs = constrain(HOVER_THROTTLE * HOVER_THROTTLE / max(thr * thr, 0.0625f), 0.5f, 2.5f);   // gain schedule
    const float spPitch = crsf.norm(CH_PITCH) * MAX_STICK_TILT;
    const float spYaw = -crsf.norm(CH_ROLL) * MAX_STICK_TILT;
    // Torque convention: positive output => positive torque about the matching body axis (verified in the Gate A sign test).
    gim1 = pidPitch.update(errPitch + spPitch, g[1], DT) * gs * RAD2DEG;
    gim2 = pidYaw.update(errYaw + spYaw, g[2], DT) * gs * RAD2DEG;
    spinCmd = SPIN_KP * (-crsf.norm(CH_YAW) * MAX_SPIN_RATE - g[0]);       // body X is the nose axis (up): positive spin = counter-clockwise from above; yaw stick right = clockwise
    float m[2];
    mixCoax(min(thr, MAX_THROTTLE), spinCmd, m);
    mUp = m[0]; mDn = m[1];
  } else {
    pidPitch.reset(); pidYaw.reset();
  }
  escWrite(PIN_ESC_UPPER, fsm.motorsEnabled() ? mUp : 0.f);
  escWrite(PIN_ESC_LOWER, fsm.motorsEnabled() ? mDn : 0.f);
  servoAxis1.writeMicroseconds((int)map1.toUs(gim1));
  servoAxis2.writeMicroseconds((int)map2.toUs(gim2));
  digitalWrite(PIN_LED, fsm.state() == FlightState::Armed || fsm.state() == FlightState::Flight);

  // ---- log + console ----
  const bool logging = fsm.state() == FlightState::Armed || fsm.state() == FlightState::Flight;
  if (logFile && logging && (n % 2 == 0)) {
    logFile.printf("%lu,%s,%.2f,%.3f,%.4f,%.4f,%.2f,%.2f,%.3f,%.2f\n", millis(), stateName(fsm.state()), in.tiltDeg, thr, errPitch, errYaw, gim1, gim2, spinCmd, altM);
    if (n % 500 == 0) logFile.flush();
  }
  if (n % 250 == 0) Serial.printf("%s rc=%d tilt=%.1f thr=%.2f alt=%.1f\n", stateName(fsm.state()), rcOk, in.tiltDeg, thr, altM);
}
