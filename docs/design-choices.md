# Design choices

The numbers in this repository come from one CAD screenshot (browser tree and viewport) and one photograph of a vane-controlled monocopter. Where the CAD did not show a value, this guide picks a baseline and says why. Change any of them to suit your build, then update `src/data/spec.js`, the BOM and the documents that quote it.

| ID | Topic | Baseline | Why | Alternative |
|---|---|---|---|---|
| D-01 | **Propulsion** | A coaxial pair of 3110-class brushless motors (≈ 900 KV) with contra-rotating 9″ props on 6S, in the gimbal | Reaction torques cancel and differential throttle gives control about the vertical axis; the CAD has a central gimbal assembly | Single motor plus straightening vanes (as MC-1), or a ducted fan |
| D-02 | Gimbal gear ratio | 18T pinion → 36T sector (2:1), module 1 | The "36t" in the CAD names `gear36t1/2` | Other ratios change servo travel, resolution, speed and torque ([gimbal lab](../web/gimbal.html)) |
| D-03 | **Recovery** | Pilot-controlled throttle and landing on the four legs; tether for the first flights | The legs are for landing; the thrust is throttleable | A parachute for free flights over rough ground |
| D-04 | Stack | Three 110 mm plates (battery, flight computer, telemetry) on four Ø6 mm carbon rods, plus a diamond landing frame | Three modules are enough for the electronics and keep the CG low | More plates raise the CG and add mass |
| D-05 | Power | 6S 1500 mAh main pack (ESCs, servo BEC) and a separate 2S 450 mAh avionics pack, side by side on one plate | ESC and servo noise never reaches the flight computer | One pack with a clean regulator |
| D-06 | Flight computer | Teensy 4.1 + ICM-42688-P + BMP390 | Fast, well documented, SD slot, same in both phases | Any 100 MHz+ MCU with SPI and an SD card |
| D-07 | Phase 1 propulsion | 2306 ≈ 2000 KV + 6×3.5 prop, 4S 1300 mAh | Matches the ≈ Ø250 mm ring of the photographed vehicle | 7″ prop for more vane authority |
| D-08 | Control link (Phase 1) | ExpressLRS 2.4 GHz, CRSF | Low latency, telemetry back-channel | Any RC link with SBUS or CRSF |
| D-09 | Control link | ExpressLRS 2.4 GHz, CRSF, with link statistics and battery voltage on the radio | Same receiver as the monocopter | Any radio with SBUS or CRSF |
| D-10 | Arming | Two independent switches (on-board and radio), RBF pin on the main pack, ESCs held low by pull-downs | Two interlocks against an accidental spin-up | A hardware arm relay |
| D-11 | Test stand | Fixed thrust stand with a load cell, plus a tilting rig for closed-loop tests | The CAD has a `test-stand` part | A free pivot or tethered stand |
| D-12 | Materials | PETG for the monocopter; PA-CF for the rocket gimbal and landing frame | Stiffness and landing loads | Machined aluminium gimbal |
| D-13 | Landing legs | Four rigid Ø8 mm legs, 34° from vertical, rubber feet, hinged at the landing-frame corners | CAD | Fewer or shorter legs change the tip-over margin |
| D-14 | Gimbal range | ±7° mechanical, ±6.5° software | Typical for small hobby TVC | More range gives more authority and more mechanics |

## How to change a choice

1. Write the decision and the reasoning in your pull request.
2. Update `src/data/spec.js` (geometry), the BOM JSON (parts), the [requirements](01-requirements.md) and the affected design document.
3. Run `npm test`, `npm run bom`, `npm run screenshots`.

## Scope of this design

- Control is by the gimbal only; the rocket has no fins and no roll control.
- Attitude comes from a gyro and accelerometer (Mahony filter) and a barometer; there is no magnetometer.
- The vehicle is flown by a pilot on a radio; there is no autonomous altitude control.
