# Flight test plan (Gate E and beyond)

Prerequisites: Gates A to D passed and filed; site, permissions and weather per [safety](../safety.md); an experienced pilot or mentor has reviewed the procedure and the vehicle.

## 1. Progression

| Flight | Mode | Goal | Pass criterion |
|---|---|---|---|
| F0 | Tilting rig, closed loop, repeat Gate D three times | Confidence in the control loop | All pass |
| F1 | **Tethered**, three slack lines limit the height to ≈ 1 m. Light on the legs, then a few centimetres up | Lift-off and early closed-loop behaviour | Rises straight, tilt < 5°, no line goes taut |
| F2 | Tethered hover at 0.5 to 1 m for 30 s | Attitude hold | ±3° for 30 s in ≤ 2 m/s wind (RK-13) |
| F3 | Tethered, stick inputs ±5° and a hand tap | Response and recovery | Follows and recovers without tether tension |
| F4 | Tethered flights ×10 with gains refined | Repeatability | Ten nominal flights, no crash |
| F5 | **Free** hover at 1 to 2 m over soft ground, pilot ready to cut | First untethered flight | Holds ±5° for 20 s, lands on the legs |
| F6 | Hops to 5 m, then 10 m | Envelope | Nominal; logs match the model |

Never skip a row. If any flight deviates, stop, analyse, update the documents, then decide.

## 2. Go / no-go (every flight)

| Item | Go criterion |
|---|---|
| Weather | Wind ≤ 15 km/h (≈ 4 m/s), no rain or fog, no lightning within 20 km |
| Site | Cleared radius ≥ 15 m for tethered flights, ≥ 30 m for free flights; no people, roads, buildings or livestock inside; airspace permission where needed |
| Vehicle | Inspected after the previous flight: props, motors, gimbal centre and backlash, cables, legs |
| Battery | Main pack ≥ 25.0 V, inspected; avionics pack charged; spare packs ready |
| Software | Commit and gains on the checklist; host tests pass on that commit |
| Link | Radio range check, failsafe test (radio off → motors cut) done on the ground |
| Props | New or inspected, balanced, tight |
| People | Roles assigned; safety briefing given; shield or distance for everyone but the pilot |

## 3. Pre-flight procedure

1. Vehicle on the ground, arming loop out, RBF pin in, props fitted last.
2. Everyone to their position; the pilot confirms the radio, throttle at zero, arm switch off.
3. Remove the RBF pin, insert the arming loop. Wait for the gyro calibration (vehicle still), LED off.
4. Arm switch on → ARMED (LED). Director polls "ready" by name. Call out "spooling".
5. Throttle up smoothly to hover. After the flight: throttle zero, arm off, wait for the props to stop, loop out, RBF in.

## 4. Abort and recovery logic

- **Pilot cut:** arm switch off at any time: ABORT, motors cut, gimbal centres. Practised on every flight.
- **Tilt abort:** tilt > 35° in FLIGHT cuts the motors. A cut vehicle falls: the legs and the soft ground take the landing; keep the cleared radius.
- **Link loss:** motors cut within 0.25 s.
- **Low battery:** land when the main pack reaches 3.5 V per cell under load or when the radio's voltage alarm sounds.

## 5. Data review after each flight

| Item | Look for |
|---|---|
| Tilt vs time | Overshoot, oscillation frequency vs the PID lab prediction |
| Gimbal commands | Saturation, limit cycling, dither (servo heat) |
| Throttle and gain schedule | Oscillation at low or high throttle |
| Spin (gyro X) | Drift, yaw-stick response, motor imbalance |
| Battery voltage | Sag under load, remaining capacity |
| IMU noise | Vibration; adjust props balance and mounting |

Record every flight in `docs/test-logs/`, with the git commit, conditions, outcome, deviations and action items. Update [06-firmware-and-gnc](06-firmware-and-gnc.md) and the PID-lab preset with the measured numbers.

## 6. Exit

After F6: write the *Phase 2 summary*: measured gains, authority, endurance, hardware wear and issues found.
