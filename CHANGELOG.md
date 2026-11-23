# Changelog

## 0.3.0 - MC-1 redesigned for a 10 inch prop

- New MC-1 design: 10 inch pusher prop, 28xx motor on 4S, four posts that are also the legs, prop guard ring, four direct-drive vane servos in cradles, four stator fins, hub plate with the battery, electronics deck. 12 part types (45 printable pieces) with STL files, interference-checked with the vanes at full deflection and in the installation pose.
- ESP32-S3 controller, no IMU: `firmware/monocopter` is now pilot-in-the-loop (`manual_mode.h`, host-tested). Phase 1 docs, BOM, wiring, wizard steps, requirements and the 3D model rewritten.
- Rocket cage arms now have a flat underside (half lap fixed).

## 0.2.0 - printable parts

- 18 printable STL files for the RK-1 rocket (`hardware/cad/stl/rocket`), generated from `scripts/cad/` with the same `src/data/spec.js` as the models.
- `npm run cad` regenerates the STL files, `parts.json` and `docs/cad-parts.md`; `npm run cad:assembly` checks interference at nine gimbal poses; CI checks that the STL files match the source.
- Rods are 400 mm. Pivot hardware is M3 bolts with 683ZZ bearings. Build guide, wizard steps and gimbal design updated to the printed parts.
- Parts page `web/parts.html` with 3D preview and downloads.

## 0.1.0 - baseline

- Repository structure, docs for Phase 1 (monocopter) and Phase 2 (TVC rocket).
- three.js models of both vehicles, interactive viewers, build wizards, PID / gimbal / sizing labs, wiring diagrams.
- BOM as JSON with generated CSV and Markdown.
- Portable firmware core (PID, Mahony AHRS, vane mixer, gimbal map, CRSF parser, flight-state machine) with host tests.
- Teensy 4.1 firmware projects for both vehicles.
