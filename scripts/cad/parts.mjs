// Registry of every printable part: file name, quantity, material, BOM line and print orientation.
// `build()` returns the solid in its design frame; `rot` turns it into the print orientation.
import * as R from './rocket.mjs';

const PA = 'PA-CF (or PETG for a first set)';
export const PARTS = [
  // ---- RK-1 rocket ------------------------------------------------------------------
  { id: 'stack-plate-telemetry', vehicle: 'rocket', name: 'Stack plate, telemetry (top)', qty: 1, material: 'PETG', bom: 'R-02', build: () => R.stackPlate('telemetry'), rot: [0, 0, 0],
    note: 'Ø6.2 rod holes with M3 clamp screws and nut slots; three M3 insert holes for the receiver / GPS standoffs.' },
  { id: 'stack-plate-pcb', vehicle: 'rocket', name: 'Stack plate, flight computer (middle)', qty: 1, material: 'PETG', bom: 'R-02', build: () => R.stackPlate('pcb'), rot: [0, 0, 0],
    note: 'Four M3 insert holes at (±38, ±22) for the 9 mm standoffs under the carrier board.' },
  { id: 'stack-plate-battery', vehicle: 'rocket', name: 'Stack plate, batteries (bottom of the stack)', qty: 1, material: 'PETG', bom: 'R-02', build: () => R.stackPlate('battery'), rot: [0, 0, 0],
    note: 'Two strap slots 12 × 3 mm at y = ±36.' },
  { id: 'landing-frame', vehicle: 'rocket', name: 'Landing frame (diamond, 4 hinge clevises)', qty: 1, material: PA, bom: 'R-03', build: () => R.landingFrame(), rot: [180, 0, 0],
    note: 'Printed upside down so the clevis ears point up. Hinge bore Ø3.2 for an M3 bolt.' },
  { id: 'gimbal-mount', vehicle: 'rocket', name: 'Gimbal mount (square frame on the rods)', qty: 1, material: PA, bom: 'G-01', build: () => R.gimbalMount(), rot: [0, 0, 0],
    note: 'Carries the outer ring on two M3 pivots (X axis), the servo-1 bracket underneath and four leg-brace anchor holes.' },
  { id: 'gimbal-ring', vehicle: 'rocket', name: 'Gimbal outer ring (with 36T sector, axis 1)', qty: 1, material: PA, bom: 'G-01, G-02', build: () => R.gimbalRing(), rot: [180, 0, 0],
    note: 'Printed upside down: sector fin points up. Two 683ZZ bearings in the X bosses; Y pads carry the collar pivots. Ream the Ø7 bearing bores.' },
  { id: 'gimbal-collar', vehicle: 'rocket', name: 'Gimbal inner collar (with 36T sector, axis 2)', qty: 1, material: PA, bom: 'G-01, G-02', build: () => R.gimbalCollar(), rot: [0, 0, 0],
    note: 'Clamps the Ø42 tube with four M3 set screws. Two 683ZZ bearings in the Y bosses.' },
  { id: 'pinion-18t', vehicle: 'rocket', name: 'Pinion, 18 teeth, module 1', qty: 2, material: 'PA12 / acetal (or metal)', bom: 'G-02', build: () => R.pinion(), rot: [0, 0, 0],
    note: 'Ø4.7 bore for the 25T servo spline. Rotate on the spline until it meshes (gap centred on the sector tooth).' },
  { id: 'servo-bracket-1', vehicle: 'rocket', name: 'Servo bracket, axis 1 (under the mount)', qty: 1, material: PA, bom: 'G-01', build: () => R.servoBracket1(), rot: [0, -90, 0],
    note: 'Two M3 × 10 into the mount inserts; four M2 self-tap holes for a 23 × 12 mm servo.' },
  { id: 'servo-bracket-2', vehicle: 'rocket', name: 'Servo bracket, axis 2 (on top of the ring)', qty: 1, material: PA, bom: 'G-01', build: () => R.servoBracket2(), rot: [90, 0, 0],
    note: 'Two M3 × 10 into the ring inserts; four M2 self-tap holes for the servo.' },
  { id: 'motor-plate-upper', vehicle: 'rocket', name: 'Motor plate, upper (tube socket + motor A)', qty: 1, material: PA, bom: 'M-05', build: () => R.motorPlateUpper(), rot: [0, 0, 0],
    note: 'Ø42.3 socket for the carbon tube (epoxy + two M3 set screws). Motor pattern Ø19, four M3, reached through the tube bore.' },
  { id: 'motor-plate-lower', vehicle: 'rocket', name: 'Motor plate, lower (motor B)', qty: 1, material: PA, bom: 'M-05', build: () => R.motorPlateLower(), rot: [0, 0, 0],
    note: 'Motor B stands on it; screws from below.' },
  { id: 'cage-arm-upper', vehicle: 'rocket', name: 'Cage arm, upper', qty: 3, material: PA, bom: 'M-05', build: () => R.cageArm(true), rot: [0, 0, 0],
    note: 'Half-lap onto the plate stub, two M3 × 12 with nuts; tip bolts to the strut.' },
  { id: 'cage-arm-lower', vehicle: 'rocket', name: 'Cage arm, lower', qty: 3, material: PA, bom: 'M-05', build: () => R.cageArm(false), rot: [0, 0, 0],
    note: 'Same as the upper arm, on the lower plate.' },
  { id: 'cage-strut', vehicle: 'rocket', name: 'Cage strut (60 mm)', qty: 3, material: PA, bom: 'M-05', build: () => R.cageStrut(), rot: [0, 0, 0],
    note: 'M3 inserts in both ends (screws M3 × 10 through the arms) and two on the outer face for the guard-ring tabs.' },
  { id: 'guard-arc', vehicle: 'rocket', name: 'Guard-ring arc (120°)', qty: 3, material: 'PETG', bom: 'M-05', build: () => R.guardArc(), rot: [0, 0, 0],
    note: 'Tabs screw onto the struts with M3 × 10.' },
  { id: 'leg-hinge', vehicle: 'rocket', name: 'Leg hinge fitting', qty: 4, material: PA, bom: 'R-04', build: () => R.legHinge(), rot: [0, 0, 0],
    note: 'Ø8.2 socket for the Ø8 carbon leg (epoxy), Ø3.2 pin bore. Tongue 12.6 mm sits between the frame lug ears.' },
  { id: 'leg-clip', vehicle: 'rocket', name: 'Brace clip', qty: 4, material: 'PETG', bom: 'R-05', build: () => R.legClip(), rot: [0, 0, 0],
    note: 'Slides onto the leg, M3 grub screw; Ø2.2 eyelet for the Ø1.6 brace wire.' },
];

export const PRINT_BED = { x: 220, y: 220, z: 250 };      // the smallest bed the parts are designed for
