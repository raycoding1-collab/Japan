// 2. Rice and mirrors. A boat brings rice, bronze and iron across the sea; flooded paddies, a bronze
// bell; a moated village with watchtowers and granaries on stilts; Queen Himiko behind her blind at dusk;
// and the emperor of Wei's hundred bronze mirrors, flashing in the low sun, around a golden seal.
import { add, hook, grassRun, ev, drop, near, flick, win, card, por, PS, P2, R, CAM, ZONES, SEAS, BUMPS, SKY, AMB, GRADE, ERAS, WX, SUNS, ZOOM, FLOCKS, PAPER_SUN, LOOK, W_, PAL } from './film_api.js';
import { LOOKS } from './people.js';
import { clamp, sramp, lerp, hash, fbm, DEG } from './util.js';
import { put } from './paper.js';

const HEMP = '#e4d8bc';
Object.assign(LOOKS, {
  yayoiRower: { skin: 3, top: 'bare', wrap: '#d8c8a4', hair: 'mizura', pose: 'kneel', item: 'paddle' },
  yayoiRower2: { skin: 5, top: 'bare', wrap: '#c8b890', hair: 'mizura', pose: 'kneel', item: 'paddle' },
  yayoiFarmer: { skin: 3, top: 'tunic', topCol: HEMP, legs: 'skin', hair: 'mizura', pose: 'stand', obi: '#8a6a44' },
  yayoiFarmer2: { skin: 4, top: 'dress', topCol: '#d8ccb0', legs: 'skirt', legCol: '#c8b894', hair: 'bun', pose: 'stand', obi: '#6a7a8a' },
  yayoiReaper: { skin: 3, top: 'tunic', topCol: '#c8b894', hair: 'mizura', pose: 'stand', item: 'sickle', obi: '#5a4a3a' },
  yayoiDigger: { skin: 5, top: 'bare', wrap: '#b8a47e', hair: 'mizura', pose: 'stand', item: 'shovel' },
  yayoiGuard: { skin: 3, top: 'tunic', topCol: '#b8a47e', hair: 'mizura', pose: 'stand', item: 'spear', obi: '#6a4a30' },
  yayoiCarrier: { skin: 4, top: 'dress', topCol: HEMP, pattern: 'stripe', legs: 'skirt', legCol: '#b8a882', hair: 'bun', pose: 'walk', item: 'bundle' },
  himikoAtt: { skin: 6, top: 'robe', topCol: '#f0e8d8', legs: 'robe', legCol: '#f0e8d8', sleeve: '#f0e8d8', hair: 'long', pose: 'kneel', obi: '#b8282e' },
  himikoAtt2: { skin: 6, top: 'robe', topCol: '#ece2cc', legs: 'robe', legCol: '#ece2cc', sleeve: '#ece2cc', hair: 'bun', pose: 'kneel', obi: '#a8282a' },
  foodBearer: { skin: 3, top: 'tunic', topCol: '#d8ccb0', hair: 'mizura', pose: 'walk', item: 'bowl', obi: '#6a4a30' },
  priestess: { skin: 6, top: 'robe', topCol: '#f4ece0', legs: 'robe', legCol: '#b8282e', sleeve: '#f4ece0', hair: 'long', pose: 'stand', item: 'mirror' },
});

CAM.push([48, 117], [50.5, 128], [52.5, 138], [55, 151], [57, 162], [59.5, 171], [61.6, 180], [63.5, 190], [66, 196], [69, 200], [72, 203], [75, 206], [77.6, 222]);
ZONES.push([120.6, 131, [46, 92, 124]], [133.5, 154, [96, 116, 72]], [156, 187, [150, 130, 88]], [189, 216, [168, 140, 96]]);
SEAS.push([120.5, 131]);
BUMPS.mid.push([150, 190, 14, 6, 6], [186, 220, 24, 8, 12]);
BUMPS.far.push([120, 220, 26, 10, 26]);

SKY.push([46.6, ['#78a8d8', '#a8c8e0', '#e4ecdc', '#f4ecd0']], [61, PAL.DAY]);
AMB.push([46.6, W_]); GRADE.push([46.6, [255, 220, 180, 0.08]]);
ERAS.push(
  [46.8, 54.2, LOOK(['#78a8d8', '#a8c8e0', '#e4ecdc', '#f4ecd0'], [255, 252, 240], [235, 245, 220, 0.06], { motes: 0.4, mote: [240, 255, 230] })],   // a spring morning: rice planting
  [54.2, 61.8, LOOK(['#6898cc', '#9cbcd8', '#e0e4d8', '#f0e4c4'], [255, 248, 232], [255, 225, 180, 0.08], { motes: 0.5 })],                            // the moated village at midday
  [61.8, 70.6, LOOK(['#3a2c58', '#6a4a78', '#c4708a', '#f0a874'], [214, 170, 190], [210, 120, 180, 0.16], { motes: 0.9, mote: [255, 190, 220] })],    // Himiko: a violet dusk, incense
  [70.6, 77.8, LOOK(['#5a7ab0', '#a0a8b8', '#f0c890', '#f8b866'], [255, 232, 196], [255, 180, 100, 0.16], { rays: 1, motes: 1.1, mote: [255, 220, 160] })], // the mirrors: a gold low sun
);
WX.push(['mist', 62.4, 71, [200, 150, 200], 0.24]);
PAPER_SUN.push([70.6, 77.6]);
ZOOM.push([63, 65, 69.5, 71.5, 0.2]);

// ---- rice across the sea
const T_BRONZE = ev('bronze', 52.0), T_IRON = ev('iron', 52.9);
add('yboat', 'main', 113, { v: 0, z: 1, scale: 0.95, y: 2, popAt: 46.2, move: (t) => clamp((t - 46.6) * 2.5, 0, 12.4), stroke: (t) => 1 - sramp(t, 51, 51.8) });
for (let a = 118; a < 131; a += 3.2) add('wave', 'front', a, { v: (R() * 4) | 0, scale: 1.25 + R() * 0.3 });
for (let a = 122; a < 130.5; a += 4) add('wave', 'main', a, { v: (R() * 4) | 0, z: 0.4, scale: 0.7, y: -2 });
add('person', 'main', 132.4, { v: 'yayoiFarmer', z: 2, scale: P2, flip: true, popAt: 50.4, act: (t) => ({ head: -6, front: [-60 + Math.sin(t * 1.4) * 8, -30] }) });
[135.4, 137.8, 140.2, 142.6, 145, 147.4, 149.8, 152.2].forEach((a, i) => add('rice', 'main', a, { v: i % 3, z: 1, scale: 1.25, popAt: 49.8 + i * 0.16, loud: 0.5, ground: true }));
add('person', 'main', 139, { v: 'yayoiFarmer2', z: 2, scale: P2, popAt: 50.6, act: (t) => ({ lean: 34 + Math.sin(t * 1.6) * 4, head: 10, front: [-30 + Math.sin(t * 3.2) * 18, -10], back: [-20 + Math.sin(t * 3.2 + 1.5) * 16, -14] }) });
add('person', 'main', 145.6, { v: 'yayoiFarmer', z: 2.2, scale: P2, flip: true, popAt: 51.0, act: (t) => ({ lean: 30 + Math.sin(t * 1.5 + 1) * 4, head: 12, front: [-34 + Math.sin(t * 3 + 1) * 16, -10], back: [-24, -14] }) });
add('dotaku', 'main', 148.6, { z: 1.4, scale: 0.85, popAt: T_BRONZE, loud: 1.2, ring: (t) => sramp(t, T_BRONZE + 0.3, T_BRONZE + 0.8) * (1 - sramp(t, T_BRONZE + 3, T_BRONZE + 6)) });
add('person', 'main', 152.2, { v: 'yayoiReaper', z: 2, scale: P2, popAt: T_IRON, act: (t) => ({ lean: 22, head: 14, front: [-50 + Math.sin(t * 4) * 22, -30] }) });
for (const [a, v] of [[128, 1], [143, 0], [156, 4]]) add('jmount', 'far', a, { v, scale: 0.55 });
add('sugi', 'mid', 134, { v: 1, scale: 0.5 }); add('kuri', 'mid', 150, { v: 1, scale: 0.5 });
grassRun(131, 156, 5, 'front', { s: 2 });

// ---- the moated village: Yoshinogari
const T_MOAT = ev('moat', 55.8), T_TOWER = ev('towers', 57.0), T_GRAN = ev('granary', 59.2);
add('person', 'main', 155.2, { v: 'yayoiDigger', z: 2.4, scale: P2, popAt: T_MOAT - 0.4, act: (t) => { const k = Math.max(0, Math.sin(t * 3)); return { lean: 16 + k * 16, front: [-60 + k * 40, -20], back: [-40 + k * 30, -20] }; } });
for (const [a, i] of [[159.6, 0], [161.9, 1], [179.6, 2], [181.9, 3]]) add('palisade', 'main', a, { v: i, z: 3, scale: 0.9, popAt: T_MOAT + 0.3 + i * 0.12, loud: 0.8 });
add('yagura', 'main', 163.6, { z: 0.6, scale: 0.9, popAt: T_TOWER, loud: 1.4 });
add('person', 'main', 163.6, { v: 'yayoiGuard', z: 0.7, scale: 0.9, y: 218, popAt: T_TOWER + 0.4, act: (t) => ({ head: -6 + Math.sin(t * 0.4) * 10 }) });
add('yagura', 'main', 180.6, { z: 0.6, scale: 0.82, popAt: T_TOWER + 0.4, loud: 1.2 });
add('granary', 'main', 170.2, { v: 0, z: 0.8, popAt: T_GRAN, loud: 1.2 });
add('granary', 'main', 175.4, { v: 1, z: 0.7, popAt: T_GRAN + 0.35, loud: 1.2 });
add('person', 'main', 166.2, { v: 'yayoiCarrier', z: 2, scale: P2, popAt: T_GRAN - 0.6, pace: 4.6, move: (t) => clamp((t - T_GRAN + 0.2) * 0.42, 0, 1.6), act: (t) => (t > T_GRAN + 3.6 ? { walk: undefined, head: -10 } : {}) });
for (const [a, v] of [[158, 0], [166, 2], [171, 1], [178, 0], [184, 2]]) add('pitdwelling', 'mid', a, { v, scale: 0.5 });
add('granary', 'mid', 175, { v: 0, scale: 0.5 });
grassRun(154, 188, 3.6, 'main', { skip: (a) => a > 158 && a < 183 });
grassRun(150, 190, 7, 'front', { s: 2 });

// ---- Himiko
const T_CHRON = ev('chronicle', 63.4), T_HIM = ev('himiko', 64.8), T_SORC = ev('sorcery', 67.2), T_SEAL = ev('seal', 72.6), T_MIRR = ev('mirrors', 74.0);
add('himikohall', 'main', 199.6, { z: 0, popAt: T_CHRON + 0.4, loud: 2, wide: 6, lamp: (t) => sramp(t, T_HIM - 0.3, T_HIM + 0.6) * (1 + 0.5 * Math.exp(-(((t - T_SORC - 0.4) / 0.5) ** 2))) });
add('person', 'main', 190.6, { v: 'himikoAtt', z: 2, scale: P2, popAt: T_HIM - 0.6, act: (t) => ({ lean: 30, head: t > T_MIRR ? -30 : 16, back: [-30, -40], front: [-46, -40] }) });
add('person', 'main', 193.2, { v: 'himikoAtt2', z: 2.2, scale: P2, popAt: T_HIM - 0.4, act: (t) => ({ lean: 30, head: t > T_MIRR + 0.3 ? -28 : 18, back: [-30, -40], front: [-46, -40] }) });
add('logs', 'main', 195.6, { z: 2.4, scale: 0.75, popAt: T_HIM - 0.2 });
add('person', 'main', 210.6, { v: 'foodBearer', z: 2, scale: P2, flip: true, popAt: T_HIM + 0.6, pace: 4, move: (t) => -clamp((t - T_HIM - 1) * 0.6, 0, 3.4), act: (t) => (t > T_HIM + 6.7 ? { walk: undefined, lean: 14, head: 10, front: [-80, -30] } : { front: [-80, -30] }) });
add('person', 'main', 214.6, { v: 'priestess', z: 1.6, scale: P2, flip: true, popAt: T_SORC - 0.4, act: (t) => ({ front: [-120 + Math.sin(t * 1.2) * 10, -20], head: -10 }) });
for (const [a, v, s] of [[186, 1, 0.55], [205, 0, 0.5], [219, 1, 0.55]]) add('jmount', 'far', a, { v, scale: s });
for (const a of [188, 212, 224]) add('sugi', 'mid', a, { v: (a | 0) % 2, scale: 0.55 });
add('himikohall', 'mid', 214, { scale: 0.42 }); add('granary', 'mid', 192, { v: 1, scale: 0.45 });
grassRun(186, 222, 3.6, 'main', { skip: (a) => a > 189 && a < 216 });
grassRun(186, 224, 7, 'front', { s: 2 });

hook({
  lights(t, c, L, Em, Sm) {
    if (near(197, c, 50) && t > T_HIM - 1 && t < 79) {
      const k = sramp(t, T_HIM - 0.2, T_HIM + 0.4), boost = 1 + 1.4 * Math.exp(-(((t - T_SORC - 0.4) / 0.6) ** 2));
      L.push({ a: 195.6, h: 30, r: 520, k: 0.9 * k * flick(t, 6) * boost, color: [255, 150, 90] });
      Em.push({ a: 195.6, h: 4, scale: 0.55, small: 1, lit: k, litAt: T_HIM - 0.2, seed: 6 });
      Sm.push({ a: 195.6, layer: 'main', h: 40, t0: T_HIM, size: 0.8, life: 6, every: 0.5, rise: 200, drift: -3, alpha: 0.32 });
      L.push({ a: 199.6, h: 120, r: 380, k: 0.6 * k * flick(t, 9), color: [255, 170, 100] });
    }
  },
  ground(g, st, t, S, G) {
    // the flooded paddies, holding the sky; and the moats, filling as they are dug
    G.run(134, 153.4, (a0, a1) => { G.arc(a0, a1, -3, 6, 'rgba(130,170,190,.8)'); G.arc(a0, a1, -4.4, 1.2, 'rgba(240,250,255,.55)', [6, 16], -t * 5); });
    const mk = sramp(t, T_MOAT, T_MOAT + 1.6);
    if (mk > 0) for (const [a0, a1] of [[156.3, 158.6], [182.8, 185.2]]) G.run(a0, a0 + (a1 - a0) * mk, (s0, s1) => { G.arc(s0, s1, -6, 13, 'rgba(70,58,40,.9)'); G.arc(s0, s1, -7, 7, 'rgba(70,110,130,.92)'); G.arc(s0, s1, -8.4, 1.2, 'rgba(220,240,250,.5)', [5, 12], -t * 4); });
  },
  over(g, st, t) {
    const { W, H } = st, u = st.eu, p = por(st);
    // the chronicle: a scroll from the court of Wei
    if (t > T_CHRON - 0.5 && t < 71.5) { const k = drop(t, T_CHRON, 69.6); st.hang(g, st.fx.chronicle, W * (p ? 0.5 : 0.17), H * lerp(-0.4, p ? 0.08 : 0.07, k), p ? 0.62 : 0.85, Math.sin(t * 0.6) * 1.4 * DEG); }
    // the golden seal, and a hundred bronze mirrors flashing in the low sun
    if (t > T_SEAL - 0.5 && t < 79) {
      const sk = drop(t, T_SEAL, 77.2); st.hang(g, st.fx.seal, W * (p ? 0.5 : 0.62), H * lerp(-0.2, p ? 0.24 : 0.2, sk), p ? 1.0 : 1.2, Math.sin(t * 0.7) * 2 * DEG);
      const N = p ? 26 : 44, sunX = W * (p ? 0.2 : 0.16), sunY = H * 0.13;
      for (let i = 0; i < N; i++) {
        const t0 = T_MIRR + hash(i * 5) * 1.8, k = drop(t, t0, 77.2 + hash(i) * 0.4); if (k < -1.2) continue;
        const depth = hash(i * 3), x = W * (0.03 + 0.94 * ((i + 0.5) / N + (hash(i * 9) - 0.5) / N)), y = H * lerp(-0.3, (p ? 0.05 : 0.04) + (p ? 0.3 : 0.34) * hash(i * 7), k), s = 0.32 + 0.36 * depth;
        if (Math.abs(x - W * (p ? 0.5 : 0.62)) < W * 0.07 && y > H * 0.1) continue; // leave room for the seal
        const spin = t * (0.5 + hash(i * 11) * 0.7) + hash(i * 13) * 6.3, cs = Math.cos(spin);
        g.save(); g.translate(x, -20); g.rotate(Math.sin(t * 0.5 + i) * 1.5 * DEG);
        g.strokeStyle = 'rgba(200,190,175,0.3)'; g.lineWidth = Math.max(1, 0.5 * u); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, y + 20 - 60 * u * s); g.stroke();
        g.translate(0, y + 20); g.scale(u * s * Math.max(0.06, Math.abs(cs)), u * s); put(g, cs > 0 ? st.fx.mirrorFront : st.fx.mirrorBack, 0.2, 3, 4); g.restore();
        const fl = cs > 0.9 ? ((cs - 0.9) / 0.1) ** 3 : 0;
        if (fl > 0.02 && k > 0.5) {
          g.globalCompositeOperation = 'lighter'; st.stamp(g, st.dot(255, 236, 190, '255,252,240'), x, y, (40 + 60 * fl) * u * s * 2, 0.75 * fl);
          // a beam thrown down onto the land
          const gx = x + (x - sunX) * 0.8, gy = st.hy - 10 * u, gr = g.createLinearGradient(x, y, gx, gy); gr.addColorStop(0, `rgba(255,236,190,${0.22 * fl})`); gr.addColorStop(1, 'rgba(255,236,190,0)');
          g.strokeStyle = gr; g.lineWidth = 16 * u * s; g.beginPath(); g.moveTo(x, y); g.lineTo(gx, gy); g.stroke(); g.globalCompositeOperation = 'source-over';
        }
      }
    }
  },
});
