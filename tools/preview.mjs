// Render a smooth, silent preview loop of a published film: a few moments, crossfaded, looping seamlessly.
// usage: node tools/preview.mjs BASE_URL out.mp4 WxH "t0,t1,..." [secondsEach=2.8] [fps=30]
// e.g.   node tools/preview.mjs https://raycoding1-collab.github.io/Japan/ gallery/media/japan-wide.mp4 960x540 "10.8,420.4,446.2,704,811"
// The loop is cut inside the first moment, so its last frame runs straight on into its first.
import { chromium } from 'playwright';
import { execFileSync } from 'child_process';
import { mkdirSync, rmSync } from 'fs';
const [base, out, size = '960x540', times, each = '2.8', fpsA = '30'] = process.argv.slice(2);
const [w, h] = size.split('x').map(Number), ts = times.split(',').map(Number), dur = +each, fps = +fpsA, XD = 0.7;
const tmp = `.cache/preview_${out.replace(/\W+/g, '_')}`; rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true });
const b = await chromium.launch();
const t0 = Date.now();
for (let s = 0; s < ts.length; s++) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await p.goto(`${base}?t=${ts[s]}`); await p.waitForFunction('window.__ready === true', null, { timeout: 90000 });
  await p.addStyleTag({ content: '#veil,#bar,#caption,#end,#chapters{display:none!important}' });
  const n = Math.round(dur * fps);
  await p.evaluate((t) => { const st = window.__stage; if (st.bakeAhead) st.bakeAhead(t, t + 30); }, ts[s]).catch(() => {});
  for (let f = 0; f < n; f++) {
    await p.evaluate((t) => window.__renderAt(t), ts[s] + f / fps);
    await p.screenshot({ path: `${tmp}/s${s}_${String(f).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 94 });
  }
  await p.close();
  console.log(`moment ${s + 1}/${ts.length} at ${ts[s]}s: ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
await b.close();
// clips: the first moment split in two (B then A), so the loop seam falls inside continuous motion
const half = Math.round(dur * fps / 2), clip = (name, pattern, start = 0, frames = null) => {
  const a = ['-y', '-loglevel', 'error', '-framerate', String(fps), '-start_number', String(start), '-i', `${tmp}/${pattern}`];
  if (frames) a.push('-frames:v', String(frames));
  a.push('-c:v', 'libx264', '-crf', '12', '-pix_fmt', 'yuv420p', `${tmp}/${name}.mp4`); execFileSync('ffmpeg', a);
};
clip('B', 's0_%04d.jpg', half); clip('A', 's0_%04d.jpg', 0, half);
for (let s = 1; s < ts.length; s++) clip(`m${s}`, `s${s}_%04d.jpg`);
const parts = ['B', ...ts.slice(1).map((_, i) => `m${i + 1}`), 'A'], lens = [dur - half / fps, ...ts.slice(1).map(() => dur), half / fps];
const args = ['-y', '-loglevel', 'error']; parts.forEach((p) => args.push('-i', `${tmp}/${p}.mp4`));
let f = '', last = '[0:v]', acc = lens[0];
for (let i = 1; i < parts.length; i++) {
  const isSeam = i === parts.length - 1, xd = isSeam ? 0.0001 : XD;
  if (isSeam) { f += `${last}[${i}:v]concat=n=2:v=1:a=0[x${i}];`; acc += lens[i]; }
  else { f += `${last}[${i}:v]xfade=transition=fade:duration=${xd}:offset=${(acc - xd).toFixed(3)}[x${i}];`; acc += lens[i] - xd; }
  last = `[x${i}]`;
}
args.push('-filter_complex', f.slice(0, -1), '-map', last, '-c:v', 'libx264', '-preset', 'slow', '-crf', process.env.CRF || '25', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', out);
execFileSync('ffmpeg', args);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', `${tmp}/s0_${String(half).padStart(4, '0')}.jpg`, '-q:v', '4', out.replace(/\.mp4$/, '.jpg')]);   // the poster is the loop's first frame
console.log(out, `${acc.toFixed(1)}s`);
