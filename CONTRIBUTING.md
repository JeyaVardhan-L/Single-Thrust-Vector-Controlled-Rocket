# Contributing

This is a hardware + software project, so the rules are about keeping the **models, documents, BOM and firmware telling the same story**.

## Source of truth

| Thing | Edit here | Then run |
|---|---|---|
| Geometry / design parameters | `src/data/spec.js` | `npm test`, `npm run screenshots`, update docs that quote the number |
| Parts, masses, prices | `hardware/bom/*.json` | `npm run bom` (regenerates CSV and `docs/*/02-bom.md`) |
| Build steps shown in the wizard | `src/data/steps.js` | keep `docs/*/03-build-guide.md` in sync |
| Pin assignments | `firmware/*/include/pins.h` | update `web/wiring.html` and `docs/*/04-wiring.md` |
| Vane mixer | `firmware/lib/tvc_core/mixers.h` **and** `src/sim/mixer.js` | `npm test` and `npm run test:firmware` (same test cases on both sides) |
| Control defaults | `src/sim/attitude.js` presets | keep firmware gains in `firmware/*/src/main.cpp` and the docs equal |

Generated files (`hardware/bom/*.csv`, `docs/*/02-bom.md`, `assets/screenshots/*`) are committed on purpose so GitHub shows them. Do not hand-edit them.

## Workflow

1. Branch from `main`: `git switch -c feat/short-description`.
2. Make the change, run `npm test` and `npm run test:firmware`.
3. If you changed geometry or UI: `npm run screenshots` and look at the images.
4. Commit with a clear message (`feat:`, `fix:`, `docs:`, `hw:` for hardware changes, `fw:` for firmware).
5. Open a pull request. Hardware-affecting changes need a note on what was physically verified.

## Test logs

Real test results are the most valuable content. Put them in `docs/test-logs/YYYY-MM-DD-<vehicle>-<test>.md` using the template in the bench-test and flight-test documents: conditions, configuration (git commit, gains), result, photos or log files, follow-up actions.

## Safety rule

No change that touches arming, failsafes, the flight-state machine, motor outputs or the arm interlocks is merged without (a) a host-side test and (b) a written bench-test procedure.
