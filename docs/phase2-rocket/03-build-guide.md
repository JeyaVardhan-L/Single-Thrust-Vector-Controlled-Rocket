# Phase 2 build guide: RK-1 TVC rocket

Interactive version with each step highlighted on the model: **[web/assembly.html?model=rocket](../../web/assembly.html?model=rocket)**.

![Build wizard](../../assets/screenshots/ui-assembly.png)

**Before you start:** read [safety](../safety.md). Phase 2 powered tests need Gate 3 (Phase 1 exit). Mechanical build can proceed earlier. **No live motor and no igniter in the vehicle at any point of this guide.** Use an inert dummy motor casing (same mass) for all mechanical checks.

Tools: those of [Phase 1](../phase1-monocopter/03-build-guide.md) plus a dial indicator or phone angle app, M3 tap, 6 mm reamer or drill, small files, thread-lock, CA glue, a scale.

## Step 1: Print and prepare

| Do | Check |
|---|---|
| Print per [printing](../printing.md): 4 stack frames (PETG/PA-CF), landing frame (PA-CF), gimbal parts (PA-CF or machined Al), gear sectors/pinions, brackets | Weights vs BOM ±10 % |
| Cut four Ø6 mm carbon rods to 490 mm; deburr; seal ends with thin CA (wear gloves and a mask when cutting carbon) | Rods straight, equal length ±0.5 mm |
| Install M3 heat-set inserts in all corner collars and brackets | Flush, square |
| Ream/drill rod holes to Ø6.2 mm if tight | Rod slides through every collar by hand |

## Step 2: Gimbal mechanics (`tvc`)

1. Press 683ZZ bearings into the four pin bosses (outer ring X pins ×2 in the mount, Z pins ×2 in the outer ring).
2. Assemble: fixed mount → X pins → outer ring → Z pins → inner collar. Use Ø3 hardened pins with E-clips or locknuts, with 0.1 mm shim washers to remove play.
3. Mount the fixed square on the four rods at the **gimbal height**: pivot centre 150 mm above the ground plane (rods stand on a flat table as a datum).

**Check:** each axis swings through ±7° freely; axial and radial play < 0.3° (dial indicator at the motor-tube end, 100 mm from the pivot: < 0.5 mm).

## Step 3: Gear stages (`gear36t1`, `gear36t2`)

1. Fit the 36T sector on each pivot pin end; set the sector arc centred downward at mid-travel.
2. Fit the 18T pinion on each servo horn/spline; mount the servo so the **centre distance is 27.0 mm** (module 1: pitch radii 18 and 9 mm).
3. Axis 1 servo bolts to the fixed mount. **Axis 2 servo rides on the outer ring** (cable service loop, strain-relieved: it moves ±7° with axis 1).
4. Centre each servo at 1500 µs **before** meshing the gears; mesh with the motor tube exactly vertical (use a square on two sides).
5. Backlash: a sheet of 80 g paper between teeth is about right; lock the servo bracket.

**Check:** servo ±14° ↔ gimbal ±7°; gears do not skip at full deflection by hand; no rubbing against the legs/braces.

## Step 4: Motor tube and heat shield (`motor`)

1. Clamp the Ø32 mm G10/phenolic tube in the inner collar (clamp screws only: **do not glue**).
2. Fit the heat-shield disc and thermal liner at the nozzle end; retainer clip at the aft end.
3. Insert the **inert dummy casing** for fit checks.

**Check:** tube swings ±7° in both axes with ≥ 5 mm clearance everywhere (landing-frame opening, braces, legs); nozzle exit ≥ 50 mm clear of any part.

## Step 5: Landing frame and legs (`landing-frame`, `landing-gear`)

1. Slide the landing frame on the rods at 238 mm (centre height) and lock it with the collar screws.
2. Hinge the four legs on the hinge arms (hinge radius 70 mm); fit rubber feet.
3. Fit the 1.6 mm braces from the gimbal mount to each leg midpoint.

**Check:** the footprint is level within 2 mm; the vehicle stands upright; push test: no tipping up to ≈ 30° of lean.

## Step 6: Stack frames (`battery-frame1`, `pcb-frame`, `battery-frame2`, `telemetry-frame`)

Install bottom-up and lock each to the rods:

| Frame | Centre height | Contents |
|---|---|---|
| battery-frame1 | 322 mm | 2S 850 mAh pack A (avionics) |
| pcb-frame | 404 mm | Flight computer: Teensy 4.1, IMU, baro, pyro driver, regulator, fuse, RBF, arm switch |
| battery-frame2 | 486 mm | 2S 850 mAh pack B (servos) |
| telemetry-frame | 568 mm | LoRa radio, GPS puck, whip antenna, buzzer / LED |

1. Build the flight-computer board per [04-wiring](04-wiring.md). Mount on silicone grommets with the IMU near the stack axis.
2. Wire pack B → 5 A fuse → servo rail; pack A → RBF/arm → 5 V regulator → logic. **One ground star point.**
3. Route servo cables along a rod with zip ties; leave the axis 2 service loop.
4. Antenna vertical, ≥ 20 mm from carbon rods; GPS puck on top of the telemetry frame.

**Check:** with the RBF pin inserted nothing powers up; with the pin out and the arm switch off, only logic is alive and the servos are not driven (SAFE state).

## Step 7: Mass and balance

1. Weigh the vehicle with the dummy motor. Compare with the BOM (952 g with a G reload; F class ≈ 55 g less).
2. Find the CG (hang on two cords): expect ≈ 280 mm above the ground. Lateral CG offset ≤ 3 mm.
3. Update `L` (CG − 150 mm) and estimate `I` (bifilar pendulum or the CAD): put both in the PID lab and the gimbal lab.

## Step 8: Firmware and Gate A

Flash [`firmware/rocket`](../../firmware/rocket/) and run the **sign checks and gimbal calibration** in [06-firmware-and-gnc](06-firmware-and-gnc.md) and [05-gimbal-design](05-gimbal-design.md) (Gate A). Then the stand procedures in [07-test-stand-procedure](07-test-stand-procedure.md).

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Gimbal sticks mid-travel | Pin pre-load too high; printed bosses out of round |
| Gears clatter | Centre distance too large; add preload or reduce to 27.0 mm |
| One axis moves the wrong way | Servo mirrored: set `GimbalMap.sign = -1` for that axis, then repeat the sign check |
| IMU shows tilt on a level vehicle | Board not square to the stack axis or bad gyro bias: recalibrate at rest |
| Servo resets the flight computer | Pack B wired through the logic regulator, weak ground, no fuse/cap |
| Tube hits the landing frame | Frame opening too small or the tube is not centred in the collar |
