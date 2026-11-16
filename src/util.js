// Small maths, colour and noise helpers shared by everything.
export const TAU = Math.PI * 2;
export const DEG = Math.PI / 180;
export const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
export const smoother = (t) => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };
export const ramp = (t, a, b) => clamp((t - a) / (b - a));
export const sramp = (t, a, b) => smooth((t - a) / (b - a));

export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hash(n) {
  let x = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}
export function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
// Smooth 1D value noise in [-1, 1].
export function noise(x, seed = 0) {
  const i = Math.floor(x), f = x - i;
  const a = hash(i + seed * 7919), b = hash(i + 1 + seed * 7919);
  return lerp(a, b, f * f * (3 - 2 * f)) * 2 - 1;
}
// Two octaves: organic drift for wind, flicker and sway.
export const fbm = (x, seed = 0) => noise(x, seed) * 0.65 + noise(x * 2.13 + 4.7, seed + 11) * 0.35;

// Underdamped spring step response: 0 -> 1 with overshoot and settle.
export function spring(tau, omega = 9, zeta = 0.38) {
  if (tau <= 0) return 0;
  const wd = omega * Math.sqrt(1 - zeta * zeta);
  const e = Math.exp(-zeta * omega * tau);
  return 1 - e * (Math.cos(wd * tau) + ((zeta * omega) / wd) * Math.sin(wd * tau));
}
export function springVel(tau, omega = 9, zeta = 0.38) {
  if (tau <= 0) return 0;
  const wd = omega * Math.sqrt(1 - zeta * zeta);
  return Math.exp(-zeta * omega * tau) * (omega * omega / wd) * Math.sin(wd * tau);
}

export function hex(c) {
  if (Array.isArray(c)) return c;
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
export const mix = (a, b, t) => { a = hex(a); b = hex(b); return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; };
export const shade = (c, k) => { c = hex(c); return k < 0 ? mix(c, [18, 10, 6], -k) : mix(c, [255, 246, 228], k); };

// Monotone cubic interpolation through [t, v] keys (no overshoot: the globe never turns backwards).
export function monotone(keys) {
  const n = keys.length, xs = keys.map(k => k[0]), ys = keys.map(k => k[1]);
  const d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) { const k = 3 / Math.sqrt(s); m[i] = k * a * d[i]; m[i + 1] = k * b * d[i]; }
  }
  return (x) => {
    if (x <= xs[0]) return ys[0] + m[0] * (x - xs[0]);
    if (x >= xs[n - 1]) return ys[n - 1] + m[n - 1] * (x - xs[n - 1]);
    let i = 0; while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], u = (x - xs[i]) / h, u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * ys[i] + (u3 - 2 * u2 + u) * h * m[i] + (-2 * u3 + 3 * u2) * ys[i + 1] + (u3 - u2) * h * m[i + 1];
  };
}
// Keyframed colours / numbers: keys = [[t, value], ...], smooth between.
export function track(keys) {
  keys = keys.map(([t, v]) => [t, typeof v === 'string' ? hex(v) : Array.isArray(v) && typeof v[0] === 'string' ? v.map(hex) : v]);
  return (t) => {
    if (t <= keys[0][0]) return keys[0][1];
    const last = keys[keys.length - 1];
    if (t >= last[0]) return last[1];
    let i = 0; while (t > keys[i + 1][0]) i++;
    const u = smooth((t - keys[i][0]) / (keys[i + 1][0] - keys[i][0]));
    const a = keys[i][1], b = keys[i + 1][1];
    if (typeof a === 'number') return lerp(a, b, u);
    if (typeof a[0] === 'number') return mix(a, b, u);
    return a.map((c, j) => mix(c, b[j], u)); // list of colours
  };
}
