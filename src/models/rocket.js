// Phase 2 model: RK-1 TVC rocket (stacked-frame airframe, gear-driven 2-axis gimbal, splayed legs).
// Part ids follow the CAD browser tree: tvc, gear36t1, gear36t2, rods, landing-frame, battery-frame,
// pcb-frame, telemetry-frame, landing-gear, test-stand (+ motor).
import { THREE, MAT, Parts, box, cyl, torus, sphere, strut, gear, plate, tubeAlong } from '../common/kit.js';
import { ROCKET as S, GEAR_RATIO } from '../data/spec.js';

const DEG = Math.PI / 180;
const PI = Math.PI;

export function buildRocket() {
  const root = new THREE.Group();
  root.name = 'rocket';
  const parts = new Parts(root);
  const gy = S.gimbalY;

  // ---------------- shared helpers for the stack ----------------
  const blueMat = new THREE.MeshStandardMaterial({ color: 0x2f6fd0, roughness: 0.5, metalness: 0.1 });
  const brass = MAT.gold;
  const RO = S.rodOffset, T = S.frameThickness;

  // One 3D-printed stack plate: rounded square, rod bosses with nuts above and below, lightening holes.
  function stackPlate(y, extraHoles = []) {
    const g = new THREE.Group();
    const holes = [];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) holes.push([sx * RO, sz * RO, 3.3]);
    holes.push([0, 0, 17]);
    for (const [x, z] of [[-30, 0], [30, 0], [0, -32], [0, 32]]) holes.push([x, z, 7.5]);
    holes.push(...extraHoles);
    const pl = plate(S.frameSize, T, holes, MAT.print, 8);
    pl.position.y = y - T / 2;
    g.add(pl);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      g.add(cyl(7, 7.6, T + 4, MAT.printDk, 20, sx * RO, y, sz * RO));          // rod boss
      g.add(cyl(5.2, 5.2, 3, MAT.steel, 6, sx * RO, y + T / 2 + 4.5, sz * RO)); // lock nut above
      g.add(cyl(5.2, 5.2, 3, MAT.steel, 6, sx * RO, y - T / 2 - 4.5, sz * RO)); // lock nut below
    }
    return g;
  }
  const standoff = (g, x, y, z, h = 9) => g.add(cyl(2.6, 2.6, h, brass, 8, x, y + h / 2, z));
  const lead = (g, pts, col) => g.add(tubeAlong(pts, 0.9, new THREE.MeshStandardMaterial({ color: col, roughness: 0.6 })));
  const led = (g, x, y, z, c) => g.add(sphere(1.6, new THREE.MeshBasicMaterial({ color: c }), x, y, z));

  // ---------------- rods ----------------
  {
    const g = new THREE.Group();
    const len = S.rodTopY - S.rodBottomY;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const x = sx * RO, z = sz * RO;
      g.add(cyl(S.rodRadius, S.rodRadius, len, MAT.carbon, 14, x, S.rodBottomY + len / 2, z));
      g.add(sphere(S.rodRadius + 1.2, MAT.black, x, S.rodTopY, z));                                // top cap
      g.add(cyl(S.rodRadius + 1.6, S.rodRadius + 1.6, 4, MAT.black, 14, x, S.rodBottomY - 2, z));  // foot cap
    }
    parts.add('rods', g, {
      name: 'Rods (×4)', category: 'structure', cad: 'rods:1', explode: [0, -25, 0],
      desc: 'Four Ø6 mm carbon-fibre rods, 400 mm, capped at both ends. They carry the stack and the thrust load from the gimbal mount.',
    });
  }

  // ---------------- stack: telemetry frame (top) ----------------
  {
    const y = S.telemetryFrameY, top = y + T / 2;
    const g = new THREE.Group();
    g.add(stackPlate(y));
    for (const [x, z] of [[-34, 22], [34, 22], [-34, -22]]) standoff(g, x, top, z, 6);
    // ELRS receiver with shield can and antenna connector
    g.add(box(34, 1.4, 22, blueMat, -22, top + 6.7, 12));
    g.add(box(14, 2.4, 11, MAT.steel, -26, top + 8.6, 12));
    const sma = cyl(2.8, 2.8, 8, MAT.gold, 16, -40, top + 8, 12);
    sma.rotation.z = PI / 2;
    g.add(sma);
    // GPS puck: white housing, black patch, dark bezel
    g.add(cyl(17, 17.5, 6, MAT.white, 40, 22, top + 3, -10));
    g.add(cyl(13, 13, 0.6, MAT.black, 40, 22, top + 6.2, -10));
    g.add(cyl(18, 18, 1.2, MAT.slate, 40, 22, top + 0.6, -10));
    // whip antenna on a base, with tip bead
    g.add(cyl(3.2, 3.8, 5, MAT.black, 16, 20, top + 2.5, 26));
    g.add(cyl(0.9, 0.9, 92, MAT.black, 8, 20, top + 50, 26));
    g.add(sphere(1.8, MAT.red, 20, top + 96, 26));
    // buzzer, status LEDs, short flying leads
    g.add(cyl(5.5, 5.5, 5, MAT.black, 20, -34, top + 2.5, -28));
    led(g, -10, top + 2, -32, 0x3ecf8e); led(g, -3, top + 2, -32, 0xffb000); led(g, 4, top + 2, -32, 0xff4040);
    lead(g, [[-22, top + 6, 20], [-12, top + 18, 40], [-4, y - 2, 46]], 0x111111);
    lead(g, [[22, top + 1, -26], [30, top + 14, -40], [38, y - 2, -46]], 0xd8321e);
    parts.add('telemetry-frame', g, {
      name: 'Telemetry frame', category: 'avionics', cad: 'telemetry-frame:1', explode: [0, 190, 0],
      desc: 'Top plate: ELRS receiver with antenna lead, GPS puck, 90 mm whip antenna, buzzer and three status LEDs. Highest point for the best RF and GPS view.',
    });
  }

  // ---------------- stack: PCB frame (middle) ----------------
  {
    const y = S.pcbFrameY, top = y + T / 2;
    const g = new THREE.Group();
    g.add(stackPlate(y));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) standoff(g, sx * 38, top, sz * 22, 9);
    const by = top + 9 + 0.8;                              // board top surface height
    g.add(box(88, 1.6, 52, MAT.pcb, 0, by, 0));            // carrier board
    // Teensy 4.1: PCB, MCU, USB, SD slot, pin headers
    g.add(box(61, 1.4, 18, MAT.pcb, -8, by + 4, 0));
    g.add(box(10, 1.4, 10, MAT.black, -4, by + 5.1, 0));
    g.add(box(8, 2.6, 7, MAT.steel, -41.5, by + 5.2, 0));
    g.add(box(15, 2.4, 12, MAT.steel, 20, by + 5.2, 0));
    g.add(box(58, 2.6, 2.4, MAT.black, -8, by + 2.5, 8));
    g.add(box(58, 2.6, 2.4, MAT.black, -8, by + 2.5, -8));
    // IMU + baro daughter boards
    g.add(box(15, 1.2, 15, blueMat, 30, by + 1.4, 12));
    g.add(box(5, 1.2, 5, MAT.black, 30, by + 2.4, 12));
    g.add(box(10, 1.2, 10, blueMat, 30, by + 1.4, -10));
    g.add(box(3.5, 1, 3.5, MAT.steel, 30, by + 2.3, -10));
    // ESC signal and servo header blocks + JST connectors
    for (const z of [-20, -13]) g.add(box(8, 8, 6.4, blueMat, 36, by + 4.8, z));
    for (let i = 0; i < 4; i++) g.add(box(9, 5, 6, MAT.white, -40, by + 3.3, 17 - i * 6.5));
    // capacitors, regulator, fuse
    for (const x of [8, 14, 20]) g.add(cyl(2.6, 2.6, 6, MAT.black, 14, x, by + 3.8, -20));
    g.add(box(12, 3, 9, MAT.black, 8, by + 2.4, 20));
    g.add(box(9, 3.2, 4, MAT.red, 22, by + 2.6, 20));
    // remove-before-flight pin with flag, arm toggle switch, LEDs
    g.add(cyl(1.6, 1.6, 20, MAT.red, 10, -22, by + 11, -20));
    g.add(box(18, 0.8, 9, MAT.red, -22, by + 20.6, -24));
    g.add(cyl(3.6, 3.6, 5, MAT.steel, 16, 40, by + 4, 20));
    const lever = cyl(1, 1, 9, MAT.steel, 8, 40, by + 8.5, 20);
    lever.rotation.x = 0.35;
    g.add(lever);
    led(g, -36, by + 1.8, -21, 0x3ecf8e); led(g, -31, by + 1.8, -21, 0xffb000);
    lead(g, [[-40, by + 6, 17], [-50, by + 4, 40], [-46, y - 2, 48]], 0xe8b400);
    lead(g, [[-40, by + 6, 10.5], [-52, by + 2, 34], [-47, y - 2, 46]], 0x2a6ee8);
    parts.add('pcb-frame', g, {
      name: 'PCB frame (flight computer)', category: 'avionics', cad: 'pcb-frame:1', explode: [0, 100, 0],
      desc: 'Carrier board on brass standoffs: Teensy 4.1 with microSD, IMU and baro boards, servo JST ports, ESC signal headers, regulators, fuse, RBF pin and arm switch. The IMU sits on the stack axis.',
    });
  }

  // ---------------- stack: battery frame (bottom of the stack) ----------------
  {
    const y = S.batteryFrameY, top = y + T / 2;
    const g = new THREE.Group();
    g.add(stackPlate(y));
    const pack = (z, tag) => {
      const p = new THREE.Group();
      p.add(box(56, 17, 29, MAT.lipo, 0, top + 8.5, z));
      p.add(box(50, 0.6, 23, MAT.black, 0, top + 17.2, z));      // label panel
      p.add(box(8, 1, 14, tag, -14, top + 17.7, z));              // colour tag
      p.add(box(7, 5.5, 8, MAT.red, 31, top + 8, z));             // XT30 housing
      p.add(box(3, 3, 6, MAT.gold, 35, top + 8, z));
      return p;
    };
    g.add(pack(-17, MAT.white));   // pack A: avionics
    g.add(pack(17, MAT.orange));   // pack B: servos
    // Velcro straps over both packs and a foam pad
    g.add(box(9, 0.9, 68, MAT.black, -2, top + 17.9, 0));
    g.add(box(9, 19, 1.2, MAT.black, -2, top + 9, 34.4));
    g.add(box(9, 19, 1.2, MAT.black, -2, top + 9, -34.4));
    g.add(box(60, 1.2, 4, MAT.rubber, 0, top + 0.6, 0));
    lead(g, [[32, top + 8, -17], [46, top + 12, -30], [48, y + 12, -42], [48, y - 4, -46]], 0xd8321e);
    lead(g, [[32, top + 8, 17], [46, top + 12, 30], [48, y + 12, 42], [48, y - 4, 46]], 0xd8321e);
    parts.add('battery-frame', g, {
      name: 'Battery frame (packs A + B)', category: 'power', cad: 'battery-frame1:1', explode: [0, 40, 0],
      desc: 'Two 2S 850 mAh LiPo packs side by side under Velcro straps. Pack A (white tag) feeds the avionics, pack B (orange tag) feeds only the gimbal servos, so servo current spikes cannot reset the flight computer.',
    });
  }

  // ---------------- landing frame: diamond plate, corners on the leg axes ----------------
  {
    const y = S.landingFrameY;
    const g = new THREE.Group();
    const dia = new THREE.Group();
    dia.position.y = y;
    dia.rotation.y = PI / 4;
    const pl = plate(S.landingFrameSize, T + 1, [[0, 0, 27], [-30, 30, 8], [30, 30, 8], [-30, -30, 8], [30, -30, 8]], MAT.print, 9);
    pl.position.y = -(T + 1) / 2;
    dia.add(pl);
    g.add(dia);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      g.add(cyl(8.5, 8.5, T + 5, MAT.printDk, 20, sx * RO, y, sz * RO));
      g.add(cyl(5.2, 5.2, 3, MAT.steel, 6, sx * RO, y + 4.5, sz * RO));
      g.add(cyl(5.2, 5.2, 3, MAT.steel, 6, sx * RO, y - 4.5, sz * RO));
    }
    // hinge lugs on the four corners (on the X and Z axes)
    for (let i = 0; i < 4; i++) {
      const hold = new THREE.Group();
      hold.position.set(0, y, 0);
      hold.rotation.y = -i * 90 * DEG;                        // local +X is radial
      const R = S.legHingeRadius;
      hold.add(box(20, 6, 22, MAT.printDk, R - 12, -1, 0));
      for (const sz of [-1, 1]) hold.add(box(14, 22, 3, MAT.printDk, R - 2, -9, sz * 8));
      const pin = cyl(2, 2, 24, MAT.steel, 12, R, -12, 0);
      pin.rotation.x = PI / 2;
      hold.add(pin);
      g.add(hold);
    }
    parts.add('landing-frame', g, {
      name: 'Landing frame', category: 'structure', cad: 'landing-frame:1', explode: [0, -40, 0],
      desc: 'Diamond plate (rotated 45°) whose four corners carry the leg hinge lugs; the rods pass through bosses on its edges. Also the upper guide for the motor mount tube.',
    });
  }

  // ---------------- TVC gimbal ----------------
  const outerPivot = new THREE.Group();   // rotates about X (axis 1)
  const innerPivotTVC = new THREE.Group(); // rotates about Z (axis 2), child of outer
  {
    const g = new THREE.Group();
    // fixed mount ring (square, on the rod corners)
    const m = 46;
    g.add(box(2 * m + 6, 12, 6, MAT.printDk, 0, gy, m));
    g.add(box(2 * m + 6, 12, 6, MAT.printDk, 0, gy, -m));
    g.add(box(6, 12, 2 * m + 6, MAT.printDk, m, gy, 0));
    g.add(box(6, 12, 2 * m + 6, MAT.printDk, -m, gy, 0));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(14, 14, 14, MAT.printDk, sx * S.rodOffset, gy, sz * S.rodOffset));
    // X-axis bearings (bosses)
    for (const sx of [-1, 1]) {
      const bearing = cyl(6, 6, 8, MAT.steel, 20, sx * 44, gy, 0);
      bearing.rotation.z = PI / 2;
      g.add(bearing);
    }
    // servo A bracket (pitch axis servo, at +X)
    g.add(box(14, 3, 24, MAT.printDk, 56, gy - 18, 0));
    g.add(box(4, 30, 22, MAT.printDk, 49, gy - 24, 0));
    // Outer ring (rotates about X)
    outerPivot.position.set(0, gy, 0);
    const ring = torus(30, 3, MAT.print, 64);
    outerPivot.add(ring);
    const pinX = cyl(2.4, 2.4, 100, MAT.steel, 14); pinX.rotation.z = PI / 2; outerPivot.add(pinX);
    for (const sz of [-1, 1]) {
      const boss = cyl(5.5, 5.5, 8, MAT.printDk, 18, 0, 0, sz * 30);
      boss.rotation.x = PI / 2;
      outerPivot.add(boss);
    }
    // Inner collar (rotates about Z) carrying the motor mount tube
    innerPivotTVC.add(cyl(19, 19, 26, MAT.printDk, 40));
    const pinZ = cyl(2.4, 2.4, 82, MAT.steel, 14); pinZ.rotation.x = PI / 2; innerPivotTVC.add(pinZ);
    outerPivot.add(innerPivotTVC);
    g.add(outerPivot);
    parts.add('tvc', g, {
      name: 'TVC gimbal (mount + rings)', category: 'actuation', cad: 'tvc:1', explode: [0, -110, 0],
      desc: 'Two-axis gimbal. Fixed square mount on the rods, outer ring about X, inner collar about Z. Collar grips the motor mount tube.',
    });
  }

  // gear36t1: sector + pinion + servo on the X axis (rides on the fixed mount)
  const sectorA = new THREE.Group(), pinionA = new THREE.Group(), hornA = new THREE.Group();
  {
    const g = new THREE.Group();
    const mod = S.gear.module;
    const rpS = (S.gear.sectorTeeth * mod) / 2, rpP = (S.gear.pinionTeeth * mod) / 2;
    sectorA.position.set(52, gy, 0);
    const sec = gear(S.gear.sectorTeeth, mod, 4, MAT.alu, [-PI / 2 - 0.5, -PI / 2 + 0.5]);
    sec.rotation.y = PI / 2;
    sectorA.add(sec);
    const spoke = box(4, 22, 4, MAT.alu, 0, -10, 0); sectorA.add(spoke);
    sectorA.add(cyl(5, 5, 4, MAT.alu, 20).rotateZ(PI / 2));
    g.add(sectorA);
    pinionA.position.set(52, gy - (rpS + rpP), 0);
    const pin = gear(S.gear.pinionTeeth, mod, 4, MAT.gold, null, 1.6);
    pin.rotation.y = PI / 2;
    pinionA.add(pin);
    g.add(pinionA);
    // servo body behind the pinion (shaft along -X)
    g.add(box(22, 23, 12, MAT.black, 67, gy - (rpS + rpP) - 5.5, 0));
    g.add(box(4, 4, 24, MAT.black, 67, gy - (rpS + rpP) + 4, 0));
    parts.add('gear36t1', g, {
      name: 'gear36t1 + axis-1 servo', category: 'actuation', cad: 'gear36t1:1', explode: [110, -110, 0],
      desc: '36-tooth gear sector printed into the outer ring, driven by an 18-tooth pinion on the servo (2:1). Servo travel is 2× gimbal travel.',
    });
  }

  // gear36t2: second axis; rides on the outer ring, so everything is inside a pivot that follows axis 1
  const pivotX2 = new THREE.Group(), sectorB = new THREE.Group(), pinionB = new THREE.Group();
  {
    const g = new THREE.Group();
    const mod = S.gear.module;
    const rpS = (S.gear.sectorTeeth * mod) / 2, rpP = (S.gear.pinionTeeth * mod) / 2;
    pivotX2.position.set(0, gy, 0);
    sectorB.position.set(0, 0, 40);
    sectorB.add(gear(S.gear.sectorTeeth, mod, 4, MAT.alu, [-PI / 2 - 0.5, -PI / 2 + 0.5]));
    sectorB.add(box(4, 22, 4, MAT.alu, 0, -10, 0));
    sectorB.add(cyl(5, 5, 4, MAT.alu, 20).rotateX(PI / 2));
    pivotX2.add(sectorB);
    pinionB.position.set(0, -(rpS + rpP), 40);
    pinionB.add(gear(S.gear.pinionTeeth, mod, 4, MAT.gold, null, 1.6));
    pivotX2.add(pinionB);
    pivotX2.add(box(12, 23, 22, MAT.black, 0, -(rpS + rpP) - 5.5, 53));
    pivotX2.add(box(24, 4, 4, MAT.black, 0, -(rpS + rpP) + 4, 53));
    pivotX2.add(strut([12, -2, 30], [6, -(rpS + rpP) + 4, 50], 1.8, MAT.printDk));
    g.add(pivotX2);
    parts.add('gear36t2', g, {
      name: 'gear36t2 + axis-2 servo', category: 'actuation', cad: 'gear36t2:1', explode: [0, -110, 110],
      desc: 'Second 36T/18T stage. The sector is printed into the inner collar; the servo rides on the outer ring (cable service loop required).',
    });
  }

  // ---------------- propulsion: coaxial contra-rotating brushless pair on the gimbal ----------------
  // Motor A (top) pushes prop A down, motor B (bottom) pushes prop B down from below; props sit 14 mm apart.
  const motorPivot = new THREE.Group();
  let propUp, propDn;
  {
    const g = new THREE.Group();
    motorPivot.position.set(0, gy, 0);
    const rel = (y) => y - gy;
    const PR = 114;                                            // 9 inch props, radius in mm
    // mount tube through the inner collar and the upper motor plate
    motorPivot.add(cyl(21, 21, 58, MAT.carbon, 40, 0, rel(152), 0));
    motorPivot.add(cyl(26, 26, 4, MAT.printDk, 40, 0, rel(122), 0));
    // motor A: bell, red stator ring, shaft down
    motorPivot.add(cyl(17, 17, 18, MAT.black, 40, 0, rel(112), 0));
    motorPivot.add(cyl(17.5, 17.5, 2, MAT.red, 40, 0, rel(104), 0));
    motorPivot.add(cyl(2, 2, 14, MAT.steel, 12, 0, rel(101), 0));
    // motor B: mirrored below, shaft up
    motorPivot.add(cyl(17, 17, 18, MAT.black, 40, 0, rel(68), 0));
    motorPivot.add(cyl(17.5, 17.5, 2, MAT.red, 40, 0, rel(76), 0));
    motorPivot.add(cyl(2, 2, 14, MAT.steel, 12, 0, rel(81), 0));
    motorPivot.add(cyl(26, 26, 4, MAT.printDk, 40, 0, rel(56), 0));
    // cage: three arms over prop A, three struts outside the prop disc, three arms under motor B, guard ring
    for (let i = 0; i < 3; i++) {
      const a = (30 + i * 120) * DEG, c = Math.cos(a), s = Math.sin(a);
      const rr = PR + 9;
      motorPivot.add(strut([c * 24, rel(123), s * 24], [c * rr, rel(123), s * rr], 2.6, MAT.printDk));
      motorPivot.add(strut([c * rr, rel(123), s * rr], [c * rr, rel(56), s * rr], 2.6, MAT.printDk));
      motorPivot.add(strut([c * rr, rel(56), s * rr], [c * 24, rel(56), s * 24], 2.6, MAT.printDk));
    }
    const guard = torus(PR + 9, 1.8, MAT.printDk, 96);
    guard.position.y = rel(91);
    motorPivot.add(guard);
    // ESCs on the tube, motor wires
    for (const sx of [-1, 1]) {
      motorPivot.add(box(30, 7, 14, MAT.black, sx * 31, rel(150), 0));
      motorPivot.add(box(18, 1.2, 10, MAT.pcb, sx * 31, rel(154.5), 0));
    }
    const wire = (pts, col) => motorPivot.add(tubeAlong(pts.map(([x, y, z]) => [x, rel(y), z]), 0.9, new THREE.MeshStandardMaterial({ color: col, roughness: 0.6 })));
    wire([[15, 146, 6], [20, 124, 12], [14, 114, 10]], 0x2a6ee8);
    wire([[-15, 146, 6], [-24, 120, 24], [-30, 90, 30], [-20, 70, 14]], 0xe8b400);
    // props: two blades each, opposite pitch
    const makeProp = (y, col, dir) => {
      const p = new THREE.Group();
      p.position.y = rel(y);
      for (let i = 0; i < 2; i++) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(PR - 6, 1.8, 17), col);
        b.castShadow = true;
        b.position.x = (PR / 2 + 3) * (i ? -1 : 1);
        b.rotation.x = (i ? -1 : 1) * dir * 14 * DEG;
        p.add(b);
      }
      p.add(cyl(7, 7, 6, MAT.black, 24));
      return p;
    };
    propUp = makeProp(98, MAT.orange, 1);
    propDn = makeProp(84, MAT.white, -1);
    motorPivot.add(propUp, propDn);
    g.add(motorPivot);
    parts.add('motor', g, {
      name: 'Coaxial brushless pair + props', category: 'propulsion', cad: '(motor assembly)', explode: [0, -210, 0],
      desc: 'Two 3110-class brushless motors (≈ 900 KV) back to back with 9″ contra-rotating props, so their reaction torques cancel. Mounted in the gimbal collar; differential throttle gives control about the vertical axis. 6S supply, two 40 A ESCs.',
    });
  }

  // ---------------- landing gear ----------------
  {
    const g = new THREE.Group();
    for (let i = 0; i < S.legs; i++) {
      const a = i * 90 * DEG;
      const dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
      const hinge = dir.clone().multiplyScalar(S.legHingeRadius).setY(S.legHingeY - 12);
      const foot = dir.clone().multiplyScalar(S.footRadius).setY(6);
      g.add(strut(hinge.toArray(), foot.toArray(), S.legRadius, MAT.print));
      g.add(cyl(14, 16, 6, MAT.rubber, 24, foot.x, 3, foot.z));
      g.add(sphere(5.5, MAT.steel, hinge.x, hinge.y, hinge.z));
      g.add(strut([hinge.x, hinge.y, hinge.z], [hinge.x + (foot.x - hinge.x) * 0.16, hinge.y + (foot.y - hinge.y) * 0.16, hinge.z + (foot.z - hinge.z) * 0.16], 6, MAT.printDk));
      // brace from fixed gimbal mount to leg mid
      const mid = hinge.clone().lerp(foot, 0.5);
      const mountPt = dir.clone().multiplyScalar(48).setY(gy);
      g.add(strut(mountPt.toArray(), mid.toArray(), 1.6, MAT.steel));
    }
    parts.add('landing-gear', g, {
      name: 'Landing gear (×4)', category: 'structure', cad: 'landing-gear:1', explode: [0, -150, 0],
      desc: 'Four splayed legs (Ø8, 34° from vertical, 510 mm footprint) with rubber pads and a brace to the gimbal mount.',
    });
  }

  // ---------------- test stand ----------------
  {
    const g = new THREE.Group();
    g.add(cyl(130, 130, 8, MAT.slate, 64, 0, 4, 0));
    g.add(cyl(11, 11, 34, MAT.steel, 20, 0, 25, 0));
    g.add(cyl(34, 34, 5, MAT.printDk, 40, 0, 40, 0)); // cradle plate
    g.add(box(48, 12, 18, MAT.black, 0, 12, 0));      // load cell
    parts.add('test-stand', g, {
      name: 'Test stand (thrust + load cell)', category: 'test', cad: 'test-stand:1', explode: [0, 0, 0],
      desc: 'Base with a centre column, load cell and cradle plate. Used for static thrust tests and gimbal sweeps with the rocket restrained.',
    });
  }

  // ---------------- runtime ----------------
  const state = { x: 0, z: 0, throttle: 0 };
  const qx = new THREE.Quaternion(), qz = new THREE.Quaternion();

  /** Set gimbal angles in degrees (x: axis 1, z: axis 2). Clamped to mechanical limits. */
  function setGimbal(xDeg, zDeg) {
    const lim = S.gimbalRangeDeg;
    const x = Math.max(-lim, Math.min(lim, xDeg)) * DEG;
    const z = Math.max(-lim, Math.min(lim, zDeg)) * DEG;
    state.x = x / DEG; state.z = z / DEG;
    outerPivot.rotation.x = x;
    innerPivotTVC.rotation.z = z;
    qx.setFromAxisAngle(new THREE.Vector3(1, 0, 0), x);
    qz.setFromAxisAngle(new THREE.Vector3(0, 0, 1), z);
    motorPivot.quaternion.copy(qx).multiply(qz);
    sectorA.rotation.x = x;
    pinionA.rotation.x = -x * GEAR_RATIO;
    pivotX2.rotation.x = x;
    sectorB.rotation.z = z;
    pinionB.rotation.z = -z * GEAR_RATIO;
    return { servo1Deg: -state.x * GEAR_RATIO, servo2Deg: -state.z * GEAR_RATIO };
  }
  /** Throttle 0..1 (visual only): spins the two props in opposite directions. */
  function setThrottle(t) { state.throttle = t; }
  function update(dt) {
    propUp.rotation.y += dt * state.throttle * 70;
    propDn.rotation.y -= dt * state.throttle * 70;
  }
  setGimbal(0, 0);

  return { root, parts, state, setGimbal, setThrottle, update, spec: S, id: 'rocket' };
}
