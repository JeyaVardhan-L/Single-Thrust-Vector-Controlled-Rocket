# Test stand procedure (Gates B, C, D)

Read [safety](../safety.md) in full first. This procedure is a **template to be reviewed** by an experienced rocketry mentor or your association before the first live firing. Nothing here replaces their rules or your local law.

![Test stand](../../assets/screenshots/rocket-hero.png)

## 1. The stand

Model part `test-stand`: base plate, centre column with a flame deflector cone under the nozzle, load cell. Baseline (decision D-11): a **fixed stand**: the rocket is restrained on the plate and thrust is read by a load cell, while the gimbal moves freely. A fixed stand cannot test closed-loop attitude (the vehicle cannot rotate), so Gate D uses a **tilting rig** (see §6).

| Requirement | How |
|---|---|
| Anchored | Plate bolted to a concrete pad or staked/ballasted > 10× thrust weight |
| Restraint | Rocket held by **two independent** straps/tethers rated ≥ 3× peak thrust; failure of one must not release the vehicle (RK-11). Keep them clear of the exhaust and the gimbal motion |
| Thrust measurement | 20 kg load cell + HX711 at ≥ 80 Hz, calibrated with known weights the same day |
| Flame deflector | Steel/aluminium cone, nozzle exit ≥ 50 mm above it |
| Clear zone | Bare ground or gravel, no dry grass within 5 m (wet it down), no overhead branches |
| Safety line | Marked on the ground per your association's table; project minimum for first fires ≥ 10 m (suggested) |
| Ignition | Remote controller with keyed safety, continuity check, leads ≥ the safety distance, shorted when not in use |

## 2. Roles

Test Director (calls everything) · RSO (independent; can stop the test) · Operator at the ignition box · Data person (logs thrust, telemetry, video) · Spotter (eyes on the vehicle). One person may not hold two of the safety roles.

## 3. Documents to have on site

- This procedure and the pre-test checklist printed.
- Motor datasheet and thrust curve, certification marks.
- Test log template ([phase 1 template](../phase1-monocopter/06-bench-tests.md) works).
- Emergency numbers and the site address/coordinates.

## 4. Gate B: static fire, gimbal **locked** at centre

Purpose: validate the stand, thrust measurement, the motor, and the structure under thrust. **No control, no gimbal movement.**

Prerequisites: Gate A passed. Dry run done (see §7). F-class motor (D-01).

**Pre-test checklist** (read aloud, answer "check"):

1. ☐ Weather: wind ≤ 15 km/h, no rain, no lightning within 20 km.
2. ☐ Site clear; spotters in place; safety line marked; extinguisher, water, first-aid at the stand.
3. ☐ Vehicle: inspected; gimbal locked mechanically at centre (pin or clamp); servos **unpowered**; flight computer armed? **no**: logging only (SAFE state; RBF inserted)
4. ☐ Software commit and gains recorded: ______ ; telemetry link verified.
5. ☐ Load cell zeroed and calibrated; data logging running.
6. ☐ Restraints inspected, tight; stand anchored.
7. ☐ Everyone not required has moved behind the safety line.
8. ☐ Motor (certified, in date) installed **by the person who will then retire to the line**, per the manufacturer's instructions. Ignition leads **shorted**.
9. ☐ Igniter installed last; leads connected to the (still shorted) ignition cable; clips not touching metal.
10. ☐ Everyone confirms "clear" **by name**. Director announces: "Ignition in 5".

**Sequence:** Director: "Arming ignition" → operator inserts the safety key and checks continuity (a light/tone) → countdown from 5 → fire.

**Hang-fire:** if nothing happens: operator removes the **safety key**, disconnects the leads at the box and shorts them, then **everyone waits ≥ 60 s**. Only then does one person (Director's call) approach, not directly over the nozzle.

**After the burn:** wait until the motor has fully stopped and cooled (≥ 5 min or per datasheet); inspect: stand, restraints, rocket, heat damage, nozzle; log everything, photograph.

**Gate B pass criteria**

- ☐ Ignition and burn nominal (no chuffing, no case burn-through, no structural failure)
- ☐ Average thrust within ±15 % of the datasheet (RK-12); curve saved
- ☐ No loose or damaged hardware; heat-affected parts inspected and still sound
- ☐ Launch-detect logic: with the board powered in ARMED on a *dummy* rig (no motor), shaking or handling does **not** trigger BOOST (RK-08)
- ☐ Data and video archived

## 5. Gate C: static fire with open-loop gimbal sweeps

Purpose: verify the gimbal under thrust and heat, and measure thrust-vector response.

Additional prerequisites: Gate B passed; all of Gate A's calibration still valid after the first burn (re-check backlash and centre).

Changes to the pre-test checklist:

- Gimbal **unlocked**, servos powered from pack B, commanded by a **pre-programmed sweep** (±3° then ±5° on each axis in sequence, 0.5 Hz), triggered by launch detection or a timer at 0.3 s after ignition.
- Closed-loop control **off** (a software flag): the gimbal follows the script only.
- Load cell must be able to see lateral force: use a 2-axis stand or at least video + IMU.
- Abort conditions in §8 apply.

**Pass criteria:** gimbal tracks the script within 1° under load; no servo stall or brown-out (log pack B voltage ≥ 6.4 V); no skipped gear teeth afterwards; measured side force vs commanded angle agrees with `T sin δ` within 25 %; gains for Gate D updated with the measured `G`.

## 6. Gate D: closed loop on a tilting rig

A fixed stand cannot respond to attitude. Use a **pivoting rig** instead: the vehicle hangs/stands on a single low-friction pivot (ball joint or a gimbal bearing) near its CG so that it can pitch/yaw ±20° but cannot leave the rig, with a travel limiter and a restraining line. Build and test the rig **with no motor** first (hand-tilt it and check the controller reacts).

Procedure: as Gate B, plus closed-loop enabled, with a commanded attitude offset of 2° applied at 0.4 s after ignition (software step). Abort rules from §8; the Director stays at the ignition box with the key.

**Pass criteria (RK-13):** the offset is rejected within 0.5 s; gimbal saturation (±6.5°) less than 20 % of the burn; no divergence; log comparison with the PID lab (natural frequency within 30 %).

## 7. Dry run (mandatory before each gate's first live fire)

Run the **entire** procedure with the dummy casing: roles, calls, checklist, lead handling, hang-fire drill, extinguisher access, data logging. Time it. Fix every confusion in this document. Record who attended.

## 8. Abort criteria (any person may call, immediately obeyed)

Before ignition: anyone enters the zone; wind or weather exceeds limits; any restraint or stand anomaly; any smell, leak or damage; software/telemetry fault; unclear communication.

During the burn: structural failure; the vehicle moves unexpectedly; abnormal flame, smoke or noise (chuffing, spitting); tilt > 35° on the rig; loss of data.

On abort: **do not approach** for at least 60 s after the last event; fire extinguisher only by the person assigned, from upwind, only if safe.

## 9. After-test routine

1. Make the vehicle safe: igniter leads shorted, key removed, RBF pin inserted.
2. Cool-down, then inspect.
3. Save logs, photos, video; fill the test log; update gains, parameters, `G` in the PID lab.
4. Debrief: what went wrong or nearly did; update this procedure.

## 10. Gate checklist summary

| Gate | Needs | Output |
|---|---|---|
| A | Bench, dummy motor | Calibrated gimbal ([05](05-gimbal-design.md)) |
| B | Fixed stand, F motor, gimbal locked | Stand and motor validated |
| C | Fixed stand, open-loop sweeps | Gimbal under thrust, measured `G` |
| D | Tilting rig, closed loop | Control validated |
| E | [Flight test plan](08-flight-test-plan.md) | First free flight |
