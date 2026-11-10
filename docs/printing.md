# 3D printing guide

Printed parts are **structure**, not decoration. Print them well, inspect them, and replace any part that shows layer splits.

## Materials

| Material | Use | Notes |
|---|---|---|
| **PETG** | Monocopter ring, hub, deck, battery tray; rocket stack plates | Tough, tolerant of vibration, ≈ 75 °C softening: **keep away from the exhaust** |
| **PA-CF / PA12-CF (nylon + carbon)** | Rocket landing frame, gimbal parts | Stiff, heat-resistant to ≈ 120 °C+. Dry the filament; print with hardened nozzle |
| **TPU 95A** | Monocopter legs and foot caps (optional) | Absorbs landing shocks |
| **PLA** | Test fits and jigs only | Creeps and softens in a hot car. Do not use on flight hardware |
| **Aluminium 6061 (machined)** | Gimbal ring option | Stiffer and wear-resistant; an option if printed gimbal parts show wear |

## Baseline print settings

| Setting | Structural parts | Vanes / thin parts |
|---|---|---|
| Layer height | 0.2 mm | 0.15 mm |
| Perimeters (walls) | 4 | 3 |
| Top / bottom layers | 5 | 4 |
| Infill | 30 to 40 % gyroid | 100 % (vanes are 2.4 mm thick) |
| Nozzle | 0.4 mm (hardened for CF) | 0.4 mm |
| Cooling | PETG 50 %, PA-CF 20 % | same |
| Seam | aligned at an unloaded corner | same |
| Orientation | See table below | flat, chord vertical |

Strength is strongest **along** the layer lines and weakest **between** layers. Orient parts so the main load runs along layers.

## Print list: MC-1 monocopter

| Part | Qty | Material | Orientation | Notes |
|---|---|---|---|---|
| Guard ring + hub plate (split in 2-4 segments if needed) | 1 | PETG | flat | Join with M3 + pin joints |
| Vane deck ring | 1 | PETG | flat | |
| Hinge shaft holders / hub centre | 1 | PETG | flat | |
| Flow straightening fins (diagonal) | 4 | PETG | on edge | 2 mm thick |
| Vanes 62 × 46 × 2.4 | 4 + 2 spare | PETG | flat | 100 % infill; trailing edge toward the print bed |
| Servo mounts | 4 | PETG | flat | M2 inserts |
| Legs | 3 | PETG or TPU | on edge, along the length | Curved: print with supports off the foot |
| FC stack standoffs / tray | 1 | PETG | flat | |
| Battery tray | 1 | PETG | flat | |

Filament: ≈ 105 g (BOM F-01). Print time: 8-10 h total on a 0.4 mm nozzle.

## Print list: RK-1 rocket

| Part | Qty | Material | Orientation | Notes |
|---|---|---|---|---|
| Stack plates (telemetry, PCB, battery) | 3 | PETG / PA-CF | flat | 110 × 110 × 4 mm, rod bosses, lightening holes |
| Landing frame: 133 mm diamond with 4 corner hinge lugs | 1 | PA-CF | flat | Heat and impact loads |
| Gimbal fixed mount | 1 | PA-CF | flat | Four rod bosses |
| Gimbal outer ring | 1 | PA-CF or Al | flat | Ø60 mm ring with 4 pin bosses |
| Gimbal inner collar | 1 | PA-CF or Al | vertical | Grips the Ø42 mm mount tube |
| Gear sectors 36T, module 1 | 2 | PA12 or machined acetal | flat | Check backlash. Printed gears wear; keep spares |
| Pinions 18T, module 1 | 2 | Printed PA or bought metal | flat | Match the servo spline; metal pinions preferred |
| Servo brackets | 2 | PA-CF | flat | |
| Leg hinges and brackets | 4 | PA-CF | flat | |
| Battery straps tabs / avionics standoffs | misc | PETG | flat | |
| Motor cage plates (upper and lower) + 3 struts + guard ring segments | 1 set | PA-CF or PETG | flat | Prop radius 114 mm, cage radius 123 mm |

Filament: ≈ 180 g. The model parameters for every dimension are in `src/data/spec.js`.

## Post-processing

1. Remove supports, brims and elephant foot; deburr all holes with a 3 mm drill by hand.
2. Install M3 brass heat-set inserts with a soldering iron (≈ 220 °C for PETG, ≈ 250 °C for PA), pressing straight until flush.
3. Test fit every M3 screw in every hole before assembly.
4. Check flatness of the frames on a table; sand high spots.
5. Inspect: no layer separation, no stringing in holes, no warping > 0.5 mm.
6. Weigh each part and write the mass on it; update the BOM if it differs from the BOM value by more than 10 %.

## Tolerances (starting values, tune per printer)

| Feature | Design | Print as |
|---|---|---|
| Ø6 mm rod through collar | clearance fit | Ø6.2 mm hole |
| M3 clearance hole | | Ø3.4 mm |
| M3 heat-set insert (5.7 mm long) | | Ø4.2 mm hole, 6 mm deep |
| M2 self-tap in servo mount | | Ø1.7 mm |
| 683ZZ bearing (3×7×3) | press fit | Ø7.0 mm, test print first |
| Ø2 mm hinge shaft | free spin | Ø2.2 mm |
| Gear centre distance (module 1, 18T + 36T) | 27.0 mm | 27.1 mm slot, adjustable |

Print a **calibration coupon** with these holes first and measure it.
