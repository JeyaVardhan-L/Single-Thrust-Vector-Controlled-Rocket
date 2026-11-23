# Phase 1 exit: Gate 3 review

Gate 3 decides whether Phase 2 **powered** tests may start. Hold the review with everyone who will operate the rocket. The output is a short document in `docs/test-logs/`: *Phase 1 exit review*.

## Checklist

### Evidence

| # | Item | Evidence | OK |
|---|---|---|---|
| 1 | Gate 0 complete | Filed test log, all items pass | ☐ |
| 2 | Gate 1 complete | Thrust curve, vane authority, yaw torque, filed | ☐ |
| 3 | Gate 2 complete | 10 flights, video, notes | ☐ |
| 4 | All failsafes demonstrated | RC loss, arm switch, interlocks | ☐ |
| 5 | Notes and video of every flight stored | `logs/` or release asset | ☐ |
| 6 | Measured values committed to the repo | `PhoneConfig` values, hover throttle, vane authority in the design doc | ☐ |
| 7 | Incident log reviewed | No open safety issues | ☐ |

### Reuse readiness (what moves to the rocket)

| # | Item | Needed for | OK |
|---|---|---|---|
| 8 | Phone-mode arming rules, throttle ramps, kill and failsafe behave as tested (`npm run test:firmware`); the CRSF parser is carried to the rocket | Rocket firmware | ☐ |
| 9 | Servo power architecture validated (no brown-out, separate 6 V BEC) | Gimbal servos | ☐ |
| 10 | ESC, motor and propeller handling: direction check, balancing, prop-direction test with paper | Rocket motors | ☐ |
| 11 | Side-force control understood: vane signs, mixer convention, authority vs throttle | Gimbal sign checks and gain schedule | ☐ |
| 12 | Operating discipline: roles, call-outs, checklists used and refined | Stand tests | ☐ |
| 13 | Design choices D-01 (propulsion) and D-03 (recovery) confirmed | Phase 2 build | ☐ |

### Gaps to carry into Phase 2

MC-1 has no IMU, no attitude estimator and no control loop. They are exercised and gated in Phase 2 (Gate A bench tests, Gates B to D on the stand): IMU mounting and signs, the Mahony filter on real vibration, the PID loop and its latency, logging. Also not covered here: a mechanical gimbal with gears and backlash, a coaxial contra-rotating pair, a higher thrust level and the heavier power system.

## Decision

- ☐ **Go**: Phase 2 powered tests may start with Gate A.
- ☐ **Go with conditions** (list them, with owners and dates).
- ☐ **No go**: list the failed items and the re-test plan.

Signed: Test Director ______ · RSO ______ · date ______
