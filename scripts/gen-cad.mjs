// Generates the printable STL files and the manifest from the parametric part definitions.
//   node scripts/gen-cad.mjs            -> hardware/cad/stl/<vehicle>/<part>.stl, hardware/cad/parts.json, docs/cad-parts.md
//   node scripts/gen-cad.mjs --check    -> fails if any STL on disk differs from a fresh build
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { toSTL, stats, toPrint, summarise } from './cad/lib.mjs';
import { PARTS, PRINT_BED } from './cad/parts.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');

/** Minimal ZIP writer (stored, no compression, fixed timestamp) so the archives are reproducible. */
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function zip(entries) {
  const date = ((2026 - 1980) << 9) | (1 << 5) | 1;
  const locals = [], central = [];
  let offset = 0;
  for (const { name, data } of entries) {
    const n = Buffer.from(name), crc = crc32(data);
    const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x0800, 6); lh.writeUInt16LE(0, 8); lh.writeUInt16LE(0, 10); lh.writeUInt16LE(date, 12);
    lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(data.length, 18); lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(n.length, 26);
    const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x0800, 8); ch.writeUInt16LE(0, 10); ch.writeUInt16LE(0, 12); ch.writeUInt16LE(date, 14);
    ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(data.length, 20); ch.writeUInt32LE(data.length, 24); ch.writeUInt16LE(n.length, 28); ch.writeUInt32LE(offset, 42);
    locals.push(lh, n, data); central.push(ch, n);
    offset += 30 + n.length + data.length;
  }
  const cd = Buffer.concat(central);
  const end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, end]);
}
const ZIPS = { monocopter: 'mc1-monocopter-stl.zip', rocket: 'rk1-rocket-stl.zip' };
const stlBufs = { monocopter: [], rocket: [] };

const density = (mat) => (mat.includes('PA12') ? 1.01 : mat.startsWith('PETG') ? 1.27 : 1.2);   // g/cm3
const manifest = [];
let stale = 0;
for (const p of PARTS) {
  const m = toPrint(p.build(), p.rot);
  const s = stats(m);
  const status = m.status();
  if (status !== 'NoError' || !(s.volume_mm3 > 0)) throw new Error(`${p.id}: invalid solid (${status})`);
  if (s.size[0] > PRINT_BED.x || s.size[1] > PRINT_BED.y || s.size[2] > PRINT_BED.z) {
    throw new Error(`${p.id}: ${s.size.join(' x ')} does not fit a ${PRINT_BED.x} x ${PRINT_BED.y} x ${PRINT_BED.z} bed`);
  }
  const rel = `hardware/cad/stl/${p.vehicle}/${p.id}.stl`;
  const buf = toSTL(m, p.id);
  stlBufs[p.vehicle].push({ name: `${p.id}.stl`, data: buf });
  const path = join(root, rel);
  if (check) {
    // compare geometry (volume, bounding box, triangle count) rather than bytes, so a different CPU / platform does not trip it
    const a = existsSync(path) ? summarise(readFileSync(path)) : null, b = summarise(buf);
    const same = a && a.tri === b.tri && Math.abs(a.vol - b.vol) <= 1e-4 * b.vol && a.box.every((v, i) => Math.abs(v - b.box[i]) < 0.01);
    if (!same) { stale++; console.error('stale:', rel); }
  } else {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, buf);
  }
  manifest.push({
    id: p.id, vehicle: p.vehicle, name: p.name, qty: p.qty, material: p.material, bom: p.bom, file: rel, note: p.note,
    size_mm: s.size, volume_cm3: +(s.volume_mm3 / 1000).toFixed(2),
    mass_solid_g: Math.round((s.volume_mm3 / 1000) * density(p.material)), triangles: s.triangles,
  });
}
if (check) {
  if (stale) { console.error(`${stale} STL file(s) are stale; run npm run cad`); process.exit(1); }
  console.log('STL files are current');
  process.exit(0);
}

for (const v of Object.keys(ZIPS)) {
  stlBufs[v].push({ name: 'README.txt', data: Buffer.from(`${v === 'monocopter' ? 'MC-1 monocopter' : 'RK-1 rocket'} printable parts: binary STL, millimetres, already in print orientation (z up).
Quantities, materials and settings: see the parts page of the build guide and docs/printing.md.
`) });
  writeFileSync(join(root, 'hardware/cad', ZIPS[v]), zip(stlBufs[v]));
}
writeFileSync(join(root, 'hardware/cad/parts.json'), JSON.stringify({
  generated_by: 'scripts/gen-cad.mjs', units: 'mm', zips: Object.fromEntries(Object.entries(ZIPS).map(([k, f]) => [k, 'hardware/cad/' + f])), bed_min_mm: [PRINT_BED.x, PRINT_BED.y, PRINT_BED.z],
  note: 'mass_solid_g is the mass of the part printed 100 % solid, an upper bound. At the baseline settings a part weighs roughly 55 to 80 % of it; weigh the real parts.', parts: manifest,
}, null, 2) + '\n');

const HARDWARE = {
  rocket: `
## Hardware for the printed parts

| Item | Qty | Used at |
|---|---|---|
| M3 heat-set insert (Ø4.2 hole, 5.7 mm) | 23 | telemetry plate 3, PCB plate 4, gimbal mount 2, outer ring 2, cage struts 12 |
| M3 × 8 screw + M3 nut | 30 | rod clamps (3 plates, landing frame, mount: 20), collar set screws 4, motor plate socket 2, brace clips 4 |
| M3 × 20 bolt + M3 nylock nut | 2 | outer ring pivots (X axis) |
| M3 × 16 bolt + M3 nylock nut | 2 | collar pivots (Y axis) |
| M3 × 25 bolt + M3 nylock nut | 4 | leg hinges |
| M3 × 8 screw + M3 nut | 12 | cage arms to the plate stubs (two per arm) |
| M3 × 10 screw | 16 | servo brackets 4, arm tips to struts 6, guard-arc tabs 6 |
| M2 × 6 self-tapping screw | 8 | two servos, four per servo |
| 683ZZ bearing (3 × 7 × 3) | 4 | two in the outer ring bosses, two in the collar bosses |
| Carbon rod Ø6 × 400 mm | 4 | stack rods |
| Carbon rod Ø8 × 260 mm | 4 | legs |
| Carbon tube Ø42 (about 40 mm bore), 58 mm long | 1 | motor mount tube |
| Wire Ø1.6 mm | 4 | leg braces, about 135 mm each before the hooks |
`,
  monocopter: `
## Hardware for the printed parts

| Item | Qty | Used at |
|---|---|---|
| M3 heat-set insert (Ø4.2 hole, 5.7 mm) | 48 | posts 32 (2 top, 2 inner, 4 outer each), servo cradles 16 (4 each) |
| M3 × 25 screw + M3 nut | 8 | stators to the lower hub (two per stator) |
| M3 × 10 screw | 40 | posts to the stator flanges 8, lower half-arc tabs 16, guard-arc tabs 8, arm tips 8 |
| M3 × 8 screw + M3 nut | 12 | arms to the hub plate stubs (three per arm) |
| M3 × 8 screw | 4 | motor to the hub plate (with thread-lock) |
| M3 × 6 screw | 8 | the four 39 mm standoffs, both ends |
| M3 × 39 mm standoff, female-female | 4 | hub plate to electronics deck |
| M2 × 6 self-tapping screw | 8 | servo ears, two per servo |
| M2 × 10 screw | 16 | horn adapters to the servo horns, four per vane |
| Rod Ø3 × 116 mm | 4 | vane rods, epoxied into the vane and the horn adapter |
| Round servo horn with four arms | 4 | supplied with the servos |
`,
};
const META = {
  monocopter: {
    title: 'MC-1 monocopter - printable parts', doc: 'docs/phase1-monocopter/printable-parts.md', rel: '../..', order: 'Step 1 of the build line: print and build this vehicle first.',
    strength: `
## Strength

- **Posts are 12 × 24 mm** (twice the bending strength of an 8 mm section) and are the legs. Printed on their side, the layers run along the post, so a bending load stresses the layers in their strong direction.
- **Arms are T-sections** (14 × 5 flange, 3 × 11 rib), about five times stiffer in vertical bending than a flat bar, and end in a 12 × 24 mm pad that sits on the whole top of the post with two screws.
- Four load paths tie the posts together: the arms and hub plate at the top, the guard ring at the prop plane, the lower ring and the stator fins and lower hub at the middle. The posts are never free-standing cantilevers.
- Print posts, arms, hub plate and cradles with **5 walls, 4 top and bottom layers, 40 % gyroid**, in PETG (or ASA / PETG-CF). Use heat-set inserts, not self-tapped plastic, and a drop of thread-lock on every metal-to-metal screw.
- The vanes are the only parts you should expect to break in a bad landing. Print two spares (the quantity below already includes them).
`,
  },
  rocket: {
    title: 'RK-1 rocket - printable parts', doc: 'docs/phase2-rocket/printable-parts.md', rel: '../..', order: 'Step 2 of the build line: print these after the monocopter has flown.',
    strength: '',
  },
};
const row = (p) => `| [${p.id}](../../${p.file}) | ${p.qty} | ${p.size_mm.join(' × ')} | ${p.material} | ${p.mass_solid_g} | ${p.bom} | ${p.note} |`;
for (const v of ['monocopter', 'rocket']) {
  const list = manifest.filter((p) => p.vehicle === v), m = META[v];
  let md = `# ${m.title}\n\n${m.order}\n\nGenerated by \`npm run cad\` from [\`scripts/cad/\`](../../scripts/cad/). **${list.length} files, ${list.reduce((a, p) => a + p.qty, 0)} pieces.** Download the whole set as one zip: [${ZIPS[v]}](../../hardware/cad/${ZIPS[v]}), or pick single files below or on the [parts page](../../web/parts.html?v=${v}).\n\n`;
  md += `Every file is a watertight solid in **millimetres**, already in its **print orientation** (z up, lowest face on the bed). Sizes are bounding boxes in that orientation. "g solid" is the mass if the part were printed 100 % solid, an upper bound: at the baseline settings a part weighs roughly 55 to 80 % of it. Weigh the printed parts and update the parts list if a line differs by more than 10 % (see the [printing guide](../printing.md)). The smallest bed that fits everything is **${PRINT_BED.x} × ${PRINT_BED.y} mm**.\n\n`;
  md += `| Part (STL) | Qty | Size (mm) | Material | g solid | List ID | Notes |\n|---|---|---|---|---|---|---|\n${list.map(row).join('\n')}\n`;
  md += `\nWhole set printed solid: ${list.reduce((a, p) => a + p.qty * p.mass_solid_g, 0)} g (upper bound).\n`;
  md += m.strength + HARDWARE[v];
  writeFileSync(join(root, m.doc), md);
}
const idx = `# Printable parts (STL)

Two separate sets, in the order you build them. Each set is also one zip file.

| Set | Files | Pieces | Download | List |
|---|---|---|---|---|
${['monocopter', 'rocket'].map((v) => { const l = manifest.filter((p) => p.vehicle === v); return `| **${v === 'monocopter' ? '1 · MC-1 monocopter (print first)' : '2 · RK-1 rocket (print second)'}** | ${l.length} | ${l.reduce((a, p) => a + p.qty, 0)} | [${ZIPS[v]}](../hardware/cad/${ZIPS[v]}) | [${META[v].doc.replace('docs/', '')}](${META[v].doc.replace('docs/', '')}) |`; }).join('\n')}

Every file is binary STL in millimetres, in print orientation. Settings, materials and tolerances: [3D printing guide](printing.md). The files are generated by \`npm run cad\`; the parts page is [web/parts.html](../web/parts.html).
`;
writeFileSync(join(root, 'docs/cad-parts.md'), idx);
console.log(`wrote ${manifest.length} STL files, 2 zips, hardware/cad/parts.json and the printable-parts docs`);
