// Single source of truth for geometry (millimetres) and key design parameters.
// The three.js models, the tutorials and the docs all quote these numbers.
// Coordinate system for the 3D models: Y is up, ground is y = 0, X/Z are horizontal.

export const MONO = {
  name: 'MC-1 Vane-Control Monocopter',
  // Coordinates for the CAD and the 3D model: z up, origin on the prop axis at the height of the vane hinge axes.
  prop: { diameterIn: 10, pitchIn: 4.5, radius: 127, z: 52 },      // 10 inch two-blade pusher prop, plane at z = 52
  motor: { radius: 17.5, height: 30, zTop: 90 },                    // 28xx outrunner hanging under the hub plate, shaft down
  postRadius: 145,        // four posts on the diagonals; ring centre-lines sit on this radius (18 mm outside the prop tips, 13 mm to the ring)
  postZ: [-75, 90],       // posts double as legs
  post: { t: 12, w: 24 },  // 12 mm radial x 24 mm tangential: twice the bending strength of the first 8 mm section
  arm: { w: 14, ribT: 3, ribH: 11 },   // arms are T-sections: 14 x 5 flange with a 3 x 11 rib on top
  ring: { band: 5, lowerH: 8, guardH: 10, guardZ: 52 },             // lower ring (servo nodes + half arcs) and prop guard ring
  vane: { chord: 55, span: 91, thickness: 2.6, rStart: 30, rEnd: 121, hingeFromLE: 16.5 },   // four vanes on the axes, hinge 30 % back
  vaneMaxDeflectionDeg: 25,
  hub: { radius: 22, z: [-7.5, 16.5] },                             // lower hub under the prop: carries the vane rods and the stators
  stator: { height: 40, thickness: 3.0 },                           // four fixed swirl-straightening fins on the diagonals
  plate: { radius: 58, z: [90, 95] },                               // hub plate: motor on the underside, battery on top
  deck: { w: 96, d: 88, z: [134, 137] },                            // electronics deck on four 39 mm standoffs
  standoff: { x: 36, y: 32, length: 39 },
  battery: { w: 75, h: 34, d: 35 },                                 // 4S 1500 mAh class
  servo: { L: 23, W: 12.2, H: 24 },                                 // 9 to 12 g metal-gear micro servo
  servoCount: 4,
  // Mixer sign convention is documented in docs/phase1-monocopter/05-firmware-and-control.md
};

export const ROCKET = {
  name: 'RK-1 TVC Rocket',
  frameSize: 110,         // square frame outer size
  frameThickness: 4,
  rodOffset: 47,          // rod position from axis (x and z), 4 rods on the diagonals
  rodRadius: 3,           // 6 mm rods
  rodBottomY: 135,           // 8 mm below the gimbal mount; rod length 400 mm
  rodTopY: 535,
  gimbalY: 150,           // gimbal pivot height
  landingFrameY: 238,
  landingFrameSize: 133,  // diamond: rotated 45 deg, corners on the leg axes
  batteryFrameY: 322,
  pcbFrameY: 406,
  telemetryFrameY: 490,
  motorTube: { od: 32, id: 29, length: 200, y0: 52 },
  gear: { module: 1, pinionTeeth: 18, sectorTeeth: 36 }, // ratio 2:1  (CAD: gear36t1, gear36t2)
  gimbalRangeDeg: 7,      // mechanical gimbal limit each axis
  legs: 4,
  legHingeRadius: 94,
  legHingeY: 238,
  footRadius: 255,
  legRadius: 4,
};

export const GEAR_RATIO = ROCKET.gear.sectorTeeth / ROCKET.gear.pinionTeeth;
