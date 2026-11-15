// China today, cut with extra care: the real landmarks and machines, never a generic box.
// Same conventions: design units, a cut-out stands on its origin facing +x, a person is about 120 tall.
import { put, ellipse, strip, KRAFT } from './paper.js';
import { KINDS } from './cutouts.js';
import { drawPerson } from './people.js';
import { rect, glowRects, paintRects, roofPts } from './kinds_china.js';
import { rng, fbm, noise, DEG, hash, shade, mix, rgb, clamp, smooth, sramp, spring, lerp } from './util.js';

const dab = (g, r, n, box, cols, len = 6, w = 2) => {
  g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = box[0] + r() * (box[2] - box[0]), y = box[1] + r() * (box[3] - box[1]), a = (r() - 0.5) * 1.2;
    g.strokeStyle = cols[(r() * cols.length) | 0]; g.lineWidth = w * (0.6 + r() * 0.8);
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * len * (0.5 + r()), y + Math.sin(a) * len * 0.4); g.stroke();
  }
};
// glass: a cool gradient with a sky reflection running up it, and fine mullions
const glass = (x0, y0, x1, y1, c0, c1, step = 6) => (g) => {
  const gr = g.createLinearGradient(x0, y1, x1, y0); gr.addColorStop(0, c0); gr.addColorStop(0.55, c1); gr.addColorStop(1, c0);
  g.fillStyle = gr; g.fillRect(x0, y0, x1 - x0, y1 - y0);
  g.strokeStyle = 'rgba(20,30,40,.18)'; g.lineWidth = 0.7; for (let x = x0; x < x1; x += step) { g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y1); g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,.14)'; g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0 + (x1 - x0) * 0.3, y1); g.lineTo(x0 + (x1 - x0) * 0.7, y0); g.lineTo(x0 + (x1 - x0) * 0.4, y0); g.fill();
};
// windows on a tapering facade, for the night: [x, y, w, h] that fit inside halfwidth(y)
function facadeWindows(hw, y0, y1, dy = 12, dx = 9, w = 5, h = 6) { const out = []; for (let y = y0; y > y1; y -= dy) { const W = hw(y) - 5; for (let x = -W; x < W - w; x += dx) out.push([x, y - h, w, h]); } return out; }

// ============================================================ Lujiazui, Shanghai ===
// Shanghai Tower: 632 m, its skin twisting 120 degrees as it rises, a notch spiralling up one edge.
KINDS.shtower = {
  bake(mk) {
    const H = 620, hw = (y) => lerp(46, 26, (-y / H) ** 0.9) * (1 + 0.04 * Math.sin((-y / H) * 9));
    const pts = []; for (let i = 0; i <= 20; i++) { const y = -H * (i / 20); pts.push([-hw(y), y]); }
    const top = [[-26, -H], [-14, -H - 26], [24, -H - 6]];
    for (let i = 20; i >= 0; i--) { const y = -H * (i / 20); pts.push([hw(y) + (i > 18 ? -2 : 0), y]); }
    const win = facadeWindows(hw, -20, -H + 20, 13, 8, 4, 6);
    const sh = mk('shtower', [-60, -H - 40, 60, 6]);
    sh.piece([...pts.slice(0, 21), ...top, ...pts.slice(21)], '#6f8fa6', { round: 2, rough: 0.3, paint: (g) => {
      glass(-50, -H - 30, 50, 4, 'rgba(120,150,170,1)', 'rgba(190,214,226,1)', 7)(g);
      // the spiral notch, wrapping round the tower
      g.strokeStyle = 'rgba(40,60,76,.55)'; g.lineWidth = 3; g.beginPath(); for (let i = 0; i <= 40; i++) { const f = i / 40, y = -H * f, x = Math.sin(f * Math.PI * 1.35 - 0.6) * hw(y); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1.2; g.beginPath(); for (let i = 0; i <= 40; i++) { const f = i / 40, y = -H * f, x = Math.sin(f * Math.PI * 1.35 - 0.6) * hw(y) + 2.2; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
      // the sky gardens, every fifteen floors or so
      g.fillStyle = 'rgba(40,60,70,.4)'; for (let k = 1; k < 9; k++) { const y = -H * (k / 9); g.fillRect(-hw(y), y - 2, hw(y) * 2, 3); }
      paintRects(win, 'rgba(28,40,52,.55)')(g);
    } });
    return { spr: sh.finish({ shadowBlur: 7 }), windows: win, mast: [6, -H - 22] };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 4, 5); },
  glow(g, P, t, e, env, p) { glowRects(g, P, t, e, env, p); if (p < 0.6 || !(env.S.blink > 0)) return; g.globalCompositeOperation = 'lighter'; const on = (t * 0.7 + 0.2) % 1 < 0.45 ? 1 : 0.1, [x, y] = P.mast, gr = g.createRadialGradient(x, y, 0, x, y, 18); gr.addColorStop(0, `rgba(255,60,40,${on * env.S.blink})`); gr.addColorStop(1, 'rgba(255,60,40,0)'); g.fillStyle = gr; g.fillRect(x - 18, y - 18, 36, 36); g.globalCompositeOperation = 'source-over'; },
};
// Jin Mao: a pagoda in steel and glass, sixteen tiers stepping in, a crown of fins and a spire.
KINDS.jinmao = {
  bake(mk) {
    const H = 390, sh = mk('jinmao', [-50, -H - 70, 50, 6]), pts = [[-40, 4]];
    let y = 0, w = 40; const steps = [];
    for (let k = 0; k < 14; k++) { const hh = k < 6 ? 34 : k < 10 ? 24 : 16; steps.push([y, w]); pts.push([-w, y - hh]); w -= k < 6 ? 1.6 : 2.2; pts.push([-w, y - hh]); y -= hh; }
    const yTop = y; pts.push([-w + 4, yTop - 30], [-6, yTop - 46], [6, yTop - 46], [w - 4, yTop - 30]);
    for (let k = 13; k >= 0; k--) { const [yy, ww] = steps[k], hh = k < 6 ? 34 : k < 10 ? 24 : 16; pts.push([ww - (k < 6 ? 1.6 : 2.2), yy - hh], [ww, yy - hh]); }
    pts.push([40, 4]);
    const hw = (yy) => { for (const [y0, ww] of steps) if (yy <= y0 && yy > y0 - 34) return ww; return 20; };
    const win = facadeWindows(hw, -10, yTop + 10, 11, 7, 3, 6);
    sh.piece(pts, '#8a9488', { round: 1.2, rough: 0.3, paint: (g) => { glass(-44, yTop - 50, 44, 4, 'rgba(110,124,116,1)', 'rgba(170,186,174,1)', 4)(g); g.strokeStyle = 'rgba(220,226,220,.45)'; g.lineWidth = 1; for (const [y0] of steps) { g.beginPath(); g.moveTo(-44, y0); g.lineTo(44, y0); g.stroke(); } paintRects(win, 'rgba(30,40,40,.45)')(g); } });
    sh.piece(strip(0, yTop - 44, 0, yTop - 74, 3, 1.2), '#b8bcb4', { round: 0.6, lift: 1 });
    return { spr: sh.finish({ shadowBlur: 6 }), windows: win };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 4, 5); },
  glow: glowRects,
};
// The World Financial Center: a tapering slab with a trapezoid opening through its top (locals call it the bottle opener).
KINDS.swfc = {
  bake(mk) {
    const H = 480, sh = mk('swfc', [-54, -H - 10, 54, 6]), hw = (y) => lerp(48, 22, -y / H);
    const win = facadeWindows(hw, -16, -H + 70, 12, 8, 4, 6).filter(([x, y]) => !(y < -H + 70 && Math.abs(x) < 14));
    sh.piece([[-48, 4], [-22, -H], [22, -H], [48, 4]], '#7d93a4', { round: 1.5, rough: 0.3, paint: (g) => { glass(-50, -H, 50, 4, 'rgba(110,134,152,1)', 'rgba(184,206,220,1)', 6)(g); paintRects(win, 'rgba(26,38,50,.5)')(g); g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-48, 4); g.quadraticCurveTo(-30, -H * 0.5, -22, -H); g.stroke(); } });
    // the opening: drawn as sky showing through
    sh.piece([[-16, -H + 14], [16, -H + 14], [12, -H + 52], [-12, -H + 52]], '#9ab4cc', { round: 1.2, lift: 0, thick: 0, rim: 0.4, paint: (g) => { const gr = g.createLinearGradient(0, -H + 14, 0, -H + 52); gr.addColorStop(0, '#a8c4da'); gr.addColorStop(1, '#d8e2e6'); g.fillStyle = gr; g.fillRect(-20, -H + 10, 40, 46); } });
    return { spr: sh.finish({ shadowBlur: 6 }), windows: win };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 4, 5); },
  glow: glowRects,
};
// Ping An Finance Centre, Shenzhen: 599 m, stainless steel ribs running up its corners, a pointed crown.
KINDS.pingan = {
  bake(mk) {
    const H = 560, sh = mk('pingan', [-52, -H - 90, 52, 6]), hw = (y) => lerp(44, 30, (-y / H) ** 1.6);
    const win = facadeWindows(hw, -14, -H + 10, 12, 8, 4, 6).filter(([x]) => Math.abs(x) < hw(0) - 14);
    sh.piece([[-44, 4], [-30, -H], [-18, -H - 40], [0, -H - 50], [18, -H - 40], [30, -H], [44, 4]], '#8a94a0', { round: 1.5, rough: 0.3, paint: (g) => {
      glass(-46, -H - 50, 46, 4, 'rgba(116,128,140,1)', 'rgba(196,206,214,1)', 7)(g); paintRects(win, 'rgba(26,34,44,.5)')(g);
      for (const s of [-1, 1]) { g.fillStyle = 'rgba(220,224,228,.85)'; g.beginPath(); for (let i = 0; i <= 20; i++) { const y = -H * (i / 20); g.lineTo(s * (hw(y) - 1), y); } for (let i = 20; i >= 0; i--) { const y = -H * (i / 20); g.lineTo(s * (hw(y) - 8), y); } g.fill(); }
      g.fillStyle = 'rgba(220,224,228,.7)'; for (let k = 1; k < 7; k++) g.fillRect(-46, -H * (k / 7), 92, 2.2);
    } });
    sh.piece(strip(0, -H - 46, 0, -H - 88, 3, 1), '#c8ccd0', { round: 0.5, lift: 1 });
    return { spr: sh.finish({ shadowBlur: 6 }), windows: win, mast: [0, -H - 88] };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 4, 5); },
  glow: (g, P, t, e, env, p) => KINDS.shtower.glow(g, P, t, e, env, p),
};

// ======================================================= high-speed rail ===
// A Fuxing train: a long sculpted nose, a dark wrap-around windscreen, the red stripe flowing back along every car.
KINDS.fuxing = {
  bake(mk) {
    const P = {}, win = []; for (let x = -104; x < 96; x += 14) win.push([x, -32, 9, 8]);
    const stripe = (g, x0, x1) => { g.fillStyle = '#c8282a'; g.beginPath(); g.moveTo(x0, -15); g.lineTo(x1, -15); g.lineTo(x1, -11); g.lineTo(x0, -11); g.fill(); g.fillStyle = 'rgba(40,40,46,.85)'; g.fillRect(x0, -9, x1 - x0, 5); };
    P.nose = mk('fx-nose', [-112, -54, 170, 6]).piece([[-108, -4], [-108, -44], [20, -44], [62, -40], [104, -30], [140, -18], [162, -9], [166, -5], [-108, -4]], '#f2f3f2', { round: 6, paint: (g) => {
      paintRects(win.filter(([x]) => x < 18))(g); stripe(g, -108, 60);
      g.fillStyle = '#c8282a'; g.beginPath(); g.moveTo(60, -15); g.quadraticCurveTo(110, -16, 160, -8); g.lineTo(160, -6); g.quadraticCurveTo(110, -11, 60, -11); g.fill();
      g.fillStyle = 'rgba(22,28,40,.92)'; g.beginPath(); g.moveTo(36, -40); g.quadraticCurveTo(80, -40, 116, -26); g.lineTo(96, -24); g.quadraticCurveTo(66, -32, 30, -32); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(52, -38); g.lineTo(84, -34); g.lineTo(80, -33); g.lineTo(50, -36); g.fill();
      g.fillStyle = '#f8f0c8'; g.beginPath(); g.ellipse(150, -12, 4, 1.6, -0.2, 0, 7); g.fill();
      g.strokeStyle = 'rgba(120,120,126,.5)'; g.lineWidth = 0.8; for (const x of [-60, -10]) { g.strokeRect(x, -38, 12, 30); }
    } }).finish({ shadowBlur: 3 });
    P.car = mk('fx-car', [-114, -54, 114, 6]).piece(rect(-110, -4, 110, -44), '#f2f3f2', { round: 6, paint: (g) => { paintRects(win)(g); stripe(g, -110, 110); g.strokeStyle = 'rgba(120,120,126,.5)'; g.lineWidth = 0.8; for (const x of [-100, 86]) g.strokeRect(x, -38, 12, 30); } })
      .piece([[-10, -44], [-4, -54], [14, -54], [20, -44]], '#9a9ca2', { round: 1, lift: 0.8 }).finish({ shadowBlur: 3 });
    P.win = win;
    return P;
  },
  draw(g, P, t, e, env) {
    const sc = e.scale || 1, a0 = e.a + (e.move ? e.move(t) : 0), pr = e.prof || (() => 0), lift = e.y || 0, r0 = 1000 + pr(a0) + lift;
    // only what is between the two tunnel mouths is drawn: the train slides out of one mountain and into the next
    const at = (x) => a0 + ((x * sc) / r0) / DEG, shown = (x0, x1) => (e.portal === undefined || at(x1) > e.portal) && (e.portalEnd === undefined || at(x0) < e.portalEnd);
    for (let k = 1; k <= (e.cars ?? 5); k++) { const off = -230 * k + 8; if (!shown(off - 114, off + 114)) continue; const dr = (off * sc) / r0, r1 = 1000 + pr(a0 + dr / DEG) + lift; g.save(); g.translate((Math.sin(dr) * r1) / sc, (r0 - Math.cos(dr) * r1) / sc); g.rotate(dr); put(g, P.car, env.sh, 2, 3); g.restore(); }
    if (shown(-110, 166)) put(g, P.nose, env.sh, 2, 3);
  },
  glow(g, P, t, e, env, p) {
    if (p < 0.6) return; const k = e.lit ? e.lit(t) : 1; if (k < 0.01) return;
    const sc = e.scale || 1, a0 = e.a + (e.move ? e.move(t) : 0), pr = e.prof || (() => 0), lift = e.y || 0, r0 = 1000 + pr(a0) + lift;
    g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(255,240,210,${0.85 * k})`;
    const inside = (x) => { const a = a0 + ((x * sc) / r0) / DEG; return (e.portal !== undefined && a < e.portal) || (e.portalEnd !== undefined && a > e.portalEnd); };
    for (let c = 0; c <= (e.cars ?? 5); c++) { const off = -230 * c + (c ? 8 : 0), dr = (off * sc) / r0, r1 = 1000 + pr(a0 + dr / DEG) + lift; g.save(); g.translate((Math.sin(dr) * r1) / sc, (r0 - Math.cos(dr) * r1) / sc); g.rotate(dr); for (const [x, y, w, h] of P.win) if ((c || x < 18) && !inside(off + x + w / 2)) g.fillRect(x, y, w, h); g.restore(); }
    if (inside(166)) { g.globalCompositeOperation = 'source-over'; return; }
    // the headlight, throwing a long beam ahead into the dark
    const gr = g.createLinearGradient(160, -10, 420, 0); gr.addColorStop(0, `rgba(255,248,220,${0.55 * k})`); gr.addColorStop(1, 'rgba(255,248,220,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(160, -12); g.lineTo(420, -40); g.lineTo(420, 20); g.lineTo(160, -6); g.fill();
    g.globalCompositeOperation = 'source-over';
  },
};
// A viaduct pier with a deck, and a catenary mast holding the wire the trains draw power from.
KINDS.hsrpier = {
  bake(mk) { return { spr: mk('hsrpier', [-62, -110, 62, 6]).piece([[-12, 4], [12, 4], [9, -76], [16, -82], [-16, -82], [-9, -76]], '#c4c0b8', { round: 2, paint: (g) => { g.fillStyle = 'rgba(80,80,80,.15)'; g.fillRect(3, -76, 6, 80); } }).piece(rect(-60, -82, 60, -96), '#d0ccc4', { round: 1.5, lift: 1.2, paint: (g) => { g.fillStyle = 'rgba(70,70,74,.45)'; g.fillRect(-60, -86, 120, 3); g.fillStyle = 'rgba(200,196,188,.9)'; for (let x = -56; x < 60; x += 8) g.fillRect(x, -100, 2, 4); } }).piece(strip(40, -96, 42, -176, 3, 2.4), '#8a8c90', { round: 0.6, lift: 1 }).piece(strip(42, -168, 4, -166, 1.6, 1.4), '#8a8c90', { round: 0.4, lift: 0.8 }).finish({ shadowBlur: 4 }) }; },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 3, 4); },
};

// ========================================================== Long March 5 ===
// Wenchang, on Hainan's coast: a launch tower, and a Long March 5 with its four fat boosters. e.launch: the moment it goes.
KINDS.lm5 = {
  bake(mk) {
    const P = {};
    P.tower = mk('lm5-tower', [-120, -420, 40, 6]).piece([[-110, 4], [-106, -400], [-70, -400], [-66, 4]], '#b8322a', { round: 1.2, paint: (g) => { g.strokeStyle = 'rgba(250,240,230,.75)'; g.lineWidth = 1.4; for (let y = 0; y > -400; y -= 18) { g.beginPath(); g.moveTo(-108, y); g.lineTo(-68, y - 18); g.moveTo(-68, y); g.lineTo(-108, y - 18); g.stroke(); } } })
      .piece(strip(-88, -400, -88, -440, 3, 1.4), '#8a8c90', { round: 0.5, lift: 0.8 })
      .piece(rect(-66, -150, -36, -158), '#8a8c90', { round: 0.6, lift: 1 }).piece(rect(-66, -290, -32, -298), '#8a8c90', { round: 0.6, lift: 1 })
      .piece(rect(-120, 4, 40, -12), '#8a8a8c', { round: 1.5, lift: 0.8 }).finish({ shadowBlur: 5 });
    const boost = (x) => [[x - 9, -14], [x + 9, -14], [x + 9, -150], [x + 5, -170], [x, -176], [x - 5, -170], [x - 9, -150]];
    P.rocket = mk('lm5', [-36, -380, 36, 6], { pad: 8 })
      .piece(boost(-22), '#f0eee8', { round: 3, paint: (g) => { g.fillStyle = 'rgba(200,140,60,.35)'; g.fillRect(-31, -100, 18, 50); } })
      .piece(rect(-14, -10, 14, -320), '#f4f2ec', { round: 3, lift: 1.4, paint: (g) => { g.fillStyle = '#c8282a'; g.fillRect(-14, -230, 28, 3); g.fillStyle = 'rgba(30,30,34,.85)'; g.fillRect(-14, -120, 28, 3); g.fillStyle = '#d8282a'; g.fillRect(-6, -270, 12, 8); g.fillStyle = '#f2d23a'; g.fillRect(-5, -269, 3, 3); g.fillStyle = 'rgba(200,140,60,.3)'; g.fillRect(-14, -200, 28, 70); } })
      .piece([[-16, -320], [16, -320], [16, -350], [10, -368], [0, -378], [-10, -368], [-16, -350]], '#f8f6f0', { round: 3, lift: 1.6 })
      .piece(boost(22), '#f0eee8', { round: 3, lift: 1.8, paint: (g) => { g.fillStyle = 'rgba(200,140,60,.35)'; g.fillRect(13, -100, 18, 50); } })
      .piece([[-30, -8], [-16, -8], [-18, 4], [-28, 4]], '#3a3a3e', { round: 1, lift: 1 }).piece([[16, -8], [30, -8], [28, 4], [18, 4]], '#3a3a3e', { round: 1, lift: 1 })
      .finish({ shadowBlur: 5 });
    return P;
  },
  draw(g, P, t, e, env) {
    put(g, P.tower, env.sh, 4, 5);
    const d = t - (e.launch ?? 1e9), up = d > 0 ? d * d * 70 + d * 30 : 0, shake = d > -0.5 && d < 1.2 ? Math.sin(t * 50) * 0.8 : 0;
    g.save(); g.translate(shake, -up);
    if (d > -0.4) {
      // the flame: white at its root, orange, then gone
      const fl = clamp(d + 0.4) * (0.9 + 0.1 * Math.sin(t * 40));
      g.save(); g.globalCompositeOperation = 'lighter';
      for (const [w, h, c] of [[34, 140, '255,140,60'], [22, 100, '255,210,120'], [12, 60, '255,250,230']]) { const gr = g.createLinearGradient(0, 0, 0, h * fl); gr.addColorStop(0, `rgba(${c},.95)`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.beginPath(); g.moveTo(-w / 2, 0); g.quadraticCurveTo(0, h * fl * 1.1, w / 2, 0); g.fill(); }
      g.restore();
    }
    put(g, P.rocket, env.sh, 3, 4);
    g.restore();
  },
};

// ======================================================= the Three Gorges ===
// One block of the dam, seen from downstream: concrete in pours, a spillway gate, and (e.spill) the water thundering out.
KINDS.damseg = {
  bake(mk, v = 0) {
    const r = rng(5000 + v), sh = mk('damseg' + v, [-32, -230, 32, 8], { pad: 6 }), c = ['#b8b4aa', '#c0bcb2', '#b0aca2'][v % 3];
    sh.piece([[-30, 6], [-28, -210], [28, -210], [30, 6]], c, { round: 1, rough: 0.3, paint: (g) => {
      g.strokeStyle = 'rgba(70,70,64,.18)'; g.lineWidth = 0.8; for (let y = 0; y > -210; y -= 9) { g.beginPath(); g.moveTo(-30, y); g.lineTo(30, y + (r() - 0.5) * 0.6); g.stroke(); }
      g.fillStyle = 'rgba(90,90,84,.25)'; for (let i = 0; i < 8; i++) g.fillRect(-28 + r() * 54, -200 + r() * 190, 1.2, 10 + r() * 20);
      if (v !== 2) { g.fillStyle = 'rgba(26,30,34,.92)'; g.fillRect(-12, -168, 24, 22); g.fillStyle = 'rgba(70,74,78,.9)'; g.fillRect(-12, -168, 24, 4); }
      g.fillStyle = 'rgba(60,60,58,.35)'; g.fillRect(-30, -210, 60, 6); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(-28, -206, 4, 210);
    } });
    sh.piece(rect(-30, -210, 30, -218), shade(c, 0.08), { round: 0.8, lift: 1 });
    return { spr: sh.finish({ shadowBlur: 4 }), gate: v !== 2 };
  },
  draw(g, P, t, e, env) {
    put(g, P.spr, env.sh, 2, 3);
    const k = e.spill ? e.spill(t) : 0; if (!P.gate || k < 0.01) return;
    // the jet: a thick white rope of water leaping out and down the face, in layers that slide
    g.save(); g.lineCap = 'round';
    for (let i = 0; i < 5; i++) { g.strokeStyle = `rgba(${226 + i * 6},${236 + i * 3},245,${0.9 * k})`; g.lineWidth = (14 - i * 2) * k; g.setLineDash([20, 8 + i * 3]); g.lineDashOffset = -t * (120 + i * 20) - i * 13 - e.a * 50; g.beginPath(); g.moveTo(0, -156); g.quadraticCurveTo(10 + i * 2, -150, 14 + i * 3, -100); g.quadraticCurveTo(18, -40, 20 + i * 2, 4); g.stroke(); }
    g.setLineDash([]);
    for (let i = 0; i < 12; i++) { const ph = ((t * 1.4 + i / 12 + e.a) % 1), x = 18 + Math.cos(i * 2.3) * ph * 30, y = -4 - Math.sin(i * 1.7 + 1) * ph * 40 - ph * 20; g.fillStyle = `rgba(240,246,250,${0.7 * k * (1 - ph)})`; g.beginPath(); g.arc(x, y, (5 + ph * 12) * (1 - ph * 0.5), 0, 7); g.fill(); }
    g.restore();
  },
};
// The ship lift beside the dam: four towers and a chamber of water that carries a ship up 113 metres.
KINDS.shiplift = {
  bake(mk) {
    const P = {}, c = '#c4c0b6';
    P.frame = mk('shiplift', [-70, -300, 70, 6]).piece([[-66, 4], [-66, -290], [-40, -290], [-40, 4]], c, { round: 1.5, paint: (g) => { g.fillStyle = 'rgba(40,44,48,.6)'; for (let y = -20; y > -280; y -= 30) g.fillRect(-60, y, 14, 18); } }).piece([[40, 4], [40, -290], [66, -290], [66, 4]], c, { round: 1.5, paint: (g) => { g.fillStyle = 'rgba(40,44,48,.6)'; for (let y = -20; y > -280; y -= 30) g.fillRect(46, y, 14, 18); } })
      .piece(rect(-70, -290, 70, -306), shade(c, -0.06), { round: 1, lift: 1.2 }).finish({ shadowBlur: 5 });
    P.chamber = mk('liftbox', [-42, -50, 42, 6]).piece(rect(-40, 4, 40, -40), '#8a8e94', { round: 1.5, paint: (g) => { g.fillStyle = '#4f7a9a'; g.fillRect(-36, -30, 72, 30); } })
      .piece([[-26, -22], [24, -22], [30, -32], [-30, -32]], '#e8e2d4', { round: 1.5, lift: 1, paint: (g) => { g.fillStyle = '#c8282a'; g.fillRect(-26, -26, 50, 3); } }).piece(rect(-6, -32, 10, -46), '#e8e2d4', { round: 1, lift: 1 }).finish({ shadowBlur: 3 });
    return P;
  },
  draw(g, P, t, e, env) { const k = e.rise ? e.rise(t) : 0; g.save(); g.translate(0, -8 - k * 220); put(g, P.chamber, env.sh * 0.5); g.restore(); put(g, P.frame, env.sh, 3, 4); },
};
// An ultra-high-voltage pylon: a tall lattice tower with long arms and strings of insulators.
KINDS.uhv = {
  bake(mk, v = 0) {
    const sh = mk('uhv' + v, [-80, -330, 80, 6]), c = '#9a9ca2';
    sh.piece([[-40, 4], [-6, -300], [6, -300], [40, 4], [32, 4], [0, -260], [-32, 4]], c, { round: 0.8, paint: (g) => { g.strokeStyle = 'rgba(90,92,98,.9)'; g.lineWidth = 1.4; for (let y = 0; y > -280; y -= 22) { const w = 40 * (1 + y / 300), w2 = 40 * (1 + (y - 22) / 300); g.beginPath(); g.moveTo(-w, y); g.lineTo(w2, y - 22); g.moveTo(w, y); g.lineTo(-w2, y - 22); g.stroke(); } } });
    for (const [y, w] of [[-240, 70], [-290, 50]]) { sh.piece([[-w, y], [w, y], [w - 6, y - 8], [-w + 6, y - 8]], c, { round: 0.6, lift: 1 }); for (const x of [-w + 4, 0, w - 4]) sh.piece(strip(x, y, x, y + 26, 3, 3), '#d8d6cc', { round: 1, lift: 0.8, paint: (g) => { g.fillStyle = 'rgba(120,140,150,.6)'; for (let yy = y + 2; yy < y + 26; yy += 4) g.fillRect(x - 2.4, yy, 4.8, 1.6); } }); }
    return { spr: sh.finish({ shadowBlur: 4 }), tips: [[-66, -214], [0, -214], [66, -214], [-46, -264], [0, -264], [46, -264]] };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 3, 4); },
};

// ================================================ the Hong Kong-Zhuhai-Macao Bridge ===
// Its three navigation-channel towers: v0 a Chinese knot, v1 three leaping dolphins, v2 a sail.
KINDS.hzpylon = {
  bake(mk, v = 0) {
    const sh = mk('hzpylon' + v, [-70, -330, 70, 8]), c = '#e8e6e0';
    sh.piece(rect(-18, 8, 18, -20), '#b8b4aa', { round: 2 });
    if (v === 0) {
      for (const s of [-1, 1]) sh.piece([[s * 30 - 7, -20], [s * 30 + 7, -20], [s * 22 + 5, -300], [s * 22 - 5, -300]], c, { round: 2, lift: 1 });
      sh.piece(rect(-30, -150, 30, -160), c, { round: 1, lift: 1.2 });
      // the knot: a red Chinese knot tied between the legs, four loops round a diamond, a tassel below
      const kc = [0, -238];
      sh.piece([[kc[0], kc[1] - 26], [kc[0] + 26, kc[1]], [kc[0], kc[1] + 26], [kc[0] - 26, kc[1]]], '#c8282a', { round: 4, lift: 1.6, paint: (g) => { g.strokeStyle = 'rgba(255,220,180,.7)'; g.lineWidth = 1.2; for (let k = -16; k <= 16; k += 8) { g.beginPath(); g.moveTo(kc[0] - 20 + Math.abs(k) * 0.6, kc[1] + k); g.lineTo(kc[0] + 20 - Math.abs(k) * 0.6, kc[1] + k); g.stroke(); g.beginPath(); g.moveTo(kc[0] + k, kc[1] - 20 + Math.abs(k) * 0.6); g.lineTo(kc[0] + k, kc[1] + 20 - Math.abs(k) * 0.6); g.stroke(); } } });
      for (const [dx, dy] of [[-22, -22], [22, -22], [-22, 22], [22, 22]]) sh.piece(ellipse(kc[0] + dx, kc[1] + dy, 8, 8, 12), '#c8282a', { round: 2, lift: 1.4, paint: (g) => { g.fillStyle = 'rgba(255,230,200,.25)'; g.beginPath(); g.arc(kc[0] + dx, kc[1] + dy, 4, 0, 7); g.fill(); } });
      sh.piece([[-4, -210], [4, -210], [6, -186], [0, -180], [-6, -186]], '#c8282a', { round: 1.5, lift: 1.2, paint: (g) => { g.fillStyle = 'rgba(240,200,90,.9)'; g.fillRect(-4, -208, 8, 3); } });
    } else if (v === 1) {
      // a dolphin, leaping straight up, its tail on the deck
      sh.piece([[-10, -20], [10, -20], [16, -90], [20, -170], [14, -240], [2, -290], [-8, -300], [-10, -284], [-4, -270], [-12, -232], [-16, -170], [-14, -90]], '#9aa0a8', { round: 6, lift: 1, paint: (g) => { g.fillStyle = '#f0eee8'; g.beginPath(); g.moveTo(14, -90); g.quadraticCurveTo(20, -180, 6, -270); g.lineTo(0, -264); g.quadraticCurveTo(8, -170, 4, -90); g.fill(); g.fillStyle = '#2a2a30'; g.beginPath(); g.arc(0, -268, 2, 0, 7); g.fill(); } });
      sh.piece([[-16, -170], [-34, -150], [-30, -144], [-14, -158]], '#8a9098', { round: 2, lift: 1.4 });
    } else {
      sh.piece([[-6, -20], [6, -20], [4, -310], [-4, -310]], c, { round: 1.5, lift: 1 });
      sh.piece([[6, -60], [50, -80], [44, -200], [8, -296]], '#e0dcd2', { round: 6, lift: 1.4, paint: (g) => { g.strokeStyle = 'rgba(120,120,120,.4)'; g.lineWidth = 1; for (let k = 1; k < 6; k++) { g.beginPath(); g.moveTo(8, -60 - k * 40); g.lineTo(48 - k * 2, -80 - k * 22); g.stroke(); } } });
    }
    return { spr: sh.finish({ shadowBlur: 5 }), top: v === 2 ? [0, -300] : [0, -280] };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 3, 4); },
};
KINDS.seapier = { bake(mk) { return { spr: mk('seapier', [-12, -80, 12, 30]).piece([[-8, 30], [8, 30], [6, -72], [-6, -72]], '#c8c4ba', { round: 1.5, paint: (g) => { g.fillStyle = 'rgba(60,80,90,.35)'; g.fillRect(-8, 0, 16, 30); } }).piece(rect(-11, -72, 11, -78), '#b8b4aa', { round: 0.8, lift: 1 }).finish({ shadowBlur: 3 }) }; }, draw(g, P, t, e, env) { put(g, P.spr, env.sh * 0.5, 2, 3); } };
// The artificial island where the road leaves the bridge and goes down under the sea: a sleek building like a wave.
KINDS.hzisland = {
  bake(mk) {
    const sh = mk('hzisland', [-160, -120, 160, 10]), win = [];
    sh.piece([[-156, 10], [-140, -10], [140, -12], [156, 10]], '#c8b890', { round: 6, rough: 1, paint: (g) => { g.fillStyle = 'rgba(120,150,90,.6)'; g.fillRect(-120, -12, 60, 6); g.fillRect(70, -12, 60, 6); g.fillStyle = 'rgba(220,210,190,.6)'; g.fillRect(-150, 0, 300, 3); } });
    sh.piece([[-80, -12], [-70, -60], [-30, -92], [30, -98], [80, -70], [96, -12]], '#e8eaea', { round: 10, lift: 1.4, paint: (g) => { const gr = g.createLinearGradient(0, -98, 0, -12); gr.addColorStop(0, 'rgba(160,200,220,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(-80, -98, 180, 86); g.strokeStyle = 'rgba(120,140,150,.5)'; g.lineWidth = 1; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(-72 + k * 4, -60 + k * 6); g.quadraticCurveTo(0, -96 + k * 12, 90 - k * 4, -66 + k * 8); g.stroke(); } for (let x = -60; x < 80; x += 12) win.push([x, -36, 7, 10]); paintRects(win, 'rgba(40,60,80,.5)')(g); } });
    return { spr: sh.finish({ shadowBlur: 5 }), windows: win };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 3, 4); },
  glow: glowRects,
};

// ===================================================== the Huajiang canyon ===
// A canyon wall: layered limestone, shrubs clinging on. v0 faces right (left rim), v1 faces left.
KINDS.canyonwall = {
  bake(mk, v = 0) {
    const r = rng(5100 + v), s = v ? -1 : 1, sh = mk('canyonwall' + v, [-140, -40, 140, 300]), pts = [[-s * 130, -30], [s * 10, -30]];
    for (let i = 0; i <= 14; i++) { const y = -30 + i * 22; pts.push([s * (14 + Math.sin(i * 1.3) * 10 + r() * 10 - i * 1.5), y]); }
    pts.push([-s * 130, 290]);
    sh.piece(pts, '#8a8a7a', { round: 4, rough: 2, seg: 14, paint: (g) => { g.strokeStyle = 'rgba(50,50,44,.35)'; g.lineWidth = 2; for (let y = -20; y < 290; y += 14 + r() * 8) { g.beginPath(); g.moveTo(-130, y); g.lineTo(130, y + (r() - 0.5) * 6); g.stroke(); } dab(g, r, 60, [-120, -20, 120, 280], ['rgba(60,100,60,.55)', 'rgba(200,196,180,.25)', 'rgba(40,40,36,.3)'], 9, 3); } });
    return { spr: sh.finish({ shadowBlur: 6 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 3, 4); },
};
// A suspension-bridge tower: two tall legs, cross-beams, a saddle on top for the main cables.
KINDS.sbtower = {
  bake(mk) {
    const sh = mk('sbtower', [-40, -340, 40, 8]), c = '#d8d4cc';
    for (const s of [-1, 1]) sh.piece([[s * 24 - 8, 8], [s * 24 + 8, 8], [s * 16 + 5, -320], [s * 16 - 5, -320]], c, { round: 2, lift: s > 0 ? 1.2 : 0, paint: (g) => { g.fillStyle = 'rgba(80,80,80,.15)'; g.fillRect(s * 20, -320, 3, 328); } });
    for (const y of [-120, -230, -310]) sh.piece(rect(-24, y, 24, y - 12), shade(c, -0.05), { round: 1, lift: 1.4 });
    sh.piece(rect(-26, -322, 26, -330), '#a8322a', { round: 1, lift: 1 });
    return { spr: sh.finish({ shadowBlur: 5 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 3, 4); },
};

// =================================================== the artificial sun ===
// EAST, in Hefei: a tokamak cut open so you can see in: the doughnut-shaped vessel, the D-shaped magnet coils,
// and (e.plasma) a ring of plasma hotter than the core of the Sun, held in the middle of nothing by magnetic fields.
KINDS.tokamak = {
  bake(mk) {
    const P = {}, sh = mk('tokamak', [-200, -330, 200, 8]), c = '#b8c0c8';
    sh.piece(rect(-196, 8, 196, -24), '#7a7c80', { round: 2, paint: (g) => { g.fillStyle = 'rgba(240,200,60,.8)'; for (let x = -190; x < 190; x += 20) { g.beginPath(); g.moveTo(x, -24); g.lineTo(x + 10, -24); g.lineTo(x + 2, -16); g.lineTo(x - 8, -16); g.fill(); } } });
    // the cryostat, a great steel drum
    sh.piece([[-170, -24], [-176, -60], [-176, -250], [-150, -290], [150, -290], [176, -250], [176, -60], [170, -24]], c, { round: 8, lift: 1.4, paint: (g) => {
      const gr = g.createLinearGradient(-176, 0, 176, 0); gr.addColorStop(0, 'rgba(60,70,80,.35)'); gr.addColorStop(0.35, 'rgba(255,255,255,.25)'); gr.addColorStop(1, 'rgba(40,50,60,.4)'); g.fillStyle = gr; g.fillRect(-176, -290, 352, 270);
      g.fillStyle = 'rgba(60,64,70,.45)'; for (const y of [-60, -140, -220]) g.fillRect(-176, y, 352, 4); for (let x = -170; x < 170; x += 14) for (const y of [-58, -138, -218]) { g.beginPath(); g.arc(x, y, 1.6, 0, 7); g.fill(); }
      // the cutaway: a window into the machine
      g.fillStyle = 'rgba(18,20,30,.96)'; g.beginPath(); g.moveTo(-140, -70); g.quadraticCurveTo(-150, -270, 0, -272); g.quadraticCurveTo(150, -270, 140, -70); g.quadraticCurveTo(0, -60, -140, -70); g.fill();
    } });
    // inside: the central solenoid, the vessel's two D-shaped halves, the coils round them
    sh.piece(rect(-14, -76, 14, -264), '#4a4e56', { round: 2, lift: 1, paint: (g) => { g.strokeStyle = 'rgba(200,140,60,.6)'; g.lineWidth = 1.4; for (let y = -80; y > -262; y -= 6) { g.beginPath(); g.moveTo(-14, y); g.lineTo(14, y - 2); g.stroke(); } } });
    for (const s of [-1, 1]) {
      const D = (k) => [[s * (24 + k), -96 + k], [s * (24 + k), -246 - k], [s * (70), -258 - k * 1.2], [s * (118 + k), -210 - k * 0.5], [s * (126 + k), -170], [s * (118 + k), -130 + k * 0.5], [s * 70, -84 + k * 1.2]];
      sh.piece(D(10), '#b86a3a', { round: 10, lift: 1.4, paint: (g) => { g.strokeStyle = 'rgba(255,220,180,.4)'; g.lineWidth = 1; for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(s * 72, -170, 46 - k * 3, 78 - k * 4, 0, 0, 7); g.stroke(); } } });
      sh.piece(D(0), '#5a6068', { round: 10, lift: 1.2, paint: (g) => { g.fillStyle = 'rgba(14,16,24,.96)'; g.beginPath(); g.ellipse(s * 74, -170, 36, 64, 0, 0, 7); g.fill(); } });
    }
    // ports, pipes and diagnostics bristling from the drum
    for (const [x, y, w, h] of [[-196, -170, 22, 26], [176, -150, 26, 22], [176, -230, 20, 18], [-196, -110, 22, 18]]) sh.piece(rect(x, y, x + w, y - h), '#8a9098', { round: 2, lift: 1.6, paint: (g) => { g.fillStyle = 'rgba(40,44,50,.6)'; g.fillRect(x + 4, y - h + 4, w - 8, h - 8); } });
    sh.piece(strip(-150, -290, -120, -320, 6, 6), '#9aa0a8', { round: 1, lift: 1.4 }).piece(strip(120, -290, 160, -320, 6, 6), '#9aa0a8', { round: 1, lift: 1.4 });
    P.spr = sh.finish({ shadowBlur: 7 });
    return P;
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 4, 5); },
  glow(g, P, t, e, env, p) {
    const k = e.plasma ? e.plasma(t) : 0; if (k < 0.01 || p < 0.6) return;
    const fl = 0.9 + 0.1 * Math.sin(t * 13) * Math.sin(t * 5.3), wob = Math.sin(t * 2.1) * 2;
    g.globalCompositeOperation = 'lighter';
    // the plasma, seen through each D: a glowing violet-pink crescent with a white-hot core
    for (const s of [-1, 1]) {
      const cx = s * 74, cy = -170 + wob;
      for (const [rx, ry, col, a] of [[40, 66, '255,90,200', 0.25], [30, 54, '255,130,220', 0.4], [20, 40, '255,190,240', 0.55], [10, 26, '255,240,255', 0.7]]) { const gr = g.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry)); gr.addColorStop(0, `rgba(${col},${a * k * fl})`); gr.addColorStop(1, `rgba(${col},0)`); g.save(); g.translate(cx, cy); g.scale(rx / Math.max(rx, ry), ry / Math.max(rx, ry)); g.translate(-cx, -cy); g.fillStyle = gr; g.fillRect(cx - Math.max(rx, ry), cy - Math.max(rx, ry), Math.max(rx, ry) * 2, Math.max(rx, ry) * 2); g.restore(); }
    }
    // and the ring itself, joining the two, going round behind the solenoid
    g.strokeStyle = `rgba(255,150,230,${0.55 * k * fl})`; g.lineWidth = 9; g.beginPath(); g.ellipse(0, -170 + wob, 92, 18, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
    g.strokeStyle = `rgba(255,230,255,${0.6 * k * fl})`; g.lineWidth = 3; g.beginPath(); g.ellipse(0, -170 + wob, 92, 18, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
    const gr = g.createRadialGradient(0, -170, 0, 0, -170, 220); gr.addColorStop(0, `rgba(220,120,255,${0.16 * k})`); gr.addColorStop(1, 'rgba(220,120,255,0)'); g.fillStyle = gr; g.fillRect(-220, -390, 440, 440);
    // the magnetic cage: field lines wound round the plasma, and ions racing along them
    for (const s of [-1, 1]) {
      const cx = s * 74, cy = -170 + wob;
      g.lineWidth = 1.3; g.setLineDash([5, 7]);
      for (let j = 0; j < 3; j++) { g.lineDashOffset = -t * (40 + j * 14) * s; g.strokeStyle = `rgba(${j === 1 ? '150,220,255' : '210,170,255'},${0.55 * k})`; g.beginPath(); g.ellipse(cx, cy, 31 - j * 7, 57 - j * 12, Math.sin(t * 0.7 + j) * 0.12, 0, Math.PI * 2); g.stroke(); }
      g.setLineDash([]);
      for (let i = 0; i < 10; i++) { const a = t * (3 + (i % 3)) * s + i * 0.63, rr = 0.55 + (i % 4) * 0.12; g.fillStyle = `rgba(255,240,255,${0.85 * k})`; g.beginPath(); g.arc(cx + Math.cos(a) * 31 * rr, cy + Math.sin(a) * 57 * rr, 1.6, 0, 7); g.fill(); }
    }
    g.globalCompositeOperation = 'source-over';
  },
};
// The control room desk: screens with the plasma's shape, a trace, and a clock.
KINDS.controldesk = {
  bake(mk) {
    return { spr: mk('controldesk', [-90, -90, 90, 6]).piece([[-86, 4], [-86, -36], [86, -36], [86, 4]], '#3a3e46', { round: 2 }).piece([[-90, -36], [90, -36], [84, -46], [-84, -46]], '#5a5e66', { round: 1.5, lift: 1 })
      .piece(rect(-80, -50, -30, -86), '#1a1e26', { round: 1.5, lift: 1.2 }).piece(rect(-24, -50, 26, -86), '#1a1e26', { round: 1.5, lift: 1.2 }).piece(rect(32, -50, 82, -86), '#1a1e26', { round: 1.5, lift: 1.2 }).finish({ shadowBlur: 4 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 2, 3); },
  glow(g, P, t, e, env, p) {
    if (p < 0.6) return; const k = e.plasma ? e.plasma(t) : 0;
    g.globalCompositeOperation = 'lighter';
    g.fillStyle = 'rgba(90,140,200,.35)'; for (const x of [-80, -24, 32]) g.fillRect(x + 2, -84, 46, 32);
    g.strokeStyle = `rgba(255,140,230,${0.4 + 0.6 * k})`; g.lineWidth = 2; g.beginPath(); g.ellipse(-55, -68, 8, 13, 0, 0, 7); g.stroke();
    g.strokeStyle = 'rgba(140,240,170,.9)'; g.lineWidth = 1.4; g.beginPath(); for (let x = 0; x <= 44; x += 2) { const y = -60 - (x < 8 ? x * 2 : 16 + Math.sin(x + t * 4) * 1.2 * k); x ? g.lineTo(-22 + x, y) : g.moveTo(-22 + x, y); } g.stroke();
    g.fillStyle = 'rgba(255,220,120,.9)'; const secs = Math.floor(e.clock ? e.clock(t) : 0); const s = String(secs).padStart(4, '0'); for (let i = 0; i < 4; i++) { const d = +s[i]; for (let b = 0; b < 7; b++) if ([0b1110111, 0b0100100, 0b1011101, 0b1101101, 0b0101110, 0b1101011, 0b1111011, 0b0100101, 0b1111111, 0b1101111][d] >> b & 1) { const x0 = 38 + i * 11, y0 = -80; const seg = [[x0, y0, 6, 1.4], [x0, y0, 1.4, 8], [x0 + 5, y0, 1.4, 8], [x0, y0 + 8, 6, 1.4], [x0, y0 + 8, 1.4, 8], [x0 + 5, y0 + 8, 1.4, 8], [x0, y0 + 16, 6, 1.4]][b]; g.fillRect(...seg); } }
    g.globalCompositeOperation = 'source-over';
  },
};

// ========================================================== quantum ===
// A ground station: an observatory dome, its slit open, a telescope tracking the satellite.
KINDS.qstation = {
  bake(mk) {
    const P = {};
    P.base = mk('qstation', [-70, -140, 70, 6]).piece(rect(-56, 4, 56, -60), '#e0dcd2', { round: 2, paint: (g) => { g.fillStyle = 'rgba(40,40,46,.85)'; g.fillRect(-10, -34, 20, 38); } })
      .piece([[-64, -60], [-60, -100], [-36, -130], [0, -138], [36, -130], [60, -100], [64, -60]], '#eeeeea', { round: 8, lift: 1.4, paint: (g) => { g.fillStyle = 'rgba(20,22,30,.95)'; g.beginPath(); g.moveTo(-6, -138); g.lineTo(14, -134); g.lineTo(26, -90); g.lineTo(10, -90); g.fill(); g.strokeStyle = 'rgba(150,150,150,.4)'; g.lineWidth = 1; for (let k = -50; k <= 50; k += 14) { g.beginPath(); g.moveTo(k, -64); g.quadraticCurveTo(k * 0.6, -120, 0, -138); g.stroke(); } } }).finish({ shadowBlur: 4 });
    P.scope = mk('qscope', [-6, -6, 60, 6], { pad: 4 }).piece([[-4, -4], [56, -6], [56, 6], [-4, 4]], '#8a8e96', { round: 2 }).piece(rect(50, -7, 58, 7), '#3a3e46', { round: 1, lift: 1 }).finish({ shadowBlur: 2 });
    return P;
  },
  draw(g, P, t, e, env) { g.save(); g.translate(8, -104); g.rotate(-(e.aim ?? 60) * DEG); put(g, P.scope, env.sh * 0.5); g.restore(); put(g, P.base, env.sh, 3, 4); },
};
// A row of supercomputer cabinets, blinking.
KINDS.supercomp = {
  bake(mk) { const sh = mk('supercomp', [-90, -120, 90, 6]); for (let i = 0; i < 4; i++) { const x = -86 + i * 44; sh.piece(rect(x, 4, x + 40, -110), '#1e2026', { round: 1.5, lift: i ? 1 : 0, paint: (g) => { g.strokeStyle = 'rgba(120,130,150,.4)'; g.lineWidth = 0.8; for (let y = -100; y < 0; y += 10) { g.beginPath(); g.moveTo(x + 4, y); g.lineTo(x + 36, y); g.stroke(); } } }); } return { spr: sh.finish({ shadowBlur: 4 }) }; },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 3, 4); },
  glow(g, P, t, e, env, p) { if (p < 0.6) return; g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 4; i++) for (let j = 0; j < 10; j++) { const on = Math.sin(t * (3 + hash(i * 10 + j) * 6) + j) > 0.3; if (!on) continue; g.fillStyle = hash(i + j * 3) < 0.3 ? 'rgba(255,170,60,.9)' : 'rgba(80,200,255,.9)'; g.fillRect(-80 + i * 44 + hash(j * 7 + i) * 26, -98 + j * 10, 3, 2); } g.globalCompositeOperation = 'source-over'; },
};

// ========================================================== robots ===
// A humanoid robot: dark limbs, bright joint discs, a glossy visor for a face. It can dance (e.dance),
// run (e.run), and, being a robot in its first race, fall over and get up (e.fall).
KINDS.humanoid = {
  bake(mk, v = 0) {
    const P = {}, dk = v ? '#e8e8ea' : '#2a2c32', jt = v ? '#2a2c32' : '#b8bcc4', lite = { thick: 1, lift: 1.2, rough: 0.3, seg: 40 };
    const limb = (name, len, w0, w1, foot) => { const s = mk(name + v, [-8, -4, foot ? 20 : 8, len + 6], { pad: 4 }); s.piece([[-w0 / 2, -2], [w0 / 2, -2], [w1 / 2, len], [-w1 / 2, len]], dk, { ...lite, round: 2.4 }); if (foot) s.piece([[-5, len - 2], [14, len - 2], [16, len + 4], [-5, len + 4]], dk, { ...lite, round: 1.5 }); s.piece(ellipse(0, 0, w0 * 0.42, w0 * 0.42, 10), jt, { ...lite, round: 1, lift: 0.8 }); return s.finish({ shadowBlur: 2 }); };
    P.thigh = limb('hu-thigh', 30, 11, 9); P.shin = limb('hu-shin', 30, 9, 6, true); P.upper = limb('hu-upper', 20, 8, 7); P.fore = limb('hu-fore', 20, 7, 6);
    P.torso = mk('hu-torso' + v, [-18, -50, 18, 8], { pad: 4 }).piece([[-12, 4], [12, 4], [15, -26], [12, -44], [-12, -44], [-15, -26]], dk, { ...lite, round: 4, paint: (g) => { g.fillStyle = 'rgba(120,200,255,.5)'; g.fillRect(-8, -30, 16, 2); g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(-12, -42, 6, 40); } }).finish({ shadowBlur: 2 });
    P.head = mk('hu-head' + v, [-14, -26, 16, 6], { pad: 4 }).piece([[-9, 2], [7, 2], [10, -6], [11, -16], [6, -22], [-6, -22], [-11, -14]], dk, { ...lite, round: 4 }).piece([[0, -6], [11, -8], [11, -17], [3, -18]], '#0e1014', { ...lite, round: 2, lift: 0.6, paint: (g) => { g.fillStyle = 'rgba(120,200,255,.55)'; g.fillRect(4, -14, 6, 1.6); } }).finish({ shadowBlur: 2 });
    P.hanky = mk('hanky', [-12, -12, 12, 12], { pad: 3 }).piece([[0, -11], [3, -3], [11, 0], [3, 3], [0, 11], [-3, 3], [-11, 0], [-3, -3]], '#d8282a', { round: 1.2, thick: 0.4, paint: (g) => { g.strokeStyle = 'rgba(240,200,80,.8)'; g.lineWidth = 1; g.beginPath(); g.arc(0, 0, 5, 0, 7); g.stroke(); } }).finish({ shadowBlur: 1.5 });
    return P;
  },
  draw(g, P, t, e, env) {
    const D = e.dance ? e.dance(t) : 0, Rn = e.run ? e.run(t) : 0, F = e.fall ? e.fall(t) : 0, ph = t * (Rn ? 9 : 4.4) + (e.ph || 0);
    // pose
    let hipL = 0, kneeL = 0, hipR = 0, kneeR = 0, lean = 0, sh1 = 10, el1 = -20, sh2 = 10, el2 = -20, bob = 0, head = 0;
    if (Rn) { hipL = Math.sin(ph) * 34; kneeL = -Math.max(0, Math.sin(ph + 1)) * 60; hipR = Math.sin(ph + Math.PI) * 34; kneeR = -Math.max(0, Math.sin(ph + Math.PI + 1)) * 60; lean = 10; sh1 = -Math.sin(ph) * 40; el1 = -70; sh2 = Math.sin(ph) * 40; el2 = -70; bob = Math.abs(Math.sin(ph)) * 4; }
    else if (D) { const b = Math.sin(ph * 2); hipL = -8 + b * 6 * D; kneeL = -12 - Math.max(0, b) * 20 * D; hipR = -8 - b * 6 * D; kneeR = -12 - Math.max(0, -b) * 20 * D; lean = Math.sin(ph) * 6 * D; sh1 = -100 - Math.sin(ph) * 50 * D; el1 = -40; sh2 = -60 + Math.sin(ph) * 60 * D; el2 = -30; bob = Math.abs(b) * 3 * D; head = Math.sin(ph) * 8 * D; }
    g.save(); g.rotate(F * -1.45); g.translate(0, F * 10);
    const H = 60 - bob - Math.min(0, Math.min(kneeL, kneeR)) * 0.08;
    g.translate(0, -H);
    const leg = (hip, knee, back) => { g.save(); g.translate(back ? -2 : 2, 0); g.rotate(-hip * DEG); put(g, P.thigh, back ? 0 : env.sh * 0.6, 1, 2); g.translate(0, 30); g.rotate(-knee * DEG); put(g, P.shin, back ? 0 : env.sh * 0.6, 1, 2); g.restore(); };
    const arm = (a, b, back, hanky) => { g.save(); g.translate(back ? -3 : 3, -38); g.rotate(a * DEG); put(g, P.upper, back ? 0 : env.sh * 0.5, 1, 2); g.translate(0, 20); g.rotate(b * DEG); if (hanky) { g.save(); g.translate(0, 22); g.rotate(t * 9 + (back ? 1 : 0)); put(g, P.hanky, 0); g.restore(); } put(g, P.fore, back ? 0 : env.sh * 0.5, 1, 2); g.restore(); };
    leg(hipR, kneeR, true); arm(sh2, el2, true, D > 0.2);
    g.save(); g.rotate(lean * DEG); put(g, P.torso, env.sh * 0.6, 2, 3); g.save(); g.translate(0, -46); g.rotate(head * DEG); put(g, P.head, env.sh * 0.5, 1, 2); g.restore(); g.restore();
    leg(hipL, kneeL, false); arm(sh1, el1, false, D > 0.2);
    g.restore();
  },
};
// The Spring Festival Gala stage: a red backdrop with golden clouds, lanterns hung high, a lit floor.
KINDS.galastage = {
  bake(mk) {
    const sh = mk('galastage', [-200, -320, 200, 8]), win = [];
    sh.piece(rect(-196, -30, 196, -300), '#a8222a', { round: 2, paint: (g) => { g.strokeStyle = 'rgba(240,200,90,.55)'; g.lineWidth = 2.4; for (const [x, y, s] of [[-140, -240, 1], [-60, -120, 0.8], [90, -200, 1.1], [150, -90, 0.7]]) { g.beginPath(); for (let k = 0; k < 3; k++) { g.arc(x + k * 18 * s, y, 10 * s, Math.PI, 0); } g.stroke(); g.beginPath(); g.arc(x + 8 * s, y + 6, 14 * s, Math.PI * 0.2, Math.PI * 1.2); g.stroke(); } g.fillStyle = 'rgba(248,210,110,.85)'; g.beginPath(); g.arc(0, -190, 60, 0, 7); g.fill(); g.fillStyle = 'rgba(200,40,40,.9)'; g.beginPath(); g.arc(0, -190, 50, 0, 7); g.fill(); g.strokeStyle = 'rgba(248,210,110,.9)'; g.lineWidth = 3; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; g.beginPath(); g.moveTo(Math.cos(a) * 14, -190 + Math.sin(a) * 14); g.lineTo(Math.cos(a) * 46, -190 + Math.sin(a) * 46); g.stroke(); } } });
    sh.piece([[-200, 8], [-196, -30], [196, -30], [200, 8]], '#3a2a2a', { round: 2, lift: 1.2, paint: (g) => { g.fillStyle = 'rgba(240,200,90,.8)'; g.fillRect(-196, -30, 392, 4); } });
    return { spr: sh.finish({ shadowBlur: 5 }), windows: win };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 3, 4); },
  glow(g, P, t, e, env, p) { if (p < 0.6) return; const k = e.lit ? e.lit(t) : 1; g.globalCompositeOperation = 'lighter'; for (const [x, c] of [[-120, '255,220,170'], [0, '255,240,210'], [120, '255,220,170']]) { const sw = Math.sin(t * 0.8 + x) * 20; const gr = g.createLinearGradient(x + sw, -320, x, -30); gr.addColorStop(0, `rgba(${c},0)`); gr.addColorStop(1, `rgba(${c},${0.32 * k})`); g.fillStyle = gr; g.beginPath(); g.moveTo(x + sw - 8, -320); g.lineTo(x + sw + 8, -320); g.lineTo(x + 50, -30); g.lineTo(x - 50, -30); g.fill(); } g.globalCompositeOperation = 'source-over'; },
};
// A finishing arch for the half-marathon.
KINDS.finisharch = {
  bake(mk) { const sh = mk('finisharch', [-110, -190, 110, 6]); const pts = []; for (let i = 0; i <= 20; i++) { const a = Math.PI + (i / 20) * Math.PI; pts.push([Math.cos(a) * 96, Math.sin(a) * 170]); } const inner = []; for (let i = 20; i >= 0; i--) { const a = Math.PI + (i / 20) * Math.PI; inner.push([Math.cos(a) * 74, Math.sin(a) * 148]); } sh.piece([...pts, ...inner], '#d8282a', { round: 6, paint: (g) => { g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 4; g.beginPath(); g.ellipse(0, 0, 85, 159, 0, Math.PI * 1.25, Math.PI * 1.75); g.stroke(); } }); return { spr: sh.finish({ shadowBlur: 4 }) }; },
  draw(g, P, t, e, env) { g.scale(1 + Math.sin(t * 1.6) * 0.01, 1 - Math.sin(t * 1.6) * 0.01); put(g, P.spr, env.sh, 3, 4); },
};

// ===================================================== the dark factory ===
// A six-axis robot arm, painted safety orange: a turret on a base, a thick shoulder, a forearm, a wrist with a welding torch.
// e.ph sets its rhythm: it reaches down to the car, welds (a burst of light and sparks), lifts away.
const armPose = (t, e) => { const ph = t * 1.3 + (e.ph || 0), c = Math.sin(ph), down = clamp(0.5 - 0.5 * c); return { a1: 14 + down * 22, a2: 30 + down * 34, a3: 58 - down * 20, weld: c < -0.35, ph }; };
KINDS.robotarm = {
  bake(mk) {
    const P = {}, o = '#e8781a', od = '#b85a12', lite = { thick: 1.4, lift: 1.6, rough: 0.3, seg: 40 };
    P.base = mk('ra-base', [-34, -64, 34, 6]).piece([[-30, 4], [30, 4], [26, -12], [-26, -12]], '#2e3036', { ...lite, round: 2, paint: (g) => { g.fillStyle = 'rgba(240,200,40,.8)'; for (let x = -26; x < 26; x += 8) { g.beginPath(); g.moveTo(x, -12); g.lineTo(x + 4, -12); g.lineTo(x, 2); g.lineTo(x - 4, 2); g.fill(); } } })
      .piece([[-22, -12], [22, -12], [20, -40], [-20, -40]], o, { ...lite, round: 6, paint: (g) => { g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(-18, -38, 6, 26); g.fillStyle = 'rgba(30,30,30,.7)'; g.fillRect(-10, -30, 20, 4); } })
      .piece(ellipse(0, -48, 18, 14, 16), od, { ...lite, round: 4 }).finish({ shadowBlur: 3 });
    P.a1 = mk('ra-a1', [-18, -114, 18, 18], { pad: 4 }).piece([[-15, 8], [15, 8], [12, -96], [-12, -96]], o, { ...lite, round: 8, paint: (g) => { g.fillStyle = 'rgba(255,255,255,.16)'; g.fillRect(-11, -90, 5, 92); g.fillStyle = 'rgba(40,40,40,.65)'; g.fillRect(-4, -70, 8, 30); } })
      .piece(ellipse(0, 0, 17, 17, 16), '#3a3c42', { ...lite, round: 3, paint: (g) => { g.fillStyle = o; g.beginPath(); g.arc(0, 0, 9, 0, 7); g.fill(); } }).piece(ellipse(0, -100, 14, 14, 14), od, { ...lite, round: 3 }).finish({ shadowBlur: 3 });
    P.a2 = mk('ra-a2', [-14, -14, 100, 14], { pad: 4 }).piece([[-10, -11], [92, -7], [92, 7], [-10, 11]], o, { ...lite, round: 7, paint: (g) => { g.fillStyle = 'rgba(255,255,255,.16)'; g.fillRect(-6, -9, 92, 4); } })
      .piece(ellipse(92, 0, 9, 9, 12), '#3a3c42', { ...lite, round: 2 }).finish({ shadowBlur: 3 });
    P.tool = mk('ra-tool', [-8, -10, 46, 12], { pad: 4 }).piece([[0, -6], [24, -5], [26, 5], [0, 6]], '#4a4c52', { ...lite, round: 2 }).piece([[24, -3], [42, 4], [40, 8], [24, 4]], '#8a8e96', { ...lite, round: 1.5 }).finish({ shadowBlur: 2 });
    return P;
  },
  draw(g, P, t, e, env) {
    const p = armPose(t, e);
    put(g, P.base, env.sh, 2, 3);
    g.save(); g.translate(0, -48); g.rotate(p.a1 * DEG); put(g, P.a1, env.sh * 0.6, 2, 3);
    g.translate(0, -100); g.rotate((p.a2 - p.a1) * DEG); put(g, P.a2, env.sh * 0.6, 2, 3);
    g.translate(92, 0); g.rotate(p.a3 * DEG); put(g, P.tool, env.sh * 0.5, 1, 2);
    g.restore();
  },
  glow(g, P, t, e, env, p0) {
    if (p0 < 0.6) return; const p = armPose(t, e);
    g.save(); g.translate(0, -48); g.rotate(p.a1 * DEG); g.translate(0, -100); g.rotate((p.a2 - p.a1) * DEG); g.translate(92, 0); g.rotate(p.a3 * DEG); g.translate(42, 6);
    g.globalCompositeOperation = 'lighter';
    if (p.weld) {
      const fl = 0.8 + 0.2 * Math.sin(t * 60), gr = g.createRadialGradient(0, 0, 0, 0, 0, 70); gr.addColorStop(0, `rgba(235,245,255,${fl})`); gr.addColorStop(0.15, `rgba(150,200,255,${0.7 * fl})`); gr.addColorStop(1, 'rgba(110,160,255,0)'); g.fillStyle = gr; g.fillRect(-70, -70, 140, 140);
      for (let i = 0; i < 22; i++) { const s = Math.floor(t * 24) + i * 7, a = -0.4 + hash(s * 13) * 2.4, l = 10 + hash(s * 7) * 46; g.strokeStyle = `rgba(255,${190 + (i % 5) * 12},110,.95)`; g.lineWidth = 1.4; g.beginPath(); g.moveTo(Math.cos(a) * l * 0.3, Math.sin(a) * l * 0.3); g.lineTo(Math.cos(a) * l, Math.sin(a) * l + l * l * 0.004); g.stroke(); }
    }
    g.restore();
    g.globalCompositeOperation = 'lighter'; g.fillStyle = (t * 0.8 + (e.ph || 0)) % 1 < 0.5 ? 'rgba(80,255,140,.95)' : 'rgba(80,255,140,.35)'; g.beginPath(); g.arc(16, -32, 3, 0, 7); g.fill(); g.fillStyle = 'rgba(255,170,40,.8)'; g.beginPath(); g.arc(-16, -32, 2.4, 0, 7); g.fill();
    g.globalCompositeOperation = 'source-over';
  },
};
// A car body on its way down the line, and a self-driving cart with a blue light.
KINDS.carbody = {
  bake(mk, v = 0) { return { spr: mk('carbody' + v, [-90, -70, 90, 6]).piece([[-80, -10], [-82, -30], [-50, -36], [-30, -58], [30, -60], [56, -36], [84, -32], [84, -10]], v ? '#c8ccd2' : '#d8dadc', { round: 6, paint: (g) => { g.fillStyle = 'rgba(30,34,40,.75)'; g.beginPath(); g.moveTo(-26, -54); g.lineTo(26, -56); g.lineTo(48, -36); g.lineTo(-44, -34); g.fill(); g.fillStyle = 'rgba(30,34,40,.5)'; for (const x of [-50, 50]) { g.beginPath(); g.arc(x, -10, 15, Math.PI, 0); g.fill(); } } }).piece(rect(-86, 6, 86, -8), '#4a4c52', { round: 1, lift: 0.8 }).finish({ shadowBlur: 3 }) }; },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 2, 3); },
};
KINDS.agv = {
  bake(mk) { return { spr: mk('agv', [-34, -30, 34, 6]).piece(rect(-30, 2, 30, -12), '#3a3c42', { round: 3 }).piece(rect(-24, -12, 24, -26), '#8a8e96', { round: 1.5, lift: 1 }).finish({ shadowBlur: 2 }) }; },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 2, 3); },
  glow(g, P, t, e, env, p) { if (p < 0.6) return; g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(80,180,255,.95)'; g.fillRect(-28, -6, 56, 2.4); const gr = g.createRadialGradient(0, -4, 0, 0, -4, 50); gr.addColorStop(0, 'rgba(80,170,255,.35)'); gr.addColorStop(1, 'rgba(80,170,255,0)'); g.fillStyle = gr; g.fillRect(-50, -54, 100, 100); g.globalCompositeOperation = 'source-over'; },
};
// The factory hall, cut away: steel trusses overhead, no windows lit.
KINDS.factoryhall = {
  bake(mk) { const sh = mk('factoryhall', [-240, -300, 240, 6]); sh.piece(rect(-236, 4, 236, -270), '#2e3036', { round: 2, paint: (g) => { g.strokeStyle = 'rgba(90,96,108,.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-236, -230); g.lineTo(236, -230); g.stroke(); for (let x = -230; x < 236; x += 30) { g.beginPath(); g.moveTo(x, -230); g.lineTo(x + 15, -266); g.lineTo(x + 30, -230); g.stroke(); } g.fillStyle = 'rgba(60,64,72,.6)'; for (let x = -220; x < 230; x += 70) g.fillRect(x, -200, 40, 18); } }); sh.piece([[-244, -266], [0, -300], [244, -266], [244, -258], [-244, -258]], '#3a3c44', { round: 2, lift: 1.4 }); return { spr: sh.finish({ shadowBlur: 6 }) }; },
  draw(g, P, t, e, env) {
    put(g, P.spr, env.sh, 3, 4);
    // the lamp housings under the roof
    for (let i = 0; i < 8; i++) { const x = -196 + i * 56; g.fillStyle = '#4a4e58'; g.fillRect(x - 12, -230, 24, 6); }
  },
  glow(g, P, t, e, env, p) {
    if (p < 0.6 || !e.lamp) return;
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 8; i++) {
      const k = e.lamp(t, i); if (k < 0.01) continue;
      const x = -196 + i * 56, fl = 0.94 + 0.06 * Math.sin(t * 40 + i);
      g.fillStyle = `rgba(255,248,230,${0.95 * k * fl})`; g.fillRect(x - 11, -225, 22, 3);
      const gr = g.createLinearGradient(0, -224, 0, 0); gr.addColorStop(0, `rgba(255,240,210,${0.32 * k})`); gr.addColorStop(1, 'rgba(255,240,210,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(x - 10, -224); g.lineTo(x + 10, -224); g.lineTo(x + 40, 0); g.lineTo(x - 40, 0); g.closePath(); g.fill();
    }
    g.globalCompositeOperation = 'source-over';
  },
};

// A coal power station's stack: tall, banded red and white, a platform near the top.
KINDS.stack = {
  bake(mk) { const sh = mk('stack', [-24, -360, 24, 6]); sh.piece([[-18, 4], [-11, -340], [11, -340], [18, 4]], '#e8e6e0', { round: 1.5, paint: (g) => { g.fillStyle = '#c8322a'; for (let y = -340; y < -200; y += 40) g.fillRect(-20, y, 40, 20); g.fillStyle = 'rgba(80,80,80,.2)'; g.fillRect(4, -340, 6, 344); } }).piece(rect(-16, -300, 16, -306), '#6a6c70', { round: 1, lift: 1 }); return { spr: sh.finish({ shadowBlur: 4 }) }; },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 3, 4); },
  glow(g, P, t, e, env, p) { if (p < 0.6 || !(env.S.blink > 0 || e.lights)) return; const on = (t * 0.6) % 1 < 0.5; if (!on) return; g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(0, -342, 0, 0, -342, 14); gr.addColorStop(0, 'rgba(255,60,40,.9)'); gr.addColorStop(1, 'rgba(255,60,40,0)'); g.fillStyle = gr; g.fillRect(-14, -356, 28, 28); g.globalCompositeOperation = 'source-over'; },
};
// Shenzhen: KK100, a tall slab with a rounded crown; and China Resources' "Spring Bamboo", ribbed, coming to a point.
KINDS.kk100 = {
  bake(mk) { const H = 420, sh = mk('kk100', [-46, -H - 40, 46, 6]), hw = () => 38, win = facadeWindows(hw, -14, -H + 20, 12, 8, 4, 6); sh.piece([[-38, 4], [-38, -H + 20], [-30, -H - 8], [-10, -H - 28], [10, -H - 30], [30, -H - 14], [38, -H + 10], [38, 4]], '#7a8a9a', { round: 3, rough: 0.3, paint: (g) => { glass(-40, -H - 30, 40, 4, 'rgba(100,118,134,1)', 'rgba(176,196,212,1)', 6)(g); paintRects(win, 'rgba(26,36,48,.5)')(g); g.fillStyle = 'rgba(220,230,236,.5)'; g.fillRect(-38, -H + 20, 76, 3); } }); return { spr: sh.finish({ shadowBlur: 6 }), windows: win }; },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 4, 5); }, glow: glowRects,
};
KINDS.bamboo400 = {
  bake(mk) { const H = 380, sh = mk('bamboo400', [-40, -H - 70, 40, 6]), hw = (y) => lerp(32, 16, (-y / H) ** 1.4), win = facadeWindows(hw, -14, -H + 10, 12, 8, 4, 6).filter(([x]) => Math.abs(x) < 20); const pts = []; for (let i = 0; i <= 16; i++) { const y = -H * (i / 16); pts.push([-hw(y), y]); } pts.push([0, -H - 64]); for (let i = 16; i >= 0; i--) { const y = -H * (i / 16); pts.push([hw(y), y]); }
    sh.piece(pts, '#c8ccd0', { round: 2, rough: 0.3, paint: (g) => { glass(-34, -H - 64, 34, 4, 'rgba(150,160,170,1)', 'rgba(220,226,232,1)', 5)(g); paintRects(win, 'rgba(30,40,50,.45)')(g); g.strokeStyle = 'rgba(250,250,250,.75)'; g.lineWidth = 1.6; for (let k = -3; k <= 3; k++) { g.beginPath(); for (let i = 0; i <= 16; i++) { const y = -H * (i / 16) - (i === 16 ? 60 * (1 - Math.abs(k) / 4) : 0), x = (k / 3.6) * hw(Math.max(y, -H)) * (i === 16 ? 0.2 : 1); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); } } });
    return { spr: sh.finish({ shadowBlur: 6 }), windows: win }; },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 4, 5); }, glow: glowRects,
};

// A Chinese electric car: pearl body, glass roof, light bars front and back, and the green number plate of a new-energy vehicle.
KINDS.ev = {
  bake(mk) {
    const P = {};
    P.body = mk('ev', [-72, -56, 76, 6])
      .piece([[-66, -12], [-66, -26], [-48, -32], [-28, -50], [14, -52], [36, -34], [64, -28], [72, -18], [70, -10], [-64, -8]], '#e6e7ea', { round: 9, paint: (g) => {
        g.fillStyle = 'rgba(28,34,44,.9)'; g.beginPath(); g.moveTo(-24, -34); g.lineTo(-14, -48); g.lineTo(12, -49); g.lineTo(30, -34); g.closePath(); g.fill();
        g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-10, -47, 18, 3);
        g.fillStyle = 'rgba(120,130,140,.5)'; g.fillRect(-60, -20, 128, 1.6);
        // the green new-energy plate
        const pg = g.createLinearGradient(0, -22, 0, -15); pg.addColorStop(0, '#f2f6ee'); pg.addColorStop(1, '#3a9a5a'); g.fillStyle = pg; g.fillRect(56, -22, 12, 7); g.fillStyle = 'rgba(20,30,20,.8)'; g.fillRect(58, -19.5, 8, 1.4);
      } })
      .piece([[-72, -12], [-52, -24], [-34, -12]], '#2a2e34', { round: 4, lift: 1 })
      .piece([[30, -12], [48, -26], [66, -12]], '#2a2e34', { round: 4, lift: 1 })
      .finish({ shadowBlur: 4 });
    P.wheel = mk('ev-w', [-14, -14, 14, 14], { pad: 4 }).piece(ellipse(0, 0, 11, 11, 14), '#1e1c1c', { round: 3, paint: (g) => { g.fillStyle = '#c8ccd2'; g.beginPath(); g.arc(0, 0, 6, 0, 7); g.fill(); g.strokeStyle = 'rgba(60,64,70,.7)'; g.lineWidth = 1; for (let i = 0; i < 5; i++) { const a = i * 1.2566; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * 6, Math.sin(a) * 6); g.stroke(); } } }).finish({ shadowBlur: 2 });
    return P;
  },
  draw(g, P, t, e, env) {
    const d = e.move ? e.move(t) * DEG * 1000 : 0;
    g.translate(0, -12 + Math.sin(t * 13) * 0.3); put(g, P.body, env.sh, 3, 4);
    for (const x of [-44, 48]) { g.save(); g.translate(x, -2); g.rotate(d / 11); put(g, P.wheel, 0); g.restore(); }
  },
  glow(g, P, t, e, env, p) {
    if (p < 0.6) return; g.globalCompositeOperation = 'lighter';
    g.fillStyle = 'rgba(210,240,255,.85)'; g.fillRect(58, -42, 12, 2.4); g.fillStyle = 'rgba(255,60,50,.8)'; g.fillRect(-66, -40, 8, 2.4);
    g.globalCompositeOperation = 'source-over';
  },
};

// A tunnel mouth in a karst hill: the high-speed line comes out of the mountain onto its viaduct.
KINDS.portal = {
  bake(mk) {
    const sh = mk('portal', [-170, -330, 80, 6]);
    sh.piece([[-160, 4], [-150, -120], [-120, -240], [-80, -310], [-40, -300], [-10, -230], [20, -170], [44, -150], [50, -80], [56, 4]], '#6e7e70', { round: 10, rough: 1.6, paint: (g) => { g.fillStyle = 'rgba(40,60,40,.35)'; for (let i = 0; i < 26; i++) { g.beginPath(); g.ellipse(-140 + (i * 37) % 180, -40 - ((i * 53) % 250), 10 + (i % 4) * 4, 6, 0, 0, 7); g.fill(); } } });
    // the portal: a concrete arch, dark inside
    sh.piece([[18, -88], [18, -150], [30, -168], [58, -168], [70, -150], [70, -88]], '#c8c6be', { round: 3, lift: 1.4, paint: (g) => { g.fillStyle = '#121418'; g.beginPath(); g.moveTo(28, -88); g.lineTo(28, -146); g.quadraticCurveTo(44, -160, 60, -146); g.lineTo(60, -88); g.closePath(); g.fill(); } });
    return { spr: sh.finish({ shadowBlur: 5 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 4, 5); },
};
