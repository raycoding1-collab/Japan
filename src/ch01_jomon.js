// 1. Clay and fire. A Jōmon village by the sea, at night: pit dwellings, a fire with pots in its embers,
// a potter at work. Then dawn: a canoe in a bay, a hunter and a deer, chestnut gatherers, the great
// six-pillar tower at Sannai-Maruyama, and the flame pots and goggle-eyed dogū.
import { add, hook, grassRun, ev, drop, near, flick, win, closeUp, card, spr, por, PS, P2, R, CAM, ZONES, SEAS, BUMPS, SKY, AMB, GRADE, ERAS, WX, NIGHTS, SUNS, ZOOM, FLOCKS, PAPER_SUN, MILKY, LOOK, W_, PAL } from './film_api.js';
import { LOOKS } from './people.js';
import { clamp, sramp, lerp, hash, fbm, DEG } from './util.js';
import { put } from './paper.js';

Object.assign(LOOKS, {
  jomonPotter: { skin: 3, top: 'tunic', topCol: '#9a7a54', pattern: 'stripe', hair: 'bun', pose: 'kneel' },
  jomonElder: { skin: 3, top: 'tunic', topCol: '#7a6448', hair: 'bun', hairCol: '#c8c0b4', beard: 1, beardCol: '#d0c8bc', pose: 'sit' },
  jomonKid: { skin: 4, top: 'tunic', topCol: '#b09068', hair: 'short', pose: 'stand', small: 0.66 },
  jomonPaddler: { skin: 3, top: 'bare', wrap: '#7a5a3a', hair: 'bun', pose: 'kneel', item: 'paddle' },
  jomonPaddler2: { skin: 5, top: 'bare', wrap: '#6a4a30', hair: 'short', pose: 'kneel', item: 'paddle' },
  jomonHunter: { skin: 3, top: 'tunic', topCol: '#8a6a44', pattern: 'stripe', hair: 'bun', item: 'bow', pose: 'stand' },
  jomonGatherer: { skin: 4, top: 'dress', topCol: '#a07a50', legs: 'skirt', legCol: '#8a6844', hair: 'long', item: 'basket', pose: 'stand' },
  jomonGatherer2: { skin: 3, top: 'dress', topCol: '#8e7048', pattern: 'stripe', legs: 'skirt', legCol: '#7a5a3a', hair: 'bun', pose: 'stand' },
  jomonKidKneel: { skin: 4, top: 'tunic', topCol: '#a88a62', hair: 'short', pose: 'kneel', small: 0.66 },
  jomonWoman: { skin: 4, top: 'dress', topCol: '#9a7650', pattern: 'stripe', legs: 'skirt', legCol: '#7e5e3e', hair: 'bun', pose: 'stand' },
});

// camera: hold on the night village while the cards come and go, then travel through the morning
CAM.push([0, -52], [3.5, -44], [6.5, -28], [9, -11], [11, -5.5], [14, -3], [18, -1], [22, 2], [25, 9], [28, 21], [30.5, 31], [32.5, 41], [34.5, 52], [36.5, 64], [38.6, 73], [40.6, 85], [42.6, 92.5], [44.6, 97.5], [46.6, 108]);
ZONES.push([-400, -21, [40, 76, 110]], [-15, 24, [118, 108, 70]], [27.6, 38.6, [50, 90, 120]], [41.5, 118, [104, 124, 72]]);
SEAS.push([-400, -18], [28, 38.5]);
BUMPS.mid.push([-60, -24, 10, 4, 6], [44, 112, 18, 6, 10]);
BUMPS.far.push([40, 120, 30, 8, 20]);

// the light: a deep blue night under the Milky Way, then dawn over the sea, then a pink-gold morning in mist
const NIGHT_J = ['#070c22', '#0e1636', '#18224a', '#2a3460'];
SKY.push([0, NIGHT_J], [21, NIGHT_J], [25, ['#2a3664', '#6e6a92', '#d89a86', '#f4c69a']], [29, ['#7a9cc4', '#b4c4d4', '#f0dcc4', '#f8e2c0']]);
AMB.push([0, [58, 68, 116]], [21, [58, 68, 116]], [25, [220, 180, 170]], [29, W_]);
GRADE.push([0, [255, 170, 95, 0.14]], [22, [255, 170, 95, 0.14]], [27, [255, 190, 150, 0.14]], [31, [255, 210, 160, 0.1]]);
NIGHTS.push([-2, 26]); MILKY.push([7, 24, 0.75]); SUNS.push([23.5, 31, 430, 170, -60]);
ERAS.push([29, 46.6, LOOK(['#86a6c8', '#bccad4', '#f0dcc0', '#f6d2a6'], [255, 240, 222], [255, 200, 150, 0.12], { rays: 0.7, motes: 0.8, mote: [255, 230, 190] })]);
PAPER_SUN.push([30, 46]);
WX.push(['mist', 25.5, 41, [244, 228, 222], 0.3]);
FLOCKS.push([27, 36, 1, 0.24, 7]);
ZOOM.push([6, 10, 21, 25, 0.26], [39.5, 41.5, 44.6, 46.6, 0.14]);

// ---- the night village by the sea
const FIRE = 0, T_FIRED = ev('fired', 10.5);
add('logs', 'main', FIRE, { z: 2, scale: PS, delay: 0.7 });
add('jpot', 'main', FIRE - 0.7, { v: 0, z: 1.5, scale: 0.72, delay: 0.5, hot: (t) => 1 - sramp(t, T_FIRED + 2, T_FIRED + 9) });
add('jpot', 'main', FIRE + 1.0, { v: 0, z: 1.6, scale: 0.6, delay: 0.6, flip: true, hot: (t) => 1 - sramp(t, T_FIRED + 3, T_FIRED + 10) });
add('person', 'main', FIRE - 4.6, { v: 'jomonPotter', z: 2, scale: PS, delay: 0.3, act: (t) => ({ lean: 24 + Math.sin(t * 0.9) * 3, head: 16, front: [-62 + Math.sin(t * 2.1) * 8, -38], back: [-54 + Math.sin(t * 2.1 + 1.6) * 7, -42] }) });
add('jpot', 'main', FIRE - 2.6, { v: 2, z: 2.4, scale: 0.62, delay: 0.5, rot: (t) => Math.sin(t * 0.6) * 0.6 });
add('person', 'main', FIRE + 4.6, { v: 'jomonElder', z: 1.5, scale: PS, flip: true, delay: 0.4, act: (t) => ({ head: 4 + Math.sin(t * 0.5) * 3, lean: 6 }) });
add('person', 'main', FIRE + 7.0, { v: 'jomonKid', z: 2.5, scale: PS, flip: true, delay: 0.8, act: (t) => ({ head: -6 + Math.sin(t * 0.7) * 4, front: [-20 + Math.sin(t * 1.6) * 8, -20] }) });
const HUTS = [[-11, 1, 0, false], [12.5, 0, 0.5, true], [21.5, 2, 0, false]];
for (const [a, v, z, flip] of HUTS) add('pitdwelling', 'main', a, { v, z, flip, winOn: (t) => 0.6 * (1 - sramp(t, 24, 28)) * (0.85 + 0.15 * fbm(t * 6 + a, 3)) });
for (const [a, v] of [[-7, 0], [5, 2], [16, 1], [27, 0]]) add('pitdwelling', 'mid', a, { v, scale: 0.55, winOn: (t) => 0.5 * (1 - sramp(t, 24, 28)) });
add('kuri', 'main', -18, { v: 0, z: 0, scale: 0.9 }); add('kuri', 'mid', 1, { v: 1, scale: 0.55 });
for (const a of [-14, 10, 23]) add('sugi', 'mid', a, { v: (a | 0) & 1, scale: 0.5 });
for (const [a, v, s] of [[-72, 3, 0.55], [-52, 3, 0.7], [-33, 3, 0.5]]) add('jmount', 'mid', a, { v, scale: s });
for (const [a, v, s] of [[-80, 0, 0.55], [-48, 1, 0.5], [-14, 0, 0.6], [24, 1, 0.55]]) add('jmount', 'far', a, { v, scale: s });
for (let a = -90; a < -18; a += 5.2) add('wave', 'front', a, { v: (R() * 4) | 0, scale: 1.3 + R() * 0.4 });
for (let a = -60; a < -19; a += 7) add('wave', 'main', a, { v: (R() * 4) | 0, z: 0, scale: 0.8, y: -2 });
add('rock', 'main', -17, { v: 1, z: 3 }); add('rock', 'main', -19.5, { v: 2, z: 1, scale: 0.8 });
// a night fisherman's canoe with a torch, far out
const CANOE_N = (t) => clamp(t * 0.14, 0, 3);
add('maruki', 'main', -44, { v: 0, z: 0.5, scale: 0.85, y: -3, move: CANOE_N, stroke: (t) => 0.4 });
grassRun(-16, 26, 3.4, 'main', { skip: (a) => a > -7 && a < 9 });
grassRun(-16, 28, 7, 'mid', { s: 0.7 });
grassRun(-18, 28, 6, 'front', { s: 2.0 });

// ---- morning: a canoe in the bay, a hunter and a deer, chestnuts, shells
const T_FISH = ev('fish', 29.7), T_RUN = ev('deerRun', 32.4), T_NUT = ev('chestnut', 34.0);
add('maruki', 'main', 31.6, { v: 1, z: 1, scale: 0.95, y: -3, popAt: T_FISH - 1.4, move: (t) => clamp((t - T_FISH + 1) * 0.35, 0, 2.6), stroke: () => 1 });
for (let a = 27; a < 39; a += 3.4) add('wave', 'front', a, { v: (R() * 4) | 0, scale: 1.2 });
add('person', 'main', 43.6, { v: 'jomonHunter', z: 2, scale: P2, popAt: T_FISH + 1.6, act: (t) => ({ lean: 4, head: -2, front: [-92 + Math.sin(t * 1.3) * 2, -2], back: [-70, -60 + Math.sin(t * 1.1) * 3] }) });
add('deer', 'main', 49.5, { v: 0, z: 1.4, scale: 1.05, popAt: T_FISH + 2.0, move: (t) => clamp((t - T_RUN) * 4.6, 0, 11.5), graze: (t) => (t < T_RUN - 0.6 ? 0.9 : t > T_RUN + 3.2 ? 0.8 : 0.1) });
add('deer', 'main', 52.6, { v: 1, z: 0.6, scale: 0.92, popAt: T_FISH + 2.3, move: (t) => clamp((t - T_RUN - 0.2) * 4.4, 0, 9.5) });
add('kuri', 'main', 55, { v: 0, z: 0 }); add('kuri', 'main', 61.5, { v: 1, z: 0, flip: true, scale: 0.9 });
add('person', 'main', 56.6, { v: 'jomonGatherer', z: 2, scale: P2, popAt: T_NUT - 0.8, act: (t) => ({ head: -24, front: [-170 + Math.sin(t * 2.2) * 6, -10], back: [-20, -20] }) });
add('person', 'main', 58.6, { v: 'jomonKidKneel', z: 2.5, scale: P2, flip: true, popAt: T_NUT - 0.5, act: (t) => ({ lean: 30, head: 20, front: [-70 + Math.sin(t * 3) * 10, -20] }) });
add('person', 'main', 60.4, { v: 'jomonGatherer2', z: 1.5, scale: P2, popAt: T_NUT - 0.3, act: (t) => ({ head: -14, front: [-150 + Math.sin(t * 1.8) * 8, -16], back: [-160 + Math.sin(t * 1.8 + 1) * 8, -10] }) });
add('shellmound', 'main', 65, { v: 0, z: 1.5, popAt: T_NUT + 0.6 });
grassRun(40, 70, 3.6, 'main', { skip: (a) => a > 42 && a < 45 || a > 55.5 && a < 61 });

// ---- Sannai-Maruyama: the six-pillar tower, a long house, and houses rebuilt over a thousand years
const T_K = ev('thousand', 35.4);
add('sixpillar', 'main', 73, { z: 0, scale: 0.92, popAt: T_NUT + 1.0, loud: 2, wide: 8 });
add('person', 'main', 74.4, { v: 'jomonKid', z: 0.2, scale: 0.9, y: 340, ground: true, popAt: T_NUT + 1.6, act: (t) => ({ head: -10 + Math.sin(t * 0.6) * 6, front: [-150, -10] }) });
const SAN = [[67.5, 2, false], [79.5, 1, false, 1.5], [88.4, 0, true]];
SAN.forEach(([a, v, flip, s], i) => add('pitdwelling', 'main', a, { v, flip, z: 0.4, scale: s || 1, popAt: T_NUT + 1.2 + i * 0.3, foldAt: T_K + i * 0.3, repopAt: T_K + 0.6 + i * 0.3, loud: 1.2 }));
for (const [a, v] of [[70, 1], [77, 2], [84, 0], [92, 1], [100, 2]]) add('pitdwelling', 'mid', a, { v, scale: 0.52, foldAt: T_K + 0.4 + (a - 70) * 0.03, repopAt: T_K + 1.0 + (a - 70) * 0.03 });
for (const [a, v, s] of [[62, 0, 0.6], [88, 1, 0.55], [114, 0, 0.6]]) add('jmount', 'far', a, { v, scale: s });
for (const a of [69, 96, 106]) add('kuri', 'mid', a, { v: (a | 0) % 2, scale: 0.5 });

// ---- flame pots and the goggle-eyed figures
const T_FLAME = ev('flamepot', 40.6), T_DOGU = ev('dogu', 42.4), T_EYES = ev('goggle', 43.9);
add('rock', 'main', 89.6, { v: 0, z: 1.2, scale: 1.3, popAt: T_FLAME - 0.3 });
add('jpot', 'main', 89.6, { v: 1, z: 1.4, scale: 1.65, y: 10, popAt: T_FLAME, loud: 1.4 });
add('jpot', 'main', 93.0, { v: 2, z: 1.6, scale: 1.1, popAt: T_FLAME + 0.35 });
add('jpot', 'main', 86.6, { v: 1, z: 2, scale: 0.95, popAt: T_FLAME + 0.55 });
add('person', 'main', 84.4, { v: 'jomonPotter', z: 2.2, scale: P2, popAt: T_FLAME + 0.2, act: (t) => ({ lean: 20, head: 6, front: [-80 + Math.sin(t * 1.7) * 6, -40], back: [-70, -50] }) });
add('dogu', 'main', 99.5, { z: 1.2, scale: 1.05, popAt: T_DOGU, loud: 1.6, eyes: (t) => sramp(t, T_EYES - 0.2, T_EYES + 0.3) * (0.75 + 0.25 * Math.sin(t * 3)) });
add('person', 'main', 96.4, { v: 'jomonKid', z: 2.4, scale: P2, popAt: T_DOGU + 0.4, act: (t) => ({ head: -26 + (t > T_EYES ? -4 : 0), lean: -4, back: [10, -8], front: t > T_EYES + 0.2 ? [-30, -40] : [-12, -16] }) });
add('person', 'main', 103.4, { v: 'jomonWoman', z: 2, scale: P2, flip: true, popAt: T_DOGU + 0.7, act: (t) => ({ head: -10 }) });
grassRun(78, 112, 3.4, 'main', { skip: (a) => a > 83 && a < 104 });
grassRun(26, 116, 7, 'front', { s: 2 });
grassRun(40, 116, 8, 'mid', { s: 0.7 });

hook({
  lights(t, c, L, Em, Sm) {
    if (near(FIRE, c, 60) && t < 31) {
      const k = 1 - sramp(t, 25, 29);
      L.push({ a: FIRE, h: 34, r: 1000, k: 1.15 * k * flick(t, 0), color: [255, 158, 80] });
      Em.push({ a: FIRE, h: 5, scale: PS * 1.1, lit: k, litAt: -20, seed: 1 });
      for (const [a, , , ] of HUTS) { L.push({ a, h: 20, r: 160, k: 0.4 * k, color: [255, 170, 90] }); Sm.push({ a, layer: 'main', h: 132, t0: -20, t1: 27, size: 0.55, life: 4.5, every: 0.8, rise: 120, drift: 4, alpha: 0.22 }); }
      // the fisherman's torch on the night sea
      const ca = -44 + CANOE_N(t) + 0.6;
      L.push({ a: ca, h: 70, r: 300, k: 0.7 * k * flick(t, 4), color: [255, 160, 80] });
      Em.push({ a: ca, h: 64, scale: 0.32, small: 1, lit: k, litAt: -20, seed: 4 });
    }
    if (near(78, c, 60) && t > 33) for (const [a, , , s] of SAN) Sm.push({ a, layer: 'main', h: 130 * (s || 1), t0: 34, size: 0.5, life: 5, every: 0.9, rise: 130, drift: 5, alpha: 0.18 });
  },
  sky(g, st, t) {
    // the moon over the night sea
    if (t > -1 && t < 28) {
      const { W, H } = st, u = st.eu, y = H * lerp(-0.12, 0.14, drop(t, 0.6, 24.5)), x = W * (por(st) ? 0.74 : 0.8);
      g.globalCompositeOperation = 'screen'; const gl = g.createRadialGradient(x, y, 0, x, y, 230 * u); gl.addColorStop(0, 'rgba(210,222,255,0.2)'); gl.addColorStop(1, 'rgba(200,215,255,0)'); g.fillStyle = gl; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over';
      st.hang(g, st.fx.moon, x, y, 1, Math.sin(t * 0.5) * 1.6 * DEG, 1, -0.35);
    }
  },
  ground(g, st, t, S, G) {
    // the path through the village; the shore's foam on the night sea
    G.run(-16, 26, (a0, a1) => G.arc(a0, a1, -9, 2.2, 'rgba(110,84,46,.3)', [7, 9]));
    G.run(-24, -17, (a0, a1) => G.arc(a0, a1, -2, 2.4, 'rgba(230,240,250,.25)', [5, 7], -t * 4));
  },
  over(g, st, t) {
    const { W, H } = st, u = st.eu;
    // fireflies along the edge of the village while the fire burns
    if (t > 8 && t < 27) {
      const k = sramp(t, 9, 11) * (1 - sramp(t, 23, 26)); g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 22; i++) {
        const a = 9 + hash(i * 11) * 18 + Math.sin(t * 0.3 + i) * 0.6, h = 14 + hash(i * 13) * 110 + Math.sin(t * 0.7 + i * 2) * 10;
        const pulse = Math.max(0, Math.sin(t * (1.1 + hash(i) * 0.8) + i * 2.1)) ** 3 * k; if (pulse < 0.03) continue;
        const [x, y] = st.place('main', a, h, t); st.stamp(g, st.dot(190, 240, 110, '230,255,150'), x, y, 9 * u, pulse);
      }
      g.globalCompositeOperation = 'source-over';
    }
    // They are among the oldest pots in the world: the pot itself, as it came out of the ground
    closeUp(st, g, t, ev('pot1', 15.0), ev('pot1Out', 20.3), (g2) => { put(g2, st.fx.firstpot, 0.6, 8, 12); }, { y: 0.47, yp: 0.44, scale: 0.92 });
    // Later potters rolled twisted cord across the wet clay: the cord rolls, and leaves the pattern behind it
    closeUp(st, g, t, ev('cord', 20.8), ev('cordOut', 28.0), (g2) => {
      const p = sramp(t, ev('cord', 20.8) + 0.6, ev('cord', 20.8) + 4.6), x = lerp(-150, 150, p);
      g2.save(); g2.rotate(-0.04); put(g2, st.fx.clay, 0.6, 8, 12);
      g2.save(); g2.beginPath(); g2.rect(-170, -70, x + 170, 140); g2.clip(); put(g2, st.fx.clayMarked, 0); g2.restore();
      g2.save(); g2.translate(x, -2); g2.scale(1, 1); put(g2, st.fx.cord, 0.5, 4, 6);
      g2.restore(); g2.restore();
    }, { y: 0.46, light: [255, 150, 70], glow: 0.3 });
  },
});
