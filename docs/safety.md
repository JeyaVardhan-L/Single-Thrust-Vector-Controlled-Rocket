# Safety

This project involves **spinning propellers, lithium batteries, pyrotechnic rocket motors and control software that must be validated step by step**. Any one of these can hurt people. These rules are the minimum for this repository; they do not replace your national rocketry association's safety code, your local laws, or common sense.

> **Rule zero.** If you are unsure whether something is safe, it is not. Stop and ask someone experienced (a local NAR / Tripoli / CAR / UKRA / national-club mentor, or a Level-1-or-above member).

## 1. Who is responsible

- One named **Test Director** per test session. They alone call "go", "hold" and "abort". Anyone present can call "abort" and it is obeyed immediately, no discussion.
- One named **Range Safety Officer (RSO)** at any rocket-motor firing, independent from the person operating the vehicle.
- Everyone present has read this document and the procedure for that test.

## 2. Laws and permissions (check before building)

- Rocket motors: use **certified commercial motors only**, purchased and stored as your country requires. Do **not** make your own propellant. Many countries require a licence or club membership for motors above a small impulse class.
- Launch site / test site: permission of the landowner, and the rules of the airspace authority where relevant. A "model rocket" or "drone" in your country may have size, altitude or registration limits. Check them *before* the first flight.
- Radio: ExpressLRS 2.4 GHz and LoRa modules must be used on the band and power allowed in your country. Set the regional configuration correctly.
- Insurance: many clubs include it for members. Verify yours.

## 3. Propellers and the monocopter (Phase 1)

| Rule | Why |
|---|---|
| **Propeller off** for every bench check (wiring, sign checks, calibration). Keep props in a labelled bag until Gate 1 | A bench "test" with a prop on is the most common injury |
| Arm only when everyone is behind the shield or beyond 5 m. Say "arming" out loud | Props are invisible at speed |
| Shield (polycarbonate or net) between the vehicle and people for static tests | Blades shed fragments |
| Tether every flight until Gate 3 (three lines, slack limits height ≈ 1 m) | A flyaway 0.5 kg vehicle is a projectile |
| Kill switch on the transmitter, practised: switch off = motor off | Muscle memory beats thinking |
| Failsafe verified: RC loss → motor off, vanes centred, within 0.5 s | Tested in [bench tests](phase1-monocopter/06-bench-tests.md) |
| Eye protection for everyone within 5 m | Standard |
| Check props for nicks and cracks before every session; replace, never repair | Fatigue failure |

## 4. LiPo batteries

- Charge only with a balance charger, **in a fire-resistant bag or box, on a non-flammable surface, attended**.
- Never charge or fly a pack that is puffy, dented, punctured, hot, or has been in a crash without a full inspection. Discard damaged packs safely (discharge in salt water, then recycle at an appropriate collection point).
- Store at about 3.8 V per cell, in a fire-resistant bag, away from combustibles.
- Fly with a minimum cell voltage cutoff (3.5 V under load per cell as a starting point; feed the INA226 or ESC telemetry into a low-battery alarm).
- First power-up of any new wiring on a **current-limited supply** or smoke stopper.
- A **remove-before-flight (RBF) loop or pin** keeps the vehicle electrically dead while you work on it.
- Keep a bucket of sand and a class-appropriate extinguisher at the charging and test locations.

## 5. Rocket motors (Phase 2)

| Rule | Why |
|---|---|
| Certified motors only; check the date and the casing; follow the manufacturer's instructions exactly | Unreliable motors are the biggest hazard in the project |
| **No motor, no igniter** in the rocket during assembly, wiring, software or gimbal tests. Use an inert dummy casing of the same mass | The vehicle will move servos, run code, and be handled |
| The igniter goes in **last**, at the pad / stand, by the person who will not be near the vehicle when it fires | Minimises time exposed |
| Ignition is by a **remote ignition controller** with a safety key and a continuity check. The flight computer does **not** ignite the motor (baseline design decision) | Single, well-understood ignition path |
| Stand or pad is anchored and cleared of flammable material; a flame deflector is in place | Exhaust is 1000 °C+ |
| Everybody stays behind the **safety line**. Distances: follow the table in your association's code for the motor's total impulse. Treat them as minimums; for a first static fire of a G motor, this project uses a larger distance than the table minimum (suggested ≥ 10 m) because the stand has never been tested | Unknown stand behaviour |
| Fire extinguisher and a water source at the stand; gloves; eye protection; hearing protection | Standard |
| Hang-fire (no ignition): wait **60 s minimum** after the last contact before approaching, disconnect the ignition leads first, shorting clip on | Delayed starts happen |
| A thrust stand and a dry run of the whole procedure **before** any live motor | Dry runs find errors, live runs punish them |
| Never fly a software configuration that has not passed the bench tests. Git commit and gains are written on the checklist | Traceability |

## 6. Software and flight-termination

- Failsafes exist to be tested, not trusted. Each failsafe (RC loss, low battery, tilt abort, arm interlocks) has a bench test in the phase documents. Record results in `docs/test-logs/`.
- The rocket's flight-state machine **never enables the gimbal outside BOOST**, never arms if not near vertical, and never arms with the RBF pin inserted. These are unit-tested ([firmware/test/host_tests.cpp](../firmware/test/host_tests.cpp)); do not edit them without updating the tests.
- Tilt abort in BOOST centres the gimbal and requests recovery. It does **not** terminate thrust (a solid motor cannot be shut down), so choose the site so that the worst-case ballistic trajectory is safe.

## 7. Site and weather

- Winds above about 15 km/h (≈ 4 m/s) for the first flights of either vehicle are a no-go. Rain, fog, low cloud: no-go.
- Cleared radius with nobody inside it and no vehicles, buildings or livestock within the worst-case drift.
- A person watching **only** the vehicle (spotter) and a second person on the radio.

## 8. Personal protective equipment

Eye protection (always), closed shoes, long cotton clothing at rocket tests (not synthetic), gloves for the stand, hearing protection for any motor, first-aid kit on site, a charged phone and the address / coordinates of the site known to everyone.

## 9. Incident reporting

After any injury, fire, or near-miss: stop testing, make the site safe, treat injuries, then write it up in `docs/test-logs/` (what happened, why, what changes). Near-misses are free lessons: log them too.
