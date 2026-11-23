# Changelog

## 0.4.0 - phone control, stronger frame, themes

- **Phone control for MC-1.** The ESP32-S3 makes its own Wi-Fi network (`MC1-FLY`) and serves a web page: throttle that always ramps (0.30 per second up, 0.60 per second down), climb and descend buttons with three rates, Hover and Land, a direction wheel that maps to the right vane servos, yaw, hold-to-arm, kill, throttle limit, trims. Flight logic in `firmware/lib/tvc_core/phone_mode.h` with host tests; the page is checked against the C++ mapping; `scripts/gen-webui.mjs` embeds it in the firmware. A demo of the same page is on the site (`web/control.html`). No radio receiver on MC-1 any more.
- **Stronger MC-1 structure.** Posts 12 x 24 mm (twice the bending strength), T-section arms with an 11 mm rib and a 12 x 24 pad with two screws, three screws per arm at the hub plate, 3.0 mm stators, wider foot caps. Interference check still clean. Mass about 892 g.
- **Two separate STL sets** (monocopter first, rocket second) with one zip each, per-vehicle printable-parts docs, and a vehicle switch on the parts page and the build wizard.
- **Dark mode** (black and orange) with a switch in the header; every page, canvas and 3D view follows it.
- Viewers frame the whole model for any window shape; the part-info box no longer covers the controls heading.
- The bill of materials page and prices are gone; the parts list (what to get, with masses) stays in the docs.

## 0.3.0 - MC-1 redesigned for a 10 inch prop

- New MC-1 design: 10 inch pusher prop, 28xx motor on 4S, four posts that are also the legs, prop guard ring, four direct-drive vane servos in cradles, four stator fins, hub plate with the battery, electronics deck. 12 part types (45 printable pieces) with STL files, interference-checked with the vanes at full deflection and in the installation pose.
- ESP32-S3 controller, no IMU: `firmware/monocopter` is now pilot-in-the-loop (`manual_mode.h`, host-tested). Phase 1 docs, parts list, wiring, wizard steps, requirements and the 3D model rewritten.
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
