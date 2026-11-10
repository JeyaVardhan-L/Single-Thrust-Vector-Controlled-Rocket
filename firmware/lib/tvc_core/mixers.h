// Actuator mapping: monocopter vane mixer and rocket gimbal <-> servo conversion.
// The monocopter mixer is identical to src/sim/mixer.js (and documented in docs/phase1-monocopter/05-...).
#pragma once
#include <algorithm>
#include <cmath>

namespace tvc {

// Vanes: 0 = front (+X), 1 = right (+Y), 2 = rear (-X), 3 = left (-Y).
// Inputs normalised [-1, 1]. Positive roll = right wing down, positive pitch = nose up, positive yaw = clockwise from above.
inline void mixMonocopter(float roll, float pitch, float yaw, float out[4]) {
  float d[4] = {yaw - roll, yaw - pitch, yaw + roll, yaw + pitch};
  float peak = 1.f;
  for (float v : d) peak = std::max(peak, std::fabs(v));
  for (int i = 0; i < 4; ++i) out[i] = d[i] / peak;   // scale together: preserves the mix ratio when saturating
}

struct ServoMap {
  float centerUs = 1500.f;       // pulse at the mechanical centre (calibrate per servo)
  float usPerDeg = 10.f;         // ~1000 us per 100 deg: measure it, datasheets are approximate
  float trimDeg = 0.f;           // mechanical trim
  float minUs = 900.f, maxUs = 2100.f;
  float toUs(float servoDeg) const {
    return std::clamp(centerUs + (servoDeg + trimDeg) * usPerDeg, minUs, maxUs);
  }
};

// Vane command [-1, 1] -> servo pulse. maxVaneDeg is the vane angle at full command (25 deg in the model).
inline float vaneToUs(float cmd, const ServoMap& m, float maxVaneDeg = 25.f, float servoPerVane = 1.f) {
  return m.toUs(std::clamp(cmd, -1.f, 1.f) * maxVaneDeg * servoPerVane);
}

struct GimbalMap {
  float gearRatio = 2.f;         // 36T sector / 18T pinion: servo moves 2x the gimbal angle
  float limitDeg = 6.5f;         // software limit; the mechanical stop is 7 deg
  float sign = 1.f;              // flip to -1 if a servo is mirrored
  ServoMap servo;
  float clampGimbalDeg(float gimbalDeg) const { return std::clamp(gimbalDeg, -limitDeg, limitDeg); }
  float toServoDeg(float gimbalDeg) const { return sign * clampGimbalDeg(gimbalDeg) * gearRatio; }
  float toUs(float gimbalDeg) const { return servo.toUs(toServoDeg(gimbalDeg)); }
};

}  // namespace tvc
