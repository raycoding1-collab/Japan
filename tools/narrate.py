#!/usr/bin/env python3
"""Synthesize narration sentence by sentence (cached), and report the timeline.
usage: /home/user/tts/venv/bin/python tools/narrate.py film/film.json"""
import hashlib, json, os, re, sys
import numpy as np, soundfile as sf
from scipy import signal

SR = 44100
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TTS_DIR = os.environ.get('TTS_DIR', '/home/user/tts')
CACHE = os.path.join(ROOT, '.cache', 'voice')
GAP = 0.46  # breath between sentences
_k = None

def kokoro():
    global _k
    if _k is None:
        from kokoro_onnx import Kokoro
        _k = Kokoro(os.path.join(TTS_DIR, 'kokoro-v1.0.onnx'), os.path.join(TTS_DIR, 'voices-v1.0.bin'))
    return _k

# Numbers the way a narrator reads them, and Japanese names respelt so the English voice says them
# close to Japanese (checked against Kokoro's phonemizer, since the result cannot be heard here).
SAY = [
  (r'\b1543\b', 'fifteen forty-three'), (r'\b1600\b', 'sixteen hundred'), (r'\b1853\b', 'eighteen fifty-three'), (r'\b1905\b', 'nineteen oh five'),
  (r'\b1930s\b', 'nineteen thirties'), (r'\b1941\b', 'nineteen forty-one'), (r'\b1945\b', 'nineteen forty-five'), (r'\b1964\b', 'nineteen sixty-four'),
  (r'\b1968\b', 'nineteen sixty-eight'), (r'\b1980s\b', 'nineteen eighties'), (r'\b1990\b', 'nineteen ninety'), (r'\b1995\b', 'nineteen ninety-five'),
  (r'\b1889\b', 'eighteen eighty-nine'), (r'\b2013\b', 'twenty thirteen'), (r'\b2011\b', 'twenty eleven'), (r'\b578\b', 'five seventy-eight'), (r'\b705\b', 'seven oh five'),
  (r'\bJōmon\b', 'Joe-mon'), (r'\bHimiko\b', 'Hee-mee-ko'), (r'\bhaniwa\b', 'hah-nee-wah'), (r'\bWei\b', 'Way'), (r'\bShōtoku\b', 'Show-toe-koo'),
  (r'\bNihon\b', 'Nee-hon'), (r'\bHōryū-ji\b', 'Hor-yoo-jee'), (r'\bIse\b', 'Ee-seh'), (r'\bNara\b', 'Nah-rah'), (r'\bHeian-kyō\b', 'Hay-ahn kee-yoh'),
  (r'\bKyoto\b', 'Kee-oh-toe'), (r'\bMurasaki Shikibu\b', 'Moo-rah-sah-kee Shee-kee-boo'), (r'\bGenji\b', 'Gen-jee'), (r'\bsamurai\b', 'sah-moo-rye'),
  (r'\bshoguns?\b', lambda m: 'show-gun' + ('s' if m.group(0).endswith('s') else '')), (r'\bkamikaze\b', 'kah-mee-kah-zeh'), (r'\bAshikaga\b', 'Ah-shee-kah-gah'),
  (r'\bkintsugi\b', 'kin-tsoo-ghee'), (r'\bSen no Rikyū\b', 'Sen no Reek-yoo'), (r'\bHideyoshi\b', 'Hee-deh-yoh-shee'), (r'\bTokugawa Ieyasu\b', 'Toe-koo-gah-wah Ee-yeh-yah-soo'),
  (r'\bSekigahara\b', 'Seh-kee-gah-hah-rah'), (r'\bEdo\b', 'Eh-doe'), (r'\bBashō\b', 'Bah-show'), (r'\bHokusai\b', 'Hoe-koo-sigh'), (r'\bAinu\b', 'Eye-noo'),
  (r'\bHokkaido\b', 'Hoe-kye-doe'), (r'\bRyukyu\b', 'Ree-yoo-kew'), (r'\bFukushima\b', 'Foo-koo-shee-mah'), (r'\bOsamu Tezuka\b', 'Oh-sah-moo Teh-zoo-kah'),
  (r'\bGhibli\b', 'Jib-lee'), (r'\bHayao Miyazaki\b', 'Hah-yah-oh Mee-yah-zah-kee'), (r'\bShinkansen\b', 'Shin-kahn-sen'), (r'\bSadako\b', 'Sah-dah-ko'),
  (r'\bkana\b', 'kah-nah'), (r'\bkaizen\b', 'kye-zen'),
]
def speakable(text):
    for a, b in SAY: text = re.sub(a, b, text)
    return text

def say(text, v):
    """One sentence -> trimmed mono float array at SR (cached)."""
    key = hashlib.sha1(json.dumps([text, v], sort_keys=True).encode()).hexdigest()[:16]
    path = os.path.join(CACHE, key + '.wav')
    if os.path.exists(path):
        y, _ = sf.read(path); return y
    k = kokoro()
    style = sum(k.get_voice_style(name) * w for name, w in v['blend'].items())
    spoken = speakable(text)
    y, sr = k.create(spoken, voice=style, speed=v['speed'], lang=v['lang'])
    y = signal.resample_poly(y, SR, sr).astype(np.float64)
    # a semitone deeper: played a little slower, the voice sounds larger and calmer
    if v.get('pitch') == -1: y = signal.resample_poly(y, 1000, 944)
    idx = np.where(np.abs(y) > 0.012)[0]
    y = y[max(0, idx[0] - 300): idx[-1] + 2600]
    y = y / (np.abs(y).max() + 1e-9) * 0.7
    os.makedirs(CACHE, exist_ok=True); sf.write(path, y, SR)
    return y

def sentences(text):
    return [p.strip() for p in re.split(r'(?<=[.?!])\s+', text) if p.strip()]

def timeline(spec):
    """Returns list of lines: {t, end, parts:[(t0, dur, text, audio)]}."""
    out = []
    for line in spec['narration']:
        t = line['t']; parts = []
        for s in sentences(line['text']):
            y = say(s, spec['voice']); d = len(y) / SR
            parts.append((t, d, s, y)); t += d + GAP
        out.append({'t': line['t'], 'end': t - GAP, 'parts': parts, 'text': line['text']})
    return out

def caption_lines(tl):
    """Captions: one sentence at a time; long ones split at a comma near the middle."""
    cues = []
    for L in tl:
        lines = []
        for (t, d, s, _) in L['parts']:
            chunks = [s]
            if len(s) > 64:
                cs = [m.end() for m in re.finditer(r'[,:;]\s', s)]
                if cs:
                    c = min(cs, key=lambda c: abs(c - len(s) / 2)); chunks = [s[:c].strip(), s[c:].strip()]
            tt = t
            for i, ch in enumerate(chunks):
                dd = d * len(ch) / sum(len(c) for c in chunks)
                lines.append({'t0': round(tt, 2), 't1': round(tt + dd + (0.6 if i == len(chunks) - 1 else 0), 2), 'text': ch}); tt += dd
        cues.append({'t': L['t'], 'end': round(L['end'], 2), 'lines': lines})
    return cues

def write_timeline(spec, tl, path):
    cues = caption_lines(tl)
    with open(path, 'w') as f:
        f.write('// Generated by tools/narrate.py from film/film.json -- do not edit by hand.\n')
        f.write('export const DURATION = %s;\n' % spec['duration'])
        f.write('export const EV = ' + json.dumps(spec['events']) + ';\n')
        f.write('export const CHAPTERS = ' + json.dumps(spec['chapters']) + ';\n')
        f.write('export const CUES = ' + json.dumps(cues) + ';\n')


if __name__ == '__main__':
    spec = json.load(open(sys.argv[1]))
    tl = timeline(spec); prev = None; total = 0
    for L in tl:
        flag = ''
        if prev and prev['end'] > L['t'] - 0.6: flag = f'  !! OVERLAP {prev["end"] - L["t"] + 0.6:+.2f}s'
        gap = f'(gap {L["t"] - prev["end"]:4.1f})' if prev else ''
        print(f"{L['t']:6.1f} -> {L['end']:6.1f} {gap:11s} {L['text'][:70]}{flag}")
        if len(L['parts']) > 1: print('         sentences at', ', '.join(f'{p[0]:.1f}' for p in L['parts']))
        total += L['end'] - L['t']; prev = L
    print(f'speech {total:.0f}s of {spec["duration"]}s')
    write_timeline(spec, tl, os.path.join(ROOT, 'src', 'timeline.js'))

