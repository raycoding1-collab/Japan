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
