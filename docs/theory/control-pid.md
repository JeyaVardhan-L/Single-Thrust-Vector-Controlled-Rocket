# Control: PID for attitude

Interactive: [PID lab](../../web/pid.html). Code: [`src/sim/attitude.js`](../../src/sim/attitude.js), [`firmware/lib/tvc_core/pid.h`](../../firmware/lib/tvc_core/pid.h).

## Plant

For small angles about one axis: `θ'' = G δ`, where `δ` is the actuator output (gimbal angle in rad, or normalised vane command) and `G` has units rad/s² per unit. Add actuator lag `τ` (first-order), a rate limit, a position limit, and latency `T_d` (sensor to actuator).

## Controller

```
u = Kp e + Ki ∫e dt − Kd ω          e = θ_set − θ,  ω = measured gyro rate
```

- **P** gives the restoring torque, setting the natural frequency: `ωn = √(G Kp)`.
- **D on the gyro** gives damping: `ζ = G Kd / (2 ωn)`. Using the gyro rate directly avoids differentiating noisy angle estimates and avoids "derivative kick" on setpoint changes.
- **I** removes steady offsets (thrust misalignment, CG offset). Keep it small; clamp it (`iMax`).

Design from the plant gain:

```
Kp = ωn² / G        Kd = 2 ζ ωn / G        ζ ≈ 0.7,  Ki ≈ 0.1 to 0.15 · Kp
```

Pick `ωn` so that the closed loop is much slower than the actuator and latency. Rule: `ωn ≤ 1 / (3 (τ + T_d))`. Rocket: τ = 30 ms, T_d = 8 ms → `ωn ≤ 9 rad/s` strict; the preset uses 12 rad/s with measured margin (try the lab with higher lag to see it fail).

## What breaks it

| Cause | Symptom | Fix |
|---|---|---|
| Latency too large | Growing oscillation | Faster loop, shorter filter chain, lower `ωn` |
| Actuator rate limit | Triangle waves, delayed recovery | Slower gains, faster servo |
| Saturation | Flat tops in the command | Lower gains or more authority; integrator anti-windup |
| Gyro noise × Kd | Servo buzz, heat | Low-pass the gyro (≈ 80 Hz), lower Kd, better mounting |
| Backlash | Limit cycle around zero | Remove backlash (gimbal), add small deadband only as a last resort |
| Wrong sign | Immediate divergence | Bench sign checks (Gate 0 / Gate A) |

## Measuring `G` on the real vehicle

1. Apply a small step in `u` (open loop on a stand or tether) and log the angular acceleration `α = Δω/Δt`.
2. `G = α / Δu`.
3. Or close the loop with a known `Kp`, measure the oscillation frequency `f`: `G ≈ (2π f)² / Kp`.

Enter the measured `G` in the PID lab preset and the firmware comments.
