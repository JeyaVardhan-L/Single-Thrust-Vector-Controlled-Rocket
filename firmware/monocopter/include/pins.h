// ESP32-S3 (DevKitC-1 class) pin map for the MC-1 monocopter. Must match docs/phase1-monocopter/04-wiring.md and web/wiring.html.
// Pins 0, 3, 45, 46 (strapping), 19, 20 (USB) and 26 to 37 (flash / PSRAM) are not used.
#pragma once

constexpr int PIN_ESC = 4;                    // 400 Hz PWM, 1000..2000 us
constexpr int PIN_VANE[4] = {5, 6, 7, 15};    // 1 front, 2 right, 3 rear, 4 left (50 Hz servo PWM)
constexpr int PIN_CRSF_RX = 18;               // from the receiver TX, 420000 baud (Serial1)
constexpr int PIN_CRSF_TX = 17;               // to the receiver RX (telemetry, unused)
constexpr int PIN_VBAT = 1;                   // ADC1 channel 0: pack voltage through the 47k / 10k divider
constexpr int PIN_BUZZER = 8;
constexpr int PIN_LED = 9;

// Receiver channel order (ELRS default AETR): 0 roll, 1 pitch, 2 throttle, 3 yaw, 4 arm switch (AUX1)
constexpr int CH_ROLL = 0, CH_PITCH = 1, CH_THROTTLE = 2, CH_YAW = 3, CH_ARM = 4;
