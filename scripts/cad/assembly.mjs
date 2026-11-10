// Assembly check: places every RK-1 part (plus the bought parts that share its space) in the rocket frame and
// measures the volume common to each pair at several gimbal poses. Zero (within tessellation noise) means the parts fit.
// Frame: origin on the gimbal pivot, z up the rocket axis. Poses: ring about X by ax, collar about Y by az (degrees).
import { ROCKET as S } from '../../src/data/spec.js';
import { Manifold, cylA, boxM } from './lib.mjs';
import * as R from './rocket.mjs';

const GY = S.gimbalY;
const zOf = (y) => y - GY;
export const NOISE_MM3 = 0.5;

function envelope() {
  const sv = R.SERVO, G = R.G;
  const dist = G.pinionAxisDist;
  const fixed = {}, ring = {}, collar = {};
  // ---- fixed to the rods / mount ----
  fixed.mount = R.gimbalMount();
  fixed.bracket1 = R.servoBracket1();
  const topX = G.sec1[1] + 0.6;
  fixed.servo1 = boxM(topX, topX + sv.H, -sv.shaftFromEnd, sv.L - sv.shaftFromEnd, -dist - sv.W / 2, -dist + sv.W / 2);
  for (const [name, kind, y] of [['plateTel', 'telemetry', S.telemetryFrameY], ['platePcb', 'pcb', S.pcbFrameY], ['plateBat', 'battery', S.batteryFrameY]]) {
    fixed[name] = R.stackPlate(kind).translate([0, 0, zOf(y)]);
  }
  fixed.landing = R.landingFrame().translate([0, 0, zOf(S.landingFrameY)]);
  const rodBottom = zOf(S.rodBottomY), rodLen = S.rodTopY - S.rodBottomY;
  [[47, 47], [47, -47], [-47, 47], [-47, -47]].forEach(([x, y], i) => { fixed['rod' + i] = cylA('z', S.rodRadius, rodBottom, rodBottom + rodLen, x, y); });
  // legs: hinge fitting + Ø8 rod, at the four lugs
  const phi = R.LEG.angleFromVertical;
  const hinge = R.legHinge().rotate([90, 0, 0]).rotate([0, 90 - phi, 0]).translate([R.LUG.R, 0, zOf(S.landingFrameY) - R.LUG.pinDrop]);
  const d = R.LEG.dir;
  for (let i = 0; i < 4; i++) {
    fixed['hinge' + i] = hinge.rotate([0, 0, i * 90]);
    const pin = [R.LUG.R, 0, zOf(S.landingFrameY) - R.LUG.pinDrop];
    const len = 260;                                                      // Ø8 x 260 mm rod from the socket bottom
    const c = Manifold.cylinder(len, 4, 4, 48, false);                  // along +z, then aim along d = (dx, 0, dz)
    const tilt = Math.atan2(d[0], d[1]) * 180 / Math.PI;                 // angle from vertical (about y)
    const aimed = c.rotate([180, 0, 0]).rotate([0, -tilt, 0]);           // pointing down and out along +x
    const start = [pin[0] + d[0] * 12, pin[1], pin[2] - d[1] * 12];
    fixed['leg' + i] = aimed.translate(start).rotate([0, 0, i * 90]);
  }
  // ---- carried by the outer ring (rotates about X) ----
  ring.ring = R.gimbalRing();
  ring.bracket2 = R.servoBracket2();
  const topY = G.sec2[1] + 0.6;
  ring.servo2 = boxM(-sv.shaftFromEnd, sv.L - sv.shaftFromEnd, topY, topY + sv.H, dist - sv.W / 2, dist + sv.W / 2);
  // ---- carried by the collar (rotates about X and Y) ----
  collar.collar = R.gimbalCollar();
  collar.tube = cylA('z', 21, R.MOTOR.tubeBottom, R.MOTOR.tubeBottom + R.MOTOR.tubeLen);
  collar.plateA = R.motorPlateUpper();
  collar.plateB = R.motorPlateLower();
  collar.motorA = cylA('z', 17.5, R.MOTOR.zA[0] - 18, R.MOTOR.zA[0]);
  collar.motorB = cylA('z', 17.5, R.MOTOR.zB[1], R.MOTOR.zB[1] + 18);
  collar.propA = cylA('z', 114, -53, -51);
  collar.propB = cylA('z', 114, -67, -65);
  R.MOTOR.armAngles.forEach((a, i) => {
    collar['armA' + i] = R.cageArm(true).rotate([0, 0, a]);
    collar['armB' + i] = R.cageArm(false).rotate([0, 0, a]);
    collar['strut' + i] = R.cageStrut().translate([R.MOTOR.armR, 0, 0]).rotate([0, 0, a]);
    collar['arc' + i] = R.guardArc().rotate([0, 0, a]);
  });
  return { fixed, ring, collar };
}

export function pinions(ax, az) {
  const G = R.G, dist = G.pinionAxisDist;
  const p1 = R.pinion().rotate([0, 0, 10 - 2 * ax]).rotate([0, 90, 0]).translate([G.sec1[0], 0, -dist]);
  const p2 = R.pinion().rotate([0, 0, -2 * az]).rotate([-90, 0, 0]).translate([0, G.sec2[0], dist]);
  return { p1, p2 };
}

export const POSES = [[0, 0], [7, 0], [-7, 0], [0, 7], [0, -7], [7, 7], [-7, -7], [7, -7], [-7, 7]];

export function checkAssembly(poses = POSES, log = () => {}) {
  const env = envelope();
  const issues = [];
  let pairs = 0;
  for (const [ax, az] of poses) {
    const solids = [];
    for (const [k, m] of Object.entries(env.fixed)) solids.push([k, m]);
    const pin = pinions(ax, az);
    solids.push(['pinion1', pin.p1]);
    for (const [k, m] of Object.entries(env.ring)) solids.push([k, m.rotate([ax, 0, 0])]);
    solids.push(['pinion2', pin.p2.rotate([ax, 0, 0])]);
    for (const [k, m] of Object.entries(env.collar)) solids.push([k, m.rotate([0, az, 0]).rotate([ax, 0, 0])]);
    const boxes = solids.map(([, m]) => m.boundingBox());
    for (let i = 0; i < solids.length; i++) for (let j = i + 1; j < solids.length; j++) {
      const a = boxes[i], b = boxes[j];
      if (a.max[0] < b.min[0] || b.max[0] < a.min[0] || a.max[1] < b.min[1] || b.max[1] < a.min[1] || a.max[2] < b.min[2] || b.max[2] < a.min[2]) continue;
      pairs++;
      const v = solids[i][1].intersect(solids[j][1]).volume();
      if (v > NOISE_MM3) issues.push({ pose: [ax, az], a: solids[i][0], b: solids[j][0], mm3: +v.toFixed(2) });
    }
    log(`pose ax=${ax} az=${az}: ${issues.length} issues so far`);
  }
  return { issues, pairs, solids: Object.keys(env.fixed).length + Object.keys(env.ring).length + Object.keys(env.collar).length + 2 };
}
