# CAD files

Put the real CAD here. The source project is the Fusion file `rera-final` (opened read-only in the reference screenshot).

```
hardware/cad/
  rera-final.f3d          Fusion archive (consider Git LFS for files > 50 MB)
  export/                 per-component STEP + STL, named exactly like the CAD browser tree:
    tvc.step  gear36t1.step  gear36t2.step  rods.step  landing-frame.step
    battery-frame1.step  pcb-frame.step  battery-frame2.step  telemetry-frame.step
    landing-gear.step  test-stand.step
  drawings/               PDF drawings (gimbal assembly, stack, legs)
```

How the browser tree maps to the 3D web models and the BOM: [docs/cad-mapping.md](../../docs/cad-mapping.md).

When the CAD changes a dimension, update `src/data/spec.js` too, then run `npm test` and `npm run screenshots`.

Git LFS (optional):

```bash
git lfs install
git lfs track "*.f3d" "*.step"
```
