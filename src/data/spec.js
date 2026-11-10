// Single source of truth for geometry (millimetres) and key design parameters.
// The three.js models, the tutorials and the docs all quote these numbers.
// Coordinate system for the 3D models: Y is up, ground is y = 0, X/Z are horizontal.

export const MONO = {
  name: 'MC-1 Vane-Control Monocopter',
  ringRadius: 125,        // outer guard ring radius
  ringY: 205,             // guard ring height above ground
  ringTube: 3.2,          // ring section radius
  deckY: 92,              // vane deck height
  deckRadius: 125,
  propDiameter: 152,      // 6 inch
  propY: 160,
  motorY: 182,
  motor: { radius: 14, height: 18 },      // 2306 stator bell approx (28 mm dia)
  hubRadius: 46,
  legs: 3,
  legFootRadius: 150,
  vane: { chord: 46, span: 62, thickness: 2.4, radialStart: 26 },
  servoCount: 4,
  battery: { w: 75, h: 33, d: 36 },       // 4S 1300 mAh class
  vaneMaxDeflectionDeg: 25,
  // Mixer sign convention is documented in docs/phase1-monocopter/05-firmware-and-control.md
};

export const ROCKET = {
  name: 'RK-1 TVC Rocket',
  frameSize: 110,         // square frame outer size
  frameThickness: 4,
  rodOffset: 47,          // rod position from axis (x and z), 4 rods on the diagonals
  rodRadius: 3,           // 6 mm rods
  rodBottomY: 110,
  rodTopY: 600,
  gimbalY: 150,           // gimbal pivot height
  landingFrameY: 238,
  battery1FrameY: 322,
  pcbFrameY: 404,
  battery2FrameY: 486,
  telemetryFrameY: 568,
  motorTube: { od: 32, id: 29, length: 200, y0: 52 },
  gear: { module: 1, pinionTeeth: 18, sectorTeeth: 36 }, // ratio 2:1  (CAD: gear36t1, gear36t2)
  gimbalRangeDeg: 7,      // mechanical gimbal limit each axis
  legs: 4,
  legHingeRadius: 70,
  legHingeY: 238,
  footRadius: 235,
  legRadius: 4,
};

export const GEAR_RATIO = ROCKET.gear.sectorTeeth / ROCKET.gear.pinionTeeth;
