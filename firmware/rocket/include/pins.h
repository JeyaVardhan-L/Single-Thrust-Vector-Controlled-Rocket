// Teensy 4.1 pin map for the RK-1 TVC rocket. Must match docs/phase2-rocket/04-wiring.md and web/wiring.html.
#pragma once

constexpr int PIN_IMU_CS = 10;        // SPI0: MOSI 11, MISO 12, SCK 13
constexpr int PIN_IMU_INT = 9;
// I2C0 (SDA 18, SCL 19): BMP390 @ 0x76
// Serial1 (RX 0, TX 1) @ 420000 baud: ExpressLRS receiver (CRSF)
// Serial2 (RX 7, TX 8): GPS u-blox M10
constexpr int PIN_ESC_UPPER = 2;      // 400 Hz PWM, 1000..2000 us, upper motor (clockwise prop)
constexpr int PIN_ESC_LOWER = 5;      // lower motor (counter-clockwise prop)
constexpr int PIN_SERVO_AXIS1 = 3;    // gimbal axis 1 (model: rotates about X)
constexpr int PIN_SERVO_AXIS2 = 4;    // gimbal axis 2 (model: rotates about Z)
constexpr int PIN_RBF = 24;           // LOW when the remove-before-flight pin is INSERTED (pull-up, pin grounds the input)
constexpr int PIN_ARM_SWITCH = 25;    // LOW when the arm switch is ON
constexpr int PIN_BUZZER = 6;
constexpr int PIN_LED = 28;
constexpr int PIN_VBAT_MAIN = 38;     // 6S pack, 1:10 divider
constexpr int PIN_VBAT_AVI = 39;      // 2S avionics pack, 1:3 divider

// Receiver channel order (ELRS default AETR): 0 roll, 1 pitch, 2 throttle, 3 yaw, 4 arm / kill switch (AUX1)
constexpr int CH_ROLL = 0, CH_PITCH = 1, CH_THROTTLE = 2, CH_YAW = 3, CH_ARM = 4;
