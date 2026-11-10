// Host-side unit tests for the portable firmware core. No framework needed.
// Build + run:  npm run test:firmware      (needs g++ or clang++)
#include <cmath>
#include <cstdio>
#include <cstdlib>

#include "ahrs.h"
#include "crsf.h"
#include "flight_state.h"
#include "mixers.h"
#include "pid.h"

static int g_fail = 0, g_run = 0;
#define CHECK(cond, msg)                                                  \
  do {                                                                    \
    ++g_run;                                                              \
    if (!(cond)) { ++g_fail; std::printf("  FAIL: %s  (%s:%d)\n", msg, __FILE__, __LINE__); } \
  } while (0)
#define NEAR(a, b, tol, msg) CHECK(std::fabs((a) - (b)) <= (tol), msg)

static const float DEG = 3.14159265f / 180.f;

static void test_pid_stabilises_double_integrator() {
  std::printf("pid: stabilises a double-integrator rocket model\n");
  // Same numbers as the JS PID lab rocket preset (G = 168 rad/s^2 per rad, kp 0.8, ki 0.1, kd 0.1).
  tvc::Pid pid({0.8f, 0.1f, 0.1f, 7.f * DEG, 0.05f});
  float theta = 5.f * DEG, omega = 0.f, delta = 0.f;
  const float dt = 0.002f;
  for (int i = 0; i < 2500; ++i) {              // 5 s
    float u = pid.update(0.f - theta, omega, dt);
    delta += (u - delta) / 0.03f * dt;          // first-order actuator lag
    omega += 168.f * delta * dt;
    theta += omega * dt;
  }
  NEAR(theta, 0.f, 0.5f * DEG, "attitude error settles below 0.5 deg");
  CHECK(std::fabs(omega) < 0.05f, "rate settles");
}

static void test_pid_saturation_and_antiwindup() {
  std::printf("pid: output saturates and the integrator is clamped\n");
  tvc::Pid pid({1.f, 10.f, 0.f, 0.2f, 0.1f});
  for (int i = 0; i < 1000; ++i) pid.update(1.f, 0.f, 0.01f);
  NEAR(pid.lastOutput(), 0.2f, 1e-6f, "output limited to outMax");
  CHECK(pid.integrator() <= 0.1f + 1e-6f, "integrator clamped to iMax");
}

static void test_mahony_static_tilts() {
  std::printf("ahrs: converges to static roll and pitch\n");
  {
    tvc::Mahony f(2.f);
    const float phi = 10.f * DEG;               // right wing down
    for (int i = 0; i < 2000; ++i) f.update(0, 0, 0, 0.f, -std::sin(phi), -std::cos(phi), 0.002f);
    NEAR(f.roll(), phi, 0.5f * DEG, "roll +10 deg");
    NEAR(f.pitch(), 0.f, 0.5f * DEG, "pitch 0");
  }
  {
    tvc::Mahony f(2.f);
    const float th = 15.f * DEG;                // nose up
    for (int i = 0; i < 2000; ++i) f.update(0, 0, 0, std::sin(th), 0.f, -std::cos(th), 0.002f);
    NEAR(f.pitch(), th, 0.5f * DEG, "pitch +15 deg");
  }
}

static void test_mahony_gyro_integration() {
  std::printf("ahrs: integrates gyro at 90 deg/s about X for 1 s\n");
  tvc::Mahony f(0.f);
  for (int i = 0; i < 1000; ++i) f.update(90.f * DEG, 0, 0, 0, 0, 0, 0.001f);   // zero accel => correction skipped
  NEAR(f.roll(), 90.f * DEG, 0.5f * DEG, "roll 90 deg");
}

static void test_nose_tilt() {
  std::printf("ahrs: nose tilt for a vertical rocket (body X up)\n");
  tvc::Mahony f(2.f);
  const float pitch = 60.f * DEG;               // nose 30 deg off vertical
  for (int i = 0; i < 4000; ++i) f.update(0, 0, 0, std::sin(pitch), 0.f, -std::cos(pitch), 0.002f);
  NEAR(f.noseTilt(), 30.f * DEG, 0.7f * DEG, "tilt 30 deg");
  tvc::Mahony g(2.f);
  for (int i = 0; i < 4000; ++i) g.update(0, 0, 0, 1.f, 0.f, 0.f, 0.002f);     // nose straight up
  NEAR(g.noseTilt(), 0.f, 0.7f * DEG, "tilt 0 when vertical");
}

static void test_mixers() {
  std::printf("mixers: vane mix and gimbal map\n");
  float o[4];
  tvc::mixMonocopter(0.5f, 0.f, 0.f, o);
  NEAR(o[0], -0.5f, 1e-6f, "roll: vane 1"); NEAR(o[2], 0.5f, 1e-6f, "roll: vane 3"); NEAR(o[1], 0.f, 1e-6f, "roll: vane 2");
  tvc::mixMonocopter(0.f, 0.f, 0.3f, o);
  for (int i = 0; i < 4; ++i) NEAR(o[i], 0.3f, 1e-6f, "yaw: all vanes equal");
  tvc::mixMonocopter(1.f, 1.f, 1.f, o);
  for (int i = 0; i < 4; ++i) CHECK(std::fabs(o[i]) <= 1.f + 1e-6f, "saturated mix within +-1");
  tvc::GimbalMap g;
  NEAR(g.toServoDeg(5.f), 10.f, 1e-6f, "5 deg gimbal -> 10 deg servo (2:1)");
  NEAR(g.toUs(5.f), 1600.f, 1e-3f, "5 deg gimbal -> 1600 us");
  NEAR(g.toServoDeg(20.f), 13.f, 1e-6f, "software limit 6.5 deg -> 13 deg servo");
}

static void test_flight_sequence() {
  std::printf("flight state: nominal sequence\n");
  using namespace tvc;
  FlightStateMachine fsm;
  FlightInputs in;
  const float dt = 0.01f;
  auto run = [&](float secs) { for (float t = 0; t < secs; t += dt) fsm.update(in, dt); };

  in.armSwitch = true; in.rbfInserted = true; run(0.5f);
  CHECK(fsm.state() == FlightState::Safe, "stays SAFE while RBF pin is in");
  in.rbfInserted = false; run(0.1f);
  CHECK(fsm.state() == FlightState::Armed, "ARMED when switch on and RBF removed");
  in.axialG = 3.f; run(0.2f);
  CHECK(fsm.state() == FlightState::Boost, "launch detected");
  CHECK(fsm.gimbalEnabled(), "gimbal enabled in BOOST");
  in.axialG = 0.1f; in.vertSpeed = 30.f; run(0.6f);
  CHECK(fsm.state() == FlightState::Coast, "burnout detected");
  CHECK(!fsm.gimbalEnabled(), "gimbal locked in COAST");
  in.vertSpeed = -3.f; run(1.0f);
  CHECK(fsm.state() == FlightState::Descent, "apogee detected");
  CHECK(fsm.chuteRequested(), "chute requested at apogee");
  in.vertSpeed = 0.f; in.axialG = 1.f; run(2.5f);
  CHECK(fsm.state() == FlightState::Landed, "landed detected");
}

static void test_flight_abort_and_arming_rules() {
  std::printf("flight state: abort and arming rules\n");
  using namespace tvc;
  FlightStateMachine fsm;
  FlightInputs in; in.armSwitch = true; in.rbfInserted = false; in.tiltDeg = 20.f;
  for (int i = 0; i < 50; ++i) fsm.update(in, 0.01f);
  CHECK(fsm.state() == FlightState::Safe, "refuses to arm when tilted 20 deg");
  in.tiltDeg = 2.f; for (int i = 0; i < 50; ++i) fsm.update(in, 0.01f);
  CHECK(fsm.state() == FlightState::Armed, "arms when vertical");
  in.axialG = 3.f; for (int i = 0; i < 20; ++i) fsm.update(in, 0.01f);
  CHECK(fsm.state() == FlightState::Boost, "boost");
  in.tiltDeg = 40.f; fsm.update(in, 0.01f);
  CHECK(fsm.state() == FlightState::Abort, "tilt > 35 deg in boost aborts");
  CHECK(!fsm.gimbalEnabled() && fsm.chuteRequested(), "abort: gimbal off, chute requested");
}

static void test_crsf() {
  std::printf("crsf: decodes a packed RC frame and rejects a corrupt one\n");
  using namespace tvc;
  uint16_t ch[16]; for (int i = 0; i < 16; ++i) ch[i] = (uint16_t)(172 + i * 100);
  uint8_t frame[26] = {0xC8, 24, 0x16};
  uint32_t acc = 0; int bits = 0, pos = 3;
  for (int i = 0; i < 16; ++i) {
    acc |= (uint32_t)ch[i] << bits; bits += 11;
    while (bits >= 8) { frame[pos++] = acc & 0xFF; acc >>= 8; bits -= 8; }
  }
  frame[25] = crsfCrc8(&frame[2], 23);
  CrsfParser p; bool got = false;
  for (int i = 0; i < 26; ++i) got = p.feed(frame[i]) || got;
  CHECK(got, "frame decoded");
  for (int i = 0; i < 16; ++i) CHECK(p.ticks[i] == ch[i], "channel value round-trips");
  NEAR(CrsfParser::ticksToUs(992), 1500.f, 0.5f, "992 ticks = 1500 us");
  frame[10] ^= 0x55; CrsfParser q; got = false;
  for (int i = 0; i < 26; ++i) got = q.feed(frame[i]) || got;
  CHECK(!got && q.crcErrors == 1, "corrupt frame rejected");
}

int main() {
  test_crsf();
  test_pid_stabilises_double_integrator();
  test_pid_saturation_and_antiwindup();
  test_mahony_static_tilts();
  test_mahony_gyro_integration();
  test_nose_tilt();
  test_mixers();
  test_flight_sequence();
  test_flight_abort_and_arming_rules();
  std::printf("\n%d checks, %d failed\n", g_run, g_fail);
  return g_fail ? 1 : 0;
}
