// The shared tables and helpers every chapter of "Mended with Gold" writes into. Each chapter module
// (src/ch*.js) adds its camera keys, ground, cut-outs, hooks, light and weather here; src/film.js
// assembles them into the film. Times come from src/timeline.js (generated from film/film.json).
import { rng, clamp, spring, fbm, hash, sramp, lerp, DEG } from './util.js';
import { put } from './paper.js';
import { EV } from './timeline.js';

export const ev = (k, d) => EV[k] ?? d;
export const evi = (k, i, d) => (Array.isArray(EV[k]) ? EV[k][i] : undefined) ?? d;

// ---- cut-outs and chapter hooks
export const E = [];
export const add = (kind, layer, a, o = {}) => { const e = { kind, layer, a, ...o }; E.push(e); return e; };
export const PS = 1.3, P2 = 1.2;
export const R = rng(5);
export function grassRun(a0, a1, step, layer, o = {}) { for (let a = a0; a < a1; a += step * (0.7 + R() * 0.8)) { if (o.skip && o.skip(a)) continue; add('grass', layer, a, { v: (R() * 6) | 0, z: R() < 0.5 ? 1 : 3, flip: R() < 0.5, scale: (o.s || 1) * (0.8 + R() * 0.5), loud: 0.25, ...(o.e || {}) }); } }
export const HOOK = { lights: [], sky: [], ground: [], over: [] };
export const hook = (o) => { for (const k in o) HOOK[k].push(o[k]); };

// ---- timing helpers
// Drop-in for things on threads: falls from above, bounces, settles; and leaves again at t1.
export const drop = (t, t0, t1 = 1e9) => clamp(spring(t - t0, 5.5, 0.42), 0, 1.4) - (t > t1 ? spring(t - t1, 4, 0.7) * 1.4 : 0);
export const near = (a, c, w = 70) => Math.abs(a - c) < w;
export const flick = (t, s) => 0.84 + 0.16 * fbm(t * 7.3 + s, 60) + 0.05 * Math.sin(t * 31 + s);
export const win = (t, t0, t1, e0 = 0.6, e1 = 0.8) => sramp(t, t0, t0 + e0) * (1 - sramp(t, t1 - e1, t1));

// ---- the story-wide tables
export const CAM = [];            // [t, angle at the top of the screen]
export const ZONES = [];          // [a0, a1, [r, g, b]] ground paint
export const SEAS = [];           // [a0, a1] water
export const BUMPS = { far: [], mid: [], main: [] }; // [a0, a1, height, edge, roughness] hills on each layer
export const SKY = [], AMB = [], GRADE = [], MOTE = []; // base light keys [t, value]
export const ERAS = [];           // [t0, t1, LOOK(...)] the light of each age, laid over the base
export const WX = [];             // [kind, t0, t1, colour, amount] weather
export const NIGHTS = [], SUNS = [], ZOOM = [], FLOCKS = [], PAPER_SUN = [], MILKY = [];
export const SEAMS = [];          // kintsugi: cracks in the ground that open when the country breaks and fill with gold when it mends
export const hx = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
export const LOOK = (sky, amb, grade, extra = {}) => ({ sky: sky.map(hx), amb, grade, ...extra });
export const W_ = [255, 252, 244];
export const PAL = {
  NIGHT: ['#0a102b', '#11193c', '#1a2650', '#2e3a66'], DUSK: ['#141b3c', '#27294f', '#4f3d63', '#8a5a62'],
  DAWN: ['#3a4a7a', '#9a8aa8', '#f0b88a', '#f8d8a8'], DAY: ['#7aa4cc', '#a8c4d8', '#e2e6e0', '#f0e8d0'],
  SUNSET: ['#34406c', '#80628a', '#dc8c62', '#f6b76a'],
};

// A card hung on two threads, drawn by fn(g) in sprite units: a slab of clay, a sheet of kana, a tea bowl.
export function card(st, g, x, y, s, swing, fn, alpha = 1, spread = 120) {
  const u = st.eu;
  g.save(); g.globalAlpha = alpha; g.translate(x, y); g.rotate(swing);
  g.strokeStyle = 'rgba(200,190,175,0.32)'; g.lineWidth = Math.max(1, 0.6 * u);
  for (const dx of [-spread, spread]) { g.beginPath(); g.moveTo(dx * u * s, -40 * u * s); g.lineTo(dx * u * s - Math.sin(swing) * (y + 40), -y - 40); g.stroke(); }
  g.scale(u * s, u * s); fn(g);
  g.restore(); g.globalAlpha = 1;
}
// a sprite at a point in sprite units
export const spr = (g, sp, x, y, rot = 0, sc = 1, sh = 0.2) => { g.save(); g.translate(x, y); if (rot) g.rotate(rot); if (sc !== 1) g.scale(sc, sc); put(g, sp, sh, 3, 4); g.restore(); };
export const por = (st) => (st.aspectK > 0.4 ? 0 : 1);
export { DEG, hash, lerp };

// A close-up card that rises from the bottom of the screen over a darkened veil, with the scene's own
// light behind it (warm from below, a few embers), and sinks away again at t1. fn(g, k) draws it in card
// units, where 270 units fill about 60% of the shorter side; k is how far it has come up.
export function closeUp(st, g, t, t0, t1, fn, o = {}) {
  if (t < t0 - 0.2 || t > t1 + 1.6) return 0;
  const { W, H } = st, up = clamp(spring(t - t0, 5.2, 0.55), 0, 1.3), out = sramp(t, t1, t1 + 1.1), veil = clamp(up) * (1 - out);
  g.fillStyle = `rgba(${o.dark || '10,6,4'},${(o.veil ?? 0.5) * veil})`; g.fillRect(0, 0, W, H);
  const [lr, lg, lb] = o.light || [255, 140, 60], m = Math.min(W, H), f = 0.85 + 0.15 * fbm(t * 5, 21);
  g.save(); g.globalCompositeOperation = 'lighter';
  const gr = g.createRadialGradient(W * 0.5, H * 1.08, 0, W * 0.5, H * 1.08, H * 0.85); gr.addColorStop(0, `rgba(${lr},${lg},${lb},${(o.glow ?? 0.36) * veil * f})`); gr.addColorStop(1, `rgba(${lr},${lg},${lb},0)`);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  if (o.embers !== false) for (let i = 0; i < 36; i++) {
    const ph = (t * (0.06 + hash(i * 3) * 0.06) + hash(i * 7)) % 1, x = W * (0.5 + (hash(i * 5) - 0.5) * 0.9) + Math.sin(t * 1.3 + i) * m * 0.02, y = H * (1.04 - ph * 1.1);
    st.stamp(g, st.dot(lr, Math.min(255, lg + 20), lb, '255,230,170'), x, y, m * 0.006 * (1 - ph * 0.5), veil * (1 - ph) * Math.min(1, ph * 8) * (0.6 + 0.4 * Math.sin(t * 9 + i)));
  }
  g.restore();
  const base = Math.min(W * 0.62, H * 0.56) / 270 * (o.scale || 1), wide = W > H;
  const cx = W * (o.x ?? 0.5), cy = H * (wide ? (o.y ?? 0.44) : (o.yp ?? o.y ?? 0.42));
  g.save(); g.translate(cx, cy + (1 - Math.min(1, up)) * H * 0.9 + out * H * 0.9); g.rotate((1 - Math.min(1, up)) * 0.25 - 0.03 + Math.sin(t * 0.5) * 0.008); g.scale(base, base);
  fn(g, clamp(up) * (1 - out));
  g.restore();
  return veil;
}
