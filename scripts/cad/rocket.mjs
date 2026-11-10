// RK-1 printable parts. Every dimension derives from src/data/spec.js or from the constants below.
//
// Design frame of each part = the frame used for the assembly check (scripts/cad/assembly.mjs):
//   * gimbal parts, brackets, pinions, motor plates, cage : origin on the gimbal pivot, +z up the rocket axis
//   * stack plates and landing frame                      : origin on the plate mid-plane
// The generator turns each part into its print orientation (z up, lowest face on z = 0).
import { ROCKET as S } from '../../src/data/spec.js';
import { Manifold, CrossSection, TOL, PI, rad, union, diff, boxM, cylA, hexA, rrect, extrude, arcBand, poly, gearM } from './lib.mjs';

const RO = S.rodOffset;                    // 47 mm: rods sit on the diagonals at (+-47, +-47)
const DEG = 180 / PI;

/** 20 g class metal-gear servo used for the envelope: body L x W x H, shaft on the top face. */
export const SERVO = { L: 23.0, W: 12.2, H: 24.0, ear: 27.8, shaftFromEnd: 5.9, shaftLen: 5.7, earDrop: 4.5 };

// ---------------------------------------------------------------- shared features
/** Local frame: rod axis at the origin, radial direction +x. Rod hole plus an M3 clamp screw with a nut slot open to the top. */
function rodClampCut(zLow, zMid, zTop) {
  return union([
    cylA('z', TOL.rod6 / 2, zLow - 1, zTop + 1),
    cylA('x', TOL.m3 / 2, 0, 12, 0, zMid),
    boxM(4.4, 7.2, -3.2, 3.2, zMid - 3.0, zTop + 1),
  ]);
}
const atRod = (m, x, y) => m.rotate([0, 0, Math.atan2(y, x) * DEG]).translate([x, y, 0]);
const rods = () => [[RO, RO], [RO, -RO], [-RO, RO], [-RO, -RO]];
const ring2d = (ro, ri) => CrossSection.circle(ro, 128).subtract(CrossSection.circle(ri, 128));

// ---------------------------------------------------------------- stack plates (3x)
const PLATE = { z0: 2, z1: 6, bossTop: 8, size: S.frameSize, r: 8 };
export function stackPlate(kind) {
  const base = extrude(rrect(PLATE.size, PLATE.size, PLATE.r), PLATE.z0, PLATE.z1);
  const pads = [], cuts = [];
  for (const [x, y] of rods()) pads.push(cylA('z', PLATE.r - 0.02, 0, PLATE.bossTop, x, y));   // boss = corner radius (0.02 inside, avoids a coincident surface)
  cuts.push(cylA('z', 17, -1, 9));                                                      // cable pass-through
  for (const [x, y] of [[-30, 0], [30, 0], [0, -32], [0, 32]]) {
    if (kind === 'battery' && x === 0) continue;                                        // straps run here
    cuts.push(cylA('z', 7.5, -1, 9, x, y));
  }
  const inserts = kind === 'telemetry' ? [[-34, 22], [34, 22], [-34, -22]]
    : kind === 'pcb' ? [[-38, 22], [38, 22], [-38, -22], [38, -22]] : [];
  for (const [x, y] of inserts) {
    pads.push(cylA('z', 4.8, 0, PLATE.bossTop, x, y));
    cuts.push(cylA('z', TOL.insert / 2, 2, PLATE.bossTop + 1, x, y));                   // M3 heat-set insert, 6 mm deep
  }
  if (kind === 'telemetry') cuts.push(cylA('z', 3.25, -1, 9, 20, 26));                  // antenna base
  if (kind === 'battery') for (const sy of [-1, 1]) cuts.push(extrude(rrect(12, 3, 1.5), -1, 9).translate([-2, sy * 36, 0]));   // strap slots
  let m = diff(union([base, ...pads]), cuts);
  m = diff(m, rods().map(([x, y]) => atRod(rodClampCut(0, 4, PLATE.bossTop), x, y)));
  return m.translate([0, 0, -4]);                                                       // plate mid-plane at z = 0
}

// ---------------------------------------------------------------- landing frame
export const LUG = { R: S.legHingeRadius, pinDrop: 12, earGap: 13, earT: 3.5 };
export function landingFrame() {
  const T = S.frameThickness + 1, half = T / 2;                                         // 5 mm plate
  const plate = Manifold.extrude(rrect(S.landingFrameSize, S.landingFrameSize, 9).rotate(45), T).translate([0, 0, -half]);
  const pads = rods().map(([x, y]) => cylA('z', 8.5, -half - 2, half + 2, x, y));
  const cuts = [cylA('z', 27, -10, 10)];
  for (const a of [0, 90, 180, 270]) cuts.push(cylA('z', 8, -10, 10, 42.43 * Math.cos(rad(a)), 42.43 * Math.sin(rad(a))));
  const lugs = [], lugCuts = [];
  for (let i = 0; i < 4; i++) {
    const R = LUG.R, e = LUG.earGap / 2, t = LUG.earT;
    const parts = [boxM(72, 96, -(e + t), e + t, -half, half)];
    for (const [y0, y1] of [[e, e + t], [-(e + t), -e]]) {
      parts.push(boxM(R - 10, R, y0, y1, -22, half));
      parts.push(cylA('y', 10, y0, y1, R, -LUG.pinDrop));
    }
    lugs.push(union(parts).rotate([0, 0, i * 90]));
    lugCuts.push(cylA('y', TOL.m3snug / 2, -15, 15, R, -LUG.pinDrop).rotate([0, 0, i * 90]));
  }
  let m = diff(union([plate, ...pads, ...lugs]), [...cuts, ...lugCuts]);
  return diff(m, rods().map(([x, y]) => atRod(rodClampCut(-half - 2, 0, half + 2), x, y)));
}

// ---------------------------------------------------------------- gimbal (origin = pivot)
export const G = {
  mountH: 14, cavity: 41.4,
  ringId: 60, ringOd: 72, ringH: 12,
  collarOd: 50, collarH: 26,
  boss: 6, pipR: 2.2, pipLen: 1.4,
  sectorT: 4, sectorHalfArc: 26,
  sec1: [36.4, 40.4],            // axis-1 sector plane (x)
  sec2: [21.8, 25.8],            // axis-2 sector plane (y)
  pinionAxisDist: (S.gear.sectorTeeth + S.gear.pinionTeeth) * S.gear.module / 2,   // 27.0
};

export function gimbalMount() {
  const h = G.mountH / 2;
  let m = diff(extrude(rrect(110, 110, 8), -h, h), [extrude(rrect(2 * G.cavity, 2 * G.cavity, 4), -h - 1, h + 1)]);
  const cuts = [];
  for (const s of [-1, 1]) {
    m = union([m, cylA('x', G.pipR, s * G.cavity, s * (G.cavity - G.pipLen))]);          // centring pip on the bearing's inner race
    cuts.push(cylA('x', TOL.m3snug / 2, s * 38, s * 56));                                // pivot bolt bore
    cuts.push(hexA('x', TOL.nutAF, s * (55 - TOL.nylockH), s * 56));                    // nylock nut pocket on the outer face
  }
  for (const sy of [-1, 1]) cuts.push(cylA('z', TOL.insert / 2, -h - 1, -h + 6, 48, sy * 8));   // servo bracket 1 inserts
  for (let i = 0; i < 4; i++) cuts.push(cylA('z', 1.1, -h - 1, -h + 7, 50, -22).rotate([0, 0, i * 90]));   // leg-brace anchors
  return diff(m, [...cuts, ...rods().map(([x, y]) => atRod(rodClampCut(-h, 0, h), x, y))]);
}

/** Outer ring: pivots about X on the mount (bearings in its bosses), integral 36T sector on +X, fixed Y pivots for the collar. */
export function gimbalRing() {
  const h = G.ringH / 2;
  const adds = [], cuts = [];
  for (const s of [-1, 1]) {
    adds.push(cylA('x', G.boss, s * 33, s * 41));
    cuts.push(cylA('x', TOL.bearing / 2, s * 29, s * 40));       // bearing bore (opens into the cavity), bearing at u 37..40
    cuts.push(cylA('x', 2.5, s * 39.9, s * 41.1));               // lip hole
    adds.push(cylA('y', G.boss, s * 33, s * 38));                // Y pad
    adds.push(cylA('y', G.pipR, s * 30, s * (30 - G.pipLen)));   // centring pip
    cuts.push(cylA('y', TOL.m3snug / 2, s * 24, s * 39));
    cuts.push(hexA('y', TOL.nutAF, s * (38 - TOL.nylockH), s * 39, 0, 0, 90));
  }
  adds.push(gearM(S.gear.sectorTeeth, S.gear.module, 0, G.sectorT, [-G.sectorHalfArc, G.sectorHalfArc])
    .rotate([0, 90, 0]).translate([G.sec1[0], 0, 0]));           // teeth centred on -z
  for (const sx of [-1, 1]) cuts.push(cylA('z', TOL.insert / 2, h - 6, h + 1, sx * 9, 31.7));   // servo bracket 2 inserts (top face)
  return diff(union([extrude(ring2d(G.ringOd / 2, G.ringId / 2), -h, h), ...adds]), cuts);
}

/** Collar: clamps the Ø42 tube with four set screws, pivots about Y, integral 36T sector band on +Y, teeth up. */
export function gimbalCollar() {
  const h = G.collarH / 2;
  const adds = [], cuts = [];
  for (const s of [-1, 1]) {
    adds.push(cylA('y', G.boss, s * 22, s * 29.6).intersect(cylA('z', 29.6, -10, 10)));   // boss tip follows the ring bore
    cuts.push(cylA('y', TOL.bearing / 2, s * 15, s * 28.6));    // bearing at u 25.6..28.6
    cuts.push(cylA('y', 2.5, s * 28.5, s * 29.7));
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {          // tube clamp screws, outside the ring plane
    cuts.push(cylA('x', TOL.m3 / 2, sx * 18, sx * 26, 0, sz * 9.5));
    cuts.push(hexA('x', TOL.nutAF, sx * 22.1, sx * 26, 0, sz * 9.5, 30));
  }
  let sec = gearM(S.gear.sectorTeeth, S.gear.module, 0, G.sectorT, [90 - G.sectorHalfArc, 90 + G.sectorHalfArc])
    .rotate([90, 0, 0]).translate([0, G.sec2[1], 0]);              // local +y -> world +z
  sec = sec.intersect(boxM(-30, 30, G.sec2[0] - 1, G.sec2[1] + 1, 8, 30));
  return diff(union([extrude(ring2d(G.collarOd / 2, TOL.tube42 / 2), -h, h), ...adds, sec]), cuts);
}

/** 18T pinion, 4 mm face, Ø4.7 spline bore (press onto the 25T servo spline, retain with the horn screw). Print frame = design frame. */
export function pinion() {
  return diff(gearM(S.gear.pinionTeeth, S.gear.module, 0, 4), [cylA('z', 2.35, -1, 5)]);
}

// ---------------------------------------------------------------- servo brackets
const BR = { T: 4 };
const earOffsets = () => { const m = SERVO.L / 2 - SERVO.shaftFromEnd; return [m - SERVO.ear / 2, m + SERVO.ear / 2]; };
const servoWin = () => boxM(-1, BR.T + 1, -(SERVO.shaftFromEnd + 0.3), SERVO.L - SERVO.shaftFromEnd + 0.4, -(SERVO.W / 2 + 0.3), SERVO.W / 2 + 0.3);
/** Bracket 1: hangs under the +X member of the mount; servo shaft along -x at (y 0, z -27). */
export function servoBracket1() {
  const h = G.mountH / 2, x0 = G.sec1[1] + 1.1;                       // plate inner face 41.5
  const plate = boxM(x0, x0 + BR.T, -12.5, 23.5, -38.5, -h);
  const flange = boxM(x0, 56, -12.5, 12.5, -h - 2.5, -h);
  const cuts = [servoWin().translate([x0, 0, -G.pinionAxisDist]),
    ...earOffsets().map((y) => cylA('x', 0.85, x0 - 1, x0 + BR.T + 1, y, -G.pinionAxisDist)),
    ...[-8, 8].map((y) => cylA('z', TOL.m3 / 2, -h - 3, -h + 1, 48, y))];
  return diff(union([plate, flange]), cuts);
}
/** Bracket 2: stands on the top face of the ring (+Y side); servo shaft along -y at (x 0, z +27). */
export function servoBracket2() {
  const h = G.ringH / 2, y0 = G.sec2[1] + 1.1;                        // plate inner face 26.9
  const L = SERVO.L, a = SERVO.shaftFromEnd;
  const zc = G.pinionAxisDist;
  const plate = boxM(-12.5, 23.5, y0, y0 + BR.T, h, 38.5);
  const flange = boxM(-12.5, 12.5, y0, 38, h, h + 2.5);
  const cuts = [boxM(-(a + 0.3), L - a + 0.4, y0 - 1, y0 + BR.T + 1, zc - SERVO.W / 2 - 0.3, zc + SERVO.W / 2 + 0.3),
    ...earOffsets().map((x) => cylA('y', 0.85, y0 - 1, y0 + BR.T + 1, x, zc)),
    ...[-9, 9].map((x) => cylA('z', TOL.m3 / 2, h - 1, h + 3.5, x, 31.7))];
  return diff(union([plate, flange]), cuts);
}

// ---------------------------------------------------------------- motor assembly (origin = pivot; tube bottom at z = -26)
export const MOTOR = {
  zA: [-31, -26],          // upper plate / arms (motor A hangs below)
  zB: [-96, -91],          // lower plate / arms (motor B stands on top)
  tubeBottom: -26, tubeLen: 58,
  armR: 123,                // cage centre-line radius (prop radius 114 + 9)
  armAngles: [60, 180, 300],
  strutLen: 60,
};
const ARM = { rootR: [26, 48], stubW: 14, armW: 12, tip: 8, lap: 2.5, drop: 2.8, boltR: [33, 42] };
function motorPlate(upper) {
  const [z0, z1] = upper ? MOTOR.zA : MOTOR.zB;
  const adds = [cylA('z', 26, z0, z1)];
  const cuts = [cylA('z', 6, z0 - 1, z1 + 1)];                                     // wire pass-through
  for (let i = 0; i < 4; i++) {
    const a = rad(45 + i * 90);
    cuts.push(cylA('z', TOL.m3 / 2, z0 - 1, z1 + 1, 9.5 * Math.cos(a), 9.5 * Math.sin(a)));   // 3110 motor pattern, Ø19
  }
  for (const ang of MOTOR.armAngles) {                                              // stubs carry the upper half of the lap joint
    adds.push(poly([[20, -ARM.stubW / 2], [ARM.rootR[1], -ARM.stubW / 2], [ARM.rootR[1], ARM.stubW / 2], [20, ARM.stubW / 2]], z0 + ARM.lap, z1).rotate([0, 0, ang]));
    for (const r of ARM.boltR) cuts.push(cylA('z', TOL.m3 / 2, z0 - 1, z1 + 1, r, 0).rotate([0, 0, ang]));
  }
  if (upper) {                                                                      // tube socket, 8 mm deep
    adds.push(extrude(ring2d(25, TOL.tube42 / 2), z1, z1 + 8));
    for (const sx of [-1, 1]) {
      cuts.push(cylA('x', TOL.m3 / 2, sx * 18, sx * 26, 0, z1 + 4));
      cuts.push(hexA('x', TOL.nutAF, sx * 22.2, sx * 26, 0, z1 + 4, 30));
    }
  }
  return diff(union(adds), cuts);
}
export const motorPlateUpper = () => motorPlate(true);
export const motorPlateLower = () => motorPlate(false);

/** Cage arm (6x): a flat bar from the plate stub to the strut pad. Design frame: radial +x from the pivot axis, z as the plates.
 *  `upper` selects which plate it belongs to (heights). Its root sits under the plate stub (half lap) and is bolted with two M3 + nuts. */
export function cageArm(upper = true) {
  const [z0, z1] = upper ? MOTOR.zA : MOTOR.zB, R = MOTOR.armR;
  const bar = poly([[ARM.rootR[1], -ARM.armW / 2], [R, -ARM.armW / 2], [R, ARM.armW / 2], [ARM.rootR[1], ARM.armW / 2]], z0, z1);
  const root = poly([[ARM.rootR[0], -ARM.stubW / 2], [ARM.rootR[1], -ARM.stubW / 2], [ARM.rootR[1], ARM.stubW / 2], [ARM.rootR[0], ARM.stubW / 2]], z0 - ARM.drop, z0 + ARM.lap);
  const tip = cylA('z', ARM.tip, z0, z1, R, 0);
  const cuts = [cylA('z', TOL.m3 / 2, z0 - 4, z1 + 1, R, 0)];
  for (const r of ARM.boltR) {
    cuts.push(cylA('z', TOL.m3 / 2, z0 - 4, z1 + 1, r, 0));
    cuts.push(hexA('z', TOL.nutAF, z0 - ARM.drop - 1, z0 - ARM.drop + TOL.nutH, r, 0));
  }
  return diff(union([bar, root, tip]), cuts);
}

/** Cage strut: local frame u = radial, v = tangential, z along the rocket. Centre of the strut at u = v = 0 (r = 123). */
export const STRUT = { u: [-4, 3.5], v: 7, ringZ: -59 };
export function cageStrut() {
  const [z0, z1] = [MOTOR.zB[1], MOTOR.zA[0]];                                      // -91 .. -31
  const body = boxM(STRUT.u[0], STRUT.u[1], -STRUT.v, STRUT.v, z0, z1);
  const cuts = [cylA('z', TOL.insert / 2, z0 - 1, z0 + 6), cylA('z', TOL.insert / 2, z1 - 6, z1 + 1)];
  for (const v of [-4.5, 4.5]) cuts.push(cylA('x', TOL.insert / 2, STRUT.u[1] - 6, STRUT.u[1] + 1, v, STRUT.ringZ + 3));   // ring tab screws
  return diff(body, cuts);
}

/** Guard-ring arc between two struts (120 deg), with end tabs that screw onto the struts' outer face. */
export function guardArc() {
  const R = MOTOR.armR, zc = STRUT.ringZ;                                          // ring band r 120..126, z zc-2 .. zc+2
  const half = Math.asin(STRUT.v / (R - 3)) * DEG;                                 // angle covered by half a strut at the inner edge
  const band = arcBand(R + 3, R - 3, half, 120 - half, zc - 2, zc + 2);
  const adds = [band], cuts = [];
  for (const end of [0, 1]) {
    const sgn = end ? -1 : 1;                                                       // pointing from the strut centre along the arc
    // risers + tabs built in strut-local frame (u radial, v tangential), then rotated to the arc end
    const local = [boxM(-3, 7, 7, 10.01, zc - 2, zc + 8), boxM(3.5, 7, 0, 10, zc - 2, zc + 8)];
    let t = union(local);
    if (end) t = t.mirror([0, 1, 0]);
    t = t.translate([R, 0, 0]).rotate([0, 0, end ? 120 : 0]);
    adds.push(t);
    const bolt = cylA('x', TOL.m3 / 2, R + 3, R + 9, sgn * 4.5, zc + 3).rotate([0, 0, end ? 120 : 0]);
    cuts.push(bolt.translate([0, 0, 0]));
  }
  return diff(union(adds), cuts);
}

// ---------------------------------------------------------------- legs
export const LEG = (() => {
  const hinge = [S.legHingeRadius, S.legHingeY - 12], foot = [S.footRadius, 6];
  const dx = foot[0] - hinge[0], dz = foot[1] - hinge[1];
  const len = Math.hypot(dx, dz);
  return { angleFromVertical: Math.atan2(dx, -dz) * DEG, length: len, dir: [dx / len, -dz / len] };
})();
/** Leg hinge fitting. Profile frame: pin axis = z at the origin, leg (rod socket) along +x, thickness along z. Prints with z up. */
export function legHinge() {
  const t = LUG.earGap - 0.4;                                                        // 12.6 tongue between the lug ears
  const profile = CrossSection.circle(7.5, 64).add(CrossSection.square([34, 15], false).translate([0, -7.5]));
  const body = Manifold.extrude(profile, t).translate([0, 0, -t / 2]);
  return diff(body, [cylA('x', TOL.rod8 / 2, 12, 36, 0, 0), cylA('z', TOL.m3snug / 2, -t, t)]);   // Ø8.2 socket 22 deep, Ø3.2 pin bore
}
/** Brace clip: Ø8 rod collar with an M3 clamp screw and a Ø2.2 eyelet. Axis z. */
export function legClip() {
  const m = union([cylA('z', 9, 0, 10), boxM(8, 18, -4, 4, 0, 10)]);
  return diff(m, [cylA('z', TOL.rod8 / 2, -1, 11), cylA('x', TOL.m3 / 2, -12, -3, 0, 5), hexA('x', TOL.nutAF, -9.5, -6.5, 0, 5), cylA('z', 1.1, -1, 11, 14, 0)]);
}
