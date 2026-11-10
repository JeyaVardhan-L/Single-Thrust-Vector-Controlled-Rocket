# Architecture

## 1. Shared control architecture

Both vehicles run the same software structure. Only the *plant* (what the actuators do) and the *state machine* differ.

```mermaid
flowchart LR
  IMU[IMU 1 kHz<br/>gyro + accel] --> AHRS[Mahony AHRS<br/>quaternion]
  BARO[Baro 25 Hz] --> LOG
  AHRS --> ERR[Attitude error<br/>vs setpoint]
  CMD[Setpoint<br/>RC sticks / vertical] --> ERR
  ERR --> PID[PID<br/>D on gyro]
  GYRO[Gyro rate] --> PID
  PID --> MIX[Mixer / gimbal map]
  MIX --> SERVO[Servos]
  MIX --> ESC[ESCs]
  SERVO --> PLANT[Vehicle]
  ESC --> PLANT
  PLANT --> IMU
  FSM[State machine<br/>arm, flight, abort] -.enables.-> PID
  AHRS --> FSM
  PID --> LOG[(SD log 100-250 Hz)]
```

| Layer | Monocopter | Rocket | Shared code |
|---|---|---|---|
| Estimation | Mahony, roll/pitch used, yaw rate from gyro | Mahony, nose-tilt vector | `ahrs.h` |
| Control | PID roll/pitch (angle mode), P on yaw rate | PID pitch/yaw on nose-tilt error, spin-rate loop, gain schedule on throttle | `pid.h` |
| Actuator map | 4-vane mixer | 2-axis gimbal with 2:1 gear map; coaxial throttle mixer | `mixers.h` |
| Supervision | arm / failsafe on the RC link | SAFE → ARMED → FLIGHT, abort | `flight_state.h`, `crsf.h` |
| Hardware | Teensy 4.1, ICM-42688-P, ELRS | Teensy 4.1, ICM-42688-P, BMP390, GPS, ELRS | `tvc_hal/` |

The portable core is plain C++17 with no Arduino dependency, so it is unit-tested on a PC (`npm run test:firmware`). The Teensy projects only wire hardware to that core.

## 2. Mechanical architecture

### MC-1 monocopter

```
 y (mm)
 250  ┌ battery + FC stack on hub plate ┐
 205  ○───── guard ring Ø250, 4 spokes ─────○     motor under hub, shaft down
 160       prop Ø152 (pushes air down)
  92  ○───── vane deck ring + 4 vanes ───────○     4 servos on the outside of the ring
   0  legs ×3 (flexible printed)
```

Air path: prop → straighteners (orange fins on the diagonals) → vanes deflect the wash sideways → reaction forces below the CG produce roll/pitch torque, and tangential forces produce yaw torque.

### RK-1 rocket (bottom to top)

| Height (mm) | Module | CAD component |
|---|---|---|
| 0 | 4 landing legs, Ø510 mm footprint | `landing-gear` |
| 56 to 123 | Coaxial brushless pair, 9″ contra-rotating props at 84 and 98 mm, cage with guard ring | `motor` |
| 150 | Gimbal pivot; 2-axis gimbal with 36T/18T gears and 2 servos | `tvc`, `gear36t1`, `gear36t2` |
| 238 | Landing frame: diamond plate, leg hinge lugs on the corners | `landing-frame` |
| 322 | Battery plate: 6S main pack + 2S avionics pack | `battery-frame` |
| 406 | PCB plate: flight computer | `pcb-frame` |
| 490 | Telemetry plate: ELRS receiver, GPS, antenna | `telemetry-frame` |
| 110 to 535 | 4 carbon rods Ø6 | `rods` |
| (ground) | Test stand: base, column, load cell | `test-stand` |

Load path under thrust: props → motors → cage and mount tube → inner collar → pivot pins → outer ring → pivot pins → fixed mount → four rods → plates. The rods are in compression in flight; check buckling in [design](phase2-rocket/01-design.md).

Why a stacked-plate design: every module is a plate that can be built, wired and tested on the bench independently, and exchanged. The main pack (ESCs, servos) and the avionics pack are separate both electrically and physically.

## 3. Electrical architecture

```mermaid
flowchart TB
  subgraph Rocket
    MAIN[Main pack 6S] --> RBF[RBF + arm] --> PDB[Power board]
    PDB --> ESCA[ESC A] --> MA[Motor A]
    PDB --> ESCB[ESC B] --> MB[Motor B]
    PDB --> BEC7[Servo BEC 7.4 V + fuse] --> S1[Servo 1] & S2[Servo 2]
    AVI[Avionics pack 2S] --> REG5[5 V reg] --> MCU[Teensy 4.1]
    MCU --> ESCA & ESCB & S1 & S2
    MCU --- IMU & BARO & GPS & RX[ELRS RX] & SD[(SD)]
  end
  subgraph Monocopter
    B4[4S LiPo] --> ARM[Arm loop] --> ESC --> MOTOR
    ARM --> BEC6[6 V BEC] --> VS[4 vane servos]
    ARM --> BEC5[5 V BEC] --> MCU2[Teensy 4.1]
    MCU2 --> ESC
    MCU2 --> VS
  end
```

Detailed diagrams and pin maps: [web/wiring.html](../web/wiring.html), [phase 1 wiring](phase1-monocopter/04-wiring.md), [phase 2 wiring](phase2-rocket/04-wiring.md).

Design rules: one ground star point; the servo rail never shares a regulator with the logic rail; every high-current path is soldered; connectors are locking; ESC signal lines are held low by pull-downs, so a floating pin never commands thrust, and both ESC outputs are set to zero before anything else at boot.

## 4. Data architecture

| Data | Producer | Rate | Store |
|---|---|---|---|
| Raw gyro/accel | IMU | 1 kHz sampled at 500 Hz | not stored (derived) |
| Attitude, rates, commands, states | Flight loop | 100-250 Hz | SD CSV (`flight.csv`) |
| Link statistics, battery voltage | ELRS receiver | 1-10 Hz | shown on the radio |
| BOM | `hardware/bom/*.json` | on change | repo |
| Test logs | Humans | per test | `docs/test-logs/` |

Analysis workflow: copy `flight.csv` into `logs/` (git-ignored), plot with any tool, compare against the [PID lab](../web/pid.html) prediction, record conclusions in a test log.

## 5. Software repository architecture

```
spec.js  ──► models (three.js)  ──► viewers, wizards, screenshots
BOM json ──► gen-bom.mjs        ──► CSV, docs BOM tables, sizing page
mixers.h ◄──► mixer.js           (identical behaviour, tested on both sides)
attitude.js presets ──► firmware gains (kept equal by hand, see CONTRIBUTING)
```
