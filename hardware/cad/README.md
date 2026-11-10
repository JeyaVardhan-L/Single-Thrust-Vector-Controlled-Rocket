# CAD files

Everything needed to print the RK-1 rocket is in this repository, ready to slice.

```
hardware/cad/
  stl/rocket/        18 binary STL files, millimetres, already in print orientation
  parts.json         manifest: part, quantity, material, BOM line, size, volume
  README.md          this file
```

The list with quantities, sizes, materials and notes for each part is **[docs/cad-parts.md](../../docs/cad-parts.md)**. You can also browse and download the parts, with a 3D preview, on the website page [web/parts.html](../../web/parts.html).

## What you get

| Group | Parts |
|---|---|
| Stack | three plates (telemetry, flight computer, batteries) with rod clamps |
| Landing | diamond landing frame with four hinge clevises, four leg hinge fittings, four brace clips |
| Gimbal | mount, outer ring with its 36T sector, collar with its 36T sector, two 18T pinions, two servo brackets |
| Propulsion cage | upper and lower motor plates, six arms, three struts, three guard-ring arcs |

The smallest bed that fits every part is **220 × 220 mm**. Each file sits on z = 0 in the orientation it should be printed.

## Dimensions and fits

* Units are millimetres. Holes are modelled at print size: Ø6.2 for the Ø6 rods, Ø3.4 for M3 screws, Ø3.2 for the pivot bolts and hinge bolts, Ø4.2 for M3 heat-set inserts, Ø7.0 for the 683ZZ bearings, Ø8.2 for the Ø8 legs, Ø42.3 for the Ø42 tube. Tune them for your printer with a calibration coupon ([printing guide](../../docs/printing.md)).
* The geometry comes from [`src/data/spec.js`](../../src/data/spec.js) and the constants in [`scripts/cad/rocket.mjs`](../../scripts/cad/rocket.mjs), the same numbers the 3D models and the docs quote.
* `npm run cad:assembly` places every part in the rocket, including the rods, the tube, the servos, the legs and the motors, and measures the volume shared by each pair at nine gimbal poses up to ±7° on both axes. The result is no interference at any pose, including the gear meshes.

## Regenerate or change a part

The parts are parametric. Edit the dimension, regenerate, and everything stays consistent:

```bash
npm install
npm run cad            # rewrites the STL files, parts.json and docs/cad-parts.md
npm run cad:assembly   # interference check at nine gimbal poses
npm test               # includes checks on every STL
```

If you change a dimension that appears in the models, update `src/data/spec.js` first, then run `npm test` and `npm run screenshots`.

## Using your own CAD

If you model the vehicle in Fusion, Onshape or FreeCAD, put exports next to these files (STEP for archive, STL for printing) and keep the part names from [cad-mapping](../../docs/cad-mapping.md). Large archives (`*.f3d`, `*.step`) work well with Git LFS:

```bash
git lfs install
git lfs track "*.f3d" "*.step"
```
