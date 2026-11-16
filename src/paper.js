// The cardboard material. Every cut-out in the film is baked once through this
// file into an offscreen sprite: a hand-cut silhouette with a visible board
// edge, paper grain, uneven gouache, a raw kraft rim and a soft shadow.
import { rng, hex, rgb, mix, shade, hashStr } from './util.js';

export const KRAFT = '#c8a77a';
export const KRAFT_EDGE = '#8d6a45';
export const KRAFT_DARK = '#6e5136';

let GRAIN = null, BLOTCH = null;

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h));
  return c;
}
// Phones (iPhones above all, and in-app browsers most of all) cap the memory that all canvases
// together may hold, and only count a dropped canvas as gone once it is garbage-collected.
// Shrinking a scratch canvas to nothing hands its memory back at once.
export function release(c) { if (c && c.width) { c.width = 0; c.height = 0; } }

// Fine fibre grain, centred on mid-grey so it can be laid on with 'overlay'.
function buildGrain() {
  const N = 256, c = makeCanvas(N, N), g = c.getContext('2d');
  const id = g.createImageData(N, N), r = rng(77);
  for (let i = 0; i < N * N; i++) {
    const v = 128 + (r() + r() + r() - 1.5) * 34;
    id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255;
  }
  g.putImageData(id, 0, 0);
  g.lineCap = 'round';
  for (let i = 0; i < 900; i++) {
    const x = r() * N, y = r() * N, a = r() * Math.PI, l = 3 + r() * 11;
    const dark = r() < 0.55;
    g.strokeStyle = dark ? `rgba(70,50,30,${0.05 + r() * 0.1})` : `rgba(255,250,235,${0.05 + r() * 0.12})`;
    g.lineWidth = 0.5 + r() * 0.7;
    for (let ox = -N; ox <= N; ox += N) for (let oy = -N; oy <= N; oy += N) {
      if (x + ox < -14 || x + ox > N + 14 || y + oy < -14 || y + oy > N + 14) continue;
      g.beginPath(); g.moveTo(x + ox, y + oy);
      g.quadraticCurveTo(x + ox + Math.cos(a) * l * 0.5 + (r() - 0.5) * 3, y + oy + Math.sin(a) * l * 0.5 + (r() - 0.5) * 3, x + ox + Math.cos(a) * l, y + oy + Math.sin(a) * l);
      g.stroke();
    }
  }
  return c;
}
// Slow tonal drift, like gouache laid on unevenly. Seamless (integer frequencies).
function buildBlotch() {
  const N = 256, c = makeCanvas(N, N), g = c.getContext('2d');
  const id = g.createImageData(N, N), r = rng(1234);
  const waves = [];
  for (let k = 0; k < 14; k++) waves.push([Math.round((r() - 0.5) * 8), Math.round((r() - 0.5) * 8), r() * 6.28, 0.4 + r() * 0.6]);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let v = 0;
    for (const w of waves) v += Math.cos(((w[0] * x + w[1] * y) / N) * 6.2832 + w[2]) * w[3];
    v = 222 + v * 7.5;
    const i = (y * N + x) * 4;
    id.data[i] = v; id.data[i + 1] = v * 0.985; id.data[i + 2] = v * 0.96; id.data[i + 3] = 255;
  }
  g.putImageData(id, 0, 0);
  return c;
}
export function textures() {
  if (!GRAIN) { GRAIN = buildGrain(); BLOTCH = buildBlotch(); }
  return { GRAIN, BLOTCH };
}

// Soft blur without ctx.filter (Safari): shrink, then grow again with smoothing.
export function blurred(src, radius, keepSmall = false) {
  const f = Math.max(1, radius / 1.6);
  const w = Math.max(2, Math.round(src.width / f)), h = Math.max(2, Math.round(src.height / f));
  let a = makeCanvas(w, h), ag = a.getContext('2d');
  ag.imageSmoothingQuality = 'high';
  // step down in halves for a smoother kernel
  let cur = src, cw = src.width, ch = src.height;
  while (cw / 2 > w) {
    const t = makeCanvas(cw / 2, ch / 2), tg = t.getContext('2d');
    tg.imageSmoothingQuality = 'high';
    tg.drawImage(cur, 0, 0, t.width, t.height);
    if (cur !== src) release(cur);
    cur = t; cw = t.width; ch = t.height;
  }
  ag.drawImage(cur, 0, 0, w, h);
  if (cur !== src) release(cur);
  if (keepSmall) return a;
  const out = makeCanvas(src.width, src.height), og = out.getContext('2d');
  og.imageSmoothingQuality = 'high';
  og.drawImage(a, 0, 0, out.width, out.height);
  release(a);
  return out;
}

// --- hand-cut outlines ------------------------------------------------------
// Scissors never follow the pencil line exactly: nudge every vertex, break long
// edges with a slight wander, and soften the corners a little.
function handCut(pts, r, rough, maxSeg) {
  const out = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    out.push([a[0] + (r() - 0.5) * rough, a[1] + (r() - 0.5) * rough, a[2]]);
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
    const k = Math.floor(len / maxSeg);
    for (let j = 1; j <= k; j++) {
      const u = j / (k + 1), w = (r() - 0.5) * rough * 0.9;
      out.push([a[0] + dx * u - (dy / len) * w, a[1] + dy * u + (dx / len) * w, 1e6]);
    }
  }
  return out;
}
function tracePts(path, pts, round) {
  const n = pts.length;
  const q = (i) => pts[(i + n) % n];
  for (let i = 0; i < n; i++) {
    const p = q(i), a = q(i - 1), b = q(i + 1);
    const rr = p[2] === 1e6 ? Math.max(Math.min(round, 8), 3) : (p[2] ?? round);
    const la = Math.hypot(a[0] - p[0], a[1] - p[1]) || 1, lb = Math.hypot(b[0] - p[0], b[1] - p[1]) || 1;
    const ra = Math.min(rr, la / 2), rb = Math.min(rr, lb / 2);
    const ax = p[0] + ((a[0] - p[0]) / la) * ra, ay = p[1] + ((a[1] - p[1]) / la) * ra;
    const bx = p[0] + ((b[0] - p[0]) / lb) * rb, by = p[1] + ((b[1] - p[1]) / lb) * rb;
    if (i === 0) path.moveTo(ax, ay); else path.lineTo(ax, ay);
    path.quadraticCurveTo(p[0], p[1], bx, by);
  }
  path.closePath();
}

// Shape helpers (all return point lists in design units).
export function ellipse(cx, cy, rx, ry, n = 14, rot = 0) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, x = Math.cos(a) * rx, y = Math.sin(a) * ry;
    pts.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
  }
  return pts;
}
// A tapered strip from A to B (limbs, trunks, sticks).
export function strip(x0, y0, x1, y1, w0, w1) {
  const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
  return [[x0 + nx * w0 / 2, y0 + ny * w0 / 2], [x1 + nx * w1 / 2, y1 + ny * w1 / 2], [x1 - nx * w1 / 2, y1 - ny * w1 / 2], [x0 - nx * w0 / 2, y0 - ny * w0 / 2]];
}

// --- sheet: one sprite being assembled from several pieces of board ---------
export class Sheet {
  // Box is [x0,y0]..[x1,y1] in design units, anchor at the origin (0,0).
  constructor(name, box, scale, opts = {}) {
    textures();
    this.name = name; this.s = scale;
    this.pad = opts.pad ?? 10;
    this.x0 = box[0] - this.pad; this.y0 = box[1] - this.pad;
    this.w = box[2] - box[0] + this.pad * 2; this.h = box[3] - box[1] + this.pad * 2;
    this.c = makeCanvas(this.w * scale, this.h * scale);
    this.g = this.c.getContext('2d');
    this.g.setTransform(scale, 0, 0, scale, -this.x0 * scale, -this.y0 * scale);
    this.r = rng(hashStr(name));
    this.grain = this.g.createPattern(GRAIN, 'repeat');
    this.blotch = this.g.createPattern(BLOTCH, 'repeat');
    this.count = 0;
  }
  path(shape, o = {}) {
    const p = new Path2D();
    const lists = Array.isArray(shape[0][0]) ? shape : [shape];
    for (const pts of lists) tracePts(p, handCut(pts, this.r, o.rough ?? 0.9, o.seg ?? 26), o.round ?? 1.2);
    return p;
  }
  // Cut one piece of painted board and glue it on top of what is already there.
  piece(shape, fill, o = {}) {
    const g = this.g, s = this.s, path = shape instanceof Path2D ? shape : this.path(shape, o);
    const lift = o.lift ?? 2.4, thick = o.thick ?? 1.5;
    const col = hex(fill);
    // 1. the board's cut edge, casting a soft shadow on the pieces underneath
    g.save();
    if (this.count > 0 && lift > 0) {
      g.shadowColor = 'rgba(28,16,8,0.42)'; g.shadowBlur = lift * 1.7 * s;
      g.shadowOffsetX = lift * 0.45 * s; g.shadowOffsetY = lift * 0.8 * s;
    }
    g.translate(thick * 0.5, thick * 0.85);
    g.fillStyle = rgb(mix(KRAFT_EDGE, shade(col, -0.5), 0.35));
    g.fill(path);
    g.restore();
    // 2. the painted face
    g.save();
    g.clip(path);
    g.fillStyle = rgb(col);
    g.fillRect(this.x0, this.y0, this.w, this.h);
    if (o.paint) { g.save(); o.paint(g, this); g.restore(); }
    // light falls from the upper left across the face
    const gr = g.createLinearGradient(this.x0, this.y0, this.x0 + this.w * 0.6, this.y0 + this.h);
    gr.addColorStop(0, 'rgba(255,244,220,0.10)'); gr.addColorStop(0.5, 'rgba(255,244,220,0)'); gr.addColorStop(1, 'rgba(30,14,4,0.13)');
    g.fillStyle = gr; g.fillRect(this.x0, this.y0, this.w, this.h);
    // uneven paint, then paper fibre (both in device pixels so the grain stays fine)
    g.save();
    g.setTransform(1, 0, 0, 1, (this.r() * 200) | 0, (this.r() * 200) | 0);
    g.globalCompositeOperation = 'multiply'; g.globalAlpha = o.blotch ?? 0.9;
    g.fillStyle = this.blotch; g.fillRect(-256, -256, this.c.width + 512, this.c.height + 512);
    g.globalCompositeOperation = 'overlay'; g.globalAlpha = o.grain ?? 0.55;
    g.fillStyle = this.grain; g.fillRect(-256, -256, this.c.width + 512, this.c.height + 512);
    g.restore();
    // raw kraft showing where the paint stops short of the cut
    const rim = o.rim ?? 0.5;
    if (rim > 0) {
      g.lineJoin = 'round';
      g.strokeStyle = rgb(mix(KRAFT, col, 0.25), rim); g.lineWidth = 2.1; g.stroke(path);
      g.translate(0.5, 0.6);
      g.strokeStyle = 'rgba(255,246,226,0.22)'; g.lineWidth = 1.3; g.stroke(path);
    }
    g.restore();
    this.count++;
    return this;
  }
  // A brass paper fastener: the joints of the puppets.
  brad(x, y, r = 1.7) {
    const g = this.g;
    g.save();
    g.shadowColor = 'rgba(20,10,0,0.5)'; g.shadowBlur = 1.2 * this.s; g.shadowOffsetY = 0.5 * this.s;
    g.fillStyle = '#b08d4a'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    g.restore();
    g.fillStyle = 'rgba(255,240,190,0.75)'; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.3, r * 0.42, 0, 7); g.fill();
    return this;
  }
  // Painted line work on top of the last piece (brush, slightly unsteady).
  stroke(pts, color, width = 1.2, alpha = 0.8) {
    const g = this.g, r = this.r;
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = rgb(hex(color), alpha); g.lineWidth = width;
    g.beginPath();
    pts.forEach((p, i) => { const x = p[0] + (r() - 0.5) * 0.6, y = p[1] + (r() - 0.5) * 0.6; i ? g.lineTo(x, y) : g.moveTo(x, y); });
    g.stroke(); g.restore();
    return this;
  }
  finish(o = {}) {
    let img = this.c;
    const s = this.s;
    // drop shadow of the whole cut-out, quarter size and soft
    const sil = makeCanvas(img.width, img.height), sg = sil.getContext('2d');
    sg.drawImage(img, 0, 0);
    sg.globalCompositeOperation = 'source-in'; sg.fillStyle = 'rgb(24,14,10)'; sg.fillRect(0, 0, sil.width, sil.height);
    const shadow = blurred(sil, Math.max(3, (o.shadowBlur ?? 5) * s), true);
    release(sil);
    if (o.blur) { img = blurred(img, o.blur * s); release(this.c); }
    this.c = this.g = this.grain = this.blotch = null;
    return { img, shadow, x: this.x0, y: this.y0, w: this.w, h: this.h, name: this.name, sprite: true };
  }
}

// Draw a baked sprite with its anchor at the current origin (context is in design units).
// Where the light comes from: the stage shifts every shadow away from the strongest light nearby.
export const SHADOW = { dx: 0 };
export function put(g, spr, shadowAlpha = 0, sx = 3, sy = 4) {
  if (shadowAlpha > 0) {
    const a = g.globalAlpha;
    g.globalAlpha = a * shadowAlpha;
    g.drawImage(spr.shadow, spr.x + sx + SHADOW.dx * (sx + 1) / 3, spr.y + sy, spr.w, spr.h);
    g.globalAlpha = a;
  }
  g.drawImage(spr.img, spr.x, spr.y, spr.w, spr.h);
}
export { makeCanvas };
