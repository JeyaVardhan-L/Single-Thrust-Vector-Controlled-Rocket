// Single-axis attitude control simulation shared by the PID lab and the unit tests.
//
// Plant (rigid body about one axis, small angles):   theta'' = G * delta + d(t) - c * theta'
//   rocket     : delta = gimbal angle [rad],        G = T * L / I      (thrust x lever arm / inertia)
//   monocopter : delta = normalised vane command,   G = 2 * Fv * h / I (vane side force x height below CG / inertia)
// Actuator: first-order lag + slew-rate limit + position limit.
// Controller: PID with derivative on the gyro measurement, integrator clamp, fixed-rate loop and latency.

export function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const gauss = (rnd) => Math.sqrt(-2 * Math.log(rnd() || 1e-9)) * Math.cos(2 * Math.PI * rnd());
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const DEG = Math.PI / 180;

export const PRESETS = {
  rocket: {
    id: 'rocket', label: 'RK-1 rocket (gimbal angle command)',
    unit: 'rad', G: 183, damping: 0.0, umax: 7 * DEG,
    pid: { kp: 0.8, ki: 0.1, kd: 0.1 },
    act: { tau: 0.03, rate: 6.0 },
    delay: 0.008, loopHz: 500,
    noise: { gyro: 0.01, angle: 0.002 },
    step: 5 * DEG, disturb: { t0: 1.5, accel: 8, dur: 0.15 },
    note: 'F-class first-test motor: T = 30 N, L = 0.11 m (pivot to CG), I = 0.018 kg m^2, so G = T L / I = 183 rad/s^2 per rad (a G-class motor at 80 N gives 489). Gimbal limit 7 deg, rate 6 rad/s (about 344 deg/s).',
  },
  monocopter: {
    id: 'monocopter', label: 'MC-1 monocopter (normalised vane command)',
    unit: '', G: 9, damping: 0.2, umax: 1,
    pid: { kp: 2.8, ki: 0.8, kd: 0.78 },
    act: { tau: 0.025, rate: 24 },
    delay: 0.01, loopHz: 500,
    noise: { gyro: 0.01, angle: 0.003 },
    step: 6 * DEG, disturb: { t0: 1.5, accel: 1.0, dur: 0.3 },
    note: 'At hover the prop wash is about 10 m/s, so one vane makes roughly 0.13 N at full deflection. Two vanes at h = 85 mm below the CG give 0.022 N m; I = 0.003 kg m^2, so G is about 9 rad/s^2 per unit command (a design estimate: measure it at Gate 1).',
  },
};

export function simulate(cfg = {}) {
  const p = { ...PRESETS.rocket, ...cfg };
  p.pid = { ...PRESETS.rocket.pid, ...(cfg.pid || {}) };
  p.act = { ...PRESETS.rocket.act, ...(cfg.act || {}) };
  p.noise = { ...PRESETS.rocket.noise, ...(cfg.noise || {}) };
  p.disturb = { ...PRESETS.rocket.disturb, ...(cfg.disturb || {}) };
  const T = cfg.duration ?? 4;
  const dt = 0.001;
  const ctrlDt = 1 / p.loopHz;
  const rnd = mulberry32(cfg.seed ?? 1);
  const delaySteps = Math.max(0, Math.round(p.delay / ctrlDt));
  const queue = new Array(delaySteps).fill(0);

  let theta = cfg.theta0 ?? p.step, omega = 0, delta = 0, integ = 0, u = 0, nextCtrl = 0;
  const out = { t: [], theta: [], omega: [], u: [], delta: [], cmd: [] };
  const cmd = 0;
  let satSteps = 0, ctrlTicks = 0, maxRate = 0, prevDelta = 0;

  for (let k = 0; k * dt <= T; k++) {
    const t = k * dt;
    if (t >= nextCtrl) {
      nextCtrl += ctrlDt;
      ctrlTicks++;
      const thMeas = theta + gauss(rnd) * p.noise.angle;
      const gyro = omega + gauss(rnd) * p.noise.gyro;
      const e = cmd - thMeas;
      integ = clamp(integ + e * ctrlDt, -p.umax / Math.max(p.pid.ki, 1e-9) * 0.5, p.umax / Math.max(p.pid.ki, 1e-9) * 0.5);
      let raw = p.pid.kp * e + p.pid.ki * integ - p.pid.kd * gyro;
      const cl = clamp(raw, -p.umax, p.umax);
      if (cl !== raw) satSteps++;
      queue.push(cl);
      u = queue.shift();
    }
    // actuator
    let dd = (u - delta) / p.act.tau;
    dd = clamp(dd, -p.act.rate, p.act.rate);
    delta = clamp(delta + dd * dt, -p.umax, p.umax);
    maxRate = Math.max(maxRate, Math.abs((delta - prevDelta) / dt)); prevDelta = delta;
    // plant
    const d = t >= p.disturb.t0 && t < p.disturb.t0 + p.disturb.dur ? p.disturb.accel : 0;
    omega += (p.G * delta + d - p.damping * omega) * dt;
    theta += omega * dt;
    if (k % 4 === 0) {
      out.t.push(t); out.theta.push(theta); out.omega.push(omega); out.u.push(u); out.delta.push(delta); out.cmd.push(cmd);
    }
    if (!Number.isFinite(theta) || Math.abs(theta) > 3) { out.diverged = true; break; }
  }
  out.metrics = metrics(out, p);
  out.metrics.saturationPct = (100 * satSteps) / Math.max(1, ctrlTicks);
  out.metrics.peakActuatorRate = maxRate;
  return out;
}

export function metrics(out, p) {
  const { t, theta } = out;
  const th0 = theta[0];
  const tDist = p.disturb.t0;
  // response to the initial offset: settle time to within 2 % of the start offset, overshoot = opposite swing
  const band = Math.max(0.02 * Math.abs(th0), 0.002);
  let settle = null;
  let last = t.findIndex((x) => x >= tDist); if (last < 0) last = t.length; last -= 1;
  for (let i = last; i >= 0; i--) {
    if (Math.abs(theta[i]) > band) { settle = t[i]; break; }
  }
  if (settle === null) settle = 0;
  let overshoot = 0;
  for (let i = 0; i < t.length && t[i] < tDist; i++) overshoot = Math.max(overshoot, -Math.sign(th0) * theta[i]);
  const overshootPct = (100 * overshoot) / Math.abs(th0);
  let peakDist = 0;
  for (let i = 0; i < t.length; i++) if (t[i] >= tDist) peakDist = Math.max(peakDist, Math.abs(theta[i]));
  const tail = theta.slice(Math.floor(theta.length * 0.9));
  const finalErr = Math.max(...tail.map(Math.abs));
  return {
    settleTime: settle, overshootPct, peakDisturbanceDeg: peakDist / DEG, finalErrorDeg: finalErr / DEG,
    stable: !out.diverged && finalErr < 0.05,
  };
}
