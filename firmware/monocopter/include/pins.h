// Teensy 4.1 pin map for the MC-1 monocopter. Must match docs/phase1-monocopter/04-wiring.md and web/wiring.html.
#pragma once

constexpr int PIN_IMU_CS = 10;       // SPI0: MOSI 11, MISO 12, SCK 13
constexpr int PIN_IMU_INT = 9;
// I2C0 (SDA 18, SCL 19): BMP390 @ 0x76, INA226 @ 0x40 (for battery and baro readings)
// Serial1 (RX 0, TX 1) @ 420000 baud: ExpressLRS receiver (CRSF)
constexpr int PIN_ESC = 2;           // 400 Hz PWM, 1000..2000 us
constexpr int PIN_VANE[4] = {3, 4, 5, 6};   // 1 front, 2 right, 3 rear, 4 left
constexpr int PIN_BUZZER = 7;
constexpr int PIN_LED = 8;

// Receiver channel order (ELRS default AETR): 0 roll, 1 pitch, 2 throttle, 3 yaw, 4 arm switch (AUX1)
constexpr int CH_ROLL = 0, CH_PITCH = 1, CH_THROTTLE = 2, CH_YAW = 3, CH_ARM = 4;
