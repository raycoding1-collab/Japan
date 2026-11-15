// Cut-outs for "Mended with Gold": Japan, from the Jōmon to the Edo period.
// Same conventions as the rest of the library: design units, a cut-out stands on its origin facing +x,
// a person is about 120 units tall, y up is negative.
import { put, ellipse, strip, KRAFT } from './paper.js';
import { KINDS } from './cutouts.js';
import { LOOKS, drawPerson } from './people.js';
import { rng, fbm, noise, DEG, hash, shade, mix, rgb, clamp, smooth, sramp, spring, lerp } from './util.js';
import { glowRects, paintRects, roofPts } from './kinds_china.js';

export const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
export const dab = (g, r, n, box, cols, len = 6, w = 2) => {
  g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = box[0] + r() * (box[2] - box[0]), y = box[1] + r() * (box[3] - box[1]), a = (r() - 0.5) * 1.2;
    g.strokeStyle = cols[(r() * cols.length) | 0]; g.lineWidth = w * (0.6 + r() * 0.8);
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * len * (0.5 + r()), y + Math.sin(a) * len * 0.4); g.stroke();
  }
};
export const sway = (t, e, amt = 2, sp = 0.6) => fbm(t * sp + e.a * 0.37, 13) * amt * DEG;
// a lumpy cloud of foliage around (cx, cy)
export const blob = (cx, cy, rx, ry, r, n = 11, lump = 0.22) => { const p = []; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, k = 1 - lump + r() * lump * 2; p.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); } return p; };
// a person drawn inside another cut-out (a rower, a smith): looks up the puppet sprites once
export const puppet = (mk, look) => KINDS.person.bake(mk, look);

// =================================================================== the land ===
// Mountains for the far and middle layers. v0 a green volcano, v1 forested hills, v2 Fuji with its snow,
// v3 a rocky islet with pines, v4 a long ridge of blue mountains, v5 Fuji in winter (more snow).
KINDS.jmount = {
  bake(mk, v = 0) {
    const r = rng(5000 + v * 7);
    if (v === 2 || v === 5) {
      const w = 380, h = 250, sh = mk('fuji' + v, [-w - 10, -h - 12, w + 10, 8]);
      const side = (s) => { const p = []; for (let i = 0; i <= 10; i++) { const f = i / 10; p.push([s * (w * (1 - f) + 34 * f), -h * Math.pow(f, 0.62) * (f < 1 ? 1 : 1)]); } return p; };
      const L = side(-1), R = side(1).reverse();
      sh.piece([...L, [-26, -h + 2], [-12, -h - 6], [0, -h + 1], [12, -h - 7], [26, -h + 2], ...R], '#5e7590', { round: 3, rough: 1.2, seg: 22, paint: (g) => { const gr = g.createLinearGradient(0, -h, 0, 0); gr.addColorStop(0, '#6c7f9c'); gr.addColorStop(1, '#3e5470'); g.fillStyle = gr; g.fillRect(-w, -h - 10, w * 2, h + 14); dab(g, r, 40, [-w * 0.6, -h * 0.6, w * 0.6, 0], ['rgba(30,50,70,.25)', 'rgba(140,160,190,.18)'], 26, 3); } });
      // the snow: a jagged hem, longer in the gullies
      const sn = v === 5 ? 0.62 : 0.38, sp = [];
      for (let i = 0; i <= 16; i++) { const f = i / 16, x = lerp(-w * sn * 0.98, w * sn * 0.98, f), edge = -h * (1 - sn) - (i % 2 ? 6 + r() * 16 : -14 - r() * 26); sp.push([x * (1 + (i % 2 ? 0 : 0.04)), edge]); }
      sh.piece([[-w * sn, -h * (1 - sn) + 2], ...sp.slice(1, -1), [w * sn, -h * (1 - sn) + 2], [26, -h + 2], [12, -h - 7], [0, -h + 1], [-12, -h - 6], [-26, -h + 2]].map(([x, y]) => [x * (0.93 + 0.07 * (y / -h)), y]), '#f4f2ee', { round: 2, rough: 1, seg: 14, lift: 1.2, paint: (g) => { g.fillStyle = 'rgba(150,170,200,.35)'; for (let k = -4; k <= 4; k++) { g.beginPath(); g.moveTo(k * 8, -h + 4); g.lineTo(k * 30, -h * (1 - sn) + 6); g.lineTo(k * 30 + 6, -h * (1 - sn) + 6); g.closePath(); g.fill(); } } });
      return { spr: sh.finish({ shadowBlur: 6 }) };
    }
    if (v === 3) {
      const sh = mk('islet', [-120, -190, 120, 8]);
      sh.piece([[-110, 6], [-96, -28], [-70, -60], [-40, -86], [-6, -96], [30, -84], [64, -58], [92, -26], [112, 6]], '#8a8478', { round: 4, rough: 2, seg: 12, paint: (g) => { g.strokeStyle = 'rgba(60,56,50,.4)'; g.lineWidth = 1.4; for (let i = 0; i < 9; i++) { const y = -10 - i * 9; g.beginPath(); g.moveTo(-100 + i * 6, y); g.lineTo(100 - i * 6, y + 4); g.stroke(); } } });
      for (const [x, y, s] of [[-40, -86, 1], [6, -96, 1.2], [44, -78, 0.9]]) {
        sh.piece(strip(x, y + 4, x + 6 * s, y - 50 * s, 6 * s, 3 * s), '#4a3a2c', { round: 1.5, lift: 1 });
        for (const [dx, dy, w] of [[-18, -40, 26], [16, -54, 22], [-4, -66, 20]]) sh.piece(blob(x + dx * s, y + dy * s, w * s, 9 * s, r, 9, 0.3), '#2f4a3a', { round: 4, lift: 1.4, paint: (g) => dab(g, r, 10, [x - 30, y - 80, x + 30, y - 20], ['rgba(90,130,90,.4)'], 5, 1.4) });
      }
      return { spr: sh.finish({ shadowBlur: 5 }) };
    }
    const w = [300, 280, 0, 0, 420][v], h = [190, 120, 0, 0, 150][v];
    const sh = mk('jmount' + v, [-w - 10, -h - 20, w + 10, 8]);
    const base = ['#5c7656', '#526e4e', '', '', '#5e6f88'][v];
    // a ridge line from a height function, closed along the ground
    const ridge = (fn, x0, x1, n = 22) => { const p = [[x0, 6]]; for (let i = 1; i < n; i++) { const x = lerp(x0, x1, i / n); p.push([x, -fn(x) - r() * 3]); } p.push([x1, 6]); return p; };
    // forest on the slopes: rows of small rounded crowns, lighter on top, haze lower down
    const forest = (col, top) => (g) => {
      const gr = g.createLinearGradient(0, -top, 0, 6); gr.addColorStop(0, rgb(shade(col, 0.14))); gr.addColorStop(1, rgb(shade(col, -0.12))); g.fillStyle = gr; g.fillRect(-w - 10, -top - 10, w * 2 + 20, top + 20);
      for (let i = 0; i < 150; i++) { const x = -w + r() * 2 * w, y = -r() * top * 0.95, s2 = 3 + r() * 4; g.fillStyle = r() < 0.5 ? rgb(shade(col, -0.22), 0.45) : rgb(shade(col, 0.2), 0.35); g.beginPath(); g.moveTo(x - s2, y + s2 * 0.6); g.quadraticCurveTo(x, y - s2 * 1.6, x + s2, y + s2 * 0.6); g.fill(); }
    };
    if (v === 0) {
      const cone = (cx, H, W2) => (x) => { const d = Math.abs(x - cx) / W2; return d >= 1 ? 0 : Math.min(H * Math.pow(1 - d, 1.25), H * 0.9) + (d < 0.12 ? -6 * (1 - d / 0.12) : 0); };
      sh.piece(ridge(cone(-90, h * 0.72, w * 0.62), -w * 0.75, w * 0.4), shade(base, -0.12), { round: 10, rough: 1.4, seg: 18, paint: forest(shade(base, -0.12), h) });
      sh.piece(ridge(cone(30, h, w * 0.92), -w * 0.62, w * 0.98), base, { round: 12, rough: 1.4, seg: 18, lift: 1.4, paint: forest(base, h) });
      sh.piece(ridge((x) => 26 + 18 * Math.sin(x * 0.02 + 1) + 10 * Math.sin(x * 0.05), -w, w), shade(base, 0.08), { round: 12, rough: 1.6, seg: 16, lift: 1.4, paint: forest(shade(base, 0.08), 60) });
    } else if (v === 1) {
      sh.piece(ridge((x) => h * (0.62 + 0.38 * Math.cos(x / w * 2.6 + 0.8)) * (1 - (x / w) ** 6), -w, w, 26), shade(base, -0.1), { round: 14, rough: 1.4, seg: 16, paint: forest(shade(base, -0.1), h) });
      sh.piece(ridge((x) => h * 0.55 * (0.6 + 0.4 * Math.sin(x / w * 4.2 + 2)) * (1 - (x / w) ** 4), -w, w, 26), shade(base, 0.06), { round: 14, rough: 1.4, seg: 16, lift: 1.4, paint: forest(shade(base, 0.06), h * 0.7) });
    } else {
      sh.piece(ridge((x) => h * (0.45 + 0.55 * Math.abs(Math.sin(x / w * 3.4 + 1))) * (1 - (x / w) ** 4), -w, w, 30), shade(base, -0.08), { round: 8, rough: 1.4, seg: 16, paint: forest(shade(base, -0.08), h) });
      sh.piece(ridge((x) => h * 0.45 * (0.5 + 0.5 * Math.abs(Math.sin(x / w * 5 + 0.3))) * (1 - (x / w) ** 4), -w, w, 30), shade(base, 0.08), { round: 10, rough: 1.4, seg: 16, lift: 1.4, paint: forest(shade(base, 0.08), h * 0.6) });
    }
    return { spr: sh.finish({ shadowBlur: 6 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh * 0.5, 3, 4); },
};

// Japanese cedar (sugi): a tall straight trunk and a narrow spire of dark foliage in tiers.
KINDS.sugi = {
  bake(mk, v = 0) {
    const r = rng(5200 + v), h = 300 + (v % 3) * 40, sh = mk('sugi' + v, [-60, -h - 20, 60, 6]);
    sh.piece(strip(0, 4, 0, -h * 0.9, 13, 5), '#6a4a36', { round: 1.5, paint: (g) => { g.strokeStyle = 'rgba(40,24,16,.35)'; g.lineWidth = 1; for (let y = 0; y > -h; y -= 7) { g.beginPath(); g.moveTo(-6, y); g.lineTo(6, y - 3); g.stroke(); } } });
    for (let i = 0; i < 9; i++) { const f = i / 8, y = -h * 0.28 - f * h * 0.66, w = (1 - f * 0.82) * 48 + 6; sh.piece([[-w, y + 18], [-w * 0.5, y - 10], [0, y - 26], [w * 0.5, y - 10], [w, y + 18], [w * 0.3, y + 10], [-w * 0.3, y + 12]], i % 2 ? '#2e4a36' : '#34523c', { round: 3, rough: 1.4, seg: 8, lift: 1.4, paint: (g) => dab(g, r, 10, [-w, y - 20, w, y + 14], ['rgba(110,150,100,.35)', 'rgba(16,30,20,.4)'], 6, 1.6) }); }
    return { spr: sh.finish({ shadowBlur: 5 }) };
  },
  draw(g, P, t, e, env) { g.rotate(sway(t, e, 0.6, 0.4)); put(g, P.spr, env.sh, 3, 4); },
};

// A cherry tree (sakura): a dark crooked trunk under clouds of pale pink. e.bloom(t) opens it (default open).
KINDS.sakura = {
  bake(mk, v = 0) {
    const r = rng(5300 + v * 11), s = [1, 1.2, 0.85][v % 3];
    const trunk = mk('sakura-t' + v, [-120 * s, -210 * s, 120 * s, 6]);
    trunk.piece([[-10, 4], [-8, -50], [-30, -100], [-70, -150], [-64, -156], [-24, -116], [-4, -96], [2, -150], [8, -150], [6, -92], [36, -130], [80, -160], [84, -152], [40, -112], [10, -60], [12, 4]].map(([x, y]) => [x * s, y * s]), '#3c2a24', { round: 2.6, paint: (g) => dab(g, r, 30, [-20, -150 * s, 20, 0], ['rgba(20,10,8,.4)', 'rgba(120,90,80,.3)'], 9, 1.6) });
    const cols = ['#f6d0d8', '#f2c0cc', '#fadde2', '#eeb4c2'];
    const can = (i, cx, cy, rx, ry) => {
      const c = cols[i % 4], sh = mk('sakura-c' + v + i, [-rx - 10, -ry - 10, rx + 10, ry + 10], { pad: 6 });
      sh.piece(blob(0, 0, rx, ry, r, 14, 0.24), c, { round: 9, rough: 2.4, seg: 10, paint: (g) => { for (let k = 0; k < 90; k++) { const a = r() * 7, d = Math.sqrt(r()), x = Math.cos(a) * rx * d, y = Math.sin(a) * ry * d; g.fillStyle = r() < 0.5 ? 'rgba(255,248,250,.75)' : 'rgba(214,120,150,.42)'; g.beginPath(); g.arc(x, y, 1.4 + r() * 2, 0, 7); g.fill(); } } });
      return { spr: sh.finish({ shadowBlur: 4 }), cx: cx * s, cy: cy * s, ph: r() * 9 };
    };
    return { trunk: trunk.finish({ shadowBlur: 5 }), can: [can(0, -70, -160, 56, 34), can(1, 76, -164, 58, 32), can(2, 0, -170, 70, 40), can(3, -30, -206, 52, 30), can(4, 36, -204, 50, 28)].map((c) => ({ ...c, cx: c.cx, cy: c.cy })) };
  },
  draw(g, P, t, e, env) {
    const b = e.bloom ? e.bloom(t) : 1, w = sway(t, e, 0.8, 0.5);
    g.rotate(w * 0.5); put(g, P.trunk, env.sh, 3, 4);
    if (b < 0.01) return;
    for (const c of P.can) { g.save(); g.translate(c.cx, c.cy); g.rotate(w + fbm(t * 0.5 + c.ph, 5) * DEG); const k = clamp(b * 1.15 - c.ph * 0.012); g.scale(k, k); put(g, c.spr, env.sh, 3, 4); g.restore(); }
  },
};

// A Japanese maple (momiji): fine tiers of leaves. v0 autumn red, v1 orange, v2 summer green.
KINDS.momiji = {
  bake(mk, v = 0) {
    const r = rng(5400 + v * 13), cols = [['#c2362a', '#d8502e', '#a82a26'], ['#d87a2a', '#e8a038', '#c45a24'], ['#5e8a3e', '#76a04a', '#4a7434']][v % 3];
    const sh = mk('momiji' + v, [-120, -200, 120, 6]);
    sh.piece([[-6, 4], [-5, -60], [-40, -110], [-36, -116], [-2, -82], [4, -140], [10, -140], [7, -80], [44, -120], [48, -114], [10, -56], [8, 4]], '#4a3428', { round: 2, paint: (g) => dab(g, r, 16, [-10, -130, 10, 0], ['rgba(20,10,8,.35)'], 7, 1.4) });
    for (const [x, y, w, hh, i] of [[-60, -116, 58, 18, 0], [56, -122, 60, 18, 1], [-6, -150, 70, 22, 2], [-46, -168, 46, 16, 1], [40, -174, 44, 16, 0], [0, -190, 40, 14, 2]]) {
      sh.piece(blob(x, y, w, hh, r, 13, 0.3), cols[i], { round: 5, rough: 2.4, seg: 7, lift: 1.4, paint: (g) => { for (let k = 0; k < 40; k++) { const px = x + (r() - 0.5) * w * 1.8, py = y + (r() - 0.5) * hh * 1.6; g.fillStyle = r() < 0.5 ? rgb(shade(cols[i], 0.25), 0.6) : rgb(shade(cols[i], -0.3), 0.5); g.save(); g.translate(px, py); g.rotate(r() * 6); g.beginPath(); for (let j = 0; j < 5; j++) { const a = (j / 5) * Math.PI * 2; g.lineTo(Math.cos(a) * 3.4, Math.sin(a) * 3.4); g.lineTo(Math.cos(a + 0.6) * 1.2, Math.sin(a + 0.6) * 1.2); } g.fill(); g.restore(); } } });
    }
    return { spr: sh.finish({ shadowBlur: 4 }) };
  },
  draw(g, P, t, e, env) { g.rotate(sway(t, e, 1, 0.5)); put(g, P.spr, env.sh, 3, 4); },
};

// A chestnut tree (kuri), broad, with pale catkins and spiny burrs. The Jōmon lived on its nuts.
KINDS.kuri = {
  bake(mk, v = 0) {
    const r = rng(5500 + v * 3), sh = mk('kuri' + v, [-130, -230, 130, 6]);
    sh.piece([[-12, 4], [-10, -70], [-44, -124], [-38, -130], [-4, -100], [0, -150], [8, -150], [8, -96], [46, -132], [52, -126], [14, -70], [14, 4]], '#5a4434', { round: 2.4, paint: (g) => dab(g, r, 26, [-14, -140, 14, 0], ['rgba(30,18,10,.35)', 'rgba(150,120,90,.25)'], 8, 1.5) });
    for (const [x, y, w, hh, c] of [[-70, -140, 62, 36, '#5c7a3c'], [70, -146, 64, 38, '#66843f'], [0, -172, 86, 48, '#58763a'], [-34, -206, 56, 30, '#6a8a44'], [40, -204, 52, 30, '#5f7e3e']]) {
      sh.piece(blob(x, y, w, hh, r, 13, 0.24), c, { round: 8, rough: 2.2, seg: 9, lift: 1.6, paint: (g) => { dab(g, r, 40, [x - w, y - hh, x + w, y + hh], [rgb(shade(c, 0.2), 0.45), rgb(shade(c, -0.25), 0.45)], 8, 2.4); for (let k = 0; k < 8; k++) { const px = x + (r() - 0.5) * w * 1.4, py = y + (r() - 0.3) * hh; g.fillStyle = '#a8a040'; g.beginPath(); g.arc(px, py, 3.2, 0, 7); g.fill(); g.strokeStyle = 'rgba(90,90,30,.8)'; g.lineWidth = 0.6; for (let j = 0; j < 8; j++) { const a = j * 0.8; g.beginPath(); g.moveTo(px + Math.cos(a) * 3, py + Math.sin(a) * 3); g.lineTo(px + Math.cos(a) * 5, py + Math.sin(a) * 5); g.stroke(); } } } });
    }
    return { spr: sh.finish({ shadowBlur: 5 }) };
  },
  draw(g, P, t, e, env) { g.rotate(sway(t, e, 0.8, 0.5)); put(g, P.spr, env.sh, 3, 4); },
};

// A sika deer, spotted, with a white rump. v0 a stag with antlers, v1 a doe. e.graze(t) lowers the head;
// e.move(t) carries it, and the legs gallop while it moves.
KINDS.deer = {
  bake(mk, v = 0) {
    const c = '#9a6a42', cd = shade(c, -0.2), r = rng(5600 + v), P = {};
    P.body = mk('deer-b' + v, [-52, -86, 40, -40]).piece([[-44, -60], [-40, -78], [-16, -84], [16, -84], [32, -78], [36, -62], [28, -50], [-8, -48], [-38, -50]], c, { round: 9, paint: (g) => { g.fillStyle = 'rgba(250,240,220,.75)'; for (let i = 0; i < 18; i++) { g.beginPath(); g.arc(-30 + r() * 56, -76 + r() * 14, 1.6, 0, 7); g.fill(); } g.fillStyle = 'rgba(70,40,24,.35)'; g.fillRect(-36, -84, 66, 3); } }).piece([[-48, -74], [-42, -82], [-38, -70], [-44, -62]], '#f4ece0', { round: 3, lift: 1 }).finish({ shadowBlur: 3 });
    const head = mk('deer-h' + v, [-10, -80, 40, 10]);
    head.piece([[-4, 6], [4, 6], [10, -22], [16, -40], [8, -44], [0, -26], [-6, -4]], c, { round: 4 });
    head.piece([[6, -38], [14, -50], [24, -50], [34, -40], [32, -34], [20, -34], [12, -30]], c, { round: 4, lift: 1, paint: (g) => { g.fillStyle = '#1a1210'; g.beginPath(); g.arc(19, -45, 1.6, 0, 7); g.fill(); g.beginPath(); g.arc(33.4, -38, 1.6, 0, 7); g.fill(); } });
    head.piece([[10, -48], [4, -58], [12, -52]], cd, { round: 1, lift: 1 });
    if (v === 0) for (const dx of [0, 4]) head.piece([[12 + dx, -50], [8 + dx, -66], [0 + dx, -74], [4 + dx, -75], [10 + dx, -68], [14 + dx, -76], [17 + dx, -75], [14 + dx, -64], [15 + dx, -52]], '#d8c8a8', { round: 1, lift: 1.2, thick: 0.6 });
    P.head = head.finish({ shadowBlur: 3 });
    P.leg = mk('deer-l' + v, [-4, -4, 6, 52], { pad: 4 }).piece([[-3.6, -2], [3.6, -2], [3, 24], [2.2, 44], [3.4, 48], [-2.6, 48], [-2, 24]], c, { round: 2 }).finish({ shadowBlur: 2 });
    P.legB = mk('deer-lb' + v, [-4, -4, 6, 52], { pad: 4 }).piece([[-3.6, -2], [3.6, -2], [3, 24], [2.2, 44], [3.4, 48], [-2.6, 48], [-2, 24]], cd, { round: 2 }).finish({ shadowBlur: 2 });
    return P;
  },
  draw(g, P, t, e, env) {
    const moving = e.move && Math.abs((e.move(t + 0.05) - e.move(t)) * 20) > 0.05, ph = t * 11 + e.a, gz = moving ? 0 : (e.graze ? e.graze(t) : 0.5 + 0.5 * Math.sin(t * 0.35 + e.a));
    const lift = moving ? Math.abs(Math.sin(ph)) * 6 : 0;
    g.save(); g.translate(0, -lift);
    for (const [x, o, spr] of [[-34, 0, P.legB], [22, 1.6, P.legB], [-28, 3.2, P.leg], [28, 4.8, P.leg]]) { g.save(); g.translate(x, -52); g.rotate(moving ? Math.sin(ph + o) * 34 * DEG : 0); put(g, spr, env.sh, 2, 2); g.restore(); }
    put(g, P.body, env.sh, 3, 3);
    g.save(); g.translate(24, -74); g.rotate((gz * 78 - (moving ? 8 : 0) + fbm(t * 0.6 + e.a, 4) * 4) * DEG); put(g, P.head, env.sh, 2, 3); g.restore();
    g.restore();
  },
};

// ================================================================== the Jōmon ===
// A pit dwelling: a cone of thatch down to the ground over a sunken floor, with a smoke hole at the top
// and a small hooded door. Its door glows when e.winOn(t) > 0.
KINDS.pitdwelling = {
  bake(mk, v = 0) {
    const r = rng(5700 + v), w = [72, 86, 60][v % 3], h = [112, 128, 98][v % 3], sh = mk('pitdw' + v, [-w - 14, -h - 30, w + 14, 8]);
    const pts = [[-w, 5]];
    for (let i = 1; i <= 5; i++) { const f = i / 6; pts.push([-w + f * (w - 12), 4 - h * (1 - Math.pow(1 - f, 1.7)) + (r() - 0.5) * 4]); }
    pts.push([-12, -h], [12, -h]);
    for (let i = 5; i >= 1; i--) { const f = i / 6; pts.push([w - f * (w - 12), 4 - h * (1 - Math.pow(1 - f, 1.7)) + (r() - 0.5) * 4]); }
    pts.push([w, 5]);
    for (let x = w - 8; x > -w + 4; x -= 9) pts.push([x, 5 + (r() < 0.5 ? 3 : -1)]);
    sh.piece(pts, '#a48a5c', { round: 2, rough: 1.2, seg: 10, paint: (g) => {
      g.lineCap = 'round';
      for (let i = 0; i < 160; i++) { const f = r(), x0 = (f - 0.5) * 22, x1 = (f - 0.5) * 2 * w * 1.05, y1 = 4 - r() * 10; g.strokeStyle = r() < 0.5 ? 'rgba(90,66,36,.28)' : 'rgba(230,206,150,.22)'; g.lineWidth = 0.8 + r(); g.beginPath(); g.moveTo(x0, -h + 4); g.quadraticCurveTo((x0 + x1) / 2 - Math.sign(x1) * 8, (-h + y1) / 2, x1, y1); g.stroke(); }
      g.strokeStyle = 'rgba(70,50,30,.5)'; g.lineWidth = 2; for (const k of [0.36, 0.66]) { g.beginPath(); g.moveTo(-w * (1 - k * 0.9), -h * k + 2); g.quadraticCurveTo(0, -h * k + 8, w * (1 - k * 0.9), -h * k + 2); g.stroke(); }
    } });
    sh.piece([[-15, -h + 4], [0, -h - 26], [15, -h + 4]], '#7a6040', { round: 1.5, lift: 1.4, paint: (g) => { g.fillStyle = 'rgba(30,18,10,.85)'; g.beginPath(); g.moveTo(-6, -h); g.lineTo(0, -h - 14); g.lineTo(6, -h); g.fill(); } });
    sh.piece([[-20, 6], [-17, -36], [0, -52], [17, -36], [20, 6]], '#b29a6a', { round: 3, lift: 1.6, paint: (g) => { for (let i = 0; i < 30; i++) { const x = -18 + r() * 36; g.strokeStyle = 'rgba(90,66,36,.3)'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(x * 0.3, -48); g.lineTo(x, 4); g.stroke(); } paintRects([[-8, -26, 16, 32]], 'rgba(24,14,8,.94)')(g); } });
    return { spr: sh.finish({ shadowBlur: 6 }), windows: [[-8, -26, 16, 30]] };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 4, 5); },
  glow: glowRects,
};

// Jōmon pots. v0: the oldest kind, round-bottomed, rough; v1: a flame pot from about 5,000 years ago,
// its rim rising in four great flames; v2: a deep pot with a wavy rim, rolled all over with cord marks.
// e.hot(t) makes it glow as it comes out of the fire.
const cordMarks = (g, r, x0, y0, x1, y1) => { g.strokeStyle = 'rgba(60,34,20,.42)'; g.lineWidth = 1; for (let y = y0; y < y1; y += 4.2) { const d = ((y / 4.2) | 0) % 2 ? 1 : -1; for (let x = x0; x < x1; x += 3) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + 2 * d, y + 3.4); g.stroke(); } } };
KINDS.jpot = {
  bake(mk, v = 0) {
    const r = rng(5800 + v), c = ['#a8724a', '#9a6440', '#b07a50'][v % 3];
    if (v === 1) {
      const sh = mk('jpot1', [-40, -112, 40, 6]);
      sh.piece([[-14, 2], [14, 2], [18, -20], [24, -48], [26, -60], [-26, -60], [-24, -48], [-18, -20]], c, { round: 4, paint: (g) => {
        g.strokeStyle = 'rgba(60,32,18,.55)'; g.lineWidth = 2.2;
        for (const y of [-14, -30, -46]) { g.beginPath(); g.moveTo(-22, y); g.bezierCurveTo(-10, y - 8, 10, y + 8, 22, y); g.stroke(); }
        for (const [x, y] of [[-10, -38], [10, -22], [-6, -8], [12, -50]]) { g.beginPath(); for (let a = 0; a < 12; a += 0.4) g.lineTo(x + Math.cos(a) * a * 0.55, y + Math.sin(a) * a * 0.45); g.stroke(); }
        g.fillStyle = 'rgba(255,220,170,.18)'; g.fillRect(-26, -60, 52, 4);
      } });
      // four flames on the rim, curling, pierced
      for (const [x, fl] of [[-20, -1], [-6, 1], [8, -1], [20, 1]]) sh.piece([[x - 8, -58], [x - 10, -72], [x - 4 * fl - 6, -86], [x + 2 * fl, -100 - r() * 6], [x + 8 * fl, -92], [x + 4, -80], [x + 9, -70], [x + 8, -58]], shade(c, 0.05), { round: 3, lift: 1.4, paint: (g) => { g.fillStyle = 'rgba(30,16,8,.88)'; g.beginPath(); g.ellipse(x, -76, 2.6, 4, 0.3 * fl, 0, 7); g.fill(); g.strokeStyle = 'rgba(60,32,18,.5)'; g.lineWidth = 1.6; g.beginPath(); g.arc(x + 1, -88, 4.5, 0, 5); g.stroke(); } });
      return { spr: sh.finish({ shadowBlur: 4 }), h: 100 };
    }
    if (v === 0) {
      const sh = mk('jpot0', [-26, -60, 26, 6]);
      sh.piece([[0, 4], [-10, -2], [-18, -16], [-20, -34], [-19, -48], [-21, -54], [21, -54], [19, -48], [20, -34], [18, -16], [10, -2]], c, { round: 4, paint: (g) => { g.strokeStyle = 'rgba(60,34,20,.35)'; g.lineWidth = 1.1; for (let y = -50; y < -4; y += 5) { g.beginPath(); g.moveTo(-20, y); g.lineTo(20, y + (r() - 0.5) * 2); g.stroke(); } g.fillStyle = 'rgba(40,24,14,.25)'; g.fillRect(-21, -54, 42, 3); } });
      return { spr: sh.finish({ shadowBlur: 3 }), h: 54 };
    }
    const sh = mk('jpot2', [-30, -78, 30, 6]);
    const rim = []; for (let i = 0; i <= 8; i++) rim.push([-24 + i * 6, -66 - (i % 2 ? 0 : 8)]);
    sh.piece([[-12, 4], [12, 4], [18, -14], [22, -40], [24, -60], ...rim.reverse(), [-24, -60], [-22, -40], [-18, -14]], c, { round: 4, paint: (g) => { cordMarks(g, r, -24, -60, 24, 2); g.strokeStyle = 'rgba(60,34,20,.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-23, -52); g.lineTo(23, -52); g.stroke(); } });
    return { spr: sh.finish({ shadowBlur: 3 }), h: 70 };
  },
  draw(g, P, t, e, env) { if (e.carry) { const k = e.carry(t); g.translate(k[0], k[1]); g.rotate((k[2] || 0) * DEG); } put(g, P.spr, env.sh, 2, 3); },
  glow(g, P, t, e, env, p) {
    const hot = e.hot ? e.hot(t) : 0; if (hot < 0.01 || p < 0.5) return;
    if (e.carry) { const k = e.carry(t); g.translate(k[0], k[1]); g.rotate((k[2] || 0) * DEG); }
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = hot * 0.9; put(g, P.spr, 0); put(g, P.spr, 0); g.globalAlpha = 1;
    const gr = g.createRadialGradient(0, -P.h * 0.45, 0, 0, -P.h * 0.45, P.h * 1.1); gr.addColorStop(0, `rgba(255,120,50,${0.5 * hot})`); gr.addColorStop(1, 'rgba(255,90,30,0)');
    g.fillStyle = gr; g.fillRect(-P.h * 1.2, -P.h * 1.6, P.h * 2.4, P.h * 2.2); g.globalCompositeOperation = 'source-over';
  },
};

// A dogū: a clay figure with great "snow-goggle" eyes, a crown, and a body swirled with patterns.
// e.eyes(t) makes the eyes catch the light.
KINDS.dogu = {
  bake(mk) {
    const r = rng(5900), c = '#6e5a48', cd = shade(c, -0.18), sh = mk('dogu', [-80, -170, 80, 6]);
    const swirl = (g, x, y, s) => { g.beginPath(); for (let a = 0; a < 11; a += 0.35) g.lineTo(x + Math.cos(a) * a * s, y + Math.sin(a) * a * s * 0.8); g.stroke(); };
    // legs, stout and short
    for (const s of [-1, 1]) sh.piece([[s * 6, 4], [s * 34, 4], [s * 36, -10], [s * 30, -34], [s * 26, -50], [s * 8, -50], [s * 4, -26]], s < 0 ? cd : c, { round: 6, paint: (g) => { g.strokeStyle = 'rgba(40,26,16,.5)'; g.lineWidth = 1.4; swirl(g, s * 20, -26, 1.1); } });
    // the body: wide hips, a narrow waist, broad shoulders, all incised
    sh.piece([[-34, -44], [34, -44], [26, -66], [30, -84], [44, -102], [40, -112], [-40, -112], [-44, -102], [-30, -84], [-26, -66]], c, { round: 6, lift: 1.4, paint: (g) => {
      g.strokeStyle = 'rgba(40,26,16,.55)'; g.lineWidth = 1.5;
      for (const [x, y] of [[-16, -60], [16, -60], [-20, -94], [20, -94], [0, -78]]) swirl(g, x, y, 1.05);
      g.fillStyle = 'rgba(40,26,16,.4)'; for (let i = 0; i < 60; i++) { g.beginPath(); g.arc(-30 + r() * 60, -108 + r() * 60, 0.9, 0, 7); g.fill(); }
      g.fillStyle = 'rgba(170,60,40,.25)'; g.fillRect(-34, -70, 68, 4);
    } });
    // stubby arms
    for (const s of [-1, 1]) sh.piece([[s * 38, -108], [s * 58, -100], [s * 62, -84], [s * 54, -80], [s * 44, -92], [s * 36, -94]], s < 0 ? cd : c, { round: 5, lift: 1.2 });
    // the head: wide, with a crown and two huge goggle eyes
    sh.piece([[-30, -112], [30, -112], [42, -126], [44, -146], [30, -156], [-30, -156], [-44, -146], [-42, -126]], c, { round: 8, lift: 1.6, paint: (g) => {
      for (const s of [-1, 1]) { g.fillStyle = '#5a4838'; g.beginPath(); g.ellipse(s * 19, -134, 15, 11, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(30,20,12,.8)'; g.lineWidth = 2; g.beginPath(); g.moveTo(s * 19 - 12, -134); g.lineTo(s * 19 + 12, -134); g.stroke(); g.strokeStyle = 'rgba(230,200,160,.3)'; g.lineWidth = 1; g.beginPath(); g.ellipse(s * 19, -134, 15, 11, 0, 3.6, 5.8); g.stroke(); }
      g.fillStyle = 'rgba(40,26,16,.7)'; g.beginPath(); g.ellipse(0, -120, 5, 2.4, 0, 0, 7); g.fill();
    } });
    sh.piece([[-30, -154], [-36, -166], [-20, -160], [-10, -170], [0, -162], [10, -170], [20, -160], [36, -166], [30, -154]], cd, { round: 3, lift: 1.4, paint: (g) => { g.strokeStyle = 'rgba(30,20,12,.5)'; g.lineWidth = 1.2; swirl(g, 0, -162, 0.6); } });
    return { spr: sh.finish({ shadowBlur: 5 }) };
  },
  draw(g, P, t, e, env) { g.rotate(Math.sin(t * 0.7 + e.a) * 0.6 * DEG); put(g, P.spr, env.sh, 3, 4); },
  glow(g, P, t, e, env, p) {
    const k = e.eyes ? e.eyes(t) : 0; if (k < 0.01 || p < 0.6) return;
    g.rotate(Math.sin(t * 0.7 + e.a) * 0.6 * DEG); g.globalCompositeOperation = 'lighter';
    for (const s of [-1, 1]) { const gr = g.createRadialGradient(s * 19, -134, 0, s * 19, -134, 24); gr.addColorStop(0, `rgba(255,230,170,${0.55 * k})`); gr.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = gr; g.fillRect(s * 19 - 24, -158, 48, 48); g.fillStyle = `rgba(255,246,220,${0.9 * k})`; g.fillRect(s * 19 - 11, -135, 22, 1.8); }
    g.globalCompositeOperation = 'source-over';
  },
};

// A dugout canoe, hollowed from one log, with two paddlers. It rides the swell; e.move carries it.
KINDS.maruki = {
  bake(mk, v = 0) {
    const sh = mk('maruki' + v, [-110, -30, 110, 8]);
    sh.piece([[-104, -18], [-96, -4], [-70, 4], [70, 4], [98, -6], [108, -20], [92, -16], [-90, -14]], '#4e3626', { round: 5, paint: (g) => { g.strokeStyle = 'rgba(200,160,110,.25)'; g.lineWidth = 1; for (let y = -10; y < 2; y += 3) { g.beginPath(); g.moveTo(-90, y); g.lineTo(90, y); g.stroke(); } } });
    return { spr: sh.finish({ shadowBlur: 4 }), a: puppet(mk, 'jomonPaddler'), b: puppet(mk, 'jomonPaddler2') };
  },
  draw(g, P, t, e, env) {
    g.translate(0, Math.sin(t * 1.4 + e.a) * 2.4); g.rotate(Math.sin(t * 1.1 + e.a * 2) * 2.2 * DEG);
    const st = e.stroke ? e.stroke(t) : 1;
    for (const [x, pp, o] of [[-42, P.b, 0], [30, P.a, 1.4]]) { const s = Math.sin(t * 2.6 + o) * st; g.save(); g.translate(x, -10); drawPerson(g, pp, t, e, env, { lean: 12 + s * 8, head: 6, back: [-60 + s * 30, -30], front: [-90 + s * 40, -20] }); g.restore(); }
    put(g, P.spr, env.sh, 3, 3);
  },
};

// A mound of shells, thrown out over generations: the Jōmon's middens.
KINDS.shellmound = {
  bake(mk, v = 0) {
    const r = rng(6000 + v), sh = mk('shells' + v, [-70, -40, 70, 6]);
    sh.piece([[-66, 4], [-44, -20], [-10, -32], [26, -28], [54, -14], [68, 4]], '#9a8c74', { round: 6, rough: 1.4, paint: (g) => { for (let i = 0; i < 120; i++) { const x = -60 + r() * 120, y = -28 + r() * 30; if (Math.abs(x) > 64 - (y + 30)) continue; g.fillStyle = ['#efe6d6', '#e0cfc0', '#cdbba8', '#f4e2dc'][(r() * 4) | 0]; g.beginPath(); g.ellipse(x, y, 2 + r() * 2.4, 1.4 + r() * 1.4, r() * 3, 0, 7); g.fill(); } } });
    return { spr: sh.finish({ shadowBlur: 3 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 2, 3); },
};

// The six-pillar tower at Sannai-Maruyama: six great chestnut trunks (three seen here), lashed with
// platforms. What it was for is not known; this is how it has been rebuilt.
KINDS.sixpillar = {
  bake(mk) {
    const r = rng(6100), sh = mk('sixpillar', [-130, -420, 130, 6]), wood = '#7a5a3e';
    for (const [x, c] of [[-84, shade(wood, -0.18)], [84, shade(wood, -0.18)], [0, shade(wood, -0.1)]]) sh.piece([[x - 10, 4], [x + 10, 4], [x + 9, -404], [x - 9, -404]], c, { round: 2, rough: 0.8 });
    for (const y of [-130, -250, -370]) sh.piece(rect(-112, y, 112, y - 12), '#8a6a48', { round: 1.5, lift: 1.4, paint: (g) => { g.strokeStyle = 'rgba(40,24,14,.4)'; g.lineWidth = 1; for (let x = -110; x < 112; x += 9) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 12); g.stroke(); } } });
    for (const [x, c] of [[-100, wood], [100, wood], [-30, shade(wood, 0.05)]]) sh.piece([[x - 14, 4], [x + 14, 4], [x + 13, -400], [x - 13, -400]], c, { round: 2.4, rough: 1, lift: 1.8, paint: (g) => { dab(g, r, 30, [x - 12, -400, x + 12, 0], ['rgba(40,24,14,.35)', 'rgba(170,130,90,.25)'], 12, 1.6); g.strokeStyle = 'rgba(200,170,120,.6)'; g.lineWidth = 2.4; for (const y of [-118, -238, -358]) { g.beginPath(); g.moveTo(x - 14, y); g.lineTo(x + 14, y + 4); g.moveTo(x - 14, y + 5); g.lineTo(x + 14, y + 9); g.stroke(); } } });
    sh.piece(strip(52, 4, 70, -128, 3, 3), '#6a4a30', { round: 1, lift: 1 });
    sh.piece(strip(62, 4, 80, -128, 3, 3), '#6a4a30', { round: 1, lift: 1, paint: (g) => { g.strokeStyle = '#6a4a30'; g.lineWidth = 2.4; for (let k = 1; k < 9; k++) { g.beginPath(); g.moveTo(52 + k * 2, -k * 14); g.lineTo(64 + k * 2, -k * 14); g.stroke(); } } });
    return { spr: sh.finish({ shadowBlur: 7 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 4, 5); },
};
