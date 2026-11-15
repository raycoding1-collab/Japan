// 7. The warriors. Samurai ride in under their banners; the emperor behind his blind, the shogun on his
// stool before the camp curtains, and three shogunates' banners rising one after another; the Great
// Buddha of Kamakura in the open air. Then the Mongol fleet, a stone sea wall, and a storm: rain,
// lightning, the ships folding into the sea, and the wind god Fūjin blowing from his bag in the clouds.
// Then night at the forge: hammers, sparks, and the blade folded, coated in clay, quenched and curved.
import { add, hook, grassRun, ev, drop, near, flick, closeUp, por, PS, P2, R, CAM, ZONES, SEAS, BUMPS, SKY, AMB, GRADE, ERAS, WX, NIGHTS, ZOOM, PAPER_SUN, LOOK, W_, PAL } from './film_api.js';
import { LOOKS } from './people.js';
import { clamp, sramp, lerp, hash, fbm, DEG } from './util.js';
import { put } from './paper.js';

const ARMOUR = (topCol, lace, crest) => ({ skin: 4, top: 'armor', topCol, legs: 'skirt', legCol: shadeHex(topCol), pattern: 'lace', hat: 'kabuto', hatCol: '#2a2420', lace, crest, pose: 'stand', sword: 1 });
function shadeHex(h) { const n = parseInt(h.slice(1), 16), f = (v) => Math.max(0, Math.round(v * 0.8)); return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, '0')).join(''); }
Object.assign(LOOKS, {
  samA: { ...ARMOUR('#a8302a', [230, 200, 120], '#c9a24a') }, samB: { ...ARMOUR('#2e4a7a', [220, 220, 230], '#d8d0c0') }, samC: { ...ARMOUR('#3a5a3a', [230, 180, 90], '#c9a24a') },
  samArcher: { ...ARMOUR('#a8302a', [230, 200, 120], '#c9a24a'), item: 'bow' }, samArcher2: { ...ARMOUR('#2e4a7a', [220, 220, 230], '#d8d0c0'), item: 'bow' },
  samKneel: { ...ARMOUR('#5a3a2a', [230, 200, 120], '#c9a24a'), pose: 'kneel' }, samKneel2: { ...ARMOUR('#2e3a5a', [220, 220, 230], '#d8d0c0'), pose: 'kneel' },
  shogun: { ...ARMOUR('#2a2a30', [200, 60, 50], '#d4a838'), pose: 'sit', item: 'fan' },
  emperorH: { skin: 6, top: 'robe', topCol: '#c8a860', legs: 'robe', legCol: '#a88a48', sleeve: '#c8a860', hat: 'kanmuri', hatCol: '#1e1a1c', pose: 'sit', item: 'shaku', collar: '#f4ecdc' },
  smith: { skin: 4, top: 'robe', topCol: '#f2eee4', legs: 'robe', legCol: '#f2eee4', sleeve: '#f2eee4', hat: 'eboshi', hatCol: '#1e1a1c', pose: 'kneel', item: 'hammer' },
  smithApp: { skin: 3, top: 'robe', topCol: '#efe9dc', legs: 'trousers', legCol: '#e8e2d4', sleeve: '#efe9dc', hat: 'band', hatCol: '#efe9dc', pose: 'stand', item: 'hammer' },
  bellowsBoy: { skin: 4, top: 'robe', topCol: '#e8e2d4', legs: 'trousers', legCol: '#d8d0c0', sleeve: '#e8e2d4', hat: 'band', hatCol: '#e8e2d4', pose: 'stand' },
});
// riders: look names for KINDS.rider
Object.assign(LOOKS, { riderA: { ...LOOKS.samA, pose: 'sit', item: 'bow' }, riderB: { ...LOOKS.samB, pose: 'sit' }, riderC: { ...LOOKS.samC, pose: 'sit', item: 'bow' } });

CAM.push([234.5, 628], [237, 636], [239.5, 642], [242, 648], [244.5, 655], [246.5, 666], [249, 676], [251.5, 684], [254, 690], [256.5, 694], [258.5, 708], [260.5, 720], [263, 726], [266, 729], [269, 731], [272, 733], [274.5, 737], [276, 748]);
ZONES.push([618, 659, [150, 138, 94]], [662, 704, [40, 70, 96]], [706, 746, [96, 84, 70]]);
SEAS.push([661.5, 705]);
BUMPS.mid.push([630, 660, 26, 8, 14]); BUMPS.far.push([620, 760, 40, 10, 30]);

SKY.push([232.6, PAL.DAY], [245, PAL.DAY], [250.4, ['#1a2030', '#2a3040', '#444a56', '#58606a']], [257.4, ['#6a8ab0', '#a8b4c0', '#f0d0a0', '#f8c080']], [259.4, ['#0c0a14', '#16121e', '#2a1e24', '#3e2a28']]);
AMB.push([232.6, W_], [245, W_], [250.4, [140, 148, 165]], [257.4, [255, 230, 200]], [259.4, [80, 64, 64]]);
GRADE.push([232.6, [255, 210, 170, 0.1]], [250.4, [110, 125, 150, 0.28]], [257.4, [255, 190, 120, 0.12]], [259.4, [255, 140, 70, 0.2]]);
NIGHTS.push([258.4, 277.6]);
ERAS.push(
  [232.8, 245.8, LOOK(['#5a86b8', '#9ab4c8', '#e8dcc4', '#eecba0'], [255, 244, 226], [255, 210, 170, 0.1], { rays: 0.5, motes: 0.5 })],          // the samurai: a windy autumn day
  [245.8, 250.6, LOOK(['#5a6a80', '#7a8494', '#a8a8a4', '#b8b0a0'], [210, 212, 220], [170, 180, 200, 0.16], { motes: 0.2 })],                     // the fleet comes: grey
  [250.6, 257.4, LOOK(['#1a2030', '#2a3040', '#444a56', '#58606a'], [140, 148, 165], [110, 125, 150, 0.28], { motes: 0 })],                       // the storm
  [257.4, 259.6, LOOK(['#6a8ab0', '#a8b4c0', '#f0d0a0', '#f8c080'], [255, 230, 200], [255, 190, 120, 0.12], { rays: 1, motes: 0.6 })],            // the sun breaks through
  [259.6, 276.4, LOOK(['#0c0a14', '#16121e', '#2a1e24', '#3e2a28'], [80, 64, 64], [255, 140, 70, 0.2], { motes: 0.5, mote: [255, 160, 90] })],   // the forge at night
);
WX.push(['maple', 233, 245.6], ['rain', 250.4, 257.6, [200, 210, 225], 1.6], ['mist', 250, 257.6, [150, 156, 168], 0.3], ['embers', 260, 276, null, 0.7]);
PAPER_SUN.push([257.4, 259.4]);
ZOOM.push([239, 241, 245, 247, 0.12], [253.5, 255, 257, 258.5, -0.1]);

// ---- the samurai, the emperor, the shogun
const T_SAM = ev('samurai', 235.4), T_EMP = ev('emperor', 237.6), T_SHO = ev('shogun', 241.0), T_SHOGS = ev('shogunates', 243.0);
[['riderA', 612, 623.4], ['riderB', 615.6, 627], ['riderC', 619.2, 630.6]].forEach(([v, a0, a1], i) => add('samurider', 'main', a0, { v, z: 1.6 + i * 0.1, scale: 1.0, popAt: T_SAM - 1.4 + i * 0.2, move: (t) => clamp((t - T_SAM + 1.2 - i * 0.2) * 5, 0, a1 - a0), stopAt: T_SAM + 1.2 + (a1 - a0) / 5 + i * 0.2, loud: 1.2 }));
add('shinden', 'main', 635.4, { v: 1, z: 0, scale: 0.62, popAt: T_EMP - 0.6, loud: 1.2 });
add('person', 'main', 635.4, { v: 'emperorH', z: 0.3, scale: P2 * 0.8, y: 36, popAt: T_EMP - 0.4, act: () => ({ head: 4 }) });
add('shindenFront', 'main', 635.4, { v: 1, z: 0.1, scale: 0.62, popAt: T_EMP - 0.6, over: true, blinds: () => 0.55 });
add('jinmaku', 'main', 641.6, { v: 0, z: 0.2, scale: 1.05, popAt: T_SHO - 1.2 }); add('jinmaku', 'main', 647.6, { v: 0, z: 0.2, scale: 1.05, popAt: T_SHO - 1.0 });
add('shogi', 'main', 644.6, { z: 1, scale: 1.2, popAt: T_SHO - 0.6 });
add('person', 'main', 644.2, { v: 'shogun', z: 1.2, scale: P2, y: 34, popAt: T_SHO - 0.5, loud: 1.2, act: (t) => { const k = sramp(t, T_SHO + 1.2, T_SHO + 1.8); return { head: -4, lean: 2, front: [-60 - k * 80, -30 + k * 10] }; } });
add('person', 'main', 649.6, { v: 'samKneel', z: 2, scale: P2, flip: true, popAt: T_SHO + 0.1, act: () => ({ lean: 24, head: 14 }) });
add('person', 'main', 652.2, { v: 'samKneel2', z: 2.2, scale: P2, flip: true, popAt: T_SHO + 0.3, act: () => ({ lean: 24, head: 14 }) });
[0, 1, 2].forEach((v) => add('nobori', 'main', 655.4 + v * 1.9, { v, z: 0.5, scale: 1.0, popAt: T_SHOGS + v * 0.55, loud: 1 }));
add('daibutsu', 'mid', 646, { v: 1, scale: 0.42, popAt: T_SAM + 1 });
for (const [a, v, s] of [[624, 1, 0.55], [648, 1, 0.5], [664, 4, 0.55]]) add('jmount', 'far', a, { v, scale: s });
for (const a of [626, 650]) add('pine', 'mid', a, { v: 1, scale: 0.55 });
add('momiji', 'main', 638.8, { v: 1, z: -0.5, scale: 0.75 });
grassRun(618, 660, 3.8, 'main', { skip: (a) => a > 632 && a < 659 });
grassRun(612, 662, 7, 'front', { s: 2 });

// ---- the Mongols, the wall, the storm
const T_MON = ev('mongols', 247.4), T_STORM = ev('storm', 250.4), T_BACK = ev('driveback', 251.8), T_KAMI = ev('kamikaze', 254.6);
add('stonewall', 'main', 659.6, { z: 2.2, scale: 1.1, popAt: T_MON - 1 }); add('stonewall', 'main', 662.8, { z: 2.2, scale: 1.1, popAt: T_MON - 0.9 });
add('person', 'main', 659.2, { v: 'samArcher', z: 1.8, scale: P2, popAt: T_MON - 0.6, act: (t) => ({ head: -4, front: [-92 + Math.sin(t * 1.3) * 2, -2], back: [-70, -60] }) });
add('person', 'main', 662.4, { v: 'samArcher2', z: 1.9, scale: P2, popAt: T_MON - 0.4, act: (t) => ({ head: -4, front: [-92 + Math.sin(t * 1.1) * 2, -2], back: [-70, -60] }) });
[[672, 0], [681.5, 1], [691, 0], [699, 1]].forEach(([a, v], i) => add('junk', 'main', a, { v, z: 0.5 + i * 0.05, scale: 0.72, y: 4, popAt: T_MON - 0.2 + i * 0.25, foldAt: T_BACK + i * 0.65, loud: 1.2, move: (t) => -clamp((t - T_MON) * 0.5, 0, 2.2), rot: (t) => (t > T_STORM ? Math.sin(t * 2.2 + i) * 9 * sramp(t, T_STORM, T_STORM + 1) : 0) }));
for (const [a, i] of [[676, 0], [688, 1], [702, 2]]) add('junk', 'mid', a, { v: i % 2, scale: 0.45, popAt: T_MON + 0.4, foldAt: T_BACK + 0.4 + i * 0.6 });
for (let a = 662; a < 705; a += 2.6) add('wave', 'front', a, { v: (R() * 4) | 0, scale: 1.5 + R() * 0.5 });
for (let a = 664; a < 704; a += 3.4) add('wave', 'main', a, { v: (R() * 4) | 0, z: 0.9, scale: 1.0, y: -2 });

// ---- the forge
const T_FOLD = ev('folding', 259.8), FORGE = 726;
add('forge', 'main', FORGE, { z: 0.5, scale: 0.95, popAt: 258.6, loud: 1.4, pump: (t) => Math.max(0, Math.sin(t * 2.4)) });
add('person', 'main', FORGE - 9.4, { v: 'bellowsBoy', z: 1, scale: P2, popAt: 258.9, act: (t) => { const k = Math.max(0, Math.sin(t * 2.4)); return { lean: 10 + k * 8, front: [-80 + k * 20, -10], back: [-70 + k * 20, -10] }; } });
add('person', 'main', FORGE + 2.2, { v: 'smithApp', z: 1.2, scale: P2, popAt: 259.1, act: (t) => { const k = Math.max(0, Math.sin(t * 4.4 * Math.PI / 2)); return { lean: 12 + k * 10, front: [-200 + k * 140, -20], back: [-190 + k * 140, -20] }; } });
add('person', 'main', FORGE + 7.4, { v: 'smith', z: 1.4, scale: P2, flip: true, popAt: 259.2, act: (t) => { const k = Math.max(0, Math.sin(t * 4.4 * Math.PI / 2 + Math.PI)); return { lean: 16, head: 12, front: [-110 + k * 40, -30], back: [-60, -40] }; } });
for (const a of [712, 742]) add('pine', 'main', a, { v: 1, z: 0, scale: 0.7 });
grassRun(706, 748, 4.4, 'main', { skip: (a) => a > 714 && a < 736 });
grassRun(704, 750, 7, 'front', { s: 2 });

// the blade, drawn: straight or curved, glowing with heat, coated in clay, with its temper line
function blade(g, curve, heat, clay, hamon, gleam, len = 300) {
  const pts = [], n = 30, R = curve > 0.001 ? len / (curve * 0.5) : 1e9;
  for (let i = 0; i <= n; i++) { const f = i / n, x = -len / 2 + f * len, y = R < 1e8 ? R - Math.sqrt(Math.max(0, R * R - x * x)) - (R - Math.sqrt(R * R - (len / 2) ** 2)) : 0; pts.push([x, -y]); }
  const w = (f) => 13 * (1 - f * 0.35);
  const edge = pts.map(([x, y], i) => [x, y + w(i / n) * 0.5]), back = pts.map(([x, y], i) => [x, y - w(i / n) * 0.5]);
  g.save(); g.beginPath(); back.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.lineTo(len / 2 + 14, pts[n][1] - 2); for (let i = n; i >= 0; i--) g.lineTo(edge[i][0], edge[i][1]); g.closePath();
  const steel = g.createLinearGradient(0, -12, 0, 12); steel.addColorStop(0, '#8a9098'); steel.addColorStop(0.5, '#d8dce2'); steel.addColorStop(1, '#a8aeb6'); g.fillStyle = steel; g.fill();
  if (heat > 0.01) { g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(255,${120 + heat * 60},40,${0.85 * heat})`; g.fill(); g.globalCompositeOperation = 'source-over'; }
  g.clip();
  if (clay > 0.01) { g.fillStyle = `rgba(110,104,96,${0.92 * clay})`; g.beginPath(); back.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); for (let i = n; i >= 0; i--) g.lineTo(edge[i][0], edge[i][1] - 3.2 + Math.sin(i * 1.3) * 1.6); g.closePath(); g.fill(); }
  if (hamon > 0.01) { g.strokeStyle = `rgba(255,255,255,${0.75 * hamon})`; g.lineWidth = 1.4; g.beginPath(); for (let i = 0; i <= n; i++) { const [x, y] = edge[i]; const yy = y - 3 + Math.sin(i * 1.3) * 1.6; i ? g.lineTo(x, yy) : g.moveTo(x, yy); } g.stroke(); }
  if (gleam > 0.01) { const gx = lerp(-len / 2, len / 2, gleam); const gr = g.createLinearGradient(gx - 30, 0, gx + 30, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(gx - 30, -40, 60, 80); }
  g.restore();
  // the tang and its wrapping
  g.fillStyle = '#2a2226'; g.beginPath(); g.moveTo(-len / 2, pts[0][1] - 6); g.lineTo(-len / 2 - 70, pts[0][1] - 4 - curve * 10); g.lineTo(-len / 2 - 70, pts[0][1] + 4 - curve * 10); g.lineTo(-len / 2, pts[0][1] + 6); g.fill();
  g.fillStyle = '#c9a24a'; g.fillRect(-len / 2 - 4, pts[0][1] - 10, 6, 20);
}
hook({
  lights(t, c, L, Em, Sm) {
    if (near(FORGE, c, 50) && t > 258.6) {
      const k = sramp(t, 258.8, 259.6), pump = Math.max(0, Math.sin(t * 2.4));
      L.push({ a: FORGE - 0.8, h: 50, r: 900, k: (1.1 + 0.4 * pump) * k * flick(t, 7), color: [255, 140, 60] });
      Em.push({ a: FORGE - 0.8, h: 42, scale: 0.42, small: 1, lit: k, litAt: 258.8, seed: 11 });
      Sm.push({ a: FORGE - 1, layer: 'main', h: 200, t0: 259, size: 0.9, life: 5, every: 0.5, rise: 160, drift: 3, alpha: 0.3 });
      const strike = Math.max(0, Math.sin(t * 4.4 * Math.PI / 2)) ** 8 + Math.max(0, Math.sin(t * 4.4 * Math.PI / 2 + Math.PI)) ** 8;
      L.push({ a: FORGE + 4.8, h: 30, r: 300, k: 0.9 * strike * k, color: [255, 210, 120] });
    }
  },
  sky(g, st, t) {
    const { W, H } = st, u = st.eu;
    // lightning, far off over the sea
    for (const [tb, xf] of [[251.1, 0.7], [252.8, 0.4], [254.2, 0.82], [255.7, 0.55]]) {
      const k = Math.exp(-(((t - tb) / 0.08) ** 2)); if (k < 0.02) continue;
      g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(230,236,255,${0.9 * k})`; g.lineWidth = Math.max(1.5, 2.4 * u); g.beginPath(); let x = W * xf, y = 0; g.moveTo(x, y);
      for (let i = 0; i < 9; i++) { x += (hash(i * 7 + tb) - 0.5) * 60 * u; y += st.hy * 0.1; g.lineTo(x, y); } g.stroke(); g.restore();
    }
    // Fūjin in the clouds, blowing
    if (t > T_KAMI - 0.6 && t < 259.4) { const k = drop(t, T_KAMI - 0.4, 258), x = W * (por(st) ? 0.5 : 0.62), y = H * lerp(-0.5, por(st) ? 0.24 : 0.26, k); st.hang(g, st.fx.fujin, x, y, por(st) ? 0.85 : 1.2, Math.sin(t * 2.2) * 2 * DEG); }
  },
  over(g, st, t) {
    const { W, H } = st, u = st.eu;
    // the lightning's flash over everything
    let fl = 0; for (const tb of [251.1, 252.8, 254.2, 255.7]) fl += Math.exp(-(((t - tb) / 0.1) ** 2)); if (fl > 0.02) { g.fillStyle = `rgba(220,226,255,${0.22 * Math.min(1, fl)})`; g.fillRect(0, 0, W, H); }
    // the winds: long streamers torn across the frame
    if (t > T_KAMI && t < 258) { const k = sramp(t, T_KAMI, T_KAMI + 0.6) * (1 - sramp(t, 257, 258)); g.strokeStyle = `rgba(235,240,250,${0.35 * k})`; g.lineCap = 'round'; for (let i = 0; i < 16; i++) { const y = H * (0.2 + hash(i * 3) * 0.5), ph = ((t * (0.8 + hash(i) * 0.6) + hash(i * 7)) % 1), x = W * (1.2 - ph * 1.6); g.lineWidth = Math.max(1, (1 + hash(i * 5) * 2) * u); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x - 120 * u, y - 20 * u, x - 260 * u, y + Math.sin(t * 3 + i) * 10 * u); g.stroke(); } }
    // sparks at the anvil as the hammers fall
    if (t > 259 && t < 277) {
      g.globalCompositeOperation = 'lighter';
      for (let s = 0; s < 2; s++) { const ph = t * 4.4 * Math.PI / 2 + s * Math.PI, hit = Math.floor(ph / (Math.PI * 2)), age = ((ph / (Math.PI * 2)) % 1) - 0.22; if (age < 0 || age > 0.5) continue; const [x0, y0] = st.place('main', FORGE + 4.8, 30, t);
        for (let i = 0; i < 14; i++) { const a = -Math.PI / 2 + (hash(hit * 13 + i) - 0.5) * 2.4, sp = 120 + hash(i * 3 + hit) * 160, x = x0 + Math.cos(a) * sp * age * u, y = y0 + Math.sin(a) * sp * age * u + 200 * age * age * u; st.stamp(g, st.dot(255, 190, 90, '255,240,200'), x, y, 4 * u, (1 - age * 2)); } }
      g.globalCompositeOperation = 'source-over';
    }
    // the steel: folded again and again, then shaped, coated in clay, quenched, and curved
    closeUp(st, g, t, T_FOLD, 275.0, (g2) => {
      const t0 = T_FOLD + 0.4, nF = Math.min(15, Math.max(0, Math.floor((t - t0) / 0.3))), fph = clamp(((t - t0) / 0.3) % 1), folding = t < t0 + 4.6;
      if (folding) {
        // a glowing bar, hammered long, folded back on itself
        const heat = 0.9, L0 = 180, half = fph < 0.6 ? 0 : sramp(fph, 0.6, 1);
        g2.save(); g2.fillStyle = '#6a6a72'; g2.fillRect(-120, 30, 240, 40); // the anvil
        const bar = (x0, x1, y, rot) => { g2.save(); g2.translate(x0, y); g2.rotate(rot); const gr = g2.createLinearGradient(0, -10, 0, 10); gr.addColorStop(0, '#ffd27a'); gr.addColorStop(0.5, '#ff9a3a'); gr.addColorStop(1, '#c8501e'); g2.fillStyle = gr; g2.fillRect(0, -10, x1 - x0, 20); g2.restore(); };
        bar(-L0 / 2, 0, 18, 0); bar(0, L0 / 2, 18, -Math.PI * half);
        g2.globalCompositeOperation = 'lighter'; const gl = g2.createRadialGradient(0, 18, 0, 0, 18, 160); gl.addColorStop(0, `rgba(255,150,60,${0.35 * heat})`); gl.addColorStop(1, 'rgba(255,120,40,0)'); g2.fillStyle = gl; g2.fillRect(-180, -150, 360, 320); g2.globalCompositeOperation = 'source-over';
        g2.font = 'italic 400 30px Fraunces, Georgia, serif'; g2.textAlign = 'center'; g2.fillStyle = 'rgba(255,236,200,.9)'; g2.fillText(`${(2 ** nF).toLocaleString('en')} layers`, 0, -70);
        g2.restore();
      } else {
        const tb = t0 + 4.6, shape = sramp(t, tb, tb + 0.8), clay = sramp(t, ev('clay', 267.0) - 0.3, ev('clay', 267.0) + 0.6) * (1 - sramp(t, ev('plunge', 269.3), ev('plunge', 269.3) + 0.4));
        const heat = Math.max(0.35 * (1 - shape), sramp(t, ev('heat', 268.0), ev('heat', 268.0) + 0.6)) * (1 - sramp(t, ev('plunge', 269.3) + 0.1, ev('plunge', 269.3) + 0.9));
        const dip = sramp(t, ev('plunge', 269.3) - 0.3, ev('plunge', 269.3) + 0.2) * (1 - sramp(t, ev('plunge', 269.3) + 1.6, ev('plunge', 269.3) + 2.3));
        const curve = sramp(t, ev('plunge', 269.3) + 0.3, ev('curve', 273.4) - 0.6), hamon = sramp(t, ev('hard', 271.4), ev('hard', 271.4) + 0.8), gleam = t > 273.4 ? clamp((t - 273.4) / 1.1) : 0;
        g2.save(); g2.translate(0, dip * 60); g2.rotate(-0.06); blade(g2, curve * 0.11, heat, clay, hamon, gleam); g2.restore();
        if (dip > 0.01) { g2.fillStyle = `rgba(60,96,120,${0.85 * dip})`; g2.fillRect(-190, 50 - dip * 10, 380, 90); g2.fillStyle = `rgba(200,230,240,${0.4 * dip})`; g2.fillRect(-190, 50 - dip * 10, 380, 3); }
        const steam = Math.exp(-(((t - ev('plunge', 269.3) - 0.6) / 0.9) ** 2)); if (steam > 0.02) for (let i = 0; i < 16; i++) { const x = -160 + hash(i * 3) * 320, y = 40 - (t - ev('plunge', 269.3)) * (60 + hash(i) * 80) - hash(i * 5) * 40; g2.fillStyle = `rgba(240,244,248,${0.55 * steam})`; g2.beginPath(); g2.arc(x, y, 14 + hash(i * 7) * 16, 0, 7); g2.fill(); }
      }
    }, { light: [255, 130, 50], glow: 0.42, veil: 0.55, scale: 1.05 });
  },
});
