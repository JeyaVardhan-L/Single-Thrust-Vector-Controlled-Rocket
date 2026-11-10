// Interactive model viewer used by web/rocket.html and web/monocopter.html.
// Features: part list, click-to-inspect, exploded view, x-ray, model-specific live controls.
import { createStage } from './stage.js';
import { buildRocket } from '../models/rocket.js';
import { buildMonocopter } from '../models/monocopter.js';
import { GEAR_RATIO } from '../data/spec.js';

const $ = (sel, el = document) => el.querySelector(sel);

export function mountViewer({ model: id, stageEl, leftEl, rightEl }) {
  const params = new URLSearchParams(location.search);
  const shot = params.has('shot');
  if (shot) document.body.classList.add('shot');

  const isRocket = id === 'rocket';
  const stage = createStage(stageEl, {
    cameraPos: isRocket ? [700, 470, 800] : [420, 330, 470],
    target: isRocket ? [0, 280, 0] : [0, 130, 0],
    gridSize: isRocket ? 1400 : 800,
    preserveDrawingBuffer: shot,
  });
  const m = isRocket ? buildRocket() : buildMonocopter();
  stage.scene.add(m.root);
  stage.onTick((dt, t) => m.update && m.update(dt, t));

  // ----- left: part list -----
  const list = m.parts.list();
  leftEl.innerHTML = `
    <h3>Parts <span style="font-weight:400;text-transform:none;letter-spacing:0">(click to inspect)</span></h3>
    <ul class="partlist" id="plist"></ul>
    <h3>View</h3>
    <div class="row"><label for="explode">Exploded view</label><output id="explodeO">0%</output></div>
    <div class="row full"><input id="explode" type="range" min="0" max="1" step="0.01" value="0"></div>
    <div class="btn-row">
      <button id="xray">X-ray others</button>
      <button id="spin">Turntable</button>
      <button id="reset">Reset camera</button>
    </div>`;
  const ul = $('#plist', leftEl);
  for (const p of list) {
    const li = document.createElement('li');
    li.dataset.id = p.id;
    li.innerHTML = `<input type="checkbox" checked title="show/hide"><span class="dot cat-${p.category}"></span><span>${p.name}</span>`;
    ul.appendChild(li);
  }

  // ----- right: info + controls -----
  rightEl.innerHTML = `
    <h3>Selected part</h3>
    <div class="info" id="info"><h4>Nothing selected</h4><div>Click a part in the list or in the 3D view.</div></div>
    <div id="controls"></div>`;
  const info = $('#info', rightEl);
  const controls = $('#controls', rightEl);

  let selected = null, xray = false, spin = false;
  function select(pid) {
    selected = pid;
    for (const p of list) m.parts.setHighlight(p.id, p.id === pid);
    ul.querySelectorAll('li').forEach((li) => li.classList.toggle('sel', li.dataset.id === pid));
    const p = pid && m.parts.get(pid);
    info.innerHTML = p
      ? `<h4>${p.name}</h4><div>${p.desc}</div><div class="meta">Category: ${p.category}${p.cad ? ` · CAD: <code>${p.cad}</code>` : ''} · id: <code>${p.id}</code></div>`
      : '<h4>Nothing selected</h4><div>Click a part in the list or in the 3D view.</div>';
    applyXray();
  }
  function applyXray() {
    for (const p of list) m.parts.setGhost(p.id, xray && selected && p.id !== selected);
  }
  ul.addEventListener('click', (e) => {
    const li = e.target.closest('li'); if (!li) return;
    if (e.target.tagName === 'INPUT') { m.parts.setVisible(li.dataset.id, e.target.checked); return; }
    select(selected === li.dataset.id ? null : li.dataset.id);
  });
  const ex = $('#explode', leftEl);
  ex.addEventListener('input', () => { m.parts.setExplode(+ex.value); $('#explodeO', leftEl).textContent = Math.round(ex.value * 100) + '%'; });
  $('#xray', leftEl).addEventListener('click', (e) => { xray = !xray; e.target.classList.toggle('on', xray); applyXray(); });
  $('#spin', leftEl).addEventListener('click', (e) => { spin = !spin; e.target.classList.toggle('on', spin); stage.controls.autoRotate = spin; stage.controls.autoRotateSpeed = 1.6; });
  const home = { pos: stage.camera.position.toArray(), tgt: stage.controls.target.toArray() };
  $('#reset', leftEl).addEventListener('click', () => stage.setView(home.pos, home.tgt));

  // click picking
  const ray = new stage.THREE.Raycaster(); const mouse = new stage.THREE.Vector2();
  let downAt = null;
  stage.renderer.domElement.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY]; });
  stage.renderer.domElement.addEventListener('pointerup', (e) => {
    if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 4) return;
    const r = stage.renderer.domElement.getBoundingClientRect();
    mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(mouse, stage.camera);
    const hit = ray.intersectObjects(m.root.children, true).find((h) => h.object.visible && h.object.userData.partId);
    select(hit ? hit.object.userData.partId : null);
  });

  // ----- model-specific controls -----
  const slider = (id, label, min, max, step, val, unit = '') =>
    `<div class="row"><label for="${id}">${label}</label><output id="${id}O">${val}${unit}</output></div>
     <div class="row full"><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${val}"></div>`;

  if (isRocket) {
    controls.innerHTML = `
      <h3>Gimbal (live)</h3>
      ${slider('gx', 'Axis 1 (about X)', -7, 7, 0.1, 0, '°')}
      ${slider('gz', 'Axis 2 (about Z)', -7, 7, 0.1, 0, '°')}
      <div class="kv"><span>Gear ratio</span><span>${GEAR_RATIO}:1 (36T / 18T)</span>
        <span>Servo 1 angle</span><span id="s1">0.0°</span>
        <span>Servo 2 angle</span><span id="s2">0.0°</span></div>
      ${slider('thr', 'Throttle (visual)', 0, 1, 0.01, 0)}
      <div class="btn-row"><button id="sweep">Circle sweep</button><button id="zero">Zero</button></div>
      <div class="note">The servo moves ${GEAR_RATIO}× the gimbal angle. Mechanical limit is ±7° per axis. The two props counter-rotate.</div>`;
    let sweep = false, ph = 0;
    const apply = () => {
      const r = m.setGimbal(+$('#gx').value, +$('#gz').value);
      $('#gxO').textContent = (+$('#gx').value).toFixed(1) + '°';
      $('#gzO').textContent = (+$('#gz').value).toFixed(1) + '°';
      $('#s1').textContent = r.servo1Deg.toFixed(1) + '°';
      $('#s2').textContent = r.servo2Deg.toFixed(1) + '°';
      m.setThrottle(+$('#thr').value);
      $('#thrO').textContent = (+$('#thr').value).toFixed(2);
    };
    controls.addEventListener('input', apply);
    $('#sweep').addEventListener('click', (e) => { sweep = !sweep; e.target.classList.toggle('on', sweep); });
    $('#zero').addEventListener('click', () => { $('#gx').value = 0; $('#gz').value = 0; $('#thr').value = 0; apply(); });
    stage.onTick((dt) => {
      if (!sweep) return;
      ph += dt * 1.8;
      $('#gx').value = (6 * Math.cos(ph)).toFixed(2);
      $('#gz').value = (6 * Math.sin(ph)).toFixed(2);
      apply();
    });
    if (params.has('pose')) { $('#gx').value = 4; $('#gz').value = -3; apply(); }
    if (params.has('spin')) { $('#thr').value = 0.5; apply(); }
  } else {
    controls.innerHTML = `
      <h3>Vane control (live)</h3>
      ${slider('roll', 'Roll command', -1, 1, 0.01, 0)}
      ${slider('pitch', 'Pitch command', -1, 1, 0.01, 0)}
      ${slider('yaw', 'Yaw command', -1, 1, 0.01, 0)}
      ${slider('thr', 'Throttle (visual)', 0, 1, 0.01, 0.35)}
      <h3>Vane deflections</h3>
      <div class="bars" id="bars"></div>
      <div class="btn-row"><button id="demo">Demo wobble</button><button id="zero">Zero</button></div>
      <div class="note">Roll = vanes 1/3 opposite, pitch = vanes 2/4 opposite, yaw = all four same direction. Mixer: <code>src/sim/mixer.js</code>.</div>`;
    const names = ['1 front', '2 right', '3 rear', '4 left'];
    $('#bars').innerHTML = names.map((n, i) => `<div class="bar"><span>${n}</span><i><s id="b${i}"></s></i><span id="bv${i}">0°</span></div>`).join('');
    const apply = () => {
      const d = m.setControl({ roll: +$('#roll').value, pitch: +$('#pitch').value, yaw: +$('#yaw').value });
      m.setThrottle(+$('#thr').value);
      ['roll', 'pitch', 'yaw', 'thr'].forEach((k) => { $('#' + k + 'O').textContent = (+$('#' + k).value).toFixed(2); });
      d.forEach((v, i) => {
        const s = $('#b' + i); const w = Math.abs(v) * 50;
        s.style.width = w + '%'; s.style.left = (v >= 0 ? 50 : 50 - w) + '%';
        $('#bv' + i).textContent = (v * m.spec.vaneMaxDeflectionDeg).toFixed(0) + '°';
      });
    };
    controls.addEventListener('input', apply);
    let demo = false, ph = 0;
    $('#demo').addEventListener('click', (e) => { demo = !demo; e.target.classList.toggle('on', demo); });
    $('#zero').addEventListener('click', () => { ['roll', 'pitch', 'yaw'].forEach((k) => { $('#' + k).value = 0; }); apply(); });
    stage.onTick((dt) => {
      if (!demo) return;
      ph += dt * 1.6;
      $('#roll').value = (0.7 * Math.sin(ph)).toFixed(2);
      $('#pitch').value = (0.7 * Math.cos(ph * 0.8)).toFixed(2);
      $('#yaw').value = (0.35 * Math.sin(ph * 0.5)).toFixed(2);
      apply();
    });
    apply();
    if (params.has('pose')) { $('#roll').value = 0.5; $('#pitch').value = -0.35; $('#yaw').value = 0.15; apply(); }
  }

  if (params.has('explode')) { ex.value = params.get('explode'); ex.dispatchEvent(new Event('input')); }
  if (params.get('select')) select(params.get('select'));
  if (params.has('cam')) { const c = params.get('cam').split(',').map(Number); stage.setView(c.slice(0, 3), c.slice(3, 6)); }
  // signal for screenshot automation
  let frames = 0; stage.onTick(() => { if (++frames === 8) window.__ready = true; });
  return { stage, model: m, select };
}
