// Run with: npm test   (Node >= 18, no dependencies)
import test from 'node:test';
import assert from 'node:assert/strict';
import { simulate, PRESETS } from '../src/sim/attitude.js';
import { mixMonocopter } from '../src/sim/mixer.js';
import { ROCKET, GEAR_RATIO } from '../src/data/spec.js';

test('rocket preset is stable, settles quickly and rejects a disturbance', () => {
  const r = simulate({ ...PRESETS.rocket });
  assert.equal(r.metrics.stable, true);
  assert.ok(r.metrics.settleTime < 1.0, `settle ${r.metrics.settleTime}`);
  assert.ok(r.metrics.overshootPct < 30, `overshoot ${r.metrics.overshootPct}`);
  assert.ok(r.metrics.peakDisturbanceDeg < 4, `disturbance ${r.metrics.peakDisturbanceDeg}`);
});

test('monocopter preset is stable and settles', () => {
  const r = simulate({ ...PRESETS.monocopter });
  assert.equal(r.metrics.stable, true);
  assert.ok(r.metrics.settleTime < 2.0, `settle ${r.metrics.settleTime}`);
  assert.ok(r.metrics.overshootPct < 40, `overshoot ${r.metrics.overshootPct}`);
});

test('excess gain with latency goes unstable (why you tune from low gains)', () => {
  const r = simulate({ ...PRESETS.rocket, pid: { kp: 3.0, ki: 0, kd: 0.0 }, delay: 0.03, duration: 3 });
  assert.equal(r.metrics.stable, false);
});

test('simulation is deterministic for a given seed', () => {
  const a = simulate({ ...PRESETS.rocket, seed: 7 });
  const b = simulate({ ...PRESETS.rocket, seed: 7 });
  assert.deepEqual(a.theta, b.theta);
});

test('mixer: pure roll command moves vanes 1 and 3 in opposite directions', () => {
  const [d1, d2, d3, d4] = mixMonocopter({ roll: 0.5 });
  assert.equal(d1, -0.5); assert.equal(d3, 0.5); assert.equal(d2, 0); assert.equal(d4, 0);
});

test('mixer: pure yaw command moves all four vanes the same way', () => {
  assert.deepEqual(mixMonocopter({ yaw: 0.3 }), [0.3, 0.3, 0.3, 0.3]);
});

test('mixer: saturation keeps the mix ratio and never exceeds 1', () => {
  const d = mixMonocopter({ roll: 1, pitch: 1, yaw: 1 });
  assert.ok(d.every((v) => Math.abs(v) <= 1 + 1e-12));
  const raw = [1 - 1, 1 - 1, 1 + 1, 1 + 1];
  assert.ok(Math.abs(d[2] / d[3] - raw[2] / raw[3]) < 1e-12);
});

test('spec: gimbal gear ratio is 2:1 and servo travel fits a standard servo', () => {
  assert.equal(GEAR_RATIO, 2);
  assert.ok(ROCKET.gimbalRangeDeg * GEAR_RATIO <= 30, 'servo travel +-14 deg is well inside +-60');
});
