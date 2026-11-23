# Phase 1 firmware and control

Code: [`firmware/monocopter/src/main.cpp`](../../firmware/monocopter/src/main.cpp) (Wi-Fi, web server, PWM) with the portable flight logic in [`firmware/lib/tvc_core/phone_mode.h`](../../firmware/lib/tvc_core/phone_mode.h), the vane mixer in [`mixers.h`](../../firmware/lib/tvc_core/mixers.h) and the phone app in [`firmware/monocopter/web/control.html`](../../firmware/monocopter/web/control.html). The portable part has host tests (`npm run test:firmware`) and the app is checked against it (`npm test`).

There is **no IMU, no radio receiver and no attitude loop** in MC-1: the ESP32-S3 makes a Wi-Fi network, the phone is the controller, and the pilot closes the loop (see [design](01-design.md) §2). How to use it: [phone control guide](09-phone-control.md).

## 1. Build and upload

```bash
pip install platformio          # once
cd firmware/monocopter
pio run                         # build for the ESP32-S3 DevKitC-1
pio run -t upload               # flash over USB (battery unplugged, propeller off)
pio device monitor              # 115200 baud console
```

Before the first upload open [`config.h`](../../firmware/monocopter/include/config.h) and **change the Wi-Fi password**. If you edit the app, run `node scripts/gen-webui.mjs` to embed it in `include/web_ui.h` (a test fails if the two differ).

## 2. How the pieces talk

```
phone browser ──GET /c?a=1&t=450&x=0&y=800&w=0&l=500…  every 50 ms──►  ESP32-S3  (WebServer, 192.168.4.1)
              ◄──{"s":1,"t":412,"v":[0,437,0,-437],"b":14620}──────────        │
                                                                                ▼
                       250 Hz loop:  PhoneMode::update  ─►  1 ESC pulse (400 Hz)  +  4 servo pulses (50 Hz)
```

All numbers on the wire are integers in per mille. Request fields: `a` arm switch (0/1), `k` kill (0/1), `t` throttle target 0 to 1000, `l` the app's throttle limit, `x` and `y` direction wheel −1000 to 1000 (x right, y forward), `w` yaw, `r` and `p` roll and pitch trim, `n` a sequence number. Reply: `s` state (0 disarmed, 1 armed, 2 failsafe, 3 killed), `t` actual throttle, `v` the four vane commands (1000 = full ±25°), `b` pack voltage in mV. `GET /` returns the page.

The Wi-Fi network is a normal access point; the phone is its only client in flight. The loop keeps running if the page is slow: the last command stays in force until the link timeout. The two probe addresses phones use to detect internet (`/generate_204` and the Apple, Windows ones) are answered so that no "sign in to the network" pop-up hides the app.

## 3. Loop structure (250 Hz)

```
handle HTTP requests            (a request stores the command and the time it arrived)
msSinceCmd = now - last command
PhoneMode::update:
   arm      rising edge of the app's arm switch, throttle target and actual < 3 %, link ok, and the switch was seen OFF since power-up or the last disarm
   throttle target = min(app slider, app limit, firmware cap)
            ramp: +0.30 per second up, -0.60 per second down (never a step)
   link > 400 ms:  target 0, ramp down at 0.50 per second, vanes centred (state FAILSAFE)
   link > 2.5 s:   disarmed
   kill:           disarmed in one step, motor 1000 us, stays off until the arm switch is turned off
   vanes    armed and throttle > 12 %:  wheel -> expo -> scale -> throttle schedule -> vane mixer
            armed and throttle <= 12 %: centred (too little prop wash to steer)
            disarmed and link ok:       the wheel still moves the vanes (bench check, motor off)
write ESC pulse = 1000 + throttle * 1000 us, write 4 servo pulses
console 5 Hz:   state, link, throttle, battery, vane commands
```

**Failsafe:** when commands stop (phone asleep, out of range, page closed) the vehicle ramps the throttle down by itself and disarms after 2.5 s. It does **not** re-arm by itself: the arm switch in the app must be turned off and on again with the throttle at zero.

The battery warning buzzes below 14.0 V (3.5 V per cell); calibrate `VBAT_CAL` against a multimeter. The buzzer also sounds during a failsafe. The LED is solid when armed, and blinks when disarmed with a good link.

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

**The direction wheel.** The wheel is a unit disc: `x` = push right, `y` = push forward. The pilot pushes toward the way the vehicle should tilt and move, and the firmware converts it:

```
roll  = +x · rollScale · schedule        (right wing down: the vehicle moves right)
pitch = −y · pitchScale · schedule       (nose down: the vehicle moves forward)
```

| Wheel | Vanes that move | Vehicle |
|---|---|---|
| forward | 2 and 4, opposite signs | nose down, moves forward |
| backward | 2 and 4, other way | nose up, moves back |
| right | 1 and 3, opposite signs | rolls right, moves right |
| left | 1 and 3, other way | rolls left, moves left |
| yaw right | all four, same sign | clockwise from above |

The wheel radius goes through the expo curve (so the direction stays exact), a dead zone of 4 % ignores a resting thumb, and a position outside the disc is clipped to the rim. The page contains the same mapping for its demo and the tests compare it with the C++ result.

**Physical rule for checking signs on the bench:** the air leaves the prop going down and a vane turns it toward the side its lower (trailing) edge swings to; the reaction pushes the vane, and the vehicle, the **other** way. So the force at a vane is opposite to the movement of its lower edge. Because the vanes are below the CG, a force on the bottom of the vehicle tilts the top the opposite way, and the thrust line follows the top. Wheel forward: the lower edges of vanes 2 and 4 both swing **forward**, the bottom is pushed back, the nose goes down. Wheel right: the lower edges of vanes 1 and 3 both swing **right**, the bottom is pushed left, the vehicle rolls right. The servo commands of the two vanes have opposite signs (the bars in the app show it) because the vanes sit on opposite sides, but their lower edges swing the same way. Yaw right: the lower edges of all four swing counter-clockwise seen from above, the forces push the vehicle clockwise.

## 5. Values to tune (`PhoneConfig`)

| Parameter | Default | Meaning |
|---|---|---|
| `expo` | 0.25 | Softens the centre of the wheel (0 linear, 1 cubic) |
| `rollScale`, `pitchScale` | 0.6 | Fraction of the vane travel at full wheel: 0.6 × 25° = 15° of vane |
| `yawScale` | 0.5 | Same for yaw |
| `yawTrim` | 0.0 | Static yaw command that cancels the residual prop torque (found on the tether) |
| `hoverThrottle` | 0.45 | Throttle at which the vane scale is 1.0 (set from the thrust curve at Gate 1); the page's Hover button uses the same value |
| `schedMin`, `schedMax` | 0.6, 1.6 | Limits of the schedule `hoverThrottle / throttle`: the vane force grows with the wash, so the commands are scaled down at high throttle and up at low throttle |
| `minAuthThrottle` | 0.12 | Below this the wash is too weak and the vanes stay centred |
| `armMaxThrottle` | 0.03 | Throttle must be below this to arm |
| `upRate`, `downRate` | 0.30, 0.60 | Throttle ramp limits per second (a full climb takes 3.3 s) |
| `failsafeRate` | 0.50 | Ramp-down rate when the link is lost |
| `linkTimeoutMs`, `disarmTimeoutMs` | 400, 2500 | No command for this long: failsafe ramp, then disarm |
| `maxThrottle` | 1.0 | Hard cap in the firmware (the app has its own limit that starts at 50 %) |

Servo mapping (`ServoMap` in `mixers.h`): `centerUs` 1500, `usPerDeg` 10, `trimDeg` 0 per servo. The vane is driven directly, so **servo angle = vane angle** (25° at full command). Calibrate each servo: command a known angle, measure it with a protractor, and set `usPerDeg` and `trimDeg` so that the measured angle matches.

`VANE_SIGN[i]` flips a servo that is mounted mirrored. Change it only after the sign checks in [06-bench-tests](06-bench-tests.md) show a mirrored vane. The app's roll and pitch trims (Settings) add a small constant to the vane command and are stored on the phone.

## 6. Tuning on the tether

1. Start with the defaults and the app's 50 % limit. Hover low on the tether (see [07](07-tethered-flight-test.md)).
2. If the vehicle turns about the vertical axis with the yaw slider centred, adjust `yawTrim` until it holds its heading at hover throttle.
3. If the response to the wheel is too sharp or too weak, change the wheel sensitivity in the app first, then `rollScale` and `pitchScale` (they set the torque), then `expo`.
4. If a long hover at one throttle needs the wheel held off-centre, the CG is off the axis: move the battery along its strap. Use the trim buttons only for what is left.
5. Write every change and the result in `docs/test-logs/`.

## 7. Host tests (run these after every change to the core or the app)

```bash
npm test                 # JS: mixer, attitude simulation, printable parts, the phone app against the firmware core
npm run test:firmware    # C++: mixers, phone mode (arming, ramps, wheel signs, kill, failsafe), manual mode, the rocket core
```

The firmware file `main.cpp` itself (Wi-Fi, web server, PWM) is built for the board with `pio run`.

## 8. Other ways to fly it

* **Radio instead of a phone.** `manual_mode.h` and `crsf.h` are the same stick logic for an ExpressLRS receiver (they are the rocket's link). Swap them into `main.cpp` and add the receiver on a UART if you want a radio for MC-1.
* **Stabilisation.** A rate or angle loop needs a gyro and an accelerometer. The portable core already has them for the rocket (`ahrs.h`, `pid.h`, `tvc_hal/icm42688.h`); see the [rocket firmware](../phase2-rocket/06-firmware-and-gnc.md). Replace the wheel-to-vane stage in `phone_mode.h` with the same PID structure and keep the arming rules and the failsafe.
