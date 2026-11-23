# Phase 1 tethered flight test (Gate 2)

Prerequisite: Gate 0 and Gate 1 passed and filed. Read [safety](../safety.md) §3 and §7.

MC-1 has no attitude loop: **the pilot flies it**, and the tether limits the consequences of a mistake. Keep the lines slightly slack and correct early with small stick inputs.

## Setup

| Item | Specification |
|---|---|
| Site | Open flat area, no people or property within 15 m, grass or soft ground, wind ≤ 2 m/s (≈ 7 km/h) |
| Tether | Three lines of 3 m, 120° apart, from eyelets on the posts to ground anchors, **slack enough to allow ±1 m height and ±10° tilt**, not taut. Rated > 40 N |
| Shield | Net or polycarbonate; operator and spotter behind it or ≥ 5 m away |
| Crew | Test Director, pilot (transmitter), spotter (eyes on the vehicle only), notes and video |
| Equipment | Fire extinguisher, LiPo bag, spare props, spare battery, first-aid kit, tools, radio check |
| Vehicle | Firmware committed, `PhoneConfig` values written on the checklist, battery charged, CG verified |

## Pre-flight checklist

1. ☐ Prop inspected (no nicks or cracks), tight, balanced, **pusher type blowing down**
2. ☐ Battery inspected, voltage ≥ 16.0 V, strap tight
3. ☐ Tether lines inspected and anchored; knots checked
4. ☐ Area clear; spotter in position; wind within limit
5. ☐ Vane sign check repeated (wheel test with the **propeller removed**, [phone control guide](09-phone-control.md) §5; then fit it)
6. ☐ Phone joined to `MC1-FLY`, app open, throttle limit at 50 %, ARM off, throttle zero, Kill tested
7. ☐ Failsafe tested on the bench: with the app open and the vehicle disarmed, close the page and check that the link light goes red and the vanes centre (no motor)
8. ☐ Connect the battery, check the LED and the buzzer (no low-voltage tone)
9. ☐ Everyone confirms "clear"

## Procedure

| Phase | Action | Pass criterion |
|---|---|---|
| T1 | Arm, then raise the throttle with Climb (Smooth) over about 5 s. **Stay low:** light on the posts, then barely airborne (≤ 20 cm) | Lifts without large rotation; the vanes respond to the wheel |
| T2 | Hold 10 s ≤ 20 cm with small inputs | No growing tilt or spin the pilot cannot correct |
| T3 | Raise to ≈ 50 cm, hold 30 s | Stays inside ±0.5 m of the tether centre for 30 s in calm air (MC-08) |
| T4 | Light wheel commands: short pushes of about 0.5 s | The vehicle tilts and drifts a little and returns with an opposite tap; no overshoot the pilot cannot catch |
| T5 | Pilot-induced tilt of ≈ 15°, then recovery | Recovered within 2 s without tether tension (MC-09) |
| T6 | Throttle down, land, disarm, **remove the battery before approaching** | |

Each flight ≤ 60 s. Cool-down 5 minutes between flights. After each flight: check the prop, motor temperature, servo temperature, wiring, tether.

## Abort criteria (the Director calls "abort", the pilot cuts the throttle, then disarms)

- A tilt or spin the pilot does not stop within two corrections.
- Yaw spin > 90°/s or accelerating.
- Tilt > 30°.
- Tether tension seen (a line becomes taut).
- Any smell, smoke or unexpected noise.
- Link loss or loss of the spotter's line of sight.
- Any person entering the radius.

## Data to capture

- Video (phone, from the side) for every flight, named with date and run number.
- Notes: wind, temperature, battery voltage at start and end, hover throttle, any trim needed.

## Analysis (within 24 h of the session)

| Look at | What it tells you |
|---|---|
| Hover throttle (radio channel monitor or video) | `hoverThrottle` |
| Constant wheel offset needed at hover | CG off the axis, or `yawTrim` |
| How hard the pilot had to work (video) | `rollScale`, `pitchScale`, `expo` |
| Servo temperature | Servo dither; check the 6 V rail |
| Battery voltage start and end | Capacity used, endurance |

Update [05-firmware-and-control](05-firmware-and-control.md) with the final `PhoneConfig` values.

## Gate 2 pass criteria

- 10 tethered flights (≥ 5 s hover each) without a crash.
- T3 and T5 met and recorded on video.
- All failsafes (RC loss, switch) demonstrated with the prop on **in the tethered setup** at least once.
- The final `PhoneConfig` values recorded in the repository.
