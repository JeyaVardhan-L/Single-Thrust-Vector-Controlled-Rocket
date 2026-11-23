# Phase 1 wiring: MC-1 monocopter

Interactive block diagram: [web/wiring.html](../../web/wiring.html?model=monocopter). Pin map source of truth: [`firmware/monocopter/include/pins.h`](../../firmware/monocopter/include/pins.h).

```mermaid
flowchart LR
  BAT[LiPo 4S<br/>14.8 V] --> ARM[Arm switch +<br/>RBF loop] --> ESC[ESC 40 A] --> MOT[Motor 28xx]
  ARM --> B6[BEC 6.0 V 5 A] --> SERVOS[4 vane servos]
  ARM --> B5[BEC 5 V 3 A] --> ESP[ESP32-S3]
  ARM --> DIV[47k / 10k divider] -->|GPIO1| ESP
  ESP -->|GPIO4 PWM 400 Hz| ESC
  ESP -->|GPIO5 6 7 15 PWM 50 Hz| SERVOS
  PHONE((Phone)) -.Wi-Fi 2.4 GHz.- ESP
  ESP -->|GPIO8| BUZ[Buzzer]
  ESP -->|GPIO9| LED[LED]
```

There is no IMU, no SD card and no I²C device.

## Pin map (ESP32-S3 DevKitC-1 class)

| GPIO | Function | Connected to | Notes |
|---|---|---|---|
| 4 | ESC signal | ESC signal wire | LEDC channel 0, 400 Hz, 1000 to 2000 µs |
| 5 / 6 / 7 / 15 | Vane servo 1 front, 2 right, 3 rear, 4 left | Servo signal | LEDC channels 1 to 4, 50 Hz, 900 to 2100 µs |
| 1 | ADC (ADC1 channel 0) | Midpoint of the 47 k / 10 k divider | 16.8 V pack gives 2.95 V; 100 nF across the 10 k |
| 8 | Buzzer | Active 5 V buzzer through an NPN (2N3904) | Low-voltage warning below 14.0 V |
| 9 | Status LED | LED + 330 Ω | On when armed |
| 5V, GND | 5 V in | Logic BEC | See the USB rule below |

Pins 0, 3, 45 and 46 (strapping), 19 and 20 (USB) and 26 to 37 (flash and PSRAM) are not used.

## Power tree

| Rail | Source | Loads | Notes |
|---|---|---|---|
| 14.8 V (4S) | LiPo via the arm switch and RBF loop | ESC, both BECs, voltage divider | A 470 to 1000 µF 35 V low-ESR capacitor at the ESC input |
| 6.0 V | BEC 5 A | 4 servos | Idle ≈ 0.1 A, up to 3 to 4 A with stalled servos |
| 5.0 V | BEC 3 A | ESP32-S3 board, buzzer | 100 µF at the board |

**Ground:** all grounds join at **one point** on the deck. The servo ground returns directly to the 6 V BEC ground, not through the signal wires. **Cut or leave unconnected the red (5 V) wire of the ESC signal lead** if the ESC has its own BEC.

**USB rule:** do not power the board from USB and from the BEC at the same time unless a Schottky diode (1N5819) sits in the BEC 5 V line. Simplest: unplug the battery before you plug in USB, and keep the propeller off.

## Layout on the electronics deck

| Where (deck x, y in mm) | What | Fixing |
|---|---|---|
| Centre, along x | ESP32-S3 board (69 × 25.5) | Two zip ties through the slots at y = ±12 |
| Beside it | ESC (about 45 × 22) | Two zip ties through the slots at x = ±24, in the airflow |
| x = ±38 | The two BECs | Zip tie through the slots |
| ESP32-S3 antenna | (part of the board) | Keep the antenna end of the board toward the edge of the deck, clear of carbon, metal and the motor leads |

Keep the motor leads and the battery leads at least 20 mm from the board's antenna. Twist the battery and the motor leads.

## Wire gauges and connectors

| Path | Wire | Connector |
|---|---|---|
| Battery → arm switch → ESC | 14 AWG silicone | XT60 (battery), switch or XT30 loop |
| ESC → motor | motor leads (as supplied) | bullet connectors or solder |
| BEC outputs | 22 AWG | JST-XH or soldered |
| Servo leads | as supplied; extend with 26 AWG | 3-pin servo connectors, heat-shrunk joints |
| Signals | 26 to 30 AWG silicone | Pin headers with hot-glue strain relief |

## Harness rules

1. Tie wires to the posts with zip ties every 40 mm; leave a service loop at each servo.
2. Each servo has its own labelled connector. Never swap two servo connectors without redoing the sign check.
3. No bare Dupont jumper leads in flight hardware.
4. Route the three motor wires up through the hub plate centre hole, away from the prop.
5. Photograph the harness before and after every change and put the photo in the test log.

## Verification checklist (do once and after any rewiring)

- [ ] Continuity: each signal wire ↔ intended pin only.
- [ ] No continuity between 14.8 V, 6 V, 5 V and ground rails.
- [ ] Supply from a 12 V / 2 A current-limited bench supply: idle current < 100 mA.
- [ ] 5.0 V and 6.0 V rails within ±0.1 V.
- [ ] Divider: 16.8 V at the pack gives 2.95 V at GPIO1 (±0.05 V) before the ADC pin is connected.
- [ ] The Wi-Fi network `MC1-FLY` appears on a phone and the app shows a green link.
