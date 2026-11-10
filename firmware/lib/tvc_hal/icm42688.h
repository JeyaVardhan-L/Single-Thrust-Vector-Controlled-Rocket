// Minimal ICM-42688-P SPI driver for Teensy 4.x (Arduino framework).
// Configures +-2000 dps gyro and +-16 g accel at 1 kHz output data rate, low-noise mode.
// UNTESTED ON HARDWARE: verify register values against the TDK datasheet before the first flight.
#pragma once
#include <Arduino.h>
#include <SPI.h>

class Icm42688 {
 public:
  Icm42688(uint8_t csPin, SPIClass& spi = SPI) : cs_(csPin), spi_(spi) {}

  bool begin() {
    pinMode(cs_, OUTPUT);
    digitalWrite(cs_, HIGH);
    spi_.begin();
    delay(10);
    write(REG_DEVICE_CONFIG, 0x01);          // soft reset
    delay(2);
    if (read(REG_WHO_AM_I) != 0x47) return false;
    write(REG_GYRO_CONFIG0, 0x06);           // FS_SEL = 0 (+-2000 dps), ODR = 1 kHz
    write(REG_ACCEL_CONFIG0, 0x06);          // FS_SEL = 0 (+-16 g), ODR = 1 kHz
    write(REG_PWR_MGMT0, 0x0F);              // gyro + accel in low-noise mode
    delay(50);
    return true;
  }

  // gyro in rad/s, accel in g. Body axes are as mounted: remap in the caller if the board is rotated.
  void read(float gyro[3], float accel[3]) {
    uint8_t b[12];
    burstRead(REG_ACCEL_DATA_X1, b, 12);
    auto s16 = [&](int i) { return (int16_t)((b[i] << 8) | b[i + 1]); };
    accel[0] = s16(0) / 2048.f; accel[1] = s16(2) / 2048.f; accel[2] = s16(4) / 2048.f;
    constexpr float DEG2RAD = 0.01745329252f;
    gyro[0] = s16(6) / 16.4f * DEG2RAD; gyro[1] = s16(8) / 16.4f * DEG2RAD; gyro[2] = s16(10) / 16.4f * DEG2RAD;
  }

 private:
  static constexpr uint8_t REG_DEVICE_CONFIG = 0x11, REG_ACCEL_DATA_X1 = 0x1F, REG_PWR_MGMT0 = 0x4E,
                           REG_GYRO_CONFIG0 = 0x4F, REG_ACCEL_CONFIG0 = 0x50, REG_WHO_AM_I = 0x75;
  uint8_t cs_;
  SPIClass& spi_;
  SPISettings settings_{8000000, MSBFIRST, SPI_MODE0};

  uint8_t read(uint8_t reg) { uint8_t v; burstRead(reg, &v, 1); return v; }
  void write(uint8_t reg, uint8_t val) {
    spi_.beginTransaction(settings_); digitalWrite(cs_, LOW);
    spi_.transfer(reg & 0x7F); spi_.transfer(val);
    digitalWrite(cs_, HIGH); spi_.endTransaction();
  }
  void burstRead(uint8_t reg, uint8_t* out, int n) {
    spi_.beginTransaction(settings_); digitalWrite(cs_, LOW);
    spi_.transfer(reg | 0x80);
    for (int i = 0; i < n; ++i) out[i] = spi_.transfer(0);
    digitalWrite(cs_, HIGH); spi_.endTransaction();
  }
};
