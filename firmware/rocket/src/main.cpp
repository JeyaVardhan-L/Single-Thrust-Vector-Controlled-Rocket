// RK-1 TVC rocket: flight computer baseline (Phase 2). Teensy 4.1.
//
// Loop @ 500 Hz: IMU -> Mahony AHRS -> flight-state machine -> (BOOST only) PD+I on nose-tilt error -> gimbal servos.
// Motor ignition is done by the GROUND ignition controller. This firmware only detects launch.
//
// STATUS: baseline skeleton, NOT flown. Required before any burn:
//   - bench sign checks (docs/phase2-rocket/06-firmware-and-gnc.md, "Sign convention")
//   - gimbal calibration, Gate A (docs/phase2-rocket/05-gimbal-design.md)
//   - static fire with the gimbal locked, then open-loop sweeps, then closed loop (docs/phase2-rocket/07-...)
#include <Adafruit_BMP3XX.h>
#include <Arduino.h>
#include <SD.h>
#include <SPI.h>
#include <Servo.h>
#include <Wire.h>

#include "ahrs.h"
#include "flight_state.h"
#include "icm42688.h"
#include "mixers.h"
#include "pid.h"
#include "pins.h"

using namespace tvc;

constexpr float LOOP_HZ = 500.f;
constexpr float DT = 1.f / LOOP_HZ;
constexpr float RAD2DEG = 57.2957795f;

// ---- gimbal control gains: PID lab rocket preset for an F-class motor (T = 30 N, G = 168 rad/s^2 per rad).
//      Retune for other motors: G scales with thrust, so Kp and Kd scale with 1/thrust. ----
constexpr PidGains GAINS_PITCH{0.8f, 0.1f, 0.1f, 6.5f * 0.0174533f, 0.03f};
constexpr PidGains GAINS_YAW{0.8f, 0.1f, 0.1f, 6.5f * 0.0174533f, 0.03f};

static Icm42688 imu(PIN_IMU_CS);
static Adafruit_BMP3XX bmp;
static Mahony ahrs(2.0f, 0.0f);
static FlightStateMachine fsm;
static Pid pidPitch(GAINS_PITCH), pidYaw(GAINS_YAW);
static Servo servoAxis1, servoAxis2, servoChute;
static GimbalMap map1, map2;          // set sign = -1 on a mirrored axis after the bench test
static Lpf vzFilter(4.f, 25.f);
static File logFile;
static float gyroBias[3] = {0, 0, 0};
static float groundAlt = 0.f, lastAlt = 0.f, altM = 0.f, vz = 0.f;
static uint32_t chuteFiredMs = 0;
static elapsedMicros loopTimer;

static float pressureToAlt(float pa) { return 44330.f * (1.f - powf(pa / 101325.f, 0.1903f)); }

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
  Serial2.begin(9600);   // GPS
  Serial4.begin(57600);  // LoRa module (UART mode)
  pinMode(PIN_LED, OUTPUT); pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_PYRO_CHUTE, OUTPUT); pinMode(PIN_PYRO_SPARE, OUTPUT);
  digitalWrite(PIN_PYRO_CHUTE, LOW); digitalWrite(PIN_PYRO_SPARE, LOW);       // pyro outputs OFF first, always
  pinMode(PIN_RBF, INPUT_PULLUP); pinMode(PIN_ARM_SWITCH, INPUT_PULLUP);
  servoAxis1.attach(PIN_SERVO_AXIS1, 900, 2100);
  servoAxis2.attach(PIN_SERVO_AXIS2, 900, 2100);
  servoChute.attach(PIN_SERVO_CHUTE, 900, 2100);
  centreGimbal();
  if (!imu.begin()) { while (true) { digitalWrite(PIN_LED, !digitalRead(PIN_LED)); delay(100); } }
  Wire.begin();
  if (bmp.begin_I2C(0x76)) {
    bmp.setPressureOversampling(BMP3_OVERSAMPLING_8X);
    bmp.setOutputDataRate(BMP3_ODR_25_HZ);
  }
  calibrateGyro();
  if (bmp.performReading()) groundAlt = lastAlt = pressureToAlt(bmp.pressure);
  if (SD.begin(BUILTIN_SDCARD)) logFile = SD.open("flight.csv", FILE_WRITE);
  if (logFile) logFile.println("ms,state,tilt_deg,axialG,err_pitch,err_yaw,gimbal1_deg,gimbal2_deg,alt_m,vz_mps");
  loopTimer = 0;
}

void loop() {
  if (loopTimer < (uint32_t)(DT * 1e6f)) return;
  loopTimer -= (uint32_t)(DT * 1e6f);

  // ---- sensors ----
  float g[3], a[3];
  imu.read(g, a);
  for (int k = 0; k < 3; ++k) g[k] -= gyroBias[k];
  ahrs.update(g[0], g[1], g[2], a[0], a[1], a[2], DT);

  static uint32_t n = 0; ++n;
  if (n % 20 == 0 && bmp.performReading()) {                 // 25 Hz baro
    altM = pressureToAlt(bmp.pressure) - groundAlt;
    vz = vzFilter.update((altM - lastAlt) * 25.f);
    lastAlt = altM;
  }

  // ---- flight state ----
  FlightInputs in;
  in.axialG = a[0];                                           // body X is the rocket axis (nose up on the pad)
  in.tiltDeg = ahrs.noseTilt() * RAD2DEG;
  in.vertSpeed = vz;
  in.armSwitch = digitalRead(PIN_ARM_SWITCH) == LOW;
  in.rbfInserted = digitalRead(PIN_RBF) == LOW;
  in.fault = false;                                           // TODO: IMU timeout, battery below 6.4 V, SD fail
  fsm.update(in, DT);

  // ---- attitude error of the nose axis relative to vertical (body-frame small-angle vector) ----
  const Quat& q = ahrs.q;
  const float errPitch = q.w * q.w - q.x * q.x - q.y * q.y + q.z * q.z;   // about body Y
  const float errYaw = -2.f * (q.y * q.z + q.w * q.x);                    // about body Z

  // ---- gimbal ----
  float cmdPitchDeg = 0.f, cmdYawDeg = 0.f;
  if (fsm.gimbalEnabled()) {
    // Torque convention: positive command => positive torque about the corresponding body axis (verified on the bench).
    cmdPitchDeg = pidPitch.update(errPitch, g[1], DT) * RAD2DEG;
    cmdYawDeg = pidYaw.update(errYaw, g[2], DT) * RAD2DEG;
  } else {
    pidPitch.reset(); pidYaw.reset();
  }
  servoAxis1.writeMicroseconds((int)map1.toUs(cmdPitchDeg));
  servoAxis2.writeMicroseconds((int)map2.toUs(cmdYawDeg));

  // ---- recovery: single pulse, never while SAFE ----
  if (fsm.chuteRequested() && chuteFiredMs == 0) {
    chuteFiredMs = millis();
    digitalWrite(PIN_PYRO_CHUTE, HIGH);
    servoChute.writeMicroseconds(2000);
  }
  if (chuteFiredMs && millis() - chuteFiredMs > 1000) digitalWrite(PIN_PYRO_CHUTE, LOW);

  digitalWrite(PIN_LED, fsm.state() == FlightState::Armed);

  // ---- log + telemetry ----
  const bool logging = fsm.state() != FlightState::Safe && fsm.state() != FlightState::Landed;
  if (logFile && logging && (n % 2 == 0)) {
    logFile.printf("%lu,%s,%.2f,%.3f,%.4f,%.4f,%.2f,%.2f,%.2f,%.2f\n", millis(), stateName(fsm.state()), in.tiltDeg, in.axialG, errPitch, errYaw, cmdPitchDeg, cmdYawDeg, altM, vz);
    if (n % 500 == 0) logFile.flush();
  }
  if (n % 100 == 0) Serial4.printf("$TVC,%lu,%s,%.1f,%.2f,%.1f\n", millis(), stateName(fsm.state()), in.tiltDeg, altM, vz);   // 5 Hz
  if (n % 250 == 0) Serial.printf("%s tilt=%.1f alt=%.1f vz=%.1f\n", stateName(fsm.state()), in.tiltDeg, altM, vz);
}
