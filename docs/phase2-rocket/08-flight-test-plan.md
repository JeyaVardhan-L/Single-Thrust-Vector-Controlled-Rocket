# Flight test plan (Gate E and beyond)

Prerequisites: Gates A to D passed and filed; recovery tested (RK-14); site, permissions and weather per [safety](../safety.md); an experienced rocketry mentor has reviewed the procedure and the vehicle.

## 1. Progression

| Flight | Motor | Goal | Pass criterion |
|---|---|---|---|
| F0 | none | Recovery deployment test: drop with a dummy mass from a safe height; test pyro/servo release on the ground | Parachute deploys reliably 5 of 5 |
| F1 | F class, **tethered** (slack line limits height to ≈ 5 m) | Lift-off and early closed-loop behaviour | Rises straight, tilt < 10° throughout, tether never goes taut |
| F2 | F class, free flight, controller **observer only** (gimbal centred, logging) | Baseline unstabilised behaviour and sensor data in flight | Data complete; launch/burnout/apogee detection correct |
| F3 | F class, free flight, **closed loop** | Attitude hold under real thrust | Tilt < 10° during burn; clean recovery |
| F4 | F class, repeat 3× with gains refined | Repeatability | Three consecutive nominal flights |
| F5 | G class (only after F4) | Higher energy | Needs a bigger site, **new Go/No-go review** and re-tuned gains (G is ≈ 2.3× higher) |

Never skip a row. If any flight deviates, stop, analyse, update the documents, then decide.

## 2. Go / no-go (every flight)

| Item | Go criterion |
|---|---|
| Weather | Wind ≤ 15 km/h (≈ 4 m/s), no rain/fog/low cloud, no lightning within 20 km |
| Site | Cleared radius ≥ worst-case drift; no people, roads, buildings, livestock inside; airspace permission where needed |
| Vehicle | Inspected after the previous flight; gimbal checks (centre, backlash) re-done after any firing |
| Software | Commit and gains on the checklist; host tests pass on that commit |
| Telemetry | Link verified; GPS fix; ground station recording |
| Recovery | Deployment tested; packed per procedure; e-match continuity verified at the pad |
| Motor | Certified, in date, correct class for this flight row |
| People | Roles assigned; RSO present; safety briefing given |

## 3. Pad procedure (outline: expand using the stand checklist)

1. Vehicle on the pad/rig with RBF **inserted**, motor not installed.
2. Install motor (the person who will then retire), igniter last, leads shorted.
3. Remove RBF; arm switch ON; confirm ARMED (LED/tone), telemetry state ARMED, tilt < 10°, GPS fix.
4. Everyone behind the safety line, Director polls "ready" by name.
5. Countdown from 5, fire. Hang-fire drill as in the stand procedure.
6. After flight: approach only on the Director's call; RBF in; safe the recovery; remove motor casing when cool.

## 4. Flight abort and recovery logic

- Tilt > 35° during BOOST → ABORT: gimbal centred, chute requested at once. A solid motor cannot be shut down, so the worst-case ballistic path must be inside the cleared area. If the chute deploys during thrust, expect line damage: acceptable in an abort.
- Apogee detection (vertical speed < −1 m/s for 0.2 s after ≥ 0.5 s coast) → chute.
- No RC link: nothing to lose. The rocket has no uplink dependency.

## 5. Data review after each flight

| Item | Look for |
|---|---|
| Axial accel | Launch spike, burn plateau, burnout: detection timing vs the logged states |
| Tilt vs time | Overshoot, oscillation frequency vs PID lab prediction |
| Gimbal commands | Saturation, limit cycling, dither (heat) |
| Pack B voltage | Dips under servo load |
| Baro/vz | Apogee detection, vertical speed |
| IMU noise at burn | Vibration; adjust mounting/filtering |

Record every flight in `docs/test-logs/`, with the git commit, motor, conditions, outcome, deviations and action items. Update [06-firmware-and-gnc](06-firmware-and-gnc.md) and the PID-lab preset with the measured numbers.

## 6. Exit and next steps

After F4: write the *Phase 2 summary*: measured gains, authority, hardware wear and issues found.
