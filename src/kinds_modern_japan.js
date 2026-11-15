// Cut-outs for "Mended with Gold": the twentieth century and now. Each modern thing is cut for its own
// signature shape and given the behaviour that shows what it does.
import { put, ellipse, strip } from './paper.js';
import { KINDS } from './cutouts.js';
import { drawPerson } from './people.js';
import { rng, fbm, DEG, hash, shade, rgb, clamp, sramp, lerp } from './util.js';
import { glowRects, paintRects } from './kinds_china.js';
import { rect, puppet } from './kinds_japan.js';

// ===================================================================== war ===
// The Hiroshima Prefectural Industrial Promotion Hall: v0 as it was, brick with a green copper dome;
// v1 after the bomb, the dome's bare frame over broken walls.
KINDS.promohall = {
  bake(mk, v = 0) {
    const r = rng(9700 + v), sh = mk('promohall' + v, [-170, -300, 170, 6]), brick = v ? '#7a7066' : '#b8a48a';
    if (!v) {
      sh.piece(rect(-160, 4, 160, -110), brick, { round: 1.5, paint: (g) => { g.fillStyle = 'rgba(40,40,46,.8)'; for (let x = -148; x < 150; x += 22) { g.fillRect(x, -96, 12, 30); g.fillRect(x, -50, 12, 30); } g.fillStyle = 'rgba(255,250,240,.3)'; g.fillRect(-160, -110, 320, 5); } });
      sh.piece(rect(-50, -110, 50, -190), brick, { round: 1.2, lift: 1.2, paint: (g) => { g.fillStyle = 'rgba(40,40,46,.8)'; for (let x = -40; x < 44; x += 20) g.fillRect(x, -176, 10, 50); } });
      sh.piece([[-48, -190], [-44, -224], [-28, -256], [0, -268], [28, -256], [44, -224], [48, -190]], '#5a9a84', { round: 8, lift: 1.6, paint: (g) => { g.strokeStyle = 'rgba(30,70,60,.6)'; g.lineWidth = 1.4; for (let x = -40; x < 44; x += 12) { g.beginPath(); g.moveTo(x, -190); g.quadraticCurveTo(x * 0.5, -250, 0, -266); g.stroke(); } } });
      sh.piece(strip(0, -266, 0, -288, 3, 2), '#5a9a84', { round: 1, lift: 1 });
    } else {
      sh.piece([[-160, 4], [-158, -60], [-130, -84], [-110, -60], [-80, -100], [-50, -110], [-50, -186], [50, -186], [50, -120], [80, -96], [100, -70], [130, -80], [160, -40], [160, 4]], brick, { round: 2, rough: 2.4, paint: (g) => { g.fillStyle = 'rgba(20,18,16,.85)'; for (let x = -148; x < 150; x += 22) { if (r() < 0.4) continue; g.fillRect(x, -60, 12, 30); } for (let x = -40; x < 44; x += 20) g.fillRect(x, -170, 10, 50); g.fillStyle = 'rgba(30,28,26,.5)'; for (let i = 0; i < 30; i++) g.fillRect(-150 + r() * 300, -100 + r() * 100, 6 + r() * 10, 3); } });
      // the dome: only its steel ribs
      sh.piece([[-50, -186], [50, -186], [50, -192], [-50, -192]], '#4a4640', { round: 1, lift: 1.2 });
    }
    return { spr: sh.finish({ shadowBlur: 6 }) };
  },
  draw(g, P, t, e, env) {
    put(g, P.spr, env.sh, 4, 5);
    if ((e.v || 0) === 1) { g.save(); g.strokeStyle = '#3a3632'; g.lineWidth = 3; g.lineCap = 'round'; for (let k = 0; k <= 8; k++) { const x = -48 + k * 12; g.beginPath(); g.moveTo(x, -190); g.quadraticCurveTo(x * 0.55, -252, 0, -268); g.stroke(); } for (const y of [-214, -238]) { const w = y === -214 ? 44 : 30; g.beginPath(); g.moveTo(-w, y); g.quadraticCurveTo(0, y - 6, w, y); g.stroke(); } g.restore(); }
  },
};
// A family's radio on a low table: the Emperor's voice came out of it on 15 August 1945.
KINDS.radioset = { bake(mk) { return { spr: mk('radioset', [-40, -100, 40, 6]).piece(rect(-34, 4, 34, -44), '#5a4030', { round: 1.5 }).piece(strip(-28, 4, -28, -40, 3, 3), '#4a3428', { round: 1 }).piece([[-26, -44], [26, -44], [24, -92], [12, -98], [-12, -98], [-24, -92]], '#7a4e2c', { round: 6, lift: 1.2, paint: (g) => { g.fillStyle = '#d8c8a0'; g.beginPath(); g.arc(0, -76, 13, 0, 7); g.fill(); g.strokeStyle = 'rgba(90,60,30,.6)'; g.lineWidth = 1; for (let k = -10; k <= 10; k += 4) { g.beginPath(); g.moveTo(k, -88); g.lineTo(k, -64); g.stroke(); } g.fillStyle = '#c9a24a'; g.fillRect(-14, -56, 28, 5); } }).finish({ shadowBlur: 3 }) }; }, draw(g, P, t, e, env) { put(g, P.spr, env.sh, 2, 3); } };
// A hospital room opened like a dollhouse: a bed under a window, strings of paper cranes hung above it
// (e.cranes(t): how many strings).
KINDS.hospital = {
  bake(mk) { const sh = mk('hospital', [-130, -230, 130, 6]); sh.piece(rect(-120, 4, 120, -10), '#a8a49a', { round: 1.5 }); sh.piece(rect(-112, -10, 112, -200), '#e8e4da', { round: 1.5, lift: 1, paint: (g) => { g.fillStyle = '#a8c4d8'; g.fillRect(10, -170, 70, 80); g.strokeStyle = '#8a8478'; g.lineWidth = 3; g.strokeRect(10, -170, 70, 80); g.beginPath(); g.moveTo(45, -170); g.lineTo(45, -90); g.stroke(); g.fillStyle = 'rgba(255,240,220,.4)'; g.fillRect(14, -166, 28, 30); } }); sh.piece(rect(-120, -200, 120, -214), '#8a8478', { round: 1.5, lift: 1.2 }); for (const x of [-112, 112]) sh.piece(strip(x, -10, x, -200, 6, 6), '#9a948a', { round: 1, lift: 1.2 });
    sh.piece(rect(-70, -10, 50, -46), '#d8d4ca', { round: 2, lift: 1.2, paint: (g) => { g.fillStyle = '#f4f2ee'; g.fillRect(-70, -54, 120, 10); } }); sh.piece(strip(-70, -10, -70, -90, 4, 4), '#8a8478', { round: 1, lift: 1.2 }); sh.piece(strip(50, -10, 50, -66, 4, 4), '#8a8478', { round: 1, lift: 1.2 });
    return { spr: sh.finish({ shadowBlur: 5 }) }; },
  draw(g, P, t, e, env) {
    put(g, P.spr, env.sh, 3, 4);
    const n = e.cranes ? e.cranes(t) : 0, cols = ['#e85a6a', '#f0a040', '#5aa0d8', '#7ac070', '#c070c0', '#f0d050'];
    for (let s = 0; s < 14; s++) { const k = clamp(n - s); if (k <= 0) break; const x = -100 + s * 15; g.strokeStyle = 'rgba(200,190,175,.6)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(x, -200); g.lineTo(x, -200 + 120 * k); g.stroke(); for (let j = 0; j < 10 * k; j++) { const y = -194 + j * 12, sw = Math.sin(t * 1.4 + s + j * 0.3) * 1.4; g.save(); g.translate(x + sw, y); g.fillStyle = cols[(s + j) % 6]; g.beginPath(); g.moveTo(-5, 0); g.lineTo(0, -4); g.lineTo(5, 0); g.lineTo(0, 2); g.closePath(); g.fill(); g.restore(); } }
  },
};

// ================================================================= the miracle ===
// Tokyo Tower: a red-and-white lattice with two observation decks. Lit at night with e.lit(t).
KINDS.tokyotower = {
  bake(mk) { const sh = mk('tokyotower', [-120, -620, 120, 6]); const W = (y) => 110 * Math.pow(1 - (-y / 600), 1.6) + 4;
    const band = (y0, y1, col) => sh.piece([[-W(y0), y0], [W(y0), y0], [W(y1), y1], [-W(y1), y1]], col, { round: 1, rough: 0.3, lift: 0.8, paint: (g) => { g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1.2; for (let y = y0; y > y1; y -= 12) { g.beginPath(); g.moveTo(-W(y), y); g.lineTo(W(y - 12), y - 12); g.moveTo(W(y), y); g.lineTo(-W(y - 12), y - 12); g.stroke(); } } });
    for (const [y0, y1, i] of [[4, -60, 0], [-60, -120, 1], [-120, -180, 0], [-180, -240, 1], [-240, -300, 0], [-300, -360, 1], [-360, -420, 0], [-420, -480, 1], [-480, -540, 0], [-540, -580, 1]]) band(y0, y1, i ? '#f2eee6' : '#d8402a');
    sh.piece([[-W(4) - 6, 4], [-W(4) + 30, 4], [-24, -70], [-34, -70]], '#d8402a', { round: 1, lift: 1 }); sh.piece([[W(4) + 6, 4], [W(4) - 30, 4], [24, -70], [34, -70]], '#d8402a', { round: 1, lift: 1 });
    sh.piece(rect(-46, -240, 46, -270), '#e8e4dc', { round: 2, lift: 1.4, paint: (g) => { g.fillStyle = 'rgba(40,50,70,.85)'; g.fillRect(-42, -262, 84, 14); } });
    sh.piece(rect(-24, -440, 24, -456), '#e8e4dc', { round: 2, lift: 1.4, paint: (g) => { g.fillStyle = 'rgba(40,50,70,.85)'; g.fillRect(-20, -452, 40, 8); } });
    sh.piece(strip(0, -580, 0, -615, 4, 2), '#d8402a', { round: 1, lift: 1 });
    return { spr: sh.finish({ shadowBlur: 6 }) }; },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 4, 5); },
  glow(g, P, t, e, env, p) { const k = e.lit ? e.lit(t) : 0; if (k < 0.01 || p < 0.6) return; g.globalCompositeOperation = 'lighter'; const W = (y) => 110 * Math.pow(1 - (-y / 600), 1.6) + 4; g.strokeStyle = `rgba(255,170,90,${0.7 * k})`; g.lineWidth = 2.4; g.beginPath(); for (let y = 0; y > -590; y -= 10) g.lineTo(-W(y), y); g.stroke(); g.beginPath(); for (let y = 0; y > -590; y -= 10) g.lineTo(W(y), y); g.stroke(); for (const y of [-255, -448]) { const gr = g.createRadialGradient(0, y, 0, 0, y, 70); gr.addColorStop(0, `rgba(255,220,170,${0.5 * k})`); gr.addColorStop(1, 'rgba(255,200,140,0)'); g.fillStyle = gr; g.fillRect(-70, y - 70, 140, 140); } g.globalCompositeOperation = 'source-over'; },
};
// The Olympic cauldron on its tall stand (the flame comes from the chapter's emitter).
KINDS.cauldron = { bake(mk) { return { spr: mk('cauldron', [-60, -260, 60, 6]).piece([[-40, 4], [40, 4], [16, -200], [-16, -200]], '#d8d4ca', { round: 2, paint: (g) => { g.strokeStyle = 'rgba(120,116,108,.4)'; g.lineWidth = 1; for (let y = -10; y > -200; y -= 12) { g.beginPath(); g.moveTo(-40 + (-y / 200) * 24, y); g.lineTo(40 - (-y / 200) * 24, y); g.stroke(); } } }).piece([[-48, -200], [48, -200], [36, -236], [-36, -236]], '#3a3a40', { round: 4, lift: 1.4, paint: (g) => { g.fillStyle = '#c9a24a'; g.fillRect(-46, -212, 92, 4); } }).finish({ shadowBlur: 5 }) }; }, draw(g, P, t, e, env) { put(g, P.spr, env.sh, 3, 4); } };
// A concrete pier for a railway viaduct.
KINDS.pier = { bake(mk) { return { spr: mk('pier', [-30, -170, 30, 8]).piece([[-16, 8], [16, 8], [12, -150], [26, -160], [-26, -160], [-12, -150]], '#b8b4aa', { round: 2, paint: (g) => { g.fillStyle = 'rgba(80,76,70,.25)'; g.fillRect(-16, -150, 6, 158); } }).finish({ shadowBlur: 4 }) }; }, draw(g, P, t, e, env) { put(g, P.spr, env.sh, 3, 4); } };
// The Shinkansen, in six generations: v0 the round-nosed 0 series of 1964, v1 100, v2 300, v3 the needle
// of the 500, v4 the 'duck-bill' 700, v5 N700. Long: its cars follow the curve of the ground behind the
// nose, and only what is between e.portal and e.portalEnd is shown, so it runs out of one tunnel and into the next.
const NOSES = [
  [[-108, -4], [-108, -46], [30, -46], [70, -42], [100, -32], [118, -20], [124, -10], [122, -4]],
  [[-108, -4], [-108, -46], [30, -46], [80, -40], [120, -26], [138, -12], [140, -4]],
  [[-108, -4], [-108, -44], [40, -44], [100, -32], [146, -14], [152, -6], [150, -4]],
  [[-108, -4], [-108, -42], [20, -42], [80, -36], [140, -22], [196, -10], [214, -5], [212, -4]],
  [[-108, -4], [-108, -46], [30, -46], [70, -42], [120, -26], [150, -16], [168, -12], [172, -6], [170, -4]],
  [[-108, -4], [-108, -46], [30, -46], [70, -40], [110, -24], [140, -22], [170, -12], [180, -6], [178, -4]],
];
KINDS.shinkansen = {
  bake(mk, v = 0) {
    const P = {}, win = [], nose = NOSES[v], tip = nose[nose.length - 2][0], blue = v === 3 ? '#3a4a7a' : '#1e3e8a', body = v === 3 ? '#c8ccd4' : '#f2f3f2';
    for (let x = -104; x < 96; x += 14) win.push([x, -34, 9, 9]);
    const livery = (g, x0, x1) => { g.fillStyle = blue; g.fillRect(x0, -36, x1 - x0, 12); g.fillStyle = 'rgba(255,255,255,.9)'; for (const [x, y, w, h] of win) if (x > x0 && x + w < x1) g.fillRect(x, y + 1, w, h - 2); g.fillStyle = blue; g.fillRect(x0, -16, x1 - x0, 5); };
    P.nose = mk('sk-nose' + v, [-112, -56, tip + 10, 6]).piece(nose, body, { round: 6, paint: (g) => {
      livery(g, -108, 20);
      g.fillStyle = blue; g.beginPath(); g.moveTo(20, -16); g.quadraticCurveTo(tip * 0.7, -15, tip - 4, -8); g.lineTo(tip - 4, -6); g.quadraticCurveTo(tip * 0.7, -11, 20, -11); g.fill();
      g.fillStyle = 'rgba(22,28,40,.92)'; g.beginPath(); g.moveTo(26, -44); g.quadraticCurveTo(tip * 0.45, -42, tip * 0.62, -30); g.lineTo(tip * 0.5, -28); g.quadraticCurveTo(tip * 0.35, -36, 22, -36); g.closePath(); g.fill();
      if (v === 0) { g.fillStyle = '#f8f4ea'; g.beginPath(); g.ellipse(tip - 6, -14, 6, 4.4, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(120,120,126,.6)'; g.lineWidth = 0.8; g.stroke(); }
      g.fillStyle = '#f8f0c8'; g.beginPath(); g.ellipse(tip - 14, -10, 4, 1.6, -0.2, 0, 7); g.fill();
    } }).finish({ shadowBlur: 3 });
    P.car = mk('sk-car' + v, [-114, -56, 114, 6]).piece(rect(-110, -4, 110, -46), body, { round: 6, paint: (g) => { livery(g, -110, 110); g.strokeStyle = 'rgba(120,120,126,.5)'; g.lineWidth = 0.8; for (const x of [-100, 86]) g.strokeRect(x, -40, 12, 32); } }).piece([[-10, -46], [-4, -56], [14, -56], [20, -46]], '#9a9ca2', { round: 1, lift: 0.8 }).finish({ shadowBlur: 3 });
    P.win = win; P.tip = tip;
    return P;
  },
  draw(g, P, t, e, env) {
    const sc = e.scale || 1, a0 = e.a + (e.move ? e.move(t) : 0), lift = e.y || 0, r0 = 1000 + lift;
    const at = (x) => a0 + ((x * sc) / r0) / DEG, shown = (x0, x1) => (e.portal === undefined || at(x1) > e.portal) && (e.portalEnd === undefined || at(x0) < e.portalEnd);
    for (let k = 1; k <= (e.cars ?? 5); k++) { const off = -230 * k + 8; if (!shown(off - 114, off + 114)) continue; const dr = (off * sc) / r0; g.save(); g.translate((Math.sin(dr) * r0) / sc, (r0 - Math.cos(dr) * r0) / sc); g.rotate(dr); put(g, P.car, env.sh, 2, 3); g.restore(); }
    if (shown(-110, P.tip)) put(g, P.nose, env.sh, 2, 3);
  },
  glow(g, P, t, e, env, p) {
    const k = e.lit ? e.lit(t) : 0; if (k < 0.01 || p < 0.6) return;
    const sc = e.scale || 1, a0 = e.a + (e.move ? e.move(t) : 0), lift = e.y || 0, r0 = 1000 + lift;
    const inside = (x) => { const a = a0 + ((x * sc) / r0) / DEG; return (e.portal !== undefined && a < e.portal) || (e.portalEnd !== undefined && a > e.portalEnd); };
    g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(255,240,210,${0.85 * k})`;
    for (let c = 0; c <= (e.cars ?? 5); c++) { const off = -230 * c + (c ? 8 : 0), dr = (off * sc) / r0; g.save(); g.translate((Math.sin(dr) * r0) / sc, (r0 - Math.cos(dr) * r0) / sc); g.rotate(dr); for (const [x, y, w, h] of P.win) if ((c || x < 18) && !inside(off + x + w / 2)) g.fillRect(x + 1, y + 2, w - 2, h - 4); g.restore(); }
    if (!inside(P.tip)) { const gr = g.createLinearGradient(P.tip, -10, P.tip + 260, 0); gr.addColorStop(0, `rgba(255,248,220,${0.5 * k})`); gr.addColorStop(1, 'rgba(255,248,220,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(P.tip - 4, -12); g.lineTo(P.tip + 260, -40); g.lineTo(P.tip + 260, 20); g.lineTo(P.tip - 4, -6); g.fill(); }
    g.globalCompositeOperation = 'source-over';
  },
};
// A small 1960s family car on the line; v picks its paint. e.bare shows only the unpainted body shell.
KINDS.corolla = {
  bake(mk, v = 0) { const col = ['#d8d4c4', '#8ab0c8', '#c8402a', '#e8c860', '#7a9a7a'][v % 5]; return { spr: mk('corolla' + v, [-80, -70, 80, 6]).piece([[-74, -12], [-70, -34], [-40, -38], [-24, -62], [30, -62], [48, -38], [72, -32], [76, -12]], col, { round: 8, paint: (g) => { g.fillStyle = 'rgba(40,50,60,.85)'; g.beginPath(); g.moveTo(-18, -40); g.lineTo(-8, -58); g.lineTo(6, -58); g.lineTo(6, -40); g.fill(); g.beginPath(); g.moveTo(12, -40); g.lineTo(12, -58); g.lineTo(26, -58); g.lineTo(40, -40); g.fill(); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(-70, -30, 144, 2); g.fillStyle = '#e8e4dc'; g.fillRect(70, -26, 6, 6); g.fillRect(-74, -24, 6, 8); } }).piece(ellipse(-44, -10, 13, 13, 14), '#1e1e22', { round: 4, lift: 1, paint: (g) => { g.fillStyle = '#c8c8cc'; g.beginPath(); g.arc(-44, -10, 5, 0, 7); g.fill(); } }).piece(ellipse(46, -10, 13, 13, 14), '#1e1e22', { round: 4, lift: 1, paint: (g) => { g.fillStyle = '#c8c8cc'; g.beginPath(); g.arc(46, -10, 5, 0, 7); g.fill(); } }).finish({ shadowBlur: 3 }) }; },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 2, 3); },
};
// The assembly line's conveyor, and the andon board over it: green while it runs, yellow when a worker has
// pulled the cord (e.stop(t) > 0), with the cord hanging along the line.
KINDS.conveyor = {
  bake(mk) { return { spr: mk('conveyor', [-300, -40, 300, 6]).piece(rect(-290, 4, 290, -22), '#5a5a62', { round: 2, paint: (g) => { g.fillStyle = 'rgba(200,200,210,.35)'; for (let x = -284; x < 290; x += 12) g.fillRect(x, -22, 6, 4); } }).finish({ shadowBlur: 3 }), board: mk('andon', [-90, -40, 90, 6]).piece(rect(-84, 0, 84, -34), '#2a2a30', { round: 2 }).finish({ shadowBlur: 3 }) }; },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 2, 3); g.save(); g.translate(0, -300); put(g, P.board, env.sh * 0.5); g.restore(); g.strokeStyle = '#d8c040'; g.lineWidth = 1.6; g.beginPath(); const pull = e.stop ? e.stop(t) : 0; g.moveTo(-290, -230); g.lineTo(290, -230); g.stroke(); for (let x = -270; x < 290; x += 60) { g.beginPath(); g.moveTo(x, -230); g.lineTo(x, -230 + 6); g.stroke(); } },
  glow(g, P, t, e, env, p) { if (p < 0.6) return; const s = e.stop ? e.stop(t) : 0; g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 5; i++) { const x = -68 + i * 34, on = i === 2 ? s : 0, col = on > 0.5 ? [255, 200, 60] : [90, 230, 120]; g.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${on > 0.5 ? 0.6 + 0.4 * Math.sin(t * 10) : 0.7})`; g.fillRect(x, -330, 24, 22); } g.globalCompositeOperation = 'source-over'; },
};
// A building of the 1980s, its windows lit and neon signs down its side (e.on(t) 0..1, flickering off).
KINDS.neonbldg = {
  bake(mk, v = 0) { const r = rng(9800 + v), w = [70, 56, 84, 62][v % 4], h = [300, 380, 250, 340][v % 4], col = ['#3a3a48', '#2e3440', '#443a46', '#363a44'][v % 4], win = []; const sh = mk('neonb' + v, [-w - 10, -h - 30, w + 10, 6]); for (let y = -h + 20; y < -16; y += 18) for (let x = -w + 10; x < w - 10; x += 16) { if (r() < 0.25) continue; win.push([x, y, 9, 10]); } sh.piece(rect(-w, 4, w, -h), col, { round: 1.5, paint: paintRects(win, 'rgba(20,22,30,.9)') }); sh.piece(rect(-w - 6, -h, w + 6, -h - 10), shade(col, 0.1), { round: 1, lift: 1 }); return { spr: sh.finish({ shadowBlur: 5 }), windows: win, w, h }; },
  draw(g, P, t, e, env) { put(g, P.spr, env.sh, 3, 4); },
  glow(g, P, t, e, env, p) {
    if (p < 0.6) return; const k = e.on ? e.on(t) : 1; if (k < 0.01) return; const v = e.v || 0, cols = [[255, 80, 160], [80, 220, 255], [255, 210, 80], [180, 120, 255]];
    g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(255,220,150,${0.55 * k})`; for (const [x, y, w, h] of P.windows) if (hash(x * 3 + y + v) < 0.7) g.fillRect(x + 1, y + 1, w - 2, h - 2);
    // a vertical sign of glowing strokes down the side, and a band across the top
    const c = cols[v % 4], fl = k * (0.85 + 0.15 * Math.sin(t * 13 + v)), sx = P.w + 14;
    g.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${0.9 * fl})`; g.lineWidth = 3; g.lineCap = 'round';
    g.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${0.18 * fl})`; g.fillRect(sx - 12, -P.h * 0.85, 24, P.h * 0.6);
    for (let j = 0; j < 5; j++) { const y = -P.h * 0.82 + j * P.h * 0.11; g.beginPath(); g.moveTo(sx - 7, y); g.lineTo(sx + 7, y); g.moveTo(sx, y - 6); g.lineTo(sx, y + 14); if (j % 2) { g.moveTo(sx - 6, y + 8); g.lineTo(sx + 6, y + 12); } g.stroke(); }
    const c2 = cols[(v + 1) % 4]; g.fillStyle = `rgba(${c2[0]},${c2[1]},${c2[2]},${0.75 * fl})`; g.fillRect(-P.w + 8, -P.h + 6, P.w * 2 - 16, 8);
    g.globalCompositeOperation = 'source-over';
  },
};
