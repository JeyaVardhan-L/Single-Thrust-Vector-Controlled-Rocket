# TVC basics

## What thrust vector control does

A rocket normally flies straight because fins keep the centre of pressure behind the centre of gravity. At low speed (lift-off, hover, landing) fins do nothing. Thrust vector control tilts the thrust line relative to the vehicle so the thrust creates a torque instead of just pushing straight. The vehicle then steers itself through any speed, including zero.

```
         ▲ CG
         │
         │   L (lever arm)
         │
   pivot ●──── nozzle
         ╲   thrust direction tilted by δ
```

- Side force at the pivot: `F = T sin δ`
- Torque about the CG: `M = T L sin δ`
- Angular acceleration: `α = M / I`

With small angles: `α ≈ (T L / I) δ = G δ`. `G` is the **plant gain**. Everything about tuning follows from it: [PID lab](../../web/pid.html), [gimbal lab](../../web/gimbal.html).

## Why a rocket with TVC is "unstable"

With the nozzle below the CG, a tilt `θ` is not corrected by anything: gravity does not restore it (the pendulum is inverted) and there is no aerodynamic restoring moment at low speed. The model is a double integrator `θ'' = G δ` with `δ = −Kp θ − Kd θ'`: it becomes a stable oscillator **only** because the controller feeds back attitude and rate.

## Gimbal vs vanes vs others

| Method | Used by | Pros | Cons |
|---|---|---|---|
| **Engine gimbal** (RK-1) | Most TVC rockets | Efficient, no thrust loss, high authority | Mechanical complexity, flexible lines |
| **Jet vanes** | Rocket exhaust, MC-1 prop wash | Simple, no engine motion | Drag/thrust loss, ablation in hot exhaust |
| Fixed nozzle + fins | Conventional | Passive | Nothing at zero speed |
| Cold gas thrusters | Roll, small attitude | Independent of main thrust | Complex plumbing |

The monocopter uses vanes because they behave like a gimbal for control purposes: both produce a side force below the CG, so the control software and the lessons transfer. The differences (vane authority scales with wash dynamic pressure, no motor tilt) are discussed in the [phase 1 design](../phase1-monocopter/01-design.md).

## Two axes

A vertical rocket needs two lateral control channels (pitch and yaw) plus, optionally, roll. RK-1 has two gimbal axes and **no roll control**: roll is uncontrolled and mostly irrelevant for a symmetric rocket but visible in the logs.

## Typical numbers for small hobby TVC

| Parameter | Typical |
|---|---|
| Gimbal range | ±3° to ±8° |
| Servo-to-gimbal ratio | 1:1 to 3:1 |
| Loop rate | 200 to 1000 Hz |
| Actuator bandwidth | 5 to 10 Hz |
| Lift-off TWR | 2.5 to 8 |
| CG-to-pivot distance | 10 to 25 % of body length |
