// ESP32-S3 (DevKitC-1 class) pin map for the MC-1 monocopter. Must match docs/phase1-monocopter/04-wiring.md and web/wiring.html.
// Pins 0, 3, 45, 46 (strapping), 19, 20 (USB) and 26 to 37 (flash / PSRAM) are not used.
#pragma once

constexpr int PIN_ESC = 4;                    // 400 Hz PWM, 1000..2000 us
constexpr int PIN_VANE[4] = {5, 6, 7, 15};    // 1 front, 2 right, 3 rear, 4 left (50 Hz servo PWM)
constexpr int PIN_VBAT = 1;                   // ADC1 channel 0: pack voltage through the 47k / 10k divider
constexpr int PIN_BUZZER = 8;
constexpr int PIN_LED = 9;
