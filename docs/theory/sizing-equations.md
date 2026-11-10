# Sizing equations

Calculators: [sizing page](../../web/sizing.html), [gimbal lab](../../web/gimbal.html). All SI units.

## Mass, CG, inertia

```
m   = Σ mi
y_cg = Σ (mi yi) / m
I    = Σ (Ii + mi di²)       di = distance of part i from the CG, perpendicular to the rotation axis
```

Solid rod, length `ℓ`: `I = m ℓ² / 12` about the centre. Ring of radius `R` about a diameter: `m R² / 2`.

## Thrust and weight

```
TWR = T / (m g)           g = 9.81 m/s²
a   = T/m − g             (vertical, at lift-off)
```

## Hop height without drag (upper bound)

```
v_b = a t_b                   h_b = ½ a t_b²                h_coast = v_b² / (2 g)
apogee ≈ h_b + h_coast        (ignores drag and mass loss, so the real value is lower)
```

Use OpenRocket for predictions, then compare with logs.

## Propeller wash and vane force (monocopter)

```
v_wash = √( T / (2 ρ A) )          A = π R_prop²,  ρ = 1.2 kg/m³
q      = ½ ρ v_wash²
F_vane = q S_eff C_L               S_eff = vane area inside the wash,  C_L ≈ 1 near 25°
```

Roll/pitch authority: `τ = 2 F_vane h` (two opposed vanes, lever `h` below the CG). Yaw: `τ = r Σ F_vane`.

Prop shaft power (rough): `P_ideal = T^{3/2} / √(2 ρ A)`, real ≈ `P_ideal / 0.6`. Reaction torque `Q = P / ω`.

## TVC gimbal

```
side force   F = T sin δ
torque       M = T L sin δ
accel        α = M / I = G δ,   G = T L / I
holding      M_servo = (T d sin δ + friction) / ratio    d = thrust-line offset from the pivot
gear         ratio = N_sector / N_pinion,   centre distance = module (N1 + N2) / 2
servo step   gimbal step = (servo step) / ratio
```

## Structure

```
Euler column buckling   P_cr = π² E I / (K L)²
Rod second moment       I = π d⁴ / 64
Leg tip-over angle      atan( foot radius / CG height )
```

## Battery

```
Capacity (Ah) · voltage = energy (Wh)
Flight time ≈ 0.8 · capacity / average current        (the 0.8 keeps 20 % reserve)
C-rating needed = peak current / capacity (Ah)
```

## Worked example: MC-1 hover

m = 0.485 kg → weight 4.76 N. T_max = 14 N → TWR 2.9. Hover throttle ≈ √(1/2.9) ≈ 59 %. Wash at hover ≈ 10.5 m/s, `q ≈ 66 Pa`, `F_vane ≈ 0.13 N`, `τ_roll ≈ 0.022 N·m`, `α ≈ 7 to 9 rad/s²` with `I ≈ 0.003 kg·m²`.

## Worked example: RK-1 F-class gimbal

T = 25 N, L = 0.11 m, I = 0.018 kg·m² → `G = 153 rad/s²`. At δ = 6.5°: `M = 25 × 0.11 × 0.113 = 0.31 N·m`, `α = 17 rad/s²`. Servo needs ±13° (ratio 2).
