// Small geometry/material toolkit + part registry shared by both models.
import * as THREE from 'three';

export const MAT = {
  print:   new THREE.MeshStandardMaterial({ color: 0xb89a62, roughness: 0.55, metalness: 0.05 }), // tan PETG
  printDk: new THREE.MeshStandardMaterial({ color: 0x8a7246, roughness: 0.6, metalness: 0.05 }),
  orange:  new THREE.MeshStandardMaterial({ color: 0xe8591a, roughness: 0.5, metalness: 0.0 }),
  black:   new THREE.MeshStandardMaterial({ color: 0x16181c, roughness: 0.5, metalness: 0.3 }),
  steel:   new THREE.MeshStandardMaterial({ color: 0xb9c0c9, roughness: 0.3, metalness: 0.9 }),
  alu:     new THREE.MeshStandardMaterial({ color: 0x9aa4af, roughness: 0.4, metalness: 0.8 }),
  slate:   new THREE.MeshStandardMaterial({ color: 0x39414c, roughness: 0.75, metalness: 0.25 }),
  carbon:  new THREE.MeshStandardMaterial({ color: 0x23262b, roughness: 0.35, metalness: 0.5 }),
  pcb:     new THREE.MeshStandardMaterial({ color: 0x0f6b3a, roughness: 0.6, metalness: 0.2 }),
  gold:    new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.3, metalness: 0.9 }),
  lipo:    new THREE.MeshStandardMaterial({ color: 0xe6b400, roughness: 0.6, metalness: 0.0 }),
  red:     new THREE.MeshStandardMaterial({ color: 0xd8321e, roughness: 0.45, metalness: 0.0 }),
  white:   new THREE.MeshStandardMaterial({ color: 0xeceff3, roughness: 0.5 }),
  rubber:  new THREE.MeshStandardMaterial({ color: 0x25272b, roughness: 0.9 }),
  tube:    new THREE.MeshStandardMaterial({ color: 0x6d5a3c, roughness: 0.7 }),
  glow:    new THREE.MeshBasicMaterial({ color: 0xbfe6ff }),
};

const shadowed = (m) => { m.castShadow = true; m.receiveShadow = true; return m; };

export function box(w, h, d, mat = MAT.print, x = 0, y = 0, z = 0) {
  const m = shadowed(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat));
  m.position.set(x, y, z);
  return m;
}
export function cyl(rTop, rBot, h, mat = MAT.print, seg = 32, x = 0, y = 0, z = 0) {
  const m = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg), mat));
  m.position.set(x, y, z);
  return m;
}
export function torus(R, r, mat = MAT.print, seg = 64) {
  const m = shadowed(new THREE.Mesh(new THREE.TorusGeometry(R, r, 12, seg), mat));
  m.rotation.x = Math.PI / 2; // lay flat (axis = Y)
  return m;
}
export function sphere(r, mat = MAT.print, x = 0, y = 0, z = 0) {
  const m = shadowed(new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), mat));
  m.position.set(x, y, z);
  return m;
}
// A cylinder between two points.
export function strut(a, b, r = 2, mat = MAT.print, seg = 12) {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const len = va.distanceTo(vb);
  const m = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), mat));
  m.position.copy(va).add(vb).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
  return m;
}
export function tubeAlong(points, r = 3, mat = MAT.print) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  return shadowed(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, r, 10, false), mat));
}

// Involute-ish spur gear (flat teeth) as an extruded shape. Axis = Z of the shape; thickness = t.
// arc: [startRad, endRad] to make a gear sector, or null for full gear.
export function gear(teeth, module_, thickness, mat = MAT.alu, arc = null, boreR = 1.6) {
  const rp = (teeth * module_) / 2;        // pitch radius
  const ra = rp + module_;                  // addendum radius
  const rd = rp - 1.25 * module_;           // dedendum radius
  const shape = new THREE.Shape();
  const pitch = (Math.PI * 2) / teeth;
  const a0 = arc ? arc[0] : 0;
  const a1 = arc ? arc[1] : Math.PI * 2;
  const n = arc ? Math.max(2, Math.round((a1 - a0) / pitch)) : teeth;
  const step = (a1 - a0) / n;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = a0 + i * step;
    const w = step;
    pts.push([rd, a], [rd, a + w * 0.12], [ra * 0.98, a + w * 0.3], [ra * 0.98, a + w * 0.55], [rd, a + w * 0.73], [rd, a + w]);
  }
  if (arc) pts.push([rd * 0.55, a1], [rd * 0.55, a0]);
  pts.forEach(([r, a], i) => {
    const px = Math.cos(a) * r, py = Math.sin(a) * r;
    i === 0 ? shape.moveTo(px, py) : shape.lineTo(px, py);
  });
  shape.closePath();
  if (!arc) {
    const hole = new THREE.Path();
    hole.absarc(0, 0, boreR, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  }
  const geo = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
  geo.translate(0, 0, -thickness / 2);
  return shadowed(new THREE.Mesh(geo, mat));
}

// Square frame (4 bars + diagonal gussets) used by the rocket stack.
export function squareFrame(size, bar, thick, mat = MAT.print, holeD = 0) {
  const g = new THREE.Group();
  const half = size / 2;
  g.add(box(size, thick, bar, mat, 0, 0, half - bar / 2));
  g.add(box(size, thick, bar, mat, 0, 0, -half + bar / 2));
  g.add(box(bar, thick, size - 2 * bar, mat, half - bar / 2, 0, 0));
  g.add(box(bar, thick, size - 2 * bar, mat, -half + bar / 2, 0, 0));
  return g;
}

// ---------- Part registry ----------
// A Part is a Group with metadata. setExplode() offsets it along `explode` (mm).
export class Parts {
  constructor(root) {
    this.root = root;
    this.map = new Map();
    this.explodeAmount = 0;
  }
  add(id, group, meta = {}) {
    group.userData.partId = id;
    group.traverse((o) => { o.userData.partId = id; });
    const part = {
      id,
      name: meta.name || id,
      category: meta.category || 'structure',
      desc: meta.desc || '',
      cad: meta.cad || '',
      explode: new THREE.Vector3(...(meta.explode || [0, 0, 0])),
      base: group.position.clone(),
      group,
    };
    this.map.set(id, part);
    this.root.add(group);
    return part;
  }
  get(id) { return this.map.get(id); }
  list() { return [...this.map.values()]; }
  setExplode(f) {
    this.explodeAmount = f;
    for (const p of this.map.values()) {
      p.group.position.copy(p.base).addScaledVector(p.explode, f);
    }
  }
  setVisible(id, v) { const p = this.map.get(id); if (p) p.group.visible = v; }
  // Highlight uses emissive tint on cloned materials so shared MAT stays untouched.
  setHighlight(id, on, color = 0x2f9bff) {
    const p = this.map.get(id);
    if (!p) return;
    p.group.traverse((o) => {
      if (!o.isMesh) return;
      if (!o.userData._mat) o.userData._mat = o.material;
      if (on) {
        if (!o.userData._hl) { o.userData._hl = o.material.clone(); }
        o.material = o.userData._hl;
        if ('emissive' in o.material) { o.material.emissive.setHex(color); o.material.emissiveIntensity = 0.55; }
      } else if (o.userData._hl) {
        o.material = o.userData._mat;
      }
    });
  }
  setGhost(id, ghost) {
    const p = this.map.get(id);
    if (!p) return;
    p.group.traverse((o) => {
      if (!o.isMesh) return;
      if (!o.userData._mat) o.userData._mat = o.material;
      if (ghost) {
        if (!o.userData._gh) {
          o.userData._gh = o.userData._mat.clone();
          o.userData._gh.transparent = true;
          o.userData._gh.opacity = 0.12;
          o.userData._gh.depthWrite = false;
        }
        o.material = o.userData._gh;
      } else {
        o.material = o.userData._mat;
      }
      o.castShadow = !ghost;
    });
  }
}

export { THREE };
