// Cut-outs for "The Long Thread": China, from the first villages to now.
// Same conventions as the rest of the library: design units, a cut-out stands on its origin
// facing +x, a person is about 120 units tall, y up is negative.
import { put, ellipse, strip, KRAFT, KRAFT_EDGE } from './paper.js';
import { KINDS } from './cutouts.js';
import { LOOKS, drawPerson } from './people.js';
import { rng, fbm, noise, DEG, hash, shade, mix, rgb, clamp, smooth, sramp, spring, lerp } from './util.js';

export const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
const dark = '#2b1f18';
const dab = (g, r, n, box, cols, len = 6, w = 2) => {
  g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = box[0] + r() * (box[2] - box[0]), y = box[1] + r() * (box[3] - box[1]), a = (r() - 0.5) * 1.2;
    g.strokeStyle = cols[(r() * cols.length) | 0]; g.lineWidth = w * (0.6 + r() * 0.8);
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * len * (0.5 + r()), y + Math.sin(a) * len * 0.4); g.stroke();
  }
};
const sway = (t, e, amt = 2, sp = 0.6) => fbm(t * sp + e.a * 0.37, 13) * amt * DEG;
export const tiles = (col, step = 5, a = 0.4) => (g, sh) => { g.strokeStyle = rgb(shade(col, -0.4), a); g.lineWidth = 1; for (let x = sh.x0; x < sh.x0 + sh.w; x += step) { g.beginPath(); g.moveTo(x, sh.y0); g.lineTo(x, sh.y0 + sh.h); g.stroke(); } };

// Lit openings: doors and windows that glow when e.winOn(t, i) > 0.
export function glowRects(g, P, t, e, env, p) {
  if (!e.winOn || p < 0.6 || !P.windows) return;
  g.globalCompositeOperation = 'lighter';
  P.windows.forEach((w, i) => {
    const k = e.winOn(t, i); if (k <= 0.01) return;
    const [x, y, ww, hh] = w, c = e.winCol || [255, 190, 110];
    g.fillStyle = rgb(c, 0.75 * k); g.fillRect(x + 0.6, y + 0.6, ww - 1.2, hh - 1.2);
    const r = Math.max(ww, hh) * 1.4, gr = g.createRadialGradient(x + ww / 2, y + hh / 2, 0, x + ww / 2, y + hh / 2, r);
    gr.addColorStop(0, rgb(c, 0.16 * k)); gr.addColorStop(1, rgb(c, 0));
    g.fillStyle = gr; g.fillRect(x + ww / 2 - r, y + hh / 2 - r, r * 2, r * 2);
  });
  g.globalCompositeOperation = 'source-over';
}
export const paintRects = (list, col = 'rgba(30,22,18,.85)') => (g) => { g.fillStyle = col; for (const [x, y, w, h] of list) g.fillRect(x, y, w, h); };

// Two-link reach for the puppets' arms: the shoulder-relative target -> [upper, fore] angles in the
// arm convention of people.js (0 hangs straight down; negative swings forward).
export function reach(dx, dy, bend = 1, L1 = 19, L2 = 21) {
  const D = Math.min(L1 + L2 - 0.01, Math.max(Math.abs(L1 - L2) + 0.01, Math.hypot(dx, dy)));
  const phi = Math.atan2(-dx, dy), al = Math.acos((L1 * L1 + D * D - L2 * L2) / (2 * L1 * D)), be = Math.acos((L1 * L1 + L2 * L2 - D * D) / (2 * L1 * L2));
  const a1 = phi + bend * al, a2 = -bend * (Math.PI - be);
  return [a1 / DEG, a2 / DEG];
}

// ======================================================= the first villages ===
// A round house of wattle and daub under a cone of thatch, like those at Banpo and Jiahu.
KINDS.roundhut = {
  bake(mk, v = 0) {
    const r = rng(1100 + v), w = [54, 64, 46][v % 3], wh = [26, 30, 22][v % 3], rh = [96, 108, 86][v % 3];
    const door = [-9, -24, 18, 28];
    const sh = mk('roundhut' + v, [-w - 22, -wh - rh - 16, w + 22, 6]);
    sh.piece([[-w, 4], [-w + 2, -wh - 4], [w - 2, -wh - 4], [w, 4]], '#9a7650', { round: 3, paint: (g) => {
      g.strokeStyle = 'rgba(70,46,26,.35)'; g.lineWidth = 1.1; for (let i = 0; i < 26; i++) { const x = -w + r() * w * 2; g.beginPath(); g.moveTo(x, 4); g.lineTo(x + (r() - 0.5) * 6, -wh); g.stroke(); }
      paintRects([door], 'rgba(28,18,12,.92)')(g);
    } });
    const roof = [[-w - 18, -wh + 6]];
    for (let i = 1; i < 9; i++) { const x = -w - 18 + i * ((w + 18) * 2 / 9); roof.push([x, -wh + 6 + (i % 2 ? 6 + r() * 4 : -1)]); }
    roof.push([w + 18, -wh + 6], [w * 0.36, -wh - rh * 0.62], [6, -wh - rh], [-6, -wh - rh], [-w * 0.36, -wh - rh * 0.62]);
    sh.piece(roof, '#b89a5c', { round: 4, rough: 2.4, seg: 14, paint: (g) => {
      g.lineWidth = 1; for (let i = 0; i < 70; i++) { const x = -w - 16 + r() * (w + 16) * 2; g.strokeStyle = r() < 0.5 ? 'rgba(110,80,40,.45)' : 'rgba(240,215,150,.35)'; g.beginPath(); g.moveTo(x * 0.08, -wh - rh + 6); g.lineTo(x, -wh + 8); g.stroke(); }
      g.strokeStyle = 'rgba(80,56,30,.55)'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(-w * 0.46, -wh - rh * 0.5); g.quadraticCurveTo(0, -wh - rh * 0.44, w * 0.46, -wh - rh * 0.5); g.stroke();
    } });
    sh.piece([[-7, -wh - rh + 2], [7, -wh - rh + 2], [4, -wh - rh - 12], [-4, -wh - rh - 12]], '#8a6a40', { round: 2, lift: 1.2, rough: 1.4 });
    return { spr: sh.finish(), windows: [door], top: [0, -wh - rh - 12] };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh); },
  glow: glowRects,
};

// The red-crowned crane: white body, black neck and bustle, a red cap. It can stand, preen and dance.
KINDS.redcrane = {
  bake(mk, v = 0) {
    const P = {};
    P.legs = mk('rcrane-legs', [-10, -56, 14, 4], { pad: 4 })
      .piece(strip(-2, -52, -4, 1, 2.6, 2), '#3a3a3c', { round: 0.8, thick: 0.5 })
      .piece(strip(4, -52, 7, 1, 2.6, 2), '#4a4a4c', { round: 0.8, thick: 0.5, lift: 0.6 })
      .piece([[-8, 1], [0, 1], [-1, 3], [-9, 3]], '#3a3a3c', { round: 0.8, lift: 0.4 }).piece([[2, 1], [11, 1], [10, 3], [2, 3]], '#4a4a4c', { round: 0.8, lift: 0.4 })
      .finish({ shadowBlur: 2 });
    P.body = mk('rcrane-body', [-40, -24, 34, 16], { pad: 5 })
      .piece([[-26, 2], [-34, -2], [-38, 6], [-30, 10], [-18, 8]], '#262426', { round: 3, rough: 1.2 })
      .piece([[-30, 0], [-22, -14], [-4, -20], [16, -18], [30, -8], [28, 4], [10, 10], [-14, 10]], '#f1ede4', { round: 7, rough: 0.8, lift: 1.4, paint: (g) => { g.strokeStyle = 'rgba(150,140,130,.35)'; g.lineWidth = 0.9; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(-20 + i * 6, -10); g.quadraticCurveTo(-14 + i * 6, -2, -22 + i * 6, 8); g.stroke(); } } })
      .piece([[-30, -2], [-40, 2], [-38, 12], [-28, 14], [-18, 10], [-20, 2]], '#2a2729', { round: 4, rough: 1.4, lift: 1.4, paint: (g) => { g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 0.8; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(-22 - k * 3, 2); g.lineTo(-34 - k * 1.4, 12); g.stroke(); } } })
      .finish({ shadowBlur: 3 });
    P.neck = mk('rcrane-neck', [-6, -62, 30, 6], { pad: 4 })
      .piece([[-4, 4], [-2, -16], [4, -34], [6, -50], [12, -58], [18, -58], [20, -53], [12, -48], [10, -34], [6, -14], [6, 4]], '#262426', { round: 3, paint: (g) => { g.fillStyle = '#efebe2'; g.beginPath(); g.moveTo(-2, -24); g.quadraticCurveTo(2, -40, 6, -48); g.lineTo(8, -44); g.quadraticCurveTo(4, -30, 2, -18); g.fill(); } })
      .piece(ellipse(14, -58.5, 4.4, 2.4, 10), '#c8282a', { round: 1, lift: 0.6 })
      .piece([[18, -56], [30, -53], [18, -52]], '#8a8670', { round: 0.6, lift: 0.6 })
      .finish({ shadowBlur: 2 });
    const wing = (n) => mk('rcrane-wing' + n, [-6, -66, 46, 8], { pad: 4 })
      .piece([[0, 2], [6, -24], [16, -48], [30, -62], [36, -60], [42, -50], [38, -40], [40, -30], [32, -16], [20, -4], [8, 4]], '#f3efe6', { round: 4, rough: 0.8, paint: (g) => { g.fillStyle = '#242224'; g.beginPath(); g.moveTo(30, -62); g.lineTo(42, -50); g.lineTo(38, -40); g.lineTo(40, -30); g.lineTo(32, -16); g.lineTo(26, -26); g.lineTo(30, -40); g.closePath(); g.fill(); g.strokeStyle = 'rgba(140,130,120,.4)'; g.lineWidth = 0.8; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(6 + k * 3, -6 - k * 6); g.lineTo(28 + k * 2, -22 - k * 7); g.stroke(); } } })
      .finish({ shadowBlur: 3 });
    P.wingF = wing('F'); P.wingB = wing('B');
    return P;
  },
  draw(g, P, t, e, env) {
    const d = e.dance ? e.dance(t) : 0, ph = t * 3.2 + e.a;
    const hop = d * Math.max(0, Math.sin(ph)) * 10, preen = d > 0.05 ? 0 : sramp(Math.sin(t * 0.33 + e.a * 2), 0.82, 0.98);
    g.translate(0, -hop);
    put(g, P.legs, env.sh, 2, 3);
    g.translate(0, -58);
    const spread = d * (0.7 + 0.3 * Math.sin(ph * 0.5 + 1));
    if (spread > 0.02) { g.save(); g.translate(-4, -8); g.rotate((-14 - spread * 46) * DEG); g.scale(1, 0.3 + 0.7 * spread); put(g, P.wingB, env.sh * 0.5); g.restore(); }
    g.save(); g.rotate((Math.sin(t * 0.8 + e.a) * 2 - d * 8) * DEG); put(g, P.body, env.sh, 2, 3); g.restore();
    g.save(); g.translate(18, -10); g.rotate((preen * 70 + fbm(t * 0.4 + e.a, 3) * 6 - d * 18 + Math.sin(ph) * d * 10) * DEG); put(g, P.neck, env.sh * 0.6); g.restore();
    if (spread > 0.02) { g.save(); g.translate(2, -10); g.rotate((6 + spread * 30) * DEG); g.scale(1, 0.3 + 0.7 * spread); put(g, P.wingF, env.sh * 0.5); g.restore(); }
  },
};

KINDS.reeds = {
  bake(mk, v = 0) {
    const r = rng(1200 + v), sh = mk('reeds' + v, [-30, -110, 30, 5], { pad: 6 });
    for (let i = 0; i < 7; i++) { const x = -18 + i * 6 + (r() - 0.5) * 3, h = 60 + r() * 40, lean = (r() - 0.5) * 14; sh.piece([[x - 1.6, 2], [x + lean, -h], [x + 1.6, 2]], i % 2 ? '#7a8a4a' : '#8a9452', { round: 0.4, thick: 0.6, lift: 0.6, rough: 0.3 }); if (r() < 0.6) sh.piece(ellipse(x + lean, -h - 4, 2.6, 9, 8, lean * 0.02), '#b8a070', { round: 2, lift: 0.6, thick: 0.4 }); }
    return { spr: sh.finish({ shadowBlur: 2 }) };
  },
  draw(g, P, t, e, env) { g.rotate((fbm(t * 0.9 + e.a * 0.7, 9) * 6 + Math.sin(t * 1.4 + e.a) * 1.5) * DEG); put(g, P.spr, env.sh * 0.5, 2, 2); },
};

// An early domestic pig, dark and bristly, nose to the ground.
KINDS.pig = {
  bake(mk, v = 0) {
    const r = rng(1300 + v), c = ['#4a3a34', '#5a4436', '#3e3434'][v % 3], P = {};
    const lg = mk('pig-legs' + v, [-24, -6, 26, 18]); for (const x of [-16, -8, 12, 19]) lg.piece(strip(x, -4, x, 15, 5, 4), shade(c, -0.15), { round: 1.5, thick: 0.6 }); P.legs = lg.finish({ shadowBlur: 2 });
    P.body = mk('pig-body' + v, [-34, -30, 30, 6]).piece([[-30, 0], [-32, -14], [-22, -26], [0, -28], [20, -24], [28, -12], [24, 2], [-10, 4]], c, { round: 8, rough: 1.4, paint: (g) => { dab(g, r, 60, [-30, -28, 26, 2], [rgb(shade(c, -0.3), 0.5), rgb(shade(c, 0.2), 0.35)], 5, 1.2); } }).piece([[-30, -14], [-36, -18], [-35, -12]], c, { round: 1, lift: 0.6 }).finish({ shadowBlur: 3 });
    P.head = mk('pig-head' + v, [-4, -16, 26, 10]).piece([[-2, -8], [8, -14], [16, -10], [24, -2], [24, 4], [12, 6], [0, 4]], c, { round: 3, paint: (g) => { g.fillStyle = 'rgba(20,12,10,.9)'; g.beginPath(); g.arc(13, -6, 1, 0, 7); g.fill(); g.fillStyle = shade(c, 0.15).length ? rgb(shade(c, 0.15)) : c; g.fillRect(22, -2, 3, 6); } }).piece([[4, -12], [8, -20], [12, -12]], shade(c, -0.1), { round: 1, lift: 0.8 }).finish({ shadowBlur: 2 });
    return P;
  },
  draw(g, P, t, e, env) {
    const root = sramp(Math.sin(t * 0.7 + e.a * 3), -0.3, 0.3);
    g.translate(0, -16); put(g, P.legs, env.sh, 2, 3);
    g.translate(0, -2 + Math.sin(t * 5 + e.a) * root * 0.6); put(g, P.body, env.sh, 2, 3);
    g.save(); g.translate(24, -12); g.rotate((root * 26 + Math.sin(t * 7 + e.a) * root * 4) * DEG); put(g, P.head, env.sh); g.restore();
  },
};

// A clump of bamboo: each cane sways on its own.
KINDS.bamboo = {
  bake(mk, v = 0) {
    const r = rng(1400 + v), canes = [], n = 5 + (v % 2);
    for (let i = 0; i < n; i++) {
      const h = 200 + r() * 140, w = 5 + r() * 2.4, lean = (i - n / 2) * 6 + (r() - 0.5) * 10, col = ['#7a9a52', '#6a8c4a', '#8aa860', '#5e7e44'][i % 4];
      const sh = mk('bamboo' + v + '-' + i, [-60 + Math.min(0, lean), -h - 40, 60 + Math.max(0, lean), 6], { pad: 6 });
      sh.piece([[-w / 2, 3], [lean - w * 0.35, -h], [lean + w * 0.35, -h], [w / 2, 3]], col, { round: 1, thick: 0.9, rough: 0.3, seg: 60, paint: (g) => { g.strokeStyle = rgb(shade(col, -0.35), 0.75); g.lineWidth = 1.3; for (let y = -14 - r() * 6; y > -h; y -= 22 + r() * 8) { const x = lean * (-y / h); g.beginPath(); g.moveTo(x - w * 0.55, y); g.lineTo(x + w * 0.55, y); g.stroke(); } g.fillStyle = rgb(shade(col, 0.25), 0.35); g.fillRect(-1.4, -h, 1.2, h); } });
      for (let k = 0; k < 6; k++) {
        const y = -h * (0.5 + r() * 0.48), x = lean * (-y / h), s = r() < 0.5 ? -1 : 1;
        for (let j = 0; j < 3; j++) { const a = (s > 0 ? -0.5 : Math.PI + 0.5) + (j - 1) * 0.35 + (r() - 0.5) * 0.3, L = 22 + r() * 12; const tx = x + Math.cos(a) * L, ty = y + Math.sin(a) * L * 0.6 + 6; sh.piece([[x, y], [(x + tx) / 2 - Math.sin(a) * 3, (y + ty) / 2 - 2], [tx, ty], [(x + tx) / 2 + Math.sin(a) * 2, (y + ty) / 2 + 2]], j % 2 ? '#6f9448' : '#86a85a', { round: 1.2, thick: 0.5, lift: 0.8, rough: 0.4 }); }
      }
      canes.push({ spr: sh.finish({ shadowBlur: 3 }), ph: r() * 10, x: (i - (n - 1) / 2) * 7 });
    }
    return { canes };
  },
  draw(g, P, t, e, env) {
    for (const c of P.canes) { g.save(); g.translate(c.x, 0); g.rotate((fbm(t * 0.45 + c.ph + e.a * 0.2, 11) * 3.4 + Math.sin(t * 0.9 + c.ph) * 0.8) * DEG); put(g, c.spr, env.sh); g.restore(); }
  },
};

KINDS.mulberry = {
  bake(mk, v = 0) {
    const r = rng(1500 + v), col = ['#4f7a3c', '#5a8442', '#47703a'][v % 3], h = 110 + v * 10;
    const sh = mk('mulberry' + v, [-70, -h - 60, 70, 6]);
    sh.piece([[-7, 2], [-5, -h * 0.5], [-26, -h * 0.82], [-20, -h * 0.86], [-2, -h * 0.64], [2, -h * 0.95], [7, -h * 0.94], [6, -h * 0.6], [24, -h * 0.84], [28, -h * 0.78], [8, -h * 0.48], [9, 2]], '#6a5040', { round: 2, paint: (g) => dab(g, r, 14, [-10, -h, 10, 0], ['rgba(40,26,18,.35)'], 8, 1.4) });
    for (const [x, y, rr] of [[-34, -h * 0.86, 34], [30, -h * 0.9, 34], [0, -h * 1.08, 42], [-10, -h * 0.74, 30], [16, -h * 0.72, 28]]) {
      sh.piece(ellipse(x, y, rr, rr * 0.8, 14), shade(col, (r() - 0.5) * 0.16), { round: 8, rough: 2.4, seg: 10, paint: (g) => {
        for (let i = 0; i < 26; i++) { const lx = x + (r() - 0.5) * rr * 1.7, ly = y + (r() - 0.5) * rr * 1.3; g.fillStyle = rgb(shade(col, r() < 0.5 ? 0.22 : -0.22), 0.6); g.beginPath(); g.ellipse(lx, ly, 6, 4.4, r() * 3, 0, 7); g.fill(); }
        g.fillStyle = 'rgba(70,20,50,.75)'; for (let i = 0; i < 8; i++) { g.beginPath(); g.arc(x + (r() - 0.5) * rr * 1.4, y + (r() - 0.5) * rr, 1.6, 0, 7); g.fill(); }
      } });
    }
    return { spr: sh.finish() };
  },
  draw(g, P, t, e, env) { g.rotate(sway(t, e, 1.2)); put(g, P.spr, env.sh); },
};

// The water buffalo: wide swept-back horns, a slow walk through the paddies.
KINDS.buffalo = {
  bake(mk, v = 0) {
    const r = rng(1600 + v), c = ['#4e4a4a', '#5a5450'][v % 2], P = {};
    for (const s of ['F', 'B']) P['leg' + s] = mk('buf-leg' + s + v, [-8, -6, 10, 46]).piece([[-6, -4], [6, -4], [5, 22], [4, 38], [6, 44], [-5, 44], [-4, 22]], s === 'B' ? shade(c, -0.18) : c, { round: 2.5 }).finish({ shadowBlur: 2 });
    P.body = mk('buf-body' + v, [-70, -60, 60, 10]).piece([[-62, -6], [-66, -30], [-50, -48], [-10, -52], [24, -56], [48, -46], [54, -24], [44, 4], [-40, 6]], c, { round: 9, rough: 1.2, paint: (g) => { dab(g, r, 50, [-60, -50, 50, 0], [rgb(shade(c, -0.25), 0.4), rgb(shade(c, 0.18), 0.3)], 8, 1.6); g.fillStyle = 'rgba(160,120,80,.35)'; g.fillRect(-66, -8, 120, 12); } }).piece([[-62, -26], [-74, -8], [-70, -6], [-60, -18]], c, { round: 1.5, lift: 0.8 }).finish();
    P.head = mk('buf-head' + v, [-12, -40, 46, 26]).piece([[-8, -8], [8, -14], [26, -10], [36, 4], [34, 16], [22, 20], [6, 12], [-6, 6]], shade(c, -0.05), { round: 5, paint: (g) => { g.fillStyle = 'rgba(15,10,10,.9)'; g.beginPath(); g.arc(18, -4, 1.5, 0, 7); g.fill(); g.fillStyle = 'rgba(170,150,140,.6)'; g.beginPath(); g.ellipse(32, 12, 4, 3, 0, 0, 7); g.fill(); } })
      .piece([[0, -10], [-10, -22], [-6, -36], [4, -40], [16, -36], [8, -32], [2, -24], [8, -12]], '#a8a090', { round: 3, lift: 1.4, paint: (g) => { g.strokeStyle = 'rgba(80,70,60,.4)'; g.lineWidth = 0.8; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(-6 + k, -14 - k * 4); g.lineTo(-2 + k * 2, -16 - k * 4); g.stroke(); } } })
      .finish({ shadowBlur: 3 });
    return P;
  },
  draw(g, P, t, e, env) {
    const walk = e.move ? 1 : 0, ph = t * (e.pace ?? 2.2) + e.a;
    g.translate(0, -44);
    for (const [x, o, s] of [[-44, 0, 'B'], [30, Math.PI, 'B'], [-36, Math.PI, 'F'], [38, 0, 'F']]) { g.save(); g.translate(x, 0); g.rotate(Math.sin(ph + o) * 12 * walk * DEG); put(g, P['leg' + s], env.sh, 2, 3); g.restore(); }
    g.translate(0, Math.abs(Math.cos(ph)) * 1.5 * walk);
    put(g, P.body, env.sh, 3, 4);
    g.save(); g.translate(48, -30); g.rotate((fbm(t * 0.35 + e.a, 4) * 6 + 8 + Math.sin(ph) * 3 * walk) * DEG); put(g, P.head, env.sh * 0.6); g.restore();
  },
};

// Karst towers: the limestone peaks of the south, for the distant layers.
KINDS.karst = {
  bake(mk, v = 0) {
    const r = rng(1700 + v), w = [54, 44, 64, 50, 40, 60][v % 6], h = [190, 240, 165, 215, 260, 180][v % 6], col = ['#5f7f6c', '#6a8a76', '#577762'][v % 3];
    const side = (s0) => { const pts = [], n = 16, ph = r() * 9; for (let i = 0; i <= n; i++) { const f = i / n, hw = w * Math.pow(Math.max(0, 1 - f ** 2.6), 0.5) * (1 + 0.05 * Math.sin(f * 6 + ph) + 0.03 * Math.sin(f * 15 + ph * 2)) * (1 + 0.22 * (1 - f) ** 8); pts.push([s0 * hw + (r() - 0.5) * 3, -h * f]); } return pts; };
    const R = side(1).reverse(), Lf = side(-1), lean = (r() - 0.5) * 10;
    const pts = [[-w * 1.25, 6], ...Lf.map(([x, y]) => [x + lean * (-y / h) ** 2, y]), ...R.map(([x, y]) => [x + lean * (-y / h) ** 2, y]), [w * 1.25, 6]];
    const sh = mk('karst' + v, [-w * 1.4 - 10, -h - 14, w * 1.4 + 10, 8]);
    sh.piece(pts, col, { round: 6, rough: 2, seg: 16, paint: (g) => {
      g.strokeStyle = 'rgba(30,50,40,.28)'; g.lineWidth = 2.2; for (let i = 0; i < 16; i++) { const x = (r() - 0.5) * w * 1.5, y0 = -h * (0.3 + r() * 0.6); g.beginPath(); g.moveTo(x, y0); g.lineTo(x + (r() - 0.5) * 5, y0 + h * (0.1 + r() * 0.25)); g.stroke(); }
      dab(g, r, 90, [-w, -h * 0.98, w, -h * 0.1], ['rgba(40,84,52,.55)', 'rgba(62,104,64,.5)', 'rgba(30,64,44,.45)'], 8, 3.2);
      g.fillStyle = 'rgba(220,226,214,.16)'; for (let i = 0; i < 10; i++) g.fillRect(-w + r() * w * 2, -h * r(), 2, 14 + r() * 20);
      const mist = g.createLinearGradient(0, -h * 0.45, 0, 6); mist.addColorStop(0, 'rgba(226,232,226,0)'); mist.addColorStop(1, 'rgba(226,232,226,.55)'); g.fillStyle = mist; g.fillRect(-w * 1.5, -h, w * 3, h + 10);
    } });
    return { spr: sh.finish({ shadowBlur: 6 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 3, 4); },
};

// Little ripples for rivers: v 0 the silt-yellow Yellow River, 1 the green Yangtze, 2 dark night water.
KINDS.ripple = {
  bake(mk, v = 0) {
    const r = rng(1750 + v), c = ['#b8894a', '#4f8a8a', '#2c4058'][v % 3], pts = [[-34, 4]];
    for (let i = 0; i <= 4; i++) { const x = -34 + i * 17; pts.push([x - 4, -2 - r() * 2], [x + 3, -7 - r() * 3, 2], [x + 7, -2]); }
    pts.push([34, 4]);
    return { spr: mk('ripple' + v, [-38, -14, 38, 6], { pad: 5 }).piece(pts, c, { round: 2.4, rough: 0.6, seg: 30, thick: 0.8, paint: (g) => { g.fillStyle = 'rgba(245,240,225,.45)'; for (let i = 0; i <= 4; i++) { g.beginPath(); g.ellipse(-30 + i * 17, -5, 3, 1, -0.4, 0, 7); g.fill(); } } }).finish({ shadowBlur: 2 }), ph: r() * 9 };
  },
  draw(g, P, t, e, env) { g.translate(Math.sin(t * 0.9 + P.ph + e.a * 3) * 3, Math.sin(t * 1.3 + e.a * 2) * 1.2); put(g, P.spr, env.sh * 0.4, 1, 2); },
};

// Reeling silk: cocoons in a basin of hot water, a single thread wound onto a turning reel.
KINDS.silkreel = {
  bake(mk) {
    const P = {};
    P.base = mk('silk-base', [-40, -64, 60, 6])
      .piece([[-34, 4], [-30, -14], [-4, -14], [0, 4]], '#6a4a34', { round: 2 })
      .piece([[-38, -14], [4, -14], [0, -30], [-34, -30]], '#a8653c', { round: 4, lift: 1.4, paint: (g) => { g.fillStyle = 'rgba(240,215,170,.35)'; g.fillRect(-34, -26, 34, 1.6); } })
      .piece(ellipse(-17, -30, 17, 3.4, 12), '#7a9aa8', { round: 2, lift: 0.8, paint: (g) => { g.fillStyle = '#f4efe2'; for (const x of [-26, -20, -12, -7]) { g.beginPath(); g.ellipse(x, -30.5, 2.8, 1.8, 0.2, 0, 7); g.fill(); } } })
      .piece(strip(30, 4, 30, -56, 3.4, 3), '#5b4331', { round: 1, lift: 1 }).piece(strip(54, 4, 54, -56, 3.4, 3), '#5b4331', { round: 1, lift: 1 })
      .finish({ shadowBlur: 4 });
    P.reel = mk('silk-reel', [-18, -18, 18, 18], { pad: 4 }).piece(ellipse(0, 0, 3, 3, 8), '#4a3423', { round: 1 });
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; P.reel.piece(strip(0, 0, Math.cos(a) * 16, Math.sin(a) * 16, 2.2, 2), '#6a4a2e', { round: 0.6, lift: 0.6 }); }
    P.reel.piece(ellipse(0, 0, 9, 9, 14), '#e8c46a', { round: 3, lift: 1, thick: 0.5, rim: 0.2, paint: (g) => { g.strokeStyle = 'rgba(255,240,190,.6)'; g.lineWidth = 0.6; for (let rr = 3; rr < 9; rr += 1.4) { g.beginPath(); g.arc(0, 0, rr, 0, 7); g.stroke(); } } });
    P.reel = P.reel.finish({ shadowBlur: 2 });
    return P;
  },
  draw(g, P, t, e, env) {
    put(g, P.base, env.sh, 3, 4);
    const spin = e.spin ? e.spin(t) : t * 2;
    g.save(); g.translate(42, -50); g.rotate(spin); put(g, P.reel, env.sh * 0.5); g.restore();
    // the single thread, from a cocoon to the reel
    g.strokeStyle = 'rgba(245,214,130,.9)'; g.lineWidth = 0.7;
    g.beginPath(); g.moveTo(-14, -31); g.quadraticCurveTo(10, -60 + Math.sin(t * 3) * 2, 42, -59); g.stroke();
  },
};

// Someone playing an end-blown bone flute, sitting. Arms reach the flute (inverse kinematics), fingers move.
// e.v: the look; e.play(t): 0 holding it in the lap, 1 playing.
KINDS.flutist = {
  bake(mk, v) { const P = KINDS.person.bake(mk, v); P.flute = mk('flutist-flute', [-3, -4, 4, 32], { pad: 4 }).piece(strip(0.5, 0, 0.5, 30, 3, 2.4), '#e8dcc0', { round: 1, thick: 0.6, rough: 0.3, paint: (g) => { g.fillStyle = 'rgba(70,50,35,.85)'; for (let y = 10; y < 28; y += 2.8) { g.beginPath(); g.arc(0.5, y, 0.7, 0, 7); g.fill(); } } }).finish({ shadowBlur: 2 }); return P; },
  draw(g, P, t, e, env) {
    const pl = e.play ? e.play(t) : 1, lean = 6 + pl * 4 + Math.sin(t * 0.9) * 0.8, hd = -4 + pl * 6 + Math.sin(t * 1.7) * pl * 2;
    const cs = Math.cos(hd * DEG), sn = Math.sin(hd * DEG), mx = 9.6, my = -8.5;
    const mouth = [0.5 + mx * cs - my * sn, -38.5 + mx * sn + my * cs];
    const anchor = [lerp(6, mouth[0], pl), lerp(-22, mouth[1], pl)], ang = lerp(0, 50, pl) * DEG, dir = [Math.cos(ang), Math.sin(ang)];
    const f1 = pl * Math.sin(t * 9.1) * 0.8, f2 = pl * Math.sin(t * 7.3 + 1) * 0.8;
    const h1 = [anchor[0] + dir[0] * (9 + f1), anchor[1] + dir[1] * (9 + f1)], h2 = [anchor[0] + dir[0] * (19 + f2), anchor[1] + dir[1] * (19 + f2)];
    const [b1, b2] = reach(h1[0] + 3, h1[1] + 35), [a1, a2] = reach(h2[0] - 2, h2[1] + 34.5);
    drawPerson(g, P, t, e, env, { lean, head: hd, back: [b1, b2], front: [a1, a2], held: (g2) => {
      g2.save(); g2.rotate(-a2 * DEG); g2.translate(0, -19); g2.rotate(-a1 * DEG); g2.translate(-2, 34.5);
      g2.translate(anchor[0], anchor[1]); g2.rotate(Math.atan2(-dir[0], dir[1])); put(g2, P.flute, env.sh * 0.4, 1, 2); g2.restore();
    } });
  },
};

// ============================================================ bronze and bone ===
const BRONZE = '#c08a4e', BRONZE_D = '#7a5232', PATINA = '#6f8a72';
const taotie = (x, y, s, col = 'rgba(60,34,18,.75)') => (g) => {
  // a monster mask in low relief: two big eyes, curling horns and brows, a nose ridge, spirals
  g.save(); g.translate(x, y); g.scale(s, s); g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 1.6; g.lineCap = 'round';
  for (const sx of [-1, 1]) {
    g.beginPath(); g.ellipse(sx * 9, 0, 4, 3, 0, 0, 7); g.stroke(); g.beginPath(); g.arc(sx * 9, 0, 1.4, 0, 7); g.fill();
    g.beginPath(); g.moveTo(sx * 3, -6); g.quadraticCurveTo(sx * 14, -14, sx * 22, -6); g.quadraticCurveTo(sx * 24, 0, sx * 19, 2); g.stroke();
    g.beginPath(); g.arc(sx * 20, 8, 3, 0, 5); g.stroke(); g.beginPath(); g.moveTo(sx * 4, 6); g.lineTo(sx * 13, 10); g.stroke();
  }
  g.beginPath(); g.moveTo(0, -10); g.lineTo(0, 10); g.stroke();
  g.restore();
};
// A Shang hall: a thatched hall on a terrace of pounded earth, laid down layer by layer.
KINDS.shanghall = {
  bake(mk, v = 0) {
    const r = rng(2000 + v), w = 130, sh = mk('shanghall' + v, [-w - 30, -210, w + 30, 6]);
    sh.piece([[-w, 4], [-w + 4, -34], [w - 4, -34], [w, 4]], '#b8945e', { round: 2, paint: (g) => { g.strokeStyle = 'rgba(90,62,30,.35)'; g.lineWidth = 1.2; for (let y = 0; y > -34; y -= 4.2) { g.beginPath(); g.moveTo(-w, y); g.lineTo(w, y + (r() - 0.5)); g.stroke(); } } });
    sh.piece([[-30, 4], [-24, -34], [24, -34], [30, 4]], '#a8844e', { round: 1.5, lift: 1.2, paint: (g) => { g.strokeStyle = 'rgba(80,54,26,.5)'; g.lineWidth = 1; for (let y = 0; y > -34; y -= 6) { g.beginPath(); g.moveTo(-28, y); g.lineTo(28, y); g.stroke(); } } });
    sh.piece(rect(-w + 18, -34, w - 18, -110), '#c9ac7c', { round: 2, lift: 1.4, paint: (g) => { for (let x = -w + 18; x <= w - 26; x += 26) { g.fillStyle = '#4a3020'; g.fillRect(x, -110, 6, 76); } g.fillStyle = 'rgba(28,18,12,.85)'; g.fillRect(-14, -96, 28, 62); } });
    sh.piece([[-w - 26, -102], [-w + 30, -170], [w - 30, -170], [w + 26, -102], [w + 14, -96], [-w - 14, -96]], '#a88a52', { round: 4, rough: 2, lift: 2, paint: (g) => { g.strokeStyle = 'rgba(110,80,40,.5)'; g.lineWidth = 1; for (let i = 0; i < 60; i++) { const x = -w - 20 + r() * (w * 2 + 40); g.beginPath(); g.moveTo(x * 0.8, -168); g.lineTo(x, -98); g.stroke(); } } });
    sh.piece([[-w + 26, -168], [w - 26, -168], [w - 34, -178], [-w + 34, -178]], '#7a6034', { round: 2, lift: 1.2 });
    return { spr: sh.finish({ shadowBlur: 6 }), windows: [[-14, -96, 28, 62]] };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 4, 5); },
  glow: glowRects,
};
// The foundry: a clay furnace, a mould, and a crucible that tips its molten bronze in (e.pour(t): 0..1).
KINDS.foundry = {
  bake(mk) {
    const P = {};
    P.base = mk('foundry', [-110, -120, 120, 6])
      .piece([[-100, 4], [-104, -40], [-90, -74], [-66, -86], [-44, -74], [-30, -40], [-26, 4]], '#9a6a44', { round: 8, rough: 1.6, paint: (g) => { g.fillStyle = 'rgba(30,14,8,.92)'; g.beginPath(); g.ellipse(-64, -20, 14, 16, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(60,34,18,.4)'; g.lineWidth = 1.4; for (let y = -6; y > -80; y -= 10) { g.beginPath(); g.moveTo(-100, y); g.quadraticCurveTo(-64, y - 6, -28, y); g.stroke(); } } })
      .piece([[-74, -84], [-56, -84], [-58, -116], [-72, -116]], '#7a5236', { round: 2, lift: 1 })
      .piece([[30, 4], [24, -28], [32, -54], [80, -54], [88, -28], [82, 4]], '#a87a52', { round: 6, rough: 1.2, lift: 1.4, paint: (g) => { g.strokeStyle = 'rgba(60,34,18,.5)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(56, -54); g.lineTo(56, 4); g.stroke(); for (const y of [-40, -18]) { g.beginPath(); g.moveTo(26, y); g.lineTo(86, y); g.stroke(); } } })
      .piece([[48, -54], [64, -54], [60, -66], [52, -66]], '#7a5236', { round: 2, lift: 1 })
      .piece(strip(0, 4, 2, -104, 5, 4), '#5a4030', { round: 1, lift: 1 })
      .finish({ shadowBlur: 5 });
    P.pole = mk('foundry-pole', [-10, -6, 80, 6], { pad: 5 }).piece(strip(0, 0, 74, 0, 4, 3.4), '#4a3423', { round: 1 }).finish({ shadowBlur: 2 });
    P.pot = mk('crucible', [-16, -4, 18, 26], { pad: 5 }).piece([[-12, 0], [14, 0], [10, 22], [-8, 22]], '#6a4a38', { round: 5, rough: 0.8, paint: (g) => { g.fillStyle = '#ffb040'; g.beginPath(); g.ellipse(1, 1.4, 12, 2.4, 0, 0, 7); g.fill(); } }).piece([[14, 0], [20, -2], [18, 3]], '#6a4a38', { round: 1, lift: 0.6 }).finish({ shadowBlur: 2 });
    return P;
  },
  draw(g, P, t, e, env) {
    put(g, P.base, env.sh, 4, 5);
    const k = e.pour ? e.pour(t) : 0;
    g.save(); g.translate(2, -100); g.rotate((8 + k * 10) * DEG); put(g, P.pole, env.sh * 0.5);
    g.translate(66, 2); g.rotate((-8 - k * 10 + k * 64) * DEG); put(g, P.pot, env.sh * 0.5); g.restore();
  },
  glow(g, P, t, e, env, p) {
    if (p < 0.6) return;
    const k = e.pour ? e.pour(t) : 0, f = 0.85 + 0.15 * fbm(t * 6, 4);
    g.globalCompositeOperation = 'lighter';
    let gr = g.createRadialGradient(-64, -20, 0, -64, -20, 46); gr.addColorStop(0, `rgba(255,190,90,${0.95 * f})`); gr.addColorStop(0.3, `rgba(255,120,40,${0.5 * f})`); gr.addColorStop(1, 'rgba(255,90,20,0)');
    g.fillStyle = gr; g.fillRect(-110, -66, 92, 92);
    // the crucible, white-hot inside
    if (k > 0.02) { g.save(); g.translate(2, -100); g.rotate((8 + k * 10) * DEG); g.translate(66, 2); g.rotate((-8 - k * 10 + k * 64) * DEG); const cg = g.createRadialGradient(1, 2, 0, 1, 2, 34); cg.addColorStop(0, `rgba(255,220,140,${0.85 * f})`); cg.addColorStop(0.35, `rgba(255,150,60,${0.4 * f})`); cg.addColorStop(1, 'rgba(255,110,40,0)'); g.fillStyle = cg; g.fillRect(-34, -32, 70, 70); g.restore(); }
    if (k > 0.35) {
      // the stream of bronze, from the lip of the crucible to the mouth of the mould (for as long as the crucible is tipped)
      const s = sramp(k, 0.35, 0.6);
      const wob = Math.sin(t * 23) * 1.2;
      g.strokeStyle = `rgba(255,170,70,${0.6 * s})`; g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); g.moveTo(80, -84); g.quadraticCurveTo(66 + wob, -80, 57, -66); g.stroke();
      g.strokeStyle = `rgba(255,236,160,${s})`; g.lineWidth = 3.6; g.beginPath(); g.moveTo(80, -84); g.quadraticCurveTo(66 + wob, -80, 57, -66); g.stroke();
      gr = g.createRadialGradient(58, -68, 0, 58, -68, 70); gr.addColorStop(0, `rgba(255,214,120,${0.95 * s})`); gr.addColorStop(0.3, `rgba(255,150,60,${0.45 * s})`); gr.addColorStop(1, 'rgba(255,120,40,0)'); g.fillStyle = gr; g.fillRect(-12, -138, 140, 140);
      // sparks spraying out of the mould's mouth
      for (let i = 0; i < 26; i++) {
        const ph = (t * 1.5 + hash(i * 7.3)) % 1, vx = (hash(i * 3.1) - 0.5) * 150, vy = -50 - hash(i * 5.7) * 110, x = 58 + vx * ph, y = -66 + vy * ph + 190 * ph * ph;
        g.fillStyle = `rgba(255,${190 + ((hash(i) * 60) | 0)},110,${s * (1 - ph) * 0.95})`; g.beginPath(); g.arc(x, y, 1.4 + (1 - ph) * 1.2, 0, 7); g.fill();
      }
    }
    g.globalCompositeOperation = 'source-over';
  },
};
// Ritual bronzes: v0 a square four-legged ding, v1 a round tripod ding, v2 a gu goblet, v3 a jue.
KINDS.ding = {
  bake(mk, v = 0) {
    const r = rng(2100 + v), sh = mk('ding' + v, [-60, -130, 60, 6], { pad: 8 }), c = BRONZE, cd = shade(c, -0.25);
    if (v === 0) {
      for (const x of [-32, 26]) sh.piece([[x - 6, 4], [x + 6, 4], [x + 7, -34], [x - 5, -34]], cd, { round: 2, paint: taotie(x, -16, 0.28) });
      sh.piece([[-44, -30], [44, -30], [46, -96], [-46, -96]], c, { round: 3, lift: 1.4, paint: (g) => { taotie(0, -64, 1.1)(g); g.strokeStyle = 'rgba(60,34,18,.5)'; g.lineWidth = 1; g.strokeRect(-40, -92, 80, 58); g.fillStyle = 'rgba(255,240,200,.15)'; g.fillRect(-44, -96, 10, 66); } });
      for (const x of [-34, 22]) sh.piece([[x, -94], [x, -124], [x + 12, -124], [x + 12, -94], [x + 8, -94], [x + 8, -118], [x + 4, -118], [x + 4, -94]], c, { round: 1.5, lift: 1 });
    } else if (v === 1) {
      for (const x of [-26, 0, 24]) sh.piece([[x - 5, 4], [x + 5, 4], [x + 4, -30], [x - 4, -30]], cd, { round: 2 });
      const pts = []; for (let i = 0; i <= 14; i++) { const a = Math.PI * (i / 14); pts.push([-Math.cos(a) * 44, -30 - Math.sin(a) * 30 + (i === 0 || i === 14 ? -50 : 0)]); }
      sh.piece([[-46, -80], ...pts.slice(1, -1), [46, -80]], c, { round: 6, lift: 1.4, paint: (g) => { taotie(0, -64, 0.8)(g); g.fillStyle = 'rgba(60,34,18,.5)'; g.fillRect(-46, -80, 92, 5); } });
      for (const x of [-30, 20]) sh.piece([[x, -78], [x, -104], [x + 10, -104], [x + 10, -78], [x + 7, -78], [x + 7, -100], [x + 3, -100], [x + 3, -78]], c, { round: 1.5, lift: 1 });
    } else if (v === 2) {
      sh.piece([[-22, 4], [22, 4], [16, -20], [8, -34], [10, -56], [6, -70], [30, -120], [-30, -120], [-6, -70], [-10, -56], [-8, -34], [-16, -20]], c, { round: 3, paint: (g) => { taotie(0, -46, 0.45)(g); taotie(0, -12, 0.4)(g); g.fillStyle = 'rgba(255,240,200,.14)'; g.fillRect(-8, -118, 5, 110); } });
    } else {
      for (const [x, a] of [[-18, -10], [16, 10], [0, 0]]) sh.piece(strip(x, 4, x * 0.4, -30, 3, 4), cd, { round: 1, lift: 0.8 });
      sh.piece([[-24, -28], [22, -28], [26, -60], [52, -72], [36, -62], [-30, -64], [-40, -70], [-26, -58]], c, { round: 3, lift: 1.2, paint: taotie(0, -44, 0.5) });
      for (const x of [-8, 6]) sh.piece(strip(x, -62, x, -80, 2.4, 3.4), c, { round: 1, lift: 1 });
      sh.piece([[22, -34], [38, -40], [34, -30], [22, -28]], cd, { round: 1, lift: 0.8 });
    }
    return { spr: sh.finish({ shadowBlur: 4 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 3, 4); },
};

// Sanxingdui, far to the southwest: a bronze face with eyes on stalks, seen from the side so the stalks show.
KINDS.sxmask = {
  bake(mk) {
    const P = {}, c = '#a2803c';
    P.post = mk('sx-post', [-14, -150, 14, 6]).piece([[-10, 4], [10, 4], [6, -146], [-6, -146]], '#5a4030', { round: 2 }).piece([[-22, 4], [22, 4], [16, -10], [-16, -10]], '#6a5040', { round: 2, lift: 1 }).finish({ shadowBlur: 3 });
    P.face = mk('sx-face', [-80, -90, 50, 70], { pad: 8 })
      // the great ear, swept back like a wing
      .piece([[-26, -30], [-74, -64], [-80, -40], [-64, -20], [-76, 6], [-40, 10], [-26, 4]], shade(c, -0.12), { round: 4, rough: 0.8, paint: (g) => { g.strokeStyle = 'rgba(40,30,18,.5)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(-34, -24); g.quadraticCurveTo(-66, -48, -70, -30); g.quadraticCurveTo(-58, -20, -68, 0); g.stroke(); } })
      // the face in profile: a high brow, a hooked nose, a long mouth that runs back to the ear
      .piece([[-30, -70], [10, -74], [16, -50], [14, -34], [36, -20], [26, -12], [18, -10], [24, 2], [16, 10], [24, 24], [10, 40], [-30, 44], [-34, 0]], c, { round: 5, lift: 1.6, paint: (g) => { g.strokeStyle = 'rgba(40,30,18,.75)'; g.lineWidth = 2; g.beginPath(); g.moveTo(22, 14); g.lineTo(-24, 22); g.stroke(); g.beginPath(); g.moveTo(-10, -44); g.quadraticCurveTo(4, -50, 14, -44); g.stroke(); g.fillStyle = 'rgba(110,140,110,.35)'; for (let i = 0; i < 20; i++) { g.beginPath(); g.arc(-28 + Math.random() * 50, -60 + Math.random() * 90, 2 + Math.random() * 4, 0, 7); g.fill(); } } })
      .finish({ shadowBlur: 5 });
    P.eye = mk('sx-eye', [-4, -12, 62, 12], { pad: 5 }).piece([[0, -6], [44, -6], [46, -9], [58, -10], [60, 0], [58, 10], [46, 9], [44, 6], [0, 6]], '#b8924a', { round: 3, paint: (g) => { g.strokeStyle = 'rgba(40,30,18,.6)'; g.lineWidth = 1.2; for (const x of [12, 26, 40]) { g.beginPath(); g.moveTo(x, -6); g.lineTo(x, 6); g.stroke(); } g.fillStyle = 'rgba(40,30,18,.8)'; g.beginPath(); g.ellipse(59, 0, 2, 7, 0, 0, 7); g.fill(); } }).finish({ shadowBlur: 3 });
    return P;
  },
  draw(g, P, t, e, env) {
    put(g, P.post, env.sh, 3, 4);
    g.translate(4, -186);
    const k = e.eyesAt !== undefined ? clamp(spring(t - e.eyesAt, 9, 0.32), 0, 1.4) : 1;
    g.save(); g.translate(-6 + k * 4, -34); g.scale(0.3 + 0.7 * k, 1); g.rotate(Math.sin(t * 9) * Math.exp(-Math.max(0, t - (e.eyesAt ?? 0)) * 2) * 6 * DEG); put(g, P.eye, env.sh * 0.5, 2, 3); g.restore();
    put(g, P.face, env.sh, 3, 4);
  },
  // torchlight moving over polished bronze
  glow(g, P, t, e, env, p) {
    if (p < 0.6) return;
    const f = 0.55 + 0.45 * fbm(t * 4.4, 11), k = e.eyesAt !== undefined ? clamp(spring(t - e.eyesAt, 9, 0.32), 0, 1.4) : 1;
    g.save(); g.translate(4, -186); g.globalCompositeOperation = 'lighter';
    const gr = g.createRadialGradient(4, -26, 0, 4, -26, 74); gr.addColorStop(0, `rgba(255,196,120,${0.26 * f})`); gr.addColorStop(1, 'rgba(255,150,70,0)'); g.fillStyle = gr; g.fillRect(-80, -100, 160, 150);
    g.fillStyle = `rgba(255,226,160,${0.55 * f})`; g.beginPath(); g.ellipse(12, -46, 9, 2.2, -0.2, 0, 7); g.fill();
    const ex = -6 + k * 4 + 58 * (0.3 + 0.7 * k); g.fillStyle = `rgba(255,232,170,${0.7 * f})`; g.beginPath(); g.arc(ex, -34, 3.2, 0, 7); g.fill();
    g.restore();
  },
};
KINDS.sxfigure = {
  bake(mk) {
    const c = '#9c7c40', sh = mk('sx-figure', [-40, -300, 50, 6]);
    sh.piece([[-36, 4], [36, 4], [30, -40], [-30, -40]], '#6a5a3c', { round: 2, paint: (g) => { g.strokeStyle = 'rgba(30,20,10,.5)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-28, -20); g.lineTo(28, -20); g.stroke(); } });
    sh.piece([[-16, -40], [16, -40], [18, -170], [12, -196], [-12, -196], [-18, -170]], c, { round: 4, lift: 1.4, paint: (g) => { g.strokeStyle = 'rgba(40,30,18,.5)'; g.lineWidth = 1.2; for (let y = -60; y > -180; y -= 18) { g.beginPath(); g.moveTo(-17, y); g.lineTo(17, y - 4); g.stroke(); taotie(0, y - 8, 0.25)(g); } } });
    sh.piece([[-10, -196], [14, -196], [24, -214], [20, -232], [-8, -238], [-12, -214]], c, { round: 4, lift: 1.4, paint: (g) => { g.fillStyle = 'rgba(40,30,18,.8)'; g.fillRect(4, -222, 12, 3); } });
    sh.piece([[-12, -236], [-16, -262], [-6, -278], [8, -268], [18, -280], [16, -252], [20, -236]], shade(c, 0.05), { round: 3, lift: 1.2 });
    // a face of beaten gold foil, as some Sanxingdui heads still wear
    sh.piece([[-4, -199], [16, -199], [23, -213], [20, -233], [-4, -236], [-8, -216]], '#e0b44a', { round: 2.5, lift: 1.8, paint: (g) => { g.fillStyle = 'rgba(70,40,10,.85)'; g.fillRect(6, -222, 12, 2.6); g.strokeStyle = 'rgba(120,70,20,.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(4, -228); g.quadraticCurveTo(12, -231, 20, -227); g.stroke(); g.beginPath(); g.moveTo(18, -214); g.lineTo(23, -209); g.stroke(); g.fillStyle = 'rgba(255,240,190,.35)'; g.fillRect(-2, -232, 4, 26); } });
    // the huge hands, held out in front, gripping something long since gone
    sh.piece([[12, -150], [42, -148], [46, -136], [40, -126], [14, -130]], c, { round: 4, lift: 1.6, paint: (g) => { g.fillStyle = 'rgba(30,20,10,.85)'; g.beginPath(); g.arc(36, -138, 5, 0, 7); g.fill(); } });
    sh.piece([[10, -176], [40, -184], [44, -172], [38, -162], [12, -160]], shade(c, 0.06), { round: 4, lift: 1.8, paint: (g) => { g.fillStyle = 'rgba(30,20,10,.85)'; g.beginPath(); g.arc(34, -172, 5, 0, 7); g.fill(); } });
    return { spr: sh.finish({ shadowBlur: 6 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 4, 5); },
  glow(g, P, t, e, env, p) {
    if (p < 0.6) return;
    const f = 0.55 + 0.45 * fbm(t * 4.1 + 3, 12); g.globalCompositeOperation = 'lighter';
    let gr = g.createRadialGradient(8, -218, 0, 8, -218, 46); gr.addColorStop(0, `rgba(255,220,130,${0.45 * f})`); gr.addColorStop(1, 'rgba(255,170,80,0)'); g.fillStyle = gr; g.fillRect(-40, -266, 96, 96);
    gr = g.createRadialGradient(30, -156, 0, 30, -156, 40); gr.addColorStop(0, `rgba(255,190,120,${0.2 * f})`); gr.addColorStop(1, 'rgba(255,150,70,0)'); g.fillStyle = gr; g.fillRect(-10, -196, 80, 80);
  },
};
// A bronze tree with birds on its branch tips (Sanxingdui's sacred trees stood nearly four metres tall).
KINDS.sxtree = {
  bake(mk) {
    const c = '#8c7a40', r = rng(2200), sh = mk('sx-tree', [-110, -330, 110, 6]);
    sh.piece([[-30, 4], [30, 4], [20, -24], [-20, -24]], '#5a5038', { round: 3 });
    sh.piece(strip(0, -20, 0, -320, 7, 4), c, { round: 1.5, lift: 1.2 });
    for (let tier = 0; tier < 3; tier++) for (const s of [-1, 1]) {
      const y0 = -90 - tier * 80, L = 86 - tier * 20, pts = [];
      for (let i = 0; i <= 10; i++) { const f = i / 10; pts.push([s * L * f, y0 - Math.sin(f * Math.PI * 0.9) * 26 + f * f * 40]); }
      const top = pts.map(([x, y]) => [x, y - 2.4]), bot = pts.slice().reverse().map(([x, y]) => [x, y + 2.4]);
      sh.piece([...top, ...bot], c, { round: 1.2, lift: 1 });
      const [bx, by] = pts[10];
      sh.piece([[bx - 6, by + 2], [bx - 4, by - 10], [bx + 4, by - 14], [bx + 10, by - 10], [bx + 8, by - 4], [bx + s * 14, by - 8], [bx + 6, by + 2]], '#b09048', { round: 2, lift: 1.2 });
      sh.piece(ellipse(bx, by + 10, 4, 6, 8), '#8a6a38', { round: 1.5, lift: 0.8 });
    }
    sh.piece([[-6, -326], [6, -326], [10, -340], [0, -348], [-10, -340]], '#8a8a5c', { round: 2, lift: 1 });
    return { spr: sh.finish({ shadowBlur: 6 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 4, 5); },
};

// ======================================================= a hundred schools ===
// A war banner on a pole, cloth rippling; v picks the state's colour. e.raise(t) 0..1 runs it up the pole.
const STATE_COL = ['#2a2628', '#b8322a', '#2f6a8a', '#c9a24a', '#5a7a3a', '#8a4a7a', '#e8e0cc', '#c8642a'];
KINDS.banner = {
  bake(mk, v = 0) {
    const c = STATE_COL[v % STATE_COL.length], P = {};
    P.pole = mk('banner-pole', [-4, -230, 6, 4], { pad: 4 }).piece(strip(0.5, 2, 0.5, -224, 3.4, 2.6), '#4a3423', { round: 1 }).piece(ellipse(0.5, -226, 3.4, 3.4, 8), '#c9a24a', { round: 1, lift: 0.8 }).finish({ shadowBlur: 2 });
    P.cloth = [0, 1, 2, 3].map((k) => mk('banner-cloth' + v + k, [-2, -4, 66, 100], { pad: 4 }).piece([[0, 0], [16, 2 + k], [32, -1 + k], [48, 3 - k], [60, 1], [60, 70 + k * 2], [48, 74], [36, 92 - k * 3], [24, 74], [12, 78 + k], [0, 72]], c, { round: 2, rough: 0.6, paint: (g) => { g.strokeStyle = rgb(shade(c, 0.28), 0.6); g.lineWidth = 2.4; g.strokeRect(5, 6, 50, 58); g.fillStyle = rgb(shade(c, v === 6 ? -0.5 : 0.4), 0.85); g.beginPath(); g.arc(30, 34, 11, 0, 7); g.fill(); } }).finish({ shadowBlur: 3 }));
    return P;
  },
  draw(g, P, t, e, env) {
    put(g, P.pole, env.sh, 2, 3);
    const k = e.raise ? e.raise(t) : 1; if (k <= 0) return;
    const f = Math.floor((t * 5 + e.a) % 4);
    g.save(); g.translate(2, -220 + (1 - k) * 120); g.rotate(fbm(t * 0.8 + e.a, 4) * 6 * DEG); g.scale(1, 0.6 + 0.4 * k); put(g, P.cloth[f], env.sh * 0.6, 2, 3); g.restore();
  },
};
// A horse in profile; e.gait 'walk' | 'gallop' | 'stand'; e.col for coat.
export function bakeHorse(mk, id, col) {
  const P = {}, r = rng(2300 + id.length), cd = shade(col, -0.18);
  for (const s of ['F', 'B']) P['leg' + s] = mk('horse-leg' + s + id, [-6, -6, 8, 60]).piece([[-5, -4], [5, -4], [4, 26], [3, 50], [5, 56], [-4, 56], [-3, 26]], s === 'B' ? cd : col, { round: 2 }).piece([[-4, 52], [5, 52], [5.5, 57], [-4.5, 57]], '#2a2220', { round: 1, lift: 0.5 }).finish({ shadowBlur: 2 });
  P.body = mk('horse-body' + id, [-66, -44, 52, 14]).piece([[-56, -18], [-48, -36], [-12, -40], [26, -38], [44, -26], [46, -6], [32, 8], [-40, 8], [-56, -2]], col, { round: 10, rough: 0.8, paint: (g) => { g.fillStyle = rgb(shade(col, 0.18), 0.4); g.beginPath(); g.ellipse(-20, -30, 26, 6, 0, 0, 7); g.fill(); } })
    .piece([[-54, -24], [-66, -10], [-64, 12], [-58, 4], [-56, -12]], shade(col, -0.35), { round: 3, rough: 1.4, lift: 0.8 }).finish({ shadowBlur: 3 });
  P.neck = mk('horse-neck' + id, [-8, -66, 46, 10]).piece([[-6, 6], [-2, -22], [10, -50], [22, -60], [32, -54], [42, -32], [36, -26], [24, -36], [16, -18], [12, 6]], col, { round: 4, paint: (g) => { g.fillStyle = 'rgba(20,12,8,.9)'; g.beginPath(); g.arc(26, -50, 1.6, 0, 7); g.fill(); } })
    .piece([[-4, -20], [6, -48], [18, -60], [16, -52], [6, -36], [2, -16]], shade(col, -0.4), { round: 2, rough: 1.4, lift: 0.8 }).piece([[20, -60], [22, -68], [26, -60]], col, { round: 1, lift: 0.6 }).finish({ shadowBlur: 2 });
  return P;
}
export function drawHorse(g, P, t, e, env, gait = 'walk', ph0 = 0) {
  const pace = gait === 'gallop' ? 11 : gait === 'walk' ? 4.4 : 0, ph = t * pace + ph0, amp = gait === 'gallop' ? 30 : gait === 'walk' ? 14 : 0;
  g.save(); g.translate(0, -56 - (gait === 'gallop' ? Math.abs(Math.sin(ph)) * 6 : 0));
  for (const [x, o, s] of [[-38, 0, 'B'], [30, Math.PI * (gait === 'gallop' ? 0.3 : 1), 'B'], [-30, Math.PI * (gait === 'gallop' ? 0.5 : 1), 'F'], [38, gait === 'gallop' ? 0.2 : 0, 'F']]) { g.save(); g.translate(x, 0); g.rotate(Math.sin(ph + o) * amp * DEG); put(g, P['leg' + s], env.sh, 2, 3); g.restore(); }
  put(g, P.body, env.sh, 3, 4);
  g.save(); g.translate(36, -28); g.rotate((Math.sin(ph) * (gait === 'gallop' ? 8 : 3) + fbm(t * 0.4 + e.a, 2) * 4) * DEG); put(g, P.neck, env.sh * 0.6); g.restore();
  g.restore();
}
KINDS.horse = {
  bake(mk, v = 0) { return bakeHorse(mk, 'h' + v, ['#8a5a3a', '#c9b08a', '#3a2c26', '#a87a4a'][v % 4]); },
  draw(g, P, t, e, env) { drawHorse(g, P, t, e, env, e.gait || (e.move ? 'walk' : 'stand'), e.a); },
};
// A war chariot: two horses, a box on big spoked wheels, a driver and a warrior with a dagger-axe.
KINDS.chariot = {
  bake(mk, v = 0) {
    const P = { h1: bakeHorse(mk, 'c1' + v, '#8a5a3a'), h2: bakeHorse(mk, 'c2' + v, '#6a4430') };
    P.box = mk('chariot-box' + v, [-50, -60, 70, 8]).piece([[-40, -10], [36, -10], [38, -50], [-38, -50]], '#7a4a2a', { round: 2, paint: (g) => { g.strokeStyle = 'rgba(40,20,10,.5)'; g.lineWidth = 1.4; for (let x = -32; x < 36; x += 9) { g.beginPath(); g.moveTo(x, -10); g.lineTo(x, -48); g.stroke(); } } }).piece(strip(36, -18, 68, -40, 4, 3), '#5a3a22', { round: 1, lift: 1 }).finish({ shadowBlur: 3 });
    P.wheel = mk('chariot-wheel', [-34, -34, 34, 34], { pad: 4 }).piece(ellipse(0, 0, 32, 32, 26), '#5a3a22', { round: 6, paint: (g) => { g.fillStyle = 'rgba(0,0,0,0)'; } }).piece(ellipse(0, 0, 26, 26, 24), '#c8a878', { round: 6, lift: 0.4, paint: (g) => { g.strokeStyle = '#5a3a22'; g.lineWidth = 2; for (let k = 0; k < 18; k++) { const a = k * Math.PI / 9; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * 26, Math.sin(a) * 26); g.stroke(); } } }).piece(ellipse(0, 0, 5, 5, 10), '#4a2a18', { round: 1.5, lift: 1 }).finish({ shadowBlur: 2 });
    P.driver = KINDS.person.bake(mk, 'charioteer'); P.warrior = KINDS.person.bake(mk, 'zhouSoldier');
    return P;
  },
  draw(g, P, t, e, env) {
    const gait = e.gait || 'gallop', ph = t * 11;
    g.save(); g.translate(150, 0); drawHorse(g, P.h2, t, e, env, gait, 1.2); g.restore();
    g.save(); g.translate(130, 4); drawHorse(g, P.h1, t, e, env, gait, 0); g.restore();
    const bob = Math.abs(Math.sin(ph)) * 2;
    g.save(); g.translate(0, -36 - bob);
    g.save(); g.translate(-14, -40); drawPerson(g, P.warrior, t, e, env, { lean: 4, head: 0, back: [-30, -20], front: [-60 + Math.sin(t * 1.4) * 10, -40] }); g.restore();
    g.save(); g.translate(18, -40); drawPerson(g, P.driver, t, e, env, { lean: 10, head: -4, back: [-60, -30], front: [-70, -30] }); g.restore();
    put(g, P.box, env.sh, 3, 4);
    g.restore();
    const d = e.move ? e.move(t) * DEG * 1000 : t * 30;
    g.save(); g.translate(0, -32); g.rotate(d / 32); put(g, P.wheel, env.sh * 0.5); g.restore();
  },
};
// The apricot tree Confucius was said to teach under, in blossom.
KINDS.apricot = {
  bake(mk, v = 0) {
    const r = rng(2400 + v), sh = mk('apricot' + v, [-100, -220, 100, 6]);
    sh.piece([[-8, 2], [-6, -70], [-40, -120], [-70, -138], [-64, -144], [-34, -128], [-4, -100], [2, -170], [8, -170], [8, -110], [44, -140], [74, -150], [72, -142], [40, -124], [12, -76], [10, 2]], '#4a3428', { round: 2, paint: (g) => dab(g, r, 20, [-10, -160, 10, 0], ['rgba(20,12,8,.4)'], 8, 1.6) });
    for (const [x, y, rr] of [[-60, -150, 40], [56, -158, 42], [0, -184, 50], [-24, -140, 34], [26, -136, 34]]) sh.piece(ellipse(x, y, rr, rr * 0.7, 14), '#f2d6d6', { round: 8, rough: 2, seg: 10, lift: 1.4, paint: (g) => { for (let i = 0; i < 40; i++) { g.fillStyle = r() < 0.5 ? 'rgba(220,130,150,.6)' : 'rgba(255,245,245,.7)'; g.beginPath(); g.arc(x + (r() - 0.5) * rr * 1.8, y + (r() - 0.5) * rr * 1.3, 2 + r() * 2.4, 0, 7); g.fill(); } } });
    return { spr: sh.finish() };
  },
  draw(g, P, t, e, env) { g.rotate(sway(t, e, 0.8)); put(g, P.spr, env.sh); },
};
// An ox, walking slowly; e.rider: a look for someone riding it (Laozi, in the legend, rode west on one).
KINDS.ox = {
  bake(mk, v = 0) {
    const c = ['#6a5a4a', '#8a6a4a'][v % 2], P = {};
    for (const s of ['F', 'B']) P['leg' + s] = mk('ox-leg' + s + v, [-8, -6, 10, 46]).piece([[-6, -4], [6, -4], [5, 38], [6, 44], [-5, 44], [-4, 22]], s === 'B' ? shade(c, -0.18) : c, { round: 2.5 }).finish({ shadowBlur: 2 });
    P.body = mk('ox-body' + v, [-70, -56, 56, 10]).piece([[-62, -6], [-64, -32], [-44, -48], [20, -50], [44, -40], [50, -18], [40, 4], [-50, 6]], c, { round: 10, paint: (g) => { g.fillStyle = rgb(shade(c, 0.2), 0.35); g.beginPath(); g.ellipse(-10, -40, 34, 6, 0, 0, 7); g.fill(); } }).piece([[-60, -28], [-72, -10], [-68, -8], [-58, -20]], c, { round: 1, lift: 0.8 }).finish();
    P.head = mk('ox-head' + v, [-10, -30, 40, 22]).piece([[-6, -8], [10, -14], [26, -8], [34, 6], [26, 16], [10, 12], [-4, 6]], shade(c, -0.05), { round: 5, paint: (g) => { g.fillStyle = 'rgba(15,10,10,.9)'; g.beginPath(); g.arc(16, -4, 1.5, 0, 7); g.fill(); } }).piece([[2, -10], [-2, -22], [6, -28], [8, -20], [6, -12]], '#e0d6c0', { round: 2, lift: 1 }).finish({ shadowBlur: 3 });
    if (LOOKS.laozi) P.rider = KINDS.person.bake(mk, 'laozi');
    return P;
  },
  draw(g, P, t, e, env) {
    const walk = e.move ? 1 : 0, ph = t * 2.6 + e.a;
    g.save(); g.translate(0, -44);
    for (const [x, o, s] of [[-44, 0, 'B'], [30, Math.PI, 'B'], [-36, Math.PI, 'F'], [38, 0, 'F']]) { g.save(); g.translate(x, 0); g.rotate(Math.sin(ph + o) * 12 * walk * DEG); put(g, P['leg' + s], env.sh, 2, 3); g.restore(); }
    g.translate(0, Math.abs(Math.cos(ph)) * 1.4 * walk); put(g, P.body, env.sh, 3, 4);
    g.save(); g.translate(46, -26); g.rotate((fbm(t * 0.3 + e.a, 5) * 6 + 10) * DEG); put(g, P.head, env.sh * 0.6); g.restore();
    if (e.rider && P.rider) { g.save(); g.translate(-8, -40); drawPerson(g, P.rider, t, e, env, { lean: 2 + Math.sin(ph) * 2, head: fbm(t * 0.3, 7) * 4, back: [-20, -10], front: [-40, -50] }); g.restore(); }
    g.restore();
  },
};
// A ledge of rock, a thin fall of water, and below it a stone worn hollow.
KINDS.waterfall = {
  bake(mk) {
    const r = rng(2500), P = {};
    P.rock = mk('wf-rock', [-90, -170, 90, 6]).piece([[-86, 4], [-80, -60], [-66, -120], [-40, -160], [-6, -166], [4, -140], [-10, -100], [-4, -60], [10, -40], [40, -36], [70, -20], [86, 4]], '#7a7468', { round: 6, rough: 2, paint: (g) => { dab(g, r, 60, [-80, -160, 80, 0], ['rgba(40,40,36,.35)', 'rgba(200,196,186,.25)', 'rgba(70,100,60,.4)'], 8, 3); } })
      .piece([[20, 4], [22, -14], [46, -22], [70, -12], [74, 4]], '#8a847a', { round: 6, lift: 1.4, paint: (g) => { g.fillStyle = 'rgba(40,40,36,.5)'; g.beginPath(); g.ellipse(46, -19, 10, 3.4, 0, 0, 7); g.fill(); } })
      .finish({ shadowBlur: 5 });
    return P;
  },
  draw(g, P, t, e, env) {
    put(g, P.rock, env.sh, 3, 4);
    // the fall: a few ribbons of white paper water sliding down
    g.save(); g.lineCap = 'round';
    for (let i = 0; i < 4; i++) { g.strokeStyle = `rgba(${210 + i * 10},${230 + i * 6},245,.85)`; g.lineWidth = 3 - i * 0.5; g.setLineDash([14, 10]); g.lineDashOffset = -t * 60 - i * 9; g.beginPath(); g.moveTo(2 + i * 2, -150); g.quadraticCurveTo(30 + i * 3, -120, 44 + i * 1.5, -22); g.stroke(); }
    g.setLineDash([]); for (let i = 0; i < 6; i++) { const k = ((t * 1.6 + i / 6) % 1); g.fillStyle = `rgba(230,240,250,${0.7 * (1 - k)})`; g.beginPath(); g.arc(46 + Math.cos(i * 2.1) * k * 18, -22 - Math.sin(i * 1.3 + 1) * k * 12, 2 * (1 - k) + 0.6, 0, 7); g.fill(); }
    g.restore();
  },
};
// A gnarled pine with flat, layered pads of needles, the tree of a thousand ink paintings.
KINDS.pine = {
  bake(mk, v = 0) {
    const r = rng(2600 + v), h = 190 + v * 20, sh = mk('pine' + v, [-110, -h - 40, 110, 6]);
    sh.piece([[-8, 2], [-4, -h * 0.4], [-14, -h * 0.6], [-6, -h * 0.66], [2, -h * 0.5], [6, -h * 0.8], [-2, -h], [6, -h], [14, -h * 0.78], [12, -h * 0.5], [30, -h * 0.66], [36, -h * 0.62], [16, -h * 0.4], [10, 2]], '#5a4434', { round: 2, paint: (g) => dab(g, r, 30, [-14, -h, 30, 0], ['rgba(30,20,14,.4)', 'rgba(160,130,100,.25)'], 8, 1.6) });
    for (const [x, y, w] of [[-34, -h * 0.62, 50], [40, -h * 0.66, 46], [4, -h * 0.86, 56], [-20, -h * 1.02, 38], [26, -h * 1.0, 32]]) sh.piece([[x - w, y + 4], [x - w * 0.7, y - 12], [x - w * 0.2, y - 18], [x + w * 0.4, y - 16], [x + w, y - 4], [x + w * 0.6, y + 6], [x - w * 0.5, y + 7]], '#3f5a44', { round: 5, rough: 1.8, seg: 10, lift: 1.4, paint: (g) => dab(g, r, 30, [x - w, y - 16, x + w, y + 4], ['rgba(90,130,90,.45)', 'rgba(20,40,26,.4)'], 6, 1.6) });
    return { spr: sh.finish() };
  },
  draw(g, P, t, e, env) { g.rotate(sway(t, e, 0.7)); put(g, P.spr, env.sh); },
};

// ========================================================== imperial China ===
// A timber hall with a curved, upswept roof on a terrace: one plan, dressed for each dynasty.
// v0 Qin, v1 Han, v2 Tang, v3 Song, v4 Ming/Qing palace (yellow tiles, double eaves), v5 a green-tiled temple, v6 a plain grey house.
const HALLS = [
  { tile: '#3a3a40', col: '#2a1c18', wall: '#c8b48a', base: '#a8865a', w: 120, h: 92, eave: 28, dbl: 0, trim: '#a8282a' },
  { tile: '#4a4a50', col: '#a8322a', wall: '#dccca4', base: '#a89a84', w: 130, h: 96, eave: 30, dbl: 0, trim: '#2a2a2e' },
  { tile: '#56605a', col: '#b8382a', wall: '#ece0c4', base: '#b0a48c', w: 150, h: 92, eave: 38, dbl: 0, trim: '#e8dcc0' },
  { tile: '#3f5a58', col: '#a8402e', wall: '#e8dcc0', base: '#a8a090', w: 120, h: 100, eave: 32, dbl: 0, trim: '#4a7a6a' },
  { tile: '#e0a438', col: '#a8282a', wall: '#a8282a', base: '#e8e4da', w: 160, h: 104, eave: 34, dbl: 1, trim: '#2f6a6a' },
  { tile: '#3f6a52', col: '#a8282a', wall: '#d8c8a8', base: '#b0a898', w: 96, h: 84, eave: 26, dbl: 0, trim: '#e0a438' },
  { tile: '#4a4a50', col: '#5a4434', wall: '#e8e2d4', base: '#9a9488', w: 80, h: 70, eave: 20, dbl: 0, trim: '#3a3a40' },
];
export function roofPts(w, y0, rise, eave, tip) {
  const pts = [];
  // underside: an eave line that sweeps up at both corners
  for (let i = 0; i <= 12; i++) { const f = i / 12, x = -w - eave + f * (w + eave) * 2, up = Math.pow(Math.abs(f * 2 - 1), 3); pts.push([x, y0 - up * tip]); }
  // the slope above it, concave, up to the ridge
  for (let i = 0; i <= 8; i++) { const f = i / 8, x = (w + eave) * (1 - f) + w * 0.42 * f, y = y0 - tip - rise * (1 - (1 - f) * (1 - f)); pts.push([x, y]); }
  for (let i = 0; i <= 8; i++) { const f = i / 8, x = -(w * 0.42 * (1 - f) + (w + eave) * f), y = y0 - tip - rise * (1 - f * f); pts.push([x, y]); }
  return pts;
}
KINDS.hall = {
  bake(mk, v = 0) {
    const H = HALLS[v % HALLS.length], r = rng(2700 + v), { w, h, eave } = H, base = v === 4 ? 30 : 18;
    const sh = mk('hall' + v, [-w - eave - 30, -base - h - (H.dbl ? 130 : 90), w + eave + 30, 6]);
    // terrace and steps
    sh.piece([[-w - 16, 4], [-w - 12, -base], [w + 12, -base], [w + 16, 4]], H.base, { round: 2, paint: (g) => { g.strokeStyle = 'rgba(60,50,40,.3)'; g.lineWidth = 1; for (let y = -6; y > -base; y -= 6) { g.beginPath(); g.moveTo(-w - 14, y); g.lineTo(w + 14, y); g.stroke(); } if (v === 4) { g.fillStyle = 'rgba(160,150,140,.6)'; for (let x = -w - 8; x < w + 10; x += 12) g.fillRect(x, -base - 1, 3, -9); g.fillRect(-w - 12, -base - 10, w * 2 + 24, 2.5); } } });
    sh.piece([[-22, 4], [-16, -base], [16, -base], [22, 4]], shade(H.base, -0.08), { round: 1, lift: 1, paint: (g) => { g.strokeStyle = 'rgba(40,30,20,.35)'; g.lineWidth = 1; for (let y = 0; y > -base; y -= 4) { g.beginPath(); g.moveTo(-20, y); g.lineTo(20, y); g.stroke(); } } });
    // the body: columns, lattice doors and windows
    const yb = -base, yt = -base - h, win = [];
    for (let x = -w + 18; x < w - 18; x += 34) if (Math.abs(x + 9) > 20) win.push([x + 4, yt + 18, 18, h - 26]);
    win.push([-12, yt + 14, 24, h - 14]);
    sh.piece(rect(-w, yb, w, yt), H.wall, { round: 1.5, lift: 1.2, paint: (g) => {
      for (const [x, y, ww, hh] of win) { g.fillStyle = 'rgba(40,24,16,.82)'; g.fillRect(x, y, ww, hh); g.strokeStyle = 'rgba(200,170,110,.55)'; g.lineWidth = 0.8; for (let yy = y + 4; yy < y + hh; yy += 5) { g.beginPath(); g.moveTo(x, yy); g.lineTo(x + ww, yy); g.stroke(); } for (let xx = x + 4; xx < x + ww; xx += 5) { g.beginPath(); g.moveTo(xx, y); g.lineTo(xx, y + hh); g.stroke(); } }
      g.fillStyle = H.col; for (let x = -w; x <= w - 6; x += 34) g.fillRect(x, yt, 7, h);
      g.fillStyle = H.trim; g.fillRect(-w, yt, w * 2, 8); g.fillStyle = 'rgba(255,240,200,.25)'; for (let x = -w + 6; x < w; x += 14) g.fillRect(x, yt + 2, 6, 3);
    } });
    // brackets, then the roof (twice for a palace)
    sh.piece(rect(-w - 4, yt + 2, w + 4, yt - 12), shade(H.col, -0.1), { round: 1, lift: 1, paint: (g) => { g.fillStyle = H.trim; for (let x = -w; x < w; x += 12) g.fillRect(x, yt - 10, 7, 8); } });
    const roof = (y0, ww, rise, ev, tip, col) => sh.piece(roofPts(ww, y0, rise, ev, tip), col, { round: 2.4, rough: 0.8, lift: 2, paint: (g) => { g.strokeStyle = rgb(shade(col, -0.35), 0.5); g.lineWidth = 1.2; for (let x = -ww - ev; x < ww + ev; x += 6) { g.beginPath(); g.moveTo(x * 0.5, y0 - tip - rise); g.lineTo(x, y0 + 2); g.stroke(); } g.fillStyle = rgb(shade(col, 0.25), 0.35); g.fillRect(-ww - ev, y0 - 4, (ww + ev) * 2, 3); } });
    if (H.dbl) { roof(yt - 10, w + 8, 18, eave, 12, H.tile); sh.piece(rect(-w * 0.7, yt - 36, w * 0.7, yt - 62), H.wall, { round: 1, lift: 1.2, paint: (g) => { g.fillStyle = H.col; for (let x = -w * 0.7; x < w * 0.7; x += 22) g.fillRect(x, yt - 62, 5, 26); g.fillStyle = H.trim; g.fillRect(-w * 0.7, yt - 62, w * 1.4, 6); } }); roof(yt - 58, w * 0.72, 40, eave * 0.9, 12, H.tile); }
    else roof(yt - 10, w, 54, eave, 16, H.tile);
    const ry = H.dbl ? yt - 58 - 12 - 40 : yt - 10 - 16 - 54;
    const rw = (H.dbl ? w * 0.72 : w) * 0.42;
    sh.piece(rect(-rw - 4, ry + 3, rw + 4, ry - 7), shade(H.tile, -0.25), { round: 1.5, lift: 1.2 });
    for (const s of [-1, 1]) sh.piece([[s * rw, ry + 3], [s * (rw + 6), ry - 14], [s * (rw - 2), ry - 18], [s * (rw - 8), ry - 6]], shade(H.tile, -0.3), { round: 1.5, lift: 1 });
    return { spr: sh.finish({ shadowBlur: 7 }), windows: win };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 4, 5); },
  glow: glowRects,
};
// The Qin wall: pounded earth, tamped in layers between boards. Short pieces, so the wall bends with the hills.
KINDS.earthwall = {
  bake(mk, v = 0) {
    const r = rng(2800 + v), c = v === 1 ? '#8a8a8e' : '#b8955e', sh = mk('earthwall' + v, [-44, -80, 44, 6]);
    if (v === 1) sh.piece([[-42, 4], [-40, -54], [-36, -54], [-36, -66], [-24, -66], [-24, -54], [-12, -54], [-12, -66], [0, -66], [0, -54], [12, -54], [12, -66], [24, -66], [24, -54], [36, -54], [36, -66], [40, -66], [42, 4]], c, { round: 1.2, rough: 0.6, paint: (g) => { g.strokeStyle = 'rgba(50,50,56,.35)'; g.lineWidth = 0.8; let row = 0; for (let y = 2; y > -54; y -= 6, row++) { g.beginPath(); g.moveTo(-42, y); g.lineTo(42, y); g.stroke(); for (let x = -42 + (row % 2) * 6; x < 42; x += 12) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 6); g.stroke(); } } } });
    else sh.piece([[-42, 4], [-38, -50], [-30, -54], [30, -54], [38, -50], [42, 4]], c, { round: 2.4, rough: 1.4, paint: (g) => { g.strokeStyle = 'rgba(90,62,30,.35)'; g.lineWidth = 1.2; for (let y = 0; y > -54; y -= 5) { g.beginPath(); g.moveTo(-42, y); g.lineTo(42, y + (r() - 0.5)); g.stroke(); } } });
    return { spr: sh.finish({ shadowBlur: 3 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 2, 3); },
};
// A beacon tower: smoke by day, fire by night, passed from tower to tower.
KINDS.beacon = {
  bake(mk, v = 0) {
    const c = v === 1 ? '#8a8a8e' : '#b0905a', sh = mk('beacon' + v, [-40, -150, 40, 6]);
    sh.piece([[-34, 4], [-28, -116], [28, -116], [34, 4]], c, { round: 2, paint: (g) => { g.strokeStyle = 'rgba(70,50,30,.3)'; g.lineWidth = 1; for (let y = 0; y > -116; y -= 6) { g.beginPath(); g.moveTo(-34, y); g.lineTo(34, y); g.stroke(); } g.fillStyle = 'rgba(30,20,14,.8)'; g.fillRect(-6, -30, 12, 34); } });
    sh.piece([[-32, -114], [-32, -130], [-24, -130], [-24, -122], [-8, -122], [-8, -130], [8, -130], [8, -122], [24, -122], [24, -130], [32, -130], [32, -114]], shade(c, -0.06), { round: 1, lift: 1.2 });
    return { spr: sh.finish({ shadowBlur: 4 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 3, 4); },
};
// A terracotta warrior: v0 an infantryman, v1 a kneeling archer, v2 an officer, v3 a general. Each face is its own.
KINDS.terracotta = {
  bake(mk, v = 0) {
    const r = rng(2900 + v * 7), c = ['#a8907a', '#9a8470', '#b09880', '#a08a74'][v % 4], cd = shade(c, -0.15), sh = mk('tc' + v, [-30, -150, 30, 6]);
    const kneel = v === 1, base = kneel ? -40 : 0;
    sh.piece([[-16, 4], [16, 4], [16, -6], [-16, -6]], shade(c, -0.25), { round: 1 });
    if (!kneel) { sh.piece([[-12, -6], [-3, -6], [-4, -50], [-12, -50]], cd, { round: 2 }); sh.piece([[3, -6], [12, -6], [12, -50], [4, -50]], c, { round: 2 }); }
    else sh.piece([[-16, -6], [20, -6], [22, -22], [-4, -26], [-6, -44], [-16, -40]], cd, { round: 3 });
    const y0 = kneel ? -40 : -50;
    sh.piece([[-15, y0 + 2], [15, y0 + 2], [17, y0 - 50], [10, y0 - 58], [-10, y0 - 58], [-17, y0 - 50]], c, { round: 4, lift: 1.4, paint: (g) => { g.strokeStyle = 'rgba(70,50,36,.45)'; g.lineWidth = 1; for (let y = y0 - 4; y > y0 - 48; y -= 6) { g.beginPath(); g.moveTo(-15, y); g.lineTo(15, y); g.stroke(); for (let x = -14 + (((y / 6) | 0) % 2) * 4; x < 15; x += 8) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 6); g.stroke(); } } g.fillStyle = 'rgba(160,60,50,.25)'; g.fillRect(-15, y0 - 52, 30, 4); } });
    sh.piece([[-8, y0 - 56], [8, y0 - 56], [7, y0 - 62], [-7, y0 - 62]], cd, { round: 1, lift: 1 });
    // the head: its own nose, beard, moustache and hair
    const hy = y0 - 62, nose = 10 + r() * 3, beard = r() < 0.6, tache = r() < 0.7;
    sh.piece([[-9, hy], [6, hy], [9, hy - 6], [nose, hy - 12], [9, hy - 15], [9, hy - 22], [2, hy - 26], [-8, hy - 24], [-11, hy - 14]], shade(c, 0.06), { round: 3, lift: 1.2, paint: (g) => { g.fillStyle = 'rgba(40,26,18,.8)'; g.beginPath(); g.arc(4.5, hy - 15, 1, 0, 7); g.fill(); if (tache) { g.strokeStyle = 'rgba(60,40,28,.7)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(3, hy - 9); g.quadraticCurveTo(7, hy - 10, 10, hy - 7); g.stroke(); } if (beard) { g.fillStyle = 'rgba(80,58,40,.5)'; g.beginPath(); g.moveTo(-2, hy - 4); g.lineTo(6, hy - 3); g.lineTo(2, hy + 2); g.fill(); } } });
    if (v === 2 || v === 3) sh.piece([[-10, hy - 22], [-12, hy - 34], [4, hy - 36], [8, hy - 26]], cd, { round: 2, lift: 1 });
    else sh.piece(ellipse(-6, hy - 24, 5, 4.4, 10), cd, { round: 2, lift: 1 });
    // arms
    sh.piece(strip(-12, y0 - 52, kneel ? 6 : -14, y0 - 20, 7, 6), shade(c, 0.03), { round: 2, lift: 1.4 });
    if (v === 3) sh.piece([[-10, y0 - 12], [10, y0 - 12], [8, y0 - 26], [-8, y0 - 26]], shade(c, 0.1), { round: 2, lift: 1.6 });
    return { spr: sh.finish({ shadowBlur: 3 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 2, 3); },
};
KINDS.tchorse = {
  bake(mk) {
    const c = '#9a8470', cd = shade(c, -0.16), sh = mk('tchorse', [-70, -130, 70, 6]);
    for (const [x, col] of [[-40, cd], [30, cd], [-32, c], [38, c]]) sh.piece([[x - 6, 4], [x + 6, 4], [x + 5, -56], [x - 5, -56]], col, { round: 2 });
    sh.piece([[-54, -58], [-50, -84], [-20, -90], [30, -90], [48, -78], [50, -54], [-48, -50]], c, { round: 8, lift: 1.4 });
    sh.piece([[30, -86], [42, -116], [56, -124], [64, -112], [52, -100], [48, -80]], c, { round: 4, lift: 1.6, paint: (g) => { g.fillStyle = 'rgba(40,26,18,.8)'; g.beginPath(); g.arc(54, -116, 1.4, 0, 7); g.fill(); } });
    sh.piece([[38, -100], [44, -124], [50, -126], [46, -104]], cd, { round: 1, lift: 1 });
    sh.piece([[-54, -74], [-64, -50], [-58, -48], [-50, -66]], cd, { round: 2, lift: 1 });
    return { spr: sh.finish({ shadowBlur: 4 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 3, 4); },
};
// A two-wheeled cart drawn by a horse; its axle as wide as everyone else's.
KINDS.cart = {
  bake(mk, v = 0) {
    const P = { h: bakeHorse(mk, 'cart' + v, ['#8a5a3a', '#a87a4a'][v % 2]) };
    P.box = mk('cart-box' + v, [-60, -70, 90, 8]).piece([[-50, -20], [40, -20], [44, -50], [-54, -50]], '#8a6a44', { round: 2, paint: (g) => { g.strokeStyle = 'rgba(50,30,15,.5)'; g.lineWidth = 1.2; for (let x = -46; x < 40; x += 10) { g.beginPath(); g.moveTo(x, -20); g.lineTo(x, -48); g.stroke(); } } }).piece(strip(40, -28, 86, -46, 3.4, 3), '#5a3a22', { round: 1, lift: 1 }).piece([[-44, -50], [36, -50], [30, -66], [-36, -66]], '#c9a878', { round: 4, lift: 1.4 }).finish({ shadowBlur: 3 });
    P.wheel = mk('cart-wheel', [-26, -26, 26, 26], { pad: 4 }).piece(ellipse(0, 0, 24, 24, 22), '#5a3a22', { round: 5 }).piece(ellipse(0, 0, 19, 19, 20), '#b89868', { round: 5, lift: 0.4, paint: (g) => { g.strokeStyle = '#5a3a22'; g.lineWidth = 2; for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * 19, Math.sin(a) * 19); g.stroke(); } } }).finish({ shadowBlur: 2 });
    return P;
  },
  draw(g, P, t, e, env) {
    g.save(); g.translate(132, 0); drawHorse(g, P.h, t, e, env, e.move ? 'walk' : 'stand', 0); g.restore();
    g.save(); g.translate(0, -14 + Math.abs(Math.sin(t * 4.4)) * 1); put(g, P.box, env.sh, 3, 4); g.restore();
    const d = e.move ? e.move(t) * DEG * 1000 : 0; g.save(); g.translate(-6, -24); g.rotate(d / 24); put(g, P.wheel, env.sh * 0.5); g.restore();
  },
};

// ======================================================= Han and the Silk Road ===
// Que: a pair of gate towers either side of a palace road.
KINDS.que = {
  bake(mk, v = 0) {
    const sh = mk('que' + v, [-60, -230, 60, 6]), c = '#c8b896', tile = '#4a4a50';
    sh.piece([[-36, 4], [-32, -150], [32, -150], [36, 4]], c, { round: 2, paint: (g) => { g.strokeStyle = 'rgba(80,60,40,.3)'; g.lineWidth = 1; for (let y = -10; y > -150; y -= 12) { g.beginPath(); g.moveTo(-34, y); g.lineTo(34, y); g.stroke(); } g.fillStyle = '#a8322a'; g.fillRect(-32, -150, 64, 8); } });
    sh.piece(roofPts(34, -150, 22, 16, 8), tile, { round: 2, lift: 1.6 });
    sh.piece(rect(-22, -176, 22, -196), c, { round: 1.5, lift: 1.2, paint: (g) => { g.fillStyle = '#a8322a'; g.fillRect(-22, -196, 44, 5); } });
    sh.piece(roofPts(22, -196, 18, 12, 6), tile, { round: 2, lift: 1.6 });
    return { spr: sh.finish({ shadowBlur: 5 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 3, 4); },
};
// A red paper lantern on a post; e.lit(t) 0..1.
KINDS.redlantern = {
  bake(mk) {
    return { spr: mk('redlantern', [-24, -150, 24, 6]).piece(strip(0, 4, 0, -140, 4, 3), '#4a3423', { round: 1 }).piece(strip(0, -136, 18, -136, 2.4, 2), '#4a3423', { round: 0.6, lift: 0.8 })
      .piece(ellipse(16, -112, 11, 14, 14), '#c8322a', { round: 3, lift: 1, paint: (g) => { g.strokeStyle = 'rgba(90,20,10,.5)'; g.lineWidth = 0.8; for (const x of [11, 16, 21]) { g.beginPath(); g.moveTo(x, -126); g.lineTo(x, -98); g.stroke(); } } })
      .piece(rect(11, -128, 21, -125), '#c9a24a', { round: 0.5, lift: 0.6 }).piece(rect(11, -99, 21, -96), '#c9a24a', { round: 0.5, lift: 0.6 }).piece([[14, -96], [18, -96], [17, -88], [15, -88]], '#d8a040', { round: 0.4, lift: 0.4 })
      .finish({ shadowBlur: 3 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh); },
  glow(g, P, t, e, env, p) {
    const k = e.lit ? e.lit(t) : 0; if (k < 0.01 || p < 0.6) return;
    g.globalCompositeOperation = 'lighter';
    const gr = g.createRadialGradient(16, -112, 0, 16, -112, 44); gr.addColorStop(0, `rgba(255,170,90,${0.95 * k})`); gr.addColorStop(0.25, `rgba(255,90,50,${0.5 * k})`); gr.addColorStop(1, 'rgba(255,60,30,0)');
    g.fillStyle = gr; g.fillRect(-28, -156, 88, 88); g.globalCompositeOperation = 'source-over';
  },
};
// A fortress gate of pounded earth on the edge of the desert (the Jade Gate).
KINDS.yumen = {
  bake(mk) {
    const r = rng(3000), sh = mk('yumen', [-100, -150, 100, 6]);
    sh.piece([[-90, 4], [-84, -120], [84, -120], [90, 4]], '#c4a272', { round: 3, rough: 1.6, paint: (g) => { g.strokeStyle = 'rgba(110,80,40,.35)'; g.lineWidth = 1.2; for (let y = 0; y > -120; y -= 6) { g.beginPath(); g.moveTo(-90, y); g.lineTo(90, y + (r() - 0.5)); g.stroke(); } g.fillStyle = 'rgba(40,26,14,.88)'; g.beginPath(); g.moveTo(-18, 4); g.lineTo(-18, -54); g.lineTo(0, -66); g.lineTo(18, -54); g.lineTo(18, 4); g.fill(); g.fillStyle = 'rgba(40,26,14,.6)'; g.fillRect(-60, -96, 10, 16); g.fillRect(50, -96, 10, 16); } });
    sh.piece([[-88, -118], [-88, -136], [-72, -136], [-72, -126], [-48, -126], [-48, -136], [-32, -136], [-32, -126], [-8, -126], [-8, -136], [8, -136], [8, -126], [32, -126], [32, -136], [48, -136], [48, -126], [72, -126], [72, -136], [88, -136], [88, -118]], '#b8966a', { round: 1.5, lift: 1.2 });
    return { spr: sh.finish({ shadowBlur: 6 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 4, 5); },
};
// Making paper: a vat of pulp, a mould lifted out with a wet sheet on it; and a wall of drying sheets.
KINDS.papervat = {
  bake(mk) {
    return { spr: mk('papervat', [-60, -60, 60, 6]).piece([[-54, 4], [-50, -46], [50, -46], [54, 4]], '#7a5a3a', { round: 3, paint: (g) => { g.strokeStyle = 'rgba(40,24,12,.5)'; g.lineWidth = 1.4; for (const y of [-34, -12]) { g.beginPath(); g.moveTo(-52, y); g.lineTo(52, y); g.stroke(); } } })
      .piece(ellipse(0, -46, 50, 6, 16), '#d8d0b8', { round: 2, lift: 0.8, paint: (g) => { g.fillStyle = 'rgba(160,150,120,.4)'; for (let i = 0; i < 20; i++) { g.beginPath(); g.arc(-44 + Math.random() * 88, -48 + Math.random() * 4, 1.4, 0, 7); g.fill(); } } }).finish({ shadowBlur: 4 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 3, 4); },
};
KINDS.dryingwall = {
  bake(mk, v = 0) {
    const r = rng(3100 + v), sh = mk('dryingwall' + v, [-90, -140, 90, 6]);
    sh.piece([[-86, 4], [-84, -110], [84, -110], [86, 4]], '#b8a888', { round: 2, paint: (g) => { g.strokeStyle = 'rgba(80,60,40,.3)'; g.lineWidth = 1; for (let y = -10; y > -110; y -= 10) { g.beginPath(); g.moveTo(-86, y); g.lineTo(86, y); g.stroke(); } } });
    sh.piece(roofPts(84, -110, 14, 10, 5), '#5a5a5e', { round: 2, lift: 1.4 });
    for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) { const x = -70 + i * 26, y = -96 + j * 46; sh.piece([[x, y], [x + 22, y + (r() - 0.5) * 2], [x + 22, y + 36], [x, y + 36]], '#f2eadb', { round: 1, rough: 0.5, lift: 1.2, thick: 0.6, rim: 0.3 }); }
    return { spr: sh.finish({ shadowBlur: 4 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 3, 4); },
};
// Someone dipping a bamboo mould into the vat and lifting out a sheet.
KINDS.papermaker = {
  bake(mk) { const P = KINDS.person.bake(mk, 'papermaker'); P.mould = mk('mould', [-30, -4, 30, 4], { pad: 4 }).piece(rect(-28, -3, 28, 3), '#8a6a3a', { round: 1 }).piece(rect(-25, -2.6, 25, 0.4), '#f4eedf', { round: 0.4, lift: 0.4 }).finish({ shadowBlur: 2 }); return P; },
  draw(g, P, t, e, env) {
    const cyc = ((t - (e.t0 ?? 0)) % 4) / 4, dip = Math.sin(cyc * Math.PI * 2) * 0.5 + 0.5, hold = e.hold ? e.hold(t) : 0;
    const my = lerp(-30 + dip * 18, -64, hold), mx = 26;
    const [b1, b2] = reach(mx - 20 + 3, my + 35), [a1, a2] = reach(mx + 14 - 2, my + 34.5);
    drawPerson(g, P, t, e, env, { lean: 18 - hold * 14 + dip * 6, head: 18 - hold * 14, back: [b1, b2], front: [a1, a2], held: (g2) => { g2.save(); g2.rotate(-a2 * DEG); g2.translate(0, -19); g2.rotate(-a1 * DEG); g2.translate(-2, 34.5); g2.translate(mx, my); g2.rotate(hold * -1.2); put(g2, P.mould, env.sh * 0.4); g2.restore(); } });
  },
};

// ============================================================ long divided ===
// A cliff carved with a great seated Buddha and rows of small ones; lamps can light the niches.
KINDS.cliffbuddha = {
  bake(mk) {
    const r = rng(3200), c = '#a89478', sh = mk('cliffbuddha', [-170, -330, 170, 6]), win = [];
    sh.piece([[-166, 4], [-160, -120], [-150, -230], [-120, -300], [-60, -322], [20, -326], [90, -306], [140, -250], [160, -150], [166, 4]], c, { round: 8, rough: 2.4, seg: 20, paint: (g) => {
      dab(g, r, 120, [-160, -320, 160, 0], ['rgba(70,56,40,.3)', 'rgba(230,214,190,.25)', 'rgba(90,110,70,.35)'], 10, 3);
      g.fillStyle = 'rgba(50,38,26,.75)'; g.beginPath(); g.moveTo(-70, 4); g.lineTo(-70, -190); g.quadraticCurveTo(0, -270, 70, -190); g.lineTo(70, 4); g.fill();
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { for (const s of [-1, 1]) { const x = s * (96 + i * 0 + j * 20) - (s < 0 ? 18 : 0), y = -60 - i * 50; if (Math.abs(x) > 150 || y < -250) continue; g.fillStyle = 'rgba(50,38,26,.8)'; g.fillRect(x, y, 18, 26); win.push([x, y, 18, 26]); } }
    } });
    // the great Buddha in his niche: robe, folded hands, a calm face, the halo behind
    sh.piece(ellipse(0, -200, 40, 40, 20), '#c8b48a', { round: 6, lift: 1, paint: (g) => { g.strokeStyle = 'rgba(120,90,50,.5)'; g.lineWidth = 2; for (const rr of [24, 32]) { g.beginPath(); g.arc(0, -200, rr, 0, 7); g.stroke(); } } });
    sh.piece([[-56, 4], [-60, -40], [-48, -110], [-26, -150], [26, -150], [48, -110], [60, -40], [56, 4]], '#b8a27e', { round: 10, lift: 2, paint: (g) => { g.strokeStyle = 'rgba(90,70,46,.45)'; g.lineWidth = 1.6; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(-40 + k * 4, -130 + k * 8); g.quadraticCurveTo(0, -90 + k * 12, 40 - k * 4, -130 + k * 8); g.stroke(); } g.fillStyle = 'rgba(200,180,140,.6)'; g.beginPath(); g.ellipse(0, -40, 34, 10, 0, 0, 7); g.fill(); } });
    sh.piece([[-22, -150], [-24, -176], [-16, -200], [0, -206], [16, -200], [24, -176], [22, -150]], '#c8b48a', { round: 8, lift: 1.6, paint: (g) => { g.strokeStyle = 'rgba(80,60,40,.6)'; g.lineWidth = 1.2; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * 10, -178); g.quadraticCurveTo(s * 6, -176, s * 3, -178); g.stroke(); } g.beginPath(); g.moveTo(-4, -164); g.quadraticCurveTo(0, -162, 4, -164); g.stroke(); } });
    sh.piece(ellipse(0, -206, 16, 9, 14), '#7a6a50', { round: 4, lift: 1, paint: (g) => { g.fillStyle = 'rgba(40,30,20,.4)'; for (let i = 0; i < 12; i++) { g.beginPath(); g.arc(-12 + (i % 6) * 5, -210 + Math.floor(i / 6) * 5, 1.6, 0, 7); g.fill(); } } });
    return { spr: sh.finish({ shadowBlur: 7 }), windows: win };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 4, 5); },
  glow: glowRects,
};
// A sacred fig that grows from a seedling while you watch: e.grow(t) 0..1.
KINDS.bodhi = {
  bake(mk) { return KINDS.oak.bake(mk, 1); },
  draw(g, P, t, e, env) { const k = e.grow ? e.grow(t) : 1; if (k <= 0.01) return; g.scale(0.2 + 0.8 * k, 0.15 + 0.85 * k); g.rotate(fbm(t * 0.4 + e.a, 9) * DEG); put(g, P.spr, env.sh); },
};

// ================================================================ Sui and Tang ===
KINDS.willow = {
  bake(mk, v = 0) {
    const r = rng(3300 + v), sh = mk('willow' + v, [-80, -210, 80, 6]), P = { strands: [] };
    sh.piece([[-8, 2], [-5, -90], [-26, -150], [-20, -154], [0, -118], [4, -170], [10, -170], [9, -112], [30, -150], [36, -146], [12, -90], [10, 2]], '#4a3c30', { round: 2 });
    sh.piece(ellipse(0, -160, 60, 30, 16), '#6a8a4a', { round: 8, rough: 2, lift: 1.4, paint: (g) => dab(g, r, 40, [-56, -186, 56, -134], ['rgba(140,170,90,.5)', 'rgba(50,80,40,.45)'], 6, 1.6) });
    P.spr = sh.finish();
    for (let i = 0; i < 9; i++) { const x = -54 + i * 13.5, L = 70 + r() * 50; P.strands.push({ x, spr: mk('willow-s' + v + i, [-6, -4, 6, L + 4], { pad: 3 }).piece([[-1.6, 0], [1.6, 0], [2.6, L * 0.5], [0.6, L], [-1.4, L * 0.5]], i % 2 ? '#7a9a52' : '#8aa860', { round: 1, rough: 0.6, thick: 0.4, lift: 0.6 }).finish({ shadowBlur: 2 }), ph: r() * 9 }); }
    return P;
  },
  draw(g, P, t, e, env) {
    put(g, P.spr, env.sh);
    for (const s of P.strands) { g.save(); g.translate(s.x, -150 + Math.abs(s.x) * 0.2); g.rotate((Math.sin(t * 0.9 + s.ph) * 4 + fbm(t * 0.5 + s.ph, 3) * 5) * DEG); put(g, s.spr, env.sh * 0.5, 1, 2); g.restore(); }
  },
};
// A canal barge with a square sail and a load of grain sacks.
KINDS.barge = {
  bake(mk, v = 0) {
    const sh = mk('barge' + v, [-90, -150, 90, 12]);
    sh.piece([[-84, -20], [-74, 6], [70, 6], [86, -22], [70, -12], [-70, -12]], '#6a4a2e', { round: 3, paint: (g) => { g.strokeStyle = 'rgba(40,25,15,.5)'; g.lineWidth = 1; for (let y = -10; y < 6; y += 5) { g.beginPath(); g.moveTo(-76, y); g.lineTo(76, y); g.stroke(); } } });
    for (const x of [-40, -18, 4, 26]) sh.piece(ellipse(x, -22, 11, 9, 10), '#c8b080', { round: 3, lift: 1 });
    sh.piece(strip(44, -14, 46, -140, 3.4, 2.6), '#4a3423', { round: 1, lift: 1 });
    sh.piece([[20, -40], [72, -40], [70, -130], [22, -130]], v ? '#c8a878' : '#b8986a', { round: 2, lift: 2, paint: (g) => { g.strokeStyle = 'rgba(90,60,30,.45)'; g.lineWidth = 1.4; for (let y = -50; y > -130; y -= 12) { g.beginPath(); g.moveTo(20, y); g.lineTo(72, y); g.stroke(); } } });
    return { spr: sh.finish({ shadowBlur: 5 }) };
  },
  draw(g, P, t, e, env) { g.translate(0, Math.sin(t * 1.2 + e.a) * 2); g.rotate(Math.sin(t * 0.8 + e.a * 2) * 1.6 * DEG); put(g, P.spr, env.sh, 4, 5); },
};
// The examination cells: a long row of tiny rooms, a candidate in each, writing; candles at night.
KINDS.examcells = {
  bake(mk) {
    const r = rng(3400), sh = mk('examcells', [-160, -150, 160, 6]), win = [];
    sh.piece(rect(-156, 4, 156, -100), '#b8a88a', { round: 2, paint: (g) => {
      for (let i = 0; i < 9; i++) { const x = -148 + i * 33; g.fillStyle = 'rgba(40,28,20,.9)'; g.fillRect(x, -88, 26, 80); win.push([x, -88, 26, 80]);
        g.fillStyle = '#8a6a44'; g.fillRect(x + 2, -40, 22, 4);
        g.fillStyle = 'rgba(220,200,170,.85)'; g.beginPath(); g.arc(x + 12, -58, 5, 0, 7); g.fill(); g.fillRect(x + 7, -54, 10, 14);
        g.fillStyle = 'rgba(30,24,20,.9)'; g.fillRect(x + 7, -64, 10, 4);
        g.fillStyle = '#efe6cf'; g.fillRect(x + 3, -44, 14, 4);
        g.fillStyle = 'rgba(255,220,150,.9)'; g.fillRect(x + 20, -50, 2, 6); }
    } });
    sh.piece(roofPts(156, -100, 14, 14, 6), '#4a4a50', { round: 2, lift: 1.6 });
    sh.piece(rect(-30, -126, 30, -150), '#a8322a', { round: 1.5, lift: 1.2, paint: (g) => { glyph0(g); } });
    return { spr: sh.finish({ shadowBlur: 5 }), windows: win };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 3, 4); },
  glow: glowRects,
};
function glyph0(g) { g.strokeStyle = 'rgba(240,210,120,.9)'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(-18, -138); g.lineTo(-6, -138); g.moveTo(-12, -144); g.lineTo(-12, -132); g.moveTo(4, -144); g.lineTo(18, -144); g.lineTo(18, -132); g.lineTo(4, -132); g.closePath(); g.stroke(); }
// The Big Wild Goose Pagoda: square, of brick, seven storeys, each a little smaller.
KINDS.brickpagoda = {
  bake(mk) {
    const sh = mk('brickpagoda', [-70, -380, 70, 6]), c = '#b89a72';
    sh.piece(rect(-64, 4, 64, -30), shade(c, -0.1), { round: 2 });
    for (let i = 0; i < 7; i++) { const w = 54 - i * 5.4, y = -30 - i * 46, h = 40; sh.piece(rect(-w, y, w, y - h), shade(c, i % 2 ? 0.03 : -0.02), { round: 1.5, lift: 1.2, paint: (g) => { g.fillStyle = 'rgba(40,28,20,.85)'; g.beginPath(); g.moveTo(-6, y); g.lineTo(-6, y - 22); g.quadraticCurveTo(0, y - 30, 6, y - 22); g.lineTo(6, y); g.fill(); g.strokeStyle = 'rgba(90,64,40,.4)'; g.lineWidth = 0.8; for (let yy = y - 5; yy > y - h; yy -= 5) { g.beginPath(); g.moveTo(-w, yy); g.lineTo(w, yy); g.stroke(); } } }); sh.piece(rect(-w - 8, y - h, w + 8, y - h - 6), shade(c, -0.18), { round: 1, lift: 1 }); }
    sh.piece([[-10, -358], [10, -358], [4, -378], [-4, -378]], '#7a6a5a', { round: 2, lift: 1 });
    return { spr: sh.finish({ shadowBlur: 6 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 4, 5); },
};
// A raised dais with a painted screen behind it, for an emperor (or an empress) to be seen on.
KINDS.dais = {
  bake(mk) {
    const sh = mk('dais', [-80, -200, 80, 6]);
    sh.piece(rect(-60, -40, 60, -190), '#a8322a', { round: 2, paint: (g) => { g.strokeStyle = 'rgba(232,190,90,.75)'; g.lineWidth = 3; g.strokeRect(-52, -182, 104, 136); g.lineWidth = 2; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(-40 + k * 10, -160); g.quadraticCurveTo(0, -120 - k * 8, 40 - k * 10, -160); g.stroke(); } g.fillStyle = 'rgba(232,190,90,.85)'; g.beginPath(); g.arc(0, -150, 10, 0, 7); g.fill(); } });
    sh.piece([[-74, 4], [-70, -40], [70, -40], [74, 4]], '#c8a050', { round: 2, lift: 1.4, paint: (g) => { g.strokeStyle = 'rgba(90,60,20,.5)'; g.lineWidth = 1; for (let y = -6; y > -40; y -= 7) { g.beginPath(); g.moveTo(-72, y); g.lineTo(72, y); g.stroke(); } } });
    return { spr: sh.finish({ shadowBlur: 5 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 3, 4); },
};
// Li Bai's room: a cutaway with a bed and a round window; moonlight lies on the floor like frost.
KINDS.tangroom = {
  bake(mk) {
    const P = {}, sh = mk('tangroom', [-110, -210, 110, 6]);
    sh.piece(rect(-100, 4, 100, -150), '#3a2e2a', { round: 2, paint: (g) => { g.fillStyle = '#5a463a'; g.fillRect(-100, -10, 200, 14); g.fillStyle = 'rgba(20,14,12,.9)'; g.beginPath(); g.arc(-50, -96, 24, 0, 7); g.fill(); g.strokeStyle = 'rgba(120,90,60,.8)'; g.lineWidth = 1.2; for (let k = -20; k <= 20; k += 8) { g.beginPath(); g.moveTo(-50 + k, -120); g.lineTo(-50 + k, -72); g.stroke(); g.beginPath(); g.moveTo(-74, -96 + k); g.lineTo(-26, -96 + k); g.stroke(); } } });
    sh.piece([[-104, 4], [-104, -150], [-96, -150], [-96, 4]], '#6a3a2a', { round: 1, lift: 1 }).piece([[96, 4], [96, -150], [104, -150], [104, 4]], '#6a3a2a', { round: 1, lift: 1 });
    sh.piece(roofPts(100, -150, 26, 22, 10), '#4a4a50', { round: 2, lift: 1.8 });
    sh.piece([[0, -10], [90, -10], [90, -38], [0, -38]], '#6a4a34', { round: 2, lift: 1.4, paint: (g) => { g.fillStyle = '#d8cfbc'; g.fillRect(4, -40, 82, 6); } }).piece([[0, -10], [6, -10], [6, -60], [0, -60]], '#6a4a34', { round: 1, lift: 1.4 });
    P.spr = sh.finish({ shadowBlur: 5 });
    return P;
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 3, 4); },
  glow(g, P, t, e, env, p) {
    const k = e.moon ? e.moon(t) : 0; if (k < 0.01 || p < 0.6) return;
    g.globalCompositeOperation = 'lighter';
    // moonlight through the round window, laid on the floor
    const gr = g.createLinearGradient(-50, -96, 30, -6); gr.addColorStop(0, `rgba(200,215,255,${0.32 * k})`); gr.addColorStop(1, `rgba(200,215,255,${0.08 * k})`);
    g.fillStyle = gr; g.beginPath(); g.moveTo(-70, -96); g.lineTo(-30, -96); g.lineTo(54, -6); g.lineTo(-6, -6); g.closePath(); g.fill();
    g.fillStyle = `rgba(230,238,255,${0.5 * k})`; g.beginPath(); g.ellipse(24, -6, 32, 4, 0, 0, 7); g.fill();
    // and on the patch of floor, a glitter like frost
    const f = e.frost ? e.frost(t) : 0; if (f > 0.01) for (let i = 0; i < 26; i++) { const x = -4 + hash(i * 7) * 56, a = Math.max(0, Math.sin(t * (2 + hash(i) * 3) + i)) ** 6 * f; g.fillStyle = `rgba(255,255,255,${a})`; g.fillRect(x, -8 + hash(i * 3) * 4, 1.6, 1.6); }
    g.globalCompositeOperation = 'source-over';
  },
};

// ================================================================ the Song ===
// The rainbow bridge of Kaifeng: a timber arch over the river, as in the Qingming scroll.
KINDS.rainbowbridge = {
  bake(mk) {
    const sh = mk('rainbowbridge', [-130, -90, 130, 8]), pts = [], top = [];
    for (let i = 0; i <= 16; i++) { const f = i / 16, x = -120 + f * 240, y = -Math.sin(f * Math.PI) * 62; top.push([x, y - 10]); pts.push([x, y]); }
    sh.piece([...top, ...pts.slice().reverse().map(([x, y]) => [x, y + 6])], '#7a5236', { round: 3, paint: (g) => { g.strokeStyle = 'rgba(40,24,12,.55)'; g.lineWidth = 1.4; for (let i = 0; i <= 24; i++) { const f = i / 24, x = -118 + f * 236, y = -Math.sin(f * Math.PI) * 62; g.beginPath(); g.moveTo(x, y - 10); g.lineTo(x + 3, y + 6); g.stroke(); } } });
    const rail = top.map(([x, y]) => [x, y - 16]);
    sh.piece([...rail, ...top.slice().reverse().map(([x, y]) => [x, y - 10])], '#a8322a', { round: 1.5, lift: 1, paint: (g) => { g.strokeStyle = 'rgba(60,20,10,.5)'; g.lineWidth = 1; for (let i = 0; i <= 16; i++) { const [x, y] = rail[i]; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 6); g.stroke(); } } });
    for (const x of [-124, 118]) sh.piece(rect(x, 6, x + 8, -14), '#5a3a22', { round: 1, lift: 1 });
    return { spr: sh.finish({ shadowBlur: 5 }), arc: (x) => -Math.sin(((x + 120) / 240) * Math.PI) * 62 - 10 };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 3, 4); },
};
// A shop front with an awning and a hanging sign (teahouse, wine shop, cloth seller).
KINDS.shop = {
  bake(mk, v = 0) {
    const cols = ['#c84a2a', '#2f6a6a', '#c9a24a'], c = cols[v % 3], sh = mk('shop' + v, [-70, -150, 70, 6]), win = [[-40, -70, 28, 34], [12, -70, 28, 34]];
    sh.piece(rect(-60, 4, 60, -96), '#e0d4b8', { round: 2, paint: (g) => { paintRects(win, 'rgba(40,28,20,.82)')(g); g.fillStyle = '#5a3a22'; for (const x of [-60, -6, 54]) g.fillRect(x, -96, 6, 100); g.fillStyle = 'rgba(40,28,20,.82)'; g.fillRect(-8, -36, 16, 40); } });
    sh.piece([[-72, -60], [72, -60], [64, -36], [-64, -36]], c, { round: 2, lift: 1.6, paint: (g) => { g.fillStyle = 'rgba(255,255,255,.2)'; for (let x = -68; x < 70; x += 16) g.fillRect(x, -60, 8, 24); } });
    sh.piece(roofPts(60, -96, 26, 14, 8), '#4a4a50', { round: 2, lift: 1.6 });
    sh.piece(rect(40, -130, 54, -98), c, { round: 1, lift: 1, paint: (g) => { g.fillStyle = 'rgba(255,240,210,.85)'; g.fillRect(44, -126, 6, 3); g.fillRect(44, -118, 6, 3); g.fillRect(44, -110, 6, 3); } });
    return { spr: sh.finish({ shadowBlur: 5 }), windows: win };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 3, 4); },
  glow: glowRects,
};
// The alchemist's stove: a tripod cauldron over a little fire.
KINDS.furnace = {
  bake(mk) {
    return { spr: mk('furnace', [-36, -70, 36, 6]).piece([[-26, 4], [-22, -30], [22, -30], [26, 4]], '#7a5a44', { round: 4, paint: (g) => { g.fillStyle = 'rgba(30,14,8,.9)'; g.beginPath(); g.ellipse(0, -10, 9, 8, 0, 0, 7); g.fill(); } })
      .piece([[-24, -30], [24, -30], [18, -56], [-18, -56]], '#5a5a4a', { round: 5, lift: 1.4, paint: (g) => { g.fillStyle = 'rgba(200,200,180,.25)'; g.fillRect(-16, -52, 6, 20); } }).piece(ellipse(0, -57, 19, 4, 12), '#3a3a30', { round: 2, lift: 0.8 }).finish({ shadowBlur: 3 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 2, 3); },
  glow(g, P, t, e, env, p) { if (p < 0.6) return; g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(0, -10, 0, 0, -10, 22); gr.addColorStop(0, `rgba(255,170,80,${0.8 * (0.85 + 0.15 * Math.sin(t * 9))})`); gr.addColorStop(1, 'rgba(255,90,30,0)'); g.fillStyle = gr; g.fillRect(-22, -32, 44, 44); g.globalCompositeOperation = 'source-over'; },
};
// A rack of fire arrows: rockets lean on it, waiting to go up.
KINDS.rocketrack = {
  bake(mk) {
    const sh = mk('rocketrack', [-40, -130, 40, 6]);
    sh.piece([[-30, 4], [-6, -120], [0, -120], [-24, 4]], '#5a4030', { round: 1 }).piece([[30, 4], [6, -120], [0, -120], [24, 4]], '#5a4030', { round: 1, lift: 0.8 }).piece(rect(-22, -40, 22, -46), '#5a4030', { round: 0.8, lift: 0.8 });
    for (const [x0, a] of [[-26, 0.36], [-12, 0.28], [10, -0.24], [24, -0.34]]) { const x1 = x0 + Math.sin(a) * 120, y1 = -Math.cos(a) * 120; sh.piece(strip(x0, 2, x1, y1, 1.8, 1.6), '#7a5a3a', { round: 0.5, lift: 1.2 }); sh.piece(strip(x0 + (x1 - x0) * 0.62, 2 + (y1 - 2) * 0.62, x0 + (x1 - x0) * 0.9, 2 + (y1 - 2) * 0.9, 7, 6), '#b8322a', { round: 1.5, lift: 1.4, paint: (g) => { g.fillStyle = 'rgba(240,210,120,.8)'; g.fillRect(x0 + (x1 - x0) * 0.74 - 4, 2 + (y1 - 2) * 0.74, 8, 2); } }); }
    return { spr: sh.finish({ shadowBlur: 3 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 2, 3); },
};
// A Song junk: a deep hull, battened sails like folded fans, a stern rudder.
KINDS.junk = {
  bake(mk, v = 0) {
    const sh = mk('junk' + v, [-150, -270, 150, 16]), hull = v ? '#5a3a22' : '#6a4228';
    sh.piece([[-140, -46], [-126, 8], [110, 10], [142, -40], [116, -30], [-110, -30]], hull, { round: 4, paint: (g) => { g.strokeStyle = 'rgba(30,18,10,.5)'; g.lineWidth = 1.2; for (let y = -26; y < 10; y += 6) { g.beginPath(); g.moveTo(-130, y); g.lineTo(130, y); g.stroke(); } g.fillStyle = '#a8322a'; g.fillRect(-138, -46, 30, 8); g.fillStyle = 'rgba(240,220,170,.9)'; g.beginPath(); g.arc(120, -28, 5, 0, 7); g.fill(); g.fillStyle = 'rgba(20,14,10,.9)'; g.beginPath(); g.arc(120, -28, 2, 0, 7); g.fill(); } });
    const sail = (x, y0, w, h) => { sh.piece(strip(x, y0 + 4, x, y0 - h - 16, 4, 3), '#3a2a1c', { round: 1, lift: 1 }); sh.piece([[x - w * 0.6, y0], [x - w * 0.5, y0 - h], [x + w * 0.5, y0 - h * 1.06], [x + w * 0.6, y0]], '#b88a5a', { round: 3, lift: 2, paint: (g) => { g.strokeStyle = 'rgba(60,34,18,.7)'; g.lineWidth = 2; for (let k = 1; k < 7; k++) { const yy = y0 - (h * k) / 7; g.beginPath(); g.moveTo(x - w * 0.56, yy); g.quadraticCurveTo(x, yy + 6, x + w * 0.58, yy - 2); g.stroke(); } } }); };
    sail(-60, -40, 60, 130); sail(10, -40, 80, 190); sail(84, -40, 50, 110);
    return { spr: sh.finish({ shadowBlur: 7 }) };
  },
  draw(g, P, t, e, env) { g.translate(0, Math.sin(t * 1.3 + e.a) * 3); g.rotate(Math.sin(t * 0.9 + e.a * 2) * 2.2 * DEG); put(g, P.spr, env.sh, 5, 6); },
};

// ======================================================== Mongols and Ming ===
KINDS.yurt = {
  bake(mk, v = 0) {
    const sh = mk('yurt' + v, [-70, -110, 70, 6]), c = v ? '#e8e0cc' : '#ddd2b8';
    sh.piece([[-62, 4], [-62, -50], [62, -50], [62, 4]], c, { round: 3, paint: (g) => { g.strokeStyle = 'rgba(120,90,60,.5)'; g.lineWidth = 2; for (const y of [-14, -36]) { g.beginPath(); g.moveTo(-62, y); g.lineTo(62, y); g.stroke(); } g.fillStyle = '#a8322a'; g.fillRect(-12, -40, 24, 44); g.fillStyle = 'rgba(232,190,90,.8)'; g.fillRect(-10, -38, 20, 3); } });
    sh.piece([[-68, -48], [-8, -94], [8, -94], [68, -48]], shade(c, -0.05), { round: 4, lift: 1.6, paint: (g) => { g.strokeStyle = 'rgba(120,90,60,.45)'; g.lineWidth = 1.4; for (let x = -60; x <= 60; x += 15) { g.beginPath(); g.moveTo(x * 0.12, -92); g.lineTo(x, -50); g.stroke(); } } });
    sh.piece(rect(-10, -94, 10, -100), '#8a6a4a', { round: 1, lift: 1 });
    return { spr: sh.finish({ shadowBlur: 4 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 3, 4); },
};
// A rider on horseback: e.v a look, e.gait.
KINDS.rider = {
  bake(mk, v) { return { h: bakeHorse(mk, 'r' + v, ['#6a4a34', '#a87a4a', '#3a2c26', '#c9b08a'][(v || '').length % 4]), p: KINDS.person.bake(mk, v) }; },
  draw(g, P, t, e, env) {
    const gait = e.gait || 'gallop', ph = t * (gait === 'gallop' ? 11 : 4.4) + e.a;
    drawHorse(g, P.h, t, e, env, gait, e.a);
    g.save(); g.translate(-14, -84 - (gait === 'gallop' ? Math.abs(Math.sin(ph)) * 6 : 0)); drawPerson(g, P.p, t, e, env, { lean: gait === 'gallop' ? 10 : 2, head: -6, back: [-50, -40], front: [-80 + Math.sin(ph) * 6, -50] }); g.restore();
  },
};
// The Forbidden City's wall: red, with a coping of yellow tiles.
KINDS.palacewall = {
  bake(mk) {
    const sh = mk('palacewall', [-44, -100, 44, 6]);
    sh.piece(rect(-42, 4, 42, -78), '#a8322a', { round: 1.5, paint: (g) => { g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(-42, -12, 84, 16); } });
    sh.piece(roofPts(42, -78, 8, 6, 3), '#e0a438', { round: 1.5, lift: 1.4 });
    return { spr: sh.finish({ shadowBlur: 4 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 3, 4); },
};
// Zheng He's treasure ship: nine masts, red sails, a high stern, a painted eye.
KINDS.treasureship = {
  bake(mk) {
    const sh = mk('treasureship', [-250, -360, 250, 20]);
    sh.piece([[-240, -70], [-214, 12], [196, 14], [246, -62], [210, -48], [196, -40], [-200, -40], [-214, -96], [-240, -96]], '#5a3622', { round: 4, paint: (g) => { g.strokeStyle = 'rgba(30,18,10,.5)'; g.lineWidth = 1.2; for (let y = -36; y < 14; y += 6) { g.beginPath(); g.moveTo(-220, y); g.lineTo(220, y); g.stroke(); } g.fillStyle = '#a8322a'; g.fillRect(-238, -96, 30, 26); g.fillStyle = 'rgba(232,190,90,.8)'; g.fillRect(-206, -44, 400, 4); g.fillStyle = 'rgba(240,220,170,.95)'; g.beginPath(); g.arc(214, -36, 8, 0, 7); g.fill(); g.fillStyle = 'rgba(20,14,10,.95)'; g.beginPath(); g.arc(216, -36, 3.4, 0, 7); g.fill(); } });
    sh.piece(rect(-206, -40, -150, -96), '#7a4a2a', { round: 2, lift: 1.2, paint: (g) => { g.fillStyle = 'rgba(30,18,10,.8)'; for (const x of [-198, -180, -164]) g.fillRect(x, -84, 10, 14); } });
    const masts = [[-170, 140, 40], [-118, 210, 52], [-58, 262, 62], [0, 300, 70], [62, 250, 60], [118, 200, 50], [170, 146, 40]];
    for (const [x, h, w] of masts) {
      sh.piece(strip(x, -40, x, -40 - h - 14, 4, 3), '#3a2414', { round: 1, lift: 1 });
      sh.piece([[x - w * 0.5, -70], [x - w * 0.42, -40 - h], [x + w * 0.42, -40 - h * 1.04], [x + w * 0.5, -70]], x % 120 ? '#b8402e' : '#c8503a', { round: 2.6, lift: 2, paint: (g) => { g.strokeStyle = 'rgba(70,20,10,.7)'; g.lineWidth = 2; for (let k = 1; k < 7; k++) { const yy = -48 - (h * k) / 7; g.beginPath(); g.moveTo(x - w * 0.48, yy); g.quadraticCurveTo(x, yy + 5, x + w * 0.48, yy - 1); g.stroke(); } } });
    }
    return { spr: sh.finish({ shadowBlur: 8 }) };
  },
  draw(g, P, t, e, env) { g.translate(0, Math.sin(t * 1.0 + e.a) * 3); g.rotate(Math.sin(t * 0.7 + e.a * 2) * 1.6 * DEG); put(g, P.spr, env.sh, 6, 7); },
};
KINDS.baobab = {
  bake(mk, v = 0) {
    const r = rng(3500 + v), sh = mk('baobab' + v, [-90, -230, 90, 6]);
    sh.piece([[-34, 4], [-30, -120], [-50, -170], [-70, -190], [-62, -196], [-36, -176], [-14, -150], [-10, -200], [0, -206], [6, -150], [30, -186], [56, -200], [62, -192], [34, -164], [28, -120], [34, 4]], '#8a7a6a', { round: 6, paint: (g) => dab(g, r, 30, [-30, -150, 30, 0], ['rgba(60,50,40,.35)', 'rgba(200,190,170,.25)'], 10, 2) });
    for (const [x, y, rr] of [[-62, -198, 22], [52, -204, 24], [-2, -214, 20]]) sh.piece(ellipse(x, y, rr, rr * 0.6, 12), '#6a8a4a', { round: 6, rough: 2, lift: 1.2 });
    return { spr: sh.finish() };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh); },
};

// ======================================================== the last dynasty ===
// A Canton "factory": the foreign trading houses on the waterfront, white fronts and flags.
KINDS.hong = {
  bake(mk, v = 0) {
    const sh = mk('hong' + v, [-70, -190, 70, 6]), c = ['#e8e2d4', '#e0d4bc', '#d8d8d0'][v % 3], win = [];
    for (const x of [-48, -16, 16]) for (const y of [-118, -70]) win.push([x, y, 18, 28]);
    sh.piece(rect(-60, 4, 60, -150), c, { round: 2, paint: (g) => { paintRects(win)(g); g.fillStyle = 'rgba(140,130,110,.4)'; g.fillRect(-60, -84, 120, 4); for (const x of [-56, -24, 8, 40]) g.fillRect(x, -150, 6, 154); g.fillStyle = 'rgba(30,24,20,.85)'; g.fillRect(-10, -34, 20, 38); } });
    sh.piece([[-66, -150], [0, -176], [66, -150]], shade(c, -0.1), { round: 2, lift: 1.4 });
    sh.piece(strip(40, -150, 40, -196, 2.4, 2), '#3a3030', { round: 0.5, lift: 1 });
    sh.piece(rect(41, -196, 64, -182), ['#c8322a', '#2a4a8a', '#e8e2d4'][v % 3], { round: 0.6, lift: 0.8, paint: (g) => { if (v % 3 === 2) { g.fillStyle = '#c8322a'; g.fillRect(41, -190, 23, 2.5); g.fillRect(51, -196, 2.5, 14); } else { g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(41, -190, 23, 2); } } });
    return { spr: sh.finish({ shadowBlur: 5 }), windows: win };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 3, 4); },
  glow: glowRects,
};
// An iron paddle steamer with a tall funnel and guns.
KINDS.steamship = {
  bake(mk) {
    const sh = mk('steamship', [-160, -170, 160, 16]);
    sh.piece([[-150, -40], [-136, 8], [130, 10], [156, -34], [-150, -34]], '#2a2828', { round: 3, paint: (g) => { g.fillStyle = 'rgba(200,190,170,.35)'; g.fillRect(-140, -26, 280, 3); g.fillStyle = 'rgba(20,18,18,.9)'; for (let x = -110; x < 120; x += 28) { g.beginPath(); g.arc(x, -14, 4, 0, 7); g.fill(); } } });
    sh.piece(ellipse(-10, -26, 32, 32, 18), '#3a3434', { round: 4, lift: 1.4, paint: (g) => { g.strokeStyle = 'rgba(200,190,170,.4)'; g.lineWidth = 1.4; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; g.beginPath(); g.moveTo(-10, -26); g.lineTo(-10 + Math.cos(a) * 28, -26 + Math.sin(a) * 28); g.stroke(); } } });
    sh.piece(rect(-34, -40, 20, -60), '#4a4442', { round: 1.5, lift: 1.2 });
    sh.piece(rect(-16, -60, 0, -150), '#1e1c1c', { round: 1.5, lift: 1.2, paint: (g) => { g.fillStyle = 'rgba(180,60,40,.8)'; g.fillRect(-16, -150, 16, 6); } });
    for (const x of [-90, 70]) sh.piece(strip(x, -36, x, -160, 3, 2.4), '#3a3030', { round: 0.6, lift: 1 });
    sh.piece(rect(70, -160, 100, -146), '#c8322a', { round: 0.5, lift: 0.8, paint: (g) => { g.fillStyle = '#2a4a8a'; g.fillRect(70, -160, 12, 8); } });
    return { spr: sh.finish({ shadowBlur: 6 }) };
  },
  draw(g, P, t, e, env) { g.translate(0, Math.sin(t * 1.1 + e.a) * 2.4); g.rotate(Math.sin(t * 0.8 + e.a * 2) * 1.4 * DEG); put(g, P.spr, env.sh, 5, 6); },
};
KINDS.crate = {
  bake(mk, v = 0) { return { spr: mk('crate' + v, [-24, -40, 24, 6], { pad: 5 }).piece(rect(-20, 4, 20, -34), v ? '#7a5a3a' : '#8a6a44', { round: 1.5, paint: (g) => { g.strokeStyle = 'rgba(40,24,12,.6)'; g.lineWidth = 2; g.strokeRect(-18, -32, 36, 34); g.beginPath(); g.moveTo(-18, -32); g.lineTo(18, 2); g.stroke(); g.fillStyle = 'rgba(30,20,14,.7)'; g.font = '700 9px Georgia'; } }).finish({ shadowBlur: 3 }) }; },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 2, 3); },
};
// The dragon throne: gold, a red cushion, a carved back much too big for a small boy.
KINDS.dragonthrone = {
  bake(mk) {
    const sh = mk('dragonthrone', [-60, -170, 60, 6]);
    sh.piece([[-50, 4], [-50, -70], [-44, -150], [-30, -164], [30, -164], [44, -150], [50, -70], [50, 4], [40, 4], [40, -50], [-40, -50], [-40, 4]], '#d8a838', { round: 3, paint: (g) => { g.strokeStyle = 'rgba(120,70,20,.6)'; g.lineWidth = 2; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(-36 + k * 3, -150 + k * 16); g.quadraticCurveTo(0, -120 + k * 14, 36 - k * 3, -150 + k * 16); g.stroke(); } g.fillStyle = 'rgba(168,40,40,.9)'; g.beginPath(); g.arc(0, -126, 9, 0, 7); g.fill(); } });
    sh.piece(rect(-42, -50, 42, -62), '#a8282a', { round: 2, lift: 1.4 });
    return { spr: sh.finish({ shadowBlur: 5 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 3, 4); },
};

// ======================================================= war and revolution ===
// A rickshaw: a puller between the shafts, a passenger under the hood.
KINDS.rickshaw = {
  bake(mk) {
    const P = { puller: KINDS.person.bake(mk, 'puller'), rider: KINDS.person.bake(mk, 'qipaoSit') };
    P.cart = mk('rickshaw', [-50, -90, 80, 30]).piece([[-40, -10], [10, -10], [14, -40], [-36, -44]], '#2a2a2e', { round: 3 }).piece([[-44, -40], [-36, -86], [0, -88], [14, -40]], '#3a3a40', { round: 6, lift: 1.4 }).piece(strip(10, -14, 78, -26, 3, 2.4), '#4a3423', { round: 1, lift: 1 }).finish({ shadowBlur: 3 });
    P.wheel = mk('rick-wheel', [-24, -24, 24, 24], { pad: 4 }).piece(ellipse(0, 0, 22, 22, 20), '#2a2a2e', { round: 4 }).piece(ellipse(0, 0, 17, 17, 18), '#c8c0b0', { round: 4, lift: 0.4, paint: (g) => { g.strokeStyle = '#2a2a2e'; g.lineWidth = 1.2; for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * 17, Math.sin(a) * 17); g.stroke(); } } }).finish({ shadowBlur: 2 });
    return P;
  },
  draw(g, P, t, e, env) {
    const ph = t * 7;
    g.save(); g.translate(-14, -30); drawPerson(g, P.rider, t, e, env, { lean: 4, head: 4, back: [-30, -40], front: [-40, -50] }); g.restore();
    g.save(); g.translate(0, -16); put(g, P.cart, env.sh, 3, 4); g.restore();
    const d = e.move ? e.move(t) * DEG * 1000 : 0; g.save(); g.translate(-10, -22); g.rotate(d / 22); put(g, P.wheel, env.sh * 0.5); g.restore();
    g.save(); g.translate(86, 0); drawPerson(g, P.puller, t, e, env, { walk: ph, lean: 16, head: 4, back: [-30, -10], front: [-40, -10] }); g.restore();
  },
};
// Tiananmen, the Gate of Heavenly Peace: a red wall with five arches, a double-roofed hall above.
KINDS.tiananmen = {
  bake(mk) {
    const sh = mk('tiananmen', [-210, -330, 210, 6]), win = [];
    sh.piece(rect(-200, 4, 200, -130), '#a8322a', { round: 2, paint: (g) => { for (const [x, w] of [[-150, 26], [-80, 30], [0, 38], [80, 30], [150, 26]]) { g.fillStyle = 'rgba(40,20,14,.9)'; g.beginPath(); g.moveTo(x - w / 2, 4); g.lineTo(x - w / 2, -60); g.quadraticCurveTo(x, -60 - w * 0.8, x + w / 2, -60); g.lineTo(x + w / 2, 4); g.fill(); } } });
    sh.piece(rect(-206, -130, 206, -140), '#e8e4da', { round: 1, lift: 1, paint: (g) => { g.fillStyle = 'rgba(150,140,130,.6)'; for (let x = -200; x < 204; x += 10) g.fillRect(x, -140, 3, -10); } });
    sh.piece(rect(-150, -140, 150, -206), '#a8322a', { round: 1.5, lift: 1.4, paint: (g) => { for (let x = -140; x < 140; x += 28) { g.fillStyle = 'rgba(40,24,16,.82)'; g.fillRect(x + 4, -196, 18, 50); win.push([x + 4, -196, 18, 50]); } } });
    sh.piece(roofPts(154, -206, 16, 30, 10), '#e0a438', { round: 2, lift: 2 });
    sh.piece(rect(-110, -232, 110, -262), '#a8322a', { round: 1.5, lift: 1.4 });
    sh.piece(roofPts(110, -262, 38, 30, 12), '#e0a438', { round: 2, lift: 2 });
    for (const x of [-84, 84]) sh.piece(ellipse(x, -178, 11, 13, 14), '#d8322a', { round: 3, lift: 1.2, paint: (g) => { g.fillStyle = 'rgba(232,190,90,.85)'; g.fillRect(x - 6, -192, 12, 3); g.fillRect(x - 6, -166, 12, 3); } });
    return { spr: sh.finish({ shadowBlur: 7 }), windows: win };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 4, 5); },
  glow: glowRects,
};
// A flag run up a pole: e.flag 'prc'; e.raise(t) 0..1.
KINDS.flag = {
  bake(mk, v = 0) {
    const P = {};
    P.pole = mk('flag-pole', [-4, -300, 6, 4], { pad: 4 }).piece(strip(0.5, 2, 0.5, -296, 3.4, 2.4), '#c8c4bc', { round: 1 }).piece(ellipse(0.5, -298, 3.4, 3.4, 8), '#c9a24a', { round: 1, lift: 0.8 }).finish({ shadowBlur: 2 });
    const star = (g, x, y, r, rot) => { g.beginPath(); for (let i = 0; i < 10; i++) { const a = rot - Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.4 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); };
    P.cloth = [0, 1, 2, 3].map((k) => mk('flag-cloth' + k, [-2, -4, 92, 66], { pad: 4 }).piece([[0, 0], [22, 2 + k], [44, -1 + k], [66, 3 - k], [88, 1], [88, 60 + k], [66, 62 - k], [44, 58 + k], [22, 61], [0, 58]], '#d8282a', { round: 1.5, rough: 0.5, paint: (g) => { g.fillStyle = '#f2d23a'; star(g, 15, 15, 9, 0); star(g, 30, 6, 3, 0.4); star(g, 36, 12, 3, 0.8); star(g, 36, 21, 3, 1.2); star(g, 30, 27, 3, 1.6); } }).finish({ shadowBlur: 3 }));
    return P;
  },
  draw(g, P, t, e, env) {
    put(g, P.pole, env.sh, 2, 3);
    const k = e.raise ? e.raise(t) : 1; if (k <= 0) return; const f = Math.floor((t * 5 + e.a) % 4);
    g.save(); g.translate(2, -294 + (1 - k) * 230); g.rotate(fbm(t * 0.8 + e.a, 4) * 6 * DEG); put(g, P.cloth[f], env.sh * 0.6, 2, 3); g.restore();
  },
};

// ============================================================= Mao's China ===
// A backyard furnace: a squat brick kiln, glowing, smoking, fed with the village's pots.
KINDS.bfurnace = {
  bake(mk) {
    return { spr: mk('bfurnace', [-40, -110, 40, 6]).piece([[-34, 4], [-28, -70], [-14, -96], [14, -96], [28, -70], [34, 4]], '#9a5a3e', { round: 4, paint: (g) => { g.strokeStyle = 'rgba(60,30,20,.4)'; g.lineWidth = 1; let row = 0; for (let y = 0; y > -96; y -= 7, row++) { g.beginPath(); g.moveTo(-34, y); g.lineTo(34, y); g.stroke(); } g.fillStyle = 'rgba(30,12,6,.92)'; g.beginPath(); g.arc(0, -16, 11, Math.PI, 0); g.fillRect(-11, -16, 22, 16); g.fill(); } }).finish({ shadowBlur: 4 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 3, 4); },
  glow(g, P, t, e, env, p) { if (p < 0.6) return; const k = e.lit ? e.lit(t) : 1; if (k < 0.01) return; g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(0, -10, 0, 0, -10, 30); gr.addColorStop(0, `rgba(255,170,80,${0.9 * k * (0.85 + 0.15 * Math.sin(t * 8 + e.a))})`); gr.addColorStop(1, 'rgba(255,90,30,0)'); g.fillStyle = gr; g.fillRect(-30, -40, 60, 60); g.globalCompositeOperation = 'source-over'; },
};
// A wall pasted over with big-character posters.
KINDS.posterwall = {
  bake(mk) {
    const r = rng(3600), sh = mk('posterwall', [-110, -130, 110, 6]);
    sh.piece(rect(-104, 4, 104, -110), '#9a9690', { round: 2, paint: (g) => { g.strokeStyle = 'rgba(60,60,60,.3)'; g.lineWidth = 1; for (let y = -10; y > -110; y -= 10) { g.beginPath(); g.moveTo(-104, y); g.lineTo(104, y); g.stroke(); } } });
    for (let i = 0; i < 7; i++) { const x = -96 + i * 28 + (r() - 0.5) * 4, y = -100 + (r() - 0.5) * 8, red = r() < 0.4; sh.piece([[x, y], [x + 24, y + (r() - 0.5) * 3], [x + 24, y + 70 + r() * 10], [x, y + 72]], red ? '#c8322a' : '#ece6d6', { round: 0.8, rough: 0.6, lift: 0.8, thick: 0.4, paint: (g) => { g.strokeStyle = red ? 'rgba(250,240,220,.9)' : 'rgba(20,16,14,.85)'; g.lineWidth = 2.4; g.lineCap = 'round'; for (let k = 0; k < 4; k++) { const yy = y + 10 + k * 16; g.beginPath(); g.moveTo(x + 6, yy); g.lineTo(x + 18, yy); g.moveTo(x + 12, yy - 5); g.lineTo(x + 11, yy + 6); g.stroke(); } } }); }
    return { spr: sh.finish({ shadowBlur: 4 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 3, 4); },
};
// Sweet wormwood (qinghao): feathery leaves, tiny yellow flowers. e.grow(t).
KINDS.wormwood = {
  bake(mk, v = 0) {
    const r = rng(3700 + v), sh = mk('wormwood' + v, [-40, -120, 40, 6]);
    sh.piece(strip(0, 2, 2, -110, 3, 1.6), '#6a8a4a', { round: 0.8 });
    for (let i = 0; i < 9; i++) { const y = -20 - i * 10, s = i % 2 ? 1 : -1, L = 26 - i * 1.8; for (let j = 0; j < 4; j++) { const x = s * (6 + j * L / 4); sh.piece(ellipse(x, y - j * 2, 3.2, 1.6, 6, s * 0.4), j % 2 ? '#7a9a52' : '#88a85e', { round: 1, lift: 0.6, thick: 0.4 }); } }
    for (let i = 0; i < 14; i++) sh.piece(ellipse(-10 + r() * 22, -100 - r() * 16, 1.8, 1.8, 6), '#e0c040', { round: 0.6, lift: 0.5, thick: 0.3 });
    return { spr: sh.finish({ shadowBlur: 2 }) };
  },
  draw(g, P, t, e, env) { const k = e.grow ? e.grow(t) : 1; if (k < 0.01) return; g.scale(0.3 + 0.7 * k, k); g.rotate(fbm(t * 0.6 + e.a, 8) * 3 * DEG); put(g, P.spr, env.sh); },
};

// ============================================================== opening up ===
// Two great red doors in a gate; e.open(t) 0..1 swings them open.
KINDS.redgates = {
  bake(mk) {
    const P = {};
    P.frame = mk('gateframe', [-120, -260, 120, 6]).piece([[-116, 4], [-116, -200], [-96, -200], [-96, 4]], '#8a2a24', { round: 2 }).piece([[96, 4], [96, -200], [116, -200], [116, 4]], '#8a2a24', { round: 2 }).piece(roofPts(110, -200, 30, 20, 10), '#4a4a50', { round: 2, lift: 1.6 }).finish({ shadowBlur: 5 });
    P.door = mk('door', [-4, -196, 100, 4], { pad: 4 }).piece(rect(0, 2, 96, -194), '#b8322a', { round: 2, paint: (g) => { g.fillStyle = '#d8a838'; for (let i = 0; i < 9; i++) for (let j = 0; j < 7; j++) { g.beginPath(); g.arc(12 + j * 12, -176 + i * 20, 2.6, 0, 7); g.fill(); } g.strokeStyle = 'rgba(60,20,10,.5)'; g.lineWidth = 2; g.strokeRect(4, -190, 88, 188); } }).finish({ shadowBlur: 3 });
    return P;
  },
  draw(g, P, t, e, env) {
    const k = e.open ? e.open(t) : 0, c = Math.cos(k * Math.PI * 0.46);
    for (const s of [-1, 1]) { g.save(); g.translate(s * 96, 0); g.scale(-s * c, 1); put(g, P.door, env.sh * c, 2, 3); g.restore(); }
    put(g, P.frame, env.sh, 3, 4);
  },
};
// Stacked shipping containers.
KINDS.containers = {
  bake(mk, v = 0) {
    const r = rng(3800 + v), sh = mk('containers' + v, [-90, -110, 90, 6]), cols = ['#c8642a', '#2f6a8a', '#8a3a2a', '#5a7a3a', '#d8a838', '#3a4a6a'];
    for (let row = 0; row < 3; row++) for (let i = 0; i < 3 - (row === 2 && v ? 1 : 0); i++) { const c = cols[(i + row * 2 + v) % cols.length], x = -84 + i * 56 + row * 6, y = -row * 34; sh.piece(rect(x, y + 2, x + 54, y - 30), c, { round: 1, lift: 1, paint: (g) => { g.strokeStyle = rgb(shade(c, -0.35), 0.6); g.lineWidth = 1; for (let xx = x + 4; xx < x + 52; xx += 4) { g.beginPath(); g.moveTo(xx, y); g.lineTo(xx, y - 28); g.stroke(); } } }); }
    return { spr: sh.finish({ shadowBlur: 4 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 3, 4); },
};
// A tank, in dull paper: a hull, a turret, a gun, tracks.
KINDS.tank = {
  bake(mk) {
    const sh = mk('tank', [-90, -80, 120, 6]), c = '#5a6050';
    sh.piece([[-80, 4], [-88, -14], [-76, -30], [76, -30], [88, -14], [80, 4]], '#3a3a36', { round: 8, paint: (g) => { g.fillStyle = 'rgba(90,90,84,.9)'; for (let x = -66; x <= 66; x += 22) { g.beginPath(); g.arc(x, -12, 9, 0, 7); g.fill(); } } });
    sh.piece([[-74, -30], [74, -30], [64, -46], [-66, -46]], c, { round: 3, lift: 1.4 });
    sh.piece([[-36, -46], [-30, -66], [26, -66], [34, -46]], shade(c, 0.06), { round: 4, lift: 1.6 });
    sh.piece(strip(28, -58, 112, -60, 6, 5), shade(c, -0.1), { round: 1, lift: 1.4 });
    return { spr: sh.finish({ shadowBlur: 5 }) };
  },
  draw(g, P, t, e, env) { const moving = e.move && e.move(t + 0.05) !== e.move(t); g.translate(0, moving ? Math.sin(t * 20) * 0.6 : 0); put(g, P.spr, env.sh, 4, 5); },
};
// A village house: white walls, a grey tile roof, windows that light up.
KINDS.farmhouse = {
  bake(mk, v = 0) {
    const w = [52, 44, 60][v % 3], h = [56, 48, 62][v % 3], win = [[-w * 0.6, -h * 0.66, 14, 16], [w * 0.28, -h * 0.66, 14, 16]], sh = mk('farmhouse' + v, [-w - 20, -h - 50, w + 20, 6]);
    sh.piece(rect(-w, 4, w, -h), ['#e8e2d4', '#e0d8c4', '#ece6da'][v % 3], { round: 2, paint: (g) => { paintRects(win)(g); g.fillStyle = 'rgba(40,30,24,.85)'; g.fillRect(-8, -34, 16, 38); g.fillStyle = 'rgba(150,140,120,.3)'; g.fillRect(-w, -8, w * 2, 8); } });
    sh.piece(roofPts(w, -h, 26, 16, 8), '#4a4a50', { round: 2, lift: 1.6 });
    win.push([-8, -34, 16, 38]);
    return { spr: sh.finish({ shadowBlur: 4 }), windows: win };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 3, 4); },
  glow: glowRects,
};

// =================================================================== today ===
// A TV tower with two pink spheres on three legs, Shanghai's Pearl.
KINDS.pearl = {
  bake(mk) {
    const sh = mk('pearl', [-70, -470, 70, 6]), win = [];
    for (const s of [-1, 0, 1]) sh.piece([[s * 40 - 6, 4], [s * 40 + 6, 4], [s * 10 + 4, -150], [s * 10 - 4, -150]], '#d8d4cc', { round: 2, lift: s ? 1 : 1.4 });
    sh.piece(rect(-8, -150, 8, -330), '#d8d4cc', { round: 2, lift: 1.2 });
    sh.piece(ellipse(0, -150, 46, 46, 24), '#c86a8a', { round: 6, lift: 1.6, paint: (g) => { g.fillStyle = 'rgba(255,255,255,.2)'; g.beginPath(); g.ellipse(-14, -164, 12, 20, -0.3, 0, 7); g.fill(); for (let x = -36; x <= 36; x += 9) win.push([x - 2, -152, 4, 6]); paintRects(win)(g); } });
    sh.piece(ellipse(0, -330, 28, 28, 20), '#c86a8a', { round: 5, lift: 1.6, paint: (g) => { g.fillStyle = 'rgba(255,255,255,.2)'; g.beginPath(); g.ellipse(-8, -340, 8, 12, -0.3, 0, 7); g.fill(); } });
    sh.piece(strip(0, -356, 0, -466, 6, 2), '#c8c4bc', { round: 1, lift: 1 });
    sh.piece(ellipse(0, -400, 9, 9, 12), '#c86a8a', { round: 2, lift: 1.2 });
    return { spr: sh.finish({ shadowBlur: 6 }), windows: win };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 4, 5); },
  glow(g, P, t, e, env, p) { glowRects(g, P, t, e, env, p); if (p < 0.6 || !(env.S.blink > 0)) return; g.globalCompositeOperation = 'lighter'; for (const y of [-150, -330]) { const gr = g.createRadialGradient(0, y, 0, 0, y, 60); gr.addColorStop(0, `rgba(255,120,190,${0.35 * env.S.blink})`); gr.addColorStop(1, 'rgba(255,120,190,0)'); g.fillStyle = gr; g.fillRect(-60, y - 60, 120, 120); } g.globalCompositeOperation = 'source-over'; },
};
// A pier and a length of viaduct deck for the high-speed line.
KINDS.viaduct = {
  bake(mk) { return { spr: mk('viaduct', [-60, -86, 60, 6]).piece([[-10, 4], [10, 4], [8, -70], [-8, -70]], '#b8b4ac', { round: 2 }).piece(rect(-58, -70, 58, -84), '#c8c4bc', { round: 1.5, lift: 1.2, paint: (g) => { g.fillStyle = 'rgba(80,80,80,.3)'; g.fillRect(-58, -73, 116, 3); } }).finish({ shadowBlur: 4 }) }; },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 3, 4); },
};
// The high-speed train: a long white nose and carriages that follow the curve of the world.
KINDS.bullet = {
  bake(mk) {
    const P = {}, win = []; for (let x = -100; x < 96; x += 16) win.push([x, -34, 11, 9]);
    P.nose = mk('bullet-nose', [-110, -50, 140, 6]).piece([[-108, -6], [-108, -44], [40, -44], [96, -32], [134, -10], [134, -4], [-108, -4]], '#eef0f0', { round: 6, paint: (g) => { paintRects(win.filter(([x]) => x < 40))(g); g.fillStyle = '#2a4a8a'; g.fillRect(-108, -16, 236, 4); g.fillStyle = '#c8322a'; g.fillRect(-108, -12, 236, 2); g.fillStyle = 'rgba(30,40,60,.85)'; g.beginPath(); g.moveTo(70, -38); g.lineTo(100, -28); g.lineTo(84, -26); g.lineTo(60, -36); g.fill(); } }).finish({ shadowBlur: 3 });
    P.car = mk('bullet-car', [-112, -50, 112, 6]).piece(rect(-108, -4, 108, -44), '#eef0f0', { round: 6, paint: (g) => { paintRects(win)(g); g.fillStyle = '#2a4a8a'; g.fillRect(-108, -16, 216, 4); g.fillStyle = '#c8322a'; g.fillRect(-108, -12, 216, 2); } }).finish({ shadowBlur: 3 });
    P.win = win;
    return P;
  },
  draw(g, P, t, e, env) {
    const sc = e.scale || 1, a0 = e.a + (e.move ? e.move(t) : 0), pr = e.prof || (() => 0), lift = e.y || 0, r0 = 1000 + pr(a0) + lift;
    for (let k = 1; k <= 4; k++) { const off = -224 * k, dr = (off * sc) / r0, r1 = 1000 + pr(a0 + dr / DEG) + lift; g.save(); g.translate((Math.sin(dr) * r1) / sc, (r0 - Math.cos(dr) * r1) / sc); g.rotate(dr); put(g, P.car, env.sh, 2, 3); g.restore(); }
    put(g, P.nose, env.sh, 2, 3);
  },
  glow(g, P, t, e, env, p) {
    if (p < 0.6) return; const k = e.lit ? e.lit(t) : 1; if (k < 0.01) return;
    const sc = e.scale || 1, a0 = e.a + (e.move ? e.move(t) : 0), pr = e.prof || (() => 0), lift = e.y || 0, r0 = 1000 + pr(a0) + lift;
    g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(255,236,200,${0.8 * k})`;
    for (let c = 0; c <= 4; c++) { const off = -224 * c, dr = (off * sc) / r0, r1 = 1000 + pr(a0 + dr / DEG) + lift; g.save(); g.translate((Math.sin(dr) * r1) / sc, (r0 - Math.cos(dr) * r1) / sc); g.rotate(dr); for (const [x, y, w, h] of P.win) if (c || x < 40) g.fillRect(x, y, w, h); g.restore(); }
    const gr = g.createRadialGradient(134, -10, 0, 134, -10, 60); gr.addColorStop(0, `rgba(255,250,230,${0.8 * k})`); gr.addColorStop(1, 'rgba(255,250,230,0)'); g.fillStyle = gr; g.fillRect(74, -70, 120, 120);
    g.globalCompositeOperation = 'source-over';
  },
};
KINDS.coolingtower = {
  bake(mk) {
    const sh = mk('coolingtower', [-80, -200, 80, 6]), pts = [];
    for (let i = 0; i <= 10; i++) { const f = i / 10, w = 60 - Math.sin(f * Math.PI * 0.8) * 22 + f * 4; pts.push([w, -f * 180]); }
    sh.piece([...pts, ...pts.slice().reverse().map(([x, y]) => [-x, y])], '#b8b4ac', { round: 4, paint: (g) => { g.fillStyle = 'rgba(60,60,60,.15)'; g.fillRect(20, -180, 40, 184); } });
    return { spr: sh.finish({ shadowBlur: 5 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 3, 4); },
};
// A row of solar panels on frames, tilted at the sky.
KINDS.solar = {
  bake(mk) {
    const sh = mk('solar', [-70, -60, 70, 6]);
    for (const x of [-46, 0, 46]) { sh.piece(strip(x, 4, x + 6, -24, 3, 3), '#8a8a90', { round: 0.6 }); sh.piece([[x - 22, -16], [x + 18, -40], [x + 26, -30], [x - 14, -6]], '#2a3a6a', { round: 1, lift: 1.4, paint: (g) => { g.strokeStyle = 'rgba(160,190,230,.6)'; g.lineWidth = 0.8; for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(x - 22 + k * 10, -16 - k * 6); g.lineTo(x - 14 + k * 10, -6 - k * 6); g.stroke(); } } }); }
    return { spr: sh.finish({ shadowBlur: 3 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 2, 3); },
};
// A poplar, tall and narrow: the tree planted by the billion against the deserts.
KINDS.poplar = {
  bake(mk, v = 0) {
    const r = rng(3900 + v), h = 150 + v * 14, sh = mk('poplar' + v, [-30, -h - 10, 30, 6]);
    sh.piece(strip(0, 2, 0, -h * 0.4, 5, 3.4), '#6a5a48', { round: 1 });
    sh.piece([[-6, -h * 0.25], [-18, -h * 0.5], [-14, -h * 0.85], [0, -h], [14, -h * 0.85], [18, -h * 0.5], [6, -h * 0.25]], ['#5a8a4a', '#6a9a52', '#4f7a42'][v % 3], { round: 8, rough: 1.6, lift: 1.2, paint: (g) => dab(g, r, 30, [-16, -h, 16, -h * 0.3], ['rgba(140,180,100,.5)', 'rgba(40,70,40,.4)'], 5, 1.6) });
    return { spr: sh.finish() };
  },
  draw(g, P, t, e, env) { g.rotate(sway(t, e, 1.2)); put(g, P.spr, env.sh); },
};
// A giant panda among the bamboo, chewing.
KINDS.panda = {
  bake(mk) {
    const P = {};
    P.body = mk('panda', [-40, -70, 44, 6]).piece([[-34, 4], [-36, -30], [-24, -50], [6, -54], [24, -40], [28, -10], [24, 4]], '#efece4', { round: 12, paint: (g) => { g.fillStyle = '#222024'; g.beginPath(); g.ellipse(-8, -34, 22, 12, 0.2, 0, 7); g.fill(); g.beginPath(); g.ellipse(-22, -4, 10, 8, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(14, -2, 10, 7, 0, 0, 7); g.fill(); } }).finish({ shadowBlur: 3 });
    P.head = mk('panda-head', [-26, -26, 26, 22]).piece(ellipse(0, 0, 21, 18, 18), '#f4f2ec', { round: 6, paint: (g) => { g.fillStyle = '#222024'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * 8, -2, 5, 6.4, s * 0.5, 0, 7); g.fill(); g.beginPath(); g.arc(s * 14, -15, 6, 0, 7); g.fill(); } g.fillStyle = '#f4f2ec'; for (const s of [-1, 1]) { g.beginPath(); g.arc(s * 8, -3, 1.4, 0, 7); g.fill(); } g.fillStyle = '#222024'; g.beginPath(); g.ellipse(0, 7, 3, 2, 0, 0, 7); g.fill(); } }).finish({ shadowBlur: 3 });
    P.stalk = mk('panda-stalk', [-4, -50, 6, 4], { pad: 3 }).piece(strip(0, 2, 2, -46, 2.6, 2), '#7a9a52', { round: 0.6 }).piece([[2, -40], [14, -48], [6, -38]], '#6a9448', { round: 1, lift: 0.6 }).finish({ shadowBlur: 2 });
    return P;
  },
  draw(g, P, t, e, env) {
    put(g, P.body, env.sh, 2, 3);
    const chew = Math.sin(t * 6) * 0.04;
    g.save(); g.translate(18, -58); g.rotate(-0.4 + Math.sin(t * 3) * 0.08); put(g, P.stalk, env.sh * 0.5); g.restore();
    g.save(); g.translate(10, -60); g.rotate(fbm(t * 0.4, 3) * 0.08 + chew); g.scale(1, 1 + chew); put(g, P.head, env.sh * 0.6); g.restore();
  },
};

// ======================================================= Mao's China props ===
// A village blackboard on an easel, a child's first characters in chalk: 人 口 手 山.
KINDS.blackboard = {
  bake(mk) {
    const sh = mk('blackboard', [-46, -110, 46, 6]);
    sh.piece(strip(-30, 4, -24, -96, 4, 3), '#6a4a30', { round: 1 }).piece(strip(30, 4, 24, -96, 4, 3), '#6a4a30', { round: 1 })
      .piece(rect(-42, -98, 42, -44), '#6a4a30', { round: 2, lift: 1 })
      .piece(rect(-38, -94, 38, -48), '#2e3a34', { round: 1.5, lift: 1.2, paint: (g) => {
        g.strokeStyle = 'rgba(240,240,230,.9)'; g.lineWidth = 1.7; g.lineCap = 'round';
        g.beginPath(); g.moveTo(-25, -86); g.lineTo(-30, -66); g.moveTo(-26, -78); g.lineTo(-19, -65); g.stroke();
        g.strokeRect(-12, -84, 12, 14);
        g.beginPath(); g.moveTo(9, -87); g.lineTo(20, -89); g.moveTo(8, -81); g.lineTo(21, -81); g.moveTo(7, -75); g.lineTo(22, -75); g.moveTo(15, -89); g.lineTo(15, -65); g.lineTo(12, -67); g.stroke();
        g.beginPath(); g.moveTo(26, -84); g.lineTo(26, -66); g.lineTo(36, -66); g.lineTo(36, -84); g.moveTo(31, -89); g.lineTo(31, -66); g.stroke();
        g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect(-38, -94, 76, 12);
      } })
      .piece(rect(-40, -46, 40, -42), '#7a5a3a', { round: 1, lift: 1.4 });
    return { spr: sh.finish({ shadowBlur: 4 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 3, 4); },
};
// A village clinic's sign: a red cross on a white board.
KINDS.redcross = {
  bake(mk) { return { spr: mk('redcross', [-22, -122, 22, 6]).piece(strip(0, 4, 0, -90, 4, 3), '#6a5a48', { round: 1 }).piece(rect(-20, -118, 20, -84), '#efece4', { round: 2, lift: 1.2, paint: (g) => { g.fillStyle = '#c8282a'; g.fillRect(-4, -112, 8, 22); g.fillRect(-11, -105, 22, 8); } }).finish({ shadowBlur: 3 }) }; },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 3, 4); },
};
// The village loudspeaker on its pole; while e.blare(t) it throws out rings of sound.
KINDS.loudspeaker = {
  bake(mk) {
    return { spr: mk('loudspeaker', [-32, -232, 34, 6]).piece(strip(0, 4, 0, -200, 5, 4), '#5a4a3a', { round: 1 }).piece(rect(-8, -204, 8, -194), '#4a4a4e', { round: 1, lift: 1 })
      .piece([[3, -214], [30, -228], [30, -194], [3, -204]], '#a4aaa8', { round: 2, lift: 1.4, paint: (g) => { g.fillStyle = 'rgba(40,40,44,.65)'; g.fillRect(26, -226, 4, 30); } })
      .piece([[-3, -214], [-28, -226], [-28, -196], [-3, -204]], '#949a98', { round: 2, lift: 1.2 }).finish({ shadowBlur: 3 }) };
  },
  draw(g, P, t, e, env) {
    put(g, P.spr, env.sh, 3, 4);
    const k = e.blare ? e.blare(t) : 0; if (k < 0.01) return;
    g.lineWidth = 1.6; g.lineCap = 'round';
    for (const s of [-1, 1]) for (let j = 0; j < 3; j++) { const r = 10 + ((t * 34 + j * 13) % 40); g.strokeStyle = `rgba(40,30,30,${0.7 * k * (1 - r / 52)})`; g.beginPath(); g.arc(s * 30, -211, r, s > 0 ? -0.55 : Math.PI - 0.55, s > 0 ? 0.55 : Math.PI + 0.55); g.stroke(); }
  },
};
