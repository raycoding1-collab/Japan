#!/usr/bin/env python3
"""Build the whole soundtrack: narration, an original score that grows with
history, ambience for every era, and timed effects. One mixed file; the picture
follows it.

usage: /home/user/tts/venv/bin/python tools/build_audio.py film/film.json
writes assets/audio/film.mp3 and src/timeline.js
"""
import json, os, re, subprocess, sys
import numpy as np
import soundfile as sf
from scipy import signal

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import narrate

SR = 44100
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rs = np.random.RandomState(7)
TAU = 2 * np.pi

# ------------------------------------------------------------------ helpers --
def env_ar(n, a, r):
    e = np.ones(n); na, nr = min(n, int(a * SR)), min(n, int(r * SR))
    if na: e[:na] = np.sin(np.linspace(0, np.pi / 2, na)) ** 2
    if nr: e[-nr:] *= np.cos(np.linspace(0, np.pi / 2, nr)) ** 2
    return e

def place(buf, x, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= buf.shape[0] or i + len(x) <= 0: return
    if i < 0: x = x[-i:]; i = 0
    x = x[: buf.shape[0] - i]
    th = (np.clip(pan, -1, 1) + 1) * np.pi / 4
    buf[i:i + len(x), 0] += x * gain * np.cos(th) * 1.414
    buf[i:i + len(x), 1] += x * gain * np.sin(th) * 1.414

def sos(kind, f, order=2): return signal.butter(order, f, kind, fs=SR, output='sos')
def bp(x, lo, hi, order=2): return signal.sosfilt(sos('bandpass', [lo, min(hi, SR / 2 - 100)], order), x)
def lp(x, f, order=2): return signal.sosfilt(sos('lowpass', f, order), x)
def hp(x, f, order=2): return signal.sosfilt(sos('highpass', f, order), x)

def slow_noise(n, rate, seed):
    r = np.random.RandomState(seed); k = max(4, int(n / SR * rate) + 4)
    return np.interp(np.linspace(0, k - 1, n), np.arange(k), r.rand(k))

def curve(n, pts):
    t = np.arange(n) / SR; ts, vs = zip(*pts)
    return np.interp(t, ts, vs)

def reverb(x, rt=2.4, wet=0.3, bright=3200, seed=3, pre=0.012):
    r = np.random.RandomState(seed); n = int(rt * 1.3 * SR)
    out = np.zeros_like(x)
    for ch in range(2):
        ir = r.randn(n) * np.exp(-6.9 * np.arange(n) / (rt * SR))
        ir[: int(pre * SR)] *= np.linspace(0, 1, int(pre * SR))
        ir = lp(ir, bright); ir /= np.sqrt((ir ** 2).sum())
        out[:, ch] = signal.fftconvolve(x[:, ch], ir)[: x.shape[0]]
    return x + out * wet

NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
def hz(name):
    m = re.match(r'([A-G]#?|Bb|Eb)(\d)', name); n = m.group(1)
    n = {'Bb': 'A#', 'Eb': 'D#'}.get(n, n)
    return 440 * 2 ** ((NAMES.index(n) - 9) / 12 + int(m.group(2)) - 4)

def tvec(dur): n = int(dur * SR); return n, np.arange(n) / SR

def vibrato(t, rate=5.0, depth=0.004, delay=0.3, seed=0):
    r = np.random.RandomState(seed)
    return 1 + depth * np.clip((t - delay) / 0.4, 0, 1) * np.sin(TAU * rate * t + r.rand() * 6) + 0.0015 * (slow_noise(len(t), 2, seed) - 0.5)

# -------------------------------------------------------------- instruments --
def flute(f, dur, vel=1.0):
    n, t = tvec(dur + 0.35)
    ph = TAU * np.cumsum(f * vibrato(t, 4.9, 0.0045, 0.25, rs.randint(1e6)) * (1 - 0.018 * np.exp(-t / 0.05))) / SR
    y = np.sin(ph) + 0.30 * np.sin(2 * ph + 0.4) + 0.09 * np.sin(3 * ph) + 0.035 * np.sin(4 * ph)
    breath = bp(rs.randn(n), f * 1.6, min(f * 6, 9000)) * 0.22
    e = env_ar(n, 0.085, 0.3) * (0.82 + 0.18 * np.exp(-t / 0.4))
    chiff = np.exp(-t / 0.03) * bp(rs.randn(n), 900, 3500) * 0.25
    return (y * 0.5 + breath * (0.6 + 0.4 * np.exp(-t / 0.2)) + chiff) * e * vel

def hum(f, dur, vel=1.0, vowel='m'):
    n, t = tvec(dur + 0.5)
    ph = TAU * np.cumsum(f * vibrato(t, 4.6, 0.006, 0.3, rs.randint(1e6))) / SR
    y = np.zeros(n)
    F = [(260, 190, 1), (1050, 220, 0.10), (2300, 300, 0.03)] if vowel == 'm' else [(600, 120, 1), (1040, 150, 0.45), (2400, 250, 0.12)] if vowel == 'o' else [(730, 110, 1), (1090, 140, 0.6), (2440, 200, 0.18)]
    for k in range(1, 22):
        fk = f * k
        if fk > 5000: break
        a = sum(g / (1 + ((fk - c) / b) ** 2) for c, b, g in F)
        y += np.sin(k * ph + k * 0.7) * a / k ** 0.6
    y += bp(rs.randn(n), 400, 3000) * (0.01 if vowel == 'm' else 0.02)
    return y * env_ar(n, 0.22 if vowel == 'm' else 0.35, 0.45) * vel * 0.5

def choir(f, dur, vel=1.0, vowel='a'):
    return sum(hum(f * (1 + d), dur, vel * 0.3, vowel) for d in (-0.0065, -0.0025, 0.0, 0.003, 0.0068))

def drum(vel=1.0, f0=78.0, damp=1.0):
    n, t = tvec(1.1)
    drop = 1 + 0.08 * np.exp(-t / 0.03); y = np.zeros(n)
    for ratio, amp, dec in [(1, 1, 0.42), (1.59, 0.5, 0.2), (2.14, 0.28, 0.14), (2.30, 0.2, 0.12), (2.65, 0.14, 0.09), (2.92, 0.1, 0.08), (3.6, 0.06, 0.05)]:
        y += amp * np.sin(TAU * np.cumsum(f0 * ratio * drop) / SR + rs.rand()) * np.exp(-t / (dec * damp))
    slap = lp(rs.randn(n), 1400) * np.exp(-t / 0.016) * 0.7 + bp(rs.randn(n), 1500, 4500) * np.exp(-t / 0.006) * 0.15
    return (y * 0.6 + slap * vel) * vel * np.minimum(1, t / 0.002)

def timpani(f0=73.4, vel=1.0):
    n, t = tvec(2.6); y = np.zeros(n)
    for ratio, amp, dec in [(1, 1, 1.1), (1.5, 0.6, 0.7), (1.98, 0.35, 0.5), (2.44, 0.2, 0.35)]:
        y += amp * np.sin(TAU * f0 * ratio * t * (1 + 0.02 * np.exp(-t / 0.05)) + rs.rand()) * np.exp(-t / dec)
    return (y * 0.6 + lp(rs.randn(n), 600) * np.exp(-t / 0.03) * 0.4) * vel

def shaker(vel=1.0):
    n, t = tvec(0.12)
    return bp(rs.randn(n), 4000, 10000) * np.exp(-t / 0.03) * np.minimum(1, t / 0.01) * vel * 0.6

def darbuka(kind='tek', vel=1.0):
    n, t = tvec(0.6)
    if kind == 'doum': return (np.sin(TAU * 105 * t * (1 + 0.15 * np.exp(-t / 0.02))) * np.exp(-t / 0.18) + lp(rs.randn(n), 500) * np.exp(-t / 0.01) * 0.3) * vel
    return (bp(rs.randn(n), 1200, 4500) * np.exp(-t / 0.01) * 0.5 + np.sin(TAU * 620 * t) * np.exp(-t / 0.05) * 0.3) * vel

def logdrum(f=220, vel=1.0):
    n, t = tvec(0.8)
    return (np.sin(TAU * f * t) * np.exp(-t / 0.22) + 0.4 * np.sin(TAU * f * 2.42 * t) * np.exp(-t / 0.06) + bp(rs.randn(n), 800, 3000) * np.exp(-t / 0.005) * 0.3) * vel

def additive(f, dur, amps, decays, inharm=0.0, rel=0.08, attack=0.002, pitchdrop=0.0):
    n, t = tvec(dur)
    y = np.zeros(n)
    fm = 1 + pitchdrop * np.exp(-t / 0.03)
    for k, (a, d) in enumerate(zip(amps, decays), 1):
        fk = f * k * np.sqrt(1 + inharm * k * k)
        if fk > 12000: break
        y += a * np.sin(TAU * np.cumsum(fk * fm) / SR + rs.rand() * 6) * np.exp(-t / d)
    return y * env_ar(n, attack, rel)

def pluck(f, dur=1.6, vel=1.0, bright=1.0):
    amps = [vel / k ** 1.2 * np.exp(-(k - 1) * 0.25 / bright) for k in range(1, 14)]
    decs = [1.5 * (300 / f) ** 0.3 / (1 + 0.45 * (k - 1)) for k in range(1, 14)]
    n, t = tvec(dur)
    return additive(f, dur, amps, decs, 0.00008) * 0.6 + bp(rs.randn(n), 2000, 7000) * np.exp(-t / 0.004) * 0.05 * vel

def harpsi(f, dur=1.0, vel=1.0):
    amps = [vel * (0.6 if k == 1 else 1.0) / k ** 0.7 for k in range(1, 20)]
    decs = [0.9 / (1 + 0.15 * (k - 1)) for k in range(1, 20)]
    return additive(f, dur, amps, decs, 0.00003, rel=0.05) * 0.32

def oud(f, dur=1.2, vel=1.0):
    amps = [vel * a for a in [1, 0.8, 0.6, 0.5, 0.3, 0.25, 0.15, 0.1, 0.06]]
    decs = [0.9 / (1 + 0.35 * k) for k in range(9)]
    return additive(f, dur, amps, decs, 0.0001, pitchdrop=0.012) * 0.45

def kalimba(f, dur=1.6, vel=1.0):
    n, t = tvec(dur)
    y = np.sin(TAU * f * t) * np.exp(-t / 1.0) + 0.35 * np.sin(TAU * f * 5.9 * t) * np.exp(-t / 0.08) + 0.15 * np.sin(TAU * f * 3.0 * t) * np.exp(-t / 0.3)
    return y * vel * 0.5 * np.minimum(1, t / 0.002)

def piano(f, dur=3.0, vel=1.0):
    n, t = tvec(dur + 0.3)
    y = np.zeros(n)
    for k in range(1, 16):
        fk = f * k * np.sqrt(1 + 0.0004 * k * k)
        if fk > 10000: break
        a = vel / k ** 1.1 * np.exp(-(k - 1) * (0.35 - 0.15 * vel))
        T = 2.8 * (220 / f) ** 0.45 / (1 + 0.25 * (k - 1))
        for det in (-0.0003, 0.0003):
            y += 0.5 * a * np.sin(TAU * fk * (1 + det) * t + rs.rand()) * (0.65 * np.exp(-t / (T * 0.25)) + 0.35 * np.exp(-t / (T * 1.6)))
    y += lp(rs.randn(n), 2500) * np.exp(-t / 0.008) * 0.06 * vel
    return y * env_ar(n, 0.002, 0.3) * 0.5

def celesta(f, dur=1.6, vel=1.0):
    n, t = tvec(dur)
    idx = 1.6 * np.exp(-t / 0.15)
    y = np.sin(TAU * f * t + idx * np.sin(TAU * f * 4 * t)) * np.exp(-t / 0.9) + 0.2 * np.sin(TAU * f * 2 * t) * np.exp(-t / 0.3)
    return y * vel * 0.4 * np.minimum(1, t / 0.002)

def bell(f, dur=6.0, vel=1.0):
    n, t = tvec(dur); y = np.zeros(n)
    for r_, a, d in [(0.5, 0.6, 4), (1, 1, 3), (1.19, 0.5, 2.2), (1.56, 0.4, 1.6), (2, 0.4, 1.4), (2.51, 0.25, 1.0), (3.01, 0.2, 0.7), (4.1, 0.12, 0.4)]:
        y += a * np.sin(TAU * f * r_ * t + rs.rand()) * np.exp(-t / d)
    return y * vel * 0.25

def bowed(f, dur, vel=1.0, bright=2400, attack=0.35, voices=3, vib=0.004):
    """Strings: a small section of bowed voices. Each player is a little out of tune with
    the next, and every partial drifts in level, the way real bowing never holds still."""
    n, t = tvec(dur + 0.6); y = np.zeros(n)
    for v in range(voices):
        det = 1 + (v - (voices - 1) / 2) * 0.004 + (rs.rand() - 0.5) * 0.002
        ph = TAU * np.cumsum(f * det * vibrato(t, 4.8 + v * 0.45 + rs.rand() * 0.3, vib * (0.8 + 0.4 * rs.rand()), 0.2 + 0.2 * rs.rand(), rs.randint(1e6))) / SR
        for k in range(1, 30):
            fk = f * k
            if fk > 7000: break
            a = (1 / k) / (1 + (fk / bright) ** 2) * (1 + 0.6 / (1 + ((fk - 480) / 200) ** 2) + 0.35 / (1 + ((fk - 2900) / 500) ** 2))
            shimmer = 1 + 0.35 * (slow_noise(n, 2.5 + k * 0.15, rs.randint(1e6)) - 0.5)
            y += a * shimmer * np.sin(k * ph + rs.rand() * 6)
    y += bp(rs.randn(n), 1500, 6000) * 0.012 * voices
    return y * env_ar(n, attack, 0.6) * vel * 0.28 / voices

def reed(f, dur, vel=1.0):
    """A duduk-like reed: dark, breathy, with a slow swell."""
    n, t = tvec(dur + 0.4)
    ph = TAU * np.cumsum(f * vibrato(t, 5.0, 0.005, 0.3, rs.randint(1e6)) * (1 - 0.01 * np.exp(-t / 0.06))) / SR
    y = np.zeros(n)
    for k in range(1, 18):
        fk = f * k
        if fk > 6000: break
        a = (1 / k ** 0.8) * (1.0 / (1 + ((fk - 600) / 300) ** 2) + 0.4 / (1 + ((fk - 1300) / 400) ** 2) + 0.05)
        y += a * np.sin(k * ph)
    y += bp(rs.randn(n), f * 2, f * 8) * 0.04
    swell = env_ar(n, 0.18, 0.35) * (0.8 + 0.2 * np.sin(np.pi * np.clip(t / dur, 0, 1)))
    return y * swell * vel * 0.35

def tri(f, dur=0.35, vel=1.0):
    n, t = tvec(dur)
    y = sum(((-1) ** k) / (2 * k + 1) ** 2 * np.sin(TAU * f * (2 * k + 1) * t) for k in range(6))
    return y * np.exp(-t / (dur * 0.35)) * np.minimum(1, t / 0.004) * vel * 0.6

def drone(n, freqs, seed=1):
    t = np.arange(n) / SR; out = np.zeros((n, 2)); r = np.random.RandomState(seed)
    for f, a in freqs:
        for ch in range(2):
            for det in (-0.35, 0.3):
                swell = 0.55 + 0.45 * slow_noise(n, 0.18, r.randint(1e6))
                ph = TAU * (f + det * (1 + ch * 0.3)) * t + r.rand() * 6
                out[:, ch] += a * swell * (np.sin(ph) + 0.22 * np.sin(2 * ph) + 0.08 * np.sin(3 * ph)) * 0.5
    return out


# ------------------------------------------------------- Chinese instruments --
# Everything here is kept below about 3 kHz: no piercing, chirping or whistling tones.
def smoothstep(x): x = np.clip(x, 0, 1); return x * x * (3 - 2 * x)

def gz(f, dur=2.6, vel=1.0, bend=0.0, vib=0.0):
    """Guzheng: a bright pluck on a long string; the left hand can press it up, or shake it."""
    n, t = tvec(dur)
    fm = 2 ** (bend / 12 * smoothstep((t - 0.28) / 0.22)) * (1 + vib * np.clip((t - 0.35) / 0.3, 0, 1) * np.sin(TAU * 5.6 * t))
    y = np.zeros(n); ph = TAU * np.cumsum(f * fm) / SR
    for k in range(1, 18):
        if f * k > 4000: break
        a = vel / k ** 1.05 * (1 + 0.5 * np.exp(-((k - 3) / 1.6) ** 2)) * (abs(np.sin(np.pi * k * 0.13)) + 0.15)
        d = 2.4 * (220 / f) ** 0.35 / (1 + 0.55 * (k - 1))
        y += a * np.sin(k * ph * np.sqrt(1 + 0.00015 * k * k) + rs.rand() * 6) * np.exp(-t / d)
    y += lp(rs.randn(n), 2400) * np.exp(-t / 0.005) * 0.06 * vel
    return y * env_ar(n, 0.0015, 0.12) * 0.3

def pipa(f, dur=0.7, vel=1.0):
    n, t = tvec(dur); y = np.zeros(n); ph = TAU * f * t * (1 + 0.01 * np.exp(-t / 0.02))
    for k in range(1, 14):
        if f * k > 3800: break
        a = vel / k ** 0.9 * (1 + 0.6 * np.exp(-((k - 4) / 2) ** 2)); d = 0.9 * (220 / f) ** 0.3 / (1 + 0.7 * (k - 1))
        y += a * np.sin(k * ph + rs.rand() * 6) * np.exp(-t / d)
    y += lp(rs.randn(n), 2400) * np.exp(-t / 0.004) * 0.08 * vel
    return y * env_ar(n, 0.001, 0.06) * 0.26

def pipa_trem(f, dur, vel=1.0, rate=14.0):
    n, _ = tvec(dur + 0.6); y = np.zeros(n); k = 0
    while k / rate < dur:
        x = pipa(f, 0.5, vel * (0.75 + 0.25 * rs.rand()) * (0.8 if k % 2 else 1)); i = int(k / rate * SR); m = min(len(x), n - i); y[i:i + m] += x[:m]; k += 1
    return y * env_ar(n, 0.05, 0.3) * 0.7

def qin(f, dur=4.5, vel=1.0, slide=0.0):
    """Guqin: low, woody, long; the finger slides along the string after the pluck."""
    n, t = tvec(dur)
    fm = 2 ** (slide / 12 * smoothstep((t - 0.45) / 0.7)); ph = TAU * np.cumsum(f * fm) / SR; y = np.zeros(n)
    for k in range(1, 14):
        if f * k > 2800: break
        a = vel / k ** 1.25 * (0.25 + abs(np.sin(np.pi * k / 7.3))); d = 4.0 * (110 / f) ** 0.3 / (1 + 0.35 * (k - 1))
        y += a * np.sin(k * ph + rs.rand() * 6) * np.exp(-t / d)
    if slide: y += lp(rs.randn(n), 900) * 0.01 * vel * ((np.abs(np.gradient(fm)) * SR) > 0.02) * np.exp(-t / 2)
    y += lp(rs.randn(n), 1200) * np.exp(-t / 0.01) * 0.05 * vel
    return y * env_ar(n, 0.003, 0.4) * 0.42

def gong(f=90.0, dur=7.0, vel=1.0, bloom=0.5):
    n, t = tvec(dur); y = np.zeros(n); r = np.random.RandomState(rs.randint(1e6))
    for j in range(36):
        fr = f * (1 + j * 0.37 + r.rand() * 0.5)
        if fr > 2400: continue
        a = 1 / (1 + j * 0.25); dec = 1.5 + 4.5 * r.rand() / (1 + j * 0.08)
        sw = 1 - np.exp(-t / (bloom * (0.3 + r.rand())))
        y += a * np.sin(TAU * fr * t * (1 - 0.004 * np.exp(-t / 0.4)) + r.rand() * 6) * np.exp(-t / dec) * (0.4 + 0.6 * sw)
    y += lp(rs.randn(n), 700) * np.exp(-t / 0.05) * 0.6
    return lp(y, 2200) * vel * 0.12 * env_ar(n, 0.003, 1.0)

def bz(f, dur=5.0, vel=1.0):
    """Bianzhong: a bronze bell of the Zhou courts (two tones, a minor third apart)."""
    n, t = tvec(dur); y = np.zeros(n)
    for r_, a, d in [(1, 1, 2.6), (1.19, 0.55, 2.0), (2.0, 0.35, 1.3), (2.42, 0.3, 0.9), (2.97, 0.18, 0.6), (3.6, 0.12, 0.45), (4.3, 0.08, 0.3)]:
        if f * r_ > 2800: continue
        y += a * np.sin(TAU * f * r_ * t + rs.rand() * 6) * np.exp(-t / d)
    y += lp(rs.randn(n), 1600) * np.exp(-t / 0.006) * 0.25
    return y * vel * 0.26 * np.minimum(1, t / 0.002)

def tanggu(vel=1.0, f0=64.0): return lp(drum(vel, f0, 1.4), 2000)
def paigu(vel=1.0, f0=150.0): return lp(drum(vel, f0, 0.7), 2000) * 0.7
def muyu(vel=1.0, f=520.0):
    n, t = tvec(0.25)
    return lp(np.sin(TAU * f * t) * np.exp(-t / 0.045) + 0.3 * np.sin(TAU * f * 2.6 * t) * np.exp(-t / 0.012) + lp(rs.randn(n), 1500) * np.exp(-t / 0.004) * 0.3, 2200) * vel * 0.5

def sheng(f, dur, vel=1.0):
    """Sheng: the mouth organ, playing its open fourths and fifths."""
    return (reed(f, dur, vel) + reed(f * 1.5, dur, vel * 0.55) + reed(f * 2, dur, vel * 0.35)) * 0.55

def pad(f, dur, vel=1.0, bright=1300, attack=1.2):
    n, t = tvec(dur + 1.0); y = np.zeros(n)
    for det in (-0.006, -0.002, 0.003, 0.007):
        ph = TAU * f * (1 + det) * t + rs.rand() * 6
        for k in range(1, 24):
            fk = f * k
            if fk > 3200: break
            y += np.sin(k * ph) / k / (1 + (fk / bright) ** 2)
    return y * env_ar(n, attack, 1.0) * vel * 0.09

def pulse(f, dur=0.32, vel=1.0):
    n, t = tvec(dur); y = np.zeros(n)
    for k in range(1, 10):
        if f * k > 2400: break
        y += np.sin(TAU * f * k * t) / k ** 1.4 * np.exp(-t * (6 + k * 3))
    return y * np.minimum(1, t / 0.003) * vel * 0.3

def line(notes, beat=1.0, oct=0, kind='erhu', vel=1.0, glide=0.05):
    """A legato line on one breath or one bow: each note slides into the next (erhu, dizi, xiao, bone flute)."""
    total = sum(b for _, b in notes) * beat; n = int((total + 0.8) * SR); t = np.arange(n) / SR
    f = np.zeros(n); on = np.zeros(n); starts = np.zeros(n, dtype=bool); tt = 0.0; first = None
    for name, b in notes:
        i0, i1 = int(tt * SR), int((tt + b * beat) * SR)
        if name != 'r':
            fv = hz(name) * 2 ** oct; f[i0:] = fv; on[i0:max(i0 + 1, i1 - int(0.025 * SR))] = 1; starts[i0] = True
            if first is None: first = fv
        tt += b * beat
    f[f == 0] = first
    a = 1 - np.exp(-1 / (glide * SR)); lf = np.log(f)
    lf = signal.lfilter([a], [1, a - 1], lf, zi=signal.lfilter_zi([a], [1, a - 1]) * lf[0])[0]
    att = {'erhu': 0.07, 'dizi': 0.035, 'xiao': 0.09, 'bone': 0.06}[kind]
    b2 = 1 - np.exp(-1 / (att * SR)); env = signal.lfilter([b2], [1, b2 - 1], on)
    idx = np.arange(n); last = np.maximum.accumulate(np.where(starts, idx, 0)); since = (idx - last) / SR
    depth = {'erhu': 0.009, 'dizi': 0.005, 'xiao': 0.004, 'bone': 0.003}[kind] * np.clip((since - 0.2) / 0.35, 0, 1)
    fs = np.exp(lf) * (1 + depth * np.sin(TAU * (5.6 if kind == 'erhu' else 4.8) * t))
    if kind == 'bone': fs *= 1 + 0.006 * (slow_noise(n, 1.5, rs.randint(1e6)) - 0.5)
    ph = TAU * np.cumsum(fs) / SR; y = np.zeros(n)
    if kind == 'erhu':
        for k in range(1, 20):
            x = fs * k
            if x.mean() > 3600: break
            form = (0.35 + 1 / (1 + ((x - 950) / 350) ** 2) + 0.5 / (1 + ((x - 1900) / 450) ** 2)) / (1 + (x / 2600) ** 4)
            y += form / k ** 0.75 * np.sin(k * ph + k * 0.4)
        y = y * 0.28 + bp(rs.randn(n), 900, 2600) * 0.02
    elif kind == 'dizi':
        for k, a_ in enumerate([1, 0.5, 0.32, 0.16, 0.1, 0.06, 0.04], 1):
            if f.mean() * k > 3000: break
            buzz = 1 + (0.5 * (slow_noise(n, 30, rs.randint(1e6)) - 0.5) if k >= 3 else 0)
            y += a_ * buzz * np.sin(k * ph + k)
        y = y * 0.5 + bp(rs.randn(n), max(300, first * 1.2), 2800) * 0.07
    else:
        amps = [1, 0.18, 0.08, 0.03] if kind == 'xiao' else [1, 0.3, 0.12, 0.05]
        for k, a_ in enumerate(amps, 1): y += a_ * np.sin(k * ph + k)
        y = y * 0.55 + bp(rs.randn(n), 250 if kind == 'xiao' else 500, 1600 if kind == 'xiao' else 2400) * (0.12 if kind == 'xiao' else 0.16)
    return lp(y * env, 3200) * vel

# -------------------------------------------------------------------- score --
# One theme for the whole film, in the pentatonic gong mode on D (D E F# A B). It is first
# heard on the bone flute, nine thousand years ago, and returns with each age's instruments.
BONE = [('A4', 1.5), ('B4', 0.5), ('D5', 1), ('B4', 1), ('A4', 1), ('F#4', 1), ('E4', 2), ('E4', 0.5), ('F#4', 0.5), ('A4', 1), ('B4', 1), ('A4', 3)]
THEME_A = [('A4', 1.5), ('B4', 0.5), ('D5', 1), ('E5', 1), ('D5', 1), ('B4', 1), ('A4', 2)]
THEME_B = [('B4', 1), ('A4', 0.5), ('F#4', 0.5), ('E4', 1), ('F#4', 1), ('A4', 1.5), ('B4', 0.5), ('A4', 2)]
THEME_C = [('D5', 1), ('E5', 0.5), ('F#5', 0.5), ('E5', 1), ('D5', 1), ('B4', 1.5), ('A4', 0.5), ('D5', 2)]
SAD = [('B3', 1), ('D4', 0.5), ('E4', 0.5), ('F#4', 1.5), ('E4', 0.5), ('D4', 1), ('B3', 2), ('A3', 1), ('B3', 3)]
PROG = [['D3', 'A3', 'E4', 'F#4'], ['B2', 'F#3', 'A3', 'D4'], ['G2', 'D3', 'A3', 'B3'], ['A2', 'E3', 'A3', 'D4']]
PROG_SAD = [['B2', 'F#3', 'B3', 'D4'], ['E2', 'B2', 'D3', 'F#3'], ['G2', 'D3', 'B3', 'D4'], ['F#2', 'C#3', 'F#3', 'A3']]
PENT = ['D', 'E', 'F#', 'A', 'B']
def pent(lo, hi):
    out = []
    for o in range(1, 7):
        for p in PENT:
            nm = f'{p}{o}'
            if hz(lo) <= hz(nm) <= hz(hi): out.append(nm)
    return out

RING = {gz: 2.4, qin: 4.0, pipa: 0.8, bz: 3.5, piano: 2.6, oud: 1.0}

class Score:
    def __init__(self, dur):
        self.n = int(dur * SR); self.dry = np.zeros((self.n, 2)); self.wet = np.zeros((self.n, 2))
    def add(self, x, t, g=1.0, pan=0.0, wet=True):
        place(self.wet if wet else self.dry, x, t, g, pan)
    def phrase(self, notes, t0, inst, beat=1.0, oct=0, g=1.0, pan=0.0, legato=0.96, human=0.012, **kw):
        t = t0
        for name, beats in notes:
            if name != 'r': self.add(inst(hz(name) * 2 ** oct, max(beats * beat * legato, RING.get(inst, 0)), **kw), t + rs.randn() * human, g, pan)
            t += beats * beat
        return t
    def line(self, notes, t0, kind, beat=0.75, oct=0, g=1.0, pan=0.0, **kw):
        self.add(line(notes, beat, oct, kind, **kw), t0, g, pan); return t0 + sum(b for _, b in notes) * beat
    def chords(self, t0, bars, inst, prog=PROG, beat=0.75, g=1.0, oct=0, pan=0.0, **kw):
        for b in range(bars):
            for i, name in enumerate(prog[b % len(prog)]):
                self.add(inst(hz(name) * 2 ** oct, 4 * beat * 1.04, **kw), t0 + b * 4 * beat + rs.randn() * 0.01, g, pan + (i - 1.5) * 0.25)
    def arp(self, t0, bars, inst, prog=PROG, beat=0.75, sub=2, pattern=(0, 1, 2, 3, 2, 1, 2, 3), g=1.0, oct=1, pan=0.0, vel=0.8, **kw):
        step = beat / sub
        for b in range(bars):
            ch = prog[b % len(prog)]
            for s in range(int(4 * sub)):
                name = ch[pattern[s % len(pattern)] % len(ch)]
                self.add(inst(hz(name) * 2 ** oct, vel=vel * (1 if s % sub == 0 else 0.75), **kw), t0 + b * 4 * beat + s * step + rs.randn() * 0.006, g, pan + 0.3 * np.sin(s))
    def beats(self, t0, t1, step, inst, g=1.0, pan=0.0, accent=4, swing=0.0, **kw):
        k = 0; t = t0
        while t < t1:
            self.add(inst(vel=(1.0 if k % accent == 0 else 0.62) * (0.9 + 0.1 * rs.rand()), **kw), t + (swing * step if k % 2 else 0) + rs.randn() * 0.006, g, pan)
            k += 1; t = t0 + k * step
    def gliss(self, t0, notes, step, inst, g=1.0, pan=0.0, **kw):
        for i, nm in enumerate(notes): self.add(inst(hz(nm), **kw), t0 + i * step, g, pan + (i / max(1, len(notes) - 1) - 0.5) * 0.6)

def build_score(EV, dur):
    S = Score(dur); B = 0.75
    # ---------------------------------------------------------- the bone flute
    S.add(qin(hz('D2'), 7.0, 0.7), 2.0, 0.5, -0.1)
    S.line(BONE, EV['flute'] + 0.25, 'bone', beat=0.6, g=0.55, pan=0.15)        # nine thousand years old, and it still plays
    S.add(qin(hz('A2'), 6.0, 0.6, slide=-2), EV['fluteStop'] + 0.6, 0.4, -0.2)
    S.arp(25.0, 6, gz, sub=2, pattern=(0, 2, 1, 3, 2, 3, 1, 2), g=0.20, oct=1, vel=0.55)  # the first fields
    S.line(THEME_A, 42.9, 'xiao', beat=0.6, g=0.42, pan=-0.1)
    # --------------------------------------------------------- bronze and bone
    for i in range(3): S.add(tanggu(0.9 - i * 0.15), EV['king'] + i * 0.75, 0.55, 0)
    S.add(gong(70, 7, 0.9), EV['king'], 0.6, 0.1)
    for i, nm in enumerate(['D3', 'A3', 'E4']): S.add(bz(hz(nm), 5, 0.9), EV['vessels'] + i * 0.35, 0.5, -0.3 + i * 0.3)
    S.phrase([('A3', 1), ('B3', 1), ('D4', 1), ('B3', 1), ('A3', 2)], 56.0, bz, beat=0.6, g=0.42)
    S.add(drone(int(9 * SR), [(hz('D2'), 0.5), (hz('A2'), 0.25)], 5)[:, 0] * env_ar(int(9 * SR), 2, 3), EV['oracle'], 0.5)
    for i, ts in enumerate(EV['signs']): S.add(bz(hz(['D4', 'E4', 'F#4', 'A4', 'B4'][i]), 3.5, 0.6), ts + 0.1, 0.36, -0.4 + i * 0.2)
    S.phrase(THEME_A, 82.3, gz, beat=0.7, g=0.36, pan=0.1, vel=0.75)
    for nm in ['D3', 'G#3', 'A3']: S.add(choir(hz(nm), 7.0, 0.8, 'o'), EV['eyes'] - 1.0, 0.11, 0)  # the bronze faces of Sanxingdui
    S.add(gong(55, 8, 0.7, bloom=1.4), EV['eyes'] - 0.6, 0.5)
    # ------------------------------------------------------ a hundred schools
    S.chords(EV['mandate'] - 0.4, 2, choir, g=0.10, vowel='a')
    S.add(bz(hz('D3'), 6, 1.0), EV['mandate'], 0.5)
    S.beats(EV['war'], EV['war'] + 7.2, B / 2, tanggu, g=0.42, accent=4, f0=60)                   # five hundred years of war: no melody
    for nm in ['D2', 'A2']: S.add(bowed(hz(nm), 8.0, 1.0, bright=900, attack=1.5), EV['war'], 0.24)
    S.phrase([('D3', 2), ('A3', 1), ('B3', 1), ('A3', 2), ('F#3', 1), ('E3', 1), ('D3', 4)], EV['kongzi'] + 0.2, qin, beat=0.62, g=0.5, pan=-0.1)
    S.gliss(EV['dao'] - 0.1, pent('D4', 'D6'), 0.06, gz, g=0.22, dur=2.0, vel=0.6)                # be like water
    S.line(THEME_B, EV['dao'] + 1.8, 'xiao', beat=0.65, g=0.32, pan=0.15)
    S.add(tanggu(1.0, 58), EV['sunzi'], 0.5); S.add(qin(hz('D2'), 6.0, 0.9, slide=0), EV['sunzi'] + 0.05, 0.45)
    S.line(THEME_C, 136.9, 'xiao', beat=0.55, oct=-1, g=0.34)
    # ------------------------------------------------------ the First Emperor
    for i, tc in enumerate(EV['conquer']): S.add(tanggu(0.75 + i * 0.05, 62), tc, 0.5, -0.4 + i * 0.16)
    S.add(gong(60, 8, 1.0), EV['qin'], 0.7); S.add(timpani(55.0, 1.0), EV['qin'], 0.45)
    for nm in ['D3', 'A3', 'D4']: S.add(sheng(hz(nm), 5.5, 0.9), EV['emperor'] - 0.2, 0.13); S.add(choir(hz(nm), 5.5, 0.9, 'o'), EV['emperor'], 0.09)
    for i, ts in enumerate(EV['std']): S.add(muyu(1.0, 420), ts, 0.5, 0.2); S.add(bz(hz(['D4', 'E4', 'F#4', 'A4'][i]), 3.0, 0.7), ts + 0.02, 0.33)
    S.beats(EV['wall'], EV['wall'] + 6, B, lambda vel: bowed(hz('D2'), 0.55, vel, bright=800, attack=0.05), g=0.30, accent=2)
    S.beats(EV['army'], EV['army'] + 9.0, B * 2, tanggu, g=0.34, accent=2, f0=66)
    S.add(pipa_trem(hz('A3'), 4.0, 0.8), EV['army'] + 0.5, 0.25, 0.3); S.add(pipa_trem(hz('D4'), 4.0, 0.8), EV['army'] + 4.5, 0.25, 0.3)
    S.add(choir(hz('A3'), 5.0, 0.8, 'o'), EV['faces'], 0.08); S.add(choir(hz('D3'), 5.0, 0.8, 'o'), EV['faces'], 0.08)
    S.add(gz(hz('A4'), 3, 0.8, bend=2), EV['found'] + 0.3, 0.3)
    S.add(gong(48, 6, 0.8), EV['qinEnd'] + 0.1, 0.5)
    S.gliss(EV['qinEnd'] + 0.4, ['D5', 'B4', 'A4', 'F#4', 'E4', 'D4', 'B3'], 0.14, pipa, g=0.3, vel=0.7)
    # ---------------------------------------------------------- the Silk Road (the whole ensemble, for the first time)
    S.chords(EV['han'] - 0.2, 4, bowed, g=0.17, bright=2200, attack=0.9)
    S.chords(EV['han'] - 0.2, 4, sheng, g=0.07)
    S.arp(EV['han'], 4, gz, g=0.15, oct=1, vel=0.6)
    S.line(THEME_A + THEME_C, EV['han'] + 0.6, 'dizi', beat=B, g=0.30, pan=-0.1)
    S.beats(EV['road'] - 0.5, EV['road'] + 12, B / 2, paigu, g=0.25, accent=4, pan=0.2)
    S.beats(EV['road'] - 0.5 + B / 4, EV['road'] + 12, B, muyu, g=0.16, accent=2, pan=-0.3)
    S.arp(EV['road'] - 0.5, 4, pipa, g=0.17, sub=2, pattern=(0, 2, 1, 2, 3, 2, 1, 2), oct=0, vel=0.7, pan=0.25)
    S.line(THEME_B, EV['road'] + 0.2, 'erhu', beat=B, g=0.30, pan=-0.2)
    S.phrase([('D4', 0.5), ('E4', 0.5), ('F#4', 0.5), ('A4', 1), ('F#4', 0.5), ('E4', 1)], EV['east'], oud, beat=0.4, g=0.26, pan=0.4)  # a lute from the west
    S.add(bz(hz('D3'), 6, 0.9), EV['dharma'], 0.4); S.add(hum(hz('A2'), 5, 0.8, 'm'), EV['dharma'] + 0.2, 0.25)
    S.line(THEME_C, 213.6, 'erhu', beat=0.65, g=0.32, pan=-0.2)
    S.arp(EV['paper'], 3, gz, g=0.12, oct=1, vel=0.5, sub=1)
    for nm in ['D2', 'A2']: S.add(bowed(hz(nm), 9.0, 0.9, bright=900, attack=2.0), EV['seismo'], 0.18)
    S.add(bz(hz('A3'), 4, 1.0), EV['quake'] + 0.5, 0.45, 0.2)                                     # the ball, into the toad
    S.phrase(THEME_B, 235.6, gz, beat=0.6, g=0.32, vel=0.7)
    # ---------------------------------------------------------- long divided
    S.line(SAD, EV['novel'] + 0.1, 'erhu', beat=0.8, g=0.36, pan=-0.1)
    S.add(bz(hz('D3'), 7, 1.0), EV['buddha'], 0.45); S.add(gong(80, 7, 0.5, bloom=1.2), EV['buddha'] + 0.1, 0.25)
    for nm in ['D3', 'A3']: S.add(hum(hz(nm), 8.5, 0.8, 'm'), EV['buddha'] + 0.4, 0.22, 0)
    S.beats(EV['buddha'] + 1.0, EV['buddha'] + 8.5, 1.0, muyu, g=0.18, accent=4, f=480)
    # ------------------------------------------------------------------ the Tang
    S.arp(EV['canal'] - 0.4, 3, gz, sub=4, pattern=(0, 1, 2, 3, 4, 3, 2, 1), g=0.12, oct=1, vel=0.55)
    S.phrase([('D3', 2), ('E3', 1), ('A3', 3), ('B3', 2)], EV['exam'] + 0.4, qin, beat=0.7, g=0.4)
    S.beats(EV['changan'] - 0.4, EV['changan'] + 9.4, B / 2, paigu, g=0.24, accent=4)
    S.beats(EV['changan'] - 0.4, EV['changan'] + 9.4, B * 2, tanggu, g=0.30, accent=2)
    S.arp(EV['changan'] - 0.4, 3, pipa, g=0.16, sub=4, pattern=(0, 2, 1, 2, 3, 2, 1, 2), oct=0, vel=0.65)
    S.chords(EV['changan'] - 0.4, 3, sheng, g=0.07)
    S.line(THEME_A + THEME_C, EV['changan'], 'dizi', beat=B * 0.9, g=0.28)
    S.phrase([('A3', 0.5), ('B3', 0.5), ('D4', 1), ('E4', 0.5), ('D4', 0.5), ('A3', 1)], EV['persia'], oud, beat=0.4, g=0.24, pan=0.4)
    S.add(gong(65, 7, 0.8), EV['wu'], 0.5)
    for i, nm in enumerate(['D3', 'A3', 'D4', 'F#4']): S.add(bz(hz(nm), 5, 0.8), EV['wu'] + 0.1 + i * 0.12, 0.33, -0.3 + i * 0.2)
    S.chords(EV['wu'], 2, bowed, g=0.15, bright=2000, attack=1.0)
    # Li Bai's moon: the xiao and the qin, very sparse under the poem
    S.line(THEME_A, 300.9, 'xiao', beat=0.55, g=0.30)
    for i, nm in enumerate(['D3', 'A3', 'B3', 'A3', 'D3']): S.add(qin(hz(nm), 5.0, 0.6), 303.0 + i * 2.4, 0.3, -0.2 + i * 0.1)
    S.add(qin(hz('A2'), 6.0, 0.8, slide=-2), EV['home'] + 0.3, 0.42)
    S.line(THEME_B, 312.9, 'xiao', beat=0.6, g=0.32)
    # ------------------------------------------------------------------ the Song
    S.beats(EV['song'], EV['song'] + 5.5, B / 2, muyu, g=0.16, accent=2, pan=0.3)
    S.arp(EV['song'], 2, pipa, g=0.15, sub=4, oct=0, vel=0.6)
    S.line(THEME_C, EV['song'] + 0.5, 'dizi', beat=0.5, g=0.26)
    for nm in ['D2', 'G#2']: S.add(bowed(hz(nm), 5.0, 0.8, bright=1000, attack=1.2), 323.7, 0.16)
    S.add(gong(50, 7, 1.0), EV['bang'] + 0.02, 0.6); S.add(timpani(49.0, 1.0), EV['bang'], 0.5)
    for i, tf in enumerate(EV.get('fw', [332.4, 333.3, 334.1, 334.9, 335.9, 336.8, 337.6])):
        S.add(gz(hz(['D5', 'E5', 'F#5', 'A5', 'B5', 'A5', 'D5'][i]), 2.0, 0.6), tf + 0.02, 0.2, -0.5 + i * 0.16)
    S.beats(EV['fireworks'] - 0.4, EV['fireworks'] + 5.5, B / 2, paigu, g=0.22, accent=4)
    S.add(bz(hz('A4'), 3.5, 0.6), EV['compass'] + 0.2, 0.3)
    S.gliss(EV['pages'], pent('A4', 'A5'), 0.08, gz, g=0.18, dur=1.6, vel=0.5)
    S.line(THEME_A, 352.5, 'dizi', beat=0.5, g=0.26)
    # --------------------------------------------------------- Mongols and Ming
    for nm, a_ in [('A1', 0.9), ('A2', 0.5)]: S.add(hum(hz(nm), 9.5, a_, 'o'), EV['mongols'] - 0.2, 0.30)   # a drone, sung from the throat
    S.beats(EV['mongols'], EV['mongols'] + 8.0, B / 3, tanggu, g=0.28, accent=3, f0=70)
    S.line(THEME_B, EV['mongols'] + 0.4, 'erhu', beat=0.75, oct=-1, g=0.30)
    S.add(gong(60, 8, 1.0), EV['ming'], 0.6); S.add(timpani(73.4, 0.9), EV['ming'], 0.4)
    S.chords(EV['ming'], 3, bowed, g=0.18, bright=2400, attack=0.7); S.chords(EV['ming'], 3, sheng, g=0.07); S.chords(EV['ming'], 3, choir, g=0.07, vowel='a')
    S.line(THEME_A, EV['ming'] + 0.3, 'dizi', beat=B, g=0.28)
    for i, nm in enumerate(['D3', 'A3', 'D4', 'E4', 'F#4']): S.add(bz(hz(nm), 5, 0.8), EV['forbidden'] + i * 0.15, 0.30)
    S.chords(EV['zhenghe'], 3, bowed, g=0.16, bright=2000, attack=1.4)
    S.line(THEME_C, EV['zhenghe'] + 0.8, 'erhu', beat=B, g=0.28, pan=-0.2)
    S.beats(EV['africa'], EV['africa'] + 4.5, B / 2, lambda vel: logdrum(220, vel), g=0.22, accent=3, pan=0.3)
    for i, nm in enumerate(['A4', 'B4', 'D5', 'E5', 'D5', 'B4', 'D5']): S.add(gz(hz(nm), 1.8, 0.6, vib=0.006 if i == 6 else 0), EV['qilin'] + i * 0.28, 0.24, 0.3)
    S.line(THEME_B, 401.4, 'dizi', beat=0.5, g=0.26)
    # ------------------------------------------------------------ the last dynasty
    S.add(tanggu(1.0), EV['manchu'], 0.45); S.add(gong(70, 6, 0.7), EV['qing'], 0.4)
    S.chords(EV['qing'], 2, sheng, g=0.08); S.arp(EV['qing'], 2, gz, g=0.13, vel=0.5)
    for i in range(16): S.add(gz(hz(pent('D4', 'D6')[i % 11]), 1.6, 0.4 + i * 0.02), EV['popgrow'] + i * 0.36 * (1 - i * 0.02), 0.18, -0.4 + (i % 5) * 0.2)   # more and more people
    S.arp(EV['trade'], 2, pipa, sub=2, g=0.12, oct=0, vel=0.5)
    for nm in ['B1', 'F#2']: S.add(bowed(hz(nm), 20.0, 0.9, bright=800, attack=2.5), EV['opium'], 0.20)     # opium, war, rebellion: no melody
    S.line([('B3', 3), ('A3', 1), ('F#3', 4)], EV['opium'] + 0.4, 'erhu', beat=0.8, g=0.22)
    S.add(timpani(49.0, 0.8), EV['opiumWar'], 0.4)
    for k in range(4): S.add(tanggu(0.55, 52), EV['taiping'] + k * 1.6, 0.30)
    S.phrase([('D5', 1), ('E5', 1), ('D5', 1), ('B4', 1), ('A4', 3)], EV['abdicate'] + 0.6, gz, beat=0.45, g=0.22, vel=0.5)   # a six-year-old's tune
    S.line([('F#4', 2), ('E4', 1), ('D4', 4)], 454.8, 'erhu', beat=0.6, g=0.24)
    # ------------------------------------------------------ war and revolution
    for nm in ['B1', 'F#2', 'B2']: S.add(bowed(hz(nm), 16.0, 0.9, bright=700, attack=3.0), EV['republic'], 0.18)
    for k in range(6): S.add(timpani(49.0, 0.5), EV['japan'] + k * 1.4, 0.28)
    S.add(bz(hz('D3'), 7, 0.8), 471.5, 0.38)                                                      # mourning: one bell
    S.add(gong(55, 8, 0.9, bloom=1.0), EV['prc'], 0.5)
    S.chords(EV['prc'], 1, bowed, g=0.16, bright=2000, attack=1.2); S.chords(EV['prc'], 1, choir, g=0.08, vowel='a')
    # -------------------------------------------------------------- Mao's China
    S.phrase([('D4', 1), ('E4', 1), ('F#4', 1), ('A4', 2), ('F#4', 1), ('A4', 1), ('B4', 2)], EV['schools'] + 0.2, gz, beat=0.5, g=0.22, vel=0.6)
    S.beats(EV['leap'], EV['leap'] + 3.8, B / 2, lambda vel: bowed(hz('D2'), 0.3, vel, bright=900, attack=0.03), g=0.25)
    for nm in ['B1', 'F#2']: S.add(bowed(hz(nm), 15.0, 0.8, bright=700, attack=2.0), EV['famine'] - 0.2, 0.16)    # famine, Cultural Revolution: no melody
    S.beats(EV['cultural'], EV['cultural'] + 6.5, 0.78, lambda vel: drum(vel * 0.6, 58, 1.0), g=0.25, accent=2)
    S.phrase([('A2', 2), ('D3', 2), ('E3', 1), ('A3', 3)], EV['tu'] + 0.4, qin, beat=0.7, g=0.4)              # Tu Youyou, and the old book
    S.add(gz(hz('A4'), 2.5, 0.6, vib=0.006), EV['herb'], 0.2)
    S.add(gz(hz('D5'), 3.0, 0.7, bend=0), EV['cure'], 0.22)
    S.chords(EV['saved'] - 0.3, 2, bowed, g=0.14, bright=2000, attack=1.4); S.chords(EV['saved'] - 0.3, 2, choir, g=0.06, vowel='a')
    S.line(THEME_A, 521.9, 'dizi', beat=0.55, g=0.28)
    # -------------------------------------------------------------- opening up: the theme turns modern
    S.chords(EV['open'] - 0.4, 6, bowed, g=0.13, bright=2200, attack=1.2)
    S.arp(EV['open'] - 0.4, 6, pulse, sub=4, pattern=(0, 2, 1, 3, 2, 3, 1, 2), g=0.20, oct=1, vel=0.7)
    S.phrase(THEME_A + THEME_B, EV['open'] + 0.2, piano, beat=B, g=0.30, pan=0.1, vel=0.65)
    S.beats(EV['shenzhen'], 551.0, B, lambda vel: drum(vel, 56, 0.8), g=0.30, accent=2)
    S.beats(EV['shenzhen'] + B / 2, 551.0, B, muyu, g=0.12, accent=2, pan=0.3)
    S.chords(EV['poverty'] - 0.2, 3, choir, g=0.07, vowel='a'); S.chords(EV['poverty'] - 0.2, 3, pad, g=0.5)
    S.line(THEME_C, EV['poverty'] + 0.2, 'dizi', beat=B, g=0.26)
    S.add(bowed(hz('B1'), 9.0, 0.7, bright=600, attack=2.0), 552.4, 0.18)                          # Tiananmen: silence, a low string
    for i, nm in enumerate(['D4', 'F#4', 'A4', 'B4', 'D5', 'E5', 'F#5', 'A5']): S.add(piano(hz(nm), 3.0, 0.5), EV['spark'] + i * (EV['allLit'] - EV['spark']) / 8, 0.22, -0.6 + i * 0.17)
    S.chords(EV['allLit'], 2, bowed, g=0.16, bright=2400, attack=0.8); S.chords(EV['allLit'], 2, choir, g=0.07, vowel='a')
    S.gliss(EV['allLit'], pent('D4', 'D6'), 0.05, gz, g=0.18, dur=2.0, vel=0.6)
    S.phrase(THEME_C, 569.6, piano, beat=0.6, g=0.30, vel=0.6)
    # ------------------------------------------------------------------- today
    S.chords(EV['today'], 2, pad, g=0.6)
    S.arp(EV['hsr'] - 0.3, 4, pulse, sub=4, g=0.22, oct=1, vel=0.75)
    S.chords(EV['hsr'] - 0.3, 4, bowed, g=0.13, bright=2400, attack=0.6)
    S.beats(EV['hsr'] - 0.3, 591.5, B, lambda vel: drum(vel, 52, 0.7), g=0.32, accent=2)
    S.add(timpani(55.0, 0.4), 591.8, 0.3)
    for k in range(16): S.add(timpani(55.0, 0.3 + k * 0.04), 591.9 + k * 0.155, 0.22)                 # a roll, into the launch
    S.add(gong(55, 8, 1.0), EV['launch'], 0.55); S.add(timpani(55.0, 1.0), EV['launch'], 0.5)
    for nm in ['D3', 'A3', 'D4', 'F#4', 'A4']: S.add(choir(hz(nm), 6, 1.0, 'a'), EV['launch'] + 0.1, 0.07); S.add(bowed(hz(nm), 6, 1.0, bright=2400, attack=0.8), EV['launch'], 0.13)
    S.chords(EV['farside'], 2, pad, g=0.45, bright=900)
    for i, nm in enumerate(['A4', 'D5', 'E5', 'A4', 'B4']): S.add(bz(hz(nm), 4, 0.5), EV['farside'] + 0.6 + i * 1.3, 0.22, -0.4 + i * 0.2)
    S.line(THEME_A, 605.5, 'dizi', beat=0.5, g=0.26)
    # ------------------------------------------------------------ breakthroughs
    S.arp(609.2, 2, pulse, sub=2, g=0.18, oct=1, vel=0.6)
    S.add(timpani(55.0, 1.0), EV['gorges'], 0.5); S.add(gong(55, 7, 0.8), EV['gorges'], 0.45)
    for nm in ['D2', 'A2', 'D3', 'A3', 'D4', 'F#4']: S.add(bowed(hz(nm), 7.0, 1.0, bright=1800, attack=0.6), EV['gorges'], 0.13); S.add(choir(hz(nm), 7.0, 0.9, 'o'), EV['gorges'] + 0.2, 0.05)
    S.arp(EV['hzmb'], 3, gz, sub=4, pattern=(0, 1, 2, 3, 4, 3, 2, 1), g=0.12, oct=1, vel=0.5)
    S.chords(EV['hzmb'], 3, pad, g=0.45)
    S.line(THEME_C, 625.6, 'erhu', beat=B, g=0.24)
    for nm in ['B1', 'F#2', 'B2', 'D3']: S.add(bowed(hz(nm), 9.0, 0.9, bright=1200, attack=1.5), EV['huajiang'], 0.13)
    # the artificial sun: a cold pulse, a swell as the plasma lights, a clock that keeps going
    S.chords(EV['tokamak'], 4, pad, prog=[['D2', 'A2', 'D3', 'E3']], g=0.55, bright=800)
    S.arp(EV['tokamak'] + 0.4, 6, pulse, prog=[['D3', 'A3', 'D4', 'E4']], sub=4, pattern=(0, 2, 1, 3), g=0.18, oct=1, vel=0.6)
    for nm in ['D3', 'A3', 'D4', 'E4', 'A4']: S.add(choir(hz(nm), 6, 1.0, 'a'), EV['plasma'], 0.07); S.add(pad(hz(nm), 6, 1.0, bright=1600, attack=1.5), EV['plasma'] - 0.4, 0.5)
    S.beats(EV['seventeen'], EV['seventeen'] + 6, B, muyu, g=0.14, accent=2, f=600)
    S.add(bz(hz('D4'), 5, 0.7), 658.2, 0.3)
    # quantum: notes that seem to be in two places at once
    S.chords(EV['quantum'], 3, pad, prog=[['B2', 'F#3', 'A3', 'D4']], g=0.45, bright=1000)
    r2 = np.random.RandomState(5)
    for i in range(14): S.add(bz(hz(pent('A3', 'A5')[r2.randint(10)]), 3, 0.4), EV['quantum'] + 0.3 + i * 0.68, 0.17, r2.rand() * 1.6 - 0.8)
    S.add(gong(70, 6, 0.8), EV['beat'], 0.4); S.chords(EV['beat'], 1, bowed, g=0.15, bright=2200, attack=0.3)
    # the New Year gala: drums, gong, pipa, and the theme, fast
    S.add(gong(80, 4, 0.8), 671.8, 0.4)
    S.beats(671.8, 683.0, B / 2, paigu, g=0.26, accent=4)
    S.beats(671.8, 683.0, B, tanggu, g=0.32, accent=2)
    S.arp(671.8, 4, pipa, g=0.15, sub=4, pattern=(0, 2, 1, 2, 3, 2, 1, 2), oct=0, vel=0.65)
    S.chords(671.8, 4, sheng, g=0.06)
    S.line(THEME_A + THEME_C, 672.0, 'dizi', beat=0.5, g=0.30)
    # the dark factory: only the machines' pulse
    S.arp(EV['factory'] + 0.5, 6, pulse, prog=[['D3', 'A3', 'D4', 'A3'], ['D3', 'A3', 'E4', 'A3']], sub=4, pattern=(0, 1, 2, 3), g=0.17, oct=0, vel=0.6)
    S.chords(EV['factory'] + 0.5, 4, pad, prog=[['D2', 'A2', 'D3', 'A3']], g=0.45, bright=700)
    for nm in ['B1', 'F#2']: S.add(bowed(hz(nm), 4.0, 0.7, bright=600, attack=1.2), EV['coal'], 0.15)
    S.chords(EV['solar'], 2, pad, g=0.5, bright=1600); S.arp(EV['solar'], 2, gz, g=0.12, vel=0.5)
    for i, nm in enumerate(['D5', 'B4', 'D5', 'E5']): S.add(bz(hz(nm), 2.4, 0.4), EV['pandafarm'] + 0.4 + i * 0.3, 0.16, 0.3)
    S.arp(EV['trees'] - 0.2, 3, gz, g=0.13, vel=0.55, sub=2)
    S.line(THEME_B, EV['trees'], 'dizi', beat=B, g=0.24, pan=-0.1)
    # ------------------------------------------------------------ the long thread
    S.line(BONE, 713.3, 'bone', beat=0.62, g=0.50, pan=0.15)                                       # the bone flute, once more
    S.chords(EV['pull'] + 0.2, 4, bowed, g=0.18, bright=2400, attack=1.4)
    S.chords(EV['pull'] + 0.2, 4, sheng, g=0.06); S.chords(EV['pull'] + 0.2, 4, choir, g=0.07, vowel='a')
    S.arp(EV['pull'] + 0.2, 4, gz, g=0.14, sub=2, vel=0.55)
    S.beats(EV['pull'] + 0.2, EV['pull'] + 12.0, B * 2, tanggu, g=0.22, accent=2)
    S.line(THEME_A + THEME_C, 722.2, 'dizi', beat=B * 0.8, g=0.28)
    S.line(THEME_B, 732.4, 'erhu', beat=0.7, g=0.30, pan=-0.15)
    S.add(gong(60, 9, 0.9), EV['title'], 0.5); S.add(timpani(73.4, 0.8), EV['title'], 0.4)
    for i, nm in enumerate(['D2', 'A2', 'D3', 'A3', 'E4', 'F#4', 'A4']):
        S.add(bowed(hz(nm), 10.0, 1.0, bright=2200, attack=2.0), EV['title'] + 0.2, 0.15, -0.4 + i * 0.13)
        S.add(choir(hz(nm), 9.0, 1.0, 'a'), EV['title'] + 0.5, 0.06, 0.4 - i * 0.13)
        S.add(bz(hz(nm) * 2, 6, 0.5), EV['title'] + 0.3 + i * 0.12, 0.18)
    S.gliss(EV['title'] + 4.0, pent('D4', 'D6'), 0.07, gz, g=0.16, dur=3.0, vel=0.5)
    S.line([('E4', 0.5), ('F#4', 0.5), ('A4', 4)], 742.6, 'bone', beat=0.62, g=0.4, pan=0.15)        # the last two notes of the first tune
    # a drone under everything: the earth note, D, quieter where the history is hard
    n = S.n
    d = drone(n, [(hz('D2'), 0.5), (hz('A2'), 0.3), (hz('D3'), 0.14)])
    S.dry += d * curve(n, [(0, 0), (3, 0.10), (11, 0.12), (21, 0.14), (46, 0.18), (60, 0.2), (97, 0.12), (107, 0.2), (115, 0.12), (139, 0.14), (145, 0.22), (183, 0.18), (188, 0.12), (239, 0.1), (258, 0.12), (296, 0.16), (316, 0.1), (355, 0.12), (404, 0.12), (428, 0.08), (448, 0.12), (457, 0.07), (474, 0.08), (482, 0.14), (490, 0.06), (509, 0.12), (524, 0.12), (552, 0.05), (562, 0.14), (575, 0.12), (596, 0.2), (607, 0.14), (643, 0.2), (661, 0.12), (683, 0.18), (697, 0.12), (715, 0.16), (735, 0.2), (dur - 1, 0)])[:, None]
    wet = reverb(S.wet, rt=2.8, wet=0.42, bright=2400)
    # the moon over Li Bai's bed, and the far side of the Moon, sound a little further away
    far = curve(n, [(0, 0), (296, 0), (298, 1), (316, 1), (318, 0), (595, 0), (597, 1), (606, 1), (608, 0), (dur, 0)])
    wet += reverb(S.wet * far[:, None], rt=4.5, wet=0.5, bright=1800, seed=11) * 0.5
    return lp(wet + S.dry, 5000)

# ----------------------------------------------------------------- ambience --
def ambience(dur, EV):
    n = int(dur * SR); t = np.arange(n) / SR; out = np.zeros((n, 2))
    W = lambda pts: curve(n, pts)
    def at(x, t0, g=1.0, pan=0.0): place(out, x, t0, g, pan)
    nm = lambda x: x / (np.abs(x).max() + 1e-9)
    # --- small sounds
    def thud(vel=1.0, f=70):
        m, tv = tvec(0.6); return nm(np.sin(TAU * f * tv * (1 + 0.3 * np.exp(-tv / 0.02))) * np.exp(-tv / 0.12) + lp(rs.randn(m), 400) * np.exp(-tv / 0.03) * 0.6) * vel
    def boom(vel=1.0):
        m, tv = tvec(3.0); return nm(lp(rs.randn(m), 180) * np.exp(-tv / 0.6) + np.sin(TAU * 38 * tv) * np.exp(-tv / 0.5) * 0.8 + lp(rs.randn(m), 1200) * np.exp(-tv / 0.05) * 0.5) * vel
    def crackle(vel=1.0):
        m, tv = tvec(0.3); return nm(lp(bp(rs.randn(m), 500, 2400) * np.exp(-tv / 0.012) + lp(rs.randn(m), 500) * np.exp(-tv / 0.03) * 0.5, 2400)) * vel
    def tok(vel=1.0, f=300):
        m, tv = tvec(0.12); return (lp(rs.randn(m), 700) * np.exp(-tv / 0.012) * 0.5 + np.sin(TAU * f * tv) * np.exp(-tv / 0.03) * 0.2) * vel
    def clink(f=900, vel=1.0):
        m, tv = tvec(0.8); return nm(lp(sum(a * np.sin(TAU * f * r_ * tv + rs.rand() * 6) * np.exp(-tv / d) for r_, a, d in [(1, 1, 0.25), (2.7, 0.4, 0.08), (5.1, 0.2, 0.04)]) + lp(rs.randn(m), 1500) * np.exp(-tv / 0.003) * 0.2, 2400)) * vel
    def flutter(dur=0.9):
        m, tv = tvec(dur); return lp(bp(rs.randn(m), 300, 1800) * np.sin(np.pi * tv / tv[-1]) ** 1.5 * (0.55 + 0.45 * np.sin(TAU * (9 + rs.rand() * 4) * tv) ** 2), 2200)
    def swish(dur=0.5, lo=400, hi=1800):
        m, tv = tvec(dur); return bp(rs.randn(m), lo, hi) * np.sin(np.pi * tv / tv[-1]) ** 2
    def whoosh(dur=2.0, lo=120, hi=900):
        m, tv = tvec(dur); env = np.exp(-((tv - dur * 0.55) / (dur * 0.22)) ** 2); return (lp(rs.randn(m), lo * 2) * 0.6 + bp(rs.randn(m), lo, hi) * 0.5) * env
    def hoof(vel=1.0):
        m, tv = tvec(0.15); return (lp(rs.randn(m), 900) * np.exp(-tv / 0.01) * 0.6 + np.sin(TAU * 120 * tv) * np.exp(-tv / 0.04) * 0.5) * vel
    def step(vel=1.0):
        m, tv = tvec(0.12); return lp(rs.randn(m), 800) * np.exp(-tv / 0.025) * vel
    def clank(vel=1.0, f=320):
        m, tv = tvec(0.9); return nm(lp(sum(a * np.sin(TAU * f * r_ * tv + rs.rand() * 6) * np.exp(-tv / d) for r_, a, d in [(1, 1, 0.3), (1.47, 0.6, 0.2), (2.09, 0.5, 0.12), (2.76, 0.3, 0.08), (3.9, 0.2, 0.05)]) + lp(rs.randn(m), 1200) * np.exp(-tv / 0.006) * 0.4, 2200)) * vel
    def servo(dur=0.6, f0=300, f1=480):
        m, tv = tvec(dur); f = np.linspace(f0, f1, m); ph = TAU * np.cumsum(f) / SR
        return lp(np.sin(ph) + 0.4 * np.sin(2 * ph) + 0.2 * np.sin(3 * ph) + bp(rs.randn(m), 400, 1400) * 0.3, 1600) * env_ar(m, 0.05, 0.1) * 0.5
    def gallop(t0, t1, g=1.0, pan=0.0, rate=0.42):
        k = t0
        while k < t1:
            for dt, v in [(0, 1), (0.07, 0.7), (0.15, 0.85)]: at(hoof(v), k + dt + rs.randn() * 0.005, g, pan)
            k += rate * (0.95 + 0.1 * rs.rand())
    def steps(t0, t1, every=0.5, g=1.0, pan=0.0):
        k = t0
        while k < t1: at(step(0.8 + 0.2 * rs.rand()), k, g, pan + rs.randn() * 0.1); k += every * (0.9 + 0.2 * rs.rand())
    # --- beds
    wind = W([(0, 0), (2, 0.9), (24, 0.7), (46, 0.6), (59, 0.3), (97, 0.6), (139, 0.5), (160, 0.9), (167, 0.4), (199, 1.0), (215, 0.6), (239, 0.8), (258, 0.4), (296, 0.6), (316, 0.3), (356, 0.9), (366, 0.5), (404, 0.5), (457, 0.6), (468, 0.9), (474, 0.4), (494, 1.1), (500, 0.6), (524, 0.4), (552, 0.9), (562, 0.4), (575, 0.3), (594, 0.4), (597, 0), (606, 0), (609, 0.5), (633, 1.3), (642, 0.4), (697, 0.5), (700, 0.9), (707, 0.7), (718, 1.0), (735, 0.6), (dur, 0)])
    for ch in range(2):
        w = bp(rs.randn(n), 160, 650) * (0.35 + 0.65 * slow_noise(n, 0.25, 40 + ch)) + bp(rs.randn(n), 800, 2000) * 0.08 * slow_noise(n, 0.4, 50 + ch)
        out[:, ch] += w * 0.05 * wind
    water = W([(0, 0), (1, 0.6), (24, 0.5), (34, 0.3), (46, 0), (216, 0), (217, 0.5), (220, 0.4), (222, 0), (259, 0), (261, 0.9), (267, 0.7), (269, 0), (514, 0), (514.5, 0.4), (516, 0.4), (517, 0), (615, 0), (615.6, 1.6), (621, 1.4), (623, 0), (dur, 0)])
    for ch in range(2):
        out[:, ch] += (lp(rs.randn(n), 500) * 0.05 + bp(rs.randn(n), 350, 1500) * 0.03 * (0.4 + 0.6 * slow_noise(n, 3, 60 + ch))) * water
    sea = W([(0, 0), (384, 0), (385, 1), (394, 0.8), (396, 0), (421, 0), (422, 0.6), (428, 0.4), (430, 0), (528, 0), (529, 0.5), (534, 0.3), (536, 0), (622, 0), (623, 1), (632, 0.7), (634, 0), (dur, 0)])
    for ch in range(2):
        swell = 0.35 + 0.65 * (0.5 + 0.5 * np.sin(TAU * t / (6.5 + ch * 1.3) + ch)) ** 2
        out[:, ch] += (lp(rs.randn(n), 500) * 0.06 + bp(rs.randn(n), 700, 2200) * 0.02 * swell) * swell * sea
    # frogs in the marsh, low and soft, before the flute
    frogs = W([(0, 0), (2, 0.8), (10, 0.6), (11.5, 0.1), (20.5, 0.1), (23, 0.5), (27, 0), (dur, 0)])
    for c in range(5):
        k = rs.rand() * 2
        while k < 27:
            m, tv = tvec(0.28); f = 380 + c * 70; y = bp(rs.randn(m), f, f * 2.2) * (np.sin(TAU * 26 * tv) > 0.1) * np.sin(np.pi * tv / tv[-1])
            at(lp(y, 1500) * 0.025 * frogs[min(n - 1, int(k * SR))], k, 1, -0.7 + c * 0.35); k += 1.2 + rs.rand() * 2.2
    city = W([(0, 0), (276, 0), (278, 1), (286, 0.6), (288, 0), (317, 0), (318.5, 0.9), (323, 0.3), (325, 0), (477, 0), (478, 0.8), (483, 0.4), (485, 0), (535, 0), (536, 0.6), (551, 0.5), (553, 0), (575, 0), (576, 0.5), (581, 0.3), (583, 0), (675, 0), (675.5, 0.9), (682, 0.6), (683, 0), (dur, 0)])
    for ch in range(2):
        babble = sum(bp(rs.randn(n), 300 + 150 * v, 1000 + 250 * v) * (0.5 + 0.5 * np.sin(TAU * (3 + v * 0.7) * t + rs.rand() * 6)) ** 4 for v in range(4))
        out[:, ch] += babble * 0.013 * city
    fire = W([(0, 0), (52.2, 0), (53, 0.6), (58, 0.4), (60, 0.3), (66, 0.3), (67, 0), (323.5, 0), (324, 0.3), (329, 0.3), (330, 0), (433, 0), (433.5, 0.8), (437, 0.7), (439, 0), (490.6, 0), (491, 0.6), (494.5, 0), (dur, 0)])
    for ch in range(2):
        out[:, ch] += lp(rs.randn(n), 420) * (0.5 + 0.5 * slow_noise(n, 5, 70 + ch)) * 0.08 * fire
    k = 0.0
    while k < dur:
        k += rs.exponential(1 / 9); g = fire[min(n - 1, int(k * SR))]
        if g < 0.02: continue
        ln = int((0.002 + rs.rand() ** 2 * 0.012) * SR); f0 = 500 + rs.rand() ** 2 * 1600
        pop = lp(bp(np.concatenate([rs.randn(ln), np.zeros(600)]), f0, f0 * 1.8) * np.exp(-np.arange(ln + 600) / (ln * 0.6)), 2400)
        at(pop, k, g * min(0.2, 0.05 + rs.pareto(2.5) * 0.04), rs.randn() * 0.15)
    hum_ = W([(0, 0), (562, 0), (563, 0.4), (570, 0.3), (574, 0), (643, 0), (644, 0.9), (646.6, 1.3), (660, 1.0), (663, 0.4), (674, 0.3), (675, 0), (682, 0), (683, 0.8), (697, 0.6), (699, 0), (dur, 0)])
    for ch in range(2): out[:, ch] += (np.sin(TAU * 50 * t + ch) * 0.010 + np.sin(TAU * 100 * t) * 0.006 + np.sin(TAU * 150 * t) * 0.002 + lp(rs.randn(n), 140) * 0.012) * hum_
    rumble = W([(0, 0), (107.4, 0), (108, 0.7), (114, 0.5), (115.5, 0), (434.6, 0), (435, 0.9), (446, 0.6), (448, 0), (463.4, 0), (464, 1.0), (470.5, 0.8), (472, 0), (555.4, 0), (556, 0.8), (559, 0.3), (561, 0), (697, 0), (697.6, 0.5), (700, 0.3), (701, 0), (dur, 0)])
    for ch in range(2): out[:, ch] += lp(rs.randn(n), 120) * 0.05 * rumble * (0.6 + 0.4 * slow_noise(n, 1.2, 80 + ch))
    leaves = W([(0, 0), (29, 0), (31, 0.4), (36, 0.3), (40, 0), (706.5, 0), (708, 0.8), (716, 0.5), (719, 0), (dur, 0)])
    for ch in range(2): out[:, ch] += bp(rs.randn(n), 500, 1900) * (0.3 + 0.7 * slow_noise(n, 1.5, 90 + ch) ** 2) * 0.03 * leaves
    # --- events, in order
    for i, tm in enumerate([5.0, 7.5, 9.0]): at(swish(0.4, 300, 1200) * 0.03, tm, 1, -0.2)
    m = int(0.9 * SR); at(bp(rs.randn(m), 400, 1500) * np.sin(np.linspace(0, np.pi, m)) * 0.03, EV['flute'] - 0.6, 1, 0.15)   # a breath before the flute
    for i in range(6): at(swish(0.35, 300, 1000) * 0.03, 29.4 + i * 0.7, 1, -0.3)                       # hoes in the millet
    for i in range(5): at(lp(rs.randn(int(0.4 * SR)), 700) * np.exp(-np.arange(int(0.4 * SR)) / (0.1 * SR)) * 0.04, 32.6 + i * 0.6, 1, 0.3)  # feet in the paddy
    m, tv = tvec(3.0); at(lp(rs.randn(m), 400) * env_ar(m, 0.3, 1.5) * 0.08 + bp(rs.randn(m), 600, 2000) * env_ar(m, 0.2, 1.5) * 0.02 * (0.5 + 0.5 * slow_noise(m, 12, 3)), EV['pour'], 1, 0.1)  # bronze poured
    at(lp(rs.randn(int(1.4 * SR)), 1800) * np.exp(-np.arange(int(1.4 * SR)) / (0.35 * SR)) * 0.04, EV['pour'] + 2.6, 1, 0.1)     # the hiss as it meets the mould
    at(clank(0.1, 220), EV['vessels'] - 0.1, 1, 0.2)
    m, tv = tvec(2.0); at(bp(rs.randn(m), 300, 1500) * np.exp(-tv / 0.6) * 0.02, EV['rod'], 1, 0)                  # the hot rod on the bone
    for tc in EV['cracks']: at(crackle(0.12), tc, 1, rs.rand() * 0.4 - 0.2)
    for tc in EV['carve']: at(tok(0.4, 420), tc, 1, 0.1); at(swish(0.18, 600, 1800) * 0.04, tc + 0.05, 1, 0.1)
    for tm in EV['signs']: at(tok(0.2, 300), tm - 0.02, 1, 0)
    gallop(EV['war'] + 0.4, EV['war'] + 5.5, 0.06, 0.3); gallop(EV['war'] + 1.5, EV['war'] + 6.0, 0.05, -0.4, 0.38)
    for k in range(5): at(clank(0.06, 400 + rs.rand() * 200), EV['war'] + 0.8 + k * 1.1 + rs.rand() * 0.4, 1, rs.rand() - 0.5)
    for i, tc in enumerate(EV['conquer']): at(thud(0.12, 60), tc + 0.05, 1, -0.4 + i * 0.16)
    for ts in EV['std']: at(thud(0.1, 90), ts, 1, 0.2)
    for k in range(9): at(thud(0.07, 70 + rs.rand() * 30), EV['wall'] + 0.4 + k * 0.62 + rs.rand() * 0.2, 1, rs.rand() - 0.5)
    steps(EV['army'], EV['army'] + 8, 0.75, 0.05, -0.2)
    for k in range(3): at(lp(swish(0.6, 200, 900), 1200) * 0.06, EV['found'] - 0.8 + k * 0.9, 1, 0.2)   # spades in the soil
    for i in range(10):
        m, tv = tvec(0.6); f = 480 + rs.rand() * 120
        clonk = (np.sin(TAU * f * tv) + 0.35 * np.sin(TAU * f * 2.3 * tv) * np.exp(-tv / 0.04)) * np.exp(-tv / 0.16) * np.minimum(1, tv / 0.004)
        at(lp(clonk, 1500) * 0.02, EV['road'] - 1.5 + i * 1.3 + rs.rand() * 0.4, 1, 0.3)                # camel bells
    gallop(EV['silkW'] + 0.6, EV['silkW'] + 3.5, 0.04, -0.3, 0.5)
    for i in range(5): at(lp(rs.randn(int(0.5 * SR)), 900) * np.sin(np.linspace(0, np.pi, int(0.5 * SR))) * 0.05, EV['paper'] + 0.4 + i * 0.5, 1, 0)  # pulp stirred in the vat
    at(flutter(1.1) * 0.05, EV['sheet'], 1, 0.1); at(flutter(1.6) * 0.07, EV['rustle'] - 0.3, 1, 0)
    m, tv = tvec(2.5); at(lp(rs.randn(m), 110) * env_ar(m, 0.1, 1.6) * 0.25, EV['quake'] - 0.4, 1, 0)
    at(clink(700, 0.12), EV['quake'] + 0.5, 1, 0.2)
    for i in range(5): at(swish(0.5, 300, 1200) * 0.03, EV['canal'] + 1 + i * 1.1, 1, -0.3)            # oars on the canal
    for i in range(8): at(swish(0.3, 500, 1800) * 0.035, EV['exam'] + 0.6 + i * 0.55 + rs.rand() * 0.2, 1, 0.2)   # brushes on paper
    for i in range(6): at(clink(1100 + rs.rand() * 400, 0.03), EV['changan'] + 1 + i * 1.4 + rs.rand(), 1, rs.rand() - 0.5)
    at(boom(0.2), EV['bang'], 1, 0.1); at(lp(rs.randn(int(1.5 * SR)), 1600) * np.exp(-np.arange(int(1.5 * SR)) / (0.5 * SR)) * 0.04, EV['bang'] + 0.05, 1, 0.1)
    for i, tf in enumerate([332.4, 333.3, 334.1, 334.9, 335.9, 336.8, 337.6]):
        at(whoosh(0.9, 200, 900) * 0.04, tf - 0.9, 1, 0.3 - i * 0.05)
        at(boom(0.06), tf, 1, -0.4 + i * 0.13)
        for j in range(10): at(crackle(0.03), tf + 0.25 + j * 0.09 + rs.rand() * 0.08, 1, -0.4 + i * 0.13 + rs.randn() * 0.2)
    at(flutter(0.8) * 0.04, EV['money'], 1, 0.2); at(flutter(0.8) * 0.04, EV['money'] + 0.6, 1, 0.3)
    for i in range(12): at(tok(0.25, 520), EV['type'] + 0.5 + i * 0.22 + rs.rand() * 0.05, 1, 0.1)        # type set in a tray
    for i in range(10): at(flutter(0.35) * 0.03, EV['pages'] + i * 0.14, 1, rs.rand() - 0.3)
    gallop(EV['mongols'] + 0.2, EV['mongols'] + 8.4, 0.08, 0.0, 0.36); gallop(EV['mongols'] + 1, EV['mongols'] + 8, 0.06, -0.5, 0.33)
    for k in range(6): at(thud(0.07, 80), EV['mingwall'] + 0.3 + k * 0.6, 1, rs.rand() - 0.5)
    for i in range(8):
        m, tv = tvec(0.7); f = 180 + rs.rand() * 120; y = np.sin(TAU * np.cumsum(f * (1 + 0.3 * tv)) / SR) * (np.sin(TAU * 30 * tv) > 0.2) * np.sin(np.pi * tv / tv[-1])
        at(bp(y, 150, 1500) * 0.02, EV['zhenghe'] + 0.6 + i * 1.2 + rs.rand(), 1, 0.2)                # timbers creaking
    for i in range(3): at(flutter(1.2) * 0.04, EV['zhenghe'] + 1.5 + i * 2.6, 1, -0.2)               # sails
    gallop(EV['manchu'] + 0.2, EV['manchu'] + 4.0, 0.06, 0.3, 0.4)
    for i in range(6): at(clink(1000 + rs.rand() * 500, 0.03), EV['trade'] + 0.8 + i * 0.8, 1, rs.rand() - 0.5)   # porcelain and silver
    for i in range(5): at(boom(0.10), EV['opiumWar'] + 0.3 + i * 0.9 + rs.rand() * 0.3, 1, rs.rand() * 1.4 - 0.7)  # cannon
    for k in range(6): at(boom(0.06), EV['taiping'] + 0.5 + k * 1.1 + rs.rand() * 0.5, 1, rs.rand() * 1.6 - 0.8)
    for k in range(10): at(boom(0.07), EV['japan'] + 0.6 + rs.rand() * 6.5, 1, rs.rand() * 1.6 - 0.8)
    m, tv = tvec(7.0); at(lp(np.sin(TAU * 95 * tv) * (1 + 0.3 * np.sin(TAU * 3.1 * tv)) + 0.5 * np.sin(TAU * 101 * tv), 400) * env_ar(m, 2.0, 3.0) * 0.012, EV['japan'] + 0.4, 1, -0.5)  # aircraft, far off
    for k in range(10): at(clank(0.07, 300 + rs.rand() * 300), EV['leap'] + 0.3 + k * 0.38 + rs.rand() * 0.1, 1, rs.rand() - 0.5)   # backyard furnaces
    for k in range(6):
        m, tv = tvec(0.5); at(lp(sum(bp(rs.randn(m), 300 + 100 * v, 900 + 200 * v) for v in range(3)) * np.sin(np.pi * tv / tv[-1]), 1200) * 0.03, EV['cultural'] + 0.3 + k * 0.78, 1, rs.rand() - 0.5)  # chanting crowds
    for i in range(4): at(clink(1300, 0.025), EV['tu'] + 1.5 + i * 0.9, 1, 0.3)                        # glassware
    m, tv = tvec(2.0); at(whoosh(2.0, 90, 400) * 0.10, EV['open'] - 0.2, 1, -0.4)                     # a ship's horn would be too sharp: just the swell of the hull
    for k in range(12): at(clank(0.05, 260 + rs.rand() * 200), EV['open'] + 1 + k * 0.5 + rs.rand() * 0.2, 1, rs.rand() - 0.5)   # containers landing
    for k in range(20): at(tok(0.25, 200 + rs.rand() * 150), EV['shenzhen'] + 0.3 + k * 0.42, 1, rs.rand() * 1.4 - 0.7)       # hammering
    m, tv = tvec(3.4); at(lp(rs.randn(m), 140) * (0.6 + 0.4 * np.sin(TAU * 9 * tv)) * env_ar(m, 0.4, 1.0) * 0.1, EV['tanks'] - 0.4, 1, 0.3)   # treads
    for i in range(12): at(lp(rs.randn(int(0.04 * SR)), 1500) * np.exp(-np.arange(int(0.04 * SR)) / (0.005 * SR)) * 0.04, EV['spark'] + 0.3 + i * 0.32, 1, rs.rand() - 0.5)  # switches
    for k, tt in enumerate([582.0, 585.6, 589.2]): at(whoosh(2.4, 140, 1000) * 0.16, tt, 1, -0.6 + k * 0.6)   # trains passing
    m, tv = tvec(5.0); at(lp(rs.randn(m), 160) * env_ar(m, 0.5, 2.4) * 0.22 + bp(rs.randn(m), 300, 1400) * env_ar(m, 0.3, 2.0) * 0.03, EV['launch'], 1, 0.2)   # the launch
    m, tv = tvec(0.5); at((np.sin(TAU * 70 * tv) * np.exp(-tv / 0.12) + lp(rs.randn(m), 300) * np.exp(-tv / 0.08) * 0.5) * 0.10, EV['farside'] + 1.2, 1, 0.1)   # touchdown, far away
    at(servo(1.2, 200, 260) * 0.04, EV['change6'] + 0.5, 1, 0.2); at(lp(swish(0.5, 200, 800), 900) * 0.05, EV['change6'] + 2.0, 1, 0.2)   # the scoop
    m, tv = tvec(6.0); at(lp(rs.randn(m), 300) * env_ar(m, 0.4, 2.0) * 0.10, EV['gorges'] - 0.2, 1, 0)   # spillways open
    for k in range(4): at(whoosh(1.5, 100, 600) * 0.08, EV['hzmb'] + 1 + k * 2.1, 1, -0.6 + k * 0.4)   # traffic over the sea
    m, tv = tvec(4.0); at(lp(rs.randn(m), 180) * env_ar(m, 0.8, 1.5) * 0.10, EV['hzmb'] + 4.0, 1, 0)    # into the tunnel
    for k in range(3): at(whoosh(1.6, 110, 700) * 0.07, EV['huajiang'] + 1.2 + k * 2.2, 1, -0.5 + k * 0.5)
    m, tv = tvec(3.0); at(lp(rs.randn(m), 600) * env_ar(m, 1.2, 1.2) * 0.07 + lp(np.sin(TAU * np.cumsum(np.linspace(60, 140, m)) / SR), 400) * env_ar(m, 1.5, 1.0) * 0.05, EV['plasma'] - 1.0, 1, 0)  # plasma lights
    for k in range(10): at(tok(0.12, 700), EV['seventeen'] + 0.1 + k * 0.6, 1, 0.3)                      # the clock
    for k in range(10): at(servo(0.4, 260 + rs.rand() * 120, 360 + rs.rand() * 200) * 0.05, EV['robots'] + 0.3 + k * 0.55 + rs.rand() * 0.1, 1, rs.rand() - 0.5)   # robots dancing
    for k in range(40): at(lp(bp(rs.randn(int(0.05 * SR)), 600, 2000) * np.exp(-np.arange(int(0.05 * SR)) / (0.01 * SR)), 2200) * 0.04, EV['robots'] - 0.6 + rs.rand() * 3.0, 1, rs.rand() * 1.6 - 0.8)  # applause
    steps(EV['marathon'], EV['marathon'] + 4, 0.32, 0.05, 0.2)
    fac = W([(0, 0), (682, 0), (683, 1), (696, 0.8), (698, 0), (dur, 0)])
    for ch in range(2): out[:, ch] += (lp(rs.randn(n), 160) * 0.02 + np.sin(TAU * 55 * t + ch) * 0.006) * fac
    for k in range(18):
        tw = 683.6 + k * 0.72
        at(servo(0.45, 300, 440 + rs.rand() * 80) * 0.06, tw, 1, -0.5 + (k % 3) * 0.5)
        if k % 2 == 0:
            m, tv = tvec(0.5); at(lp(bp(rs.randn(m), 600, 2200) * (rs.rand(m) > 0.6) * np.sin(np.pi * tv / tv[-1]), 2000) * 0.025, tw + 0.45, 1, -0.5 + (k % 3) * 0.5)   # welding
    for k in range(5): at(lp(swish(0.6, 400, 1400), 1500) * 0.05, 684 + k * 2.4, 1, 0.3)                # pneumatics
    m, tv = tvec(4.0); at(lp(rs.randn(m), 900) * env_ar(m, 0.5, 1.5) * 0.02, EV['coal'] + 0.4, 1, 0.3)    # steam
    for k in range(6): at(whoosh(1.8, 120, 500) * 0.05, EV['solar'] + 0.5 + k * 1.2, 1, -0.6 + k * 0.2)  # turbine blades
    at(whoosh(4.0, 100, 700) * 0.10, EV['pull'] - 0.2, 1, 0)                                              # lifting away from the ground
    # village loudspeakers: a muffled broadcast, a voice-like murmur with syllables but no words, tinny and far
    def broadcast(t0, dur, g, pan):
        m, tv = tvec(dur); syl = (0.5 + 0.5 * np.sin(TAU * 5.2 * tv + 3 * np.sin(TAU * 0.7 * tv))) ** 2 * (slow_noise(m, 3, rs.randint(1e6)) > 0.3)
        y = bp(rs.randn(m), 450, 1700) * syl + bp(np.sin(TAU * np.cumsum(170 * (1 + 0.15 * np.sin(TAU * 1.3 * tv))) / SR), 400, 1800) * syl * 0.6
        y = lp(y + bp(y, 850, 1000) * 2.0, 1900)
        at(y * env_ar(m, 0.3, 0.6) * g, t0, 1, pan)
    broadcast(483.2, 6.4, 0.020, -0.5)
    broadcast(EV['cultural'] + 0.1, 8.6, 0.032, 0.3)
    # the drone swarm rising over the river front: a soft rush of air, then a low hum while the dragon flies
    at(whoosh(2.6, 90, 500) * 0.06, EV['today'] - 0.2, 1, 0)
    m, tv = tvec(6.2); at(lp(np.sin(TAU * 110 * tv) * 0.3 + np.sin(TAU * 165 * tv) * 0.15 + lp(rs.randn(m), 400) * 0.6, 600) * env_ar(m, 1.2, 1.6) * 0.03, EV['today'] + 0.4, 1, 0)
    # the rail map dropping in on its thread; confetti over the gala
    at(flutter(1.0) * 0.05, EV['hsr'] + 1.6, 1, 0.4)
    for i in range(14): at(flutter(0.4) * 0.025, EV['robots'] + 0.2 + i * 0.35 + rs.rand() * 0.2, 1, rs.rand() - 0.5)
    # the factory's lamps going off, one by one
    for i in range(8): at(thud(0.07, 85), 690.4 + i * 0.22, 1, -0.5 + i * 0.14); at(clank(0.025, 170), 690.4 + i * 0.22, 1, -0.5 + i * 0.14)
    # the rocket's cloud rolling out over the pad
    m, tv = tvec(4.5); at(lp(rs.randn(m), 260) * env_ar(m, 0.3, 2.5) * 0.08, EV['launch'] + 0.4, 1, 0.1)
    return reverb(out, rt=0.9, wet=0.08, bright=4000, seed=9)


def narration(spec, dur):
    tl = narrate.timeline(spec)
    n = int(dur * SR); out = np.zeros((n, 2)); gate = np.zeros(n)
    for L in tl:
        for (t, d, s, y) in L['parts']:
            y = y + lp(y, 180) * 0.35; y = y - hp(y, 7500) * 0.35; y = np.tanh(y * 1.5) / 1.5
            place(out, y, t, 0.71, 0.0)
            gate[int(t * SR): int((t + d) * SR)] = 1
    room = reverb(out, rt=0.5, wet=0.05, bright=4000, seed=5)
    # Li Bai's poem, read in a slightly larger, quieter room
    poem = curve(n, [(0, 0), (302.8, 0), (303.4, 1), (312.6, 1), (313.2, 0), (dur, 0)])
    room += reverb(out * poem[:, None], rt=1.4, wet=0.10, bright=3000, seed=6) - out * poem[:, None]
    return room, tl, gate


def main():
    spec = json.load(open(sys.argv[1])); dur = spec['duration']; EV = spec['events']
    print('narration'); voice, tl, gate = narration(spec, dur)
    narrate.write_timeline(spec, tl, os.path.join(ROOT, 'src', 'timeline.js'))
    print('score'); music = build_score(EV, dur)
    print('ambience'); amb = ambience(dur, EV)
    voice, music, amb = voice * 1.2, music * 0.60, amb * 2.6
    duck = 1 - 0.45 * lp(gate, 1.2, 1).clip(0, 1)
    mix = voice + music * duck[:, None] + amb * (0.85 + 0.15 * duck[:, None])
    mix *= curve(len(mix), [(0, 0), (1.5, 1), (dur - 4, 1), (dur, 0)])[:, None]
    db = lambda x: 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-12)
    for t0 in range(0, int(dur), 15):
        sl = slice(t0 * SR, (t0 + 15) * SR)
        print(f'   {t0:3d}s  voice {db(voice[sl]):6.1f}  music {db(music[sl] * duck[sl, None]):6.1f}  amb {db(amb[sl]):6.1f}  mix {db(mix[sl]):6.1f}')
    print(f'  overall: voice {db(voice[gate > 0]):.1f} (while speaking)  music {db(music):.1f}  amb {db(amb):.1f}  mix {db(mix):.1f}  peak {np.abs(mix).max():.2f}')
    # loud enough for a phone speaker, without ever clipping: a look-ahead limiter
    from scipy.ndimage import maximum_filter1d, minimum_filter1d
    mix *= 10 ** (3 / 20)
    env = maximum_filter1d(np.abs(mix).max(axis=1), size=int(0.006 * SR))
    gain = minimum_filter1d(np.minimum(1.0, 0.92 / np.maximum(env, 1e-9)), size=int(0.012 * SR))
    gain = np.minimum(gain, signal.sosfiltfilt(sos('lowpass', 12, 1), gain))
    mix *= gain[:, None]
    print(f'  limiter: max reduction {20 * np.log10(gain.min()):.1f} dB, final rms {db(mix):.1f} dBFS, peak {np.abs(mix).max():.2f}')
    mix = np.clip(mix, -0.98, 0.98)
    os.makedirs(os.path.join(ROOT, 'assets/audio'), exist_ok=True)
    wav = os.path.join(ROOT, '.cache', 'film.wav'); os.makedirs(os.path.dirname(wav), exist_ok=True)
    sf.write(wav, mix, SR)
    for stem, x in (('voice', voice), ('music', music), ('amb', amb)): sf.write(os.path.join(ROOT, '.cache', f'_{stem}.wav'), x, SR, subtype='FLOAT')
    mp3 = os.path.join(ROOT, 'assets/audio/film.mp3')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-codec:a', 'libmp3lame', '-b:a', '128k', mp3], check=True)
    print('wrote', mp3, os.path.getsize(mp3) // 1024, 'kB')

if __name__ == '__main__':
    main()
