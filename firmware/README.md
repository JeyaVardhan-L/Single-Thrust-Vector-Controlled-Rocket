# Firmware

```
lib/tvc_core/     portable C++17 (no Arduino): pid.h, ahrs.h, mixers.h, crsf.h, flight_state.h, manual_mode.h
lib/tvc_hal/      Teensy drivers: icm42688.h
monocopter/       PlatformIO project, Phase 1 (ESP32-S3, no IMU, pilot-flown)
rocket/           PlatformIO project, Phase 2 (Teensy 4.1)
test/             host-side tests for tvc_core (g++)
```

## Test the core on a PC

```bash
npm run test:firmware      # compiles test/host_tests.cpp with g++/clang++ and runs 74 checks
```

## Build for the hardware

```bash
pip install platformio
cd firmware/monocopter   # or firmware/rocket
pio run                  # build
pio run -t upload        # flash the board (ESP32-S3 for the monocopter, Teensy 4.1 for the rocket)
pio device monitor       # 115200 baud
```

## Rules

- Anything touching arming, failsafes, the state machine or the actuator maps gets a host test first.
- Pins live in `include/pins.h`; update `web/wiring.html` and the wiring docs with them.
- The monocopter mixer exists twice (`mixers.h`, `src/sim/mixer.js`): change both and both test suites.
- Rocket gains in `main.cpp` must equal the PID-lab presets (`src/sim/attitude.js`) or say why not. The monocopter has no loop: its tunables are `ManualConfig` in `manual_mode.h`.
