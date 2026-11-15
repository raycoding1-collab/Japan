// 3. Keyholes. A great keyhole tomb across its moat, its plan drawn on a card; a procession under a
// sunshade; haniwa rising one after another, the dancers dancing; then the imperial line as a chain of
// paper dolls across the sunset sky, from ancient robes to a morning coat, and the chrysanthemum crest.
import { add, hook, grassRun, ev, drop, near, card, por, PS, P2, R, CAM, ZONES, SEAS, BUMPS, SKY, AMB, GRADE, ERAS, WX, SUNS, ZOOM, FLOCKS, LOOK, PAL } from './film_api.js';
import { LOOKS } from './people.js';
import { clamp, sramp, lerp, hash, DEG } from './util.js';
import { put } from './paper.js';

Object.assign(LOOKS, {
  kofunNoble: { skin: 6, top: 'tunic', topCol: '#efe6d2', legs: 'trousers', legCol: '#efe6d2', hair: 'mizura', pose: 'walk', obi: '#3a6a5a', sword: 1 },
  kofunShade: { skin: 4, top: 'tunic', topCol: '#d8ccb0', legs: 'trousers', legCol: '#c8b894', hair: 'mizura', pose: 'walk', item: 'umbrella', obi: '#8a3a2a' },
  kofunPriest: { skin: 6, top: 'robe', topCol: '#f4ece0', legs: 'robe', legCol: '#f4ece0', sleeve: '#f4ece0', hair: 'mizura', pose: 'walk', obi: '#a8282a' },
});

CAM.push([79.5, 230], [82, 237], [85, 243], [87.5, 250], [90, 256], [92.5, 262], [95, 268], [98, 274], [101, 279], [104.6, 296]);
ZONES.push([224, 233, [150, 132, 86]], [235, 246.5, [52, 90, 104]], [248.5, 290, [130, 128, 78]]);
SEAS.push([234.5, 246.5]);
BUMPS.mid.push([226, 252, 16, 6, 4]);
BUMPS.far.push([230, 300, 30, 10, 20]);

SKY.push([94, PAL.DAY], [97.5, PAL.SUNSET], [104.6, ['#20223e', '#433556', '#a85a5a', '#e08a5a']]);
AMB.push([94, [255, 240, 220]], [104.6, [220, 160, 140]]); GRADE.push([94, [255, 200, 150, 0.12]], [104.6, [255, 130, 80, 0.18]]);
ERAS.push(
  [77.8, 95.2, LOOK(['#8a9ab0', '#b8b4a8', '#e8cc98', '#eebc78'], [255, 236, 206], [255, 190, 120, 0.16], { rays: 0.6, motes: 1.2, mote: [255, 220, 170] })], // the tombs: a hazy amber late afternoon
  [95.2, 104.8, LOOK(['#2e2a52', '#6a4870', '#d86a50', '#f8a050'], [238, 170, 140], [255, 120, 70, 0.2], { motes: 0.5 })],                           // the imperial line: sunset
);
WX.push(['mist', 78, 95, [240, 210, 170], 0.22]);
SUNS.push([95.5, 105.5, -430, -50, 170]);
FLOCKS.push([97, 104.4, -1, 0.22, 9]);
ZOOM.push([80, 82.5, 86, 88, -0.08]);

// ---- the great tomb across its moat
const T_KOFUN = ev('kofun', 80.6), T_KEY = ev('keyhole', 82.4), T_MOATS = ev('moats', 84.8);
add('kofun', 'mid', 240.5, { scale: 0.95, y: -14, popAt: T_KOFUN, loud: 2.2, wide: 20 });
add('kofun', 'far', 272, { scale: 0.5 });
for (const [a, v, s] of [[226, 1, 0.5], [256, 4, 0.55], [292, 0, 0.5]]) add('jmount', 'far', a, { v, scale: s });
for (const a of [230.4, 248.4]) add('pine', 'main', a, { v: (a | 0) % 2, z: 0, scale: 0.7 });
for (let a = 236; a < 246; a += 3.4) add('reeds', 'main', a, { v: (R() * 4) | 0, z: 3, scale: 0.8, loud: 0.3 });
// a procession comes to the edge of the moat, under a sunshade
const PROC = (d) => (t) => clamp((t - T_KOFUN + 0.6) * 0.5, 0, 2.8) + d * 0;
add('person', 'main', 225.6, { v: 'kofunShade', z: 2, scale: P2, popAt: T_KOFUN - 0.6, pace: 3.4, move: PROC(0), act: (t) => (t > T_KOFUN + 5 ? { walk: undefined } : {}) });
add('person', 'main', 227.8, { v: 'kofunNoble', z: 2.2, scale: P2, popAt: T_KOFUN - 0.4, pace: 3.4, move: PROC(0), act: (t) => (t > T_KOFUN + 5 ? { walk: undefined, head: -8 } : {}) });
add('person', 'main', 223.2, { v: 'kofunPriest', z: 2.1, scale: P2, popAt: T_KOFUN - 0.8, pace: 3.4, move: PROC(0), act: (t) => (t > T_KOFUN + 5 ? { walk: undefined, head: -6 } : {}) });
grassRun(222, 234, 3.4, 'main');

// ---- the haniwa, one after another; the dancers dance
const HN = [[251.2, 0, ev('hClay', 88.6)], [253.2, 0, ev('hClay', 88.6) + 0.3], [255.4, 1, ev('hHouse', 91.0)], [258.8, 2, ev('hHorse', 91.7)], [262.2, 3, ev('hWarrior', 92.5)], [265.4, 4, ev('hDancers', 93.3)], [267.6, 5, ev('hDancers', 93.3) + 0.3], [249.4, 0, ev('hClay', 88.6) + 0.6], [269.8, 0, ev('hDancers', 93.3) + 0.6]];
for (const [a, v, tp] of HN) add('haniwa', 'main', a, { v, z: 1.4, scale: v === 2 ? 1.25 : 1.35, popAt: tp, loud: 1.1, dance: v >= 4 ? (t) => sramp(t, tp + 0.6, tp + 1.2) : undefined });
for (const a of [250, 271]) add('pine', 'main', a + 0.8, { v: 1, z: 0, scale: 0.7 });
for (const a of [256, 266, 276]) add('pine', 'mid', a, { v: (a | 0) % 2, scale: 0.5 });
grassRun(248, 292, 3.2, 'main', { skip: (a) => a > 250 && a < 270 });
grassRun(232, 296, 7, 'front', { s: 2 });
grassRun(250, 296, 8, 'mid', { s: 0.7 });
for (let a = 274; a < 292; a += 3.6) add('reeds', 'main', a, { v: (R() * 4) | 0, z: 2, scale: 0.9, loud: 0.3 });

// the keyhole plan, drawn and then filled: the mound, then its moats
function keyhole(g, s, ox) {
  const p = new Path2D(), cx = 36, r0 = 50, th = Math.asin(28 / r0);
  p.moveTo(ox + (-96) * s, -52 * s); p.lineTo(ox + (cx - r0 * Math.cos(th)) * s, -28 * s);
  p.arc(ox + cx * s, 0, r0 * s, Math.PI + th, Math.PI - th, false); p.lineTo(ox + (-96) * s, 52 * s); p.closePath(); return p;
}
hook({
  over(g, st, t) {
    const { W, H } = st, p = por(st);
    if (t > T_KEY - 0.6 && t < 89) {
      const k = drop(t, T_KEY - 0.2, 87.6), x = W * (p ? 0.5 : 0.24), y = H * lerp(-0.4, p ? 0.07 : 0.1, k), s = p ? 0.62 : 0.85;
      card(st, g, x, y + 110 * st.eu * s, s, Math.sin(t * 0.5) * 1.2 * DEG, (g2) => {
        put(g2, st.fx.plancard, 0.3, 4, 6);
        const draw = sramp(t, T_KEY, T_KEY + 1.8), fill = sramp(t, T_KEY + 1.4, T_KEY + 2.4), moat = sramp(t, T_MOATS - 0.4, T_MOATS + 0.8);
        g2.save(); g2.translate(10, 0); g2.lineJoin = 'round';
        if (moat > 0) {
          g2.globalAlpha = moat; g2.fillStyle = 'rgba(80,130,160,.85)'; g2.fill(keyhole(g2, 1.36, -10));
          g2.fillStyle = 'rgba(150,170,110,.9)'; g2.fill(keyhole(g2, 1.2, -6)); g2.fillStyle = 'rgba(80,130,160,.9)'; g2.fill(keyhole(g2, 1.1, -3)); g2.globalAlpha = 1;
        }
        if (fill > 0) { g2.globalAlpha = fill; g2.fillStyle = '#6a8a50'; g2.fill(keyhole(g2, 1, 0)); g2.strokeStyle = 'rgba(40,60,30,.5)'; g2.lineWidth = 1.2; g2.stroke(keyhole(g2, 0.78, 6)); g2.stroke(keyhole(g2, 0.56, 12)); g2.globalAlpha = 1; }
        g2.strokeStyle = 'rgba(50,34,22,.9)'; g2.lineWidth = 2.4; g2.setLineDash([560 * draw, 600]); g2.stroke(keyhole(g2, 1, 0)); g2.setLineDash([]);
        g2.restore();
      }, 1, 130);
    }
    // the imperial line: paper dolls holding hands across the sky, from robes to a morning coat
    const T_IMP = ev('imperial', 96.4), T_MON = ev('monarchy', 100.6);
    if (t > T_IMP - 0.4 && t < 106.5) {
      const n = p ? 9 : 15, out = sramp(t, 104.2, 105.6), yC = H * (p ? 0.14 : 0.17) - out * H * 0.4, span = W * 0.9, sp = span / (n - 1), sc = sp / 88;
      g.strokeStyle = 'rgba(200,190,175,0.32)'; g.lineWidth = Math.max(1, 0.6 * st.eu);
      for (const xf of [0.05, 0.5, 0.95]) { g.beginPath(); g.moveTo(W * xf, -10); g.lineTo(W * xf, yC - 70 * sc); g.stroke(); }
      for (let i = 0; i < n; i++) {
        const k = sramp(t, T_IMP + i * 0.2, T_IMP + 0.45 + i * 0.2); if (k < 0.01) continue;
        const era = Math.min(5, Math.floor((i / (n - 1)) * 5.99)), x = W * 0.05 + i * sp, y = yC + Math.sin(t * 0.8 + i * 0.6) * 3 * st.eu;
        g.save(); g.translate(x, y); g.scale(sc * k * (i % 2 ? 1 : 1), sc); g.rotate(Math.sin(t * 0.7 + i) * 0.03); put(g, st.fx['doll' + era], 0.2, 3, 4); g.restore();
      }
      if (t > T_MON - 0.5) st.hang(g, st.fx.kiku, W * 0.5, H * lerp(-0.25, p ? 0.3 : 0.36, drop(t, T_MON, 104.2)) - out * H * 0.2, p ? 0.9 : 1.15, Math.sin(t * 0.5) * 1.5 * DEG, 1, t * 0.05);
    }
  },
});
