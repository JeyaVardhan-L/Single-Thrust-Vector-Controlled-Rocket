# Phase 2 design: RK-1 TVC rocket

![RK-1](../../assets/screenshots/rocket-hero.png)

Interactive: [web/rocket.html](../../web/rocket.html) · exploded: [rocket-exploded.png](../../assets/screenshots/rocket-exploded.png) · gimbal close-up: [rocket-gimbal.png](../../assets/screenshots/rocket-gimbal.png)

## 1. Concept

A stack of five square frames on four carbon rods carries batteries, flight computer and telemetry. Below the stack a **two-axis gear-driven gimbal** swings a motor tube about a pivot at 150 mm height. Four splayed legs and a test-stand column complete the CAD tree (`tvc`, `gear36t1/2`, `rods`, `landing-frame`, `battery-frame1/2`, `pcb-frame`, `telemetry-frame`, `landing-gear`, `test-stand`; see [cad-mapping](../cad-mapping.md)).

The nozzle is **below** the CG. Without control the vehicle is like a broomstick balanced on a finger: any tilt grows. The gimbal swings the thrust line so that its side force at the pivot creates a restoring torque about the CG.

## 2. Geometry (from `src/data/spec.js`)

| Item | Value |
|---|---|
| Frames | 110 × 110 × 4 mm, 80 to 84 mm pitch |
| Rods | 4 × Ø6 mm carbon, 490 mm, on the diagonals at ±47 mm |
| Frame heights (to centre) | landing 238, battery 1 322, PCB 404, battery 2 486, telemetry 568 mm |
| Gimbal pivot | 150 mm above the ground plane; range ±7° mechanical, ±6.5° software |
| Gears | 18T pinion, 36T sector, module 1, centre distance 27 mm, ratio 2:1 |
| Motor tube | OD 32 / ID 29 mm, 200 mm long, from 52 to 252 mm |
| Legs | 4 × Ø8, hinge radius 70 mm at 238 mm, foot radius 235 mm: 34° from vertical, Ø470 mm footprint |
| Overall height | ≈ 600 mm rods + ≈ 85 mm antenna |

## 3. Mass, CG and inertia (hand estimate from the BOM)

Source: [`hardware/bom/rocket.json`](../../hardware/bom/rocket.json). Loaded mass is **952 g** counting a G-class reload (worst case); an F-class motor saves ≈ 55 g.

| Quantity | Value | How |
|---|---|---|
| CG height | ≈ 282 mm above ground (≈ 296 mm after burnout) | Σ(m·y)/Σm using module heights |
| Lever arm pivot→CG `L` | ≈ 0.13 to 0.15 m (design value 0.14 m) | CG − 150 mm |
| Pitch/yaw inertia `I` | ≈ 0.025 kg·m² | Σ(m·d²) + own inertia of rods, frames |
| Static restoring | none (CG above pivot is unstable) | needs the controller |

Weigh and balance the real vehicle: hang it on two cords through the frames, mark the CG, then update `L` and `I` in the [gimbal lab](../../web/gimbal.html) and the [PID lab](../../web/pid.html).

## 4. Thrust and flight performance

Plant gain `G = T·L/I` (rad/s² per rad of gimbal angle). With `L = 0.14`, `I = 0.025`:

| Motor | Avg thrust | G | Lift-off TWR (0.95 kg) | No-drag apogee* |
|---|---|---|---|---|
| F-class ≈ 30 N·s | 25 N | 140 | 2.7 | ≈ 30 m |
| G-class ≈ 100 N·s | 60 N | 336 | 6.4 | ≈ 560 m |
| G-class ≈ 128 N·s | 80 N | 448 | 8.6 | ≈ 800 m |

*Constant thrust, no drag, no mass loss: an **upper bound**, real values are lower. Use OpenRocket for predictions, and use the [sizing page](../../web/sizing.html?model=rocket) to explore.

**Baseline decision (D-01):** first static fires and first flights use **F class**. G class gives hundreds of metres of altitude for an open-frame rocket: it needs a large field, airspace permission and a proven control loop (Gate E passed with F class).

Gimbal authority: `M = T·L·sin δ`. F class, δ = 6.5°: 25 × 0.14 × 0.113 = 0.40 N·m → 16 rad/s² angular acceleration. G class: 0.95 N·m, 38 rad/s².

## 5. Structure

| Check | Result / method |
|---|---|
| Rod buckling | Four Ø6 mm carbon rods, 490 mm. Euler: `P = π² E I / (K L)²`, `I = π d⁴/64 = 63.6 mm⁴`, E ≈ 100 GPa (CFRP rod, lower bound), K = 1 (pinned, conservative) → ≈ 260 N per rod, ≈ 1000 N for four. Load at G-class peak (≈ 120 N) is ≈ 8× below. Collars at every frame shorten the free length further |
| Leg tip-over | Footprint radius 235 mm, CG 282 mm: tip-over angle ≈ atan(235/282) = 40° |
| Landing load | Drop-test from 0.3 m with a dummy mass before flight |
| Gimbal pins | M3 hardened pins in 683ZZ bearings: radial load ≈ thrust/2 per pin, far below rating |
| Heat | Printed frames are > 100 mm from the nozzle plane except the gimbal mount: use PA-CF or aluminium for gimbal parts and a heat-shield disc (BOM G-06) |

## 6. Design rules to keep

1. CG above the gimbal pivot, on the thrust axis, ±3 mm lateral.
2. Pivot at the motor's thrust centre: small thrust-offset torque, small servo load.
3. Zero backlash in the gimbal (< 0.3°). Preload with washers.
4. Servo power separate from logic power.
5. Every module removable without disturbing the others.
6. No component in the exhaust path: nozzle exit clear by ≥ 50 mm in all gimbal positions.
7. Antenna and GPS at the top, clear of carbon rods.

## 7. Risks

| Risk | Mitigation |
|---|---|
| Control sign error flips the rocket | Bench sign checks at Gate A, locked-gimbal first fire |
| Gimbal binds or has backlash | Calibration at Gate A with dial gauge/IMU |
| Thrust curve surprises (spike, chuffing) | Stand fires, load-cell trace; ±15 % rule |
| Heat damage near the nozzle | Heat shield, PA-CF/Al parts, inspect after each burn |
| Vibration on IMU | Grommets, check log noise at burn |
| Servo brown-out | Own battery, 5 A fuse |
| Unplanned flight path | Tilt abort, tethered stand first, site and weather rules |
| Recovery failure | Ground deployment test (D-03) |
