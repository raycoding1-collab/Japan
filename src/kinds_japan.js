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

// =================================================================== the Yayoi ===
// A plank-built boat with a high prow and stern, a mat sail, rowers and bales of rice.
// v0 a Yayoi boat; v1 a larger ship from the mainland with monks aboard (see the chapters' looks).
KINDS.yboat = {
  bake(mk, v = 0) {
    const r = rng(6200 + v), L = v === 1 ? 190 : 150, sh = mk('yboat' + v, [-L - 30, -230, L + 30, 10]);
    sh.piece([[-L - 14, -66], [-L + 4, -56], [-L + 10, -30], [-L + 30, 2], [L - 30, 4], [L - 10, -30], [L + 2, -60], [L + 20, -74], [L + 16, -64], [L - 2, -46], [L - 22, -24], [-L + 26, -22], [-L + 6, -44]], v === 1 ? '#5a3a28' : '#6e4a30', { round: 4, paint: (g) => { g.strokeStyle = 'rgba(220,180,130,.3)'; g.lineWidth = 1.2; for (let y = -18; y < 2; y += 5) { g.beginPath(); g.moveTo(-L + 30, y); g.lineTo(L - 30, y); g.stroke(); } g.fillStyle = 'rgba(30,18,10,.5)'; for (let x = -L + 40; x < L - 30; x += 22) g.fillRect(x, -22, 2, 24); } });
    sh.piece(strip(-10, -24, -6, -210, 4, 3), '#4a3423', { round: 1, lift: 1 });
    sh.piece([[-58, -200], [44, -204], [40, -96], [-54, -92]], v === 1 ? '#c8b088' : '#b89a68', { round: 3, lift: 2, paint: (g) => { g.strokeStyle = 'rgba(90,60,30,.45)'; g.lineWidth = 1.4; for (let y = -190; y < -96; y += 12) { g.beginPath(); g.moveTo(-56, y); g.lineTo(42, y - 2); g.stroke(); } g.lineWidth = 0.7; for (let x = -52; x < 40; x += 5) { g.beginPath(); g.moveTo(x, -200); g.lineTo(x, -94); g.stroke(); } } });
    if (v === 0) for (const [x, y] of [[40, -34], [62, -34], [51, -48], [-80, -34]]) sh.piece(ellipse(x, y, 13, 9, 12), '#d8c08a', { round: 3, lift: 1.2, paint: (g) => { g.strokeStyle = 'rgba(120,90,40,.6)'; g.lineWidth = 1; for (const dx of [-6, 0, 6]) { g.beginPath(); g.moveTo(x + dx, y - 8); g.lineTo(x + dx, y + 8); g.stroke(); } } });
    return { spr: sh.finish({ shadowBlur: 5 }), rowers: v === 1 ? [puppet(mk, 'boatman'), puppet(mk, 'monkSail'), puppet(mk, 'monkSail2')] : [puppet(mk, 'yayoiRower'), puppet(mk, 'yayoiRower2')] };
  },
  draw(g, P, t, e, env) {
    g.translate(0, Math.sin(t * 1.3 + e.a) * 2.6); g.rotate(Math.sin(t * 1.0 + e.a * 2) * 2 * DEG);
    const st = e.stroke ? e.stroke(t) : 1, v = e.v || 0;
    if (v === 1) { [[-110, 0], [-70, 1], [100, 2]].forEach(([x, i]) => { g.save(); g.translate(x, -22); const L = P.rowers[i].L; drawPerson(g, P.rowers[i], t, e, env, i === 0 ? { lean: 10 + Math.sin(t * 2.2) * 8 * st, head: 4, back: [-70 + Math.sin(t * 2.2) * 30 * st, -30], front: [-90 + Math.sin(t * 2.2) * 30 * st, -20] } : { lean: 2, head: -4 + Math.sin(t * 0.5 + i) * 3, back: [8, -8], front: i === 1 ? [-70, -60] : [-20, -20] }); g.restore(); }); }
    else [[-60, 0, 0], [96, 1, 1.5]].forEach(([x, i, o]) => { const s = Math.sin(t * 2.4 + o) * st; g.save(); g.translate(x, -20); drawPerson(g, P.rowers[i], t, e, env, { lean: 12 + s * 8, head: 6, back: [-60 + s * 30, -30], front: [-90 + s * 40, -20] }); g.restore(); });
    put(g, P.spr, env.sh, 3, 4);
  },
};

// A dōtaku: a bronze bell with fins, cast in panels with little pictures, hung in a frame. e.ring(t) swings it.
KINDS.dotaku = {
  bake(mk) {
    const r = rng(6300), P = {};
    P.frame = mk('dotaku-f', [-70, -230, 70, 6]).piece(strip(-56, 4, -54, -220, 9, 8), '#5a4230', { round: 2 }).piece(strip(56, 4, 54, -220, 9, 8), '#5a4230', { round: 2 }).piece(rect(-66, -214, 66, -226), '#6a4e36', { round: 2, lift: 1.4 }).finish({ shadowBlur: 5 });
    P.bell = mk('dotaku-b', [-52, -10, 52, 150]).piece([[-26, 4], [26, 4], [32, 30], [38, 140], [-38, 140], [-32, 30]], '#9a8a54', { round: 6, paint: (g) => {
      const gr = g.createLinearGradient(-40, 0, 40, 0); gr.addColorStop(0, 'rgba(40,50,30,.35)'); gr.addColorStop(0.45, 'rgba(255,240,180,.25)'); gr.addColorStop(1, 'rgba(40,50,30,.4)'); g.fillStyle = gr; g.fillRect(-40, 0, 80, 142);
      g.strokeStyle = 'rgba(60,60,36,.75)'; g.lineWidth = 1.6; for (const y of [40, 82, 124]) { g.beginPath(); g.moveTo(-36, y); g.lineTo(36, y); g.stroke(); } g.beginPath(); g.moveTo(0, 40); g.lineTo(0, 124); g.stroke();
      g.lineWidth = 1.2; g.beginPath(); g.moveTo(-26, 72); g.lineTo(-18, 56); g.lineTo(-10, 72); g.moveTo(-18, 56); g.lineTo(-18, 50); g.stroke(); // a deer
      g.beginPath(); g.moveTo(8, 108); g.quadraticCurveTo(18, 116, 30, 106); g.moveTo(14, 104); g.lineTo(14, 94); g.stroke(); // a boat
      g.fillStyle = 'rgba(90,140,110,.25)'; for (let i = 0; i < 26; i++) { g.beginPath(); g.arc(-34 + r() * 68, 10 + r() * 128, 2 + r() * 4, 0, 7); g.fill(); }
    } }).piece([[-30, 10], [-48, 40], [-46, 140], [-38, 140], [-34, 36]], '#8a7a48', { round: 2, lift: 0.8 }).piece([[30, 10], [48, 40], [46, 140], [38, 140], [34, 36]], '#8a7a48', { round: 2, lift: 0.8 })
      .piece([[-24, 6], [-20, -6], [0, -10], [20, -6], [24, 6]], '#8a7a48', { round: 3, lift: 1, paint: (g) => { g.fillStyle = 'rgba(30,26,16,.8)'; g.beginPath(); g.ellipse(0, -1, 9, 4, 0, 0, 7); g.fill(); } })
      .finish({ shadowBlur: 4 });
    return P;
  },
  draw(g, P, t, e, env) {
    put(g, P.frame, env.sh, 3, 4);
    const k = e.ring ? e.ring(t) : 0; g.save(); g.translate(0, -212); g.rotate((Math.sin(t * 3.1) * 7 * k + Math.sin(t * 0.8 + e.a) * 0.8) * DEG); g.translate(0, 8); put(g, P.bell, env.sh, 2, 3); g.restore();
  },
};

// A length of palisade: sharpened stakes, some leaning.
KINDS.palisade = {
  bake(mk, v = 0) {
    const r = rng(6400 + v), sh = mk('palisade' + v, [-48, -100, 48, 6]);
    for (let x = -44; x < 44; x += 7.5) { const h = 72 + r() * 18, c = r() < 0.5 ? '#7a5a3a' : '#6a4c32'; sh.piece([[x - 3.6, 4], [x + 3.6, 4], [x + 3.4, -h], [x, -h - 9], [x - 3.4, -h]], c, { round: 1, rough: 0.6, lift: 1 }); }
    sh.piece(rect(-46, -34, 46, -40), '#5a4230', { round: 1, lift: 1.2 }); sh.piece(rect(-46, -60, 46, -66), '#5a4230', { round: 1, lift: 1.2 });
    return { spr: sh.finish({ shadowBlur: 3 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 2, 3); },
};

// A watchtower: four tall posts (two seen), a railed platform, a thatched hip roof.
KINDS.yagura = {
  bake(mk) {
    const r = rng(6500), sh = mk('yagura', [-70, -330, 70, 6]);
    for (const x of [-38, 38]) sh.piece(strip(x, 4, x * 0.82, -250, 9, 7), '#6a4c34', { round: 1.5 });
    for (const y of [-80, -160]) { sh.piece(strip(-38, y, 32, y - 60, 3, 3), '#5a4030', { round: 1, lift: 0.8 }); sh.piece(strip(38, y, -32, y - 60, 3, 3), '#5a4030', { round: 1, lift: 0.8 }); }
    sh.piece(rect(-50, -232, 50, -242), '#7a5a3e', { round: 1.5, lift: 1.4 });
    for (let x = -44; x < 48; x += 11) sh.piece(rect(x, -242, x + 3, -262), '#6a4c34', { round: 0.6, lift: 0.8, thick: 0.6 });
    sh.piece(rect(-47, -260, 47, -264), '#6a4c34', { round: 0.8, lift: 1, thick: 0.6 });
    for (const x of [-40, 40]) sh.piece(strip(x, -242, x * 0.9, -276, 4, 4), '#6a4c34', { round: 1, lift: 1 });
    sh.piece([[-66, -270], [-30, -312], [30, -312], [66, -270], [40, -274], [-40, -274]], '#a88e60', { round: 2.4, rough: 1.2, lift: 1.8, paint: (g) => { g.strokeStyle = 'rgba(90,66,36,.35)'; g.lineWidth = 1; for (let x = -64; x < 66; x += 3.4) { g.beginPath(); g.moveTo(x * 0.5, -310); g.lineTo(x, -272); g.stroke(); } } });
    return { spr: sh.finish({ shadowBlur: 6 }) };
  },
  draw(g, P, t, e, env) { g.rotate(sway(t, e, 0.4, 0.3)); put(g, P.spr, env.sh, 4, 5); },
};

// A granary on stilts, with discs on the posts so rats cannot climb in, and a notched log for a ladder.
KINDS.granary = {
  bake(mk, v = 0) {
    const r = rng(6600 + v), s = v === 1 ? 1.2 : 1, sh = mk('granary' + v, [-90 * s, -230 * s, 90 * s, 6]);
    const S = (pts) => pts.map(([x, y]) => [x * s, y * s]);
    for (const x of [-40, 40]) sh.piece(S(strip(x, 4, x, -80, 8, 7)), '#6a4c34', { round: 1.5 });
    for (const x of [-40, 40]) sh.piece(S(ellipse(x, -58, 15, 4, 12)), '#7a5a3e', { round: 2, lift: 1 });
    sh.piece(S(rect(-56, -78, 56, -88)), '#7a5a3e', { round: 1.5, lift: 1.2 });
    sh.piece(S(rect(-48, -88, 48, -136)), '#9a7a52', { round: 1.5, lift: 1.2, paint: (g) => { g.strokeStyle = 'rgba(60,40,24,.4)'; g.lineWidth = 1.2; for (let y = -92; y > -136; y -= 7) { g.beginPath(); g.moveTo(-48 * s, y * s); g.lineTo(48 * s, y * s); g.stroke(); } g.fillStyle = 'rgba(30,18,10,.85)'; g.fillRect(-8 * s, -128 * s, 16 * s, 34 * s); } });
    sh.piece(S([[-74, -124], [-84, -140], [-30, -212], [30, -212], [84, -140], [74, -124], [40, -134], [-40, -134]]), '#b0965e', { round: 2.4, rough: 1.2, lift: 2, paint: (g) => { g.strokeStyle = 'rgba(90,66,36,.35)'; g.lineWidth = 1; for (let x = -82; x < 84; x += 3.4) { g.beginPath(); g.moveTo(x * 0.36 * s, -210 * s); g.lineTo(x * s, -128 * s); g.stroke(); } } });
    sh.piece(S([[-38, -208], [-50, -226], [-44, -228], [-30, -212]]), '#6a4c34', { round: 1, lift: 1 }).piece(S([[38, -208], [50, -226], [44, -228], [30, -212]]), '#6a4c34', { round: 1, lift: 1 });
    sh.piece(S(strip(64, 4, 20, -84, 7, 6)), '#7a5a3a', { round: 1.4, lift: 1.4, paint: (g) => { g.strokeStyle = 'rgba(30,18,10,.6)'; g.lineWidth = 2; for (let k = 1; k < 7; k++) { const x = (64 - k * 6.2) * s, y = -k * 12 * s; g.beginPath(); g.moveTo(x - 3, y); g.lineTo(x + 3, y + 2); g.stroke(); } } });
    return { spr: sh.finish({ shadowBlur: 5 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 3, 4); },
};

// Himiko's palace: a great hall on posts under a steep thatched roof with crossed rafter-ends,
// a veranda, and a bamboo blind behind which the queen sits, lit from within. e.lamp(t) lights her.
const HIM_BLIND = [-46, -164, 92, 72];
KINDS.himikohall = {
  bake(mk) {
    const r = rng(6700), sh = mk('himikohall', [-160, -360, 160, 6]);
    for (const x of [-110, -55, 0, 55, 110]) sh.piece(strip(x, 4, x, -84, 11, 10), '#5e4230', { round: 2 });
    sh.piece(rect(-132, -80, 132, -92), '#7a5a3e', { round: 1.5, lift: 1.4 });
    sh.piece(rect(-112, -92, 112, -170), '#a88a62', { round: 1.5, lift: 1.2, paint: (g) => {
      g.strokeStyle = 'rgba(60,40,24,.35)'; g.lineWidth = 1.2; for (let x = -110; x < 112; x += 9) { g.beginPath(); g.moveTo(x, -92); g.lineTo(x, -170); g.stroke(); }
      const [bx, by, bw, bh] = HIM_BLIND; g.fillStyle = 'rgba(26,16,10,.95)'; g.fillRect(bx, by, bw, bh);
      // the queen, seated, seen only as a shape
      g.fillStyle = 'rgba(6,3,2,1)'; g.beginPath(); g.moveTo(-6, by + bh); g.lineTo(-10, by + 46); g.lineTo(-6, by + 30); g.lineTo(0, by + 24); g.arc(0, by + 18, 7, Math.PI * 0.6, Math.PI * 2.4); g.lineTo(6, by + 30); g.lineTo(12, by + 44); g.lineTo(26, by + bh); g.closePath(); g.fill();
      g.fillStyle = 'rgba(6,3,2,1)'; g.fillRect(-14, by + 8, 28, 3);
    } });
    sh.piece(rect(HIM_BLIND[0] - 4, HIM_BLIND[1] - 6, HIM_BLIND[0] + HIM_BLIND[2] + 4, HIM_BLIND[1] - 1), '#4a3420', { round: 1, lift: 0.8 });
    for (let x = -138; x < 142; x += 14) sh.piece(rect(x, -92, x + 3, -106), '#5a4030', { round: 0.6, lift: 0.8, thick: 0.6 });
    sh.piece(rect(-140, -104, 140, -108), '#5a4030', { round: 0.8, lift: 1, thick: 0.6 });
    sh.piece([[-160, -160], [-150, -176], [-60, -300], [60, -300], [150, -176], [160, -160], [110, -168], [-110, -168]], '#9a8052', { round: 3, rough: 1.2, lift: 2.2, paint: (g) => { g.strokeStyle = 'rgba(80,58,30,.38)'; g.lineWidth = 1.1; for (let x = -158; x < 160; x += 3.2) { g.beginPath(); g.moveTo(x * 0.38, -298); g.lineTo(x, -166); g.stroke(); } g.strokeStyle = 'rgba(60,40,20,.45)'; g.lineWidth = 2; for (const y of [-200, -240]) { g.beginPath(); g.moveTo(-160 * (1 - (-y - 170) / 160), y); g.lineTo(160 * (1 - (-y - 170) / 160), y); g.stroke(); } } });
    sh.piece(rect(-66, -296, 66, -310), '#6a4c34', { round: 2, lift: 1.4 });
    for (const x of [-46, -16, 16, 46]) sh.piece(ellipse(x, -314, 10, 6, 10), '#7a5a3e', { round: 2, lift: 1.4 });
    for (const s2 of [-1, 1]) sh.piece([[s2 * 58, -300], [s2 * 86, -352], [s2 * 80, -356], [s2 * 50, -306]], '#6a4c34', { round: 1, lift: 1.6 }).piece([[s2 * 62, -300], [s2 * 36, -350], [s2 * 42, -354], [s2 * 70, -306]], '#5e4230', { round: 1, lift: 1.6 });
    sh.piece(strip(150, 4, 120, -86, 9, 8), '#7a5a3a', { round: 1.4, lift: 1.4 });
    return { spr: sh.finish({ shadowBlur: 7 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 4, 5); },
  glow(g, P, t, e, env, p) {
    const k = e.lamp ? e.lamp(t) : 0; if (k < 0.01 || p < 0.6) return;
    const [bx, by, bw, bh] = HIM_BLIND, f = 0.85 + 0.15 * fbm(t * 6, 5);
    g.save(); g.beginPath(); g.rect(bx, by, bw, bh);
    // cut her shape out of the light, so she stays a shadow
    g.moveTo(-6, by + bh); g.lineTo(26, by + bh); g.lineTo(12, by + 44); g.lineTo(6, by + 30); g.arc(0, by + 18, 7, Math.PI * 2.4, Math.PI * 0.6, true); g.lineTo(-6, by + 30); g.lineTo(-10, by + 46); g.closePath();
    g.clip('evenodd'); g.globalCompositeOperation = 'lighter';
    for (let y = by + 2; y < by + bh; y += 4) { g.fillStyle = `rgba(255,${170 + ((y * 7) % 30)},90,${0.8 * k * f})`; g.fillRect(bx, y, bw, 2.4); }
    g.restore(); g.globalCompositeOperation = 'lighter';
    const gr = g.createRadialGradient(bx + bw / 2, by + bh / 2, 0, bx + bw / 2, by + bh / 2, 120); gr.addColorStop(0, `rgba(255,170,90,${0.22 * k * f})`); gr.addColorStop(1, 'rgba(255,150,70,0)'); g.fillStyle = gr; g.fillRect(bx - 120, by - 120, bw + 240, bh + 240);
    g.globalCompositeOperation = 'source-over';
  },
};

// ==================================================================== the Kofun ===
// Haniwa: hollow figures of fired clay set out on the great tombs. v0 a plain cylinder, v1 a house,
// v2 a horse in harness, v3 a warrior in armour, v4 a dancer with one arm raised, v5 another dancer.
const TERRA = '#c47a4a', TERRA_D = '#a85e36';
KINDS.haniwa = {
  bake(mk, v = 0) {
    const r = rng(6800 + v), hole = (g, x, y, rx, ry) => { g.fillStyle = 'rgba(30,14,8,.92)'; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); };
    const tex = (g, x0, y0, x1, y1) => { g.strokeStyle = 'rgba(120,60,30,.25)'; g.lineWidth = 0.8; for (let y = y0; y < y1; y += 3) { g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y + (r() - 0.5)); g.stroke(); } };
    if (v === 0) return { spr: mk('haniwa0', [-24, -76, 24, 6]).piece([[-17, 4], [17, 4], [16, -70], [-16, -70]], TERRA, { round: 3, paint: (g) => { tex(g, -17, -70, 17, 4); for (const y of [-24, -48]) { g.fillStyle = 'rgba(255,200,160,.25)'; g.fillRect(-17, y - 2, 34, 4); g.fillStyle = 'rgba(90,40,20,.3)'; g.fillRect(-17, y + 2, 34, 1.5); } hole(g, 0, -36, 4.5, 4.5); g.fillStyle = 'rgba(40,18,10,.85)'; g.beginPath(); g.ellipse(0, -70, 15, 3, 0, 0, 7); g.fill(); } }).finish({ shadowBlur: 3 }) };
    if (v === 1) {
      const sh = mk('haniwa1', [-60, -130, 60, 6]);
      sh.piece([[-30, 4], [30, 4], [30, -16], [-30, -16]], TERRA_D, { round: 2, paint: (g) => tex(g, -30, -16, 30, 4) });
      sh.piece(rect(-40, -16, 40, -64), TERRA, { round: 2, lift: 1.2, paint: (g) => { tex(g, -40, -64, 40, -16); hole(g, -16, -40, 7, 11); hole(g, 18, -40, 7, 11); } });
      sh.piece([[-56, -60], [-38, -112], [38, -112], [56, -60], [30, -66], [-30, -66]], shade(TERRA, -0.05), { round: 2.4, lift: 1.6, paint: (g) => { g.strokeStyle = 'rgba(110,50,24,.5)'; g.lineWidth = 1.2; for (let x = -52; x < 56; x += 6) { g.beginPath(); g.moveTo(x * 0.7, -110); g.lineTo(x, -64); g.stroke(); } } });
      sh.piece([[-46, -110], [-52, -124], [52, -124], [46, -110]], TERRA_D, { round: 2, lift: 1.2 });
      return { spr: sh.finish({ shadowBlur: 4 }) };
    }
    if (v === 2) {
      const sh = mk('haniwa2', [-80, -140, 80, 6]);
      for (const [x, c] of [[-46, TERRA_D], [36, TERRA_D], [-34, TERRA], [48, TERRA]]) sh.piece([[x - 9, 4], [x + 9, 4], [x + 8, -54], [x - 8, -54]], c, { round: 3, paint: (g) => tex(g, x - 9, -54, x + 9, 4) });
      sh.piece([[-60, -50], [-56, -82], [-20, -92], [36, -92], [56, -80], [58, -52], [-54, -46]], TERRA, { round: 10, lift: 1.4, paint: (g) => { tex(g, -60, -92, 58, -46); g.fillStyle = '#9a4a28'; g.fillRect(-26, -94, 34, 18); g.fillStyle = 'rgba(255,210,170,.4)'; for (let x = -50; x < 52; x += 12) { g.beginPath(); g.arc(x, -54, 3.4, 0, 7); g.fill(); } } });
      sh.piece([[40, -88], [52, -122], [70, -132], [80, -118], [66, -104], [58, -82]], TERRA, { round: 6, lift: 1.6, paint: (g) => { hole(g, 68, -122, 2.6, 2.6); g.fillStyle = 'rgba(255,210,170,.35)'; g.fillRect(48, -112, 16, 3); } });
      sh.piece([[52, -122], [56, -138], [62, -126]], TERRA_D, { round: 1, lift: 1 });
      sh.piece([[-58, -78], [-70, -52], [-64, -50], [-54, -70]], TERRA_D, { round: 2, lift: 1 });
      return { spr: sh.finish({ shadowBlur: 4 }) };
    }
    if (v === 3) {
      const sh = mk('haniwa3', [-40, -160, 40, 6]);
      sh.piece([[-18, 4], [18, 4], [16, -50], [-16, -50]], TERRA_D, { round: 3, paint: (g) => tex(g, -18, -50, 18, 4) });
      sh.piece([[-22, -46], [22, -46], [26, -70], [24, -100], [-24, -100], [-26, -70]], TERRA, { round: 4, lift: 1.4, paint: (g) => { g.strokeStyle = 'rgba(110,50,24,.55)'; g.lineWidth = 1.2; for (let y = -96; y < -50; y += 6) { g.beginPath(); g.moveTo(-24, y); g.lineTo(24, y); g.stroke(); for (let x = -22 + ((y / 6) & 1) * 4; x < 24; x += 8) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 6); g.stroke(); } } } });
      sh.piece([[-14, -98], [14, -98], [14, -126], [-14, -126]], TERRA, { round: 6, lift: 1.4, paint: (g) => { hole(g, -6, -114, 3, 2); hole(g, 6, -114, 3, 2); hole(g, 0, -104, 3.4, 1.8); } });
      sh.piece([[-26, -122], [-18, -140], [0, -148], [18, -140], [26, -122], [16, -124], [-16, -124]], shade(TERRA, -0.08), { round: 3, lift: 1.6 });
      sh.piece(strip(18, -86, 32, -60, 7, 6), TERRA, { round: 2, lift: 1.4 }); sh.piece(strip(-18, -90, 8, -66, 7, 6), TERRA, { round: 2, lift: 1.6 });
      sh.piece(strip(6, -66, 34, -40, 4, 3), '#8a4a2a', { round: 1, lift: 1.4 });
      return { spr: sh.finish({ shadowBlur: 4 }) };
    }
    const flipArm = v === 5, sh = mk('haniwa' + v, [-46, -140, 46, 6]);
    sh.piece([[-16, 4], [16, 4], [14, -60], [16, -86], [-16, -86], [-14, -60]], TERRA, { round: 6, paint: (g) => { tex(g, -16, -86, 16, 4); g.fillStyle = 'rgba(255,200,160,.2)'; g.fillRect(-16, -40, 32, 3); } });
    sh.piece(ellipse(0, -104, 15, 18, 14), TERRA, { round: 6, lift: 1.4, paint: (g) => { hole(g, -6, -108, 3.2, 2.4); hole(g, 6, -108, 3.2, 2.4); hole(g, 0, -96, 3.6, 3); } });
    sh.piece(strip(flipArm ? -14 : 14, -78, flipArm ? -34 : 34, -122, 7, 5.6), TERRA, { round: 3, lift: 1.4 });
    sh.piece(strip(flipArm ? 14 : -14, -78, flipArm ? 30 : -30, -52, 7, 5.6), TERRA_D, { round: 3, lift: 1.2 });
    return { spr: sh.finish({ shadowBlur: 4 }) };
  },
  draw(g, P, t, e, env) { const d = e.dance ? e.dance(t) : 0; g.rotate((Math.sin(t * 2.4 + e.a) * 4 * d + Math.sin(t * 0.6 + e.a) * 0.4) * DEG); put(g, P.spr, env.sh, 2, 3); },
};

// A keyhole tomb seen from the side: a terraced round mound and its lower square front, wooded,
// with stone-faced slopes and rows of haniwa on the terraces.
KINDS.kofun = {
  bake(mk) {
    const r = rng(6900), sh = mk('kofun', [-300, -280, 300, 8]);
    const trees = (g, x0, x1, ytop, n) => { for (let i = 0; i < n; i++) { const x = x0 + r() * (x1 - x0), y = ytop + r() * 30, s2 = 7 + r() * 9; g.fillStyle = r() < 0.5 ? 'rgba(36,64,38,.75)' : 'rgba(84,124,66,.6)'; g.beginPath(); g.ellipse(x, y, s2, s2 * 0.8, 0, 0, 7); g.fill(); } };
    const stones = (g, x0, x1, y0, y1) => { g.fillStyle = 'rgba(176,170,152,.55)'; for (let i = 0; i < 90; i++) { const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0); g.beginPath(); g.ellipse(x, y, 2 + r() * 1.6, 1.2 + r() * 0.8, 0, 0, 7); g.fill(); } };
    // the square front part (left), lower, in three steps; then the round part (right), higher, in three steps
    const steps = (xL, xR, h, col, lift, k, dome) => {
      const yTop = -h, inset = 26, top = []; for (let i = 0; i <= 10; i++) top.push([lerp(xL + inset, xR - inset, i / 10), yTop + (dome ? 26 * (1 - Math.sin(i / 10 * Math.PI)) : 0)]);
      sh.piece([[xL, 6], ...top, [xR, 6]], col, { round: 8, rough: 1.2, seg: 20, lift, paint: (g) => { const gr = g.createLinearGradient(0, yTop, 0, 6); gr.addColorStop(0, rgb(shade(col, 0.12))); gr.addColorStop(1, rgb(shade(col, -0.15))); g.fillStyle = gr; g.fillRect(xL, yTop - 6, xR - xL, -yTop + 14); stones(g, xL, xR, yTop + 18, 6); trees(g, xL + inset, xR - inset, yTop - 14, 30 + k * 10); g.fillStyle = 'rgba(210,140,90,.85)'; for (let x = xL + inset + 4; x < xR - inset; x += 7) g.fillRect(x, yTop - 1, 2.4, 4); } });
    };
    steps(-296, 20, 70, '#4e6a44', 1, 0); steps(-270, 0, 120, '#56744a', 1.4, 1); steps(-244, -26, 160, '#5e7e50', 1.8, 2);
    steps(-60, 296, 92, '#4e6a44', 1, 0, 1); steps(-30, 268, 168, '#56744a', 1.4, 1, 1); steps(4, 238, 236, '#5e7e50', 1.8, 2, 1);
    return { spr: sh.finish({ shadowBlur: 8 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh * 0.5, 4, 5); },
};

// ================================================================ Asuka and Nara ===
// A hip-and-gable roof with deep eaves and grey tiles, its ends lifting gently (Japanese roofs curve
// less than Chinese ones). Returns the points of the roof, centred on x = 0 with its eave line at y0.
export function jroof(w, y0, h, eave, lift = 8) {
  const p = [];
  for (let i = 0; i <= 12; i++) { const f = i / 12, x = -w - eave + f * (w + eave) * 2, up = Math.pow(Math.abs(f * 2 - 1), 4); p.push([x, y0 - up * lift]); }
  // the hip slopes up to a short gable, then the ridge
  p.push([w * 0.62, y0 - h * 0.62], [w * 0.5, y0 - h * 0.66], [w * 0.4, y0 - h], [-w * 0.4, y0 - h], [-w * 0.5, y0 - h * 0.66], [-w * 0.62, y0 - h * 0.62]);
  return p;
}
const tileLines = (col, w, y0, h) => (g) => { g.strokeStyle = rgb(shade(col, -0.35), 0.45); g.lineWidth = 1.1; for (let x = -w * 1.4; x < w * 1.4; x += 5) { g.beginPath(); g.moveTo(x * 0.42, y0 - h); g.lineTo(x, y0 + 2); g.stroke(); } g.fillStyle = rgb(shade(col, 0.2), 0.4); g.fillRect(-w * 1.5, y0 - 4, w * 3, 3); };
// v0: Hōryū-ji's golden hall, two roofs, old unpainted wood and white walls. v1: the Great Buddha Hall at
// Tōdai-ji, very wide, with golden ridge ends. v2: a temple gate. v3: a small hall.
const TERA = [
  { w: 120, h: 70, wood: '#6a4e3a', wall: '#ece4d2', tile: '#5a5c60', two: 1, base: 16 },
  { w: 250, h: 120, wood: '#7a4a32', wall: '#e8dcc6', tile: '#4e5258', two: 1, base: 20, gold: 1 },
  { w: 90, h: 92, wood: '#a8442e', wall: '#e8dcc6', tile: '#55585c', two: 1, base: 10, gate: 1 },
  { w: 80, h: 60, wood: '#6a4e3a', wall: '#ece4d2', tile: '#5a5c60', two: 0, base: 10 },
];
KINDS.tera = {
  bake(mk, v = 0) {
    const T = TERA[v], r = rng(7000 + v), { w, h, base } = T, eave = w * 0.42, sh = mk('tera' + v, [-w - eave - 20, -base - h - (T.two ? 230 : 120) * (w / 120), w + eave + 20, 6]);
    sh.piece([[-w - 14, 4], [-w - 10, -base], [w + 10, -base], [w + 14, 4]], '#b0a894', { round: 2, paint: (g) => { g.strokeStyle = 'rgba(70,60,50,.3)'; g.lineWidth = 1; for (let y = -5; y > -base; y -= 5) { g.beginPath(); g.moveTo(-w - 12, y); g.lineTo(w + 12, y); g.stroke(); } } });
    const yb = -base, yt = -base - h, win = [];
    sh.piece(rect(-w, yb, w, yt), T.wall, { round: 1.5, lift: 1.2, paint: (g) => {
      const bays = T.gate ? 3 : v === 1 ? 7 : 5, bw = (w * 2) / bays;
      for (let i = 0; i < bays; i++) { const x = -w + i * bw; if (T.gate && i === 1) { g.fillStyle = 'rgba(30,20,14,.9)'; g.fillRect(x + 4, yt + 10, bw - 8, h - 10); continue; } if (i % 2 === (v === 1 ? 1 : 0) || v === 3) { g.fillStyle = 'rgba(70,44,28,.9)'; g.fillRect(x + bw * 0.2, yt + h * 0.25, bw * 0.6, h * 0.75); win.push([x + bw * 0.2, yt + h * 0.25, bw * 0.6, h * 0.75]); g.strokeStyle = 'rgba(200,170,120,.4)'; g.lineWidth = 0.8; for (let xx = x + bw * 0.2 + 4; xx < x + bw * 0.8; xx += 4) { g.beginPath(); g.moveTo(xx, yt + h * 0.25); g.lineTo(xx, yb); g.stroke(); } } }
      g.fillStyle = T.wood; for (let i = 0; i <= bays; i++) g.fillRect(-w + i * bw - 3.5, yt, 7, h);
      g.fillRect(-w, yt, w * 2, 7); g.fillRect(-w, yt + h * 0.22, w * 2, 4);
    } });
    // brackets under the eaves
    sh.piece(rect(-w - 6, yt + 2, w + 6, yt - 14), shade(T.wood, -0.1), { round: 1, lift: 1, paint: (g) => { g.fillStyle = 'rgba(240,230,210,.35)'; for (let x = -w; x < w; x += 14) g.fillRect(x, yt - 12, 8, 4); } });
    const roof = (ww, y0, hh, ev, col, lf) => sh.piece(jroof(ww, y0, hh, ev, lf), col, { round: 2.4, rough: 0.7, lift: 2, paint: tileLines(col, ww, y0, hh) });
    let ry;
    if (T.two) {
      roof(w + 6, yt - 12, h * 0.5, eave, T.tile, 10);
      const w2 = w * 0.72, h2 = h * 0.7, y2 = yt - 12 - h * 0.42;
      sh.piece(rect(-w2, y2, w2, y2 - h2), T.wall, { round: 1.2, lift: 1.2, paint: (g) => { g.fillStyle = T.wood; for (let x = -w2; x <= w2; x += w2 / 2) g.fillRect(x - 3, y2 - h2, 6, h2); g.fillRect(-w2, y2 - h2, w2 * 2, 6); g.fillStyle = 'rgba(70,44,28,.85)'; g.fillRect(-w2 * 0.3, y2 - h2 * 0.75, w2 * 0.6, h2 * 0.5); } });
      sh.piece(rect(-w2 - 4, y2 - h2 + 2, w2 + 4, y2 - h2 - 10), shade(T.wood, -0.1), { round: 1, lift: 1 });
      roof(w2 + 4, y2 - h2 - 8, h * 0.78, eave * 0.9, T.tile, 10); ry = y2 - h2 - 8 - h * 0.78;
    } else { roof(w + 4, yt - 12, h * 0.9, eave, T.tile, 8); ry = yt - 12 - h * 0.9; }
    const rw = (T.two ? w * 0.72 + 4 : w + 4) * 0.4;
    sh.piece(rect(-rw - 4, ry + 4, rw + 4, ry - 8), shade(T.tile, -0.25), { round: 1.5, lift: 1.2 });
    for (const s2 of [-1, 1]) sh.piece([[s2 * rw, ry + 4], [s2 * (rw + 4), ry - 20], [s2 * (rw - 6), ry - 12], [s2 * (rw - 8), ry - 4]], T.gold ? '#d4a838' : shade(T.tile, -0.3), { round: 2, lift: 1.2 });
    return { spr: sh.finish({ shadowBlur: 7 }), windows: win };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 4, 5); },
  glow: glowRects,
};

// A five-storey pagoda: five roofs, each a little smaller, and a bronze spire of nine rings.
KINDS.gojunoto = {
  bake(mk, v = 0) {
    const r = rng(7100 + v), wood = v === 1 ? '#a8442e' : '#6a4e3a', wall = '#ece4d2', tile = '#55585c', sh = mk('gojunoto' + v, [-110, -560, 110, 6]);
    sh.piece([[-58, 4], [-54, -16], [54, -16], [58, 4]], '#b0a894', { round: 2 });
    let y = -16;
    for (let k = 0; k < 5; k++) {
      const w = 40 - k * 4.4, h = k ? 34 : 48, ev = 44 - k * 4;
      sh.piece(rect(-w, y, w, y - h), wall, { round: 1.2, lift: 1.2, paint: (g) => { g.fillStyle = wood; g.fillRect(-w, y - h, 6, h); g.fillRect(w - 6, y - h, 6, h); g.fillRect(-w, y - h, w * 2, 5); g.fillStyle = 'rgba(60,40,26,.85)'; g.fillRect(-w * 0.35, y - h * 0.8, w * 0.7, h * 0.8); } });
      y -= h;
      sh.piece(rect(-w - 5, y + 2, w + 5, y - 10), shade(wood, -0.12), { round: 1, lift: 1 });
      sh.piece(jroof(w + 6, y - 8, 22, ev, 12), tile, { round: 2.2, rough: 0.6, lift: 1.8, paint: tileLines(tile, w, y - 8, 22) });
      y -= 30;
    }
    sh.piece(rect(-6, y + 4, 6, y - 10), '#7a7448', { round: 1, lift: 1 });
    sh.piece(strip(0, y, 0, y - 120, 4, 3), '#7a7448', { round: 1, lift: 1.2, paint: (g) => { g.fillStyle = '#9a8e58'; for (let k = 0; k < 9; k++) { const yy = y - 12 - k * 9; g.fillRect(-9 + k * 0.3, yy, 18 - k * 0.6, 3.4); } } });
    sh.piece(ellipse(0, y - 124, 5, 6, 10), '#9a8e58', { round: 2, lift: 1 });
    return { spr: sh.finish({ shadowBlur: 7 }) };
  },
  draw(g, P, t, e, env) { g.rotate(Math.sin(t * 0.4 + e.a) * 0.25 * DEG); put(g, P.spr, env.sh, 4, 5); },
};

// A temple going up: posts, a tie beam, scaffolding poles, and a great beam hoisted on ropes (e.lift(t)).
KINDS.tframe = {
  bake(mk) {
    const sh = mk('tframe', [-150, -300, 150, 6]), c = '#c8a070', P = {};
    sh.piece([[-140, 4], [-136, -14], [136, -14], [140, 4]], '#b0a894', { round: 2 });
    for (const x of [-110, -40, 40, 110]) sh.piece(strip(x, -14, x, -200, 13, 12), c, { round: 1.6, lift: 1, paint: (g) => { g.strokeStyle = 'rgba(120,80,40,.3)'; g.lineWidth = 0.8; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(x - 4 + k * 1.6, -14); g.lineTo(x - 4 + k * 1.6, -200); g.stroke(); } } });
    sh.piece(rect(-124, -186, 124, -200), shade(c, -0.05), { round: 1.5, lift: 1.4 });
    for (const x of [-136, 136]) sh.piece(strip(x, 4, x * 0.98, -270, 4, 3), '#8a7a5a', { round: 1, lift: 0.8 });
    for (const y of [-80, -160, -240]) sh.piece(strip(-136, y, 136, y - 2, 3, 3), '#8a7a5a', { round: 1, lift: 0.8 });
    P.spr = sh.finish({ shadowBlur: 6 });
    P.beam = mk('tframe-beam', [-130, -10, 130, 10]).piece(rect(-124, -8, 124, 8), c, { round: 2, paint: (g) => { g.fillStyle = 'rgba(60,40,20,.5)'; g.fillRect(-120, -8, 8, 16); g.fillRect(112, -8, 8, 16); } }).finish({ shadowBlur: 3 });
    return P;
  },
  draw(g, P, t, e, env) {
    put(g, P.spr, env.sh, 4, 5);
    const k = e.lift ? e.lift(t) : 1, y = lerp(-20, -212, k);
    g.strokeStyle = 'rgba(80,60,40,.8)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-90, -276); g.lineTo(-90, y); g.moveTo(90, -276); g.lineTo(90, y); g.stroke();
    g.save(); g.translate(0, y); g.rotate(Math.sin(t * 1.3) * 0.6 * DEG * (1 - k)); put(g, P.beam, env.sh, 3, 4); g.restore();
  },
};

// Ise: a shrine in the oldest style. Raised on posts, plank walls, a thick thatched roof with crossed
// rafter-ends and logs along the ridge. v0 weathered after twenty years; v1 new, in pale fresh cypress.
KINDS.shinmei = {
  bake(mk, v = 0) {
    const r = rng(7200 + v), wood = v ? '#e4c890' : '#8a7a68', thatch = v ? '#b8a070' : '#6e6450', gold = v ? '#e0b444' : '#9a8450', sh = mk('shinmei' + v, [-130, -330, 130, 6]);
    for (const x of [-80, -27, 27, 80]) sh.piece(strip(x, 4, x, -76, 10, 10), shade(wood, -0.06), { round: 1.4 });
    sh.piece(rect(-104, -72, 104, -82), wood, { round: 1.2, lift: 1.2 });
    for (let x = -100; x <= 100; x += 12.5) sh.piece(rect(x, -82, x + 2.6, -98), wood, { round: 0.5, lift: 0.8, thick: 0.6 });
    sh.piece(rect(-102, -96, 102, -100), wood, { round: 0.6, lift: 1, thick: 0.6 });
    sh.piece(rect(-78, -82, 78, -170), shade(wood, 0.06), { round: 1.2, lift: 1.2, paint: (g) => { g.strokeStyle = rgb(shade(wood, -0.3), 0.4); g.lineWidth = 1; for (let y = -88; y > -170; y -= 9) { g.beginPath(); g.moveTo(-78, y); g.lineTo(78, y); g.stroke(); } g.fillStyle = rgb(shade(wood, -0.5), 0.9); g.fillRect(-16, -160, 32, 76); g.fillStyle = gold; for (const [x, y] of [[-12, -140], [12, -140], [-12, -110], [12, -110]]) { g.beginPath(); g.arc(x, y, 2.4, 0, 7); g.fill(); } } });
    sh.piece([[-128, -160], [-118, -184], [-50, -246], [50, -246], [118, -184], [128, -160], [80, -170], [-80, -170]], thatch, { round: 6, rough: 1, lift: 2.2, paint: (g) => { g.strokeStyle = rgb(shade(thatch, -0.3), 0.4); g.lineWidth = 1; for (let x = -126; x < 128; x += 3) { g.beginPath(); g.moveTo(x * 0.4, -244); g.lineTo(x, -166); g.stroke(); } g.fillStyle = rgb(shade(thatch, 0.25), 0.4); g.fillRect(-128, -170, 256, 4); } });
    sh.piece(rect(-54, -244, 54, -256), shade(wood, -0.1), { round: 2, lift: 1.4 });
    for (let k = 0; k < 7; k++) { const x = -45 + k * 15; sh.piece(ellipse(x, -262, 6.2, 7, 10), wood, { round: 2, lift: 1.4, paint: (g) => { g.fillStyle = gold; g.fillRect(x - 6, -266, 12, 2.4); } }); }
    for (const s2 of [-1, 1]) sh.piece([[s2 * 50, -246], [s2 * 82, -318], [s2 * 74, -322], [s2 * 46, -252]], wood, { round: 0.6, lift: 1.6, paint: (g) => { g.fillStyle = gold; g.fillRect(s2 * 76 - 3, -312, 6, 3); } });
    sh.piece(strip(110, 4, 84, -78, 9, 8), shade(wood, -0.08), { round: 1.2, lift: 1.2 });
    return { spr: sh.finish({ shadowBlur: 7 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 4, 5); },
};
// The small hut that covers the sacred post on the empty plot beside the shrine.
KINDS.kooiya = { bake(mk) { return { spr: mk('kooiya', [-30, -60, 30, 6]).piece([[-20, 4], [-20, -30], [0, -50], [20, -30], [20, 4]], '#a89a80', { round: 2, paint: (g) => { g.strokeStyle = 'rgba(60,50,40,.35)'; g.lineWidth = 0.8; for (let x = -18; x < 20; x += 4) { g.beginPath(); g.moveTo(x, 4); g.lineTo(x, -30); g.stroke(); } } }).finish({ shadowBlur: 3 }) }; }, draw(g, P, t, e, env) { put(g, P.spr, env.sh, 2, 3); } };
// A wooden fence of the shrine precinct.
KINDS.mizugaki = { bake(mk, v = 0) { const sh = mk('mizugaki' + v, [-46, -80, 46, 6]); for (let x = -42; x < 44; x += 6) sh.piece([[x - 2.2, 4], [x + 2.2, 4], [x + 2.2, -66], [x, -72], [x - 2.2, -66]], v ? '#e0c48c' : '#8a7a68', { round: 0.8, lift: 0.6, thick: 0.6 }); sh.piece(rect(-46, -50, 46, -56), v ? '#d4b880' : '#7a6a58', { round: 1, lift: 1 }); return { spr: sh.finish({ shadowBlur: 3 }) }; }, draw(g, P, t, e, env) { put(g, P.spr, env.sh, 2, 3); } };

// A torii: v0 plain wood (shinmei), v1 vermilion with a curved top beam (myōjin), v2 vermilion in the sea.
KINDS.torii = {
  bake(mk, v = 0) {
    const c = v ? '#c8402a' : '#9a8a70', cd = v ? '#2a2420' : shade(c, -0.1), sh = mk('torii' + v, [-120, -270, 120, 6]);
    for (const s2 of [-1, 1]) sh.piece(strip(s2 * 70, 4, s2 * (v ? 64 : 70), -236, 16, 14), c, { round: 2, paint: (g) => { if (v) { g.fillStyle = '#2a2420'; g.fillRect(s2 * 70 - 9, -10, 18, 14); } } });
    sh.piece(rect(-92, -188, 92, -200), c, { round: 1.4, lift: 1.2 });
    if (v) sh.piece([[-112, -232], [-60, -238], [0, -240], [60, -238], [112, -232], [118, -250], [60, -252], [0, -254], [-60, -252], [-118, -250]], cd, { round: 2, lift: 1.6 }).piece([[-104, -222], [104, -222], [100, -234], [-100, -234]], c, { round: 1.4, lift: 1.4 });
    else sh.piece([[-104, -228], [104, -228], [106, -244], [-106, -244]], c, { round: 2, lift: 1.6 });
    if (v) sh.piece(rect(-7, -200, 7, -222), c, { round: 1, lift: 1 });
    return { spr: sh.finish({ shadowBlur: 5 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 3, 4); },
};

// Scaffolding: a tower of poles with a platform near the top.
KINDS.scaffold = {
  bake(mk, v = 0) {
    const h = v === 1 ? 420 : 300, sh = mk('scaffold' + v, [-60, -h - 20, 60, 6]), c = '#9a8462';
    for (const x of [-46, 46]) sh.piece(strip(x, 4, x * 0.9, -h, 5, 4), c, { round: 1 });
    for (let y = -40; y > -h; y -= 50) { sh.piece(strip(-48, y, 48, y, 3.4, 3.4), c, { round: 1, lift: 0.8 }); sh.piece(strip(-46, y, 44, y - 50, 2.4, 2.4), shade(c, -0.1), { round: 1, lift: 0.6 }); }
    sh.piece(rect(-56, -h + 30, 56, -h + 20), '#7a6448', { round: 1, lift: 1.2 });
    return { spr: sh.finish({ shadowBlur: 4 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 3, 4); },
};

// The Great Buddha of Tōdai-ji: seated on a lotus, one hand raised, under a golden halo.
// e.eyes(t): 0 blind, 1 painted in; e.shine(t) a golden light from him.
KINDS.daibutsu = {
  bake(mk, v = 0) {
    const r = rng(7300), br = v ? '#56685a' : '#4e4a3c', brl = shade(br, 0.16), P = {};
    const sh = mk('daibutsu' + v, [-260, -520, 260, 8]);
    // the halo, gold with small seated buddhas (Kamakura's sits in the open air, without one)
    if (!v) sh.piece(ellipse(0, -330, 200, 190, 40), '#b8913a', { round: 10, paint: (g) => { g.strokeStyle = 'rgba(255,230,150,.45)'; g.lineWidth = 3; for (const rr of [150, 170, 186]) { g.beginPath(); g.arc(0, -330, rr, 0, 7); g.stroke(); } g.fillStyle = 'rgba(120,80,20,.5)'; for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283, x = Math.cos(a) * 168, y = -330 + Math.sin(a) * 160; g.beginPath(); g.arc(x, y - 4, 4, 0, 7); g.fill(); g.beginPath(); g.ellipse(x, y + 5, 6, 5, 0, 0, 7); g.fill(); } } });
    // the lotus throne
    for (let k = 0; k < 9; k++) { const x = -200 + k * 50; sh.piece([[x - 26, 4], [x - 30, -30], [x, -60], [x + 30, -30], [x + 26, 4]], k % 2 ? '#5a5444' : '#625c4a', { round: 6, lift: 1, paint: (g) => { g.strokeStyle = 'rgba(200,180,120,.3)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, -54); g.lineTo(x, 0); g.stroke(); } }); }
    // the body: crossed legs, robe, torso
    sh.piece([[-210, -40], [210, -40], [200, -100], [140, -130], [-140, -130], [-200, -100]], br, { round: 20, lift: 1.6, paint: (g) => { g.strokeStyle = 'rgba(20,18,12,.35)'; g.lineWidth = 2; for (const k of [0, 1, 2, 3]) { g.beginPath(); g.moveTo(-180 + k * 30, -50); g.quadraticCurveTo(0, -110 + k * 6, 180 - k * 30, -50); g.stroke(); } } });
    sh.piece([[-120, -120], [120, -120], [130, -230], [100, -300], [60, -320], [-60, -320], [-100, -300], [-130, -230]], br, { round: 16, lift: 1.6, paint: (g) => { const gr = g.createLinearGradient(-130, 0, 130, 0); gr.addColorStop(0, 'rgba(10,8,4,.35)'); gr.addColorStop(0.45, 'rgba(255,230,170,.12)'); gr.addColorStop(1, 'rgba(10,8,4,.4)'); g.fillStyle = gr; g.fillRect(-140, -330, 280, 220); g.strokeStyle = 'rgba(20,18,12,.4)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-60, -318); g.quadraticCurveTo(-30, -220, 40, -140); g.stroke(); for (const k of [0, 1, 2]) { g.beginPath(); g.moveTo(-110 + k * 10, -250 + k * 30); g.quadraticCurveTo(-60, -200 + k * 30, -20, -160 + k * 20); g.stroke(); } } });
    // hands: the right raised (fear not), the left open in the lap
    sh.piece([[60, -210], [96, -250], [104, -300], [118, -306], [122, -250], [92, -200]], brl, { round: 8, lift: 1.4 });
    sh.piece([[-120, -130], [-40, -120], [-20, -136], [-60, -150], [-118, -152]], brl, { round: 8, lift: 1.4 });
    // the head: long ears, snail-shell curls, the urna
    sh.piece([[-62, -320], [62, -320], [70, -360], [66, -420], [40, -452], [-40, -452], [-66, -420], [-70, -360]], brl, { round: 20, lift: 1.6, paint: (g) => { g.fillStyle = 'rgba(20,16,10,.45)'; g.beginPath(); g.ellipse(0, -364, 8, 3, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(20,16,10,.5)'; g.lineWidth = 2.4; for (const s2 of [-1, 1]) { g.beginPath(); g.moveTo(s2 * 16, -392); g.quadraticCurveTo(s2 * 30, -398, s2 * 44, -392); g.stroke(); g.beginPath(); g.moveTo(s2 * 8, -340); g.quadraticCurveTo(0, -335, 0, -335); g.stroke(); } g.beginPath(); g.moveTo(-14, -342); g.quadraticCurveTo(0, -334, 14, -342); g.stroke(); g.fillStyle = 'rgba(255,230,160,.6)'; g.beginPath(); g.arc(0, -410, 3.4, 0, 7); g.fill(); } });
    for (const s2 of [-1, 1]) sh.piece([[s2 * 62, -410], [s2 * 82, -404], [s2 * 86, -330], [s2 * 74, -316], [s2 * 64, -340]], brl, { round: 6, lift: 1.2 });
    sh.piece([[-60, -440], [-40, -470], [0, -490], [40, -470], [60, -440], [40, -450], [-40, -450]], shade(br, -0.15), { round: 12, lift: 1.4, paint: (g) => { g.fillStyle = 'rgba(120,110,80,.5)'; for (let y = -484; y < -444; y += 8) for (let x = -56; x < 58; x += 8) { if (Math.abs(x) > 60 - (y + 490) * 0.1 - (y < -476 ? 20 : 0)) continue; g.beginPath(); g.arc(x + ((y / 8) & 1) * 4, y, 3, 0, 7); g.fill(); } } });
    P.spr = sh.finish({ shadowBlur: 9 });
    return P;
  },
  draw(g, P, t, e, env) {
    const sk = e.shine ? e.shine(t) : 0;
    if (sk > 0.01) {
      // rays from behind the halo, painted before him so he stands in front of them
      g.save(); g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 22; i++) { const a = (i / 22) * Math.PI * 2 + t * 0.04, len = 300 + 70 * Math.sin(t * 1.3 + i); g.strokeStyle = `rgba(255,226,150,${0.16 * sk})`; g.lineWidth = 12; g.beginPath(); g.moveTo(Math.cos(a) * 190, -330 + Math.sin(a) * 180); g.lineTo(Math.cos(a) * len * 1.25, -330 + Math.sin(a) * len * 1.2); g.stroke(); }
      const gr = g.createRadialGradient(0, -330, 120, 0, -330, 420); gr.addColorStop(0, `rgba(255,214,140,${0.3 * sk})`); gr.addColorStop(1, 'rgba(255,190,100,0)'); g.fillStyle = gr; g.fillRect(-440, -760, 880, 800); g.restore();
    }
    put(g, P.spr, env.sh, 6, 7);
    const k = e.eyes ? e.eyes(t) : 1;
    // the eyelids are always there; the pupils are painted in
    g.strokeStyle = 'rgba(20,16,10,.55)'; g.lineWidth = 2.4;
    for (const s2 of [-1, 1]) { g.beginPath(); g.moveTo(s2 * 14, -384); g.quadraticCurveTo(s2 * 30, -378 + 2, s2 * 44, -384); g.stroke(); }
    if (k > 0.01) { g.fillStyle = 'rgba(16,12,8,.9)'; for (const s2 of [-1, 1]) { g.beginPath(); g.ellipse(s2 * 29, -383, 6 * Math.min(1, k * 1.2), 2.6, 0, 0, 7); g.fill(); } }
  },
  glow(g, P, t, e, env, p) {
    const k = e.shine ? e.shine(t) : 0; if (k < 0.01 || p < 0.6) return;
    g.globalCompositeOperation = 'lighter';
    const gr = g.createRadialGradient(0, -390, 0, 0, -390, 120); gr.addColorStop(0, `rgba(255,226,160,${0.22 * k})`); gr.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = gr; g.fillRect(-130, -520, 260, 260);
    g.globalCompositeOperation = 'source-over';
  },
};

// A low writing desk with paper, a stone and a brush rest.
KINDS.jdesk = { bake(mk) { return { spr: mk('jdesk', [-46, -40, 46, 6]).piece(rect(-40, -26, 40, -32), '#5a3a28', { round: 1.5 }).piece(strip(-34, 4, -32, -26, 4, 4), '#4a2e20', { round: 1 }).piece(strip(34, 4, 32, -26, 4, 4), '#4a2e20', { round: 1 }).piece(rect(-30, -32, 18, -35), '#f2ead6', { round: 0.5, lift: 0.6, thick: 0.4 }).piece(rect(22, -32, 34, -38), '#2a2624', { round: 1, lift: 0.8 }).finish({ shadowBlur: 3 }) }; }, draw(g, P, t, e, env) { put(g, P.spr, env.sh, 2, 3); } };

// Two carpenters carrying a log of fresh cypress on their shoulders; e.move carries them, e.stop ends the walk.
KINDS.logcarry = {
  bake(mk, v = 0) { return { log: mk('logc' + v, [-90, -10, 90, 10]).piece([[-84, -7], [84, -8], [86, 7], [-86, 8]], '#e8cc94', { round: 4, paint: (g) => { g.strokeStyle = 'rgba(170,120,60,.4)'; g.lineWidth = 1; for (let y = -5; y < 7; y += 3) { g.beginPath(); g.moveTo(-84, y); g.lineTo(84, y); g.stroke(); } g.fillStyle = '#f4dca8'; g.beginPath(); g.ellipse(86, 0, 3, 7.4, 0, 0, 7); g.fill(); } }).finish({ shadowBlur: 3 }), a: puppet(mk, 'iseCarpW'), b: puppet(mk, 'iseCarpW2') }; },
  draw(g, P, t, e, env) {
    const walking = !e.stop || t < e.stop, ph = t * 4.6 + e.a;
    for (const [x, pp, o] of [[-56, P.b, 1.7], [52, P.a, 0]]) { g.save(); g.translate(x, 0); drawPerson(g, pp, t, e, env, walking ? { walk: ph + o, lean: 6, head: -4, back: [Math.sin(ph + o) * 18, -14], front: [-150, -40] } : { lean: 2, head: -6, back: [8, -8], front: [-150, -40] }); g.restore(); }
    g.save(); g.translate(0, -112 + (walking ? Math.abs(Math.cos(ph)) * 2 : 0)); put(g, P.log, env.sh, 2, 3); g.restore();
  },
};

// A small gilt-bronze Buddha on a stand, with its halo: one of the first statues to come from Korea.
KINDS.gilt = {
  bake(mk) {
    return { spr: mk('gilt', [-50, -130, 50, 6], { pad: 6 }).piece(ellipse(0, -76, 34, 40, 18), '#d8b04a', { round: 8, paint: (g) => { g.strokeStyle = 'rgba(255,240,180,.6)'; g.lineWidth = 1.6; g.beginPath(); g.arc(0, -76, 30, 0, 7); g.stroke(); } })
      .piece([[-22, 4], [22, 4], [18, -10], [-18, -10]], '#a8803a', { round: 3, lift: 1 })
      .piece([[-14, -10], [14, -10], [12, -56], [6, -64], [-6, -64], [-12, -56]], '#c89a3a', { round: 6, lift: 1.4, paint: (g) => { g.fillStyle = 'rgba(255,240,190,.35)'; g.fillRect(-12, -56, 8, 40); } })
      .piece(ellipse(0, -72, 8, 9, 12), '#d4a840', { round: 4, lift: 1.4, paint: (g) => { g.fillStyle = 'rgba(80,50,10,.6)'; g.beginPath(); g.arc(0, -80, 5, Math.PI, 0); g.fill(); } })
      .finish({ shadowBlur: 3 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 2, 3); },
  glow(g, P, t, e, env, p) { if (p < 0.6) return; g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(0, -70, 0, 0, -70, 70); gr.addColorStop(0, 'rgba(255,220,140,.3)'); gr.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = gr; g.fillRect(-70, -140, 140, 140); g.globalCompositeOperation = 'source-over'; },
};

// ================================================================== the Heian court ===
// A noble's hall in two parts, so the roof can be lifted off like the painted scrolls of Genji:
// KINDS.shinden is the raised floor and the painted screens inside; KINDS.shindenFront (drawn over the
// people inside) is the front posts, the bamboo blinds (e.blinds(t): 0 down, 1 rolled up, lit by e.lamp(t))
// and the cypress-bark roof (e.roof(t): 0 on, 1 lifted away on its threads).
const SHD = (v) => ({ w: v ? 110 : 170, fl: 58, h: v ? 120 : 130 });
KINDS.shinden = {
  bake(mk, v = 0) {
    const { w, fl, h } = SHD(v), r = rng(7400 + v), sh = mk('shinden' + v, [-w - 30, -fl - h - 20, w + 30, 6]);
    for (let x = -w; x <= w; x += (w * 2) / 6) sh.piece(strip(x, 4, x, -fl, 8, 8), '#5a3e2c', { round: 1.2 });
    // the interior: painted sliding screens, blue-green mountains on gold, and a band of tatami
    sh.piece(rect(-w, -fl, w, -fl - h), '#d8b866', { round: 1, lift: 1, paint: (g) => {
      g.fillStyle = '#e2c47a'; g.fillRect(-w, -fl - h, w * 2, h);
      for (let k = 0; k < 7; k++) { const x0 = -w + k * w * 0.32; g.fillStyle = k % 2 ? 'rgba(60,110,100,.75)' : 'rgba(80,130,120,.7)'; g.beginPath(); g.moveTo(x0 - 30, -fl - 20); g.quadraticCurveTo(x0 + 10, -fl - h * 0.75 - r() * 20, x0 + 50, -fl - 20); g.fill(); }
      g.fillStyle = 'rgba(40,80,120,.5)'; g.fillRect(-w, -fl - 24, w * 2, 8);
      g.strokeStyle = 'rgba(70,46,26,.6)'; g.lineWidth = 1.4; for (let x = -w; x <= w; x += (w * 2) / 6) { g.beginPath(); g.moveTo(x, -fl); g.lineTo(x, -fl - h); g.stroke(); }
    } });
    sh.piece(rect(-w - 14, -fl + 4, w + 14, -fl - 8), '#7a5a3e', { round: 1.2, lift: 1.4, paint: (g) => { g.fillStyle = 'rgba(200,190,120,.6)'; g.fillRect(-w, -fl - 8, w * 2, 4); } });
    sh.piece([[-26, 4], [-18, -fl], [18, -fl], [26, 4]], '#6a4c34', { round: 1, lift: 1.2, paint: (g) => { g.strokeStyle = 'rgba(40,24,14,.5)'; g.lineWidth = 1; for (let y = 0; y > -fl; y -= 7) { g.beginPath(); g.moveTo(-24, y); g.lineTo(24, y); g.stroke(); } } });
    return { spr: sh.finish({ shadowBlur: 6 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 4, 5); },
};
KINDS.shindenFront = {
  bake(mk, v = 0) {
    const { w, fl, h } = SHD(v), r = rng(7500 + v), P = {};
    const posts = mk('shdf-p' + v, [-w - 10, -fl - h - 10, w + 10, 6]);
    for (let x = -w; x <= w; x += (w * 2) / 3) posts.piece(strip(x, -fl, x, -fl - h, 9, 8), '#6a4630', { round: 1.2, lift: 1 });
    posts.piece(rect(-w - 6, -fl - h + 6, w + 6, -fl - h - 6), '#5a3e2c', { round: 1, lift: 1.2 });
    P.posts = posts.finish({ shadowBlur: 4 });
    const bw = (w * 2) / 3 - 10;
    P.blind = mk('shdf-b' + v, [-bw / 2 - 2, -2, bw / 2 + 2, h - 8]).piece(rect(-bw / 2, 0, bw / 2, h - 12), '#c8b07a', { round: 1, paint: (g) => { g.strokeStyle = 'rgba(110,80,40,.5)'; g.lineWidth = 0.9; for (let y = 3; y < h - 12; y += 3.2) { g.beginPath(); g.moveTo(-bw / 2, y); g.lineTo(bw / 2, y); g.stroke(); } g.fillStyle = '#8a3a3a'; g.fillRect(-bw / 2, 0, bw, 5); g.fillStyle = 'rgba(220,180,90,.8)'; for (const x of [-bw * 0.25, bw * 0.25]) g.fillRect(x - 1.5, 0, 3, h * 0.5); } }).finish({ shadowBlur: 2 });
    P.roll = mk('shdf-r' + v, [-bw / 2 - 2, -8, bw / 2 + 2, 8]).piece(ellipse(0, 0, bw / 2, 6, 14), '#c8b07a', { round: 4, paint: (g) => { g.fillStyle = '#8a3a3a'; g.fillRect(-bw / 2, -2, bw, 3); } }).finish({ shadowBlur: 2 });
    const rf = mk('shdf-roof' + v, [-w - 70, -110, w + 70, 10]);
    rf.piece(jroof(w + 10, 0, 90, 46, 6), '#4a3428', { round: 3, rough: 0.6, paint: (g) => { g.strokeStyle = 'rgba(20,10,6,.35)'; g.lineWidth = 1; for (let k = 0; k < 9; k++) { g.beginPath(); g.moveTo(-w * 1.3, -k * 9 - 4); g.lineTo(w * 1.3, -k * 9 - 4); g.stroke(); } g.fillStyle = 'rgba(160,120,90,.35)'; g.fillRect(-w - 60, -5, (w + 60) * 2, 4); } });
    rf.piece(rect(-w * 0.4 - 6, -88, w * 0.4 + 6, -98), '#2e2018', { round: 1.5, lift: 1.2 });
    P.roof = rf.finish({ shadowBlur: 6 });
    return P;
  },
  draw(g, P, t, e, env) {
    const v = e.v || 0, { w, fl, h } = SHD(v), up = e.blinds ? e.blinds(t) : 0, lift = e.roof ? e.roof(t) : 0, bw = (w * 2) / 3 - 10;
    put(g, P.posts, env.sh, 3, 4);
    for (let i = 0; i < 3; i++) { const cx = -w + (i + 0.5) * (w * 2) / 3, k = clamp(up * 1.3 - i * 0.15); g.save(); g.translate(cx, -fl - h + 6); if (k < 0.98) { g.save(); g.beginPath(); g.rect(-bw / 2 - 4, 0, bw + 8, (h - 10) * (1 - k)); g.clip(); put(g, P.blind, env.sh * 0.5, 1, 2); g.restore(); } g.translate(0, (h - 12) * (1 - k) + 2); put(g, P.roll, env.sh * 0.5, 1, 2); g.restore(); }
    // the roof, lifted on four threads
    const ly = -fl - h - lift * 300, tilt = lift * 4 * DEG * Math.sin(t * 0.6);
    if (lift > 0.01) { g.strokeStyle = 'rgba(200,190,175,.45)'; g.lineWidth = 1; for (const x of [-w * 0.8, w * 0.8]) { g.beginPath(); g.moveTo(x, ly - 60); g.lineTo(x + lift * 20, -2000); g.stroke(); } }
    g.save(); g.translate(0, ly); g.rotate(tilt); put(g, P.roof, env.sh * (1 - lift * 0.8), 4, 6 + lift * 30); g.restore();
  },
  glow(g, P, t, e, env, p) {
    const k = e.lamp ? e.lamp(t) : 0; if (k < 0.01 || p < 0.6) return;
    const v = e.v || 0, { w, fl, h } = SHD(v), up = e.blinds ? e.blinds(t) : 0, f = 0.88 + 0.12 * fbm(t * 5, e.a);
    g.globalCompositeOperation = 'lighter';
    const gr = g.createRadialGradient(0, -fl - h * 0.5, 0, 0, -fl - h * 0.5, w * 1.4); gr.addColorStop(0, `rgba(255,190,110,${0.35 * k * f})`); gr.addColorStop(1, 'rgba(255,170,90,0)'); g.fillStyle = gr; g.fillRect(-w * 1.5, -fl - h * 1.8, w * 3, h * 2.6);
    if (up < 0.9) { const bw = (w * 2) / 3 - 10; for (let i = 0; i < 3; i++) { const cx = -w + (i + 0.5) * (w * 2) / 3; g.fillStyle = `rgba(255,196,120,${0.32 * k * f * (1 - up)})`; g.fillRect(cx - bw / 2, -fl - h + 12, bw, (h - 18) * (1 - up)); } }
    g.globalCompositeOperation = 'source-over';
  },
};

// An ox-drawn court carriage with its lacquered cabin, bark roof and a blind at the front; e.move drives it.
KINDS.gissha = {
  bake(mk) {
    const P = {};
    P.cab = mk('gissha-c', [-80, -150, 120, 10]).piece(rect(-60, -40, 60, -120), '#2a2226', { round: 2, paint: (g) => { g.fillStyle = 'rgba(200,160,80,.7)'; g.fillRect(-56, -116, 112, 3); g.fillStyle = '#c8b07a'; g.fillRect(36, -112, 22, 66); g.strokeStyle = 'rgba(110,80,40,.6)'; g.lineWidth = 0.8; for (let y = -110; y < -46; y += 3) { g.beginPath(); g.moveTo(36, y); g.lineTo(58, y); g.stroke(); } } })
      .piece([[-76, -116], [-60, -140], [62, -140], [80, -116], [60, -122], [-58, -122]], '#4a3428', { round: 3, lift: 1.6 })
      .piece(strip(50, -46, 118, -40, 4, 3), '#3a2a20', { round: 1, lift: 1 }).piece(strip(50, -56, 118, -50, 4, 3), '#3a2a20', { round: 1, lift: 1 })
      .finish({ shadowBlur: 4 });
    P.wheel = mk('gissha-w', [-44, -44, 44, 44], { pad: 4 }).piece(ellipse(0, 0, 42, 42, 28), '#2a2226', { round: 6 }).piece(ellipse(0, 0, 34, 34, 24), '#6a5a48', { round: 6, lift: 0.4, paint: (g) => { g.strokeStyle = '#2a2226'; g.lineWidth = 2.4; for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8; g.beginPath(); g.moveTo(Math.cos(a) * 6, Math.sin(a) * 6); g.lineTo(Math.cos(a) * 34, Math.sin(a) * 34); g.stroke(); } } }).piece(ellipse(0, 0, 8, 8, 10), '#c9a24a', { round: 3, lift: 0.8 }).finish({ shadowBlur: 2 });
    P.ox = mk('gissha-o', [-70, -110, 80, 6]).piece([[-60, -40], [-58, -78], [-20, -88], [30, -88], [56, -74], [60, -44], [-56, -38]], '#2a2420', { round: 10, paint: (g) => { g.fillStyle = 'rgba(255,240,220,.08)'; g.fillRect(-56, -86, 110, 12); } })
      .piece([[46, -82], [62, -96], [78, -86], [74, -66], [58, -64]], '#2a2420', { round: 6, lift: 1.2, paint: (g) => { g.fillStyle = '#d8d0c0'; g.beginPath(); g.moveTo(58, -96); g.lineTo(52, -106); g.lineTo(62, -98); g.fill(); g.fillStyle = '#c8302a'; g.fillRect(48, -82, 4, 16); } })
      .finish({ shadowBlur: 3 });
    P.leg = mk('gissha-l', [-6, -4, 6, 46], { pad: 3 }).piece(rect(-4.5, -2, 4.5, 44), '#2a2420', { round: 2 }).finish({ shadowBlur: 2 });
    P.driver = puppet(mk, 'oxDriver');
    return P;
  },
  draw(g, P, t, e, env) {
    const moving = e.move && Math.abs(e.move(t + 0.05) - e.move(t)) > 0.001, ph = t * 3.6 + e.a, d = e.move ? e.move(t) * DEG * 1000 : 0;
    g.save(); g.translate(170, 0); for (const [x, o] of [[-46, 0], [-34, 1.6], [40, 3.2], [52, 4.8]]) { g.save(); g.translate(x, -44); g.rotate(moving ? Math.sin(ph + o) * 16 * DEG : 0); put(g, P.leg, env.sh, 2, 2); g.restore(); } put(g, P.ox, env.sh, 3, 4); g.restore();
    put(g, P.cab, env.sh, 3, 4);
    g.save(); g.translate(0, -42); g.rotate(d / 42); put(g, P.wheel, env.sh * 0.6, 2, 3); g.restore();
    g.save(); g.translate(250, 0); drawPerson(g, P.driver, t, e, env, moving ? { walk: ph * 1.4, lean: 4, head: -4, back: [10, -10], front: [-70, -30] } : { lean: 2, head: -6, back: [8, -8], front: [-70, -30] }); g.restore();
  },
};

// A dragon-headed pleasure boat on the garden pond, under a little canopy, with musicians aboard.
KINDS.ryutosen = {
  bake(mk) {
    const sh = mk('ryutosen', [-130, -170, 150, 10]);
    sh.piece([[-120, -30], [-100, 4], [90, 4], [120, -34], [100, -26], [-100, -24]], '#3a5a4a', { round: 4, paint: (g) => { g.fillStyle = 'rgba(220,180,80,.7)'; for (let x = -90; x < 90; x += 16) g.fillRect(x, -16, 8, 3); } });
    sh.piece([[104, -30], [118, -72], [134, -92], [148, -86], [140, -70], [126, -62], [120, -30]], '#2e7a5e', { round: 3, lift: 1.4, paint: (g) => { g.fillStyle = '#c9a24a'; g.beginPath(); g.arc(136, -84, 2.4, 0, 7); g.fill(); g.strokeStyle = '#c8302a'; g.lineWidth = 2; g.beginPath(); g.moveTo(130, -92); g.quadraticCurveTo(118, -110, 104, -104); g.stroke(); } });
    for (const x of [-60, 40]) sh.piece(strip(x, -24, x, -140, 4, 4), '#8a3a2a', { round: 1, lift: 1 });
    sh.piece([[-80, -136], [-10, -156], [60, -136], [40, -132], [-60, -132]], '#c8a050', { round: 2, lift: 1.6, paint: (g) => { g.fillStyle = 'rgba(160,40,30,.7)'; g.fillRect(-70, -136, 120, 4); } });
    return { spr: sh.finish({ shadowBlur: 5 }), a: puppet(mk, 'courtMusician'), b: puppet(mk, 'courtLadyKneel') };
  },
  draw(g, P, t, e, env) {
    g.translate(0, Math.sin(t * 1.0 + e.a) * 1.6); g.rotate(Math.sin(t * 0.8 + e.a) * 1.2 * DEG);
    g.save(); g.translate(-30, -22); drawPerson(g, P.b, t, e, env, { lean: 4, head: -14 + Math.sin(t * 0.4) * 4, back: [-30, -40], front: [-46, -40] }); g.restore();
    g.save(); g.translate(20, -22); drawPerson(g, P.a, t, e, env, { lean: 6, head: -8, back: [-60, -50], front: [-100, -40] }); g.restore();
    put(g, P.spr, env.sh, 3, 4);
  },
};

// A tall oil-lamp stand: its flame is drawn in the glow pass (e.lit(t)).
KINDS.todai = { bake(mk) { return { spr: mk('todai', [-16, -110, 16, 6]).piece(strip(0, 4, 0, -96, 3.4, 3), '#3a2a20', { round: 1 }).piece(ellipse(0, -96, 10, 2.6, 12), '#5a4030', { round: 1, lift: 1 }).piece(ellipse(0, 2, 12, 3, 12), '#3a2a20', { round: 1, lift: 1 }).finish({ shadowBlur: 2 }) }; }, draw(g, P, t, e, env) { put(g, P.spr, env.sh, 2, 2); }, glow(g, P, t, e, env, p) { const k = e.lit ? e.lit(t) : 1; if (k < 0.01 || p < 0.6) return; const f = 0.85 + 0.15 * fbm(t * 9, e.a); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(0, -102, 0, 0, -102, 60); gr.addColorStop(0, `rgba(255,220,150,${0.9 * k * f})`); gr.addColorStop(0.15, `rgba(255,170,80,${0.4 * k * f})`); gr.addColorStop(1, 'rgba(255,150,60,0)'); g.fillStyle = gr; g.fillRect(-60, -162, 120, 120); g.fillStyle = `rgba(255,236,190,${k})`; g.beginPath(); g.ellipse(0, -103, 2, 4.4 * f, 0, 0, 7); g.fill(); g.globalCompositeOperation = 'source-over'; } };

// ================================================================= the samurai ===
// Camp curtains on poles, with a great crest. v0 the Minamoto gentian, v1 two bars in a ring.
KINDS.jinmaku = {
  bake(mk, v = 0) {
    const sh = mk('jinmaku' + v, [-90, -120, 90, 6]);
    for (const x of [-84, 0, 84]) sh.piece(strip(x, 4, x, -112, 4, 3.4), '#5a4030', { round: 1 });
    sh.piece([[-86, -100], [86, -100], [86, -30], [-86, -30]], '#efe8d8', { round: 2, lift: 1.2, paint: (g) => { g.fillStyle = '#2a2a3a'; for (const y of [-92, -66, -40]) g.fillRect(-86, y, 172, 7); g.fillStyle = '#efe8d8'; g.beginPath(); g.arc(0, -66, 22, 0, 7); g.fill(); g.fillStyle = '#2a2a3a'; if (v) { g.fillRect(-16, -74, 32, 5); g.fillRect(-16, -62, 32, 5); g.strokeStyle = '#2a2a3a'; g.lineWidth = 2.4; g.beginPath(); g.arc(0, -66, 19, 0, 7); g.stroke(); } else { for (const a of [-0.6, 0, 0.6]) { g.save(); g.translate(0, -60); g.rotate(a); g.beginPath(); g.ellipse(0, -10, 4, 10, 0, 0, 7); g.fill(); g.restore(); } g.beginPath(); g.moveTo(-8, -54); g.lineTo(0, -48); g.lineTo(8, -54); g.fill(); } } });
    return { spr: sh.finish({ shadowBlur: 4 }) };
  },
  draw(g, P, t, e, env) { g.rotate(fbm(t * 0.8 + e.a, 4) * 1.2 * DEG); put(g, P.spr, env.sh, 3, 4); },
};
// A folding field stool (shōgi), for the general.
KINDS.shogi = { bake(mk) { return { spr: mk('shogi', [-26, -40, 26, 6]).piece(strip(-20, 4, 20, -34, 3, 3), '#4a3428', { round: 1 }).piece(strip(20, 4, -20, -34, 3, 3), '#3a2a20', { round: 1, lift: 0.8 }).piece(rect(-22, -32, 22, -38), '#7a2a2a', { round: 1, lift: 1 }).finish({ shadowBlur: 2 }) }; }, draw(g, P, t, e, env) { put(g, P.spr, env.sh, 2, 2); } };
// A stone sea wall, built against the Mongols.
KINDS.stonewall = {
  bake(mk, v = 0) {
    const r = rng(7600 + v), sh = mk('stonewall' + v, [-60, -80, 60, 6]);
    sh.piece([[-58, 4], [-54, -66], [54, -70], [58, 4]], '#8a8478', { round: 3, rough: 1.4, paint: (g) => { for (let y = 0; y > -70; y -= 12) for (let x = -56 + ((y / 12) & 1) * 10; x < 56; x += 20) { g.fillStyle = r() < 0.5 ? 'rgba(60,56,50,.35)' : 'rgba(200,196,186,.25)'; g.beginPath(); g.ellipse(x + 8, y - 6, 9, 5.4, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(40,36,30,.4)'; g.lineWidth = 1; g.stroke(); } } });
    return { spr: sh.finish({ shadowBlur: 4 }) };
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 3, 4); },
};
// The swordsmith's forge: a clay hearth with its fire, the box bellows, an anvil, a water trough, and the
// sacred rope over it all. e.pump(t) works the bellows.
KINDS.forge = {
  bake(mk) {
    const P = {}, sh = mk('forge', [-160, -230, 160, 6]);
    sh.piece([[-150, -210], [150, -210], [150, -200], [-150, -200]], '#c8b07a', { round: 2, rough: 1, paint: (g) => { g.strokeStyle = 'rgba(120,90,40,.6)'; g.lineWidth = 1; for (let x = -146; x < 150; x += 6) { g.beginPath(); g.moveTo(x, -210); g.lineTo(x + 3, -200); g.stroke(); } } });
    for (const x of [-110, -50, 10, 70, 130]) sh.piece([[x - 6, -200], [x + 6, -200], [x + 4, -170], [x + 8, -164], [x - 2, -168]], '#f4f0e6', { round: 0.6, lift: 0.6, thick: 0.4 });
    sh.piece([[-70, 4], [-74, -60], [-40, -84], [20, -84], [40, -60], [40, 4]], '#9a6a4a', { round: 6, rough: 1.2, paint: (g) => { g.fillStyle = 'rgba(20,10,6,.95)'; g.beginPath(); g.ellipse(-14, -52, 16, 12, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(60,30,14,.4)'; g.lineWidth = 1.2; for (let y = -6; y > -80; y -= 10) { g.beginPath(); g.moveTo(-70, y); g.lineTo(40, y); g.stroke(); } } });
    sh.piece(rect(-150, -6, -84, -64), '#6a4a30', { round: 2, lift: 1.2, paint: (g) => { g.strokeStyle = 'rgba(30,18,10,.5)'; g.lineWidth = 1.2; for (let x = -146; x < -86; x += 9) { g.beginPath(); g.moveTo(x, -6); g.lineTo(x, -64); g.stroke(); } } });
    sh.piece(rect(70, 4, 104, -26), '#3a3438', { round: 2, lift: 1.2, paint: (g) => { g.fillStyle = 'rgba(200,200,210,.3)'; g.fillRect(70, -26, 34, 4); } });
    sh.piece(rect(118, 4, 158, -22), '#5a4030', { round: 2, lift: 1.2, paint: (g) => { g.fillStyle = 'rgba(60,90,110,.9)'; g.fillRect(120, -22, 36, 6); } });
    P.spr = sh.finish({ shadowBlur: 6 });
    P.handle = mk('forge-h', [-40, -6, 4, 6], { pad: 3 }).piece(rect(-38, -3, 0, 3), '#4a3428', { round: 1 }).finish({ shadowBlur: 2 });
    return P;
  },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 3, 4); const k = e.pump ? e.pump(t) : 0; g.save(); g.translate(-150 - k * 24, -36); put(g, P.handle, env.sh, 2, 2); g.restore(); },
};

// A tall banner on a pole with a crest: v0 the Minamoto's bamboo and gentian, v1 the Ashikaga's two bars,
// v2 the Tokugawa's three hollyhock leaves.
KINDS.nobori = {
  bake(mk, v = 0) {
    const col = ['#efe8d8', '#efe8d8', '#efe8d8'][v], mark = ['#2a2a3a', '#2a2a3a', '#2a2a3a'][v], sh = mk('nobori' + v, [-40, -290, 40, 6]);
    sh.piece(strip(-24, 4, -24, -280, 4, 3.4), '#3a2a20', { round: 1 });
    sh.piece(rect(-24, -270, 24, -60), col, { round: 1.5, lift: 1.2, paint: (g) => {
      g.fillStyle = mark; for (let y = -264; y < -60; y += 18) g.fillRect(-28, y, 4, 4);
      g.save(); g.translate(0, -214); g.fillStyle = mark; g.strokeStyle = mark; g.lineWidth = 2.2; g.beginPath(); g.arc(0, 0, 17, 0, 7); g.stroke();
      if (v === 1) { g.fillRect(-13, -7, 26, 4.6); g.fillRect(-13, 3, 26, 4.6); }
      else if (v === 2) { for (const a of [0, 2.094, 4.189]) { g.save(); g.rotate(a); g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-9, -4, -8, -15, 0, -14); g.bezierCurveTo(8, -15, 9, -4, 0, 0); g.fill(); g.restore(); } }
      else { for (const a of [-0.5, 0, 0.5]) { g.save(); g.rotate(a); g.beginPath(); g.ellipse(0, -8, 3.4, 8, 0, 0, 7); g.fill(); g.restore(); } g.beginPath(); g.moveTo(-9, 6); g.lineTo(0, 12); g.lineTo(9, 6); g.lineTo(0, 3); g.fill(); }
      g.restore();
    } });
    return { spr: sh.finish({ shadowBlur: 4 }) };
  },
  draw(g, P, t, e, env) { g.rotate((fbm(t * 0.9 + e.a, 3) * 2 + Math.sin(t * 2.2 + e.a) * 0.6) * DEG); put(g, P.spr, env.sh, 3, 4); },
};
// A koto: a long zither of paulownia, with its bridges.
KINDS.koto = { bake(mk) { return { spr: mk('koto', [-80, -20, 80, 6]).piece([[-76, -8], [74, -14], [76, -6], [-74, 2]], '#a8783e', { round: 3, paint: (g) => { g.strokeStyle = 'rgba(240,230,210,.7)'; g.lineWidth = 0.6; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(-70, -8 + k * 0.4); g.lineTo(70, -13 + k * 0.4); g.stroke(); } g.fillStyle = '#efe6d2'; for (let k = 0; k < 9; k++) g.fillRect(-56 + k * 13, -14 + k * 0.2 - (k % 3), 2, 4); } }).finish({ shadowBlur: 2 }) }; }, draw(g, P, t, e, env) { put(g, P.spr, env.sh, 2, 2); } };
// A curtain stand (kichō): silk hung from a T-shaped frame, to screen a lady from view.
KINDS.kicho = { bake(mk) { return { spr: mk('kicho', [-50, -130, 50, 6]).piece(strip(0, 4, 0, -124, 4, 3), '#2a2420', { round: 1 }).piece(rect(-44, -120, 44, -126), '#2a2420', { round: 1, lift: 1 }).piece([[-42, -118], [42, -118], [44, -6], [-44, -6]], '#c8604a', { round: 2, lift: 1.2, paint: (g) => { g.fillStyle = '#e8c070'; for (const x of [-28, 0, 28]) g.fillRect(x - 3, -118, 6, 112); g.fillStyle = 'rgba(255,255,255,.15)'; for (let k = 0; k < 6; k++) { g.beginPath(); g.ellipse(-30 + k * 12, -70, 4, 6, 0, 0, 7); g.fill(); } } }).finish({ shadowBlur: 3 }) }; }, draw(g, P, t, e, env) { g.rotate(fbm(t * 0.5 + e.a, 2) * 0.8 * DEG); put(g, P.spr, env.sh, 2, 3); } };
// A Kamakura-era rider: gallops in, then stands (e.stopAt).
KINDS.samurider = {
  bake(mk, v) { return KINDS.rider.bake(mk, v); },
  draw(g, P, t, e, env) { e.gait = t < (e.stopAt ?? 1e9) ? 'gallop' : 'stand'; KINDS.rider.draw(g, P, t, e, env); },
};
