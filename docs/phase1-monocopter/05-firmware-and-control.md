# Phase 1 firmware and control

Code: [`firmware/monocopter/src/main.cpp`](../../firmware/monocopter/src/main.cpp) with the portable core in [`firmware/lib/tvc_core/`](../../firmware/lib/tvc_core/). Simulation twin: [`src/sim/`](../../src/sim/). Interactive: [PID lab](../../web/pid.html?model=monocopter).

> **Status:** the portable core is unit-tested on a PC (57 checks). The Teensy project has **not** been compiled for the target or run on hardware. Compile warnings and register-level details (IMU driver) need a first pass on your bench.

## 1. Build and upload

```bash
pip install platformio          # once
cd firmware/monocopter
pio run                         # build
pio run -t upload               # flash the Teensy 4.1
pio device monitor              # 115200 baud console
```

## 2. Loop structure (500 Hz)

```
read CRSF bytes ─► rcOk?        (link timeout 250 ms)
read IMU ─► remove gyro bias ─► Mahony AHRS ─► roll, pitch
arm logic: arm switch > 1700 µs, throttle < 5 %, |roll|,|pitch| < 20°, rcOk
setpoints: roll/pitch angle (±15° from sticks), yaw rate (±90°/s)
PID: roll, pitch (D on gyro);  yaw: P on rate error
authority gate: throttle > 12 % else vanes centred and integrators reset
mixer ─► 4 servo pulses;  ESC pulse = 1000 + throttle * 1000 µs
log 100 Hz to SD,  console 10 Hz
```

Failsafe: link lost > 250 ms or arm switch off → motor pulse 1000 µs, vanes centred, integrators reset, disarmed. (The tilt limit is checked at arming only; a flight-time tilt cut-off is a TODO, see §8.)

## 3. Axes, signs and the mixer

Aerospace **FRD** body axes: X forward (towards vane 1), Y right (vane 2), Z down.

| Angle | Positive when |
|---|---|
| Roll | right side goes **down** |
| Pitch | nose goes **up** |
| Yaw / yaw rate | **clockwise** seen from above |

Vane `k` is at: 1 front (+X), 2 right (+Y), 3 rear (−X), 4 left (−Y). A positive vane command `d_k` produces a side force along the **clockwise tangent** at that vane (`t1 = +Y, t2 = −X, t3 = −Y, t4 = +X`).

Vane forces act a height `h` below the CG. Torques (derivation in [`src/sim/mixer.js`](../../src/sim/mixer.js)):

```
τ_roll  = −h (F1 − F3)
τ_pitch =  h (F4 − F2)
τ_yaw   =  r (F1 + F2 + F3 + F4)
```

Solving with the common-mode term set to zero:

```
d1 = yaw − roll      d3 = yaw + roll
d4 = yaw + pitch     d2 = yaw − pitch
```

When any |d| exceeds 1, **all four are scaled together** so the ratio between axes is preserved. This is tested in both the JS and C++ test suites with the same cases.

**Physical rule for checking signs on the bench:** the vane forces must push the *bottom* of the vehicle toward the side that is leaning down. Equivalent: the **lower (trailing) edge of a vane moves away from the lean side**. A vehicle tilted right-wing-down must show the front and rear vanes with their lower edges moving to the left.

## 4. Estimator

`Mahony(kp = 2.0, ki = 0)` fuses gyro and accelerometer. It ignores the accelerometer when its magnitude is outside 0.5 to 1.5 g (during motor transients), so a strong vibration burst does not corrupt the attitude. There is no magnetometer: yaw drifts slowly and is only used as a rate.

Gyro bias is measured at boot over 2 s. **The vehicle must be still during boot.**

Known limits: a vehicle in sustained acceleration (hover is 1 g, fine) sees fewer corrections; in a sustained turn the estimate lags. That does not matter for hover-level tethered tests.

## 5. Control law and starting gains

| Axis | Law | Gains (per rad, outputs ±1) |
|---|---|---|
| Roll, Pitch | `u = Kp e + ∫Ki e − Kd gyro` | Kp 2.8, Ki 0.8, Kd 0.78, integrator clamp 0.3 |
| Yaw | `u = Kyaw (rate_sp − gyro_z) + trim` | Kyaw 0.25 per rad/s, trim 0 |

These come from the **PID lab monocopter preset** ([`src/sim/attitude.js`](../../src/sim/attitude.js)): plant gain `G = 9 rad/s²` per unit command (design estimate, [design §3](01-design.md)), loop `ωn ≈ 5 rad/s`, damping ratio ≈ 0.7, 10 ms latency, 25 ms actuator lag. The simulation predicts settling in ≈ 1.5 s with ≈ 12 % overshoot.

Because authority scales with thrust, gains that are stable at hover can be too high at full throttle (G ≈ 2.7×) and gains tuned at low throttle too soft. If you hover over a range of throttles, schedule gains by `1 / thr²` or keep to one hover throttle.

## 6. Tuning procedure (tethered, calm air)

1. Set Ki = 0, Kd = 0, Kp low (≈ 1.0). Hover on the tether.
2. Raise Kp until a small oscillation just appears, then reduce by 30 %.
3. Add Kd until the oscillation is damped (overshoot < 20 % on a hand tap). Too much Kd: motor-like buzz and warm servos.
4. Add Ki slowly to remove steady lean (CG error, thrust misalignment). The integrator clamp (0.3) bounds how much it can cover.
5. Tune yaw last: find `YAW_TRIM` so the vehicle does not rotate at hover with the stick centred.
6. Record each change and the resulting log in `docs/test-logs/`.

**What to look at in the log:** `roll`, `pitch` vs time; vane commands `v1..v4` (if flat-topped at ±1 → saturated: lower the gains or add authority); gyro noise (if > ±0.05 rad/s at rest with the motor on, mount better).

## 7. Logging format (`flight.csv`)

```
ms,armed,roll,pitch,gx,gy,gz,thr,v1,v2,v3,v4
```

Angles in rad, rates in rad/s, `thr` 0..1, `v*` −1..1. 100 Hz. File is flushed every 5 s.

## 8. Things still to do (TODOs)

- Battery-low detection (INA226 or ESC telemetry) with an audible alarm and landing request.
- DShot output instead of 400 Hz PWM.
- Telemetry over the ELRS back-channel (attitude, battery).
- Moving the loop to a hardware timer (`IntervalTimer`) for lower jitter.
- Gain scheduling on throttle.
- Magnetometer for heading hold (optional).

## 9. Host tests (run these after every change to the core)

```bash
npm test                 # JS: mixer, attitude simulation
npm run test:firmware    # C++: PID, Mahony, mixers, CRSF, flight-state machine
```
