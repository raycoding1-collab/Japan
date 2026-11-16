// Sky props, hanging cards and close-up cards for "The Long Thread". Every group of sprites is cut
// lazily, the first time the film draws it: a long film should not cut its last minute before its first.
import { ellipse, strip, KRAFT, put } from './paper.js';
import { bakeFlames, bakeSky } from './cutouts.js';
import { TEMPLATE_FX } from './sky_borrowed.js';
import { rng, shade, rgb, mix, clamp, smooth, sramp, lerp, DEG } from './util.js';

export const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
// [names, maker] groups added by the chapters (see the bottom of this file and src/sky_cards.js)
export const CHINA_FX = [];
export const fxGroup = (names, fn) => CHINA_FX.push([names, fn]);

export function makeFx(mk, mkSoft, mkBig, stage) {
  const S = bakeSky(mkSoft);
  S.flames = bakeFlames(mk);
  const r = rng(77);
  S.puffs = [0, 1, 2].map((v) => {
    const pts = []; for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2, rr = 16 + r() * 7; pts.push([Math.cos(a) * rr, Math.sin(a) * rr * 0.8]); }
    return mk('puff' + v, [-26, -24, 26, 24], { pad: 6 }).piece(pts, ['#8e8a86', '#a09a94', '#7a7672'][v], { round: 7, rough: 1.6, seg: 8, rim: 0.3 }).finish({ shadowBlur: 3 });
  });
  S.wing = mk('wing', [-2, -12, 30, 5], { pad: 4 }).piece([[0, -1], [8, -7], [18, -10], [28, -9], [16, -4], [6, 3]], '#2b2420', { round: 2, rough: 0.4, rim: 0.2, thick: 0.6, lift: 0 }).finish({ shadowBlur: 2 });
  // made later sprites join the stage's list, so a resize can give their memory back
  const reg = (o, seen = new Set(), d = 0) => { if (!o || typeof o !== 'object' || seen.has(o) || d > 6) return; seen.add(o); if (o.sprite) { stage.baked?.add(o); return; } if (o instanceof HTMLCanvasElement) return; for (const k in o) reg(o[k], seen, d + 1); };
  const group = (names, fn) => {
    let v = null;
    const get = () => { if (!v) { v = fn(mk, mkSoft, mkBig, stage); reg(v); } return v; };
    for (const n of names) Object.defineProperty(S, n, { get: () => get()[n], enumerable: false, configurable: true });
  };
  for (const [names, fn] of TEMPLATE_FX) group(names, fn);
  for (const [names, fn] of CHINA_FX) group(names, fn);
  return S;
}

// Hang a prop from two threads (long things: a flute, a scroll, a banner).
export function hang2(st, g, spr, x, y, s, swing, alpha = 1, spread = 0.42) {
  const u = st.eu, w = spr.w * spread * u * s;
  g.save(); g.globalAlpha = alpha; g.translate(x, y); g.rotate(swing);
  g.strokeStyle = 'rgba(200,190,175,0.32)'; g.lineWidth = Math.max(1, 0.6 * u);
  for (const dx of [-w, w]) { g.beginPath(); g.moveTo(dx, (spr.y + 6) * u * s); g.lineTo(dx - Math.sin(swing) * (y + 40), -y - 40); g.stroke(); }
  g.scale(u * s, u * s); put(g, spr, 0.2, 4, 6);
  g.restore(); g.globalAlpha = 1;
}

// ----------------------------------------------------------- the bone flute ---
// The flute itself, as it came out of the ground at Jiahu: a crane's wing bone with seven holes.
fxGroup(['boneflute'], (mk) => {
  const r = rng(9000), S = {};
  S.boneflute = mk('boneflute', [-120, -16, 120, 16], { pad: 8 })
    .piece([[-112, -6], [-104, -9.5], [-60, -8], [40, -7.4], [100, -8.6], [112, -6], [114, 4], [104, 8], [40, 7], [-60, 7.6], [-104, 9], [-114, 5]], '#e2d3b0', { round: 4, rough: 0.5, seg: 30, paint: (g) => {
      g.fillStyle = 'rgba(140,100,60,.25)'; for (let i = 0; i < 40; i++) { g.beginPath(); g.ellipse(-110 + r() * 220, -6 + r() * 12, 2 + r() * 8, 0.8 + r() * 2, 0, 0, 7); g.fill(); }
      g.fillStyle = 'rgba(120,80,40,.35)'; g.fillRect(-114, -9, 10, 18); g.fillRect(104, -9, 10, 18);
      for (let i = 0; i < 7; i++) { const x = -42 + i * 16; g.fillStyle = 'rgba(40,24,14,.92)'; g.beginPath(); g.ellipse(x, -0.5, 3.2, 2.6, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,240,210,.35)'; g.beginPath(); g.ellipse(x - 0.8, -1.4, 1.1, 0.8, 0, 0, 7); g.fill(); }
      g.fillStyle = 'rgba(40,24,14,.7)'; g.beginPath(); g.arc(-26 + 8, -0.5, 0.9, 0, 7); g.fill(); // the tiny tuning hole beside the seventh
      g.strokeStyle = 'rgba(90,60,30,.4)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(60, -7); g.lineTo(66, -1); g.lineTo(63, 6); g.stroke();
    } }).finish({ shadowBlur: 4 });
  return S;
});

// ------------------------------------------------------------ oracle bones ---
// A turtle's under-shell, prepared for divination: polished, with rows of hollows drilled into it.
export const HOLLOWS = [[-42, -78], [42, -78], [-46, -26], [46, -26], [-46, 26], [46, 26], [-40, 76], [40, 76]];
fxGroup(['plastron', 'rod', 'slip'], (mk, mkSoft, mkBig) => {
  const r = rng(1250), S = {};
  const pts = [[-30, -140], [30, -140], [44, -126], [70, -96], [84, -50], [80, -20], [80, 20], [88, 58], [74, 104], [44, 132], [18, 144], [-18, 144], [-44, 132], [-74, 104], [-88, 58], [-80, 20], [-80, -20], [-84, -50], [-70, -96], [-44, -126]];
  S.plastron = mkBig('plastron', [-96, -150, 96, 152], { pad: 14 }).piece(pts, '#e6d6b2', { round: 22, rough: 1.4, seg: 20, lift: 4, thick: 4, paint: (g) => {
    for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '150,110,60' : '255,246,226'},${0.05 + r() * 0.1})`; g.beginPath(); g.ellipse(-80 + r() * 160, -130 + r() * 270, 4 + r() * 18, 2 + r() * 8, r() * 3, 0, 7); g.fill(); }
    g.strokeStyle = 'rgba(120,86,50,.45)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(0, -140); g.lineTo(0, 144); g.stroke();
    for (const [y, b] of [[-104, 10], [-52, 14], [0, 8], [50, 14], [104, 10]]) { g.beginPath(); g.moveTo(-86, y + b); g.quadraticCurveTo(0, y - b, 86, y + b); g.stroke(); }
    for (const [x, y] of HOLLOWS) { const s = Math.sign(x); g.fillStyle = 'rgba(96,64,36,.55)'; g.beginPath(); g.ellipse(x, y, 7, 12, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(70,44,24,.5)'; g.beginPath(); g.arc(x - s * 12, y, 5.4, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,246,226,.5)'; g.lineWidth = 1; g.beginPath(); g.ellipse(x + 0.8, y + 0.8, 7, 12, 0, 0.3, 2.6); g.stroke(); }
  } }).finish({ shadowBlur: 10 });
  S.rod = mkBig('hotrod', [-6, -200, 6, 6], { pad: 6 }).piece([[-3, 0], [3, 0], [3.6, -196], [-3, -196]], '#5a3a26', { round: 1.5, rough: 0.6, paint: (g) => { g.fillStyle = '#2a1810'; g.fillRect(-3, -12, 6.6, 12); } }).finish({ shadowBlur: 5 });
  S.slip = mkBig('signslip', [-140, -60, 140, 60], { pad: 10 }).piece([[-132, -52], [132, -54], [134, 52], [-130, 54]], '#efe5cc', { round: 4, rough: 0.8, lift: 3, thick: 3, paint: (g) => { g.strokeStyle = 'rgba(150,120,80,.3)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-126, 0); g.lineTo(126, 0); g.stroke(); for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(160,130,90,.12)'; g.fillRect(-130 + Math.random() * 260, -50 + Math.random() * 100, 3, 1); } } }).finish({ shadowBlur: 8 });
  return S;
});

// Signs as strokes in a 40-unit box: the oracle-bone forms (incised) and the forms written today (brush).
const circ = (rx, ry, n = 14, a0 = 0, a1 = Math.PI * 2) => { const p = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * (i / n); p.push([Math.cos(a) * rx, Math.sin(a) * ry]); } return p; };
export const GLYPH = {
  // the inscription: 卜 (crack), 貞 (to ask, drawn as a ding), 旬 (ten days, a spiral), 亡 (no), and a bone with a crack (misfortune)
  bu: [[[0, -18], [0, 18]], [[0, -4], [12, -12]]],
  zhen: [[[-12, -9], [12, -9], [12, 8], [-12, 8], [-12, -9]], [[-8, 8], [-10, 18]], [[8, 8], [10, 18]], [[-7, -9], [-7, -17]], [[7, -9], [7, -17]], [[-12, 0], [12, 0]]],
  xun: [[[10, -16], [-6, -16], [-12, -6], [-10, 8], [2, 12], [10, 4], [4, -4], [-4, 0]]],
  wang: [[[-4, -18], [-4, 14], [14, 14]], [[-14, -10], [6, -10]]],
  huo: [[[-10, -18], [10, -18], [10, 16], [-10, 16], [-10, -18]], [[0, -10], [0, 10]], [[0, -2], [7, -8]]],
  // 日 月 人 木 山, then and now
  m_tian: [[[-12, -14], [12, -14]], [[-15, -2], [15, -2]], [[0, -14], [0, -2], [-4, 6], [-13, 16]], [[0, -2], [5, 6], [14, 16]]],
  o_ri: [circ(13, 15, 16), [[-4, 0], [4, 0]]], m_ri: [[[-10, -16], [10, -16], [10, 16], [-10, 16], [-10, -16]], [[-10, 0], [10, 0]]],
  o_yue: [[[4, -18], [-8, -10], [-12, 4], [-4, 16], [8, 18], [2, 8], [0, -6], [4, -18]], [[-6, 2], [0, 4]]], m_yue: [[[-9, -16], [-9, 6], [-14, 17]], [[-9, -16], [10, -16], [10, 14], [6, 17]], [[-9, -5], [10, -5]], [[-9, 5], [10, 5]]],
  o_ren: [[[6, -18], [-2, -6], [-4, 6], [-10, 18]], [[-2, -4], [10, 4]]], m_ren: [[[1, -17], [-1, 0], [-13, 16]], [[0, -4], [6, 6], [14, 15]]],
  o_mu: [[[0, -18], [0, 18]], [[0, -6], [-10, -16]], [[0, -6], [10, -16]], [[0, 8], [-10, 18]], [[0, 8], [10, 18]]], m_mu: [[[-15, -6], [15, -6]], [[0, -18], [0, 18]], [[0, -6], [-14, 12]], [[0, -6], [14, 12]]],
  o_shan: [[[-16, 14], [-14, -4], [-8, 10], [0, -16], [8, 10], [14, -4], [16, 14], [-16, 14]]], m_shan: [[[0, -18], [0, 14]], [[-13, -6], [-13, 14], [13, 14]], [[13, -6], [13, 14]]],
};
// Draw a sign, stroke by stroke, k from 0 (nothing) to 1 (all). style: 'cut' (incised in bone), 'red' (cut, rubbed with
// red pigment), 'ink' (brush).
export function glyph(g, name, x, y, s, k, style = 'cut') {
  if (k <= 0) return;
  const strokes = GLYPH[name], lens = strokes.map((p) => p.slice(1).reduce((a, q, i) => a + Math.hypot(q[0] - p[i][0], q[1] - p[i][1]), 0)), total = lens.reduce((a, b) => a + b, 0);
  let left = k * total;
  g.save(); g.translate(x, y); g.scale(s, s); g.lineCap = 'round'; g.lineJoin = 'round';
  const pass = (col, w, dx, dy) => {
    let rem = left;
    g.strokeStyle = col; g.lineWidth = w;
    strokes.forEach((p, si) => {
      if (rem <= 0) return; g.beginPath(); g.moveTo(p[0][0] + dx, p[0][1] + dy);
      for (let i = 1; i < p.length; i++) { const L = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); if (rem >= L) { g.lineTo(p[i][0] + dx, p[i][1] + dy); rem -= L; } else { const f = rem / L; g.lineTo(p[i - 1][0] + (p[i][0] - p[i - 1][0]) * f + dx, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * f + dy); rem = 0; break; } }
      g.stroke();
    });
  };
  if (style === 'ink') { pass('rgba(24,18,16,.92)', 3.6, 0, 0); }
  else { const w = style === 'red' ? 2.2 : 3; pass('rgba(255,248,230,.6)', w + 0.4, 0.8, 0.8); pass(style === 'red' ? 'rgba(150,40,26,.92)' : 'rgba(60,34,18,.95)', w, 0, 0); }
  g.restore();
}
// A crack spreading from a hollow: the long split along the shell, then the side branch (the sign 卜 copies it).
export function crack(g, x, y, k, dir = 1, seed = 1) {
  if (k <= 0) return;
  const r = rng(seed), main = [[0, 0]], side = [[0, 0]];
  for (let i = 1; i <= 8; i++) main.push([(r() - 0.5) * 3, i * 7 * (i % 2 ? 1 : 1)]);
  for (let i = 1; i <= 5; i++) side.push([dir * i * 5 + (r() - 0.5) * 2, -i * 2.4 - (r() - 0.5) * 2]);
  g.save(); g.translate(x, y - 22); g.strokeStyle = 'rgba(40,22,10,.95)'; g.lineWidth = 1.8; g.lineCap = 'round';
  const draw = (pts, kk) => { if (kk <= 0) return; const n = Math.max(1, Math.floor(kk * (pts.length - 1))); g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i <= n; i++) g.lineTo(pts[i][0], pts[i][1]); g.stroke(); };
  draw(main, clamp(k * 1.6)); g.translate(main[3][0], main[3][1]); draw(side, clamp(k * 1.6 - 0.6));
  g.restore();
}

// The Mandate of Heaven: a scroll of yellow silk with the sign for heaven, lowered on a thread.
fxGroup(['mandate'], (mk) => ({
  mandate: mk('mandate', [-44, -100, 44, 100], { pad: 8 }).piece([[-36, -86], [36, -86], [36, 88], [-36, 88]], '#e8c96a', { round: 2, paint: (g) => { g.strokeStyle = 'rgba(160,110,40,.5)'; g.lineWidth = 1.4; g.strokeRect(-30, -78, 60, 160); glyph(g, 'm_tian', 0, -24, 1.6, 1, 'ink'); g.fillStyle = 'rgba(178,40,32,.9)'; g.fillRect(-10, 34, 20, 20); g.fillStyle = 'rgba(232,201,106,.9)'; g.fillRect(-6, 38, 4, 12); g.fillRect(2, 38, 4, 12); g.fillRect(-6, 42, 12, 3); } })
    .piece([[-42, -94], [42, -94], [42, -84], [-42, -84]], '#6a3a22', { round: 2, lift: 1.2 }).piece([[-42, 86], [42, 86], [42, 96], [-42, 96]], '#6a3a22', { round: 2, lift: 1.2 }).finish({ shadowBlur: 4 }),
}));

// ------------------------------------------------------- the First Emperor ---
fxGroup(['qinslip', 'knifecoin', 'spadecoin', 'banliang', 'weight', 'faces'], (mk) => {
  const r = rng(221), S = {};
  const slip = mk('qinslip', [-44, -90, 44, 90], { pad: 6 });
  for (let i = 0; i < 6; i++) { const x = -36 + i * 14.4; slip.piece([[x - 6.4, -84], [x + 6.4, -84], [x + 6.4, 84], [x - 6.4, 84]], i % 2 ? '#d8c08a' : '#ccb27a', { round: 1.5, rough: 0.3, lift: 0.8, thick: 0.8 }); }
  S.qinslip = slip.piece([[-42, -60], [42, -60], [42, -57], [-42, -57]], '#7a5a3a', { round: 0.5, lift: 0.6 }).piece([[-42, 58], [42, 58], [42, 61], [-42, 61]], '#7a5a3a', { round: 0.5, lift: 0.6, paint: (g) => { const names = ['m_ri', 'm_yue', 'm_ren', 'm_mu', 'm_shan', 'm_tian']; for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) glyph(g, names[(i + j * 2) % 6], -36 + i * 14.4, -40 + j * 40, 0.3, 1, 'ink'); } }).finish({ shadowBlur: 4 });
  S.knifecoin = mk('knifecoin', [-14, -60, 14, 20], { pad: 5 }).piece([[-4, 16], [4, 16], [6, 6], [6, -30], [2, -52], [-6, -56], [-6, -30], [-6, 6]], '#7a8a6a', { round: 2, paint: (g) => { g.strokeStyle = 'rgba(40,50,30,.6)'; g.lineWidth = 1; g.beginPath(); g.arc(0, 10, 3, 0, 7); g.stroke(); } }).finish({ shadowBlur: 3 });
  S.spadecoin = mk('spadecoin', [-24, -36, 24, 30], { pad: 5 }).piece([[-4, -30], [4, -30], [4, -16], [18, -10], [22, 24], [8, 18], [0, 26], [-8, 18], [-22, 24], [-18, -10], [-4, -16]], '#7a8a6a', { round: 2, paint: (g) => { g.strokeStyle = 'rgba(40,50,30,.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -12); g.lineTo(0, 16); g.stroke(); } }).finish({ shadowBlur: 3 });
  S.banliang = mk('banliang', [-28, -28, 28, 28], { pad: 5 }).piece(ellipse(0, 0, 25, 25, 26), '#a88a52', { round: 4, paint: (g) => { g.fillStyle = 'rgba(30,20,10,.92)'; g.fillRect(-6, -6, 12, 12); g.strokeStyle = 'rgba(70,50,24,.7)'; g.lineWidth = 1.4; g.beginPath(); g.arc(0, 0, 22, 0, 7); g.stroke(); glyph(g, 'm_ren', -15, 0, 0.26, 1, 'ink'); glyph(g, 'm_mu', 15, 0, 0.26, 1, 'ink'); } }).finish({ shadowBlur: 3 });
  S.weight = mk('weight', [-30, -36, 30, 24], { pad: 5 }).piece([[-26, 20], [26, 20], [24, 4], [16, -12], [6, -18], [-6, -18], [-16, -12], [-24, 4]], '#8a7a52', { round: 6, paint: (g) => { glyph(g, 'm_tian', -8, 4, 0.3, 1, 'cut'); glyph(g, 'm_shan', 8, 4, 0.3, 1, 'cut'); } }).piece([[-6, -18], [-6, -28], [6, -28], [6, -18], [3, -18], [3, -24], [-3, -24], [-3, -18]], '#7a6a44', { round: 1.5, lift: 1 }).finish({ shadowBlur: 3 });
  const f = mk('faces', [-110, -50, 110, 50], { pad: 8 }).piece([[-104, -44], [104, -44], [104, 44], [-104, 44]], '#e8dcc0', { round: 3, rough: 0.6 });
  [[-66, 0], [0, 1], [66, 2]].forEach(([x, k]) => {
    const nose = 10 + k * 2;
    f.piece([[x - 18, 34], [x + 14, 34], [x + 18, 16], [x + nose + 8, 6], [x + 18, 0], [x + 18, -14], [x + 6, -26], [x - 14, -24], [x - 22, -4]], ['#a8907a', '#b09880', '#9a8470'][k], { round: 6, lift: 1.4, paint: (g) => {
      g.fillStyle = 'rgba(40,26,18,.85)'; g.beginPath(); g.arc(x + 9, -2, 1.6, 0, 7); g.fill();
      g.strokeStyle = 'rgba(60,40,28,.75)'; g.lineWidth = 1.8; g.lineCap = 'round';
      if (k === 0) { g.beginPath(); g.moveTo(x + 6, 12); g.quadraticCurveTo(x + 14, 8, x + 22, 14); g.stroke(); }
      if (k === 1) { g.fillStyle = 'rgba(80,58,40,.6)'; g.beginPath(); g.moveTo(x - 2, 18); g.lineTo(x + 16, 20); g.lineTo(x + 6, 34); g.fill(); }
      if (k === 2) { g.beginPath(); g.moveTo(x + 4, 14); g.lineTo(x + 20, 10); g.stroke(); g.beginPath(); g.moveTo(x + 2, -8); g.lineTo(x + 14, -10); g.stroke(); }
    } });
    f.piece(k === 1 ? [[x - 16, -22], [x - 18, -36], [x + 4, -40], [x + 10, -26]] : ellipse(x - 10, -24, 8, 7, 10), '#8a7460', { round: 2, lift: 1 });
  });
  S.faces = f.finish({ shadowBlur: 4 });
  return S;
});

// ------------------------------------------------------------ the Silk Road ---
fxGroup(['horseIcon', 'grapes', 'glass'], (mk) => ({
  horseIcon: mk('ic-horse', [-22, -20, 22, 16], { pad: 4 }).piece([[-16, 4], [-14, -6], [4, -8], [12, -16], [18, -14], [14, -6], [12, 4], [10, 14], [7, 14], [6, 6], [-8, 6], [-10, 14], [-13, 14], [-14, 6], [-20, 2]], '#8a5a3a', { round: 2 }).finish({ shadowBlur: 2 }),
  grapes: mk('ic-grapes', [-14, -18, 14, 18], { pad: 4 }).piece([[-2, -16], [2, -16], [1, -10], [-1, -10]], '#5a6a2a', { round: 0.5 }).piece([[0, -14], [10, -18], [8, -12]], '#6a8a3a', { round: 1, lift: 0.6 }).piece([[-12, -8], [12, -8], [8, 6], [0, 16], [-8, 6]], '#6a3a6a', { round: 4, paint: (g) => { g.fillStyle = 'rgba(160,110,170,.6)'; for (const [x, y] of [[-6, -4], [2, -4], [8, -3], [-3, 3], [4, 3], [0, 10]]) { g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); } } }).finish({ shadowBlur: 2 }),
  glass: mk('ic-glass', [-16, -14, 16, 12], { pad: 4 }).piece([[-14, -10], [14, -10], [10, 4], [4, 8], [-4, 8], [-10, 4]], '#5a8ab0', { round: 3, paint: (g) => { g.fillStyle = 'rgba(220,240,255,.5)'; g.fillRect(-10, -8, 4, 10); g.strokeStyle = 'rgba(30,60,90,.5)'; g.lineWidth = 1; g.beginPath(); g.arc(0, -2, 5, 0, 7); g.stroke(); } }).finish({ shadowBlur: 2 }),
}));
// Zhang Heng's earthquake jar: eight dragons, each with a ball in its mouth; eight toads waiting below.
export const SEIS_DRAGONS = [-92, -50, 0, 50, 92];
fxGroup(['seismo', 'seisball'], (mk, mkSoft, mkBig) => {
  const c = '#6f8466', cd = shade(c, -0.25), S = {};
  const sh = mkBig('seismo', [-130, -170, 130, 130], { pad: 14 });
  sh.piece([[-110, 120], [110, 120], [104, 104], [-104, 104]], '#5a5a48', { round: 3 });
  // the toads, mouths open
  for (const x of SEIS_DRAGONS) sh.piece([[x - 18, 104], [x - 20, 92], [x - 12, 80], [x - 6, 84], [x, 76], [x + 6, 84], [x + 12, 80], [x + 20, 92], [x + 18, 104]], shade(c, Math.abs(x) > 60 ? -0.12 : 0), { round: 4, lift: 1.4, paint: (g) => { g.fillStyle = 'rgba(20,24,16,.9)'; g.beginPath(); g.ellipse(x, 82, 7, 4, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(230,220,180,.8)'; for (const s of [-1, 1]) { g.beginPath(); g.arc(x + s * 11, 86, 2, 0, 7); g.fill(); } } });
  // the jar
  const jar = []; for (let i = 0; i <= 16; i++) { const f = i / 16, y = 70 - f * 190, w = 46 + Math.sin(f * Math.PI) ** 0.8 * 44 - (f > 0.85 ? (f - 0.85) * 120 : 0); jar.push([w, y]); }
  sh.piece([...jar, ...jar.slice().reverse().map(([x, y]) => [-x, y])], c, { round: 6, lift: 2, paint: (g) => { g.strokeStyle = 'rgba(30,40,24,.45)'; g.lineWidth = 2; for (const y of [40, -6, -100]) { g.beginPath(); g.moveTo(-90, y); g.quadraticCurveTo(0, y + 10, 90, y); g.stroke(); } g.fillStyle = 'rgba(220,230,200,.12)'; g.fillRect(-60, -110, 18, 170); for (let i = 0; i < 18; i++) { g.strokeStyle = 'rgba(30,40,24,.25)'; g.beginPath(); g.arc(-70 + (i % 6) * 28, 0 + Math.floor(i / 6) * 22, 5, 0, 5); g.stroke(); } } });
  sh.piece([[-40, -118], [40, -118], [30, -150], [0, -162], [-30, -150]], cd, { round: 6, lift: 1.6, paint: (g) => { g.fillStyle = 'rgba(200,210,180,.2)'; g.beginPath(); g.ellipse(0, -140, 16, 6, 0, 0, 7); g.fill(); } });
  // the dragons, heads down, jaws open
  for (const x of SEIS_DRAGONS) { const s = Math.sign(x) || 1, edge = Math.abs(x) > 60; sh.piece(edge ? [[x - s * 14, -84], [x + s * 4, -86], [x + s * 18, -70], [x + s * 20, -54], [x + s * 10, -50], [x + s * 6, -62], [x - s * 10, -66]] : [[x - 12, -88], [x + 12, -88], [x + 14, -66], [x + 9, -52], [x + 3, -60], [x - 3, -60], [x - 9, -52], [x - 14, -66]], shade(c, 0.08), { round: 3, lift: 1.8, paint: (g) => { g.fillStyle = 'rgba(20,24,16,.85)'; g.beginPath(); g.arc(x + (edge ? s * 4 : -6), -78, 1.8, 0, 7); g.fill(); if (!edge) { g.beginPath(); g.arc(x + 6, -78, 1.8, 0, 7); g.fill(); } g.strokeStyle = 'rgba(30,40,24,.5)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x - 10, -96); g.quadraticCurveTo(x, -106, x + 10, -96); g.stroke(); } }); }
  S.seismo = sh.finish({ shadowBlur: 10 });
  S.seisball = mkBig('seisball', [-8, -8, 8, 8], { pad: 4 }).piece(ellipse(0, 0, 6, 6, 12), '#b8a050', { round: 2 }).finish({ shadowBlur: 3 });
  return S;
});

// ------------------------------------------------------------ long divided ---
// The realm as one sheet: ink mountains and a river, a red seal. It tears into three, and mends, and tears.
export const TEAR = [[-110, [-110, -70, -36, 70], [[-36, -70], [-30, -40], [-42, -10], [-30, 20], [-40, 46], [-34, 70]]], [0, [-36, -70, 38, 70], [[38, -70], [44, -36], [32, -4], [44, 30], [34, 70]]], [110, [38, -70, 110, 70], null]];
fxGroup(['realm'], (mk) => {
  const r = rng(220), S = { realm: [] };
  const paintRealm = (g) => {
    g.strokeStyle = 'rgba(40,34,30,.7)'; g.lineWidth = 2; g.lineCap = 'round';
    for (const [x0, h] of [[-96, 34], [-70, 50], [-44, 30], [10, 44], [40, 30], [70, 52], [94, 36]]) { g.beginPath(); g.moveTo(x0 - 18, -4); g.quadraticCurveTo(x0 - 6, -4 - h, x0, -6 - h); g.quadraticCurveTo(x0 + 6, -4 - h, x0 + 18, -4); g.stroke(); }
    g.strokeStyle = 'rgba(60,90,110,.7)'; g.lineWidth = 3; g.beginPath(); g.moveTo(-104, 30); g.bezierCurveTo(-50, 10, -20, 50, 20, 30); g.bezierCurveTo(60, 12, 80, 46, 104, 36); g.stroke();
    g.fillStyle = 'rgba(178,40,32,.88)'; g.fillRect(70, 44, 22, 22); g.fillStyle = 'rgba(240,230,210,.9)'; g.fillRect(74, 48, 3, 14); g.fillRect(85, 48, 3, 14); g.fillRect(74, 54, 14, 3);
  };
  const edge = (pts, x) => pts || [[x, 70], [x, -70]];
  TEAR.forEach(([cx, box], i) => {
    const left = i === 0 ? [[-104, 66], [-104, -66]] : TEAR[i - 1][2].slice().reverse(), right = TEAR[i][2] || [[104, -66], [104, 66]];
    const poly = [...left.map(([x, y]) => [x - cx, y]), ...right.map(([x, y]) => [x - cx, y])];
    S.realm.push(mk('realm' + i, [box[0] - cx - 8, -76, box[2] - cx + 8, 76], { pad: 6 }).piece(poly, '#efe4c8', { round: 1, rough: 0.8, seg: 12, paint: (g) => { g.translate(-cx, 0); paintRealm(g); } }).finish({ shadowBlur: 4 }));
  });
  return S;
});

// ---------------------------------------------------------------- Li Bai ---
fxGroup(['fullmoon', 'homecard'], (mk) => {
  const r = rng(701), S = {};
  S.fullmoon = mk('fullmoon', [-46, -46, 46, 46], { pad: 8 }).piece(ellipse(0, 0, 40, 40, 30), '#f2ecd8', { round: 6, rough: 0.8, paint: (g) => { g.fillStyle = 'rgba(180,170,150,.35)'; for (const [x, y, rr] of [[-12, -8, 9], [10, 6, 12], [-4, 18, 6], [16, -16, 5], [-20, 10, 4]]) { g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill(); } } }).finish({ shadowBlur: 6 });
  S.homecard = mk('homecard', [-70, -50, 70, 50], { pad: 6 }).piece(ellipse(0, 0, 64, 44, 30), '#d8d4c4', { round: 6, paint: (g) => {
    g.fillStyle = '#8a9a8a'; g.beginPath(); g.moveTo(-64, 10); g.quadraticCurveTo(-30, -26, 0, 4); g.quadraticCurveTo(30, -30, 64, 6); g.lineTo(64, 44); g.lineTo(-64, 44); g.fill();
    g.fillStyle = '#6a7a6a'; g.beginPath(); g.moveTo(-64, 26); g.quadraticCurveTo(0, 6, 64, 26); g.lineTo(64, 44); g.lineTo(-64, 44); g.fill();
    g.fillStyle = '#e8e2d4'; g.fillRect(-14, 4, 26, 16); g.fillStyle = '#4a4a50'; g.beginPath(); g.moveTo(-20, 6); g.lineTo(-1, -8); g.lineTo(18, 6); g.fill();
    g.fillStyle = 'rgba(255,200,120,.95)'; g.fillRect(-6, 9, 6, 6); g.strokeStyle = 'rgba(160,150,140,.6)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(10, -6); g.quadraticCurveTo(14, -20, 8, -30); g.stroke();
  } }).finish({ shadowBlur: 4 });
  return S;
});

// --------------------------------------------------------------- the Song ---
fxGroup(['compass', 'needle', 'jiaozi'], (mk) => {
  const S = {};
  S.compass = mk('compass', [-56, -40, 56, 40], { pad: 6 }).piece(ellipse(0, 0, 52, 34, 28), '#8a6a44', { round: 6, paint: (g) => { g.strokeStyle = 'rgba(40,26,14,.5)'; g.lineWidth = 1.4; g.beginPath(); g.ellipse(0, 0, 46, 29, 0, 0, 7); g.stroke(); for (let k = 0; k < 24; k++) { const a = k * Math.PI / 12; g.beginPath(); g.moveTo(Math.cos(a) * 40, Math.sin(a) * 25); g.lineTo(Math.cos(a) * 46, Math.sin(a) * 29); g.stroke(); } } }).piece(ellipse(0, 0, 34, 21, 24), '#6a9aa8', { round: 5, lift: 0.8, paint: (g) => { g.fillStyle = 'rgba(230,245,250,.35)'; g.beginPath(); g.ellipse(-10, -6, 14, 4, -0.2, 0, 7); g.fill(); } }).finish({ shadowBlur: 4 });
  // the needle, magnetised and floated on water, cut in the shape of a little fish
  S.needle = mk('needle', [-30, -8, 30, 8], { pad: 4 }).piece([[-26, 0], [-16, -5], [14, -5], [24, 0], [14, 5], [-16, 5]], '#4a4e56', { round: 3, paint: (g) => { g.fillStyle = '#c8322a'; g.beginPath(); g.moveTo(14, -5); g.lineTo(24, 0); g.lineTo(14, 5); g.fill(); g.fillStyle = '#efe6d0'; g.beginPath(); g.arc(10, -1, 1.4, 0, 7); g.fill(); } }).piece([[-26, 0], [-32, -6], [-30, 0], [-32, 6]], '#4a4e56', { round: 1, lift: 0.6 }).finish({ shadowBlur: 2 });
  S.jiaozi = mk('jiaozi', [-12, -20, 12, 20], { pad: 3 }).piece(rect(-10, -18, 10, 18), '#e6d8b0', { round: 1, rough: 0.3, paint: (g) => { g.strokeStyle = 'rgba(40,30,24,.8)'; g.lineWidth = 1; g.strokeRect(-8, -16, 16, 32); g.fillStyle = 'rgba(40,30,24,.6)'; for (let y = -12; y < 6; y += 3) g.fillRect(-6, y, 12, 1); g.fillStyle = 'rgba(178,40,32,.9)'; g.fillRect(-5, 8, 5, 5); g.fillRect(1, 8, 5, 5); } }).finish({ shadowBlur: 2 });
  return S;
});
// A firework, cut from paper: a burst of petals that opens, droops and fades.
export function burst(g, st, x, y, d, col, n = 26, size = 1) {
  if (d < 0 || d > 2.6) return;
  const u = st.eu * size, open = 1 - Math.exp(-d * 3.4), fade = 1 - clamp((d - 1.2) / 1.4), R = 110 * u * open;
  g.globalCompositeOperation = 'lighter';
  if (d < 0.5) st.stamp(g, st.dot(255, 230, 180, '255,250,235'), x, y, 90 * u * (1 - d * 1.6), 0.9 * (1 - d * 2));
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + d * 0.1, px = x + Math.cos(a) * R, py = y + Math.sin(a) * R * 0.92 + d * d * 26 * u;
    st.stamp(g, st.dot(col[0], col[1], col[2], '255,248,230'), px, py, 7 * u * (0.6 + 0.4 * fade), fade);
    g.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${0.55 * fade})`; g.lineWidth = Math.max(1, 2 * u);
    g.beginPath(); g.moveTo(x + Math.cos(a) * R * 0.55, y + Math.sin(a) * R * 0.5 + d * d * 10 * u); g.lineTo(px, py); g.stroke();
  }
  g.globalCompositeOperation = 'source-over';
}

// The qilin of legend, drawn the way the court painters saw it: hooves, scales, a single horn, flames.
fxGroup(['qilin'], (mk) => ({
  qilin: mk('qilin', [-80, -60, 80, 60], { pad: 6 }).piece([[-74, -54], [74, -54], [74, 54], [-74, 54]], '#efe4c8', { round: 2, paint: (g) => {
    g.strokeStyle = 'rgba(40,30,24,.85)'; g.lineWidth = 1.6; g.lineCap = 'round'; g.fillStyle = 'rgba(200,90,50,.25)';
    g.beginPath(); g.moveTo(-40, 20); g.quadraticCurveTo(-36, -6, -10, -6); g.lineTo(26, -8); g.quadraticCurveTo(40, -10, 44, -26); g.quadraticCurveTo(52, -38, 60, -30); g.quadraticCurveTo(58, -18, 46, -6); g.quadraticCurveTo(40, 8, 28, 14); g.lineTo(-30, 18); g.closePath(); g.fill(); g.stroke();
    for (const x of [-34, -22, 18, 30]) { g.beginPath(); g.moveTo(x, 16); g.lineTo(x + 2, 40); g.lineTo(x + 6, 40); g.stroke(); }
    g.beginPath(); g.moveTo(52, -36); g.lineTo(56, -48); g.stroke();
    g.beginPath(); g.moveTo(-40, 8); g.quadraticCurveTo(-56, 0, -60, -16); g.quadraticCurveTo(-50, -10, -46, -2); g.stroke();
    for (let i = 0; i < 12; i++) { g.beginPath(); g.arc(-24 + (i % 6) * 9, -2 + Math.floor(i / 6) * 8, 3, Math.PI, 0); g.stroke(); }
    g.strokeStyle = 'rgba(200,80,40,.7)'; for (const [x, y] of [[-16, -10], [8, -12], [-30, -8]]) { g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x - 4, y - 10, x + 2, y - 16); g.stroke(); }
    g.fillStyle = 'rgba(178,40,32,.85)'; g.fillRect(58, 34, 10, 10);
  } }).finish({ shadowBlur: 4 }),
}));

// ------------------------------------------------------- the last dynasty ---
fxGroup(['teaIcon', 'vase', 'sycee'], (mk) => ({
  teaIcon: mk('ic-tea', [-14, -14, 14, 14], { pad: 4 }).piece(rect(-12, -12, 12, 12), '#9a6a3a', { round: 1.5, paint: (g) => { g.fillStyle = 'rgba(240,220,170,.85)'; g.fillRect(-8, -8, 16, 16); g.fillStyle = '#5a7a3a'; g.beginPath(); g.ellipse(0, 0, 5, 3, 0.6, 0, 7); g.fill(); } }).finish({ shadowBlur: 2 }),
  vase: mk('ic-vase', [-12, -20, 12, 18], { pad: 4 }).piece([[-4, -18], [4, -18], [4, -12], [10, -4], [10, 8], [6, 16], [-6, 16], [-10, 8], [-10, -4], [-4, -12]], '#eef0f2', { round: 3, paint: (g) => { g.strokeStyle = '#2a4a8a'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-9, 0); g.quadraticCurveTo(0, -8, 9, 0); g.stroke(); g.beginPath(); g.arc(0, 6, 3, 0, 7); g.stroke(); g.beginPath(); g.moveTo(-8, 10); g.lineTo(8, 10); g.stroke(); } }).finish({ shadowBlur: 2 }),
  sycee: mk('ic-sycee', [-16, -12, 16, 8], { pad: 4 }).piece([[-14, -8], [-8, -2], [8, -2], [14, -8], [12, 4], [-12, 4]], '#c8ccd0', { round: 3, paint: (g) => { g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(0, -2, 6, 3, 0, 0, 7); g.fill(); } }).finish({ shadowBlur: 2 }),
}));

// ------------------------------------------------------------ Mao's China ---
// Ge Hong's "Handbook of Prescriptions for Emergencies", fourth century: soak a handful of qinghao in water, wring out the juice.
fxGroup(['gehong'], (mk) => ({
  gehong: mk('gehong', [-70, -56, 70, 56], { pad: 6 }).piece([[-64, -50], [64, -50], [64, 50], [-64, 50]], '#e6d8b4', { round: 2, paint: (g) => {
    g.strokeStyle = 'rgba(120,90,50,.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -50); g.lineTo(0, 50); g.stroke();
    for (let c = 0; c < 10; c++) { const x = 54 - c * 11 - (c > 4 ? 6 : 0); for (let row = 0; row < 7; row++) { const y = -40 + row * 12, h = (x * 7 + row * 13) % 5; g.strokeStyle = 'rgba(30,24,20,.8)'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(x - 3, y); g.lineTo(x + 3, y + (h - 2) * 0.4); g.moveTo(x, y - 3); g.lineTo(x - (h % 2) * 2, y + 4); g.stroke(); } }
    g.fillStyle = 'rgba(178,40,32,.85)'; g.fillRect(-58, 34, 10, 10);
    // the plant drawn in the margin, and the one line that mattered, ringed
    g.strokeStyle = 'rgba(80,110,60,.85)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-30, 44); g.lineTo(-30, 10); for (let k = 0; k < 4; k++) { g.moveTo(-30, 38 - k * 8); g.lineTo(-38, 32 - k * 8); g.moveTo(-30, 38 - k * 8); g.lineTo(-22, 32 - k * 8); } g.stroke();
    g.strokeStyle = 'rgba(200,60,40,.8)'; g.lineWidth = 1.6; g.beginPath(); g.ellipse(32, -6, 7, 40, 0, 0, 7); g.stroke();
  } }).finish({ shadowBlur: 4 }),
}));

// ------------------------------------------------------------------ today ---
// Chang'e 4 on the far side of the Moon: a gold-foil lander and the little Yutu-2 rover; Chang'e 6's ascender.
fxGroup(['c4', 'yutu', 'ascender'], (mk) => ({
  c4: mk('c4', [-50, -80, 50, 6], { pad: 6 }).piece(strip(-24, -26, -40, 2, 2.6, 2.2), '#8c8a86', { round: 0.8 }).piece(strip(24, -26, 40, 2, 2.6, 2.2), '#8c8a86', { round: 0.8 })
    .piece([[-26, -16], [-28, -46], [28, -46], [26, -16]], '#c9a24a', { round: 2, paint: (g) => { g.strokeStyle = 'rgba(120,80,20,.5)'; g.lineWidth = 0.9; for (let i = 0; i < 12; i++) { g.beginPath(); g.moveTo(-26 + i * 4.6, -46); g.lineTo(-25 + i * 4.6 - (i % 3), -16); g.stroke(); } } })
    .piece([[-48, -50], [-28, -44], [-28, -36], [-48, -42]], '#2a3a6a', { round: 0.8, lift: 1, paint: (g) => { g.strokeStyle = 'rgba(160,190,230,.6)'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(-38, -48); g.lineTo(-38, -38); g.stroke(); } })
    .piece([[48, -50], [28, -44], [28, -36], [48, -42]], '#2a3a6a', { round: 0.8, lift: 1 })
    .piece(strip(10, -46, 14, -70, 1.4, 1), '#8c8a86', { round: 0.4, lift: 0.6 }).piece(ellipse(15, -72, 7, 3, 10), '#e8e6e0', { round: 0.8, lift: 0.8 }).finish({ shadowBlur: 4 }),
  yutu: mk('yutu', [-26, -40, 26, 8], { pad: 5 }).piece([[-18, -10], [18, -10], [16, -22], [-16, -22]], '#d8d0b8', { round: 2, paint: (g) => { g.fillStyle = 'rgba(200,170,90,.6)'; g.fillRect(-16, -22, 32, 4); } })
    .piece([[-26, -24], [-6, -24], [-8, -28], [-24, -28]], '#2a3a6a', { round: 0.6, lift: 1 }).piece([[6, -24], [26, -24], [24, -28], [8, -28]], '#2a3a6a', { round: 0.6, lift: 1 })
    .piece(strip(8, -22, 10, -36, 1.4, 1.2), '#8c8a86', { round: 0.4, lift: 0.6 }).piece(rect(6, -40, 16, -35), '#4a4a50', { round: 0.6, lift: 0.8 })
    .piece(ellipse(-14, -6, 4, 4, 8), '#5a5a5e', { round: 1, lift: 1 }).piece(ellipse(0, -6, 4, 4, 8), '#5a5a5e', { round: 1, lift: 1 }).piece(ellipse(14, -6, 4, 4, 8), '#5a5a5e', { round: 1, lift: 1 }).finish({ shadowBlur: 2 }),
  ascender: mk('ascender', [-16, -30, 16, 4], { pad: 4 }).piece([[-12, 2], [-12, -18], [-6, -26], [6, -26], [12, -18], [12, 2]], '#c9a24a', { round: 2 }).piece(rect(-14, -12, -10, -4), '#2a3a6a', { round: 0.5, lift: 0.6 }).piece(rect(10, -12, 14, -4), '#2a3a6a', { round: 0.5, lift: 0.6 }).finish({ shadowBlur: 2 }),
}));

// Tiangong, China's space station, seen from below: the two laboratory modules make the bar of a T
// with the core module as its stem, long solar wings at both ends, a cargo ship docked underneath.
fxGroup(['tiangong'], (mk) => {
  const sp = mk('tiangong', [-96, -74, 96, 84], { pad: 6 }), wing = (x0, x1, y0, y1) => sp.piece(rect(x0, y0, x1, y1), '#24345e', { round: 0.8, lift: 0.8, paint: (g) => { g.strokeStyle = 'rgba(150,180,225,.55)'; g.lineWidth = 0.6; for (let y = Math.min(y0, y1) + 4; y < Math.max(y0, y1); y += 4) { g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke(); } g.beginPath(); g.moveTo((x0 + x1) / 2, y0); g.lineTo((x0 + x1) / 2, y1); g.stroke(); } });
  for (const sx of [-1, 1]) { sp.piece(rect(sx * 84 - 1, -70, sx * 84 + 1, 70), '#8c8e94', { round: 0.3 }); wing(sx * 84 - 9, sx * 84 + 9, -70, -10); wing(sx * 84 - 9, sx * 84 + 9, 10, 70); }
  sp.piece([[-80, -7], [80, -7], [82, -4], [82, 4], [80, 7], [-80, 7], [-82, 4], [-82, -4]], '#dcd9d0', { round: 2, lift: 1.2, paint: (g) => { g.fillStyle = 'rgba(120,120,120,.35)'; for (const x of [-60, -40, -18, 18, 40, 60]) g.fillRect(x, -7, 2, 14); g.fillStyle = 'rgba(200,160,60,.6)'; g.fillRect(-30, -7, 10, 14); g.fillRect(20, -7, 10, 14); } });
  sp.piece(ellipse(0, 0, 11, 11, 14), '#cfccc2', { round: 2, lift: 1.6 });
  sp.piece([[-8, 8], [8, 8], [9, 48], [-9, 48]], '#dcd9d0', { round: 2, lift: 1.4, paint: (g) => { g.fillStyle = 'rgba(120,120,120,.35)'; for (const y of [18, 30, 40]) g.fillRect(-9, y, 18, 2); } });
  for (const sx of [-1, 1]) wing(sx * 10, sx * 38, 26, 32);
  sp.piece([[-7, 50], [7, 50], [7, 72], [0, 80], [-7, 72]], '#e8e4d8', { round: 2, lift: 1.2, paint: (g) => { g.fillStyle = 'rgba(200,40,40,.7)'; g.fillRect(-7, 58, 14, 3); } });
  return { tiangong: sp.finish({ shadowBlur: 4 }) };
});

// White paper puffs for steam and exhaust clouds (the smoke puffs, bleached)
fxGroup(['steam'], (mk) => {
  const r = rng(91);
  return { steam: [0, 1, 2, 3].map((v) => { const pts = []; for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2, rr = 17 + r() * 8; pts.push([Math.cos(a) * rr, Math.sin(a) * rr * 0.82]); }
    return mk('steam' + v, [-28, -26, 28, 26], { pad: 6 }).piece(pts, ['#f2f0ec', '#e6e3de', '#faf8f4', '#dcd8d2'][v], { round: 8, rough: 1.6, seg: 8, rim: 0.3, paint: (g) => { g.fillStyle = 'rgba(150,140,130,.18)'; g.beginPath(); g.ellipse(4, 8, 16, 9, 0, 0, 7); g.fill(); } }).finish({ shadowBlur: 3 }); }) };
});

// ------------------------------------------------------------ breakthroughs ---
fxGroup(['stopwatch', 'micius', 'qkey', 'qfridge', 'pandafarm'], (mk) => {
  const S = {};
  S.stopwatch = mk('stopwatch', [-56, -74, 56, 56], { pad: 6 }).piece(rect(-8, -62, 8, -52), '#8a8e96', { round: 2 }).piece(ellipse(0, -66, 10, 5, 10), '#9aa0a8', { round: 2, lift: 0.8 })
    .piece(ellipse(0, 0, 52, 52, 36), '#c8ccd2', { round: 6, lift: 1.4 }).piece(ellipse(0, 0, 45, 45, 36), '#f4f1e8', { round: 6, lift: 1, paint: (g) => { g.strokeStyle = 'rgba(30,30,34,.8)'; for (let k = 0; k < 60; k++) { const a = k * Math.PI / 30, r0 = k % 5 ? 40 : 35; g.lineWidth = k % 5 ? 0.8 : 2; g.beginPath(); g.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); g.lineTo(Math.cos(a) * 43, Math.sin(a) * 43); g.stroke(); } g.lineWidth = 1; g.beginPath(); g.arc(0, 16, 12, 0, 7); g.stroke(); for (let k = 0; k < 30; k += 5) { const a = k * Math.PI / 15 - Math.PI / 2; g.beginPath(); g.moveTo(Math.cos(a) * 9, 16 + Math.sin(a) * 9); g.lineTo(Math.cos(a) * 12, 16 + Math.sin(a) * 12); g.stroke(); } } }).finish({ shadowBlur: 4 });
  S.micius = mk('micius', [-80, -30, 80, 30], { pad: 6 }).piece(rect(-74, -10, -20, 10), '#2a3a6a', { round: 1, paint: (g) => { g.strokeStyle = 'rgba(160,190,230,.6)'; g.lineWidth = 0.7; for (let x = -70; x < -20; x += 6) { g.beginPath(); g.moveTo(x, -10); g.lineTo(x, 10); g.stroke(); } } }).piece(rect(20, -10, 74, 10), '#2a3a6a', { round: 1, paint: (g) => { g.strokeStyle = 'rgba(160,190,230,.6)'; g.lineWidth = 0.7; for (let x = 24; x < 74; x += 6) { g.beginPath(); g.moveTo(x, -10); g.lineTo(x, 10); g.stroke(); } } })
    .piece(rect(-20, -18, 20, 18), '#d8b04a', { round: 2, lift: 1.4, paint: (g) => { g.strokeStyle = 'rgba(140,100,30,.6)'; g.lineWidth = 0.8; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(-20, -14 + i * 6); g.lineTo(20, -12 + i * 6); g.stroke(); } } })
    .piece(rect(-10, 18, 10, 30), '#e8e6e0', { round: 2, lift: 1.4, paint: (g) => { g.fillStyle = '#1a1e26'; g.beginPath(); g.ellipse(0, 30, 8, 2.4, 0, 0, 7); g.fill(); } }).finish({ shadowBlur: 4 });
  S.qkey = mk('qkey', [-8, -14, 8, 14], { pad: 3 }).piece([[-5, -12], [5, -12], [5, -2], [2, -2], [2, 10], [5, 10], [5, 13], [-1, 13], [-1, -2], [-5, -2]], '#e8f8ff', { round: 1.5, thick: 0.4, paint: (g) => { g.fillStyle = 'rgba(40,80,120,.8)'; g.beginPath(); g.arc(0, -7, 2, 0, 7); g.fill(); } }).finish({ shadowBlur: 1.5 });
  // the quantum computer, a golden chandelier: a dilution refrigerator, each plate colder than the one above, the chip at the bottom
  const f = mk('qfridge', [-70, -6, 70, 250], { pad: 8 });
  const plates = [[0, 64], [56, 56], [104, 46], [146, 36], [184, 26], [216, 18]];
  for (let i = 0; i < plates.length - 1; i++) { const [y0, w0] = plates[i], [y1] = plates[i + 1]; for (const x of [-w0 * 0.7, -w0 * 0.25, w0 * 0.25, w0 * 0.7]) f.piece(strip(x * (i ? 0.8 : 0.8), y0 + 4, x * 0.6, y1, 2.4, 2), '#c9a24a', { round: 0.5, lift: 0.6 }); }
  for (let i = 0; i < 9; i++) { const x0 = -40 + i * 10; f.piece(strip(x0, 8, x0 * 0.2, 228, 1.2, 1.2), i % 3 ? '#b8bcc4' : '#6a8ab0', { round: 0.4, lift: 0.8, rough: 0.2 }); }
  plates.forEach(([y, w], i) => f.piece([[-w, y - 4], [w, y - 4], [w - 3, y + 4], [-w + 3, y + 4]], i % 2 ? '#e0b84a' : '#d8a838', { round: 2, lift: 1.4, paint: (g) => { g.fillStyle = 'rgba(255,240,180,.55)'; g.fillRect(-w + 4, y - 3, w * 2 - 8, 2); g.fillStyle = 'rgba(120,80,20,.35)'; for (let x = -w + 6; x < w - 4; x += 8) { g.beginPath(); g.arc(x, y + 1, 1, 0, 7); g.fill(); } } }));
  f.piece(rect(-10, 222, 10, 240), '#c9a24a', { round: 2, lift: 1.2, paint: (g) => { g.fillStyle = '#2a3a6a'; g.fillRect(-6, 230, 12, 8); } });
  S.qfridge = f.finish({ shadowBlur: 6 });
  // Datong's solar farm, seen from the air: thousands of panels laid out as a panda
  S.pandafarm = mk('pandafarm', [-76, -60, 76, 60], { pad: 6 }).piece(rect(-72, -56, 72, 56), '#c8b888', { round: 2, paint: (g) => {
    const cell = (x, y, c) => { g.fillStyle = c; g.fillRect(x, y, 4.2, 2.6); };
    for (let y = -50; y < 52; y += 3.4) for (let x = -66; x < 66; x += 5) {
      const dx = x / 40, dy = (y + 4) / 34, inHead = dx * dx + dy * dy < 1, ear = (Math.hypot(x + 30, y + 34) < 12) || (Math.hypot(x - 30, y + 34) < 12);
      const eye = (Math.hypot((x + 15) / 9, (y + 2) / 12) < 1) || (Math.hypot((x - 15) / 9, (y + 2) / 12) < 1), nose = Math.hypot(x / 6, (y - 14) / 4) < 1;
      if (ear || eye || nose) cell(x, y, '#1e2638'); else if (inHead) cell(x, y, '#9aa8bc'); else if (Math.abs(y) < 44) cell(x, y, '#3a4a6a');
    }
    g.fillStyle = '#f4f2ec'; for (const s of [-1, 1]) { g.beginPath(); g.arc(s * 15, -2, 2.6, 0, 7); g.fill(); }
  } }).finish({ shadowBlur: 4 });
  return S;
});
// The Beipan river canyon, painted in depth on one card: misty far walls, nearer walls, the river at the bottom.
// Its top edge follows the curve of the world, so it sits flush in the ground.
fxGroup(['gorge'], (mk) => {
  const r = rng(4400), W = 132, D = 290, top = (x) => (x * x) / 2000;
  const sh = mk('gorge', [-W - 6, -16, W + 6, D + 8], { pad: 8 });
  const rim = (x0, x1) => { const p = []; for (let i = 0; i <= 14; i++) { const x = x0 + (x1 - x0) * (i / 14); p.push([x, top(x) - 2 + (r() - 0.5) * 3]); } return p; };
  // the depth: dark at the bottom, a little lighter where the mist hangs
  sh.piece([...rim(-W, W), [W, D], [-W, D]], '#46545a', { round: 2, rough: 0.4, rim: 0, paint: (g) => { const gr = g.createLinearGradient(0, 0, 0, D); gr.addColorStop(0, '#8a9aa0'); gr.addColorStop(0.35, '#6a7a80'); gr.addColorStop(1, '#232c30'); g.fillStyle = gr; g.fillRect(-W - 6, -16, W * 2 + 12, D + 24); } });
  // three pairs of walls, far to near, closing in to a slot at the bottom
  const wall = (s, x0, x1, col, lift, light) => {
    const pts = [[s * (W + 2), top(W) - 2]]; for (let i = 0; i <= 18; i++) { const f = i / 18, y = f * D, x = s * (lerp(x0, x1, f ** 0.8) + Math.sin(i * 1.9 + s * 2) * 7 + (r() - 0.5) * 6); pts.push([x, y]); } pts.push([s * (W + 2), D]);
    sh.piece(pts, col, { round: 2.5, rough: 1.8, seg: 12, lift, paint: (g) => {
      for (let y = 6; y < D; y += 10 + r() * 9) { g.strokeStyle = `rgba(20,24,20,${0.25 + r() * 0.2})`; g.lineWidth = 1.4 + r() * 1.4; g.beginPath(); g.moveTo(s * (W + 2), y); g.lineTo(s * x1 * 0.8, y + (r() - 0.5) * 5); g.stroke(); }
      g.fillStyle = `rgba(255,255,240,${light})`; for (let i = 0; i < 18; i++) { const y = r() * D; g.fillRect(s > 0 ? x1 - 4 : -x1, y, 4, 6 + r() * 14); }
      dab(g, r, 30, s > 0 ? [x1, 0, W, D * 0.7] : [-W, 0, -x1, D * 0.7], ['rgba(60,100,56,.75)', 'rgba(90,130,70,.6)'], 6, 3);
    } });
  };
  for (const s of [-1, 1]) { wall(s, 70, 26, '#8c9890', 0.6, 0.18); wall(s, 98, 30, '#68746a', 1.4, 0.14); wall(s, 124, 40, '#4a544c', 2.2, 0.1); }
  // the river at the very bottom, a thread of green water
  sh.piece([[-24, D - 16], [24, D - 16], [20, D - 2], [-20, D - 2]], '#3f8a84', { round: 4, lift: 0.8, paint: (g) => { g.strokeStyle = 'rgba(230,250,245,.55)'; g.lineWidth = 1; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(-18 + k * 13, D - 10); g.lineTo(-12 + k * 13, D - 9); g.stroke(); } } });
  return { gorge: sh.finish({ shadowBlur: 0 }) };
});
const dab = (g, r, n, box, cols, len = 6, w = 2) => { g.lineCap = 'round'; for (let i = 0; i < n; i++) { const x = box[0] + r() * (box[2] - box[0]), y = box[1] + r() * (box[3] - box[1]), a = (r() - 0.5) * 1.2; g.strokeStyle = cols[(r() * cols.length) | 0]; g.lineWidth = w * (0.6 + r() * 0.8); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * len * (0.5 + r()), y + Math.sin(a) * len * 0.4); g.stroke(); } };
