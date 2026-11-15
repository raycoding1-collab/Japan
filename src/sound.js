// The soundtrack is one mixed file (voice, score, ambience) and it is the clock:
// the picture follows the sound. Paper flaps are played live, because when a
// cut-out springs up depends on the shape of the screen.
export class Sound {
  constructor(src, duration) {
    this.duration = duration;
    // streamed, so the film can start as soon as the first seconds have arrived
    this.src = src; this.el = new Audio(); this.el.preload = 'auto'; this.el.src = src;
    // a host that will not stream the file gets a second chance: the whole file, played from memory
    this.el.addEventListener('error', () => { if (this.wholeTried) this.broken = true; });
    this.el.addEventListener('ended', () => { this.ended = true; this.paused = true; });
    this.paused = true; this.ended = false; this.vol = 1;
    // iPhones (and the in-app browsers on them) leave volume to the hardware buttons
    try { this.el.volume = 0.5; this.volumeWorks = Math.abs(this.el.volume - 0.5) < 0.01; this.el.volume = 1; } catch (e) { this.volumeWorks = false; }
    this.anchorT = 0; this.anchorNow = 0; this.lastFlap = 0;
  }
  // Must be called straight from the tap on Begin, before anything else that might use up the tap
  // (asking for full screen does, in Android's in-app browsers): sound is only allowed to start
  // from a fresh tap there, and on iPhones.
  async start() {
    // On iPhones (Safari and the in-app browsers of Instagram and others) the ring/silent switch
    // would mute the paper sounds but not the soundtrack; ask for one consistent film sound.
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
    this.blocked = false;
    const playing = this.el.play();
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC && !this.ac) {
      try {
        this.ac = new AC(); this.out = this.ac.createGain(); this.out.gain.value = 0.5 * this.vol; this.out.connect(this.ac.destination);
        this.flaps = [0, 1, 2, 3, 4, 5].map((k) => makeFlap(this.ac, k));
      } catch (e) { this.ac = null; }
    }
    if (this.ac && this.ac.state === 'suspended') this.ac.resume().catch(() => {});
    this.paused = false; this.anchorNow = performance.now();
    try { await playing; }
    catch (e) {
      // refused (no fresh tap): wait for another tap, rather than run the film without its sound
      if (e && e.name === 'NotAllowedError') { this.blocked = true; this.paused = true; }
      else if (!this.wholeTried) {
        // the file would not stream here: fetch it whole, then play it from memory
        try { await this.useWhole(); this.broken = false; await this.el.play(); }
        catch (e2) { if (e2 && e2.name === 'NotAllowedError') { this.blocked = true; this.paused = true; } else this.broken = true; }
      }
      else this.broken = true; // no playable audio at all: the film still runs, on its own clock
    }
  }
  wholeFile() { return (this.whole = this.whole || fetch(this.src, { cache: 'no-store' }).then((r) => (r.ok ? r.blob() : Promise.reject())).then((b) => URL.createObjectURL(b))); }
  async useWhole() {
    this.wholeTried = true; const url = await this.wholeFile();
    if (this.el.src !== url) await new Promise((ok) => { this.el.addEventListener('loadedmetadata', ok, { once: true }); this.el.src = url; this.el.load(); setTimeout(ok, 8000); });
  }
  // Film time in seconds. Follows the audio element, smoothed with the frame clock.
  time(now) {
    if (this.broken) {
      if (!this.paused) this.anchorT = Math.min(this.duration, this.anchorT + (now - this.anchorNow) / 1000);
      this.anchorNow = now; return this.anchorT;
    }
    if (this.hold !== undefined) { this.anchorT = this.hold; this.anchorNow = now; return this.hold; }
    const a = this.el.currentTime;
    if (this.paused || this.el.paused) { this.anchorT = a; this.anchorNow = now; return a; }
    let t = this.anchorT + (now - this.anchorNow) / 1000;
    if (Math.abs(t - a) > 0.12) t = a; else t += (a - t) * 0.04;
    this.anchorT = t; this.anchorNow = now;
    return t;
  }
  toggle() {
    this.paused = !this.paused; this.anchorNow = performance.now();
    if (this.broken) return;
    if (this.hold === undefined) this.paused ? this.el.pause() : this.el.play().catch(() => {});
    if (this.ac) this.paused ? this.ac.suspend() : this.ac.resume();
  }
  seek(t) {
    this.ended = false; this.paused = false; this.anchorT = t; this.anchorNow = performance.now();
    if (this.ac) this.ac.resume();
    if (this.broken) return;
    const el = this.el, sk = el.seekable;
    let can = false; for (let i = 0; i < sk.length; i++) if (t >= sk.start(i) - 0.5 && t <= sk.end(i) + 0.5) can = true;
    if (can) { this.hold = undefined; el.currentTime = t; el.play().catch(() => {}); return; }
    // Some hosts cannot serve part of a file, so a streamed soundtrack cannot jump ahead.
    // Fetch it whole, once, and play from memory: the picture waits on the chapter's first frame.
    this.hold = t; el.pause();
    this.wholeFile().then((url) => {
      if (this.hold !== t) return;
      const go = () => { if (this.hold !== t) return; el.currentTime = t; this.hold = undefined; this.anchorT = t; this.anchorNow = performance.now(); if (!this.paused) el.play().catch(() => {}); };
      if (el.src === url) return go();
      el.addEventListener('loadedmetadata', go, { once: true }); el.src = url; el.load();
    }).catch(() => { if (this.hold === t) { this.hold = undefined; el.currentTime = t; el.play().catch(() => {}); } });
  }
  volume(v) { this.vol = v; this.el.volume = v; if (this.out) this.out.gain.value = 0.5 * v; }
  flap(pan, layer, loud = 1) {
    if (!this.ac || this.paused) return;
    const now = this.ac.currentTime;
    if (now - this.lastFlap < 0.05) return; // a crowd of cut-outs should rustle, not rattle
    this.lastFlap = now;
    const ac = this.ac, s = ac.createBufferSource(), g = ac.createGain();
    s.buffer = this.flaps[(Math.random() * this.flaps.length) | 0];
    const far = layer === 'far' ? 0.2 : layer === 'mid' ? 0.4 : layer === 'front' ? 0.6 : 1;
    s.playbackRate.value = (0.85 + Math.random() * 0.4) * (layer === 'far' ? 1.3 : 1) / Math.sqrt(Math.max(0.5, loud));
    g.gain.value = Math.min(1.1, 0.5 * far * loud * (0.75 + Math.random() * 0.4));
    let node = g;
    if (ac.createStereoPanner) { const p = ac.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan * 0.8)); g.connect(p); node = p; }
    s.connect(g); node.connect(this.out); s.start();
  }
}

// A soft card flap: a papery brush of noise, a tick as the fold snaps, a small thump of air.
function makeFlap(ac, k) {
  const sr = ac.sampleRate, n = Math.floor(sr * 0.24), buf = ac.createBuffer(1, n, sr), d = buf.getChannelData(0);
  let seed = 1234 + k * 977; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
  let lp = 0, lp2 = 0, hp = 0;
  const snap = 0.04 + k * 0.01;
  for (let i = 0; i < n; i++) {
    const t = i / sr, w = rnd();
    lp += (w - lp) * 0.42; lp2 += (lp - lp2) * 0.12; hp = lp - lp2;
    const brush = Math.min(1, t / 0.012) * Math.exp(-t / 0.05) * 0.55;
    const tick = t > snap ? Math.exp(-(t - snap) / 0.012) * 0.9 : 0;
    const thump = Math.sin(6.283 * (150 - t * 420) * t) * Math.exp(-t / 0.035) * 0.35;
    d[i] = hp * (brush + tick) + thump;
  }
  return buf;
}
