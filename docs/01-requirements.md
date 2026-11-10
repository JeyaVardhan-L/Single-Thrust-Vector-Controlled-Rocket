# Requirements

Each requirement has an ID, a verification method (**T**est, **A**nalysis, **I**nspection, **D**emonstration) and the gate where it is checked. When something changes, change the requirement first.

## System (both vehicles)

| ID | Requirement | Ver. | Gate |
|---|---|---|---|
| SYS-01 | The vehicle shall be electrically inert (no actuator motion, no motor output, no pyro output) until powered with the RBF loop/pin removed **and** the arm switch on | T | 0 / A |
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
| RK-01 | Loaded mass ≤ 1.5 kg (BOM baseline 952 g) | I | B |
| RK-02 | Lift-off thrust-to-weight ≥ 2.5 for first flights (F-class motor), ≥ 5 before any G-class flight | A / T | B |
| RK-03 | Gimbal range ±7° mechanical, software limit ±6.5°, both axes | T | A |
| RK-04 | Gimbal backlash < 0.3° at the motor tube, measured | T | A |
| RK-05 | Gimbal step response: ≤ 60 ms to 90 % for a 3° step, unloaded | T | A |
| RK-06 | Gimbal shall remain centred (and servos unpowered by the state machine) in SAFE, ARMED, COAST, DESCENT, LANDED | T | 0 / A |
| RK-07 | The flight-state machine shall refuse to arm with RBF inserted, tilt > 10°, or fault | T | A |
| RK-08 | Launch detection shall use axial acceleration > 2 g held 50 ms; false-trigger test on handling and transport shall pass | T | B |
| RK-09 | Tilt > 35° in BOOST shall centre the gimbal and request recovery | T | C |
| RK-10 | Ignition shall be by the ground ignition controller only; no onboard ignition output in the baseline | I | all |
| RK-11 | The rocket shall be restrained on the stand such that loss of restraint of one tether does not release the vehicle | I | B |
| RK-12 | Stand thrust trace shall match the motor datasheet within ±15 % average thrust | T | B |
| RK-13 | Closed-loop stand test shall reject a commanded 2° attitude offset within 0.5 s without gimbal saturation > 20 % of the time | T | D |
| RK-14 | Recovery (decision D-03) shall be ground-tested (deployment test with a dummy mass) before any free flight | T | E |
| RK-15 | The CG shall sit above the gimbal pivot (nozzle below the CG) at the designed height, about 280 mm above the ground plane with an empty motor tube; verify with a balance test within ±10 mm | I | A |

## Traceability

The `Gate` column maps to the tests in:

- Gate 0, 1, 2: [phase1-monocopter/06](phase1-monocopter/06-bench-tests.md), [07](phase1-monocopter/07-tethered-flight-test.md)
- Gate A: [phase2-rocket/05](phase2-rocket/05-gimbal-design.md)
- Gate B to D: [phase2-rocket/07](phase2-rocket/07-test-stand-procedure.md)
- Gate E: [phase2-rocket/08](phase2-rocket/08-flight-test-plan.md)
