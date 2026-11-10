// Shared three.js stage: renderer, camera, lights, ground grid, orbit controls, resize + loop.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/RoomEnvironment.js';

export const COLORS = {
  bg: 0xe8e6e0,        // Bone
  grid: 0xdad7cf,
  gridMajor: 0xc6c3ba,
};

export function createStage(container, opts = {}) {
  const {
    cameraPos = [700, 500, 800],
    target = [0, 200, 0],
    gridSize = 1200,
    shadows = true,
    preserveDrawingBuffer = false,
    fov = 36,
    bg = COLORS.bg,
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
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.minDistance = 120;
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
  const grid = new THREE.GridHelper(gridSize, gridSize / 50, COLORS.gridMajor, COLORS.grid);
  grid.position.y = 0.2;
  scene.add(grid);
  const catcher = new THREE.Mesh(
    new THREE.PlaneGeometry(gridSize, gridSize),
    new THREE.ShadowMaterial({ opacity: 0.16 })
  );
  catcher.rotation.x = -Math.PI / 2;
  catcher.receiveShadow = true;
  scene.add(catcher);

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

  return {
    THREE, renderer, scene, camera, controls, grid, resize,
    onTick: (fn) => tickers.push(fn),
    stop: () => { running = false; },
    setView(pos, tgt) { camera.position.set(...pos); controls.target.set(...tgt); controls.update(); },
  };
}
