// Rocket flight-state machine (pure logic, host-testable).
//
//   SAFE --arm--> ARMED --launch detect--> BOOST --burnout--> COAST --apogee--> DESCENT --stationary--> LANDED
//                                            |                                       ^
//                                            +--tilt > limit--> ABORT ---------------+
//
// Ignition is NOT part of this state machine: the motor is lit by the ground ignition controller.
// The vehicle only detects that it has launched. Gimbal control is enabled only in BOOST.
#pragma once
#include <cmath>

namespace tvc {

enum class FlightState { Safe, Armed, Boost, Coast, Descent, Landed, Abort };

inline const char* stateName(FlightState s) {
  switch (s) {
    case FlightState::Safe: return "SAFE";
    case FlightState::Armed: return "ARMED";
    case FlightState::Boost: return "BOOST";
    case FlightState::Coast: return "COAST";
    case FlightState::Descent: return "DESCENT";
    case FlightState::Landed: return "LANDED";
    case FlightState::Abort: return "ABORT";
  }
  return "?";
}

struct FlightInputs {
  float axialG = 1.f;        // specific force along the nose axis, in g (1.0 at rest on the pad, nose up)
  float tiltDeg = 0.f;       // nose angle from vertical
  float vertSpeed = 0.f;     // m/s, up positive (baro/IMU fused)
  bool armSwitch = false;    // operator arm switch
  bool rbfInserted = true;   // remove-before-flight pin still in
  bool fault = false;        // any health fault (IMU lost, low battery...)
};

struct FlightConfig {
  float launchG = 2.0f, launchHold = 0.05f;
  float burnoutG = 0.5f, burnoutHold = 0.10f, minBoost = 0.25f, maxBoost = 8.0f;
  float apogeeVz = -1.0f, apogeeHold = 0.2f, minCoast = 0.5f;
  float landedHold = 2.0f, landedVz = 0.5f, landedGBand = 0.25f;
  float abortTiltDeg = 35.f;
  float armMaxTiltDeg = 10.f;     // refuse to arm if the rocket is not near vertical
};

class FlightStateMachine {
 public:
  explicit FlightStateMachine(FlightConfig c = {}) : c_(c) {}
  FlightState state() const { return s_; }
  float timeInState() const { return tIn_; }
  bool gimbalEnabled() const { return s_ == FlightState::Boost; }
  bool servosPowered() const { return s_ != FlightState::Safe && s_ != FlightState::Landed; }
  bool chuteRequested() const { return chute_; }

  void update(const FlightInputs& in, float dt) {
    tIn_ += dt;
    const bool flying = s_ == FlightState::Boost || s_ == FlightState::Coast || s_ == FlightState::Descent;
    if (flying && in.fault && s_ == FlightState::Boost) { go(FlightState::Abort); chute_ = true; return; }
    switch (s_) {
      case FlightState::Safe:
        if (in.armSwitch && !in.rbfInserted && !in.fault && in.tiltDeg < c_.armMaxTiltDeg) go(FlightState::Armed);
        break;
      case FlightState::Armed:
        if (!in.armSwitch || in.rbfInserted) { go(FlightState::Safe); break; }
        hold(in.axialG > c_.launchG, c_.launchHold, dt) ? go(FlightState::Boost) : void();
        break;
      case FlightState::Boost:
        if (in.tiltDeg > c_.abortTiltDeg) { go(FlightState::Abort); chute_ = true; break; }
        if ((tIn_ > c_.minBoost && hold(in.axialG < c_.burnoutG, c_.burnoutHold, dt)) || tIn_ > c_.maxBoost) go(FlightState::Coast);
        break;
      case FlightState::Coast:
        if (tIn_ > c_.minCoast && hold(in.vertSpeed < c_.apogeeVz, c_.apogeeHold, dt)) { go(FlightState::Descent); chute_ = true; }
        break;
      case FlightState::Abort:
      case FlightState::Descent:
        if (hold(std::fabs(in.vertSpeed) < c_.landedVz && std::fabs(in.axialG - 1.f) < c_.landedGBand, c_.landedHold, dt)) go(FlightState::Landed);
        break;
      case FlightState::Landed: break;
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
  bool chute_ = false;
};

}  // namespace tvc
