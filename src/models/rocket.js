// Phase 2 model: RK-1 TVC rocket (stacked-frame airframe, gear-driven 2-axis gimbal, splayed legs).
// Part ids mirror the CAD browser tree: tvc, gear36t1, gear36t2, rods, landing-frame, battery-frame1,
// pcb-frame, battery-frame2, telemetry-frame, landing-gear, test-stand (+ motor).
import { THREE, MAT, Parts, box, cyl, torus, sphere, strut, gear, squareFrame } from '../common/kit.js';
import { ROCKET as S, GEAR_RATIO } from '../data/spec.js';

const DEG = Math.PI / 180;
const PI = Math.PI;

function frameWithCollars(y) {
  const g = new THREE.Group();
  const f = squareFrame(S.frameSize, 12, S.frameThickness, MAT.print);
  f.position.y = y;
  g.add(f);
  // rod collars at the four corners + gusset cross bars
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(box(16, S.frameThickness + 4, 16, MAT.printDk, sx * S.rodOffset, y, sz * S.rodOffset));
  }
  const c1 = box(S.frameSize * 1.28, 3, 6, MAT.print, 0, y, 0); c1.rotation.y = PI / 4; c1.scale.x = 0.62;
  const c2 = box(S.frameSize * 1.28, 3, 6, MAT.print, 0, y, 0); c2.rotation.y = -PI / 4; c2.scale.x = 0.62;
  g.add(c1, c2);
  return g;
}

export function buildRocket() {
  const root = new THREE.Group();
  root.name = 'rocket';
  const parts = new Parts(root);
  const gy = S.gimbalY;

  // ---------------- rods ----------------
  {
    const g = new THREE.Group();
    const len = S.rodTopY - S.rodBottomY;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      g.add(cyl(S.rodRadius, S.rodRadius, len, MAT.carbon, 14, sx * S.rodOffset, S.rodBottomY + len / 2, sz * S.rodOffset));
    }
    parts.add('rods', g, {
      name: 'Rods (×4)', category: 'structure', cad: 'rods:1', explode: [0, -25, 0],
      desc: 'Four Ø6 mm carbon-fibre rods, 490 mm. Carry the stack and the thrust load from the gimbal mount.',
    });
  }

  // ---------------- frames ----------------
  const batt = (w, h, d, x, y, z) => {
    const b = new THREE.Group();
    b.add(box(w, h, d, MAT.lipo, x, y, z));
    b.add(box(w - 6, 0.8, d - 6, MAT.black, x, y + h / 2 + 0.3, z));
    b.add(box(w + 2, 5, 8, MAT.black, x, y, z - 6));
    b.add(box(8, 5, 8, MAT.red, x + w / 2 + 4, y, z));
    return b;
  };

  // telemetry frame (top): LoRa radio, GPS, antenna
  {
    const g = new THREE.Group();
    g.add(frameWithCollars(S.telemetryFrameY));
    g.add(box(34, 2, 22, MAT.pcb, -18, S.telemetryFrameY + 5, 6));
    g.add(box(14, 3, 14, MAT.steel, -22, S.telemetryFrameY + 8, 6));
    g.add(cyl(17, 17, 6, MAT.white, 32, 36, S.telemetryFrameY + 7, 0));   // GPS puck
    g.add(cyl(0.9, 0.9, 85, MAT.black, 12, S.telemetryFrameY + 48, 6));   // whip antenna
    g.add(sphere(2.5, MAT.glow, 38, S.telemetryFrameY + 8, 0));
    parts.add('telemetry-frame', g, {
      name: 'Telemetry frame', category: 'avionics', cad: 'telemetry-frame:1', explode: [0, 290, 0],
      desc: 'Top frame: LoRa telemetry radio, GPS puck, whip antenna, status LED. Highest point = best RF and GPS view.',
    });
  }
  // battery frame 2 (servo battery B)
  {
    const g = new THREE.Group();
    g.add(frameWithCollars(S.battery2FrameY));
    g.add(batt(58, 18, 32, 0, S.battery2FrameY + 11, 0));
    parts.add('battery-frame2', g, {
      name: 'Battery frame 2 (servo pack B)', category: 'power', cad: 'battery-frame2:1', explode: [0, 210, 0],
      desc: '2S 850 mAh LiPo dedicated to the gimbal servos, so servo current spikes cannot brown out the flight computer.',
    });
  }
  // pcb frame
  {
    const g = new THREE.Group();
    g.add(frameWithCollars(S.pcbFrameY));
    g.add(box(84, 1.8, 54, MAT.pcb, 0, S.pcbFrameY + 4, 0));
    g.add(box(18, 3, 36, MAT.black, -8, S.pcbFrameY + 7, 0));        // Teensy 4.1
    g.add(box(8, 2, 8, MAT.black, 22, S.pcbFrameY + 6, -10));          // IMU
    g.add(box(8, 2, 8, MAT.black, 22, S.pcbFrameY + 6, 8));            // baro
    g.add(box(10, 6, 8, MAT.red, 34, S.pcbFrameY + 8, -19));           // pyro terminals
    g.add(box(10, 6, 8, MAT.red, 34, S.pcbFrameY + 8, 19));
    g.add(sphere(2, MAT.glow, -34, S.pcbFrameY + 6, 20));
    parts.add('pcb-frame', g, {
      name: 'PCB frame (flight computer)', category: 'avionics', cad: 'pcb-frame:1', explode: [0, 130, 0],
      desc: 'Flight computer board: Teensy 4.1, IMU, barometer, servo + pyro drivers, microSD logger. IMU sits near the stack centreline.',
    });
  }
  // battery frame 1 (avionics battery A)
  {
    const g = new THREE.Group();
    g.add(frameWithCollars(S.battery1FrameY));
    g.add(batt(58, 18, 32, 0, S.battery1FrameY + 11, 0));
    parts.add('battery-frame1', g, {
      name: 'Battery frame 1 (avionics pack A)', category: 'power', cad: 'battery-frame1:1', explode: [0, 50, 0],
      desc: '2S 850 mAh LiPo for the avionics rail. Low in the stack to keep the centre of gravity forward of the thrust line.',
    });
  }

  // landing frame: square frame + 4 hinge arms on the axes
  {
    const g = new THREE.Group();
    g.add(frameWithCollars(S.landingFrameY));
    for (let i = 0; i < 4; i++) {
      const a = i * 90 * DEG;
      const arm = box(S.legHingeRadius - 30, 6, 14, MAT.printDk);
      arm.position.set(Math.cos(a) * (S.legHingeRadius / 2 + 15), S.landingFrameY, Math.sin(a) * (S.legHingeRadius / 2 + 15));
      arm.rotation.y = -a;
      g.add(arm);
      const bracket = box(14, 30, 4, MAT.printDk);
      bracket.position.set(Math.cos(a) * S.legHingeRadius, S.landingFrameY - 12, Math.sin(a) * S.legHingeRadius);
      bracket.rotation.y = -a + PI / 2;
      g.add(bracket);
    }
    parts.add('landing-frame', g, {
      name: 'Landing frame', category: 'structure', cad: 'landing-frame:1', explode: [0, -35, 0],
      desc: 'Frame with four hinge arms for the landing legs; also the upper guide for the motor tube.',
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
      name: 'Motor tube + 29 mm solid motor', category: 'propulsion', cad: '(not in CAD yet)', explode: [0, -230, 0],
      desc: 'Baseline assumption: certified 29 mm composite reload in a 32 mm G10/phenolic tube clamped by the gimbal collar. See docs/open-decisions.md.',
    });
  }

  // ---------------- landing gear ----------------
  {
    const g = new THREE.Group();
    for (let i = 0; i < S.legs; i++) {
      const a = i * 90 * DEG;
      const dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
      const hinge = dir.clone().multiplyScalar(S.legHingeRadius).setY(S.legHingeY);
      const foot = dir.clone().multiplyScalar(S.footRadius).setY(6);
      g.add(strut(hinge.toArray(), foot.toArray(), S.legRadius, MAT.print));
      g.add(cyl(14, 16, 6, MAT.rubber, 24, foot.x, 3, foot.z));
      g.add(sphere(5, MAT.steel, hinge.x, hinge.y, hinge.z));
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
