// Sprites borrowed from the first film's sky library (src/sky.js), made lazily: each group is cut the
// first time the film asks for it, so nothing waits for props that will not be seen for minutes.
import { ellipse, strip, KRAFT } from './paper.js';
import { rng, shade, rgb } from './util.js';
const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
export const TEMPLATE_FX = [
  [['sutra', 'typetray'], (mk, mkSoft, mkBig) => { const S = {};
    const r2 = rng(868);
    S.sutra = mk('sutra', [-92, -64, 92, 64], { pad: 8 }).piece([[-88, -60], [88, -58], [86, 60], [-86, 58]], '#efe3c4', { round: 2, rough: 0.6, paint: (g) => {
      g.fillStyle = 'rgba(40,30,26,.85)';
      // a printed picture panel on the right, then columns of text read right to left
      g.strokeStyle = 'rgba(40,30,26,.8)'; g.lineWidth = 1.4; g.strokeRect(34, -50, 46, 100);
      g.beginPath(); g.arc(57, -14, 10, 0, 7); g.stroke(); g.beginPath(); g.moveTo(42, 30); g.quadraticCurveTo(57, -4, 72, 30); g.closePath(); g.stroke();
      for (let k = 0; k < 9; k++) { g.beginPath(); g.moveTo(57 + Math.cos(k * 0.7) * 16, -14 + Math.sin(k * 0.7) * 16); g.lineTo(57 + Math.cos(k * 0.7) * 22, -14 + Math.sin(k * 0.7) * 22); g.stroke(); }
      for (let c = 0; c < 9; c++) for (let row = 0; row < 9; row++) {
        const x = 22 - c * 12, y = -50 + row * 11.5; if (r2() < 0.08) continue;
        g.lineWidth = 1.5; g.beginPath();
        for (let st = 0; st < 3 + ((r2() * 3) | 0); st++) { const x0 = x - 4 + r2() * 6, y0 = y + r2() * 7, hz = r2() < 0.5; g.moveTo(x0, y0); g.lineTo(x0 + (hz ? 5 + r2() * 3 : (r2() - 0.5) * 2), y0 + (hz ? (r2() - 0.5) * 1.5 : 4 + r2() * 4)); }
        g.stroke();
      }
      g.fillStyle = 'rgba(178,40,32,.85)'; g.fillRect(-82, 34, 13, 13); g.fillStyle = 'rgba(239,227,196,.9)'; g.fillRect(-79, 37, 3, 7); g.fillRect(-75, 37, 3, 7);
    } }).piece(ellipse(-89, 0, 5, 63, 12), '#8a5a2a', { round: 2, lift: 1.2 }).finish({ shadowBlur: 5 });
    const tray = mk('typetray', [-80, -52, 80, 52], { pad: 8 }).piece([[-76, -48], [76, -48], [76, 48], [-76, 48]], '#6e4e30', { round: 3, rough: 0.5 });
    for (let c = 0; c < 9; c++) for (let row = 0; row < 6; row++) {
      const x = -64 + c * 16, y = -38 + row * 15, col = r2() < 0.5 ? '#6a6458' : '#7a705e';
      tray.piece([[x - 6.5, y - 6], [x + 6.5, y - 6], [x + 6.5, y + 6], [x - 6.5, y + 6]], col, { round: 1, lift: 1.2, thick: 0.8, paint: (g) => { g.strokeStyle = 'rgba(220,210,180,.55)'; g.lineWidth = 1.2; g.beginPath(); for (let st = 0; st < 3; st++) { const hz = r2() < 0.5, x0 = x - 4 + r2() * 4, y0 = y - 4 + r2() * 4; g.moveTo(x0, y0); g.lineTo(x0 + (hz ? 6 : 0.5), y0 + (hz ? 0.5 : 6)); } g.stroke(); } });
    }
    S.typetray = tray.finish({ shadowBlur: 5 });
  return S; }],
  [['doll', 'dollC'], (mk, mkSoft, mkBig) => { const S = {};
    const pts = [];
    for (let i = 0; i <= 12; i++) { const a = (115 + (i / 12) * 310) * Math.PI / 180; pts.push([Math.cos(a) * 7.5, -32 + Math.sin(a) * 7.5]); }
    pts.push([3, -25], [19, -21.5], [20.5, -17], [19, -13], [9, -13], [14, 20], [6, 20], [6, 40], [1.5, 40], [1.5, 23], [-1.5, 23], [-1.5, 40], [-6, 40], [-6, 20], [-14, 20], [-9, -13], [-19, -13], [-20.5, -17], [-19, -21.5], [-3, -25]);
    const doll = (name, dress, skin) => mk(name, [-22, -42, 22, 42], { pad: 6 }).piece(pts, dress ? '#efe6d0' : '#e9dfc6', { round: 1.2, rough: 0.35, seg: 60, paint: dress ? (g) => {
      g.fillStyle = skin; g.beginPath(); g.arc(0, -32, 8, 0, 7); g.fill(); g.fillRect(-21, -22, 6, 10); g.fillRect(15, -22, 6, 10); g.fillRect(-7, 20, 14, 21);
      g.fillStyle = dress; g.beginPath(); g.moveTo(-10, -26); g.lineTo(10, -26); g.lineTo(15, -12); g.lineTo(9, -12); g.lineTo(15, 21); g.lineTo(-15, 21); g.lineTo(-9, -12); g.lineTo(-15, -12); g.closePath(); g.fill();
      g.fillStyle = 'rgba(40,28,24,.75)'; g.beginPath(); g.arc(0, -34, 8, Math.PI, 0); g.fill(); g.fillRect(-7, 36, 6, 5); g.fillRect(1, 36, 6, 5);
    } : (g) => { g.strokeStyle = 'rgba(150,130,100,.35)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(-20, -17); g.lineTo(20, -17); g.stroke(); } }).finish({ shadowBlur: 3 });
    S.doll = doll('doll-p');
    S.dollC = [['#c8553d', '#7d5236'], ['#3f6a8a', '#e0b48f'], ['#d8a040', '#5d3a26'], ['#5a8a5a', '#c69a74'], ['#8a4a7a', '#a8774f']].map(([d, sk], i) => doll('doll-c' + i, d, sk));
  return S; }],
  [['plane'], (mk, mkSoft, mkBig) => { const S = {};
  S.plane = mk('plane', [-70, -30, 70, 26])
    .piece(rect(-64, -22, 64, -16), '#e8dcc0', { round: 2 }).piece(rect(-64, 6, 64, 12), '#e8dcc0', { round: 2, lift: 1.4 })
    .piece(rect(-40, -16, -37, 6), '#5b4331', { round: 0.5, lift: 1 }).piece(rect(-4, -16, -1, 6), '#5b4331', { round: 0.5, lift: 1 }).piece(rect(34, -16, 37, 6), '#5b4331', { round: 0.5, lift: 1 })
    .piece(rect(52, -10, 70, -6), '#e8dcc0', { round: 1, lift: 1 }).piece(rect(-74, -6, -60, 4), '#e8dcc0', { round: 1, lift: 1 })
    .piece(ellipse(-10, -2, 5, 3, 8), '#4a3a30', { round: 1, lift: 1.2 }).finish({ shadowBlur: 4 });
  return S; }],
  [['rocket'], (mk, mkSoft, mkBig) => { const S = {};
  S.rocket = mk('rocket', [-16, -120, 16, 14])
    .piece([[-10, 10], [-10, -90], [-6, -104], [0, -116], [6, -104], [10, -90], [10, 10]], '#ece8de', { round: 3, paint: (g) => { g.fillStyle = '#2a2628'; g.fillRect(-10, -40, 20, 8); g.fillRect(-10, -6, 20, 6); g.fillRect(-10, -80, 20, 4); } })
    .piece([[-10, 0], [-18, 12], [-10, 10]], '#2a2628', { round: 1, lift: 1 }).piece([[10, 0], [18, 12], [10, 10]], '#2a2628', { round: 1, lift: 1 }).finish({ shadowBlur: 3 });
  // a bird is two wings of dark paper
  return S; }],
  [['astro'], (mk, mkSoft, mkBig) => { const S = {};
  S.astro = mk('astro', [-12, -34, 12, 4], { pad: 4 })
    .piece([[-6, 2], [-6, -8], [-7, -20], [7, -20], [6, -8], [6, 2], [2, 2], [1, -6], [-1, -6], [-2, 2]], '#eeeeea', { round: 2, rough: 0.3 })
    .piece(rect(-10, -19, -6, -9), '#d6d6d0', { round: 1, lift: 0.8 })
    .piece(ellipse(1, -25, 6.5, 6.5, 12), '#f2f2ee', { round: 2, lift: 1 })
    .piece(ellipse(3, -25, 4, 3.6, 10), '#c9a24a', { round: 1.5, lift: 0.8 })
    .finish({ shadowBlur: 2 });
  return S; }],
  [['lunar', 'lem', 'earth'], (mk, mkSoft, mkBig) => { const S = {};
    const r3 = rng(1969), top = [];
    for (let i = 0; i <= 64; i++) { const x = -440 + i * 13.75, f = x / 440; top.push([x, -40 + f * f * 70 + (r3() - 0.5) * 3 + (i % 11 === 6 ? -5 : 0)]); }
    S.lunar = mkBig('lunar', [-446, -60, 446, 250], { pad: 10 }).piece([...top, [440, 246], [-440, 246]], '#b9b5ad', { round: 3, rough: 1.2, paint: (g) => {
      for (let i = 0; i < 46; i++) { const x = -420 + r3() * 840, y = -12 + r3() * 240, rx = 5 + r3() * r3() * 34, ry = rx * (0.26 + (y + 40) / 700);
        if (Math.abs(x - 40) < 70 && y < 30) continue;
        g.fillStyle = 'rgba(90,86,82,.35)'; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill();
        g.strokeStyle = 'rgba(235,232,224,.5)'; g.lineWidth = 1.4; g.beginPath(); g.ellipse(x, y + ry * 0.15, rx, ry, 0, 0.1, Math.PI - 0.1); g.stroke(); }
      g.fillStyle = 'rgba(255,255,255,.08)'; for (let i = 0; i < 600; i++) g.fillRect(-440 + r3() * 880, -40 + r3() * 280, 1.2, 1.2);
      const sh = g.createLinearGradient(0, -40, 0, 246); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(20,18,16,.35)'); g.fillStyle = sh; g.fillRect(-446, -60, 892, 310);
    } }).finish({ shadowBlur: 8 });
    S.lem = mk('lem', [-48, -96, 48, 8], { pad: 6 })
      .piece(strip(-24, -30, -40, 2, 2.6, 2.2), '#8c8a86', { round: 0.8 }).piece(strip(24, -30, 40, 2, 2.6, 2.2), '#8c8a86', { round: 0.8 })
      .piece(ellipse(-41, 3, 6, 2.2, 10), '#a8a49c', { round: 1, lift: 0.8 }).piece(ellipse(41, 3, 6, 2.2, 10), '#a8a49c', { round: 1, lift: 0.8 })
      .piece([[-26, -10], [-30, -36], [30, -36], [26, -10]], '#c9a24a', { round: 2, rough: 0.8, paint: (g) => { g.strokeStyle = 'rgba(120,80,20,.5)'; g.lineWidth = 0.9; for (let i = 0; i < 14; i++) { const x = -28 + i * 4.2; g.beginPath(); g.moveTo(x, -36); g.lineTo(x + 2 - (i % 3), -10); g.stroke(); } g.fillStyle = 'rgba(255,240,190,.35)'; g.fillRect(-24, -33, 10, 20); } })
      .piece(rect(4, -10, 12, 2), '#7a7874', { round: 0.6, lift: 0.6, paint: (g) => { g.fillStyle = 'rgba(40,40,40,.5)'; for (let y = -8; y < 2; y += 3) g.fillRect(4, y, 8, 0.8); } })
      .piece([[-20, -36], [-24, -60], [-12, -74], [14, -74], [24, -58], [20, -36]], '#d8d6d0', { round: 2.5, paint: (g) => { g.fillStyle = '#2a2a30'; g.beginPath(); g.moveTo(-4, -62); g.lineTo(6, -62); g.lineTo(8, -54); g.lineTo(-6, -54); g.closePath(); g.fill(); g.fillStyle = 'rgba(80,80,90,.4)'; g.fillRect(-20, -44, 40, 3); } })
      .piece(strip(10, -74, 14, -92, 1.2, 1), '#8c8a86', { round: 0.4, lift: 0.6 })
      .piece(ellipse(15, -92, 6, 2.4, 10), '#e8e6e0', { round: 0.8, lift: 0.8 })
      .finish({ shadowBlur: 4 });
    // the Earth from out there: our own little cardboard planet
    S.earth = mk('earth', [-40, -40, 40, 40], { pad: 8 }).piece(ellipse(0, 0, 34, 34, 28), '#3d6aa0', { round: 3, paint: (g) => {
      g.fillStyle = '#8a7a4a'; for (const [x, y, rx, ry, a] of [[-12, -8, 12, 16, 0.4], [14, 10, 10, 8, -0.3], [8, -20, 7, 5, 0.2], [-6, 20, 6, 4, 0]]) { g.beginPath(); g.ellipse(x, y, rx, ry, a, 0, 7); g.fill(); }
      g.fillStyle = 'rgba(110,140,70,.8)'; g.beginPath(); g.ellipse(-12, -4, 7, 9, 0.4, 0, 7); g.fill();
      g.strokeStyle = 'rgba(245,245,240,.85)'; g.lineWidth = 2.6; g.lineCap = 'round'; for (const [x, y, w] of [[-20, -24, 18], [4, -2, 24], [-26, 12, 14], [6, 24, 16]]) { g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + w / 2, y - 4, x + w, y); g.stroke(); }
      const sh = g.createLinearGradient(-34, 0, 34, 0); sh.addColorStop(0, 'rgba(10,14,30,0)'); sh.addColorStop(0.55, 'rgba(10,14,30,0)'); sh.addColorStop(0.8, 'rgba(10,14,30,.7)'); g.fillStyle = sh; g.fillRect(-36, -36, 72, 72);
    } }).finish({ shadowBlur: 5 });
  return S; }],
  [['msg'], (mk, mkSoft, mkBig) => { const S = {};
    const hp = []; for (let i = 0; i <= 20; i++) { const a = (i / 20) * Math.PI * 2, x = 16 * Math.sin(a) ** 3, y = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)); hp.push([x * 0.62, y * 0.62]); }
    S.msg = [
      mk('msg-heart', [-12, -12, 12, 12], { pad: 4 }).piece(hp, '#d2463c', { round: 1, rough: 0.3 }).finish({ shadowBlur: 2 }),
      mk('msg-photo', [-12, -12, 12, 12], { pad: 4 }).piece(rect(-10, -11, 10, 11), '#f2eee4', { round: 0.8, paint: (g) => { g.fillStyle = '#7ab0d8'; g.fillRect(-8, -9, 16, 13); g.fillStyle = '#6a9a4a'; g.beginPath(); g.moveTo(-8, 4); g.quadraticCurveTo(-1, -4, 8, 1); g.lineTo(8, 4); g.closePath(); g.fill(); g.fillStyle = '#f0d060'; g.beginPath(); g.arc(4, -5, 2.2, 0, 7); g.fill(); } }).finish({ shadowBlur: 2 }),
      mk('msg-bubble', [-13, -11, 13, 13], { pad: 4 }).piece([[-11, -9], [11, -9], [11, 5], [-2, 5], [-7, 11], [-6, 5], [-11, 5]], '#f4f1ea', { round: 2, paint: (g) => { g.fillStyle = '#4a4a52'; for (const x of [-5, 0, 5]) { g.beginPath(); g.arc(x, -2, 1.5, 0, 7); g.fill(); } } }).finish({ shadowBlur: 2 }),
      mk('msg-letter', [-13, -10, 13, 10], { pad: 4 }).piece(rect(-11, -8, 11, 8), '#efe3c8', { round: 0.8, paint: (g) => { g.strokeStyle = 'rgba(120,90,60,.7)'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(-11, -8); g.lineTo(0, 1); g.lineTo(11, -8); g.stroke(); g.fillStyle = '#c8553d'; g.beginPath(); g.arc(0, 1, 2, 0, 7); g.fill(); } }).finish({ shadowBlur: 2 }),
    ];
  return S; }],
  [['notes'], (mk, mkSoft, mkBig) => { const S = {};
  S.notes = [
    mk('note0', [-8, -24, 12, 6], { pad: 4 }).piece(ellipse(-2, 0, 5.5, 4, 12).map(([x, y]) => [x * Math.cos(-0.4) - y * Math.sin(-0.4), x * Math.sin(-0.4) + y * Math.cos(-0.4)]), '#2e2a2a', { round: 1.5 }).piece(rect(2.4, -22, 4.4, -1), '#2e2a2a', { round: 0.4 }).piece([[4.4, -22], [11, -15], [10, -11], [4.4, -16]], '#2e2a2a', { round: 1 }).finish({ shadowBlur: 2 }),
    mk('note1', [-8, -26, 24, 6], { pad: 4 }).piece(ellipse(-2, 0, 5.5, 4, 12), '#2e2a2a', { round: 1.5 }).piece(ellipse(15, -3, 5.5, 4, 12), '#2e2a2a', { round: 1.5 }).piece(rect(2.4, -22, 4.4, -1), '#2e2a2a', { round: 0.4 }).piece(rect(19.4, -25, 21.4, -4), '#2e2a2a', { round: 0.4 }).piece([[2.4, -22], [21.4, -25], [21.4, -20], [2.4, -17]], '#2e2a2a', { round: 0.8 }).finish({ shadowBlur: 2 }),
  ];
  return S; }],
  [['jet'], (mk, mkSoft, mkBig) => { const S = {};
  S.jet = mk('jet', [-60, -16, 60, 14])
    .piece([[-56, -2], [-40, -6], [44, -6], [58, 0], [44, 5], [-40, 5]], '#eceae4', { round: 4 })
    .piece([[-6, 0], [-22, 14], [-12, 14], [10, 2]], '#d8d6d0', { round: 1, lift: 1 })
    .piece([[-50, -4], [-58, -16], [-50, -16], [-40, -5]], '#d8d6d0', { round: 1, lift: 1 })
    .finish({ shadowBlur: 3 });
  return S; }],
  [['bomber'], (mk, mkSoft, mkBig) => { const S = {};
  S.bomber = mk('bomber', [-70, -20, 70, 18])
    .piece([[-64, -2], [-48, -8], [52, -8], [66, 0], [52, 6], [-48, 6]], '#3a3434', { round: 4, rim: 0.2 })
    .piece([[-10, -2], [-30, 18], [-14, 18], [12, 0]], '#2e2a2a', { round: 1, lift: 1, rim: 0.2 })
    .piece([[-56, -4], [-66, -18], [-56, -18], [-46, -6]], '#2e2a2a', { round: 1, lift: 1, rim: 0.2 })
    .finish({ shadowBlur: 3 });
  return S; }],
  [['sat'], (mk, mkSoft, mkBig) => { const S = {};
  S.sat = mk('sat', [-46, -14, 46, 14]).piece(rect(-10, -10, 10, 10), '#c9a24a', { round: 2 }).piece(rect(-44, -6, -14, 6), '#3a5a8a', { round: 1, lift: 1, paint: (g) => { g.strokeStyle = 'rgba(200,220,255,.5)'; g.lineWidth = 0.6; for (let x = -40; x < -14; x += 6) { g.beginPath(); g.moveTo(x, -6); g.lineTo(x, 6); g.stroke(); } } }).piece(rect(14, -6, 44, 6), '#3a5a8a', { round: 1, lift: 1 }).finish({ shadowBlur: 3 });
  return S; }],
  [['page'], (mk, mkSoft, mkBig) => { const S = {};
  S.page = mk('page', [-2, -16, 26, 16], { pad: 4 }).piece(rect(0, -14, 24, 14), '#f1e8d2', { round: 1, rough: 0.3, rim: 0.3, paint: (g) => { g.fillStyle = 'rgba(40,30,25,.55)'; for (let y = -10; y < 12; y += 3) g.fillRect(3, y, 17 - (y > 8 ? 8 : 0), 1); } }).finish({ shadowBlur: 2 });
  return S; }],
  [['icons'], (mk, mkSoft, mkBig) => { const S = {};
  S.icons = {
    dharma: mk('ic-dharma', [-16, -16, 16, 16], { pad: 4 }).piece(ellipse(0, 0, 14, 14, 18), '#d9a83a', { round: 3, paint: (g) => { g.strokeStyle = '#7a4a1a'; g.lineWidth = 1.6; g.beginPath(); g.arc(0, 0, 10, 0, 7); g.stroke(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; g.beginPath(); g.moveTo(Math.cos(a) * 3, Math.sin(a) * 3); g.lineTo(Math.cos(a) * 10, Math.sin(a) * 10); g.stroke(); } g.beginPath(); g.arc(0, 0, 2.6, 0, 7); g.fill(); } }).finish({ shadowBlur: 3 }),
    paper: mk('ic-paper', [-14, -16, 14, 16], { pad: 4 }).piece(rect(-12, -15, 12, 15), '#f3ead2', { round: 1, rim: 0.4, paint: (g) => { g.fillStyle = 'rgba(160,130,90,.3)'; for (let i = 0; i < 30; i++) g.fillRect(-11 + Math.random() * 22, -14 + Math.random() * 28, 2, 0.5); } }).finish({ shadowBlur: 3 }),
    numerals: mk('ic-num', [-24, -14, 24, 14], { pad: 4 }).piece(rect(-22, -12, 22, 12), '#efe4c8', { round: 2, rim: 0.4, paint: (g) => { g.fillStyle = '#3a2a20'; g.font = '600 15px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('1 2 3 0', 0, 1); } }).finish({ shadowBlur: 3 }),
    maize: mk('ic-maize', [-10, -22, 10, 20], { pad: 4 }).piece(ellipse(0, -2, 6.5, 17, 14), '#e8b83a', { round: 3, paint: (g) => { g.fillStyle = 'rgba(160,100,20,.45)'; for (let y = -16; y < 14; y += 3.2) for (let x = -5; x <= 5; x += 3.2) { g.beginPath(); g.arc(x + ((y / 3.2) % 2 ? 1.6 : 0), y, 1.1, 0, 7); g.fill(); } } }).piece([[-2, 18], [-10, 4], [-8, -10], [-3, 6], [0, 18]], '#7a9a3a', { round: 2, lift: 1 }).piece([[2, 18], [9, 2], [8, -12], [3, 4], [0, 18]], '#6a8a32', { round: 2, lift: 1.2 }).finish({ shadowBlur: 3 }),
    potato: mk('ic-potato', [-14, -11, 14, 11], { pad: 4 }).piece([[-12, 2], [-9, -7], [-1, -9], [8, -8], [12, -2], [10, 6], [2, 9], [-7, 8]], '#a8794a', { round: 5, rough: 1, paint: (g) => { g.fillStyle = 'rgba(80,50,25,.6)'; for (const [x, y] of [[-6, -2], [2, -4], [6, 3], [-2, 4]]) { g.beginPath(); g.arc(x, y, 1, 0, 7); g.fill(); } } }).finish({ shadowBlur: 3 }),
    silk: mk('ic-silk', [-18, -12, 18, 12], { pad: 4 }).piece(rect(-16, -8, 16, 8), '#b23a3a', { round: 4, paint: (g) => { g.fillStyle = 'rgba(240,200,90,.7)'; g.fillRect(-16, -2, 32, 3); } }).piece(ellipse(16, 0, 3, 8, 8), '#8a2a2a', { round: 1, lift: 1 }).finish({ shadowBlur: 3 }),
  };
  return S; }],
];