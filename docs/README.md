# Documentation index

Read in this order the first time. Afterwards use it as a lookup.

## 0. Before anything else

1. **[Safety](safety.md)**: rules for propellers, LiPo batteries, motors, test stands, range. Non-negotiable.
2. **[Project overview](00-project-overview.md)**: why two phases, what "done" means, the go / no-go gates.
3. **[Open decisions](open-decisions.md)**: assumptions in this baseline that you must confirm against your real CAD and supplies.

## 1. System level

| Document | Content |
|---|---|
| [01-requirements.md](01-requirements.md) | Numbered requirements for both vehicles, traceable to tests |
| [02-architecture.md](02-architecture.md) | Mechanical, electrical, software and data-flow architecture with diagrams |
| [cad-mapping.md](cad-mapping.md) | Fusion browser tree ↔ three.js part ids ↔ BOM lines |
| [printing.md](printing.md) | Materials, print settings, per-part print list and orientation |
| [glossary.md](glossary.md) | Terms and abbreviations |

## 2. Phase 1: MC-1 monocopter

| # | Document |
|---|---|
| 1 | [Design](phase1-monocopter/01-design.md): concept, vane physics, sizing, mass budget |
| 2 | [Bill of materials](phase1-monocopter/02-bom.md) (generated) |
| 3 | [Build guide](phase1-monocopter/03-build-guide.md): step by step, with checks |
| 4 | [Wiring](phase1-monocopter/04-wiring.md): power tree, pin map, harness notes |
| 5 | [Firmware and control](phase1-monocopter/05-firmware-and-control.md): estimator, mixer, PID, sign conventions, tuning |
| 6 | [Bench tests](phase1-monocopter/06-bench-tests.md): no-prop and static-thrust procedures with pass/fail |
| 7 | [Tethered flight test](phase1-monocopter/07-tethered-flight-test.md) |
| 8 | [Gate review](phase1-monocopter/08-gate-review.md): what must be true before starting Phase 2 hardware |

## 3. Phase 2: RK-1 TVC rocket

| # | Document |
|---|---|
| 1 | [Design](phase2-rocket/01-design.md): concept, mass / CG / inertia, stability, sizing |
| 2 | [Bill of materials](phase2-rocket/02-bom.md) (generated) |
| 3 | [Build guide](phase2-rocket/03-build-guide.md) |
| 4 | [Wiring](phase2-rocket/04-wiring.md) |
| 5 | [Gimbal design](phase2-rocket/05-gimbal-design.md): kinematics, gears, torque, backlash, calibration |
| 6 | [Firmware and GNC](phase2-rocket/06-firmware-and-gnc.md): states, attitude error, control, sign convention |
| 7 | [Test stand procedure](phase2-rocket/07-test-stand-procedure.md): static fire, gimbal sweeps, abort criteria |
| 8 | [Flight test plan](phase2-rocket/08-flight-test-plan.md): from tethered hop to free flight |

## 4. Theory (short, practical)

- [TVC basics](theory/tvc-basics.md)
- [Control: PID for attitude](theory/control-pid.md)
- [Sizing equations](theory/sizing-equations.md)

## Interactive companions

Everything above has an interactive counterpart in the web viewer (`npm start`): 3D models, build wizards, PID lab, gimbal lab, sizing calculator, wiring diagrams, BOM table. Links are in the [root README](../README.md).

## Conventions used in the docs

- **Axes (vehicle):** aerospace FRD. X forward (rocket: nose, up in flight), Y right, Z down. Positive roll = right wing down, positive pitch = nose up, positive yaw = clockwise seen from above.
- **Axes (3D model):** three.js Y-up. Rocket nose is +Y in the model; the gimbal axes are X and Z.
- **Units:** millimetres for geometry, SI elsewhere unless stated.
- **"Gate":** a documented go / no-go checkpoint with pass criteria. Do not skip gates.
- **Status words:** *Baseline* = chosen default, may change. *Assumption* = needs confirmation. *Verified* = measured on the real hardware (none yet).
