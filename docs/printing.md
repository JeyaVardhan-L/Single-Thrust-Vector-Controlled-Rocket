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

The STL files are in [`hardware/cad/stl/rocket/`](../hardware/cad/stl/rocket/), already in print orientation. The complete table (quantity, size, material, mass, notes) is [cad-parts](cad-parts.md). Summary:

| Part | Qty | Material | Orientation | Notes |
|---|---|---|---|---|
| Stack plates (telemetry, PCB, battery) | 3 | PETG | flat | 110 × 110 × 8 mm; Ø6.2 rod holes with M3 clamp screw and nut slot |
| Landing frame, 133 mm diamond, four hinge clevises | 1 | PA-CF | upside down (ears up) | 208 × 208 mm, heat and impact loads |
| Gimbal mount | 1 | PA-CF or PETG | flat | Four rod bosses, two pivot bolt bores with nylock pockets |
| Gimbal outer ring with 36T sector | 1 | PA-CF or PETG | upside down (sector fin up) | Ream the Ø7 bearing bores |
| Gimbal collar with 36T sector | 1 | PA-CF or PETG | flat | Tube bore Ø42.3, four set screw pockets |
| Pinions 18T, module 1 | 2 | PA12 or machined acetal, or bought metal | flat | Ø4.7 bore for a 25T servo spline; keep spares |
| Servo brackets | 2 | PA-CF or PETG | on the plate face | 23 × 12 mm servo window |
| Motor plates (upper with tube socket, lower) | 2 | PA-CF or PETG | flat | Motor pattern Ø19 |
| Cage arms, struts, guard arcs | 6 + 3 + 3 | PA-CF or PETG | flat (struts standing) | Arms lap onto the plate stubs |
| Leg hinge fittings, brace clips | 4 + 4 | PA-CF / PETG | flat | Ø8.2 socket for the carbon leg |

Filament: see the mass column in [cad-parts](cad-parts.md). The model parameters for every dimension are in `src/data/spec.js` and `scripts/cad/rocket.mjs`.

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
| Ø2 mm hinge shaft (monocopter vanes) | free spin | Ø2.2 mm |
| M3 pivot / hinge bolt (rocket) | close fit | Ø3.2 mm |
| Ø8 mm carbon leg in its socket | glued | Ø8.2 mm |
| Ø42 mm carbon tube in collar / socket | clearance | Ø42.3 mm |
| Gear centre distance (module 1, 18T + 36T) | 27.0 mm | 27.1 mm slot, adjustable |

Print a **calibration coupon** with these holes first and measure it.
