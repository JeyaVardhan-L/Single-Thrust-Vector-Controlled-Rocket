// Prints PhoneMode::mixWheel for fixed inputs; test/phone-app.test.mjs compares the numbers with the web page's JavaScript.
#include <cstdio>
#include "phone_mode.h"
int main() {
  const float in[][4] = {{0, 1, 0, 1}, {0, -1, 0, 1}, {1, 0, 0, 1}, {-1, 0, 0, 1}, {0.6f, 0.8f, 0, 1}, {3, 4, 0, 1}, {0.3f, 0.2f, 0.5f, 0.8f}, {0, 0, 1, 1.3f}, {0.02f, 0.02f, 0, 1}, {0.5f, -0.5f, -0.4f, 0.7f}};
  tvc::PhoneMode m;
  for (const auto& i : in) {
    float v[4];
    m.mixWheel(i[0], i[1], i[2], i[3], 0.f, 0.f, v);
    std::printf("%.6f %.6f %.6f %.6f\n", v[0], v[1], v[2], v[3]);
  }
  return 0;
}
