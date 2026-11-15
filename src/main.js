import { Stage } from './engine.js';
import { film } from './film.js';
import { CUES, CHAPTERS, EV, DURATION } from './timeline.js';
import { Sound } from './sound.js';

const $ = (id) => document.getElementById(id);
const canvas = $('stage');
const params = new URLSearchParams(location.search);
const frozen = params.has('t') ? parseFloat(params.get('t')) : null;
const stage = new Stage(canvas, film);
const sound = new Sound('assets/audio/film.mp3', DURATION);
stage.onFlap = (pan, layer, loud) => sound.flap(pan, layer, loud);
let started = false;

// captions
const cap = $('caption'); let capOn = true, capText = '';
function captions(t) {
  let text = '';
  for (const c of CUES) { if (t < c.t - 0.1 || t > c.end + 1) continue; for (const l of c.lines) if (t >= l.t0 && t < l.t1) text = l.text; }
  if (text !== capText) { if (text) { cap.textContent = text; cap.classList.add('on'); } else cap.classList.remove('on'); capText = text; }
}
// the closing title
const endEl = $('end');
function ending(t) { endEl.classList.toggle('on', t > EV.title && t < DURATION - 1.2); }

let rz = 0;
addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { stage.lastT = -1; stage.resize(); if (frozen !== null) stage.render(frozen); }, 150); });

function frame(now) {
  // cut the rest of the world in the background: generously behind the title, sparingly once the film runs
  stage.bakeBudget = !started ? 14 : sound.paused ? 16 : 5;
  let t;
  if (frozen !== null) t = frozen;
  else if (!started) t = (film.titleT ?? 30) + Math.sin(now / 1000 * 0.05) * 0.4; // a quiet, living frame behind the title
  else t = sound.time(now);
  stage.render(t);
  if (started || frozen !== null) { captions(t); ending(t); markChapter(t); }
  if (started && sound.ended && !bar.classList.contains('show')) { setIcon(); bar.classList.add('show'); document.body.classList.remove('idle'); }
  if (frozen === null) requestAnimationFrame(frame);
  else window.__ready = true;
}
window.__stage = stage;
window.__renderAt = (t) => { stage.lastT = -1; stage.render(t); captions(t); ending(t); };
(document.fonts?.ready || Promise.resolve()).then(() => requestAnimationFrame(frame));

// controls: begin, pause, chapters, captions, volume -- and nothing else
const bar = $('bar'); let hideTimer = 0;
const menuOpen = () => !$('chapters').hidden;
let idleTimer = 0;
function idle() { document.body.classList.remove('idle'); clearTimeout(idleTimer); idleTimer = setTimeout(() => { if (started && !menuOpen() && !sound.paused) document.body.classList.add('idle'); }, 2600); }
function wake() { if (!started) return; idle(); bar.classList.add('show'); clearTimeout(hideTimer); hideTimer = setTimeout(() => { if (!menuOpen() && !sound.paused) bar.classList.remove('show'); }, 2800); }
addEventListener('pointermove', wake); addEventListener('pointerdown', wake); addEventListener('keydown', wake);
const setIcon = () => { $('playIcon').setAttribute('d', sound.paused ? 'M8 5v14l11-7z' : 'M7 5h3.5v14H7zM13.5 5H17v14h-3.5z'); $('play').setAttribute('aria-label', sound.paused ? 'Play' : 'Pause'); };
function toggle() { if (!started) return; sound.ended ? sound.seek(0) : sound.toggle(); stage.lastT = -1; setIcon(); }
$('begin').addEventListener('click', async () => {
  $('begin').disabled = true;
  const label = setTimeout(() => { $('begin').textContent = 'Loading…'; }, 250);
  // the sound first, while the tap is fresh; then fill the screen and keep it awake
  const starting = sound.start();
  try { const fs = document.documentElement.requestFullscreen?.({ navigationUI: 'hide' }); fs?.catch?.(() => {}); } catch (e) {}
  try { navigator.wakeLock?.request('screen').catch(() => {}); } catch (e) {}
  await starting; clearTimeout(label);
  if (sound.blocked) { $('begin').textContent = 'Begin'; $('begin').disabled = false; return; } // one more tap
  started = true; stage.lastT = -1;
  $('veil').classList.add('gone'); idle();
});
$('play').addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
canvas.addEventListener('click', () => { if (menuOpen()) return closeMenu(); if (matchMedia('(hover: hover)').matches) toggle(); else wake(); });
addEventListener('keydown', (e) => {
  if (e.code === 'Space') { e.preventDefault(); started ? toggle() : $('begin').click(); }
  if (e.code === 'Escape') closeMenu();
});
$('cc').addEventListener('click', (e) => { e.stopPropagation(); capOn = !capOn; $('cc').setAttribute('aria-pressed', capOn); cap.classList.toggle('off', !capOn); });
$('vol').addEventListener('input', (e) => sound.volume(+e.target.value));
if (!sound.volumeWorks) $('vol').classList.add('na');
// Leaving the page (back to a chat, another app, a locked screen) pauses the film; coming back shows
// the play button, so a paused film never looks like a frozen one.
let hidPaused = false;
document.addEventListener('visibilitychange', () => {
  if (document.hidden && started && !sound.paused) { sound.toggle(); setIcon(); hidPaused = true; }
  else if (!document.hidden && hidPaused) { hidPaused = false; setIcon(); bar.classList.add('show'); document.body.classList.remove('idle'); }
});

// chapters
const list = $('chapters');
CHAPTERS.forEach((c, i) => {
  const b = document.createElement('button'); b.type = 'button'; b.dataset.i = i;
  const m = Math.floor(c.t / 60), s = String(Math.floor(c.t % 60)).padStart(2, '0');
  b.innerHTML = `<span>${c.title}</span><em>${m}:${s}</em>`;
  b.addEventListener('click', (e) => { e.stopPropagation(); sound.seek(Math.max(0, c.t)); stage.lastT = -1; setIcon(); closeMenu(); });
  list.appendChild(b);
});
function closeMenu() { list.hidden = true; $('chap').setAttribute('aria-expanded', 'false'); wake(); }
$('chap').addEventListener('click', (e) => { e.stopPropagation(); list.hidden = !list.hidden; $('chap').setAttribute('aria-expanded', String(!list.hidden)); wake(); });
let curChap = -1;
function markChapter(t) {
  let i = 0; CHAPTERS.forEach((c, j) => { if (t >= c.t) i = j; });
  if (i !== curChap) { curChap = i; [...list.children].forEach((b, j) => b.classList.toggle('now', j === i)); }
}
