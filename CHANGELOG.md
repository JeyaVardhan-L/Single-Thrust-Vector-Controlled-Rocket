# Changelog

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
