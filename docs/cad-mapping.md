# CAD ↔ model ↔ BOM mapping

The source CAD is a Fusion project named `rera-final` ("Read-only file" banner, so changes are not saved). Its browser tree, as visible in the screenshot, and how this repository represents each item:

| CAD component | three.js part id | Model file | BOM lines | What it is |
|---|---|---|---|---|
| `tvc:1` | `tvc` | `src/models/rocket.js` | G-01, G-04, G-06 | Gimbal mount, outer ring, inner collar, pins, bearings |
| `gear36t1:1` | `gear36t1` | `rocket.js` | G-02, G-03 | 36-tooth gear sector + 18T pinion + servo for axis 1 |
| `gear36t2:1` | `gear36t2` | `rocket.js` | G-02, G-03, G-05 | Same for axis 2, riding on the outer ring |
| `rods:1` | `rods` | `rocket.js` | R-01 | Four Ø6 mm rods |
| `landing-frame:1` | `landing-frame` | `rocket.js` | R-03 | Diamond plate with four corner hinge lugs |
| `battery-frame1:1`, `battery-frame2:1` | `battery-frame` | `rocket.js` | E-01, E-02, R-02 | One plate carrying both packs (A white tag, B orange tag) |
| `pcb-frame:1` | `pcb-frame` | `rocket.js` | A-01..A-09, E-03..E-05, R-02 | Flight-computer board frame |
| `telemetry-frame:1` | `telemetry-frame` | `rocket.js` | A-04, A-05, A-06, R-02 | ELRS receiver, GPS, antenna |
| `landing-gear:1` | `landing-gear` | `rocket.js` | R-04, R-05 | Four legs, feet, braces |
| `test-stand:1` | `test-stand` | `rocket.js` | T-01 | Base, column, load cell, cradle |
| *(motor assembly)* | `motor` | `rocket.js` | M-01..M-06 | Coaxial brushless pair, props, cage, ESCs |

The monocopter parts are:

| three.js part id | What it is | BOM lines |
|---|---|---|
| `frame-ring` | Guard ring, spokes, hub plate | F-01..F-03 |
| `legs` | Three landing legs | F-01 |
| `vane-deck` | Deck ring, hinge shafts, straighteners | F-01, S-03 |
| `vanes` | Four control vanes | F-01, S-03 |
| `servos` | Four servos | S-01, F-04 |
| `motor` | 2306 motor | P-01 |
| `prop` | Propeller | P-03 |
| `esc` | ESC | P-04 |
| `fc` | Flight-computer stack, BECs, sensors | A-01..A-07, E-02, E-03, E-06 |
| `battery` | LiPo and strap | E-01, F-05 |
| `wiring` | Power and motor wiring | E-04, E-05, F-06 |

## How the models were derived

- **Rocket:** reproduced from the CAD screenshot: four rods on the diagonals; three square stack plates above a diamond-shaped landing frame whose corners carry the hinge lugs; gimbal at the bottom with gear sectors; four legs splayed with thin braces; a central test-stand column below the nozzle. Dimensions follow standard parts and the proportions of the screenshot; the choices are listed in [design choices](design-choices.md).
- **Monocopter:** reproduced from the photograph: guard ring, central motor with the propeller *below* it pushing air down, a lower deck with four servos and orange vanes, three legs, battery on top with a strap, LEDs around the ring.

## Printable files per CAD component

The printable STL files are in [`hardware/cad/stl/rocket/`](../hardware/cad/stl/rocket/); the full list is [cad-parts](cad-parts.md).

| CAD component | STL files |
|---|---|
| `tvc` | `gimbal-mount`, `gimbal-ring`, `gimbal-collar` |
| `gear36t1`, `gear36t2` | the 36T sectors are part of `gimbal-ring` and `gimbal-collar`; `pinion-18t` (×2), `servo-bracket-1`, `servo-bracket-2` |
| `landing-frame` | `landing-frame` |
| `battery-frame`, `pcb-frame`, `telemetry-frame` | `stack-plate-battery`, `stack-plate-pcb`, `stack-plate-telemetry` |
| `landing-gear` | `leg-hinge` (×4), `leg-clip` (×4); the legs are Ø8 × 260 mm carbon rod |
| `rods` | bought: Ø6 × 400 mm carbon rod |
| `test-stand` | fabricated from sheet and bar stock (see the test stand procedure) |
| *(motor assembly)* | `motor-plate-upper`, `motor-plate-lower`, `cage-arm-upper` (×3), `cage-arm-lower` (×3), `cage-strut` (×3), `guard-arc` (×3) |

## Printable geometry and the web models

The web models in `src/models/` are visual models. The STL files are generated from [`scripts/cad/`](../scripts/cad/), which uses the same `src/data/spec.js`. To show the exact printable geometry in the viewer, load an STL into a Parts entry (a small binary STL reader is enough, see [`web/parts.html`](../web/parts.html)) and keep the same `parts.add(id, group, meta)` call so the viewer, explode and wizard keep working.

If you model the vehicle in your own CAD, export STEP for archive and STL for printing into `hardware/cad/` and keep the part names from the table above. Keep the dimensions in `src/data/spec.js` consistent with your CAD.
