# Phase 1 bench tests (Gate 0 and Gate 1)

Rules for every test here: read [safety](../safety.md); one **Test Director**; write the result in the test log (template at the end). A test that fails is **not** repeated until the cause is found and written down.

Config on the checklist for every run: git commit hash, firmware gains, battery pack ID and voltage, date, people present.

---

## Gate 0: no propeller, bench

**Setup:** propeller **removed** and in its bag. For tests that need the ESC armed, **disconnect the three motor wires from the ESC** as well. Vehicle on the bench, battery or 12 V supply, transmitter on, laptop connected by USB for the console (do not connect USB while the battery is connected to 5 V: see wiring).

| ID | Test | Procedure | Pass criterion | Result |
|---|---|---|---|---|
| G0-01 | Idle power | Insert arming loop with the current-limited supply | Idle current < 100 mA; 5.0 ± 0.1 V, 6.0 ± 0.1 V | ☐ |
| G0-02 | Loop timing | Add a debug counter or measure the loop period over 60 s (console) | 2.0 ms ± 10 %, no overruns | ☐ |
| G0-03 | IMU roll sign | Tilt the vehicle right-side down by 20° (protractor/phone angle app) | Console roll ≈ +20° (±1.5°) | ☐ |
| G0-04 | IMU pitch sign | Tilt nose up by 20° | Console pitch ≈ +20° (±1.5°) | ☐ |
| G0-05 | Gyro yaw sign | Rotate the vehicle clockwise seen from above | `gz` positive (check the SD log or temporary print) | ☐ |
| G0-06 | Static accuracy | Place level, then at 10° steps to 30° on both axes | Error ≤ 1.5° (MC-07) | ☐ |
| G0-07 | Drift | Leave level for 5 minutes | Roll/pitch drift < 1° | ☐ |
| G0-08 | Arm interlocks | (a) arm switch ON with throttle at 30 % → must **not** arm; (b) arm with throttle 0 but tilted 30° → must **not** arm; (c) throttle 0, level → arms (LED on) | All three as stated (MC-06) | ☐ |
| G0-09 | Failsafe | Armed with throttle at 20 %, switch **off** the transmitter | Motor pulse → 1000 µs and vanes centred within 0.5 s (scope, servo tester or logic analyzer; MC-05) | ☐ |
| G0-10 | Kill switch | Armed, throttle 20 %, flip arm switch off | Same as G0-09 | ☐ |
| G0-11 | Vane order | Arm, throttle 20 %, hold the vehicle tilted **right-wing-down** | Vane 1 (front) and vane 3 (rear) deflect; vanes 2 and 4 stay near centre | ☐ |
| G0-12 | Vane roll sign | Same posture as G0-11 | Lower edges of vanes 1 and 3 move **away from the lean side** (to the left) | ☐ |
| G0-13 | Vane pitch sign | Hold **nose up** | Vanes 2 and 4 deflect; lower edges move **forward** (away from the lean) | ☐ |
| G0-14 | Yaw | Rotate with a hand command: use the yaw stick | All four vanes deflect the same sense | ☐ |
| G0-15 | Authority gate | Throttle < 10 % in the tilted posture | Vanes stay centred (MIN_AUTH_THROTTLE) | ☐ |
| G0-16 | Servo current | Command full travel, measure 6 V rail current | < 2 A transient, rail does not dip below 5.5 V; Teensy does not reset | ☐ |
| G0-17 | Servo brown-out | Stall one servo by hand for 2 s | Teensy keeps running, console alive | ☐ |
| G0-18 | Logging | Arm and run 60 s | `flight.csv` written, at the expected rate, columns complete | ☐ |
| G0-19 | Radio range | Walk away with the vehicle powered | Stable link at ≥ 100 m (LOS) before flight | ☐ |

If a sign check fails, fix it with `VANE_SIGN[i]` (a mirrored linkage) or by swapping the servo connector order, **then repeat G0-11 to G0-14**.

**Gate 0 passes** when G0-01 to G0-19 pass and the log is filed.

---

## Gate 1: propeller on the thrust stand

**Setup:** thrust stand with load cell, vehicle clamped, polycarbonate shield between vehicle and people, everyone > 5 m away or behind the shield, fire extinguisher at hand, LiPo bag nearby, 4S pack at 100 % charge. ESC configured and the motor direction verified **with the prop off** first.

**Roles:** Test Director (calls arm/go/abort), operator on the transmitter, data person on the stand log. Practice the abort call.

| ID | Test | Procedure | Pass criterion | Result |
|---|---|---|---|---|
| G1-01 | Spin-up | Fit the propeller (pusher type, blowing down). Arm. Increase throttle 10 → 20 → 30 % in 5 s steps | Air blows downward through the vanes; smooth, no vibration spikes, current rises smoothly | ☐ |
| G1-02 | Static thrust curve | Step 10 % to 80 % (hold 5 s each), log thrust, current, voltage | Thrust ≥ 2 × weight (≥ 9.5 N at 485 g; MC-02) at ≤ 80 % throttle; current < ESC and battery limits | ☐ |
| G1-03 | Hover throttle | From the curve find the throttle for thrust = weight | Between 45 % and 70 % | ☐ |
| G1-04 | Vibration | Run at hover throttle for 60 s with the IMU on | Gyro noise (std) at rest < 0.05 rad/s; roll/pitch don't wander | ☐ |
| G1-05 | Vane roll authority | Vehicle on a low-friction pivot (or torque arm) at hover throttle; command roll = +1 | Measured torque ≥ 0.02 N·m (MC-03) | ☐ |
| G1-06 | Vane pitch authority | Same for pitch | ≥ 0.02 N·m | ☐ |
| G1-07 | Residual yaw torque | Vanes centred at hover throttle; measure torque about the vertical axis | Recorded | ☐ |
| G1-08 | Yaw authority | Yaw command = +1 | Authority ≥ 1.67 × residual (so residual ≤ 60 %; MC-04) | ☐ |
| G1-09 | Authority vs throttle | Repeat G1-05 at 40 %, 60 %, 80 % | Trend ∝ thrust; record the gain `G` | ☐ |
| G1-10 | Battery sag | 60 s at hover throttle | Pack stays above 3.4 V/cell under load | ☐ |
| G1-11 | Thermal | After the test: touch ESC, motor, servos | Warm, not hot (< 60 °C) | ☐ |

Abort immediately for: unexpected vibration or noise, smell, smoke, visible blade damage, any person inside the radius.

**Update the design and tuning from the results:**

| Result | Where it goes |
|---|---|
| Thrust curve and hover throttle | [01-design](01-design.md) §4, sizing page, `MIN_AUTH_THROTTLE` |
| Authority gain `G` (rad/s² per unit at hover) | PID lab preset, firmware gains (rule: `Kp ≈ ωn² / G`, `Kd ≈ 2 ζ ωn / G`) |
| Residual yaw torque | `YAW_TRIM` starting value |

**Gate 1 passes** when G1-01 to G1-11 pass (or the design is changed and the failed items re-run).

---

## Test log template

Copy to `docs/test-logs/YYYY-MM-DD-mc1-<test>.md`:

```
# <date> MC-1 <test name>
People / roles:
Git commit:          Firmware gains (Kp Ki Kd / yaw):
Pack ID, voltage:    Temperature, wind:
Setup photo:         Log file(s):
Results (table of ID / measured / pass-fail):
Observations (noise, smells, unexpected behaviour):
Decisions and actions (who, by when):
Gate status after this test:
```
