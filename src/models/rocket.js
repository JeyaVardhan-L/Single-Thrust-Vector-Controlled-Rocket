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
      desc: 'Four Ø6 mm carbon-fibre rods, 425 mm, capped at both ends. They carry the stack and the thrust load from the gimbal mount.',
    });
  }

  // ---------------- stack: telemetry frame (top) ----------------
  {
    const y = S.telemetryFrameY, top = y + T / 2;
    const g = new THREE.Group();
    g.add(stackPlate(y));
    for (const [x, z] of [[-34, 22], [34, 22], [-34, -22]]) standoff(g, x, top, z, 6);
    // LoRa module with shield can and SMA connector
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
      desc: 'Top plate: LoRa radio with SMA, GPS puck, 90 mm whip antenna, buzzer and three status LEDs. Highest point for the best RF and GPS view.',
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
    // pyro screw terminals + JST servo connectors
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
      desc: 'Carrier board on brass standoffs: Teensy 4.1 with microSD, IMU and baro boards, servo JST ports, pyro terminals, regulator, fuse, RBF pin and arm switch. The IMU sits on the stack axis.',
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
      desc: 'Diamond plate (rotated 45°) whose four corners carry the leg hinge lugs; the rods pass through bosses on its edges. Also the upper guide for the motor tube.',
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
    g.add(cyl(42, 42, 1.6, MAT.alu, 48, 0, gy - 44, 0));   // heat-shield disc under the gimbal
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
    // Inner collar (rotates about Z) carrying the motor tube
    innerPivotTVC.add(cyl(19, 19, 26, MAT.printDk, 40));
    const pinZ = cyl(2.4, 2.4, 82, MAT.steel, 14); pinZ.rotation.x = PI / 2; innerPivotTVC.add(pinZ);
    outerPivot.add(innerPivotTVC);
    g.add(outerPivot);
    parts.add('tvc', g, {
      name: 'TVC gimbal (mount + rings)', category: 'actuation', cad: 'tvc:1', explode: [0, -110, 0],
      desc: 'Two-axis gimbal. Fixed square mount on the rods, outer ring about X, inner collar about Z. Collar grips the motor tube.',
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
      desc: '36-tooth gear sector on the outer ring pin, driven by an 18-tooth pinion on the servo (2:1). Servo travel is 2× gimbal travel.',
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
      desc: 'Second 36T/18T stage. Servo rides on the outer ring (cable service loop required) and drives the inner collar about Z.',
    });
  }

  // ---------------- motor ----------------
  const motorPivot = new THREE.Group();
  let flame;
  {
    const g = new THREE.Group();
    motorPivot.position.set(0, gy, 0);
    const t = S.motorTube;
    const yc = t.y0 + t.length / 2 - gy;
    motorPivot.add(cyl(t.od / 2, t.od / 2, t.length, MAT.tube, 40, 0, yc, 0));
    const caseR = t.id / 2 - 0.2;
    motorPivot.add(cyl(caseR, caseR, 22, MAT.alu, 40, 0, t.y0 - gy - 4, 0));       // visible motor case end
    motorPivot.add(cyl(caseR - 4, caseR, 10, MAT.black, 40, 0, t.y0 - gy - 18, 0)); // nozzle
    motorPivot.add(cyl(t.od / 2 + 3, t.od / 2 + 3, 5, MAT.steel, 40, 0, t.y0 + 4 - gy, 0)); // retainer
    flame = new THREE.Mesh(
      new THREE.ConeGeometry(16, 150, 20, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xff8a2a, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    flame.rotation.x = PI;
    flame.position.set(0, t.y0 - gy - 18 - 75, 0);
    flame.visible = false;
    motorPivot.add(flame);
    g.add(motorPivot);
    parts.add('motor', g, {
      name: 'Motor tube + 29 mm solid motor', category: 'propulsion', cad: '(motor tube and motor)', explode: [0, -230, 0],
      desc: 'Certified 29 mm composite reload in a 32 mm G10/phenolic tube clamped by the gimbal collar. See docs/design-choices.md.',
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
      desc: 'Four splayed legs (Ø8, 34° from vertical, 470 mm footprint) with rubber pads and a brace to the gimbal mount.',
    });
  }

  // ---------------- test stand ----------------
  {
    const g = new THREE.Group();
    g.add(cyl(130, 130, 8, MAT.slate, 64, 0, 4, 0));
    g.add(cyl(11, 11, 34, MAT.steel, 20, 0, 25, 0));
    g.add(cyl(46, 8, 14, MAT.printDk, 32, 0, 48, 0)); // flame deflector cone
    g.add(box(48, 12, 18, MAT.black, 0, 12, 0));      // load cell
    parts.add('test-stand', g, {
      name: 'Test stand (thrust + deflector)', category: 'test', cad: 'test-stand:1', explode: [0, 0, 0],
      desc: 'Steel/aluminium base with a flame deflector and load cell. Used for static fires and gimbal sweeps with the rocket restrained.',
    });
  }

  // ---------------- runtime ----------------
  const state = { x: 0, z: 0, flame: false };
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
  function setFlame(on) { state.flame = on; flame.visible = on; }
  function update(dt, t) {
    if (state.flame) {
      const k = 1 + 0.12 * Math.sin(t * 60) + 0.06 * Math.sin(t * 131);
      flame.scale.set(1, k, 1);
    }
  }
  setGimbal(0, 0);

  return { root, parts, state, setGimbal, setFlame, update, spec: S, id: 'rocket' };
}
