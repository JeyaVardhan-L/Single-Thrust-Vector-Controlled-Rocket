# Phase 2 build guide: RK-1 TVC rocket

Interactive version with each step highlighted on the model: **[web/assembly.html?model=rocket](../../web/assembly.html?model=rocket)**.

![Build wizard](../../assets/screenshots/ui-assembly.png)

**Before you start:** read [safety](../safety.md). **Propellers stay off** for every step until the thrust stand: disconnect the motor leads from the ESCs whenever you work on software or wiring. Powered Phase 2 tests need Gate 3 (Phase 1 exit).

Tools: those of [Phase 1](../phase1-monocopter/03-build-guide.md) plus a dial indicator or phone angle app, M3 tap, 6 mm reamer, small files, thread-lock, CA glue, a scale, a prop balancer.

## Step 1: Print and prepare

| Do | Check |
|---|---|
| Print per [printing](../printing.md): 3 stack plates (PETG/PA-CF), the diamond landing frame (PA-CF), gimbal parts (PA-CF or machined Al), gear sectors/pinions, cage plates and brackets | Weights vs BOM ±10 % |
| Cut four Ø6 mm carbon rods to 425 mm; deburr; seal ends with thin CA (gloves and a mask when cutting carbon) | Rods straight, equal length ±0.5 mm |
| Install M3 heat-set inserts in all brackets and bosses | Flush, square |
| Ream/drill rod holes to Ø6.2 mm if tight | Rod slides through every boss by hand |

## Step 2: Gimbal mechanics (`tvc`)

1. Press 683ZZ bearings into the four pin bosses (outer ring X pins ×2 in the mount, Z pins ×2 in the outer ring).
2. Assemble: fixed mount → X pins → outer ring → Z pins → inner collar. Use Ø3 hardened pins with E-clips or locknuts, with 0.1 mm shim washers to remove play.
3. Mount the fixed square on the four rods at the **gimbal height**: pivot centre 150 mm above the ground plane (rods stand on a flat table as a datum).

**Check:** each axis swings through ±7° freely; axial and radial play < 0.3° (dial indicator at the collar, 100 mm from the pivot: < 0.5 mm).

## Step 3: Gear stages (`gear36t1`, `gear36t2`)

1. Fit the 36T sector on each pivot pin end; set the sector arc centred downward at mid-travel.
2. Fit the 18T pinion on each servo horn/spline; mount the servo so the **centre distance is 27.0 mm** (module 1: pitch radii 18 and 9 mm).
3. Axis 1 servo bolts to the fixed mount. **Axis 2 servo rides on the outer ring** (cable service loop, strain-relieved: it moves ±7° with axis 1).
4. Centre each servo at 1500 µs **before** meshing the gears; mesh with the mount tube exactly vertical (square on two sides).
5. Backlash: a sheet of 80 g paper between teeth is about right; lock the servo bracket.

**Check:** servo ±14° ↔ gimbal ±7°; gears do not skip at full deflection by hand; no rubbing against the legs/braces.

## Step 4: Motor assembly (`motor`), props OFF

1. Clamp the Ø42 mm carbon mount tube in the inner collar (clamp screws only: **do not glue**).
2. Bolt motor A under the upper plate (shaft down) and motor B on the lower plate (shaft up). The three cage struts run outside the 114 mm prop radius from the upper plate to the lower plate; the guard ring ties them together.
3. Mount the two ESCs on the tube. Solder motor leads (short, twisted). Fit 1000 µF capacitors at the power board.
4. **Do not fit the propellers.** Balance them on a prop balancer now (sand the heavy blade or tape the light one) and put them in a labelled bag. Both props must blow air **downward**: the upper prop sits below its motor, so it is a **pusher** type; the lower prop sits above its motor, so it is a **standard** type. Order them with the rotation directions of step 5.
5. Set motor directions in the ESC configurator with the props off: motor A turns the prop clockwise seen from above, motor B counter-clockwise.

**Check:** the assembly swings ±7° in both axes with ≥ 5 mm clearance to every part (landing frame, braces, legs); both shafts spin freely by hand.

## Step 5: Landing frame and legs (`landing-frame`, `landing-gear`)

1. Slide the diamond landing frame onto the rods at 238 mm and lock it with the nuts above and below each boss. Its four corners point along the leg axes.
2. Hinge the four legs on the corner lugs (hinge radius 94 mm); fit rubber feet.
3. Fit the 1.6 mm braces from the gimbal mount to each leg midpoint.

**Check:** the footprint is level within 2 mm; the vehicle stands upright; push test: no tipping up to ≈ 30° of lean.

## Step 6: Stack plates (`battery-frame`, `pcb-frame`, `telemetry-frame`)

Install bottom-up and lock each plate with the nuts above and below each rod boss:

| Plate | Centre height | Contents |
|---|---|---|
| battery-frame | 322 mm | 6S 1500 mAh main pack and 2S 450 mAh avionics pack side by side under a Velcro strap |
| pcb-frame | 406 mm | Flight computer: Teensy 4.1, IMU, baro, servo BEC, 5 V regulator, fuse, RBF pin, arm switch |
| telemetry-frame | 490 mm | ELRS receiver, GPS puck, whip antenna, buzzer / LEDs |

1. Build the flight-computer board per [04-wiring](04-wiring.md). Mount on brass standoffs with silicone grommets, IMU near the stack axis.
2. Wire the main pack → RBF pin / arm → power board → ESCs and servo BEC; the avionics pack → 5 V regulator → logic. **One ground star point.**
3. Route servo and ESC cables along a rod with zip ties; leave the axis 2 service loop.
4. Antenna vertical, ≥ 20 mm from carbon rods; GPS puck on top.

**Check:** with the RBF pin inserted nothing powers up; with the pin out and the arm switch off, only logic is alive: ESC outputs idle, servos centred (SAFE state).

## Step 7: Mass and balance

1. Weigh the vehicle without props: compare with the BOM (≈ 1.06 kg).
2. Find the CG (hang on two cords): expect ≈ 243 mm above the ground. Lateral CG offset ≤ 3 mm (move the packs).
3. Update `L` (CG − 150 mm) and estimate `I` (bifilar pendulum or the CAD): put both in the PID lab and the gimbal lab.

## Step 8: Firmware and Gate A

Flash [`firmware/rocket`](../../firmware/rocket/) and run the **sign checks and gimbal calibration** in [06-firmware-and-gnc](06-firmware-and-gnc.md) and [05-gimbal-design](05-gimbal-design.md) (Gate A), props off. Then the stand procedures in [07-test-stand-procedure](07-test-stand-procedure.md).

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Gimbal sticks mid-travel | Pin pre-load too high; printed bosses out of round |
| Gears clatter | Centre distance too large; add preload or reduce to 27.0 mm |
| One axis moves the wrong way | Servo mirrored: set `GimbalMap.sign = -1` for that axis, then repeat the sign check |
| IMU shows tilt on a level vehicle | Board not square to the stack axis or bad gyro bias: recalibrate at rest |
| Servos reset the flight computer | Servo BEC on the avionics pack, weak ground, no fuse or capacitor |
| One motor spins the wrong way | Swap two motor leads or reverse it in the ESC configurator, then repeat the direction check |
| Vehicle spins on the stand | Spin gain sign wrong, or thrust of the two motors unequal: check the sign in the log and trim the lower motor |
| Cage hits the landing frame | Mount tube not centred in the collar |
