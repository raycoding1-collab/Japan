// "Mended with Gold": the whole film. The chapters (src/ch*.js) lay out their own stretch of the globe,
// their cut-outs, moments and light through src/film_api.js; this file assembles them, and draws what
// runs through all of them: the ground, the sky, the light of each age, the weather, and the golden seams.
import { monotone, track, noise, fbm, smooth, sramp, clamp, spring, hash, rng, lerp, mix, shade, rgb, DEG } from './util.js';
import { put } from './paper.js';
import { KINDS } from './cutouts.js';
import './people.js';
import './kinds_nature.js';
import './kinds_built.js';
import './kinds_modern.js';
import './kinds_china.js';
import './kinds_modern_china.js';
import './kinds_japan.js';
import './kinds_modern_japan.js';
import { makeFx } from './sky_china.js';
import './sky_japan.js';
import { BlurSheet } from './engine.js';
import { DURATION } from './timeline.js';
import { E, HOOK, ev, CAM, ZONES, SEAS, BUMPS, SKY, AMB, GRADE, MOTE, ERAS, WX, NIGHTS, SUNS, ZOOM, FLOCKS, PAPER_SUN, MILKY, SEAMS, W_ } from './film_api.js';
import './ch01_jomon.js';
import './ch02_yayoi.js';
import './ch03_kofun.js';
import './ch04_asuka.js';
import './ch05_nara.js';
import './ch06_heian.js';
import './ch07_kamakura.js';
import './ch08_muromachi.js';
import './ch09_sengoku.js';
import './ch10_edo.js';
import './ch11_meiji.js';
import './ch12_war.js';
import './ch13_miracle.js';
import './ch14_anime.js';

const byT = (p, q) => p[0] - q[0];
const cam = monotone(CAM.sort(byT));

// ------------------------------------------------- paint and shape of land --
ZONES.sort(byT);
function zoneColor(a) {
  for (let i = 0; i < ZONES.length; i++) {
    const [a0, a1, c] = ZONES[i];
    if (a <= a1) { if (a >= a0 || i === 0) return c; const p = ZONES[i - 1]; return mix(p[2], c, smooth((a - p[1]) / (a0 - p[1]))); }
  }
  return ZONES[ZONES.length - 1][2];
}
const water = (a) => { let w = 0; for (const [a0, a1] of SEAS) w = Math.max(w, sramp(a, a0 - 2, a0 + 1) * (1 - sramp(a, a1 - 1, a1 + 2))); return w; };
const band = (a, a0, a1, e = 3) => sramp(a, a0 - e, a0 + e) * (1 - sramp(a, a1 - e, a1 + e));
const bumps = (list, a) => { let h = 0; for (const [a0, a1, ht, e, rough] of list) { const k = band(a, a0, a1, e); if (k > 0) h += k * (ht + Math.abs(noise(a * 0.45, a0)) * (rough || 0)); } return h; };
function ground(layer, a) {
  const c = zoneColor(a), w = water(a);
  if (layer === 'main') return c;
  if (layer === 'mid') return w > 0.5 ? mix(c, [70, 110, 140], 0.3) : mix(shade(c, 0.06), [196, 186, 172], 0.16);
  if (layer === 'far') return w > 0.5 ? [90, 120, 150] : mix(c, [150, 156, 166], 0.55);
  if (layer === 'front') return shade(c, w > 0.5 ? -0.25 : -0.32);
  return shade(c, -0.55);
}
const profile = {
  far: (a) => (1 - water(a)) * (noise(a * 0.07, 5) * 14 + noise(a * 0.31, 6) * 4 + 12) + bumps(BUMPS.far, a),
  mid: (a) => (1 - water(a)) * (noise(a * 0.33, 3) * 8 + noise(a * 0.1, 4) * 13) + bumps(BUMPS.mid, a) - water(a) * 6,
  main: (a) => (1 - water(a)) * (noise(a * 0.9, 1) * 1.6 + noise(a * 0.21, 2) * 3.5) + bumps(BUMPS.main, a) - water(a) * 4,
  front: (a) => noise(a * 0.5, 7) * 4 + noise(a * 0.13, 17) * 6,
  core: (a) => noise(a * 0.2, 8) * 8,
};

E.sort((p, q) => (p.z || 0) - (q.z || 0) || p.a - q.a);
const byLayer = {};
for (const e of E) (byLayer[e.layer] ||= []).push(e);

// -------------------------------------------------------------------- light ---
const skyK = track(SKY.sort(byT)), ambK = track(AMB.sort(byT)), gradeK = track(GRADE.sort(byT));
const moteK = MOTE.length ? track(MOTE.sort(byT)) : () => [255, 222, 170];
const mixA = (a, b, k) => a.map((v, i) => (Array.isArray(v) ? mixA(v, b[i], k) : v + (b[i] - v) * k));
function eraLook(t, b) {
  let { sky, amb, grade, mote, motes } = b, snow = 0, rays = 0;
  for (const [t0, t1, L] of ERAS) {
    const k = sramp(t, t0 - 1.2, t0 + 1.2) * (1 - sramp(t, t1 - 1.2, t1 + 1.2)); if (k <= 0.001) continue;
    sky = mixA(sky, L.sky, k); amb = mixA(amb, L.amb, k); grade = mixA(grade, L.grade, k);
    if (L.mote) mote = mixA(mote, L.mote, k);
    if (L.motes !== undefined) motes += (L.motes - motes) * k;
    if (L.snow) snow = Math.max(snow, L.snow * k);
    if (L.rays) rays = Math.max(rays, L.rays * k);
  }
  return { sky, amb, grade, mote, motes, snow, rays };
}

function state(t, stage) {
  const c = cam(t), lights = [], emitters = [], smoke = [];
  for (const f of HOOK.lights) f(t, c, lights, emitters, smoke, stage);
  let nightK = 0; for (const [a0, a1] of NIGHTS) nightK = Math.max(nightK, sramp(t, a0, a0 + 5) * (1 - sramp(t, a1 - 4, a1)));
  let sun = null;
  for (const [t0, t1, x, y0, y1] of SUNS) if (t > t0 && t < t1) sun = { x, y: lerp(y0, y1, smooth((t - t0) / (t1 - t0))), k: 1 };
  const PULL = ev('pull', 1e6), pull = sramp(t, PULL, PULL + 12);
  let zoom = 1;
  for (const [a0, a1, b0, b1, k] of ZOOM) zoom *= 1 + k * sramp(t, a0, a1) * (1 - sramp(t, b0, b1));
  const lk = eraLook(t, { sky: skyK(t), amb: ambK(t), grade: gradeK(t), mote: moteK(t), motes: 0.4 + 0.25 * nightK });
  if (!sun && lk.rays > 0.01 && stage && stage.W) {
    const hung = PAPER_SUN.find(([a, b]) => t > a + 2 && t < b);
    if (hung) sun = { x: (stage.W * (stage.aspectK > 0.4 ? 0.16 : 0.2) - stage.cx) / stage.u, y: (stage.H * 0.13 - stage.hy) / stage.u, k: lk.rays * sramp(t, hung[0] + 2, hung[0] + 4) * (1 - sramp(t, hung[1] - 2, hung[1])), noDisc: true };
  }
  return {
    fire: { lit: 0, reach: 0, blow: 0 }, lights, emitters, smoke,
    sky: lk.sky, ambient: lk.amb, ground: null,
    stars: nightK + pull * lerp(1, 0.22, sramp(t, PULL + 10, PULL + 22)),
    sun, cloud: 1 - nightK * 0.4, snow: lk.snow,
    motes: lk.motes, moteColor: lk.mote,
    emit: true, screen: 0, blink: 0, bloom: 0.16 + 0.34 * nightK, grade: lk.grade, rays: 1,
    zoom, pull, rustle: 0, shake: Math.exp(-(((t - ev('quake', -9) + 0.3) / 0.6) ** 2)) * 1.2,
    fade: Math.max(1 - sramp(t, 0.1, 3.4), sramp(t, DURATION - 3.5, DURATION)),
  };
}

const clouds = [
  { v: 0, x: -520, yf: 0.72, s: 1, par: 2.2, drift: 3.0 },
  { v: 1, x: 260, yf: 0.84, s: 0.8, par: 1.6, drift: 2.2 },
  { v: 2, x: 820, yf: 0.6, s: 1.1, par: 2.6, drift: 3.6 },
  { v: 3, x: -1050, yf: 0.9, s: 0.7, par: 1.4, drift: 1.8 },
];

// --------------------------------------------------------------------- sky ---
function sky(g, st, t, S) {
  const { W, H } = st, u = st.eu;
  g.setTransform(1, 0, 0, 1, 0, 0);
  for (const [t0, t1, k] of MILKY) { const m = (k ?? 0.7) * sramp(t, t0, t0 + 4) * (1 - sramp(t, t1 - 4, t1)); if (m > 0.01) milkyWay(g, st, t, m * (1 - S.pull), st.aspectK > 0.4 ? 0 : 1); }
  birds(g, st, t);
  // in the long days a paper sun hangs on its thread
  for (const [t0, t1] of PAPER_SUN) {
    if (t < t0 - 0.5 || t > t1 + 3) continue;
    const k = clamp(spring(t - t0, 5.5, 0.42), 0, 1.4) - (t > t1 ? spring(t - t1, 4, 0.7) * 1.4 : 0), sx = W * (st.aspectK > 0.4 ? 0.16 : 0.2), sy = H * lerp(-0.25, 0.13, k);
    g.globalCompositeOperation = 'screen'; const gl = g.createRadialGradient(sx, sy, 0, sx, sy, 300 * u); gl.addColorStop(0, `rgba(255,236,190,${0.35 * clamp(k)})`); gl.addColorStop(1, 'rgba(255,230,180,0)'); g.fillStyle = gl; g.fillRect(sx - 300 * u, sy - 300 * u, 600 * u, 600 * u); g.globalCompositeOperation = 'source-over';
    st.hang(g, st.fx.sun, sx, sy, 0.75, Math.sin(t * 0.4) * 1.2 * DEG, 1, t * 0.03);
  }
  for (const f of HOOK.sky) f(g, st, t, S);
}

// Things drawn in the world, in planet units: rivers, paths, cracks and their gold.
function groundFx(g, st, t, S) {
  const c = cam(t), rad = (a, h) => { const rel = (a - c) * DEG, r = 1000 + profile.main(a) + h; return [Math.sin(rel) * r, -Math.cos(rel) * r]; };
  const vis = st.visE + 4, from = c - vis, to = c + vis;
  const run = (a0, a1, fn) => { const s0 = Math.max(a0, from), s1 = Math.min(a1, to); if (s0 < s1) fn(s0, s1); };
  const along = (a0, a1, step, fn) => { for (let a = Math.ceil(a0 / step) * step; a < a1; a += step) fn(a); };
  const arc = (a0, a1, h, w, style, dash, off = 0) => { g.save(); g.strokeStyle = style; g.lineWidth = w; if (dash) { g.setLineDash(dash); g.lineDashOffset = off; } g.beginPath(); for (let a = a0; a <= a1 + 0.001; a += 0.3) { const [x, y] = rad(Math.min(a, a1), h); a === a0 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); g.restore(); };
  const river = (a0, a1, h, w, col, glint) => run(a0, a1, (s0, s1) => { arc(s0, s1, h, w, col); arc(s0, s1, h - w * 0.2, 1.2, glint, [10, 16], -t * 14); });
  const GF = { c, rad, run, along, arc, river, t, S, profile };
  for (const f of HOOK.ground) f(g, st, t, S, GF);
  for (const s of SEAMS) seam(g, st, t, s, GF);
}

// A seam: a crack in the board that opens when the country breaks, and fills with gold when it mends.
const SEAM_PATHS = new Map();
function seamPath(s) {
  if (SEAM_PATHS.has(s)) return SEAM_PATHS.get(s);
  const r = rng(s.seed || 7), pts = [], n = Math.max(6, Math.round((s.a1 - s.a0) * 1.6));
  for (let i = 0; i <= n; i++) pts.push([lerp(s.a0, s.a1, i / n) + (r() - 0.5) * 0.25, -3 - r() * 6 - (i % 3 === 1 ? 4 : 0)]);
  const branches = []; for (let k = 0; k < 4; k++) { const i = 1 + Math.floor(r() * (n - 1)), [a, h] = pts[i], len = 2 + r() * 4; branches.push([[a, h], [a + (r() - 0.5) * len * 0.4, h - len * 1.6], [a + (r() - 0.5) * len * 0.8, h - len * 3]]); }
  const out = { pts, branches }; SEAM_PATHS.set(s, out); return out;
}
function seam(g, st, t, s, G) {
  if (t < s.t0 - 0.1 || G.c + st.visE + 6 < s.a0 || G.c - st.visE - 6 > s.a1) return;
  const { pts, branches } = seamPath(s), open = sramp(t, s.t0, s.t0 + (s.openDur || 1.2)), gold = s.t1 ? sramp(t, s.t1, s.t1 + (s.dur || 2.5)) : 0;
  const n = pts.length - 1, shown = Math.max(1, Math.round(n * open));
  const line = (list, w, col, upto = 1) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); const m = Math.max(1, Math.round((list.length - 1) * upto)); for (let i = 0; i <= m; i++) { const [x, y] = G.rad(list[i][0], list[i][1]); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); };
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  // the dark crack, and its torn edge
  line(pts.slice(0, shown + 1), 5 * (1 - gold * 0.3), 'rgba(24,14,8,.8)'); line(pts.slice(0, shown + 1), 1.6, 'rgba(255,240,210,.2)');
  if (open > 0.6) for (const b of branches) line(b, 2.4 * (1 - gold * 0.2), 'rgba(24,14,8,.7)', clamp((open - 0.6) * 2.5));
  if (gold > 0) {
    // gold laid along it, from one end to the other, with a bright tip where the brush is
    const gn = Math.max(1, Math.round(n * gold)), gpts = s.rev ? pts.slice(n - gn).reverse() : pts.slice(0, gn + 1);
    line(gpts, 4.4, '#c9962e'); line(gpts, 2, '#f6d77a');
    for (const b of branches) if (gold > 0.5) { line(b, 2.6, '#c9962e', clamp((gold - 0.5) * 2)); line(b, 1.1, '#f6d77a', clamp((gold - 0.5) * 2)); }
    g.globalCompositeOperation = 'lighter';
    const [tx, ty] = G.rad(gpts[gpts.length - 1][0], gpts[gpts.length - 1][1]);
    if (gold < 1) st.stamp(g, st.dot(255, 214, 120, '255,246,220'), tx, ty, 26, 0.9);
    for (let i = 0; i < gpts.length; i += 2) { const sh = Math.max(0, Math.sin(t * 1.6 - i * 0.7)) ** 6; if (sh > 0.05) { const [x, y] = G.rad(gpts[i][0], gpts[i][1]); st.stamp(g, st.dot(255, 220, 140), x, y, 14, 0.5 * sh); } }
  }
  g.restore();
}

// ---- weather, in screen space. Mist is a ring around the planet, so it lies along the curve of the ground.
const LEAF_COL = ['#e0a640', '#c8742a', '#d89a3a', '#b8582a'], MAPLE_COL = ['#c2362a', '#d8502e', '#e07a2e', '#a82a26'];
function weather(g, st, t) {
  const { W, H } = st, u = st.eu, cx = st.cx, cy = st.ecy, R = st.eR, fr = (x) => x - Math.floor(x);
  const pu = Math.max(u, Math.min(W, H) / 820);
  for (const [kind, t0, t1, col, amt] of WX) {
    const k = sramp(t, t0, t0 + 1.6) * (1 - sramp(t, t1 - 1.6, t1)); if (k < 0.01) continue;
    g.save();
    if (kind === 'mist') {
      const [r, gg, b] = col, a = (amt || 0.25) * k;
      const gr = g.createRadialGradient(cx, cy, Math.max(1, R - 30 * u), cx, cy, R + 190 * u);
      gr.addColorStop(0, `rgba(${r},${gg},${b},0)`); gr.addColorStop(0.18, `rgba(${r},${gg},${b},${a})`); gr.addColorStop(0.45, `rgba(${r},${gg},${b},${a * 0.45})`); gr.addColorStop(1, `rgba(${r},${gg},${b},0)`);
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 7; i++) {
        const ang = (fr(hash(i * 5) + t * 0.004 * (0.6 + hash(i))) - 0.5) * 1.1, h = 20 + hash(i * 9) * 90, rr = R + h * u, x = cx + Math.sin(ang) * rr, y = cy - Math.cos(ang) * rr, w = (160 + hash(i * 3) * 160) * u;
        const pg = g.createRadialGradient(x, y, 0, x, y, w); pg.addColorStop(0, `rgba(${r},${gg},${b},${a * 0.7})`); pg.addColorStop(1, `rgba(${r},${gg},${b},0)`);
        g.fillStyle = pg; g.save(); g.translate(x, y); g.rotate(ang); g.scale(1, 0.32); g.translate(-x, -y); g.fillRect(x - w, y - w, w * 2, w * 2); g.restore();
      }
    } else if (kind === 'fog') {
      // thick fog: a white wall over everything, thinning upward
      const [r, gg, b] = col, a = (amt || 0.6) * k, gy = cy - R;
      const gr = g.createLinearGradient(0, gy - H * 0.55, 0, gy + H * 0.2); gr.addColorStop(0, `rgba(${r},${gg},${b},${a * 0.35})`); gr.addColorStop(0.6, `rgba(${r},${gg},${b},${a})`); gr.addColorStop(1, `rgba(${r},${gg},${b},${a * 0.8})`);
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 6; i++) { const x = W * (1.2 - fr(hash(i * 7) + t * 0.01 * (0.5 + hash(i)))) * 1.1 - W * 0.1, y = gy - (20 + hash(i * 3) * 160) * u, w = (240 + hash(i * 5) * 200) * u; const pg = g.createRadialGradient(x, y, 0, x, y, w); pg.addColorStop(0, `rgba(${r},${gg},${b},${a * 0.6})`); pg.addColorStop(1, `rgba(${r},${gg},${b},0)`); g.fillStyle = pg; g.save(); g.translate(x, y); g.scale(1, 0.3); g.translate(-x, -y); g.fillRect(x - w, y - w, w * 2, w * 2); g.restore(); }
    } else if (kind === 'petals') {
      for (let i = 0; i < 48; i++) {
        const sp = 0.6 + hash(i * 3) * 0.8, x = W * (1.15 - fr(hash(i) + t * 0.028 * sp) * 1.3) + Math.sin(t * 1.3 * sp + i) * 14 * u, y = H * fr(hash(i * 7) + t * 0.05 * sp) - 20 * u;
        g.save(); g.translate(x, y); g.rotate(t * 2.2 * sp + i); g.scale(1, 0.45 + 0.55 * Math.abs(Math.sin(t * 3 * sp + i))); g.globalAlpha = 0.9 * k * (amt || 1);
        g.fillStyle = i % 3 ? '#f6ccd6' : '#fbe4ea'; g.beginPath(); g.ellipse(0, 0, 5.2 * pu, 3.4 * pu, 0, 0, 7); g.fill();
        g.fillStyle = 'rgba(214,120,150,.5)'; g.beginPath(); g.ellipse(-1.6 * pu, 0, 1.6 * pu, 1.1 * pu, 0, 0, 7); g.fill(); g.restore();
      }
    } else if (kind === 'sand' || kind === 'dust') {
      const [r, gg, b] = col, gy = cy - R, n = kind === 'sand' ? 150 : 90;
      for (let i = 0; i < 6; i++) {
        const x = W * (1.3 - fr(hash(i * 11) + t * 0.12 * (0.7 + hash(i)))) * 1.0, y = gy + (-10 - hash(i * 4) * 150) * u, w = (160 + hash(i) * 200) * u;
        const pg = g.createRadialGradient(x, y, 0, x, y, w); pg.addColorStop(0, `rgba(${r},${gg},${b},${0.14 * k})`); pg.addColorStop(1, `rgba(${r},${gg},${b},0)`);
        g.fillStyle = pg; g.save(); g.translate(x, y); g.scale(1, 0.12); g.translate(-x, -y); g.fillRect(x - w, y - w, w * 2, w * 2); g.restore();
      }
      g.fillStyle = `rgba(${r},${gg},${b},${0.75 * k})`;
      for (let i = 0; i < n; i++) {
        const sp = 0.6 + hash(i * 13) * 0.9, x = W * (1.1 - fr(hash(i * 2) + t * 0.16 * sp) * 1.2), y = gy + (20 - fr(hash(i * 17)) ** 1.6 * 260) * u + Math.sin(t * 3 * sp + i) * 6 * u, s = (0.8 + hash(i * 5) * 1.4) * pu;
        g.fillRect(x, y, s * 2.4, s);
      }
    } else if (kind === 'leaves' || kind === 'maple') {
      const n = kind === 'maple' ? 30 : 26;
      for (let i = 0; i < n; i++) {
        const sp = 0.5 + hash(i * 3) * 0.7, x = W * (1.1 - fr(hash(i * 2) + t * 0.022 * sp) * 1.2) + Math.sin(t * 1.1 * sp + i) * 30 * u, y = H * fr(hash(i * 7) + t * 0.04 * sp) - 20 * u;
        g.save(); g.translate(x, y); g.rotate(Math.sin(t * 1.6 * sp + i) * 0.9 + i); g.globalAlpha = 0.95 * k;
        const s = (5 + hash(i * 9) * 3) * pu;
        if (kind === 'maple') { g.fillStyle = MAPLE_COL[i % 4]; g.beginPath(); for (let j = 0; j < 7; j++) { const a = -Math.PI / 2 + (j - 3) * 0.55; g.lineTo(Math.cos(a) * s * (j % 2 ? 0.55 : 1.15), Math.sin(a) * s * (j % 2 ? 0.55 : 1.15)); } g.lineTo(0, s * 0.3); g.closePath(); g.fill(); g.strokeStyle = 'rgba(90,30,20,.5)'; g.lineWidth = Math.max(0.6, 0.5 * pu); g.beginPath(); g.moveTo(0, s * 0.3); g.lineTo(0, s * 1.1); g.stroke(); }
        else { g.fillStyle = LEAF_COL[i % 4]; g.beginPath(); g.moveTo(0, s * 0.9); g.lineTo(-s * 0.9, -s * 0.5); g.quadraticCurveTo(0, -s * 1.1, s * 0.9, -s * 0.5); g.closePath(); g.fill(); g.strokeStyle = 'rgba(90,50,20,.6)'; g.lineWidth = Math.max(0.6, 0.5 * pu); g.beginPath(); g.moveTo(0, s * 0.9); g.lineTo(0, s * 1.5); g.stroke(); }
        g.restore();
      }
    } else if (kind === 'rain') {
      const [r, gg, b] = col || [200, 210, 225], n = Math.round(160 * (amt || 1));
      g.strokeStyle = `rgba(${r},${gg},${b},${0.32 * k})`; g.lineWidth = Math.max(1, 0.9 * pu); g.beginPath();
      for (let i = 0; i < n; i++) { const sp = 0.8 + hash(i * 3) * 0.5, x = W * fr(hash(i * 7) - t * 0.05 * sp) * 1.2 - W * 0.05, y = H * fr(hash(i * 11) + t * 0.9 * sp), l = (18 + hash(i) * 14) * pu; g.moveTo(x, y); g.lineTo(x - l * 0.22, y + l); }
      g.stroke();
      // a soft grey veil of falling water
      g.fillStyle = `rgba(${r},${gg},${b},${0.06 * k})`; g.fillRect(0, 0, W, H);
    } else if (kind === 'ash' || kind === 'snowfall') {
      const [r, gg, b] = col || (kind === 'ash' ? [150, 146, 140] : [250, 252, 255]), n = Math.round((kind === 'ash' ? 90 : 120) * (amt || 1));
      for (let i = 0; i < n; i++) { const sp = 0.4 + hash(i * 3) * 0.6, x = W * fr(hash(i * 7) + Math.sin(t * 0.2 + i) * 0.01 - t * 0.01 * sp) , y = H * fr(hash(i * 11) + t * 0.035 * sp) - 10, s = (1.2 + hash(i * 5) * 2.2) * pu; g.fillStyle = `rgba(${r},${gg},${b},${0.75 * k * (0.5 + 0.5 * hash(i * 13))})`; g.beginPath(); g.ellipse(x, y, s, s * 0.8, i, 0, 7); g.fill(); }
    } else if (kind === 'embers') {
      g.globalCompositeOperation = 'lighter'; const n = Math.round(60 * (amt || 1));
      for (let i = 0; i < n; i++) { const ph = fr(t * (0.06 + hash(i * 3) * 0.08) + hash(i * 7)), x = W * hash(i * 5) + Math.sin(t * 1.3 + i) * 20 * u, y = H * (1.05 - ph * 1.1); st.stamp(g, st.dot(255, 150, 60, '255,220,160'), x, y, (4 + hash(i) * 4) * pu, k * (1 - ph) * Math.min(1, ph * 6) * (0.6 + 0.4 * Math.sin(t * 8 + i))); }
    } else if (kind === 'kasumi') {
      // suyari-gasumi: the long golden mist bands of Japanese screens and scrolls, drifting across
      const bands = [[0.16, 0.5, 0.012], [0.3, 0.38, -0.008], [0.08, 0.32, 0.006], [0.42, 0.3, -0.01]];
      bands.forEach(([yf, wf, sp], i) => {
        const w = W * (wf + 0.25), x = fr(hash(i * 3) + t * sp) * (W + w) - w, y = H * yf + Math.sin(t * 0.2 + i) * 6 * u, h = Math.max(9, H * 0.028);
        g.globalAlpha = 0.36 * k * (amt || 1);
        const gr = g.createLinearGradient(0, y - h, 0, y + h); gr.addColorStop(0, '#f6dc8a'); gr.addColorStop(0.5, '#d9a94a'); gr.addColorStop(1, '#b8862e');
        g.fillStyle = gr; g.beginPath(); g.moveTo(x + h, y - h * 0.8);
        g.lineTo(x + w - h, y - h * 0.8); g.quadraticCurveTo(x + w + h * 0.4, y, x + w - h, y + h * 0.8); g.lineTo(x + w * 0.62, y + h * 0.8); g.quadraticCurveTo(x + w * 0.56, y + h * 1.6, x + w * 0.48, y + h * 0.8); g.lineTo(x + h, y + h * 0.8); g.quadraticCurveTo(x - h * 0.4, y, x + h, y - h * 0.8); g.fill();
        g.globalAlpha = 0.28 * k; g.fillStyle = '#fff4cc'; for (let j = 0; j < 14; j++) g.fillRect(x + hash(i * 31 + j) * w, y - h * 0.6 + hash(j * 7 + i) * h * 1.2, 3 * pu, 2 * pu);
        g.globalAlpha = 1;
      });
    }
    g.restore();
  }
}

function overFx(g, st, t, S) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  weather(g, st, t);
  for (const f of HOOK.over) f(g, st, t, S);
}

// shadows fall away from the strongest light nearby: the fire, a low sun
function shadowDx(e, a, t, S) {
  let dx = 0;
  if (t < 29 && Math.abs(a) < 18) dx += clamp(a / 3.5, -1, 1) * 10 * (1 - sramp(t, 25, 29)) * (1 - clamp((Math.abs(a) - 7) / 11));
  if (S.sun && S.sun.k > 0) dx -= Math.sign(S.sun.x) * 7 * S.sun.k * clamp((S.sun.y + 120) / 260);
  return e.flip ? -dx : dx;
}

// flocks of paper birds at dusk and dawn
function birds(g, st, t) {
  const { W, H } = st, u = st.eu * 1.1;
  for (const [t0, t1, dir, yf, n] of FLOCKS) {
    if (t < t0 || t > t1) continue;
    const k = (t - t0) / (t1 - t0);
    for (let i = 0; i < n; i++) {
      const lag = i * 0.035 + hash(i * 3 + t0) * 0.03, kk = k - lag; if (kk < 0 || kk > 1) continue;
      const x = dir > 0 ? lerp(-0.1, 1.1, kk) * W : lerp(1.1, -0.1, kk) * W, row = (i % 2 ? 1 : -1) * Math.ceil(i / 2);
      const y = st.hy * yf + row * 14 * u + Math.sin(t * 1.3 + i) * 6 * u + (Math.abs(row) * 10 * u);
      const flap = Math.sin(t * (7 + hash(i) * 2) + i * 1.7), s = u * (0.7 + hash(i * 7) * 0.3);
      g.save(); g.translate(x - dir * Math.abs(row) * 18 * u, y);
      for (const side of [-1, 1]) { g.save(); g.scale(side * s, s * (0.2 + 0.8 * Math.abs(flap)) * (flap > 0 ? 1 : -0.6)); put(g, st.fx.wing, 0); g.restore(); }
      g.fillStyle = '#2b2420'; g.beginPath(); g.ellipse(0, 0, 4 * s, 2.2 * s, 0, 0, 7); g.fill();
      g.restore();
    }
  }
}

// a river of light across the sky: a soft band, a darker dust lane, and thousands of faint stars
let MW = null;
function milkyWay(g, st, t, k, v) {
  const { W, H } = st, D = Math.hypot(W, H);
  if (!MW) { const r = rng(777); MW = []; for (let i = 0; i < 1400; i++) { const s = r(), w = (r() + r() + r() + r() - 2) * 0.5; MW.push([s, w, 0.3 + r() * r() * 1.4, r() * 50, r()]); } }
  const ang = (v ? -0.42 : -0.3) + Math.sin(t * 0.01) * 0.02, cx = W * (v ? 0.46 : 0.58), cy = st.hy - H * (v ? 0.36 : 0.42), wid = H * (v ? 0.11 : 0.09);
  g.save(); g.translate(cx, cy); g.rotate(ang);
  g.globalCompositeOperation = 'screen';
  for (const [sc, al, col] of [[1, 0.13, '170,180,235'], [0.45, 0.12, '215,205,235'], [0.18, 0.1, '240,230,240']]) {
    g.save(); g.scale(1, (wid / (D * 0.5)) * sc * 2.4);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, D * 0.5); gr.addColorStop(0, `rgba(${col},${al * k})`); gr.addColorStop(0.55, `rgba(${col},${al * k * 0.5})`); gr.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = gr; g.fillRect(-D * 0.5, -D * 0.5, D, D); g.restore();
  }
  for (let i = 0; i < 7; i++) {
    const x = (hash(i * 13 + 5) - 0.5) * D * 0.9, y = (hash(i * 7 + 1) - 0.5) * wid * 0.8, rx = D * (0.04 + hash(i * 3) * 0.05);
    g.save(); g.translate(x, y); g.scale(1, 0.45);
    const cg = g.createRadialGradient(0, 0, 0, 0, 0, rx); cg.addColorStop(0, `rgba(225,225,245,${0.09 * k})`); cg.addColorStop(1, 'rgba(225,225,245,0)');
    g.fillStyle = cg; g.fillRect(-rx, -rx, rx * 2, rx * 2); g.restore();
  }
  g.globalCompositeOperation = 'multiply';
  g.save(); g.translate(D * 0.05, wid * 0.12); g.scale(1, (wid / (D * 0.5)) * 0.35);
  const dg = g.createRadialGradient(0, 0, 0, 0, 0, D * 0.4); dg.addColorStop(0, `rgba(120,120,150,${0.5 * k})`); dg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = dg; g.fillRect(-D * 0.4, -D * 0.4, D * 0.8, D * 0.8); g.restore();
  g.globalCompositeOperation = 'lighter';
  for (const [s, w, sz, ph, cc] of MW) {
    const x = (s - 0.5) * D * 1.1, y = w * wid * 1.2 * (1 + Math.abs(s - 0.5)), tw = 0.6 + 0.4 * Math.sin(t * (0.6 + cc) + ph);
    const al = k * tw * (0.25 + 0.5 * (1 - Math.abs(w))) * (sz > 1 ? 1 : 0.6); if (al < 0.03) continue;
    g.fillStyle = cc > 0.85 ? `rgba(255,228,200,${al})` : `rgba(220,230,255,${al})`;
    const rr = Math.max(0.7, sz * 0.85 * st.dpr); g.fillRect(x - rr / 2, y - rr / 2, rr, rr);
  }
  g.restore(); g.globalCompositeOperation = 'source-over';
}

function bake(mk, mkSoft, stage) {
  const mkBig = (name, box, o = {}) => new BlurSheet(name, box, Math.max(1.4, Math.min(stage.W * 0.62, stage.H * 0.56) / 270 * 1.15), o, 0);
  return makeFx(mk, mkSoft, mkBig, stage);
}

export const film = { titleT: 10.8, keepFull: (a) => a > ev('keepFullA', 1e9), duration: DURATION, cam, state, entities: E, byLayer, profile, ground, clouds, bake, shadowDx, body: [110, 80, 52], fx: { sky, ground: groundFx, over: overFx } };
