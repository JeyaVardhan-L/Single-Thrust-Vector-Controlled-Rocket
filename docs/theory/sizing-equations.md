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

## Electric hover (RK-1)

```
A      = π R_prop²                          disk area of one prop (coaxial pair: use one disc)
P_ideal = T^{3/2} / √(2 ρ A)                ideal hover power
P_elec ≈ P_ideal / FoM                      FoM ≈ 0.55 for a coaxial pair with 9 in props
flight time ≈ 0.8 · capacity (Ah) / (P_elec / V)
```

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

## Worked example: RK-1 hover

m = 1.06 kg → weight 10.4 N. T_max = 26 N → TWR 2.5, hover throttle ≈ 63 %. A = π (0.114)² = 0.041 m², `P_ideal = 10.4^1.5 / √(2 × 1.2 × 0.041) ≈ 107 W`, `P_elec ≈ 195 W` → 8.8 A on 6S → ≈ 8 min with 80 % of 1.5 Ah.

Gimbal: L = 0.093 m, I = 0.019 kg·m² → `G = T L / I = 51 rad/s²` at hover. At δ = 6.5°: `M = 10.4 × 0.093 × 0.113 = 0.11 N·m`, `α = 6 rad/s²`. Servo needs ±13° (ratio 2).
