// 9. Guns and tea. A Portuguese ship, a matchlock fired on the beach, Japanese smiths filling a rack with
// their own guns; three warlords, one after another, and the crack across the land filling with gold as
// they force the country back together; Himeji, white as a heron. Rikyū's two-mat hut in soft rain: a
// samurai leaves his sword on the rack, bows, and crawls in. Beside it, Hideyoshi's room of gold.
// Then Sekigahara in the morning fog: banners coming out of the white, volleys, the fog lifting.
import { add, hook, grassRun, ev, drop, near, flick, card, por, PS, P2, R, CAM, ZONES, SEAS, BUMPS, SKY, AMB, GRADE, ERAS, WX, ZOOM, PAPER_SUN, LOOK, W_, PAL } from './film_api.js';
import { LOOKS } from './people.js';
import { KINDS } from './cutouts.js';
import { clamp, sramp, lerp, hash, fbm, DEG } from './util.js';
import { put, strip, ellipse } from './paper.js';

const ARM = (topCol, lace, crest, o = {}) => ({ skin: 4, top: 'armor', topCol, legs: 'skirt', legCol: topCol, hat: 'kabuto', hatCol: '#1e1a1c', lace, crest, pose: 'stand', sword: 1, ...o });
Object.assign(LOOKS, {
  nanbanTrader: { skin: 6, top: 'coat', topCol: '#2a2a30', legs: 'trousers', legCol: '#7a2a2a', hat: 'top', hatCol: '#1e1a1c', hair: 'curly', beard: 1, pose: 'stand', collar: '#efe8d8' },
  nanbanGunner: { skin: 6, top: 'coat', topCol: '#5a3a2a', legs: 'trousers', legCol: '#3a3a5a', hat: 'wide', hatCol: '#2a2420', hair: 'curly', beard: 1, pose: 'stand', item: 'teppo' },
  watchSam: { skin: 4, top: 'robe', topCol: '#4a5a6a', legs: 'trousers', legCol: '#3a4450', hair: 'chonmage', pose: 'stand', sword: 1, collar: '#e8dcc0', obi: '#2a2a30' },
  gunsmith: { skin: 3, top: 'tunic', topCol: '#d8ccb0', legs: 'trousers', legCol: '#8a7a5a', hat: 'band', hatCol: '#efe8d8', hair: 'chonmage', pose: 'kneel', item: 'hammer' },
  nobunaga: ARM('#2a2a30', [200, 60, 50], '#d4a838', { topCol: '#3a3a40' }),
  hideyoshi: ARM('#8a2a2a', [230, 200, 120], '#e8c050'),
  ieyasu: ARM('#1e1e24', [200, 170, 90], '#c9a24a'),
  rikyu: { skin: 4, top: 'robe', topCol: '#3a3634', legs: 'robe', legCol: '#2e2a28', sleeve: '#3a3634', hair: 'bald', pose: 'kneel', item: 'bowl', collar: '#d8ccb0' },
  teaGuest: { skin: 4, top: 'robe', topCol: '#4a5a4a', legs: 'trousers', legCol: '#3a463a', hair: 'chonmage', pose: 'walk', sword: 1, collar: '#e8dcc0', obi: '#2a2a30' },
  teaGuestK: { skin: 4, top: 'robe', topCol: '#4a5a4a', legs: 'trousers', legCol: '#3a463a', hair: 'chonmage', pose: 'kneel', collar: '#e8dcc0', obi: '#2a2a30' },
  hideyoshiTea: { skin: 4, top: 'robe', topCol: '#c8402a', pattern: 'checks', legs: 'robe', legCol: '#d4a838', sleeve: '#c8402a', hat: 'eboshi', hatCol: '#1e1a1c', pose: 'sit', item: 'bowl', collar: '#efe8d8' },
  ashiE: { skin: 4, top: 'armor', topCol: '#3a3a40', legs: 'trousers', legCol: '#2a2a30', hat: 'cone', hatCol: '#2a2a2a', pose: 'stand', item: 'teppo', flag: '#e8d8a8', flagMark: '#1e1a1c' },
  ashiE2: { skin: 4, top: 'armor', topCol: '#3a3a40', legs: 'trousers', legCol: '#2a2a30', hat: 'cone', hatCol: '#2a2a2a', pose: 'stand', item: 'spear', flag: '#efe8d8', flagMark: '#1e1a1c' },
  ashiW: { skin: 4, top: 'armor', topCol: '#5a2a2a', legs: 'trousers', legCol: '#3a2020', hat: 'cone', hatCol: '#2a2a2a', pose: 'stand', item: 'spear', flag: '#3a5a8a', flagMark: '#efe8d8' },
  ashiW2: { skin: 4, top: 'armor', topCol: '#5a2a2a', legs: 'trousers', legCol: '#3a2020', hat: 'cone', hatCol: '#2a2a2a', pose: 'stand', item: 'teppo', flag: '#c8402a', flagMark: '#efe8d8' },
});
// the great golden fan carried as a battle standard
KINDS.kinsen = { bake(mk) { return { spr: mk('kinsen', [-60, -300, 60, 6]).piece(strip(0, 4, 0, -220, 5, 4), '#3a2a20', { round: 1 }).piece([[0, -210], [-56, -268], [-30, -290], [0, -296], [30, -290], [56, -268]], '#d8a838', { round: 3, lift: 1.4, paint: (g) => { g.strokeStyle = 'rgba(120,80,10,.6)'; g.lineWidth = 1; for (let k = -5; k <= 5; k++) { g.beginPath(); g.moveTo(0, -212); g.lineTo(k * 11, -290); g.stroke(); } g.fillStyle = '#b8282a'; g.beginPath(); g.arc(0, -262, 12, 0, 7); g.fill(); } }).finish({ shadowBlur: 4 }) }; }, draw(g, P, t, e, env) { g.rotate(fbm(t * 0.6 + e.a, 2) * 2 * DEG); put(g, P.spr, env.sh, 3, 4); } };

CAM.push([339.5, 897], [342, 905], [344.5, 912], [347, 919], [349.5, 928], [351.5, 934], [354, 939], [356.5, 950], [359, 960], [361.5, 966], [364, 970], [367, 973], [370, 976], [372.5, 982], [375, 991], [377.5, 998], [380, 1006], [382.5, 1012], [385, 1017], [388, 1022], [389.7, 1032]);
ZONES.push([886, 910.5, [48, 92, 122]], [913, 946, [150, 136, 96]], [948, 962, [150, 140, 104]], [964, 996, [90, 110, 70]], [998, 1040, [120, 118, 80]]);
SEAS.push([886, 910.6]);
BUMPS.far.push([890, 1040, 36, 10, 26]); BUMPS.mid.push([1000, 1040, 20, 8, 10]);

SKY.push([338, PAL.DAY], [358.4, ['#7a8a8c', '#9aa6a4', '#bcc2b8', '#c8c8bc']], [372.4, ['#7a8a8c', '#9aa6a4', '#bcc2b8', '#c8c8bc']], [377.6, ['#a8acb0', '#c4c6c6', '#dcdcd8', '#e4e2dc']], [386.4, PAL.DAY]);
AMB.push([338, W_], [358.4, [224, 230, 226]], [377.6, [236, 236, 234]], [386.4, W_]);
GRADE.push([338, [230, 240, 240, 0.06]], [358.4, [180, 200, 190, 0.12]], [377.6, [220, 220, 220, 0.08]], [386.4, [255, 220, 170, 0.08]]);
ERAS.push(
  [338.2, 349.2, LOOK(['#5a96cc', '#9cc2dc', '#e4ecdc', '#f4ead0'], [255, 252, 244], [230, 240, 240, 0.06], { motes: 0.4 })],                              // the Portuguese: bright sea haze
  [349.2, 358.4, LOOK(['#3a74b6', '#86aacc', '#e6d4b4', '#f0c088'], [255, 238, 212], [255, 192, 124, 0.12], { rays: 0.8, motes: 0.6, mote: [255, 214, 160] })], // warlords and white castles: a clear amber autumn
  [358.4, 372.4, LOOK(['#7a8a8c', '#9aa6a4', '#bcc2b8', '#c8c8bc'], [224, 230, 226], [180, 200, 190, 0.12], { motes: 0.2 })],                              // Rikyū's hut: soft rain, moss
  [372.4, 377.8, LOOK(['#8a8a8c', '#a8a6a0', '#d8c8a0', '#e8c888'], [255, 236, 200], [255, 200, 110, 0.14], { motes: 0.8, mote: [255, 230, 150] })],     // the golden room
  [377.8, 386.2, LOOK(['#a8acb0', '#c4c6c6', '#dcdcd8', '#e4e2dc'], [236, 236, 234], [220, 220, 220, 0.08], { motes: 0 })],                                // Sekigahara: fog
  [386.2, 390.2, LOOK(['#6a96c8', '#a8c0d4', '#ecdcc4', '#f4d4a4'], [255, 244, 226], [255, 210, 160, 0.1], { rays: 1, motes: 0.6 })],                     // the fog lifts
);
WX.push(['maple', 349.6, 358.2, null, 0.5], ['rain', 358.6, 372, [210, 220, 220], 0.6], ['mist', 358.6, 372, [220, 230, 226], 0.28], ['fog', 377.8, 386.2, [236, 236, 234], 0.72]);
PAPER_SUN.push([386, 391]);
ZOOM.push([342.6, 344, 345.4, 347, 0.1], [366, 368, 371.4, 373, 0.14]);

// ---- the Portuguese, and the first guns
const T_PORT = ev('portuguese', 341.2), T_GUN = ev('guns', 343.2), T_OWN = ev('ownguns', 346.6);
add('ship', 'main', 893, { z: 0.8, scale: 0.86, y: 2, popAt: 338.4, move: (t) => clamp((t - 338.6) * 2.4, 0, 10) });
for (let a = 887; a < 910; a += 3.2) add('wave', 'front', a, { v: (R() * 4) | 0, scale: 1.3 + R() * 0.3 });
for (let a = 889; a < 910; a += 4) add('wave', 'main', a, { v: (R() * 4) | 0, z: 0.9, scale: 0.7, y: -2 });
add('person', 'main', 912.2, { v: 'nanbanTrader', z: 2, scale: P2, popAt: T_PORT, act: (t) => ({ head: -4, front: [-60 + Math.sin(t * 1.2) * 10, -40] }) });
add('person', 'main', 914.8, { v: 'nanbanGunner', z: 2.1, scale: P2, popAt: T_PORT + 0.4, act: (t) => { const aim = sramp(t, T_GUN - 0.8, T_GUN - 0.2), kick = Math.exp(-(((t - T_GUN - 0.1) / 0.15) ** 2)); return { lean: -kick * 6, head: -2, front: [-34 - aim * 58, -62 + aim * 60], back: [-20 - aim * 70, -30] }; } });
add('person', 'main', 918.2, { v: 'watchSam', z: 2, scale: P2, flip: true, popAt: T_PORT + 0.7, act: (t) => ({ lean: t > T_GUN ? -8 : 0, head: t > T_GUN && t < T_GUN + 2 ? -10 : 0 }) });
add('gunrack', 'main', 925.6, { z: 1, scale: 0.9, popAt: T_OWN - 0.8, count: (t) => clamp((t - T_OWN) * 6, 0, 10) });
add('person', 'main', 921.4, { v: 'gunsmith', z: 1.6, scale: P2, popAt: T_OWN - 0.6, act: (t) => ({ lean: 18, head: 12, front: [-110 + Math.max(0, Math.sin(t * 7)) * 40, -30] }) });

// ---- three warlords, a white castle
const T_WL = ev('warlords', 350.6), T_TOG = ev('together', 353.8), T_CAS = ev('castles', 355.6);
[['nobunaga', 933.6], ['hideyoshi', 937.6], ['ieyasu', 941.6]].forEach(([v, a], i) => add('person', 'main', a, { v, z: 2, scale: P2 * 1.05, popAt: T_WL + i * 0.9, loud: 1.2, act: (t) => { const k = sramp(t, T_TOG - 0.4, T_TOG + 0.6); return { head: -4, lean: 2 + k * 6, front: [-30 - k * 60, -20], back: [-20 - k * 50, -20] }; } }));
add('himeji', 'main', 952.4, { z: 0.2, scale: 0.72, popAt: T_CAS, loud: 2.4, wide: 10 });
add('pine', 'main', 944.6, { v: 1, z: 0.1, scale: 0.6 }); add('pine', 'main', 960.6, { v: 0, z: 0.1, scale: 0.55 });
add('himeji', 'mid', 932, { scale: 0.35, popAt: T_CAS + 0.3 });
for (const [a, v, s] of [[912, 1, 0.55], [940, 4, 0.6], [966, 1, 0.5]]) add('jmount', 'far', a, { v, scale: s });
grassRun(912, 962, 4, 'main', { skip: (a) => a > 911 && a < 927 || a > 932 && a < 961 });

// ---- Rikyū's hut in the rain, and the room of gold
const T_RIK = ev('rikyu', 361.8), T_DOOR = ev('door', 366.4), T_BOW = ev('bow', 368.6), T_SWORD = ev('sword', 370.2), T_GOLDR = ev('goldroom', 375.4);
add('teahut', 'main', 976, { z: 0.3, scale: 0.92, popAt: T_RIK - 1.2, loud: 1.4 });
add('person', 'main', 978.4, { v: 'rikyu', z: 0.5, scale: P2 * 0.88, y: 9, flip: true, popAt: T_RIK - 0.8, act: (t) => ({ lean: 16, head: 10, front: [-60 + Math.sin(t * 6) * 8, -40], back: [-50, -40] }) });
add('katanakake', 'main', 967.6, { z: 1.4, scale: 1, popAt: T_RIK - 0.6, has: (t) => sramp(t, T_SWORD - 0.2, T_SWORD + 0.4) });
add('person', 'main', 961.6, { v: 'teaGuest', z: 2, scale: P2, popAt: T_RIK + 1, foldAt: T_BOW - 0.3, pace: 3.6, move: (t) => clamp((t - T_RIK - 1.6) * 0.75, 0, 4.4) });
add('person', 'main', 966.0, { v: 'teaGuestK', z: 2, scale: P2, popAt: T_BOW - 0.3, foldAt: T_SWORD + 1.6, move: (t) => clamp((t - T_SWORD - 0.4) * 2.2, 0, 2.6), act: (t) => { const bow = sramp(t, T_BOW - 0.2, T_BOW + 0.4) * (1 - sramp(t, T_BOW + 1.2, T_BOW + 1.6)); return { lean: 18 + bow * 34, head: 10 + bow * 10, front: [-50 + bow * 20, -40], back: [-40, -40] }; } });
add('person', 'main', 973.8, { v: 'teaGuestK', z: 0.45, scale: P2 * 0.88, y: 9, popAt: T_SWORD + 1.9, act: () => ({ lean: 18, head: 10 }) });
add('toro', 'main', 984.4, { z: 1.2, scale: 1.1, popAt: T_RIK - 1, lit: () => 0.5 });
add('momiji', 'main', 987.4, { v: 2, z: 0, scale: 0.7 }); add('bamboo', 'main', 957.6, { v: 0, z: 0 });
add('goldroom', 'main', 994.4, { z: 0.3, scale: 0.92, popAt: T_GOLDR - 0.2, loud: 1.8 });
add('person', 'main', 994.4, { v: 'hideyoshiTea', z: 0.4, scale: P2 * 0.85, y: 9, popAt: T_GOLDR, act: (t) => ({ head: -6, front: [-80, -50] }) });
grassRun(962, 998, 4.2, 'main', { skip: (a) => a > 965 && a < 999 });

// ---- Sekigahara in the fog
const T_FOG = ev('fog', 380.6), T_IEY = ev('ieyasu', 383.6), T_DEC = ev('decided', 385.8);
const EAST = [[1003.6, 'ashiE'], [1006, 'ashiE2'], [1008.4, 'ashiE'], [1010.8, 'ashiE2']], WEST = [[1015.4, 'ashiW'], [1017.8, 'ashiW2'], [1020.2, 'ashiW'], [1022.6, 'ashiW2']];
EAST.forEach(([a, v], i) => add('person', 'main', a, { v, z: 1.6 + (i % 2) * 0.2, scale: P2, popAt: T_FOG - 1 + i * 0.2, foldAt: 390.6 + i * 0.12, act: (t) => ({ head: -4, front: v === 'ashiE' ? [-92, -2] : [-34, -62], back: v === 'ashiE' ? [-70, -60] : [-20, -10] }) }));
WEST.forEach(([a, v], i) => add('person', 'main', a, { v, z: 1.6 + (i % 2) * 0.2, scale: P2, flip: true, popAt: T_FOG - 0.6 + i * 0.2, foldAt: T_DEC + 0.2 + i * 0.22, act: (t) => ({ head: -4, front: v === 'ashiW2' ? [-92, -2] : [-34, -62], back: v === 'ashiW2' ? [-70, -60] : [-20, -10] }) }));
add('person', 'main', 1000.2, { v: 'ieyasu', z: 1.4, scale: P2 * 1.05, popAt: T_IEY - 0.4, foldAt: 391.2, act: (t) => ({ head: -4, front: [-60 - sramp(t, T_DEC, T_DEC + 0.6) * 80, -10] }) });
add('nobori', 'main', 997.6, { v: 2, z: 0.4, scale: 1, popAt: T_IEY - 0.2, foldAt: 391.4 }); add('kinsen', 'main', 1002, { z: 0.5, scale: 1, popAt: T_IEY, foldAt: 391.3 });
for (let a = 1004; a < 1030; a += 3.3) add('nobori', 'mid', a, { v: a < 1014 ? 2 : 1, scale: 0.5, popAt: T_FOG - 0.4, foldAt: a > 1014 ? T_DEC + (a - 1014) * 0.06 : 391 + (a - 1004) * 0.05 });
grassRun(998, 1034, 3.8, 'main', { skip: (a) => a > 999 && a < 1024 });
grassRun(886, 1036, 7, 'front', { s: 2 });

const VOLLEY = [T_FOG + 1.6, T_FOG + 3.0, T_FOG + 4.2];
hook({
  lights(t, c, L, Em, Sm) {
    if (near(915, c, 40) && t > T_GUN - 0.1 && t < T_GUN + 4) { const k = Math.exp(-(((t - T_GUN - 0.05) / 0.12) ** 2)); if (k > 0.02) L.push({ a: 917.6, h: 90, r: 300, k: 1.4 * k, color: [255, 220, 150] }); Sm.push({ a: 917.8, layer: 'main', h: 90, t0: T_GUN, t1: T_GUN + 0.6, size: 0.8, life: 3, every: 0.12, rise: 40, drift: -2, alpha: 0.7 }); }
    if (near(1012, c, 50)) for (const tv of VOLLEY) for (const [a] of [EAST[0], EAST[2]]) { if (t < tv - 0.1 || t > tv + 4) continue; const k = Math.exp(-(((t - tv) / 0.1) ** 2)); if (k > 0.02) L.push({ a: a + 2.8, h: 90, r: 260, k: 1.2 * k, color: [255, 220, 150] }); Sm.push({ a: a + 3, layer: 'main', h: 90, t0: tv, t1: tv + 0.4, size: 1, life: 3.4, every: 0.12, rise: 30, drift: 2, alpha: 0.6 }); }
  },
  ground(g, st, t, S, G) {
    // stepping stones to the tea hut, wet with rain
    if (near(970, G.c, 50)) for (const a of [962.6, 964.2, 965.6]) { const [x, y] = G.rad(a, -2); g.fillStyle = 'rgba(110,112,108,.9)'; g.beginPath(); g.ellipse(x, y, 12, 4, (a - G.c) * DEG, 0, 7); g.fill(); g.fillStyle = 'rgba(220,230,230,.35)'; g.beginPath(); g.ellipse(x - 3, y - 1, 5, 1.4, (a - G.c) * DEG, 0, 7); g.fill(); }
  },
});
