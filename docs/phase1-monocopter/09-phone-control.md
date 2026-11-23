# Phone control guide

MC-1 is flown from a phone. The ESP32-S3 makes its own Wi-Fi network and serves one web page; you open that page, and the buttons, the throttle and the direction wheel on it drive the motor and the four vane servos. There is nothing to install on the phone and no radio receiver on the vehicle.

Try the page first without hardware: [web/control.html](../../web/control.html) runs the same page against a simulated vehicle.

## 1. One-time setup

1. Print and build the vehicle ([build guide](03-build-guide.md)); wire it ([wiring](04-wiring.md)).
2. Open [`firmware/monocopter/include/config.h`](../../firmware/monocopter/include/config.h) and **change `WIFI_PASS`** (at least 8 characters). Anyone who knows the password can fly the vehicle.
3. Flash the ESP32-S3 over USB with the battery unplugged and the propeller off: `cd firmware/monocopter && pio run -t upload` ([firmware](05-firmware-and-control.md)).
4. Open the serial monitor (`pio device monitor`). It prints `MC-1: join Wi-Fi 'MC1-FLY', open http://192.168.4.1/`.

## 2. Connect (every flight)

1. Power the vehicle (propeller off for bench work). Wait about 5 seconds for the network.
2. On the phone join `MC1-FLY`. The phone may say there is no internet: choose **stay connected** (Android) or **use without internet** (iPhone).
3. Open `http://192.168.4.1/` in the phone's browser. Type `http://`; a browser that upgrades to `https://` will not connect. Add the page to the home screen to open it full screen.
4. The link light at the top is green and shows the round-trip time (normally 10 to 40 ms). Turn off battery saver and keep the screen on (the page asks for it).

The vehicle accepts two phones at once. Only one should hold the page open while flying.

## 3. The controls

| Control | What it does |
|---|---|
| **Throttle track** | Drag to set the target throttle, 0 at the bottom. The thin line shows what the motor is really doing. The motor follows through a ramp (0.30 per second up, 0.60 per second down), so a jump of the slider is never a jump of the motor. |
| **▲ Climb / ▼ Descend** | Hold to raise or lower the target at a steady rate. **Smooth** is 6 percent per second, **Normal** 12, **Quick** 24. Use Smooth near the ground. |
| **Hover** | Sets the target to the hover throttle (45 percent by default). |
| **Land** | Brings the target down at 8 percent per second, then asks you to disarm. |
| **Direction wheel** | Push toward the way you want the vehicle to tilt and move: forward, back, left, right and everything between. The distance from the centre is how hard. Let go and it springs back. The four dots are the four servos (1 front at the top, 2 right, 3 rear, 4 left); they light up with the vane deflection, and the bars under the wheel give each vane's angle in degrees. |
| **Yaw** | Slide left or right to turn the vehicle about its vertical axis; springs back. |
| **Hold to arm** | Hold for about one second with the throttle at zero. The button turns green when the firmware has armed. Tap again to disarm. |
| **Kill** | Stops the motor at once and disarms. To fly again hold ARM again. |
| **Settings** | Wheel and yaw sensitivity, the **throttle limit**, roll and pitch trim, latch the wheel for bench checks, vibration on arm and kill. |

**Throttle limit.** It starts at 50 percent every time the page opens, whatever it was before. Raise it one step at a time on the tether, only after the lower steps flew well.

**Keyboard** (desktop, for the demo): arrow keys for the wheel, W and S for throttle, A and D for yaw, Enter (held) to arm, Space to kill.

## 4. What the vehicle does on its own

* It arms only when ARM is pressed fresh with the throttle at zero, and only if ARM has been seen off since power-up. A page that reconnects with ARM already on does not arm the vehicle.
* The throttle is ramped in the firmware. The limit and the ramps apply even if the page misbehaves.
* If it hears nothing for 0.4 s (phone asleep, out of range, page closed) it ramps the throttle down by itself with the vanes centred and the buzzer on. After 2.5 s it disarms. It never re-arms by itself.
* With the vehicle disarmed the wheel still moves the vanes and the motor stays off. That is the way to check the servos on the bench.
* Battery below 3.5 V per cell: the buzzer sounds and the pack voltage turns red on the page. Land.

## 5. Bench check (propeller removed)

Do this before every first flight of a build, and after any change to the servos or the firmware. Write the results in the [bench test log](06-bench-tests.md) (G0-03 to G0-08).

1. Join, open the page, and look at the vanes while you push the wheel disarmed.
2. Push **forward**. Vanes **2 and 4** move (the bars show opposite signs), 1 and 3 stay centred. The lower edges of both swing **forward**: they turn the air forward, the reaction pushes the bottom of the vehicle back, and the nose goes down. If one of them swings the wrong way, flip that servo in `VANE_SIGN` in `main.cpp`.
3. Push **right**. Vanes **1 and 3** move (opposite signs on the bars), 2 and 4 stay. The lower edges of both swing to the **right** of the vehicle: the bottom is pushed left and the vehicle rolls right.
4. Push **back** and **left**: the mirror images.
5. Slide **yaw right**. All four vanes move the same way: the lower edges all swing counter-clockwise seen from above, so the forces push the vehicle clockwise. Slide it left: all four the other way.
6. Release everything: all four vanes centred, each within ±1° of vertical. Trim a mechanical offset with `trimDeg` in `ServoMap`, not with the app's trim.
7. Hold ARM with the throttle above zero: the app refuses and says so. Throttle to zero, hold ARM: armed, motor still at idle.
8. Raise the throttle to 20 percent for a second and lower it again; the motor pulse follows the ramp.
9. **Failsafe:** with the throttle at 20 percent, turn the phone's Wi-Fi off. The motor ramps down within a second, the buzzer sounds, and the vehicle disarms after about 2.5 s. Turn Wi-Fi on, reload the page: it stays disarmed until you arm it again.
10. **Kill:** arm, raise the throttle a little, press Kill: the motor stops at once.

## 6. Troubleshooting

| Symptom | Cause and fix |
|---|---|
| The page does not load | Check the phone is on `MC1-FLY` (not on mobile data: turn mobile data off), and the address is `http://192.168.4.1/`, not `https`. |
| Link light red, then green, repeatedly | Wi-Fi congestion or a weak signal. Move the phone closer, change `WIFI_CHANNEL` in `config.h` to 1, 6 or 11, and turn off the phone's Wi-Fi assistant. |
| ARM is refused | Throttle not at zero, the link is not good, or ARM was never seen off since power-up. Tap Disarm, set the throttle to zero, hold ARM again. |
| Vanes move but the vehicle yaws at hover | Residual prop torque: adjust `yawTrim` on the tether ([05](05-firmware-and-control.md) §6). |
| The vehicle drifts with the wheel centred | The CG is off the axis (move the battery) or a vane is not centred (check G0-08). |
| Motor stutters or resets the board | Servo or motor current is pulling the 5 V rail: check the 6 V servo BEC and the grounds ([wiring](04-wiring.md)). |

## 7. Why Wi-Fi, and what it can not do

Wi-Fi from a phone gives you a free, standard controller and a rich display with nothing to bind or buy. It is not a long-range radio link: expect 30 to 60 m in the open, short dropouts when the phone moves between rooms, and a latency of 20 to 60 ms. That is enough for a tethered experiment where the pilot stays next to the vehicle, and the failsafe above is built for the dropouts. For free flight or range, use a radio link (see [firmware](05-firmware-and-control.md) §8), as the rocket does.
