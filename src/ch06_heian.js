// 6. The court of beauty. Heian-kyō's grid drawn on a card, its great gate and willow avenue, an ox
// carriage; then a moonlit autumn night: poems hung on a plum, incense, a dragon boat on the pond, the
// full moon, twelve layers of silk fanned out on a card and turned from spring to autumn colours; kana
// flowing from a brush; Murasaki writing by lamplight while pages lift away; and a mansion whose roof
// is lifted off, as in the painted scrolls of Genji, under drifting bands of golden mist.
import { add, hook, grassRun, ev, drop, near, flick, card, closeUp, por, PS, P2, R, CAM, ZONES, SEAS, BUMPS, SKY, AMB, GRADE, ERAS, WX, NIGHTS, ZOOM, LOOK, W_, PAL } from './film_api.js';
import { LOOKS } from './people.js';
import { clamp, sramp, lerp, hash, fbm, DEG } from './util.js';
import { put } from './paper.js';
import { brush } from './sky_japan.js';

const LADY = (topCol, legCol, collar) => ({ skin: 6, top: 'robe', topCol, legs: 'robe', legCol, sleeve: topCol, hair: 'heian', pose: 'kneel', collar });
Object.assign(LOOKS, {
  oxDriver: { skin: 4, top: 'tunic', topCol: '#d8ccb0', legs: 'trousers', legCol: '#a89a7a', hat: 'eboshi', hatCol: '#1e1a1c', pose: 'walk', obi: '#6a4a30' },
  heianTown: { skin: 4, top: 'robe', topCol: '#8a9a7a', legs: 'trousers', legCol: '#6a7a5a', hat: 'eboshi', hatCol: '#1e1a1c', pose: 'walk', collar: '#e8dcc0' },
  heianTown2: { skin: 6, top: 'robe', topCol: '#c87a6a', legs: 'robe', legCol: '#a85a4a', sleeve: '#c87a6a', hair: 'long', pose: 'walk', item: 'umbrella', collar: '#f0e4d4' },
  courtPoet: { skin: 6, top: 'robe', topCol: '#2a2a48', legs: 'robe', legCol: '#5a2a3a', sleeve: '#2a2a48', hat: 'eboshi', hatCol: '#1e1a1c', pose: 'kneel', item: 'brush', collar: '#e8dcc0' },
  courtMusician: { skin: 6, top: 'robe', topCol: '#3a4a6a', legs: 'robe', legCol: '#3a4a6a', sleeve: '#3a4a6a', hat: 'eboshi', hatCol: '#1e1a1c', pose: 'kneel', item: 'flute', collar: '#e8dcc0' },
  courtLadyKneel: LADY('#b83a5a', '#7a1a3a', '#f4e8e0'),
  junihitoe: { ...LADY('#c8504a', '#6a1a2a', '#f8eedc'), pose: 'stand' },
  murasaki: LADY('#6a3a7a', '#3a1a4a', '#f4e8e0'),
  genji: { skin: 6, top: 'robe', topCol: '#e8e0d0', legs: 'robe', legCol: '#7a2a3a', sleeve: '#e8e0d0', hat: 'eboshi', hatCol: '#1e1a1c', pose: 'kneel', item: 'flute', collar: '#c8604a' },
  genjiLady: LADY('#d8885a', '#8a2a2a', '#f8eed8'),
  genjiLady2: LADY('#5a7a9a', '#2a3a5a', '#f4ecdc'),
  genjiLady3: LADY('#c8a04a', '#7a3a2a', '#f8f0dc'),
});

CAM.push([192, 505], [194.5, 512], [197, 518], [199.5, 524], [201.5, 532], [204, 538], [206.5, 544], [209, 548], [211.5, 553], [214, 557], [216.5, 563], [219, 567], [221.5, 570], [224, 584], [226.5, 593], [229, 597], [231.5, 600], [232.4, 606]);
ZONES.push([500, 530, [168, 148, 106]], [531, 547, [120, 120, 82]], [549, 557.5, [44, 74, 96]], [559, 580, [118, 118, 80]], [582, 616, [124, 120, 82]]);
SEAS.push([548.5, 558]);
BUMPS.far.push([495, 620, 46, 10, 24]);

SKY.push([190.5, ['#9ab4d4', '#c4cede', '#f0e2e2', '#f6e4d4']], [199.6, ['#9ab4d4', '#c4cede', '#f0e2e2', '#f6e4d4']], [202.5, ['#0e1838', '#1a2650', '#2e3a6a', '#4a5682']], [232.6, ['#14122a', '#221e3a', '#3a2e48', '#5a4258']]);
AMB.push([190.5, [255, 246, 240]], [199.6, [255, 246, 240]], [202.5, [110, 120, 168]], [232.6, [130, 112, 136]]);
GRADE.push([190.5, [255, 220, 220, 0.08]], [199.6, [255, 220, 220, 0.08]], [202.5, [150, 170, 220, 0.12]], [216, [150, 170, 220, 0.12]], [218, [255, 190, 120, 0.14]]);
NIGHTS.push([199.6, 234]);
ERAS.push(
  [190.8, 200.6, LOOK(['#9ab4d4', '#c4cede', '#f0e2e2', '#f6e4d4'], [255, 246, 240], [255, 220, 220, 0.08], { motes: 0.5, mote: [255, 230, 240] })],   // Heian-kyō: a pale spring morning
  [200.6, 216.4, LOOK(['#0e1838', '#1a2650', '#2e3a6a', '#4a5682'], [120, 130, 175], [150, 170, 220, 0.12], { motes: 0.4, mote: [200, 210, 255] })],     // moon-viewing: a blue autumn night
  [216.4, 233.4, LOOK(['#14122a', '#221e3a', '#3a2e48', '#5a4258'], [140, 120, 140], [255, 190, 120, 0.14], { motes: 0.6, mote: [255, 220, 170] })],   // by lamplight, in a painted scroll
);
WX.push(['petals', 191, 200.4, null, 0.8], ['maple', 201, 216.4], ['kasumi', 223.4, 233.2, null, 1]);
ZOOM.push([203.5, 205.5, 209.5, 211.5, 0.1], [226, 228, 231.4, 233, 0.12]);

// ---- Heian-kyō: the gate, the avenue of willows, an ox carriage
const T_HK = ev('heiankyo', 193.0), T_1000 = ev('thousandyrs', 198.4);
add('tera', 'main', 511.6, { v: 2, z: 0.3, scale: 0.95, popAt: T_HK - 0.4, loud: 1.8, wide: 6 });
for (const a of [505.4, 518, 529]) add('willow', 'main', a, { v: (a | 0) % 3, z: 0, scale: 0.9 });
add('gissha', 'main', 515.6, { z: 1.6, scale: 0.78, popAt: T_HK + 0.5, move: (t) => clamp((t - T_HK - 0.8) * 0.5, 0, 2.4) });
add('person', 'main', 507.2, { v: 'heianTown', z: 2, scale: P2, popAt: T_HK + 0.2, pace: 4, move: (t) => clamp((t - T_HK) * 0.4, 0, 1.6), act: (t) => (t > T_HK + 4 ? { walk: undefined } : {}) });
add('person', 'main', 504.6, { v: 'heianTown2', z: 2.2, scale: P2, popAt: T_HK + 0.4, pace: 4, move: (t) => clamp((t - T_HK) * 0.4, 0, 1.6), act: (t) => (t > T_HK + 4 ? { walk: undefined } : {}) });
for (const [a, v, s] of [[498, 1, 0.6], [518, 1, 0.55], [538, 4, 0.6]]) add('jmount', 'far', a, { v, scale: s });
add('tera', 'mid', 524, { v: 3, scale: 0.5 }); add('gojunoto', 'mid', 500, { v: 0, scale: 0.45 });
grassRun(500, 531, 4, 'main', { skip: (a) => a > 503 && a < 527 });

// ---- moon-viewing: poems, incense, music on the pond, the moon, twelve layers
const T_POEM = ev('poetry', 203.6), T_INC = ev('incense', 204.5), T_MOON = ev('moonview', 205.2), T_LAY = ev('layers', 206.8), T_SEAS = ev('season', 208.4);
add('sakura', 'main', 532, { v: 2, z: 0, scale: 0.85 });
add('person', 'main', 534.2, { v: 'courtPoet', z: 2, scale: P2, popAt: T_POEM - 0.6, act: (t) => ({ lean: 20, head: t > T_MOON ? -24 : 12, front: [-70 + Math.sin(t * 4) * 6, -50] }) });
add('shinden', 'main', 540.6, { v: 0, z: 0, scale: 0.78, popAt: 200.4, loud: 1.6, wide: 8 });
add('shindenFront', 'main', 540.6, { v: 0, z: 0.1, scale: 0.78, popAt: 200.4, over: true, wide: 10, blinds: () => 0, lamp: (t) => sramp(t, 200.8, 202) });
add('ryutosen', 'main', 551.4, { z: 1, scale: 0.82, y: 2, popAt: 202.6, move: (t) => clamp((t - 203) * 0.3, 0, 2.6) });
add('person', 'main', 546.8, { v: 'junihitoe', z: 2.4, scale: P2, flip: true, popAt: T_LAY - 0.5, act: (t) => ({ head: t > T_MOON ? -26 : -6, lean: -2, front: [-30, -40], back: [-20, -30] }) });
for (const a of [530, 558.6]) add('momiji', 'main', a, { v: 0, z: 0.2, scale: 0.8 });
for (let a = 549; a < 558; a += 3) add('reeds', 'main', a, { v: (R() * 4) | 0, z: 3, scale: 0.7, loud: 0.3 });

// ---- Murasaki, writing by lamplight
const T_MUR = ev('murasaki', 217.2), T_NOVEL = ev('novel', 222.4);
add('shinden', 'main', 566.4, { v: 1, z: 0, scale: 0.86, popAt: T_MUR - 0.8, loud: 1.4 });
add('jdesk', 'main', 567.2, { z: 0.4, scale: 0.9, y: 50, popAt: T_MUR - 0.4 });
add('person', 'main', 565.2, { v: 'murasaki', z: 0.5, scale: P2 * 0.9, y: 50, popAt: T_MUR - 0.3, act: (t) => ({ lean: 18, head: 14 + Math.sin(t * 0.5) * 3, front: [-60 + Math.sin(t * 4.4) * 6, -54] }) });
add('todai', 'main', 569.4, { z: 0.6, scale: 1, y: 50, popAt: T_MUR - 0.2, lit: (t) => sramp(t, T_MUR, T_MUR + 0.6) });
add('shindenFront', 'main', 566.4, { v: 1, z: 0.1, scale: 0.86, popAt: T_MUR - 0.8, over: true, blinds: () => 1, lamp: (t) => 0.5 * sramp(t, T_MUR, T_MUR + 0.6) });
for (const a of [559.6, 573.6]) add('momiji', 'main', a, { v: 1, z: 0.2, scale: 0.7 });

// ---- the painted scroll: the roof lifted off
const T_ROOF = ev('roofs', 227.4), T_IN = ev('inside', 230.2);
add('shinden', 'main', 597.6, { v: 0, z: 0, scale: 0.98, popAt: 223.6, loud: 1.8, wide: 10 });
add('person', 'main', 592.6, { v: 'genji', z: 0.3, scale: P2 * 0.9, y: 57, popAt: 223.8, act: (t) => ({ lean: 4, head: -6, back: [-60, -50], front: [-100, -40] }) });
add('koto', 'main', 596.6, { z: 0.3, scale: 0.8, y: 57, popAt: 223.9 });
add('person', 'main', 596.2, { v: 'genjiLady', z: 0.35, scale: P2 * 0.9, y: 57, popAt: 224, act: (t) => ({ lean: 16, head: 10, front: [-60 + Math.sin(t * 3) * 6, -40], back: [-50 + Math.sin(t * 3 + 1) * 6, -40] }) });
add('kicho', 'main', 600.6, { z: 0.36, scale: 0.8, y: 57, popAt: 224.1 });
add('person', 'main', 602.4, { v: 'genjiLady2', z: 0.32, scale: P2 * 0.9, y: 57, flip: true, popAt: 224.1, act: (t) => ({ head: -4 + Math.sin(t * 0.4) * 4 }) });
add('person', 'main', 604.4, { v: 'genjiLady3', z: 0.34, scale: P2 * 0.9, y: 57, flip: true, popAt: 224.2, act: (t) => ({ head: 6, lean: 10 }) });
add('shindenFront', 'main', 597.6, { v: 0, z: 0.1, scale: 0.98, popAt: 223.6, over: true, wide: 12, blinds: (t) => sramp(t, T_ROOF + 0.5, T_ROOF + 1.8), roof: (t) => sramp(t, T_ROOF, T_ROOF + 2.2) * (1 - sramp(t, T_IN + 1.0, T_IN + 2.4)), lamp: (t) => sramp(t, 224, 225) });
for (const [a, v] of [[585, 0], [589, 2], [609, 1], [613, 0]]) add(v === 2 ? 'sakura' : 'momiji', 'main', a, { v: v === 2 ? 2 : v, z: 0.2, scale: 0.75 });
grassRun(531, 616, 4.2, 'main', { skip: (a) => a > 533 && a < 559 || a > 562 && a < 571 || a > 586 && a < 611 });
grassRun(500, 616, 7, 'front', { s: 2 });
for (const [a, v, s] of [[560, 1, 0.55], [585, 1, 0.6], [608, 4, 0.55]]) add('jmount', 'far', a, { v, scale: s });

// the city's grid, drawn on a card; and the years it stayed
function cityGrid(g, k) {
  g.save(); g.strokeStyle = 'rgba(50,34,22,.85)'; g.lineWidth = 1.6;
  const x0 = -100, y0 = -80, w = 200, h = 160, n = 9, m = 7, d = Math.round(k * (n + m + 2));
  for (let i = 0; i <= n && i < d; i++) { g.beginPath(); g.moveTo(x0 + (i * w) / n, y0); g.lineTo(x0 + (i * w) / n, y0 + h); g.stroke(); }
  for (let j = 0; j <= m && j + n < d; j++) { g.beginPath(); g.moveTo(x0, y0 + (j * h) / m); g.lineTo(x0 + w, y0 + (j * h) / m); g.stroke(); }
  if (d > n + m) { g.fillStyle = 'rgba(178,40,32,.8)'; g.fillRect(-12, y0, 24, 34); g.lineWidth = 4; g.strokeStyle = 'rgba(178,40,32,.6)'; g.beginPath(); g.moveTo(0, y0 + 34); g.lineTo(0, y0 + h); g.stroke(); }
  g.restore();
}
const LAYERS = { spring: ['#f8f2ec', '#f6dce0', '#f0c4cc', '#e8a8b4', '#de8a9c', '#d06e86', '#c25270', '#a83e5c', '#8e2c4a', '#7a2a6a', '#5a2a6a', '#3a6a4a'], autumn: ['#f8e8b0', '#f2d07a', '#ecb456', '#e6983e', '#de7c30', '#d46028', '#c44824', '#b03822', '#982a20', '#7a2a1c', '#5a2e1a', '#4a4a2a'] };
hook({
  sky(g, st, t) {
    // the full moon
    if (t > T_MOON - 1 && t < 218) { const { W, H } = st, k = drop(t, T_MOON, 216.4), x = W * (por(st) ? 0.72 : 0.78), y = H * lerp(-0.2, 0.16, k), u = st.eu; g.globalCompositeOperation = 'screen'; const gl = g.createRadialGradient(x, y, 0, x, y, 300 * u); gl.addColorStop(0, `rgba(220,226,255,${0.3 * clamp(k)})`); gl.addColorStop(1, 'rgba(200,210,255,0)'); g.fillStyle = gl; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over'; st.hang(g, st.fx.fullmoon, x, y, 0.9, Math.sin(t * 0.4) * 1.2 * DEG); }
  },
  lights(t, c, L, Em, Sm) {
    if (near(540, c, 50) && t > T_INC - 0.5 && t < 218) Sm.push({ a: 544.6, layer: 'main', h: 70, t0: T_INC, size: 0.5, life: 6, every: 0.6, rise: 160, drift: -2, alpha: 0.26 });
    if (near(540, c, 50) && t > 200.6 && t < 218) L.push({ a: 540.6, h: 90, r: 520, k: 0.5 * sramp(t, 200.8, 202), color: [255, 180, 110] });
    if (near(566, c, 50) && t > T_MUR - 0.4 && t < 233) L.push({ a: 569.4, h: 150, r: 520, k: 0.9 * sramp(t, T_MUR, T_MUR + 0.6) * flick(t, 3), color: [255, 180, 100] });
    if (near(597, c, 50) && t > 224) L.push({ a: 597.6, h: 110, r: 700, k: 0.75 * sramp(t, 224, 225) * flick(t, 5), color: [255, 186, 110] });
  },
  over(g, st, t) {
    const { W, H } = st, p = por(st);
    // the city plan
    if (t > T_HK - 0.6 && t < 201.5) {
      const k = drop(t, T_HK - 0.2, 199.8), x = W * (p ? 0.5 : 0.24), y = H * lerp(-0.4, p ? 0.08 : 0.1, k), s = p ? 0.6 : 0.8;
      card(st, g, x, y + 110 * st.eu * s, s, Math.sin(t * 0.5) * 1.2 * DEG, (g2) => {
        put(g2, st.fx.plancard, 0.3, 4, 6); cityGrid(g2, sramp(t, T_HK, T_HK + 2.6));
        const yk = sramp(t, T_1000 - 0.4, T_1000 + 0.4); if (yk > 0.01) { g2.globalAlpha = yk; g2.font = 'italic 400 20px Fraunces, Georgia, serif'; g2.textAlign = 'center'; g2.fillStyle = 'rgba(40,26,18,.9)'; g2.fillText('794 – 1869', 0, 104); g2.globalAlpha = 1; }
      }, 1, 130);
    }
    // poems on slips of coloured paper, hung on the plum
    if (t > T_POEM && t < 218) { const cols = ['#e8a8b4', '#a8c8e0', '#f0d080'];
      cols.forEach((c, i) => { const k = sramp(t, T_POEM + i * 0.3, T_POEM + 0.4 + i * 0.3); if (k < 0.01) return; const [x, y] = st.place('main', 531.2 + i * 1.3, 150 - i * 12, t), u = st.eu; g.save(); g.translate(x, y); g.rotate(Math.sin(t * 1.4 + i) * 0.12); g.strokeStyle = 'rgba(220,210,190,.5)'; g.lineWidth = Math.max(1, 0.5 * u); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 8 * u); g.stroke(); g.globalAlpha = k; g.fillStyle = c; g.fillRect(-4 * u, 8 * u, 8 * u, 30 * u); g.fillStyle = 'rgba(30,22,18,.6)'; for (let j = 0; j < 4; j++) g.fillRect(-0.6 * u, (12 + j * 6) * u, 1.4 * u, 3.4 * u); g.restore(); });
    }
    // twelve layers of silk, fanned out, in the colours of spring and then of autumn
    if (t > T_LAY - 0.5 && t < 212) {
      const k = drop(t, T_LAY - 0.1, 210.6), x = W * (p ? 0.5 : 0.25), y = H * lerp(-0.4, p ? 0.1 : 0.14, k), s = p ? 0.55 : 0.75, sw = sramp(t, T_SEAS - 0.2, T_SEAS + 1.2);
      card(st, g, x, y, s, Math.sin(t * 0.6) * 1.5 * DEG, (g2) => {
        for (let i = 11; i >= 0; i--) { const a = (i - 5.5) * 0.07 * (0.4 + 0.6 * sramp(t, T_LAY, T_LAY + 1.2)), c0 = LAYERS.spring[i], c1 = LAYERS.autumn[i]; g2.save(); g2.rotate(a); g2.fillStyle = sw < 0.5 ? c0 : c1; if (sw > 0.01 && sw < 0.99) { g2.fillStyle = c0; g2.fillRect(-60 - i * 3, -10, 120 + i * 6, 150); g2.globalAlpha = sw; g2.fillStyle = c1; } g2.fillRect(-60 - i * 3, -10, 120 + i * 6, 150); g2.globalAlpha = 1; g2.strokeStyle = 'rgba(40,20,20,.25)'; g2.lineWidth = 1; g2.strokeRect(-60 - i * 3, -10, 120 + i * 6, 150); g2.restore(); }
      }, 1, 70);
    }
    // kana, flowing from the brush, down two columns: i ro ha ni / ho he to
    closeUp(st, g, t, ev('kana', 211.0) - 0.4, 216.0, (g2) => {
      put(g2, st.fx.washi, 0.6, 8, 12); g2.fillStyle = 'rgba(200,160,70,.35)'; for (let i = 0; i < 40; i++) g2.fillRect(-110 + hash(i * 3) * 220, -130 + hash(i * 7) * 260, 3, 2);
      const n = sramp(t, ev('kana', 211.0), ev('kana', 211.0) + 4.2) * 7.99, ks = ['i', 'ro', 'ha', 'ni', 'ho', 'he', 'to'];
      ks.forEach((ch, i) => { const col = i < 4 ? 0 : 1, row = i < 4 ? i : i - 4, f = clamp(n - i); if (f <= 0) return; const strokes = { i: 2, ro: 1, ha: 3, ni: 3, ho: 4, he: 1, to: 2 }[ch]; brush(g2, ch, 30 - col * 90, -128 + row * 62, 0.56, f * strokes, '#1c1612', 9); });
    }, { light: [255, 190, 130], glow: 0.24, embers: false, veil: 0.45, dark: '10,10,20' });
    // the novel's pages, lifting from her desk into the night
    if (t > T_NOVEL - 0.2 && t < 228) for (let i = 0; i < 14; i++) {
      const t0 = T_NOVEL + i * 0.22, k = (t - t0) / 4.2; if (k < 0 || k > 1) continue;
      const [x0, y0] = st.place('main', 567.2, 110, t), u = st.eu, x = x0 + (hash(i * 3) - 0.3) * 300 * u * k + Math.sin(t * 2 + i) * 10 * u, y = y0 - k * 380 * u;
      g.save(); g.translate(x, y); g.rotate(Math.sin(t * 2.4 + i) * 0.6); g.scale(1, 0.4 + 0.6 * Math.abs(Math.sin(t * 3 + i))); g.globalAlpha = Math.min(1, (1 - k) * 2) * 0.95; g.fillStyle = '#f2ead8'; g.fillRect(-9 * u, -12 * u, 18 * u, 24 * u); g.fillStyle = 'rgba(30,22,18,.5)'; for (let j = 0; j < 4; j++) g.fillRect((-6 + j * 4) * u, -9 * u, 1.2 * u, 18 * u); g.restore();
    }
  },
});
