// 4. The rising sun. A ship from Korea brings monks, a gilt Buddha and carpenters through the morning mist;
// Prince Shōtoku and the brushed character for harmony; a letter sent to China as a great red sun rises
// out of the sea; 日本 written beneath it; Hōryū-ji among plum trees; a temple frame going up and a
// relay of carpenters across fourteen hundred years; and Ise in its cedar forest, rebuilt from fresh
// cypress beside itself, again and again.
import { add, hook, grassRun, ev, drop, near, flick, win, card, closeUp, por, PS, P2, R, CAM, ZONES, SEAS, BUMPS, SKY, AMB, GRADE, ERAS, WX, SUNS, ZOOM, FLOCKS, PAPER_SUN, LOOK, W_, PAL } from './film_api.js';
import { LOOKS } from './people.js';
import { clamp, sramp, lerp, hash, fbm, DEG } from './util.js';
import { put } from './paper.js';
import { brush } from './sky_japan.js';

const MONK = { skin: 4, top: 'robe', topCol: '#6a4a36', legs: 'robe', legCol: '#5a3e2c', sleeve: '#6a4a36', hair: 'bald', pose: 'stand', collar: '#c9a24a' };
Object.assign(LOOKS, {
  boatman: { skin: 3, top: 'tunic', topCol: '#d8ccb0', hair: 'bun', hat: 'band', hatCol: '#3a3a40', pose: 'kneel', item: 'paddle' },
  monkSail: { ...MONK }, monkSail2: { ...MONK, topCol: '#7a5640', item: 'scroll' },
  monkWalk: { ...MONK, pose: 'walk', item: 'scroll' }, monkWalk2: { ...MONK, topCol: '#5e4232', pose: 'walk', item: 'staff' },
  carpA: { skin: 3, top: 'tunic', topCol: '#c8b894', legs: 'trousers', legCol: '#8a7a5a', hair: 'mizura', item: 'hammer', obi: '#5a4a3a', pose: 'stand' },
  carpB: { skin: 5, top: 'tunic', topCol: '#b8a884', legs: 'trousers', legCol: '#7a6a4a', hair: 'mizura', item: 'bundle', obi: '#5a4a3a', pose: 'walk' },
  shotoku: { skin: 6, top: 'robe', topCol: '#5a3a6a', legs: 'robe', legCol: '#4a2e58', sleeve: '#5a3a6a', hat: 'kanmuri', hatCol: '#1e1a1c', hair: 'short', item: 'shaku', sword: 1, collar: '#e8dcc0', pose: 'stand' },
  scribe: { skin: 6, top: 'robe', topCol: '#3a5a7a', legs: 'robe', legCol: '#3a5a7a', sleeve: '#3a5a7a', hat: 'kanmuri', hatCol: '#1e1a1c', pose: 'kneel', item: 'brush', collar: '#e8dcc0' },
  horyuMonk: { ...MONK, topCol: '#4e3e30', pose: 'stand', item: 'staff' },
  // carpenters across fourteen centuries
  rc0: { skin: 3, top: 'tunic', topCol: '#c8b894', legs: 'trousers', legCol: '#8a7a5a', hair: 'mizura', obi: '#5a4a3a', pose: 'stand', item: 'hammer' },
  rc1: { skin: 3, top: 'robe', topCol: '#a89a7a', legs: 'trousers', legCol: '#7a6a50', hat: 'eboshi', hatCol: '#1e1a1c', pose: 'stand', item: 'hammer', collar: '#e8dcc0' },
  rc2: { skin: 4, top: 'robe', topCol: '#7a5a3e', legs: 'trousers', legCol: '#5a4430', hat: 'eboshi', hatCol: '#1e1a1c', pose: 'stand', item: 'hammer', collar: '#d8ccb0', obi: '#3a2e24' },
  rc3: { skin: 4, top: 'robe', topCol: '#2e4a6a', pattern: 'checks', legs: 'trousers', legCol: '#2a3a52', hair: 'chonmage', pose: 'stand', item: 'hammer', obi: '#c8b088', collar: '#e8dcc0' },
  rc4: { skin: 4, top: 'robe', topCol: '#2a3a5a', legs: 'trousers', legCol: '#2a2a34', hair: 'short', hat: 'band', hatCol: '#efe6d2', pose: 'stand', item: 'hammer', obi: '#c8b088' },
  rc5: { skin: 4, top: 'shirt', topCol: '#7a7058', sleeve: '#7a7058', legs: 'trousers', legCol: '#5a5444', hat: 'cap', hatCol: '#4a4636', pose: 'stand', item: 'hammer' },
  rc6: { skin: 6, top: 'shirt', topCol: '#3a5a7a', sleeve: '#3a5a7a', legs: 'trousers', legCol: '#2e3a4a', hat: 'whitecap', hatCol: '#f0eee8', pose: 'stand', item: 'hammer' },
  isePriest: { skin: 6, top: 'robe', topCol: '#f4f0e8', legs: 'robe', legCol: '#f4f0e8', sleeve: '#f4f0e8', hat: 'eboshi', hatCol: '#1e1a1c', pose: 'stand', item: 'shaku' },
  iseCarpW: { skin: 4, top: 'tunic', topCol: '#f2eee4', legs: 'trousers', legCol: '#e8e2d4', hat: 'band', hatCol: '#f2eee4', hair: 'short', pose: 'walk', obi: '#d8d0c0' },
  iseCarpW2: { skin: 3, top: 'tunic', topCol: '#efe9dc', legs: 'trousers', legCol: '#e4ddcc', hat: 'band', hatCol: '#efe9dc', hair: 'short', pose: 'walk', obi: '#d8d0c0' },
  iseMaster: { skin: 3, top: 'tunic', topCol: '#f2eee4', legs: 'trousers', legCol: '#e8e2d4', hair: 'short', hairCol: '#d8d4cc', beard: 1, beardCol: '#e0dcd4', pose: 'stand', item: 'hammer', obi: '#d8d0c0' },
  iseYoung: { skin: 6, top: 'tunic', topCol: '#f2eee4', legs: 'trousers', legCol: '#e8e2d4', hair: 'short', pose: 'kneel', obi: '#d8d0c0' },
});

CAM.push([106.5, 304], [109, 311], [111.5, 318], [113.5, 326], [116, 334], [118.5, 337], [121, 342], [123.5, 352], [126.5, 359], [129.5, 362], [132.5, 364], [135.5, 372], [138.5, 380], [141.5, 386], [144.2, 390], [147, 400], [150, 407], [153, 413], [155.8, 424], [158.5, 432.4], [161.5, 436.4], [164.5, 440.4], [167.5, 444.4], [168.9, 449]);
ZONES.push([293, 318, [48, 88, 118]], [321, 345, [150, 136, 96]], [347.5, 371, [52, 86, 118]], [374, 398, [156, 140, 100]], [400, 420, [160, 138, 96]], [426, 451, [70, 92, 60]]);
SEAS.push([293, 318.5], [347.5, 371.5]);
BUMPS.mid.push([423, 455, 30, 8, 16]); BUMPS.far.push([300, 460, 30, 10, 26]);

// the light: mist on the sea; a red dawn for the rising sun; a clear plum-blossom morning; green forest light at Ise
SKY.push([105, ['#8aa0b8', '#b8c4cc', '#e2e2da', '#ecdcc8']], [121, PAL.DAY], [123.5, ['#1a2448', '#3a3a62', '#a8546a', '#e88a62']], [129, ['#4a6aa0', '#9a96b0', '#f0b088', '#f8cc98']], [136, PAL.DAY]);
AMB.push([105, [236, 236, 236]], [121, W_], [123.5, [190, 150, 160]], [130, [255, 230, 210]], [136, W_]);
GRADE.push([105, [220, 230, 240, 0.08]], [121, [255, 220, 180, 0.08]], [124, [255, 120, 80, 0.2]], [131, [255, 180, 120, 0.14]], [136, [255, 220, 180, 0.08]]);
ERAS.push(
  [104.8, 121.4, LOOK(['#8aa2bc', '#b6c4ce', '#dfe2dc', '#eadcc6'], [240, 240, 238], [210, 220, 235, 0.1], { motes: 0.3 })],                          // Buddhism arrives: a misty sea morning
  [137, 155, LOOK(['#5a8ec8', '#98bcd8', '#e6eade', '#f4e6cc'], [255, 250, 242], [255, 222, 190, 0.07], { motes: 0.6, mote: [255, 240, 240] })],          // Hōryū-ji: a clear spring morning, plum blossom
  [155.2, 169.4, LOOK(['#4e7a6a', '#86a894', '#cfe0c4', '#e6ecd0'], [232, 244, 220], [180, 230, 170, 0.12], { rays: 1, motes: 1.2, mote: [240, 255, 200] })], // Ise: green forest light
);
WX.push(['mist', 104.8, 122, [236, 240, 244], 0.34], ['petals', 137.6, 154.6, null, 0.6], ['mist', 155.4, 169.6, [220, 236, 214], 0.3]);
PAPER_SUN.push([156, 168.6]);
FLOCKS.push([105.5, 113, 1, 0.26, 6], [140, 147, -1, 0.24, 7]);
ZOOM.push([115, 117, 120.5, 122.5, 0.16], [131, 133, 135, 137, 0.1], [160, 162, 166, 168.6, 0.12]);

// ---- Buddhism comes from Korea: a ship out of the mist, monks, a gilt Buddha, carpenters
const T_BUD = ev('buddhism', 107.4), T_STAT = ev('statues', 111.0), T_CARP = ev('carpenters', 112.0);
add('yboat', 'main', 300, { v: 1, z: 1, scale: 0.92, y: 2, popAt: 104.8, move: (t) => clamp((t - 104.6) * 2.5, 0, 12.6), stroke: (t) => 1 - sramp(t, 109.2, 110) });
for (let a = 296; a < 318; a += 3.2) add('wave', 'front', a, { v: (R() * 4) | 0, scale: 1.3 + R() * 0.3 });
for (let a = 300; a < 317.5; a += 4.2) add('wave', 'main', a, { v: (R() * 4) | 0, z: 0.4, scale: 0.7, y: -2 });
add('person', 'main', 319, { v: 'monkWalk', z: 2, scale: P2, popAt: T_BUD + 1.4, pace: 3.6, move: (t) => clamp((t - T_BUD - 1.8) * 0.5, 0, 2.2), act: (t) => (t > T_BUD + 6.2 ? { walk: undefined, front: [-60, -30] } : {}) });
add('gilt', 'main', 323.4, { z: 1.6, scale: 1.1, popAt: T_STAT, loud: 1.2 });
add('person', 'main', 325.4, { v: 'monkWalk2', z: 2.2, scale: P2, flip: true, popAt: T_STAT + 0.3, act: () => ({ walk: undefined, lean: 10, head: 8, front: [-80, -40], back: [-70, -50] }) });
add('person', 'main', 328, { v: 'carpA', z: 2, scale: P2, popAt: T_CARP, act: (t) => ({ head: -4, front: [-34 + Math.sin(t * 1.4) * 4, -62] }) });
add('person', 'main', 330.4, { v: 'carpB', z: 2.4, scale: P2, popAt: T_CARP + 0.3, act: () => ({ walk: undefined }) });
grassRun(320, 345, 3.6, 'main', { skip: (a) => a > 322 && a < 331 || a > 333 && a < 339 });
grassRun(320, 346, 7, 'front', { s: 2 });

// ---- Prince Shōtoku: harmony
const T_SHO = ev('shotoku', 115.0), T_WA = ev('wa', 116.6);
add('person', 'main', 334, { v: 'shotoku', z: 2, scale: P2 * 1.05, popAt: T_SHO - 0.4, loud: 1.2, act: (t) => ({ head: -4 + Math.sin(t * 0.4) * 2, lean: 2 }) });
add('jdesk', 'main', 338.6, { z: 1.6, scale: 1.1, popAt: T_SHO });
add('person', 'main', 337.2, { v: 'scribe', z: 1.8, scale: P2, popAt: T_SHO + 0.2, act: (t) => ({ lean: 22, head: 16, front: [-70 + Math.sin(t * 5) * 6, -50] }) });
add('sakura', 'main', 342, { v: 2, z: 0, scale: 0.75 });
for (const a of [326, 340]) add('sugi', 'mid', a, { v: 1, scale: 0.5 });

// ---- the letter, the rising sun, and the name
const T_LET = ev('letter', 122.3), T_SUN = ev('sunrise', 125.2), T_NIHON = ev('nihon', 131.6);
add('yboat', 'main', 349.6, { v: 1, z: 1, scale: 0.85, y: 2, flip: false, popAt: 121.2, move: (t) => clamp((t - 122.6) * 2.6, 0, 16), stroke: (t) => sramp(t, 122.4, 123) });
for (let a = 349; a < 371; a += 3.2) add('wave', 'front', a, { v: (R() * 4) | 0, scale: 1.3 + R() * 0.3 });
for (let a = 352; a < 371; a += 4.2) add('wave', 'main', a, { v: (R() * 4) | 0, z: 0.4, scale: 0.7, y: -2 });
for (const [a, v, s] of [[346, 3, 0.55], [372, 3, 0.6]]) add('jmount', 'mid', a, { v, scale: s });

// ---- Hōryū-ji
const T_HOR = ev('horyuji', 139.0);
add('tera', 'main', 379, { v: 3, z: 0, scale: 0.9, popAt: T_HOR - 0.6, loud: 1.4 });
add('gojunoto', 'main', 384.6, { v: 0, z: 0.4, scale: 0.86, popAt: T_HOR, loud: 2, wide: 6 });
add('tera', 'main', 392.4, { v: 0, z: 0.2, scale: 0.92, popAt: T_HOR + 0.4, loud: 2, wide: 6 });
add('person', 'main', 388.4, { v: 'horyuMonk', z: 2, scale: P2, popAt: T_HOR + 0.8, act: (t) => ({ head: -6 + Math.sin(t * 0.3) * 4 }) });
add('person', 'main', 397.2, { v: 'monkSail', z: 2, scale: P2, flip: true, popAt: T_HOR + 1.1, act: () => ({ lean: 14, head: 10, front: [-60, -40], back: [-60, -40] }) });
for (const [a, v] of [[375, 2], [399.5, 0]]) add('sakura', 'main', a, { v, z: 0, scale: 0.8 });
add('gojunoto', 'mid', 398, { v: 0, scale: 0.45 }); add('tera', 'mid', 374, { v: 3, scale: 0.5 });
for (const [a, v, s] of [[378, 1, 0.55], [396, 4, 0.55]]) add('jmount', 'far', a, { v, scale: s });
grassRun(374, 400, 3.8, 'main', { skip: (a) => a > 376 && a < 398 });
grassRun(372, 400, 7, 'front', { s: 2 });

// ---- fourteen hundred years of temple carpenters
const T_FIRM = ev('firm', 147.2), T_578 = ev('since578', 149.6), RELAY = [[409.6, 578], [412.0, 794], [414.4, 1185], [416.8, 1603], [419.2, 1868], [421.6, 1945], [424.0, 2006]];
add('tframe', 'main', 402.6, { z: 0.4, scale: 0.72, popAt: T_FIRM - 0.6, loud: 1.6, lift: (t) => sramp(t, T_FIRM + 0.2, T_FIRM + 2.6), wide: 6 });
add('person', 'main', 399.6, { v: 'carpA', z: 2, scale: P2, popAt: T_FIRM - 0.3, act: (t) => ({ lean: -8, head: -26, front: [-170 + Math.sin(t * 2) * 6, -10], back: [-160, -10] }) });
add('person', 'main', 405.6, { v: 'carpA', z: 2, scale: P2, flip: true, popAt: T_FIRM - 0.1, act: (t) => ({ lean: -8, head: -26, front: [-170 + Math.sin(t * 2 + 1) * 6, -10], back: [-160, -10] }) });
RELAY.forEach(([a], i) => add('person', 'main', a, { v: 'rc' + i, z: 2, scale: P2 * 0.95, popAt: T_578 + i * 0.42, loud: 0.8, act: (t) => { const k = sramp(t, T_578 + i * 0.42 + 0.4, T_578 + i * 0.42 + 0.9); return { head: 4, front: [-80 + k * 30, -30], back: [-60, -30] }; } }));
grassRun(400, 426, 3.6, 'main', { skip: (a) => a > 398 && a < 425.5 });

// ---- Ise: the shrine rebuilt beside itself
const T_ISE = ev('ise', 156.6), T_NEW = ev('rebuilt', 158.8), T_C7 = ev('seventh', 163.4), T_FORGET = ev('forgotten', 166.2);
add('torii', 'main', 428.4, { v: 0, z: 1, scale: 0.92, popAt: T_ISE - 0.6, loud: 1.4 });
add('mizugaki', 'main', 430.8, { v: 0, z: 2.6, scale: 0.9 }); add('mizugaki', 'main', 436.8, { v: 0, z: 2.6, scale: 0.9 }); add('mizugaki', 'main', 443.0, { v: 1, z: 2.6, scale: 0.9, popAt: T_NEW + 0.2 });
add('shinmei', 'main', 433.8, { v: 0, z: 0.6, scale: 0.9, foldAt: T_NEW + 2.6, loud: 1.6 });
add('kooiya', 'main', 440.0, { z: 0.6, scale: 1, foldAt: T_NEW - 0.2 });
add('shinmei', 'main', 440.0, { v: 1, z: 0.7, scale: 0.9, popAt: T_NEW, foldAt: T_C7 + 1.4, loud: 2 });
add('shinmei', 'main', 433.8, { v: 1, z: 0.65, scale: 0.9, popAt: T_C7 + 0.6, loud: 2 });
add('logcarry', 'main', 446.2, { z: 2.2, scale: P2, flip: true, popAt: T_NEW + 0.6, move: (t) => -clamp((t - T_NEW - 0.9) * 0.55, 0, 3.4), stop: T_NEW + 7.1 });
add('person', 'main', 426.0, { v: 'isePriest', z: 2, scale: P2, popAt: T_ISE - 0.2, act: (t) => ({ head: -8, front: [-60, -40] }) });
add('person', 'main', 449.0, { v: 'iseMaster', z: 2.2, scale: P2, flip: true, popAt: T_FORGET - 1.2, act: (t) => ({ lean: 10, head: 12, front: [-60 - sramp(t, T_FORGET, T_FORGET + 0.8) * 10, -30] }) });
add('person', 'main', 447.0, { v: 'iseYoung', z: 2.3, scale: P2, popAt: T_FORGET - 1.0, act: (t) => ({ lean: 14, head: -6, front: [-70 + sramp(t, T_FORGET, T_FORGET + 0.8) * 20, -40], back: [-60, -40] }) });
for (const a of [421.6, 424.1, 430.2, 436.2, 438.2, 444.2, 451.0, 453.6]) add('sugi', 'main', a, { v: (a * 7 | 0) % 3, z: -1, scale: 0.9 + hash(a) * 0.2 });
for (let a = 420.6; a < 458.6; a += 3.2) add('sugi', 'mid', a, { v: (a | 0) % 3, scale: 0.6 + hash(a * 3) * 0.15 });
for (let a = 422.6; a < 460; a += 7) add('sugi', 'far', a, { v: (a | 0) % 3, scale: 0.5 });
grassRun(424.6, 454.6, 4.2, 'main', { skip: (a) => a > 426.6 && a < 449.6 });
grassRun(422.6, 458.6, 7, 'front', { s: 2 });

const relayLabel = (g, st, t, a, yr, k, i) => { const [x, y] = st.place('main', a, 206 + (i % 2) * 34, t), u = st.eu, fs = Math.max(12, 23 * u); g.save(); g.globalAlpha = k; g.font = `italic 400 ${fs}px Fraunces, Georgia, serif`; g.textAlign = 'center'; g.fillStyle = 'rgba(40,26,18,.85)'; g.fillText(String(yr), x, y); g.restore(); };

hook({
  sky(g, st, t) {
    // the sun rises out of the sea, huge and red, behind the edge of the world
    if (t > T_SUN - 1 && t < 140) {
      const { W, H } = st, u = st.eu, k = sramp(t, T_SUN - 0.5, T_SUN + 5.5), out = sramp(t, 136, 139.5), p = por(st);
      const x = W * (p ? 0.5 : 0.56), y = lerp(st.hy + 110 * u, st.hy - H * (p ? 0.3 : 0.34), k) - out * H * 0.5, rr = Math.min(W, H) * (p ? 0.2 : 0.17);
      g.globalCompositeOperation = 'screen'; const gl = g.createRadialGradient(x, y, 0, x, y, rr * 4); gl.addColorStop(0, `rgba(255,150,90,${0.5 * (1 - out)})`); gl.addColorStop(0.4, `rgba(255,110,70,${0.18 * (1 - out)})`); gl.addColorStop(1, 'rgba(255,100,60,0)'); g.fillStyle = gl; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over';
      g.save(); g.translate(x, y); g.rotate(t * 0.01); g.scale(rr / 130, rr / 130); put(g, st.fx.redsun, 0); g.restore();
    }
  },
  over(g, st, t) {
    const { W, H } = st, p = por(st);
    // 和: harmony, written stroke by stroke
    closeUp(st, g, t, T_WA - 0.4, 121.6, (g2) => { put(g2, st.fx.washi, 0.6, 8, 12); brush(g2, 'wa', -66, -112, 1.32, sramp(t, T_WA + 0.3, T_WA + 3.4) * 8, '#1c1612', 9); g2.fillStyle = 'rgba(178,40,32,.85)'; if (t > T_WA + 3.6) g2.fillRect(70, 96, 22, 22); }, { light: [255, 210, 160], glow: 0.22, embers: false, veil: 0.4, dark: '20,22,30' });
    // the letter, sent across the sea
    if (t > T_LET - 0.5 && t < 129.5) st.hang(g, st.fx.letter, W * (p ? 0.5 : 0.3), H * lerp(-0.3, p ? 0.1 : 0.12, drop(t, T_LET, 128)), p ? 0.62 : 0.8, Math.sin(t * 0.6) * 1.2 * DEG);
    // 日本: Nihon, the origin of the sun
    if (t > T_NIHON - 0.6 && t < 138.5) {
      const k = drop(t, T_NIHON - 0.2, 136.8), x = W * (p ? 0.5 : 0.24), y = H * lerp(-0.5, p ? 0.07 : 0.1, k), s = p ? 0.5 : 0.62;
      card(st, g, x, y + 150 * st.eu * s, s, Math.sin(t * 0.5) * 1.2 * DEG, (g2) => { put(g2, st.fx.washi, 0.3, 4, 6); const n = sramp(t, T_NIHON, T_NIHON + 2.8) * 9; brush(g2, 'hi', -48, -128, 1.0, Math.min(4, n), '#1c1612', 8); brush(g2, 'hon', -48, 4, 1.0, Math.max(0, n - 4), '#1c1612', 8); }, 1, 110);
    }
    // the joint: two timbers locking together without a nail
    if (t > T_FIRM + 0.6 && t < 156) {
      const k = drop(t, T_FIRM + 1, 154.6), x = W * (p ? 0.5 : 0.74), y = H * lerp(-0.4, p ? 0.1 : 0.14, k), s = p ? 0.6 : 0.85, slide = sramp(t, T_FIRM + 2.4, T_FIRM + 3.6);
      card(st, g, x, y, s, Math.sin(t * 0.5) * 1.2 * DEG, (g2) => { put(g2, st.fx.jointA, 0.3, 4, 6); g2.save(); g2.translate(lerp(150, 0, slide), 0); put(g2, st.fx.jointB, 0.3, 4, 6); g2.restore(); }, 1, 100);
    }
    // the year each carpenter worked in
    RELAY.forEach(([a, yr], i) => { const k = sramp(t, T_578 + i * 0.42 + 0.2, T_578 + i * 0.42 + 0.7) * (1 - sramp(t, 155, 156.5)); if (k > 0.01) relayLabel(g, st, t, a, yr, k, i); });
  },
});
