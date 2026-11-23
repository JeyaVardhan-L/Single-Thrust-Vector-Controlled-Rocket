// MC-1 monocopter: manual flight software (Phase 1). ESP32-S3, no IMU.
//
// ELRS receiver (CRSF) -> ESP32 -> one ESC and four vane servos. The pilot closes the attitude loop; the vanes act directly on the sticks,
// scaled with throttle (see lib/tvc_core/manual_mode.h, covered by the host tests). Intended for tethered flight.
// Safety: arm only with the switch cycled and throttle low; link loss > 250 ms or switch off => motor off, vanes centred.
//
// Before flight run docs/phase1-monocopter/06-bench-tests.md with the PROPELLER REMOVED.
#include <Arduino.h>

#include "crsf.h"
#include "manual_mode.h"
#include "mixers.h"
#include "pins.h"

using namespace tvc;

// ---------------- tunables ----------------
constexpr uint32_t LOOP_HZ = 250;
constexpr uint32_t LOOP_US = 1000000 / LOOP_HZ;
constexpr uint32_t RC_TIMEOUT_MS = 250;
constexpr int ESC_HZ = 400, SERVO_HZ = 50;             // raise SERVO_HZ to 200 only after checking that your servos accept it
constexpr int PWM_BITS = 14;
constexpr float VANE_MAX_DEG = 25.f;                   // vane angle at full command; the servo moves the same angle (direct drive)
constexpr float VANE_SIGN[4] = {1.f, 1.f, 1.f, 1.f};   // flip a servo if it is mounted mirrored (bench test!)
constexpr float VBAT_DIV = 57.f / 10.f;                // 47k + 10k divider
constexpr float VBAT_CAL = 1.0f;                       // trim against a multimeter
constexpr float VBAT_WARN = 14.0f;                     // 3.5 V per cell: warn

static ManualConfig cfg;                               // start with the defaults, tune on the tether
static ManualMode flight(cfg);
static CrsfParser crsf;
static ServoMap servoMap[4];
static uint32_t lastRcMs = 0, nextLoopUs = 0, loops = 0;

static void pwmUs(int channel, int freq, float us) {
  const float period = 1e6f / freq;
  ledcWrite(channel, (uint32_t)(constrain(us, 0.f, period) / period * ((1 << PWM_BITS) - 1)));
}
static void setupPwm(int channel, int pin, int freq) { ledcSetup(channel, freq, PWM_BITS); ledcAttachPin(pin, channel); }

static void writeVanes(const float v[4]) {
  for (int i = 0; i < 4; ++i) pwmUs(1 + i, SERVO_HZ, vaneToUs(v[i] * VANE_SIGN[i], servoMap[i], VANE_MAX_DEG));
}

void setup() {
  Serial.begin(115200);
  Serial1.begin(420000, SERIAL_8N1, PIN_CRSF_RX, PIN_CRSF_TX);
  pinMode(PIN_LED, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  analogReadResolution(12);
  setupPwm(0, PIN_ESC, ESC_HZ);
  pwmUs(0, ESC_HZ, 1000.f);                            // motor off before anything else
  for (int i = 0; i < 4; ++i) setupPwm(1 + i, PIN_VANE[i], SERVO_HZ);
  const float centre[4] = {0, 0, 0, 0};
  writeVanes(centre);
  nextLoopUs = micros();
}

void loop() {
  while ((int32_t)(micros() - nextLoopUs) < 0) {
    while (Serial1.available()) if (crsf.feed(Serial1.read())) lastRcMs = millis();
  }
  nextLoopUs += LOOP_US;

  ManualInput in;
  in.linkOk = (millis() - lastRcMs) < RC_TIMEOUT_MS && crsf.framesOk > 0;
  in.roll = crsf.norm(CH_ROLL);
  in.pitch = crsf.norm(CH_PITCH);
  in.yaw = crsf.norm(CH_YAW);
  in.throttle = constrain((crsf.us(CH_THROTTLE) - 1000.f) / 1000.f, 0.f, 1.f);
  in.armSwitchUs = crsf.us(CH_ARM);
  const ManualOutput out = flight.update(in);

  pwmUs(0, ESC_HZ, out.motorUs);
  writeVanes(out.vane);
  digitalWrite(PIN_LED, out.armed);

  const float vbat = analogReadMilliVolts(PIN_VBAT) * 0.001f * VBAT_DIV * VBAT_CAL;
  digitalWrite(PIN_BUZZER, (vbat > 6.f && vbat < VBAT_WARN && (millis() / 400) % 2) ? HIGH : LOW);

  if (++loops % (LOOP_HZ / 10) == 0)
    Serial.printf("armed=%d link=%d thr=%.2f vbat=%.2f v=%.2f %.2f %.2f %.2f\n", out.armed, in.linkOk, in.throttle, vbat, out.vane[0], out.vane[1], out.vane[2], out.vane[3]);
}
