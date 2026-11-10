# Safety

This project involves **spinning propellers, lithium batteries and control software that must be validated step by step**. Any one of these can hurt people. These rules are the minimum for this repository; they do not replace your local laws, your club's rules or common sense.

> **Rule zero.** If you are unsure whether something is safe, it is not. Stop and ask someone experienced (an RC or drone club mentor, or a member who has built electric multirotors).

## 1. Who is responsible

- One named **Test Director** per test session. They alone call "go", "hold" and "abort". Anyone present can call "abort" and it is obeyed immediately, no discussion.
- One **spotter** whose only job is to watch the vehicle and the zone.
- Everyone present has read this document and the procedure for that test.

## 2. Laws and permissions (check before building)

- Flying site and airspace: permission of the landowner, and the rules of the aviation authority where you fly. A drone or model aircraft in your country may have registration, weight, altitude or line-of-sight rules. Check them *before* the first flight.
- Radio: ExpressLRS 2.4 GHz must be used on the band and power allowed in your country. Set the regional configuration correctly.
- Insurance: model-aircraft clubs often include it for members. Verify yours.

## 3. Propellers (both vehicles)

| Rule | Why |
|---|---|
| **Propellers off** for every bench check (wiring, sign checks, calibration, software). Keep them in a labelled bag until the thrust stand. Disconnect the motor leads from the ESCs as well when you work on software | A bench "test" with a prop on is the most common injury |
| Arm only when everyone is behind the shield or beyond 5 m. Say "arming" out loud | Props are invisible at speed |
| Shield (polycarbonate or net) between the vehicle and people for stand tests | Blades shed fragments |
| Tether every flight until the free-flight gate (three slack lines limit the height to ≈ 1 m) | A flyaway kilogram-class vehicle is a projectile |
| Kill switch on the transmitter, practised: switch off = motors off | Muscle memory beats thinking |
| Failsafe verified: radio loss → motors off, servos centred, within 0.5 s | Tested in the bench-test and Gate A procedures |
| Eye protection for everyone within 5 m | Standard |
| Check props for nicks and cracks before every session; replace, never repair | Fatigue failure |
| After any run, wait for the props to stop completely before approaching; pull the arming loop first | Props spin down slowly and a glitch can restart them |
| Contra-rotating pairs: check the rotation of each motor with the props **off** before fitting, then fit the clockwise prop on the clockwise motor only | A wrong prop on a motor gives no lift or a spin |

## 4. LiPo batteries

- Charge only with a balance charger, **in a fire-resistant bag or box, on a non-flammable surface, attended**.
- Never charge or fly a pack that is puffy, dented, punctured, hot, or has been in a crash without a full inspection. Discard damaged packs safely (discharge in salt water, then recycle at an appropriate collection point).
- Store at about 3.8 V per cell, in a fire-resistant bag, away from combustibles.
- Fly with a minimum cell voltage (3.5 V under load per cell as a starting point; set the radio's voltage alarm and feed the ESC or INA226 reading into a low-battery alarm).
- First power-up of any new wiring on a **current-limited supply** or smoke stopper.
- A **remove-before-flight (RBF) pin or arming loop** keeps the vehicle electrically dead while you work on it. The 6S pack of the rocket can deliver hundreds of amps: the arming loop is the last thing inserted.
- Keep a bucket of sand and a suitable extinguisher at the charging and test locations.

## 5. The electric rocket (Phase 2)

| Rule | Why |
|---|---|
| Props off for assembly, wiring, software and gimbal calibration (Gate A) | The vehicle moves servos and runs code while being handled |
| Props go on only at the thrust stand, restraint and shield in place | Thrust of ≈ 2.6 kgf can lift or throw the vehicle |
| Two independent restraint straps on the stand; neither may foul the props or the gimbal | One failure must not release the vehicle |
| Arm only when **both** the on-board switch and the radio arm switch are on, throttle at zero and the vehicle upright. The radio switch is the kill switch | Two independent interlocks |
| Never hold or touch the vehicle once the arming loop is in, even with the throttle at zero | A software or ESC fault can start a motor |
| Tilting rig and tethered tests only with a travel limiter; keep hands and tools out of the cage | The cage is open between the struts |
| A dry run of every test procedure **with the props off** before the first live run | Dry runs find errors, live runs punish them |
| Never fly a software configuration that has not passed the bench tests. Git commit and gains are written on the checklist | Traceability |

## 6. Software and failsafes

- Failsafes exist to be tested, not trusted. Each failsafe (radio loss, arm switch, tilt abort, arm interlocks) has a test in the phase documents. Record results in `docs/test-logs/`.
- The rocket's flight-state machine **enables the motors and the gimbal only in FLIGHT**, never arms if not near vertical or with the throttle up, and never arms with the RBF pin inserted. These are unit-tested ([firmware/test/host_tests.cpp](../firmware/test/host_tests.cpp)); do not edit them without updating the tests.
- Tilt abort in FLIGHT cuts the motors. A cut vehicle falls: choose the site so that the vehicle landing anywhere within the cleared radius is harmless, and fly over soft ground.

## 7. Site and weather

- Winds above about 15 km/h (≈ 4 m/s) for the first flights of either vehicle are a no-go. Rain, fog: no-go.
- Cleared radius with nobody inside it and no vehicles, buildings or livestock within the worst-case drift (≥ 15 m tethered, ≥ 30 m free).
- A person watching **only** the vehicle (spotter) and a second person on the radio.

## 8. Personal protective equipment

Eye protection (always), closed shoes, gloves when handling the vehicle after a run, hearing protection near the stand, first-aid kit on site, a charged phone and the address or coordinates of the site known to everyone.

## 9. Incident reporting

After any injury, fire, or near-miss: stop testing, make the site safe, treat injuries, then write it up in `docs/test-logs/` (what happened, why, what changes). Near-misses are free lessons: log them too.
