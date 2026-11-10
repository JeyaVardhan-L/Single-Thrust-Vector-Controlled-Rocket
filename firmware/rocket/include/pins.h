// Teensy 4.1 pin map for the RK-1 TVC rocket. Must match docs/phase2-rocket/04-wiring.md and web/wiring.html.
#pragma once

constexpr int PIN_IMU_CS = 10;        // SPI0: MOSI 11, MISO 12, SCK 13
constexpr int PIN_IMU_INT = 9;
// I2C0 (SDA 18, SCL 19): BMP390 @ 0x76, ADXL375 @ 0x53 (optional)
// Serial2 (RX 7, TX 8): GPS u-blox M10     Serial4 (RX 16, TX 17): LoRa telemetry module
constexpr int PIN_SERVO_AXIS1 = 3;    // gimbal axis 1 (model: rotates about X)
constexpr int PIN_SERVO_AXIS2 = 4;    // gimbal axis 2 (model: rotates about Z)
constexpr int PIN_SERVO_CHUTE = 5;    // optional chute-release servo
constexpr int PIN_PYRO_CHUTE = 22;    // MOSFET gate, 10 k pull-down. Ignition of the motor is NOT onboard.
constexpr int PIN_PYRO_SPARE = 23;
constexpr int PIN_SENSE_PYRO1 = 40;   // continuity ADC
constexpr int PIN_SENSE_PYRO2 = 41;
constexpr int PIN_RBF = 24;           // LOW when the remove-before-flight pin is INSERTED (pull-up, pin grounds the input)
constexpr int PIN_ARM_SWITCH = 25;    // LOW when the arm switch is ON
constexpr int PIN_BUZZER = 6;
constexpr int PIN_LED = 28;
constexpr int PIN_VBAT_A = 38;        // 1:3 divider
constexpr int PIN_VBAT_B = 39;
