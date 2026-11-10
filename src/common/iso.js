// Isometric line-drawing renderer: orthographic isometric camera, flat fills, ink outlines and crease lines.
// Used on the landing page to draw the models as technical illustrations.
import * as THREE from 'three';

const ISO_ELEVATION = Math.atan(1 / Math.SQRT2); // 35.264 deg: true isometric

const outlineMat = (ink, width) => new THREE.ShaderMaterial({
  uniforms: { uInk: { value: new THREE.Color(ink) }, uW: { value: width } },
  vertexShader: 'uniform float uW; void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normal * uW, 1.0); }',
  fragmentShader: 'uniform vec3 uInk; void main(){ gl_FragColor = vec4(uInk, 1.0); }',
  side: THREE.BackSide,
});

/**
 * @param container  element to fill with a canvas
 * @param model      object from buildRocket()/buildMonocopter() ({ root, parts })
 * @param opts       { ink, fill, accent, accentCats, sulfur, visible: [part ids], explode, azimuth, spin, zoom, outline, edgeAngle, target }
 */
export function createIsoStage(container, model, opts = {}) {
  const {
    ink = 0x000000, fill = 0xffffff, accent = 0x1925aa, sulfur = 0xd6d3cb,
    accentCats = ['actuation', 'propulsion'], sulfurCats = ['power'],
    visible = null, hide = [], explode = 0, azimuth = 45, spin = 0, zoom = 1, outline = 1.1, edgeAngle = 28,
    bg = null, pad = 1.12, isStatic = false, fps = 24, maxDpr = 2,
  } = opts;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: !!opts.preserve });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
  if (bg === null) renderer.setClearColor(0x000000, 0); else renderer.setClearColor(bg, 1);
  container.appendChild(renderer.domElement);
  const scene = new THREE.Scene();

  // restyle the model: flat fills + outlines + crease edges
  const root = model.root;
  if (explode) model.parts.setExplode(explode);
  const fills = {
    base: new THREE.MeshBasicMaterial({ color: fill, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }),
    accent: new THREE.MeshBasicMaterial({ color: accent, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }),
    sulfur: new THREE.MeshBasicMaterial({ color: sulfur, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }),
  };
  const edgeMat = new THREE.LineBasicMaterial({ color: ink });
  const hull = outlineMat(ink, outline);
  for (const p of model.parts.list()) {
    if ((visible && !visible.includes(p.id)) || hide.includes(p.id)) { p.group.visible = false; continue; }
    const mat = accentCats.includes(p.category) ? fills.accent : sulfurCats.includes(p.category) ? fills.sulfur : fills.base;
    const meshes = [];
    p.group.traverse((o) => { if (o.isMesh) meshes.push(o); });
    for (const m of meshes) {
      const geo = m.geometry;
      const emissive = m.material && m.material.type === 'MeshBasicMaterial'; // LEDs
      m.material = emissive ? new THREE.MeshBasicMaterial({ color: fill }) : mat;
      m.castShadow = m.receiveShadow = false;
      if (geo.boundingSphere === null) geo.computeBoundingSphere();
      if (geo.boundingSphere.radius < 0.9) continue;
      const hullMesh = new THREE.Mesh(geo, hull);
      m.add(hullMesh);
      const lines = new THREE.LineSegments(new THREE.EdgesGeometry(geo, edgeAngle), edgeMat);
      m.add(lines);
    }
  }
  scene.add(root);

  // isometric camera framed on the visible model
  const box = new THREE.Box3().setFromObject(root);
  const centre = box.getCenter(new THREE.Vector3());
  const radius = box.getSize(new THREE.Vector3()).length() / 2;
  if (opts.target) centre.set(...opts.target);
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 20000);
  const dist = radius * 6 + 2000;
  const place = (azDeg) => {
    const a = azDeg * Math.PI / 180;
    cam.position.set(
      centre.x + dist * Math.cos(ISO_ELEVATION) * Math.sin(a),
      centre.y + dist * Math.sin(ISO_ELEVATION),
      centre.z + dist * Math.cos(ISO_ELEVATION) * Math.cos(a),
    );
    cam.lookAt(centre);
  };
  let az = azimuth;
  const fit = () => {
    const w = container.clientWidth || 600, h = container.clientHeight || 450;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = '100%'; renderer.domElement.style.height = '100%';
    const half = (radius * pad) / zoom;
    const aspect = w / h;
    cam.left = -half * Math.max(aspect, 1); cam.right = half * Math.max(aspect, 1);
    cam.top = half * Math.max(1 / aspect, 1); cam.bottom = -half * Math.max(1 / aspect, 1);
    cam.updateProjectionMatrix();
  };
  fit();
  place(az);

  let running = true, last = performance.now(), inView = true;
  const draw = () => renderer.render(scene, cam);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => { inView = es[0].isIntersecting; if (inView) draw(); }).observe(container);
  }
  window.addEventListener('resize', () => { fit(); draw(); });
  draw();
  const tick = (now) => {
    if (!running) return;
    requestAnimationFrame(tick);
    if (isStatic || !inView || document.hidden) return;
    const el = now - last;
    if (el < 1000 / fps) return;
    const dt = Math.min(el / 1000, 0.1); last = now;
    if (spin) { az += spin * dt; place(az); }
    if (model.update) model.update(dt, now / 1000);
    draw();
  };
  if (!isStatic) requestAnimationFrame(tick);
  return { renderer, camera: cam, stop: () => { running = false; }, render: () => renderer.render(scene, cam) };
}
