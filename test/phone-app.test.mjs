// The phone app (firmware/monocopter/web/control.html) must agree with the firmware core: the same vane mixer, the same wheel -> vane mapping.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { mixMonocopter } from '../src/sim/mixer.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'firmware/monocopter/web/control.html'), 'utf8').replace(/\r\n/g, '\n');

/** Pull the pure functions out of the page's script and run them in a sandbox. */
function loadPage() {
  const script = html.match(/<script>\n'use strict';([\s\S]*?)<\/script>/)[1];
  const pick = (start, end) => script.slice(script.indexOf(start), script.indexOf(end));
  const code = `const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v)); const HOVER = 0.45;
    ${pick('function mixMono', '/* ---- direction wheel')}
    ${pick('const CFG =', '/* ---- state ---- */')}
    ({ mixMono, mixWheel, CFG })`;
  return vm.runInNewContext(code);
}

const INPUTS = [[0, 1, 0, 1], [0, -1, 0, 1], [1, 0, 0, 1], [-1, 0, 0, 1], [0.6, 0.8, 0, 1], [3, 4, 0, 1], [0.3, 0.2, 0.5, 0.8], [0, 0, 1, 1.3], [0.02, 0.02, 0, 1], [0.5, -0.5, -0.4, 0.7]];

test('phone app: vane mixer is the one in src/sim/mixer.js', () => {
  const page = loadPage();
  for (const [r, p, y] of [[0.3, -0.2, 0.1], [1, 1, 1], [-0.5, 0.2, 0], [0, 0, -0.7]]) {
    const a = page.mixMono(r, p, y), b = mixMonocopter({ roll: r, pitch: p, yaw: y });
    a.forEach((v, i) => assert.ok(Math.abs(v - b[i]) < 1e-9, `${[r, p, y]} vane ${i}`));
  }
});

test('phone app: wheel -> vane mapping matches the C++ firmware core', (t) => {
  const cxx = ['g++', 'clang++'].find((c) => spawnSync(c, ['--version']).status === 0);
  if (!cxx) { t.skip('no C++ compiler'); return; }
  const dir = mkdtempSync(join(tmpdir(), 'mc1-'));
  const exe = join(dir, process.platform === 'win32' ? 'dump.exe' : 'dump');
  const b = spawnSync(cxx, ['-std=c++17', '-I', join(root, 'firmware/lib/tvc_core'), join(root, 'firmware/test/phone_dump.cpp'), '-o', exe]);
  assert.equal(b.status, 0, String(b.stderr));
  const lines = spawnSync(exe, [], { encoding: 'utf8' }).stdout.trim().split('\n');
  const page = loadPage();
  assert.equal(lines.length, INPUTS.length);
  INPUTS.forEach(([x, y, yaw, sched], k) => {
    const c = lines[k].split(' ').map(Number), j = page.mixWheel(x, y, yaw, sched, 0, 0);
    j.forEach((v, i) => assert.ok(Math.abs(v - c[i]) < 1e-5, `input ${k} vane ${i}: page ${v} firmware ${c[i]}`));
  });
});

test('phone app: web_ui.h embeds exactly this page', () => {
  const h = readFileSync(join(root, 'firmware/monocopter/include/web_ui.h'), 'utf8').replace(/\r\n/g, '\n');
  assert.ok(h.includes(html.replace(/\r\n/g, '\n')), 'run: node scripts/gen-webui.mjs');
});

test('phone app: protocol fields in the page are the ones the firmware parses', () => {
  const cpp = readFileSync(join(root, 'firmware/monocopter/src/main.cpp'), 'utf8');
  for (const k of ['a', 'k', 't', 'l', 'x', 'y', 'w', 'r', 'p', 'n']) {
    assert.ok(cpp.includes(`iarg("${k}"`), `firmware reads ${k}`);
    assert.ok(new RegExp(`[?&\`]${k}=`).test(html) || html.includes(`&${k}=`) || html.includes(`\`a=`), `page sends ${k}`);
  }
});
