# Design choices

The numbers in this repository come from one CAD screenshot (browser tree and viewport) and one photograph of a vane-controlled monocopter. Where the CAD did not show a value, this guide picks a baseline and says why. Change any of them to suit your build, then update `src/data/spec.js`, the BOM and the documents that quote it.

| ID | Topic | Baseline | Why | Alternative |
|---|---|---|---|---|
| D-01 | **Propulsion** | One certified 29 mm composite solid motor in a 32 mm tube. **F class (≈ 30 N·s) for the first static fires and flights; G class (≈ 100 N·s) after Gate E** | Solid motors are the usual choice for a first TVC rocket; the CAD has a central tube and no throttle mechanism | EDF or hybrid: new mass, CG, thermal design and a throttle strategy |
| D-02 | Gimbal gear ratio | 18T pinion → 36T sector (2:1), module 1 | The "36t" in the CAD names `gear36t1/2` | Other ratios change servo travel, resolution, speed and torque ([gimbal lab](../web/gimbal.html)) |
| D-03 | **Recovery** | Parachute 24 to 36″ released by a servo or e-match at apogee | The legs are for landing, the parachute for the descent | Propulsive landing needs a throttleable motor |
| D-04 | Stack | Three 110 mm plates (battery, flight computer, telemetry) on four Ø6 mm carbon rods, plus a diamond landing frame | Three modules are enough for the electronics and keep the CG low | More plates raise the CG and add mass |
| D-05 | Power | Two 2S 850 mAh packs side by side in one plate: A for avionics, B for servos | Servo stall current never reaches the flight computer | One pack with two regulators |
| D-06 | Flight computer | Teensy 4.1 + ICM-42688-P + BMP390 | Fast, well documented, SD slot, same in both phases | Any 100 MHz+ MCU with SPI and an SD card |
| D-07 | Phase 1 propulsion | 2306 ≈ 2000 KV + 6×3.5 prop, 4S 1300 mAh | Matches the ≈ Ø250 mm ring of the photographed vehicle | 7″ prop for more vane authority |
| D-08 | Control link (Phase 1) | ExpressLRS 2.4 GHz, CRSF | Low latency, telemetry back-channel | Any RC link with SBUS or CRSF |
| D-09 | Telemetry (Phase 2) | LoRa UART module in the legal band for your region | Range at low power | Any serial radio |
| D-10 | Ignition | Ground ignition controller only | One well-understood ignition path | Onboard ignition needs its own safety case |
| D-11 | Test stand | Fixed thrust stand with deflector and load cell, plus a tilting rig for closed-loop tests | The CAD has a `test-stand` part | A free pivot or tethered stand |
| D-12 | Materials | PETG for the monocopter; PA-CF (or PETG with an aluminium heat shield) for the rocket gimbal and landing frame | Thermal and stiffness reasons | Machined aluminium gimbal |
| D-13 | Landing legs | Four rigid Ø8 mm legs, 34° from vertical, rubber feet, hinged at the landing-frame corners | CAD | Fewer or shorter legs change the tip-over margin |
| D-14 | Gimbal range | ±7° mechanical, ±6.5° software | Typical for small hobby TVC | More range gives more authority and more mechanics |

## How to change a choice

1. Write the decision and the reasoning in your pull request.
2. Update `src/data/spec.js` (geometry), the BOM JSON (parts), the [requirements](01-requirements.md) and the affected design document.
3. Run `npm test`, `npm run bom`, `npm run screenshots`.

## Scope of this design

- Control is by the gimbal only; the rocket has no fins and no roll control.
- The rocket takes no commands in flight.
- Attitude comes from a gyro and accelerometer (Mahony filter) and a barometer; there is no magnetometer.
- A solid motor cannot be throttled or shut down, so the site and the abort logic are chosen for the worst-case ballistic path.
