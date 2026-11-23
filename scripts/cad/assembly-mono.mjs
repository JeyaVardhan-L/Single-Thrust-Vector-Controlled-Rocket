// MC-1 assembly check: every printable part plus the bought parts that share its space (motor, prop disc, battery, servos, horns,
// vane rods, standoffs). Measures the volume common to each pair with the vanes at several deflections.
import { MONO as M } from '../../src/data/spec.js';
import { cylA, boxM } from './lib.mjs';
import * as C from './mono.mjs';
import { SERVO } from './rocket.mjs';

export const NOISE_MM3 = 0.5;
export const VANE_POSES = [
  [0, 0, 0, 0], [25, 25, 25, 25], [-25, -25, -25, -25],        // neutral, full yaw both ways
  [25, 0, -25, 0], [-25, 0, 25, 0], [0, 25, 0, -25], [0, -25, 0, 25],   // roll, pitch
  [25, -25, 25, -25], [-25, 25, -25, 25],                       // opposite-pair extremes
];

function bodies() {
  const fixed = {}, vaneGroup = {};
  fixed.hubPlate = C.hubPlate();
  fixed.deck = C.deckPlate();
  fixed.hubLower = C.lowerHub();
  fixed.motor = cylA('z', M.motor.radius, M.motor.zTop - M.motor.height, M.motor.zTop);
  fixed.prop = cylA('z', M.prop.radius, M.prop.z - 1, M.prop.z + 1);
  fixed.battery = boxM(-M.battery.w / 2, M.battery.w / 2, -M.battery.d / 2, M.battery.d / 2, M.plate.z[1] + 3, M.plate.z[1] + 3 + M.battery.h);
  for (const [x, y] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    fixed['standoff' + x + y] = cylA('z', 2.75, M.plate.z[1], M.deck.z[0], x * M.standoff.x, y * M.standoff.y);
  }
  C.DIAG.forEach((a, i) => {
    fixed['arm' + i] = C.arm().rotate([0, 0, a]);
    fixed['post' + i] = C.post().rotate([0, 0, a]);
    fixed['stator' + i] = C.stator().rotate([0, 0, a]);
  });
  C.AXES.forEach((a, i) => {
    fixed['cradle' + i] = C.servoCradle().rotate([0, 0, a]);
    fixed['halfArcP' + i] = C.lowerHalfArc().rotate([0, 0, a]);
    fixed['halfArcN' + i] = C.lowerHalfArc().rotate([180, 0, 0]).rotate([0, 0, a]);     // same part turned over
    fixed['guard' + i] = C.guardArc().rotate([0, 0, a]);
    const topX = C.MC.servoTopX;
    fixed['servo' + i] = boxM(topX, topX + SERVO.H, -SERVO.shaftFromEnd, SERVO.L - SERVO.shaftFromEnd, -SERVO.W / 2, SERVO.W / 2).rotate([0, 0, a]);
    vaneGroup['vane' + i] = C.vane();
    vaneGroup['adapter' + i] = C.hornAdapter();
    vaneGroup['rod' + i] = cylA('x', C.MC.rod.d / 2, C.MC.rod.x[0], C.MC.rod.x[1], 0, 0);
    vaneGroup['horn' + i] = boxM(C.MC.hornX[0], C.MC.hornX[1], -11, 11, -4, 4);
  });
  return { fixed, vaneGroup };
}

export function checkMono(poses = VANE_POSES, log = () => {}) {
  const { fixed, vaneGroup } = bodies();
  const issues = [];
  let pairs = 0;
  for (const pose of poses) {
    const solids = Object.entries(fixed);
    for (const [k, m] of Object.entries(vaneGroup)) {
      const i = +k.slice(-1);
      solids.push([k, m.rotate([pose[i], 0, 0]).rotate([0, 0, C.AXES[i]])]);
    }
    const bb = solids.map(([, m]) => m.boundingBox());
    for (let i = 0; i < solids.length; i++) for (let j = i + 1; j < solids.length; j++) {
      const a = bb[i], b = bb[j];
      if (a.max[0] < b.min[0] || b.max[0] < a.min[0] || a.max[1] < b.min[1] || b.max[1] < a.min[1] || a.max[2] < b.min[2] || b.max[2] < a.min[2]) continue;
      pairs++;
      const v = solids[i][1].intersect(solids[j][1]).volume();
      if (v > NOISE_MM3) issues.push({ pose, a: solids[i][0], b: solids[j][0], mm3: +v.toFixed(2) });
    }
    log(`vane pose ${pose.join(',')}: ${issues.length} issues so far`);
  }
  return { issues, pairs, solids: Object.keys(fixed).length + Object.keys(vaneGroup).length };
}

/** Assembly order check: the frame is closed (no hub plate, arms, motor, servos or horns yet); each vane assembly is lowered from the top with
 *  its rod tip at the hub bore mouth (6 mm outside its final position) and then slid in. It must not touch anything in that pose. */
export function checkVaneInstall(log = () => {}) {
  const { fixed, vaneGroup } = bodies();
  const frame = Object.entries(fixed).filter(([k]) => /^(hubLower|post|stator|cradle|halfArc|guard)/.test(k));
  const issues = [];
  for (const [k, m] of Object.entries(vaneGroup)) {
    if (!/^(vane|adapter|rod)/.test(k)) continue;                      // the horn comes later, on the servo
    const i = +k.slice(-1);
    const placed = m.translate([6, 0, 0]).rotate([0, 0, C.AXES[i]]);
    for (const [fk, fm] of frame) {
      const v = placed.intersect(fm).volume();
      if (v > NOISE_MM3) issues.push({ a: k, b: fk, mm3: +v.toFixed(2) });
    }
  }
  log(`install pose: ${issues.length} issues`);
  return { issues };
}
