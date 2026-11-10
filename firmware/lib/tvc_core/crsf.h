// Minimal CRSF (Crossfire / ExpressLRS) receiver-side parser: RC_CHANNELS_PACKED frames only.
// Frame: [sync][len][type][payload ...][crc8]   len = type + payload + crc, CRC8 poly 0xD5 over type+payload.
// RC_CHANNELS_PACKED (type 0x16): 16 channels x 11 bit, little-endian bit packing, 22 payload bytes.
// Channel ticks 172..1811 map to roughly 1000..2000 us (992 = 1500 us).
#pragma once
#include <cstdint>

namespace tvc {

inline uint8_t crsfCrc8(const uint8_t* d, int n) {
  uint8_t c = 0;
  for (int i = 0; i < n; ++i) {
    c ^= d[i];
    for (int b = 0; b < 8; ++b) c = (c & 0x80) ? (uint8_t)((c << 1) ^ 0xD5) : (uint8_t)(c << 1);
  }
  return c;
}

class CrsfParser {
 public:
  uint16_t ticks[16] = {992, 992, 992, 992, 992, 992, 992, 992, 992, 992, 992, 992, 992, 992, 992, 992};
  uint32_t framesOk = 0, crcErrors = 0;

  static float ticksToUs(uint16_t t) { return t * 0.625f + 880.f; }
  float us(int ch) const { return ticksToUs(ticks[ch]); }
  // -1..1 around centre
  float norm(int ch) const { return (ticks[ch] - 992) / 819.5f; }

  // Feed one received byte. Returns true when a valid RC channel frame was just decoded.
  bool feed(uint8_t b) {
    if (pos_ == 0) {
      if (b == 0xC8 || b == 0xEE || b == 0xEA) buf_[pos_++] = b;   // sync / address byte
      return false;
    }
    buf_[pos_++] = b;
    if (pos_ == 2) {                                     // length byte
      if (buf_[1] < 2 || buf_[1] > 62) { pos_ = 0; }
      return false;
    }
    if (pos_ < 2 + buf_[1]) return false;               // still collecting
    const int len = buf_[1];
    pos_ = 0;
    if (crsfCrc8(&buf_[2], len - 1) != buf_[1 + len]) { ++crcErrors; return false; }
    ++framesOk;
    if (buf_[2] != 0x16 || len != 24) return false;      // not an RC channels frame
    unpack(&buf_[3]);
    return true;
  }

 private:
  void unpack(const uint8_t* p) {
    uint32_t acc = 0; int bits = 0, ch = 0;
    for (int i = 0; i < 22 && ch < 16; ++i) {
      acc |= (uint32_t)p[i] << bits; bits += 8;
      while (bits >= 11 && ch < 16) { ticks[ch++] = acc & 0x7FF; acc >>= 11; bits -= 11; }
    }
  }
  uint8_t buf_[64] = {0};
  int pos_ = 0;
};

}  // namespace tvc
