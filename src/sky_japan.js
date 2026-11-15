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
