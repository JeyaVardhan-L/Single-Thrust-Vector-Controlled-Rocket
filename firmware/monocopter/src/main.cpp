// MC-1 monocopter: phone flight software (Phase 1). ESP32-S3, no IMU.
//
// The ESP32-S3 makes its own Wi-Fi network (config.h) and serves one web page (web_ui.h, built from web/control.html).
// The phone sends the pilot's commands every 50 ms: arm, throttle, direction wheel, yaw. The flight logic (lib/tvc_core/phone_mode.h,
// covered by the host tests) turns them into one ESC pulse and four vane servo pulses and enforces the safety rules:
//   * arm only on a rising edge of the app's arm switch with the throttle at zero, after the switch has been seen off
//   * the throttle is always ramped (0.30 per second up, 0.60 per second down), never stepped
//   * no command for 400 ms: ramp down with the vanes centred; no command for 2.5 s: disarmed
//   * the kill button stops the motor at once
// Intended for tethered flight. Before flight run docs/phase1-monocopter/06-bench-tests.md with the PROPELLER REMOVED.
#include <Arduino.h>
#include <WebServer.h>
#include <WiFi.h>

#include "config.h"
#include "mixers.h"
#include "phone_mode.h"
#include "pins.h"
#include "web_ui.h"

using namespace tvc;

// ---------------- tunables ----------------
constexpr uint32_t LOOP_HZ = 250;
constexpr uint32_t LOOP_US = 1000000 / LOOP_HZ;
constexpr int ESC_HZ = 400, SERVO_HZ = 50;             // raise SERVO_HZ to 200 only after checking that your servos accept it
constexpr int PWM_BITS = 14;
constexpr float VANE_MAX_DEG = 25.f;                   // vane angle at full command; the servo moves the same angle (direct drive)
constexpr float VANE_SIGN[4] = {1.f, 1.f, 1.f, 1.f};   // flip a servo if it is mounted mirrored (bench test G0-04)
constexpr float VBAT_DIV = 57.f / 10.f;                // 47k + 10k divider
constexpr float VBAT_CAL = 1.0f;                       // trim against a multimeter
constexpr float VBAT_WARN = 14.0f;                     // 3.5 V per cell: beep

static PhoneConfig cfg;                                // start with the defaults, tune on the tether (yawTrim, hoverThrottle, scales)
static PhoneMode flight(cfg);
static WebServer server(80);
static ServoMap servoMap[4];

struct Command {
  bool arm = false, kill = false;
  float thr = 0, limit = 0.5f, wx = 0, wy = 0, yaw = 0, trR = 0, trP = 0;
  int seq = 0;
} cmd;
static uint32_t lastCmdMs = 0, nextLoopUs = 0, lastUs = 0, loops = 0;
static bool anyCmd = false;
static PhoneOutput out;
static float vbat = 0;

static void pwmUs(int channel, int freq, float us) {
  const float period = 1e6f / freq;
  ledcWrite(channel, (uint32_t)(constrain(us, 0.f, period) / period * ((1 << PWM_BITS) - 1)));
}
static void setupPwm(int channel, int pin, int freq) { ledcSetup(channel, freq, PWM_BITS); ledcAttachPin(pin, channel); }
static void writeVanes(const float v[4]) {
  for (int i = 0; i < 4; ++i) pwmUs(1 + i, SERVO_HZ, vaneToUs(v[i] * VANE_SIGN[i], servoMap[i], VANE_MAX_DEG));
}

// ---------------- web ----------------
static int iarg(const char* name, int def) { return server.hasArg(name) ? server.arg(name).toInt() : def; }

static void handleControl() {
  cmd.arm = iarg("a", 0) == 1;
  cmd.kill = iarg("k", 0) == 1;
  cmd.thr = constrain(iarg("t", 0), 0, 1000) / 1000.f;
  cmd.limit = constrain(iarg("l", 500), 0, 1000) / 1000.f;
  cmd.wx = constrain(iarg("x", 0), -1000, 1000) / 1000.f;
  cmd.wy = constrain(iarg("y", 0), -1000, 1000) / 1000.f;
  cmd.yaw = constrain(iarg("w", 0), -1000, 1000) / 1000.f;
  cmd.trR = constrain(iarg("r", 0), -200, 200) / 1000.f;
  cmd.trP = constrain(iarg("p", 0), -200, 200) / 1000.f;
  cmd.seq = iarg("n", 0);
  lastCmdMs = millis();
  anyCmd = true;
  char buf[128];
  snprintf(buf, sizeof(buf), "{\"s\":%d,\"t\":%d,\"v\":[%d,%d,%d,%d],\"b\":%d,\"n\":%d}", (int)out.state, (int)lroundf(out.throttle * 1000.f),
           (int)lroundf(out.vane[0] * 1000.f), (int)lroundf(out.vane[1] * 1000.f), (int)lroundf(out.vane[2] * 1000.f), (int)lroundf(out.vane[3] * 1000.f),
           (int)lroundf(vbat * 1000.f), cmd.seq);
  server.sendHeader("Cache-Control", "no-store");
  server.send(200, "application/json", buf);
}

static void setupWeb() {
  server.on("/", HTTP_GET, [] { server.sendHeader("Cache-Control", "no-store"); server.send_P(200, "text/html", INDEX_HTML); });
  server.on("/c", HTTP_GET, handleControl);
  // Phones probe these to decide whether the network has internet. Answer them so no "sign in" pop-up hides the app.
  server.on("/generate_204", HTTP_GET, [] { server.send(204); });
  server.on("/gen_204", HTTP_GET, [] { server.send(204); });
  server.on("/hotspot-detect.html", HTTP_GET, [] { server.send(200, "text/html", "<HTML><HEAD><TITLE>Success</TITLE></HEAD><BODY>Success</BODY></HTML>"); });
  server.on("/connecttest.txt", HTTP_GET, [] { server.send(200, "text/plain", "Microsoft Connect Test"); });
  server.on("/ncsi.txt", HTTP_GET, [] { server.send(200, "text/plain", "Microsoft NCSI"); });
  server.onNotFound([] { server.send(404, "text/plain", "not found"); });
  server.begin();
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_LED, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  analogReadResolution(12);
  setupPwm(0, PIN_ESC, ESC_HZ);
  pwmUs(0, ESC_HZ, 1000.f);                            // motor off before anything else
  for (int i = 0; i < 4; ++i) setupPwm(1 + i, PIN_VANE[i], SERVO_HZ);
  const float centre[4] = {0, 0, 0, 0};
  writeVanes(centre);

  WiFi.mode(WIFI_AP);
  WiFi.setSleep(false);                                // no power-save: keeps the 50 ms command rhythm
  WiFi.softAPConfig(IPAddress(192, 168, 4, 1), IPAddress(192, 168, 4, 1), IPAddress(255, 255, 255, 0));
  WiFi.softAP(WIFI_SSID, WIFI_PASS, WIFI_CHANNEL, 0, 2);   // not hidden, at most two phones
  setupWeb();
  Serial.printf("MC-1: join Wi-Fi '%s', open http://%s/\n", WIFI_SSID, WiFi.softAPIP().toString().c_str());
  nextLoopUs = lastUs = micros();
}

void loop() {
  server.handleClient();
  const uint32_t now = micros();
  if ((int32_t)(now - nextLoopUs) < 0) { yield(); return; }
  nextLoopUs += LOOP_US;
  if ((int32_t)(now - nextLoopUs) > (int32_t)(4 * LOOP_US)) nextLoopUs = now + LOOP_US;   // after a long page load: do not try to catch up
  const float dt = constrain((now - lastUs) * 1e-6f, 0.f, 0.05f);
  lastUs = now;

  PhoneInput in;
  in.dt = dt;
  in.msSinceCmd = anyCmd ? millis() - lastCmdMs : 1000000UL;
  in.armReq = cmd.arm; in.kill = cmd.kill;
  in.throttle = cmd.thr; in.limit = cmd.limit;
  in.wheelX = cmd.wx; in.wheelY = cmd.wy; in.yaw = cmd.yaw;
  in.trimRoll = cmd.trR; in.trimPitch = cmd.trP;
  out = flight.update(in);

  pwmUs(0, ESC_HZ, out.motorUs);
  writeVanes(out.vane);

  const bool linkOk = in.msSinceCmd < cfg.linkTimeoutMs;
  digitalWrite(PIN_LED, out.armed ? HIGH : (linkOk && (millis() / 500) % 2 ? HIGH : LOW));

  if (loops % (LOOP_HZ / 10) == 0) {                   // 10 Hz: battery and buzzer
    const float v = analogReadMilliVolts(PIN_VBAT) * 0.001f * VBAT_DIV * VBAT_CAL;
    vbat = vbat < 1.f ? v : vbat + 0.2f * (v - vbat);
    const bool lowBatt = vbat > 6.f && vbat < VBAT_WARN, failsafe = out.state == PhoneState::Failsafe;
    digitalWrite(PIN_BUZZER, ((lowBatt || failsafe) && (millis() / 400) % 2) ? HIGH : LOW);
  }
  if (++loops % (LOOP_HZ / 5) == 0)                    // 5 Hz log
    Serial.printf("state=%d link=%d thr=%.2f vbat=%.2f v=%.2f %.2f %.2f %.2f\n", (int)out.state, linkOk, out.throttle, vbat, out.vane[0], out.vane[1], out.vane[2], out.vane[3]);
}
