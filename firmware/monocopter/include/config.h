// MC-1 settings you are expected to change before the first flight.
#pragma once

// The vehicle makes its own Wi-Fi network; the phone joins it and opens http://192.168.4.1/
constexpr char WIFI_SSID[] = "MC1-FLY";
constexpr char WIFI_PASS[] = "monocopter-1";   // CHANGE THIS. At least 8 characters. Anyone who knows it can fly the vehicle.
constexpr int WIFI_CHANNEL = 6;                // 1, 6 or 11 are the least crowded; pick the quietest one near you
