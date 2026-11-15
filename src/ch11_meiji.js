// 11. Black ships. People on the shore watch two black steamers come in under their smoke, and a gun
// salute; the Tokugawa banner folds and the young emperor's chrysanthemum rises; a rickshaw races by; a
// samurai cuts off his topknot and stands up again in a suit; then, at dusk, one after another, a train, a
// brick silk mill, a school and a parliament, as the gas lamps light. Snow on Hokkaido and the Ainu; the
// red hall at Shuri; and at Tsushima, the Z flag flying as the Russian fleet folds into the sea.
import { add, hook, grassRun, ev, drop, near, flick, card, por, PS, P2, R, CAM, ZONES, SEAS, BUMPS, SKY, AMB, GRADE, ERAS, WX, NIGHTS, ZOOM, PAPER_SUN, LOOK, W_, PAL } from './film_api.js';
import { LOOKS } from './people.js';
import { clamp, sramp, lerp, hash, fbm, DEG } from './util.js';
import { put } from './paper.js';
import { japanMap } from './sky_japan.js';

Object.assign(LOOKS, {
  shoreSam: { skin: 4, top: 'robe', topCol: '#3a4a5a', legs: 'trousers', legCol: '#4a4a52', sleeve: '#3a4a5a', hair: 'chonmage', pose: 'stand', sword: 1, collar: '#efe8d8', obi: '#c8b088' },
  shoreTown: { skin: 4, top: 'robe', topCol: '#7a5a3a', pattern: 'stripe', legs: 'robe', legCol: '#7a5a3a', sleeve: '#7a5a3a', hair: 'chonmage', pose: 'stand', obi: '#2a2a30' },
  shoreWoman: { skin: 6, top: 'robe', topCol: '#4a6a7a', legs: 'robe', legCol: '#4a6a7a', sleeve: '#4a6a7a', hair: 'shimada', pose: 'stand', obi: '#c8402a', collar: '#f4ecdc' },
  meiji: { skin: 6, top: 'robe', topCol: '#f0e8d4', legs: 'robe', legCol: '#b8282a', sleeve: '#f0e8d4', hat: 'kanmuri', hatCol: '#1e1a1c', pose: 'stand', item: 'shaku', collar: '#c8a050' },
  puller: { skin: 4, top: 'tunic', topCol: '#2a3a5a', legs: 'skin', hat: 'band', hatCol: '#efe8d8', hair: 'short', pose: 'walk', obi: '#efe8d8' },
  qipaoSit: { skin: 6, top: 'coat', topCol: '#2a2a30', legs: 'trousers', legCol: '#2a2a30', hat: 'top', hatCol: '#1e1a1c', hair: 'short', pose: 'sit', beard: 1 },
  topknotSam: { skin: 4, top: 'robe', topCol: '#3a4a5a', legs: 'trousers', legCol: '#4a4a52', sleeve: '#3a4a5a', hair: 'chonmage', pose: 'stand', sword: 1, collar: '#efe8d8', obi: '#c8b088' },
  cutSam: { skin: 4, top: 'suit', topCol: '#2e2e36', legs: 'trousers', legCol: '#2e2e36', sleeve: '#2e2e36', hair: 'short', pose: 'stand', tie: '#5a2a2e' },
  meijiLady: { skin: 6, top: 'dress', topCol: '#7a3a5a', legs: 'skirt', legCol: '#7a3a5a', sleeve: '#7a3a5a', hair: 'bun', pose: 'walk', item: 'umbrella' },
  schoolKid: { skin: 6, top: 'robe', topCol: '#3a4a6a', legs: 'trousers', legCol: '#5a5a62', hair: 'short', pose: 'stand', small: 0.72, item: 'book' },
  schoolKid2: { skin: 6, top: 'robe', topCol: '#a84a4a', pattern: 'checks', legs: 'skirt', legCol: '#5a3a4a', hair: 'bun', pose: 'stand', small: 0.7 },
  ainuMan: { skin: 4, top: 'robe', topCol: '#2a3a4a', pattern: 'lace', legs: 'robe', legCol: '#2a3a4a', sleeve: '#2a3a4a', hair: 'long', beard: 1, beardCol: '#2a221e', pose: 'stand', collar: '#e8dcc0', hat: 'band', hatCol: '#8a3a2a' },
  ainuWoman: { skin: 4, top: 'robe', topCol: '#3a2a3a', pattern: 'waves', legs: 'robe', legCol: '#3a2a3a', sleeve: '#3a2a3a', hair: 'long', pose: 'stand', hat: 'band', hatCol: '#2a3a5a', collar: '#efe6d2' },
  ryukyu: { skin: 4, top: 'robe', topCol: '#e0c060', pattern: 'checks', legs: 'robe', legCol: '#2a4a7a', sleeve: '#e0c060', hair: 'bun', hat: 'band', hatCol: '#b8282a', pose: 'stand' },
});

CAM.push([462.5, 1262], [465, 1270], [467.5, 1276], [470, 1281], [472.5, 1286], [474.5, 1294], [477, 1300], [479.5, 1306], [482, 1313], [484.5, 1316], [487, 1324], [489.5, 1332], [492, 1344], [494.5, 1372], [497, 1380], [499.5, 1396], [502, 1412], [504.5, 1418], [507, 1422], [509.5, 1426], [511.2, 1434]);
ZONES.push([1254, 1262.5, [150, 140, 104]], [1264, 1291, [56, 84, 104]], [1293, 1362, [140, 126, 96]], [1367, 1385, [226, 228, 232]], [1389, 1404, [196, 176, 120]], [1406, 1440, [52, 82, 108]]);
SEAS.push([1263.6, 1291.4], [1405.6, 1440]);
BUMPS.far.push([1256, 1424, 34, 10, 22]);

SKY.push([460.6, ['#7a8898', '#9aa4ae', '#bcbcb8', '#c8c2b8']], [473.6, ['#5a76a8', '#a4a4b8', '#f0c8a0', '#f8d8a8']], [483.2, ['#2a3058', '#4a4a6e', '#a87a7a', '#e8a878']], [493, ['#8a98ac', '#b0bac6', '#d8dce2', '#e6e8ea']], [497.8, ['#3a8ad8', '#7ec0e8', '#d4f0ee', '#f4f0d8']], [501.8, ['#5a6878', '#7a8894', '#a4aab0', '#b4b6b4']]);
AMB.push([460.6, [230, 232, 236]], [473.6, [255, 236, 220]], [483.2, [210, 180, 180]], [493, [226, 232, 246]], [497.8, [255, 252, 240]], [501.8, [214, 218, 226]]);
GRADE.push([460.6, [170, 180, 190, 0.14]], [473.6, [255, 200, 150, 0.12]], [483.2, [255, 190, 130, 0.14]], [493, [180, 200, 235, 0.18]], [497.8, [220, 250, 240, 0.06]], [501.8, [150, 165, 185, 0.18]]);
ERAS.push(
  [460.6, 473.8, LOOK(['#7a8898', '#9aa4ae', '#bcbcb8', '#c8c2b8'], [230, 232, 236], [170, 180, 190, 0.14], { motes: 0.2 })],                                  // black ships: grey sea haze
  [473.8, 483.4, LOOK(['#5a76a8', '#a4a4b8', '#f0c8a0', '#f8d8a8'], [255, 236, 220], [255, 200, 150, 0.12], { rays: 0.8, motes: 0.6 })],                    // a new era: dawn
  [483.4, 493.2, LOOK(['#2a3058', '#4a4a6e', '#a87a7a', '#e8a878'], [210, 180, 180], [255, 190, 130, 0.14], { motes: 0.5, mote: [255, 220, 170] })],       // Meiji dusk and gaslight
  [493.2, 497.8, LOOK(['#8a98ac', '#b0bac6', '#d8dce2', '#e6e8ea'], [226, 232, 246], [180, 200, 235, 0.18], { snow: 1, motes: 0 })],                          // Hokkaido: snow
  [497.8, 501.8, LOOK(['#3a8ad8', '#7ec0e8', '#d4f0ee', '#f4f0d8'], [255, 252, 240], [220, 250, 240, 0.06], { rays: 0.8, motes: 0.3 })],                   // Okinawa: tropical light
  [501.8, 511.6, LOOK(['#5a6878', '#7a8894', '#a4aab0', '#b4b6b4'], [214, 218, 226], [150, 165, 185, 0.18], { motes: 0.2 })],                                 // Tsushima: steel grey
);
WX.push(['mist', 460.8, 473.4, [200, 204, 210], 0.26], ['snowfall', 493.2, 497.8, null, 1], ['mist', 502, 511.4, [190, 196, 204], 0.1]);
PAPER_SUN.push([474, 483]);
ZOOM.push([484, 485.4, 486.6, 488, 0.18]);

// ---- the black ships
const T_1853 = ev('y1853', 462.8), T_BLACK = ev('blackhulled', 466.0), T_SALUTE = ev('salute', 468.6);
[[1255.2, 'shoreSam'], [1257.6, 'shoreTown'], [1260, 'shoreWoman'], [1262, 'shoreSam']].forEach(([a, v], i) => add('person', 'main', a, { v, z: 2 + i * 0.1, scale: P2, popAt: T_1853 - 1 + i * 0.15, foldAt: 476 + i * 0.1, act: (t) => ({ head: -6 + (t > T_SALUTE ? -4 : 0), lean: t > T_SALUTE && t < T_SALUTE + 1.2 ? -6 : 0 }) }));
add('blackship', 'main', 1276, { z: 0.8, scale: 0.82, y: 2, popAt: T_1853, move: (t) => -clamp((t - T_1853) * 0.9, 0, 4) });
add('blackship', 'main', 1287, { v: 1, z: 0.7, scale: 0.7, y: 2, popAt: T_1853 + 0.6, move: (t) => -clamp((t - T_1853 - 0.6) * 0.8, 0, 3.6) });
for (let a = 1264; a < 1291; a += 3.2) add('wave', 'front', a, { v: (R() * 4) | 0, scale: 1.3 + R() * 0.3 });
for (const [a, v, s] of [[1270, 2, 0.5], [1250, 1, 0.5]]) add('jmount', 'far', a, { v, scale: s });

// ---- the shogun falls; Meiji; a rickshaw races by
const T_FELL2 = ev('shogunfell', 476.0), T_MEIJI = ev('meiji', 477.8), T_RACE = ev('raced', 479.6);
add('nobori', 'main', 1295.6, { v: 2, z: 0.5, scale: 1, popAt: 473.8, foldAt: T_FELL2 });
add('person', 'main', 1300.4, { v: 'meiji', z: 2, scale: P2, popAt: T_MEIJI - 0.4, loud: 1.2, act: () => ({ head: -2 }) });
add('nobori', 'main', 1302.8, { v: 3, z: 0.6, scale: 1.05, popAt: T_MEIJI, loud: 1.2 });
add('rickshaw', 'main', 1300, { z: 2.4, scale: 1, popAt: T_RACE - 0.8, move: (t) => clamp((t - T_RACE) * 3.2, 0, 11) });

// ---- topknots, and the new things, as the gas lamps light
const T_TOP = ev('topknots', 485.4), T_RAIL = ev('railways', 488.6), T_FAC = ev('factories', 489.4), T_SCH = ev('schools', 490.2), T_PAR = ev('parliament', 491.0);
add('person', 'main', 1316.2, { v: 'topknotSam', z: 2, scale: P2, popAt: 483.2, foldAt: T_TOP + 0.6, act: (t) => { const k = sramp(t, T_TOP - 1.2, T_TOP - 0.4); return { head: 6 * k, front: [-160 * k - 20, -10 - 40 * k], back: [-20, -10] }; } });
add('person', 'main', 1316.2, { v: 'cutSam', z: 2, scale: P2, popAt: T_TOP + 0.9, act: () => ({ head: -4 }) });
add('train', 'main', 1322, { z: 1.2, scale: 0.8, popAt: T_RAIL - 0.4, foldAt: 494.6, move: (t) => clamp((t - T_RAIL) * 2.4, 0, 9) });
add('brickmill', 'main', 1339, { z: 0.3, scale: 0.78, popAt: T_FAC, loud: 1.8, winOn: (t) => 0.8 * sramp(t, T_FAC + 0.6, T_FAC + 1.6) });
add('meijischool', 'main', 1348.6, { z: 0.3, scale: 0.78, popAt: T_SCH, loud: 1.6, winOn: (t) => 0.7 * sramp(t, T_SCH + 0.6, T_SCH + 1.6) });
add('person', 'main', 1345.6, { v: 'schoolKid', z: 2, scale: P2, popAt: T_SCH + 0.3 }); add('person', 'main', 1347, { v: 'schoolKid2', z: 2.1, scale: P2, popAt: T_SCH + 0.4 });
add('diet', 'main', 1357.6, { z: 0.3, scale: 0.72, popAt: T_PAR, loud: 2, wide: 6 });
add('person', 'main', 1328.6, { v: 'meijiLady', z: 2.2, scale: P2, popAt: T_RAIL + 0.6, pace: 4, move: (t) => clamp((t - T_RAIL - 0.8) * 0.4, 0, 1.6), act: (t) => (t > T_RAIL + 4.8 ? { walk: undefined } : {}) });
const LAMPS = [1308, 1313, 1320, 1326, 1333, 1344, 1353, 1362];
LAMPS.forEach((a, i) => add('lamp', 'main', a, { v: 0, z: 1.6, scale: 1.05, popAt: 483.4 + i * 0.1, foldAt: 494.4, lit: (t) => sramp(t, 486 + i * 0.6, 486.4 + i * 0.6) * (0.9 + 0.1 * fbm(t * 5 + i, 3)) }));
grassRun(1293, 1362, 4.4, 'main', { skip: (a) => a > 1294 && a < 1361 });

// ---- Hokkaido and Okinawa
const T_AINU = ev('ainu', 494.8), T_HOK = ev('hokkaido', 496.2), T_RYU = ev('ryukyu', 498.2), T_OKI = ev('okinawa', 499.6);
add('chise', 'main', 1376.6, { z: 0.4, scale: 0.9, popAt: T_AINU - 0.8, loud: 1.4 });
add('person', 'main', 1372.4, { v: 'ainuMan', z: 2, scale: P2, popAt: T_AINU - 0.4 }); add('person', 'main', 1380.6, { v: 'ainuWoman', z: 2, scale: P2, flip: true, popAt: T_AINU - 0.2 });
for (const a of [1370.4, 1383.0]) add('sugi', 'main', a, { v: 1, z: 0, scale: 0.7 });
add('shuri', 'main', 1397.4, { z: 0.3, scale: 0.72, popAt: T_RYU - 0.4, loud: 1.8, wide: 6 });
add('shisa', 'main', 1392.8, { z: 1.6, scale: 1, popAt: T_RYU }); add('shisa', 'main', 1402.0, { z: 1.6, scale: 1, flip: true, popAt: T_RYU + 0.2 });
add('person', 'main', 1394.6, { v: 'ryukyu', z: 2, scale: P2, popAt: T_RYU + 0.3 });
for (const a of [1390.8, 1403.4]) add('palm', 'main', a, { z: 0, scale: 0.8 });

// ---- Tsushima
const T_RUS = ev('russia', 503.8);
add('battleship', 'main', 1412.6, { v: 0, z: 0.8, scale: 0.78, y: 2, popAt: 501.6, flagZ: 1, move: (t) => clamp((t - 502) * 0.4, 0, 2) });
add('battleship', 'main', 1419.4, { v: 0, z: 0.7, scale: 0.66, y: 2, popAt: 502 });
add('battleship', 'main', 1427.6, { v: 1, z: 0.8, scale: 0.72, y: 2, flip: true, popAt: 502.2, foldAt: T_RUS + 0.6 });
add('battleship', 'main', 1434.0, { v: 1, z: 0.7, scale: 0.6, y: 2, flip: true, popAt: 502.4, foldAt: T_RUS + 1.3 });
for (let a = 1406.0; a < 1438.0; a += 3.2) add('wave', 'front', a, { v: (R() * 4) | 0, scale: 1.3 + R() * 0.3 });
grassRun(1254, 1438.0, 7, 'front', { s: 2, skip: (a) => (a > 1263 && a < 1292) || a > 1403.0 });

hook({
  lights(t, c, L, Em, Sm) {
    if (near(1280, c, 50) && t > T_1853 && t < 478) { for (const [a, h, d] of [[1276, 150, 0], [1287, 128, 0.6]]) Sm.push({ a: a - 4 + 0 * d, layer: 'main', h, t0: T_1853 + d, size: 1.2, life: 6, every: 0.4, rise: 160, drift: 6, alpha: 0.55, move: (tt) => -clamp((tt - T_1853 - d) * 0.9, 0, 4) }); const k = Math.exp(-(((t - T_SALUTE) / 0.12) ** 2)); if (k > 0.02) L.push({ a: 1274, h: 40, r: 400, k: 1.2 * k, color: [255, 220, 150] }); if (t > T_SALUTE) Sm.push({ a: 1274, layer: 'main', h: 30, t0: T_SALUTE, t1: T_SALUTE + 0.5, size: 1, life: 4, every: 0.12, rise: 50, drift: -3, alpha: 0.6 }); }
    if (near(1339, c, 60) && t > T_FAC) Sm.push({ a: 1339 + 150 * 0.78 / 17.45, layer: 'main', h: 230, t0: T_FAC + 0.4, size: 1, life: 6, every: 0.5, rise: 180, drift: 4, alpha: 0.45 });
    if (near(1330, c, 60) && t > T_RAIL) Sm.push({ a: 1322, layer: 'main', h: 100, t0: T_RAIL, t1: 494, size: 0.9, life: 4, every: 0.3, rise: 120, drift: -5, alpha: 0.5, move: (tt) => clamp((tt - T_RAIL) * 2.4, 0, 9) });
    if (near(1424, c, 50)) for (const [a, tg] of [[1412.6, 502.8], [1419.4, 503.4], [1427.6, 503.0]]) { if (t < tg || t > tg + 5) continue; const k = Math.exp(-(((t - tg) / 0.12) ** 2)); if (k > 0.02) L.push({ a: a + 2, h: 40, r: 380, k: 1.2 * k, color: [255, 210, 150] }); Sm.push({ a: a + 2, layer: 'main', h: 40, t0: tg, t1: tg + 0.5, size: 1.1, life: 4, every: 0.12, rise: 60, drift: 3, alpha: 0.6 }); }
  },
  over(g, st, t) {
    const { W, H } = st, u = st.eu, p = por(st);
    // the topknot falls
    const tk = t - T_TOP; if (tk > 0 && tk < 1.4) { const [x, y] = st.place('main', 1316.2 - 0.3, 170 - tk * tk * 260, t); g.save(); g.translate(x, y); g.rotate(tk * 4); g.fillStyle = '#1e1612'; g.beginPath(); g.ellipse(0, 0, 8 * u, 3 * u, 0, 0, 7); g.fill(); g.restore(); }
    // the map: the far north and the far south become part of the new Japan
    if (t > T_AINU - 0.6 && t < 503) {
      const k = drop(t, T_AINU - 0.4, 501.4), x = W * (p ? 0.5 : 0.24), y = H * lerp(-0.4, p ? 0.06 : 0.08, k), s = p ? 0.6 : 0.78;
      card(st, g, x, y + 110 * u * s, s, Math.sin(t * 0.5) * 1.2 * DEG, (g2) => { put(g2, st.fx.plancard, 0.3, 4, 6); g2.save(); g2.translate(18, -16); japanMap(g2, { k: 8.5, okinawa: 1, highlight: { hokkaido: sramp(t, T_HOK - 0.3, T_HOK + 0.5), okinawa: sramp(t, T_OKI - 0.3, T_OKI + 0.5) } }); g2.restore(); }, 1, 130);
    }
  },
});
