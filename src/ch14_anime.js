// 14. Ink and light. Night: a young man in a beret draws at his desk while a manga page fills itself in,
// panel by panel, like film: a long shot, a close-up, big eyes. Commuters reading; a tower of magazines
// counting past six million. An animator at a glowing light table, and a girl running across a row of
// hanging frames, one drawing at a time; a calendar flipping fifteen months for four seconds of film.
// Then the brightest day in the film: an anime summer by the sea, towering clouds, a level crossing, a
// local train, a girl with her bicycle; the stories riding a thread around the world. Then hand-painted
// flower cards, turning into a little glowing game, and children playing at sunset.
import { add, hook, grassRun, ev, drop, near, flick, card, closeUp, por, PS, P2, R, CAM, ZONES, SEAS, BUMPS, SKY, AMB, GRADE, ERAS, WX, NIGHTS, ZOOM, PAPER_SUN, FLOCKS, LOOK, W_, PAL } from './film_api.js';
import { LOOKS } from './people.js';
import { clamp, sramp, lerp, hash, fbm, DEG } from './util.js';
import { put } from './paper.js';

Object.assign(LOOKS, {
  tezuka: { skin: 6, top: 'shirt', topCol: '#efece4', sleeve: '#efece4', legs: 'trousers', legCol: '#3a3a44', hat: 'beret', hatCol: '#2a2a30', hair: 'short', pose: 'kneel', item: 'brush' },
  commuter: { skin: 4, top: 'suit', topCol: '#3a3a44', sleeve: '#3a3a44', legs: 'trousers', legCol: '#3a3a44', hair: 'short', pose: 'stand', item: 'book' },
  commuter2: { skin: 6, top: 'sailor', topCol: '#f2f0ea', sleeve: '#f2f0ea', legs: 'skirt', legCol: '#2a3a5c', hair: 'bob', pose: 'stand', item: 'book' },
  commuter3: { skin: 6, top: 'shirt', topCol: '#c8a040', sleeve: '#c8a040', legs: 'trousers', legCol: '#3a4a6a', hair: 'short', pose: 'stand', item: 'book' },
  animator: { skin: 6, top: 'hoodie', topCol: '#5a6a8a', sleeve: '#5a6a8a', legs: 'trousers', legCol: '#3a3a44', hair: 'bob', pose: 'kneel', item: 'brush' },
  bikeGirl: { skin: 6, top: 'sailor', topCol: '#f2f0ea', sleeve: '#f2f0ea', legs: 'skirt', legCol: '#2a3a5c', hair: 'long', pose: 'stand', scarf: '#c8282a' },
  cardPainter: { skin: 4, top: 'robe', topCol: '#3a4a5a', legs: 'trousers', legCol: '#2e3a46', hair: 'short', hairCol: '#c8c4bc', pose: 'kneel', item: 'brush', collar: '#efe8d8' },
  gameKid: { skin: 6, top: 'hoodie', topCol: '#e3b341', sleeve: '#e3b341', legs: 'trousers', legCol: '#34507a', hair: 'short', pose: 'sit', item: 'phone', small: 0.75 },
  gameKid2: { skin: 6, top: 'shirt', topCol: '#d8504a', sleeve: '#d8504a', legs: 'skirt', legCol: '#3a3a5a', hair: 'bob', pose: 'sit', item: 'phone', small: 0.72 },
});

CAM.push([663, 1784], [666, 1788], [669, 1790], [672, 1792], [674.5, 1798], [677, 1806], [680, 1810], [683, 1812], [686, 1816], [688.5, 1826], [691, 1830], [694, 1832], [697, 1834], [700, 1836], [702.5, 1846], [705, 1852], [708, 1858], [710.5, 1864], [713, 1876], [716, 1882], [719, 1886], [722.3, 1896]);
ZONES.push([1780, 1840, [104, 104, 108]], [1842, 1855, [120, 150, 80]], [1857, 1878, [40, 120, 170]], [1880, 1900, [150, 140, 100]]);
SEAS.push([1856.6, 1878]);
BUMPS.far.push([1780, 1900, 30, 10, 20]);

SKY.push([661.4, ['#0a1028', '#141a38', '#202a50', '#2e3a62']], [701.4, ['#1a6ad8', '#4a9aea', '#a8d8f4', '#e8f6f4']], [711.4, ['#3a4a8a', '#8a6aa0', '#f0905a', '#f8c070']]);
AMB.push([661.4, [100, 104, 140]], [701.4, [255, 255, 250]], [711.4, [255, 214, 180]]);
GRADE.push([661.4, [150, 170, 230, 0.12]], [701.4, [180, 220, 255, 0.06]], [711.4, [255, 150, 90, 0.16]]);
NIGHTS.push([660.6, 702.2]);
ERAS.push(
  [661.4, 686.6, LOOK(['#0a1028', '#141a38', '#202a50', '#2e3a62'], [100, 104, 140], [150, 170, 230, 0.12], { motes: 0.3, mote: [200, 210, 255] })],   // night: the desk lamp
  [686.6, 701.8, LOOK(['#06102a', '#0e1a40', '#1a2a5a', '#26386e'], [80, 90, 140], [140, 180, 255, 0.14], { motes: 0.4, mote: [200, 230, 255] })],     // the light table
  [701.8, 711.4, LOOK(['#1a6ad8', '#4a9aea', '#a8d8f4', '#e8f6f4'], [255, 255, 250], [180, 220, 255, 0.06], { rays: 1, motes: 0.7, mote: [255, 255, 240] })], // an anime summer
  [711.4, 722.6, LOOK(['#3a4a8a', '#8a6aa0', '#f0905a', '#f8c070'], [255, 214, 180], [255, 150, 90, 0.16], { motes: 0.6, mote: [255, 220, 170] })],   // sunset, and games
);
PAPER_SUN.push([702, 711]);
FLOCKS.push([703, 710.6, -1, 0.2, 6]);
ZOOM.push([664, 666, 673, 675, 0.14], [688, 690, 699.6, 701.4, 0.1]);

// ---- the desk at night
const T_TEZ = ev('tezuka', 666.6);
add('studio', 'main', 1789.4, { z: 0.3, scale: 0.95, popAt: 661.8, loud: 1.2, lit: (t) => sramp(t, 662, 663) });
add('person', 'main', 1790.8, { v: 'tezuka', z: 0.5, scale: P2 * 0.9, y: 10, popAt: 662.2, act: (t) => ({ lean: 24, head: 16, front: [-70 + Math.sin(t * 4.6) * 8, -50] }) });
// ---- everyone reads
const T_READ = ev('everyone', 677.4), T_6M = ev('sixmillion', 683.4);
add('traincar', 'main', 1810, { z: 0.2, scale: 0.92, popAt: 675.2, loud: 1.4, wide: 8 });
[[1804.2, 'commuter'], [1807.4, 'commuter2'], [1811, 'commuter3'], [1814.4, 'commuter'], [1817, 'commuter2']].forEach(([a, v], i) => add('person', 'main', a, { v, z: 0.4, scale: P2 * 0.85, y: 10, flip: i % 2 === 1, popAt: T_READ - 1.4 + i * 0.15, act: (t) => ({ head: 22 + Math.sin(t * 0.5 + i) * 3, lean: 4, front: [-80, -70], back: i % 2 ? [-150, -10] : [-20, -10] }) }));
// ---- the light table
const T_ANI = ev('anime', 688.8), T_FRAME = ev('framebyframe', 691.4), T_4S = ev('foursecond', 694.4), T_YEAR = ev('year', 699.2);
add('lighttable', 'main', 1829, { z: 1, scale: 1.1, popAt: 687.2, loud: 1.2 });
add('person', 'main', 1826.6, { v: 'animator', z: 1.2, scale: P2, popAt: 687.4, act: (t) => ({ lean: 24, head: 18, front: [-70 + Math.sin(t * 3.4) * 8, -46] }) });

// ---- an anime summer by the sea
const T_SUMMER = ev('spirited', 703.0), T_OSCAR = ev('oscar', 705.4), T_WORLD = ev('roundworld', 708.8);
for (const a of [1839, 1845, 1851, 1857]) add('telpole', 'main', a, { z: 0.2, scale: 1, popAt: 701.2 + (a - 1839) * 0.02 });
add('crossing', 'main', 1851, { z: 1.4, scale: 1, popAt: 701.6, down: (t) => sramp(t, 702.4, 703.2) * (1 - sramp(t, 708.6, 709.4)) });
add('bicycle', 'main', 1845.6, { z: 1.8, scale: 1.1, popAt: 702 });
add('person', 'main', 1843.4, { v: 'bikeGirl', z: 2, scale: P2, popAt: 702.2, act: (t) => ({ head: -8 + Math.sin(t * 0.6) * 4, front: [-40, -30], back: [10, -10] }) });
add('localtrain', 'main', 1840, { z: 1.2, scale: 0.86, popAt: 702.6, foldAt: 713, move: (t) => clamp((t - 703.6) * 3.4, 0, 17) });
add('torii', 'main', 1868.4, { v: 1, z: 0.8, scale: 0.9, y: -8, popAt: 703.2 });
for (let a = 1858; a < 1877; a += 3.6) add('wave', 'main', a, { v: (R() * 4) | 0, z: 0.4, scale: 0.8, y: -2 });
for (const [a, v, s] of [[1850, 1, 0.5], [1872, 3, 0.6]]) add('jmount', 'far', a, { v, scale: s });
grassRun(1840, 1856, 3, 'main', { skip: (a) => a > 1843 && a < 1851 });

// ---- playing cards by hand, then games
const T_NIN = ev('nintendo', 712.0), T_CARDS = ev('playingcards', 714.8), T_GAMES = ev('games', 718.4);
add('jdesk', 'main', 1882, { z: 1.2, scale: 1, popAt: 711.4 });
add('person', 'main', 1880.2, { v: 'cardPainter', z: 1.4, scale: P2, popAt: 711.6, act: (t) => ({ lean: 22, head: 16, front: [-70 + Math.sin(t * 5) * 6, -50] }) });
add('bench', 'main', 1889.6, { z: 1.2, scale: 1, popAt: T_GAMES - 0.6 });
add('person', 'main', 1888.4, { v: 'gameKid', z: 1.4, scale: P2, y: 30, popAt: T_GAMES - 0.4, screenAt: T_GAMES });
add('person', 'main', 1890.8, { v: 'gameKid2', z: 1.5, scale: P2, y: 30, flip: true, popAt: T_GAMES - 0.2, screenAt: T_GAMES + 0.2 });
add('sakura', 'main', 1894.4, { v: 2, z: 0, scale: 0.8 });
grassRun(1878, 1900, 4, 'main', { skip: (a) => a > 1879 && a < 1892 });
grassRun(1780, 1900, 7, 'front', { s: 2, skip: (a) => a > 1856 && a < 1878 });

// the girl running, frame by frame: one pose per frame of a run cycle
function runner(g, ph, s, col = '#2a2420') {
  const leg = Math.sin(ph) * 0.9, arm = -Math.sin(ph) * 0.9, bob = Math.abs(Math.cos(ph)) * 3;
  g.save(); g.scale(s, s); g.translate(0, -bob); g.strokeStyle = col; g.lineCap = 'round'; g.lineWidth = 5;
  const limb = (x, y, a, l1, a2, l2) => { const x1 = x + Math.sin(a) * l1, y1 = y + Math.cos(a) * l1; g.beginPath(); g.moveTo(x, y); g.lineTo(x1, y1); g.lineTo(x1 + Math.sin(a + a2) * l2, y1 + Math.cos(a + a2) * l2); g.stroke(); };
  limb(0, -30, leg, 18, -0.6 - Math.max(0, leg), 18); limb(0, -30, -leg, 18, -0.6 - Math.max(0, -leg), 18);
  g.lineWidth = 8; g.beginPath(); g.moveTo(0, -30); g.lineTo(3, -58); g.stroke();
  g.lineWidth = 4; limb(3, -54, arm, 13, 1.2, 12); limb(3, -54, -arm, 13, 1.2, 12);
  g.fillStyle = col; g.beginPath(); g.arc(5, -68, 8, 0, 7); g.fill(); g.beginPath(); g.moveTo(-1, -72); g.quadraticCurveTo(-16, -70, -22 - Math.sin(ph) * 3, -60); g.lineTo(-18, -58); g.quadraticCurveTo(-10, -66, 0, -66); g.fill();
  g.restore();
}
// the stories' faces, original archetypes, riding around the world: a robot boy, a girl with a wand, a giant robot's head, a cat spirit, a pixel hero
function icon(g, k, s) {
  g.save(); g.scale(s, s); g.lineWidth = 2; g.strokeStyle = '#1e1a1c';
  if (k === 0) { g.fillStyle = '#e8e4dc'; g.beginPath(); g.arc(0, 0, 14, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#1e1a1c'; g.beginPath(); g.moveTo(-10, -10); g.lineTo(-4, -22); g.lineTo(-2, -10); g.moveTo(4, -10); g.lineTo(10, -22); g.lineTo(12, -8); g.fill(); g.fillStyle = '#2a2a30'; g.beginPath(); g.arc(-5, -1, 3, 0, 7); g.arc(6, -1, 3, 0, 7); g.fill(); }
  else if (k === 1) { g.fillStyle = '#f0c8a8'; g.beginPath(); g.arc(0, 0, 12, 0, 7); g.fill(); g.fillStyle = '#e870a8'; g.beginPath(); g.ellipse(0, -8, 16, 9, 0, Math.PI, 0); g.fill(); g.fillStyle = '#3a5ab8'; g.beginPath(); g.ellipse(-5, 0, 3, 4.6, 0, 0, 7); g.ellipse(5, 0, 3, 4.6, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(-4, -2, 1.2, 0, 7); g.arc(6, -2, 1.2, 0, 7); g.fill(); g.strokeStyle = '#e8c040'; g.beginPath(); g.moveTo(14, 10); g.lineTo(24, -12); g.stroke(); }
  else if (k === 2) { g.fillStyle = '#d8dce4'; g.beginPath(); g.moveTo(-14, 12); g.lineTo(-16, -8); g.lineTo(0, -16); g.lineTo(16, -8); g.lineTo(14, 12); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#e8c040'; g.beginPath(); g.moveTo(0, -14); g.lineTo(-14, -26); g.lineTo(0, -18); g.lineTo(14, -26); g.fill(); g.fillStyle = '#c8302a'; g.fillRect(-6, 4, 12, 4); g.fillStyle = '#3ab8e8'; g.fillRect(-10, -4, 8, 3); g.fillRect(2, -4, 8, 3); }
  else if (k === 3) { g.fillStyle = '#c8a070'; g.beginPath(); g.ellipse(0, 0, 15, 12, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(-12, -6); g.lineTo(-10, -18); g.lineTo(-2, -10); g.moveTo(12, -6); g.lineTo(10, -18); g.lineTo(2, -10); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(-5, -1, 4, 0, 7); g.arc(5, -1, 4, 0, 7); g.fill(); g.fillStyle = '#1e1a1c'; g.beginPath(); g.arc(-5, -1, 2, 0, 7); g.arc(5, -1, 2, 0, 7); g.fill(); }
  else { const px = [[0, 1, 1, 1, 0], [1, 1, 1, 1, 1], [1, 0, 1, 0, 1], [1, 1, 1, 1, 1], [0, 1, 0, 1, 0]]; px.forEach((row, y) => row.forEach((v, x) => { if (v) { g.fillStyle = y === 0 ? '#c8302a' : y === 2 && x % 2 ? '#1e1a1c' : '#3a8ab8'; g.fillRect(-12 + x * 5, -12 + y * 5, 5, 5); } })); }
  g.restore();
}
const HANAFUDA = [
  (g) => { g.fillStyle = '#c8302a'; g.beginPath(); g.arc(0, -26, 14, 0, 7); g.fill(); g.fillStyle = '#2a5a3a'; for (const [x, y] of [[-12, -4], [10, 6], [-4, 16]]) { g.beginPath(); g.ellipse(x, y, 14, 6, 0, 0, 7); g.fill(); } g.fillStyle = '#f4f0e6'; g.beginPath(); g.ellipse(4, 28, 12, 6, -0.3, 0, 7); g.fill(); g.fillStyle = '#c8302a'; g.beginPath(); g.arc(12, 22, 2, 0, 7); g.fill(); },
  (g) => { g.fillStyle = '#4a3428'; g.fillRect(-2, -40, 4, 50); g.fillStyle = '#f0a8b8'; for (let i = 0; i < 14; i++) { g.beginPath(); g.arc(-18 + (i * 37) % 36, -36 + (i * 23) % 40, 5, 0, 7); g.fill(); } g.fillStyle = '#c8302a'; g.fillRect(-26, 18, 52, 12); g.fillStyle = '#f4f0e6'; for (let x = -24; x < 26; x += 8) g.fillRect(x, 18, 4, 12); },
  (g) => { g.fillStyle = '#c8302a'; g.fillRect(-26, -40, 52, 40); g.fillStyle = '#f4f0e6'; g.beginPath(); g.arc(0, -16, 16, 0, 7); g.fill(); g.fillStyle = '#1e1a1c'; g.beginPath(); g.moveTo(-26, 0); g.quadraticCurveTo(0, -18, 26, 0); g.lineTo(26, 40); g.lineTo(-26, 40); g.fill(); g.strokeStyle = '#d8c890'; g.lineWidth = 1; for (let x = -22; x < 24; x += 4) { g.beginPath(); g.moveTo(x, 40); g.lineTo(x + 3, 4); g.stroke(); } },
];
hook({
  sky(g, st, t) {
    // the towering clouds of an anime summer, lit at their edges
    if (t > 700.8 && t < 713) {
      const { W, H } = st, u = st.eu, k = sramp(t, 701, 702.6) * (1 - sramp(t, 711.6, 712.8)), m = Math.min(W, H);
      for (const [xf, yf, sc] of [[0.18, 0.5, 1.1], [0.6, 0.46, 1.4], [0.9, 0.52, 0.9]]) {
        const cx = W * xf + Math.sin(t * 0.05 + xf * 9) * 10 * u, cy = H * yf, s = m * 0.16 * sc;
        g.save(); g.globalAlpha = k;
        for (let i = 0; i < 16; i++) { const lvl = i / 16, w = s * (1.3 - lvl * 0.9), ox = (hash(i * 7 + xf * 13) - 0.5) * w * 1.4, oy = -lvl * s * 2.2 - hash(i * 3 + xf) * s * 0.3, r = s * (0.32 + hash(i * 11) * 0.2) * (1.1 - lvl * 0.4), sq = lvl < 0.2 ? 0.62 : 1;
          const gr = g.createRadialGradient(cx + ox - r * 0.35, cy + oy - r * 0.45, r * 0.1, cx + ox, cy + oy, r); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.6, '#f4f7fa'); gr.addColorStop(1, lvl < 0.2 ? '#a8bcd4' : '#c4d2e2'); g.fillStyle = gr; g.beginPath(); g.ellipse(cx + ox, cy + oy, r * (lvl < 0.2 ? 1.3 : 1), r * sq, 0, 0, 7); g.fill(); }
        g.restore();
      }
    }
  },
  ground(g, st, t, S, G) {
    // telegraph wires sagging between the poles
    if (near(1848, G.c, 50) && t > 701.2) { for (const h of [232, 212]) for (const [a0, a1] of [[1839, 1845], [1845, 1851], [1851, 1857]]) { const [x0, y0] = G.rad(a0, h), [x1, y1] = G.rad(a1, h), [xm, ym] = G.rad((a0 + a1) / 2, h - 14); g.strokeStyle = 'rgba(40,40,50,.55)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(xm * 2 - (x0 + x1) / 2, ym * 2 - (y0 + y1) / 2, x1, y1); g.stroke(); } }
  },
  over(g, st, t) {
    const { W, H } = st, u = st.eu, p = por(st), sc = p ? 0.66 : 0.98, cx = W * (p ? 0.5 : 0.26), yH = (k) => H * lerp(-0.4, p ? 0.07 : 0.08, k);
    const label = (g2, txt, x, y, size = 16, col = 'rgba(40,26,18,.88)') => { g2.font = `italic 400 ${size}px Fraunces, Georgia, serif`; g2.textAlign = 'center'; g2.fillStyle = col; g2.fillText(txt, x, y); };
    // a manga page, drawn panel by panel like film: a long shot, a close-up, big expressive eyes
    if (t > T_TEZ - 0.8 && t < 676.4) card(st, g, cx, yH(drop(t, T_TEZ - 0.6, 675)) + 130 * u * sc, sc, Math.sin(t * 0.5) * DEG, (g2) => {
      put(g2, st.fx.washi, 0.3, 4, 6); g2.strokeStyle = '#1e1a1c'; g2.lineWidth = 2.2; const P = [[-110, -130, 220, 70], [-110, -50, 104, 110], [6, -50, 104, 110], [-110, 72, 220, 56]], ks = [ev('films', 668.8), ev('closeups', 670.2), ev('longshots', 671.2), ev('eyes', 672.8)];
      P.forEach(([x, y, w, h], i) => { const k = sramp(t, ks[i] - 0.4, ks[i] + 0.4); if (k < 0.01) return; g2.globalAlpha = k; g2.strokeRect(x, y, w, h); g2.save(); g2.beginPath(); g2.rect(x, y, w, h); g2.clip();
        if (i === 0) { g2.fillStyle = '#1e1a1c'; for (let j = 0; j < 9; j++) g2.fillRect(x + 10 + j * 23, y + h - 10 - hash(j) * 40, 16, 60); runner(g2, 0.6, 0.5); }
        else if (i === 1) { g2.translate(x + w / 2, y + h * 0.6); g2.fillStyle = '#f0d8c0'; g2.beginPath(); g2.arc(0, 0, 34, 0, 7); g2.fill(); g2.stroke(); g2.fillStyle = '#1e1a1c'; g2.beginPath(); g2.ellipse(0, -30, 40, 18, 0, Math.PI, 0); g2.fill(); g2.beginPath(); g2.arc(-12, 2, 4, 0, 7); g2.arc(12, 2, 4, 0, 7); g2.fill(); }
        else if (i === 2) { g2.translate(x + w / 2, y + h / 2); for (let j = 0; j < 30; j++) { const a = j / 30 * Math.PI * 2; g2.lineWidth = 1; g2.beginPath(); g2.moveTo(Math.cos(a) * 20, Math.sin(a) * 20); g2.lineTo(Math.cos(a) * 80, Math.sin(a) * 80); g2.stroke(); } g2.translate(0, 34); runner(g2, t * 8, 0.9); }
        else { g2.translate(x + w / 2, y + h / 2); for (const s of [-1, 1]) { g2.fillStyle = '#f4f2ee'; g2.beginPath(); g2.ellipse(s * 36, 0, 26, 20, 0, 0, 7); g2.fill(); g2.stroke(); g2.fillStyle = '#3a5ab8'; g2.beginPath(); g2.ellipse(s * 36, 2, 14, 17, 0, 0, 7); g2.fill(); g2.fillStyle = '#1e1a1c'; g2.beginPath(); g2.ellipse(s * 36, 2, 7, 9, 0, 0, 7); g2.fill(); g2.fillStyle = '#fff'; g2.beginPath(); g2.arc(s * 36 - 6, -6, 5, 0, 7); g2.arc(s * 36 + 5, 8, 2.4, 0, 7); g2.fill(); } }
        g2.restore(); g2.globalAlpha = 1; });
    }, 1, 120);
    // a tower of magazines, counting past six million
    if (t > T_READ + 1.4 && t < 687) {
      const k = sramp(t, T_READ + 1.6, T_6M + 0.4), out = sramp(t, 685.6, 686.8), x = W * (p ? 0.82 : 0.84), base = st.hy - 10 * u, n = Math.floor(k * 40), hgt = Math.min(H * 0.7, n * 12 * u);
      g.save(); g.globalAlpha = 1 - out; for (let i = 0; i < n; i++) { const y = base - i * (hgt / 40) * (40 / Math.max(1, n)) * (n / 40); g.fillStyle = ['#c8302a', '#e8c040', '#3a6ab8', '#2a8a4a', '#e8e4dc'][i % 5]; g.fillRect(x - 30 * u + Math.sin(i * 1.3) * 3 * u, base - (i + 1) * (hgt / Math.max(1, n)), 60 * u, hgt / Math.max(1, n) - 1); }
      g.font = `italic 400 ${Math.max(16, 28 * u)}px Fraunces, Georgia, serif`; g.textAlign = 'center'; g.fillStyle = 'rgba(255,246,226,.95)'; g.fillText(Math.round(k * 6000000).toLocaleString('en') + (k > 0.99 ? '+' : ''), x, base - hgt - 16 * u); g.restore();
    }
    // a run, frame by frame: hanging frames light one after another, and the girl runs across them
    if (t > T_ANI - 0.6 && t < 694.2) {
      const n = p ? 5 : 8, out = sramp(t, 693.2, 694.2);
      for (let i = 0; i < n; i++) { const k = drop(t, T_ANI - 0.4 + i * 0.12, 693.4), x = W * (0.08 + 0.84 * (i / (n - 1))), y = H * lerp(-0.3, 0.16, k), w = Math.min(W / (n + 1), 120 * u), cur = Math.floor((t - T_FRAME) * 8) % n === i && t > T_FRAME;
        g.save(); g.translate(x, y); g.strokeStyle = 'rgba(200,190,175,.4)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -y - 10); g.lineTo(0, -w * 0.4); g.stroke(); g.fillStyle = cur ? '#fffaf0' : '#efe8d8'; g.fillRect(-w / 2, -w * 0.4, w, w * 0.8); g.strokeStyle = 'rgba(60,50,40,.6)'; g.strokeRect(-w / 2, -w * 0.4, w, w * 0.8); g.translate(0, w * 0.3); runner(g, (i / n) * Math.PI * 2, w / 120, cur ? '#c8302a' : 'rgba(42,36,32,.75)'); g.restore();
        if (cur) { g.globalCompositeOperation = 'lighter'; st.stamp(g, st.dot(255, 240, 210), x, y, w * 0.7, 0.4); g.globalCompositeOperation = 'source-over'; } }
    }
    // fifteen months for four seconds: a calendar flips, a stopwatch reads 0:04
    if (t > T_4S - 0.6 && t < 701.6) card(st, g, cx, yH(drop(t, T_4S - 0.4, 700.4)) + 110 * u * sc, sc, Math.sin(t * 0.5) * DEG, (g2) => {
      put(g2, st.fx.plancard, 0.3, 4, 6); const m = Math.min(15, Math.floor(sramp(t, T_4S, T_YEAR) * 15)), MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      g2.fillStyle = '#f4f0e6'; g2.fillRect(-120, -80, 110, 130); g2.fillStyle = '#c8302a'; g2.fillRect(-120, -80, 110, 26); label(g2, MON[m % 12], -65, -60, 18, '#f4f0e6'); label(g2, String(m + 1), -65, 10, 44); label(g2, m >= 14 ? '15 months' : '', -65, 44, 14);
      g2.strokeStyle = '#1e1a1c'; g2.lineWidth = 3; g2.beginPath(); g2.arc(64, -10, 40, 0, 7); g2.stroke(); g2.fillStyle = '#1e1a1c'; g2.fillRect(58, -58, 12, 8); const sa = Math.min(1, sramp(t, T_YEAR, T_YEAR + 1)) * (4 / 60) * Math.PI * 2; g2.beginPath(); g2.moveTo(64, -10); g2.lineTo(64 + Math.sin(sa) * 32, -10 - Math.cos(sa) * 32); g2.stroke(); label(g2, '0:04', 64, 50, 20);
    }, 1, 130);
    // a laurel of gold for the film
    if (t > T_OSCAR - 0.4 && t < 710.6) { const k = drop(t, T_OSCAR - 0.2, 709.6), x = W * (p ? 0.5 : 0.74), y = H * lerp(-0.3, p ? 0.1 : 0.12, k), s = (p ? 0.8 : 1.1) * u; g.save(); g.translate(x, y + 40 * s); g.strokeStyle = 'rgba(200,190,175,.4)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -y - 60 * s); g.lineTo(0, -40 * s); g.stroke(); for (const sd of [-1, 1]) for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + sd * (0.4 + i * 0.3); g.save(); g.translate(Math.cos(a) * 34 * s, Math.sin(a) * 34 * s + 6 * s); g.rotate(a + sd * 1.2); g.fillStyle = i % 2 ? '#d8a838' : '#e8c050'; g.beginPath(); g.ellipse(0, 0, 9 * s, 4 * s, 0, 0, 7); g.fill(); g.restore(); } g.fillStyle = '#e8c050'; g.beginPath(); for (let j = 0; j < 10; j++) { const r = j % 2 ? 8 * s : 18 * s, a = -Math.PI / 2 + j * Math.PI / 5; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.fill(); g.restore(); }
    // the stories go round the world, riding a thread over the planet
    if (t > T_WORLD - 0.4 && t < 713.4) { const k = sramp(t, T_WORLD - 0.4, T_WORLD + 0.4) * (1 - sramp(t, 712.4, 713.4)), R0 = st.eR + 160 * u, cxp = st.cx, cyp = st.ecy; g.save(); g.globalAlpha = k; g.strokeStyle = 'rgba(200,40,40,.6)'; g.lineWidth = Math.max(1, 1.4 * u); g.beginPath(); g.arc(cxp, cyp, R0, -Math.PI * 0.95, -Math.PI * 0.05); g.stroke(); for (let i = 0; i < 5; i++) { const a = -Math.PI * 0.95 + ((t - T_WORLD) * 0.25 + i / 5) % 1 * Math.PI * 0.9, x = cxp + Math.cos(a) * R0, y = cyp + Math.sin(a) * R0; g.save(); g.translate(x, y); icon(g, i, Math.max(0.8, 1.6 * u)); g.restore(); } g.restore(); }
    // flower cards, painted by hand; then a little game, glowing
    if (t > T_CARDS - 0.6 && t < 722.6) { const k = drop(t, T_CARDS - 0.4, 721.4), flip = sramp(t, T_GAMES - 0.6, T_GAMES + 0.4), x = W * (p ? 0.5 : 0.3), y = H * lerp(-0.3, p ? 0.1 : 0.12, k), s = (p ? 0.85 : 1.2) * u;
      for (let i = 0; i < 3; i++) { const cx2 = x + (i - 1) * 74 * s, cw = Math.max(0.05, Math.abs(Math.cos(flip * Math.PI))); if (flip > 0.5) continue; g.save(); g.translate(cx2, y + 50 * s); g.rotate((i - 1) * 0.08); g.scale(s * cw, s); g.fillStyle = '#2a2420'; g.fillRect(-32, -50, 64, 100); g.fillStyle = '#f4ecd8'; g.fillRect(-28, -46, 56, 92); HANAFUDA[i](g); g.restore(); }
      if (flip > 0.5) { g.save(); g.translate(x, y + 50 * s); g.scale(s * Math.min(1, (flip - 0.5) * 2), s); g.fillStyle = '#c8c8cc'; g.beginPath(); g.roundRect ? g.roundRect(-46, -70, 92, 140, 10) : g.rect(-46, -70, 92, 140); g.fill(); g.fillStyle = '#5a5a62'; g.fillRect(-38, -60, 76, 60); g.fillStyle = '#9ab858'; g.fillRect(-32, -54, 64, 48); const px = [[0, 0, 0, 1, 0, 0], [0, 0, 1, 1, 1, 0], [1, 1, 1, 1, 1, 1], [0, 1, 1, 1, 0, 0], [0, 0, 1, 0, 0, 0]]; px.forEach((row, yy) => row.forEach((v, xx) => { if (v) { g.fillStyle = '#2a3a1a'; g.fillRect(-15 + xx * 5 + Math.sin(t * 3) * 6, -40 + yy * 5, 5, 5); } })); g.fillStyle = '#2a2a30'; g.fillRect(-30, 20, 24, 8); g.fillRect(-22, 12, 8, 24); g.fillStyle = '#a8283a'; g.beginPath(); g.arc(20, 26, 6, 0, 7); g.arc(32, 16, 6, 0, 7); g.fill(); g.restore(); g.globalCompositeOperation = 'lighter'; st.stamp(g, st.dot(180, 230, 120), x, y + 22 * s, 60 * s, 0.25); g.globalCompositeOperation = 'source-over'; } }
    // a lens flare across the summer
    if (t > 702 && t < 711.6) { const k = sramp(t, 702, 703) * (1 - sramp(t, 710.6, 711.6)), sx = W * (p ? 0.2 : 0.16), sy = H * 0.13; g.globalCompositeOperation = 'lighter'; for (let i = 1; i < 6; i++) { const f = i / 6, x = lerp(sx, W * 0.75, f), y = lerp(sy, H * 0.6, f); st.stamp(g, st.dot([255, 200, 160, 120, 255][i - 1], 230, 255), x, y, (20 + i * 10) * u, 0.12 * k); } g.globalCompositeOperation = 'source-over'; }
  },
});
