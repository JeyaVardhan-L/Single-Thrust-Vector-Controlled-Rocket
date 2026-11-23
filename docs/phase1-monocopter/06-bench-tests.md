# Phase 1 bench tests (Gate 0 and Gate 1)

Rules for every test here: read [safety](../safety.md); one **Test Director**; write the result in the test log (template at the end). A test that fails is **not** repeated until the cause is found and written down.

Config on the checklist for every run: git commit hash, `PhoneConfig` values, battery pack ID and voltage, date, people present.

---

## Gate 0: no propeller, bench

**Setup:** propeller **removed** and in its bag. For tests that need the ESC armed, **disconnect the three motor wires from the ESC** as well. Vehicle on the bench, battery or a 12 V supply, phone joined to `MC1-FLY` with the app open ([phone control guide](09-phone-control.md)), laptop connected by USB for the console (battery unplugged while USB is connected, see [wiring](04-wiring.md)).

| ID | Test | Procedure | Pass criterion | Result |
|---|---|---|---|---|
| G0-01 | Idle power | Insert the arming loop with the current-limited supply | Idle current < 100 mA; 5.0 ± 0.1 V, 6.0 ± 0.1 V | ☐ |
| G0-02 | Loop timing | Count console lines or toggle a debug pin over 60 s | 4 ms ± 10 %, no overruns | ☐ |
| G0-03 | Controls | Move the wheel, the yaw slider and the throttle in the app, watch the bars and the console | Wheel, yaw, throttle and arm all show in the app and the console; full wheel travel reaches the rim | ☐ |
| G0-04 | Vane order | Armed with throttle 45 %, or disarmed (the wheel moves the vanes too): wheel right | Vanes 1 (front) and 3 (rear) move in opposite directions; vanes 2 and 4 stay centred | ☐ |
| G0-05 | Vane roll sign | Same | The lower edges of vanes 1 and 3 both swing to the **right** of the vehicle (the bars show opposite signs for 1 and 3), so the bottom is pushed left and the vehicle rolls right | ☐ |
| G0-06 | Vane pitch sign | Wheel forward, then backward | Vanes 2 and 4 move (the bars show opposite signs): wheel forward swings both lower edges **forward** (the bottom is pushed back, the nose goes down); wheel backward swings them **rearward** | ☐ |
| G0-07 | Yaw | Yaw slider right | All four vanes move the same sense: the lower edges all swing counter-clockwise seen from above (clockwise force at each vane) | ☐ |
| G0-08 | Travel | Wheel and yaw sensitivity 100 %, vehicle disarmed: full right, full forward, full yaw (protractor) | Vane angle = 0.6 × 25° = 15° ± 2° (roll, pitch), 12.5° ± 2° (yaw) | ☐ |
| G0-09 | Free swing | Unpowered, move each vane by hand | ±25° without touching a stator, the hub, the ring or the servo; no binding | ☐ |
| G0-10 | Arm interlocks | (a) Reload the page while ARM is on: must **not** arm; (b) hold ARM with the target throttle at 30 %: the app refuses, the firmware does not arm; (c) throttle 0, hold ARM: arms (LED solid) | All three as stated (MC-06) | ☐ |
| G0-11 | Failsafe | Armed, throttle 20 %, turn the **phone's Wi-Fi off** | Vanes centred within 0.5 s, motor pulse ramps to 1000 µs within about 0.6 s and the vehicle disarms after about 2.5 s (scope, servo tester or logic analyzer; MC-05); the buzzer sounds | ☐ |
| G0-12 | Kill | Armed, throttle 20 %, press **Kill** | Motor pulse 1000 µs in one step; it does not re-arm until ARM is held again | ☐ |
| G0-13 | Authority gate | Armed, throttle < 10 % with the wheel deflected | Vanes stay centred (`minAuthThrottle`) | ☐ |
| G0-14 | ESC signal | Scope on GPIO4 | 400 Hz ± 1 %, 1000 to 2000 µs over the throttle range | ☐ |
| G0-15 | Servo current | Command full travel, measure the 6 V rail current | < 2 A transient, rail does not dip below 5.5 V; the ESP32 does not reset | ☐ |
| G0-16 | Servo brown-out | Stall one servo by hand for 2 s | The ESP32 keeps running, console alive | ☐ |
| G0-17 | Battery voltage | Compare the console `vbat` with a multimeter at the pack | Within ±0.1 V after setting `VBAT_CAL`; buzzer below 14.0 V | ☐ |
| G0-18 | Wi-Fi range and latency | Walk away with the vehicle powered, phone in hand, app open | Link stays green with a round trip under 100 ms at the distance you will fly from (≥ 15 m, line of sight); note the distance where it first drops out | ☐ |

If a sign check fails, fix it with `VANE_SIGN[i]` (a mirrored servo) or by swapping the servo connector order, **then repeat G0-04 to G0-07**.

**Gate 0 passes** when G0-01 to G0-18 pass and the log is filed.

---

## Gate 1: propeller on the thrust stand

**Setup:** thrust stand with load cell, vehicle clamped, polycarbonate shield between the vehicle and people, everyone > 5 m away or behind the shield, fire extinguisher at hand, LiPo bag nearby, 4S pack at 100 % charge. ESC configured (motor direction, no brake) and the throttle range calibrated.

**Roles:** Test Director (calls arm / go / abort), operator on the transmitter, data person on the stand log. Practise the abort call.

| ID | Test | Procedure | Pass criterion | Result |
|---|---|---|---|---|
| G1-01 | Prop direction | Put a strip of paper in the intake, arm, 15 % throttle for 2 s | Air blows **downward** through the vanes. If it blows upward, the prop does not match the motor direction: fit the prop of the opposite handedness (CW or CCW). Do not run a prop backwards | ☐ |
| G1-02 | Spin-up | Increase throttle 10 → 20 → 30 % in 5 s steps | Smooth, no vibration spikes, current rises smoothly | ☐ |
| G1-03 | Static thrust curve | Step 10 % to 80 % (5 s each), log thrust, current, voltage | Thrust ≥ 2 × weight (≥ 17.5 N at 892 g; MC-02) at ≤ 80 % throttle; current < ESC and battery limits | ☐ |
| G1-04 | Hover throttle | From the curve, the throttle for thrust = weight | Between 35 % and 65 %; set `hoverThrottle` | ☐ |
| G1-05 | Vibration | Run at hover throttle for 60 s | No resonance of the posts or rings at any throttle; vane servos do not jitter; screws stay tight | ☐ |
| G1-06 | Vane roll authority | Vehicle on a low-friction pivot (or torque arm) at hover throttle; command roll = +1 (full vane travel) | Measured torque ≥ 0.05 N·m (MC-03; design 0.09 N·m) | ☐ |
| G1-07 | Vane pitch authority | Same for pitch | ≥ 0.05 N·m | ☐ |
| G1-08 | Residual yaw torque | Vanes centred at hover throttle; torque about the vertical axis | Recorded; sets `yawTrim` | ☐ |
| G1-09 | Yaw authority | Yaw command = +1 | Authority ≥ 1.67 × residual (so the residual is ≤ 60 %; MC-04) | ☐ |
| G1-10 | Authority vs throttle | Repeat G1-06 at 40 %, 60 %, 80 % | Trend ∝ thrust; confirms the schedule `hoverThrottle / throttle` | ☐ |
| G1-11 | Battery sag | 60 s at hover throttle | Pack stays above 3.4 V per cell under load | ☐ |
| G1-12 | Thermal | After the test: touch the ESC, motor, servos | Warm, not hot (< 60 °C) | ☐ |

Abort immediately for: unexpected vibration or noise, smell, smoke, visible blade damage, any person inside the radius.

**Update the design and tuning from the results:**

| Result | Where it goes |
|---|---|
| Thrust curve and hover throttle | [01-design](01-design.md) §5, the sizing page, `hoverThrottle` |
| Vane authority at hover | [01-design](01-design.md) §6, `rollScale` and `pitchScale` |
| Residual yaw torque | `yawTrim` starting value |

**Gate 1 passes** when G1-01 to G1-12 pass (or the design is changed and the failed items re-run).

---

## Test log template

Copy to `docs/test-logs/YYYY-MM-DD-mc1-<test>.md`:

```
# <date> MC-1 <test name>
People / roles:
Git commit:          PhoneConfig values (expo, scales, yawTrim, hoverThrottle):
Pack ID, voltage:    Temperature, wind:
Setup photo:         Console / stand log file(s):
Results (table of ID / measured / pass-fail):
Observations (noise, smells, unexpected behaviour):
Decisions and actions (who, by when):
Gate status after this test:
```
