// Shared three.js stage: renderer, camera, lights, ground grid, orbit controls, resize + loop.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/RoomEnvironment.js';

export const COLORS = {
  bg: 0xe8e6e0,        // Bone
  grid: 0xdad7cf,
  gridMajor: 0xc6c3ba,
};
/** Colours for the current light/dark theme (web/theme.js), with the light palette as fallback. */
const themed = () => (typeof window !== 'undefined' && window.TVCTheme ? window.TVCTheme.three() : { bg: COLORS.bg, grid: COLORS.grid, gridMajor: COLORS.gridMajor });

export function createStage(container, opts = {}) {
  const {
    cameraPos = [700, 500, 800],
    target = [0, 200, 0],
    gridSize = 1200,
    shadows = true,
    preserveDrawingBuffer = false,
    fov = 36,
    bg = themed().bg,
  } = opts;

  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(bg);
  renderer.shadowMap.enabled = shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(bg, gridSize * 1.8, gridSize * 4.5);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.85;

  const camera = new THREE.PerspectiveCamera(fov, 1, 5, 12000);
  camera.position.set(...cameraPos);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(...target);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI * 0.985;
  controls.screenSpacePanning = true;
  controls.zoomToCursor = true;
  controls.panSpeed = 1.2;
  controls.minDistance = 25;
  controls.maxDistance = 3500;
  controls.update();

  // Lighting: soft hemisphere + key light with shadows + cool rim light.
  scene.add(new THREE.HemisphereLight(0xffffff, 0xcfcfca, 0.35));
  const key = new THREE.DirectionalLight(0xfff4e6, 2.2);
  key.position.set(500, 900, 400);
  key.castShadow = shadows;
  key.shadow.mapSize.set(4096, 4096);
  Object.assign(key.shadow.camera, { left: -600, right: 600, top: 800, bottom: -300, near: 100, far: 2500 });
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 1.5;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xdfe6ff, 0.8);
  rim.position.set(-600, 300, -500);
  scene.add(rim);

  // Ground: grid + shadow catcher.
  let grid = new THREE.GridHelper(gridSize, gridSize / 50, themed().gridMajor, themed().grid);
  grid.position.y = 0.2;
  scene.add(grid);
  const catcher = new THREE.Mesh(
    new THREE.PlaneGeometry(gridSize, gridSize),
    new THREE.ShadowMaterial({ opacity: 0.16 })
  );
  catcher.rotation.x = -Math.PI / 2;
  catcher.receiveShadow = true;
  scene.add(catcher);

  // Follow the light/dark switch: background, fog, grid and shadow strength.
  const applyTheme = () => {
    const c = themed(), dark = window.TVCTheme && window.TVCTheme.get() === 'dark';
    renderer.setClearColor(c.bg);
    scene.fog.color.setHex(c.bg);
    scene.remove(grid); grid.geometry.dispose(); grid.material.dispose();
    grid = new THREE.GridHelper(gridSize, gridSize / 50, c.gridMajor, c.grid);
    grid.position.y = 0.2;
    scene.add(grid);
    catcher.material.opacity = dark ? 0.5 : 0.16;
    api.grid = grid;
  };
  window.addEventListener('themechange', applyTheme);

  const resize = () => {
    const w = container.clientWidth || 800;
    const h = container.clientHeight || 600;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', resize);
  resize();

  const tickers = [];
  const clock = new THREE.Clock();
  let running = true;
  const frame = () => {
    if (!running) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    controls.update();
    for (const fn of tickers) fn(dt, clock.elapsedTime);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  /** World-space vertices of one object or a list of objects (hidden meshes skipped), thinned to about 6000 points. */
  const pointsOf = (objs) => {
    const list = Array.isArray(objs) ? objs : [objs], pts = [], v = new THREE.Vector3();
    for (const o of list) {
      o.updateWorldMatrix(true, true);
      o.traverse((m) => {
        if (!m.isMesh || !m.geometry || !m.visible) return;
        const pos = m.geometry.attributes.position; if (!pos) return;
        const step = Math.max(1, Math.floor(pos.count / 400));
        for (let i = 0; i < pos.count; i += step) pts.push(v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld).clone());
      });
    }
    return pts;
  };
  /**
   * Camera position + target that frame all the points in the current viewport (any aspect ratio), looking along `dir` (from the target to the camera).
   * `fill` is the fraction of the view the points may use (0.8 leaves a margin for the title and the side panels).
   */
  const fitPoints = (pts, dir = [1, 0.72, 1.1], fill = 0.8) => {
    const box = new THREE.Box3().setFromPoints(pts);
    const c = box.getCenter(new THREE.Vector3());
    const d = new THREE.Vector3(...dir).normalize();
    const cam = camera.clone();
    cam.aspect = camera.aspect; cam.updateProjectionMatrix();
    let dist = box.getSize(new THREE.Vector3()).length() * 1.5, centre = c.clone();
    for (let i = 0; i < 8; i++) {
      cam.position.copy(centre).addScaledVector(d, dist); cam.lookAt(centre); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
      let m = 0, x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for (const p of pts) { const q = p.clone().project(cam); m = Math.max(m, Math.abs(q.x), Math.abs(q.y)); x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); }
      // re-centre on the middle of what is actually on screen, then scale the distance to the wanted fill
      const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0), up = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
      const k = dist * Math.tan((camera.fov * Math.PI) / 360);
      centre.addScaledVector(right, ((x0 + x1) / 2) * k * camera.aspect).addScaledVector(up, ((y0 + y1) / 2) * k);
      dist *= Math.max(0.2, Math.max((x1 - x0) / 2, (y1 - y0) / 2) / fill);
      void m;
    }
    return { t: centre, pos: centre.clone().addScaledVector(d, dist) };
  };
  const fitObject = (objs, dir, fill) => fitPoints(pointsOf(objs), dir, fill);
  const fitBox = (box, dir, fill) => {
    const pts = []; for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) pts.push(new THREE.Vector3(x, y, z));
    return fitPoints(pts, dir, fill);
  };

  const api = {
    THREE, renderer, scene, camera, controls, grid, resize, fitBox, fitObject, fitPoints, pointsOf,
    onTick: (fn) => tickers.push(fn),
    stop: () => { running = false; },
    setView(pos, tgt) { camera.position.set(...pos); controls.target.set(...tgt); controls.update(); },
  };
  applyTheme();
  return api;
}
