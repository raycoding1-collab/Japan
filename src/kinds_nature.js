// Living things and landscape pieces, from the savanna to the open Pacific.
import { put, ellipse, strip, KRAFT } from './paper.js';
import { KINDS } from './cutouts.js';
import { LOOKS, drawPerson } from './people.js';
import { rng, fbm, noise, DEG, hash, shade, mix, rgb, clamp, smooth, sramp, spring } from './util.js';

const dab = (g, r, n, box, cols, len = 6, w = 2) => {
  g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = box[0] + r() * (box[2] - box[0]), y = box[1] + r() * (box[3] - box[1]), a = (r() - 0.5) * 1.2;
    g.strokeStyle = cols[(r() * cols.length) | 0]; g.lineWidth = w * (0.6 + r() * 0.8);
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * len * (0.5 + r()), y + Math.sin(a) * len * 0.4); g.stroke();
  }
};
const hairy = (col, r, box) => (g) => dab(g, r, 70, box, [rgb(shade(col, -0.3), 0.5), rgb(shade(col, 0.18), 0.4)], 7, 1.6);
const sway = (t, e, amt = 2, sp = 0.6) => fbm(t * sp + e.a * 0.37, 13) * amt * DEG;

// ------------------------------------------------------------- conifer ---
KINDS.conifer = {
  bake(mk, v = 0) {
    const r = rng(40 + v), h = 150 + v * 22, col = ['#3f5a46', '#4a6650', '#36503f'][v % 3];
    const sh = mk('conifer' + v, [-50, -h - 10, 50, 6]);
    sh.piece(strip(0, 2, 0, -h * 0.3, 9, 7), '#4a3627', { round: 1.5 });
    for (let k = 0; k < 4; k++) {
      const y = -h * 0.2 - k * h * 0.2, w = 46 - k * 9;
      sh.piece([[-w, y + 6], [-w * 0.3, y - h * 0.3], [0, y - h * 0.36], [w * 0.3, y - h * 0.3], [w, y + 6], [w * 0.5, y + 2], [0, y + 5], [-w * 0.5, y + 2]], shade(col, k * 0.05), { round: 2.5, rough: 1.2, paint: (g) => dab(g, r, 20, [-w, y - h * 0.3, w, y], [rgb(shade(col, 0.2), 0.4)], 6, 1.4) });
      if (v % 2 === 0) sh.piece([[-w * 0.85, y + 4], [-w * 0.3, y - h * 0.18], [0, y - h * 0.3], [w * 0.2, y - h * 0.2], [-w * 0.1, y - h * 0.08], [-w * 0.5, y + 3]], '#eef0ee', { round: 2, lift: 1, thick: 0.6, rim: 0.2 });
    }
    return { spr: sh.finish() };
  },
  draw(g, p, t, e, env) { g.rotate(sway(t, e, 1.2)); put(g, p.spr, env.sh); },
};

// ------------------------------------------------------------- mammoth ---
KINDS.mammoth = {
  bake(mk) {
    const r = rng(7), fur = '#6b4a33', furD = '#5a3d2a';
    const P = {};
    const legs = mk('mam-legs', [-60, -10, 60, 52]);
    for (const [x, c] of [[-38, furD], [30, furD], [-24, fur], [44, fur]]) legs.piece([[x - 10, -6], [x + 10, -6], [x + 9, 44], [x + 11, 50], [x - 10, 50], [x - 9, 44]], c, { round: 3, paint: hairy(c, r, [x - 10, -6, x + 10, 44]) });
    P.legs = legs.finish();
    P.body = mk('mam-body', [-82, -96, 74, 30])
      .piece([[-70, 14], [-78, -10], [-72, -46], [-50, -70], [-14, -80], [24, -88], [46, -82], [62, -60], [70, -30], [66, 0], [56, 22], [20, 28], [-30, 26]], fur, { round: 10, rough: 2.4, seg: 16, paint: hairy(fur, r, [-80, -90, 72, 28]) })
      .piece([[-74, 4], [-60, 30], [-40, 18], [-20, 36], [0, 22], [24, 38], [44, 22], [62, 30], [66, 6], [20, 14], [-30, 12]], furD, { round: 3, rough: 2, lift: 1.2, paint: hairy(furD, r, [-74, 4, 66, 38]) })
      .finish();
    P.head = mk('mam-head', [-10, -40, 52, 30])
      .piece([[-6, 20], [-8, -10], [4, -32], [22, -38], [38, -30], [44, -12], [40, 8], [26, 22], [10, 26]], fur, { round: 8, rough: 2, paint: (g) => { hairy(fur, r, [-8, -38, 44, 26])(g); g.fillStyle = 'rgba(20,12,8,.9)'; g.beginPath(); g.arc(30, -10, 2, 0, 7); g.fill(); } })
      .piece([[2, -6], [-6, 4], [-4, 22], [8, 14], [12, -2]], furD, { round: 3, lift: 1, paint: hairy(furD, r, [-6, -6, 12, 22]) })
      .finish();
    P.trunk = mk('mam-trunk', [-10, -4, 22, 72])
      .piece([[-7, 0], [8, 0], [9, 22], [12, 44], [16, 58], [20, 64], [14, 68], [6, 60], [0, 46], [-4, 24]], fur, { round: 4, paint: (g) => { hairy(fur, r, [-7, 0, 18, 66])(g); g.strokeStyle = 'rgba(30,20,12,.4)'; g.lineWidth = 1; for (let y = 10; y < 62; y += 6) { g.beginPath(); g.moveTo(-4 + y * 0.2, y); g.lineTo(8 + y * 0.18, y + 1); g.stroke(); } } })
      .finish();
    P.tusk = mk('mam-tusk', [-6, -4, 50, 46])
      .piece([[-2, 0], [6, 0], [16, 22], [32, 34], [46, 30], [48, 34], [34, 42], [14, 34], [2, 16]], '#eadfc4', { round: 4, lift: 1.4 })
      .finish();
    return P;
  },
  draw(g, P, t, e, env) {
    const step = Math.sin(t * 1.4 + e.a) * 1.2;
    g.translate(0, -50);
    put(g, P.legs, env.sh, 3, 4);
    g.translate(0, -26 + Math.abs(step) * 0.6);
    put(g, P.body, env.sh, 3, 4);
    g.save(); g.translate(56, -60); g.rotate((8 + fbm(t * 0.4, 3) * 4) * DEG);
    g.save(); g.translate(20, 14); g.rotate((-6 + Math.sin(t * 1.1 + 1) * 9 + fbm(t * 0.7, 8) * 5) * DEG); put(g, P.trunk, env.sh * 0.6); g.restore();
    put(g, P.head, env.sh * 0.6);
    g.save(); g.translate(12, 10); put(g, P.tusk, env.sh * 0.5); g.restore();
    g.restore();
  },
};

// ----------------------------------------------------------- kangaroo ---
KINDS.kangaroo = {
  bake(mk) {
    const c = '#b77a4e', cD = '#9c653e';
    return {
      spr: mk('roo', [-60, -96, 40, 6])
        .piece([[-56, -6], [-40, -16], [-20, -26], [-10, -20], [-30, -8], [-50, 0]], cD, { round: 3 })
        .piece([[-20, -30], [-24, -52], [-14, -72], [0, -80], [10, -78], [14, -64], [8, -40], [12, -18], [30, -2], [34, 2], [8, 2], [-6, -10]], c, { round: 7, paint: (g) => { g.fillStyle = 'rgba(245,225,195,.5)'; g.beginPath(); g.ellipse(4, -46, 6, 18, -0.2, 0, 7); g.fill(); } })
        .piece([[2, -78], [6, -88], [14, -92], [24, -88], [30, -84], [28, -80], [16, -76]], c, { round: 3, paint: (g) => { g.fillStyle = 'rgba(25,15,10,.9)'; g.beginPath(); g.arc(17, -86, 1.4, 0, 7); g.fill(); } })
        .piece([[6, -88], [2, -100], [8, -92]], cD, { round: 1, lift: 1 })
        .piece([[10, -90], [10, -102], [14, -92]], cD, { round: 1, lift: 1 })
        .piece(strip(8, -56, 20, -46, 5, 3.5), cD, { round: 2, lift: 1 })
        .finish(),
    };
  },
  draw(g, P, t, e, env) {
    const ph = (t * 1.3 + e.a) % 2.2, hop = ph < 0.55 ? Math.sin(ph / 0.55 * Math.PI) * 22 : 0;
    g.translate(0, -hop); g.rotate((ph < 0.55 ? -8 : 0) * DEG);
    put(g, P.spr, env.sh);
  },
};

// --------------------------------------------------------------- sheep ---
KINDS.sheep = {
  bake(mk, v = 0) {
    const r = rng(60 + v), wool = ['#e9e0cc', '#ddd2b8', '#cfc3a6', '#8a6a4a', '#4a3a32'][v % 5];
    const P = {};
    const lg = mk('sheep-legs' + v, [-26, -6, 26, 26]);
    for (const x of [-18, -10, 10, 18]) lg.piece(strip(x, -4, x, 22, 4, 3.6), '#2e2622', { round: 1, thick: 0.7 });
    P.legs = lg.finish({ shadowBlur: 3 });
    const pts = []; for (let i = 0; i <= 12; i++) { const a = Math.PI + (i / 12) * Math.PI; pts.push([Math.cos(a) * 30, Math.sin(a) * 18 - 4 + (r() - 0.5) * 3]); }
    pts.push([28, 4], [-28, 6]);
    P.body = mk('sheep-body' + v, [-34, -28, 34, 12]).piece(pts, wool, { round: 6, rough: 2.4, seg: 8, paint: (g) => { g.strokeStyle = rgb(shade(wool, -0.18), 0.5); g.lineWidth = 1.2; for (let i = 0; i < 26; i++) { g.beginPath(); g.arc(-26 + r() * 52, -18 + r() * 20, 2 + r() * 3, 0, 5); g.stroke(); } } }).finish({ shadowBlur: 3 });
    P.head = mk('sheep-head' + v, [-6, -10, 22, 12]).piece([[-4, -4], [6, -8], [16, -4], [20, 4], [14, 9], [2, 6]], '#2e2622', { round: 3, paint: (g) => { g.fillStyle = 'rgba(240,230,200,.8)'; g.beginPath(); g.arc(10, -2, 1, 0, 7); g.fill(); } }).piece([[0, -6], [-6, -2], [-1, 0]], '#2e2622', { round: 1, lift: 0.6 }).finish({ shadowBlur: 2 });
    return P;
  },
  draw(g, P, t, e, env) {
    const graze = sramp(Math.sin(t * 0.5 + e.a * 3), -0.2, 0.4);
    g.translate(0, -22); put(g, P.legs, env.sh, 2, 3);
    g.translate(0, -4); put(g, P.body, env.sh, 2, 3);
    g.save(); g.translate(26, -10); g.rotate((graze * 50 + Math.sin(t * 6) * graze * 3 - 10) * DEG); put(g, P.head, env.sh); g.restore();
  },
};

// ---------------------------------------------------- Bactrian camel ---
KINDS.camel = {
  bake(mk, v = 0) {
    const r = rng(80 + v), c = ['#b58b5a', '#a77d4f'][v % 2], cD = shade(c, -0.15);
    const P = {};
    for (const side of ['F', 'B']) {
      P['leg' + side] = mk('camel-leg' + side + v, [-8, -6, 10, 70]).piece([[-6, -4], [6, -4], [5, 30], [4, 60], [8, 66], [-6, 66], [-4, 30]], side === 'B' ? cD : c, { round: 2.5 }).finish({ shadowBlur: 3 });
    }
    P.body = mk('camel-body' + v, [-62, -70, 56, 16])
      .piece([[-56, -4], [-58, -22], [-44, -34], [-34, -60], [-20, -64], [-10, -40], [2, -40], [12, -64], [26, -60], [34, -34], [48, -28], [52, -10], [44, 8], [-40, 10]], c, { round: 7, rough: 1.6, paint: hairy(c, r, [-50, -64, 40, -30]) })
      .piece([[-30, -34], [-16, -40], [10, -38], [22, -30], [18, 2], [-24, 2]], '#8a3a2c', { round: 3, lift: 1.4, paint: (g) => { g.fillStyle = 'rgba(230,190,90,.55)'; for (let y = -30; y < 0; y += 6) g.fillRect(-28, y, 48, 2); } })
      .piece([[-26, -4], [-22, 16], [-12, 18], [-10, -4]], '#c8b088', { round: 2, lift: 1.6 })
      .piece([[6, -4], [10, 16], [20, 18], [22, -4]], '#c8b088', { round: 2, lift: 1.6 })
      .finish();
    P.neck = mk('camel-neck' + v, [-8, -66, 40, 8])
      .piece([[-6, 4], [-2, -20], [6, -46], [12, -56], [26, -58], [36, -50], [34, -44], [22, -44], [16, -30], [12, -6], [8, 6]], c, { round: 4, paint: (g) => { hairy(c, r, [-4, -40, 14, 4])(g); g.fillStyle = 'rgba(25,15,10,.9)'; g.beginPath(); g.arc(24, -53, 1.4, 0, 7); g.fill(); } })
      .piece([[12, -56], [10, -62], [16, -58]], cD, { round: 1, lift: 0.8 })
      .brad(0, 0, 1.6).finish({ shadowBlur: 3 });
    return P;
  },
  draw(g, P, t, e, env) {
    const ph = t * (e.pace ?? 3.4) + e.a;
    g.translate(0, -66);
    for (const [x, o, s] of [[-40, 0, 'B'], [36, Math.PI, 'B'], [-34, Math.PI, 'F'], [42, 0, 'F']]) { g.save(); g.translate(x, 0); g.rotate(Math.sin(ph + o) * 16 * DEG); put(g, P['leg' + s], env.sh, 2, 3); g.restore(); }
    g.translate(0, Math.abs(Math.cos(ph)) * 2);
    put(g, P.body, env.sh, 3, 4);
    g.save(); g.translate(44, -16); g.rotate((Math.sin(ph) * 4 + fbm(t * 0.3, 5) * 3) * DEG); put(g, P.neck, env.sh * 0.6); g.restore();
  },
};

// ------------------------------------------------------- palms & trees ---
KINDS.palm = {
  bake(mk, v = 0) {
    const r = rng(90 + v), coco = v % 2 === 1, h = coco ? 170 : 190, bend = coco ? 30 : 4;
    const trunk = mk('palm-trunk' + v, [-20, -h - 10, 50, 6]);
    const tp = []; for (let i = 0; i <= 8; i++) { const k = i / 8; tp.push([bend * k * k - 6 + (1 - k) * -2, -h * k]); }
    const pts = [...tp.map(([x, y], i) => [x - 7 + i * 0.3, y]), ...tp.slice().reverse().map(([x, y], i) => [x + 7 - (8 - i) * 0.3, y])];
    trunk.piece(pts, '#7a5d3e', { round: 2, paint: (g) => { g.strokeStyle = 'rgba(50,34,20,.45)'; g.lineWidth = 1.4; for (let y = -6; y > -h; y -= 9) { g.beginPath(); g.moveTo(-14 + bend * (y / -h) ** 2, y); g.lineTo(14 + bend * (y / -h) ** 2, y + 3); g.stroke(); } } });
    const fronds = [];
    for (let k = 0; k < 7; k++) {
      const a = -Math.PI + 0.2 + k * (Math.PI - 0.4) / 6, len = 70 + r() * 20, col = coco ? '#5c7d3c' : '#6f7d3e';
      const tip = [Math.cos(a) * len, Math.sin(a) * len * 0.75 + len * 0.3 * (Math.abs(Math.cos(a)))];
      const mid = [tip[0] * 0.5, tip[1] * 0.5 - 14];
      const sh = mk('frond' + v + k, [Math.min(0, tip[0], mid[0]) - 8, Math.min(0, tip[1], mid[1]) - 14, Math.max(0, tip[0], mid[0]) + 8, Math.max(0, tip[1], mid[1]) + 14], { pad: 6 });
      const fp = [[0, -3], [mid[0], mid[1] - 6], [tip[0], tip[1]], [mid[0], mid[1] + 6], [0, 3]];
      sh.piece(fp, shade(col, (r() - 0.5) * 0.2), { round: 3, rough: 1.4, seg: 12, paint: (g) => { g.strokeStyle = rgb(shade(col, 0.25), 0.6); g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(mid[0], mid[1], tip[0], tip[1]); g.stroke(); } });
      fronds.push({ spr: sh.finish({ shadowBlur: 3 }), ph: r() * 9 });
    }
    return { trunk: trunk.finish(), fronds, top: [bend - 6, -h] };
  },
  draw(g, P, t, e, env) {
    g.rotate(sway(t, e, 1.4));
    put(g, P.trunk, env.sh);
    g.translate(P.top[0], P.top[1]);
    for (const f of P.fronds) { g.save(); g.rotate((fbm(t * 0.7 + f.ph, 4) * 6 + Math.sin(t * 1.3 + f.ph) * 1.5) * DEG); put(g, f.spr, env.sh, 3, 4); g.restore(); }
    if (P.top[0] > 10) { g.fillStyle = '#5a4128'; for (const [x, y] of [[-6, 6], [3, 8], [8, 4]]) { g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); } }
  },
};

KINDS.oak = {
  bake(mk, v = 0) {
    const r = rng(120 + v), col = ['#5f7a45', '#6b8450', '#55703f', '#7a8a4a'][v % 4], h = 130 + v * 12;
    const sh = mk('oak' + v, [-80, -h - 70, 80, 6]);
    sh.piece([[-9, 2], [-6, -h * 0.5], [-24, -h * 0.75], [-20, -h * 0.8], [-3, -h * 0.62], [0, -h * 0.9], [5, -h * 0.9], [6, -h * 0.6], [26, -h * 0.82], [30, -h * 0.76], [8, -h * 0.48], [10, 2]], '#5a4433', { round: 2 });
    const blobs = [[-40, -h * 0.85, 42], [36, -h * 0.88, 40], [0, -h * 1.08, 52], [-14, -h * 0.72, 36], [20, -h * 0.7, 34]];
    blobs.forEach(([x, y, rr], i) => sh.piece(ellipse(x, y, rr, rr * 0.82, 14), shade(col, (i % 3 - 1) * 0.08), { round: 9, rough: 2.6, seg: 10, paint: (g) => dab(g, r, 40, [x - rr, y - rr, x + rr, y + rr], [rgb(shade(col, 0.2), 0.45), rgb(shade(col, -0.25), 0.4)], 7, 2.4) }));
    return { spr: sh.finish() };
  },
  draw(g, P, t, e, env) { g.rotate(sway(t, e, 1)); put(g, P.spr, env.sh); },
};

// --------------------------------------------------------------- water ---
KINDS.wave = {
  bake(mk, v = 0) {
    const r = rng(150 + v), cols = ['#3d6f93', '#4f84a6', '#2f5c80', '#6b9cb8'], c = cols[v % 4];
    const pts = [[-64, 6]]; for (let i = 0; i <= 8; i++) { const x = -64 + i * 16; pts.push([x - 4, -6 - r() * 4], [x + 4, -14 - r() * 6, 2.5], [x + 8, -5]); }
    pts.push([64, 6]);
    return { spr: mk('wave' + v, [-70, -26, 70, 8], { pad: 6 }).piece(pts, c, { round: 3, rough: 0.8, seg: 30, paint: (g) => { g.fillStyle = 'rgba(235,245,250,.55)'; for (let i = 0; i <= 8; i++) { const x = -60 + i * 16; g.beginPath(); g.ellipse(x + 4, -12, 4, 1.4, -0.4, 0, 7); g.fill(); } } }).finish({ shadowBlur: 3 }), ph: r() * 9 };
  },
  draw(g, P, t, e, env) { g.translate(Math.sin(t * 0.9 + P.ph + e.a) * 6, Math.sin(t * 1.3 + e.a * 2) * 3); g.rotate(Math.sin(t * 1.1 + e.a) * 2 * DEG); put(g, P.spr, env.sh * 0.6, 2, 3); },
};

KINDS.island = {
  bake(mk, v = 0) {
    const r = rng(170 + v), w = 90 + v * 20;
    return { spr: mk('island' + v, [-w - 6, -40, w + 6, 8]).piece([[-w, 6], [-w * 0.7, -10], [-w * 0.3, -26 - r() * 10], [w * 0.2, -30 - r() * 8], [w * 0.7, -12], [w, 6]], '#c9b07a', { round: 8, rough: 2, paint: (g) => { g.fillStyle = 'rgba(90,120,60,.6)'; g.beginPath(); g.ellipse(0, -24, w * 0.5, 10, 0, 0, 7); g.fill(); } }).finish() };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh); },
};

// --------------------------------------------------------------- crops ---
function stalkClump(mk, name, o) {
  const r = rng(o.seed), sh = mk(name, [-40, -o.h - 30, 40, 8], { pad: 6 });
  for (let i = 0; i < o.n; i++) {
    const x = (i - (o.n - 1) / 2) * o.gap + (r() - 0.5) * 3, h = o.h * (0.82 + r() * 0.22), lean = (i - (o.n - 1) / 2) * 3 + (r() - 0.5) * 4;
    sh.piece(strip(x, 2, x + lean, -h, 2.6, 1.6), o.stem, { round: 1, thick: 0.7, lift: 0.8, rough: 0.4 });
    if (o.head) o.head(sh, x + lean, -h, r);
  }
  if (o.leaves) for (let i = 0; i < o.n; i++) { const x = (i - (o.n - 1) / 2) * o.gap; sh.piece([[x, -6], [x - 12 - r() * 8, -o.h * 0.4], [x - 2, -10]], shade(o.stem, -0.1), { round: 1, thick: 0.6, lift: 0.8 }); }
  return sh.finish({ shadowBlur: 3 });
}
KINDS.wheat = {
  bake(mk, v = 0) {
    const gold = v % 2 ? '#d1a54a' : '#c99a3f';
    return { spr: stalkClump(mk, 'wheat' + v, { seed: 200 + v, n: 6, gap: 6, h: 58, stem: '#b58c3c', leaves: true, head: (sh, x, y) => sh.piece([[x - 3, y + 2], [x - 3.6, y - 10], [x, y - 17], [x + 3.6, y - 10], [x + 3, y + 2]], gold, { round: 2, lift: 1, thick: 0.6, paint: (g) => { g.strokeStyle = 'rgba(120,80,20,.6)'; g.lineWidth = 0.7; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(x - 3, y - k * 4); g.lineTo(x + 3, y - k * 4 - 2); g.stroke(); } g.strokeStyle = 'rgba(200,160,70,.8)'; g.beginPath(); g.moveTo(x, y - 16); g.lineTo(x - 2, y - 26); g.moveTo(x + 1, y - 15); g.lineTo(x + 4, y - 24); g.stroke(); } }) }) };
  },
  draw(g, P, t, e, env) { g.rotate((fbm(t * 0.8 + e.a * 0.9, 9) * 5 + Math.sin(t * 1.4 + e.a * 1.7) * 2) * DEG); put(g, P.spr, env.sh * 0.6, 2, 2); },
};
KINDS.millet = {
  bake(mk, v = 0) { return { spr: stalkClump(mk, 'millet' + v, { seed: 230 + v, n: 5, gap: 7, h: 52, stem: '#8f9443', leaves: true, head: (sh, x, y) => sh.piece([[x, y + 2], [x - 4, y - 6], [x + 2, y - 20], [x + 10, y - 14], [x + 5, y - 4]], '#c7b25c', { round: 3, lift: 1, thick: 0.6 }) }) }; },
  draw(g, P, t, e, env) { g.rotate((fbm(t * 0.8 + e.a * 0.9, 9) * 4) * DEG); put(g, P.spr, env.sh * 0.6, 2, 2); },
};
KINDS.rice = {
  bake(mk, v = 0) {
    const r = rng(260 + v);
    const sh = mk('rice' + v, [-46, -62, 46, 10], { pad: 6 });
    sh.piece([[-44, 8], [-42, -2], [42, -3], [44, 8]], '#6d93a8', { round: 2, paint: (g) => { g.fillStyle = 'rgba(230,240,250,.45)'; g.fillRect(-40, -1, 80, 1.5); } });
    for (let i = 0; i < 7; i++) {
      const x = -30 + i * 10 + (r() - 0.5) * 3, h = 40 + r() * 10;
      sh.piece([[x - 1.5, 0], [x - 10, -h * 0.7], [x - 2, -h], [x + 2, -h * 0.6], [x + 9, -h * 0.85], [x + 2, 0]], i % 2 ? '#7c9b45' : '#6c8c3c', { round: 1, thick: 0.6, lift: 0.8 });
      sh.piece([[x + 1, -h * 0.9], [x + 10, -h - 4], [x + 16, -h + 4], [x + 9, -h + 2]], '#cdb25a', { round: 2, thick: 0.5, lift: 0.6 });
    }
    return { spr: sh.finish({ shadowBlur: 3 }) };
  },
  draw(g, P, t, e, env) { g.rotate(fbm(t * 0.7 + e.a, 9) * 3 * DEG); put(g, P.spr, env.sh * 0.6, 2, 2); },
};
KINDS.maize = {
  bake(mk, v = 0) {
    const r = rng(300 + v), h = 120 + v * 10;
    const sh = mk('maize' + v, [-46, -h - 16, 46, 6]);
    sh.piece(strip(0, 2, 2, -h, 5, 3), '#6f8a3a', { round: 1.5 });
    for (let k = 0; k < 5; k++) { const y = -h * (0.25 + k * 0.15), s = k % 2 ? 1 : -1; sh.piece([[1, y], [s * 20, y - 14], [s * 40, y + 2 - r() * 6], [s * 22, y - 6], [1, y + 5]], k % 2 ? '#7a9440' : '#6a8336', { round: 2, lift: 1, thick: 0.7 }); }
    sh.piece([[3, -h * 0.45], [14, -h * 0.58], [16, -h * 0.44], [7, -h * 0.36]], '#9cae5c', { round: 3, lift: 1.4 });
    sh.piece([[7, -h * 0.47], [13, -h * 0.57], [15, -h * 0.5], [10, -h * 0.42]], '#e8c04a', { round: 2, lift: 0.8, thick: 0.5 });
    for (let k = 0; k < 5; k++) sh.piece(strip(2, -h, -10 + k * 5, -h - 14, 1.6, 1), '#c9a95a', { round: 1, lift: 0.6, thick: 0.4 });
    return { spr: sh.finish() };
  },
  draw(g, P, t, e, env) { g.rotate((fbm(t * 0.6 + e.a, 8) * 3 + Math.sin(t * 1.1 + e.a) * 1) * DEG); put(g, P.spr, env.sh); },
};
KINDS.sorghum = {
  bake(mk, v = 0) {
    const r = rng(330 + v), h = 110;
    const sh = mk('sorghum' + v, [-40, -h - 26, 40, 6]);
    sh.piece(strip(0, 2, 3, -h, 4.6, 3), '#7b8a3e', { round: 1.5 });
    for (let k = 0; k < 4; k++) { const y = -h * (0.2 + k * 0.17), s = k % 2 ? 1 : -1; sh.piece([[1, y], [s * 18, y - 16], [s * 34, y - 4], [s * 18, y - 8], [1, y + 5]], '#7f9043', { round: 2, lift: 1, thick: 0.7 }); }
    const head = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i / 9 - 0.5) * 2.2; head.push([3 + Math.cos(a) * 11, -h - 10 + Math.sin(a) * 15]); }
    sh.piece([[3, -h + 6], ...head], '#9a3f2a', { round: 3, rough: 1.6, lift: 1.2, paint: (g) => { g.fillStyle = 'rgba(200,110,70,.6)'; for (let i = 0; i < 26; i++) { g.beginPath(); g.arc(-6 + r() * 18, -h - 22 + r() * 22, 1.3, 0, 7); g.fill(); } } });
    return { spr: sh.finish() };
  },
  draw(g, P, t, e, env) { g.rotate((fbm(t * 0.6 + e.a, 8) * 3) * DEG); put(g, P.spr, env.sh); },
};
// Potatoes: leaves above, and a little cutaway of the tubers in the soil below.
KINDS.potato = {
  bake(mk, v = 0) {
    const r = rng(360 + v);
    const top = mk('potato-top' + v, [-34, -50, 34, 6]);
    top.piece(strip(0, 2, 0, -24, 3, 2), '#5d7a38', { round: 1 });
    for (let i = 0; i < 7; i++) { const a = -Math.PI + 0.3 + i * 0.42, x = Math.cos(a) * 20, y = -22 + Math.sin(a) * 18; top.piece(ellipse(x, y, 9, 6, 9, a), i % 2 ? '#6a8a40' : '#5b7a37', { round: 3, lift: 1, thick: 0.7 }); }
    top.piece(ellipse(-4, -40, 3, 3, 8), '#e9e3f2', { round: 1, lift: 0.8 }).piece(ellipse(6, -36, 3, 3, 8), '#e9e3f2', { round: 1, lift: 0.8 });
    const under = mk('potato-under' + v, [-36, -6, 36, 40], { pad: 6 });
    under.piece([[-34, 0], [34, 0], [30, 22], [16, 34], [-16, 34], [-30, 22]], '#5b3f2a', { round: 8, rough: 1.4, lift: 0, rim: 0.2, paint: (g) => { g.fillStyle = 'rgba(30,18,10,.35)'; g.fillRect(-34, 0, 68, 3); } });
    for (const [x, y, s] of [[-14, 18, 8], [6, 22, 9], [18, 12, 7], [-2, 8, 6]]) under.piece(ellipse(x, y, s, s * 0.75, 10), '#c49a5c', { round: 3, lift: 1.4, paint: (g) => { g.fillStyle = 'rgba(90,60,30,.5)'; g.beginPath(); g.arc(x + 2, y - 1, 0.8, 0, 7); g.fill(); } });
    return { top: top.finish({ shadowBlur: 3 }), under: under.finish({ shadowBlur: 3 }) };
  },
  draw(g, P, t, e, env) {
    if (env.p > 0.3) { g.save(); g.globalAlpha *= clamp((env.p - 0.3) / 0.5); g.scale(1, 1 / Math.max(0.05, env.p)); g.translate(0, 9); put(g, P.under, 0); g.restore(); }
    g.rotate(fbm(t * 0.7 + e.a, 8) * 3 * DEG); put(g, P.top, env.sh);
  },
};
KINDS.sprout = {
  bake(mk) { return { spr: mk('sprout', [-12, -26, 12, 4], { pad: 5 }).piece(strip(0, 2, 0, -18, 2, 1.6), '#6f9a3e', { round: 1 }).piece([[0, -16], [-10, -22], [-8, -15]], '#7fae4a', { round: 2, lift: 1 }).piece([[0, -18], [9, -26], [8, -18]], '#7fae4a', { round: 2, lift: 1 }).finish({ shadowBlur: 2 }) }; },
  draw(g, P, t, e, env) { const k = spring(t - e.grow, 4, 0.5); if (k <= 0) return; g.scale(k, k); g.rotate(Math.sin(t * 1.5) * 3 * DEG); put(g, P.spr, env.sh); },
};

// ------------------------------------------------------------- fossil ---
KINDS.fossil = {
  bake(mk) {
    return {
      spr: mk('fossil', [-44, -6, 44, 46], { pad: 6 })
        .piece(ellipse(0, 22, 42, 20, 16), '#7d5a3a', { round: 8, rough: 1.4, lift: 0, rim: 0.25, paint: (g) => { g.fillStyle = 'rgba(40,24,14,.35)'; g.fillRect(-44, 26, 88, 2); g.fillRect(-44, 33, 88, 1.4); } })
        .piece([[-20, 30], [-22, 16], [-14, 6], [0, 3], [14, 6], [20, 14], [22, 22], [16, 24], [14, 32], [4, 34], [-6, 34], [-14, 32]], '#e3d6b6', { round: 5, lift: 2, paint: (g) => { g.fillStyle = 'rgba(60,40,25,.8)'; g.beginPath(); g.ellipse(8, 18, 4.2, 3.6, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(17, 26, 1.4, 2.4, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(80,60,40,.6)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(4, 30); g.lineTo(16, 30); g.stroke(); } })
        .finish({ shadowBlur: 3 }),
    };
  },
  draw(g, P, t, e, env) { put(g, P.spr, 0); },
};

// ---------------------------------------------------- cave and stencil ---
function bakeStencil(mk) {
  const sh = mk('stencil', [-34, -40, 34, 40], { pad: 4 });
  const g = sh.g, r = rng(5);
  const hand = new Path2D();
  hand.moveTo(-9, 30); hand.lineTo(-11, 6); hand.lineTo(-20, -6); hand.lineTo(-17, -9); hand.lineTo(-8, -2);
  for (const [x, len] of [[-7, 26], [-2, 31], [3, 30], [8, 24]]) { hand.lineTo(x - 2.2, -2); hand.lineTo(x - 2.4, -len); hand.quadraticCurveTo(x, -len - 4, x + 2.4, -len); hand.lineTo(x + 2.2, -2); }
  hand.lineTo(11, 6); hand.lineTo(10, 30); hand.closePath();
  g.save();
  for (let i = 0; i < 2600; i++) {
    const a = r() * Math.PI * 2, d = Math.pow(r(), 0.6) * 34, x = Math.cos(a) * d * 0.85, y = Math.sin(a) * d;
    g.fillStyle = `rgba(${165 + r() * 40},${48 + r() * 22},${26 + r() * 14},${(0.55 + r() * 0.45) * Math.min(1, 1.25 - d / 36)})`;
    g.beginPath(); g.arc(x, y, 0.5 + r() * 1.3, 0, 7); g.fill();
  }
  g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.fill(hand);
  g.restore();
  return { img: sh.c, x: sh.x0, y: sh.y0, w: sh.w, h: sh.h };
}
KINDS.cave = {
  bake(mk) {
    const r = rng(17), rock = '#7a6352';
    const wall = mk('cave-wall', [-150, -230, 150, 6])
      .piece([[-140, 4], [-146, -80], [-120, -170], [-60, -214], [20, -224], [96, -200], [138, -130], [146, -40], [140, 4]], '#a4876a', { round: 10, rough: 3, seg: 14, paint: (g) => { dab(g, r, 90, [-140, -220, 140, 0], ['rgba(70,50,35,.25)', 'rgba(220,200,170,.2)'], 14, 3); g.fillStyle = 'rgba(150,60,40,.32)'; for (const [x, y] of [[-70, -130], [-50, -150], [60, -150], [80, -120], [-90, -90]]) { g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); } } })
      .finish();
    const arch = mk('cave-arch', [-200, -300, 200, 8])
      .piece([[-196, 6], [-190, -150], [-150, -250], [-60, -296], [60, -292], [160, -240], [196, -140], [198, 6], [150, 6], [140, -130], [96, -206], [20, -232], [-64, -222], [-126, -176], [-152, -84], [-150, 6]], rock, { round: 12, rough: 3.4, seg: 16, paint: (g) => dab(g, r, 120, [-196, -296, 196, 6], ['rgba(40,28,20,.3)', 'rgba(190,170,140,.18)'], 18, 4) })
      .finish();
    const old = []; for (const [x, y, s, rot] of [[-90, -150, 0.7, -0.4], [-56, -170, 0.6, 0.3], [70, -164, 0.65, 0.5]]) old.push({ x, y, s, rot });
    return { wall, arch, stencil: bakeStencil(mk), old };
  },
  draw(g, P, t, e, env) {
    put(g, P.wall, 0);
    g.save(); g.globalAlpha *= 0.32;
    for (const o of P.old) { g.save(); g.translate(o.x, o.y); g.rotate(o.rot); g.scale(o.s, o.s); g.drawImage(P.stencil.img, P.stencil.x, P.stencil.y, P.stencil.w, P.stencil.h); g.restore(); }
    g.restore();
    const k = env.S.stencil ?? 0;
    if (k > 0) { g.save(); g.globalAlpha *= k; g.translate(e.stencilAt[0], e.stencilAt[1]); g.rotate(-0.25); g.scale(1.25, 1.25); g.drawImage(P.stencil.img, P.stencil.x, P.stencil.y, P.stencil.w, P.stencil.h); g.restore(); }
  },
};
KINDS.cavearch = { bake(mk) { return KINDS.cave.bake(mk); }, draw(g, P, t, e, env) { put(g, P.arch, env.sh); } };
KINDS.torchpost = {
  bake(mk) { return { spr: mk('torchpost', [-6, -70, 8, 6], { pad: 5 }).piece(strip(0, 2, 2, -60, 5, 4), '#4a3423', { round: 1.5 }).piece([[-3, -58], [7, -58], [6, -68], [-2, -68]], '#2a1c14', { round: 1, lift: 0.6 }).finish({ shadowBlur: 2 }) }; },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh); },
};
// The painter: kneels, presses a hand to the rock, and blows ochre around it.
KINDS.blower = {
  bake(mk) { return KINDS.person.bake(mk, 'blower'); },
  draw(g, P, t, e, env) {
    const T0 = e.blowAt, k = sramp(t, T0 - 3.6, T0 - 2.4), off = sramp(t, T0 + 0.2, T0 + 1.2);
    const o = { lean: 4 + k * 8 - off * 6, head: -12 + k * 6 + Math.sin(t * 7) * (t > T0 - 2.4 && t < T0 ? 1.2 : 0), back: [-30 - k * 10, -50], front: [-150 * k + off * 60 - 40 * (1 - k), -20 * k + off * -40] };
    drawPerson(g, P, t, e, env, o);
    // a mist of pigment from the lips to the hand
    if (t > T0 - 2.4 && t < T0 + 0.3) {
      const r = rng(Math.floor(t * 20));
      g.save();
      for (let i = 0; i < 26; i++) {
        const u = r(), x = 14 + u * (e.handAt[0] - 14) + (r() - 0.5) * 10 * u, y = -64 + u * (e.handAt[1] + 64) + (r() - 0.5) * 12 * u;
        g.fillStyle = `rgba(170,60,35,${0.6 * (1 - u * 0.5)})`; g.beginPath(); g.arc(x, y, 0.6 + r() * 1.2, 0, 7); g.fill();
      }
      g.restore();
    }
  },
};

// The savanna's tall neighbours, walking the far horizon at sunset.
KINDS.giraffe = {
  bake(mk) {
    const r = rng(91), col = '#c99a5a', pat = '#7e5230', P = {};
    const spots = (box) => (g) => { g.fillStyle = pat; for (let i = 0; i < 26; i++) { const x = box[0] + r() * (box[2] - box[0]), y = box[1] + r() * (box[3] - box[1]); g.beginPath(); g.moveTo(x - 4, y - 3); g.lineTo(x + 3, y - 4); g.lineTo(x + 4, y + 2); g.lineTo(x - 3, y + 4); g.closePath(); g.fill(); } };
    P.leg = mk('gir-leg', [-5, -4, 5, 74], { pad: 4 }).piece([[-4, 0], [4, 0], [3, 66], [4, 72], [-4, 72], [-3, 66]], col, { round: 1.5 }).finish({ shadowBlur: 2 });
    P.body = mk('gir-body', [-48, -206, 92, -60])
      .piece([[-44, -76], [-46, -96], [-30, -110], [10, -116], [30, -122], [44, -112], [40, -80], [20, -72], [-20, -70]], col, { round: 8, rough: 1, paint: spots([-44, -120, 42, -72]) })
      .piece([[24, -112], [40, -120], [64, -184], [72, -196], [60, -200], [50, -186], [30, -128]], col, { round: 5, paint: spots([30, -196, 66, -120]) })
      .piece([[54, -196], [62, -204], [84, -194], [86, -186], [70, -184], [56, -186]], col, { round: 4, lift: 1, paint: (g) => { g.fillStyle = 'rgba(30,20,12,.9)'; g.beginPath(); g.arc(66, -195, 1.6, 0, 7); g.fill(); } })
      .piece(strip(60, -200, 58, -210, 1.6, 1.2), pat, { round: 0.5, lift: 1.2 }).piece(strip(64, -200, 64, -211, 1.6, 1.2), pat, { round: 0.5, lift: 1.2 })
      .piece(strip(-44, -92, -50, -64, 1.6, 1.2), pat, { round: 0.5 })
      .finish({ shadowBlur: 3 });
    return P;
  },
  draw(g, P, t, e, env) {
    const ph = t * (e.pace ?? 1.6) + e.a, bob = Math.abs(Math.sin(ph)) * 2;
    for (const [x, o, back] of [[-34, 0, 1], [28, Math.PI, 1], [-26, Math.PI, 0], [36, 0, 0]]) { g.save(); g.translate(x, -74 - bob); g.rotate(Math.sin(ph + o) * 13 * DEG); if (back) g.globalAlpha = 0.85; put(g, P.leg, env.sh, 1, 2); g.restore(); }
    g.save(); g.translate(0, -bob); g.rotate(Math.sin(ph * 2) * 0.8 * DEG); put(g, P.body, env.sh, 2, 3); g.restore();
  },
};
KINDS.elephant = {
  bake(mk) {
    const col = '#8e8880', dk = '#6e6862', P = {};
    P.leg = mk('ele-leg', [-10, -4, 10, 46], { pad: 4 }).piece([[-9, 0], [9, 0], [10, 40], [11, 44], [-11, 44], [-10, 40]], col, { round: 3 }).finish({ shadowBlur: 2 });
    P.body = mk('ele-body', [-70, -110, 60, -30])
      .piece([[-60, -46], [-66, -70], [-52, -96], [-14, -104], [24, -98], [42, -80], [40, -50], [10, -38], [-40, -38]], col, { round: 12, rough: 1.4, paint: (g) => { g.strokeStyle = 'rgba(60,55,50,.25)'; g.lineWidth = 1; for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(-50 + i * 10, -96); g.quadraticCurveTo(-46 + i * 10, -70, -52 + i * 10, -42); g.stroke(); } } })
      .piece([[30, -96], [52, -96], [62, -80], [60, -60], [46, -54], [30, -62]], col, { round: 8, paint: (g) => { g.fillStyle = 'rgba(30,24,20,.9)'; g.beginPath(); g.arc(52, -80, 1.6, 0, 7); g.fill(); } })
      .piece([[56, -64], [62, -60], [52, -54]], '#efe6d2', { round: 1, lift: 1 })
      .finish({ shadowBlur: 3 });
    P.ear = mk('ele-ear', [-30, -30, 6, 30], { pad: 4 }).piece([[0, -24], [-20, -26], [-28, -6], [-22, 18], [-6, 24], [2, 4]], dk, { round: 6 }).finish({ shadowBlur: 2 });
    P.trunk = mk('ele-trunk', [-8, -4, 16, 56], { pad: 4 }).piece([[-6, 0], [7, 0], [6, 26], [9, 46], [12, 52], [4, 54], [0, 46], [-4, 24]], col, { round: 3, paint: (g) => { g.strokeStyle = 'rgba(60,55,50,.35)'; g.lineWidth = 0.9; for (let y = 6; y < 50; y += 5) { g.beginPath(); g.moveTo(-4, y); g.lineTo(7, y + 1); g.stroke(); } } }).finish({ shadowBlur: 2 });
    return P;
  },
  draw(g, P, t, e, env) {
    const ph = t * (e.pace ?? 1.3) + e.a * 2, bob = Math.abs(Math.sin(ph)) * 1.5;
    for (const [x, o] of [[-46, 0], [22, Math.PI], [-34, Math.PI], [32, 0]]) { g.save(); g.translate(x, -44 - bob); g.rotate(Math.sin(ph + o) * 9 * DEG); put(g, P.leg, env.sh, 1, 2); g.restore(); }
    g.save(); g.translate(0, -bob); put(g, P.body, env.sh, 2, 3);
    g.save(); g.translate(58, -66); g.rotate((Math.sin(ph * 0.7) * 8 - 6) * DEG); put(g, P.trunk, env.sh * 0.5, 1, 2); g.restore();
    g.save(); g.translate(36, -84); g.scale(0.85 + 0.15 * Math.sin(t * 1.3 + e.a), 1); put(g, P.ear, env.sh * 0.5, 1, 2); g.restore();
    g.restore();
  },
};
