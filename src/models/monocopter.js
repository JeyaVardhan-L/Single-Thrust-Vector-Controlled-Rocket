// Phase 1 model: vane-controlled monocopter (MC-1).
// One brushless motor + prop pushes air down through four servo-driven vanes.
import { THREE, MAT, Parts, box, cyl, torus, sphere, tubeAlong } from '../common/kit.js';
import { MONO as S } from '../data/spec.js';
import { mixMonocopter } from '../sim/mixer.js';

const DEG = Math.PI / 180;
const azim = (i) => i * 90 * DEG; // vane i azimuth, measured from +X toward +Z

export function buildMonocopter() {
  const root = new THREE.Group();
  root.name = 'monocopter';
  const parts = new Parts(root);

  // ---- Guard ring + spokes + hub plate (frame-ring) ----
  {
    const g = new THREE.Group();
    const ring = torus(S.ringRadius, S.ringTube, MAT.print, 96);
    ring.position.y = S.ringY;
    g.add(ring);
    for (let i = 0; i < 4; i++) {
      const a = i * 90 * DEG + 45 * DEG;
      const len = S.ringRadius - S.hubRadius + 4;
      const spoke = box(len, 5, 8, MAT.print);
      spoke.position.set(Math.cos(a) * (S.hubRadius + len / 2 - 2), S.ringY, Math.sin(a) * (S.hubRadius + len / 2 - 2));
      spoke.rotation.y = -a;
      g.add(spoke);
    }
    g.add(cyl(S.hubRadius, S.hubRadius, 4, MAT.print, 48, 0, S.ringY + 0.5, 0));
    // status LEDs around the guard ring
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      g.add(sphere(2, MAT.glow, Math.cos(a) * S.ringRadius, S.ringY + 3.2, Math.sin(a) * S.ringRadius));
    }
    g.add(cyl(18, 18, 6, MAT.printDk, 32, 0, S.ringY - 4, 0)); // motor mount boss
    parts.add('frame-ring', g, {
      name: 'Guard ring + hub plate', category: 'structure', explode: [0, 70, 0],
      desc: 'Printed guard ring Ø250 mm with four spokes and a hub plate. Carries motor, FC stack and battery.',
    });
  }

  // ---- Legs (3) ----
  {
    const g = new THREE.Group();
    for (let i = 0; i < S.legs; i++) {
      const a = (50 + i * 120) * DEG;
      const c = (r, y) => [Math.cos(a) * r, y, Math.sin(a) * r];
      const pts = [c(S.ringRadius, S.ringY), c(S.ringRadius + 3, S.ringY - 70), c(S.ringRadius + 10, 70), c(S.legFootRadius, 5)];
      g.add(tubeAlong(pts, 3.2, MAT.print));
      g.add(sphere(5.5, MAT.rubber, ...c(S.legFootRadius, 5)));
    }
    parts.add('legs', g, {
      name: 'Landing legs (×3)', category: 'structure', explode: [0, -90, 0],
      desc: 'Three flexible printed legs with rubber foot caps. Absorb tethered-landing shocks.',
    });
  }

  // ---- Vane deck: ring, hinge shafts, flow straighteners ----
  {
    const g = new THREE.Group();
    const ring = torus(S.deckRadius, 3, MAT.print, 96);
    ring.position.y = S.deckY;
    g.add(ring);
    g.add(cyl(S.vane.radialStart, S.vane.radialStart, 8, MAT.printDk, 32, 0, S.deckY, 0));
    const shaftLen = S.deckRadius - S.vane.radialStart + 14;
    for (let i = 0; i < 4; i++) {
      const a = azim(i);
      const mid = S.vane.radialStart + shaftLen / 2;
      const shaft = cyl(1.1, 1.1, shaftLen, MAT.steel, 12);
      shaft.rotation.set(0, -a, Math.PI / 2, 'YXZ');
      shaft.position.set(Math.cos(a) * mid, S.deckY, Math.sin(a) * mid);
      g.add(shaft);
      // Orange straightener fin on the diagonal between vane axes
      const d = a + 45 * DEG;
      const finMid = (S.deckRadius + S.vane.radialStart) / 2;
      const fin = box(S.deckRadius - S.vane.radialStart - 6, 46, 2, MAT.orange);
      fin.position.set(Math.cos(d) * finMid, S.deckY, Math.sin(d) * finMid);
      fin.rotation.y = -d;
      g.add(fin);
    }
    parts.add('vane-deck', g, {
      name: 'Vane deck + flow straighteners', category: 'structure', explode: [0, -35, 0],
      desc: 'Lower ring that carries the four vane hinge shafts and the orange flow-straightening fins.',
    });
  }

  // ---- Vanes (animated) ----
  const vanePivots = [];
  {
    const g = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const holder = new THREE.Group();
      holder.position.set(0, S.deckY, 0);
      holder.rotation.y = -azim(i);     // local +X is radial, local +Z is the clockwise tangent
      const pivot = new THREE.Group();
      pivot.position.x = S.vane.radialStart + 6 + S.vane.span / 2;
      holder.add(pivot);
      const plate = box(S.vane.span, S.vane.chord, S.vane.thickness, MAT.orange);
      plate.position.y = -S.vane.chord * 0.18;
      pivot.add(plate);
      const edge = box(S.vane.span, 4, S.vane.thickness + 1, MAT.red);
      edge.position.y = -S.vane.chord * 0.18 - S.vane.chord / 2 + 2;
      pivot.add(edge);
      g.add(holder);
      vanePivots.push(pivot);
    }
    parts.add('vanes', g, {
      name: 'Control vanes (×4)', category: 'actuation', explode: [0, -75, 0],
      desc: 'Four 62×46 mm printed vanes working in the prop wash. Roll/pitch = opposite pairs, yaw = all four together.',
    });
  }

  // ---- Servos (4) ----
  {
    const g = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const holder = new THREE.Group();
      holder.position.set(0, S.deckY, 0);
      holder.rotation.y = -azim(i);
      holder.add(box(13, 23, 12, MAT.black, S.deckRadius + 14, 0, 0));
      holder.add(box(2.5, 4, 24, MAT.black, S.deckRadius + 14, 7, 0));
      const horn = cyl(5, 5, 2.5, MAT.white, 20, S.deckRadius + 6, 0, 0);
      horn.rotation.z = Math.PI / 2;
      holder.add(horn);
      g.add(holder);
    }
    parts.add('servos', g, {
      name: 'Digital micro servos (×4)', category: 'actuation', explode: [0, -35, 0],
      desc: '9–13 g metal-gear digital servos, one per vane, mounted on the deck ring and direct-driving the vane shaft.',
    });
  }

  // ---- Motor ----
  {
    const g = new THREE.Group();
    g.add(cyl(S.motor.radius, S.motor.radius, S.motor.height, MAT.black, 36, 0, S.motorY, 0));
    g.add(cyl(S.motor.radius - 1, S.motor.radius - 1, 7, MAT.red, 36, 0, S.motorY + S.motor.height / 2 + 3, 0));
    g.add(cyl(1.5, 1.5, 22, MAT.steel, 10, 0, S.motorY - S.motor.height / 2 - 6, 0));
    parts.add('motor', g, {
      name: 'Brushless motor 2306', category: 'propulsion', explode: [0, 45, 0],
      desc: '2306 outrunner (≈1900–2300 KV) on a 4S pack. Mounted to the hub, shaft pointing down.',
    });
  }

  // ---- Prop (animated) ----
  let propGroup;
  {
    const g = new THREE.Group();
    propGroup = new THREE.Group();
    propGroup.position.y = S.propY;
    const bladeLen = S.propDiameter / 2;
    for (let i = 0; i < 2; i++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(bladeLen, 1.6, 15), MAT.orange);
      blade.castShadow = true;
      blade.position.x = (bladeLen / 2 + 5) * (i ? -1 : 1);
      blade.rotation.x = (i ? -1 : 1) * 16 * DEG;
      propGroup.add(blade);
    }
    propGroup.add(cyl(6, 6, 8, MAT.black, 24));
    g.add(propGroup);
    parts.add('prop', g, {
      name: 'Propeller 6×3.5 2-blade', category: 'propulsion', explode: [0, -15, 0],
      desc: '6-inch two-blade prop pushing air downward through the vanes.',
    });
  }

  // ---- ESC ----
  {
    const g = new THREE.Group();
    g.add(box(34, 5, 20, MAT.pcb, 62, S.ringY + 5, 0));
    g.add(box(16, 3, 10, MAT.black, 62, S.ringY + 9, 0));
    parts.add('esc', g, {
      name: 'ESC 40 A (400 Hz PWM)', category: 'power', explode: [40, 85, 0],
      desc: 'Single 40 A 4S ESC (BLHeli_S / AM32) driven by a 400 Hz PWM signal from the flight computer.',
    });
  }

  // ---- Flight computer stack ----
  {
    const g = new THREE.Group();
    const y0 = S.ringY + 9;
    g.add(box(38, 2.5, 38, MAT.pcb, 0, y0, 0));
    g.add(box(36, 2.5, 18, MAT.pcb, 0, y0 + 9, 0));
    g.add(box(10, 3, 10, MAT.black, 6, y0 + 12, 0));
    g.add(box(6, 2, 6, MAT.black, -10, y0 + 3, 8));
    g.add(sphere(2.2, MAT.glow, -14, y0 + 12, -6));
    g.add(box(14, 1.5, 5, MAT.gold, 16, y0 + 3, -12));
    parts.add('fc', g, {
      name: 'Flight computer stack', category: 'avionics', explode: [0, 110, 0],
      desc: 'Teensy 4.1 + ICM-42688-P IMU + BMP390 baro + ExpressLRS receiver on a small carrier board.',
    });
  }

  // ---- Battery + strap ----
  {
    const g = new THREE.Group();
    const y = S.ringY + 26;
    g.add(box(S.battery.w, S.battery.h, S.battery.d, MAT.lipo, 0, y, 0));
    g.add(box(S.battery.w - 8, 0.8, S.battery.d - 6, MAT.black, 0, y + S.battery.h / 2 + 0.3, 0));
    g.add(box(10, S.battery.h + 4, S.battery.d + 6, MAT.black, -10, y, 0));
    g.add(box(14, 6, 8, MAT.red, S.battery.w / 2 + 6, y, 0));
    parts.add('battery', g, {
      name: 'LiPo 4S 1300 mAh', category: 'power', explode: [0, 175, 0],
      desc: '4S 1300 mAh 75C LiPo held by a Velcro strap, accessible from the top for quick swaps.',
    });
  }

  // ---- Wiring (decorative) ----
  {
    const g = new THREE.Group();
    const add = (pts, col) => g.add(tubeAlong(pts, 1.1, new THREE.MeshStandardMaterial({ color: col, roughness: 0.6 })));
    const y = S.ringY;
    add([[30, y + 24, 0], [48, y + 14, 4], [62, y + 8, 6]], 0xd8321e);
    add([[30, y + 24, 6], [48, y + 12, 8], [62, y + 7, 8]], 0x111111);
    add([[62, y + 6, -8], [40, y - 4, -14], [16, y - 12, -8]], 0x2a6ee8);
    add([[62, y + 6, -4], [38, y - 6, -10], [14, y - 14, -5]], 0xe8b400);
    add([[62, y + 6, 0], [36, y - 8, -4], [12, y - 16, 0]], 0x22aa55);
    parts.add('wiring', g, {
      name: 'Power & motor wiring', category: 'power', explode: [30, 60, 0],
      desc: 'XT60 battery lead to ESC, three motor phases from ESC to motor.',
    });
  }

  // ---- Runtime control ----
  const state = { roll: 0, pitch: 0, yaw: 0, throttle: 0.0, deflections: [0, 0, 0, 0] };

  function setControl({ roll = 0, pitch = 0, yaw = 0 } = {}) {
    Object.assign(state, { roll, pitch, yaw });
    state.deflections = mixMonocopter({ roll, pitch, yaw });
    state.deflections.forEach((d, i) => {
      vanePivots[i].rotation.x = d * S.vaneMaxDeflectionDeg * DEG;
    });
    return state.deflections;
  }
  function setThrottle(t) { state.throttle = t; }
  function update(dt) {
    propGroup.rotation.y += dt * state.throttle * 60; // visual only, not physical rpm
  }

  return { root, parts, state, setControl, setThrottle, update, spec: S, id: 'monocopter' };
}
