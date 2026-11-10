# Requirements

Each requirement has an ID, a verification method (**T**est, **A**nalysis, **I**nspection, **D**emonstration) and the gate where it is checked. When something changes, change the requirement first.

## System (both vehicles)

| ID | Requirement | Ver. | Gate |
|---|---|---|---|
| SYS-01 | The vehicle shall be electrically inert (no actuator motion, no motor output) until powered with the RBF loop/pin removed **and** the arm switch on | T | 0 / A |
| SYS-02 | The flight computer shall run its control loop at ≥ 500 Hz with worst-case jitter < 10 % | T | 0 |
| SYS-03 | Total sensor-to-actuator latency shall be ≤ 15 ms | T | 0 / A |
| SYS-04 | All flight-relevant signals (attitude, rates, commands, actuator positions, state, battery V) shall be logged ≥ 100 Hz to non-volatile storage | T | 0 |
| SYS-05 | Servo power shall be separate from logic power; a servo stall shall not reset the flight computer | T | 0 / A |
| SYS-06 | Telemetry (state, attitude, battery, position) shall reach the ground station at ≥ 1 Hz over ≥ 300 m before first flight | T | 2 / E |
| SYS-07 | The software configuration (git commit, gains) shall be recorded on the checklist for every powered test | I | all |
| SYS-08 | Every failsafe shall have a bench test with recorded result | T | 0 / A |

## MC-1 monocopter (Phase 1)

| ID | Requirement | Ver. | Gate |
|---|---|---|---|
| MC-01 | Take-off mass ≤ 550 g (BOM baseline 485 g) | I | 1 |
| MC-02 | Static thrust ≥ 2.0 × take-off weight on a fresh 4S pack | T | 1 |
| MC-03 | Roll and pitch control authority ≥ 0.02 N·m at hover throttle (design estimate 0.022 N·m; measured on the stand) | T | 1 |
| MC-04 | With the swirl-straightening fins fitted, the residual prop reaction torque at hover shall be ≤ 60 % of the yaw authority of the vanes (measured on the stand) | T | 1 |
| MC-05 | RC link loss or arm-switch off shall cut the motor and centre the vanes within 0.5 s | T | 0 |
| MC-06 | The vehicle shall refuse to arm if tilt > 20° or throttle > 5 % | T | 0 |
| MC-07 | Attitude estimate shall agree with a reference (phone IMU / protractor) within ±1.5° static | T | 0 |
| MC-08 | Tethered hover shall hold attitude within ±3° for 30 s in ≤ 2 m/s wind | T | 2 |
| MC-09 | Vehicle shall recover from a 15° hand-induced tilt without tether tension | T | 2 |
| MC-10 | Servo signs and vane order shall be verified against the mixer convention (docs/phase1-monocopter/05) | T | 0 |

## RK-1 rocket (Phase 2)

| ID | Requirement | Ver. | Gate |
|---|---|---|---|
| RK-01 | Take-off mass ≤ 1.3 kg (BOM baseline 1.06 kg) | I | B |
| RK-02 | Static thrust ≥ 2.0 × take-off weight on a fresh 6S pack (baseline 2.5) | T | B |
| RK-03 | Gimbal range ±7° mechanical, software limit ±6.5°, both axes | T | A |
| RK-04 | Gimbal backlash < 0.3° at the mount tube, measured | T | A |
| RK-05 | Gimbal step response: ≤ 60 ms to 90 % for a 3° step, unloaded | T | A |
| RK-06 | Gimbal shall remain centred and both ESC outputs at idle in SAFE, ARMED and ABORT | T | 0 / A |
| RK-07 | The flight-state machine shall refuse to arm with the RBF pin inserted, throttle up, tilt > 10°, no link, or a fault | T | A |
| RK-08 | FLIGHT shall start only when the throttle exceeds 12 % for 0.1 s; there shall be no motor output before that | T | A |
| RK-09 | Tilt > 35° in FLIGHT shall cut the motors and centre the gimbal | T | D |
| RK-10 | Link loss > 250 ms or the arm switch off in FLIGHT shall cut the motors within 0.3 s | T | A / B |
| RK-11 | The rocket shall be restrained on the stand such that loss of restraint of one tether does not release the vehicle | I | B |
| RK-12 | Static thrust at 90 % throttle ≥ 2.2 × weight and monotonic with throttle; both motors within 10 % | T | B |
| RK-13 | Closed-loop stand test shall reject a commanded 2° attitude offset within 0.5 s without gimbal saturation > 20 % of the time | T | D |
| RK-14 | With the yaw stick centred, spin about the vertical axis shall stay within ±30°/s (stand, closed loop) | T | D |
| RK-15 | The CG shall sit above the gimbal pivot at the designed height, about 243 mm above the ground plane without props; verify with a balance test within ±10 mm | I | A |

## Traceability

The `Gate` column maps to the tests in:

- Gate 0, 1, 2: [phase1-monocopter/06](phase1-monocopter/06-bench-tests.md), [07](phase1-monocopter/07-tethered-flight-test.md)
- Gate A: [phase2-rocket/05](phase2-rocket/05-gimbal-design.md)
- Gate B to D: [phase2-rocket/07](phase2-rocket/07-test-stand-procedure.md)
- Gate E: [phase2-rocket/08](phase2-rocket/08-flight-test-plan.md)
