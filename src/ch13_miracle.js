// 13. The miracle. Houses spring up again as the crack across the land fills with gold; a new constitution;
// a chart of growth year by year; the Toyota line, stopped by a worker's cord and started again; a radio
// that almost fits a shirt pocket; Tokyo Tower and the Olympic flame; the first Shinkansen out of a tunnel,
// over a viaduct, past Fuji, and its successors after it, the cleaners bowing; Japan's bar overtaking West
// Germany's; the glowing neon city of the 1980s, the palace outweighing California; and the bubble bursting.
import { add, hook, grassRun, ev, drop, near, flick, card, closeUp, por, PS, P2, R, CAM, ZONES, SEAS, BUMPS, SKY, AMB, GRADE, ERAS, WX, NIGHTS, ZOOM, PAPER_SUN, LOOK, W_, PAL } from './film_api.js';
import { LOOKS } from './people.js';
import { clamp, sramp, lerp, hash, fbm, DEG } from './util.js';
import { put } from './paper.js';
import { brushColumns } from './sky_japan.js';

Object.assign(LOOKS, {
  rebuilder: { skin: 4, top: 'shirt', topCol: '#d8d0bc', sleeve: '#d8d0bc', legs: 'trousers', legCol: '#5a5a52', hat: 'band', hatCol: '#efe8d8', hair: 'short', pose: 'stand', item: 'hammer' },
  rebuilder2: { skin: 6, top: 'shirt', topCol: '#a8b0a0', sleeve: '#a8b0a0', legs: 'trousers', legCol: '#4a4a44', hair: 'short', pose: 'stand', item: 'shovel' },
  lineWorker: { skin: 4, top: 'shirt', topCol: '#c8ccd0', sleeve: '#c8ccd0', legs: 'trousers', legCol: '#5a6070', hat: 'whitecap', hatCol: '#f0eee8', pose: 'stand' },
  lineWorker2: { skin: 6, top: 'shirt', topCol: '#c8ccd0', sleeve: '#c8ccd0', legs: 'trousers', legCol: '#5a6070', hat: 'whitecap', hatCol: '#f0eee8', pose: 'stand' },
  fan64: { skin: 6, top: 'shirt', topCol: '#e8e4dc', sleeve: '#e8e4dc', legs: 'trousers', legCol: '#3a4a6a', hair: 'short', pose: 'stand' },
  fan64b: { skin: 6, top: 'dress', topCol: '#c8506a', legs: 'skirt', legCol: '#c8506a', hair: 'bob', pose: 'stand' },
  tessei: { skin: 6, top: 'shirt', topCol: '#e87a8a', sleeve: '#e87a8a', legs: 'trousers', legCol: '#3a3a44', hat: 'cap', hatCol: '#e87a8a', hair: 'bob', pose: 'stand' },
  salaryman: { skin: 4, top: 'suit', topCol: '#2e2e36', sleeve: '#2e2e36', legs: 'trousers', legCol: '#2e2e36', hair: 'short', pose: 'walk', item: 'bag' },
  salaryman2: { skin: 6, top: 'suit', topCol: '#3a3a44', sleeve: '#3a3a44', legs: 'trousers', legCol: '#3a3a44', hair: 'short', pose: 'walk', tie: '#2a4a7a' },
  officeLady: { skin: 6, top: 'suit', topCol: '#c8a0b0', sleeve: '#c8a0b0', legs: 'skirt', legCol: '#c8a0b0', hair: 'bob', pose: 'walk', tie: '#efeae0' },
});

CAM.push([576, 1584], [578.5, 1590], [581, 1596], [583.5, 1606], [586, 1612], [588.5, 1620], [591, 1630], [593.5, 1634], [596, 1636], [598.5, 1638], [601, 1642], [603.5, 1650], [606, 1656], [609, 1658], [612, 1662], [614.5, 1670], [617, 1678], [619.5, 1688], [622, 1692], [624.5, 1694], [627, 1696], [629.5, 1700], [632, 1704], [634.5, 1716], [637, 1722], [639.5, 1726], [642, 1738], [644.5, 1746], [647, 1752], [650, 1756], [653, 1760], [656, 1764], [659, 1768], [661.1, 1776]);
ZONES.push([1580, 1620, [140, 128, 96]], [1622, 1650, [120, 120, 118]], [1652, 1712, [126, 140, 96]], [1714, 1780, [104, 104, 108]]);
BUMPS.far.push([1580, 1780, 34, 10, 22]);

SKY.push([574.8, ['#7aa4cc', '#b4c8d8', '#e8e8e0', '#f2eedc']], [613.6, ['#3a86d0', '#7ab4e0', '#cce4f0', '#ecf0ec']], [634, ['#5a8ac0', '#a0b8cc', '#f0d4a8', '#f6c890']], [642, ['#0e0a24', '#1e1238', '#3a1e4a', '#5a2a52']], [659, ['#0e1018', '#161a24', '#262a34', '#30343e']]);
AMB.push([574.8, W_], [634, [255, 236, 210]], [642, [120, 100, 150]], [659, [90, 96, 110]]);
GRADE.push([574.8, [230, 235, 240, 0.06]], [613.6, [200, 225, 255, 0.06]], [634, [255, 200, 140, 0.12]], [642, [255, 120, 200, 0.14]], [659, [120, 140, 170, 0.2]]);
NIGHTS.push([641.4, 663]);
ERAS.push(
  [574.8, 588.4, LOOK(['#7aa4cc', '#b4c8d8', '#e8e8e0', '#f2eedc'], [255, 252, 244], [230, 235, 240, 0.06], { motes: 0.5 })],                         // rebuilding: a clean morning
  [588.4, 603.4, LOOK(['#8a9aa8', '#b4bcc4', '#dcdcd8', '#e8e4dc'], [240, 246, 248], [200, 230, 240, 0.08], { motes: 0.4 })],                         // the factory
  [603.4, 613.6, LOOK(['#7aa0c8', '#b0c0cc', '#ecdcc4', '#f4d4a8'], [255, 244, 228], [255, 214, 160, 0.1], { motes: 0.4 })],                          // the fifties
  [613.6, 634, LOOK(['#3a86d0', '#7ab4e0', '#cce4f0', '#ecf0ec'], [255, 252, 246], [200, 225, 255, 0.06], { rays: 0.6, motes: 0.3 })],               // 1964: clear autumn blue
  [634, 641.8, LOOK(['#5a8ac0', '#a0b8cc', '#f0d4a8', '#f6c890'], [255, 236, 210], [255, 200, 140, 0.12], { rays: 0.8, motes: 0.6 })],               // 1968: gold
  [641.8, 658.6, LOOK(['#0e0a24', '#1e1238', '#3a1e4a', '#5a2a52'], [120, 100, 150], [255, 120, 200, 0.14], { motes: 0.6, mote: [255, 200, 240] })], // the eighties: neon
  [658.6, 661.8, LOOK(['#0e1018', '#161a24', '#262a34', '#30343e'], [90, 96, 110], [120, 140, 170, 0.2], { motes: 0 })],                              // the bubble bursts
);
WX.push(['rain', 659.2, 662.4, [180, 190, 210], 1.2]);
PAPER_SUN.push([614, 633.6]);
ZOOM.push([593, 594.6, 597, 598.6, 0.14], [620.6, 622.6, 625.6, 627.6, 0.08], [655, 657, 659.6, 661, 0.1]);

// ---- rebuilding
const T_REB = ev('rebuilt', 577.0), T_CON = ev('constitution', 579.2), T_GROW = ev('tenpercent', 583.4);
[[1583.4, 1], [1588.2, 0], [1593, 1], [1598.4, 0], [1603, 1]].forEach(([a, v], i) => add('machiya', 'main', a, { v, z: 0.3, scale: 0.85, popAt: T_REB + 0.2 + i * 0.3, loud: 1.2 }));
add('person', 'main', 1586, { v: 'rebuilder', z: 2, scale: P2, popAt: T_REB, act: (t) => ({ lean: 10, front: [-160 + Math.max(0, Math.sin(t * 5)) * 70, -10] }) });
add('person', 'main', 1596.2, { v: 'rebuilder2', z: 2, scale: P2, popAt: T_REB + 0.4, act: (t) => { const k = Math.max(0, Math.sin(t * 2.4)); return { lean: 16 + k * 14, front: [-60 + k * 40, -20] }; } });
// growth: factories and cranes rise
for (const [a, i] of [[1607.6, 0], [1614.8, 1]]) add('factory', 'main', a, { z: 0.3, scale: 0.7, popAt: T_GROW + i * 0.5, loud: 1.4 });
add('crane', 'mid', 1610, { scale: 0.6, popAt: T_GROW + 0.8 }); add('crane', 'mid', 1622, { scale: 0.55, popAt: T_GROW + 1.2 });
grassRun(1580, 1620, 5, 'main', { skip: (a) => a > 1581 && a < 1618 });

// ---- the Toyota line: a cord anyone can pull
const T_TOY = ev('toyota', 590.0), T_CORD = ev('cord', 594.2), T_FIX = ev('fix', 596.2), T_KAI = ev('kaizen', 601.4);
const line = (t) => 0.42 * (clamp(t, 589.5, T_CORD) - 589.5 + clamp(t, T_FIX + 1.2, 603.4) - (T_FIX + 1.2));
add('factoryhall', 'main', 1636, { z: -0.5, scale: 0.92, popAt: 588.6, lamp: () => 1, loud: 1.6, wide: 8 });
add('conveyor', 'main', 1636, { z: 0.6, scale: 0.86, popAt: 589, stop: (t) => sramp(t, T_CORD, T_CORD + 0.2) * (1 - sramp(t, T_FIX + 1, T_FIX + 1.2)) });
[1626.4, 1631.6, 1636.8, 1642].forEach((a, i) => add('corolla', 'main', a, { v: i, z: 0.7, scale: 0.86, y: 19, popAt: 589.2 + i * 0.1, move: line }));
add('person', 'main', 1629, { v: 'lineWorker', z: 1, scale: P2, popAt: 589.6, act: (t) => { const k = sramp(t, T_CORD - 0.6, T_CORD) * (1 - sramp(t, T_CORD + 1.2, T_CORD + 1.8)); return { head: -10 - k * 20, front: [-40 - k * 140, -20], back: [-20, -20] }; } });
add('person', 'main', 1634.4, { v: 'lineWorker2', z: 1, scale: P2, popAt: 589.8, act: (t) => ({ lean: 14 + sramp(t, T_CORD + 0.4, T_CORD + 1) * 16, head: 14, front: [-70 + Math.sin(t * 4) * 8, -40] }) });
add('person', 'main', 1639.6, { v: 'lineWorker', z: 1, scale: P2, flip: true, popAt: 590, act: (t) => ({ lean: 10 + sramp(t, T_FIX - 0.6, T_FIX) * 18, head: 12, front: [-70 + Math.sin(t * 5) * 10, -40] }) });
add('person', 'main', 1645, { v: 'lineWorker2', z: 1, scale: P2, flip: true, popAt: 590.2, act: (t) => ({ head: t > T_CORD ? 4 : 10, front: [-50, -30] }) });

// ---- 1964: the tower, the flame, the first bullet train
const T_OLY = ev('olympics', 617.2), T_SK = ev('shinkansen', 621.4), T_GEN = ev('billions', 627.8);
add('tokyotower', 'main', 1668.6, { z: 0.2, scale: 0.68, popAt: 614.6, loud: 2, wide: 6 });
add('cauldron', 'main', 1677, { z: 0.4, scale: 0.9, popAt: T_OLY - 0.6, loud: 1.4 });
[[1673.6, 'fan64'], [1675.2, 'fan64b'], [1679.4, 'fan64']].forEach(([a, v], i) => add('person', 'main', a, { v, z: 2, scale: P2, flip: a > 1677, popAt: T_OLY - 0.2 + i * 0.1, act: (t) => ({ head: -20, front: [-150 + Math.sin(t * 6 + i) * 20, -20] }) }));
add('portal', 'main', 1681.2, { z: 1.6, scale: 0.9, popAt: 619.4 });
add('portal', 'main', 1705.2, { z: 1.6, scale: 0.9, flip: true, popAt: 619.6 });
for (const a of [1685.6, 1689.6, 1693.6, 1697.6, 1701.6]) add('pier', 'main', a, { z: 0.8, scale: 1, popAt: 619.6 + (a - 1685) * 0.02 });
const SK_Y = 152, PORT = [1683.4, 1703.2];
add('shinkansen', 'main', PORT[0] - 8, { v: 0, z: 1.2, scale: 0.8, y: SK_Y, cars: 4, portal: PORT[0], portalEnd: PORT[1], from: T_SK - 1.4, to: T_SK + 8.6, move: (t) => clamp((t - T_SK + 1.2) * 9, 0, 74) });
add('shinkansen', 'main', PORT[0] - 10, { v: 3, z: 1.2, scale: 0.8, y: SK_Y, cars: 2, portal: PORT[0], portalEnd: PORT[1], from: T_GEN - 0.2, to: T_GEN + 3.8, move: (t) => clamp((t - T_GEN) * 14, 0, 56) });
add('shinkansen', 'main', PORT[0] - 10, { v: 5, z: 1.2, scale: 0.8, y: SK_Y, cars: 2, portal: PORT[0], portalEnd: PORT[1], from: T_GEN + 2.8, to: T_GEN + 6.8, move: (t) => clamp((t - T_GEN - 3) * 14, 0, 56) });
add('jmount', 'far', 1700, { v: 2, scale: 0.55 });
[1708.4, 1710.2, 1712].forEach((a, i) => add('person', 'main', a, { v: 'tessei', z: 2, scale: P2, flip: true, popAt: T_GEN - 0.6 + i * 0.1, act: (t) => { const b = Math.max(0, Math.sin((t - T_GEN) * 1.6)) ** 2 * (t > T_GEN ? 1 : 0); return { lean: 6 + b * 40, head: 6 + b * 10 }; } }));
grassRun(1652, 1712, 4.6, 'main', { skip: (a) => a > 1666 && a < 1681 });

// ---- 1968, and the glowing eighties
const T_68 = ev('second', 638.4), T_GLOW = ev('glowed', 644.4), T_PAL = ev('palace', 649.8), T_BURST = ev('burst', 659.2);
for (const [a, v, i] of [[1718, 0, 0], [1724, 2, 1], [1729, 1, 2]]) add('neonbldg', 'main', a, { v, z: 0, scale: 0.7, popAt: 633.6 + i * 0.3, on: () => 0 });
[[1738, 0], [1744, 1], [1750.6, 2], [1757, 3], [1763.4, 1], [1769.6, 0]].forEach(([a, v], i) => add('neonbldg', 'main', a, { v, z: -0.2, scale: 0.8, popAt: 641 + i * 0.15, on: (t) => sramp(t, T_GLOW - 1.6 + i * 0.25, T_GLOW - 1 + i * 0.25) * (t < T_BURST + 0.3 + i * 0.3 ? 1 : Math.max(0, Math.sin((t - T_BURST) * 30)) > 0.5 && t < T_BURST + 0.6 + i * 0.3 ? 1 : 0) }));
add('tokyotower', 'mid', 1752, { scale: 0.42, lit: (t) => sramp(t, T_GLOW - 1, T_GLOW) * (t < T_BURST + 1.6 ? 1 : 0.2) });
[['salaryman', 1740, 1], ['officeLady', 1746, -1], ['salaryman2', 1754, 1], ['salaryman', 1761, -1]].forEach(([v, a, dir], i) => add('person', 'main', a, { v, z: 2 + i * 0.05, scale: P2, flip: dir < 0, popAt: T_GLOW - 1 + i * 0.2, pace: 5, move: (t) => dir * clamp((t - T_GLOW + 1 - i * 0.2) * 0.45, 0, 3.6), act: (t) => (t > T_GLOW + 7 - i * 0.2 ? { walk: undefined } : {}) }));
add('corolla', 'main', 1747.6, { v: 3, z: 1.6, scale: 0.86, popAt: T_GLOW - 0.6, move: (t) => clamp((t - T_GLOW) * 1.2, 0, 7) });
grassRun(1714, 1780, 7, 'front', { s: 2 });
grassRun(1580, 1712, 7, 'front', { s: 2 });

hook({
  lights(t, c, L, Em, Sm) {
    if (near(1677, c, 50) && t > T_OLY - 0.2) { const k = sramp(t, T_OLY, T_OLY + 0.6); L.push({ a: 1677, h: 230, r: 500, k: 1.1 * k * flick(t, 61), color: [255, 160, 70] }); Em.push({ a: 1677, h: 214, scale: 0.9, lit: k, litAt: T_OLY, seed: 61 }); }
    if (near(1610, c, 50) && t > T_GROW) for (const [a, i] of [[1607.6, 0], [1614.8, 1]]) Sm.push({ a: a + 2.4, layer: 'main', h: 210, t0: T_GROW + i * 0.5, size: 1, life: 5, every: 0.5, rise: 160, drift: 3, alpha: 0.4 });
    if (near(1752, c, 60) && t > T_GLOW - 1.2) L.push({ a: 1752, h: 200, r: 1100, k: 0.55 * sramp(t, T_GLOW - 1.2, T_GLOW) * (t < T_BURST + 1 ? 1 : 0.3), color: [255, 140, 220] });
  },
  ground(g, st, t, S, G) {
    // the viaduct's deck
    if (near(1694, G.c, 60) && t > 619.4) { const k = sramp(t, 619.6, 620.4); G.run(1683, 1703.6, (a0, a1) => { G.arc(a0, a1, 140, 12 * k, 'rgba(190,186,176,.98)'); G.arc(a0, a1, 146, 2, 'rgba(120,116,108,.6)'); }); }
  },
  over(g, st, t) {
    const { W, H } = st, u = st.eu, p = por(st), cx = W * (p ? 0.5 : 0.25), yH = (k) => H * lerp(-0.4, p ? 0.07 : 0.08, k), sc = p ? 0.66 : 0.98;
    const label = (g2, txt, x, y, size = 16, col = 'rgba(40,26,18,.88)') => { g2.font = `italic 400 ${size}px Fraunces, Georgia, serif`; g2.textAlign = 'center'; g2.fillStyle = col; g2.fillText(txt, x, y); };
    // the new constitution
    if (t > T_CON - 0.6 && t < 584.4) card(st, g, cx, yH(drop(t, T_CON - 0.4, 583)) + 120 * u * sc, sc, Math.sin(t * 0.5) * DEG, (g2) => { put(g2, st.fx.washi, 0.3, 4, 6); g2.save(); g2.scale(0.9, 0.9); g2.fillStyle = 'rgba(40,26,18,.9)'; g2.fillRect(-90, -120, 180, 3); g2.restore(); g2.strokeStyle = 'rgba(30,22,18,.75)'; g2.lineWidth = 1.4; for (let c = 0; c < 10; c++) for (let r = 0; r < 12; r++) { if (hash(c * 31 + r) < 0.1) continue; g2.beginPath(); g2.moveTo(80 - c * 17, -100 + r * 18); g2.lineTo(80 - c * 17 + (hash(c + r * 7) - 0.5) * 6, -90 + r * 18); g2.stroke(); } g2.fillStyle = 'rgba(178,40,32,.85)'; g2.fillRect(-100, 96, 18, 18); }, 1, 110);
    // growth, year by year: about ten percent a year
    if (t > T_GROW - 0.8 && t < 590.2) card(st, g, cx, yH(drop(t, T_GROW - 0.6, 589)) + 110 * u * sc, sc, Math.sin(t * 0.5) * DEG, (g2) => { put(g2, st.fx.plancard, 0.3, 4, 6); const n = Math.floor(sramp(t, T_GROW, T_GROW + 3.4) * 19); for (let i = 0; i < n; i++) { const v = Math.pow(1.095, i), h = v * 30; g2.fillStyle = i === n - 1 ? '#c8402a' : '#5a7a9a'; g2.fillRect(-120 + i * 12.6, 80 - h, 9, h); } label(g2, String(1955 + Math.max(0, n - 1)), 80, -60, 24); }, 1, 130);
    // kaizen: a little better, every day
    if (t > T_KAI - 1.2 && t < 606) card(st, g, W * (p ? 0.5 : 0.72), yH(drop(t, T_KAI - 1, 604.6)) + 110 * u * sc, sc, Math.sin(t * 0.5) * DEG, (g2) => { put(g2, st.fx.plancard, 0.3, 4, 6); const n = sramp(t, T_KAI - 0.8, T_KAI + 2) * 24; g2.strokeStyle = '#3a6a4a'; g2.lineWidth = 4; g2.lineJoin = 'round'; g2.beginPath(); g2.moveTo(-120, 70); for (let i = 0; i < n; i++) { const x = -120 + i * 10, y = 70 - i * 5.4; g2.lineTo(x + 10, y); g2.lineTo(x + 10, y - 5.4); } g2.stroke(); label(g2, 'kaizen', -40, -70, 26); }, 1, 130);
    // the radio, the shirt pocket: almost
    closeUp(st, g, t, ev('radio', 605.4), 613.2, (g2) => {
      put(g2, st.fx.shirt, 0.4, 6, 8); const grow = sramp(t, ev('largerpockets', 610.6), ev('largerpockets', 610.6) + 0.5), pw = 70 * (1 + grow * 0.25), ph = 78 * (1 + grow * 0.2), px = -84, py = -70;
      const drop1 = sramp(t, 605.8, 607.4), drop2 = sramp(t, ev('largerpockets', 610.6) + 0.5, ev('largerpockets', 610.6) + 1.1), ry = lerp(-260, py + 10, drop1) + drop2 * 44;
      g2.save(); g2.beginPath(); g2.rect(-200, -400, 400, py + 30 + 400); g2.rect(px - pw / 2, py + 30, pw, 400); g2.clip(); g2.save(); g2.translate(px, ry); g2.rotate(Math.sin(t * 2) * 0.03); put(g2, st.fx.tr63, 0.3, 3, 4); g2.restore(); g2.restore();
      g2.fillStyle = '#e8e6de'; g2.fillRect(px - pw / 2, py + 30, pw, ph); g2.strokeStyle = 'rgba(160,160,170,.8)'; g2.lineWidth = 1.4; g2.strokeRect(px - pw / 2, py + 30, pw, ph); g2.beginPath(); g2.moveTo(px - pw / 2, py + 40); g2.lineTo(px + pw / 2, py + 40); g2.stroke();
    }, { light: [255, 214, 170], glow: 0.18, embers: false, veil: 0.4, dark: '20,24,30' });
    // 1968: the second largest economy
    if (t > T_68 - 2.2 && t < 643) card(st, g, cx, yH(drop(t, T_68 - 2, 641.4)) + 110 * u * sc, sc, Math.sin(t * 0.5) * DEG, (g2) => { put(g2, st.fx.plancard, 0.3, 4, 6); const jp = lerp(0.1, 0.165, sramp(t, T_68 - 1.6, T_68 + 0.2)); [['USA', 1, '#5a7a9a'], ['Japan', jp, '#c8402a'], ['W. Germany', 0.152, '#7a8a6a'], ['France', 0.13, '#8a7a9a'], ['Britain', 0.11, '#9a8a6a']].forEach(([n, v, c], i) => { const h = Math.min(150, v * 150 + 4); g2.fillStyle = c; g2.fillRect(-116 + i * 48, 80 - h, 34, h); label(g2, n, -99 + i * 48, 98, 11); }); label(g2, '1968', 70, -50, 26); }, 1, 130);
    // the palace grounds, said to be worth more than all of California
    if (t > T_PAL - 0.8 && t < 658) card(st, g, cx, yH(drop(t, T_PAL - 0.6, 656.4)) + 110 * u * sc, sc, Math.sin(t * 0.5) * DEG, (g2) => {
      put(g2, st.fx.plancard, 0.3, 4, 6); const tilt = -0.22 * sramp(t, T_PAL + 2.4, T_PAL + 3.6) * (1 + 0.1 * Math.sin(t * 3));
      g2.strokeStyle = '#4a3a2a'; g2.lineWidth = 3; g2.beginPath(); g2.moveTo(0, 70); g2.lineTo(0, -40); g2.stroke(); g2.save(); g2.translate(0, -40); g2.rotate(tilt); g2.beginPath(); g2.moveTo(-100, 0); g2.lineTo(100, 0); g2.stroke();
      for (const s of [-1, 1]) { g2.save(); g2.translate(s * 92, 0); g2.rotate(-tilt); g2.lineWidth = 1; g2.beginPath(); g2.moveTo(-26, 50); g2.lineTo(0, 0); g2.lineTo(26, 50); g2.stroke(); g2.fillStyle = '#8a7a5a'; g2.fillRect(-30, 50, 60, 5);
        if (s < 0) { g2.fillStyle = '#4a8aa8'; g2.fillRect(-16, 30, 32, 20); g2.fillStyle = '#5a8a4a'; g2.fillRect(-11, 34, 22, 16); g2.fillStyle = '#3a3a40'; g2.beginPath(); g2.moveTo(-6, 36); g2.lineTo(0, 31); g2.lineTo(6, 36); g2.fill(); }
        else { const CA = [[-124.2, 42], [-120, 42], [-120, 39], [-114.6, 35], [-114.7, 32.7], [-117.1, 32.5], [-118.5, 34], [-120.6, 34.6], [-121.9, 36.6], [-122.5, 37.8], [-123.7, 39], [-124.4, 40.4]]; g2.fillStyle = '#c8a870'; g2.beginPath(); CA.forEach(([lo, la], j) => { const x = (lo + 119.5) * 4.6, y = 48 - (la - 32.5) * 4.6; j ? g2.lineTo(x, y) : g2.moveTo(x, y); }); g2.closePath(); g2.fill(); }
        g2.restore(); }
      g2.restore();
    }, 1, 130);
    // the bubble: golden, rising over the city, and then gone
    if (t > 654.8 && t < T_BURST + 1.2) {
      const [x0, y0] = st.place('main', 1754, 300, t), k = sramp(t, 654.8, 657.4), x = x0 + Math.sin(t * 0.7) * 30 * u, y = y0 - k * 120 * u, r = (60 + 70 * k) * u * (1 + 0.03 * Math.sin(t * 5));
      if (t < T_BURST) {
        g.save(); g.globalCompositeOperation = 'lighter';
        st.stamp(g, st.dot(255, 190, 90), x, y, r * 1.6, 0.35);
        const gr = g.createRadialGradient(x, y, r * 0.55, x, y, r); gr.addColorStop(0, 'rgba(255,190,80,0)'); gr.addColorStop(0.8, 'rgba(255,190,90,.22)'); gr.addColorStop(0.97, 'rgba(255,214,130,.85)'); gr.addColorStop(1, 'rgba(255,214,130,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
        g.lineWidth = 3.2 * u; for (const [a0, a1, c] of [[3.4, 4.6, 'rgba(255,120,220,.55)'], [4.7, 5.6, 'rgba(120,230,255,.45)'], [0.2, 1.3, 'rgba(200,255,160,.35)'], [1.5, 2.6, 'rgba(255,170,90,.5)']]) { g.strokeStyle = c; g.beginPath(); g.arc(x, y, r * 0.93, a0 + t * 0.2, a1 + t * 0.2); g.stroke(); }
        g.fillStyle = 'rgba(255,250,235,.85)'; g.beginPath(); g.ellipse(x - r * 0.42, y - r * 0.44, r * 0.16, r * 0.07, -0.7, 0, 7); g.fill(); g.beginPath(); g.ellipse(x + r * 0.5, y + r * 0.46, r * 0.06, r * 0.03, -0.7, 0, 7); g.fill();
        g.restore();
      }
      else { const age = t - T_BURST; g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2, d = r * (1 + age * 2.4); st.stamp(g, st.dot(255, 220, 160), x + Math.cos(a) * d, y + Math.sin(a) * d + age * age * 160 * u, 4 * u, 1 - age); } g.globalCompositeOperation = 'source-over'; }
    }
  },
});
