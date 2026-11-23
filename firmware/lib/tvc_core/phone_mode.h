// MC-1 phone flight logic (no IMU): direction wheel + throttle from a web page on a phone -> vane mixer + ESC, with arming rules,
// smooth throttle ramps and link-loss failsafe. Portable C++17, no Arduino calls, so it is covered by the host tests
// (firmware/test/host_tests.cpp) and mirrored by the demo in firmware/monocopter/web/control.html.
//
// Conventions (the same as src/sim/mixer.js):
//   wheel x: +1 = push right  (the vehicle tilts right and moves right)
//   wheel y: +1 = push forward (the vehicle tilts nose down and moves forward)
//   yaw    : +1 = clockwise seen from above
// The vanes sit below the CG, so a push toward a direction commands a torque that tilts the thrust line toward it:
//   wheel forward  -> pitch torque nose down  (p = -y) -> vanes 2 and 4 move (right and left vanes)
//   wheel right    -> roll torque right wing down (r = +x) -> vanes 1 and 3 move (front and rear vanes)
// Vane order in the outputs: 0 front, 1 right, 2 rear, 3 left.
#pragma once
#include <algorithm>
#include <cmath>
#include <cstdint>
#include "mixers.h"

namespace tvc {

struct PhoneConfig {
  float expo = 0.25f;             // 0 = linear, 1 = cubic wheel curve (applied to the wheel radius)
  float rollScale = 0.6f;         // fraction of the full vane travel at full wheel
  float pitchScale = 0.6f;
  float yawScale = 0.5f;
  float yawTrim = 0.0f;           // static vane command that cancels the residual prop torque (found on the tether)
  float hoverThrottle = 0.45f;    // throttle at which the vane scale is 1.0
  float minAuthThrottle = 0.12f;  // below this the prop wash is too weak: vanes centred when armed
  float schedMin = 0.6f, schedMax = 1.6f;
  float armMaxThrottle = 0.03f;   // arming needs the throttle (target and actual) below this
  float maxThrottle = 1.0f;       // hard cap in firmware; the app also sends its own limit (it starts at 50 %)
  float upRate = 0.30f;           // throttle slew limit, fraction of full throttle per second (a full climb takes about 3 s)
  float downRate = 0.60f;
  float failsafeRate = 0.50f;     // ramp-down rate once the link is lost
  uint32_t linkTimeoutMs = 400;   // no command for this long: failsafe ramp-down, vanes centred
  uint32_t disarmTimeoutMs = 2500;// no command for this long: disarmed
  float deadzone = 0.04f;         // wheel radius below this is ignored
};

enum class PhoneState : uint8_t { Disarmed = 0, Armed = 1, Failsafe = 2, Killed = 3 };

struct PhoneInput {
  float dt = 0.004f;              // seconds since the previous update
  uint32_t msSinceCmd = 1000000;  // time since the last valid command from the phone
  bool armReq = false;            // the phone's arm switch (a toggle: on = wants to fly)
  bool kill = false;              // kill button: motor off at once, stays off until the arm switch is turned off
  float throttle = 0.f;           // target 0..1 (the app's slider)
  float limit = 1.f;              // the app's throttle limit 0..1
  float wheelX = 0.f, wheelY = 0.f;   // direction wheel, unit disc
  float yaw = 0.f;                // -1..1
  float trimRoll = 0.f, trimPitch = 0.f;   // vane trims, fraction of full travel (small)
};

struct PhoneOutput {
  PhoneState state = PhoneState::Disarmed;
  bool armed = false;
  float throttle = 0.f;           // actual (ramped) throttle 0..1
  float motorUs = 1000.f;         // ESC pulse
  float vane[4] = {0, 0, 0, 0};   // -1..1 (1.0 = full vane deflection), order front, right, rear, left
};

class PhoneMode {
 public:
  explicit PhoneMode(const PhoneConfig& c = PhoneConfig()) : c_(c) {}

  static float expoCurve(float x, float expo) {
    x = std::clamp(x, -1.f, 1.f);
    return (1.f - expo) * x + expo * x * x * x;
  }

  /** Wheel position (x right, y forward) -> vane commands, at vane scale `sched`. Exposed for the tests and the docs. */
  void mixWheel(float x, float y, float yaw, float sched, float trimRoll, float trimPitch, float out[4]) const {
    float mag = std::sqrt(x * x + y * y);
    if (mag > 1.f) { x /= mag; y /= mag; mag = 1.f; }
    if (mag < c_.deadzone) { x = 0.f; y = 0.f; }
    else {
      const float k = expoCurve(mag, c_.expo) / mag;          // curve on the radius keeps the direction exact
      x *= k; y *= k;
    }
    const float roll = x * c_.rollScale * sched + trimRoll;
    const float pitch = -y * c_.pitchScale * sched + trimPitch;   // forward = nose down = negative pitch torque
    const float yw = std::clamp(yaw, -1.f, 1.f) * c_.yawScale * sched + c_.yawTrim;
    mixMonocopter(roll, pitch, std::clamp(yw, -1.f, 1.f), out);
  }

  PhoneOutput update(const PhoneInput& in) {
    const bool linkOk = in.msSinceCmd < c_.linkTimeoutMs;
    const bool dead = in.msSinceCmd >= c_.disarmTimeoutMs;
    const float cap = std::clamp(std::min(in.limit, c_.maxThrottle), 0.f, 1.f);
    float target = std::clamp(in.throttle, 0.f, cap);

    // ---- arming: a rising edge of the app's arm switch, with the throttle low, after the switch has been seen off ----
    if (!in.armReq) { armed_ = false; seenOff_ = true; killed_ = false; }
    if (in.kill) { armed_ = false; killed_ = true; }
    if (dead) armed_ = false;
    if (!armed_ && in.armReq && seenOff_ && !killed_ && linkOk && target < c_.armMaxThrottle && thr_ < c_.armMaxThrottle) {
      armed_ = true;
      seenOff_ = false;                                       // a later re-arm needs the switch cycled off and on again
    }

    PhoneOutput o;
    if (!armed_) {
      thr_ = 0.f;
      o.state = killed_ ? PhoneState::Killed : PhoneState::Disarmed;
      // Bench preview: with the motor off the vanes follow the wheel (props off, hands clear) so the servo directions can be checked.
      if (linkOk) mixWheel(in.wheelX, in.wheelY, in.yaw, 1.f, in.trimRoll, in.trimPitch, o.vane);
      return o;
    }

    // ---- armed: ramp the throttle, drive the vanes ----
    float rateUp = c_.upRate, rateDown = c_.downRate;
    if (!linkOk) { target = 0.f; rateDown = c_.failsafeRate; }
    const float step = in.dt;
    if (thr_ < target) thr_ = std::min(target, thr_ + rateUp * step);
    else thr_ = std::max(target, thr_ - rateDown * step);
    thr_ = std::clamp(thr_, 0.f, 1.f);                         // a lowered limit is reached by the ramp, not by a jump

    o.armed = true;
    o.state = linkOk ? PhoneState::Armed : PhoneState::Failsafe;
    o.throttle = thr_;
    o.motorUs = 1000.f + thr_ * 1000.f;
    if (linkOk && thr_ > c_.minAuthThrottle) {
      const float sched = std::clamp(c_.hoverThrottle / thr_, c_.schedMin, c_.schedMax);
      mixWheel(in.wheelX, in.wheelY, in.yaw, sched, in.trimRoll, in.trimPitch, o.vane);
    }
    return o;
  }

  bool armed() const { return armed_; }
  float throttle() const { return thr_; }
  const PhoneConfig& config() const { return c_; }

 private:
  PhoneConfig c_;
  bool armed_ = false;
  bool seenOff_ = false;     // the arm switch must be seen off once (after power-up or a disarm) before it can arm
  bool killed_ = false;
  float thr_ = 0.f;
};

}  // namespace tvc
