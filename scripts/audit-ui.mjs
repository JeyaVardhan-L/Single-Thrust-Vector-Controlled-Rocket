// UI audit: loads every page in headless Chrome, reports console errors, failed requests and text with poor contrast.
// Usage: npm run audit
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';
import { startServer } from './serve.mjs';

const candidates = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].filter(Boolean);
const executablePath = candidates.find((p) => fs.existsSync(p));
if (!executablePath) { console.error('No Chrome found. Set CHROME_PATH.'); process.exit(2); }

const pages = [
  'index.html', 'web/rocket.html', 'web/rocket.html?select=tvc', 'web/monocopter.html', 'web/monocopter.html?select=vanes',
  'web/assembly.html?model=rocket&step=4', 'web/assembly.html?model=monocopter&step=3', 'web/pid.html', 'web/pid.html?model=monocopter',
  'web/gimbal.html', 'web/sizing.html', 'web/sizing.html?model=monocopter', 'web/bom.html?model=rocket', 'web/parts.html', 'web/bom.html?model=monocopter',
  'web/wiring.html', 'web/wiring.html?model=rocket', 'web/doc.html?p=docs/README.md', 'web/doc.html?p=docs/phase2-rocket/03-build-guide.md',
  'web/doc.html?p=docs/safety.md',
];

const MIN = 3.0;   // below this the text is effectively unreadable
const check = () => {
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return [0, 0, 0, 0]; const v = m[1].split(',').map((x) => parseFloat(x)); return [v[0], v[1], v[2], v.length > 3 ? v[3] : 1]; };
  const lum = ([r, g, b]) => { const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const blend = (top, bot) => [0, 1, 2].map((i) => top[i] * top[3] + bot[i] * (1 - top[3]));
  const bgOf = (el) => {
    const layers = [];
    for (let e = el; e; e = e.parentElement) {
      const c = parse(getComputedStyle(e).backgroundColor);
      if (c[3] > 0) layers.push(c);
      if (c[3] >= 1) break;
    }
    let base = [247, 246, 242];
    for (let i = layers.length - 1; i >= 0; i--) base = blend(layers[i], base);
    return base;
  };
  const bad = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  while (walker.nextNode()) {
    const n = walker.currentNode;
    if (!n.textContent.trim()) continue;
    const el = n.parentElement;
    if (!el || seen.has(el)) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) === 0) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    if (el.closest('script, style, svg, canvas, option')) continue;
    if (el.closest('.halftone')) continue;   // gradient + halftone surface: checked by eye (chalk on violet / ember)
    seen.add(el);
    const fg = parse(cs.color);
    const bg = bgOf(el);
    const fgc = blend(fg, bg);
    const l1 = lum(fgc), l2 = lum(bg);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    if (ratio < 4.5) bad.push({ text: n.textContent.trim().slice(0, 40), ratio: +ratio.toFixed(2), fg: cs.color, bg: `rgb(${bg.map(Math.round)})`, tag: el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : '') });
  }
  return bad;
};

const { server, port } = await startServer(0);
const browser = await puppeteer.launch({ executablePath, headless: 'new', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let fails = 0, warns = 0;
try {
  for (const url of pages) {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push('js: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g|mermaid|ERR_(NAME|INTERNET|CONNECTION)|Failed to load resource: net::/.test(m.text())) errors.push('console: ' + m.text()); });
    page.on('response', (r) => { if (r.status() >= 400 && !/fonts\.g|cdn\.jsdelivr/.test(r.url())) errors.push(`http ${r.status()}: ${r.url()}`); });
    await page.setViewport({ width: 1500, height: 950 });
    await page.goto(`http://localhost:${port}/${url}`, { waitUntil: 'load', timeout: 60000 }).catch(() => errors.push('navigation timeout'));
    await page.waitForFunction('window.__ready === true', { timeout: 20000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 300));
    const bad = await page.evaluate(check);
    const hard = bad.filter((b) => b.ratio < MIN);
    const soft = bad.filter((b) => b.ratio >= MIN);
    fails += hard.length + errors.length; warns += soft.length;
    console.log(`${errors.length || hard.length ? 'FAIL' : 'ok  '} ${url}` + (soft.length ? `  (${soft.length} below 4.5:1)` : ''));
    errors.forEach((e) => console.log('   ' + e));
    hard.forEach((b) => console.log(`   unreadable ${b.ratio}:1 "${b.text}" ${b.tag} fg ${b.fg} on ${b.bg}`));
    if (process.env.VERBOSE) soft.forEach((b) => console.log(`   low ${b.ratio}:1 "${b.text}" ${b.tag} ${b.fg} on ${b.bg}`));
    await page.close();
  }
} finally { await browser.close(); server.close(); }
console.log(fails ? `\n${fails} problem(s)` : `\nall pages clean (${warns} text runs between 3:1 and 4.5:1)`);
process.exit(fails ? 1 : 0);
