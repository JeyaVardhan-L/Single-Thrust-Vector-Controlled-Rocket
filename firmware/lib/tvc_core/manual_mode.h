// MC-1 manual flight logic (no IMU): sticks -> vane mixer, throttle -> ESC, with arming rules and link-loss failsafe.
// Portable C++17, no Arduino calls, so it is covered by the host tests (firmware/test/host_tests.cpp).
//
// The pilot (or the tether) closes the attitude loop. The vanes act directly on the sticks, scaled by a simple schedule because the vane
// force grows with the prop wash: at low throttle the vanes are weak, at high throttle they are strong.
#pragma once
#include <algorithm>
#include <cmath>
#include "mixers.h"

namespace tvc {

struct ManualConfig {
  float expo = 0.35f;            // 0 = linear, 1 = cubic stick curve
  float rollScale = 0.6f;        // fraction of the full vane travel at full stick
  float pitchScale = 0.6f;
  float yawScale = 0.5f;
  float yawTrim = 0.0f;          // static vane command that cancels the residual prop torque (found on the tether)
  float hoverThrottle = 0.45f;   // throttle at which the vane scale is 1.0
  float minAuthThrottle = 0.12f; // below this the prop wash is too weak: vanes centred
  float armMaxThrottle = 0.05f;  // arming needs the throttle stick below this
  float armSwitchUs = 1700.f;    // arm switch is "on" above this pulse width
  float schedMin = 0.6f, schedMax = 1.6f;
};

struct ManualInput {
  float roll = 0, pitch = 0, yaw = 0;   // -1..1
  float throttle = 0;                    // 0..1
  float armSwitchUs = 1000.f;
  bool linkOk = false;                   // false after the receiver timeout
};

struct ManualOutput {
  bool armed = false;
  float motorUs = 1000.f;                // ESC pulse
  float vane[4] = {0, 0, 0, 0};          // -1..1 (1.0 = full vane deflection), order front, right, rear, left
};

class ManualMode {
 public:
  explicit ManualMode(const ManualConfig& c = ManualConfig()) : c_(c) {}

  static float expoCurve(float x, float expo) {
    x = std::clamp(x, -1.f, 1.f);
    return (1.f - expo) * x + expo * x * x * x;
  }

  ManualOutput update(const ManualInput& in) {
    const bool sw = in.armSwitchUs > c_.armSwitchUs;
    if (!sw) seenSwitchOff_ = true;                       // the switch must be seen off once before it can arm
    if (!in.linkOk || !sw) armed_ = false;
    else if (!armed_ && seenSwitchOff_ && in.throttle < c_.armMaxThrottle) armed_ = true;

    ManualOutput o;
    o.armed = armed_;
    if (!armed_) return o;                                // motor 1000 us, vanes centred

    const float thr = std::clamp(in.throttle, 0.f, 1.f);
    o.motorUs = 1000.f + thr * 1000.f;
    if (thr > c_.minAuthThrottle) {
      const float sched = std::clamp(c_.hoverThrottle / thr, c_.schedMin, c_.schedMax);
      const float roll = expoCurve(in.roll, c_.expo) * c_.rollScale * sched;
      const float pitch = expoCurve(in.pitch, c_.expo) * c_.pitchScale * sched;
      const float yaw = expoCurve(in.yaw, c_.expo) * c_.yawScale * sched + c_.yawTrim;
      mixMonocopter(roll, pitch, std::clamp(yaw, -1.f, 1.f), o.vane);
    }
    return o;
  }

  bool armed() const { return armed_; }

 private:
  ManualConfig c_;
  bool armed_ = false;
  bool seenSwitchOff_ = false;
};

}  // namespace tvc
