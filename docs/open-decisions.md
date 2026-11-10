# Open decisions and assumptions

This baseline was built from one CAD screenshot (browser tree + viewport) and one photograph of a vane-controlled monocopter. Everything that was **not** visible there is an assumption, listed here so you can confirm or change it. When you decide, update `src/data/spec.js`, the BOM, and the docs that quote it, then mark the row **Decided**.

| ID | Topic | Baseline assumption | Why | Effect if you change it | Status |
|---|---|---|---|---|---|
| D-01 | **Propulsion** | One certified 29 mm composite solid motor in a 32 mm tube. **F class (≈ 30 N·s) for the first static fires and flights; G class (≈ 100 N·s) only after Gate E** | Solid motors are the common choice for a first TVC rocket; the CAD has a central tube and no throttle mechanism visible | Changes thrust, burn time, tube size, heat shield, safety rules, gimbal torque. EDF or hybrid would need new mass/CG/thermal and a throttle strategy | **Open** |
| D-02 | Gimbal gear ratio | 18T pinion → 36T sector (2:1), module 1, from the CAD names `gear36t1/2` | The "36t" in the names; pinion size not visible | Servo travel, resolution, speed, torque | **Assumption** |
| D-03 | **Recovery** | Parachute 24-36″ released by a servo or e-match at apogee | The CAD shows legs and a stand but no recovery system | Adds a hatch/tube section above the telemetry frame; mass; if you plan propulsive landing instead, this changes the whole Phase 2 scope | **Open** |
| D-04 | Frame size and rods | 110 mm square frames, four Ø6 mm carbon rods, 80 mm pitch | Scaled from the screenshot | Mass, stiffness, buckling margin | **Assumption** |
| D-05 | Power architecture | Two 2S 850 mAh packs: A for avionics, B for servos | Two battery frames in the CAD (`battery-frame1/2`) | Alternative: one pack + two regulators | **Assumption** |
| D-06 | Flight computer | Teensy 4.1 + ICM-42688-P + BMP390 | Fast, well documented, SD slot, same in both phases | Pin map, drivers, library choices | **Baseline** |
| D-07 | Phase 1 propulsion | 2306 ≈ 2000 KV + 6×3.5 prop, 4S 1300 mAh | Matches the size of the photographed vehicle (≈ Ø250 mm ring) | Thrust, vane authority | **Baseline** |
| D-08 | Control link (Phase 1) | ExpressLRS 2.4 GHz CRSF | Low latency, telemetry back-channel | Different receiver and parser | **Baseline** |
| D-09 | Telemetry (Phase 2) | LoRa UART module in a legal band for your region | Range at low power | Antenna, module, band | **Open (region)** |
| D-10 | Ignition | Ground ignition controller only | Safer and simpler | Onboard ignition would need its own safety case | **Decided (safety)** |
| D-11 | Test stand type | Fixed thrust stand with deflector and load cell | The CAD has a `test-stand` part; type not visible | A free pivot / tethered stand would test closed-loop with attitude motion | **Open** |
| D-12 | Materials | PETG for the monocopter; PA-CF (or PETG + aluminium heat shield) for the rocket gimbal and landing frame | Thermal and stiffness reasons | Print settings, mass | **Baseline** |
| D-13 | Landing legs | Four rigid legs Ø8 mm, 34° from vertical, rubber feet | CAD | Tip-over margin, mass | **Assumption** |
| D-14 | Gimbal range | ±7° mechanical, ±6.5° software | Typical for small hobby TVC | More range = more authority but more mechanical complexity | **Baseline** |

## How to resolve a decision

1. Write the decision and the reasoning in a short note in `docs/decisions/` (create the folder) or in your pull request.
2. Update `src/data/spec.js` (if geometry), the BOM JSON (if parts), the requirements ([01-requirements.md](01-requirements.md)), and the affected design document.
3. Run `npm test`, `npm run bom`, `npm run screenshots`.
4. Change the Status column here to **Decided** and link the note.

## Things deliberately **not** in the baseline

- Propulsive landing of a solid-motor rocket (not possible: no throttle).
- Active aerodynamic stabilisation (fins). The rocket is controlled by the gimbal only. Aerodynamic stability on ascent will be assessed with OpenRocket in [design](phase2-rocket/01-design.md).
- Magnetometer, GPS-aided guidance, state estimation beyond a Mahony filter and a barometer.
- Over-the-air commands to the rocket during flight.
