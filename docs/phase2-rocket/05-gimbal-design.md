# Gimbal design, calibration and Gate A

Interactive: [Gimbal lab](../../web/gimbal.html) and the live gimbal in [rocket.html](../../web/rocket.html).

![Gimbal](../../assets/screenshots/rocket-gimbal.png)

## 1. Kinematics

Two nested axes. The outer ring pivots about X on bearings in the fixed mount (rod-mounted). The inner collar pivots about Z on bearings in the outer ring and clamps the motor tube. Both axes pass through the **pivot point** at 150 mm height.

For small angles the thrust vector tilts by the two angles independently. For the largest angles (±7°) the coupling error is `≈ θx θz / 2 ≈ 0.003 rad (0.17°)`: negligible.

Thrust `T` tilted by `δ` gives a side force `T sin δ` at the pivot. Restoring torque about the CG: `M = T sin δ · L`, `L ≈ 0.11 m`. Angular acceleration `α = M / I`, `I ≈ 0.018 kg·m²`.

## 2. Gear stage

| Item | Value |
|---|---|
| Sector | 36 teeth, module 1 (pitch Ø36 mm), 4 mm face width, arc ±26° |
| Pinion | 18 teeth, module 1 (pitch Ø18 mm) |
| Centre distance | (36 + 18)/2 = 27.0 mm |
| Ratio | 2:1: servo angle = 2 × gimbal angle |
| Travel | gimbal ±7° → servo ±14° |
| Resolution | servo ≈ 10 µs/° → 1 µs = 0.1° servo = **0.05° gimbal** |
| Speed | servo 0.08 s/60° ≈ 750°/s → gimbal 375°/s (6.5 rad/s) |

Why a reduction? It halves servo quantisation and slop at the thrust vector, doubles torque at the gimbal, and keeps the servo in the middle of its travel. Cost: half the angular speed, which is still ≈ 10× faster than the control loop needs (see the [PID lab](../../web/pid.html): 6 rad/s rate limit, peak demanded 2 to 3 rad/s).

**Torque check (F class, 25 N, offset 15 mm):** holding torque ≈ `T · d · sin δ + friction` = 25 × 0.015 × 0.12 + 0.02 = 0.065 N·m at the gimbal → 0.033 N·m (0.33 kg·cm) at the servo. A 4.5 kg·cm servo has > 10× margin. Pivot placement matters: with the pivot 60 mm from the thrust centre, the same case needs 0.18 N·m: the [gimbal lab](../../web/gimbal.html) shows this.

## 3. Mechanical requirements

| ID | Requirement | Check |
|---|---|---|
| RK-03 | ±7° mechanical, ±6.5° software, both axes | Sweep by hand to the stops |
| RK-04 | Backlash < 0.3° at the motor tube | Dial indicator 100 mm from the pivot: < 0.5 mm |
| RK-05 | 3° step ≤ 60 ms to 90 %, unloaded | IMU/phone slow-motion video |
| – | Friction: tube swings under its own imbalance | Qualitative; no stick-slip |
| – | Clearance ≥ 5 mm at full deflection in both axes (and combined) | Dummy motor |

## 4. Calibration procedure (Gate A)

Do this with the dummy motor in place, vehicle on the bench, **pack B connected through the fuse**, RBF out.

1. **Centre.** Command the gimbal to 0° and use a square (or phone angle app on the tube) to set the tube vertical. Adjust `ServoMap.centerUs` / `trimDeg` per axis until it is. Note the values.
2. **Direction.** Command +3° on axis 1. Record which way the tube moves (and the same for axis 2). Compare with the torque convention in [06](06-firmware-and-gnc.md); set `GimbalMap.sign` accordingly.
3. **Gain.** Command −6, −3, 0, +3, +6° and measure with the angle app. Fit `measured = a · commanded + b`. Expect `a ≈ 1.0 ± 0.05`. If not, adjust `usPerDeg` for that servo.
4. **Backlash.** Command 0°, then +1°, 0°, −1°, 0°, … and measure the dead-band at the tube. Must be < 0.3°.
5. **Step response.** 3° step, 10 repeats, slow-motion video or IMU log. 90 % time ≤ 60 ms (RK-05). Record it: the number goes into `act.tau` of the PID lab.
6. **Sweep.** Circle sweep at ±5° for 60 s. Servo temperatures < 50 °C, no skipped gear teeth, no dropout of the logged angles.
7. **Brown-out.** Hold one axis by hand at a stall for 2 s; the Teensy must not reset.
8. **Failsafe.** Remove arm switch: gimbal returns to centre and servos are no longer driven (SAFE).
9. **Mass and balance** (see [03-build-guide](03-build-guide.md) step 7).

## 5. Gate A pass criteria

All of the following, recorded in a test log:

- ☐ Centre within 0.3°; gain 1.0 ± 0.05 on both axes
- ☐ Signs verified and `GimbalMap.sign` committed
- ☐ Backlash < 0.3°; step 90 % time ≤ 60 ms
- ☐ 60 s sweep without skipping or overheating
- ☐ No brown-out at stall
- ☐ RBF / arm interlocks verified (SYS-01, RK-06, RK-07)
- ☐ CG within ±10 mm of 256 mm (±3 mm laterally)
- ☐ Measured actuator lag/rate entered in the PID lab and gains re-tuned in simulation for the chosen motor

## 6. Tuning gains for a motor

`G = T L / I`. Pick a natural frequency `ωn` (10 to 12 rad/s is a good start) and damping ratio 0.7:

```
Kp = ωn² / G        Kd = 2 ζ ωn / G        Ki ≈ 0.1 to 0.15 · Kp
```

| Motor (avg T) | G | Kp | Kd |
|---|---|---|---|
| F class, 25 to 30 N | 153 to 183 | 0.94 to 0.79 | 0.11 to 0.09 |
| G class, 60 N | 367 | 0.39 | 0.05 |
| G class, 80 N | 489 | 0.29 | 0.03 |

Thrust is not constant during a burn: gains tuned for the average thrust are too high at a thrust spike and too low in the tail-off. Keep the stand logs to quantify it.
