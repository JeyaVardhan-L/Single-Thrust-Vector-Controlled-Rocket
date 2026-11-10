# Glossary

| Term | Meaning |
|---|---|
| **AHRS** | Attitude and Heading Reference System: estimates orientation from gyro and accelerometer (here Mahony filter) |
| **Abort (tilt)** | Software state in BOOST when nose tilt exceeds the limit: gimbal centred, recovery requested |
| **Backlash** | Free play between gear teeth or in a joint; shows up as dead-band in the thrust vector |
| **BEC** | Battery Eliminator Circuit: regulator that makes 5 V or 6 V from the flight battery |
| **CG / CP** | Centre of gravity / centre of pressure |
| **CRSF** | Crossfire serial protocol used by ExpressLRS receivers |
| **DShot** | Digital ESC protocol (not used in the baseline; 400 Hz PWM is) |
| **ELRS** | ExpressLRS, open-source RC link |
| **ESC** | Electronic speed controller for a brushless motor |
| **FRD** | Forward-Right-Down body axes |
| **FC** | Flight computer (Teensy 4.1 + sensors here) |
| **Gate** | A go / no-go checkpoint with written criteria |
| **Gimbal** | Two-axis pivot that swings the motor to vector the thrust |
| **Hang-fire** | A motor that does not ignite immediately but may start late. Wait before approaching |
| **I (inertia)** | Moment of inertia about the pitch/yaw axis, kg·m² |
| **IMU** | Inertial measurement unit: gyro + accelerometer |
| **KV** | Motor constant, rpm per volt (no load) |
| **L (lever arm)** | Distance from the gimbal pivot to the CG |
| **LiPo** | Lithium-polymer battery |
| **Mahony filter** | Complementary attitude filter using accelerometer to correct gyro integration |
| **Mixer** | Maps roll/pitch/yaw commands to individual actuator commands |
| **NAR / Tripoli / CAR / UKRA** | Rocketry associations (US, US, Canada, UK) with safety codes and motor certification |
| **PID** | Proportional-integral-derivative controller |
| **PLA / PETG / PA-CF** | 3D printing materials. PA-CF: nylon with carbon fibre |
| **Pyro channel** | Output that fires an e-match (here: parachute release only) |
| **RBF** | Remove-before-flight pin or loop that keeps the vehicle inert |
| **RSO** | Range Safety Officer |
| **Slew rate** | Maximum speed of an actuator, deg/s |
| **Thrust-to-weight (TWR)** | Thrust divided by weight |
| **TVC** | Thrust vector control |
| **Vane (jet vane)** | Control surface in the propeller or exhaust flow that deflects it sideways |
| **Wash** | The accelerated air stream behind a propeller |
