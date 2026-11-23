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

The STL files are in [`hardware/cad/stl/monocopter/`](../hardware/cad/stl/monocopter/), already in print orientation; the full table (quantity, size, material, mass, hardware) is [monocopter printable parts](phase1-monocopter/printable-parts.md) (zip: [mc1-monocopter-stl.zip](../hardware/cad/mc1-monocopter-stl.zip)). A 220 × 220 mm bed is enough. Summary:

| Part | Qty | Material | Orientation | Notes |
|---|---|---|---|---|
| Hub plate | 1 | PETG | flat | Motor patterns 16 × 16 and 19 × 19, battery strap slots, four arm stubs |
| Electronics deck | 1 | PETG | flat | Zip-tie slots, antenna hole |
| Arms | 4 | PETG | flat | Half lap under the plate stub |
| Posts / legs | 4 | PETG | on the side | Seven M3 inserts each; 165 mm long |
| Servo cradles | 4 | PETG | on the side | 23 × 12 mm servo window, ear pocket |
| Lower ring half-arcs | 8 | PETG | flat | Four are used turned over (mirror image) |
| Guard arcs | 4 | PETG | flat | 90°, 13 mm outside the prop tips |
| Lower hub | 1 | PETG | standing | Four Ø3.3 rod bores, four stator slots |
| Stator fins | 4 | PETG | flat | 2.4 mm thick |
| Control vanes | 6 | PETG, **100 % infill** | flat | Four fitted plus two spares; epoxy a Ø3 rod through each |
| Horn adapters | 4 | PETG | flat | Four M2 x 10 into the servo horn |
| Foot caps | 4 | TPU 95A | flat | Slip over the post bottoms |

Filament: see the mass column in [printable parts](phase1-monocopter/printable-parts.md) (the parts list uses 65 % of the solid mass). Print time: 35 to 45 h on a 0.4 mm nozzle.

## Print list: RK-1 rocket

The STL files are in [`hardware/cad/stl/rocket/`](../hardware/cad/stl/rocket/), already in print orientation. The complete table (quantity, size, material, mass, notes) is [rocket printable parts](phase2-rocket/printable-parts.md) (zip: [rk1-rocket-stl.zip](../hardware/cad/rk1-rocket-stl.zip)). Summary:

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

Filament: see the mass column in [printable parts](phase2-rocket/printable-parts.md). The model parameters for every dimension are in `src/data/spec.js` and `scripts/cad/rocket.mjs`.

## Post-processing

1. Remove supports, brims and elephant foot; deburr all holes with a 3 mm drill by hand.
2. Install M3 brass heat-set inserts with a soldering iron (≈ 220 °C for PETG, ≈ 250 °C for PA), pressing straight until flush.
3. Test fit every M3 screw in every hole before assembly.
4. Check flatness of the frames on a table; sand high spots.
5. Inspect: no layer separation, no stringing in holes, no warping > 0.5 mm.
6. Weigh each part and write the mass on it; update the parts list if it differs from the listed value by more than 10 %.

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
