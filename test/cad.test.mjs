// Printable parts: every STL is a closed solid in the right units and orientation, key dimensions follow
// src/data/spec.js, and the parts assemble without interference at nominal and full gimbal deflection.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { summarise, cylA, stats } from '../scripts/cad/lib.mjs';
import { PARTS, PRINT_BED } from '../scripts/cad/parts.mjs';
import * as R from '../scripts/cad/rocket.mjs';
import { checkAssembly } from '../scripts/cad/assembly.mjs';
import { ROCKET as S } from '../src/data/spec.js';

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
