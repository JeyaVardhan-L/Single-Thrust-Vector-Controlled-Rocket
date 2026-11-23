// Phase 1 model: MC-1 vane-control monocopter. Built from the same numbers (src/data/spec.js) as the printable parts in
// scripts/cad/mono.mjs. three.js is Y-up: the CAD z axis is the model Y axis.
//
// One 10 inch pusher prop hangs under a motor that hangs under the hub plate. Below the prop: four control vanes on the axes and four fixed
// stator fins on the diagonals. Four posts (also the legs) on the diagonals carry the hub plate, the prop guard ring and the servo ring.
import { THREE, MAT, Parts, box, cyl, torus, sphere, tubeAlong } from '../common/kit.js';
import { MONO as S } from '../data/spec.js';
import { mixMonocopter } from '../sim/mixer.js';

const DEG = Math.PI / 180;
const azim = (i) => i * 90 * DEG;                 // vane i azimuth, measured from +X toward +Z (clockwise from above)
const diag = (k) => (45 + 90 * k) * DEG;

export function buildMonocopter() {
  const root = new THREE.Group();
  root.name = 'monocopter';
  const parts = new Parts(root);
  const R = S.postRadius, py = S.plate.z, deckY = S.deck.z;
  const at = (a, r) => [Math.cos(a) * r, Math.sin(a) * r];        // (x, z) on the horizontal plane

  // ---- posts / legs (4) with foot caps ----
  {
    const g = new THREE.Group();
    const h = S.postZ[1] - S.postZ[0];
    for (let k = 0; k < 4; k++) {
      const a = diag(k), [x, z] = at(a, R);
      const p = box(S.post.t, h, S.post.w, MAT.print, x, S.postZ[0] + h / 2, z);
      p.rotation.y = -a;
      g.add(p);
      const f = box(S.post.t + 8, 20, S.post.w + 8, MAT.rubber, x, S.postZ[0] + 10, z);
      f.rotation.y = -a;
      g.add(f);
    }
    parts.add('posts', g, {
      name: 'Posts / legs (×4)', category: 'structure', explode: [0, -80, 0],
      desc: 'Four 12 × 24 mm posts on the diagonals, 165 mm long. They carry the arms, the stators and both rings and double as the legs, with TPU foot caps.',
    });
  }

  // ---- rings: prop guard ring and lower servo ring with the four servo cradles ----
  {
    const g = new THREE.Group();
    const guard = torus(R, 2.6, MAT.print, 128);
    guard.position.y = S.ring.guardZ;
    g.add(guard);
    const lower = torus(R, 2.4, MAT.print, 128);
    lower.position.y = 0;
    g.add(lower);
    for (let i = 0; i < 4; i++) {
      const a = azim(i);
      const holder = new THREE.Group();
      holder.rotation.y = -a;
      holder.add(box(9, 22, 64, MAT.printDk, R - 0.5, 0, 0));          // cradle / node
      g.add(holder);
    }
    parts.add('rings', g, {
      name: 'Prop guard ring + lower ring', category: 'structure', explode: [0, 50, 0],
      desc: 'Guard ring around the prop plane, 13 mm outside the prop tips. The lower ring ties the posts to the four servo cradles.',
    });
  }

  // ---- hub plate, arms, standoffs, electronics deck ----
  {
    const g = new THREE.Group();
    g.add(cyl(S.plate.radius, S.plate.radius, py[1] - py[0], MAT.print, 64, 0, (py[0] + py[1]) / 2, 0));
    for (let k = 0; k < 4; k++) {
      const a = diag(k), len = R - S.plate.radius, [x, z] = at(a, S.plate.radius + len / 2);
      const arm = box(len, py[1] - py[0], S.arm.w, MAT.print, x, (py[0] + py[1]) / 2, z);
      arm.rotation.y = -a;
      g.add(arm);
      const ribLen = R - 8 - 88, [rx, rz] = at(a, 88 + ribLen / 2);
      const rib = box(ribLen, S.arm.ribH, S.arm.ribT, MAT.print, rx, py[1] + S.arm.ribH / 2, rz);
      rib.rotation.y = -a;
      g.add(rib);
    }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(cyl(2.75, 2.75, S.standoff.length, MAT.gold, 6, sx * S.standoff.x, py[1] + S.standoff.length / 2, sz * S.standoff.y));
    g.add(box(S.deck.w, S.deck.z[1] - S.deck.z[0], S.deck.d, MAT.print, 0, (deckY[0] + deckY[1]) / 2, 0));
    parts.add('hub-plate', g, {
      name: 'Hub plate, arms, electronics deck', category: 'structure', explode: [0, 110, 0],
      desc: 'Ø116 hub plate with the motor hanging under it and the battery strapped on top, four T-section arms (14 mm flange, 11 mm rib) to the posts, and the electronics deck on four 39 mm standoffs.',
    });
  }

  // ---- lower hub + stators ----
  {
    const g = new THREE.Group();
    const hy = (S.hub.z[0] + S.hub.z[1]) / 2;
    g.add(cyl(S.hub.radius, S.hub.radius, S.hub.z[1] - S.hub.z[0], MAT.printDk, 40, 0, hy, 0));
    const sy = S.hub.z[1] - S.stator.height / 2;
    for (let k = 0; k < 4; k++) {
      const a = diag(k), len = R - 4 - 14, [x, z] = at(a, 14 + len / 2);
      const f = box(len, S.stator.height, S.stator.thickness, MAT.orange, x, sy, z);
      f.rotation.y = -a;
      g.add(f);
    }
    parts.add('stators', g, {
      name: 'Lower hub + stator fins (×4)', category: 'structure', explode: [0, -35, 0],
      desc: 'Four fixed fins on the diagonals straighten the swirl behind the prop and cancel most of its reaction torque, so the vanes keep their authority for control.',
    });
  }

  // ---- vanes (animated) ----
  const vanePivots = [];
  {
    const g = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const holder = new THREE.Group();
      holder.rotation.y = -azim(i);                 // local +X is radial
      const pivot = new THREE.Group();
      pivot.position.x = (S.vane.rStart + S.vane.rEnd) / 2;
      holder.add(pivot);
      const span = S.vane.rEnd - S.vane.rStart;
      const plate = box(span, S.vane.chord, S.vane.thickness, MAT.orange);
      plate.position.y = S.vane.hingeFromLE - S.vane.chord / 2;
      pivot.add(plate);
      const rod = cyl(1.5, 1.5, R - 12 - 16, MAT.steel, 12);
      rod.rotation.z = Math.PI / 2;
      rod.position.x = ((16 + R - 12) / 2) - pivot.position.x;
      pivot.add(rod);
      const spine = cyl(3, 3, span, MAT.orange, 20);
      spine.rotation.z = Math.PI / 2;
      pivot.add(spine);
      g.add(holder);
      vanePivots.push(pivot);
    }
    parts.add('vanes', g, {
      name: 'Control vanes (×4)', category: 'actuation', explode: [0, -75, 0],
      desc: 'Four 91 × 55 mm vanes on a Ø3 rod each, hinged 30 % back. Roll and pitch = opposite pairs, yaw = all four together; ±25° at full command.',
    });
  }

  // ---- servos (4) ----
  {
    const g = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const holder = new THREE.Group();
      holder.rotation.y = -azim(i);
      const x0 = R - 5.6;
      holder.add(box(S.servo.H, S.servo.W, S.servo.L, MAT.black, x0 + S.servo.H / 2, 0, 5.6));
      const horn = box(2.5, 5, 22, MAT.white, R - 9.5, 0, 0);
      holder.add(horn);
      g.add(holder);
    }
    parts.add('servos', g, {
      name: 'Micro servos (×4)', category: 'actuation', explode: [0, -35, 0],
      desc: '9 to 12 g metal-gear digital servos in the four cradles. Each drives its vane rod directly through a horn adapter: no linkage, no slop.',
    });
  }

  // ---- motor (shaft down) ----
  {
    const g = new THREE.Group();
    const m = S.motor, yc = m.zTop - m.height / 2;
    g.add(cyl(m.radius, m.radius, m.height, MAT.black, 40, 0, yc, 0));
    g.add(cyl(m.radius - 1, m.radius - 1, 3, MAT.red, 40, 0, yc - m.height / 2 + 4, 0));
    g.add(cyl(2, 2, 12, MAT.steel, 12, 0, m.zTop - m.height - 6, 0));
    parts.add('motor', g, {
      name: 'Brushless motor 2810 (≈1100 KV)', category: 'propulsion', explode: [0, 55, 0],
      desc: '28xx outrunner on 4S, hanging under the hub plate with its shaft pointing down. 16 × 16 or 19 × 19 mm M3 mounting pattern.',
    });
  }

  // ---- prop (animated) ----
  let propGroup;
  {
    const g = new THREE.Group();
    propGroup = new THREE.Group();
    propGroup.position.y = S.prop.z;
    const blade = S.prop.radius - 6;
    for (let i = 0; i < 2; i++) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(blade, 1.6, 20), MAT.orange);
      b.castShadow = true;
      b.position.x = (blade / 2 + 6) * (i ? -1 : 1);
      b.rotation.x = (i ? -1 : 1) * 16 * DEG;
      propGroup.add(b);
    }
    propGroup.add(cyl(7, 7, 8, MAT.black, 24));
    g.add(propGroup);
    parts.add('prop', g, {
      name: 'Propeller 10×4.5 two-blade pusher', category: 'propulsion', explode: [0, -20, 0],
      desc: '10 inch (254 mm) two-blade prop. It hangs below the motor and blows air down through the vanes, so it must be a pusher (reverse-pitch) type.',
    });
  }

  // ---- battery + strap ----
  {
    const g = new THREE.Group();
    const y = py[1] + 3 + S.battery.h / 2;
    g.add(box(S.battery.w, S.battery.h, S.battery.d, MAT.lipo, 0, y, 0));
    g.add(box(S.battery.w - 8, 0.8, S.battery.d - 6, MAT.black, 0, y + S.battery.h / 2 + 0.3, 0));
    for (const sx of [-20, 20]) g.add(box(10, S.battery.h + 4, S.battery.d + 6, MAT.black, sx, y, 0));
    g.add(box(14, 6, 8, MAT.red, S.battery.w / 2 + 6, y, 0));
    parts.add('battery', g, {
      name: 'LiPo 4S 1500 mAh', category: 'power', explode: [0, 150, 0],
      desc: '4S 1500 mAh 75C LiPo (about 175 g) strapped to the hub plate, centred on the axis, between the motor and the electronics deck.',
    });
  }

  // ---- electronics deck contents ----
  {
    const g = new THREE.Group();
    const y = deckY[1];
    g.add(box(69, 3, 25.5, MAT.pcb, -8, y + 1.5 + 4, -16));            // ESP32-S3 board
    g.add(box(16, 2.5, 14, MAT.steel, -30, y + 4 + 4, -16));
    g.add(box(45, 6, 22, MAT.black, 4, y + 3, 18));                     // ESC
    g.add(box(24, 6, 14, MAT.red, 32, y + 3, -22));                     // BECs
    parts.add('electronics', g, {
      name: 'ESP32-S3, ESC, BECs', category: 'avionics', explode: [0, 200, 0],
      desc: 'On the deck in the prop intake airflow (cooling): ESP32-S3 board, 40 A ESC, 6 V servo BEC and 5 V logic BEC. The ESP32-S3 makes the Wi-Fi network the phone flies it over. No IMU, no receiver: the pilot closes the loop.',
    });
  }

  // ---- wiring (decorative) ----
  {
    const g = new THREE.Group();
    const add = (pts, col) => g.add(tubeAlong(pts, 1.1, new THREE.MeshStandardMaterial({ color: col, roughness: 0.6 })));
    add([[38, py[1] + 14, 0], [42, py[1] + 40, 6], [34, deckY[0] + 2, 12]], 0xd8321e);
    add([[40, py[1] + 14, 4], [44, py[1] + 40, 8], [36, deckY[0] + 2, 14]], 0x111111);
    add([[10, py[0] - 6, 14], [14, py[0] + 10, 24], [18, deckY[0] + 4, 20]], 0x2a6ee8);
    add([[12, py[0] - 6, 10], [16, py[0] + 10, 22], [20, deckY[0] + 4, 18]], 0xe8b400);
    add([[14, py[0] - 6, 6], [18, py[0] + 10, 20], [22, deckY[0] + 4, 16]], 0x22aa55);
    parts.add('wiring', g, {
      name: 'Power, motor and servo wiring', category: 'power', explode: [30, 90, 0],
      desc: 'XT60 lead to the ESC, three motor phases down through the hub plate, servo leads along the posts.',
    });
  }

  // ---- runtime control ----
  const state = { roll: 0, pitch: 0, yaw: 0, throttle: 0.0, deflections: [0, 0, 0, 0] };

  function setControl({ roll = 0, pitch = 0, yaw = 0 } = {}) {
    Object.assign(state, { roll, pitch, yaw });
    state.deflections = mixMonocopter({ roll, pitch, yaw });
    state.deflections.forEach((d, i) => { vanePivots[i].rotation.x = d * S.vaneMaxDeflectionDeg * DEG; });
    return state.deflections;
  }
  function setThrottle(t) { state.throttle = t; }
  function update(dt) { propGroup.rotation.y += dt * state.throttle * 60; }   // visual only, not physical rpm

  return { root, parts, state, setControl, setThrottle, update, spec: S, id: 'monocopter' };
}
