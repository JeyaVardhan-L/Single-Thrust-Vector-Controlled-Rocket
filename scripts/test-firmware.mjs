// Compiles and runs the host-side firmware unit tests (firmware/test/host_tests.cpp).
// Needs g++ or clang++ on PATH. Usage: npm run test:firmware
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'tvc-fw-')), process.platform === 'win32' ? 'host_tests.exe' : 'host_tests');
const cxx = ['g++', 'clang++', 'c++'].find((c) => spawnSync(c, ['--version']).status === 0);
if (!cxx) { console.error('No C++ compiler found (g++/clang++).'); process.exit(2); }

const build = spawnSync(cxx, ['-std=c++17', '-O1', '-Wall', '-Wextra', '-I', path.join(root, 'firmware/lib/tvc_core'),
  path.join(root, 'firmware/test/host_tests.cpp'), '-o', out], { stdio: 'inherit' });
if (build.status !== 0) process.exit(build.status ?? 1);
const run = spawnSync(out, [], { stdio: 'inherit' });
process.exit(run.status ?? 1);
