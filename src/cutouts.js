// The cut-outs: every prop and puppet, designed in globe units (planet radius = 1000).
// Each kind has bake(mk) -> parts, and draw(g, parts, t, e, env) for its small movements.
import { Sheet, put, ellipse, strip, KRAFT, KRAFT_DARK } from './paper.js';
import { rng, fbm, noise, DEG, hashStr, shade, mix, rgb, clamp, smooth, sramp, spring } from './util.js';

const dab = (g, r, n, box, cols, len = 6, w = 2) => {
  g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = box[0] + r() * (box[2] - box[0]), y = box[1] + r() * (box[3] - box[1]), a = (r() - 0.5) * 1.2;
    g.strokeStyle = cols[(r() * cols.length) | 0]; g.lineWidth = w * (0.6 + r() * 0.8);
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * len * (0.5 + r()), y + Math.sin(a) * len * 0.4); g.stroke();
  }
};

// Umbrella-thorn canopy: flat underside, lumpy top.
function canopyPts(cx, cy, rx, ry, r) {
  const pts = [], n = 9;
  for (let i = 0; i <= n; i++) {
    const a = Math.PI - (i / n) * Math.PI, lump = 0.78 + r() * 0.4;
    pts.push([cx + Math.cos(a) * rx * (0.96 + r() * 0.06), cy - Math.sin(a) * ry * lump - 2]);
  }
  pts.push([cx + rx * 0.72, cy + 5 + r() * 3], [cx + rx * 0.2, cy + 3 + r() * 4], [cx - rx * 0.3, cy + 6 + r() * 3], [cx - rx * 0.75, cy + 4 + r() * 3]);
  return pts;
}

export const KINDS = {};

// ---------------------------------------------------------------- acacia ---
KINDS.acacia = {
  bake(mk, v = 0) {
    const r = rng(101 + v * 17);
    const greens = [['#77823f', '#8d9549', '#687238'], ['#6d7a3c', '#858f47', '#5f6b36'], ['#808443', '#969a52', '#6c7038']][v % 3];
    const trunk = mk('acacia-trunk' + v, [-110, -235, 110, 6])
      .piece([[-11, 2], [-7, -60], [-9, -108], [-52, -160], [-96, -184], [-93, -193], [-47, -174], [-12, -138], [-7, -198], [-3, -224], [6, -224], [7, -196], [9, -136], [40, -165], [90, -183], [93, -174], [48, -151], [15, -110], [10, -60], [13, 2]], '#5a4130', {
        round: 2.5, paint: (g) => dab(g, r, 26, [-20, -220, 20, 0], ['rgba(40,26,18,0.35)', 'rgba(150,115,80,0.3)'], 9, 1.6),
      })
      .piece([[-17, 3], [17, 3], [15, -4], [-14, -4]], KRAFT, { round: 1, lift: 1.2, thick: 1 }) // glue tab
      .finish();
    const can = (name, cx, cy, rx, ry, ci) => {
      const sh = mk(name, [-rx - 8, -ry * 1.4 - 8, rx + 8, 14]);
      sh.piece(canopyPts(0, 0, rx, ry, r), greens[ci], {
        round: 7, rough: 2.2, seg: 18,
        paint: (g) => { dab(g, r, 60, [-rx, -ry * 1.3, rx, 6], [rgb(shade(greens[ci], 0.16), 0.5), rgb(shade(greens[ci], -0.22), 0.45)], 9, 2.6); },
      });
      return { spr: sh.finish(), cx, cy, ph: r() * 10 };
    };
    return {
      trunk,
      canopies: [can('acacia-c0' + v, -84, -192, 84, 26, 2), can('acacia-c2' + v, 86, -186, 76, 23, 0), can('acacia-c1' + v, 3, -224, 108, 31, 1)],
    };
  },
  draw(g, p, t, e, env) {
    const wind = fbm(t * 0.35 + e.a * 0.31, 3) * 1.1 * DEG;
    g.rotate(wind * 0.4);
    put(g, p.trunk, env.sh);
    for (const c of p.canopies) {
      g.save(); g.translate(c.cx, c.cy);
      g.rotate(wind + fbm(t * 0.6 + c.ph, 5) * 1.3 * DEG);
      put(g, c.spr, env.sh, 3, 5);
      g.restore();
    }
  },
};

// ----------------------------------------------------------------- grass ---
KINDS.grass = {
  bake(mk, v = 0) {
    const r = rng(300 + v * 31), cols = ['#b39a50', '#9d9248', '#c0a65e', '#8d8a45'];
    const n = 5 + (v % 3), pts = [[-n * 2.4, 2]];
    for (let i = 0; i < n; i++) {
      const x = -n * 2.2 + i * 4.4, lean = (i - n / 2) * 3.2 + (r() - 0.5) * 6, h = 16 + r() * 20;
      pts.push([x + lean, -h, 0.3], [x + 3.2, -2 - r() * 3, 0.5]);
    }
    pts.push([n * 2.4, 2]);
    return { spr: mk('grass' + v, [-26, -40, 26, 5], { pad: 6 }).piece(pts, cols[v % 4], { round: 0.6, rough: 0.5, thick: 1, rim: 0.35 }).finish({ shadowBlur: 3 }), ph: r() * 20 };
  },
  draw(g, p, t, e, env) {
    g.rotate((fbm(t * 0.7 + e.a * 0.9 + p.ph, 9) * 5 + Math.sin(t * 1.3 + e.a) * 1.2) * DEG);
    put(g, p.spr, env.sh * 0.6, 2, 2);
  },
};

// ------------------------------------------------------------------ rock ---
KINDS.rock = {
  bake(mk, v = 0) {
    const r = rng(500 + v * 13), w = 26 + r() * 22, h = 14 + r() * 14;
    const base = ['#8a7d70', '#7c746c', '#94836f'][v % 3];
    const sh = mk('rock' + v, [-w - 4, -h - 6, w + 4, 6], { pad: 6 });
    sh.piece([[-w, 3], [-w * 0.8, -h * 0.55], [-w * 0.3, -h], [w * 0.35, -h * 0.9], [w * 0.85, -h * 0.4], [w, 3]], base, { round: 2.5, rough: 1.6 });
    sh.piece([[-w * 0.62, -h * 0.5], [-w * 0.25, -h * 0.86], [w * 0.3, -h * 0.78], [w * 0.1, -h * 0.42]], shade(base, 0.16), { round: 2, lift: 1, thick: 0.8, rim: 0.3 });
    return { spr: sh.finish({ shadowBlur: 4 }) };
  },
  draw(g, p, t, e, env) { put(g, p.spr, env.sh, 2, 3); },
};

// ----------------------------------------------------------------- people --
// Jointed card puppets held together with brass fasteners. Facing +x.
const SKINS = [['#70482f', '#5d3a26'], ['#7d5236', '#68422b'], ['#65412c', '#523322']];
const HIDES = ['#b88a52', '#a35f3c', '#c29a62', '#8e6a48'];

function bakePerson(mk, id, o) {
  const [skin, skinD] = SKINS[o.skin ?? 0], hide = HIDES[o.hide ?? 0], r = rng(900 + hashStr(id));
  const P = {};
  const lite = { thick: 1.1, lift: 1.6, rough: 0.5, seg: 40 };
  P.torso = mk(id + '-torso', [-18, -44, 18, 8], { pad: 6 })
    .piece([[-11, 3], [11, 3], [12.5, -18], [14.5, -34], [8, -40], [-8, -40], [-14.5, -34], [-12.5, -18]], skin, { ...lite, round: 5 })
    .piece(o.strap
      ? [[-13.5, 5], [13.5, 5], [14.5, -15], [9, -39], [3, -40.5], [-13, -13]]
      : [[-13.5, 5], [13.5, 5], [14.5, -14], [-14, -12]], hide, {
      ...lite, round: 2, paint: (g) => dab(g, r, 14, [-14, -38, 14, 4], [rgb(shade(hide, -0.3), 0.4), rgb(shade(hide, 0.2), 0.35)], 5, 1.3),
    })
    .finish({ shadowBlur: 3 });
  P.head = mk(id + '-head', [-14, -30, 15, 4], { pad: 6 })
    .piece([[-4, 2], [4, 2], [5, -4], [9, -6], [10.2, -11], [12.6, -13.2, 0.8], [10.2, -16], [9.2, -22], [4, -26], [-3, -26.5], [-9, -23], [-11, -16], [-9, -8], [-5, -5]], skin, { ...lite, round: 3.2 })
    .piece(o.hair === 'long'
      ? [[-11.8, -15], [-9.8, -23.8], [-3, -27.8], [4.6, -27.2], [9.8, -22.6], [9.2, -19], [2, -21], [-3, -16], [-5, -6], [-9, 0], [-13.5, -3]]
      : [[-11.8, -15], [-9.8, -23.8], [-3, -27.8], [4.6, -27.2], [9.8, -22.6], [9.2, -19], [2, -21.5], [-4, -18], [-7, -11], [-10.4, -9]], '#2a1c15', { ...lite, round: 2.5, rim: 0.25 })
    .finish({ shadowBlur: 3 });
  { const g = P.head; const c = g.img.getContext('2d'); } // (eye is painted below via sheet API)
  const limb = (name, len, w0, w1, hand) => {
    const sh = mk(id + name, [-6, -4, 7, len + 6], { pad: 5 });
    const pts = [[-w0 / 2, -2.5], [w0 / 2, -2.5], [w1 / 2 + 0.2, len * 0.6], [w1 / 2, len - 2]];
    if (hand) pts.push([w1 / 2 + 0.8, len + 3], [-w1 / 2 + 0.6, len + 4.5], [-w1 / 2 - 0.4, len]); else pts.push([-w1 / 2, len - 2]);
    pts.push([-w1 / 2 - 0.2, len * 0.6]);
    return sh.piece(pts, skin, { ...lite, round: 2.6 }).brad(0, 0, 1.5).finish({ shadowBlur: 3 });
  };
  P.upper = limb('-upper', 20, 7.6, 6.2, false);
  P.fore = limb('-fore', 19, 6.2, 5, true);
  const leg = (sh, dx, col) => sh.piece([[-4.8 + dx, -3], [4.8 + dx, -3], [4.2 + dx, 26], [3.3 + dx, 48], [9.5 + dx, 52], [9.5 + dx, 54.6], [-3.6 + dx, 54.6], [-3.8 + dx, 26]], col, { ...lite, round: 2.2 });
  if (o.pose === 'stand') {
    const sh = mk(id + '-legs', [-14, -6, 18, 58], { pad: 6 });
    leg(sh, -5, skinD); leg(sh, 4.5, skin);
    P.legs = sh.finish({ shadowBlur: 3 }); P.hip = 54;
  } else if (o.pose === 'kneel') {
    P.legs = mk(id + '-legs', [-22, -8, 34, 34], { pad: 6 })
      .piece([[-5, -4], [5, -5], [28, 20], [30.5, 27], [27, 31], [-15, 31], [-19, 28.5], [-15, 24.5], [14, 23], [-2, 6], [-7.5, 3]], skin, { ...lite, round: 3 })
      .finish({ shadowBlur: 3 }); P.hip = 30.5;
  } else {
    P.legs = mk(id + '-legs', [-10, -32, 48, 12], { pad: 6 })
      .piece([[-7.5, -4], [2, -7], [21, -28.5], [28.5, -27], [31, -20], [37.5, 4], [44.5, 5.5], [44.5, 9], [29.5, 9], [24.5, -11], [9, 7], [-6, 8.6]], skin, { ...lite, round: 3 })
      .finish({ shadowBlur: 3 }); P.hip = 8.6;
  }
  return P;
}
// Draw a two-part arm from the shoulder; returns nothing, leaves context untouched.
function arm(g, P, sx, sy, a1, a2, sh, held) {
  g.save(); g.translate(sx, sy); g.rotate(a1 * DEG);
  g.save(); g.translate(0, 19); g.rotate(a2 * DEG);
  if (held) held(g);
  put(g, P.fore, sh, 1.5, 2);
  g.restore();
  put(g, P.upper, sh, 1.5, 2);
  g.restore();
}
function person(g, P, t, o) {
  // o: lean, headTilt, back:[a1,a2], front:[a1,a2], sh, held
  g.save(); g.translate(0, -P.hip);
  if (o.backLegs !== false) put(g, P.legs, o.sh, 2, 3);
  g.rotate(o.lean * DEG);
  if (o.back) arm(g, P, -3, -35, o.back[0], o.back[1], 0, null);
  put(g, P.torso, o.sh, 2, 3);
  g.save(); g.translate(0.5, -38.5); g.rotate(o.headTilt * DEG); g.scale(o.headScale || 1, o.headScale || 1); put(g, P.head, o.sh * 0.6, 1.5, 2); g.restore();
  if (o.front) arm(g, P, 2, -34.5, o.front[0], o.front[1], o.sh * 0.5, o.held);
  g.restore();
}

// The one who tends the ember. Kneeling, carrying a smouldering stick.
KINDS.tender = {
  bake(mk) {
    const P = bakePerson(mk, 'tender', { pose: 'kneel', skin: 0, hide: 1, strap: true, hair: 'long' });
    P.stick = mk('tender-stick', [-3, -4, 4, 40], { pad: 5 })
      .piece(strip(0, -2, 0.6, 36, 3.2, 2.2), '#4a3423', { round: 1, thick: 0.9, rough: 0.6 })
      .piece([[-1.6, 30], [2.2, 30], [2, 37], [-1, 37]], '#201510', { round: 1, lift: 0, thick: 0, rim: 0 })
      .finish({ shadowBlur: 2 });
    return P;
  },
  draw(g, P, t, e, env) {
    const f = env.fire; // {blow: 0..1 pulses, reach: 0..1, lit: 0..1}
    const breathe = Math.sin(t * 1.1 + 1) * 0.8;
    const lean = 24 + breathe + f.reach * 9 + f.blow * 5 - f.lit * 7;
    const a1 = -38 - f.reach * 22 + f.lit * 16 + Math.sin(t * 0.9) * 1.5;
    const a2 = -58 + f.reach * 20 - f.lit * 12 + fbm(t * 0.8, 2) * 3;
    person(g, P, t, {
      lean, headTilt: -8 + f.reach * 6 + f.blow * 4 + fbm(t * 0.4, 7) * 2.5, sh: env.sh,
      back: [a1 + 14, a2 + 10], front: [a1, a2],
      held: (g2) => { g2.save(); g2.translate(0.5, 20); g2.rotate((-62 + f.reach * 14) * DEG); put(g2, P.stick, env.sh * 0.5, 1, 2); g2.restore(); },
    });
  },
  // world-space position (design units, entity-local) of the stick's glowing tip
  tip(t, f) {
    const breathe = Math.sin(t * 1.1 + 1) * 0.8;
    const lean = (24 + breathe + f.reach * 9 + f.blow * 5 - f.lit * 7) * DEG;
    const a1 = (-38 - f.reach * 22 + f.lit * 16 + Math.sin(t * 0.9) * 1.5) * DEG, a2 = (-58 + f.reach * 20 - f.lit * 12 + fbm(t * 0.8, 2) * 3) * DEG;
    const rot = (x, y, a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
    let p = rot(0.6, 35, (-62 + f.reach * 14) * DEG); p = [p[0] + 0.5, p[1] + 20];
    p = rot(p[0], p[1], a2); p = [p[0], p[1] + 19];
    p = rot(p[0], p[1], a1); p = [p[0] + 2, p[1] - 34.5];
    p = rot(p[0], p[1], lean);
    return [p[0], p[1] - 30.5];
  },
};

KINDS.sitter = {
  bake(mk) { return bakePerson(mk, 'sitter', { pose: 'sit', skin: 1, hide: 0, strap: false }); },
  draw(g, P, t, e, env) {
    const warm = env.fire.lit;
    person(g, P, t, {
      lean: 10 + Math.sin(t * 0.8 + 2) * 1.0 + warm * 5, headTilt: -4 + fbm(t * 0.3, 21) * 4 + warm * 3, sh: env.sh,
      back: [-34 - warm * 8, -52], front: [-28 - warm * 22 + Math.sin(t * 0.7) * 2, -64 + warm * 10 + fbm(t * 0.9, 4) * 4],
    });
  },
};

KINDS.elder = {
  bake(mk) {
    const P = bakePerson(mk, 'elder', { pose: 'stand', skin: 2, hide: 3, strap: true, hair: 'long' });
    P.staff = mk('elder-staff', [-4, -128, 5, 4], { pad: 5 }).piece(strip(0.5, -124, 0, 2, 3, 4.2), '#5b4331', { round: 1.2, thick: 1, rough: 0.9, seg: 30 }).finish({ shadowBlur: 3 });
    return P;
  },
  draw(g, P, t, e, env) {
    const sway = fbm(t * 0.25, 31) * 1.2;
    g.save(); g.translate(19, 0); g.rotate((-3 + sway * 0.5) * DEG); put(g, P.staff, env.sh, 2, 3); g.restore();
    person(g, P, t, { lean: 4 + sway, headTilt: 3 + fbm(t * 0.3, 33) * 3 + env.fire.lit * 4, sh: env.sh, back: [8, -6], front: [-34 + sway, -62] });
  },
};

KINDS.child = {
  bake(mk) { return bakePerson(mk, 'child', { pose: 'stand', skin: 1, hide: 2, strap: false }); },
  draw(g, P, t, e, env) {
    const warm = env.fire.lit;
    // a small delighted bounce once the fire is up
    const hop = warm > 0.5 ? Math.max(0, Math.sin(t * 2.6)) * Math.max(0, Math.sin(t * 0.37 + 1)) ** 4 * 5 : 0;
    g.translate(0, -hop); g.scale(0.64, 0.64);
    person(g, P, t, {
      lean: 3 + warm * 5 + Math.sin(t * 1.2) * 1, headTilt: -3 + fbm(t * 0.5, 41) * 5, headScale: 1.22, sh: env.sh,
      back: [-20 - warm * 50 + Math.sin(t * 1.7) * 3, -30 - warm * 12], front: [-10 - warm * 62 + Math.sin(t * 1.9 + 1) * 4, -24 - warm * 16],
    });
  },
};

// ------------------------------------------------------------------ fire ---
KINDS.logs = {
  bake(mk) {
    const sh = mk('logs', [-30, -22, 30, 6], { pad: 6 });
    sh.piece(strip(-24, 1, 14, -13, 6, 5), '#4b3525', { round: 1.5, thick: 1 });
    sh.piece(strip(25, 2, -12, -15, 6, 4.6), '#3d2a1d', { round: 1.5, thick: 1, lift: 1.5 });
    sh.piece(strip(-13, 3, 19, 2, 6.4, 5.4), '#55402c', { round: 1.5, thick: 1, lift: 1.5 });
    return { spr: sh.finish({ shadowBlur: 3 }) };
  },
  draw(g, p, t, e, env) { put(g, p.spr, env.sh, 2, 3); },
};
// Flames are cardboard too: three paper tongues that never sit still.
export function bakeFlames(mk) {
  const tongue = (name, h, w, col, r) => mk(name, [-w - 4, -h - 6, w + 4, 4], { pad: 5 })
    .piece([[-w * 0.8, 1], [-w, -h * 0.22], [-w * 0.5, -h * 0.5], [-w * 0.66, -h * 0.72], [-w * 0.1, -h], [w * 0.2, -h * 0.76], [w * 0.62, -h * 0.58], [w * 0.45, -h * 0.38], [w * 0.95, -h * 0.2], [w * 0.75, 1]], col, { round: 3.5, thick: 0.8, lift: 1, rim: 0.3, rough: 1, blotch: 0.4, grain: 0.35 })
    .finish({ shadowBlur: 2 });
  return [tongue('flame0', 56, 16, '#e0582a'), tongue('flame1', 42, 12, '#f59a2f'), tongue('flame2', 26, 8, '#ffdc7a')];
}

// --------------------------------------------------------------- gazelle ---
KINDS.gazelle = {
  bake(mk) {
    const r = rng(77), tan = '#c2935a', tanD = '#a87c49';
    const P = {};
    const legs = mk('gaz-legs', [-30, -4, 30, 40], { pad: 5 });
    for (const [x, lean, c] of [[-20, -2, tanD], [15, 2, tanD], [-15, 2, tan], [20, -1, tan]]) legs.piece(strip(x, -2, x + lean, 36, 5, 2.6), c, { round: 1, thick: 0.8, lift: 1, rough: 0.4 });
    P.legs = legs.finish({ shadowBlur: 3 });
    P.body = mk('gaz-body', [-34, -18, 32, 16], { pad: 5 })
      .piece([[-28, -6], [-20, -13], [0, -12], [18, -14], [27, -8], [28, 2], [18, 9], [-2, 8], [-22, 10], [-30, 3]], tan, {
        round: 6, paint: (g) => { g.fillStyle = 'rgba(250,240,220,0.85)'; g.fillRect(-34, 5, 70, 12); g.fillStyle = 'rgba(50,32,20,0.75)'; g.beginPath(); g.ellipse(-2, 3.5, 22, 2.6, -0.05, 0, 7); g.fill(); },
      })
      .piece([[-28, -4], [-33, 2], [-31, 9], [-27, 3]], '#3a2a1f', { round: 1, lift: 1, thick: 0.6, rim: 0.2 })
      .finish({ shadowBlur: 3 });
    P.neck = mk('gaz-neck', [-10, -64, 28, 8], { pad: 5 })
      .piece([[5.5, -36], [3, -48], [4.6, -60], [6.6, -60], [6.2, -48], [9, -36.5]], '#33261d', { round: 0.8, thick: 0.6, lift: 0, rim: 0.15, rough: 0.3 })
      .piece([[2, -35], [-5.5, -46], [-1.5, -32.5]], tanD, { round: 1, lift: 0, thick: 0.6, rough: 0.3 })
      .piece([[-6, 3], [-2, -12], [1, -24], [0, -31], [3, -36], [9, -37.5], [14, -34], [23, -27.5], [23.5, -24], [20, -22.5], [11, -24.5], [8, -13], [7, 4]], tan, {
        round: 2.6, rough: 0.5, paint: (g) => { g.fillStyle = 'rgba(40,26,18,0.9)'; g.beginPath(); g.arc(11.5, -31.5, 1.2, 0, 7); g.fill(); g.fillStyle = 'rgba(40,26,18,0.55)'; g.fillRect(13, -30.5, 9, 1.6); g.fillStyle = 'rgba(250,240,220,0.7)'; g.fillRect(14, -27, 12, 4); },
      })
      .brad(0, 0, 1.4)
      .finish({ shadowBlur: 3 });
    return P;
  },
  draw(g, P, t, e, env) {
    const alert = e.alert ? e.alert(t) : 0.3; // 0 grazing .. 1 startled upright
    g.translate(0, -36);
    put(g, P.legs, env.sh, 2, 3);
    g.translate(0, -8);
    put(g, P.body, env.sh, 2, 3);
    g.save(); g.translate(20, -6);
    g.rotate((98 - alert * 104 + fbm(t * 0.7 + e.a, 55) * 4) * DEG);
    put(g, P.neck, env.sh * 0.6, 2, 2);
    g.restore();
  },
};

// ------------------------------------------------------------- sky props ---
export function bakeSky(mk) {
  const r = rng(4242), S = {};
  // clouds: a row of overlapping bumps with a flat base, two layers of card
  const cloudPts = (bumps, sx, sy, dx, dy) => {
    const pts = [];
    bumps.forEach(([bx, br], i) => { for (let k = 0; k <= 4; k++) { const a = Math.PI * (0.92 - k * 0.21); if (i > 0 && k === 0) continue; pts.push([dx + (bx + Math.cos(a) * br) * sx, dy - Math.sin(a) * br * sy - 2]); } });
    const x1 = pts[pts.length - 1][0], x0 = pts[0][0];
    pts.push([x1 + 4, dy + 4, 5], [x0 - 4, dy + 5, 5]);
    return pts;
  };
  S.clouds = [0, 1, 2, 3].map((v) => {
    const n = 3 + (v % 2), bumps = []; let x = 0;
    for (let i = 0; i < n; i++) { const br = (26 + r() * 22) * (i === 0 || i === n - 1 ? 0.72 : 1.1); x += br * (i ? 1.05 : 0); bumps.push([x, br]); x += br * 0.5; }
    const w = x / 2, pts = cloudPts(bumps, 1, 0.82, -w, 0), back = cloudPts(bumps.slice(0, n - 1).map(([bx, br]) => [bx + 24, br * 1.0]), 0.92, 0.95, -w + 14, -9);
    const sh = mk('cloud' + v, [-w - 50, -74, w + 60, 14], { pad: 8 });
    sh.piece(back, '#cdbfb2', { round: 9, rough: 1.6, seg: 30, rim: 0.3 });
    sh.piece(pts, '#ece2d2', { round: 9, rough: 1.6, seg: 30, rim: 0.3, lift: 3.4 });
    return { spr: sh.finish({ shadowBlur: 6 }), w, h: 40 };
  });
  S.sun = mk('sun', [-52, -52, 52, 52], { pad: 8 })
    .piece(ellipse(0, 0, 48, 48, 22), '#f3b25a', { round: 8, rough: 1.4, rim: 0.4 })
    .piece(ellipse(0, 0, 34, 34, 18), '#f8cf82', { round: 7, rough: 1.4, lift: 1.6, rim: 0.3 })
    .finish({ shadowBlur: 6 });
  const cres = [];
  for (let i = 0; i <= 12; i++) { const a = -Math.PI * 0.62 + (i / 12) * Math.PI * 1.24; cres.push([Math.cos(a) * 30, Math.sin(a) * 30]); }
  for (let i = 12; i >= 0; i--) { const a = -Math.PI * 0.62 + (i / 12) * Math.PI * 1.24; cres.push([Math.cos(a) * 30 * 0.74 - 11 + 11 * Math.abs(Math.sin(a)) ** 2 * 0.2, Math.sin(a) * 30 * 0.97]); }
  S.moon = mk('moon', [-34, -34, 34, 34], { pad: 8 }).piece(cres, '#f2e9d2', { round: 2, rough: 0.8, rim: 0.3 }).finish({ shadowBlur: 5 });
  return S;
}

export { person, bakePerson };
