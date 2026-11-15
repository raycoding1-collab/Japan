// 8. Gold and stillness. The Golden Pavilion over its pond, its reflection trembling in the water; Noh by
// torchlight, the mask hung close; a monk raking a Zen garden, the lines appearing behind him; then the
// story of the cracked tea bowl: sent to China, returned with ugly staples, and mended with lacquer and
// gold. Then Kyoto burns, and a crack opens in the ground that will not close for a century.
import { add, hook, grassRun, ev, drop, near, flick, card, closeUp, por, PS, P2, R, CAM, ZONES, SEAS, BUMPS, SKY, AMB, GRADE, ERAS, WX, NIGHTS, SUNS, ZOOM, PAPER_SUN, SEAMS, LOOK, W_, PAL } from './film_api.js';
import { LOOKS } from './people.js';
import { KINDS } from './cutouts.js';
import { clamp, sramp, lerp, hash, fbm, DEG, rgb } from './util.js';
import { put, ellipse } from './paper.js';
import { BOWL_CRACKS, STAPLES, bowlCracks } from './sky_japan.js';

const MONK = { skin: 4, top: 'robe', topCol: '#3a3634', legs: 'robe', legCol: '#2e2a28', sleeve: '#3a3634', hair: 'bald', pose: 'stand', collar: '#d8ccb0' };
Object.assign(LOOKS, {
  yoshimitsu: { ...MONK, topCol: '#5a3a5a', legCol: '#4a2e4a', sleeve: '#5a3a5a', collar: '#d4a838', item: 'fan' },
  nohActor: { skin: 6, top: 'robe', topCol: '#c8402a', pattern: 'waves', legs: 'robe', legCol: '#e8c860', sleeve: '#c8402a', hair: 'long', pose: 'stand', item: 'fan', mask: '#f4eee2', collar: '#f4ecdc' },
  nohMusician: { skin: 4, top: 'robe', topCol: '#3a3a44', legs: 'robe', legCol: '#5a5a62', sleeve: '#3a3a44', hair: 'short', pose: 'kneel', item: 'flute', collar: '#e8dcc0' },
  nohMusician2: { skin: 4, top: 'robe', topCol: '#3a3a44', legs: 'robe', legCol: '#5a5a62', sleeve: '#3a3a44', hair: 'short', pose: 'kneel', collar: '#e8dcc0' },
  zenMonk: { ...MONK, item: 'rake', pose: 'walk' },
  yoshimasa: { skin: 6, top: 'robe', topCol: '#4a4a5a', legs: 'robe', legCol: '#3a3a48', sleeve: '#4a4a5a', hat: 'eboshi', hatCol: '#1e1a1c', pose: 'kneel', item: 'bowl', collar: '#e8dcc0' },
  oninSam: { skin: 4, top: 'armor', topCol: '#3a2a26', legs: 'skirt', legCol: '#2e221e', hat: 'kabuto', hatCol: '#1e1a1c', lace: [200, 60, 50], crest: '#8a6a3a', pose: 'stand', item: 'spear', flag: '#a8282a' },
  oninSam2: { skin: 4, top: 'armor', topCol: '#26302e', legs: 'skirt', legCol: '#1e2624', hat: 'kabuto', hatCol: '#1e1a1c', lace: [200, 200, 210], crest: '#8a6a3a', pose: 'stand', item: 'spear', flag: '#efe8d8' },
});
// a cone of white sand, raked, as at the Silver Pavilion
KINDS.sandcone = { bake(mk) { return { spr: mk('sandcone', [-50, -60, 50, 6]).piece([[-44, 4], [-30, -50], [30, -50], [44, 4]], '#ecece4', { round: 3, paint: (g) => { g.strokeStyle = 'rgba(150,150,140,.45)'; g.lineWidth = 1; for (let y = -46; y < 2; y += 5) { g.beginPath(); g.moveTo(-44, y); g.lineTo(44, y); g.stroke(); } } }).finish({ shadowBlur: 3 }) }; }, draw(g, P, t, e, env) { put(g, P.spr, env.sh, 2, 3); } };

CAM.push([278, 758], [280.5, 764], [283, 768], [285.5, 778], [288, 792], [290.5, 798], [293, 802], [295, 814], [297.5, 821], [300, 828], [302.5, 838], [305, 845], [310, 850], [316, 853], [322, 856], [326.5, 860], [329, 866], [332, 872], [335, 878]);
ZONES.push([750, 756.5, [120, 110, 76]], [758, 777, [46, 84, 96]], [779, 812, [130, 116, 84]], [814, 836, [196, 192, 182]], [838, 856, [126, 114, 84]], [858, 890, [96, 70, 56]]);
SEAS.push([757.6, 777.4]);
BUMPS.far.push([745, 900, 40, 10, 30]);
SEAMS.push({ a0: 856, a1: 945, t0: ev('burned', 331.6), openDur: 20, t1: ev('together', 353.8), dur: 3.4, rev: true, seed: 3 });

SKY.push([277, PAL.DAY], [285.4, ['#2e2a4c', '#5a4a6a', '#c07a6a', '#e8a070']], [293.4, ['#a8b0b8', '#c8ccce', '#e4e2dc', '#ece8e0']], [300.4, ['#3a3a52', '#5e5468', '#a8806e', '#d4a478']], [327.4, ['#1a0e10', '#2e1416', '#5a2418', '#8a3a1e']]);
AMB.push([277, W_], [285.4, [220, 170, 160]], [293.4, [244, 244, 244]], [300.4, [220, 190, 170]], [327.4, [150, 90, 70]]);
GRADE.push([277, [255, 210, 150, 0.12]], [285.4, [255, 150, 90, 0.16]], [293.4, [200, 210, 220, 0.08]], [300.4, [255, 190, 130, 0.12]], [327.4, [255, 90, 40, 0.24]]);
NIGHTS.push([326.4, 339.4]);
ERAS.push(
  [276.4, 285.6, LOOK(['#7aa0c8', '#b4c4d0', '#ecdcbc', '#f4d09a'], [255, 244, 222], [255, 210, 150, 0.12], { rays: 0.9, motes: 0.9, mote: [255, 236, 180] })], // the Golden Pavilion: a crisp autumn morning
  [285.6, 293.6, LOOK(['#2e2a4c', '#5a4a6a', '#c07a6a', '#e8a070'], [220, 170, 160], [255, 150, 90, 0.16], { motes: 0.5, mote: [255, 190, 140] })],            // Noh by torchlight, at dusk
  [293.6, 300.6, LOOK(['#a8b0b8', '#c8ccce', '#e4e2dc', '#ece8e0'], [244, 244, 244], [200, 210, 220, 0.08], { motes: 0.2 })],                                  // the Zen garden: a still, white morning
  [300.6, 327.6, LOOK(['#3a3a52', '#5e5468', '#a8806e', '#d4a478'], [220, 190, 170], [255, 190, 130, 0.12], { motes: 0.4 })],                                  // the tea bowl: a quiet evening
  [327.6, 338.2, LOOK(['#1a0e10', '#2e1416', '#5a2418', '#8a3a1e'], [150, 90, 70], [255, 90, 40, 0.24], { motes: 0.3, mote: [255, 140, 80] })],              // Kyoto burns
);
WX.push(['mist', 276.6, 285.4, [255, 240, 220], 0.22], ['maple', 277, 285.4], ['embers', 328.4, 338.4, null, 1.2], ['ash', 330, 338.6, [120, 110, 104], 0.6]);
PAPER_SUN.push([277, 285.4]);
SUNS.push([285.6, 294, 430, -40, 170]);
ZOOM.push([280, 282, 284.4, 286, 0.1], [329, 331, 335.6, 337.6, 0.1]);

// ---- the Golden Pavilion
const T_KIN = ev('kinkaku', 280.2), KIN = 767.6;
const KIN_E = add('kinkaku', 'main', KIN, { z: 0.5, scale: 0.8, popAt: T_KIN, loud: 2.2, wide: 8, shine: (t) => sramp(t, T_KIN + 1, T_KIN + 2.4) });
add('person', 'main', 754.4, { v: 'yoshimitsu', z: 2, scale: P2, popAt: ev('ashikaga', 278.8), act: (t) => ({ head: -6, front: [-40 + Math.sin(t * 0.6) * 4, -30] }) });
add('pine', 'main', 775, { v: 1, z: 1, scale: 0.55, y: -6 }); add('pine', 'main', 760.6, { v: 0, z: 1, scale: 0.45, y: -6 });
for (const a of [751.6, 780.4]) add('momiji', 'main', a, { v: 0, z: 0, scale: 0.85 });
for (let a = 758; a < 777; a += 3.4) add('reeds', 'main', a, { v: (R() * 4) | 0, z: 3, scale: 0.6, loud: 0.3 });
for (const [a, v, s] of [[752, 1, 0.55], [774, 1, 0.5], [796, 4, 0.55]]) add('jmount', 'far', a, { v, scale: s });

// ---- Noh by torchlight
const T_NOH = ev('noh', 288.4), STAGE = 799;
add('nohstage', 'main', STAGE, { z: 0.4, scale: 0.86, popAt: 285.4, loud: 1.8, wide: 10 });
add('person', 'main', STAGE - 1.6, { v: 'nohActor', z: 0.6, scale: P2 * 0.92, y: 56, popAt: T_NOH - 1, move: (t) => clamp((t - T_NOH) * 0.12, 0, 0.8), act: (t) => { const k = Math.sin(t * 0.7); return { lean: 2 + k, head: -4 + k * 4, front: [-90 + k * 20, -30], back: [-20, -10] }; } });
add('person', 'main', STAGE + 4.2, { v: 'nohMusician', z: 0.5, scale: P2 * 0.85, y: 56, flip: true, popAt: T_NOH - 0.6, act: (t) => ({ lean: 6, head: -4, front: [-150, -10], back: [-120, -20] }) });
add('person', 'main', STAGE + 5.8, { v: 'nohMusician2', z: 0.45, scale: P2 * 0.85, y: 56, flip: true, popAt: T_NOH - 0.5, act: (t) => ({ lean: 4, front: [-60 + Math.max(0, Math.sin(t * 3)) * 30, -50], back: [-40, -40] }) });
for (const a of [786.4, 811.6]) add('torchpost', 'main', a, { z: 2, scale: 1.2, popAt: 285.8 });

// ---- the Zen garden
const T_RAKE = ev('raked', 295.8), RAKE0 = 815.4, rakeAt = (t) => RAKE0 + clamp((t - T_RAKE + 1.4) * 0.55, 0, 5.6);
for (const [a, v] of [[819.6, 0], [824.4, 1], [829.8, 0], [833.6, 2]]) add('zenrock', 'main', a, { v, z: 1.2, scale: 1.1, popAt: 293.8 + (a - 819) * 0.05 });
add('person', 'main', RAKE0, { v: 'zenMonk', z: 2, scale: P2, popAt: T_RAKE - 1.6, pace: 2.4, move: (t) => rakeAt(t) - RAKE0, act: (t) => (t > T_RAKE + 8.8 ? { walk: undefined, lean: 10, head: 10 } : { lean: 10, head: 10, front: [-34, -62] }) });
add('tera', 'mid', 826, { v: 3, scale: 0.55 });
add('momiji', 'main', 837.4, { v: 1, z: 0, scale: 0.75 });

// ---- the tea bowl, and the silver pavilion's sand
const T_BOWL = ev('bowl', 303.6), T_BACK = ev('staples', 307.6), T_WAY = ev('anotherway', 313.8), T_GOLD = ev('gold', 316.8), T_BEAUT = ev('beautiful', 319.4), T_KIN2 = ev('kintsugi', 322.8);
add('tera', 'main', 846.6, { v: 3, z: 0, scale: 0.85, popAt: 300.6, winOn: (t) => 0.6 * sramp(t, 301, 302) });
add('sandcone', 'main', 852.6, { z: 1, scale: 1, popAt: 300.8 });
add('person', 'main', 842.4, { v: 'yoshimasa', z: 2, scale: P2, popAt: 301.2, act: (t) => ({ lean: 14, head: 14, front: [-80, -40], back: [-70, -44] }) });
add('pine', 'main', 856, { v: 1, z: 0, scale: 0.65 });
grassRun(778, 816, 4, 'main', { skip: (a) => a > 782 && a < 813 });
grassRun(836, 860, 4, 'main', { skip: (a) => a > 840 && a < 855 });
grassRun(750, 860, 7, 'front', { s: 2 });

// ---- Kyoto burns
const T_FELL = ev('fellout', 330.4), T_BURN = ev('burned', 331.6), HOUSES = [[862.4, 0], [868, 1], [873.6, 0], [879.4, 2], [884.6, 1]];
HOUSES.forEach(([a, v], i) => add('machiya', 'main', a, { v, z: 0.4, scale: 0.9, popAt: 327.6 + i * 0.12, burn: (t) => sramp(t, T_BURN + i * 0.4, T_BURN + 3 + i * 0.4), winOn: () => 0 }));
add('person', 'main', 866, { v: 'oninSam', z: 2, scale: P2, popAt: T_FELL - 0.4, act: (t) => ({ head: -4, front: [-34 + Math.sin(t * 2) * 3, -62] }) });
add('person', 'main', 877, { v: 'oninSam2', z: 2.1, scale: P2, flip: true, popAt: T_FELL - 0.2, act: (t) => ({ head: -4, front: [-34 + Math.sin(t * 2 + 1) * 3, -62] }) });
add('tera', 'mid', 870, { v: 2, scale: 0.5 }); add('gojunoto', 'mid', 884, { v: 1, scale: 0.4 });
grassRun(858, 892, 4, 'main');

hook({
  lights(t, c, L, Em, Sm) {
    if (near(STAGE, c, 50) && t > 285.6 && t < 302) for (const [a, n] of [[786.4, 1], [811.6, 2]]) { const k = sramp(t, 285.8, 286.6); L.push({ a, h: 100, r: 640, k: 1.1 * k * flick(t, n), color: [255, 150, 70] }); Em.push({ a, h: 94, scale: 0.5, small: 1, lit: k, litAt: 285.8, seed: 20 + n }); }
    if (near(875, c, 60) && t > T_BURN - 0.2) HOUSES.forEach(([a], i) => { const k = sramp(t, T_BURN + i * 0.4, T_BURN + 1 + i * 0.4) * (1 - sramp(t, 339 + i * 0.3, 343 + i * 0.3)); if (k < 0.01) return; L.push({ a, h: 120, r: 600, k: 1.1 * k * flick(t, 30 + i), color: [255, 110, 40] }); Em.push({ a: a + (i % 2 ? 1 : -1), h: 100, scale: 1.1, lit: k, litAt: T_BURN + i * 0.4, seed: 30 + i }); Sm.push({ a, layer: 'main', h: 180, t0: T_BURN + i * 0.4, t1: 341 + i * 0.3, size: 1.5, life: 6, every: 0.4, rise: 240, drift: 5, alpha: 0.55 }); });
  },
  ground(g, st, t, S, G) {
    // the pavilion's reflection in the pond, trembling
    if (near(KIN, G.c, 50) && KIN_E.parts && t > T_KIN) {
      const rel = (KIN - G.c) * DEG, [x, y] = G.rad(KIN, -3), k = sramp(t, T_KIN + 0.4, T_KIN + 1.4);
      g.save(); g.translate(x, y); g.rotate(rel); g.scale(0.8, -0.72); g.globalAlpha = 0.34 * k;
      g.beginPath(); g.rect(-300, -470, 600, 476); g.clip(); g.translate(Math.sin(t * 1.4) * 2, 0); put(g, KIN_E.parts.spr, 0); g.restore();
      G.run(758, 777, (a0, a1) => { G.arc(a0, a1, -6, 1.4, 'rgba(255,240,200,.5)', [4, 14], -t * 6); G.arc(a0, a1, -16, 1.2, 'rgba(255,240,200,.35)', [3, 20], t * 4); });
    }
    // white gravel, raked into lines behind the monk, and rings around the rocks
    G.run(813.6, 836, (a0, a1) => G.arc(a0, a1, -3, 9, 'rgba(236,234,226,.95)'));
    const ra = rakeAt(t);
    if (t > T_RAKE - 1.6) G.run(813.6, ra, (a0, a1) => { for (const h of [-1, -3.4, -5.8]) G.arc(a0, a1, h, 0.9, 'rgba(150,146,136,.7)'); });
    if (t > 293.8) for (const a of [819.6, 824.4, 829.8, 833.6]) for (const d of [1.6, 2.6]) G.run(a - d, a + d, (a0, a1) => G.arc(a0, a1, -2 - d * 0.6, 0.8, 'rgba(150,146,136,.6)'));
  },
  over(g, st, t) {
    const { W, H } = st, p = por(st);
    // the mask, hung close: tilted up it smiles, tilted down it grieves
    if (t > T_NOH - 0.4 && t < 295) { const k = drop(t, T_NOH, 293.6), tilt = Math.sin(t * 0.9) * 0.12; card(st, g, W * (p ? 0.5 : 0.26), H * lerp(-0.4, p ? 0.08 : 0.1, k) + 110 * st.eu * (p ? 0.55 : 0.75), p ? 0.55 : 0.75, Math.sin(t * 0.5) * DEG, (g2) => { g2.save(); g2.scale(1, 1 - Math.abs(tilt) * 0.3); g2.rotate(tilt * 0.3); put(g2, st.fx.nohmask, 0.4, 4, 6); g2.restore(); }, 1, 40); }
    // the bowl: cracked, sent to China, back with staples, then mended with gold
    closeUp(st, g, t, T_BOWL - 0.6, 326.6, (g2) => {
      const crack = sramp(t, T_BOWL, T_BOWL + 0.8), away = sramp(t, T_BOWL + 1.8, T_BOWL + 2.8) * (1 - sramp(t, T_BACK - 1, T_BACK)), staple = t > T_BACK - 1 ? 1 : 0;
      const off = sramp(t, T_WAY - 0.2, T_WAY + 1.4), lac = sramp(t, T_GOLD - 1.6, T_GOLD - 0.2), gold = sramp(t, T_GOLD - 0.2, T_GOLD + 1.6), shine = t > T_BEAUT ? (t - T_BEAUT) : -1;
      g2.save(); g2.translate(away * 260, -away * 30); g2.scale(1 - away * 0.6, 1 - away * 0.6); g2.rotate(away * 0.1);
      put(g2, st.fx.bowl, 0.6, 8, 12);
      if (crack > 0) bowlCracks(g2, crack, 'rgba(30,24,20,.85)', 2.4);
      if (staple) STAPLES.forEach(([x, y, a], i) => { const k = 1 - sramp(off, i / STAPLES.length * 0.8, i / STAPLES.length * 0.8 + 0.2); if (k < 0.01) return; g2.save(); g2.translate(x, y - (1 - k) * 60); g2.rotate(a); g2.globalAlpha = k; g2.fillStyle = '#3a3634'; g2.fillRect(-10, -2.4, 20, 4.8); g2.fillRect(-10, -2.4, 3.4, 8); g2.fillRect(6.6, -2.4, 3.4, 8); g2.fillStyle = 'rgba(200,200,210,.35)'; g2.fillRect(-9, -2, 18, 1.2); g2.restore(); });
      if (lac > 0) bowlCracks(g2, lac, 'rgba(120,40,20,.95)', 3.6);
      if (gold > 0) { bowlCracks(g2, gold, '#c9962e', 4.2); bowlCracks(g2, gold, '#f6d77a', 1.8); }
      if (shine >= 0) { g2.globalCompositeOperation = 'lighter'; for (const c of BOWL_CRACKS) c.forEach(([x, y], j) => { const s = Math.max(0, Math.sin(shine * 2.2 - j * 0.8)) ** 4; if (s > 0.02) { const gr = g2.createRadialGradient(x, y, 0, x, y, 18); gr.addColorStop(0, `rgba(255,236,170,${0.7 * s})`); gr.addColorStop(1, 'rgba(255,220,140,0)'); g2.fillStyle = gr; g2.fillRect(x - 18, y - 18, 36, 36); } }); g2.globalCompositeOperation = 'source-over'; }
      g2.restore();
      if (t > T_KIN2 - 0.2) { const k = sramp(t, T_KIN2, T_KIN2 + 0.8); g2.globalAlpha = k; g2.font = 'italic 400 28px Fraunces, Georgia, serif'; g2.textAlign = 'center'; g2.fillStyle = 'rgba(246,215,122,.95)'; g2.fillText('kintsugi', 0, 74); g2.globalAlpha = 1; }
    }, { light: [255, 200, 140], glow: 0.26, embers: false, veil: 0.55, dark: '16,12,10', y: 0.42 });
  },
});
