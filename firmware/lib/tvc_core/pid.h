// Header-only PID with derivative on the gyro rate (no derivative kick, no differentiation noise).
// Pure C++17, no Arduino dependencies, so it is unit-tested on the host (firmware/test).
#pragma once
#include <algorithm>
#include <cmath>

namespace tvc {

struct PidGains {
  float kp = 0.f;
  float ki = 0.f;
  float kd = 0.f;
  float outMax = 1.f;      // output saturation (symmetric)
  float iMax = 0.5f;       // integrator clamp, in output units
};

class Pid {
 public:
  explicit Pid(PidGains g = {}) : g_(g) {}
  void setGains(const PidGains& g) { g_ = g; }
  const PidGains& gains() const { return g_; }
  void reset() { integ_ = 0.f; lastOut_ = 0.f; }

  // err  : setpoint - measurement   [rad]
  // rate : measured angular rate     [rad/s]  (derivative acts on this, sign: opposes rate)
  // dt   : loop period               [s]
  // freezeI: pass true while the actuator is known to be saturated or the vehicle is not armed
  float update(float err, float rate, float dt, bool freezeI = false) {
    if (!freezeI) {
      integ_ += g_.ki * err * dt;
      integ_ = std::clamp(integ_, -g_.iMax, g_.iMax);
    }
    float out = g_.kp * err + integ_ - g_.kd * rate;
    float sat = std::clamp(out, -g_.outMax, g_.outMax);
    // Anti-windup (back-calculation lite): if saturated, bleed the integrator.
    if (sat != out && !freezeI) integ_ *= 0.98f;
    lastOut_ = sat;
    return sat;
  }
  float integrator() const { return integ_; }
  float lastOutput() const { return lastOut_; }

 private:
  PidGains g_;
  float integ_ = 0.f;
  float lastOut_ = 0.f;
};

// First-order low-pass, alpha derived from cutoff frequency.
class Lpf {
 public:
  Lpf(float cutoffHz = 50.f, float sampleHz = 500.f) { setup(cutoffHz, sampleHz); }
  void setup(float cutoffHz, float sampleHz) {
    const float rc = 1.f / (2.f * 3.14159265f * cutoffHz);
    const float dt = 1.f / sampleHz;
    a_ = dt / (rc + dt);
  }
  float update(float x) { y_ += a_ * (x - y_); return y_; }
  void reset(float v = 0.f) { y_ = v; }
  float value() const { return y_; }
 private:
  float a_ = 0.5f;
  float y_ = 0.f;
};

}  // namespace tvc
