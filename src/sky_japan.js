// Close-up cards and hanging props for "Mended with Gold". Each group is cut lazily, the first time
// the film draws it (fxGroup getters), so a long film does not cut its last minute before its first.
import { ellipse, strip, KRAFT } from './paper.js';
import { fxGroup } from './sky_china.js';
import { rng, shade, rgb, mix, clamp, lerp, DEG } from './util.js';

const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
const cordMarks = (g, r, x0, y0, x1, y1, a = 0.42) => { g.strokeStyle = `rgba(60,34,20,${a})`; g.lineWidth = 1.6; for (let y = y0; y < y1; y += 6) { const d = ((y / 6) | 0) % 2 ? 1 : -1; for (let x = x0; x < x1; x += 4.4) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + 3 * d, y + 5); g.stroke(); } } };

// ------------------------------------------------------------ the first pots ---
fxGroup(['firstpot', 'clay', 'clayMarked', 'cord'], (mk) => {
  const r = rng(9100), S = {};
  // round-bellied, a pointed base, an open mouth; one dark fire-cloud where the flames touched it
  const prof = []; for (let i = 0; i <= 14; i++) { const f = i / 14, y = -188 * f, w = 20 + 58 * Math.sin(Math.min(1, f * 1.25) * Math.PI * 0.62) + (f > 0.88 ? (f - 0.88) * 60 : 0); prof.push([w, y]); }
  const body = [[0, 8], ...prof.map(([x, y]) => [x, y]), ...prof.slice().reverse().map(([x, y]) => [-x, y])];
  S.firstpot = mk('firstpot', [-100, -214, 100, 14], { pad: 10 })
    .piece(body, '#a87650', { round: 6, rough: 1.2, paint: (g) => {
      const gr = g.createLinearGradient(-86, 0, 86, 0); gr.addColorStop(0, 'rgba(40,20,10,.42)'); gr.addColorStop(0.38, 'rgba(255,226,186,.16)'); gr.addColorStop(0.62, 'rgba(255,226,186,.04)'); gr.addColorStop(1, 'rgba(40,20,10,.48)'); g.fillStyle = gr; g.fillRect(-100, -210, 200, 222);
      g.strokeStyle = 'rgba(70,40,22,.28)'; g.lineWidth = 1.3; for (let y = -176; y < -12; y += 8) { const w2 = 70 * Math.sin(Math.min(1, -y / 188 * 1.25) * Math.PI * 0.62) + 14; g.beginPath(); g.moveTo(-w2, y); g.quadraticCurveTo(0, y + 7, w2, y); g.stroke(); }
      const fc = g.createRadialGradient(34, -70, 0, 34, -70, 60); fc.addColorStop(0, 'rgba(26,14,8,.55)'); fc.addColorStop(1, 'rgba(26,14,8,0)'); g.fillStyle = fc; g.fillRect(-30, -140, 130, 140);
    } })
    .piece(ellipse(0, -188, 80, 13, 26), '#8a5c3c', { round: 4, lift: 1, thick: 1, paint: (g) => { g.fillStyle = 'rgba(30,16,8,.92)'; g.beginPath(); g.ellipse(0, -187, 71, 8.6, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,220,180,.12)'; g.beginPath(); g.ellipse(0, -184, 64, 4, 0, 0, Math.PI); g.fill(); } })
    .piece([[24, -196], [40, -193], [36, -183], [28, -186]], '#6a4630', { round: 2, lift: 0.6, thick: 0.5 }) // a chip out of the rim
    .finish({ shadowBlur: 7 });
  const slab = (name, marked) => mk(name, [-160, -60, 160, 60], { pad: 10 }).piece([[-150, -50], [-60, -54], [40, -50], [150, -52], [154, 50], [40, 54], [-80, 50], [-152, 52]], '#b48458', { round: 10, rough: 2, paint: (g) => {
    g.fillStyle = 'rgba(255,230,190,.12)'; g.fillRect(-150, -50, 300, 20);
    for (let i = 0; i < 40; i++) { g.fillStyle = r() < 0.5 ? 'rgba(80,46,24,.12)' : 'rgba(255,230,190,.1)'; g.beginPath(); g.ellipse(-140 + r() * 280, -44 + r() * 88, 6 + r() * 14, 2 + r() * 4, r(), 0, 7); g.fill(); }
    if (marked) cordMarks(g, r, -150, -50, 152, 52, 0.55);
  } }).finish({ shadowBlur: marked ? 0.1 : 6 });
  S.clay = slab('clay', false); S.clayMarked = slab('clayMarked', true);
  S.cord = mk('cord', [-16, -64, 16, 64], { pad: 6 }).piece([[-9, -60], [9, -60], [10, 60], [-10, 60]], '#c8a870', { round: 5, paint: (g) => { g.strokeStyle = 'rgba(90,60,30,.7)'; g.lineWidth = 2.2; for (let y = -66; y < 66; y += 7) { g.beginPath(); g.moveTo(-10, y); g.lineTo(10, y + 7); g.stroke(); } g.strokeStyle = 'rgba(255,240,200,.35)'; g.lineWidth = 1; for (let y = -64; y < 66; y += 7) { g.beginPath(); g.moveTo(-8, y + 1); g.lineTo(6, y + 6); g.stroke(); } } }).finish({ shadowBlur: 4 });
  return S;
});

// ----------------------------------------------------- the chronicle, the mirrors, the seal ---
// A hanging scroll in columns of brushed characters (not real text: the shape of a page), with a red seal.
export function brushColumns(g, r, x0, y0, cols, rows, dx, dy, col = 'rgba(30,22,18,.85)', w = 1.6) {
  g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round';
  for (let c = 0; c < cols; c++) for (let row = 0; row < rows; row++) {
    const x = x0 - c * dx, y = y0 + row * dy; if (r() < 0.06) continue;
    g.beginPath(); for (let k = 0; k < 3 + ((r() * 3) | 0); k++) { const hz = r() < 0.5, ax = x - dx * 0.3 + r() * dx * 0.45, ay = y + r() * dy * 0.6; g.moveTo(ax, ay); g.lineTo(ax + (hz ? dx * 0.42 + r() * 2 : (r() - 0.5) * 2), ay + (hz ? (r() - 0.5) * 1.5 : dy * 0.4 + r() * 3)); } g.stroke();
  }
}
fxGroup(['chronicle', 'mirrorBack', 'mirrorFront', 'seal', 'plancard'], (mk) => {
  const r = rng(9200), S = {};
  S.chronicle = mk('chronicle', [-70, -150, 70, 150], { pad: 8 })
    .piece([[-62, -140], [62, -140], [62, 140], [-62, 140]], '#e8dcbc', { round: 2, rough: 0.6, paint: (g) => { brushColumns(g, r, 46, -120, 8, 14, 12.5, 16); g.fillStyle = 'rgba(178,40,32,.85)'; g.fillRect(-52, 104, 14, 14); } })
    .piece(rect(-68, -150, 68, -138), '#6a4026', { round: 3, lift: 1.4 }).piece(rect(-68, 138, 68, 150), '#6a4026', { round: 3, lift: 1.4 })
    .finish({ shadowBlur: 5 });
  S.mirrorBack = mk('mirrorBack', [-64, -64, 64, 64], { pad: 6 }).piece(ellipse(0, 0, 60, 60, 40), '#7a7448', { round: 20, rough: 0.4, paint: (g) => {
    g.fillStyle = 'rgba(80,140,110,.32)'; for (let i = 0; i < 30; i++) { g.beginPath(); g.arc((r() - 0.5) * 100, (r() - 0.5) * 100, 3 + r() * 7, 0, 7); g.fill(); }
    g.strokeStyle = 'rgba(230,214,150,.55)'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 55, 0, 7); g.stroke();
    g.strokeStyle = 'rgba(40,36,20,.6)'; g.lineWidth = 1.2; for (let k = 0; k < 48; k++) { const a = k / 48 * 6.283, a2 = (k + 0.5) / 48 * 6.283; g.beginPath(); g.moveTo(Math.cos(a) * 48, Math.sin(a) * 48); g.lineTo(Math.cos(a2) * 43, Math.sin(a2) * 43); g.lineTo(Math.cos(a + 6.283 / 48) * 48, Math.sin(a + 6.283 / 48) * 48); g.stroke(); }
    g.beginPath(); g.arc(0, 0, 40, 0, 7); g.stroke(); g.beginPath(); g.arc(0, 0, 18, 0, 7); g.stroke();
    for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283, x = Math.cos(a) * 29, y = Math.sin(a) * 29; g.fillStyle = 'rgba(40,36,20,.55)'; if (k % 2) { g.beginPath(); g.arc(x, y - 3, 3, 0, 7); g.fill(); g.fillRect(x - 4, y, 8, 6); } else { g.beginPath(); g.ellipse(x, y, 7, 3.4, a, 0, 7); g.fill(); g.beginPath(); g.arc(x + Math.cos(a) * 6, y + Math.sin(a) * 6, 2.4, 0, 7); g.fill(); } }
    g.fillStyle = '#6a643c'; g.beginPath(); g.arc(0, 0, 9, 0, 7); g.fill(); g.fillStyle = 'rgba(255,240,190,.35)'; g.beginPath(); g.arc(-2.6, -2.6, 4, 0, 7); g.fill();
  } }).finish({ shadowBlur: 3 });
  S.mirrorFront = mk('mirrorFront', [-64, -64, 64, 64], { pad: 6 }).piece(ellipse(0, 0, 60, 60, 40), '#c8b070', { round: 20, rough: 0.4, paint: (g) => {
    const gr = g.createRadialGradient(-18, -20, 0, 0, 0, 64); gr.addColorStop(0, 'rgba(255,250,230,.95)'); gr.addColorStop(0.45, 'rgba(240,220,160,.6)'); gr.addColorStop(1, 'rgba(150,120,60,.5)'); g.fillStyle = gr; g.fillRect(-64, -64, 128, 128);
    g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 4; g.beginPath(); g.arc(0, 0, 44, 3.6, 4.6); g.stroke();
  } }).finish({ shadowBlur: 3 });
  S.seal = mk('seal', [-46, -80, 46, 46], { pad: 6 }).piece(rect(-38, 0, 38, 40), '#d4a838', { round: 3, paint: (g) => { const gr = g.createLinearGradient(-38, 0, 38, 40); gr.addColorStop(0, 'rgba(255,246,190,.6)'); gr.addColorStop(1, 'rgba(120,80,10,.4)'); g.fillStyle = gr; g.fillRect(-40, 0, 80, 42); } })
    .piece([[-30, 2], [-26, -20], [-10, -36], [8, -40], [26, -30], [32, -12], [30, 2]], '#e0b444', { round: 8, lift: 1.4, paint: (g) => { g.strokeStyle = 'rgba(120,80,10,.6)'; g.lineWidth = 1.4; g.beginPath(); for (let a = 0; a < 15; a += 0.3) g.lineTo(Math.cos(a) * a * 1.6, -16 + Math.sin(a) * a * 1.1); g.stroke(); g.fillStyle = 'rgba(255,250,210,.5)'; g.beginPath(); g.ellipse(-8, -26, 8, 4, -0.4, 0, 7); g.fill(); } })
    .piece([[18, -36], [34, -54], [44, -52], [36, -34]], '#d4a838', { round: 4, lift: 1.2, paint: (g) => { g.fillStyle = '#3a2a10'; g.beginPath(); g.arc(38, -48, 1.6, 0, 7); g.fill(); } })
    .finish({ shadowBlur: 4 });
  S.plancard = mk('plancard', [-150, -110, 150, 110], { pad: 8 }).piece([[-142, -100], [-40, -104], [60, -100], [142, -103], [144, 100], [40, 104], [-60, 100], [-144, 102]], '#efe4c8', { round: 3, rough: 1.6, paint: (g) => { g.fillStyle = 'rgba(160,130,90,.12)'; for (let i = 0; i < 30; i++) { g.beginPath(); g.ellipse((r() - 0.5) * 280, (r() - 0.5) * 190, 10 + r() * 20, 4 + r() * 8, r(), 0, 7); g.fill(); } } }).finish({ shadowBlur: 6 });
  return S;
});

// ------------------------------------------------------------- the imperial line ---
// Paper dolls, each in the dress of an age, holding hands across the sky; and the chrysanthemum crest.
fxGroup(['doll0', 'doll1', 'doll2', 'doll3', 'doll4', 'doll5', 'kiku'], (mk) => {
  const S = {}, paper = '#f2e8d2';
  const doll = (i, robe, hat, extra) => {
    const sh = mk('doll' + i, [-46, -100, 46, 6], { pad: 6 });
    sh.piece([[-26, 4], [-20, -30], [-44, -52], [-44, -58], [-16, -60], [-10, -66], [10, -66], [16, -60], [44, -58], [44, -52], [20, -30], [26, 4]], paper, { round: 2, rough: 0.5, paint: (g) => {
      g.fillStyle = robe; g.beginPath(); g.moveTo(-26, 4); g.lineTo(-18, -32); g.lineTo(-40, -50); g.lineTo(-40, -58); g.lineTo(40, -58); g.lineTo(40, -50); g.lineTo(18, -32); g.lineTo(26, 4); g.closePath(); g.fill();
      if (extra) extra(g);
    } });
    sh.piece(ellipse(0, -76, 10, 11, 14), paper, { round: 4, lift: 1, paint: (g) => { g.fillStyle = 'rgba(40,30,26,.7)'; g.beginPath(); g.arc(-3.4, -77, 1, 0, 7); g.fill(); g.beginPath(); g.arc(3.4, -77, 1, 0, 7); g.fill(); if (hat) hat(g); } });
    return sh.finish({ shadowBlur: 3 });
  };
  S.doll0 = doll(0, '#e6e0d0', (g) => { g.fillStyle = '#2a2420'; g.beginPath(); g.ellipse(-10, -72, 3.6, 7, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(10, -72, 3.6, 7, 0, 0, 7); g.fill(); g.fillRect(-9, -88, 18, 6); }, (g) => { g.fillStyle = '#a8282a'; g.fillRect(-20, -32, 40, 3); });
  S.doll1 = doll(1, '#b8402e', (g) => { g.fillStyle = '#2a2420'; g.fillRect(-9, -90, 18, 8); g.fillRect(-2, -96, 4, 6); }, (g) => { g.fillStyle = 'rgba(255,230,180,.6)'; g.beginPath(); g.arc(0, -56, 6, 0, Math.PI); g.fill(); });
  S.doll2 = doll(2, '#2a2430', (g) => { g.fillStyle = '#1a1618'; g.fillRect(-8, -92, 16, 9); g.fillRect(-1.6, -112, 3.2, 22); }, (g) => { g.fillStyle = '#e8dcc0'; g.fillRect(-26, -2, 52, 4); });
  S.doll3 = doll(3, '#c87a30', (g) => { g.fillStyle = '#1a1618'; g.fillRect(-8, -92, 16, 9); g.fillRect(-1.6, -108, 3.2, 18); }, (g) => { g.strokeStyle = 'rgba(255,240,200,.5)'; g.lineWidth = 1; for (let y = -50; y < 0; y += 6) { g.beginPath(); g.moveTo(-20, y); g.lineTo(20, y); g.stroke(); } });
  S.doll4 = doll(4, '#2a3048', (g) => { g.fillStyle = '#2a2420'; g.fillRect(-9, -86, 18, 3); g.fillRect(-6, -70, 12, 2.4); }, (g) => { g.fillStyle = '#d4a838'; g.fillRect(-40, -58, 12, 4); g.fillRect(28, -58, 12, 4); for (let y = -50; y < -8; y += 8) { g.beginPath(); g.arc(0, y, 1.6, 0, 7); g.fill(); } });
  S.doll5 = doll(5, '#1e1e22', (g) => { g.fillStyle = '#3a3634'; g.fillRect(-9, -88, 18, 4); g.strokeStyle = 'rgba(30,30,30,.7)'; g.lineWidth = 0.8; g.strokeRect(-6, -79, 5, 3.4); g.strokeRect(1, -79, 5, 3.4); }, (g) => { g.fillStyle = '#efece4'; g.beginPath(); g.moveTo(-6, -58); g.lineTo(6, -58); g.lineTo(0, -38); g.closePath(); g.fill(); g.fillStyle = '#5a5a60'; g.fillRect(-1.4, -56, 2.8, 14); });
  const kk = mk('kiku', [-70, -70, 70, 70], { pad: 6 });
  kk.piece(ellipse(0, 0, 64, 64, 32), '#c9962e', { round: 8, paint: (g) => { for (let k = 0; k < 16; k++) { const a = (k + 0.5) / 16 * 6.283; g.fillStyle = '#e0b444'; g.beginPath(); g.moveTo(Math.cos(a - 0.17) * 18, Math.sin(a - 0.17) * 18); g.quadraticCurveTo(Math.cos(a) * 70, Math.sin(a) * 70, Math.cos(a + 0.17) * 18, Math.sin(a + 0.17) * 18); g.fill(); } } });
  for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283, p = [[Math.cos(a - 0.16) * 16, Math.sin(a - 0.16) * 16], [Math.cos(a - 0.17) * 56, Math.sin(a - 0.17) * 56], [Math.cos(a) * 62, Math.sin(a) * 62], [Math.cos(a + 0.17) * 56, Math.sin(a + 0.17) * 56], [Math.cos(a + 0.16) * 16, Math.sin(a + 0.16) * 16]]; kk.piece(p, '#e8c050', { round: 4, lift: 0.8, thick: 0.6, rim: 0.3 }); }
  kk.piece(ellipse(0, 0, 16, 16, 18), '#d4a838', { round: 6, lift: 1, paint: (g) => { g.strokeStyle = 'rgba(120,80,10,.6)'; g.lineWidth = 1; g.beginPath(); g.arc(0, 0, 12, 0, 7); g.stroke(); } });
  S.kiku = kk.finish({ shadowBlur: 4 });
  return S;
});

// ------------------------------------------------------------- brushed characters ---
// Stroke by stroke, in a 100-unit box, in the order a calligrapher writes them.
export const CHARS = {
  wa: [[[34, 8], [16, 18]], [[8, 32], [44, 30]], [[27, 14], [27, 94]], [[26, 40], [8, 72]], [[29, 44], [42, 60]], [[56, 42], [57, 82]], [[56, 42], [88, 42], [86, 80]], [[58, 78], [86, 78]]],
  hi: [[[30, 10], [30, 92]], [[30, 10], [72, 10], [72, 92]], [[32, 50], [70, 50]], [[32, 90], [70, 90]]],
  i: [[[30, 20], [26, 60], [34, 74]], [[66, 30], [72, 54]]],
  ro: [[[30, 18], [62, 18], [36, 52], [60, 48], [68, 64], [58, 80], [36, 82]]],
  ha: [[[22, 16], [20, 80]], [[40, 30], [78, 30]], [[60, 14], [60, 72], [50, 84], [40, 76], [54, 66], [78, 82]]],
  ni: [[[22, 16], [20, 80]], [[44, 30], [72, 28]], [[44, 66], [56, 76], [76, 74]]],
  ho: [[[22, 16], [20, 80]], [[40, 22], [74, 22]], [[40, 40], [74, 40]], [[58, 22], [58, 74], [48, 84], [40, 76], [54, 68], [78, 82]]],
  he: [[[14, 60], [36, 36], [86, 72]]],
  to: [[[36, 14], [44, 40]], [[66, 32], [34, 58], [34, 76], [52, 84], [78, 80]]],
  hon: [[[10, 34], [90, 32]], [[50, 6], [50, 96]], [[48, 36], [12, 76]], [[52, 36], [90, 78]], [[34, 72], [66, 72]]],
};
// k counts strokes written so far (fractional: the last one is still being drawn).
export function brush(g, name, x, y, s, k, col = '#1c1612', w = 7) {
  const strokes = CHARS[name]; g.save(); g.translate(x, y); g.scale(s, s); g.lineCap = 'round'; g.lineJoin = 'round';
  strokes.forEach((pts, i) => {
    const f = Math.max(0, Math.min(1, k - i)); if (f <= 0) return;
    let len = 0; const seg = []; for (let j = 1; j < pts.length; j++) { const d = Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]); seg.push(d); len += d; }
    const n = Math.max(6, Math.round(len / 2.5)), upto = Math.round(n * f);
    const at = (q) => { let d = q * len; for (let j = 0; j < seg.length; j++) { if (d <= seg[j] || j === seg.length - 1) { const u = Math.min(1, d / seg[j]); return [pts[j][0] + (pts[j + 1][0] - pts[j][0]) * u, pts[j][1] + (pts[j + 1][1] - pts[j][1]) * u]; } d -= seg[j]; } return pts[pts.length - 1]; };
    for (let m = 0; m < upto; m++) {
      const q0 = m / n, q1 = (m + 1) / n, [x0, y0] = at(q0), [x1, y1] = at(q1), press = (0.65 + 0.55 * Math.sin(Math.PI * Math.min(1, q0 * 1.15))) * (q0 < 0.08 ? 1.25 : 1);
      g.strokeStyle = col; g.lineWidth = w * press; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      if (q0 > 0.7) { g.strokeStyle = 'rgba(255,248,235,.18)'; g.lineWidth = w * press * 0.2; g.beginPath(); g.moveTo(x0 + 1.4, y0 + 1); g.lineTo(x1 + 1.4, y1 + 1); g.stroke(); }
    }
  });
  g.restore();
}

fxGroup(['washi', 'letter', 'jointA', 'jointB', 'redsun', 'gilt'], (mk) => {
  const r = rng(9300), S = {};
  S.washi = mk('washi', [-130, -150, 130, 150], { pad: 8 }).piece([[-120, -140], [0, -144], [120, -140], [124, 0], [120, 142], [0, 146], [-122, 140], [-126, 0]], '#f4ecda', { round: 3, rough: 2, paint: (g) => { g.strokeStyle = 'rgba(180,160,120,.18)'; g.lineWidth = 0.8; for (let i = 0; i < 80; i++) { const x = -120 + r() * 240, y = -140 + r() * 280; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + (r() - 0.5) * 20, y + (r() - 0.5) * 10, x + (r() - 0.5) * 30, y + (r() - 0.5) * 16); g.stroke(); } g.fillStyle = 'rgba(200,170,90,.25)'; for (let i = 0; i < 40; i++) g.fillRect(-120 + r() * 240, -140 + r() * 280, 2 + r() * 3, 1.4 + r() * 2); } }).finish({ shadowBlur: 6 });
  S.letter = mk('letter', [-170, -60, 170, 60], { pad: 8 }).piece(rect(-160, -50, 160, 50), '#efe4c6', { round: 2, rough: 0.6, paint: (g) => { brushColumns(g, r, 140, -40, 22, 6, 13, 14); } }).piece(ellipse(-162, 0, 7, 56, 12), '#8a5a2a', { round: 2, lift: 1.2 }).piece(ellipse(162, 0, 7, 56, 12), '#8a5a2a', { round: 2, lift: 1.2 }).finish({ shadowBlur: 5 });
  const grain = (x0, x1, y0, y1) => (g) => { g.strokeStyle = 'rgba(140,96,50,.4)'; g.lineWidth = 1; for (let y = y0 + 3; y < y1; y += 4.4) { g.beginPath(); g.moveTo(x0, y); for (let x = x0; x <= x1; x += 12) g.lineTo(x, y + Math.sin(x * 0.05 + y) * 1.4); g.stroke(); } };
  // two timbers that lock together without a nail: a mortise and its tenon
  S.jointA = mk('jointA', [-150, -50, 20, 50], { pad: 6 }).piece([[-146, -40], [10, -40], [10, -14], [-30, -14], [-30, 14], [10, 14], [10, 40], [-146, 40]], '#d8b480', { round: 2, paint: grain(-146, 12, -40, 40) }).finish({ shadowBlur: 4 });
  S.jointB = mk('jointB', [-34, -50, 150, 50], { pad: 6 }).piece([[-30, -12], [10, -12], [10, -40], [146, -40], [146, 40], [10, 40], [10, 12], [-30, 12]], '#c8a470', { round: 2, paint: grain(-30, 146, -40, 40) }).finish({ shadowBlur: 4 });
  S.redsun = mk('redsun', [-140, -140, 140, 140], { pad: 10 }).piece(ellipse(0, 0, 130, 130, 48), '#d0402a', { round: 30, rough: 1.4, paint: (g) => { const gr = g.createRadialGradient(-30, -30, 0, 0, 0, 140); gr.addColorStop(0, 'rgba(255,200,140,.4)'); gr.addColorStop(1, 'rgba(120,20,10,.3)'); g.fillStyle = gr; g.fillRect(-140, -140, 280, 280); } }).finish({ shadowBlur: 8 });
  S.gilt = mk('gilt', [-50, -130, 50, 6], { pad: 6 }).piece(ellipse(0, -76, 34, 40, 18), '#d8b04a', { round: 8, paint: (g) => { g.strokeStyle = 'rgba(255,240,180,.6)'; g.lineWidth = 1.6; g.beginPath(); g.arc(0, -76, 30, 0, 7); g.stroke(); } })
    .piece([[-22, 4], [22, 4], [18, -10], [-18, -10]], '#a8803a', { round: 3, lift: 1 })
    .piece([[-14, -10], [14, -10], [12, -56], [6, -64], [-6, -64], [-12, -56]], '#c89a3a', { round: 6, lift: 1.4, paint: (g) => { g.fillStyle = 'rgba(255,240,190,.35)'; g.fillRect(-12, -56, 8, 40); } })
    .piece(ellipse(0, -72, 8, 9, 12), '#d4a840', { round: 4, lift: 1.4, paint: (g) => { g.fillStyle = 'rgba(80,50,10,.6)'; g.beginPath(); g.arc(0, -80, 5, Math.PI, 0); g.fill(); } })
    .finish({ shadowBlur: 3 });
  return S;
});

// ----------------------------------------------------------------- Fūjin, god of wind ---
// After the old folding screens: a green god crouched on a storm cloud, his bag of winds billowing over him.
fxGroup(['fujin'], (mk) => {
  const r = rng(9400), S = {}, sh = mk('fujin', [-240, -230, 240, 190], { pad: 10 }), skin = '#6a9a7a';
  sh.piece([[-220, 150], [-200, 100], [-150, 80], [-100, 96], [-60, 70], [0, 84], [60, 66], [120, 90], [170, 76], [216, 110], [224, 160], [150, 176], [60, 168], [-40, 180], [-140, 172]], '#2e3038', { round: 18, rough: 3, seg: 12, paint: (g) => { g.strokeStyle = 'rgba(150,150,170,.35)'; g.lineWidth = 3; for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(-160 + k * 64, 130, 20 + (k % 2) * 8, 3.4, 6.0); g.stroke(); } } });
  // the bag of winds: a great white ribbon arching overhead, held in both hands
  const bag = []; for (let i = 0; i <= 20; i++) { const a = Math.PI * (1 - i / 20), rx = 200, ry = 200; bag.push([Math.cos(a) * rx, -10 - Math.sin(a) * ry]); }
  const bagIn = []; for (let i = 20; i >= 0; i--) { const a = Math.PI * (1 - i / 20); bagIn.push([Math.cos(a) * 160, -10 - Math.sin(a) * 150 - (i > 6 && i < 14 ? 6 : 0)]); }
  sh.piece([...bag, ...bagIn], '#f2f0ea', { round: 8, rough: 1.4, seg: 14, paint: (g) => { g.strokeStyle = 'rgba(120,130,150,.45)'; g.lineWidth = 2.4; for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(0, -10, 168 + k * 7, Math.PI * 1.05, Math.PI * 1.95); g.stroke(); } } });
  // the body: crouched, arms up to the bag, legs kicking in the cloud
  sh.piece([[-46, 84], [-60, 40], [-50, -10], [-20, -30], [20, -30], [50, -10], [60, 40], [44, 84]], skin, { round: 16, lift: 1.6, paint: (g) => { g.strokeStyle = 'rgba(30,60,40,.45)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-20, 0); g.quadraticCurveTo(0, 14, 20, 0); g.stroke(); g.beginPath(); g.moveTo(-26, 30); g.quadraticCurveTo(0, 40, 26, 30); g.stroke(); } });
  sh.piece([[-40, 50], [44, 50], [56, 86], [-50, 86]], '#e8dcc0', { round: 6, lift: 1.4, paint: (g) => { g.strokeStyle = 'rgba(160,60,40,.5)'; g.lineWidth = 2; for (let x = -40; x < 50; x += 10) { g.beginPath(); g.moveTo(x, 52); g.lineTo(x + 6, 84); g.stroke(); } } });
  for (const s2 of [-1, 1]) sh.piece([[s2 * 40, -16], [s2 * 96, -70], [s2 * 150, -120], [s2 * 166, -108], [s2 * 112, -54], [s2 * 56, 6]], skin, { round: 10, lift: 1.4 });
  for (const s2 of [-1, 1]) sh.piece([[s2 * 30, 80], [s2 * 80, 104], [s2 * 120, 92], [s2 * 128, 108], [s2 * 82, 126], [s2 * 26, 100]], skin, { round: 10, lift: 1.2 });
  sh.piece([[-30, -24], [-34, -64], [-18, -84], [18, -84], [34, -64], [30, -24]], skin, { round: 12, lift: 1.8, paint: (g) => { g.fillStyle = '#f8f4ea'; for (const s2 of [-1, 1]) { g.beginPath(); g.ellipse(s2 * 12, -60, 8, 6, 0, 0, 7); g.fill(); g.fillStyle = '#1a1a1a'; g.beginPath(); g.arc(s2 * 12 + 2, -59, 3, 0, 7); g.fill(); g.fillStyle = '#f8f4ea'; } g.fillStyle = '#5a1e1a'; g.beginPath(); g.ellipse(0, -38, 13, 8, 0, 0, Math.PI); g.fill(); g.fillStyle = '#f8f4ea'; g.fillRect(-10, -38, 20, 3); } });
  sh.piece([[-36, -70], [-50, -96], [-34, -92], [-30, -118], [-12, -100], [0, -126], [12, -100], [30, -118], [34, -92], [50, -96], [36, -70], [20, -84], [-20, -84]], '#b8402a', { round: 3, lift: 1.6 });
  S.fujin = sh.finish({ shadowBlur: 8 });
  return S;
});
