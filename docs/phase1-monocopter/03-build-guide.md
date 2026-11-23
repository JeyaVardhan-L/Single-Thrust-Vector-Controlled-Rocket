# Phase 1 build guide: MC-1 monocopter

Interactive version with each step highlighted on the model: **[web/assembly.html?model=monocopter](../../web/assembly.html?model=monocopter)**.

**Before you start:** read [safety](../safety.md). **The propeller stays off** until the thrust stand (Gate 1): keep it in a labelled bag. Disconnect the motor leads from the ESC whenever you work on software.

Tools: M3 and M2 hex drivers, soldering iron (inserts and electronics), side cutters, small files, a 3.2 mm drill, a 2 mm and a 1.5 mm drill, epoxy (5 minute and 30 minute), thread-lock, multimeter, a scale, a protractor or phone angle app, a prop balancer.

All printed parts are in [`hardware/cad/stl/monocopter/`](../../hardware/cad/stl/monocopter/); the list with sizes and hardware counts is [cad-parts](../cad-parts.md). A 220 × 220 mm bed is enough.

## Step 1: Print and prepare

| Do | Check |
|---|---|
| Print every part (PETG; the feet in TPU 95A; the vanes at 100 % infill, the rest 4 walls and 30 % gyroid). Orientation is already in the files | Parts are flat, no layer splits |
| Press M3 heat-set inserts: **7 in each post** (1 in the top end, 2 on the inner face, 4 on the outer face), **4 in each servo cradle** (2 per side) | Inserts flush and square |
| Drill the vane spines, the horn adapters (blind bore) and the hub bores with a 3.2 mm drill if tight; the Ø3 rods must slide without force | A rod slides through the full vane spine |
| Cut four Ø3 rods to 116 mm and deburr | Straight, equal length ±0.5 mm |
| Fit a servo in a cradle window (no screws) | The body slides in; the ears sit flat on the pocket floor |

## Step 2: Hub, stators and posts (`stators`, `posts`)

1. Slide the inner end of each stator into a slot of the lower hub. Fit two M3 × 25 screws through the hub wall and the stator, with the nuts in the pockets on the far side. The stators run on the four diagonals.
2. Stand the four posts against the stator flanges (post inner face to flange) and fit two M3 × 10 screws per post from the inside into the post inserts.

**Check:** the hub is centred; the posts are parallel; opposite posts are 290 mm apart centre to centre (2 × 145); the hub top is about 74 mm below the post tops (hub top at z = 16.5, post top at z = 90).

## Step 3: Cradles and rings (`rings`)

1. Offer each servo cradle to its place on a vane axis (between two posts, window facing the centre, ear pocket facing out) and hold it while you fit the two lower half-arcs on its sides: the tabs go on the **outer** face of the cradle, M3 × 10 into the cradle inserts. Use four half-arcs as printed and four turned over (the mirror image).
2. Fit the other end of each half-arc to the post (tab on the post's outer face, M3 × 10 into the post inserts).
3. Fit the four guard arcs at the upper insert height (M3 × 10, tab on the post outer face).

**Check:** both rings are round and level; the cradle windows face the hub exactly; the lower ring is at the height of the hub's vane bores (z = 0).

## Step 4: Vanes (`vanes`)

1. Epoxy a rod through each vane spine so that 14 mm sticks out of the inner end and 9 mm out of the outer end. Epoxy the outer rod end 5 mm deep into a horn adapter (counterbores facing inward), leaving a 4 mm gap between the spine and the adapter. Keep the vane plate vertical while it cures.
2. Lower each vane assembly **from the top** into the frame, rod tip toward its hub bore. Slide it inward until the rod bottoms in the hub bore. The vane must swing freely: ±25° without touching a stator, the hub or the ring.

**Check:** the vane hangs vertically; the adapter sits 7 mm in front of the cradle plate; no binding.

## Step 5: Servos (`servos`)

1. Centre each servo electrically (1500 µs from a servo tester or the firmware) **before** fitting the horn. Fit a round horn on the spline in the position that puts the vane closest to vertical (the spline has 25 teeth, 14.4 deg per tooth; trim the rest with `trimDeg` in the firmware). Choose the horn arms that line up with the four adapter holes.
2. Slide each servo with its horn into its cradle window from the outside, so that the horn meets the adapter. Fit the two M2 × 6 self-tapping ear screws.
3. From inside the frame, fit four M2 × 10 screws through each adapter (heads in the counterbores) into the horn arms.
4. Label the servo leads **1 front, 2 right, 3 rear, 4 left**. The mixer depends on this order.

**Check:** vane centred = servo centred (vane vertical); no slop between horn and adapter; each vane moves ±25° smoothly by hand with the servo unpowered.

> The wrong vane order is the most common cause of a first-flight flip. Label the leads and do the sign checks in [06-bench-tests](06-bench-tests.md).

## Step 6: Hub plate, arms and motor (`hub-plate`, `motor`)

1. Fit the motor **upside down** under the hub plate: the base against the plate underside, shaft pointing **down**, four M3 × 8 screws with thread-lock from the top into the motor base (use the 16 × 16 or the 19 × 19 mm pattern, whichever your motor has). Pass the three motor wires up through the centre hole.
2. Bolt the four arms to the plate stubs with two M3 × 8 screws and nuts each (the nuts sit in the hexagon holes of the arm). The arms run on the diagonals.
3. Lower the plate with the motor onto the posts (the motor and its bell go between the guard ring and the plate) and fit one M3 × 10 screw per arm tip into the post top inserts.

**Check:** the motor shaft is vertical and on the axis; the bell spins freely; the bottom of the motor bell is 8 mm above the prop plane; the prop would clear the guard ring by 13 mm.

## Step 7: Battery, deck and electronics (`battery`, `electronics`)

1. Fit the four M3 × 39 standoffs on the hub plate (screws from underneath).
2. Strap the battery to the hub plate with two Velcro straps through the slots (75 × 35 mm, centred, XT60 pointing out). Foam under the battery.
3. Fix the electronics deck on the standoffs. Zip-tie the ESC, the two BECs, the ESP32-S3 board and the receiver to the deck through the slots (see the layout in [04-wiring](04-wiring.md)). The receiver antenna comes up through the 6.5 mm hole, vertical, away from the carbon and metal.
4. Wire per [04-wiring](04-wiring.md). Route the servo leads along the posts with zip ties every 40 mm and leave a service loop at each servo.

**Check:** continuity battery+ to battery− reads open; no shorts between rails; first power-up on a current-limited supply or a smoke stopper, idle current < 0.2 A.

## Step 8: Balance (CG check)

1. Weigh the vehicle without the propeller. Compare with the BOM (≈ 813 g without the 12 g prop).
2. Hang the vehicle on two strings from opposite sides of the hub plate: it must hang level. Move the battery a few mm along its strap until it does.
3. The CG height is about 56 mm above the vane axes (the prop plane). Record the measured value in the test log.

**Check:** the CG is within ±3 mm of the axis; the battery cannot slide under a 3 g shake.

## Step 9: Firmware and bench checks (no propeller)

Flash [`firmware/monocopter`](../../firmware/monocopter/) ([05-firmware-and-control](05-firmware-and-control.md)), then run the **Gate 0** tests in [06-bench-tests](06-bench-tests.md): channels, vane order and signs, arming rules, failsafes, servo power, battery voltage.

## Step 10: Propeller, thrust stand and tether

Fit the **propeller last**, through the open side between the lower ring and the guard ring: it is a 10 × 4.5 **pusher** type for the rotation direction of your motor, balanced on a prop balancer. Then follow Gate 1 (thrust stand, [06-bench-tests](06-bench-tests.md)) and Gate 2 (tethered flight, [07-tethered-flight-test](07-tethered-flight-test.md)).
