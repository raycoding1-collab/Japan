// Things people made: houses, temples, ships, machines, cities, and blank card.
import { put, ellipse, strip, KRAFT, KRAFT_EDGE } from './paper.js';
import { KINDS } from './cutouts.js';
import { drawPerson } from './people.js';
import { rng, fbm, DEG, hash, shade, mix, rgb, clamp, smooth, sramp, spring, lerp } from './util.js';

const lines = (col, a = 0.35, step = 7, w = 1) => (g, sh) => { g.strokeStyle = rgb(shade(col, -0.35), a); g.lineWidth = w; for (let y = sh.y0; y < sh.y0 + sh.h; y += step) { g.beginPath(); g.moveTo(sh.x0, y); g.lineTo(sh.x0 + sh.w, y + 0.6); g.stroke(); } };
const bricks = (col, a = 0.3) => (g, sh) => { g.strokeStyle = rgb(shade(col, -0.35), a); g.lineWidth = 0.7; let row = 0; for (let y = sh.y0; y < sh.y0 + sh.h; y += 5, row++) { g.beginPath(); g.moveTo(sh.x0, y); g.lineTo(sh.x0 + sh.w, y); g.stroke(); for (let x = sh.x0 + (row % 2) * 6; x < sh.x0 + sh.w; x += 12) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 5); g.stroke(); } } };
const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
const dark = '#2b1f18';
// Windows are painted dark; when a building's lights come on, glow() lights them one by one.
function windowsGlow(g, P, t, e, env, p) {
  if (!e.winOn || p < 0.6) return;
  g.globalCompositeOperation = 'lighter';
  P.windows.forEach((w, i) => {
    const k = e.winOn(t, i); if (k <= 0.01) return;
    const [x, y, ww, hh] = w, c = e.winCol || [255, 196, 110];
    g.fillStyle = rgb(c, 0.8 * k); g.fillRect(x + 0.6, y + 0.6, ww - 1.2, hh - 1.2);
    const r = Math.max(ww, hh) * 1.3, gr = g.createRadialGradient(x + ww / 2, y + hh / 2, 0, x + ww / 2, y + hh / 2, r);
    gr.addColorStop(0, rgb(c, 0.13 * k)); gr.addColorStop(1, rgb(c, 0));
    g.fillStyle = gr; g.fillRect(x + ww / 2 - r, y + hh / 2 - r, r * 2, r * 2);
  });
  g.globalCompositeOperation = 'source-over';
}
function paintWindows(list) { return (g) => { g.fillStyle = 'rgba(30,24,22,.82)'; for (const [x, y, w, h] of list) g.fillRect(x, y, w, h); }; }

// ------------------------------------------------------------- shelter ---
KINDS.hut = {
  bake(mk, v = 0) {
    const r = rng(500 + v), w = 46 + v * 6;
    return {
      spr: mk('hut' + v, [-w - 16, -110, w + 16, 6])
        .piece([[-w, 4], [-w + 2, -38], [w - 2, -38], [w, 4]], '#a8825a', { round: 3, paint: (g) => { g.fillStyle = dark; g.beginPath(); g.moveTo(-6, 4); g.lineTo(-6, -18); g.quadraticCurveTo(2, -26, 10, -18); g.lineTo(10, 4); g.fill(); } })
        .piece([[-w - 14, -32], [-w * 0.4, -78], [0, -100], [w * 0.4, -78], [w + 14, -32], [0, -40]], '#c4a061', { round: 5, rough: 2.2, paint: (g) => { g.strokeStyle = 'rgba(110,80,40,.5)'; g.lineWidth = 1; for (let i = 0; i < 40; i++) { const x = -w - 10 + r() * (w * 2 + 20); g.beginPath(); g.moveTo(x * 0.25, -96); g.lineTo(x, -34); g.stroke(); } } })
        .finish(),
    };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh); },
};

KINDS.mudhouse = {
  bake(mk, v = 0) {
    const r = rng(520 + v), w = [44, 56, 38, 50][v % 4], h = [56, 72, 92, 60][v % 4], col = ['#c9a676', '#bf9b6a', '#d1b083', '#b8936a'][v % 4];
    const win = [[-w * 0.5, -h * 0.72, 8, 9], [w * 0.2, -h * 0.72, 8, 9]];
    if (h > 80) win.push([-4, -h * 0.42, 8, 9]);
    const sh = mk('mud' + v, [-w - 8, -h - 18, w + 8, 6]);
    sh.piece([[-w, 4], [-w + 1, -h], [w - 1, -h], [w, 4]], col, { round: 3, paint: (g) => { paintWindows(win)(g); g.fillStyle = dark; g.fillRect(-w * 0.15 - 6, -26, 13, 30); g.fillStyle = 'rgba(80,55,30,.2)'; g.fillRect(-w, -h, w * 2, 3); } });
    for (let i = 0; i < 4; i++) sh.piece(rect(-w + 6 + i * (w * 2 - 16) / 3, -h + 6, -w + 10 + i * (w * 2 - 16) / 3, -h + 10), '#6a4a30', { round: 0.5, lift: 0.8, thick: 0.6 });
    if (v % 2) sh.piece([[-w - 4, -h + 1], [w + 4, -h + 1], [w + 2, -h - 6], [-w - 2, -h - 6]], shade(col, 0.1), { round: 1, lift: 1 });
    return { spr: sh.finish(), windows: win };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh); },
  glow: windowsGlow,
};

KINDS.ziggurat = {
  bake(mk) {
    const col = '#c99f6c', sh = mk('ziggurat', [-180, -240, 180, 6]);
    const tiers = [[172, 150, 0, 72], [118, 102, -72, 56], [74, 62, -128, 42]];
    tiers.forEach(([wb, wt, y, h], i) => sh.piece([[-wb, y + 4], [-wt, y - h], [wt, y - h], [wb, y + 4]], shade(col, i * 0.05 - 0.02), { round: 2.5, paint: (g, s) => { g.strokeStyle = 'rgba(90,60,30,.13)'; g.lineWidth = 0.8; for (let yy = y; yy > y - h; yy -= 6) { g.beginPath(); g.moveTo(-wb, yy); g.lineTo(wb, yy); g.stroke(); } g.fillStyle = 'rgba(255,240,210,.10)'; for (let x = -wb + 14; x < wb - 10; x += 26) g.fillRect(x, y - h + 4, 9, h - 4); g.fillStyle = 'rgba(60,35,15,.10)'; for (let x = -wb + 23; x < wb - 10; x += 26) g.fillRect(x, y - h + 4, 3, h - 4); } }));
    sh.piece([[-22, 4], [-9, -170], [9, -170], [22, 4]], shade(col, -0.1), { round: 2, lift: 2.4, paint: (g) => { g.strokeStyle = 'rgba(70,45,20,.45)'; g.lineWidth = 0.9; for (let y = 2; y > -170; y -= 4.5) { const w = 22 - (2 - y) * 0.076; g.beginPath(); g.moveTo(-w, y); g.lineTo(w, y); g.stroke(); } } });
    sh.piece([[-34, -168], [-32, -204], [32, -204], [34, -168]], '#dcbc8c', { round: 2, lift: 2, paint: (g) => { g.fillStyle = dark; g.beginPath(); g.moveTo(-7, -168); g.lineTo(-7, -190); g.quadraticCurveTo(0, -197, 7, -190); g.lineTo(7, -168); g.fill(); g.fillStyle = '#4a6fa0'; g.fillRect(-32, -204, 64, 5); } });
    return { spr: sh.finish({ shadowBlur: 8 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 5, 6); },
};

// Solid plank wheel (the earliest wheels were made of planks, not spokes).
KINDS.wheel = {
  bake(mk) {
    const sh = mk('wheel', [-30, -30, 30, 30], { pad: 6 });
    sh.piece(ellipse(0, 0, 26, 26, 22), '#8a6040', { round: 6, rough: 0.6, paint: (g) => { g.strokeStyle = 'rgba(50,30,15,.6)'; g.lineWidth = 1.2; for (const x of [-9, 9]) { g.beginPath(); g.moveTo(x, -26); g.lineTo(x, 26); g.stroke(); } g.fillStyle = 'rgba(60,40,20,.5)'; g.fillRect(-20, -3, 40, 6); } });
    sh.piece(ellipse(0, 0, 6, 6, 10), '#5a3d28', { round: 2, lift: 1.4 });
    return { spr: sh.finish({ shadowBlur: 3 }) };
  },
  draw(g, P, t, e, env) {
    const d = e.move ? -e.move(t) * DEG * 1000 : 0;
    g.translate(0, -26); g.rotate(-d / 26); put(g, P.spr, env.sh, 2, 3);
  },
};

// ---------------------------------------------------- roads and temples ---
KINDS.pagoda = {
  bake(mk) {
    const sh = mk('pagoda', [-80, -300, 80, 6]);
    sh.piece(rect(-56, 4, 56, -14), '#9a8a74', { round: 1 });
    for (let i = 0; i < 5; i++) {
      const w = 40 - i * 5, y = -14 - i * 46;
      sh.piece(rect(-w, y, w, y - 34), '#a3392c', { round: 1.5, lift: 1.4, paint: (g) => { g.fillStyle = 'rgba(240,220,170,.55)'; g.fillRect(-w + 6, y - 28, w * 2 - 12, 6); g.fillStyle = dark; g.fillRect(-5, y - 22, 10, 22); } });
      const ew = w + 26;
      sh.piece([[-ew - 6, y - 30], [-ew, y - 36], [-w, y - 46], [w, y - 46], [ew, y - 36], [ew + 6, y - 30], [ew - 6, y - 32], [-ew + 6, y - 32]], '#3d4a44', { round: 2, lift: 2 });
    }
    sh.piece(strip(0, -244, 0, -294, 4, 2), '#c9a24a', { round: 1, lift: 1 });
    for (let k = 0; k < 5; k++) sh.piece(ellipse(0, -254 - k * 7, 6 - k * 0.6, 2, 8), '#c9a24a', { round: 1, lift: 1 });
    return { spr: sh.finish({ shadowBlur: 6 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 4, 5); },
};
KINDS.stupa = {
  bake(mk) {
    const c = '#e8dfcc', sh = mk('stupa', [-90, -190, 90, 6]);
    sh.piece(rect(-84, 4, 84, -20), '#c9bfa8', { round: 1.5 });
    const dome = []; for (let i = 0; i <= 16; i++) { const a = Math.PI + (i / 16) * Math.PI; dome.push([Math.cos(a) * 68, -20 + Math.sin(a) * 74]); }
    sh.piece(dome, c, { round: 4, lift: 1.6, paint: (g) => { g.strokeStyle = 'rgba(150,130,100,.4)'; g.lineWidth = 1; g.beginPath(); g.ellipse(0, -20, 68, 14, 0, Math.PI, 0); g.stroke(); } });
    sh.piece(rect(-14, -92, 14, -112), '#d8cdb5', { round: 1, lift: 1.4 });
    sh.piece(strip(0, -112, 0, -180, 3.4, 2.4), '#b8a27a', { round: 1, lift: 1 });
    for (let k = 0; k < 3; k++) sh.piece(rect(-16 + k * 4, -126 - k * 18, 16 - k * 4, -129 - k * 18), '#c9a24a', { round: 1, lift: 1 });
    sh.piece([[0, -150], [26, -142], [0, -136]], '#d9822b', { round: 1, lift: 1, thick: 0.5 });
    return { spr: sh.finish({ shadowBlur: 6 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 4, 5); },
};
KINDS.mosque = {
  bake(mk) {
    const c = '#d9c9a8', sh = mk('mosque', [-110, -250, 110, 6]);
    sh.piece(rect(-100, 4, 64, -70), c, { round: 2, paint: (g) => { g.fillStyle = dark; for (const x of [-80, -50, -20, 10, 40]) { g.beginPath(); g.moveTo(x, -10); g.lineTo(x, -34); g.quadraticCurveTo(x + 7, -46, x + 14, -34); g.lineTo(x + 14, -10); g.fill(); } } });
    sh.piece(rect(-46, -70, 26, -94), shade(c, -0.05), { round: 1, lift: 1.4 });
    const dome = []; for (let i = 0; i <= 16; i++) { const a = Math.PI + (i / 16) * Math.PI; dome.push([-10 + Math.cos(a) * 40, -94 + Math.sin(a) * 52 * (1 - 0.15 * Math.sin(i / 16 * Math.PI) ** 8)]); }
    sh.piece(dome, '#3f7d86', { round: 4, lift: 1.8, paint: (g) => { g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.ellipse(-24, -120, 8, 18, -0.4, 0, 7); g.fill(); } });
    sh.piece(strip(-10, -146, -10, -164, 2, 1.4), '#c9a24a', { round: 1, lift: 1 });
    sh.piece([[70, 4], [70, -190], [74, -204], [86, -214], [98, -204], [102, -190], [102, 4]], c, { round: 2, lift: 1.8, paint: (g) => { g.fillStyle = 'rgba(120,90,60,.3)'; for (let y = -20; y > -190; y -= 34) g.fillRect(70, y, 32, 3); g.fillStyle = dark; g.fillRect(83, -180, 6, 14); } });
    sh.piece([[66, -150], [106, -150], [104, -158], [68, -158]], shade(c, 0.08), { round: 1, lift: 1.2 });
    return { spr: sh.finish({ shadowBlur: 6 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 4, 5); },
};
// A Sahelian mud-brick mosque, its wooden toron beams sticking out of the walls.
KINDS.djenne = {
  bake(mk) {
    const c = '#b7865a', sh = mk('djenne', [-130, -210, 130, 6]);
    const tower = (x, w, h) => { const pts = [[x - w, 4], [x - w + 5, -h], [x - w * 0.5, -h - 8], [x - w * 0.5 + 4, -h - 22], [x, -h - 16], [x + w * 0.5 - 4, -h - 22], [x + w * 0.5, -h - 8], [x + w - 5, -h], [x + w, 4]]; sh.piece(pts, c, { round: 7, lift: 1.6, paint: (g) => { g.fillStyle = 'rgba(255,235,200,.12)'; g.fillRect(x - w + 6, -h, 8, h); g.fillStyle = 'rgba(80,50,25,.10)'; g.fillRect(x + w - 12, -h, 6, h); } }); for (let y = -24; y > -h + 10; y -= 22) for (const dx of [-w * 0.55, 0, w * 0.55]) sh.piece(rect(x + dx - 1.4, y, x + dx + 1.4, y - 7), '#5a4030', { round: 0.4, lift: 0.6, thick: 0.5 }); sh.piece(ellipse(x, -h - 22, 4, 4, 8), '#e8dcc0', { round: 1, lift: 1 }); };
    sh.piece([[-124, 4], [-122, -90], [-112, -100], [-100, -92], [-86, -100], [-72, -92], [72, -92], [86, -100], [100, -92], [112, -100], [122, -90], [124, 4]], shade(c, 0.06), { round: 4, paint: (g) => { g.fillStyle = 'rgba(255,235,200,.10)'; for (let x = -110; x < 120; x += 22) g.fillRect(x, -90, 6, 90); g.fillStyle = dark; g.beginPath(); g.moveTo(-12, 4); g.lineTo(-12, -30); g.quadraticCurveTo(0, -42, 12, -30); g.lineTo(12, 4); g.fill(); } });
    tower(-84, 26, 150); tower(0, 32, 182); tower(84, 26, 150);
    return { spr: sh.finish({ shadowBlur: 6 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 4, 5); },
};

// ---------------------------------------------------------------- ships ---
function boatBob(g, t, e, amp = 1) { g.translate(0, Math.sin(t * 1.3 + e.a) * 3 * amp); g.rotate(Math.sin(t * 0.9 + e.a * 2) * 2.4 * amp * DEG); }
KINDS.raft = {
  bake(mk) {
    const sh = mk('raft', [-70, -16, 70, 10]);
    for (let i = 0; i < 2; i++) sh.piece([[-66, 4 - i * 6], [64, 4 - i * 6], [68, -2 - i * 6], [-62, -2 - i * 6]], i ? '#8a6a44' : '#6e5232', { round: 3, lift: 1 });
    sh.piece(rect(-40, -10, -36, 6), '#4a3826', { round: 0.5, lift: 0.8 }).piece(rect(30, -10, 34, 6), '#4a3826', { round: 0.5, lift: 0.8 });
    const paddle = mk('paddle', [-4, -4, 6, 60], { pad: 5 }).piece(strip(0, 0, 1, 40, 2.4, 2), '#5b4331', { round: 1 }).piece([[-3, 38], [5, 38], [5, 58], [-3, 58]], '#6e5232', { round: 2, lift: 1 }).finish({ shadowBlur: 2 });
    return { spr: sh.finish(), a: KINDS.person.bake(mk, 'paddler'), b: KINDS.person.bake(mk, 'walkB'), paddle };
  },
  draw(g, P, t, e, env) {
    boatBob(g, t, e);
    const ph = t * 2.2;
    g.save(); g.translate(26, -6); drawPerson(g, P.b, t, e, env, { lean: 2, head: -4 + Math.sin(t * 0.5) * 4, back: [-20, -30], front: [-30, -40], held: () => {} }); g.restore();
    g.save(); g.translate(-30, -6); drawPerson(g, P.a, t, e, env, { lean: 22 + Math.sin(ph) * 8, head: -8, back: [-50 + Math.sin(ph) * 30, -30], front: [-60 + Math.sin(ph) * 40, -20], held: (g2) => { g2.save(); g2.translate(0, 12); g2.rotate(-20 * DEG); put(g2, P.paddle, 0); g2.restore(); } }); g.restore();
    put(g, P.spr, env.sh);
  },
};
KINDS.dhow = {
  bake(mk) {
    const sh = mk('dhow', [-110, -190, 110, 16]);
    sh.piece([[-100, -24], [-80, 8], [70, 10], [104, -30], [80, -20], [-60, -16]], '#7a5232', { round: 4, paint: (g) => { g.strokeStyle = 'rgba(40,25,15,.5)'; g.lineWidth = 1; for (let y = -16; y < 10; y += 5) { g.beginPath(); g.moveTo(-96, y); g.lineTo(100, y); g.stroke(); } } });
    sh.piece(strip(0, -16, 6, -176, 4, 3), '#4a3423', { round: 1, lift: 1 });
    sh.piece([[-80, -40], [10, -178], [78, -24]], '#efe4cc', { round: 3, lift: 2.4, paint: (g) => { g.strokeStyle = 'rgba(150,120,80,.35)'; g.lineWidth = 0.8; for (let k = 1; k < 6; k++) { g.beginPath(); g.moveTo(-80 + k * 15, -40 + k * 2); g.lineTo(10 + k * 12, -178 + k * 26); g.stroke(); } } });
    return { spr: sh.finish({ shadowBlur: 6 }) };
  },
  draw(g, P, t, e, env) { boatBob(g, t, e); put(g, P.spr, env.sh, 4, 5); },
};
KINDS.canoe = {
  bake(mk) {
    const sh = mk('canoe', [-130, -200, 130, 14]);
    sh.piece([[-124, -26], [-110, 4], [104, 6], [126, -30], [104, -12], [-104, -12]], '#5e3b26', { round: 4, paint: (g) => { g.fillStyle = 'rgba(230,200,150,.35)'; for (let x = -90; x < 100; x += 14) { g.beginPath(); g.moveTo(x, -6); g.lineTo(x + 6, 0); g.lineTo(x + 12, -6); g.fill(); } } });
    sh.piece(rect(-96, -16, 96, -22), '#8a6a44', { round: 1, lift: 1.2 });
    sh.piece(strip(-10, -20, -4, -150, 3.4, 2.4), '#4a3423', { round: 1, lift: 1 });
    sh.piece([[-6, -24], [-60, -120], [-74, -186], [-40, -150], [-8, -128], [30, -170], [62, -190], [44, -130]], '#c9a36a', { round: 5, lift: 2.4, paint: (g) => { g.strokeStyle = 'rgba(120,85,45,.4)'; g.lineWidth = 0.9; for (let k = 0; k < 9; k++) { g.beginPath(); g.moveTo(-6, -24); g.lineTo(-70 + k * 15, -180 + Math.abs(k - 4) * 8); g.stroke(); } } });
    return { spr: sh.finish({ shadowBlur: 6 }), nav: KINDS.person.bake(mk, 'navigator') };
  },
  draw(g, P, t, e, env) {
    boatBob(g, t, e, 1.3); put(g, P.spr, env.sh, 4, 5);
    g.save(); g.translate(60, -16); drawPerson(g, P.nav, t, e, env, { lean: -4, head: -20 + Math.sin(t * 0.4) * 6, back: [10, -10], front: [-150 + Math.sin(t * 0.6) * 6, -10] }); g.restore();
  },
};
KINDS.ship = {
  bake(mk) {
    const sh = mk('ship', [-150, -280, 150, 16]);
    sh.piece([[-140, -56], [-120, 8], [100, 10], [134, -44], [112, -40], [104, -26], [-96, -26], [-110, -70], [-140, -70]], '#6b4a2e', { round: 3, paint: (g) => { g.strokeStyle = 'rgba(40,25,15,.5)'; g.lineWidth = 1; for (let y = -24; y < 10; y += 6) { g.beginPath(); g.moveTo(-130, y); g.lineTo(120, y); g.stroke(); } g.fillStyle = 'rgba(200,170,90,.5)'; g.fillRect(-120, -30, 230, 3); } });
    for (const [x, h] of [[-80, 190], [10, 250], [86, 170]]) sh.piece(strip(x, -26, x + 2, -26 - h, 4, 2.6), '#4a3423', { round: 1, lift: 1 });
    const sail = (x, y0, w, h) => sh.piece([[x - w, y0], [x - w - 4, y0 - h * 0.5], [x - w + 2, y0 - h], [x + w - 2, y0 - h], [x + w + 4, y0 - h * 0.5], [x + w, y0]], '#ece1c6', { round: 4, lift: 2.4, paint: (g) => { g.fillStyle = 'rgba(170,40,30,.85)'; g.fillRect(x - 4, y0 - h * 0.85, 8, h * 0.6); g.fillRect(x - h * 0.24, y0 - h * 0.6, h * 0.48, 8); } });
    sail(10, -70, 52, 100); sail(10, -186, 36, 54); sail(-80, -70, 40, 80);
    sh.piece([[86, -40], [86, -180], [140, -50]], '#e4d8bc', { round: 3, lift: 2 });
    return { spr: sh.finish({ shadowBlur: 8 }) };
  },
  draw(g, P, t, e, env) { boatBob(g, t, e, 0.8); put(g, P.spr, env.sh, 5, 6); },
};

// --------------------------------------------------------------- europe ---
KINDS.timber = {
  bake(mk, v = 0) {
    const w = [40, 48, 36][v % 3], h = [96, 110, 120][v % 3], roof = ['#7a3b2a', '#5d4a44', '#8a4a32'][v % 3];
    const win = [[-w + 10, -h + 30, 9, 11], [w - 19, -h + 30, 9, 11], [-w + 10, -h * 0.45, 9, 11]];
    const sh = mk('timber' + v, [-w - 12, -h - 60, w + 12, 6]);
    sh.piece(rect(-w, 4, w, -h), '#eadfc6', { round: 2, paint: (g) => { paintWindows(win)(g); g.fillStyle = '#4a3020'; for (const x of [-w, -w * 0.33, w * 0.33, w - 4]) g.fillRect(x, -h, 4, h + 4); g.fillRect(-w, -h * 0.55, w * 2, 4); g.save(); g.strokeStyle = '#4a3020'; g.lineWidth = 3; g.beginPath(); g.moveTo(-w, -h * 0.55); g.lineTo(-w * 0.33, -h); g.moveTo(w, -h * 0.55); g.lineTo(w * 0.33, -h); g.stroke(); g.restore(); g.fillStyle = dark; g.fillRect(4, -30, 14, 34); } });
    sh.piece([[-w - 10, -h + 2], [0, -h - 56], [w + 10, -h + 2]], roof, { round: 3, lift: 1.6, paint: (g, s) => lines(roof, 0.3, 6)(g, s) });
    return { spr: sh.finish(), windows: win };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh); },
  glow: windowsGlow,
};
KINDS.church = {
  bake(mk) {
    const c = '#b9ad98', sh = mk('church', [-100, -330, 100, 6]);
    sh.piece([[-96, 4], [-96, -110], [-40, -150], [-40, 4]], c, { round: 2, paint: (g) => { g.fillStyle = dark; for (const x of [-84, -64]) { g.beginPath(); g.moveTo(x, -40); g.lineTo(x, -80); g.lineTo(x + 6, -92); g.lineTo(x + 12, -80); g.lineTo(x + 12, -40); g.fill(); } } });
    sh.piece(rect(-40, 4, 40, -200), shade(c, 0.06), { round: 2, lift: 1.6, paint: (g) => { g.fillStyle = dark; g.beginPath(); g.arc(0, -150, 16, 0, 7); g.fill(); g.beginPath(); g.moveTo(-14, 4); g.lineTo(-14, -40); g.lineTo(0, -60); g.lineTo(14, -40); g.lineTo(14, 4); g.fill(); } });
    sh.piece([[-44, -198], [0, -322], [44, -198]], '#6a6660', { round: 2, lift: 1.8 });
    sh.piece(strip(0, -320, 0, -336, 2, 2), '#c9a24a', { round: 1, lift: 1 });
    return { spr: sh.finish({ shadowBlur: 6 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 4, 5); },
};
// The press: pull the bar, the screw turns, the platen comes down on the paper.
KINDS.press = {
  bake(mk) {
    const wood = '#6a4a2e', P = {};
    P.frame = mk('press-frame', [-60, -190, 60, 6]).piece(rect(-50, 4, -38, -184), wood, { round: 1.5 }).piece(rect(38, 4, 50, -184), wood, { round: 1.5 }).piece(rect(-56, -170, 56, -186), shade(wood, 0.08), { round: 1.5, lift: 1.4 }).piece(rect(-56, -60, 56, -72), shade(wood, 0.08), { round: 1.5, lift: 1.4 }).piece(rect(-34, -72, 34, -78), '#e9e0c8', { round: 0.8, lift: 1 }).finish();
    P.screw = mk('press-screw', [-8, -4, 8, 70], { pad: 5 }).piece(rect(-5, 0, 5, 64), '#8a8070', { round: 1, paint: (g) => { g.strokeStyle = 'rgba(40,30,20,.6)'; g.lineWidth = 1.2; for (let y = 2; y < 64; y += 5) { g.beginPath(); g.moveTo(-5, y); g.lineTo(5, y + 3); g.stroke(); } } }).finish({ shadowBlur: 2 });
    P.platen = mk('press-platen', [-40, -6, 40, 14], { pad: 5 }).piece(rect(-36, 0, 36, 10), shade(wood, 0.12), { round: 1.5 }).finish({ shadowBlur: 3 });
    P.bar = mk('press-bar', [-4, -4, 70, 6], { pad: 5 }).piece(strip(0, 0, 66, -2, 5, 3.5), '#4a3423', { round: 1.5 }).finish({ shadowBlur: 2 });
    return P;
  },
  draw(g, P, t, e, env) {
    const pulls = e.pulls || [], k = pulls.reduce((s, p) => s + Math.exp(-(((t - p) / 0.35) ** 2)), 0);
    put(g, P.frame, env.sh, 4, 5);
    const down = Math.min(1, k) * 16;
    g.save(); g.translate(0, -168 + down * 0.3); put(g, P.screw, env.sh * 0.5); g.restore();
    g.save(); g.translate(0, -112 + down * 2.1); put(g, P.platen, env.sh * 0.5); g.restore();
    g.save(); g.translate(0, -140 + down); g.rotate((-10 + k * 70) * DEG); put(g, P.bar, env.sh * 0.5); g.restore();
  },
};

// --------------------------------------------------------------- science ---
KINDS.telescope = {
  bake(mk) {
    const P = {};
    P.stand = mk('tel-stand', [-30, -84, 30, 6]).piece([[-26, 4], [-3, -80], [3, -80], [26, 4], [20, 4], [0, -64], [-20, 4]], '#5b4331', { round: 1.5 }).finish({ shadowBlur: 3 });
    P.tube = mk('tel-tube', [-50, -8, 60, 8], { pad: 5 }).piece([[-46, -5], [56, -3.4], [56, 3.4], [-46, 5]], '#7a4a2a', { round: 1.5, paint: (g) => { g.fillStyle = 'rgba(200,160,80,.7)'; for (const x of [-30, 0, 30]) g.fillRect(x, -5, 3, 10); } }).piece(rect(52, -4.5, 60, 4.5), '#c9a24a', { round: 1, lift: 1 }).finish({ shadowBlur: 3 });
    return P;
  },
  draw(g, P, t, e, env) { put(g, P.stand, env.sh); g.translate(0, -78); g.rotate((-(e.aim ? e.aim(t) : 40)) * DEG); put(g, P.tube, env.sh * 0.6); },
};
KINDS.lantern = {
  bake(mk) { return { spr: mk('lantern', [-30, -60, 30, 6]).piece([[-26, -34], [26, -34], [24, -40], [-24, -40]], '#6a4a2e', { round: 1 }).piece(strip(-20, 4, -18, -34, 4, 4), '#5b4331', { round: 1 }).piece(strip(20, 4, 18, -34, 4, 4), '#5b4331', { round: 1 }).piece(rect(-3, -40, 3, -50), '#efe2c4', { round: 1, lift: 1 }).finish() }; },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh); },
};

// ---------------------------------------------------------------- industry ---
KINDS.factory = {
  bake(mk, v = 0) {
    const c = ['#8a4a36', '#7a4434'][v % 2], w = 110, win = [];
    for (let x = -w + 14; x < w - 20; x += 26) for (const y of [-74, -40]) win.push([x, y, 14, 18]);
    const sh = mk('factory' + v, [-w - 10, -280, w + 10, 6]);
    sh.piece(rect(-w, 4, w, -96), c, { round: 2, paint: (g, s) => { bricks(c)(g, s); paintWindows(win)(g); g.fillStyle = dark; g.fillRect(-12, -30, 24, 34); } });
    const saw = [[-w, -94]]; for (let x = -w; x < w; x += 44) saw.push([x, -130], [x + 30, -96], [x + 44, -96]); saw.push([w, -94]);
    sh.piece(saw, '#4d4744', { round: 1.5, lift: 1.4 });
    sh.piece([[w - 50, -96], [w - 44, -270], [w - 22, -270], [w - 16, -96]], shade(c, -0.08), { round: 1.5, lift: 1.6, paint: (g, s) => { bricks(c, 0.35)(g, s); g.fillStyle = '#2e2622'; g.fillRect(w - 47, -270, 28, 8); } });
    return { spr: sh.finish({ shadowBlur: 6 }), windows: win, chimney: [w - 33, -272] };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 4, 5); },
  glow: windowsGlow,
};
KINDS.terrace = {
  bake(mk, v = 0) {
    const c = ['#9a5a44', '#8a6a5a', '#7a5a4a'][v % 3], w = 80, win = [];
    for (const x of [-64, -24, 16, 50]) for (const y of [-92, -52]) win.push([x, y, 12, 18]);
    const sh = mk('terrace' + v, [-w - 8, -150, w + 8, 6]);
    sh.piece(rect(-w, 4, w, -112), c, { round: 2, paint: (g, s) => { bricks(c)(g, s); paintWindows(win)(g); g.fillStyle = dark; g.fillRect(-48, -30, 14, 34); g.fillRect(30, -30, 14, 34); } });
    sh.piece([[-w - 4, -110], [-w + 10, -132], [w - 10, -132], [w + 4, -110]], '#4a4648', { round: 1.5, lift: 1.4 });
    for (const x of [-40, 40]) sh.piece(rect(x - 7, -128, x + 7, -148), shade(c, -0.1), { round: 1, lift: 1 });
    return { spr: sh.finish(), windows: win };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh); },
  glow: windowsGlow,
};
KINDS.lamp = {
  bake(mk, v = 0) {
    const gas = v === 0;
    return { spr: mk('lamp' + v, [-14, -130, 14, 6]).piece(strip(0, 4, 0, -110, 5, 3), '#2f2c2e', { round: 1 }).piece(gas ? [[-9, -110], [9, -110], [7, -126], [-7, -126]] : [[-3, -110], [14, -122], [16, -116], [0, -106]], '#3a3638', { round: 1.5, lift: 1, paint: (g) => { g.fillStyle = 'rgba(40,40,40,.5)'; if (gas) g.fillRect(-6, -124, 12, 12); } }).finish({ shadowBlur: 3 }), gas };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh); },
  glow(g, P, t, e, env, p) {
    const k = e.lit ? e.lit(t) : 0; if (k < 0.01 || p < 0.6) return;
    const [x, y] = P.gas ? [0, -118] : [10, -116], c = P.gas ? [255, 214, 140] : [255, 236, 200];
    g.globalCompositeOperation = 'lighter';
    const gr = g.createRadialGradient(x, y, 0, x, y, 40); gr.addColorStop(0, rgb(c, 0.95 * k)); gr.addColorStop(0.15, rgb(c, 0.5 * k)); gr.addColorStop(1, rgb(c, 0));
    g.fillStyle = gr; g.fillRect(x - 40, y - 40, 80, 80);
    g.globalCompositeOperation = 'source-over';
  },
};
KINDS.train = {
  bake(mk) {
    const P = {}, green = '#2f4a3a';
    P.loco = mk('loco', [-74, -110, 70, 6])
      .piece([[-70, -20], [-70, -40], [36, -40], [40, -20]], '#2a2626', { round: 1.5 })
      .piece([[-30, -40], [-30, -78], [34, -78], [38, -40]], green, { round: 6, paint: (g) => { g.fillStyle = 'rgba(200,170,90,.8)'; for (const x of [-20, 0, 20]) g.fillRect(x, -78, 3, 38); } })
      .piece([[-70, -40], [-70, -96], [-34, -96], [-30, -40]], shade(green, 0.08), { round: 2, lift: 1.4, paint: (g) => { g.fillStyle = 'rgba(30,24,22,.82)'; g.fillRect(-62, -88, 22, 18); } })
      .piece([[-74, -96], [-30, -96], [-30, -102], [-74, -102]], '#1e1c1c', { round: 1, lift: 1 })
      .piece([[16, -78], [14, -100], [10, -106], [30, -106], [26, -100], [24, -78]], '#1e1c1c', { round: 1.5, lift: 1.4 })
      .piece([[38, -24], [62, -6], [36, -6]], '#7a2f2a', { round: 1, lift: 1 })
      .finish();
    P.wheel = mk('tr-wheel', [-16, -16, 16, 16], { pad: 4 }).piece(ellipse(0, 0, 14, 14, 16), '#3a3232', { round: 4, paint: (g) => { g.strokeStyle = 'rgba(200,190,170,.6)'; g.lineWidth = 1.4; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(Math.cos(k * 0.785) * -12, Math.sin(k * 0.785) * -12); g.lineTo(Math.cos(k * 0.785) * 12, Math.sin(k * 0.785) * 12); g.stroke(); } } }).piece(ellipse(0, 0, 3.5, 3.5, 8), '#a39886', { round: 1, lift: 1 }).finish({ shadowBlur: 2 });
    P.coach = mk('coach', [-62, -84, 62, 6]).piece(rect(-58, -20, 58, -76), '#7a2f2a', { round: 3, paint: (g) => { g.fillStyle = 'rgba(30,24,22,.82)'; for (let x = -48; x < 50; x += 22) g.fillRect(x, -66, 14, 18); g.fillStyle = 'rgba(220,180,90,.6)'; g.fillRect(-58, -40, 116, 3); } }).piece(rect(-62, -76, 62, -82), '#3a3436', { round: 1.5, lift: 1 }).piece(rect(-50, -12, 50, -20), '#2a2626', { round: 1 }).finish();
    P.coachWin = []; for (let x = -48; x < 50; x += 22) P.coachWin.push([x, -66, 14, 18]);
    return P;
  },
  draw(g, P, t, e, env) {
    const d = e.move ? e.move(t) * DEG * 1000 : 0, rock = Math.sin(t * 9) * 0.6;
    // The coaches follow the curve of the world behind the engine: each one stands on the ground
    // under its own wheels, tilted to it, instead of sticking out straight into the air.
    const sc = e.scale || 1, a0 = e.a + (e.move ? e.move(t) : 0), pr = e.prof || (() => 0), lift = e.y || 0, r0 = 1000 + pr(a0) + lift;
    for (const off of [-150, -280]) {
      const dr = (off * sc) / r0, r1 = 1000 + pr(a0 + dr / DEG) + lift;
      g.save(); g.translate((Math.sin(dr) * r1) / sc, (r0 - Math.cos(dr) * r1) / sc + rock); g.rotate(dr);
      put(g, P.coach, env.sh, 3, 4);
      for (const x of [-38, 38]) { g.save(); g.translate(x, -12); g.rotate(d / 14); put(g, P.wheel, 0); g.restore(); }
      g.restore();
    }
    g.save(); g.translate(0, rock * 0.5); put(g, P.loco, env.sh, 3, 4); g.restore();
    for (const x of [-50, -10, 22]) { g.save(); g.translate(x, -14); g.rotate(d / 14); put(g, P.wheel, 0); g.restore(); }
  },
  glow(g, P, t, e, env, p) {
    if (!e.winOn || p < 0.6) return; const k = e.winOn(t, 0); if (k < 0.01) return;
    g.globalCompositeOperation = 'lighter';
    const sc = e.scale || 1, a0 = e.a + (e.move ? e.move(t) : 0), pr = e.prof || (() => 0), lift = e.y || 0, r0 = 1000 + pr(a0) + lift;
    for (const off of [-150, -280]) {
      const dr = (off * sc) / r0, r1 = 1000 + pr(a0 + dr / DEG) + lift;
      g.save(); g.translate((Math.sin(dr) * r1) / sc, (r0 - Math.cos(dr) * r1) / sc); g.rotate(dr);
      for (const [x, y, w, h] of P.coachWin) { g.fillStyle = `rgba(255,200,120,${0.8 * k})`; g.fillRect(x, y, w, h); }
      g.restore();
    }
    g.globalCompositeOperation = 'source-over';
  },
};

// ---------------------------------------------------------------- the city ---
KINDS.tower = {
  bake(mk, v = 0) {
    const specs = [
      { w: 46, h: 210, c: '#7d7468', top: 'flat' }, { w: 38, h: 290, c: '#8a8070', top: 'deco' }, { w: 56, h: 160, c: '#6a5f58', top: 'flat' },
      { w: 30, h: 250, c: '#9a8e7c', top: 'spire' }, { w: 52, h: 330, c: '#5d6670', top: 'glass' }, { w: 40, h: 270, c: '#6a7a86', top: 'glass' }, { w: 60, h: 120, c: '#8a6a58', top: 'flat' },
    ];
    const s = specs[v % specs.length], win = [], glass = s.top === 'glass';
    for (let y = -s.h + 18; y < -24; y += glass ? 16 : 22) for (let x = -s.w + 8; x < s.w - 10; x += glass ? 12 : 16) win.push([x, y, glass ? 8 : 9, glass ? 10 : 13]);
    const sh = mk('tower' + v, [-s.w - 8, -s.h - 70, s.w + 8, 6]);
    sh.piece(rect(-s.w, 4, s.w, -s.h), s.c, { round: 2, paint: (g) => { paintWindows(win)(g); if (glass) { g.fillStyle = 'rgba(160,200,230,.12)'; g.fillRect(-s.w, -s.h, s.w, s.h); } } });
    if (s.top === 'deco') { sh.piece(rect(-s.w + 8, -s.h, s.w - 8, -s.h - 30), shade(s.c, 0.06), { round: 2, lift: 1.4 }); sh.piece(rect(-s.w + 18, -s.h - 30, s.w - 18, -s.h - 52), shade(s.c, 0.1), { round: 2, lift: 1.4 }); sh.piece(strip(0, -s.h - 52, 0, -s.h - 68, 3, 1), '#c9b07a', { round: 1, lift: 1 }); }
    if (s.top === 'spire') sh.piece([[-s.w, -s.h], [0, -s.h - 64], [s.w, -s.h]], shade(s.c, 0.1), { round: 2, lift: 1.4 });
    if (glass) sh.piece(strip(s.w * 0.4, -s.h, s.w * 0.4, -s.h - 40, 2, 1), '#4a4a50', { round: 0.5, lift: 1 });
    return { spr: sh.finish({ shadowBlur: 6 }), windows: win, mast: glass ? [s.w * 0.4, -s.h - 40] : null };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 4, 5); },
  glow(g, P, t, e, env, p) {
    windowsGlow(g, P, t, e, env, p);
    if (P.mast && p > 0.6 && (env.S.blink ?? 0) > 0) { const on = (t * 0.8 + e.a) % 1 < 0.5 ? 1 : 0.15; g.globalCompositeOperation = 'lighter'; const [x, y] = P.mast, gr = g.createRadialGradient(x, y, 0, x, y, 14); gr.addColorStop(0, `rgba(255,60,40,${on * env.S.blink})`); gr.addColorStop(1, 'rgba(255,60,40,0)'); g.fillStyle = gr; g.fillRect(x - 14, y - 14, 28, 28); g.globalCompositeOperation = 'source-over'; }
  },
};
KINDS.pole = {
  bake(mk) { return { spr: mk('pole', [-22, -170, 22, 6]).piece(strip(0, 4, 0, -166, 6, 4.4), '#5a4434', { round: 1 }).piece(rect(-20, -150, 20, -156), '#5a4434', { round: 1, lift: 1 }).piece(rect(-18, -158, -15, -162), '#e8e0d0', { round: 0.5, lift: 0.6 }).piece(rect(15, -158, 18, -162), '#e8e0d0', { round: 0.5, lift: 0.6 }).finish({ shadowBlur: 3 }) }; },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh); },
};
KINDS.mast = {
  bake(mk) { const sh = mk('mast', [-30, -260, 30, 6]); sh.piece([[-24, 4], [-3, -250], [3, -250], [24, 4], [18, 4], [0, -220], [-18, 4]], '#9a9ca2', { round: 1, paint: (g) => { g.strokeStyle = 'rgba(80,80,90,.8)'; g.lineWidth = 1.2; for (let y = 0; y > -220; y -= 20) { const w = 24 * (1 + y / 250); g.beginPath(); g.moveTo(-w, y); g.lineTo(w * 0.8, y - 20); g.stroke(); } } }); sh.piece(rect(-8, -200, -4, -224), '#d8d8dc', { round: 1, lift: 1 }); sh.piece(rect(4, -180, 8, -204), '#d8d8dc', { round: 1, lift: 1 }); return { spr: sh.finish({ shadowBlur: 4 }) }; },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh); },
  glow(g, P, t, e, env, p) { if (p < 0.6 || !(env.S.blink > 0)) return; const on = (t * 0.7) % 1 < 0.5 ? 1 : 0.1; g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(0, -252, 0, 0, -252, 18); gr.addColorStop(0, `rgba(255,60,40,${on * env.S.blink})`); gr.addColorStop(1, 'rgba(255,60,40,0)'); g.fillStyle = gr; g.fillRect(-18, -270, 36, 36); g.globalCompositeOperation = 'source-over'; },
};

// ------------------------------------------------------------ the future ---
// Plain, unpainted board: nothing has been cut from it yet.
KINDS.blank = {
  bake(mk, v = 0) {
    const r = rng(700 + v), w = [40, 60, 30, 76, 50][v % 5], h = [110, 70, 150, 90, 190][v % 5];
    const sh = mk('blank' + v, [-w - 6, -h - 10, w + 6, 6]);
    sh.piece([[-w, 4], [-w + r() * 2, -h], [w - r() * 2, -h - r() * 3], [w, 4]], ['#cfae80', '#c8a77a', '#d4b689', '#c2a173', '#ccab7d'][v % 5], { round: 1.2, rough: 0.5, rim: 0.6, paint: (g) => { g.strokeStyle = 'rgba(110,80,50,.16)'; g.lineWidth = 1.4; for (let x = -w + 4; x < w; x += 7) { g.beginPath(); g.moveTo(x, -h); g.lineTo(x, 4); g.stroke(); } } });
    sh.piece(rect(-w + 1, -h + 1, w - 1, -h + 5), KRAFT_EDGE, { round: 0.5, lift: 0.6, thick: 0.5, rim: 0, paint: (g) => { g.fillStyle = 'rgba(240,220,180,.7)'; for (let x = -w + 2; x < w; x += 4) { g.beginPath(); g.arc(x, -h + 3, 1.4, 0, 7); g.fill(); } } });
    return { spr: sh.finish() };
  },
  draw(g, P, t, e, env) { g.rotate(fbm(t * 0.3 + e.a, 5) * 1.2 * DEG); put(g, P.spr, env.sh); },
};

// ------------------------------------------------------- the modern world ---
const lattice = (x0, x1, y0, y1, step) => (g) => { g.strokeStyle = 'rgba(60,50,30,.55)'; g.lineWidth = 1.1; for (let y = y0; y > y1; y -= step) { g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y - step); g.moveTo(x1, y); g.lineTo(x0, y - step); g.stroke(); } };
KINDS.tvtower = {
  bake(mk) {
    const sh = mk('tvtower', [-46, -420, 46, 6]);
    sh.piece([[-26, 4], [-9, -250], [9, -250], [26, 4]], '#cfcac0', { round: 2, paint: (g) => { g.fillStyle = 'rgba(80,80,90,.15)'; g.fillRect(-2, -250, 4, 254); } });
    sh.piece(ellipse(0, -268, 34, 30, 22), '#b8bec6', { round: 6, lift: 2, paint: (g) => { g.fillStyle = 'rgba(30,40,55,.85)'; g.fillRect(-34, -272, 68, 7); } });
    sh.piece(rect(-14, -296, 14, -320), '#cfcac0', { round: 2, lift: 1.4 });
    sh.piece(strip(0, -320, 0, -412, 5, 2), '#9a9ca2', { round: 1, lift: 1 });
    return { spr: sh.finish({ shadowBlur: 6 }), windows: Array.from({ length: 9 }, (_, i) => [-30 + i * 6.8, -272, 4, 7]) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 4, 5); },
  glow(g, P, t, e, env, p) {
    windowsGlow(g, P, t, e, env, p);
    if (p < 0.6 || !(env.S.blink > 0)) return;
    const on = (t * 0.6 + 0.3) % 1 < 0.45 ? 1 : 0.1; g.globalCompositeOperation = 'lighter';
    const gr = g.createRadialGradient(0, -412, 0, 0, -412, 22); gr.addColorStop(0, `rgba(255,60,40,${on * env.S.blink})`); gr.addColorStop(1, 'rgba(255,60,40,0)');
    g.fillStyle = gr; g.fillRect(-22, -434, 44, 44); g.globalCompositeOperation = 'source-over';
  },
};
// A glass tower that narrows as it climbs, its facets catching the light.
KINDS.twist = {
  bake(mk, v = 0) {
    const h = [380, 300][v % 2], wb = [58, 50][v % 2], wt = [26, 30][v % 2], col = ['#6f8aa0', '#7f9aa6'][v % 2];
    const sh = mk('twist' + v, [-wb - 6, -h - 40, wb + 6, 6]);
    const win = []; for (let y = -30; y > -h + 20; y -= 17) { const w = wb + (wt - wb) * (-y / h); for (let x = -w + 7; x < w - 9; x += 11) win.push([x, y, 7, 10]); }
    sh.piece([[-wb, 4], [-wt, -h], [wt, -h], [wb, 4]], col, { round: 2, paint: (g) => { paintWindows(win)(g); g.strokeStyle = 'rgba(220,235,245,.35)'; g.lineWidth = 2; for (let k = -4; k < 6; k++) { g.beginPath(); g.moveTo(k * 22 - 20, 4); g.lineTo(k * 12 + 30, -h); g.stroke(); } g.fillStyle = 'rgba(255,255,255,.10)'; g.beginPath(); g.moveTo(-wb, 4); g.lineTo(-wt, -h); g.lineTo(-wt + 14, -h); g.lineTo(-wb + 30, 4); g.fill(); } });
    sh.piece(strip(0, -h, 0, -h - 34, 3, 1), '#4a4a50', { round: 0.5, lift: 1 });
    return { spr: sh.finish({ shadowBlur: 6 }), windows: win, mast: [0, -h - 34] };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 4, 5); },
  glow: (g, P, t, e, env, p) => KINDS.tower.glow(g, P, t, e, env, p),
};
KINDS.turbine = {
  bake(mk) {
    const P = {};
    P.mast = mk('turb-mast', [-12, -230, 14, 6]).piece([[-7, 4], [-3, -214], [3, -214], [7, 4]], '#e8e6e0', { round: 1.5 }).piece(rect(-6, -218, 14, -230), '#dcdad4', { round: 3, lift: 1.4 }).finish({ shadowBlur: 3 });
    const rot = mk('turb-rotor', [-100, -100, 100, 100], { pad: 6 });
    for (let k = 0; k < 3; k++) { const a = k * Math.PI * 2 / 3 - Math.PI / 2, c = Math.cos(a), s = Math.sin(a), n = -s, m = c; rot.piece([[c * 6 + n * 3, s * 6 + m * 3], [c * 92 + n * 1.2, s * 92 + m * 1.2], [c * 94, s * 94], [c * 40 - n * 5, s * 40 - m * 5], [c * 6 - n * 3, s * 6 - m * 3]], '#f0eee8', { round: 1.5, rough: 0.3, lift: 1 }); }
    rot.piece(ellipse(0, 0, 6, 6, 10), '#d8d6d0', { round: 2, lift: 1.4 });
    P.rotor = rot.finish({ shadowBlur: 3 });
    return P;
  },
  draw(g, P, t, e, env) { put(g, P.mast, env.sh); g.translate(12, -224); g.rotate(t * (e.speed ?? 0.7) + e.a); put(g, P.rotor, env.sh * 0.5); },
};
// A tower crane, hoisting a sheet of blank card into the sky.
KINDS.crane = {
  bake(mk) {
    const P = {}, yel = '#d9a83a';
    P.mast = mk('crane-mast', [-150, -360, 260, 6])
      .piece(rect(-10, 4, 10, -330), yel, { round: 1, paint: lattice(-10, 10, 0, -330, 14) })
      .piece(rect(-140, -330, 250, -342), yel, { round: 1, lift: 1.4, paint: lattice(-140, 250, -330, -342, 12) })
      .piece(rect(-138, -342, -100, -318), '#6a6460', { round: 2, lift: 2 })
      .piece(rect(10, -318, 34, -342), '#e8e2d0', { round: 2, lift: 2, paint: (g) => { g.fillStyle = 'rgba(40,50,60,.8)'; g.fillRect(14, -336, 16, 10); } })
      .piece([[-6, -342], [0, -372], [6, -342]], yel, { round: 1, lift: 1 })
      .finish({ shadowBlur: 6 });
    P.board = mk('crane-board', [-46, -4, 46, 80]).piece(rect(-42, 0, 42, 76), '#cfae80', { round: 1.2, rim: 0.6, paint: (g) => { g.strokeStyle = 'rgba(110,80,50,.16)'; g.lineWidth = 1.4; for (let x = -38; x < 42; x += 7) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 76); g.stroke(); } } }).finish({ shadowBlur: 4 });
    return P;
  },
  draw(g, P, t, e, env) {
    put(g, P.mast, env.sh, 5, 6);
    const k = e.hoist ? e.hoist(t) : 0, tx = 120 + 90 * (e.trolley ? e.trolley(t) : 0), ly = lerp(-30, -300, k);
    const sw = Math.sin(t * 1.1) * 4 * (0.4 + k);
    g.strokeStyle = 'rgba(40,36,34,.85)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(tx, -336); g.lineTo(tx + sw, ly - 6); g.stroke();
    g.save(); g.translate(tx + sw, ly - 6); g.rotate(sw * 0.01); g.beginPath(); g.moveTo(0, 0); g.lineTo(-36, 6); g.moveTo(0, 0); g.lineTo(36, 6); g.stroke(); g.translate(0, 6); put(g, P.board, env.sh * 0.6, 3, 4); g.restore();
  },
};
KINDS.dish = {
  bake(mk) {
    const P = {};
    P.base = mk('dish-base', [-30, -80, 30, 6]).piece([[-26, 4], [-8, -70], [8, -70], [26, 4]], '#bfbcb4', { round: 2 }).finish({ shadowBlur: 3 });
    P.dish = mk('dish-dish', [-70, -20, 70, 40], { pad: 6 }).piece([[-66, -10], [-40, 18], [0, 30], [40, 18], [66, -10], [40, 2], [0, 10], [-40, 2]], '#e6e4de', { round: 6, paint: (g) => { g.strokeStyle = 'rgba(120,120,130,.4)'; g.lineWidth = 1; for (let x = -50; x < 60; x += 14) { g.beginPath(); g.moveTo(x, -6); g.lineTo(x * 0.6, 22); g.stroke(); } } }).piece(strip(0, 10, 0, -40, 3, 2), '#9a9ca2', { round: 1, lift: 1 }).finish({ shadowBlur: 4 });
    return P;
  },
  draw(g, P, t, e, env) { put(g, P.base, env.sh); g.translate(0, -74); g.rotate((-30 + Math.sin(t * 0.15 + e.a) * 22) * DEG); put(g, P.dish, env.sh * 0.6); },
};
KINDS.tram = {
  bake(mk) {
    const P = {}, win = [];
    for (let x = -86; x < 80; x += 24) win.push([x, -66, 18, 22]);
    P.car = mk('tram', [-104, -96, 104, 6])
      .piece([[-100, -14], [-100, -86], [-80, -94], [80, -94], [100, -86], [100, -14]], '#e9ece8', { round: 6, paint: (g) => { paintWindows(win)(g); g.fillStyle = '#2f7f86'; g.fillRect(-100, -38, 200, 8); g.fillStyle = 'rgba(40,40,45,.8)'; g.fillRect(-100, -20, 200, 6); } })
      .piece(rect(-60, -94, 60, -100), '#9a9ca2', { round: 1, lift: 1 })
      .finish({ shadowBlur: 4 });
    P.wheel = mk('tram-w', [-10, -10, 10, 10], { pad: 4 }).piece(ellipse(0, 0, 8, 8, 12), '#3a3638', { round: 2 }).finish({ shadowBlur: 2 });
    P.windows = win;
    return P;
  },
  draw(g, P, t, e, env) {
    for (const off of [0, -212]) { g.save(); g.translate(off, -8); put(g, P.car, env.sh, 3, 4); for (const x of [-70, 70]) { g.save(); g.translate(x, -10); put(g, P.wheel, 0); g.restore(); } g.restore(); }
  },
  glow(g, P, t, e, env, p) {
    if (!e.winOn || p < 0.6) return; const k = e.winOn(t, 0); if (k < 0.01) return;
    g.globalCompositeOperation = 'lighter';
    for (const off of [0, -212]) for (const [x, y, w, h] of P.windows) { g.fillStyle = `rgba(220,240,255,${0.75 * k})`; g.fillRect(off + x, y - 8, w, h); }
    g.globalCompositeOperation = 'source-over';
  },
};
KINDS.bench = {
  bake(mk) { return { spr: mk('bench', [-40, -40, 40, 6]).piece(rect(-38, -24, 38, -30), '#7a5a3e', { round: 1 }).piece(rect(-38, -34, 38, -40), '#7a5a3e', { round: 1, lift: 1 }).piece(rect(-34, 4, -30, -24), '#3a3638', { round: 0.5 }).piece(rect(30, 4, 34, -24), '#3a3638', { round: 0.5 }).finish({ shadowBlur: 3 }) }; },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh); },
};
// A rounded car of the 1930s, its headlamps on.
KINDS.car = {
  bake(mk) {
    const P = {};
    P.body = mk('car', [-70, -58, 76, 6])
      .piece([[-64, -14], [-62, -30], [-40, -34], [-26, -54], [16, -54], [30, -34], [60, -30], [70, -20], [70, -12], [-64, -10]], '#2f4a3e', { round: 8, paint: (g) => { g.fillStyle = 'rgba(30,26,24,.85)'; g.beginPath(); g.moveTo(-22, -34); g.lineTo(-12, -50); g.lineTo(-2, -50); g.lineTo(-2, -34); g.fill(); g.beginPath(); g.moveTo(3, -34); g.lineTo(3, -50); g.lineTo(13, -50); g.lineTo(24, -34); g.fill(); g.fillStyle = 'rgba(220,200,150,.6)'; g.fillRect(-64, -22, 134, 2); } })
      .piece([[-70, -12], [-50, -24], [-34, -12]], '#1e2a24', { round: 4, lift: 1 })
      .piece([[30, -12], [46, -26], [64, -12]], '#1e2a24', { round: 4, lift: 1 })
      .piece(ellipse(66, -24, 4, 4, 8), '#e8dcb0', { round: 1, lift: 1 })
      .finish({ shadowBlur: 4 });
    P.wheel = mk('car-w', [-14, -14, 14, 14], { pad: 4 }).piece(ellipse(0, 0, 11, 11, 14), '#1e1c1c', { round: 3, paint: (g) => { g.fillStyle = '#b8b2a4'; g.beginPath(); g.arc(0, 0, 4.5, 0, 7); g.fill(); } }).finish({ shadowBlur: 2 });
    return P;
  },
  draw(g, P, t, e, env) {
    const d = e.move ? e.move(t) * DEG * 1000 : 0;
    g.translate(0, -12 + Math.sin(t * 13) * 0.4); put(g, P.body, env.sh, 3, 4);
    for (const x of [-42, 47]) { g.save(); g.translate(x, -2); g.rotate(d / 11); put(g, P.wheel, 0); g.restore(); }
  },
  glow(g, P, t, e, env, p) {
    const k = e.lit ? e.lit(t) : 0; if (k < 0.01 || p < 0.6) return;
    g.globalCompositeOperation = 'lighter';
    const gr = g.createRadialGradient(66, -36, 0, 66, -36, 22); gr.addColorStop(0, `rgba(255,240,200,${k})`); gr.addColorStop(1, 'rgba(255,240,200,0)');
    g.fillStyle = gr; g.fillRect(44, -58, 44, 44);
    const beam = g.createLinearGradient(70, -36, 230, -10); beam.addColorStop(0, `rgba(255,236,190,${0.35 * k})`); beam.addColorStop(1, 'rgba(255,236,190,0)');
    g.fillStyle = beam; g.beginPath(); g.moveTo(68, -40); g.lineTo(240, -64); g.lineTo(240, 6); g.lineTo(68, -30); g.closePath(); g.fill();
    g.globalCompositeOperation = 'source-over';
  },
};

// Uruk's street life: a market awning, a clay bread oven, a mud-brick seat.
const potPts = (x, y, s) => [[x - s * 0.5, y], [x - s, y - s * 0.6], [x - s * 0.75, y - s * 1.3], [x - s * 0.35, y - s * 1.45], [x - s * 0.42, y - s * 1.75], [x + s * 0.42, y - s * 1.75], [x + s * 0.35, y - s * 1.45], [x + s * 0.75, y - s * 1.3], [x + s, y - s * 0.6], [x + s * 0.5, y]];
KINDS.stall = {
  bake(mk, v = 0) {
    const r = rng(700 + v), cloth = ['#b5523a', '#3f6a7a', '#c8a14a'][v % 3];
    const sh = mk('stall' + v, [-50, -98, 50, 6]);
    sh.piece(strip(-36, 4, -38, -82, 3.4, 2.6), '#5b4331', { round: 1, thick: 0.8, rough: 0.6 });
    sh.piece(strip(36, 4, 38, -76, 3.4, 2.6), '#5b4331', { round: 1, thick: 0.8, rough: 0.6 });
    sh.piece(rect(-34, -24, 34, 4), '#b8936a', { round: 2, paint: bricks('#b8936a', 0.22) });
    for (const [x, c, s] of [[-24, '#a0603a', 8], [-9, '#8a5a3a', 6.5], [6, '#b07a4a', 9], [23, '#7a4a30', 6.5]]) sh.piece(potPts(x + (r() - 0.5) * 2, -24, s), c, { round: 2, lift: 1, paint: (g) => { g.fillStyle = 'rgba(240,220,180,.35)'; g.fillRect(x - s * 0.7, -24 - s * 1.05, s * 1.4, 1.2); } });
    sh.piece(ellipse(-16, -27, 7, 3, 10), '#6a4022', { round: 1.5, lift: 1.4, paint: (g) => { g.fillStyle = '#4a2a18'; for (let i = 0; i < 9; i++) { g.beginPath(); g.ellipse(-21 + (i % 5) * 2.6, -29 + ((i / 5) | 0) * 2, 1.5, 1, 0, 0, 7); g.fill(); } } });
    const can = [[-48, -84], [48, -76]];
    for (let i = 0; i <= 8; i++) { const x = 48 - i * 12, y = -64 - (i / 8) * 8; can.push([x, y + (i % 2 ? 5 : 0)]); }
    sh.piece(can, cloth, { round: 3, lift: 2, rough: 0.8, paint: (g) => { g.fillStyle = rgb(shade(cloth, 0.28), 0.6); for (let x = -44; x < 48; x += 16) g.fillRect(x, -90, 7, 34); } });
    return { spr: sh.finish() };
  },
  draw(g, P, t, e, env) { g.rotate(fbm(t * 0.4 + e.a, 5) * 0.6 * DEG); put(g, P.spr, env.sh); },
};
KINDS.oven = {
  bake(mk) {
    const pts = []; for (let i = 0; i <= 14; i++) { const a = Math.PI + (i / 14) * Math.PI; pts.push([Math.cos(a) * 20 * (1 - 0.15 * Math.sin(i / 14 * Math.PI)), Math.sin(a) * 34]); }
    pts.push([21, 4], [-21, 4]);
    const sh = mk('oven', [-26, -42, 26, 6]).piece(pts, '#a8774c', { round: 4, rough: 1.2, paint: (g) => { g.fillStyle = '#2b1a12'; g.beginPath(); g.ellipse(2, -12, 8, 9, 0, 0, 7); g.fill(); const gr = g.createRadialGradient(2, -9, 0, 2, -10, 8); gr.addColorStop(0, 'rgba(255,170,70,.95)'); gr.addColorStop(1, 'rgba(160,50,20,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(2, -10, 7, 7, 0, 0, 7); g.fill(); } });
    sh.piece(ellipse(0, -33, 9, 3, 10), '#7a5034', { round: 1.5, lift: 1 });
    return { spr: sh.finish() };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh); },
};
KINDS.seat = {
  bake(mk) { return { spr: mk('seat', [-20, -32, 20, 6]).piece(rect(-17, -28, 17, 4), '#b8936a', { round: 2, paint: bricks('#b8936a', 0.25) }).piece(rect(-19, -31, 19, -26), '#c9a676', { round: 1.5, lift: 1 }).finish({ shadowBlur: 3 }) }; },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh); },
};

// Empires, rising and falling: a temple front, a triumphal arch, a gate, a column with a bull capital.
KINDS.monument = {
  bake(mk, v = 0) {
    const stone = ['#d8cdb4', '#cfc2a6', '#b8463a', '#c9b79a'][v % 4];
    let sh;
    if (v % 4 === 0) {
      sh = mk('mon0', [-80, -150, 80, 6]).piece(rect(-74, -6, 74, 4), shade(stone, -0.1), { round: 1 });
      for (let i = 0; i < 5; i++) sh.piece(rect(-62 + i * 31 - 6, -104, -62 + i * 31 + 6, -6), stone, { round: 1, lift: 1, paint: lines(stone, 0.25, 3) });
      sh.piece(rect(-72, -116, 72, -104), shade(stone, -0.05), { round: 1, lift: 1.4 }).piece([[-76, -116], [0, -146], [76, -116]], stone, { round: 2, lift: 1.6 });
    } else if (v % 4 === 1) {
      sh = mk('mon1', [-70, -140, 70, 6]).piece([[-64, 4], [-64, -120], [64, -120], [64, 4], [24, 4], [24, -60], [14, -80], [0, -86], [-14, -80], [-24, -60], [-24, 4]], stone, { round: 2, paint: (g) => { g.fillStyle = 'rgba(90,70,50,.25)'; g.fillRect(-60, -112, 120, 6); for (const x of [-46, 40]) g.fillRect(x, -100, 6, 100); } })
        .piece(rect(-68, -136, 68, -120), shade(stone, -0.06), { round: 1, lift: 1.2 });
    } else if (v % 4 === 2) {
      sh = mk('mon2', [-80, -140, 80, 6]);
      for (const x of [-52, 52]) sh.piece(rect(x - 6, -112, x + 6, 4), stone, { round: 1 });
      for (const x of [-22, 22]) sh.piece(rect(x - 5, -100, x + 5, 4), stone, { round: 1 });
      sh.piece(rect(-60, -100, 60, -90), '#3f6a5a', { round: 1, lift: 1 }).piece([[-76, -110], [-60, -126], [60, -126], [76, -110], [60, -116], [-60, -116]], '#2f3a3a', { round: 2, lift: 1.4 })
        .piece([[-40, -126], [-30, -136], [30, -136], [40, -126]], '#2f3a3a', { round: 1.5, lift: 1.6 });
    } else {
      sh = mk('mon3', [-40, -170, 40, 6]).piece(rect(-20, -10, 20, 4), shade(stone, -0.1), { round: 1 }).piece(rect(-8, -130, 8, -10), stone, { round: 1, paint: lines(stone, 0.25, 3) })
        .piece([[-36, -146], [-22, -138], [-12, -132], [12, -132], [22, -138], [36, -146], [32, -156], [20, -150], [12, -142], [-12, -142], [-20, -150], [-32, -156]], shade(stone, -0.12), { round: 2, lift: 1.4 })
        .piece(rect(-30, -164, 30, -156), stone, { round: 1, lift: 1.2 });
    }
    return { spr: sh.finish({ shadowBlur: 4 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh); },
};
