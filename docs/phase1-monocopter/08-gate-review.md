# Phase 1 exit: Gate 3 review

Gate 3 decides whether Phase 2 **powered** tests may start. Hold the review with everyone who will operate the rocket. The output is a short document in `docs/test-logs/`: *Phase 1 exit review*.

## Checklist

### Evidence

| # | Item | Evidence | OK |
|---|---|---|---|
| 1 | Gate 0 complete | Filed test log, all items pass | ☐ |
| 2 | Gate 1 complete | Thrust curve, authority, yaw torque, filed | ☐ |
| 3 | Gate 2 complete | 10 flights, logs, video | ☐ |
| 4 | All failsafes demonstrated | RC loss, arm switch, interlocks | ☐ |
| 5 | Logs of every flight stored and readable | `logs/` or release asset | ☐ |
| 6 | Measured plant gain and gains committed to the repo | `attitude.js` preset, firmware gains | ☐ |
| 7 | Simulation vs real: natural frequency and settling within ±30 % | A comparison plot | ☐ |
| 8 | Incident log reviewed | No open safety issues | ☐ |

### Reuse readiness (what moves to the rocket)

| # | Item | Needed for | OK |
|---|---|---|---|
| 9 | `tvc_core` unchanged or its changes re-tested (`npm test`, `npm run test:firmware`) | Rocket firmware | ☐ |
| 10 | IMU driver and mounting practice validated (noise, vibration) | Rocket FC | ☐ |
| 11 | Servo power architecture validated (no brown-out) | Gimbal servos | ☐ |
| 12 | Logging rate and file system validated (no dropped samples) | Rocket logging | ☐ |
| 13 | Operating discipline: roles, call-outs, checklists used and refined | Static fires | ☐ |
| 14 | Design choices D-01 (propulsion) and D-03 (recovery) confirmed | Phase 2 build | ☐ |

### Gaps to carry into Phase 2

List what Phase 1 could **not** prove (high-g vibration, thrust curve, gimbal backlash). They are covered by Phase 2 gates A to E.

## Decision

- ☐ **Go**: Phase 2 powered tests may start with Gate A.
- ☐ **Go with conditions** (list them, with owners and dates).
- ☐ **No go**: list the failed items and the re-test plan.

Signed: Test Director ______ · RSO ______ · date ______
