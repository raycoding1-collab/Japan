// 16. Mended with gold. The camera pulls back to the whole little planet. As the narrator names each break
// (war, fire, earthquakes, the sea), a crack splits across it. Then each is mended: gold laid along it from
// end to end, a bright point where the brush is. The seams shine, light running along them, and the
// planet turns on, under the stars: the country as a bowl mended with gold.
import { add, hook, grassRun, ev, drop, near, por, R, CAM, ZONES, BUMPS, SKY, AMB, GRADE, ERAS, WX, NIGHTS, LOOK } from './film_api.js';
import { clamp, sramp, lerp, hash, rng } from './util.js';

CAM.push([801, 2084], [806, 2094], [812, 2104], [820, 2114], [830, 2126], [847, 2146]);
ZONES.push([2090, 2170, [120, 128, 92]]);
SKY.push([799.4, ['#1a2040', '#3a3658', '#a8707a', '#e8a07a']], [810, ['#0c1230', '#141c40', '#22284c', '#34365a']]);
AMB.push([799.4, [240, 200, 190]], [810, [170, 160, 180]]);
GRADE.push([799.4, [255, 180, 120, 0.12]], [810, [255, 200, 140, 0.12]]);
NIGHTS.push([803, 860]);
ERAS.push([799.2, 848, LOOK(['#0c1230', '#141c40', '#22284c', '#34365a'], [190, 180, 200], [255, 200, 140, 0.12], { motes: 0.6, mote: [255, 220, 150] })]);

// ahead, cherry trees, and boards not yet cut
for (const [a, v, s] of [[2084, 1, 0.9], [2092, 2, 0.7], [2102, 0, 0.8]]) add('sakura', 'main', a, { v, z: 0, scale: s });
for (let a = 2108, i = 0; a < 2170; a += 5 + R() * 5, i++) { const tilt = (R() - 0.5) * 7; add('blank', 'main', a, { v: (R() * 5) | 0, z: R() < 0.5 ? 0 : 2, scale: 0.6 + R() * 0.6, loud: 0.5, popAt: 801 + i * 0.3, rot: () => tilt }); }
for (let a = 2096; a < 2170; a += 8) add('blank', 'mid', a, { v: (R() * 5) | 0, scale: 0.5, popAt: 802 + (a - 2096) * 0.04 });
grassRun(2076, 2170, 4, 'main'); grassRun(2076, 2170, 7, 'front', { s: 2 });

// Five cracks across the face of the planet, each starting at the rim; generated once, in planet angles.
const T_BREAK = [ev('war', 803.0), ev('fire', 803.8), ev('quake', 804.8), ev('seaend', 806.2), ev('broken', 801.8)];
const T_MEND = ev('mended', 810.2), T_SHINE = ev('shine', 820.4);
const CRACKS = (() => { const r = rng(845), out = []; const starts = [[2040, 0], [2130, 1], [1990, 2], [2180, 3], [2090, 4]];
  for (const [A0, i] of starts) { const pts = []; let A = A0, f = 0.99; const dA = (r() - 0.5) * 30, n = 16; for (let k = 0; k <= n; k++) { pts.push([A, f]); A += dA / n + (r() - 0.5) * 9; f -= (0.8 + r() * 0.5) / n * (i === 4 ? 0.9 : 1); f = Math.max(0.08, f); }
    const twigs = []; for (let j = 0; j < 4; j++) { const k = 2 + Math.floor(r() * (n - 4)), [a, ff] = pts[k], tw = [[a, ff]]; let a2 = a, f2 = ff; for (let m = 0; m < 4; m++) { a2 += (r() - 0.5) * 14; f2 -= (r() - 0.3) * 0.06; tw.push([a2, Math.min(0.98, Math.max(0.1, f2))]); } twigs.push([k / n, tw]); }
    out.push({ pts, twigs }); }
  return out; })();

hook({
  over(g, st, t, S) {
    const pk = S.pull || 0; if (pk < 0.05) return;
    const u = st.eu, P = (A, f) => st.place('main', A, -1000 * (1 - f), t);
    const path = (pts, upto, w, col) => { const n = pts.length - 1, m = upto * n; if (m <= 0) return; g.strokeStyle = col; g.lineWidth = w; g.beginPath(); for (let i = 0; i <= Math.ceil(m); i++) { const j = Math.min(i, m), i0 = Math.floor(j), fr = j - i0, a = pts[i0], b = pts[Math.min(n, i0 + 1)], [x, y] = P(a[0] + (b[0] - a[0]) * fr, a[1] + (b[1] - a[1]) * fr); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); };
    const tipAt = (pts, k) => { const n = pts.length - 1, j = k * n, i0 = Math.min(n - 1, Math.floor(j)), fr = j - i0, a = pts[i0], b = pts[i0 + 1]; return P(a[0] + (b[0] - a[0]) * fr, a[1] + (b[1] - a[1]) * fr); };
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.globalAlpha = sramp(pk, 0.05, 0.4);
    const W0 = Math.max(1.6, 4.2 * u), shine = t > T_SHINE ? 1 : 0;
    CRACKS.forEach((c, i) => {
      const open = sramp(t, T_BREAK[i], T_BREAK[i] + 1.1), gold = sramp(t, T_MEND + i * 0.5, T_MEND + i * 0.5 + 2.2);
      if (open <= 0) return;
      // the crack, dark, with a pale torn lip
      path(c.pts, open, W0 * 1.5 * (1 - gold * 0.4), 'rgba(18,10,6,.85)'); path(c.pts, open, W0 * 0.4, 'rgba(255,240,220,.18)');
      for (const [at, tw] of c.twigs) { const k = clamp((open - at) * 3); if (k > 0) path(tw, k, W0 * 0.7, 'rgba(18,10,6,.75)'); }
      if (gold > 0) {
        path(c.pts, gold, W0 * 1.3, '#b8862a'); path(c.pts, gold, W0 * 0.6, '#f6d77a');
        for (const [at, tw] of c.twigs) { const k = clamp((gold - at) * 3); if (k > 0) { path(tw, k, W0 * 0.8, '#b8862a'); path(tw, k, W0 * 0.35, '#f6d77a'); } }
        g.globalCompositeOperation = 'lighter';
        if (gold < 1) { const [x, y] = tipAt(c.pts, gold); st.stamp(g, st.dot(255, 214, 120, '255,248,224'), x, y, 26 * u + 10, 0.95); }
        // light running along the seam once it shines
        const n = c.pts.length - 1;
        for (let j = 0; j <= n; j += 1) { const ph = shine ? Math.max(0, Math.sin((t - T_SHINE) * 2.2 - j * 0.55 + i)) ** 5 : Math.max(0, Math.sin(t * 1.4 - j * 0.7 + i)) ** 8 * 0.4 * gold; if (ph < 0.04 || j / n > gold) continue; const [x, y] = P(c.pts[j][0], c.pts[j][1]); st.stamp(g, st.dot(255, 220, 140), x, y, (14 + 10 * shine) * u + 4, 0.7 * ph); }
        g.globalCompositeOperation = 'source-over';
      }
    });
    // when they shine: a warm glow over the whole mended planet
    if (shine) { const k = sramp(t, T_SHINE, T_SHINE + 2.4) * (0.85 + 0.15 * Math.sin(t * 1.3)); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(st.cx, st.ecy, st.eR * 0.2, st.cx, st.ecy, st.eR * 1.25); gr.addColorStop(0, `rgba(255,200,110,${0.08 * k})`); gr.addColorStop(0.75, `rgba(255,190,100,${0.1 * k})`); gr.addColorStop(1, 'rgba(255,190,100,0)'); g.fillStyle = gr; g.fillRect(0, 0, st.W, st.H); g.globalCompositeOperation = 'source-over'; }
    g.restore();
  },
});
