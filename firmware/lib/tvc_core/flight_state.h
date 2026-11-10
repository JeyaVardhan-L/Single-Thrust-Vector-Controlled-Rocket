// Rocket flight-state machine (pure logic, host-testable) for the electric TVC vehicle.
//
//   SAFE --arm--> ARMED --throttle up--> FLIGHT --throttle low (touch-down)--> ARMED
//                   \________________________ tilt / fault / link loss / disarm ___/
//                                              |
//                                              v
//                                            ABORT --arm switch off--> SAFE
//
// Motors run only in FLIGHT; the gimbal is closed-loop only in FLIGHT. ABORT cuts the motors and centres the gimbal.
#pragma once
#include <cmath>

namespace tvc {

enum class FlightState { Safe, Armed, Flight, Abort };

inline const char* stateName(FlightState s) {
  switch (s) {
    case FlightState::Safe: return "SAFE";
    case FlightState::Armed: return "ARMED";
    case FlightState::Flight: return "FLIGHT";
    case FlightState::Abort: return "ABORT";
  }
  return "?";
}

struct FlightInputs {
  float throttle = 0.f;      // pilot throttle 0..1
  float tiltDeg = 0.f;       // nose angle from vertical
  bool armSwitch = false;    // operator arm switch (also the kill switch)
  bool rbfInserted = true;   // remove-before-flight pin or loop still in
  bool rcOk = true;          // control link alive
  bool fault = false;        // health fault (IMU lost, low battery, ...)
};

struct FlightConfig {
  float armMaxThrottle = 0.05f;   // refuse to arm with throttle above this
  float armMaxTiltDeg = 10.f;     // refuse to arm if the rocket is not near vertical
  float spoolThrottle = 0.12f, spoolHold = 0.10f;      // ARMED -> FLIGHT
  float idleThrottle = 0.05f, idleHold = 1.0f;         // FLIGHT -> ARMED (landed, throttle at idle)
  float abortTiltDeg = 35.f;
};

class FlightStateMachine {
 public:
  explicit FlightStateMachine(FlightConfig c = {}) : c_(c) {}
  FlightState state() const { return s_; }
  float timeInState() const { return tIn_; }
  bool gimbalEnabled() const { return s_ == FlightState::Flight; }
  bool motorsEnabled() const { return s_ == FlightState::Flight; }
  bool servosPowered() const { return s_ != FlightState::Safe; }

  void update(const FlightInputs& in, float dt) {
    tIn_ += dt;
    switch (s_) {
      case FlightState::Safe:
        if (in.armSwitch && !in.rbfInserted && in.rcOk && !in.fault &&
            in.throttle < c_.armMaxThrottle && in.tiltDeg < c_.armMaxTiltDeg) go(FlightState::Armed);
        break;
      case FlightState::Armed:
        if (!in.armSwitch || in.rbfInserted) { go(FlightState::Safe); break; }
        if (!in.rcOk || in.fault) { go(FlightState::Abort); break; }
        if (hold(in.throttle > c_.spoolThrottle, c_.spoolHold, dt)) go(FlightState::Flight);
        break;
      case FlightState::Flight:
        if (!in.armSwitch || !in.rcOk || in.fault || in.tiltDeg > c_.abortTiltDeg) { go(FlightState::Abort); break; }
        if (hold(in.throttle < c_.idleThrottle, c_.idleHold, dt)) go(FlightState::Armed);
        break;
      case FlightState::Abort:
        if (!in.armSwitch) go(FlightState::Safe);
        break;
    }
  }

 private:
  bool hold(bool cond, float secs, float dt) {
    held_ = cond ? held_ + dt : 0.f;
    return held_ >= secs;
  }
  void go(FlightState n) { s_ = n; tIn_ = 0.f; held_ = 0.f; }
  FlightConfig c_;
  FlightState s_ = FlightState::Safe;
  float tIn_ = 0.f, held_ = 0.f;
};

}  // namespace tvc
