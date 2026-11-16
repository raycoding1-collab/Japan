// 10. The floating world. Cherry blossom and peace, with Fuji on the horizon for the first time; the great
// doors closing on the shore, and Dejima's Dutch flag in Nagasaki harbour; Edo: Nihonbashi, crowds, a fire
// tower, a sushi stall, the kabuki theatre; fireworks over the Sumida from Ryōgoku bridge; Bashō by his old
// pond as the frog jumps in; a print shop, and a print built up colour by colour, worth a bowl of noodles;
// the Great Wave itself rising out of the sea; and Europe falling in love: an easel, and Monet's bridge.
import { add, hook, grassRun, ev, drop, near, flick, card, closeUp, por, PS, P2, R, CAM, ZONES, SEAS, BUMPS, SKY, AMB, GRADE, ERAS, WX, NIGHTS, ZOOM, PAPER_SUN, FLOCKS, LOOK, W_, PAL } from './film_api.js';
import { LOOKS } from './people.js';
import { KINDS } from './cutouts.js';
import { clamp, sramp, lerp, hash, fbm, DEG } from './util.js';
import { put, strip, ellipse } from './paper.js';
import { japanMap, PLACES, wavePrint } from './sky_japan.js';

const TOWN = (topCol, o = {}) => ({ skin: 4, top: 'robe', topCol, legs: 'robe', legCol: topCol, sleeve: topCol, hair: 'chonmage', pose: 'walk', obi: '#2a2a30', collar: '#efe8d8', ...o });
Object.assign(LOOKS, {
  hanamiSam: { skin: 4, top: 'robe', topCol: '#3a4a6a', legs: 'trousers', legCol: '#5a5a62', sleeve: '#3a4a6a', hair: 'chonmage', pose: 'sit', item: 'bowl', sword: 1, collar: '#efe8d8', obi: '#c8b088' },
  hanamiDancer: { skin: 6, top: 'robe', topCol: '#c8506a', pattern: 'dots', legs: 'robe', legCol: '#c8506a', sleeve: '#c8506a', hair: 'shimada', pose: 'stand', item: 'fan', obi: '#e8c060', collar: '#f8eedc' },
  hanamiWoman: { skin: 6, top: 'robe', topCol: '#4a7a8a', pattern: 'waves', legs: 'robe', legCol: '#4a7a8a', sleeve: '#4a7a8a', hair: 'shimada', pose: 'sit', obi: '#c8402a', collar: '#f8eedc' },
  edo1: TOWN('#3a5a7a', { pattern: 'checks' }), edo2: { ...TOWN('#c87a4a', { hair: 'shimada', obi: '#3a3a5a' }) }, edo3: TOWN('#5a4a3a'), edo4: { ...TOWN('#7a3a4a', { hair: 'shimada', pattern: 'dots', obi: '#e8c060' }) }, edo5: TOWN('#2a3a4a', { item: 'umbrella' }), edo6: TOWN('#6a7a4a', { pattern: 'stripe' }),
  edoStand: { ...TOWN('#3a5a7a', { pattern: 'checks' }), pose: 'stand' }, edoStand2: { ...TOWN('#c87a4a', { hair: 'shimada', obi: '#3a3a5a' }), pose: 'stand' },
  sushiChef: { skin: 4, top: 'robe', topCol: '#efeae0', legs: 'robe', legCol: '#2a3a5a', sleeve: '#efeae0', hair: 'chonmage', hat: 'band', hatCol: '#2a3a5a', pose: 'stand', obi: '#2a3a5a' },
  basho: { skin: 4, top: 'robe', topCol: '#4a3e34', legs: 'robe', legCol: '#3a3028', sleeve: '#4a3e34', hat: 'hood', hatCol: '#6a5a46', pose: 'sit', item: 'brush', collar: '#d8ccb0' },
  carver: { skin: 4, top: 'robe', topCol: '#2a3a5a', legs: 'trousers', legCol: '#2a3a5a', sleeve: '#2a3a5a', hair: 'chonmage', hat: 'band', hatCol: '#efe8d8', pose: 'kneel', item: 'brush', obi: '#c8b088' },
  printer: { skin: 4, top: 'robe', topCol: '#5a3a2a', legs: 'trousers', legCol: '#3a2a20', sleeve: '#5a3a2a', hair: 'chonmage', pose: 'kneel', obi: '#c8b088' },
  sobaEater: { ...TOWN('#6a7a4a', { pattern: 'stripe' }), pose: 'sit', item: 'bowl' },
  waveRower: { skin: 4, top: 'tunic', topCol: '#2a3a5a', hair: 'chonmage', pose: 'kneel' },
  vangogh: { skin: 6, top: 'coat', topCol: '#3a5a9a', legs: 'trousers', legCol: '#3a3a40', hat: 'wide', hatCol: '#e0c050', hair: 'short', hairCol: '#b85a2a', beard: 1, beardCol: '#c8642a', pose: 'stand', item: 'brush' },
  monet: { skin: 6, top: 'coat', topCol: '#e8e4d8', legs: 'trousers', legCol: '#5a5a60', hat: 'wide', hatCol: '#d8c890', hair: 'short', hairCol: '#e8e4dc', beard: 1, beardCol: '#f0ece4', pose: 'stand', item: 'brush' },
});
// Van Gogh's easel, with his copy of a Hiroshige plum tree in blossom
KINDS.vgeasel = { bake(mk) { const sh = mk('vgeasel', [-50, -190, 50, 6]); sh.piece([[-34, 4], [-8, -180], [-2, -180], [-28, 4]], '#7a5a3e', { round: 1 }).piece([[34, 4], [8, -180], [2, -180], [28, 4]], '#6a4a32', { round: 1 }); sh.piece(rect(-44, -170, 44, -66), '#f0e6c8', { round: 1, lift: 1.4, paint: (g) => { g.fillStyle = '#c8402a'; g.fillRect(-40, -166, 80, 30); g.fillStyle = '#e8d070'; g.fillRect(-40, -136, 80, 30); g.fillStyle = '#7a9a4a'; g.fillRect(-40, -106, 80, 36); g.strokeStyle = '#2a2220'; g.lineWidth = 4; g.beginPath(); g.moveTo(-36, -76); g.quadraticCurveTo(-10, -110, 6, -150); g.moveTo(-10, -112); g.lineTo(30, -126); g.stroke(); g.fillStyle = '#f8f0f0'; for (let i = 0; i < 18; i++) { g.beginPath(); g.arc(-24 + (i * 37) % 60, -150 + (i * 23) % 70, 2.6, 0, 7); g.fill(); } } }); sh.piece(rect(-46, -64, 46, -60), '#7a5a3e', { round: 1, lift: 1 }); return { spr: sh.finish({ shadowBlur: 4 }) }; }, draw(g, P, t, e, env) { put(g, P.spr, env.sh, 3, 4); } };
function rect(x0, y0, x1, y1) { return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]; }

CAM.push([391.4, 1040], [394.5, 1048], [396.5, 1058], [399, 1066], [401.5, 1072], [404, 1078], [406.5, 1090], [409, 1097], [411.5, 1104], [414, 1112], [416.5, 1119], [419, 1127], [421.5, 1135], [424, 1141], [426.5, 1152], [429, 1158], [431.5, 1160], [434, 1166], [436.5, 1174], [439, 1178], [441.5, 1182], [444, 1188], [446.5, 1205], [449, 1210], [451.5, 1212], [453.5, 1220], [456, 1236], [458.5, 1242], [460.5, 1252]);
ZONES.push([1034, 1060, [120, 128, 80]], [1062, 1086, [48, 92, 122]], [1088, 1089.6, [140, 124, 92]], [1090.6, 1097.4, [52, 86, 104]], [1098.6, 1130, [150, 130, 96]], [1131.4, 1148.6, [40, 66, 92]], [1150, 1157, [100, 120, 76]], [1157.8, 1163.4, [52, 80, 72]], [1164.4, 1190, [150, 134, 100]], [1192, 1232, [40, 78, 120]], [1234, 1242, [130, 140, 84]], [1243, 1249.4, [56, 96, 90]], [1250.6, 1262, [126, 140, 84]]);
SEAS.push([1061.6, 1086], [1090.6, 1097.4], [1131.4, 1148.6], [1157.8, 1163.4], [1191.6, 1232.4], [1243, 1249.4]);
BUMPS.far.push([1030, 1270, 36, 10, 24]);

SKY.push([389.8, ['#8ab0d8', '#bcd0e0', '#f4e4e8', '#f8e8e0']], [404.6, PAL.DAY], [418.6, PAL.DAY], [420.4, ['#0a0e24', '#141a38', '#262c52', '#3a3e64']], [424.4, ['#0a0e24', '#141a38', '#262c52', '#3a3e64']], [426, ['#8aa8a8', '#a8c0b8', '#d8e2d0', '#e4e8d8']], [434.6, PAL.DAY]);
AMB.push([389.8, [255, 248, 248]], [418.6, W_], [420.4, [90, 92, 132]], [424.4, [90, 92, 132]], [426, [236, 244, 236]], [434.6, W_]);
GRADE.push([389.8, [255, 220, 230, 0.1]], [418.6, [255, 210, 160, 0.1]], [420.4, [140, 150, 220, 0.14]], [426, [190, 220, 190, 0.1]], [434.6, [255, 220, 170, 0.1]]);
NIGHTS.push([418.8, 426.2]);
ERAS.push(
  [389.8, 395.4, LOOK(['#8ab0d8', '#bcd0e0', '#f4e4e8', '#f8e8e0'], [255, 248, 248], [255, 220, 230, 0.1], { motes: 0.6, mote: [255, 230, 240] })],   // peace: cherry blossom
  [395.4, 404.8, LOOK(['#6a9ac8', '#a4c0d4', '#e8ece0', '#f4ecd8'], [255, 252, 246], [220, 235, 240, 0.06], { motes: 0.3 })],                          // Nagasaki harbour
  [404.8, 419.2, LOOK(['#5a90c8', '#98bcd8', '#ecdcc0', '#f6cf98'], [255, 244, 226], [255, 205, 150, 0.12], { rays: 0.7, motes: 0.8, mote: [255, 226, 180] })], // Edo: a lively afternoon
  [419.2, 424.8, LOOK(['#0a0e24', '#141a38', '#262c52', '#3a3e64'], [90, 92, 132], [140, 150, 220, 0.14], { motes: 0.2 })],                            // fireworks on a summer night
  [424.8, 434.6, LOOK(['#8aa8a8', '#a8c0b8', '#d8e2d0', '#e4e8d8'], [236, 244, 236], [190, 220, 190, 0.1], { motes: 0.3, mote: [230, 255, 230] })],    // Bashō's old pond: green, after rain
  [434.6, 445.2, LOOK(['#8aa0b8', '#b8bcc0', '#ecdcc4', '#f2d2a8'], [255, 240, 220], [255, 220, 170, 0.1], { motes: 0.5 })],                            // the print shop
  [445.2, 453.4, LOOK(['#c8c4b4', '#d8d0bc', '#e8dcc4', '#ecdfc6'], [244, 238, 226], [120, 150, 190, 0.12], { motes: 0 })],                             // the Great Wave: the print's own pale sky
  [453.4, 460.8, LOOK(['#6a9ad0', '#a8c4dc', '#f0e4b8', '#f8d890'], [255, 244, 220], [255, 214, 140, 0.12], { rays: 1, motes: 0.8, mote: [255, 236, 170] })], // Europe: a golden afternoon
);
WX.push(['petals', 390.4, 404.6, null, 1], ['kasumi', 390.6, 396, null, 0.8], ['rain', 425, 433.8, [220, 230, 226], 0.35], ['mist', 425, 434, [220, 236, 224], 0.26]);
PAPER_SUN.push([453.6, 460.6]);
FLOCKS.push([405, 412, 1, 0.24, 8]);
ZOOM.push([426, 428, 431.6, 433.6, 0.22], [445.6, 447.6, 451.6, 453.4, -0.06]);

// ---- peace: cherry blossom, a party under the trees, Fuji on the horizon
const T_PEACE = ev('peace', 391.4);
[[1037, 0], [1043.6, 1], [1050.4, 0], [1055, 2]].forEach(([a, v], i) => add('sakura', 'main', a, { v, z: 0, scale: 0.95, bloom: (t) => sramp(t, T_PEACE + i * 0.25, T_PEACE + 1.4 + i * 0.25) }));
add('person', 'main', 1038.6, { v: 'hanamiSam', z: 2, scale: P2, popAt: T_PEACE, act: (t) => ({ head: -10, front: [-80 + Math.sin(t * 0.9) * 6, -60] }) });
add('person', 'main', 1042.8, { v: 'hanamiWoman', z: 2.1, scale: P2, flip: true, popAt: T_PEACE + 0.2, act: (t) => ({ head: 6 }) });
add('person', 'main', 1046.6, { v: 'hanamiDancer', z: 2, scale: P2, popAt: T_PEACE + 0.4, act: (t) => { const k = Math.sin(t * 2.2); return { lean: k * 6, head: -6 + k * 6, front: [-150 + k * 30, -20], back: [-60 - k * 30, -30] }; } });
add('jmount', 'far', 1066, { v: 2, scale: 0.5 });
for (const [a, v, s] of [[1040, 1, 0.5], [1086, 4, 0.55]]) add('jmount', 'far', a, { v, scale: s });
grassRun(1034, 1058, 4, 'main', { skip: (a) => a > 1038 && a < 1049 });

// ---- the doors close; Dejima; Nagasaki
const T_SHUT = ev('closed', 397.2), T_DUTCH = ev('dutch', 399.6), T_CHIN = ev('chinese', 400.4), T_NAG = ev('nagasaki', 402.4);
add('gatedoors', 'main', 1058.8, { z: 1, scale: 0.8, popAt: 395.6, loud: 1.6, shut: (t) => 1 - sramp(t, T_SHUT, T_SHUT + 1.4) * 0 - (1 - sramp(t, T_SHUT, T_SHUT + 1.4)) });
add('dejima', 'main', 1070.4, { z: 0.6, scale: 0.8, y: -2, popAt: T_DUTCH - 1, loud: 1.2 });
add('vocship', 'main', 1074, { z: 0.8, scale: 0.72, y: 2, popAt: T_DUTCH - 0.4, move: (t) => clamp((t - T_DUTCH) * 1.2, 0, 3.4) });
add('junk', 'main', 1081.4, { v: 1, z: 0.9, scale: 0.6, y: 3, popAt: T_CHIN - 0.2, move: (t) => -clamp((t - T_CHIN) * 0.6, 0, 1.4) });
for (let a = 1062; a < 1086; a += 3.2) add('wave', 'front', a, { v: (R() * 4) | 0, scale: 1.25 + R() * 0.3 });

// ---- Edo: a million people
const T_EDO = ev('edo', 405.8), T_MIL = ev('million', 408.2);
add('hinomi', 'main', 1087.4, { z: 0, scale: 0.9, popAt: T_EDO - 0.6 });
add('nihonbashi', 'main', 1094, { z: 1, scale: 0.84, popAt: T_EDO - 0.2, loud: 1.6, wide: 8 });
[[1092.6, 'edoStand'], [1095.2, 'edoStand2']].forEach(([a, v]) => add('person', 'main', a, { v, z: 1.2, scale: P2 * 0.95, y: 64, popAt: T_EDO + 0.2 }));
[[1101.4, 0], [1105.6, 1], [1109.4, 2], [1113.2, 0]].forEach(([a, v], i) => add('machiya', 'main', a, { v, z: 0, scale: 0.85, popAt: T_EDO + 0.3 + i * 0.15 }));
for (let i = 0; i < 12; i++) { const a = 1086 + i * 2.3 + hash(i) * 0.8, dir = i % 2 ? -1 : 1; if (a > 1089.8 && a < 1098.2) continue; add('person', 'main', a, { v: 'edo' + ((i % 6) + 1), z: 2 + (i % 3) * 0.1, scale: P2 * 0.95, flip: dir < 0, popAt: T_MIL + i * 0.12, pace: 4.6, move: (t) => dir * clamp((t - T_MIL - i * 0.12) * 0.45, 0, 2.2), act: (t) => (t > T_MIL + i * 0.12 + 4.9 ? { walk: undefined } : {}) }); }
add('himeji', 'mid', 1104, { scale: 0.34 }); for (const a of [1092, 1112]) add('machiya', 'mid', a, { v: 0, scale: 0.5 });
add('jmount', 'far', 1112, { v: 4, scale: 0.5 });

// ---- sushi, kabuki, fireworks
const T_SUSHI = ev('sushi', 414.8), T_KAB = ev('kabuki', 417.2), T_FW = ev('fireworks', 419.6);
add('person', 'main', 1116.4, { v: 'sushiChef', z: 1, scale: P2, popAt: T_SUSHI - 0.4, act: (t) => ({ lean: 10, head: 12, front: [-60 + Math.sin(t * 5) * 8, -60], back: [-50 + Math.sin(t * 5 + 1) * 8, -60] }) });
add('yatai', 'main', 1117, { z: 1.2, scale: 0.9, popAt: T_SUSHI - 0.5, loud: 1.2 });
add('person', 'main', 1120.4, { v: 'edoStand', z: 2, scale: P2, flip: true, popAt: T_SUSHI, act: (t) => ({ head: 6, front: [-120 + Math.max(0, Math.sin(t * 2)) * 30, -60] }) });
add('person', 'main', 1122.2, { v: 'edoStand2', z: 2.1, scale: P2, flip: true, popAt: T_SUSHI + 0.2, act: () => ({ head: 8 }) });
add('kabukiza', 'main', 1127.4, { z: 0.4, scale: 0.8, popAt: T_KAB - 0.4, loud: 1.8, wide: 6 });
for (const [a, v] of [[1124.6, 'edoStand'], [1130, 'edoStand2']]) add('person', 'main', a, { v, z: 2, scale: P2 * 0.95, popAt: T_KAB + 0.2, act: () => ({ head: -14 }) });
add('ryogoku', 'main', 1140, { z: 0.8, scale: 0.78, y: -6, popAt: T_FW - 1.2, loud: 1.4, wide: 10 });
for (const [a, v] of [[1137.4, 'edoStand'], [1139.8, 'edoStand2'], [1142.2, 'edoStand']]) add('person', 'main', a, { v, z: 0.9, scale: P2 * 0.85, y: 50, popAt: T_FW - 0.8, act: () => ({ head: -26 }) });
add('yakatabune', 'main', 1134.6, { z: 1.2, scale: 0.72, y: 0, popAt: T_FW - 0.6, move: (t) => clamp((t - T_FW) * 0.25, 0, 1.4) });
add('yakatabune', 'main', 1146, { z: 1.2, scale: 0.66, y: 0, popAt: T_FW - 0.4, move: (t) => -clamp((t - T_FW) * 0.2, 0, 1.2) });
for (let a = 1132; a < 1149; a += 3.4) add('wave', 'front', a, { v: (R() * 4) | 0, scale: 1.1 });
grassRun(1098, 1130, 4, 'main', { skip: (a) => a > 1100 && a < 1131 });

// ---- Bashō's old pond
const T_POND = ev('oldpond', 427.0), T_FROG = ev('frog', 428.6), T_WATER = ev('water', 430.8);
add('person', 'main', 1155.2, { v: 'basho', z: 2, scale: P2, popAt: T_POND - 1.4, act: (t) => ({ head: 8 + Math.sin(t * 0.3) * 2, lean: 6, front: [-60, -40] }) });
add('frog', 'main', 1158.4, { z: 2.4, scale: 1.3, popAt: T_POND - 0.6, jump: (t) => clamp((t - T_FROG) / 0.7) });
add('willow', 'main', 1152, { v: 1, z: 0, scale: 0.85 }); add('willow', 'main', 1165.6, { v: 2, z: 0, scale: 0.8 });
for (let a = 1158; a < 1164; a += 1.8) add('reeds', 'main', a, { v: (R() * 4) | 0, z: 3, scale: 0.65, loud: 0.3 });

// ---- the print shop, and the price of a print
const T_CARVE = ev('carve', 437.4), T_COL = ev('colour', 439.2), T_NOOD = ev('noodles', 443.0);
add('person', 'main', 1171, { v: 'carver', z: 2, scale: P2, popAt: T_CARVE - 1.4, act: (t) => ({ lean: 26, head: 16, front: [-60 + Math.sin(t * 6) * 6, -50] }) });
add('person', 'main', 1175.6, { v: 'printer', z: 2, scale: P2, popAt: T_CARVE - 1, act: (t) => ({ lean: 26, head: 14, front: [-60 + Math.cos(t * 4) * 14, -46 + Math.sin(t * 4) * 8] }) });
add('printline', 'main', 1181, { z: 0.6, scale: 1, popAt: T_COL });
add('person', 'main', 1186.6, { v: 'sobaEater', z: 2, scale: P2, popAt: T_NOOD - 0.6, act: (t) => ({ head: 12, front: [-80, -60], back: [-60 + Math.sin(t * 5) * 10, -70] }) });
add('machiya', 'main', 1167.6, { v: 1, z: 0, scale: 0.8, popAt: T_CARVE - 1.6 });
grassRun(1150, 1190, 4, 'main', { skip: (a) => a > 1153 && a < 1188 });

// ---- the Great Wave
const T_WAVE = ev('wave', 446.4), WAVE_A = 1208.6;
add('greatwave', 'main', WAVE_A, { z: 1, scale: 0.86, y: 6, popAt: T_WAVE - 0.6, loud: 2.6, wide: 18, rise: (t) => clamp(sramp(t, T_WAVE - 0.4, T_WAVE + 2.2) * 1.02) * (1 - sramp(t, T_EU - 1.4, T_EU + 1.2)) });
add('oshiokuri', 'main', 1200.8, { z: 0.8, scale: 0.8, y: -4, popAt: T_WAVE - 0.2 });
add('oshiokuri', 'main', 1213.6, { z: 1.4, scale: 0.82, y: -8, popAt: T_WAVE + 0.2 });
add('oshiokuri', 'main', 1224.6, { z: 0.8, scale: 0.7, y: -4, popAt: T_WAVE + 0.4 });
add('jmount', 'far', 1214, { v: 5, scale: 0.32 });
for (let a = 1192; a < 1232; a += 2.8) add('wave', 'front', a, { v: (R() * 4) | 0, scale: 1.5 + R() * 0.5 });

// ---- Europe falls in love with them
const T_EU = ev('europe', 454.4), T_VG = ev('vangogh', 456.2), T_MONET = ev('monet', 457.0);
add('cypress', 'main', 1234.4, { v: 1, z: 0, scale: 1 });
add('vgeasel', 'main', 1239.2, { z: 1.2, scale: 1, popAt: T_VG - 0.6, loud: 1 });
add('person', 'main', 1236.6, { v: 'vangogh', z: 2, scale: P2, popAt: T_VG - 0.4, act: (t) => ({ lean: 4, head: 2, front: [-120 + Math.sin(t * 4) * 8, -40] }) });
add('monetbridge', 'main', 1246.2, { z: 0.8, scale: 0.86, popAt: T_MONET - 0.3, loud: 1.4 });
add('person', 'main', 1251.6, { v: 'monet', z: 2, scale: P2, flip: true, popAt: T_MONET, act: (t) => ({ head: -4, front: [-120 + Math.sin(t * 3) * 8, -40] }) });
grassRun(1233, 1262, 4, 'main', { skip: (a) => a > 1235 && a < 1253 });
grassRun(1034, 1262, 7, 'front', { s: 2 });

const FW = [419.8, 420.6, 421.3, 422.0, 422.9, 423.6], FW_X = [0.32, 0.62, 0.46, 0.74, 0.22, 0.56], FW_Y = [0.18, 0.12, 0.26, 0.2, 0.14, 0.08];
hook({
  lights(t, c, L, Em, Sm) {
    if (near(1140, c, 40) && t > 419 && t < 426) for (let i = 0; i < FW.length; i++) { const k = Math.exp(-(((t - FW[i] - 0.15) / 0.5) ** 2)); if (k > 0.03) L.push({ a: 1140 + (FW_X[i] - 0.5) * 30, h: 500, r: 1400, k: 0.8 * k, color: [255, 170, 80] }); }
    if (near(1117, c, 40) && t > 416 && t < 426) L.push({ a: 1117, h: 100, r: 260, k: 0.6 * sramp(t, 418.6, 419.6), color: [255, 180, 100] });
  },
  ground(g, st, t, S, G) {
    // ripples on the old pond where the frog went in
    if (near(1160, G.c, 40) && t > T_FROG + 0.6) for (let i = 0; i < 4; i++) { const age = t - T_FROG - 0.7 - i * 0.45; if (age < 0 || age > 3.4) continue; const w = 0.4 + age * 0.9, a = 1160.6; G.run(a - w, a + w, (a0, a1) => G.arc(a0, a1, -5, 1.6, `rgba(230,244,240,${0.7 * (1 - age / 3.4)})`)); }
    // lily pads on Monet's pond
    if (near(1246, G.c, 40)) for (let i = 0; i < 9; i++) { const a = 1243.6 + i * 0.68, [x, y] = G.rad(a, -4 - (i % 3) * 3); g.fillStyle = i % 3 ? '#5a8a4a' : '#6a9a52'; g.beginPath(); g.ellipse(x, y, 9, 3.2, (a - G.c) * DEG, 0.3, 6.0); g.fill(); if (i % 3 === 0) { g.fillStyle = '#f0b8c8'; g.beginPath(); g.arc(x, y - 3, 2.6, 0, 7); g.fill(); } }
  },
  over(g, st, t) {
    const { W, H } = st, u = st.eu, p = por(st);
    // the map: one port open, Nagasaki
    if (t > T_NAG - 1.4 && t < 406.6) {
      const k = drop(t, T_NAG - 1.2, 405), x = W * (p ? 0.5 : 0.25), y = H * lerp(-0.4, p ? 0.08 : 0.1, k), s = p ? 0.6 : 0.8;
      card(st, g, x, y + 110 * u * s, s, Math.sin(t * 0.5) * 1.2 * DEG, (g2) => {
        put(g2, st.fx.plancard, 0.3, 4, 6); const { X, Y } = japanMap(g2, { k: 13 }); const [lo, la] = PLACES.nagasaki, pk = sramp(t, T_NAG - 0.2, T_NAG + 0.4);
        g2.fillStyle = `rgba(200,40,30,${pk})`; g2.beginPath(); g2.arc(X(lo), Y(la), 5 + Math.sin(t * 4) * 1.4, 0, 7); g2.fill(); g2.strokeStyle = `rgba(200,40,30,${0.5 * pk})`; g2.lineWidth = 1.4; g2.beginPath(); g2.arc(X(lo), Y(la), 10 + ((t * 8) % 10), 0, 7); g2.stroke();
      }, 1, 130);
    }
    // fireworks over the river, in the warm golds of Edo's gunpowder: a rising trail, a chrysanthemum of streaks, falling willow sparks
    if (t > 419.5 && t < 425.5) { g.globalCompositeOperation = 'lighter'; FW.forEach((tf, i) => { const age = t - tf; if (age < -0.7 || age > 3) return; const x = W * FW_X[i], y0 = st.hy, y = H * FW_Y[i] * (p ? 1.3 : 1) + H * 0.04; if (age < 0) { const f = (age + 0.7) / 0.7; for (let j = 0; j < 6; j++) st.stamp(g, st.dot(255, 200, 120), x, lerp(y0, y, f) + j * 6 * u, (5 - j * 0.6) * u, 0.9 - j * 0.12); return; }
      const n = 48, R0 = (110 + 50 * hash(i)) * u * (1 - Math.exp(-age * 3.2)), fade = Math.max(0, 1 - age / 3), drop = age * age * 14 * u;
      const fl = Math.exp(-age * 6); if (fl > 0.02) st.stamp(g, st.dot(255, 230, 170, '255,250,230'), x, y, 60 * u, 0.7 * fl);
      for (let j = 0; j < n; j++) { const a = (j / n) * Math.PI * 2 + i * 0.3, px = x + Math.cos(a) * R0, py = y + Math.sin(a) * R0 + drop; g.strokeStyle = `rgba(255,${170 + (j % 3) * 25},90,${0.55 * fade})`; g.lineWidth = Math.max(1, 1.6 * u); g.beginPath(); g.moveTo(x + Math.cos(a) * R0 * 0.55, y + Math.sin(a) * R0 * 0.55 + drop * 0.6); g.lineTo(px, py); g.stroke(); st.stamp(g, st.dot(255, 190 + (j % 3) * 20, 100, '255,246,210'), px, py, (5 - age) * u, fade * (0.6 + 0.4 * Math.sin(t * 24 + j))); }
    }); g.globalCompositeOperation = 'source-over'; }
    // the print, colour by colour; then its price
    if (t > T_CARVE - 0.6 && t < 446.2) {
      const k = drop(t, T_CARVE - 0.4, 445), x = W * (p ? 0.5 : 0.28), y = H * lerp(-0.4, p ? 0.08 : 0.1, k), s = p ? 0.55 : 0.78, blocks = sramp(t, T_CARVE, T_CARVE + 1) + sramp(t, T_COL - 0.4, T_COL + 3.6) * 4;
      card(st, g, x, y + 120 * u * s, s, Math.sin(t * 0.5) * 1.2 * DEG, (g2) => { put(g2, st.fx.printcard, 0.3, 4, 6); wavePrint(g2, blocks, t); }, 1, 150);
      if (t > T_NOOD - 0.3) { const nk = drop(t, T_NOOD - 0.2, 445), nx = x + (p ? 0 : 240 * u * s), ny = H * lerp(-0.3, p ? 0.34 : 0.14, nk); st.hang(g, st.fx.soba, nx, ny + 60 * u, p ? 0.8 : 1.1, Math.sin(t * 0.7) * 2 * DEG); if (!p) { g.font = `italic 400 ${Math.max(16, 34 * u)}px Fraunces, Georgia, serif`; g.textAlign = 'center'; g.fillStyle = `rgba(40,26,18,${0.85 * clamp(nk)})`; g.fillText('=', x + 170 * u * s, ny + 40 * u); } }
    }
    // spray from the Great Wave
    if (t > T_WAVE + 0.8 && t < 455) { const [x0, y0] = st.place('main', WAVE_A - 4, 400, t), k = sramp(t, T_WAVE + 0.8, T_WAVE + 2) * (1 - sramp(t, 452.6, 454.6)); for (let i = 0; i < 40; i++) { const ph = (t * (0.3 + hash(i) * 0.3) + hash(i * 3)) % 1, x = x0 - ph * 200 * u + (hash(i * 7) - 0.5) * 140 * u, y = y0 + ph * ph * 260 * u - hash(i * 5) * 60 * u; g.fillStyle = `rgba(244,242,234,${0.85 * k * (1 - ph)})`; g.beginPath(); g.arc(x, y, (2 + hash(i * 9) * 4) * u, 0, 7); g.fill(); } }
    // prints carried west to Europe
    if (t > T_EU - 0.2 && t < T_VG + 1.4) for (let i = 0; i < 5; i++) { const f = clamp((t - T_EU - i * 0.25) / 1.8); if (f <= 0 || f >= 1) continue; const [x0, y0] = st.place('main', 1214, 260, t), [x1, y1] = st.place('main', 1239.2, 140, t), x = lerp(x0, x1, f), y = lerp(y0, y1, f) - Math.sin(f * Math.PI) * 120 * u; g.save(); g.translate(x, y); g.rotate(Math.sin(t * 3 + i) * 0.4); g.fillStyle = '#ede0c4'; g.fillRect(-12 * u, -9 * u, 24 * u, 18 * u); g.fillStyle = '#2e5a8e'; g.fillRect(-9 * u, -6 * u, 18 * u, 8 * u); g.restore(); }
  },
});
