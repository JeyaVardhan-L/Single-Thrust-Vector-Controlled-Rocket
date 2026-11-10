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

## Replacing the procedural model with real CAD

1. Export from Fusion: STEP for archive, STL or glTF per component into `hardware/cad/export/` using the same names as the first column.
2. Convert to glTF if needed (`.glb` loads faster).
3. In `src/models/rocket.js`, replace a part's procedural group by a loaded glTF (GLTFLoader is available in three.js examples; vendor it like OrbitControls), keeping the same `parts.add(id, group, meta)` call so the viewer, explode and wizard keep working.
4. Keep `spec.js` values consistent with the CAD parameters (dimensions in mm), or generate `spec.js` from a CAD parameter export.

## File naming for CAD artefacts

```
hardware/cad/
  rera-final.f3d            Fusion archive (large: consider Git LFS)
  export/
    tvc.step  tvc.stl
    gear36t1.step ...
  drawings/
    gimbal-assembly.pdf
```
