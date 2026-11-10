// Renders the three.js models headlessly and writes PNGs into assets/screenshots/.
// Needs Chrome/Chromium/Edge: set CHROME_PATH if it is not found automatically.
// Usage: npm run screenshots
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { startServer } from './serve.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'assets', 'screenshots');
fs.mkdirSync(out, { recursive: true });

const candidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);
const executablePath = candidates.find((p) => fs.existsSync(p));
if (!executablePath) { console.error('No Chrome found. Set CHROME_PATH.'); process.exit(1); }

const shots = [
  { file: 'rocket-hero.png',        url: 'web/rocket.html?shot&pose&spin',             w: 1400, h: 1100, cam: '660,440,760,0,265,0' },
  { file: 'rocket-exploded.png',    url: 'web/rocket.html?shot&explode=0.8',        w: 1400, h: 1100, cam: '880,380,1000,0,230,0' },
  { file: 'rocket-gimbal.png',      url: 'web/rocket.html?shot&pose&select=tvc',    w: 1400, h: 1100, cam: '260,260,300,0,150,0' },
  { file: 'monocopter-hero.png',    url: 'web/monocopter.html?shot&pose',           w: 1400, h: 1100, cam: '420,330,470,0,130,0' },
  { file: 'monocopter-exploded.png',url: 'web/monocopter.html?shot&explode=1',      w: 1400, h: 1100, cam: '620,380,700,0,150,0' },
  { file: 'ui-rocket.png',          url: 'web/rocket.html?pose&select=tvc',         w: 1600, h: 900 },
  { file: 'ui-monocopter.png',      url: 'web/monocopter.html?pose&select=vanes',   w: 1600, h: 900 },
  { file: 'ui-assembly.png',        url: 'web/assembly.html?model=rocket&step=4',   w: 1600, h: 900 },
  { file: 'ui-assembly-monocopter.png', url: 'web/assembly.html?model=monocopter&step=3', w: 1600, h: 900 },
  { file: 'ui-wiring.png',          url: 'web/wiring.html?model=rocket',            w: 1400, h: 1000 },
  { file: 'ui-sizing.png',          url: 'web/sizing.html?model=rocket',            w: 1400, h: 1000 },
  { file: 'ui-bom.png',             url: 'web/bom.html?model=rocket',               w: 1400, h: 1000 },
  { file: 'ui-index.png',           url: 'index.html',                              w: 1400, h: 1300 },
  { file: 'ui-pid.png',             url: 'web/pid.html',                            w: 1400, h: 1000 },
  { file: 'ui-gimbal.png',          url: 'web/gimbal.html',                         w: 1400, h: 1000 },
];

const only = process.argv.slice(2);
const { server, port } = await startServer(0);
const browser = await puppeteer.launch({
  executablePath, headless: 'new',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
try {
  for (const s of shots) {
    if (only.length && !only.some((o) => s.file.includes(o))) continue;
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.setViewport({ width: s.w, height: s.h, deviceScaleFactor: 1 });
    const url = `http://localhost:${server.address().port}/${s.url}` + (s.cam ? `&cam=${s.cam}` : '');
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.__ready === true', { timeout: 30000 }).catch(() => errors.push('timeout waiting for __ready'));
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: path.join(out, s.file) });
    console.log(errors.length ? `! ${s.file}: ${errors.join(' | ')}` : `ok ${s.file}`);
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}
