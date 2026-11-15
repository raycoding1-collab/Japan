// Jointed card puppets for every era: one body plan, many costumes.
// A person faces +x, stands on the origin, and is about 120 units tall.
import { put, strip, ellipse, KRAFT } from './paper.js';
import { KINDS } from './cutouts.js';
import { rng, fbm, DEG, hashStr, shade, rgb, clamp, smooth, sramp } from './util.js';

const SKIN = [['#70482f', '#5d3a26'], ['#7d5236', '#68422b'], ['#65412c', '#523322'], ['#a8774f', '#93653f'], ['#c69a74', '#b0845f'], ['#8a5c3a', '#764d30'], ['#e0b48f', '#c99c78']];
const lite = { thick: 1.1, lift: 1.6, rough: 0.5, seg: 40 };
const dab = (g, r, n, box, cols, len = 5, w = 1.3) => {
  g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = box[0] + r() * (box[2] - box[0]), y = box[1] + r() * (box[3] - box[1]), a = (r() - 0.5) * 1.2;
    g.strokeStyle = cols[(r() * cols.length) | 0]; g.lineWidth = w * (0.6 + r() * 0.8);
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len * 0.4); g.stroke();
  }
};
const texture = (col, r, kind) => (g) => {
  if (kind === 'stripe') { g.fillStyle = rgb(shade(col, -0.28), 0.55); for (let y = -44; y < 70; y += 7) g.fillRect(-30, y, 60, 2.2); }
  else if (kind === 'fringe') { g.fillStyle = rgb(shade(col, -0.25), 0.5); for (let y = -44; y < 70; y += 5) g.fillRect(-30, y, 60, 1.2); }
  else if (kind === 'dots') { g.fillStyle = 'rgba(255,246,228,.62)'; for (let y = -44; y < 70; y += 5) for (let x = -30 + ((y / 5) & 1) * 2.5; x < 30; x += 5) { g.beginPath(); g.arc(x, y, 0.9, 0, 7); g.fill(); } }
  else if (kind === 'checks') { g.fillStyle = rgb(shade(col, -0.35), 0.55); for (let y = -44; y < 70; y += 6) for (let x = -30 + ((y / 6) & 1) * 6; x < 30; x += 12) g.fillRect(x, y, 6, 6); }
  else if (kind === 'waves') { g.strokeStyle = 'rgba(255,246,228,.5)'; g.lineWidth = 0.8; for (let y = -44; y < 72; y += 4.5) for (let x = -30 + ((y / 4.5) & 1) * 4; x < 32; x += 8) for (const rr of [3.8, 2.4]) { g.beginPath(); g.arc(x, y, rr, Math.PI, 0); g.stroke(); } }
  else if (kind === 'lace') { for (let y = -44; y < 70; y += 4.2) { g.fillStyle = rgb(shade(col, -0.35), 0.55); g.fillRect(-30, y, 60, 1.1); g.fillStyle = 'rgba(255,240,200,.35)'; for (let x = -30; x < 30; x += 3.4) g.fillRect(x, y + 1.4, 1, 2.2); } }
  else dab(g, r, 16, [-16, -42, 16, 60], [rgb(shade(col, -0.25), 0.35), rgb(shade(col, 0.2), 0.3)]);
};

// Looks: who these people are, by era.
export const LOOKS = {
  walkA: { skin: 0, top: 'hide', topCol: '#a35f3c', strap: 1, hair: 'short', item: 'spear', pose: 'walk' },
  walkB: { skin: 2, top: 'hide', topCol: '#b88a52', hair: 'long', item: 'bundle', pose: 'walk' },
  walkC: { skin: 1, top: 'hide', topCol: '#c29a62', hair: 'curly', pose: 'walk', small: 0.66 },
  walkD: { skin: 5, top: 'hide', topCol: '#8e6a48', strap: 1, hair: 'long', item: 'staff', pose: 'walk' },
  blower: { skin: 0, top: 'hide', topCol: '#a35f3c', strap: 1, hair: 'long', pose: 'kneel' },
  torchbearer: { skin: 2, top: 'hide', topCol: '#b88a52', hair: 'curly', pose: 'stand', item: 'torch' },
  farmer: { skin: 3, top: 'tunic', topCol: '#d8c7a2', hair: 'short', pose: 'kneel', hairCol: '#2b1d16' },
  farmer2: { skin: 1, top: 'tunic', topCol: '#b59a6b', hair: 'long', pose: 'stand', item: 'sickle' },
  riceF: { skin: 4, top: 'tunic', topCol: '#5f7a8c', hat: 'cone', hatCol: '#cfae6c', pose: 'stand', legs: 'trousers', legCol: '#4c5d6b' },
  andean: { skin: 3, top: 'poncho', topCol: '#b8452f', pattern: 'stripe', hat: 'wide', hatCol: '#6b4a32', pose: 'stand', legs: 'trousers', legCol: '#3d3a46' },
  maizeF: { skin: 3, top: 'tunic', topCol: '#e6dcc6', hair: 'long', pose: 'stand', hairCol: '#1f1611' },
  scribe: { skin: 3, top: 'kaunakes', topCol: '#e8dcc0', hair: 'bald', beard: 0, pose: 'sit' },
  sumer: { skin: 3, top: 'dress', topCol: '#c9b089', legs: 'robe', legCol: '#c9b089', hair: 'bun', hat: 'band', hatCol: '#6c4b8c', pose: 'stand' },
  sumer2: { skin: 1, top: 'kaunakes', topCol: '#d6c4a0', hair: 'long', beard: 1, pose: 'stand', item: 'basket' },
  wheelwright: { skin: 3, top: 'kaunakes', topCol: '#d8c9a8', hair: 'short', beard: 1, pose: 'stand' },
  scholarA: { skin: 4, top: 'robe', topCol: '#3a3a5a', legs: 'robe', legCol: '#3a3a5a', hat: 'cap', hatCol: '#1e1e24', beard: 1, pose: 'stand', item: 'book' },
  scholarB: { skin: 6, top: 'robe', topCol: '#6a3a2a', legs: 'robe', legCol: '#6a3a2a', hair: 'bald', beard: 1, beardCol: '#cfc6b8', pose: 'stand', item: 'book' },
  doctor: { skin: 6, top: 'coat', topCol: '#2c2c34', sleeve: '#2c2c34', legs: 'trousers', legCol: '#26262a', hat: 'top', hatCol: '#202024', beard: 1, beardCol: '#8a6a4a', pose: 'walk', item: 'bag' },
  jarW: { skin: 2, top: 'dress', topCol: '#d8c8a8', legs: 'skirt', legCol: '#d8c8a8', hair: 'long', pose: 'walk', item: 'jar' },
  porter: { skin: 1, top: 'kaunakes', topCol: '#c8b48c', hair: 'short', beard: 1, pose: 'walk', item: 'basket' },
  urukKid: { skin: 3, top: 'tunic', topCol: '#e0d0b0', hair: 'short', pose: 'walk', small: 0.66 },
  seller: { skin: 0, top: 'kaunakes', topCol: '#e2d4b4', hair: 'long', beard: 1, hat: 'band', hatCol: '#3a5a6a', pose: 'sit' },
  merchant: { skin: 3, top: 'robe', topCol: '#3f5f8a', legs: 'robe', legCol: '#3f5f8a', sleeve: '#3f5f8a', hat: 'turban', hatCol: '#e7dcc4', beard: 1, pose: 'walk' },
  monk: { skin: 4, top: 'robe', topCol: '#d97a26', legs: 'robe', legCol: '#d97a26', hair: 'bald', pose: 'walk', item: 'scroll' },
  hanM: { skin: 4, top: 'robe', topCol: '#7a2f2a', legs: 'robe', legCol: '#7a2f2a', sleeve: '#7a2f2a', hair: 'bun', hat: 'topknot', pose: 'stand' },
  maliM: { skin: 0, top: 'robe', topCol: '#e9e1cf', legs: 'robe', legCol: '#e9e1cf', sleeve: '#e9e1cf', hat: 'turban', hatCol: '#2f5c8f', pose: 'stand' },
  navigator: { skin: 5, top: 'bare', wrap: '#8a5a36', hair: 'bun', pose: 'stand', tattoo: 1 },
  paddler: { skin: 5, top: 'bare', wrap: '#b07a46', hair: 'curly', pose: 'kneel' },
  printer: { skin: 6, top: 'tunic', topCol: '#4d6070', apron: '#d9cfbb', sleeve: '#4d6070', legs: 'trousers', legCol: '#3a3633', hat: 'soft', hatCol: '#5c3b2b', pose: 'stand' },
  reader: { skin: 6, top: 'dress', topCol: '#7c3a3a', legs: 'robe', legCol: '#7c3a3a', sleeve: '#7c3a3a', hat: 'hood', hatCol: '#e8e0cc', pose: 'stand', item: 'book' },
  sailor: { skin: 6, top: 'tunic', topCol: '#8a6b47', legs: 'trousers', legCol: '#4b4136', sleeve: '#8a6b47', hat: 'cap', hatCol: '#7a2f2a', beard: 1, pose: 'stand' },
  taino: { skin: 3, top: 'bare', wrap: '#d9c6a0', hair: 'long', pose: 'stand' },
  galileo: { skin: 6, top: 'robe', topCol: '#2a2523', legs: 'robe', legCol: '#2a2523', sleeve: '#2a2523', hair: 'short', hairCol: '#8c8378', beard: 1, beardCol: '#a39886', pose: 'stand' },
  worker: { skin: 6, top: 'coat', topCol: '#4a4c52', sleeve: '#4a4c52', legs: 'trousers', legCol: '#3a3634', hat: 'cap', hatCol: '#3b3632', pose: 'stand' },
  worker2: { skin: 0, top: 'shirt', topCol: '#c7b79a', sleeve: '#c7b79a', legs: 'trousers', legCol: '#3f4652', hat: 'cap', hatCol: '#5a4a3c', pose: 'walk' },
  lamplighter: { skin: 6, top: 'coat', topCol: '#3f4a5a', sleeve: '#3f4a5a', legs: 'trousers', legCol: '#2f2c2c', hat: 'top', hatCol: '#2a2626', pose: 'walk', item: 'pole' },
  lady: { skin: 4, top: 'dress', topCol: '#5d6b4a', legs: 'robe', legCol: '#5d6b4a', sleeve: '#5d6b4a', hair: 'bun', pose: 'walk' },
  phoneA: { skin: 1, top: 'hoodie', topCol: '#d0533c', sleeve: '#d0533c', legs: 'trousers', legCol: '#2f3b52', hair: 'curly', pose: 'stand', item: 'phone' },
  phoneB: { skin: 6, top: 'shirt', topCol: '#e9e4d8', sleeve: '#e9e4d8', legs: 'trousers', legCol: '#3a3a40', hair: 'short', hairCol: '#5a3a22', pose: 'stand', item: 'phone' },
  phoneC: { skin: 4, top: 'dress', topCol: '#2f6f6a', legs: 'skirt', legCol: '#2f6f6a', sleeve: '#2f6f6a', hair: 'long', pose: 'stand', item: 'phone' },
  phoneD: { skin: 3, top: 'coat', topCol: '#8a7a5c', sleeve: '#8a7a5c', legs: 'trousers', legCol: '#2c2c33', hair: 'bald', beard: 1, beardCol: '#cfc6b8', pose: 'stand', item: 'phone' },
  phoneW1: { skin: 3, top: 'coat', topCol: '#3e5a7a', sleeve: '#3e5a7a', legs: 'trousers', legCol: '#2c2c33', hair: 'short', pose: 'walk', item: 'phone' },
  phoneW2: { skin: 5, top: 'hoodie', topCol: '#7a8a52', sleeve: '#7a8a52', legs: 'trousers', legCol: '#3a3f4a', hair: 'curly', pose: 'walk', item: 'phone' },
  sitLap: { skin: 6, top: 'shirt', topCol: '#c45a4a', sleeve: '#c45a4a', legs: 'trousers', legCol: '#2f3b52', hair: 'bun', hairCol: '#6a4a2a', pose: 'sit' },
  painter: { skin: 6, top: 'tunic', topCol: '#8a3a3a', sleeve: '#8a3a3a', legs: 'trousers', legCol: '#3a3436', hat: 'soft', hatCol: '#2a2a30', beard: 1, hairCol: '#5a3a22', pose: 'stand' },
  patron: { skin: 6, top: 'robe', topCol: '#3a5a4a', legs: 'robe', legCol: '#3a5a4a', sleeve: '#3a5a4a', hat: 'soft', hatCol: '#8a2a2e', pose: 'stand' },
  debater1: { skin: 6, top: 'coat', topCol: '#5a3a4a', sleeve: '#5a3a4a', legs: 'trousers', legCol: '#e8e0cc', hair: 'long', hairCol: '#d8d4cc', pose: 'stand' },
  debater2: { skin: 4, top: 'coat', topCol: '#3a4a6a', sleeve: '#3a4a6a', legs: 'trousers', legCol: '#2a2a30', hair: 'bun', hairCol: '#e8e4dc', pose: 'stand', item: 'book' },
  reader2: { skin: 6, top: 'dress', topCol: '#7a8a6a', legs: 'robe', legCol: '#7a8a6a', sleeve: '#7a8a6a', hair: 'bun', hairCol: '#4a3020', pose: 'stand', item: 'book' },
  citizen: { skin: 0, top: 'shirt', topCol: '#e8e0cc', sleeve: '#e8e0cc', legs: 'trousers', legCol: '#3a4a6a', hat: 'wide', hatCol: '#3a3a40', pose: 'stand' },
  citizen2: { skin: 1, top: 'dress', topCol: '#2c4a8a', legs: 'robe', legCol: '#2c4a8a', sleeve: '#2c4a8a', hat: 'band', hatCol: '#c8282e', pose: 'stand' },
  mother: { skin: 6, top: 'dress', topCol: '#4a3a3a', legs: 'robe', legCol: '#4a3a3a', sleeve: '#4a3a3a', hair: 'bun', hairCol: '#3a2a20', pose: 'stand' },
  father: { skin: 6, top: 'coat', topCol: '#2a2a30', sleeve: '#2a2a30', legs: 'trousers', legCol: '#2a2a30', hat: 'top', hatCol: '#1e1c1c', beard: 1, pose: 'stand' },
  child1800: { skin: 6, top: 'shirt', topCol: '#c8b89a', sleeve: '#c8b89a', legs: 'trousers', legCol: '#4a4038', hat: 'cap', hatCol: '#5a4a3c', pose: 'walk', small: 0.66 },
  child1800b: { skin: 1, top: 'dress', topCol: '#a85a4a', legs: 'skirt', legCol: '#a85a4a', sleeve: '#a85a4a', hair: 'bun', pose: 'walk', small: 0.66 },
  photog: { skin: 6, top: 'coat', topCol: '#3a3634', sleeve: '#3a3634', legs: 'trousers', legCol: '#2a2626', hat: 'cap', hatCol: '#2a2626', pose: 'stand' },
  cordwoman: { skin: 3, top: 'dress', topCol: '#3a6a6a', legs: 'skirt', legCol: '#3a6a6a', sleeve: '#3a6a6a', hair: 'bun', pose: 'stand' },
  radioDad: { skin: 0, top: 'shirt', topCol: '#d8d0b8', sleeve: '#d8d0b8', legs: 'trousers', legCol: '#4a4a54', hair: 'short', pose: 'stand' },
  radioKid: { skin: 0, top: 'dress', topCol: '#c45a4a', legs: 'skirt', legCol: '#c45a4a', sleeve: '#c45a4a', hair: 'curly', pose: 'stand', small: 0.66 },
  scientist: { skin: 6, top: 'coat', topCol: '#efece4', sleeve: '#efece4', legs: 'trousers', legCol: '#3a3a40', hair: 'short', hairCol: '#8c8378', pose: 'stand' },
  saved: { skin: 4, top: 'shirt', topCol: '#d8b860', sleeve: '#d8b860', legs: 'trousers', legCol: '#3a4a5a', hair: 'curly', pose: 'stand' },
  saved2: { skin: 0, top: 'dress', topCol: '#5a8a7a', legs: 'skirt', legCol: '#5a8a7a', sleeve: '#5a8a7a', hair: 'long', pose: 'stand' },
  saved3: { skin: 6, top: 'coat', topCol: '#8a5a3a', sleeve: '#8a5a3a', legs: 'trousers', legCol: '#2c2c33', hair: 'bald', beard: 1, beardCol: '#cfc6b8', pose: 'stand' },
  fisher: { skin: 3, top: 'shirt', topCol: '#d8a040', sleeve: '#d8a040', legs: 'trousers', legCol: '#3a4a5a', hat: 'cap', hatCol: '#2c4a6a', pose: 'kneel', item: 'phone' },
  granny: { skin: 2, top: 'dress', topCol: '#7a4a6a', legs: 'skirt', legCol: '#7a4a6a', sleeve: '#7a4a6a', hair: 'bun', hairCol: '#e0dcd4', pose: 'stand', item: 'phone' },
  herder: { skin: 0, top: 'poncho', topCol: '#b8282e', pattern: 'stripe', legs: 'trousers', legCol: '#3a3436', hair: 'short', pose: 'stand', item: 'phone' },
  kid: { skin: 0, top: 'hoodie', topCol: '#e3b341', sleeve: '#e3b341', legs: 'trousers', legCol: '#34507a', hair: 'curly', pose: 'stand', small: 0.66 },
};

const L_UMB = '#b84a3a';
function bakeItem(mk, name) {
  switch (name) {
    case 'spear': return mk('it-spear', [-4, -132, 5, 4], { pad: 5 }).piece(strip(0.5, -112, 0, 2, 2.6, 3.2), '#5b4331', { round: 1, thick: 0.9, rough: 0.6 }).piece([[-3, -110], [0.5, -130], [4, -110], [0.5, -106]], '#7a7068', { round: 0.8, lift: 1, thick: 0.6 }).finish({ shadowBlur: 2 });
    case 'staff': return mk('it-staff', [-4, -128, 5, 4], { pad: 5 }).piece(strip(0.5, -124, 0, 2, 3, 4.2), '#5b4331', { round: 1.2, thick: 1, rough: 0.9, seg: 30 }).finish({ shadowBlur: 3 });
    case 'pole': return mk('it-pole', [-6, -110, 10, 4], { pad: 5 }).piece(strip(0.5, -104, 0, 2, 2.4, 3), '#3d3430', { round: 1, thick: 0.8 }).piece([[-2, -104], [6, -108], [7, -103], [1, -100]], '#8a8070', { round: 0.8, lift: 1, thick: 0.6 }).finish({ shadowBlur: 2 });
    case 'bundle': return mk('it-bundle', [-14, -14, 14, 14], { pad: 5 }).piece(ellipse(0, 0, 12, 10, 12), '#9a7b52', { round: 3, paint: (g) => { g.strokeStyle = 'rgba(60,40,25,.6)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-12, -2); g.lineTo(12, 2); g.moveTo(-3, -10); g.lineTo(2, 10); g.stroke(); } }).finish({ shadowBlur: 3 });
    case 'torch': return mk('it-torch', [-4, -46, 5, 4], { pad: 5 }).piece(strip(0.5, -40, 0, 2, 3.4, 2.6), '#4a3423', { round: 1, thick: 0.9 }).piece([[-3, -38], [3.5, -38], [4, -46], [-3.5, -46]], '#2a1c14', { round: 1, lift: 0.6, thick: 0.6 }).finish({ shadowBlur: 2 });
    case 'sickle': return mk('it-sickle', [-4, -30, 22, 4], { pad: 5 }).piece(strip(0.5, -10, 0, 2, 3, 3), '#5b4331', { round: 1, thick: 0.8 }).piece([[0, -9], [6, -24], [16, -26], [20, -21], [14, -22], [8, -19], [3, -8]], '#8f8a80', { round: 1.5, lift: 1, thick: 0.7 }).finish({ shadowBlur: 2 });
    case 'jar': return mk('it-jar', [-12, -30, 12, 3], { pad: 5 }).piece([[-5, 0], [-10, -8], [-9, -18], [-4, -22], [-5, -27], [5, -27], [4, -22], [9, -18], [10, -8], [5, 0]], '#a8653c', { round: 2.5, paint: (g) => { g.fillStyle = 'rgba(240,215,170,.4)'; g.fillRect(-9, -15, 18, 1.4); g.fillRect(-9, -11, 18, 0.8); } }).piece([[-6, -26], [6, -26], [6, -29], [-6, -29]], '#8a4f2e', { round: 1, lift: 0.8 }).finish({ shadowBlur: 2 });
    case 'bag': return mk('it-bag', [-14, -8, 14, 18], { pad: 5 }).piece([[-11, 2], [11, 2], [13, 16], [-13, 16]], '#2a2220', { round: 3, paint: (g) => { g.fillStyle = 'rgba(200,170,110,.7)'; g.fillRect(-2, 4, 4, 3); } }).piece([[-6, 3], [-5, -5], [5, -5], [6, 3], [3, 3], [2.5, -2], [-2.5, -2], [-3, 3]], '#3a2e28', { round: 1.5, lift: 0.8 }).finish({ shadowBlur: 2 });
    case 'basket': return mk('it-basket', [-12, -16, 12, 4], { pad: 5 }).piece([[-11, -14], [11, -14], [8, 2], [-8, 2]], '#b08a50', { round: 2, paint: (g) => { g.strokeStyle = 'rgba(90,60,30,.5)'; g.lineWidth = 1; for (let y = -12; y < 2; y += 3) { g.beginPath(); g.moveTo(-12, y); g.lineTo(12, y); g.stroke(); } } }).piece(ellipse(0, -15, 9, 3.2, 10), '#d8c27a', { round: 2, lift: 1, thick: 0.6 }).finish({ shadowBlur: 2 });
    case 'scroll': return mk('it-scroll', [-10, -6, 10, 6], { pad: 5 }).piece([[-9, -3.5], [9, -3.5], [9, 3.5], [-9, 3.5]], '#efe2bf', { round: 2 }).piece(ellipse(-9, 0, 2.2, 4.5, 8), '#8a5a2a', { round: 1, lift: 0.8, thick: 0.5 }).finish({ shadowBlur: 2 });
    case 'book': return mk('it-book', [-9, -8, 9, 8], { pad: 5 }).piece([[-8, -6], [8, -6], [8, 6], [-8, 6]], '#6a3b25', { round: 1 }).piece([[-7, -5], [7, -5], [7, 4.5], [-7, 4.5]], '#efe5cc', { round: 0.8, lift: 0.6, thick: 0.4, paint: (g) => { g.fillStyle = 'rgba(60,40,30,.45)'; for (let y = -3.5; y < 4; y += 1.6) { g.fillRect(-6, y, 5, 0.6); g.fillRect(1, y, 5, 0.6); } } }).finish({ shadowBlur: 2 });
    case 'flute': return mk('it-flute', [-3, -4, 4, 30], { pad: 4 }).piece(strip(0.5, -2, 0.5, 28, 2.8, 2.3), '#e8dcc0', { round: 1, thick: 0.6, rough: 0.3, paint: (g) => { g.fillStyle = 'rgba(70,50,35,.85)'; for (let y = 6; y < 26; y += 3.2) { g.beginPath(); g.arc(0.5, y, 0.6, 0, 7); g.fill(); } } }).finish({ shadowBlur: 2 });
    case 'hoe': return mk('it-hoe', [-4, -110, 22, 4], { pad: 5 }).piece(strip(0.5, -104, 0, 2, 2.8, 3.2), '#6b5038', { round: 1, thick: 0.8 }).piece([[-2, -110], [18, -104], [20, -96], [2, -100]], '#8a8478', { round: 1.5, lift: 1, thick: 0.7 }).finish({ shadowBlur: 2 });
    case 'ge': return mk('it-ge', [-4, -134, 24, 4], { pad: 5 }).piece(strip(0.5, -126, 0, 2, 2.6, 3), '#4a3626', { round: 1, thick: 0.8 }).piece([[-1, -124], [22, -128], [24, -124], [3, -118], [-1, -118]], '#7a8a80', { round: 1, lift: 1, thick: 0.7 }).piece(strip(0.5, -126, 0.5, -134, 1.6, 0.6), '#7a8a80', { round: 0.5, lift: 0.8 }).piece([[-3, -116], [-6, -104], [-2, -108], [0, -114]], '#a8282a', { round: 1, lift: 0.8, thick: 0.4 }).finish({ shadowBlur: 2 });
    case 'shovel': return mk('it-shovel', [-8, -100, 8, 26], { pad: 5 }).piece(strip(0, -96, 0, 6, 2.8, 3), '#7a5a3a', { round: 1, thick: 0.8 }).piece([[-6, 4], [6, 4], [6.5, 18], [0, 24], [-6.5, 18]], '#6a6e72', { round: 2, lift: 1, thick: 0.7 }).piece([[-5, -96], [5, -96], [5, -92], [-5, -92]], '#5a4028', { round: 1, lift: 0.6 }).finish({ shadowBlur: 2 });
    case 'bowl': return mk('it-bowl', [-10, -8, 10, 4], { pad: 4 }).piece([[-9, -6], [9, -6], [6, 1], [-6, 1]], '#7a5a3e', { round: 2.5 }).finish({ shadowBlur: 2 });
    case 'brush': return mk('it-brush', [-3, -4, 3, 24], { pad: 4 }).piece(strip(0, -2, 0, 18, 1.8, 1.6), '#7a5a2a', { round: 0.6, thick: 0.5 }).piece([[-1.4, 17], [1.4, 17], [0.6, 24], [-0.6, 24]], '#1e1a18', { round: 0.8, lift: 0.5 }).finish({ shadowBlur: 1.5 });
    case 'jie': return mk('it-jie', [-8, -140, 10, 4], { pad: 5 }).piece(strip(0.5, -136, 0, 2, 2.6, 3), '#5b4331', { round: 1, thick: 0.8 }).piece([[-3, -134], [4, -134], [5, -112], [3, -104], [-1, -114], [-4, -108], [-5, -122]], '#c8b8a0', { round: 2, lift: 1, rough: 1.4, paint: (g) => { g.strokeStyle = 'rgba(120,100,80,.6)'; g.lineWidth = 0.6; for (let x = -4; x < 5; x += 1.4) { g.beginPath(); g.moveTo(x, -134); g.lineTo(x + 0.4, -108); g.stroke(); } } }).piece([[-3, -112], [4, -112], [4.5, -94], [-3.5, -96]], '#b8a888', { round: 2, lift: 0.8, rough: 1.4 }).finish({ shadowBlur: 2 });
    case 'fan': return mk('it-fan', [-14, -22, 14, 4], { pad: 4 }).piece([[0, 2], [-12, -16], [-6, -20], [0, -21], [6, -20], [12, -16]], '#efe4c8', { round: 2, paint: (g) => { g.strokeStyle = 'rgba(120,90,60,.5)'; g.lineWidth = 0.6; for (let k = -5; k <= 5; k++) { g.beginPath(); g.moveTo(0, 1); g.lineTo(k * 2.3, -20); g.stroke(); } } }).finish({ shadowBlur: 2 });
    case 'redbook': return mk('it-redbook', [-6, -7, 6, 7], { pad: 4 }).piece([[-5, -6], [5, -6], [5, 6], [-5, 6]], '#b8282a', { round: 0.8 }).finish({ shadowBlur: 1.5 });
    case 'medbox': return mk('it-medbox', [-12, -8, 12, 14], { pad: 4 }).piece([[-10, -6], [10, -6], [10, 12], [-10, 12]], '#d8d0b8', { round: 1.5, paint: (g) => { g.fillStyle = '#c8282a'; g.fillRect(-2, -2, 4, 11); g.fillRect(-5.5, 1.5, 11, 4); } }).finish({ shadowBlur: 2 });
    case 'lanternH': return mk('it-lanternH', [-8, -4, 8, 34], { pad: 4 }).piece(strip(0, -2, 0, 14, 1.2, 1.2), '#4a3626', { round: 0.4 }).piece(ellipse(0, 22, 7, 9, 12), '#d8402e', { round: 2, lift: 0.8, paint: (g) => { g.strokeStyle = 'rgba(90,20,10,.5)'; g.lineWidth = 0.7; for (const x of [-3, 0, 3]) { g.beginPath(); g.moveTo(x, 13); g.lineTo(x, 31); g.stroke(); } } }).piece([[-3, 12], [3, 12], [3, 14], [-3, 14]], '#c9a24a', { round: 0.4, lift: 0.5 }).finish({ shadowBlur: 2 });
    case 'bow': return mk('it-bow', [-12, -96, 8, 44], { pad: 5 }).piece([[-1.5, -92], [1.5, -93], [-4, -56], [-7, -12], [-5.5, 24], [-1, 40], [-3.4, 41], [-9, 24], [-10.4, -12], [-7.4, -56]], '#6a3a26', { round: 1, thick: 0.7, rough: 0.3 }).piece(strip(0, -92, -2.4, 40, 0.6, 0.6), '#e8e0cc', { round: 0.2, lift: 0.4, thick: 0.2 }).finish({ shadowBlur: 2 });
    case 'teppo': return mk('it-teppo', [-5, -120, 6, 4], { pad: 5 }).piece(strip(0.5, -110, 0, 2, 2.4, 2.8), '#3a3438', { round: 0.6, thick: 0.7, rough: 0.2 }).piece([[-3, -8], [3.5, -8], [5, 4], [-2, 4]], '#6a4428', { round: 1.2, lift: 0.8 }).piece([[-2.6, -40], [3.2, -40], [3.4, -8], [-2.4, -8]], '#7a5030', { round: 1, lift: 0.8 }).finish({ shadowBlur: 2 });
    case 'hammer': return mk('it-hammer', [-10, -40, 10, 4], { pad: 5 }).piece(strip(0, -30, 0, 2, 2.4, 2.6), '#6a5038', { round: 1, thick: 0.7 }).piece([[-9, -38], [9, -38], [9, -29], [-9, -29]], '#4a4a50', { round: 1.2, lift: 1 }).finish({ shadowBlur: 2 });
    case 'rake': return mk('it-rake', [-14, -120, 14, 6], { pad: 5 }).piece(strip(0.5, -112, 0, 2, 2.2, 2.6), '#8a6a44', { round: 1, thick: 0.7 }).piece([[-13, -118], [13, -118], [13, -112], [-13, -112]], '#8a6a44', { round: 1, lift: 0.8, paint: (g) => { g.fillStyle = '#6a4a2a'; for (let x = -12; x < 13; x += 3.2) g.fillRect(x, -122, 1.2, 5); } }).finish({ shadowBlur: 2 });
    case 'umbrella': return mk('it-umbrella', [-34, -70, 34, 4], { pad: 5 }).piece(strip(0, -60, 0, 2, 1.6, 1.8), '#5a4430', { round: 0.6, thick: 0.6 }).piece([[-32, -48], [-16, -60], [0, -64], [16, -60], [32, -48], [16, -50], [0, -51], [-16, -50]], L_UMB, { round: 2, lift: 1, paint: (g) => { g.strokeStyle = 'rgba(60,30,20,.4)'; g.lineWidth = 0.7; for (let k = -4; k <= 4; k++) { g.beginPath(); g.moveTo(0, -63); g.lineTo(k * 8, -49); g.stroke(); } g.fillStyle = 'rgba(255,250,240,.6)'; g.beginPath(); g.ellipse(0, -60, 6, 2.4, 0, 0, 7); g.fill(); } }).finish({ shadowBlur: 2 });
    case 'shaku': return mk('it-shaku', [-3, -4, 3, 22], { pad: 4 }).piece([[-1.6, -2], [1.6, -2], [2, 20], [-2, 20]], '#c8a878', { round: 1 }).finish({ shadowBlur: 1.5 });
    case 'paddle': return mk('it-paddle', [-6, -96, 6, 26], { pad: 4 }).piece(strip(0, -90, 0, 6, 2.2, 2.4), '#7a5a3a', { round: 1, thick: 0.6 }).piece(ellipse(0, 14, 4.6, 13, 10), '#8a6a44', { round: 2, lift: 0.8 }).finish({ shadowBlur: 2 });
    case 'mirror': return mk('it-mirror', [-12, -12, 12, 12], { pad: 4 }).piece(ellipse(0, 0, 10.5, 10.5, 18), '#a8884a', { round: 4, paint: (g) => { g.fillStyle = 'rgba(255,240,190,.5)'; g.beginPath(); g.arc(-2, -2, 6, 0, 7); g.fill(); } }).finish({ shadowBlur: 2 });
    case 'crane': return mk('it-crane', [-12, -12, 14, 6], { pad: 4 }).piece([[-11, 2], [-2, -2], [0, -10], [3, -2], [13, -6], [6, 2], [2, 4]], '#e85a6a', { round: 0.6, rough: 0.2, paint: (g) => { g.strokeStyle = 'rgba(120,20,40,.45)'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(-2, -2); g.lineTo(2, 4); g.lineTo(3, -2); g.stroke(); } }).finish({ shadowBlur: 1.5 });
    case 'chochin': return mk('it-chochin', [-8, -4, 8, 34], { pad: 4 }).piece(strip(0, -2, 0, 12, 1.2, 1.2), '#4a3626', { round: 0.4 }).piece(ellipse(0, 22, 7, 10, 14), '#f2e6c8', { round: 3, lift: 0.8, paint: (g) => { g.strokeStyle = 'rgba(120,90,60,.45)'; g.lineWidth = 0.6; for (let y = 14; y < 32; y += 2.6) { g.beginPath(); g.moveTo(-7, y); g.lineTo(7, y); g.stroke(); } } }).piece([[-4, 11], [4, 11], [4, 13.4], [-4, 13.4]], '#2a2420', { round: 0.4, lift: 0.5 }).finish({ shadowBlur: 2 });
    case 'tongs': return mk('it-tongs', [-4, -6, 6, 46], { pad: 4 }).piece([[-1.2, -2], [1.2, -2], [3.4, 44], [1.6, 44]], '#3a3438', { round: 0.5 }).piece([[-1.2, -2], [1.2, -2], [-1, 44], [-2.8, 44]], '#2a2628', { round: 0.5, lift: 0.4 }).finish({ shadowBlur: 2 });
    case 'radio': return mk('it-radio', [-8, -6, 8, 8], { pad: 4 }).piece([[-7, -5], [7, -5], [7, 7], [-7, 7]], '#3a5c6c', { round: 1.4, paint: (g) => { g.fillStyle = 'rgba(230,220,200,.8)'; g.beginPath(); g.arc(-2, 1, 3.4, 0, 7); g.fill(); g.fillStyle = '#c9a24a'; g.fillRect(3, -3, 2.4, 8); } }).finish({ shadowBlur: 1.5 });
    case 'phone': return mk('it-phone', [-5, -8, 5, 8], { pad: 4 }).piece([[-4, -7.5], [4, -7.5], [4, 7.5], [-4, 7.5]], '#1d1f24', { round: 1.6, rough: 0.2 }).finish({ shadowBlur: 2 });
  }
  return null;
}

function bakeLook(mk, id, L) {
  const [skin, skinD] = SKIN[L.skin ?? 0], r = rng(900 + hashStr(id));
  const top = L.top || 'hide', col = L.topCol || '#a35f3c', P = { L };
  const hairCol = L.hairCol || '#2a1c15';
  // torso
  const T = mk(id + '-torso', [-20, -46, 20, 24], { pad: 6 });
  T.piece([[-11, 3], [11, 3], [12.5, -18], [14.5, -34], [8, -40], [-8, -40], [-14.5, -34], [-12.5, -18]], skin, { ...lite, round: 5 });
  const paint = texture(col, r, L.pattern);
  if (top === 'hide') T.piece(L.strap ? [[-13.5, 5], [13.5, 5], [14.5, -15], [9, -39], [3, -40.5], [-13, -13]] : [[-13.5, 5], [13.5, 5], [14.5, -14], [-14, -12]], col, { ...lite, round: 2, paint });
  else if (top === 'tunic' || top === 'kaunakes') T.piece([[-14.5, top === 'kaunakes' ? 22 : 16], [15.5, top === 'kaunakes' ? 22 : 16], [14.5, -12], [14, -35], [7, -41], [2, -37], [-3, -41], [-9, -40], [-14, -35], [-14.8, -12]], col, { ...lite, round: 3, paint: top === 'kaunakes' ? texture(col, r, 'fringe') : paint });
  else if (top === 'robe' || top === 'dress') T.piece([[-15, 8], [15.5, 8], [14.5, -12], [14, -35], [7, -41], [2, -37.5], [-3, -41], [-9, -40], [-14, -35], [-15, -12]], col, { ...lite, round: 3, paint });
  else if (top === 'coat') T.piece([[-15.5, 24], [16, 24], [15, -12], [14.5, -35], [7, -41], [2, -33], [-3, -41], [-9, -40], [-14.5, -35], [-15.5, -12]], col, { ...lite, round: 3, paint: (g) => { paint(g); g.fillStyle = 'rgba(20,16,14,.5)'; for (let y = -28; y < 20; y += 9) { g.beginPath(); g.arc(3.5, y, 1.1, 0, 7); g.fill(); } } });
  else if (top === 'shirt') T.piece([[-14, 6], [14.5, 6], [14, -12], [14, -35], [7, -41], [2, -36], [-3, -41], [-9, -40], [-14, -35], [-14.5, -12]], col, { ...lite, round: 3, paint });
  else if (top === 'hoodie') T.piece([[-15, 8], [15.5, 8], [15, -12], [14.5, -35], [7, -41], [-9, -42], [-17, -38], [-15, -12]], col, { ...lite, round: 4, paint: (g) => { paint(g); g.fillStyle = rgb(shade(col, -0.2), 0.6); g.fillRect(-8, -4, 15, 9); } });
  else if (top === 'armor') T.piece([[-16, 12], [16.5, 12], [16, -12], [15.5, -36], [7, -41], [-9, -41], [-15.5, -36], [-16.5, -12]], col, { ...lite, round: 2.5, paint: texture(col, r, 'lace') });
  else if (top === 'suit') T.piece([[-15, 10], [15.5, 10], [14.5, -12], [14, -35], [7, -41], [2, -37], [-3, -41], [-9, -40], [-14, -35], [-15, -12]], col, { ...lite, round: 3, paint: (g) => { paint(g); g.fillStyle = '#eeeae2'; g.beginPath(); g.moveTo(1, -40); g.lineTo(9, -40); g.lineTo(5, -22); g.closePath(); g.fill(); g.fillStyle = L.tie || '#7a2a2e'; g.beginPath(); g.moveTo(4.3, -38); g.lineTo(6.6, -38); g.lineTo(7.2, -24); g.lineTo(5.4, -21); g.lineTo(3.8, -24); g.closePath(); g.fill(); g.strokeStyle = rgb(shade(col, -0.4), 0.7); g.lineWidth = 0.9; g.beginPath(); g.moveTo(0, -40); g.lineTo(5, -20); g.lineTo(5, 10); g.stroke(); } });
  else if (top === 'sailor') T.piece([[-14.5, 6], [15, 6], [14, -12], [14, -35], [7, -41], [2, -37], [-3, -41], [-9, -40], [-14, -35], [-14.5, -12]], col, { ...lite, round: 3, paint: (g) => { g.fillStyle = L.collarCol || '#2a3a5c'; g.beginPath(); g.moveTo(-14, -40); g.lineTo(9, -41); g.lineTo(4, -26); g.lineTo(-14, -28); g.closePath(); g.fill(); g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(-14, -30); g.lineTo(3.4, -28.5); g.stroke(); g.fillStyle = L.scarf || '#b8282e'; g.beginPath(); g.moveTo(2, -30); g.lineTo(9, -30); g.lineTo(6, -20); g.closePath(); g.fill(); } });
  else if (top === 'poncho') T.piece([[-19, 10], [20, 10], [15, -20], [8, -40], [-8, -40], [-15, -20]], col, { ...lite, round: 3, paint });
  if (top === 'bare' || L.wrap) T.piece([[-13.5, 12], [13.5, 12], [14, -4], [-13.5, -3]], L.wrap || '#8a5a36', { ...lite, round: 2, paint: texture(L.wrap || '#8a5a36', r, 'fringe') });
  if (L.collar) T.piece([[1, -40.5], [6.5, -41], [2.6, -24], [-0.6, -18], [-3, -22], [0.4, -30]], L.collar, { ...lite, round: 1, lift: 0.6, thick: 0.5 });
  if (L.obi) T.piece([[-15.4, -4], [15.6, -4], [15.4, -13], [-15.2, -13]], L.obi, { ...lite, round: 1, lift: 0.8, thick: 0.6, paint: (g) => { g.fillStyle = 'rgba(255,240,200,.25)'; g.fillRect(-16, -9.4, 32, 1); } });
  if (L.sword) T.piece(strip(-30, 14, 12, -6, 3.2, 2.8), '#1e1a1c', { ...lite, round: 1.2, lift: 1.2, paint: (g) => { g.fillStyle = 'rgba(200,170,90,.7)'; g.fillRect(-2, -1, 2, 6); } }).piece(strip(12, -6, 22, -11, 2.8, 2.6), '#e8e0cc', { ...lite, round: 1, lift: 1, paint: (g) => { g.strokeStyle = 'rgba(40,30,30,.8)'; g.lineWidth = 0.8; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(13 + k * 2.4, -9); g.lineTo(15 + k * 2.4, -5); g.stroke(); } } });
  if (L.tattoo) T.stroke([[-8, -30], [-2, -26], [4, -30], [9, -26]], '#2a1a12', 1, 0.6).stroke([[-8, -24], [-2, -20], [4, -24], [9, -20]], '#2a1a12', 1, 0.6);
  if (L.apron) T.piece([[-2, 18], [16, 18], [15, -16], [3, -16]], L.apron, { ...lite, round: 2 });
  P.torso = T.finish({ shadowBlur: 3 });
  // head
  const Hd = mk(id + '-head', L.hair === 'heian' ? [-26, -40, 20, 92] : [-18, -48, 20, 6], { pad: 6 });
  Hd.piece([[-4, 2], [4, 2], [5, -4], [9, -6], [10.2, -11], [12.6, -13.2, 0.8], [10.2, -16], [9.2, -22], [4, -26], [-3, -26.5], [-9, -23], [-11, -16], [-9, -8], [-5, -5]], skin, { ...lite, round: 3.2, paint: (g) => { g.fillStyle = 'rgba(30,18,12,.85)'; g.beginPath(); g.arc(6.4, -15.6, 1.05, 0, 7); g.fill(); g.fillStyle = 'rgba(200,90,70,.18)'; g.beginPath(); g.arc(6, -10, 2.4, 0, 7); g.fill(); } });
  const hair = L.hair ?? 'short';
  if (hair === 'long') Hd.piece([[-11.8, -15], [-9.8, -23.8], [-3, -27.8], [4.6, -27.2], [9.8, -22.6], [9.2, -19], [2, -21], [-3, -16], [-5, -6], [-9, 0], [-13.5, -3]], hairCol, { ...lite, round: 2.5, rim: 0.25 });
  else if (hair === 'short') Hd.piece([[-11.8, -15], [-9.8, -23.8], [-3, -27.8], [4.6, -27.2], [9.8, -22.6], [9.2, -19], [2, -21.5], [-4, -18], [-7, -11], [-10.4, -9]], hairCol, { ...lite, round: 2.5, rim: 0.25 });
  else if (hair === 'curly') Hd.piece(ellipse(-1.5, -21, 13, 9.5, 16), hairCol, { ...lite, round: 4, rough: 1.4, seg: 8, rim: 0.25 });
  else if (hair === 'bun') Hd.piece([[-11.8, -15], [-9.8, -23.8], [-3, -27.8], [4.6, -27.2], [9.8, -22.6], [9.2, -20], [2, -22.5], [-6, -19], [-10.4, -12]], hairCol, { ...lite, round: 2.5, rim: 0.25 }).piece(ellipse(-8.5, -27, 5, 4.5, 10), hairCol, { ...lite, round: 2, rim: 0.25 });
  else if (hair === 'queue') Hd.piece([[-11.8, -15], [-9.8, -23.8], [-3, -27.8], [-1, -27.6], [-3, -21], [-7, -14], [-10.4, -9]], hairCol, { ...lite, round: 2.5, rim: 0.25 }).piece([[-12, -12], [-15, -2], [-16, 14], [-14.6, 16], [-12.5, 2], [-9.5, -10]], hairCol, { ...lite, round: 1.5, lift: 0.8, paint: (g) => { g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 0.7; for (let y = -8; y < 14; y += 2.6) { g.beginPath(); g.moveTo(-15.5, y); g.lineTo(-12, y + 1.4); g.stroke(); } } });
  else if (hair === 'heian') Hd.piece([[-11.8, -15], [-9.8, -23.8], [-3, -27.8], [4.6, -27.2], [9.8, -22.6], [9.6, -18], [5, -21], [-2, -20], [-6, -12], [-8, 10], [-10, 40], [-14, 70], [-19, 88], [-22, 88], [-21, 60], [-16, 20], [-13.5, -3]], hairCol, { ...lite, round: 3, rim: 0.25, paint: (g) => { g.strokeStyle = 'rgba(255,255,255,.07)'; g.lineWidth = 0.8; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(-6 - k, -20); g.quadraticCurveTo(-10 - k * 1.5, 30, -18 - k * 0.6, 86); g.stroke(); } } });
  else if (hair === 'shimada') Hd.piece([[-11.8, -15], [-9.8, -23.8], [-3, -27.8], [4.6, -27.2], [9.8, -22.6], [9.2, -19.5], [2, -22], [-4, -18], [-8, -10], [-12, -8], [-15, -14]], hairCol, { ...lite, round: 2.5, rim: 0.25 }).piece([[-10, -26], [-12, -33], [-6, -38], [3, -37], [5, -31], [0, -28]], hairCol, { ...lite, round: 4, rim: 0.25 }).piece([[-14, -30], [7, -36], [7.6, -34.6], [-13.6, -28.6]], L.combCol || '#c9a24a', { ...lite, round: 0.6, lift: 0.8, thick: 0.5 });
  else if (hair === 'chonmage') Hd.piece([[-11.8, -15], [-10.6, -22], [-6, -18], [-1, -20], [3, -19.5], [9.4, -20], [9.2, -17.5], [2, -17.6], [-4, -14], [-7, -9], [-10.4, -9]], hairCol, { ...lite, round: 2.2, rim: 0.25 }).piece([[-9, -24], [-3, -28.6], [9, -30.4], [10.4, -28], [-2, -25.6], [-6, -22]], hairCol, { ...lite, round: 1.6, lift: 0.8 });
  else if (hair === 'mizura') Hd.piece([[-11.8, -15], [-9.8, -23.8], [-3, -27.8], [4.6, -27.2], [9.8, -22.6], [9.2, -19], [2, -21.5], [-4, -18], [-7, -11], [-10.4, -9]], hairCol, { ...lite, round: 2.5, rim: 0.25 }).piece(ellipse(-4, -6, 3.6, 7.4, 10), hairCol, { ...lite, round: 2, lift: 0.8 });
  else if (hair === 'bob') Hd.piece([[-12.4, -6], [-12, -18], [-9.8, -24.8], [-3, -28.4], [4.6, -27.6], [10, -22.6], [10.6, -15], [8.4, -19.6], [2, -22], [-4, -17], [-6.4, -6]], hairCol, { ...lite, round: 2.5, rim: 0.25 });
  if (L.beard) Hd.piece([[-4, -9], [2, -6], [9, -6.5], [10.8, -8.5], [9, -2], [3, 2], [-3, 0], [-6, -5]], L.beardCol || hairCol, { ...lite, round: 2.5, rim: 0.2 });
  const hc = L.hatCol || '#5a4030';
  if (L.hat === 'turban') Hd.piece([[-13, -16], [-12, -26], [-4, -32], [6, -31], [11.5, -24], [11, -18], [2, -20], [-6, -19]], hc, { ...lite, round: 4, paint: (g) => { g.strokeStyle = rgb(shade(hc, -0.2), 0.6); g.lineWidth = 1.2; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(-12, -18 - k * 3.4); g.lineTo(11, -23 - k * 2); g.stroke(); } } });
  else if (L.hat === 'cap') Hd.piece([[-11, -18], [-9, -26], [0, -29.5], [8, -27], [16, -22], [15.5, -20.4], [-11, -17]], hc, { ...lite, round: 2 });
  else if (L.hat === 'wide') Hd.piece([[-19, -21], [-8, -23], [-6, -32], [5, -33], [7, -24], [19, -22], [19, -19.6], [-19, -19]], hc, { ...lite, round: 2 });
  else if (L.hat === 'cone') Hd.piece([[-21, -18], [0, -36], [21, -18], [18, -16], [-18, -16]], hc, { ...lite, round: 2, paint: (g) => { g.strokeStyle = 'rgba(90,60,30,.35)'; g.lineWidth = 0.8; for (let k = -16; k < 18; k += 4) { g.beginPath(); g.moveTo(0, -35); g.lineTo(k, -17); g.stroke(); } } });
  else if (L.hat === 'top') Hd.piece([[-14, -21], [-8, -22.5], [-8.5, -42], [6.5, -42], [6, -22.5], [13, -21], [13, -18.6], [-14, -19]], hc, { ...lite, round: 1.5 });
  else if (L.hat === 'band') Hd.piece([[-11.6, -20], [9.8, -23.6], [9.6, -21], [-11.4, -17.4]], hc, { ...lite, round: 1, lift: 0.8 });
  else if (L.hat === 'soft') Hd.piece([[-13, -18], [-12, -27], [-2, -32], [8, -29], [12, -22], [6, -21], [-6, -20]], hc, { ...lite, round: 4 });
  else if (L.hat === 'hood') Hd.piece([[-14, 2], [-15, -18], [-10, -29], [0, -32], [9, -28], [12, -21], [8, -22], [0, -25], [-6, -20], [-8, -8], [-4, 3]], hc, { ...lite, round: 4 });
  else if (L.hat === 'mian') Hd.piece(ellipse(-2, -29, 5, 4.5, 10), hairCol, { ...lite, round: 2 }).piece([[-9, -27], [5, -27], [5, -30.5], [-9, -30.5]], '#2a2224', { ...lite, round: 0.8, lift: 0.8 }).piece([[-19, -33], [21, -36.5], [21.5, -33.5], [-18.6, -30.2]], '#1e1a1c', { ...lite, round: 0.8, lift: 1.2, paint: (g) => { g.fillStyle = '#a8282a'; g.fillRect(-19, -34, 41, 1.4); } })
  else if (L.hat === 'futou') Hd.piece([[-11, -18], [-10, -27], [-3, -31], [6, -30], [10, -24], [10, -19]], hc, { ...lite, round: 3 }).piece([[-9, -24], [-34, -26], [-34.5, -23.6], [-9, -21.6]], hc, { ...lite, round: 0.6, lift: 0.8, thick: 0.6 }).piece([[8, -24], [33, -26.5], [33.5, -24], [8, -21.6]], hc, { ...lite, round: 0.6, lift: 0.8, thick: 0.6 })
  else if (L.hat === 'tangcap') Hd.piece([[-11, -18], [-10, -27], [-3, -31], [6, -30], [10, -24], [10, -19]], hc, { ...lite, round: 3 }).piece([[-9, -21], [-15, -12], [-13, -4], [-10, -12], [-7, -20]], hc, { ...lite, round: 1, lift: 0.8, thick: 0.6 })
  else if (L.hat === 'mongol') Hd.piece([[-14, -17], [-12, -26], [-4, -33], [6, -33], [12, -26], [13, -17], [0, -19]], hc, { ...lite, round: 4 }).piece([[-15, -21], [14, -21], [14.5, -15.6], [-15.5, -15.6]], '#6a4a34', { ...lite, round: 2.4, lift: 1, rough: 1.2, paint: (g) => { g.strokeStyle = 'rgba(40,26,16,.5)'; g.lineWidth = 0.8; for (let x = -14; x < 14; x += 2.2) { g.beginPath(); g.moveTo(x, -21); g.lineTo(x + 0.6, -16); g.stroke(); } } })
  else if (L.hat === 'qing') Hd.piece([[-15, -19], [-6, -31], [0, -33], [6, -31], [15, -19], [10, -20.6], [-10, -20.6]], hc, { ...lite, round: 2.4, paint: (g) => { g.strokeStyle = 'rgba(178,34,34,.85)'; g.lineWidth = 1.1; for (let k = -12; k <= 12; k += 1.6) { g.beginPath(); g.moveTo(0, -32); g.lineTo(k, -20); g.stroke(); } } }).piece(ellipse(0, -34, 2.6, 2.6, 8), '#c8282a', { ...lite, round: 1, lift: 0.8 }).piece([[-15.5, -19.2], [15.5, -19.2], [14, -16.8], [-14, -16.8]], '#2a2224', { ...lite, round: 1, lift: 0.8 })
  else if (L.hat === 'helmet') Hd.piece([[-12.5, -12], [-12, -24], [-5, -31], [5, -31], [11, -24], [11.5, -18], [6, -19], [-8, -19], [-9, -11]], hc, { ...lite, round: 4, paint: (g) => { g.fillStyle = 'rgba(0,0,0,.2)'; for (let y = -29; y < -12; y += 3.4) g.fillRect(-13, y, 26, 1); } })
  else if (L.hat === 'phoenix') Hd.piece(ellipse(-3, -28, 9, 6, 12), hairCol, { ...lite, round: 3 }).piece([[-12, -30], [-6, -42], [0, -36], [5, -44], [9, -33], [3, -30]], '#c9a24a', { ...lite, round: 1.5, lift: 1, paint: (g) => { g.fillStyle = '#b02a2a'; g.beginPath(); g.arc(-1, -35, 1.6, 0, 7); g.fill(); g.fillStyle = '#2f6a7a'; g.beginPath(); g.arc(5, -38, 1.3, 0, 7); g.fill(); } }).piece([[8, -33], [16, -30], [17, -22], [15, -22], [14, -29], [8, -31]], '#c9a24a', { ...lite, round: 1, lift: 0.8, thick: 0.5 })
  else if (L.hat === 'scarf') Hd.piece([[-12.5, -2], [-13, -18], [-9, -27], [0, -30], [8, -27], [11, -20], [8, -21], [0, -24], [-6, -19], [-8, -6], [-5, 1]], hc, { ...lite, round: 4 })
  else if (L.hat === 'eboshi') Hd.piece([[-12, -18], [-12.5, -27], [-9, -40], [-1, -46], [5, -42], [9, -30], [10.4, -20], [0, -21.5]], hc, { ...lite, round: 3.2, paint: (g) => { g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(-8, -26); g.quadraticCurveTo(-2, -32, 4, -26); g.stroke(); } });
  else if (L.hat === 'kanmuri') Hd.piece([[-11.5, -18], [-11, -27], [-4, -31], [6, -30], [10.4, -24], [10.2, -19]], hc, { ...lite, round: 3 }).piece(ellipse(-3, -33, 4.8, 4.2, 10), hc, { ...lite, round: 2, lift: 0.8 }).piece([[-8, -31], [-14, -54], [-10.6, -55], [-5, -32]], hc, { ...lite, round: 1.2, lift: 0.8, thick: 0.5 });
  else if (L.hat === 'kabuto') Hd.piece([[-21, -6], [-18, -14], [-13, -20], [-11, -28], [-3, -33], [6, -32], [11, -26], [11.6, -19], [6, -18.6], [-8, -18], [-14, -10], [-16, -4]], hc, { ...lite, round: 3, paint: (g) => { g.strokeStyle = rgb(L.lace || [190, 40, 40], 0.75); g.lineWidth = 1.2; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(-20 + k * 1.2, -6 - k * 3.4); g.lineTo(-10 + k * 0.6, -17 - k * 1.6); g.stroke(); } } }).piece([[2, -31], [-2, -42], [3, -50], [5, -44], [6.5, -33], [10, -40], [16, -46], [13, -36], [8, -29]], L.crest || '#c9a24a', { ...lite, round: 1.2, lift: 1.2, thick: 0.6 });
  else if (L.hat === 'beret') Hd.piece([[-13, -20], [-12, -27], [-3, -31], [8, -30.4], [14, -26], [12, -22.6], [2, -24], [-8, -21.6]], hc, { ...lite, round: 4 }).piece([[0, -31], [1, -34], [2.6, -31]], hc, { ...lite, round: 0.6, lift: 0.6 });
  else if (L.hat === 'whitecap') Hd.piece([[-11.5, -18], [-12, -30], [-8, -34], [6, -34], [10, -30], [10.4, -19]], hc, { ...lite, round: 2.5 });
  else if (L.hat === 'topknot') Hd.piece(ellipse(-2, -30, 4.5, 4, 10), hairCol, { ...lite, round: 2 }).piece([[-6, -30.5], [2, -31.5], [2, -29.6], [-6, -28.8]], '#2a2420', { ...lite, round: 0.5, lift: 0.6 });
  P.head = Hd.finish({ shadowBlur: 3 });
  // arms
  const sl = L.sleeve;
  const limb = (name, len, w0, w1, hand) => {
    const sh = mk(id + name, [-6, -4, 7, len + 6], { pad: 5 });
    const pts = [[-w0 / 2, -2.5], [w0 / 2, -2.5], [w1 / 2 + 0.2, len * 0.6], [w1 / 2, len - 2]];
    if (hand) pts.push([w1 / 2 + 0.8, len + 3], [-w1 / 2 + 0.6, len + 4.5], [-w1 / 2 - 0.4, len]); else pts.push([-w1 / 2, len - 2]);
    pts.push([-w1 / 2 - 0.2, len * 0.6]);
    sh.piece(pts, skin, { ...lite, round: 2.6 });
    if (sl) sh.piece([[-w0 / 2 - 0.8, -3], [w0 / 2 + 0.8, -3], [w1 / 2 + 1, hand ? len - 3 : len + 1], [-w1 / 2 - 1, hand ? len - 3 : len + 1]], sl, { ...lite, round: 2, lift: 0.8, paint: texture(sl, r) });
    return sh.brad(0, 0, 1.5).finish({ shadowBlur: 3 });
  };
  P.upper = limb('-upper', 20, 7.6, 6.2, false);
  P.fore = limb('-fore', 19, 6.2, 5, true);
  // legs
  const pose = L.pose || 'stand', legs = L.legs || 'skin', lc = legs === 'skin' ? skin : (L.legCol || '#3a3634'), feet = L.shoe || (legs === 'skin' || legs === 'robe' || legs === 'skirt' ? skinD : '#2a2422');
  const legPts = (dx) => [[-4.8 + dx, -3], [4.8 + dx, -3], [4.2 + dx, 26], [3.3 + dx, 48], [3.5 + dx, 50.5], [-3.6 + dx, 50.5], [-3.8 + dx, 26]];
  const foot = (dx) => [[-3.8 + dx, 49], [3.6 + dx, 49], [9.5 + dx, 52], [9.5 + dx, 54.6], [-3.6 + dx, 54.6]];
  if (pose === 'walk') {
    for (const side of ['legF', 'legB']) {
      const sh = mk(id + side, [-8, -6, 14, 58], { pad: 5 });
      const c = side === 'legB' ? (legs === 'skin' ? skinD : rgb(shade(lc, -0.15))) : lc;
      if (legs !== 'robe') sh.piece(legPts(0), c, { ...lite, round: 2.2 });
      sh.piece(foot(0), side === 'legB' ? shade(feet, -0.15) : feet, { ...lite, round: 2, lift: 0.8 });
      P[side] = sh.finish({ shadowBlur: 3 });
    }
    P.hip = 54.6;
  } else if (pose === 'stand') {
    const sh = mk(id + '-legs', [-14, -6, 18, 58], { pad: 6 });
    if (legs !== 'robe') { sh.piece(legPts(-5), legs === 'skin' ? skinD : shade(lc, -0.12), { ...lite, round: 2.2 }); sh.piece(legPts(4.5), lc, { ...lite, round: 2.2 }); }
    sh.piece(foot(-5), shade(feet, -0.15), { ...lite, round: 2 }); sh.piece(foot(4.5), feet, { ...lite, round: 2 });
    P.legs = sh.finish({ shadowBlur: 3 }); P.hip = 54.6;
  } else if (pose === 'kneel') {
    P.legs = mk(id + '-legs', [-22, -8, 34, 34], { pad: 6 })
      .piece([[-5, -4], [5, -5], [28, 20], [30.5, 27], [27, 31], [-15, 31], [-19, 28.5], [-15, 24.5], [14, 23], [-2, 6], [-7.5, 3]], legs === 'skin' || legs === 'robe' ? skin : lc, { ...lite, round: 3 })
      .finish({ shadowBlur: 3 }); P.hip = 30.5;
  } else {
    P.legs = mk(id + '-legs', [-10, -32, 48, 12], { pad: 6 })
      .piece([[-7.5, -4], [2, -7], [21, -28.5], [28.5, -27], [31, -20], [37.5, 4], [44.5, 5.5], [44.5, 9], [29.5, 9], [24.5, -11], [9, 7], [-6, 8.6]], legs === 'skin' ? skin : lc, { ...lite, round: 3 })
      .finish({ shadowBlur: 3 }); P.hip = 8.6;
  }
  if ((legs === 'robe' || legs === 'skirt') && (pose === 'stand' || pose === 'walk')) {
    const long = legs === 'robe';
    P.skirt = mk(id + '-skirt', [-18, -8, 20, 52], { pad: 6 })
      .piece([[-14.5, -4], [15, -4], [17.5, long ? 50 : 30], [-16.5, long ? 50 : 30]], lc, { ...lite, round: 3, paint: (g) => { texture(lc, r, L.pattern)(g); g.fillStyle = rgb(shade(lc, -0.22), 0.4); g.fillRect(-1, 0, 1.4, long ? 50 : 30); } })
      .finish({ shadowBlur: 3 });
    if (legs === 'skirt' && pose === 'stand') { const sh = mk(id + '-legs2', [-14, -6, 18, 58], { pad: 6 }); sh.piece(legPts(-4), skinD, { ...lite, round: 2.2 }).piece(legPts(4), skin, { ...lite, round: 2.2 }).piece(foot(-4), '#2a2422', { ...lite, round: 2 }).piece(foot(4), '#2a2422', { ...lite, round: 2 }); P.legs = sh.finish({ shadowBlur: 3 }); }
  }
  if (L.item) P.item = bakeItem(mk, L.item);
  return P;
}

const JAR_Y = 21;
function arm(g, P, sx, sy, a1, a2, sh, held) {
  g.save(); g.translate(sx, sy); g.rotate(a1 * DEG);
  g.save(); g.translate(0, 19); g.rotate(a2 * DEG);
  if (held) held(g);
  put(g, P.fore, sh, 1.5, 2);
  g.restore();
  put(g, P.upper, sh, 1.5, 2);
  g.restore();
}

// Default behaviour of each pose, gently alive.
function idle(t, e, L) {
  const s = e.seed ?? (e.seed = (e.a * 7.13) % 10);
  const o = { lean: 2 + Math.sin(t * 0.9 + s) * 0.8, head: fbm(t * 0.3 + s, 21) * 4, back: [8 + Math.sin(t * 0.8 + s) * 2, -8], front: [-12 + Math.sin(t * 0.7 + s) * 3, -16] };
  if (L.pose === 'walk') { const ph = t * (e.pace ?? 5.2) + s; Object.assign(o, { walk: ph, lean: 4, back: [Math.sin(ph) * 22, -14], front: [-Math.sin(ph) * 22, -18] }); }
  if (L.pose === 'sit') Object.assign(o, { lean: 8, back: [-30, -50], front: [-40, -60] });
  if (L.pose === 'kneel') Object.assign(o, { lean: 18, back: [-30, -40], front: [-46, -40] });
  if (L.item === 'phone') { Object.assign(o, { head: 22 + fbm(t * 0.4 + s, 3) * 3, lean: 5, front: [-38, -88] }); if (L.pose !== 'walk') o.back = [-24, -96]; }
  if (L.item === 'hoe' || L.item === 'ge' || L.item === 'jie' || L.item === 'shovel') o.front = [-34 + Math.sin(t * 2 + s) * 3, -62];
  if (L.item === 'spear' || L.item === 'staff' || L.item === 'pole') o.front = [-34 + Math.sin(t * 2 + s) * 3, -62];
  if (L.item === 'torch') o.front = [-130, -20];
  if (L.item === 'bow' || L.item === 'teppo' || L.item === 'rake' || L.item === 'paddle') o.front = [-34 + Math.sin(t * 2 + s) * 3, -62];
  if (L.item === 'umbrella') o.front = [-120 + Math.sin(t * 0.9 + s) * 2, 30];
  if (L.item === 'jar') o.back = [-172 + Math.sin(t * 1.1 + s) * 2, 12];
  return o;
}

function drawItem(g, P, L, t) {
  if (!P.item) return;
  g.save(); g.translate(0.5, 21);
  const it = L.item;
  if (it === 'spear' || it === 'staff' || it === 'pole') g.rotate(58 * DEG), g.translate(0, 34);
  else if (it === 'torch') g.rotate(110 * DEG), g.translate(0, 10);
  else if (it === 'phone') g.rotate(-60 * DEG), g.translate(1, -2);
  else if (it === 'bundle') g.translate(0, 6);
  else if (it === 'jar') { g.restore(); return; }
  else if (it === 'book') g.rotate(-70 * DEG);
  else if (it === 'hoe' || it === 'ge' || it === 'jie' || it === 'rake') g.rotate(58 * DEG), g.translate(0, 34);
  else if (it === 'bow') g.rotate(62 * DEG), g.translate(0, 8);
  else if (it === 'teppo') g.rotate(64 * DEG), g.translate(0, 30);
  else if (it === 'paddle') g.rotate(40 * DEG), g.translate(0, 24);
  else if (it === 'umbrella') g.rotate(160 * DEG), g.translate(0, -6);
  else if (it === 'hammer') g.rotate(-90 * DEG), g.translate(0, -2);
  else if (it === 'shaku' || it === 'tongs') g.rotate(-70 * DEG);
  else if (it === 'mirror' || it === 'crane' || it === 'radio') g.translate(2, 2);
  else if (it === 'chochin') g.translate(0, -2);
  else if (it === 'shovel') g.rotate(40 * DEG), g.translate(0, 30);
  else if (it === 'bowl') g.rotate(-90 * DEG), g.translate(4, -2);
  else if (it === 'brush') g.rotate(-40 * DEG);
  else if (it === 'flute') g.rotate(-150 * DEG), g.translate(0, -6);
  else if (it === 'fan') g.rotate(-100 * DEG);
  else if (it === 'redbook' || it === 'medbox') g.rotate(-80 * DEG);
  else if (it === 'lanternH') g.translate(0, -2);
  put(g, P.item, 0.15, 1, 2);
  g.restore();
}

export function drawPerson(g, P, t, e, env, o) {
  const L = P.L, sh = env.sh, sm = L.small || 1;
  if (sm !== 1) g.scale(sm, sm);
  const bob = o.walk !== undefined ? Math.abs(Math.cos(o.walk)) * 2.2 : 0;
  g.save(); g.translate(0, -P.hip + bob);
  if (o.walk !== undefined && P.legB) {
    g.save(); g.translate(-1.5, 0); g.rotate(Math.sin(o.walk + Math.PI) * 24 * DEG); put(g, P.legB, sh, 2, 3); g.restore();
    g.save(); g.translate(1.5, 0); g.rotate(Math.sin(o.walk) * 24 * DEG); put(g, P.legF, sh, 2, 3); g.restore();
  } else if (P.legs) put(g, P.legs, sh, 2, 3);
  else { g.save(); g.translate(-1.5, 0); put(g, P.legB, sh, 2, 3); g.restore(); g.save(); g.translate(1.5, 0); put(g, P.legF, sh, 2, 3); g.restore(); }
  if (P.skirt) { g.save(); g.rotate((o.walk !== undefined ? Math.sin(o.walk * 2) * 2.5 : fbm(t * 0.5, 9) * 1.5) * DEG); put(g, P.skirt, sh, 2, 3); g.restore(); }
  g.rotate(o.lean * DEG);
  arm(g, P, -3, -35, o.back[0], o.back[1], 0, null);
  put(g, P.torso, sh, 2, 3);
  g.save(); g.translate(0.5, -38.5); g.rotate(o.head * DEG); if (sm !== 1) g.scale(1.2, 1.2); put(g, P.head, sh * 0.6, 1.5, 2);
  if (L.item === 'jar' && P.item) { g.translate(0, -JAR_Y); g.rotate(-o.head * DEG); put(g, P.item, sh * 0.5, 1, 2); }
  g.restore();
  arm(g, P, 2, -34.5, o.front[0], o.front[1], sh * 0.5, o.held || ((g2) => drawItem(g2, P, L, t)));
  g.restore();
}

KINDS.person = {
  bake(mk, v) { return bakeLook(mk, 'p-' + v, LOOKS[v]); },
  draw(g, P, t, e, env) {
    const o = idle(t, e, P.L);
    if (e.act) Object.assign(o, e.act(t, o));
    drawPerson(g, P, t, e, env, o);
  },
  glow(g, P, t, e, env, p) {
    if (P.L.item !== 'phone' || p < 0.5) return;
    const k = e.screenAt !== undefined ? sramp(t, e.screenAt, e.screenAt + 0.3) : env.S.screen ?? 0; if (k < 0.01) return;
    // the phone's screen, then its cold light on the face
    const o = idle(t, e, P.L); if (e.act) Object.assign(o, e.act(t, o));
    const sm = P.L.small || 1; g.scale(sm, sm);
    const bob = o.walk !== undefined ? Math.abs(Math.cos(o.walk)) * 2.2 : 0;
    g.translate(0, -P.hip + bob); g.rotate(o.lean * DEG); g.translate(2, -34.5); g.rotate(o.front[0] * DEG); g.translate(0, 19); g.rotate(o.front[1] * DEG); g.translate(0.5, 21); g.rotate(-60 * DEG); g.translate(1, -2);
    g.globalCompositeOperation = 'lighter';
    g.fillStyle = `rgba(150,200,255,${0.85 * k})`; g.fillRect(-3.2, -6.6, 6.4, 13.2);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, 40); gr.addColorStop(0, `rgba(110,170,255,${0.35 * k})`); gr.addColorStop(1, 'rgba(110,170,255,0)');
    g.fillStyle = gr; g.fillRect(-40, -40, 80, 80);
    if (e.flashAt) { const f = Math.exp(-(((t - e.flashAt) / 0.07) ** 2)); if (f > 0.01) { const fr = g.createRadialGradient(0, 0, 0, 0, 0, 160); fr.addColorStop(0, `rgba(255,255,255,${f})`); fr.addColorStop(0.2, `rgba(240,248,255,${0.5 * f})`); fr.addColorStop(1, 'rgba(240,248,255,0)'); g.fillStyle = fr; g.fillRect(-160, -160, 320, 320); } }
    g.globalCompositeOperation = 'source-over';
  },
};

// Someone sitting on the ground, a laptop on their knees, lit by it.
KINDS.laptopper = {
  bake(mk) {
    const P = KINDS.person.bake(mk, 'sitLap');
    P.base = mk('lap-base', [-18, -6, 18, 4], { pad: 4 }).piece([[-16, -3], [16, -3], [15, 2], [-15, 2]], '#3a3c42', { round: 1, rough: 0.2 }).finish({ shadowBlur: 2 });
    P.lid = mk('lap-lid', [-4, -26, 4, 2], { pad: 4 }).piece([[-2, 1], [2, 1], [2.4, -24], [-1.6, -24]], '#2a2c32', { round: 1, rough: 0.2 }).finish({ shadowBlur: 2 });
    return P;
  },
  draw(g, P, t, e, env) {
    const o = { lean: 6 + Math.sin(t * 0.8 + 1) * 0.8, head: 14 + fbm(t * 0.3, 5) * 3, back: [-52, -40 + Math.sin(t * 7) * 6], front: [-62, -36 + Math.sin(t * 8 + 1) * 6] };
    drawPerson(g, P, t, e, env, o);
    g.save(); g.translate(26, -36); g.rotate(-8 * DEG); put(g, P.base, env.sh * 0.5); g.translate(14, -2); g.rotate(-12 * DEG); put(g, P.lid, env.sh * 0.5); g.restore();
  },
  glow(g, P, t, e, env, p) {
    const k = e.screenAt !== undefined ? sramp(t, e.screenAt, e.screenAt + 0.3) : 0; if (k < 0.01 || p < 0.5) return;
    g.save(); g.translate(26, -36); g.rotate(-8 * DEG); g.translate(14, -2); g.rotate(-12 * DEG);
    g.globalCompositeOperation = 'lighter';
    g.fillStyle = `rgba(170,210,255,${0.8 * k})`; g.fillRect(-1.6, -23, 3.2, 22);
    const gr = g.createRadialGradient(-10, -14, 0, -10, -14, 60); gr.addColorStop(0, `rgba(120,175,255,${0.35 * k})`); gr.addColorStop(1, 'rgba(120,175,255,0)');
    g.fillStyle = gr; g.fillRect(-70, -74, 120, 120);
    g.restore(); g.globalCompositeOperation = 'source-over';
  },
};
