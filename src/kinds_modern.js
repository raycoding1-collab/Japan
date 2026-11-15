// The modern centuries: Renaissance to today.
import { put, ellipse, strip, KRAFT, KRAFT_EDGE } from './paper.js';
import { KINDS } from './cutouts.js';
import { drawPerson } from './people.js';
import { rng, fbm, DEG, hash, shade, mix, rgb, clamp, smooth, sramp, spring, lerp } from './util.js';

const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
const dark = '#2b1f18';
const pop = (t, t0) => clamp(spring(t - t0, 9, 0.45), 0, 1.35);
// a strip of raw board along a cut edge, its corrugations showing
const cutEdge = (x0, y0, x1, y1) => (g) => { g.fillStyle = KRAFT; g.fillRect(x0, y0, x1 - x0, y1 - y0); g.strokeStyle = 'rgba(120,85,50,.55)'; g.lineWidth = 0.9; g.beginPath(); for (let x = x0; x < x1; x += 3) { g.moveTo(x, y0 + 1); g.quadraticCurveTo(x + 1.5, (y0 + y1) / 2 - 2, x + 3, y1 - 1); } g.stroke(); };

// ------------------------------------------------------------ Renaissance ---
// The painter's canvas: perspective lines draw themselves, then the picture springs out into depth.
KINDS.easel = {
  bake(mk) {
    const P = {};
    P.stand = mk('easel', [-40, -170, 40, 6]).piece([[-30, 4], [-6, -166], [0, -166], [-24, 4]], '#7a5a3e', { round: 1 }).piece([[30, 4], [6, -166], [0, -166], [24, 4]], '#6a4a32', { round: 1 }).piece(rect(-38, -52, 38, -46), '#7a5a3e', { round: 1, lift: 1 }).finish({ shadowBlur: 3 });
    P.canvas = mk('canvas', [-46, -64, 46, 4]).piece(rect(-44, 0, 44, -62), '#efe6d0', { round: 1, rim: 0.5 }).finish({ shadowBlur: 4 });
    // the picture, in three layers of card: far hills, a colonnade, a near arch
    P.back = mk('pic-back', [-42, -60, 42, 0], { pad: 4 }).piece(rect(-41, -2, 41, -59), '#9cc0d8', { round: 0.5, rim: 0.2, paint: (g) => { g.fillStyle = '#e8d8b0'; g.fillRect(-41, -24, 82, 22); g.fillStyle = '#8a9a6a'; g.beginPath(); g.moveTo(-41, -24); g.quadraticCurveTo(-20, -36, 0, -28); g.quadraticCurveTo(20, -38, 41, -26); g.lineTo(41, -24); g.fill(); g.strokeStyle = 'rgba(120,90,60,.5)'; g.lineWidth = 0.6; for (let k = -6; k <= 6; k++) { g.beginPath(); g.moveTo(0, -24); g.lineTo(k * 14, -2); g.stroke(); } for (let y = -20; y < -2; y += 4) { g.beginPath(); g.moveTo(-41, y); g.lineTo(41, y); g.stroke(); } } }).finish({ shadowBlur: 3 });
    const mid = mk('pic-mid', [-42, -60, 42, 0], { pad: 4 });
    for (const [x, s] of [[-26, 0.55], [-14, 0.7], [14, 0.7], [26, 0.55]]) mid.piece([[x - 6 * s, -2], [x - 6 * s, -40 * s - 4], [x - 3 * s, -46 * s - 4], [x + 3 * s, -46 * s - 4], [x + 6 * s, -40 * s - 4], [x + 6 * s, -2]], '#e6d6b8', { round: 1, lift: 0.8, thick: 0.6 });
    P.mid = mid.finish({ shadowBlur: 3 });
    P.front = mk('pic-front', [-46, -64, 46, 2], { pad: 4 }).piece([[-44, 0], [-44, -62], [44, -62], [44, 0], [30, 0], [30, -34], [24, -46], [12, -52], [0, -54], [-12, -52], [-24, -46], [-30, -34], [-30, 0]], '#c9a27a', { round: 1.5, rim: 0.5, paint: (g) => { g.fillStyle = 'rgba(120,80,40,.25)'; g.fillRect(-44, -62, 88, 6); } }).finish({ shadowBlur: 4 });
    return P;
  },
  draw(g, P, t, e, env) {
    put(g, P.stand, env.sh);
    g.save(); g.translate(0, -50);
    const depth = pop(t, e.depthAt), lines = sramp(t, e.linesAt, e.linesAt + 3.2), paint = sramp(t, e.linesAt + 2.2, e.linesAt + 4.2);
    put(g, P.canvas, depth > 0.02 ? 0 : env.sh);
    // pencil perspective, drawn from the vanishing point
    if (lines > 0 && depth < 0.98) {
      g.save(); g.globalAlpha *= (1 - depth); g.strokeStyle = 'rgba(70,50,35,.7)'; g.lineWidth = 0.7;
      for (let k = -6; k <= 6; k++) { const f = clamp(lines * 1.6 - Math.abs(k) * 0.08); g.beginPath(); g.moveTo(0, -36); g.lineTo(k * 14 * f, -36 + 34 * f); g.stroke(); }
      for (let y = 0; y < 5; y++) { const f = clamp(lines * 2 - 0.6 - y * 0.12); if (f <= 0) continue; const yy = -30 + y * y * 1.4 + y * 2; g.beginPath(); g.moveTo(-40 * f, yy); g.lineTo(40 * f, yy); g.stroke(); }
      g.restore();
    }
    // the picture, flat at first; then each layer stands up out of the canvas
    if (paint > 0) {
      g.save(); g.globalAlpha *= paint;
      const lay = (spr, d, sh) => { g.save(); g.translate(0, -depth * d * 28); g.scale(1 + depth * d * 0.25, 1 + depth * d * 0.25); put(g, spr, sh * depth, 3 + d * 3, 4 + d * 3); g.restore(); };
      lay(P.back, 0, 0); lay(P.mid, 0.6, 0.5); lay(P.front, 1.2, 0.6);
      g.restore();
    }
    g.restore();
  },
};
KINDS.duomo = {
  bake(mk) {
    const sh = mk('duomo', [-160, -400, 160, 6]), marble = '#ece4d2', green = '#6f8a6a', pink = '#d8a898';
    const stripes = (x0, x1, y0, y1) => (g) => { g.fillStyle = green; for (let x = x0 + 8; x < x1; x += 22) g.fillRect(x, y1, 4, y0 - y1); g.fillStyle = pink; for (let x = x0 + 17; x < x1; x += 44) g.fillRect(x, y1 + 8, 6, 10); g.fillStyle = 'rgba(80,90,70,.5)'; g.fillRect(x0, y1, x1 - x0, 3); };
    sh.piece(rect(-150, 4, 150, -110), marble, { round: 2, paint: stripes(-150, 150, 4, -110) });
    sh.piece(rect(-150, -110, -40, -150), marble, { round: 2, lift: 1.4, paint: stripes(-150, -40, -110, -150) });
    sh.piece([[-70, -110], [-66, -190], [66, -190], [70, -110]], marble, { round: 2, lift: 1.8, paint: (g) => { g.fillStyle = green; for (let x = -60; x < 66; x += 26) g.fillRect(x, -186, 5, 72); g.fillStyle = dark; for (const x of [-46, -14, 18, 50]) { g.beginPath(); g.arc(x, -160, 7, 0, 7); g.fill(); } } });
    const dome = []; for (let i = 0; i <= 20; i++) { const a = Math.PI + (i / 20) * Math.PI, k = Math.sin(i / 20 * Math.PI); dome.push([Math.cos(a) * 74, -190 + Math.sin(a) * 140 * (0.82 + 0.18 * k)]); }
    sh.piece(dome, '#c0663e', { round: 3, lift: 2.4, paint: (g) => { g.strokeStyle = '#f2ece0'; g.lineWidth = 4; for (const x of [-46, 0, 46]) { g.beginPath(); g.moveTo(x * 1.55, -190); g.quadraticCurveTo(x * 1.1, -290, x * 0.18, -324); g.stroke(); } g.strokeStyle = 'rgba(90,40,20,.35)'; g.lineWidth = 1; for (let y = -200; y > -320; y -= 8) { g.beginPath(); g.moveTo(-80, y); g.lineTo(80, y); g.stroke(); } } });
    sh.piece([[-12, -322], [-14, -350], [-6, -362], [0, -380], [6, -362], [14, -350], [12, -322]], marble, { round: 2, lift: 2 });
    sh.piece(ellipse(0, -386, 5, 5, 8), '#c9a24a', { round: 1, lift: 1 });
    return { spr: sh.finish({ shadowBlur: 8 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 5, 6); },
};
KINDS.campanile = {
  bake(mk) { const sh = mk('campanile', [-34, -330, 34, 6]); sh.piece(rect(-28, 4, 28, -300), '#ece4d2', { round: 2, paint: (g) => { for (let y = -10; y > -300; y -= 50) { g.fillStyle = '#6f8a6a'; g.fillRect(-28, y - 4, 56, 4); g.fillStyle = '#d8a898'; g.fillRect(-28, y - 20, 56, 6); } g.fillStyle = dark; for (const y of [-120, -180, -250]) { g.beginPath(); g.moveTo(-8, y); g.lineTo(-8, y - 26); g.quadraticCurveTo(0, y - 34, 8, y - 26); g.lineTo(8, y); g.fill(); } } }); sh.piece(rect(-32, -300, 32, -312), '#ece4d2', { round: 1, lift: 1.2 }); return { spr: sh.finish({ shadowBlur: 6 }) }; },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 4, 5); },
};
KINDS.cypress = {
  bake(mk, v = 0) { const h = 150 + v * 30; return { spr: mk('cypress' + v, [-22, -h - 8, 22, 6]).piece(strip(0, 4, 0, -14, 6, 5), '#4a3626', { round: 1 }).piece([[-14, -10], [-18, -h * 0.4], [-10, -h * 0.8], [0, -h], [10, -h * 0.8], [18, -h * 0.4], [14, -10]], ['#2f4a34', '#355238'][v % 2], { round: 6, rough: 1.6, paint: (g) => { g.strokeStyle = 'rgba(120,160,110,.3)'; g.lineWidth = 1.6; for (let y = -20; y > -h; y -= 9) { g.beginPath(); g.moveTo(-10, y); g.lineTo(8, y - 6); g.stroke(); } } }).finish() }; },
  draw(g, P, t, e, env) { g.rotate(fbm(t * 0.4 + e.a, 3) * 1.2 * DEG); put(g, P.spr, env.sh); },
};

// ------------------------------------------------- cut-away buildings ---
// Paper dollhouses: the front wall cut away so we can see the rooms, the board's cut edges showing.
const FURN = {
  bed: (s, x, y) => s.piece(rect(x - 30, y, x + 22, y - 14), '#7a4a3a', { round: 2, lift: 1 }).piece(rect(x - 30, y - 14, x - 24, y - 30), '#5a3a2a', { round: 1, lift: 1 }).piece(rect(x - 22, y - 14, x + 20, y - 18), '#e8e0d0', { round: 2, lift: 0.6 }),
  table: (s, x, y) => s.piece(rect(x - 18, y - 22, x + 18, y - 26), '#6a4a32', { round: 1, lift: 1 }).piece(rect(x - 2, y, x + 2, y - 22), '#5a3a26', { round: 0.5, lift: 1 }).piece(rect(x - 30, y, x - 26, y - 34), '#5a3a26', { round: 0.5, lift: 1 }).piece(rect(x - 30, y - 16, x - 20, y - 18), '#5a3a26', { round: 0.5, lift: 1 }),
  shelf: (s, x, y) => s.piece(rect(x - 16, y, x + 16, y - 64), '#5a3a26', { round: 1, lift: 1, paint: (g) => { const c = ['#8a3a2a', '#3a5a7a', '#c9a24a', '#4a6a3a']; for (let r = 0; r < 4; r++) for (let k = 0; k < 6; k++) { g.fillStyle = c[(r + k) % 4]; g.fillRect(x - 13 + k * 4.6, y - 14 - r * 15, 3.4, 11); } } }),
  piano: (s, x, y) => s.piece(rect(x - 24, y, x + 24, y - 40), '#2a2220', { round: 2, lift: 1, paint: (g) => { g.fillStyle = '#efe8d8'; g.fillRect(x - 22, y - 24, 44, 4); } }),
  sofa: (s, x, y) => s.piece([[x - 34, y], [x - 34, y - 26], [x - 28, y - 30], [x + 28, y - 30], [x + 34, y - 26], [x + 34, y]], '#6a7a5a', { round: 4, lift: 1 }),
  radio: (s, x, y) => s.piece([[x - 14, y], [x - 14, y - 34], [x - 10, y - 42], [x + 10, y - 42], [x + 14, y - 34], [x + 14, y]], '#6a4a32', { round: 4, lift: 1, paint: (g) => { g.fillStyle = 'rgba(40,30,20,.7)'; g.fillRect(x - 9, y - 30, 18, 12); g.fillStyle = '#d8c89a'; g.beginPath(); g.arc(x, y - 10, 4, 0, 7); g.fill(); } }),
  counter: (s, x, y) => s.piece(rect(x - 40, y, x + 40, y - 30), '#6a4a32', { round: 1, lift: 1, paint: (g) => { g.fillStyle = '#c9b089'; g.fillRect(x - 40, y - 30, 80, 4); } }).piece(rect(x - 36, y - 44, x + 36, y - 70), '#5a3a26', { round: 1, lift: 1, paint: (g) => { const c = ['#efe6d0', '#c9a24a', '#8a5a3a']; for (let k = 0; k < 10; k++) { g.fillStyle = c[k % 3]; g.beginPath(); g.ellipse(x - 30 + k * 6.6, y - 54, 2.6, 5, 0, 0, 7); g.fill(); } } }),
  stove: (s, x, y) => s.piece(rect(x - 14, y, x + 14, y - 30), '#3a3638', { round: 2, lift: 1 }).piece(rect(x - 3, y - 30, x + 3, y - 80), '#3a3638', { round: 0.5, lift: 1 }),
  books: (s, x, y) => FURN.shelf(s, x, y),
  frame: (s, x, y) => s.piece(rect(x - 12, y - 50, x + 12, y - 70), '#c9a24a', { round: 1, lift: 0.8, paint: (g) => { g.fillStyle = '#8aa0b0'; g.fillRect(x - 9, y - 67, 18, 14); } }),
};
const PAPERS = ['#d8c49a', '#b9c8b0', '#c9a8a0', '#a8b8c8', '#d8b88a', '#c0b0c8'];
const CUT = {
  home: { w: 180, floors: 2, cols: 2, fh: 120, wall: '#8a5a44', roof: 'pitched', rooms: [['bed', 'frame'], ['table'], ['shelf', 'frame'], ['sofa']] },
  home2: { w: 150, floors: 2, cols: 1, fh: 120, wall: '#7a6a5a', roof: 'flat', rooms: [['piano', 'frame'], ['bed']] },
  home3: { w: 190, floors: 3, cols: 2, fh: 105, wall: '#6a5048', roof: 'flat', rooms: [['stove'], ['table'], ['bed'], ['shelf'], ['sofa', 'frame'], ['bed']] },
  coffee: { w: 250, floors: 2, cols: 1, fh: 135, wall: '#8a6a4a', roof: 'pitched', rooms: [['counter'], ['books', 'frame']] },
  radio: { w: 200, floors: 1, cols: 1, fh: 140, wall: '#7a5a48', roof: 'pitched', rooms: [['radio', 'frame', 'sofa']] },
};
KINDS.cutaway = {
  bake(mk, v = 'home') {
    const C = CUT[v], r = rng(hash(v.length * 7) * 1e6), wt = 10, sl = 9, rw = (C.w - wt * 2 - (C.cols - 1) * 6) / C.cols, H = C.floors * C.fh;
    const sh = mk('cut-' + v, [-C.w / 2 - 14, -H - 90, C.w / 2 + 14, 6]);
    const rooms = [];
    for (let f = 0; f < C.floors; f++) for (let c = 0; c < C.cols; c++) {
      const x0 = -C.w / 2 + wt + c * (rw + 6), y1 = -f * C.fh - sl, y0 = y1 - C.fh + sl, i = f * C.cols + c, pc = PAPERS[(i * 3 + v.length) % PAPERS.length];
      sh.piece(rect(x0, y1, x0 + rw, y0), pc, { round: 0.8, lift: 0, thick: 0, rim: 0.2, paint: (g) => { g.fillStyle = rgb(shade(pc, -0.12), 0.5); if (i % 2) for (let x = x0 + 6; x < x0 + rw; x += 10) g.fillRect(x, y0, 3, y1 - y0); else for (let x = x0 + 8; x < x0 + rw; x += 14) for (let y = y0 + 8; y < y1; y += 14) { g.beginPath(); g.arc(x, y, 1.6, 0, 7); g.fill(); } g.fillStyle = 'rgba(60,40,25,.25)'; g.fillRect(x0, y1 - 6, rw, 6); } });
      for (const name of C.rooms[i] || []) FURN[name](sh, x0 + rw * (name === 'frame' ? 0.72 : 0.42), y1);
      // the bulb on its cord
      sh.piece(rect(x0 + rw / 2 - 0.5, y0, x0 + rw / 2 + 0.5, y0 + 26), '#2a2420', { round: 0, lift: 0.4, thick: 0, rim: 0 });
      sh.piece(ellipse(x0 + rw / 2, y0 + 30, 4.5, 5.5, 10), '#e8e2d0', { round: 1.5, lift: 0.8, thick: 0.5 });
      rooms.push([x0, y0, rw, y1 - y0, x0 + rw / 2, y0 + 30]);
    }
    // the structure, its cut edges raw
    for (const x of [-C.w / 2, C.w / 2 - wt]) sh.piece(rect(x, 4, x + wt, -H), C.wall, { round: 1, lift: 2.4, paint: cutEdge(x + 2, -H, x + wt - 2, 4) });
    for (let f = 0; f <= C.floors; f++) { const y = -f * C.fh; sh.piece(rect(-C.w / 2, y - sl + (f === 0 ? sl : 0), C.w / 2, y + (f === 0 ? 4 : 0)), shade(C.wall, -0.1), { round: 1, lift: 2.4, paint: cutEdge(-C.w / 2, y - sl + 2, C.w / 2, y - 2) }); }
    if (C.roof === 'pitched') sh.piece([[-C.w / 2 - 12, -H], [0, -H - 80], [C.w / 2 + 12, -H]], '#5a4a44', { round: 2, lift: 2.6, paint: (g) => { g.strokeStyle = 'rgba(30,20,15,.35)'; g.lineWidth = 1; for (let y = -H - 6; y > -H - 76; y -= 7) { g.beginPath(); g.moveTo(-C.w / 2, y); g.lineTo(C.w / 2, y); g.stroke(); } } });
    else sh.piece(rect(-C.w / 2 - 6, -H, C.w / 2 + 6, -H - 10), '#4a4446', { round: 1, lift: 2.6 }).piece(rect(C.w / 2 - 40, -H - 10, C.w / 2 - 26, -H - 40), shade(C.wall, -0.05), { round: 1, lift: 2 });
    return { spr: sh.finish({ shadowBlur: 6 }), rooms, roofTop: -H - (C.roof === 'pitched' ? 80 : 10) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 4, 5); },
  glow(g, P, t, e, env, p) {
    if (!e.roomOn || p < 0.6) return;
    g.globalCompositeOperation = 'lighter';
    P.rooms.forEach(([x, y, w, h, bx, by], i) => {
      const k = e.roomOn(t, i); if (k < 0.01) return;
      const c = e.roomCol || [255, 196, 120];
      const fill = g.createRadialGradient(bx, by, 4, bx, by, Math.max(w, h) * 0.9);
      fill.addColorStop(0, rgb(c, 0.5 * k)); fill.addColorStop(1, rgb(c, 0.16 * k));
      g.fillStyle = fill; g.fillRect(x, y, w, h);
      const b = g.createRadialGradient(bx, by, 0, bx, by, 26); b.addColorStop(0, `rgba(255,248,220,${k})`); b.addColorStop(0.3, rgb(c, 0.6 * k)); b.addColorStop(1, rgb(c, 0));
      g.fillStyle = b; g.fillRect(bx - 26, by - 26, 52, 52);
    });
    if (e.radioOn) { const k = e.radioOn(t); if (k > 0.01) { const [x, y, w, h] = P.rooms[0], rx = x + w * 0.42, ry = y + h - 30; const gr = g.createRadialGradient(rx, ry, 0, rx, ry, 30); gr.addColorStop(0, `rgba(255,220,140,${0.8 * k})`); gr.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = gr; g.fillRect(rx - 30, ry - 30, 60, 60); } }
    g.globalCompositeOperation = 'source-over';
  },
};
// A picture house, its marquee bulbs chasing round.
KINDS.cinema = {
  bake(mk) {
    const sh = mk('cinema', [-110, -230, 110, 6]), bulbs = [];
    sh.piece(rect(-100, 4, 100, -200), '#7a3a34', { round: 2, paint: (g) => { g.fillStyle = dark; g.fillRect(-30, -60, 60, 64); g.fillStyle = '#efe0b8'; for (const x of [-82, 52]) g.fillRect(x, -110, 30, 44); g.fillStyle = 'rgba(30,20,20,.6)'; for (const x of [-78, 56]) g.fillRect(x, -104, 22, 32); } });
    sh.piece([[-110, -120], [110, -120], [104, -150], [-104, -150]], '#2a2a30', { round: 2, lift: 2.4, paint: (g) => { g.fillStyle = '#efe6cc'; g.fillRect(-90, -144, 180, 18); g.fillStyle = 'rgba(60,40,30,.8)'; for (let k = 0; k < 9; k++) g.fillRect(-80 + k * 18, -140, 10, 10); } });
    sh.piece([[-60, -200], [-60, -228], [60, -228], [60, -200]], '#c9a24a', { round: 3, lift: 2 });
    for (let x = -104; x <= 104; x += 13) { bulbs.push([x, -152]); bulbs.push([x, -118]); }
    for (let x = -56; x <= 56; x += 14) bulbs.push([x, -226]);
    for (const [x, y] of bulbs) sh.piece(ellipse(x, y, 2.6, 2.6, 6), '#e8e0c8', { round: 1, lift: 0.6, thick: 0.4 });
    return { spr: sh.finish({ shadowBlur: 6 }), bulbs };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 4, 5); },
  glow(g, P, t, e, env, p) {
    const k = e.on ? e.on(t) : 0; if (k < 0.01 || p < 0.6) return;
    g.globalCompositeOperation = 'lighter';
    const step = Math.floor(t * 7);
    P.bulbs.forEach(([x, y], i) => { const b = ((i + step) % 3 === 0 ? 1 : 0.45) * k; const gr = g.createRadialGradient(x, y, 0, x, y, 9); gr.addColorStop(0, `rgba(255,236,170,${b})`); gr.addColorStop(1, 'rgba(255,200,110,0)'); g.fillStyle = gr; g.fillRect(x - 9, y - 9, 18, 18); });
    g.fillStyle = `rgba(255,220,150,${0.25 * k})`; g.fillRect(-90, -144, 180, 18);
    g.globalCompositeOperation = 'source-over';
  },
};

// ---------------------------------------------------------- Enlightenment ---
KINDS.flagpole = {
  bake(mk, v = 'us') {
    const P = {};
    P.pole = mk('fpole', [-4, -230, 5, 6]).piece(strip(0.5, 4, 0, -226, 4, 2.6), '#8a8478', { round: 1 }).piece(ellipse(0, -228, 3.5, 3.5, 8), '#c9a24a', { round: 1, lift: 1 }).finish({ shadowBlur: 3 });
    const f = mk('flag-' + v, [0, -2, 76, 50], { pad: 4 });
    if (v === 'us') f.piece(rect(0, 0, 72, 46), '#efe8dc', { round: 0.8, rough: 0.3, paint: (g) => { g.fillStyle = '#b23a34'; for (let k = 0; k < 7; k++) g.fillRect(0, k * 6.6, 72, 3.3); g.fillStyle = '#2c3d6e'; g.fillRect(0, 0, 30, 23); g.fillStyle = '#efe8dc'; for (let y = 3; y < 22; y += 5) for (let x = 3; x < 29; x += 5) { g.beginPath(); g.arc(x + (y % 2), y, 0.9, 0, 7); g.fill(); } } });
    else if (v === 'fr') f.piece(rect(0, 0, 72, 46), '#efe8dc', { round: 0.8, rough: 0.3, paint: (g) => { g.fillStyle = '#2c4a8a'; g.fillRect(0, 0, 24, 46); g.fillStyle = '#c23a34'; g.fillRect(48, 0, 24, 46); } });
    else f.piece(rect(0, 0, 72, 46), '#1e3f8a', { round: 0.8, rough: 0.3, paint: (g) => { g.fillStyle = '#c8282e'; g.fillRect(0, 23, 72, 23); } });
    P.flag = f.finish({ shadowBlur: 3 });
    return P;
  },
  draw(g, P, t, e, env) {
    put(g, P.pole, env.sh);
    const k = e.raise ? e.raise(t) : 1;
    g.save(); g.translate(2, lerp(-56, -220, k));
    const n = 8, w = P.flag.w;
    for (let i = 0; i < n; i++) {
      const x0 = P.flag.x + (w / n) * i, dy = Math.sin(t * 4 - i * 0.7 + e.a) * 2.2 * (i / n) * k;
      g.drawImage(P.flag.img, (P.flag.img.width / n) * i, 0, P.flag.img.width / n + 1, P.flag.img.height, x0, P.flag.y + dy, w / n + 0.5, P.flag.h);
    }
    g.restore();
  },
};
// A throne, and a crown hanging on a thread above it, until the thread goes.
KINDS.throne = {
  bake(mk) {
    const P = {};
    P.seat = mk('throne', [-40, -150, 40, 6]).piece([[-30, 4], [-30, -50], [-26, -130], [-14, -146], [14, -146], [26, -130], [30, -50], [30, 4], [22, 4], [22, -40], [-22, -40], [-22, 4]], '#8a2a2e', { round: 3, paint: (g) => { g.fillStyle = 'rgba(220,180,80,.8)'; g.fillRect(-26, -54, 52, 6); g.fillRect(-4, -140, 8, 80); } }).piece(rect(-34, -40, 34, -50), '#c9a24a', { round: 1, lift: 1.4 }).finish({ shadowBlur: 4 });
    P.crown = mk('crown', [-26, -30, 26, 4], { pad: 4 }).piece([[-22, 0], [-24, -24], [-12, -10], [0, -28], [12, -10], [24, -24], [22, 0]], '#d9a83a', { round: 1.5, paint: (g) => { g.fillStyle = '#b8282e'; g.beginPath(); g.arc(0, -8, 3.4, 0, 7); g.fill(); g.fillStyle = '#2c4a8a'; g.beginPath(); g.arc(-12, -6, 2.4, 0, 7); g.arc(12, -6, 2.4, 0, 7); g.fill(); } }).finish({ shadowBlur: 3 });
    return P;
  },
  draw(g, P, t, e, env) {
    put(g, P.seat, env.sh, 3, 4);
    const d = t - e.fallAt;
    if (d < 0) {
      const sw = Math.sin(t * 0.9) * 2;
      g.strokeStyle = 'rgba(200,190,175,.6)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(sw, -2400); g.lineTo(sw, -214); g.stroke();
      g.save(); g.translate(sw, -186); g.rotate(sw * 0.01); put(g, P.crown, env.sh * 0.5); g.restore();
    } else {
      // it falls, hits the seat, bounces off and comes to rest on its side on the ground
      const y = d < 0.42 ? lerp(-186, -50, (d / 0.42) ** 2) : d < 0.9 ? -50 - Math.sin(((d - 0.42) / 0.48) * Math.PI) * 30 + ((d - 0.42) / 0.48) * 50 : lerp(0, 0, 1);
      const x = d < 0.42 ? 0 : Math.min(1, (d - 0.42) / 0.5) * 46;
      const rot = d < 0.42 ? 0 : Math.min(1, (d - 0.42) / 0.5) * 1.9;
      g.save(); g.translate(x, d < 0.9 ? y : 0); g.rotate(rot); put(g, P.crown, env.sh); g.restore();
    }
  },
};

// --------------------------------------------------------------- the 1800s ---
KINDS.camera = {
  bake(mk) {
    return { spr: mk('camera', [-30, -120, 30, 6]).piece([[-22, 4], [-2, -76], [2, -76], [22, 4]], '#5b4331', { round: 1 }).piece(rect(-2, 4, 2, -76), '#5b4331', { round: 0.5 }).piece(rect(-20, -76, 18, -108), '#4a3020', { round: 2, lift: 1.4, paint: (g) => { g.fillStyle = '#c9a24a'; g.fillRect(-20, -78, 38, 3); } }).piece(rect(18, -100, 30, -84), '#2a2220', { round: 1.5, lift: 1.4 }).piece([[-20, -106], [-34, -96], [-30, -70], [-20, -78]], '#1e1c1c', { round: 3, lift: 1 }).finish({ shadowBlur: 3 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh); },
  glow(g, P, t, e, env, p) {
    const f = Math.exp(-(((t - e.flashAt) / 0.09) ** 2)); if (f < 0.01 || p < 0.6) return;
    g.globalCompositeOperation = 'lighter';
    const gr = g.createRadialGradient(-30, -130, 0, -30, -130, 240); gr.addColorStop(0, `rgba(255,255,245,${f})`); gr.addColorStop(0.15, `rgba(255,250,230,${0.6 * f})`); gr.addColorStop(1, 'rgba(255,250,230,0)');
    g.fillStyle = gr; g.fillRect(-270, -370, 480, 480); g.globalCompositeOperation = 'source-over';
  },
};
// The portrait, pinned up a moment later: the family, held still for ever.
KINDS.photo = {
  bake(mk) {
    return {
      spr: mk('photo', [-34, -110, 34, 6]).piece(strip(0, 4, 0, -60, 3, 3), '#5b4331', { round: 1 }).piece(rect(-30, -60, 30, -106), '#4a3020', { round: 1.5, lift: 1.4 }).piece(rect(-25, -65, 25, -101), '#c9b08a', { round: 0.6, lift: 0.8, paint: (g) => { g.fillStyle = '#6a5038'; for (const [x, h] of [[-12, 26], [0, 30], [12, 20]]) { g.beginPath(); g.arc(x, -96 + (30 - h), 4, 0, 7); g.fill(); g.fillRect(x - 5, -92 + (30 - h), 10, h - 6); } g.fillStyle = 'rgba(255,240,210,.25)'; g.fillRect(-25, -101, 50, 10); } }).finish({ shadowBlur: 4 }),
    };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh); },
};
KINDS.school = {
  bake(mk) {
    const sh = mk('school', [-120, -230, 120, 6]), c = '#a8664a', win = [];
    for (const x of [-96, -60, 34, 70]) for (const y of [-120, -60]) win.push([x, y, 22, 34]);
    sh.piece(rect(-110, 4, 110, -160), c, { round: 2, paint: (g) => { g.fillStyle = 'rgba(40,30,25,.8)'; for (const [x, y, w, h] of win) g.fillRect(x, y, w, h); g.fillStyle = dark; g.beginPath(); g.moveTo(-18, 4); g.lineTo(-18, -50); g.quadraticCurveTo(0, -66, 18, -50); g.lineTo(18, 4); g.fill(); } });
    sh.piece([[-118, -158], [0, -206], [118, -158]], '#5a5050', { round: 2, lift: 1.6 });
    sh.piece(rect(-10, -206, 10, -228), '#e8e0d0', { round: 1, lift: 1.2 });
    sh.piece(ellipse(0, -186, 9, 9, 12), '#efe8d8', { round: 2, lift: 1.4, paint: (g) => { g.strokeStyle = '#2a2420'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, -186); g.lineTo(0, -192); g.moveTo(0, -186); g.lineTo(5, -186); g.stroke(); } });
    return { spr: sh.finish({ shadowBlur: 6 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 4, 5); },
};
KINDS.hoop = {
  bake(mk) { return { spr: mk('hoop', [-24, -24, 24, 24], { pad: 4 }).piece([...ellipse(0, 0, 20, 20, 20), ...ellipse(0, 0, 16.5, 16.5, 20).reverse()], '#8a5a34', { round: 1, rough: 0.3 }).finish({ shadowBlur: 2 }) }; },
  draw(g, P, t, e, env) { const d = e.move ? e.move(t) * DEG * 1000 : 0; g.translate(0, -20); g.rotate(d / 20); put(g, P.spr, env.sh); },
};

// ------------------------------------------------------- twentieth century ---
// The Flyer: two wings, two propellers turning, a short wobbling hop.
KINDS.flyer = {
  bake(mk) {
    const P = {};
    P.body = mk('flyer', [-90, -70, 90, 6])
      .piece(rect(-80, -52, 80, -46), '#e8dcc0', { round: 2, rim: 0.4 }).piece(rect(-80, -20, 80, -14), '#e8dcc0', { round: 2, lift: 1.4, rim: 0.4 })
      .piece(rect(-60, -46, -58, -20), '#5b4331', { round: 0.4, lift: 1 }).piece(rect(-20, -46, -18, -20), '#5b4331', { round: 0.4, lift: 1 }).piece(rect(20, -46, 22, -20), '#5b4331', { round: 0.4, lift: 1 }).piece(rect(60, -46, 62, -20), '#5b4331', { round: 0.4, lift: 1 })
      .piece(rect(80, -40, 104, -36), '#e8dcc0', { round: 1, lift: 1 }).piece(rect(-104, -44, -86, -24), '#e8dcc0', { round: 1, lift: 1 })
      .piece(rect(-30, -14, 30, -6), '#5b4331', { round: 1, lift: 1 }).piece(rect(-4, -26, 14, -18), '#3a3436', { round: 2, lift: 1.2 })
      .finish({ shadowBlur: 4 });
    P.pilot = mk('pilot', [-10, -14, 14, 4], { pad: 4 }).piece([[-8, 2], [10, 2], [12, -4], [-6, -6]], '#3a3a40', { round: 2 }).piece(ellipse(10, -8, 4, 4, 8), '#c69a74', { round: 1.5, lift: 0.8 }).finish({ shadowBlur: 2 });
    P.prop = mk('prop', [-3, -16, 3, 16], { pad: 3 }).piece(rect(-1.5, -14, 1.5, 14), '#7a5a3e', { round: 1 }).finish({ shadowBlur: 1 });
    return P;
  },
  draw(g, P, t, e, env) {
    const f = e.fly ? e.fly(t) : 0, spin = t > e.startAt ? t * 40 : 0;
    g.translate(0, -f * 105 - 6); g.rotate((Math.sin(t * 5) * 2.5 * f - f * 3) * DEG);
    put(g, P.body, env.sh * (1 - f * 0.7), 3, 4 + f * 30);
    g.save(); g.translate(-6, -22); put(g, P.pilot, 0); g.restore();
    for (const x of [-34, 34]) { g.save(); g.translate(-90, -34 + x * 0.3); g.scale(1, Math.cos(spin + x)); put(g, P.prop, 0); g.restore(); }
  },
};
KINDS.lab = {
  bake(mk) {
    const P = {};
    P.bench = mk('lab', [-80, -80, 80, 6]).piece(rect(-74, -50, 74, -58), '#d8d2c4', { round: 1 }).piece(rect(-70, 4, -64, -50), '#6a6460', { round: 0.5 }).piece(rect(64, 4, 70, -50), '#6a6460', { round: 0.5 })
      .piece([[-56, -58], [-52, -76], [-46, -76], [-42, -58]], '#cfe0e0', { round: 2, lift: 1, paint: (g) => { g.fillStyle = 'rgba(120,180,90,.6)'; g.fillRect(-56, -66, 14, 8); } })
      .piece([[-30, -58], [-30, -78], [-24, -78], [-24, -58]], '#cfe0e0', { round: 1, lift: 1 })
      .piece(rect(30, -58, 60, -90), '#3a3a40', { round: 2, lift: 1.2, paint: (g) => { g.fillStyle = '#8a8a90'; g.fillRect(42, -90, 6, -18); } })
      .finish({ shadowBlur: 4 });
    P.dish = mk('dish', [-22, -10, 22, 4], { pad: 4 }).piece([[-20, 0], [-20, -6], [20, -6], [20, 0]], '#dfeef0', { round: 2, rim: 0.4, paint: (g) => { g.fillStyle = '#c8b860'; g.beginPath(); g.ellipse(-4, -3, 12, 2.4, 0, 0, 7); g.fill(); g.fillStyle = '#6a9a5a'; g.beginPath(); g.arc(-2, -3, 3, 0, 7); g.fill(); } }).finish({ shadowBlur: 2 });
    return P;
  },
  draw(g, P, t, e, env) { put(g, P.bench, env.sh); g.save(); g.translate(0, -58); put(g, P.dish, env.sh * 0.5); g.restore(); },
  glow(g, P, t, e, env, p) {
    const k = e.found ? e.found(t) : 0; if (k < 0.01 || p < 0.6) return;
    g.globalCompositeOperation = 'lighter';
    const gr = g.createRadialGradient(0, -62, 0, 0, -62, 70); gr.addColorStop(0, `rgba(220,255,200,${0.9 * k})`); gr.addColorStop(0.3, `rgba(170,230,150,${0.35 * k})`); gr.addColorStop(1, 'rgba(150,220,130,0)');
    g.fillStyle = gr; g.fillRect(-70, -132, 140, 140); g.globalCompositeOperation = 'source-over';
  },
};
KINDS.gantry = {
  bake(mk) { const sh = mk('gantry', [-40, -330, 50, 6]); sh.piece(rect(-14, 4, 14, -320), '#b8462e', { round: 1, paint: (g) => { g.strokeStyle = 'rgba(40,20,15,.6)'; g.lineWidth = 1.2; for (let y = 0; y > -320; y -= 16) { g.beginPath(); g.moveTo(-14, y); g.lineTo(14, y - 16); g.moveTo(14, y); g.lineTo(-14, y - 16); g.stroke(); } } }); for (const y of [-120, -220, -290]) sh.piece(rect(14, y, 44, y - 6), '#b8462e', { round: 1, lift: 1 }); sh.piece(rect(-36, 4, 46, -6), '#8a8a90', { round: 1 }); return { spr: sh.finish({ shadowBlur: 5 }) }; },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 4, 5); },
};

// ----------------------------------------------------------------- today ---
KINDS.home = {
  bake(mk, v = 0) {
    const c = ['#d8d0c0', '#c8b8a0', '#b8c4c8'][v % 3], win = [[-40, -70, 26, 30], [16, -70, 26, 30]];
    const sh = mk('home' + v, [-62, -150, 62, 6]);
    sh.piece(rect(-56, 4, 56, -110), c, { round: 2, paint: (g) => { g.fillStyle = 'rgba(30,26,24,.8)'; for (const [x, y, w, h] of win) g.fillRect(x, y, w, h); g.fillStyle = '#5a4a40'; g.fillRect(-10, -44, 20, 48); } });
    sh.piece(rect(-60, -110, 60, -118), '#4a4446', { round: 1, lift: 1.4 });
    sh.piece([[-48, -118], [-40, -138], [6, -138], [-2, -118]], '#2c3a5a', { round: 1, lift: 1.4, paint: (g) => { g.strokeStyle = 'rgba(160,190,230,.6)'; g.lineWidth = 0.7; for (let x = -44; x < 2; x += 8) { g.beginPath(); g.moveTo(x, -118); g.lineTo(x + 8, -138); g.stroke(); } } });
    return { spr: sh.finish({ shadowBlur: 5 }), windows: win, roof: -118 };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 4, 5); },
  glow: (g, P, t, e, env, p) => {
    if (!e.winOn || p < 0.6) return; g.globalCompositeOperation = 'lighter';
    P.windows.forEach(([x, y, w, h], i) => { const k = e.winOn(t, i); if (k < 0.01) return; g.fillStyle = `rgba(255,200,130,${0.7 * k})`; g.fillRect(x + 1, y + 1, w - 2, h - 2); const gr = g.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, 40); gr.addColorStop(0, `rgba(255,190,120,${0.18 * k})`); gr.addColorStop(1, 'rgba(255,190,120,0)'); g.fillStyle = gr; g.fillRect(x - 30, y - 30, w + 60, h + 60); });
    g.globalCompositeOperation = 'source-over';
  },
};
KINDS.boat = {
  bake(mk) {
    const P = KINDS.person.bake(mk, 'fisher');
    P.hull = mk('boat', [-70, -40, 70, 10]).piece([[-66, -24], [-50, 6], [50, 6], [68, -26], [50, -14], [-50, -14]], '#3a6a8a', { round: 4, paint: (g) => { g.fillStyle = '#e8e0d0'; g.fillRect(-60, -18, 120, 3); } }).piece(strip(-40, -14, -40, -40, 2, 2), '#4a3826', { round: 0.5, lift: 1 }).finish({ shadowBlur: 4 });
    return P;
  },
  draw(g, P, t, e, env) {
    g.translate(0, Math.sin(t * 1.3 + e.a) * 3); g.rotate(Math.sin(t * 0.9 + e.a * 2) * 2.4 * DEG);
    g.save(); g.translate(14, -14); drawPerson(g, P, t, e, env, { lean: 8, head: 20, back: [-30, -90], front: [-40, -86] }); g.restore();
    put(g, P.hull, env.sh);
  },
  glow(g, P, t, e, env, p) {
    if (p < 0.6) return; g.globalCompositeOperation = 'lighter';
    const fl = 0.85 + 0.15 * Math.sin(t * 9);
    const gr = g.createRadialGradient(-40, -44, 0, -40, -44, 50); gr.addColorStop(0, `rgba(255,210,140,${0.8 * fl})`); gr.addColorStop(1, 'rgba(255,200,120,0)');
    g.fillStyle = gr; g.fillRect(-90, -94, 100, 100); g.globalCompositeOperation = 'source-over';
    if (e.screenAt !== undefined) { const k = sramp(t, e.screenAt, e.screenAt + 0.3); if (k > 0.01) { g.globalCompositeOperation = 'lighter'; const s = g.createRadialGradient(30, -96, 0, 30, -96, 40); s.addColorStop(0, `rgba(140,190,255,${0.5 * k})`); s.addColorStop(1, 'rgba(140,190,255,0)'); g.fillStyle = s; g.fillRect(-10, -136, 80, 80); g.globalCompositeOperation = 'source-over'; } }
  },
};
KINDS.busstop = {
  bake(mk) { return { spr: mk('busstop', [-50, -130, 50, 6]).piece(rect(-44, -110, 44, -118), '#4a4c52', { round: 1 }).piece(rect(36, 4, 40, -110), '#4a4c52', { round: 0.5 }).piece(rect(-40, 4, -36, -110), '#4a4c52', { round: 0.5 }).piece(rect(-30, -24, 30, -98), '#d8e4ea', { round: 1, lift: 1, paint: (g) => { g.fillStyle = 'rgba(80,140,170,.35)'; g.fillRect(-30, -98, 60, 74); } }).piece(rect(-26, -30, 26, -34), '#6a6460', { round: 0.5, lift: 1 }).finish({ shadowBlur: 4 }) }; },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh); },
  glow(g, P, t, e, env, p) { if (p < 0.6) return; g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(200,230,255,.28)'; g.fillRect(-28, -96, 56, 70); g.globalCompositeOperation = 'source-over'; },
};
