# Project overview

## Goal

Build and fly an **electric thrust-vector rocket (RK-1)**: a pair of brushless motors with propellers hangs in a two-axis gimbal, two servos steer it, and a flight computer holds the vehicle upright while the pilot flies the throttle. This repository is the baseline for it: models, procedures, components, firmware and tutorials.

## Why a monocopter first

A thrust-vectored vehicle is unforgiving, and every crash costs motors and props. Much of the risk sits in the propulsion stack and the way you work, not only in the control software: motor, ESC, propeller handling, servo power, the radio link, arming and failsafes, and the discipline of a test day.

A **vane-controlled monocopter** (MC-1) exercises those on a simpler, cheaper vehicle, built as an experiment:

- one brushless motor with a **10 inch** propeller, and four servo-driven vanes in the wash instead of a gimbal,
- vectored in the same sense as the rocket: a side force below the CG, so the vane mixer and the sign conventions are the same kind of problem,
- an **ESP32-S3** as the only controller, flown from a **phone over Wi-Fi** (a web page the vehicle serves itself), one ESC and four servos. **No IMU, no radio receiver**: the pilot closes the attitude loop and the tether limits the consequences,
- cheap enough to crash (≈ US$ 440 total including test gear; reusable),
- **print, plug and fly**: 45 printable parts, a parts list, wiring, firmware, a phone control page and a build guide.

| What Phase 1 proves | Why it matters in Phase 2 |
|---|---|
| Servo selection, power rail design, brown-out behaviour | Gimbal servos have the same electrical demand pattern |
| ESC and brushless-motor handling, prop direction and balancing, prop safety | The rocket has two motors and two ESCs |
| Side-force control: vane order, signs, authority versus throttle | The gimbal has the same sign and gain-schedule questions |
| Failsafes: RC loss, arm switch, interlocks | Same philosophy in the rocket's state machine |
| Link supervision, failsafes, ramped throttle | Same philosophy in the rocket's state machine; the rocket uses an ELRS link |
| Operating discipline: checklists, call-outs, test director, tether handling | Reused for the stand tests |

What Phase 1 does **not** prove: IMU mounting, the attitude estimator and the PID loop (these are exercised and gated in Phase 2), a mechanical gimbal with gears and backlash, a coaxial contra-rotating pair and its differential-throttle spin control, a higher thrust level and the heavier power system. Phase 2 has its own gates for those.


## Vehicle summaries

| | MC-1 monocopter (Phase 1) | RK-1 rocket (Phase 2) |
|---|---|---|
| Thrust source | 1 × 28xx motor (≈ 1100 KV) + 10″ prop, 4S | 2 × 3110 motors, contra-rotating 9″ props, 6S |
| Control actuators | 4 vanes in the prop wash, 4 servos | 2-axis gimbal, 2 servos, 2:1 gears; differential throttle for spin |
| Take-off mass (parts list) | ≈ 892 g | ≈ 1.06 kg |
| Thrust-to-weight | ≈ 2 (target ≥ 2, recorded at Gate 1) | ≈ 2.5 (target ≥ 2) |
| Controller | ESP32-S3, 250 Hz, no IMU | Teensy 4.1, 500 Hz, IMU |
| Link | Wi-Fi from a phone (web app on the ESP32-S3) | ExpressLRS |
| Run time | ≈ 6 min hover | ≈ 6 to 8 min hover |
| Recovery | tether, landing legs | tether, landing legs (propulsive landing under pilot control) |
| Attitude reference | none: the pilot closes the loop | accelerometer + gyro (no magnetometer) |

Numbers in the table come from the parts-list JSON files.

## Deliverables of this repository

1. Models: [rocket](../web/rocket.html) and [monocopter](../web/monocopter.html) in three.js, parameterised, plus **[print-ready STL files](cad-parts.md)** in two separate sets (monocopter first, rocket second).
2. Procedures: build guides, test procedures and gates, checklists.
3. Components: parts lists with masses, wiring, pin maps.
4. Software: a portable tested core plus an ESP32-S3 project (MC-1) and a Teensy 4.1 project (RK-1).
5. Tutorials: build wizards, PID lab, gimbal lab, sizing, wiring.

## Roadmap (suggested order)

| Step | Work | Output |
|---|---|---|
| 0 | Read safety, confirm the [design choices](design-choices.md) and CAD parameters | Updated `spec.js` + parts list |
| 1 | Order Phase 1 parts, print MC-1 | Built airframe |
| 2 | Compile and bring up firmware on the bench | Gate 0 |
| 3 | Thrust stand, vane authority | Gate 1 |
| 4 | Tethered hover, tuning | Gates 2 and 3 |
| 5 | Print and assemble RK-1, gimbal calibration with props off | Gate A |
| 6 | Thrust stand: locked, open-loop sweeps, closed loop on the tilting rig | Gates B to D |
| 7 | Tethered flights, then free flights | Gate E |
