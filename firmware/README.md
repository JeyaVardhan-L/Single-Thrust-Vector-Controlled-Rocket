# Firmware

```
lib/tvc_core/     portable C++17 (no Arduino): pid.h, ahrs.h, mixers.h, crsf.h, flight_state.h
lib/tvc_hal/      Teensy drivers: icm42688.h
monocopter/       PlatformIO project, Phase 1 (Teensy 4.1)
rocket/           PlatformIO project, Phase 2 (Teensy 4.1)
test/             host-side tests for tvc_core (g++)
```

## Test the core on a PC

```bash
npm run test:firmware      # compiles test/host_tests.cpp with g++/clang++ and runs 57 checks
```

## Build for the hardware

```bash
pip install platformio
cd firmware/monocopter   # or firmware/rocket
pio run                  # build
pio run -t upload        # flash Teensy 4.1
pio device monitor       # 115200 baud
```

## Status

| Part | State |
|---|---|
| `tvc_core` | Unit-tested on host |
| `tvc_hal/icm42688.h` | Written from register knowledge, **not tested on hardware**: verify against the TDK datasheet |
| `monocopter/`, `rocket/` | **Never compiled for the target, never run.** Expect small build fixes (library versions, API names) |

## Rules

- Anything touching arming, failsafes, the state machine or the actuator maps gets a host test first.
- Pins live in `include/pins.h`; update `web/wiring.html` and the wiring docs with them.
- The monocopter mixer exists twice (`mixers.h`, `src/sim/mixer.js`): change both and both test suites.
- Gains in `main.cpp` must equal the PID-lab presets (`src/sim/attitude.js`) or say why not.
