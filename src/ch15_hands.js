// 15. The hands. A street of old shops and their craftsmen; a chart: more century-old companies than
// anywhere; an inn kept by one family since 705, steaming in the morning. A sushi master's hands, a
// swordsmith's sparks, Ise rebuilt again, counted to sixty-two. Then 2011, with restraint: grey light, the
// sea coming in over a town, houses folding, a thin plume over Fukushima, the ground cracking. An old
// stone on the hill that warned them. Cherry saplings planted where the water stopped, and the crack filling
// with gold. A night of maglev and Skytree, a capsule from an asteroid streaking home; and an old couple
// under a cherry tree at dusk.
import { add, hook, grassRun, ev, drop, near, flick, card, closeUp, por, PS, P2, R, CAM, ZONES, SEAS, BUMPS, SKY, AMB, GRADE, ERAS, WX, NIGHTS, ZOOM, PAPER_SUN, SEAMS, LOOK, W_, PAL } from './film_api.js';
import { LOOKS } from './people.js';
import { KINDS } from './cutouts.js';
import { clamp, sramp, lerp, hash, fbm, DEG, rng } from './util.js';
import { brushColumns } from './sky_japan.js';
import { put } from './paper.js';

Object.assign(LOOKS, {
  lacquerer: { skin: 4, top: 'robe', topCol: '#2a3a4a', legs: 'trousers', legCol: '#2a2a30', hair: 'short', hairCol: '#c8c4bc', pose: 'kneel', item: 'brush', collar: '#efe8d8' },
  potter: { skin: 6, top: 'robe', topCol: '#8a6a4a', legs: 'trousers', legCol: '#5a4a3a', hair: 'bun', pose: 'kneel', obi: '#3a3a40' },
  knifesmith: { skin: 4, top: 'tunic', topCol: '#3a4a5a', legs: 'trousers', legCol: '#2a3a46', hat: 'band', hatCol: '#efe8d8', hair: 'short', pose: 'stand', item: 'hammer' },
  innkeeper: { skin: 6, top: 'robe', topCol: '#6a3a4a', pattern: 'dots', legs: 'robe', legCol: '#6a3a4a', sleeve: '#6a3a4a', hair: 'shimada', pose: 'stand', obi: '#c8a050', collar: '#f4ecdc' },
  sushiMaster: { skin: 4, top: 'robe', topCol: '#f2f0ea', legs: 'robe', legCol: '#2a3a5a', sleeve: '#f2f0ea', hat: 'whitecap', hatCol: '#f2f0ea', hair: 'short', pose: 'stand' },
  apprentice: { skin: 6, top: 'robe', topCol: '#f2f0ea', legs: 'robe', legCol: '#2a3a5a', sleeve: '#f2f0ea', hat: 'band', hatCol: '#2a3a5a', hair: 'short', pose: 'stand' },
  modernSmith: { skin: 4, top: 'robe', topCol: '#f2eee4', legs: 'robe', legCol: '#f2eee4', sleeve: '#f2eee4', hat: 'eboshi', hatCol: '#1e1a1c', pose: 'kneel', item: 'hammer' },
  iseCarp2: { skin: 4, top: 'tunic', topCol: '#f2eee4', legs: 'trousers', legCol: '#e8e2d4', hat: 'band', hatCol: '#f2eee4', hair: 'short', pose: 'stand', item: 'hammer', obi: '#d8d0c0' },
  stoneWoman: { skin: 6, top: 'coat', topCol: '#4a5a6a', sleeve: '#4a5a6a', legs: 'trousers', legCol: '#3a3a44', hair: 'bob', pose: 'stand' },
  stoneKid: { skin: 6, top: 'hoodie', topCol: '#c8604a', sleeve: '#c8604a', legs: 'trousers', legCol: '#3a4a6a', hair: 'short', pose: 'stand', small: 0.7 },
  planter: { skin: 6, top: 'shirt', topCol: '#5a8a6a', sleeve: '#5a8a6a', legs: 'trousers', legCol: '#3a4a5a', hat: 'cap', hatCol: '#e8e4dc', pose: 'stand', item: 'shovel' },
  planter2: { skin: 4, top: 'shirt', topCol: '#d8a040', sleeve: '#d8a040', legs: 'trousers', legCol: '#4a4a52', hair: 'short', pose: 'kneel' },
  oldMan: { skin: 4, top: 'coat', topCol: '#6a5a4a', sleeve: '#6a5a4a', legs: 'trousers', legCol: '#4a4a44', hair: 'short', hairCol: '#e8e4dc', pose: 'sit', beard: 1, beardCol: '#f0ece4' },
  oldWoman: { skin: 6, top: 'robe', topCol: '#7a5a7a', legs: 'robe', legCol: '#5a4a5a', sleeve: '#7a5a7a', hair: 'bun', hairCol: '#eeeae4', pose: 'sit', collar: '#efe8d8' },
  grandkid: { skin: 6, top: 'hoodie', topCol: '#e3b341', sleeve: '#e3b341', legs: 'trousers', legCol: '#34507a', hair: 'bob', pose: 'stand', small: 0.66 },
});
// The tsunami: a dark wall of sea with a broken white crest. e.surge(t) carries it in (move) and its height.
KINDS.tsunami = {
  bake(mk) { const sh = mk('tsunami', [-372, -262, 720, 340]), r = rng2();
    // the long back of the swell rises out of the sea (right) to a crest, whose lip hangs over a steep face
    const back = []; for (let i = 0; i <= 18; i++) { const u = i / 18, x = 340 - u * 510; back.push([x, 60 - 70 * u - 120 * u * u - Math.sin(u * 9) * 5]); }
    const lip = [[-196, -150], [-226, -166], [-254, -158], [-270, -136], [-268, -112], [-252, -104]];
    const face = [[-238, -96], [-236, -70], [-250, -36], [-284, 0], [-326, 36], [-366, 66]];
    const body = [[340, 66], ...back, ...lip, ...face];
    sh.piece(body, '#20344a', { round: 8, rough: 1, paint: (g) => { const gr = g.createLinearGradient(-120, -170, 60, 70); gr.addColorStop(0, '#56788e'); gr.addColorStop(0.45, '#2c465c'); gr.addColorStop(1, '#101a24'); g.fillStyle = gr; g.fillRect(-372, -262, 720, 340);
      g.strokeStyle = 'rgba(180,206,218,.22)'; g.lineWidth = 2.2; for (let k = 0; k < 10; k++) { g.beginPath(); const y0 = -130 + k * 19; g.moveTo(-210 + k * 6, y0); g.bezierCurveTo(-60, y0 + 10 - k, 120, y0 + 56 - k * 3, 340, y0 + 120 - k * 6); g.stroke(); } } });
    // the face, a little lighter, under the lip
    sh.piece([[-232, -100], [-226, -64], [-240, -30], [-276, 4], [-318, 38], [-300, 46], [-256, 16], [-222, -22], [-210, -70], [-214, -104]], '#3a5a70', { round: 6, lift: 0.8 });
    // foam: torn scraps, thick along the lip, falling down the face, a skirt of it spreading at the foot, and a few streaks on the back
    const scrap = (x, y, s, col) => { const n = 6 + ((r() * 3) | 0), pts = []; for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2, rr = s * (0.55 + r() * 0.6); pts.push([x + Math.cos(a) * rr * 1.4, y + Math.sin(a) * rr]); } sh.piece(pts, col, { round: 3, rough: 1.4, lift: 0.6 }); };
    const lipLine = [[-180, -152], [-200, -160], [-222, -168], [-244, -164], [-262, -148], [-270, -128], [-266, -112]];
    lipLine.forEach(([x, y], i) => { scrap(x, y - 2, 10 + r() * 7, i % 2 ? '#dfe7ea' : '#c8d4d8'); scrap(x + 8 - r() * 16, y + 8, 6 + r() * 4, '#b4c4ca'); });
    for (let i = 0; i < 9; i++) { const v = i / 8; scrap(-256 + v * 10 - r() * 18, -100 + v * 120 + r() * 10, 4 + r() * 5 * (1 - v * 0.5), r() < 0.5 ? '#c8d4d8' : '#a8bac2'); }
    for (let i = 0; i < 12; i++) scrap(-360 + i * 22 + r() * 10, 50 - r() * 18 - (i > 6 ? (i - 6) * 4 : 0), 7 + r() * 8, i % 3 ? '#c4d0d4' : '#e2e9eb');
    for (let i = 0; i < 6; i++) { const u = 0.2 + i * 0.12, [x, y] = back[Math.round(u * 18)]; scrap(x + r() * 20, y + 10 + r() * 16, 3 + r() * 3, 'rgba(190,210,218,.7)'); }
    return { spr: sh.finish({ shadowBlur: 6 }) }; },
  draw(g, P, t, e, env) { const k = e.height ? e.height(t) : 1; if (k < 0.01) return; g.save(); g.translate(0, 66 * (1 - k)); g.scale(1, Math.max(0.05, k)); put(g, P.spr, env.sh * 0.5, 4, 5); g.restore(); },
};
function rng2() { let s = 77; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }

CAM.push([724, 1902], [726.5, 1908], [729, 1914], [731.5, 1920], [734, 1928], [736.5, 1932], [738.5, 1940], [741, 1946], [743.5, 1953], [746, 1958], [748.5, 1962], [751, 1966], [753, 1974], [755.5, 1980], [758, 1986], [761, 1992], [764, 2000], [766.5, 2008], [769, 2010], [772, 2012], [774.5, 2016], [777, 2026], [780, 2032], [783, 2040], [785.5, 2046], [788, 2052], [790.5, 2056], [793, 2066], [795.5, 2070], [798.6, 2078]);
ZONES.push([1898, 1934, [140, 128, 98]], [1936, 1968, [126, 120, 92]], [1970, 1986, [110, 106, 96]], [1988, 2004, [36, 56, 76]], [2006, 2036, [110, 130, 84]], [2038, 2064, [96, 98, 108]], [2066, 2090, [120, 132, 90]]);
SEAS.push([1987.6, 2004.6]);
BUMPS.main.push([2007, 2013, 12, 3, 2]); BUMPS.far.push([1896, 2090, 34, 10, 24]);
SEAMS.push({ a0: 1966, a1: 2006, t0: ev('searose', 756.4), openDur: 2.4, t1: ev('cherrytrees', 777.4), dur: 3.4, seed: 11 });

SKY.push([722.6, ['#8aa6c4', '#bccad4', '#ecdcc8', '#f2d6b0']], [737.4, PAL.DAY], [750.6, ['#4a5260', '#5e6672', '#7e848a', '#8e9294']], [764.6, ['#6a7a90', '#8a96a6', '#b4bcc4', '#c4c8cc']], [775.6, ['#8ab0d8', '#bcd0e0', '#f4e4e8', '#f8e8e0']], [782.6, ['#0a1030', '#141c44', '#24305e', '#38447a']], [793.4, ['#3a4a7a', '#8a6a90', '#f0a070', '#f8c888']]);
AMB.push([722.6, [255, 246, 234]], [737.4, W_], [750.6, [196, 200, 208]], [764.6, [220, 224, 232]], [775.6, [255, 248, 248]], [782.6, [110, 120, 170]], [793.4, [255, 220, 190]]);
GRADE.push([722.6, [255, 220, 180, 0.08]], [737.4, [230, 240, 240, 0.06]], [750.6, [130, 145, 165, 0.24]], [764.6, [160, 175, 195, 0.14]], [775.6, [255, 220, 230, 0.1]], [782.6, [140, 170, 255, 0.14]], [793.4, [255, 170, 110, 0.14]]);
NIGHTS.push([782.4, 793.6]);
ERAS.push(
  [722.6, 737.4, LOOK(['#8aa6c4', '#bccad4', '#ecdcc8', '#f2d6b0'], [255, 246, 234], [255, 220, 180, 0.08], { motes: 0.6 })],                          // old shops, an inn's morning steam
  [737.4, 750.6, LOOK(['#5a96cc', '#9cc0dc', '#e4ecdc', '#f4ead0'], [255, 252, 244], [230, 240, 240, 0.06], { rays: 0.6, motes: 0.4 })],             // craft: a crisp clean day
  [750.6, 764.6, LOOK(['#4a5260', '#5e6672', '#7e848a', '#8e9294'], [196, 200, 208], [130, 145, 165, 0.24], { motes: 0 })],                            // 2011: grey
  [764.6, 775.6, LOOK(['#6a7a90', '#8a96a6', '#b4bcc4', '#c4c8cc'], [220, 224, 232], [160, 175, 195, 0.14], { motes: 0.2 })],                          // the stones: still, grey-blue
  [775.6, 782.6, LOOK(['#8ab0d8', '#bcd0e0', '#f4e4e8', '#f8e8e0'], [255, 248, 248], [255, 220, 230, 0.1], { motes: 0.6, mote: [255, 230, 240] })],   // spring: cherry trees
  [782.6, 793.4, LOOK(['#0a1030', '#141c44', '#24305e', '#38447a'], [110, 120, 170], [140, 170, 255, 0.14], { motes: 0.4, mote: [200, 220, 255] })],   // night: the future
  [793.4, 799, LOOK(['#3a4a7a', '#8a6a90', '#f0a070', '#f8c888'], [255, 220, 190], [255, 170, 110, 0.14], { motes: 0.7, mote: [255, 220, 180] })],    // golden dusk
);
WX.push(['mist', 722.8, 737, [255, 244, 236], 0.18], ['mist', 751, 764, [150, 158, 170], 0.22], ['petals', 776, 782.4, null, 1], ['petals', 793.6, 799, null, 0.6]);
PAPER_SUN.push([737.6, 750.4]);
ZOOM.push([753, 755, 761, 763.4, 0.08], [766, 768, 773, 775, 0.14], [794, 796, 798.6, 800.4, 0.1]);

// ---- the old crafts
const T_CRAFT = ev('crafts', 724.0), T_COMP = ev('companies', 726.4), T_INN = ev('inn', 732.0), T_705 = ev('y705', 735.6);
[[1902.4, 0], [1908.6, 1], [1914.8, 0]].forEach(([a, v], i) => add('machiya', 'main', a, { v, z: 0, scale: 0.85, popAt: 722.6 + i * 0.2 }));
add('person', 'main', 1903.6, { v: 'lacquerer', z: 2, scale: P2, popAt: T_CRAFT - 0.4, act: (t) => ({ lean: 22, head: 14, front: [-70 + Math.sin(t * 3) * 6, -50] }) });
add('person', 'main', 1909.4, { v: 'potter', z: 2, scale: P2, popAt: T_CRAFT - 0.2, act: (t) => ({ lean: 20, head: 14, front: [-70, -46], back: [-60, -46] }) });
add('jpot', 'main', 1910.8, { v: 2, z: 2.2, scale: 0.6, popAt: T_CRAFT, rot: (t) => Math.sin(t * 8) * 1.4 });
add('person', 'main', 1916, { v: 'knifesmith', z: 2, scale: P2, popAt: T_CRAFT + 0.2, act: (t) => ({ lean: 10, front: [-160 + Math.max(0, Math.sin(t * 4)) * 80, -10] }) });
add('ryokan', 'main', 1926.6, { z: 0.2, scale: 0.85, popAt: T_INN - 0.6, loud: 1.6, winOn: (t) => 0.5 });
add('person', 'main', 1921.4, { v: 'innkeeper', z: 2, scale: P2, popAt: T_INN - 0.2, act: () => ({ lean: 14, head: 10 }) });
add('jmount', 'far', 1924, { v: 1, scale: 0.6 }); add('sugi', 'mid', 1932, { v: 1, scale: 0.55 });
// ---- sushi, a sword, Ise counted to sixty-two
const T_SUSHI2 = ev('sushichefs', 738.4), T_SWORD2 = ev('swordsmiths', 741.0), T_ISE2 = ev('ise2013', 744.0), T_62 = ev('sixtysecond', 748.2);
add('person', 'main', 1940.4, { v: 'sushiMaster', z: 0.8, scale: P2, popAt: T_SUSHI2 - 0.6, act: (t) => ({ lean: 10, head: 14, front: [-60 + Math.sin(t * 5) * 6, -60], back: [-50 + Math.sin(t * 5 + 1) * 6, -60] }) });
add('person', 'main', 1943, { v: 'apprentice', z: 0.7, scale: P2, popAt: T_SUSHI2 - 0.4, act: () => ({ head: 10, front: [-20, -10] }) });
add('sushibar', 'main', 1941, { z: 1, scale: 0.95, popAt: T_SUSHI2 - 0.6, loud: 1.2 });
add('forge', 'main', 1950.6, { z: 0.5, scale: 0.7, popAt: T_SWORD2 - 0.8, pump: (t) => Math.max(0, Math.sin(t * 2.4)) });
add('person', 'main', 1955.4, { v: 'modernSmith', z: 1.4, scale: P2, flip: true, popAt: T_SWORD2 - 0.6, act: (t) => { const k = Math.max(0, Math.sin(t * 7)); return { lean: 16, head: 12, front: [-110 + k * 40, -30] }; } });
add('torii', 'main', 1958.8, { v: 0, z: 1, scale: 0.85, popAt: T_ISE2 - 0.6 });
add('shinmei', 'main', 1962.4, { v: 0, z: 0.4, scale: 0.8, popAt: T_ISE2 - 0.4, foldAt: T_62 - 0.6 });
add('shinmei', 'main', 1962.4, { v: 1, z: 0.45, scale: 0.8, popAt: T_62 - 0.4, loud: 1.6 });
add('person', 'main', 1966, { v: 'iseCarp2', z: 2, scale: P2, flip: true, popAt: T_ISE2, foldAt: 752.6, act: (t) => ({ lean: 6, front: [-120 + Math.max(0, Math.sin(t * 4)) * 60, -10] }) });
for (const a of [1956, 1968]) add('sugi', 'main', a, { v: 1, z: -0.5, scale: 0.8 });
grassRun(1898, 1970, 4.4, 'main', { skip: (a) => a > 1900 && a < 1968 });

// ---- 2011: the sea comes in
const T_SEA = ev('searose', 756.4), T_FUK = ev('fukushima', 762.4);
[[1972.6, 1], [1976.8, 0], [1980.6, 1], [1984.4, 2]].forEach(([a, v], i) => add('machiya', 'main', a, { v, z: 0.4, scale: 0.8, popAt: 750.8 + i * 0.1, foldAt: T_SEA + 1.6 - i * 0.4 }));
add('tsunami', 'main', 1998, { z: 1.6, scale: 0.8, y: 6, from: T_SEA - 0.4, to: T_SEA + 6.2, move: (t) => -clamp((t - T_SEA + 0.2) * 7, 0, 14) + clamp((t - T_SEA - 3) * 5, 0, 12), height: (t) => sramp(t, T_SEA - 0.4, T_SEA + 0.6) * (1 - sramp(t, T_SEA + 3.4, T_SEA + 6)) });
add('npp', 'main', 1996.2, { z: 0.3, scale: 0.6, popAt: 751.4, y: 2 });
for (let a = 1988; a < 2004; a += 3.4) add('wave', 'main', a, { v: (R() * 4) | 0, z: 0.4, scale: 0.8, y: -2 });
// ---- the stone on the hill
const T_STONE = ev('oldstones', 767.0), T_DONT = ev('dontbuild', 771.2);
add('tsunamistone', 'main', 2010.2, { z: 1, scale: 1.2, popAt: T_STONE - 0.6, loud: 1.2 });
add('person', 'main', 2007, { v: 'stoneWoman', z: 2, scale: P2, popAt: T_STONE - 0.2, act: () => ({ head: -10 }) });
add('person', 'main', 2008.2, { v: 'stoneKid', z: 2.1, scale: P2, popAt: T_STONE, act: () => ({ head: -16 }) });
// ---- cherry trees where the water stopped
const T_CHERRY = ev('cherrytrees', 777.4);
[2018.6, 2022.2, 2025.8, 2029.4, 2033].forEach((a, i) => add('sakura', 'main', a, { v: 2, z: 0.3, scale: 0.55, popAt: 776.2 + i * 0.2, bloom: (t) => sramp(t, T_CHERRY + i * 0.25, T_CHERRY + 1.6 + i * 0.25) }));
add('person', 'main', 2020.4, { v: 'planter', z: 2, scale: P2, popAt: 776, act: (t) => { const k = Math.max(0, Math.sin(t * 2.6)); return { lean: 16 + k * 14, front: [-60 + k * 40, -20] }; } });
add('person', 'main', 2027.6, { v: 'planter2', z: 2, scale: P2, popAt: 776.2, act: (t) => ({ lean: 30, head: 16, front: [-60, -30] }) });
grassRun(2006, 2036, 4, 'main', { skip: (a) => a > 2006 && a < 2011 });
// ---- the future, at night
const T_MAG = ev('floats', 785.6), T_AST = ev('asteroids', 791.0);
add('skytree', 'main', 2051.4, { z: 0.1, scale: 0.55, popAt: 782.6, loud: 2, wide: 6, lit: (t) => sramp(t, 783, 784) });
add('portal', 'main', 2039.6, { z: 1.6, scale: 0.8, popAt: 782.8 });
add('portal', 'main', 2060.6, { z: 1.6, scale: 0.8, flip: true, popAt: 783 });
add('maglev', 'main', 2032, { z: 1.2, scale: 0.8, y: 30, cars: 3, portal: 2041.4, portalEnd: 2058.8, from: T_MAG - 1, to: T_MAG + 7.4, move: (t) => clamp((t - T_MAG + 0.6) * 8.4, 0, 70) });
for (const [a, v] of [[2044, 0], [2048, 2], [2056, 1]]) add('neonbldg', 'mid', a, { v, scale: 0.55, on: () => 1 });
// ---- long lives
add('sakura', 'main', 2070.4, { v: 0, z: 0, scale: 0.9 });
add('bench', 'main', 2068.6, { z: 1.2, scale: 1, popAt: 793 });
add('person', 'main', 2067.6, { v: 'oldMan', z: 1.4, scale: P2, y: 30, popAt: 793.2, act: (t) => ({ head: 4 + Math.sin(t * 0.4) * 3 }) });
add('person', 'main', 2069.8, { v: 'oldWoman', z: 1.45, scale: P2, y: 30, flip: true, popAt: 793.4, act: (t) => ({ head: 6 + Math.sin(t * 0.5) * 3 }) });
add('person', 'main', 2072.6, { v: 'grandkid', z: 1.6, scale: P2, flip: true, popAt: 793.8, act: (t) => ({ front: [-40 + Math.sin(t * 3) * 20, -20] }) });
grassRun(2062, 2090, 4, 'main', { skip: (a) => a > 2066 && a < 2074 });
grassRun(1896, 2090, 7, 'front', { s: 2, skip: (a) => a > 1987 && a < 2005 });

hook({
  lights(t, c, L, Em, Sm) {
    if (near(1926, c, 50) && t > T_INN - 0.6 && t < 742) Sm.push({ a: 1931.6, layer: 'main', h: 30, t0: T_INN - 0.4, size: 0.9, life: 6, every: 0.5, rise: 200, drift: -2, alpha: 0.28 });
    if (near(1952, c, 40) && t > T_SWORD2 - 0.6 && t < 750) { const k = sramp(t, T_SWORD2 - 0.6, T_SWORD2); L.push({ a: 1950, h: 40, r: 500, k: 0.9 * k * flick(t, 71), color: [255, 140, 60] }); const strike = Math.max(0, Math.sin(t * 7)) ** 8; L.push({ a: 1953.6, h: 30, r: 260, k: 0.9 * strike * k, color: [255, 210, 120] }); }
    if (near(1994, c, 50) && t > T_FUK - 0.2) Sm.push({ a: 1997, layer: 'main', h: 90, t0: T_FUK, size: 0.7, life: 7, every: 0.6, rise: 220, drift: 3, alpha: 0.28 });
  },
  ground(g, st, t, S, G) {
    // the maglev's guideway
    if (near(2050, G.c, 60) && t > 782.8) G.run(2040, 2060.4, (a0, a1) => { G.arc(a0, a1, 26, 10, 'rgba(170,176,186,.95)'); G.arc(a0, a1, 32, 2, 'rgba(110,116,126,.7)'); });
    // the line where the water stopped
    if (near(2026, G.c, 50) && t > 776) G.run(2016, 2035, (a0, a1) => G.arc(a0, a1, -4, 1.4, 'rgba(255,255,255,.35)', [6, 8]));
  },
  over(g, st, t) {
    const { W, H } = st, u = st.eu, p = por(st), sc = p ? 0.66 : 0.98, cx = W * (p ? 0.5 : 0.25), yH = (k) => H * lerp(-0.4, p ? 0.07 : 0.08, k);
    const label = (g2, txt, x, y, size = 16, col = 'rgba(40,26,18,.88)') => { g2.font = `italic 400 ${size}px Fraunces, Georgia, serif`; g2.textAlign = 'center'; g2.fillStyle = col; g2.fillText(txt, x, y); };
    // companies over a hundred years old, by country (a survey of 2019; the bars are to scale)
    if (t > T_COMP - 0.6 && t < 733.4) card(st, g, cx, yH(drop(t, T_COMP - 0.4, 732)) + 110 * u * sc, sc, Math.sin(t * 0.5) * DEG, (g2) => { put(g2, st.fx.plancard, 0.3, 4, 6); const k = sramp(t, T_COMP, T_COMP + 1.6); [['Japan', 33.1, '#c8402a'], ['USA', 19.5, '#5a7a9a'], ['Sweden', 14.0, '#7a8a6a'], ['Germany', 4.9, '#8a7a9a'], ['Britain', 1.9, '#9a8a6a']].forEach(([n, v, c], i) => { const h = v / 33.1 * 140 * k; g2.fillStyle = c; g2.fillRect(-116 + i * 48, 80 - h, 34, h); label(g2, n, -99 + i * 48, 98, 11); }); label(g2, 'over 100 years old', 40, -70, 15); }, 1, 130);
    // since 705
    if (t > T_705 - 0.6 && t < 739) { const k = drop(t, T_705 - 0.4, 737.6), [x0] = st.place('main', 1926.6, 0, t), x = p ? W * 0.5 : x0, y = H * lerp(-0.3, p ? 0.12 : 0.16, k), s = (p ? 0.9 : 1.2) * u; g.save(); g.translate(x, y); g.strokeStyle = 'rgba(200,190,175,.4)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-20 * s, -y - 10); g.lineTo(-20 * s, -18 * s); g.moveTo(20 * s, -y - 10); g.lineTo(20 * s, -18 * s); g.stroke(); g.fillStyle = '#6a4a30'; g.fillRect(-46 * s, -20 * s, 92 * s, 40 * s); g.fillStyle = '#efe6cc'; g.fillRect(-40 * s, -14 * s, 80 * s, 28 * s); g.font = `italic 400 ${Math.round(22 * s)}px Fraunces, Georgia, serif`; g.textAlign = 'center'; g.fillStyle = '#2a1e16'; g.fillText('since 705', 0, 7 * s); g.restore(); }
    // Ise counted up to its sixty-second rebuilding
    if (t > T_ISE2 + 0.4 && t < 751.6) { const k = sramp(t, T_ISE2 + 0.6, T_62), n = Math.max(1, Math.round(k * 62)), [x0, y0] = st.place('main', 1962.4, 300, t), out = sramp(t, 750.4, 751.6); g.save(); g.globalAlpha = 1 - out; g.font = `italic 400 ${Math.max(22, 54 * u)}px Fraunces, Georgia, serif`; g.textAlign = 'center'; g.fillStyle = 'rgba(40,30,20,.9)'; g.fillText(String(n), x0, y0); g.font = `italic 400 ${Math.max(11, 16 * u)}px Fraunces, Georgia, serif`; g.fillText(n === 1 ? '690' : n >= 62 ? '2013' : '', x0, y0 + 26 * u); g.restore(); }
    // the stone's warning, close
    closeUp(st, g, t, T_STONE + 1.4, 775, (g2) => { g2.save(); g2.scale(1.5, 1.5); g2.translate(0, 70); g2.fillStyle = '#7a7a74'; g2.beginPath(); g2.moveTo(-50, 30); g2.lineTo(-56, -120); g2.lineTo(-30, -150); g2.lineTo(26, -154); g2.lineTo(52, -128); g2.lineTo(50, 30); g2.closePath(); g2.fill(); brushColumns(g2, rng(311), 32, -136, 4, 9, 18, 16, 'rgba(36,36,34,.85)', 2.6); g2.save(); g2.translate(0.8, 0.8); brushColumns(g2, rng(311), 32, -136, 4, 9, 18, 16, 'rgba(200,200,190,.25)', 1.2); g2.restore(); const hl = sramp(t, T_DONT - 0.4, T_DONT + 0.6); if (hl > 0.01) { g2.globalCompositeOperation = 'lighter'; g2.fillStyle = `rgba(255,236,190,${0.28 * hl})`; g2.fillRect(-16, -136, 20, 150); g2.globalCompositeOperation = 'source-over'; } g2.restore(); }, { light: [200, 210, 230], glow: 0.16, embers: false, veil: 0.45, dark: '20,24,30' });
    // a capsule from an asteroid, streaking home across the night; and the asteroid itself
    if (t > T_AST - 2.6 && t < 794) { const k = clamp((t - T_AST + 2.4) / 3.2), x = W * lerp(0.9, 0.3, k), y = H * lerp(0.04, 0.3, k); if (k > 0 && k < 1) { g.save(); g.globalCompositeOperation = 'lighter'; const tl = g.createLinearGradient(x, y, x + W * 0.22, y - H * 0.11); tl.addColorStop(0, 'rgba(255,230,180,.85)'); tl.addColorStop(1, 'rgba(255,160,80,0)'); g.strokeStyle = tl; g.lineWidth = Math.max(2, 4 * u); g.beginPath(); g.moveTo(x, y); g.lineTo(x + W * 0.22, y - H * 0.11); g.stroke(); st.stamp(g, st.dot(255, 220, 160, '255,255,240'), x, y, 14 * u, 1); g.restore(); }
      const ak = drop(t, T_AST - 2, 793.2), ax = W * (p ? 0.5 : 0.24), ay = H * lerp(-0.3, p ? 0.14 : 0.18, ak), s = (p ? 1.5 : 2.2) * u; g.save(); g.translate(ax, ay); g.strokeStyle = 'rgba(200,190,175,.4)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -ay - 10); g.lineTo(0, -46 * s); g.stroke(); g.rotate(t * 0.3); g.fillStyle = '#5a5654'; g.beginPath(); g.moveTo(0, -46 * s); g.lineTo(48 * s, 0); g.lineTo(0, 44 * s); g.lineTo(-48 * s, 0); g.closePath(); g.fill(); g.fillStyle = 'rgba(30,28,26,.5)'; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc((hash(i) - 0.5) * 50 * s, (hash(i * 3) - 0.5) * 50 * s, (2 + hash(i * 7) * 5) * s, 0, 7); g.fill(); } g.restore(); }
  },
});
