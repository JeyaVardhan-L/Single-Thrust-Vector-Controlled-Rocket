# Phase 1 firmware and control

Code: [`firmware/monocopter/src/main.cpp`](../../firmware/monocopter/src/main.cpp) with the portable logic in [`firmware/lib/tvc_core/manual_mode.h`](../../firmware/lib/tvc_core/manual_mode.h), the vane mixer in [`mixers.h`](../../firmware/lib/tvc_core/mixers.h) and the CRSF parser in [`crsf.h`](../../firmware/lib/tvc_core/crsf.h). The portable part has host tests (`npm run test:firmware`).

There is **no IMU and no attitude loop** in MC-1: the pilot closes the loop (see [design](01-design.md) §2).

## 1. Build and upload

```bash
pip install platformio          # once
cd firmware/monocopter
pio run                         # build for the ESP32-S3 DevKitC-1
pio run -t upload               # flash over USB (battery unplugged, propeller off)
pio device monitor              # 115200 baud console
```

## 2. Loop structure (250 Hz)

```
read CRSF bytes ─► link ok?         (timeout 250 ms)
arm logic:  arm switch > 1700 us, throttle < 5 %, switch must have been seen OFF once since boot or since the last disarm
if armed:   throttle -> ESC pulse = 1000 + throttle * 1000 us
            if throttle > 12 %: sticks -> expo -> x scale x schedule -> vane mixer -> 4 servo pulses
            else: vanes centred
else:       ESC 1000 us, vanes centred
console 10 Hz:  armed, link, throttle, battery voltage, vane commands
```

**Failsafe:** link lost for more than 250 ms, or the arm switch off → motor pulse 1000 µs, vanes centred, disarmed. It does **not** re-arm by itself: the switch must be cycled with the throttle low.

## 3. Channels and the console

ELRS default channel order (AETR): channel 1 roll, 2 pitch, 3 throttle, 4 yaw, 5 arm switch (AUX1). Change `CH_*` in [`pins.h`](../../firmware/monocopter/include/pins.h) if your radio differs.

The console line looks like `armed=1 link=1 thr=0.45 vbat=15.62 v=0.00 0.00 0.00 0.00`. The battery warning buzzes below 14.0 V (3.5 V per cell); calibrate `VBAT_CAL` against a multimeter.

## 4. Axes, signs and the mixer

Aerospace **FRD** body axes: X forward (towards vane 1), Y right (vane 2), Z down.

| Command | Meaning |
|---|---|
| Roll + | a torque that rolls the right side **down** |
| Pitch + | a torque that pitches the nose **up** |
| Yaw + | a torque clockwise seen from above |

Vane `k` is at: 1 front (+X), 2 right (+Y), 3 rear (−X), 4 left (−Y). A positive vane command `d_k` produces a side force along the **clockwise tangent** at that vane (`t1 = +Y, t2 = −X, t3 = −Y, t4 = +X`).

Vane forces act a height `h` below the CG. Torques (derivation in [`src/sim/mixer.js`](../../src/sim/mixer.js)):

```
τ_roll  = −h (F1 − F3)
τ_pitch =  h (F4 − F2)
τ_yaw   =  r (F1 + F2 + F3 + F4)
```

Solving with the common-mode term set to zero:

```
d1 = yaw − roll      d3 = yaw + roll
d4 = yaw + pitch     d2 = yaw − pitch
```

When any |d| exceeds 1, **all four are scaled together** so the ratio between axes is preserved (tested in the JS and the C++ suites with the same cases).

**Physical rule for checking signs on the bench:** the vane force pushes the *bottom* of the vehicle in the direction the lower (trailing) edge of the vane moves **away** from. A roll-right command (right side down) must move the lower edges of vanes 1 and 3 **away from the right**, towards the left of the vehicle, pushing the bottom to the left and rolling the top to the right.

## 5. Stick processing and the values to tune (`ManualConfig`)

| Parameter | Default | Meaning |
|---|---|---|
| `expo` | 0.35 | Softens the centre of the stick (0 linear, 1 cubic) |
| `rollScale`, `pitchScale` | 0.6 | Fraction of the vane travel at full stick: 0.6 × 25° = 15° of vane |
| `yawScale` | 0.5 | Same for yaw |
| `yawTrim` | 0.0 | Static yaw command that cancels the residual prop torque (found on the tether) |
| `hoverThrottle` | 0.45 | Throttle at which the vane scale is 1.0 (set from the thrust curve at Gate 1) |
| `schedMin`, `schedMax` | 0.6, 1.6 | Limits of the schedule `hoverThrottle / throttle`: the vane force grows with the wash, so the commands are scaled down at high throttle and up at low throttle |
| `minAuthThrottle` | 0.12 | Below this the wash is too weak and the vanes stay centred |
| `armMaxThrottle` | 0.05 | Throttle must be below this to arm |

Servo mapping (`ServoMap` in `mixers.h`): `centerUs` 1500, `usPerDeg` 10, `trimDeg` 0 per servo. The vane is driven directly, so **servo angle = vane angle** (25° at full command). Calibrate each servo: command a known angle, measure it with a protractor, and set `usPerDeg` and `trimDeg` so that the measured angle matches.

`VANE_SIGN[i]` flips a servo that is mounted mirrored. Change it only after the sign checks in [06-bench-tests](06-bench-tests.md) show a mirrored vane.

## 6. Tuning on the tether

1. Start with the defaults. Hover low on the tether (see [07](07-tethered-flight-test.md)).
2. If the vehicle turns about the vertical axis with the yaw stick centred, adjust `yawTrim` until it holds its heading at hover throttle.
3. If the response to a stick input is too sharp or too weak, change `rollScale` and `pitchScale` first (they set the torque), then `expo`.
4. If a long hover at one throttle needs constant stick, the CG is off the axis: move the battery along its strap.
5. Write every change and the result in `docs/test-logs/`.

## 7. Host tests (run these after every change to the core)

```bash
npm test                 # JS: mixer, attitude simulation, printable parts
npm run test:firmware    # C++: mixers, CRSF, manual mode (arming, failsafe, scaling), and the rocket core
```

## 8. Adding stabilisation later

A rate or angle loop needs a gyro and an accelerometer. The portable core already has them for the rocket (`ahrs.h`, `pid.h`, `tvc_hal/icm42688.h`); see the [rocket firmware](../phase2-rocket/06-firmware-and-gnc.md). Replace the stick-to-vane stage in `manual_mode.h` with the same PID structure and keep the arming rules and the failsafe.
