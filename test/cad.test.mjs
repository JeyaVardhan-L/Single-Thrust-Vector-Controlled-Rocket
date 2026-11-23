// Printable parts: every STL is a closed solid in the right units and orientation, key dimensions follow
// src/data/spec.js, and the parts assemble without interference at nominal and full gimbal deflection.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { summarise, cylA, boxM, stats } from '../scripts/cad/lib.mjs';
import { PARTS, PRINT_BED } from '../scripts/cad/parts.mjs';
import * as R from '../scripts/cad/rocket.mjs';
import { checkAssembly } from '../scripts/cad/assembly.mjs';
import * as C from '../scripts/cad/mono.mjs';
import { checkMono, checkVaneInstall } from '../scripts/cad/assembly-mono.mjs';
import { ROCKET as S, MONO as M } from '../src/data/spec.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(join(root, 'hardware/cad/parts.json'), 'utf8'));

/** Every undirected edge of the triangle soup must be shared by exactly two triangles (closed surface). */
function isClosed(buf) {
  const n = buf.readUInt32LE(80);
  const key = (o) => [0, 1, 2].map((c) => buf.readFloatLE(o + c * 4).toFixed(3)).join(',');
  const edges = new Map();
  for (let t = 0; t < n; t++) {
    const o = 84 + t * 50 + 12;
    const v = [0, 1, 2].map((k) => key(o + k * 12));
    for (let k = 0; k < 3; k++) {
      const a = v[k], b = v[(k + 1) % 3];
      const e = a < b ? a + '|' + b : b + '|' + a;
      edges.set(e, (edges.get(e) || 0) + 1);
    }
  }
  return [...edges.values()].every((c) => c === 2);
}

test('every part has an STL that is a closed, positive-volume solid sitting on z = 0', () => {
  assert.equal(manifest.parts.length, PARTS.length);
  for (const p of manifest.parts) {
    const buf = readFileSync(join(root, p.file));
    assert.equal(buf.length, 84 + buf.readUInt32LE(80) * 50, p.id + ': STL size matches its header');
    assert.ok(isClosed(buf), p.id + ': closed surface');
    const s = summarise(buf);
    assert.ok(s.vol > 100, p.id + ': positive volume');
    assert.ok(Math.abs(s.box[2]) < 0.01, p.id + ': lowest face on z = 0');
    assert.ok(Math.abs(s.vol / 1000 - p.volume_cm3) < 0.02, p.id + ': manifest volume matches the file');
    const size = [s.box[3] - s.box[0], s.box[4] - s.box[1], s.box[5] - s.box[2]];
    assert.ok(size[0] <= PRINT_BED.x && size[1] <= PRINT_BED.y && size[2] <= PRINT_BED.z, p.id + ': fits the bed');
  }
});

test('stack plates follow the spec: 110 mm square, rods on the diagonals, Ø6.2 holes', () => {
  const m = R.stackPlate('pcb');
  assert.deepEqual(stats(m).size.slice(0, 2), [S.frameSize, S.frameSize]);
  for (const [x, y] of [[47, 47], [47, -47], [-47, 47], [-47, -47]]) {
    assert.ok(m.intersect(cylA('z', S.rodRadius + 0.05, -10, 10, x, y)).volume() < 0.01, 'a Ø6.1 rod clears the hole at ' + x + ',' + y);
    assert.ok(m.intersect(cylA('z', 3.6, -10, 10, x, y)).volume() > 1, 'the hole is not oversize at ' + x + ',' + y);
  }
});

test('landing frame: hinge pins sit on the leg hinge radius, tongue fits the lug gap', () => {
  const m = R.landingFrame();
  assert.ok(Math.abs(stats(m).size[0] - 2 * (S.legHingeRadius + 10)) < 0.1, 'lug ears reach R + 10 mm on the axes');
  assert.ok(m.intersect(cylA('y', 1.55, -20, 20, S.legHingeRadius, -12)).volume() < 0.01, 'an M3 bolt passes the hinge bore');
  assert.ok(Math.abs(stats(R.legHinge()).size[2] - (R.LUG.earGap - 0.4)) < 0.01, 'tongue is 0.4 mm narrower than the ear gap');
});

test('gear stage: module 1, 36T sector + 18T pinion at 27.0 mm centre distance, 2:1', () => {
  assert.equal(R.G.pinionAxisDist, 27);
  assert.equal(S.gear.sectorTeeth / S.gear.pinionTeeth, 2);
  const size = stats(R.pinion()).size;
  assert.ok(Math.abs(size[0] - 20) < 0.3 && Math.abs(size[1] - 20) < 0.3, 'pinion tip diameter ≈ 20 mm (module 1, 18T)');
  assert.ok(stats(R.gimbalRing()).size[2] > 24, 'the sector fin stands above the ring');
});

test('leg geometry follows the spec: the Ø8 rod starts 12 mm from the pin, so the span needs a 260 mm rod', () => {
  const dx = S.footRadius - S.legHingeRadius, dz = S.legHingeY - 12 - 6;
  assert.ok(Math.abs(R.LEG.length - Math.hypot(dx, dz)) < 1e-9);
  assert.ok(Math.abs(R.LEG.length - 12 - 260) < 1, 'pin-to-foot span minus the socket offset is 260 mm');
});

test('mount cavity clears the ring through the full ±7° tilt', () => {
  assert.ok(R.G.cavity - R.G.ringOd / 2 > 4, 'radial gap between ring and mount');
  assert.ok(Math.sin((S.gimbalRangeDeg * Math.PI) / 180) * (R.G.ringOd / 2) < R.G.mountH / 2, 'tilt rise stays inside the mount height');
});

test('assembly: no interference at nominal and full gimbal deflection', () => {
  const { issues, pairs } = checkAssembly([[0, 0], [7, 7], [-7, 7], [7, -7]]);
  assert.ok(pairs > 400, 'enough part pairs were tested');
  assert.deepEqual(issues, []);
});

// ---------------------------------------------------------------- MC-1 monocopter
test('MC-1: the 10 inch prop clears the guard ring by at least 12 mm and the arcs fit the bed', () => {
  assert.equal(M.prop.diameterIn, 10);
  assert.ok(M.postRadius - M.ring.band / 2 - M.prop.radius >= 12, 'tip clearance to the ring');
  const g = stats(C.guardArc()).size;
  assert.ok(g[0] <= 220 && g[1] <= 220, 'guard arc fits a 220 mm bed');
});

test('MC-1: the servo body passes the cradle window, the vane rod passes its bores', () => {
  const body = boxM(C.MC.servoTopX, C.MC.servoTopX + 24, -5.9, 17.1, -6.1, 6.1);
  assert.ok(C.servoCradle().intersect(body).volume() < 0.01, '23 x 12.2 x 24 servo fits the window and the ear pocket');
  assert.ok(C.vane().intersect(cylA('x', 1.5, 0, 140, 0, 0)).volume() < 0.01, 'Ø3 rod passes the vane bore');
  assert.ok(C.hornAdapter().intersect(cylA('x', 1.5, 120, C.MC.rod.x[1], 0, 0)).volume() < 0.01, 'Ø3 rod end fits the adapter bore');
  assert.ok(C.lowerHub().intersect(cylA('x', 1.5, C.MC.rod.x[0], 40, 0, 0)).volume() < 0.01, 'Ø3 rod tip fits the hub bore');
  assert.ok(C.lowerHub().intersect(C.stator().rotate([0, 0, 45])).volume() < 0.5, 'a 3.0 mm stator slides into the 3.3 mm hub slot');
});

test('MC-1: every vane axis, post and servo is where the spec says', () => {
  const post = stats(C.post());
  assert.deepEqual(post.size, [12, 24, 165]);
  assert.equal(M.vane.rEnd - M.vane.rStart, M.vane.span);
  assert.ok(M.vane.rStart > M.hub.radius, 'the vane starts outside the hub');
  assert.ok(C.MC.adapter.x[0] > M.vane.rEnd + 2, 'the adapter clears the vane spine');
});

test('MC-1: mass budget matches the design (on-board mass under 950 g, printed line agrees with the CAD files)', () => {
  const bom = JSON.parse(readFileSync(join(root, 'hardware/bom/monocopter.json'), 'utf8'));
  const mass = bom.items.filter((i) => i.onboard).reduce((a, i) => a + i.mass_g * i.qty, 0);
  assert.ok(mass > 600 && mass < 950, 'on-board mass ' + mass);
  // F-01 is 65 % of the solid mass of the mounted printed parts (the two spare vanes are not mounted)
  const parts = JSON.parse(readFileSync(join(root, 'hardware/cad/parts.json'), 'utf8')).parts.filter((p) => p.vehicle === 'monocopter');
  const solid = parts.reduce((a, p) => a + (p.id === 'mc-vane' ? 4 : p.qty) * p.mass_solid_g, 0);
  const f01 = bom.items.find((i) => i.id === 'F-01').mass_g;
  assert.ok(Math.abs(f01 - 0.65 * solid) / f01 < 0.03, `F-01 ${f01} g vs 65 % of ${solid} g solid`);
});

test('MC-1 assembly: no interference with the vanes at full deflection, and the vanes can be installed', () => {
  const { issues, pairs } = checkMono([[0, 0, 0, 0], [25, 25, 25, 25], [-25, -25, -25, -25], [25, 0, -25, 0], [0, 25, 0, -25]]);
  assert.ok(pairs > 200);
  assert.deepEqual(issues, []);
  assert.deepEqual(checkVaneInstall().issues, []);
});
