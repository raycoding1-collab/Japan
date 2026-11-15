// 5. The Great Buddha. Nara's deer; the bronze Buddha cast inside scaffolding while people carry their
// bronze to the furnace; then the eye-opening: a monk with a great brush high beside the face, and cords
// of five colours running from the brush down into the hands of the crowd. The eyes are painted in,
// the Buddha shines, and paper lotus petals fall.
import { add, hook, grassRun, ev, near, flick, por, PS, P2, R, CAM, ZONES, BUMPS, SKY, AMB, GRADE, ERAS, WX, ZOOM, PAPER_SUN, LOOK, W_, PAL } from './film_api.js';
import { LOOKS } from './people.js';
import { clamp, sramp, lerp, hash, DEG } from './util.js';

Object.assign(LOOKS, {
  naraCarrier: { skin: 4, top: 'tunic', topCol: '#c8b894', legs: 'trousers', legCol: '#8a7a5a', hair: 'mizura', pose: 'walk', item: 'mirror', obi: '#6a4a30' },
  naraCarrier2: { skin: 3, top: 'dress', topCol: '#b8a07a', legs: 'skirt', legCol: '#8a6a4a', hair: 'bun', pose: 'walk', item: 'bowl', obi: '#6a4a30' },
  naraCarrier3: { skin: 5, top: 'tunic', topCol: '#a89878', legs: 'trousers', legCol: '#6a5a40', hair: 'mizura', pose: 'walk', item: 'bundle', obi: '#4a3a2a' },
  caster: { skin: 1, top: 'bare', wrap: '#8a6a48', hair: 'bun', pose: 'stand' },
  bodhisena: { skin: 1, top: 'robe', topCol: '#c87a30', legs: 'robe', legCol: '#a85e28', sleeve: '#c87a30', hair: 'bald', pose: 'stand', collar: '#e8c060' },
  crowdMonk: { skin: 4, top: 'robe', topCol: '#6a4a36', legs: 'robe', legCol: '#5a3e2c', sleeve: '#6a4a36', hair: 'bald', pose: 'stand', collar: '#c9a24a' },
  crowdNoble: { skin: 6, top: 'robe', topCol: '#7a2e3a', legs: 'robe', legCol: '#5a2230', sleeve: '#7a2e3a', hat: 'kanmuri', hatCol: '#1e1a1c', pose: 'stand', collar: '#e8dcc0' },
  crowdNoble2: { skin: 6, top: 'robe', topCol: '#2e4a6a', legs: 'robe', legCol: '#243a54', sleeve: '#2e4a6a', hat: 'kanmuri', hatCol: '#1e1a1c', pose: 'stand', collar: '#e8dcc0' },
  crowdWoman: { skin: 6, top: 'robe', topCol: '#c8604a', legs: 'robe', legCol: '#e8dcc0', sleeve: '#c8604a', hair: 'bun', pose: 'stand', obi: '#3a6a5a' },
  crowdFolk: { skin: 4, top: 'tunic', topCol: '#c8b894', legs: 'trousers', legCol: '#8a7a5a', hair: 'mizura', pose: 'stand', obi: '#6a4a30' },
});

CAM.push([171, 458], [173.5, 466], [176, 472], [178.5, 476], [181, 479], [183.5, 481], [186, 484], [188.5, 486], [190.1, 492]);
ZONES.push([452, 520, [168, 144, 100]]);
BUMPS.far.push([450, 520, 40, 10, 26]);
SKY.push([169, PAL.DAY], [190, PAL.DAY]); AMB.push([169, W_]); GRADE.push([169, [255, 210, 160, 0.1]]);
ERAS.push(
  [169.4, 180.6, LOOK(['#7c8aa4', '#b0aaa4', '#e4c69a', '#eeb878'], [255, 230, 200], [255, 175, 110, 0.18], { rays: 0.6, motes: 1.2, mote: [255, 210, 160] })], // the casting: amber, smoky
  [180.6, 190.8, LOOK(['#7a90b8', '#c0bcc0', '#f4dcb0', '#f8cc8a'], [255, 244, 222], [255, 205, 140, 0.16], { rays: 1, motes: 1.4, mote: [255, 236, 190] })], // the eye-opening: gold
);
WX.push(['dust', 170.4, 180.4, [214, 196, 170]], ['petals', 188.4, 194.6, null, 1]);
PAPER_SUN.push([180.6, 190.4]);
ZOOM.push([170, 173, 189.4, 191.4, -0.16]);

const T_NARA = ev('nara', 171.0), T_BRONZE2 = ev('bronzeall', 177.4), T_BRUSH = ev('brush', 182.8), T_CORDS = ev('cords', 184.2), T_THOU = ev('thousands', 186.0), T_PAINT = ev('paint', 188.2);
const BUD = 478.4, BS = 0.86, EYE = [BUD + (29 * BS) / 17.45, 383 * BS], PLAT = 486.6, PLAT_H = 280 * 0.94;

// ---- Nara: a deer bows
add('deer', 'main', 455.6, { v: 0, z: 2, scale: 1.0, popAt: T_NARA - 0.8, graze: (t) => { const b = Math.exp(-(((t - T_NARA - 0.6) / 0.35) ** 2)); return 0.15 + b * 0.9; } });
add('deer', 'main', 458.6, { v: 1, z: 1.6, scale: 0.9, flip: true, popAt: T_NARA - 0.5 });
// ---- the casting
add('daibutsu', 'main', BUD, { z: 0, scale: BS, popAt: ev('buddha', 172.8), loud: 3, wide: 12, eyes: (t) => sramp(t, T_PAINT, T_PAINT + 0.8), shine: (t) => sramp(t, T_PAINT + 0.4, T_PAINT + 1.6) });
for (const [a, i] of [[471.4, 0], [485.4, 1]]) add('scaffold', 'main', a, { v: 1, z: 0.4, scale: 0.94, popAt: ev('buddha', 172.8) - 0.4 + i * 0.2, foldAt: 179.6 + i * 0.2, loud: 1.4 });
add('foundry', 'main', 465.2, { z: 1, scale: 1.2, popAt: 174.6, foldAt: 180.8, loud: 1.4, pour: (t) => sramp(t, T_BRONZE2 - 0.6, T_BRONZE2) * (1 - sramp(t, T_BRONZE2 + 2.4, T_BRONZE2 + 3.2)) });
add('person', 'main', 464.6, { v: 'caster', z: 0.6, scale: P2, popAt: 174.9, foldAt: 180.8, act: (t) => ({ lean: 14, head: 8, front: [-100 + Math.sin(t * 2.4) * 12, -30], back: [-90 + Math.sin(t * 2.4) * 12, -30] }) });
[['naraCarrier', 456.4], ['naraCarrier2', 454.2], ['naraCarrier3', 452]].forEach(([v, a], i) => add('person', 'main', a, { v, z: 2.2 + i * 0.1, scale: P2, popAt: T_BRONZE2 - 1.6 + i * 0.25, foldAt: 181.2, pace: 4.4, move: (t) => clamp((t - T_BRONZE2 + 1.2 - i * 0.2) * 0.7, 0, 5.4 - i * 0.5), act: (t) => (t > T_BRONZE2 + 6.4 - i * 0.6 ? { walk: undefined, front: [-80, -40] } : { front: [-80, -40] }) }));
// ---- the eye-opening
add('scaffold', 'main', PLAT, { v: 0, z: 0.5, scale: 0.94, popAt: 180.2, loud: 1.4 });
add('person', 'main', PLAT - 0.4, { v: 'bodhisena', z: 0.6, scale: P2, y: PLAT_H, popAt: 180.8, flip: true, act: (t) => ({ lean: 8, head: -6, front: [-130 + Math.sin(t * 0.8) * 3, -10], back: [-120, -14] }) });
const CROWD = [];
for (let i = 0; i < 10; i++) { const a = 489.6 + i * 1.45, v = ['crowdMonk', 'crowdNoble', 'crowdWoman', 'crowdFolk', 'crowdNoble2'][i % 5]; CROWD.push(['main', a]); add('person', 'main', a, { v, z: 2 + (i % 2) * 0.4, scale: P2 * 0.95, flip: true, popAt: T_CORDS - 0.4 + i * 0.12, act: (t) => { const k = sramp(t, T_THOU + 1.6, T_THOU + 2.2); return { head: -18, lean: -2 - k * 4, front: [-150 - k * 10, -20], back: [-20 - k * 120, -10] }; } }); }
for (let i = 0; i < 14; i++) { const a = 487 + i * 2.2, v = ['crowdFolk', 'crowdMonk', 'crowdWoman', 'crowdNoble'][i % 4]; CROWD.push(['mid', a]); add('person', 'mid', a, { v, scale: 0.62, flip: true, popAt: T_THOU - 0.4 + i * 0.08, act: () => ({ head: -16, front: [-150, -20] }) }); }
for (const a of [470, 500, 510]) add('gojunoto', 'mid', a, { v: 1, scale: 0.42 });
for (const [a, v, s] of [[462, 1, 0.55], [496, 4, 0.6], [516, 1, 0.5]]) add('jmount', 'far', a, { v, scale: s });
grassRun(450, 470, 3.8, 'main'); grassRun(450, 520, 7, 'front', { s: 2 });

const CORD_COL = ['#3a6ab8', '#e0b030', '#c8302a', '#f2ece0', '#7a3a8a'];
hook({
  lights(t, c, L, Em, Sm) {
    if (near(468, c, 50) && t > 174 && t < 181) {
      const k = sramp(t, 174.8, 175.6) * (1 - sramp(t, 180, 180.8));
      L.push({ a: 465.2 - 4.4, h: 28, r: 700, k: 1.1 * k * flick(t, 2), color: [255, 150, 70] });
      Em.push({ a: 465.2 - 4.4, h: 18, scale: 0.4, small: 1, lit: k, litAt: 174.8, seed: 8 });
      Sm.push({ a: 465.2 - 4.4, layer: 'main', h: 150, t0: 175, t1: 180.4, size: 1.1, life: 5, every: 0.45, rise: 170, drift: 3.5, alpha: 0.4 });
      const p = sramp(t, T_BRONZE2 - 0.4, T_BRONZE2) * (1 - sramp(t, T_BRONZE2 + 2.4, T_BRONZE2 + 3.2)); if (p > 0) L.push({ a: BUD - 4, h: 60, r: 600, k: 1.2 * p, color: [255, 190, 90] });
    }
    if (near(BUD, c, 60) && t > T_PAINT) L.push({ a: BUD, h: 330, r: 1200, k: 0.9 * sramp(t, T_PAINT + 0.3, T_PAINT + 1.6), color: [255, 214, 140] });
    if (near(BUD, c, 60) && t > 180.6) for (const s of [-1, 1]) Sm.push({ a: BUD + s * 7.5, layer: 'main', h: 40, t0: 180.6, size: 0.5, life: 6, every: 0.7, rise: 200, drift: 1.5, alpha: 0.2 });
  },
  over(g, st, t) {
    if (t < T_BRUSH - 0.4 || t > 192) return;
    const u = st.eu;
    // the brush, held high by the monk, reaching to the eye
    const [hx, hy] = st.place('main', PLAT - 0.4 - 1.0, PLAT_H + 104, t), [ex, ey] = st.place('main', EYE[0] + 0.3, EYE[1] - 2, t), k = sramp(t, T_BRUSH, T_BRUSH + 1);
    const paint = Math.exp(-(((t - T_PAINT - 0.3) / 0.45) ** 2)), bx = lerp(hx, ex, k * (0.94 + 0.06 * paint)), by = lerp(hy, ey, k * (0.94 + 0.06 * paint));
    if (k > 0.01) {
      g.lineCap = 'round'; g.strokeStyle = '#6a4a2a'; g.lineWidth = Math.max(2, 6 * u); g.beginPath(); g.moveTo(hx, hy); g.lineTo(bx, by); g.stroke();
      const ang = Math.atan2(by - hy, bx - hx); g.save(); g.translate(bx, by); g.rotate(ang); g.fillStyle = '#e8dcc0'; g.beginPath(); g.moveTo(-4 * u, -6 * u); g.quadraticCurveTo(14 * u, -5 * u, 22 * u, 0); g.quadraticCurveTo(14 * u, 5 * u, -4 * u, 6 * u); g.fill(); g.fillStyle = '#1c1612'; g.beginPath(); g.moveTo(12 * u, -3.4 * u); g.quadraticCurveTo(20 * u, -2 * u, 22 * u, 0); g.quadraticCurveTo(20 * u, 2 * u, 12 * u, 3.4 * u); g.fill(); g.restore();
    }
    // the cords, from the brush down into many hands
    const ck = sramp(t, T_CORDS, T_CORDS + 1.4);
    if (ck > 0.01) CROWD.forEach(([layer, a], i) => {
      const pop = sramp(t, (layer === 'main' ? T_CORDS - 0.2 : T_THOU - 0.2) + i * 0.06, (layer === 'main' ? T_CORDS + 0.4 : T_THOU + 0.4) + i * 0.06); if (pop < 0.01) return;
      const [x1, y1] = st.place(layer, a - (layer === 'main' ? 0.9 : 0.5), layer === 'main' ? 118 : 70, t), mx = lerp(hx, x1, 0.5), my = Math.max(hy, y1) + 30 * u, f = ck * pop;
      g.strokeStyle = CORD_COL[i % 5]; g.globalAlpha = 0.9; g.lineWidth = Math.max(1, (layer === 'main' ? 1.8 : 1.1) * u); g.beginPath(); g.moveTo(hx, hy);
      for (let s = 1; s <= 16; s++) { const q = (s / 16) * f, x = (1 - q) * (1 - q) * hx + 2 * (1 - q) * q * mx + q * q * x1, y = (1 - q) * (1 - q) * hy + 2 * (1 - q) * q * my + q * q * y1; g.lineTo(x, y + Math.sin(t * 1.4 + i + s) * 0.8 * u); } g.stroke(); g.globalAlpha = 1;
    });
    // a flash where the brush touches
    if (paint > 0.05) { g.globalCompositeOperation = 'lighter'; st.stamp(g, st.dot(255, 230, 170, '255,252,240'), ex, ey, 40 * u, 0.8 * paint); g.globalCompositeOperation = 'source-over'; }
  },
});
