// Small solid-modelling helpers on top of manifold-3d (guaranteed watertight booleans).
// All lengths in millimetres. Parts are built in PRINT orientation: z up, lowest face at z = 0.
import Module from 'manifold-3d';

const wasm = await Module();
wasm.setup();
export const { Manifold, CrossSection } = wasm;

export const SEG = 72;                       // circle resolution

// Printing tolerances (see docs/printing.md). Holes are modelled at the PRINT size.
export const TOL = {
  m3: 3.4,        // M3 clearance
  m3snug: 3.2,    // M3 close fit (pivot bolts)
  m2: 2.2,        // M2 clearance
  insert: 4.2,    // M3 heat-set insert, 6 mm deep
  nutAF: 5.7,     // M3 nut across flats (5.5 nominal)
  nutH: 2.8,      // M3 nut pocket depth
  nylockH: 4.4,   // M3 nylock pocket depth
  rod6: 6.2,      // Ø6 carbon rod
  rod8: 8.2,      // Ø8 carbon rod
  tube42: 42.3,   // Ø42 carbon tube
  bearing: 7.0,   // 683ZZ outer diameter (press fit, test print)
  bearingW: 3.0,
};

export const PI = Math.PI;
export const rad = (d) => (d * PI) / 180;

export const union = (list) => Manifold.union(list.filter(Boolean));
export const diff = (a, list) => list.filter(Boolean).reduce((m, x) => m.subtract(x), a);

/** Axis-aligned box from min/max corners. */
export const boxM = (x0, x1, y0, y1, z0, z1) => Manifold.cube([x1 - x0, y1 - y0, z1 - z0], false).translate([x0, y0, z0]);

/** Cylinder along an axis from coordinate a to b; (c1,c2) are the other two coordinates (x:(y,z) y:(x,z) z:(x,y)). */
export function cylA(axis, r, a, b, c1 = 0, c2 = 0, seg = SEG) {
  const lo = Math.min(a, b), h = Math.abs(b - a);
  const c = Manifold.cylinder(h, r, r, seg, false);
  if (axis === 'z') return c.translate([c1, c2, lo]);
  if (axis === 'x') return c.rotate([0, 90, 0]).translate([lo, c1, c2]);
  return c.rotate([-90, 0, 0]).translate([c1, lo, c2]);
}

/** Hexagonal prism (across flats af) along an axis, e.g. a nut pocket. `rot` turns the hexagon about its axis (deg). */
export function hexA(axis, af, a, b, c1 = 0, c2 = 0, rot = 0) {
  const lo = Math.min(a, b), h = Math.abs(b - a);
  const c = Manifold.cylinder(h, af / Math.sqrt(3), af / Math.sqrt(3), 6, false).rotate([0, 0, rot]);
  if (axis === 'z') return c.translate([c1, c2, lo]);
  if (axis === 'x') return c.rotate([0, 90, 0]).translate([lo, c1, c2]);
  return c.rotate([-90, 0, 0]).translate([c1, lo, c2]);
}

/** Rounded-rectangle cross-section centred on the origin. */
export const rrect = (w, d, r) => CrossSection.square([w - 2 * r, d - 2 * r], true).offset(r, 'Round', 2, SEG);

/** Extrude a cross-section from z = z0 to z1. */
export const extrude = (cs, z0, z1) => Manifold.extrude(cs, z1 - z0).translate([0, 0, z0]);

/** Annular sector (angles in degrees, counter-clockwise from +x), extruded z0..z1. */
export function arcBand(ro, ri, a0, a1, z0, z1, steps = 96) {
  const pts = [];
  const n = Math.max(8, Math.ceil((Math.abs(a1 - a0) / 360) * steps));
  for (let i = 0; i <= n; i++) { const a = rad(a0 + ((a1 - a0) * i) / n); pts.push([ro * Math.cos(a), ro * Math.sin(a)]); }
  for (let i = n; i >= 0; i--) { const a = rad(a0 + ((a1 - a0) * i) / n); pts.push([ri * Math.cos(a), ri * Math.sin(a)]); }
  return extrude(CrossSection.ofPolygons([pts]), z0, z1);
}

/** Polygon (array of [x,y]) extruded z0..z1. */
export function poly(pts, z0, z1) {
  return extrude(CrossSection.ofPolygons([pts]), z0, z1);
}

/** Involute spur-gear profile (module m, z teeth, 20 deg pressure angle). Returns polygon points. */
export function gearProfile(teeth, m, lash = 0.12) {
  const alpha = rad(20);
  const rp = (m * teeth) / 2, rb = rp * Math.cos(alpha), ra = rp + m, rf = rp - 1.25 * m;
  const inv = (a) => Math.tan(a) - a;
  const tTh = (PI * m) / 2 - lash;                    // tooth thickness at pitch circle
  const beta = tTh / (2 * rp) + inv(alpha);           // half tooth angle at the base circle
  const sMax = Math.sqrt((ra / rb) ** 2 - 1);
  const pts = [];
  const N = 8;
  for (let i = 0; i < teeth; i++) {
    const th = (2 * PI * i) / teeth;
    const P = (r, a) => [r * Math.cos(a), r * Math.sin(a)];
    const flank = (side) => {
      const out = [];
      for (let k = 0; k <= N; k++) {
        const s = (sMax * k) / N;
        const r = rb * Math.sqrt(1 + s * s);
        const off = beta - (s - Math.atan(s));          // angle from the tooth centre line
        out.push(P(r, th + side * off));
      }
      return out;
    };
    const right = flank(-1), left = flank(1).reverse();
    pts.push(P(rf, th - beta - 0.02), ...right, ...left, P(rf, th + beta + 0.02));
  }
  return { pts, rp, rb, ra, rf };
}

/** Full spur gear, extruded z0..z1, optionally limited to an angular window [a0,a1] (deg) around +x. */
export function gearM(teeth, m, z0, z1, window = null) {
  const { pts } = gearProfile(teeth, m);
  let g = poly(pts, z0, z1);
  if (window) {
    const R = (m * teeth) / 2 + 4;
    const wp = [[0, 0]];
    const n = 24;
    for (let i = 0; i <= n; i++) { const a = rad(window[0] + ((window[1] - window[0]) * i) / n); wp.push([R * Math.cos(a), R * Math.sin(a)]); }
    g = g.intersect(poly(wp, z0 - 1, z1 + 1));
  }
  return g;
}

/** Write a Manifold as a binary STL. Returns the Buffer. */
export function toSTL(m, name = 'part') {
  const mesh = m.getMesh();
  const vp = mesh.vertProperties, np = mesh.numProp, tv = mesh.triVerts;
  const nTri = tv.length / 3;
  const buf = Buffer.alloc(84 + nTri * 50);
  buf.write(name.slice(0, 79), 0, 'latin1');
  buf.writeUInt32LE(nTri, 80);
  let o = 84;
  for (let t = 0; t < nTri; t++) {
    const v = [0, 1, 2].map((k) => { const i = tv[t * 3 + k] * np; return [vp[i], vp[i + 1], vp[i + 2]]; });
    const ux = v[1][0] - v[0][0], uy = v[1][1] - v[0][1], uz = v[1][2] - v[0][2];
    const wx = v[2][0] - v[0][0], wy = v[2][1] - v[0][1], wz = v[2][2] - v[0][2];
    let nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx;
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    for (const f of [nx, ny, nz]) { buf.writeFloatLE(f, o); o += 4; }
    for (const p of v) for (const f of p) { buf.writeFloatLE(f, o); o += 4; }
    buf.writeUInt16LE(0, o); o += 2;
  }
  return buf;
}

/** Rigid placement { rot:[rx,ry,rz] deg, pos:[x,y,z] }: rotate, then translate. */
export const place = (m, { rot = [0, 0, 0], pos = [0, 0, 0] } = {}) => m.rotate(rot).translate(pos);

/** Dimensions summary for the manifest. */
export function stats(m) {
  const b = m.boundingBox();
  return {
    size: [b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]].map((v) => +v.toFixed(2)),
    volume_mm3: +m.volume().toFixed(1),
    triangles: m.numTri(),
    genus: m.genus(),
  };
}

/** Rotate into the print orientation, centre on x/y and drop onto z = 0. */
export function toPrint(m, rot) {
  const p = m.rotate(rot);
  const b = p.boundingBox();
  return p.translate([-(b.min[0] + b.max[0]) / 2, -(b.min[1] + b.max[1]) / 2, -b.min[2]]);
}

/** Volume (mm3), bounding box and triangle count straight from a binary STL. */
export function summarise(buf) {
  const n = buf.readUInt32LE(80);
  let vol = 0;
  const box = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
  for (let t = 0; t < n; t++) {
    const o = 84 + t * 50 + 12;
    const v = [0, 1, 2].map((k) => [0, 1, 2].map((c) => buf.readFloatLE(o + k * 12 + c * 4)));
    for (const p of v) for (let c = 0; c < 3; c++) { box[c] = Math.min(box[c], p[c]); box[c + 3] = Math.max(box[c + 3], p[c]); }
    vol += (v[0][0] * (v[1][1] * v[2][2] - v[1][2] * v[2][1]) - v[0][1] * (v[1][0] * v[2][2] - v[1][2] * v[2][0]) + v[0][2] * (v[1][0] * v[2][1] - v[1][1] * v[2][0])) / 6;
  }
  return { tri: n, vol, box };
}

