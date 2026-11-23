// MC-1 vane monocopter: printable parts. Frame = vehicle frame, z up, origin on the prop axis at the height of the vane hinge axes.
//
// Layout, bottom to top:  feet / posts (z -75..90)  ·  vanes + stators + lower hub (z -23..17)  ·  guard ring (prop plane z 52)
//   ·  motor hanging under the hub plate, shaft down (z 60..90)  ·  hub plate (z 90..95)  ·  battery (z 98..132)  ·  electronics deck (z 134..138).
// Four posts on the diagonals carry everything and double as legs. Four vanes sit on the axes and are driven directly by four servos
// in cradles that are also the corner nodes of the lower ring.
import { MONO as M } from '../../src/data/spec.js';
import { Manifold, TOL, PI, rad, union, diff, boxM, cylA, hexA, rrect, extrude, arcBand, poly } from './lib.mjs';
import { SERVO } from './rocket.mjs';

const DEG = 180 / PI;
export const DIAG = [45, 135, 225, 315];
export const AXES = [0, 90, 180, 270];
const R = M.postRadius;                                   // 145
const [Z0, Z1] = M.plate.z;                               // 90..95
const INS = TOL.insert / 2;
const STANDOFFS = [[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([a, b]) => [a * M.standoff.x, b * M.standoff.y]);

export const MC = {
  post: { u: [-M.post.t / 2, M.post.t / 2], v: M.post.w / 2 },
  node: { v: 32, u: [-5, 4], h: 22 },                      // servo cradle / lower-ring node
  servoTopX: R - 5.6,                                      // servo top face (shaft side) on the vane axis: 139.4
  rod: { d: 3, x: [16, R - 13] },                          // Ø3 x 116 rod: hub bore to adapter
  adapter: { x: [R - 18, R - 12], r: 10 },                 // 6 thick: clears the cradle plate (x 140) while the vane is slid in
  hornX: [R - 11.5, R - 9],
  armRoot: [58, 84], armBolts: [62, 70, 78], lap: 2.5, armW: M.arm.w, armPadBolts: 7, ribFrom: 88,
  ringZ: { lower: 0, guard: M.ring.guardZ },
};

// ---------------------------------------------------------------- hub plate (motor under, battery on top)
export function hubPlate() {
  const adds = [cylA('z', M.plate.radius, Z0, Z1)], cuts = [cylA('z', 8, Z0 - 1, Z1 + 1)];
  for (const a of DIAG) {
    adds.push(poly([[M.plate.radius - 4, -MC.armW / 2], [MC.armRoot[1], -MC.armW / 2], [MC.armRoot[1], MC.armW / 2], [M.plate.radius - 4, MC.armW / 2]], Z0 + MC.lap, Z1).rotate([0, 0, a]));
    for (const r of MC.armBolts) cuts.push(cylA('z', TOL.m3 / 2, Z0 - 1, Z1 + 1, r, 0).rotate([0, 0, a]));
  }
  for (const rr of [11.31, 13.44]) for (const a of DIAG) cuts.push(cylA('z', TOL.m3 / 2, Z0 - 1, Z1 + 1, rr * Math.cos(rad(a)), rr * Math.sin(rad(a))));   // 16 x 16 and 19 x 19 motor patterns
  for (const [x, y] of STANDOFFS) cuts.push(cylA('z', TOL.m3 / 2, Z0 - 1, Z1 + 1, x, y));
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) cuts.push(extrude(rrect(22, 3, 1.5), Z0 - 1, Z1 + 1).translate([sx * 20, sy * 22.5, 0]));   // battery strap slots
  for (const a of [0, 90, 180, 270]) cuts.push(arcBand(50, 25, a - 28, a + 28, Z0 - 1, Z1 + 1));                  // lightening windows between the arm spokes
  return diff(union(adds), cuts);
}

// ---------------------------------------------------------------- electronics deck
export function deckPlate() {
  const [z0, z1] = M.deck.z;
  const cuts = [];
  for (const [x, y] of STANDOFFS) cuts.push(cylA('z', TOL.m3 / 2, z0 - 1, z1 + 1, x, y));
  for (const [x, y] of [[-24, 12], [-24, -12], [24, 12], [24, -12], [0, 26], [0, -26], [-38, 0], [38, 0]]) {
    cuts.push(extrude(rrect(10, 2.6, 1.2), z0 - 1, z1 + 1).translate([x, y, 0]));         // zip-tie slots for ESC, ESP32, BECs
  }
  return diff(extrude(rrect(M.deck.w, M.deck.d, 12), z0, z1), cuts);
}

// ---------------------------------------------------------------- arm (4x): plate stub to post top. Underside is one flat plane.
// T-section: 14 x 5 flange with a 3 x 11 rib on top (about five times the vertical bending strength of a flat 12 x 5 bar). The end widens to a
// 12 x 24 pad that sits on the whole top face of the post and takes two M3 screws.
export function arm() {
  const w = MC.armW / 2, pv = M.post.w / 2, pu = M.post.t / 2;
  const bar = poly([[MC.armRoot[1], -w], [R - 20, -w], [R - pu - 2, -pv], [R + pu, -pv], [R + pu, pv], [R - pu - 2, pv], [R - 20, w], [MC.armRoot[1], w]], Z0, Z1);
  const root = poly([[MC.armRoot[0], -8], [MC.armRoot[1], -8], [MC.armRoot[1], 8], [MC.armRoot[0], 8]], Z0, Z0 + MC.lap);
  const rib = boxM(MC.ribFrom, R - pu - 2, -M.arm.ribT / 2, M.arm.ribT / 2, Z1 - 0.5, Z1 + M.arm.ribH);
  const cuts = [];
  for (const y of [-MC.armPadBolts, MC.armPadBolts]) cuts.push(cylA('z', TOL.m3 / 2, Z0 - 1, Z1 + 1, R, y));
  for (const r of MC.armBolts) { cuts.push(cylA('z', TOL.m3 / 2, Z0 - 1, Z1 + 1, r, 0)); cuts.push(hexA('z', TOL.nutAF, Z0 - 1, Z0 + MC.lap + 0.001, r, 0)); }
  return diff(union([bar, root, rib]), cuts);
}

// ---------------------------------------------------------------- post (4x): also the leg. Design frame: centred on (R, 0).
export function post() {
  const [zl, zh] = M.postZ, [u0, u1] = MC.post.u, v = MC.post.v;
  let m = boxM(R + u0, R + u1, -v, v, zl, zh);
  const cuts = [-MC.armPadBolts, MC.armPadBolts].map((y) => cylA('z', INS, zh - 6, zh + 1, R, y));   // two arm screws
  for (const z of [-17, 10]) cuts.push(cylA('x', INS, R + u0 - 1, R + u0 + 6, 0, z));     // stator screws, from the inner face
  for (const zc of [MC.ringZ.lower, MC.ringZ.guard]) for (const s of [-1, 1]) cuts.push(cylA('x', INS, R + u1 - 6, R + u1 + 1, s * 7, zc));   // ring tab screws, outer face
  for (const [a, b] of [[-69, -25], [18, 44], [62, 80]]) cuts.push(boxM(R + u0 - 1, R + u1 + 1, -4.5, 4.5, a, b));   // lightening windows
  return diff(m, cuts);
}

// ---------------------------------------------------------------- ring: tabs, half-arcs, guard arcs, servo cradle nodes
/** Tab that screws onto the outer face of a node (half width vh): local frame u radial from R, v tangential, tab on the v >= vh-8 side. */
function endTab(vh, uOuter, zc, zh) {
  return union([boxM(uOuter, uOuter + 3.5, vh - 8, vh + 3.5, zc - zh, zc + zh), boxM(-M.ring.band / 2, uOuter + 3.5, vh, vh + 3.5, zc - zh, zc + zh)]);
}
const tabBolt = (vh, uOuter, zc) => cylA('x', TOL.m3 / 2, uOuter - 1, uOuter + 5, vh - 4.5, zc);
/** Arc between angles a0..a1 (deg) with tabs. `ends`: array of {angle, vh, uOuter, side} (side +1: arc lies at larger angle than the node). */
function arcWithTabs({ a0, a1, h, zc, ends }) {
  const parts = [arcBand(R + M.ring.band / 2, R - M.ring.band / 2, a0, a1, zc - h / 2, zc + h / 2)], cuts = [];
  for (const e of ends) {
    let t = endTab(e.vh, e.uOuter, zc, h / 2), b = tabBolt(e.vh, e.uOuter, zc);
    if (e.side < 0) { t = t.mirror([0, 1, 0]); b = b.mirror([0, 1, 0]); }
    parts.push(t.translate([R, 0, 0]).rotate([0, 0, e.angle]));
    cuts.push(b.translate([R, 0, 0]).rotate([0, 0, e.angle]));
  }
  return diff(union(parts), cuts);
}
const ang = (vh, r = R - M.ring.band / 2) => Math.asin(vh / r) * DEG;
/** Guard arc: 90 degrees between two posts (centred on a vane axis), prop-guard ring. */
export function guardArc() {
  const zc = MC.ringZ.guard, h = M.ring.guardH;
  return arcWithTabs({ a0: -45 + ang(MC.post.v), a1: 45 - ang(MC.post.v), h, zc,
    ends: [{ angle: -45, vh: MC.post.v, uOuter: MC.post.u[1], side: +1 }, { angle: 45, vh: MC.post.v, uOuter: MC.post.u[1], side: -1 }] });
}
/** Lower half-arc from a servo node (angle 0) to a post (45 deg). The other side of the node uses the same part turned over. */
export function lowerHalfArc() {
  const zc = MC.ringZ.lower, h = M.ring.lowerH;
  return arcWithTabs({ a0: ang(MC.node.v), a1: 45 - ang(MC.post.v), h, zc,
    ends: [{ angle: 0, vh: MC.node.v, uOuter: MC.node.u[1], side: +1 }, { angle: 45, vh: MC.post.v, uOuter: MC.post.u[1], side: -1 }] });
}
/** Servo cradle / lower-ring node on the vane axis (+x): window for the servo body, pocket for its ears, M2 ear holes, two tab inserts per side. */
export function servoCradle() {
  const a = SERVO.shaftFromEnd, L = SERVO.L, [u0, u1] = MC.node.u, hz = MC.node.h / 2;
  const plateOut = MC.servoTopX + 0.6 + 4;                                                // plate outer face = ear plane (143.9)
  let m = boxM(R + u0, R + u1, -MC.node.v, MC.node.v, -hz, hz);
  const cuts = [
    boxM(MC.servoTopX - 6, plateOut, -(a + 0.3), L - a + 0.4, -(SERVO.W / 2 + 0.3), SERVO.W / 2 + 0.3),                 // body window
    boxM(plateOut, R + 8, L / 2 - a - SERVO.ear / 2 - 0.4, L / 2 - a + SERVO.ear / 2 + 0.4, -(SERVO.W / 2 + 0.3), SERVO.W / 2 + 0.3),   // ear pocket
  ];
  for (const y of [L / 2 - a - SERVO.ear / 2, L / 2 - a + SERVO.ear / 2]) cuts.push(cylA('x', 0.85, plateOut - 3.5, plateOut + 0.5, y, 0));
  for (const s of [-1, 1]) cuts.push(cylA('x', INS, R + u1 - 5.5, R + u1 + 1, s * (MC.node.v - 4.5), MC.ringZ.lower));   // arc tab screws
  return diff(m, cuts);
}

// ---------------------------------------------------------------- lower hub (under the prop) and stators
const [HZ0, HZ1] = M.hub.z, [SZ0, SZ1] = [HZ1 - M.stator.height, HZ1];
const STAT_HUB_Z = [2, 11], STAT_POST_Z = [-17, 10];
export function lowerHub() {
  const rh = M.hub.radius;
  const adds = [cylA('z', rh, HZ0, HZ1)], cuts = [cylA('z', 9, HZ0 - 1, HZ1 + 1)];
  for (const a of AXES) cuts.push(cylA('x', 1.65, 16, rh + 1, 0, 0).rotate([0, 0, a]));      // Ø3.3 bores for the vane rods
  for (const a of DIAG) {
    cuts.push(boxM(13, rh + 1, -1.65, 1.65, HZ0 - 1, HZ1 + 1).rotate([0, 0, a]));            // stator slots
    for (const z of STAT_HUB_Z) {
      cuts.push(cylA('y', TOL.m3 / 2, -rh, rh, 18.5, z).rotate([0, 0, a]));
      cuts.push(hexA('y', TOL.nutAF, 8, rh, 18.5, z, 0).rotate([0, 0, a]));                  // nut pocket, open to the hub surface
    }
  }
  return diff(union(adds), cuts);
}
/** Stator fin on the diagonal, local +x radial. Inner end sits in a hub slot, outer end screws to the post. */
export function stator() {
  const t = M.stator.thickness / 2, xi = R + MC.post.u[0];
  const fin = boxM(14, xi - 4, -t, t, SZ0, SZ1);
  const flange = boxM(xi - 4, xi, -9, 9, SZ0, SZ1);
  const cuts = [];
  for (const z of STAT_HUB_Z) cuts.push(cylA('y', TOL.m3 / 2, -3, 3, 18.5, z));
  for (const z of STAT_POST_Z) cuts.push(cylA('x', TOL.m3 / 2, xi - 5, xi + 1, 0, z));
  return diff(union([fin, flange]), cuts);
}

// ---------------------------------------------------------------- vane + horn adapter + foot
/** Vane on the +x axis: Ø6 spine with a Ø3.1 rod bore, thin plate offset below the spine so the underside is one plane. */
export function vane() {
  const x0 = M.vane.rStart, x1 = M.vane.rEnd;
  const zTop = M.vane.hingeFromLE, zBot = zTop - M.vane.chord;                            // +16.5 .. -38.5
  const plate = boxM(x0, x1, -3.0, -3.0 + M.vane.thickness, zBot, zTop);
  const spine = cylA('x', 3, x0, x1 + 2, 0, 0);
  return diff(union([plate, spine]), [cylA('x', 1.55, x0 - 1, x1 + 3, 0, 0)]);
}
/** Horn adapter: Ø20 disc that carries the rod end and screws to the servo horn: four M2 x 10 from the inner face, heads in counterbores. Axis x. */
export function hornAdapter() {
  const [a0, a1] = MC.adapter.x;
  const cuts = [cylA('x', 1.55, a0 - 1, a0 + 5)];                                          // blind Ø3.1 bore for the rod end
  for (let k = 0; k < 4; k++) {
    const t = rad(45 + 90 * k), y = 7 * Math.cos(t), z = 7 * Math.sin(t);
    cuts.push(cylA('x', 1.1, a0 - 1, a1 + 1, y, z), cylA('x', 2.1, a0 - 1, a0 + 1.8, y, z));
  }
  return diff(cylA('x', MC.adapter.r, a0, a1), cuts);
}
/** Foot cap for a post end (print in TPU). */
export function foot() {
  return diff(extrude(rrect(M.post.t + 8, M.post.w + 8, 6), 0, 20), [extrude(rrect(M.post.t + 0.4, M.post.w + 0.4, 1), 6, 21)]);
}
