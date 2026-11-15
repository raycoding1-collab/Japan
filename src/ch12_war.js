// 12. Empire and ashes. Restraint: dimmed, reddened light and no melody. A map reddens across Asia as the
// empire spreads; soldiers march; on the horizon, smoke, and a long row of paper figures folding down.
// Planes cross towards Pearl Harbor and a ship burns. A night of fire in Tokyo under the bombers. Then an
// ordinary summer morning in Hiroshima, a single plane, a white flash, and the dome standing alone. People
// bow their heads around a radio, and the ground cracks open. At dawn, in a hospital room, Sadako folds
// cranes, string after string, until they lift into the sky: a wish for peace.
import { add, hook, grassRun, ev, drop, near, flick, card, por, PS, P2, R, CAM, ZONES, SEAS, BUMPS, SKY, AMB, GRADE, ERAS, WX, NIGHTS, ZOOM, SEAMS, LOOK, W_, PAL } from './film_api.js';
import { LOOKS } from './people.js';
import { clamp, sramp, lerp, hash, fbm, DEG } from './util.js';
import { put } from './paper.js';
import { eastAsiaMap } from './sky_japan.js';

Object.assign(LOOKS, {
  soldier: { skin: 4, top: 'shirt', topCol: '#7a7a5a', sleeve: '#7a7a5a', legs: 'trousers', legCol: '#6a6a4c', hat: 'cap', hatCol: '#6a6a4c', pose: 'walk', item: 'teppo' },
  civilian: { skin: 4, top: 'robe', topCol: '#6a6258', legs: 'trousers', legCol: '#4a463e', sleeve: '#6a6258', hair: 'short', pose: 'stand' },
  civilian2: { skin: 6, top: 'robe', topCol: '#5a5a62', pattern: 'checks', legs: 'trousers', legCol: '#3e3e46', sleeve: '#5a5a62', hair: 'bun', pose: 'stand' },
  civilianKid: { skin: 6, top: 'shirt', topCol: '#8a8478', legs: 'trousers', legCol: '#5a564e', hair: 'short', pose: 'stand', small: 0.7 },
  sadako: { skin: 6, top: 'robe', topCol: '#c8d8e4', legs: 'robe', legCol: '#c8d8e4', sleeve: '#c8d8e4', hair: 'bob', pose: 'sit', item: 'crane' },
  sadakoMother: { skin: 6, top: 'robe', topCol: '#6a5a6a', legs: 'robe', legCol: '#5a4a5a', sleeve: '#6a5a6a', hair: 'bun', pose: 'stand', collar: '#efe6d2' },
});

CAM.push([512.9, 1440], [515.5, 1446], [518, 1452], [520.5, 1458], [523, 1464], [525.5, 1470], [528, 1478], [530.5, 1484], [533, 1492], [535.5, 1500], [538, 1506], [540.5, 1510], [543, 1518], [545.5, 1525], [548, 1528], [550.5, 1530], [553, 1538], [555.5, 1545], [558, 1548], [560.5, 1554], [563, 1563], [566, 1566], [569, 1568], [572, 1572], [574.4, 1580]);
ZONES.push([1436, 1472, [120, 104, 82]], [1474.5, 1491.5, [50, 66, 84]], [1494, 1514, [96, 76, 62]], [1516, 1538, [130, 122, 100]], [1540, 1560, [110, 106, 98]], [1562, 1578, [120, 118, 96]]);
SEAS.push([1474, 1492]);
BUMPS.far.push([1434, 1580, 30, 10, 20]);
SEAMS.push({ a0: 1500, a1: 1598, t0: ev('surrendered', 557.0), openDur: 2.6, t1: ev('rebuilt', 577.0), dur: 4.2, rev: true, seed: 9 });

SKY.push([511.6, ['#4e464c', '#6e6062', '#9a8074', '#b08c76']], [525.2, ['#4a5664', '#66707c', '#8a8a8a', '#9a948c']], [532.8, ['#140808', '#2a0e0a', '#5a1a10', '#8a2a14']], [542.6, ['#140808', '#2a0e0a', '#5a1a10', '#8a2a14']], [544, ['#6a9ac8', '#a8c4d8', '#e4e8e0', '#f0ead8']], [548.4, ['#6a9ac8', '#a8c4d8', '#e4e8e0', '#f0ead8']], [550, ['#5a5854', '#6e6a64', '#8a847a', '#9a948a']], [561.4, ['#5a5854', '#6e6a64', '#8a847a', '#9a948a']], [564, ['#7a7a9a', '#b0a0b0', '#e8c8c0', '#f4dccc']]);
AMB.push([511.6, [200, 180, 172]], [525.2, [200, 200, 204]], [532.8, [140, 70, 50]], [542.6, [140, 70, 50]], [544, W_], [548.4, W_], [550, [190, 186, 180]], [561.4, [190, 186, 180]], [564, [244, 232, 232]]);
GRADE.push([511.6, [200, 100, 80, 0.22]], [525.2, [150, 160, 175, 0.2]], [532.8, [255, 80, 30, 0.3]], [544, [220, 230, 240, 0.06]], [550, [150, 150, 150, 0.3]], [564, [255, 210, 210, 0.08]]);
NIGHTS.push([532.6, 543.8]);
ERAS.push(
  [511.6, 525.4, LOOK(['#4e464c', '#6e6062', '#9a8074', '#b08c76'], [200, 180, 172], [200, 100, 80, 0.22], { motes: 0.3, mote: [255, 190, 170] })],   // empire: a harsh, reddened grey
  [525.4, 532.8, LOOK(['#4a5664', '#66707c', '#8a8a8a', '#9a948c'], [200, 200, 204], [150, 160, 175, 0.2], { motes: 0.1 })],                          // the Pacific: steel
  [532.8, 543.6, LOOK(['#140808', '#2a0e0a', '#5a1a10', '#8a2a14'], [140, 70, 50], [255, 80, 30, 0.3], { motes: 0.4, mote: [255, 120, 60] })],       // Tokyo burns
  [543.6, 548.4, LOOK(['#6a9ac8', '#a8c4d8', '#e4e8e0', '#f0ead8'], [255, 252, 246], [220, 230, 240, 0.06], { motes: 0.2 })],                         // an ordinary summer morning
  [548.4, 562.2, LOOK(['#5a5854', '#6e6a64', '#8a847a', '#9a948a'], [190, 186, 180], [150, 150, 150, 0.3], { motes: 0 })],                             // ashes
  [562.2, 575, LOOK(['#7a7a9a', '#b0a0b0', '#e8c8c0', '#f4dccc'], [244, 232, 232], [255, 210, 210, 0.08], { motes: 0.4, mote: [255, 230, 230] })],   // dawn, and paper cranes
);
WX.push(['dust', 512, 525, [150, 130, 120]], ['embers', 534.4, 543.4, null, 1.6], ['ash', 535, 543.4, [90, 70, 60], 0.6], ['ash', 549.4, 570.6, [140, 136, 130], 1]);
ZOOM.push([544.6, 546.6, 553, 555.5, 0.12], [564, 566, 571.6, 573.6, 0.16]);

// ---- the empire spreads
const T_KOR = ev('korea', 514.4), T_CHI = ev('invaded', 517.2), T_ASIA = ev('acrossasia', 520.0), T_DIED = ev('millions', 523.6);
for (let i = 0; i < 5; i++) add('person', 'main', 1440 + i * 2.4, { v: 'soldier', z: 2 + (i % 2) * 0.1, scale: P2, popAt: 512.6 + i * 0.2, foldAt: 527 + i * 0.1, pace: 5.4, move: (t) => clamp((t - 513 - i * 0.2) * 0.5, 0, 4), act: (t) => (t > 521 + i * 0.2 ? { walk: undefined, head: -2 } : {}) });
for (let i = 0; i < 14; i++) add('person', 'mid', 1452 + i * 1.6, { v: ['civilian', 'civilian2', 'civilianKid'][i % 3], scale: 0.62, popAt: 518 + i * 0.05, foldAt: T_DIED - 1.8 + i * 0.22 });
for (const [a, v, s] of [[1446, 1, 0.5], [1470, 4, 0.55]]) add('jmount', 'far', a, { v, scale: s });
grassRun(1436, 1472, 4.6, 'main');

// ---- Pearl Harbor
const T_PH = ev('pearlharbor', 528.6);
add('battleship', 'main', 1484.6, { v: 1, z: 0.8, scale: 0.8, y: 2, popAt: 526, rot: (t) => sramp(t, T_PH + 1, T_PH + 3) * -6 });
for (let a = 1474; a < 1492; a += 3.2) add('wave', 'front', a, { v: (R() * 4) | 0, scale: 1.3 });

// ---- Tokyo burns
const T_BOMB = ev('bombers', 535.0), T_NIGHT = ev('onenight', 538.0), BURN = [[1496, 0], [1500.4, 1], [1504.8, 0], [1509.2, 1], [1513.4, 0]];
BURN.forEach(([a, v], i) => add('machiya', 'main', a, { v, z: 0.4, scale: 0.85, popAt: 532.6 + i * 0.1, foldAt: 543.4 + i * 0.1, burn: (t) => sramp(t, 536 + i * 0.5, 539 + i * 0.5), winOn: () => 0 }));

// ---- Hiroshima
const T_FLASH = ev('flash', 548.2), T_NAGA = ev('nagasakiflash', 550.6);
add('promohall', 'main', 1527, { v: 0, z: 0.4, scale: 0.78, popAt: 543.6, foldAt: T_FLASH + 0.3, loud: 1.6 });
add('promohall', 'main', 1527, { v: 1, z: 0.4, scale: 0.78, popAt: T_FLASH + 0.9, loud: 0.4 });
for (const [a, v] of [[1519.6, 1], [1534.2, 0]]) add('machiya', 'main', a, { v, z: 0.3, scale: 0.8, popAt: 543.8, foldAt: T_FLASH + 0.2 });
add('person', 'main', 1522.6, { v: 'civilianKid', z: 2, scale: P2, popAt: 544.2, foldAt: T_FLASH + 0.15 });
add('person', 'main', 1531, { v: 'civilian2', z: 2, scale: P2, popAt: 544.3, foldAt: T_FLASH + 0.15 });

// ---- surrender: the radio
const T_SUR = ev('surrendered', 557.0);
add('radioset', 'main', 1547.6, { z: 1.4, scale: 1.1, popAt: 554.8 });
[[1543.6, 'civilian'], [1545.6, 'civilian2'], [1550, 'civilianKid'], [1552, 'civilian']].forEach(([a, v], i) => add('person', 'main', a, { v, z: 2 + i * 0.1, scale: P2, flip: a > 1548, popAt: 555 + i * 0.12, foldAt: 563 + i * 0.1, act: (t) => ({ head: 10 + sramp(t, T_SUR, T_SUR + 1) * 16, lean: 4 + sramp(t, T_SUR, T_SUR + 1) * 6 }) }));
grassRun(1516, 1560, 5, 'main', { skip: (a) => a > 1518 && a < 1554 });

// ---- Sadako and the cranes
const T_SAD = ev('sadako', 565.4), T_CRANES = ev('cranes', 569.4), T_PEACE = ev('wishpeace', 572.4);
add('hospital', 'main', 1567.6, { z: 0.3, scale: 0.9, popAt: 562.6, loud: 1.2, cranes: (t) => sramp(t, T_SAD, T_CRANES + 1.2) * 14 * (1 - sramp(t, T_PEACE, T_PEACE + 1.2)) });
add('person', 'main', 1565.4, { v: 'sadako', z: 0.5, scale: P2 * 0.85, y: 46, popAt: T_SAD - 1.4, act: (t) => ({ head: t > T_PEACE ? -24 : 14, lean: 6, front: [-60 + Math.sin(t * 3) * 8, -60], back: [-50 + Math.sin(t * 3 + 1) * 8, -60] }) });
add('person', 'main', 1572.4, { v: 'sadakoMother', z: 0.45, scale: P2 * 0.9, y: 6, flip: true, popAt: T_SAD - 0.6, act: (t) => ({ head: t > T_PEACE ? -18 : 6, lean: 4 }) });
grassRun(1560, 1580, 4.4, 'main', { skip: (a) => a > 1562 && a < 1574 });
grassRun(1436, 1580, 7, 'front', { s: 2, skip: (a) => a > 1474 && a < 1492 });

const CRANE_COL = ['#e85a6a', '#f0a040', '#5aa0d8', '#7ac070', '#c070c0', '#f0d050', '#f2eee4'];
hook({
  lights(t, c, L, Em, Sm) {
    if (near(1460, c, 60) && t > 517 && t < 527) for (const a of [1452, 1462, 1474]) Sm.push({ a, layer: 'mid', h: 30, t0: 517, t1: 526, size: 1.4, life: 6, every: 0.5, rise: 240, drift: 4, alpha: 0.45 });
    if (near(1484, c, 50) && t > T_PH) { const k = sramp(t, T_PH, T_PH + 0.8); L.push({ a: 1484.6, h: 60, r: 500, k: 0.9 * k * flick(t, 41), color: [255, 130, 60] }); Em.push({ a: 1484, h: 70, scale: 0.8, lit: k, litAt: T_PH, seed: 41 }); Sm.push({ a: 1484.6, layer: 'main', h: 90, t0: T_PH, size: 1.5, life: 6, every: 0.35, rise: 240, drift: 5, alpha: 0.6 }); }
    if (near(1504, c, 60) && t > 535.8 && t < 545) BURN.forEach(([a], i) => { const k = sramp(t, 536 + i * 0.5, 537 + i * 0.5) * (1 - sramp(t, 543, 544.4)); if (k < 0.01) return; L.push({ a, h: 110, r: 640, k: 1.2 * k * flick(t, 50 + i), color: [255, 100, 40] }); Em.push({ a: a + (i % 2 ? 0.8 : -0.8), h: 90, scale: 1.2, lit: k, litAt: 536 + i * 0.5, seed: 50 + i }); Sm.push({ a, layer: 'main', h: 170, t0: 536 + i * 0.5, t1: 543.4, size: 1.6, life: 6, every: 0.35, rise: 260, drift: 4, alpha: 0.6 }); });
  },
  sky(g, st, t) {
    const { W, H } = st, u = st.eu;
    // planes: fighters crossing towards the Pacific; then the bombers, high over Tokyo; then one plane over Hiroshima
    const fly = (sp, n, t0, t1, yf, s, dir) => { if (t < t0 || t > t1) return; const k = (t - t0) / (t1 - t0); for (let i = 0; i < n; i++) { const x = W * (dir > 0 ? lerp(-0.15, 1.15, k - i * 0.04) : lerp(1.15, -0.15, k - i * 0.04)), y = H * (yf + (i % 3) * 0.03) + Math.sin(t * 2 + i) * 2 * u; g.save(); g.translate(x, y); g.scale(dir * u * s, u * s); put(g, st.fx[sp], 0); g.restore(); } };
    fly('zero', 7, T_PH - 2, T_PH + 3.2, 0.14, 0.9, 1);
    fly('b29', 5, T_BOMB - 0.6, T_BOMB + 6.4, 0.08, 0.8, -1);
    fly('b29', 1, 545.4, T_FLASH - 0.1, 0.06, 0.45, 1);
  },
  over(g, st, t) {
    const { W, H } = st, u = st.eu, p = por(st);
    // the map: red spreading across Asia
    if (t > T_KOR - 1.4 && t < 527) { const k = drop(t, T_KOR - 1.2, 525.4), x = W * (p ? 0.5 : 0.25), y = H * lerp(-0.4, p ? 0.06 : 0.08, k), s = p ? 0.62 : 0.8; card(st, g, x, y + 110 * u * s, s, Math.sin(t * 0.5) * DEG, (g2) => { put(g2, st.fx.plancard, 0.3, 4, 6); eastAsiaMap(g2, { korea: sramp(t, T_KOR, T_KOR + 0.8), manchuria: sramp(t, T_CHI - 1, T_CHI), china: sramp(t, T_CHI, T_CHI + 1.4), asia: sramp(t, T_ASIA, T_ASIA + 1.6) }); }, 1, 130); }
    // incendiaries falling through the night
    if (t > T_BOMB && t < 541) { const k = sramp(t, T_BOMB, T_BOMB + 0.6) * (1 - sramp(t, 540, 541)); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 40; i++) { const ph = (t * (0.5 + hash(i) * 0.3) + hash(i * 3)) % 1, x = W * (0.1 + hash(i * 7) * 0.8) - ph * 30 * u, y = H * (0.12 + ph * 0.6); g.strokeStyle = `rgba(255,170,80,${0.6 * k * (1 - ph * 0.5)})`; g.lineWidth = Math.max(1, 1.4 * u); g.beginPath(); g.moveTo(x, y); g.lineTo(x + 6 * u, y - 24 * u); g.stroke(); } g.globalCompositeOperation = 'source-over'; }
    // the flash
    const f1 = Math.exp(-Math.max(0, t - T_FLASH) * 1.4) * (t > T_FLASH - 0.05 ? 1 : 0), f2 = Math.exp(-Math.max(0, t - T_NAGA) * 1.8) * (t > T_NAGA - 0.05 ? 1 : 0) * 0.45;
    if (f1 > 0.01) { g.fillStyle = `rgba(255,252,246,${Math.min(1, f1 * 1.1)})`; g.fillRect(0, 0, W, H); }
    if (f2 > 0.01) { const x = W * 0.12, y = st.hy; g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(x, y, 0, x, y, W * 0.4); gr.addColorStop(0, `rgba(255,250,240,${f2})`); gr.addColorStop(1, 'rgba(255,250,240,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over'; }
    // the cranes lift into the dawn: a wish for peace
    if (t > T_PEACE - 0.2 && t < 580) {
      const n = p ? 60 : 110, [x0, y0] = st.place('main', 1567.6, 150, t);
      for (let i = 0; i < n; i++) {
        const t0 = T_PEACE + hash(i * 3) * 2.6, k = (t - t0) / 5.4; if (k < 0 || k > 1) continue;
        const sx = x0 + (hash(i * 5) - 0.5) * 160 * u, x = sx + (hash(i * 7) - 0.3) * W * 0.9 * k + Math.sin(t * 1.4 + i) * 14 * u, y = y0 - k * H * (0.8 + hash(i) * 0.4), flap = Math.sin(t * 6 + i * 2), s = (5 + hash(i * 9) * 4) * Math.max(u, Math.min(W, H) / 820);
        g.save(); g.translate(x, y); g.rotate(-0.3 + Math.sin(t + i) * 0.2); g.globalAlpha = Math.min(1, (1 - k) * 2.4); g.fillStyle = CRANE_COL[i % CRANE_COL.length];
        g.beginPath(); g.moveTo(-s * 1.4, 0); g.lineTo(0, -s * (0.4 + 0.8 * Math.abs(flap))); g.lineTo(s * 1.4, -s * 0.2); g.lineTo(s * 0.2, s * 0.4); g.closePath(); g.fill();
        g.fillStyle = 'rgba(0,0,0,.12)'; g.beginPath(); g.moveTo(0, -s * (0.4 + 0.8 * Math.abs(flap))); g.lineTo(s * 0.2, s * 0.4); g.lineTo(-s * 0.4, 0); g.fill(); g.restore();
      }
    }
  },
});
