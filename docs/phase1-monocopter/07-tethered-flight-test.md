# Phase 1 tethered flight test (Gate 2)

Prerequisite: Gate 0 and Gate 1 passed and filed. Read [safety](../safety.md) §3 and §7.

## Setup

| Item | Specification |
|---|---|
| Site | Open flat area, no people or property within 15 m, grass or soft ground, wind ≤ 2 m/s (≈ 7 km/h) |
| Tether | Three lines of 3 m, 120° apart, from ring-mounted eyelets to ground anchors, **slack enough to allow ±1 m height and ±10° tilt**, not taut. Rated > 40 N |
| Shield | Net or polycarbonate; operator and spotter behind or ≥ 5 m away |
| Crew | Test Director, pilot (transmitter), spotter (eyes on the vehicle only), data / logging |
| Equipment | Fire extinguisher, LiPo bag, spare props, spare battery, first-aid kit, tools, radio check |
| Vehicle | Firmware committed, gains written on the checklist, battery charged, CG verified |

## Pre-flight checklist

1. ☐ Props inspected (no nicks or cracks), tight, balanced
2. ☐ Battery inspected, voltage ≥ 16.0 V, strap tight
3. ☐ Tether lines inspected and anchored; knots checked
4. ☐ Area clear; spotter in position; wind within limit
5. ☐ Vane sign check repeated (quick tilt test with throttle at idle, props **on** but keep throttle < 5 %)
6. ☐ Transmitter: arm switch off, throttle zero, kill switch tested
7. ☐ Failsafe tested by turning the transmitter off **before** connecting the battery to see the vanes centre (no motor)
8. ☐ Connect battery, wait for gyro calibration (vehicle still), check LED and console
9. ☐ Everyone confirms "clear"

## Procedure

| Phase | Action | Pass criterion |
|---|---|---|
| T1 | Arm, throttle up to hover over 5 s. **Stay low:** light on the legs, then barely airborne (≤ 20 cm) | Vehicle lifts without large rotation; vanes respond |
| T2 | Hold 10 s ≤ 20 cm. Pilot input minimal | No growing oscillation. Roll/pitch within ±5° |
| T3 | Raise to ≈ 50 cm, hold 30 s | ±3° for 30 s in calm air (MC-08) |
| T4 | Light stick commands: ±5° roll/pitch for 2 s each | Vehicle follows without overshoot > 50 % |
| T5 | Hand "tap": push the ring by hand to ≈ 15° and release (with a gloved hand / long stick) | Recovers within 2 s without tether tension (MC-09) |
| T6 | Throttle down, land, disarm, **remove battery before approaching** | |

Each flight ≤ 60 s. Cool-down 5 minutes between flights. After each flight: check props, motor temperature, servo temperature, wiring, tether, log.

## Abort criteria (the Director calls "abort", pilot cuts throttle, then disarms)

- Oscillation that grows over two cycles.
- Yaw spin > 90°/s or accelerating.
- Tilt > 30°.
- Tether tension seen (line becomes taut).
- Any smell, smoke, or unexpected noise.
- Link loss or loss of the spotter's line of sight.
- Any person entering the radius.

## Data to capture

- `flight.csv` per flight, renamed with date and run number.
- Video (phone, from a side).
- Notes: wind, temperature, battery voltage start/end.

## Analysis (within 24 h of the session)

| Look at | What it tells you |
|---|---|
| `roll`, `pitch` vs time | Oscillation frequency vs the PID-lab prediction (≈ 0.8 Hz natural frequency) |
| `v1..v4` | Saturation fraction; flat tops → authority limit; DC offset → CG error or thrust misalignment |
| `gz` | Yaw drift and the trim you need |
| `thr` and battery voltage | Hover throttle, sag |
| Servo temperature | Dither and gain too high |

Feed the measured oscillation frequency back into the plant gain: `G ≈ (2π f)² / Kp`. Update [05-firmware-and-control](05-firmware-and-control.md) and the PID-lab preset to the measured value. This closes the loop between simulation and hardware.

## Gate 2 pass criteria

- 10 tethered flights (≥ 5 s hover each) without a crash.
- ±3° over 30 s (T3) and recovery from a 15° tap (T5), recorded in the logs.
- All failsafes (RC loss, switch) demonstrated with the props on **in the tethered setup** at least once.
- Measured gain `G` and the final gains recorded in the repository.
