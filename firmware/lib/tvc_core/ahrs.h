// Mahony complementary AHRS (gyro + accelerometer, no magnetometer).
// Frame convention (aerospace FRD): X forward, Y right, Z down.
// At rest and level the accelerometer (specific force) reads (0, 0, -1 g).
// Yaw is relative (it drifts) because there is no magnetometer: only use roll/pitch for stabilisation.
#pragma once
#include <cmath>

namespace tvc {

struct Quat { float w = 1.f, x = 0.f, y = 0.f, z = 0.f; };

class Mahony {
 public:
  explicit Mahony(float kp = 2.0f, float ki = 0.0f) : kp_(kp), ki_(ki) {}

  // gx,gy,gz in rad/s; ax,ay,az in any consistent unit (normalised internally); dt in s.
  void update(float gx, float gy, float gz, float ax, float ay, float az, float dt) {
    const float n = std::sqrt(ax * ax + ay * ay + az * az);
    // Skip the correction during high-g events (motor burn, impact): accelerometer is no longer a gravity reference.
    const bool accelValid = n > 0.5f * g_ref_ && n < 1.5f * g_ref_;
    if (accelValid) {
      ax /= n; ay /= n; az /= n;
      // expected specific force direction in the body frame for the current estimate
      const float vx = -2.f * (q.x * q.z - q.w * q.y);
      const float vy = -2.f * (q.y * q.z + q.w * q.x);
      const float vz = -(q.w * q.w - q.x * q.x - q.y * q.y + q.z * q.z);
      const float ex = ay * vz - az * vy;
      const float ey = az * vx - ax * vz;
      const float ez = ax * vy - ay * vx;
      if (ki_ > 0.f) { ix_ += ki_ * ex * dt; iy_ += ki_ * ey * dt; iz_ += ki_ * ez * dt; gx += ix_; gy += iy_; gz += iz_; }
      gx += kp_ * ex; gy += kp_ * ey; gz += kp_ * ez;
    }
    // integrate quaternion rate: q_dot = 0.5 * q (x) (0, g)
    const float hx = 0.5f * dt * gx, hy = 0.5f * dt * gy, hz = 0.5f * dt * gz;
    const Quat p = q;
    q.w += -p.x * hx - p.y * hy - p.z * hz;
    q.x +=  p.w * hx + p.y * hz - p.z * hy;
    q.y +=  p.w * hy - p.x * hz + p.z * hx;
    q.z +=  p.w * hz + p.x * hy - p.y * hx;
    const float m = std::sqrt(q.w * q.w + q.x * q.x + q.y * q.y + q.z * q.z);
    q.w /= m; q.x /= m; q.y /= m; q.z /= m;
  }

  float roll()  const { return std::atan2(2.f * (q.w * q.x + q.y * q.z), 1.f - 2.f * (q.x * q.x + q.y * q.y)); }
  float pitch() const { float s = 2.f * (q.w * q.y - q.z * q.x); s = s > 1.f ? 1.f : (s < -1.f ? -1.f : s); return std::asin(s); }
  float yaw()   const { return std::atan2(2.f * (q.w * q.z + q.x * q.y), 1.f - 2.f * (q.y * q.y + q.z * q.z)); }

  // Angle between the body X axis (nose) and world "up", radians. Used by the rocket for tilt-abort.
  // Body X in world frame has z-component 2(xz - wy)... world up is -Z in NED, so tilt = acos(-R31).
  float noseTilt() const {
    const float r31 = 2.f * (q.x * q.z - q.w * q.y);   // third row, first column of body->world rotation
    float c = -r31; c = c > 1.f ? 1.f : (c < -1.f ? -1.f : c);
    return std::acos(c);
  }

  void setReferenceG(float g) { g_ref_ = g; }   // 1.0 if the input is in g, 9.80665 if in m/s^2
  Quat q;

 private:
  float kp_, ki_;
  float ix_ = 0.f, iy_ = 0.f, iz_ = 0.f;
  float g_ref_ = 1.f;
};

}  // namespace tvc
