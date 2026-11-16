#!/usr/bin/env python3
"""Build the whole soundtrack: narration, an original score on Japanese
instruments (shakuhachi, koto, shamisen, biwa, taiko, shō, temple bell) that
grows into piano, city pop and an orchestra, ambience for every era, and timed
effects. One mixed file; the picture follows it.

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
    att = {'erhu': 0.07, 'dizi': 0.035, 'xiao': 0.09, 'bone': 0.06, 'shaku': 0.11}[kind]
    b2 = 1 - np.exp(-1 / (att * SR)); env = signal.lfilter([b2], [1, b2 - 1], on)
    idx = np.arange(n); last = np.maximum.accumulate(np.where(starts, idx, 0)); since = (idx - last) / SR
    depth = {'erhu': 0.009, 'dizi': 0.005, 'xiao': 0.004, 'bone': 0.003, 'shaku': 0.007}[kind] * np.clip((since - (0.5 if kind == 'shaku' else 0.2)) / 0.5, 0, 1)
    fs = np.exp(lf) * (1 + depth * np.sin(TAU * (5.6 if kind == 'erhu' else 3.9 if kind == 'shaku' else 4.8) * t))
    if kind == 'shaku': fs *= 1 - 0.028 * np.exp(-since / 0.16)   # meri: each note blown in a little flat, then lifted
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
    elif kind == 'shaku':
        # shakuhachi: a hollow bamboo tone, a lot of breath, and a breath accent (muraiki) at each note
        for k, a_ in enumerate([1, 0.42, 0.16, 0.08, 0.035], 1): y += a_ * np.sin(k * ph + k * 0.9)
        acc = 1 + 1.6 * np.exp(-since / 0.09)
        y = y * 0.5 + bp(rs.randn(n), 280, 2000) * 0.22 * acc + bp(rs.randn(n), max(200, first * 0.9), first * 2.2) * 0.12
    else:
        amps = [1, 0.18, 0.08, 0.03] if kind == 'xiao' else [1, 0.3, 0.12, 0.05]
        for k, a_ in enumerate(amps, 1): y += a_ * np.sin(k * ph + k)
        y = y * 0.55 + bp(rs.randn(n), 250 if kind == 'xiao' else 500, 1600 if kind == 'xiao' else 2400) * (0.12 if kind == 'xiao' else 0.16)
    return lp(y * env, 3200) * vel

# ------------------------------------------------------ Japanese instruments --
# Everything stays below about 2.6 kHz: no piercing, chirping or whistling tones.
def koto(f, dur=2.6, vel=1.0, bend=0.0, vib=0.0):
    """Koto: thirteen silk strings plucked with picks; the left hand presses behind the bridge to bend a note."""
    return lp(gz(f, dur, vel, bend, vib), 2600) * 1.15

def shamisen(f, dur=0.9, vel=1.0, skin=1.0):
    """Shamisen: a skin-faced lute struck with a broad plectrum; the sawari buzz rings on after the note."""
    n, t = tvec(dur); y = np.zeros(n); ph = TAU * f * t * (1 + 0.012 * np.exp(-t / 0.015))
    for k in range(1, 16):
        if f * k > 3000: break
        a = vel / k ** 0.8 * (1 + 0.7 * np.exp(-((k - 5) / 2.5) ** 2)); d = 0.55 * (300 / f) ** 0.3 / (1 + 0.5 * (k - 1))
        y += a * np.sin(k * ph + rs.rand() * 6) * np.exp(-t / d)
    saw = bp(rs.randn(n), f * 3, min(f * 9, 2800)) * np.exp(-t / 0.35) * 0.05 * vel * (0.6 + 0.4 * np.sin(TAU * f * t) ** 2)
    hit = (lp(rs.randn(n), 700) * np.exp(-t / 0.018) * 0.35 + np.sin(TAU * 140 * t) * np.exp(-t / 0.04) * 0.2) * vel * skin
    return lp(y + saw + hit, 2700) * env_ar(n, 0.001, 0.05) * 0.24

def sanshin(f, dur=0.9, vel=1.0):
    """Sanshin: Okinawa's snakeskin lute, softer and rounder than the shamisen."""
    return lp(shamisen(f, dur, vel, skin=0.4), 2000) * 1.1

def biwa(f, dur=2.4, vel=1.0):
    """Biwa: the lute of the blind tale-singers; a hard plectrum stroke and a long buzzing ring."""
    n, t = tvec(dur); y = np.zeros(n); ph = TAU * f * t * (1 + 0.02 * np.exp(-t / 0.02))
    for k in range(1, 18):
        if f * k > 2600: break
        a = vel / k ** 0.7 * (0.4 + abs(np.sin(np.pi * k * 0.21))); d = 1.6 * (150 / f) ** 0.3 / (1 + 0.4 * (k - 1))
        y += a * np.sin(k * ph + rs.rand() * 6) * np.exp(-t / d)
    buzz = bp(rs.randn(n), f * 2, min(f * 8, 2400)) * np.exp(-t / 0.9) * 0.06 * vel * (np.sin(TAU * f * t) > 0.6)
    strike = lp(rs.randn(n), 1200) * np.exp(-t / 0.01) * 0.3 * vel
    return lp(y + buzz + strike, 2500) * env_ar(n, 0.001, 0.2) * 0.26

def taiko(vel=1.0, f0=52.0):
    """O-daiko: the great barrel drum; a deep body and a short slap of the skin."""
    n, t = tvec(2.0); drop = 1 + 0.12 * np.exp(-t / 0.05); y = np.zeros(n)
    for ratio, amp, dec in [(1, 1, 0.7), (1.52, 0.45, 0.35), (2.1, 0.25, 0.2), (2.6, 0.12, 0.12)]:
        y += amp * np.sin(TAU * np.cumsum(f0 * ratio * drop) / SR + rs.rand()) * np.exp(-t / dec)
    return lp(y * 0.8 + lp(rs.randn(n), 900) * np.exp(-t / 0.02) * 0.5 * vel, 1600) * vel * np.minimum(1, t / 0.002)

def shime(vel=1.0, f0=190.0):
    """Shime-daiko: the small, tightly laced drum that keeps the time."""
    n, t = tvec(0.4)
    y = np.sin(TAU * f0 * t * (1 + 0.05 * np.exp(-t / 0.01))) * np.exp(-t / 0.07) + 0.4 * np.sin(TAU * f0 * 1.6 * t) * np.exp(-t / 0.04)
    return lp(y * 0.7 + lp(rs.randn(n), 1500) * np.exp(-t / 0.008) * 0.4, 2000) * vel * 0.6

def tsuzumi(vel=1.0, f0=250.0):
    """Ko-tsuzumi: the shoulder drum of Noh, its 'pon' bent by squeezing the cords."""
    n, t = tvec(0.7); f = f0 * (1 + 0.28 * np.exp(-t / 0.05))
    y = np.sin(TAU * np.cumsum(f) / SR) * np.exp(-t / 0.2) + 0.3 * np.sin(TAU * np.cumsum(f * 2.3) / SR) * np.exp(-t / 0.05)
    return lp(y + lp(rs.randn(n), 1200) * np.exp(-t / 0.006) * 0.3, 1800) * vel * 0.5

def sho(f, dur, vel=1.0):
    """Shō: the court mouth organ of seventeen bamboo pipes; steady, glowing, without vibrato."""
    n, t = tvec(dur + 1.2); y = np.zeros(n)
    for k in range(1, 14):
        fk = f * k
        if fk > 2600: break
        y += (1 / k ** 1.1) * (1 if k % 2 else 0.55) * np.sin(TAU * fk * t + rs.rand() * 6)
    y *= 1 + 0.08 * (slow_noise(n, 0.6, rs.randint(1e6)) - 0.5)
    return lp(y, 2300) * env_ar(n, 1.1, 1.1) * vel * 0.10

def bonsho(vel=1.0, f=98.0, dur=12.0):
    """Bonshō: the great temple bell, struck from the side by a swinging beam; it hums for a long time."""
    n, t = tvec(dur); y = np.zeros(n)
    for r_, a, d in [(0.5, 0.7, 11), (1, 1, 8), (1.004, 0.6, 8), (2.08, 0.45, 5), (2.71, 0.3, 3.5), (3.55, 0.2, 2.2), (4.9, 0.12, 1.4), (6.2, 0.07, 0.9)]:
        y += a * np.sin(TAU * f * r_ * t + rs.rand() * 6) * np.exp(-t / d)
    beam = lp(rs.randn(n), 300) * np.exp(-t / 0.05) * 0.8 + np.sin(TAU * 60 * t) * np.exp(-t / 0.08) * 0.5
    return lp(y + beam, 1400) * vel * 0.16 * np.minimum(1, t / 0.004)

def hyoshigi(vel=1.0):
    """Hyōshigi: the kabuki clappers; kept low and wooden, never a crack."""
    n, t = tvec(0.25)
    y = np.sin(TAU * 820 * t) * np.exp(-t / 0.03) + 0.5 * np.sin(TAU * 1230 * t) * np.exp(-t / 0.02) + lp(rs.randn(n), 2000) * np.exp(-t / 0.004)
    return lp(y, 1700) * vel * 0.3

def horagai(f=196.0, dur=3.0, vel=1.0):
    """Horagai: the conch trumpet blown across a battlefield."""
    n, t = tvec(dur)
    fm = f * (1 - 0.06 * np.exp(-t / 0.3)) * (1 + 0.008 * np.sin(TAU * 5 * t) * np.clip(t - 0.5, 0, 1))
    ph = TAU * np.cumsum(fm) / SR; y = np.zeros(n)
    for k, a in enumerate([1, 0.6, 0.35, 0.2, 0.12, 0.06], 1): y += a * np.sin(k * ph)
    return lp(y + bp(rs.randn(n), f, f * 4) * 0.08, 1500) * env_ar(n, 0.25, 0.8) * vel * 0.2

def tonkori(f, dur=1.8, vel=1.0):
    """Tonkori: the Ainu's long plucked zither, open strings, soft as a harp."""
    return lp(pluck(f, dur, vel, bright=0.6), 2000) * 0.9

def mukkuri(dur=1.4, f=98.0, vel=1.0):
    """Mukkuri: the Ainu bamboo jaw harp; one low note whose overtones move like a voice."""
    n, t = tvec(dur); ph = TAU * f * t; c = 520 + 300 * np.sin(TAU * 1.4 * t + rs.rand() * 6); y = np.zeros(n)
    for k in range(1, 16): y += np.sin(k * ph) / k ** 0.5 / (1 + ((k * f - c) / 110) ** 2)
    return lp(y, 1400) * np.exp(-t / 0.7) * np.minimum(1, t / 0.004) * vel * 0.18

def horn(f, dur, vel=1.0):
    n, t = tvec(dur + 0.4)
    ph = TAU * np.cumsum(f * vibrato(t, 4.6, 0.003, 0.4, rs.randint(1e6))) / SR; y = np.zeros(n); bright = 700 + 900 * vel
    for k in range(1, 16):
        fk = f * k
        if fk > 3000: break
        y += np.sin(k * ph) / k ** 0.6 / (1 + (fk / bright) ** 2)
    return lp(y, 2400) * env_ar(n, 0.12, 0.35) * vel * 0.16

def epiano(f, dur=2.0, vel=1.0):
    """An electric piano, as on the city-pop records of the 1980s."""
    n, t = tvec(dur + 0.4); idx = 1.1 * vel * np.exp(-t / 0.25)
    y = np.sin(TAU * f * t + idx * np.sin(TAU * f * t)) * (0.6 * np.exp(-t / 1.4) + 0.4 * np.exp(-t / 0.4))
    return lp(y, 2400) * env_ar(n, 0.002, 0.3) * vel * 0.32

def ebass(f, dur=0.5, vel=1.0):
    n, t = tvec(dur + 0.1); y = np.zeros(n)
    for k in range(1, 9): y += np.sin(TAU * f * k * t) / k ** 1.6 * np.exp(-t * (1.5 + k * 1.2))
    return lp(y, 900) * env_ar(n, 0.004, 0.06) * vel * 0.45

def kick(vel=1.0):
    n, t = tvec(0.4); f = 48 * (1 + 1.5 * np.exp(-t / 0.03))
    return (np.sin(TAU * np.cumsum(f) / SR) * np.exp(-t / 0.18) + lp(rs.randn(n), 600) * np.exp(-t / 0.005) * 0.2) * vel * 0.7

def softsnare(vel=1.0):
    n, t = tvec(0.3)
    return lp(bp(rs.randn(n), 300, 2200) * np.exp(-t / 0.06) * 0.6 + np.sin(TAU * 190 * t) * np.exp(-t / 0.05) * 0.4, 2200) * vel * 0.4

def chip(f, dur=0.25, vel=1.0):
    """A soft square-wave voice, for the games: rounded off well below the bright edge."""
    n, t = tvec(dur); y = np.sign(np.sin(TAU * f * t)) * 0.5 + np.sin(TAU * f * t) * 0.5
    return lp(y, 1600, 4) * env_ar(n, 0.004, 0.05) * vel * 0.12

def glidepad(f0, f1, dur, vel=1.0):
    """A held chord tone whose pitch sinks, like a tape slowing: the bubble bursting."""
    n, t = tvec(dur); f = f0 * (f1 / f0) ** smoothstep(t / dur); ph = TAU * np.cumsum(f) / SR; y = np.zeros(n)
    for k in range(1, 12): y += np.sin(k * ph) / k / (1 + (f * k / 1200) ** 2)
    return y * env_ar(n, 0.01, 0.4) * vel * 0.12

def render(notes, inst, beat=0.5, oct=0, **kw):
    """A phrase rendered on its own (to be filtered, e.g. heard through a little radio)."""
    total = sum(b for _, b in notes) * beat + 3.0; y = np.zeros(int(total * SR)); tt = 0.0
    for nm_, b in notes:
        if nm_ != 'r':
            x = inst(hz(nm_) * 2 ** oct, max(b * beat, RING.get(inst, 0)), **kw); i = int(tt * SR); m = min(len(x), len(y) - i); y[i:i + m] += x[:m]
        tt += b * beat
    return y

# -------------------------------------------------------------------- score --
# One theme for the whole film, in the yo scale on D (D E G A B). It is first heard on a
# shakuhachi by the Jōmon fire, before a word is spoken, and comes back alone at the very end.
OPEN = [('A4', 2.5), ('G4', 0.5), ('A4', 1), ('D5', 2.5), ('B4', 1), ('A4', 1), ('G4', 0.5), ('E4', 0.5), ('D4', 4)]
THEME_A = [('A4', 1.5), ('G4', 0.5), ('A4', 1), ('B4', 1), ('D5', 2), ('B4', 1), ('A4', 0.5), ('G4', 0.5), ('E4', 1), ('G4', 1), ('A4', 3)]
THEME_B = [('D5', 1), ('E5', 0.5), ('D5', 0.5), ('B4', 1), ('A4', 1), ('G4', 1.5), ('E4', 0.5), ('D4', 3)]
# the in scale (D Eb G A Bb): for grief
SAD = [('A4', 2), ('Bb4', 1), ('A4', 1), ('G4', 2), ('Eb4', 1), ('D4', 3)]
SAD_B = [('G4', 1.5), ('A4', 0.5), ('Bb4', 2), ('A4', 1), ('G4', 1), ('Eb4', 1), ('D4', 3)]
PROG = [['D3', 'A3', 'D4', 'E4'], ['G2', 'D3', 'G3', 'A3'], ['E2', 'B2', 'E3', 'G3'], ['A2', 'E3', 'A3', 'B3']]          # open fifths, yo
WARM = [['D3', 'A3', 'C#4', 'F#4'], ['B2', 'F#3', 'A3', 'D4'], ['G2', 'D3', 'F#3', 'B3'], ['A2', 'E3', 'G3', 'C#4']]       # modern: D major
POP = [['G2', 'F#3', 'B3', 'D4'], ['F#2', 'E3', 'A3', 'C#4'], ['E2', 'D3', 'G3', 'B3'], ['A2', 'G3', 'B3', 'E4']]          # 1980s: maj7 and m7
DARK = [['D2', 'A2', 'D3', 'Eb3'], ['Bb1', 'F2', 'Bb2', 'D3'], ['G1', 'D2', 'G2', 'Bb2'], ['A1', 'Eb2', 'A2', 'D3']]
AITAKE = ['E3', 'A3', 'B3', 'D4', 'E4']                                                                                    # a shō cluster
YO = ['D', 'E', 'G', 'A', 'B']
def yo(lo, hi):
    out = []
    for o in range(1, 7):
        for p in YO:
            nm_ = f'{p}{o}'
            if hz(lo) <= hz(nm_) <= hz(hi): out.append(nm_)
    return out

RING = {gz: 2.4, qin: 4.0, pipa: 0.8, bz: 3.5, piano: 2.6, oud: 1.0, koto: 2.4, biwa: 2.0, shamisen: 0.7, sanshin: 0.7, tonkori: 1.6, epiano: 1.4}

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
    S = Score(dur); B = 0.75; E = EV
    def sho_chord(t0, d, g=0.12, names=AITAKE, oct=0):
        for i, nm_ in enumerate(names): S.add(sho(hz(nm_) * 2 ** oct, d, 0.9), t0 + i * 0.05, g, -0.4 + i * 0.2)
    def strum(t0, names, inst=koto, step=0.05, g=0.3, pan=0.0, **kw): S.gliss(t0, names, step, inst, g, pan, **kw)
    def low(t0, d, names=('D2', 'A2'), g=0.2, bright=900, attack=1.5):
        for nm_ in names: S.add(bowed(hz(nm_), d, 0.9, bright=bright, attack=attack), t0, g)
    # ------------------------------------------------------------- 1. clay and fire
    S.line(OPEN, 0.3, 'shaku', beat=0.8, g=0.55, pan=0.1)                        # the first sound: a bamboo flute by the fire
    for nm_, a_ in [('D2', 0.8), ('A2', 0.5)]: S.add(hum(hz(nm_), 12.0, a_, 'm'), 0.6, 0.16)
    S.add(koto(hz('D3'), 4.0, 0.8, bend=0), E['fired'] + 0.1, 0.32, -0.1)
    S.add(taiko(0.5, 46), E['fired'], 0.35)
    for nm_ in ['D3', 'A3']: S.add(choir(hz(nm_), 5.0, 0.7, 'o'), E['pot1'] - 0.4, 0.06)
    S.beats(E['cordmark'], E['cordOut'] - 0.5, B, lambda vel: tsuzumi(vel * 0.7, 170), g=0.30, accent=4, pan=-0.2)   # a drum of clay and hide
    S.arp(E['cordmark'] + 1.5, 2, koto, sub=1, pattern=(0, 2, 1, 3), g=0.14, oct=1, vel=0.5)
    S.line(THEME_B, E['fish'] + 0.4, 'shaku', beat=0.6, oct=-1, g=0.36, pan=-0.1)
    S.beats(E['deerRun'], E['deerRun'] + 3.0, B / 2, lambda vel: tsuzumi(vel * 0.6, 200), g=0.24, accent=2, pan=0.2)
    for nm_ in ['D3', 'A3', 'E4']: S.add(hum(hz(nm_), 5.0, 0.6, 'o'), E['thousand'], 0.10)
    strum(E['flamepot'], yo('D4', 'D5'), step=0.07, g=0.22, vel=0.6)              # rims like flames
    for nm_ in ['D2', 'A2']: S.add(choir(hz(nm_), 4.5, 0.6, 'o'), E['dogu'] - 0.2, 0.07)
    S.add(koto(hz('A4'), 3.0, 0.6, vib=0.006), E['goggle'] + 0.2, 0.25)
    # ------------------------------------------------------------- 2. rice and mirrors
    S.beats(E['bronze'] - 5.0, E['chronicle'] - 1.0, B, shime, g=0.16, accent=4, pan=0.2)   # the rhythm of the planting
    S.line(THEME_A, 47.6, 'shaku', beat=0.62, g=0.30, pan=-0.15)
    S.arp(49.0, 4, koto, sub=2, pattern=(0, 2, 1, 3, 2, 3, 1, 2), g=0.13, oct=1, vel=0.5)
    for i, nm_ in enumerate(['D4', 'A4']): S.add(bz(hz(nm_), 4.5, 0.8), E['bronze'] + i * 0.3, 0.36, -0.2 + i * 0.4)   # a dōtaku, the bronze bell
    S.add(taiko(0.7, 50), E['towers'], 0.32); S.add(taiko(0.5, 50), E['towers'] + B, 0.26)
    sho_chord(E['chronicle'] - 1.2, 9.0, g=0.11)                                   # Himiko: a violet dusk
    for k, tt in enumerate([E['himiko'], E['himiko'] + 1.2, E['sorcery'], E['sorcery'] + 0.9, E['sorcery'] + 2.1]): S.add(tsuzumi(0.8, 240 - k * 8), tt, 0.32, -0.3 + k * 0.15)
    for nm_ in ['D2', 'A2']: S.add(choir(hz(nm_), 7.0, 0.7, 'o'), E['sorcery'] - 0.5, 0.07)
    S.line(SAD_B, E['sorcery'] + 0.3, 'shaku', beat=0.6, oct=-1, g=0.28)
    strum(E['seal'], ['D4', 'A4', 'D5'], step=0.06, g=0.3, vel=0.8); S.add(bz(hz('A3'), 4, 0.8), E['seal'] + 0.05, 0.3)
    for i, nm_ in enumerate(['D5', 'B4', 'A4', 'G4', 'E4', 'D4', 'B3', 'A3']): S.add(koto(hz(nm_), 2.4, 0.5), E['mirrors'] + i * 0.2, 0.2, 0.4 - i * 0.1)   # a hundred mirrors catching light
    S.chords(E['mirrors'] - 0.4, 1, bowed, prog=WARM[:1], g=0.13, bright=2000, attack=1.0)
    # ------------------------------------------------------------- 3. keyholes
    low(77.6, 11.0, g=0.18)
    S.add(taiko(0.8, 46), E['kofun'], 0.36)
    S.line(THEME_A, E['keyhole'] + 0.2, 'shaku', beat=0.68, oct=-1, g=0.34)
    for i, k in enumerate(['hClay', 'hHouse', 'hHorse', 'hWarrior', 'hDancers']): S.add(koto(hz(['D4', 'E4', 'G4', 'A4', 'B4'][i]), 2.2, 0.6), E[k] + 0.05, 0.26, -0.4 + i * 0.2)
    S.beats(E['hDancers'], E['hDancers'] + 2.4, B / 2, shime, g=0.16, accent=2)
    sho_chord(E['imperial'] - 0.6, 9.0, g=0.13)
    S.add(taiko(0.9, 48), E['imperial'], 0.38)
    S.line(THEME_B, E['imperial'] + 0.6, 'shaku', beat=0.75, oct=-1, g=0.30)
    S.add(taiko(1.0, 44), E['monarchy'], 0.42)
    for nm_ in ['D3', 'A3', 'E4']: S.add(choir(hz(nm_), 5.0, 0.8, 'a'), E['monarchy'], 0.07)
    # ------------------------------------------------------------- 4. the rising sun
    S.add(bonsho(1.0, 98), E['buddhism'], 0.55)                                    # the first temple bell
    S.beats(E['buddhism'] + 0.8, E['buddhism'] + 6.6, B, muyu, g=0.16, accent=4, f=470)
    for nm_ in ['D3', 'A2']: S.add(hum(hz(nm_), 6.5, 0.7, 'o'), E['buddhism'] + 0.6, 0.15)
    sho_chord(E['wa'] - 0.4, 6.5, g=0.12)
    S.phrase(THEME_B, E['wa'] + 0.4, koto, beat=0.6, g=0.30, vel=0.7)
    S.beats(E['sunrise'] - 1.6, E['sunrise'], 0.1, lambda vel: shime(vel * 0.5), g=0.18, accent=99)    # a roll, swelling
    S.add(taiko(1.0, 46), E['sunrise'], 0.5); S.add(timpani(55.0, 0.8), E['sunrise'], 0.3)
    sho_chord(E['sunrise'] - 0.2, 7.0, g=0.12)
    S.chords(E['sunrise'], 2, bowed, prog=PROG, g=0.16, bright=2200, attack=0.8)
    S.chords(E['sunrise'], 2, choir, prog=PROG, g=0.06, vowel='a')
    strum(E['sunrise'] + 0.05, yo('D4', 'D6'), step=0.05, g=0.2, vel=0.55)
    S.line(THEME_A, E['sunrise'] + 0.8, 'shaku', beat=0.72, g=0.36)
    S.phrase(THEME_B, E['nihon'] + 0.2, koto, beat=0.6, g=0.28, vel=0.65)
    S.arp(E['horyuji'] - 1.5, 4, koto, sub=2, g=0.12, oct=1, vel=0.5)
    S.line(THEME_A, E['horyuji'] + 0.3, 'shaku', beat=0.7, oct=-1, g=0.30)
    relay = ['D4', 'A4', 'G4', 'A4']                                               # carpenters, hand to hand for fourteen centuries
    for k in range(int((E['ise'] - 1.0 - E['firm']) / (B / 2))):
        nm_ = relay[k % 4] if (k // 8) % 2 == 0 else ['D4', 'B4', 'A4', 'E4'][k % 4]
        S.add(koto(hz(nm_), 1.6, 0.4 + 0.1 * (k % 4 == 0)), E['firm'] + k * B / 2, 0.16, 0.2 * np.sin(k))
    sho_chord(E['ise'] - 0.3, 11.0, g=0.11)                                         # Ise, in its cedars
    strum(E['iserebuilt'], ['D4', 'A4', 'D5', 'E5'], step=0.08, g=0.22, vel=0.6); S.add(bz(hz('D3'), 5, 0.7), E['iserebuilt'], 0.24)
    S.line(THEME_B, E['iserebuilt'] + 2.2, 'shaku', beat=0.72, g=0.28)
    S.add(koto(hz('D4'), 4.0, 0.6), E['forgotten'] + 0.4, 0.26)
    # ------------------------------------------------------------- 5. the great buddha
    sho_chord(169.2, 9.5, g=0.12)
    S.line(THEME_A, 170.0, 'shaku', beat=0.8, oct=-1, g=0.26)
    S.beats(170.0, 181.0, 3.0, lambda vel: taiko(vel * 0.6, 50), g=0.3, accent=2)
    S.add(bonsho(1.0, 82, 14.0), E['buddha'], 0.6)
    for nm_ in ['D2', 'A2']: S.add(choir(hz(nm_), 7.0, 0.8, 'o'), E['buddha'] + 0.2, 0.08)
    low(E['bronzeall'] - 0.3, 5.0, g=0.16)
    S.arp(E['brush'], 2, koto, sub=2, g=0.13, oct=1, vel=0.5)
    S.chords(E['thousands'] - 0.2, 1, choir, prog=PROG, g=0.08, vowel='a'); S.chords(E['thousands'] - 0.2, 1, bowed, prog=PROG, g=0.13, bright=2000, attack=1.0)
    S.add(koto(hz('D5'), 3.0, 0.8), E['paint'] + 0.4, 0.3); S.add(bz(hz('D4'), 4.0, 0.7), E['paint'] + 0.4, 0.22); S.add(bonsho(0.6, 98), E['paint'] + 0.5, 0.3)
    # ------------------------------------------------------------- 6. the court of beauty
    S.add(biwa(hz('D2'), 3, 0.8), E['heiankyo'] - 0.1, 0.36, -0.2); S.add(biwa(hz('A2'), 3, 0.7), E['heiankyo'] + 0.5, 0.32, -0.2)
    S.phrase(THEME_A, E['heiankyo'] + 0.4, koto, beat=0.65, g=0.30, vel=0.7)
    sho_chord(E['thousandyrs'] - 0.3, 5.0, g=0.10)
    S.line(THEME_B, E['poetry'] - 0.4, 'shaku', beat=0.7, g=0.30)                   # moon-viewing
    for i in range(12): S.add(koto(hz(yo('D4', 'D6')[i % 11]), 2.0, 0.4 + i * 0.02), E['layers'] + i * 0.13, 0.15, -0.5 + i * 0.09)   # twelve layers
    strum(E['kana'], yo('G4', 'E6'), step=0.08, g=0.18, vel=0.5); strum(E['kana'] + 1.2, list(reversed(yo('D4', 'B5'))), step=0.09, g=0.16, vel=0.45)
    low(E['murasaki'] - 0.6, 10.0, names=('D3',), g=0.12)
    S.phrase(THEME_A, E['murasaki'] + 0.4, koto, beat=0.8, g=0.30, vel=0.6)          # by lamplight
    S.phrase(THEME_B, E['novel'] + 1.0, koto, beat=0.7, g=0.26, vel=0.55)
    strum(E['roofs'], yo('D4', 'D6'), step=0.09, g=0.18, vel=0.5); sho_chord(E['roofs'] + 0.2, 5.0, g=0.10)
    S.chords(E['inside'], 1, bowed, prog=PROG, g=0.12, bright=1800, attack=1.0)
    # ------------------------------------------------------------- 7. the warriors (the biwa of the war tales)
    S.add(taiko(1.0, 48), E['samurai'], 0.45)
    S.phrase([('D2', 1), ('A2', 0.5), ('D3', 0.5), ('E3', 2), ('D3', 1), ('A2', 3)], E['samurai'] + 0.3, biwa, beat=0.6, g=0.42)
    S.add(taiko(0.7, 50), E['shogun'], 0.32); S.add(biwa(hz('D2'), 3, 0.9), E['shogun'] + 0.1, 0.36)
    low(E['shogunates'], 4.0, g=0.12)
    S.beats(E['mongols'], E['kamikaze'] - 0.2, B / 2, lambda vel: taiko(vel * 0.7, 56), g=0.28, accent=4)   # the Mongols: no melody
    low(E['mongols'], 11.0, names=('D2', 'Eb2', 'A2'), g=0.15, attack=2.0)
    for k in range(3): S.add(timpani(55.0, 0.6), E['storm'] + k * 0.9, 0.24)
    S.add(horagai(196, 3.0, 0.8), E['kamikaze'] - 0.2, 0.26, -0.3)
    sho_chord(E['kamikaze'], 5.0, g=0.12); S.add(choir(hz('D3'), 5.0, 0.8, 'o'), E['kamikaze'], 0.08)
    fold = [0.6] * 4 + [0.3] * 8 + [0.15] * 16                                     # folded again and again: the hammer doubles
    tt = E['folding']
    for i, d in enumerate(fold): S.add(shime(0.5 + 0.3 * (i % 2 == 0), 210), tt, 0.16, 0.2); tt += d
    S.add(koto(hz('D3'), 3, 0.6), E['folding'], 0.22)
    low(E['clay'], 2.4, names=('D2',), g=0.12)
    S.add(koto(hz('A4'), 3.5, 0.7, bend=2), E['hard'] + 0.1, 0.28)                   # after the plunge: silence, then one note
    S.line([('D5', 1), ('B4', 0.5), ('A4', 0.5), ('G4', 1), ('E4', 2)], E['curve'] + 0.1, 'shaku', beat=0.7, g=0.32)
    # ------------------------------------------------------------- 8. gold and stillness
    strum(E['kinkaku'] - 0.2, yo('D4', 'D6'), step=0.06, g=0.2, vel=0.55); sho_chord(E['kinkaku'], 7.0, g=0.11)
    S.phrase(THEME_A, E['kinkaku'] + 0.6, koto, beat=0.62, g=0.30, vel=0.7)
    S.chords(E['kinkaku'] + 0.2, 3, bowed, prog=PROG, g=0.11, bright=1800, attack=1.2)
    for k, dt in enumerate([0, 1.2, 2.0, 3.2, 4.2]):                                 # Noh: the drum, and the drummer's call
        S.add(tsuzumi(0.9, 260), E['noh'] + dt, 0.34, 0.3)
        if k % 2 == 0: S.add(hum(hz('A3') * (1 if k else 0.9), 0.5, 0.7, 'o'), E['noh'] + dt - 0.45, 0.12, 0.3)
    S.line([('E4', 1), ('A4', 1.5), ('G4', 0.5), ('E4', 2), ('D4', 2)], E['noh'] + 0.4, 'shaku', beat=0.6, g=0.28, pan=-0.2)
    S.add(bz(hz('A3'), 6.0, 0.6), E['raked'] + 0.2, 0.28)                            # a Zen garden: almost nothing
    S.line([('D4', 4)], E['raked'] + 2.6, 'shaku', beat=0.8, g=0.22)
    S.phrase([('D4', 1), ('E4', 1), ('A4', 2)], E['bowl'] + 0.3, koto, beat=0.7, g=0.22, vel=0.5)
    S.add(koto(hz('Eb3'), 2.5, 0.6), E['staples'] + 0.3, 0.2)
    S.phrase(THEME_B, E['anotherway'] + 0.2, koto, beat=0.6, g=0.26, vel=0.6)
    strum(E['gold'], yo('D4', 'D6'), step=0.07, g=0.2, vel=0.5); S.chords(E['gold'], 2, bowed, prog=WARM, g=0.13, bright=2000, attack=1.2)
    sho_chord(E['beautiful'], 4.0, g=0.10)
    S.line(THEME_A, E['kintsugi'] + 0.1, 'shaku', beat=0.68, g=0.36)                 # kintsugi: the theme
    S.arp(E['kintsugi'], 3, koto, sub=2, g=0.12, oct=1, vel=0.45)
    S.add(taiko(0.9, 46), E['fellout'], 0.4); S.add(taiko(0.7, 46), E['fellout'] + B * 2, 0.34)
    low(E['burned'], 7.0, names=('D2', 'Eb2'), g=0.16); S.add(timpani(49.0, 0.7), E['burned'] + 1.5, 0.28)
    # ------------------------------------------------------------- 9. guns and tea
    S.phrase([('D4', 0.5), ('E4', 0.5), ('F#4', 0.5), ('A4', 1), ('G4', 0.5), ('F#4', 1), ('E4', 1), ('D4', 2)], E['portuguese'] + 0.3, pluck, beat=0.42, g=0.24, pan=0.4, bright=0.6)   # a guitar from the ships
    S.add(taiko(0.8, 50), E['warlords'], 0.36); S.add(taiko(0.8, 50), E['warlords'] + 1.2, 0.36); S.add(taiko(0.9, 48), E['together'], 0.42)
    S.beats(E['together'], E['rikyu'] - 1.6, B / 2, shime, g=0.15, accent=4)
    S.beats(E['together'], E['rikyu'] - 1.6, B * 2, lambda vel: taiko(vel * 0.6, 50), g=0.26, accent=2)
    S.chords(E['castles'] - 0.2, 2, bowed, prog=PROG, g=0.15, bright=2200, attack=0.8); sho_chord(E['castles'], 5.0, g=0.10)
    S.line(THEME_A, E['castles'] + 0.2, 'shaku', beat=0.55, g=0.30)
    S.line(THEME_B, E['rikyu'] + 0.6, 'shaku', beat=0.85, g=0.30)                   # the tea room, in the rain
    for i, nm_ in enumerate(['D4', 'A3', 'E4']): S.add(koto(hz(nm_), 3.0, 0.45), E['door'] + i * 1.6, 0.18)
    S.add(koto(hz('D3'), 3.5, 0.6), E['bow'] + 0.2, 0.24)
    strum(E['goldroom'] - 0.1, yo('D4', 'D6'), step=0.05, g=0.2, vel=0.6); sho_chord(E['goldroom'], 4.5, g=0.12, oct=1)
    for i, nm_ in enumerate(['D4', 'A4', 'E5']): S.add(bz(hz(nm_), 4.0, 0.6), E['goldroom'] + 0.2 + i * 0.25, 0.22)
    S.add(horagai(185, 3.2, 0.8), E['fog'] + 0.2, 0.26, -0.5); S.add(horagai(220, 3.0, 0.7), E['fog'] + 1.8, 0.2, 0.5)   # two conches across the fog
    S.beats(E['fog'], E['decided'] - 0.1, 1.5, lambda vel: taiko(vel * 0.6, 48), g=0.3, accent=2)
    low(E['fog'], 6.0, names=('D2', 'A2'), g=0.14)
    S.add(taiko(1.0, 44), E['decided'], 0.5); S.add(timpani(55.0, 0.9), E['decided'], 0.34); S.chords(E['decided'], 1, bowed, prog=WARM, g=0.15, bright=2000, attack=0.6)
    sho_chord(E['decided'] + 0.8, 4.0, g=0.10)
    # ------------------------------------------------------------- 10. the floating world
    S.phrase(THEME_A, E['peace'] + 0.2, koto, beat=0.6, g=0.30, vel=0.7)
    S.arp(E['peace'], 3, koto, sub=2, g=0.12, oct=1, vel=0.45); sho_chord(E['peace'], 6.0, g=0.08)
    S.add(taiko(0.8, 44), E['closed'] + 0.1, 0.34)
    S.add(lp(render([('A4', 0.5), ('B4', 0.5), ('C#5', 0.5), ('D5', 1), ('A4', 1)], harpsi, beat=0.38), 2200), E['dutch'] - 0.2, 0.3, 0.4)   # the Dutch
    S.phrase([('D4', 0.5), ('E4', 0.5), ('F#4', 0.5), ('A4', 1.5)], E['chinese'] + 0.1, gz, beat=0.4, g=0.2, pan=-0.4)                      # the Chinese
    edo = ['D3', 'A3', 'D4', 'A3', 'E4', 'D4', 'A3', 'G3']                          # Edo: the shamisen, and the city's drum
    for k in range(int((E['fireworks'] - 0.6 - E['edo']) / (B / 2))): S.add(shamisen(hz(edo[k % 8]), 0.7, 0.55 + 0.25 * (k % 4 == 0)), E['edo'] + k * B / 2, 0.18, 0.25)
    S.beats(E['edo'], E['fireworks'] - 0.6, B, shime, g=0.14, accent=4, pan=-0.2)
    S.phrase(THEME_B, E['million'] + 0.2, shamisen, beat=0.45, g=0.26, pan=-0.1)
    for dt in [0, 0.5, 0.85, 1.1, 1.3, 1.45, 1.57, 1.67, 1.75]: S.add(hyoshigi(0.8), E['kabuki'] - 0.4 + dt, 0.3, 0.1)   # ki: the curtain's clappers
    S.add(taiko(0.9, 50), E['kabuki'] + 1.6, 0.36)
    S.chords(E['fireworks'], 2, bowed, prog=PROG, g=0.11, bright=1600, attack=1.5); sho_chord(E['fireworks'] + 0.4, 5.0, g=0.07)
    FW = [419.8, 420.6, 421.3, 422.0, 422.9, 423.6]
    for i, tf in enumerate(FW): S.add(koto(hz(['A4', 'D5', 'B4', 'E5', 'G4', 'D5'][i]), 2.2, 0.5), tf + 0.15, 0.16, -0.5 + i * 0.2)
    S.line([('A4', 4)], E['oldpond'] - 1.4, 'shaku', beat=0.8, g=0.22)              # Bashō: an old pond
    S.add(koto(hz('D4'), 4.5, 0.6, bend=-1), E['water'] + 0.1, 0.28); S.add(bz(hz('D3'), 5, 0.5), E['water'] + 0.15, 0.18)
    S.arp(E['carve'] - 0.4, 2, shamisen, sub=2, g=0.10, oct=1, vel=0.5)
    for i, tc in enumerate([E['colour'], E['colour'] + 0.8, E['colour'] + 1.6, E['colour'] + 2.4]): S.add(koto(hz(['D4', 'G4', 'A4', 'D5'][i]), 2.0, 0.5), tc, 0.22)   # colour by colour
    S.phrase([('A4', 0.5), ('B4', 0.5), ('A4', 0.5), ('G4', 0.5), ('E4', 1)], E['noodles'] + 0.2, shamisen, beat=0.4, g=0.22)
    S.beats(E['wave'] - 1.6, E['wave'], 0.1, lambda vel: taiko(vel * 0.4, 70), g=0.2, accent=99)   # the Great Wave
    S.add(taiko(1.0, 44), E['wave'], 0.52); S.add(timpani(49.0, 1.0), E['wave'], 0.36)
    S.chords(E['wave'], 2, bowed, prog=DARK, g=0.15, bright=2000, attack=0.6)
    strum(E['wave'] + 0.1, list(reversed(yo('D3', 'D6'))), step=0.04, g=0.18, vel=0.6)
    S.line(THEME_A, E['wave'] + 0.6, 'shaku', beat=0.6, g=0.34)
    piano_par = [('B4', 1), ('A4', 0.5), ('G4', 0.5), ('E4', 1), ('G4', 1), ('A4', 2)]   # Europe: a piano, as Debussy might have heard the prints
    S.phrase(piano_par, E['europe'] + 0.2, piano, beat=0.6, g=0.26, vel=0.6)
    S.phrase(piano_par, E['europe'] + 0.2, lambda f, d, vel=1.0: piano(f * 0.7492, max(d, 2.6), vel), beat=0.6, g=0.17, vel=0.55)   # in parallel fourths
    S.chords(E['europe'], 2, bowed, prog=WARM, g=0.12, bright=1800, attack=1.4)
    # ------------------------------------------------------------- 11. black ships
    low(E['y1853'], 13.0, names=('D2', 'Eb2'), g=0.15, attack=2.5)
    for nm_ in ['A1', 'D2']: S.add(horn(hz(nm_) * 2, 6.0, 0.5), E['blackhulled'], 0.2)
    for k in range(4): S.add(timpani(49.0, 0.7), E['salute'] + k * 1.1, 0.26)
    S.add(taiko(0.9, 46), E['shogunfell'], 0.4)
    S.beats(E['raced'], E['ainu'] - 0.6, B / 2, shime, g=0.15, accent=4)            # Meiji: racing to catch up
    S.line(THEME_A, E['meiji'] + 0.3, 'shaku', beat=0.5, g=0.22)
    S.phrase(THEME_A, E['meiji'] + 0.3, horn, beat=0.5, g=0.32, oct=-1, vel=0.7)
    S.chords(E['raced'], 4, bowed, prog=WARM, g=0.13, bright=2200, attack=0.5)
    for i, k in enumerate(['railways', 'factories', 'schools', 'parliament']):
        for j, nm_ in enumerate(WARM[i % 4]): S.add(horn(hz(nm_), 0.7, 0.8), E[k], 0.12, -0.3 + j * 0.2)
    ainu = ['A3', 'D4', 'E4', 'A4', 'E4', 'D4']                                     # the Ainu: tonkori and mukkuri
    for k in range(8): S.add(tonkori(hz(ainu[k % 6]), 1.8, 0.6), E['ainu'] + k * 0.4, 0.22, -0.3)
    for k in range(3): S.add(mukkuri(1.3, 98, 0.8), E['ainu'] + 0.2 + k * 1.1, 0.22, 0.3)
    S.phrase([('D4', 0.5), ('F#4', 0.5), ('G4', 0.5), ('A4', 1), ('C#5', 0.5), ('D5', 1), ('A4', 1.5)], E['ryukyu'] + 0.2, sanshin, beat=0.42, g=0.3, pan=0.2)   # Ryukyu: the sanshin
    S.beats(E['russia'], E['russia'] + 6.0, B / 2, lambda vel: taiko(vel * 0.6, 52), g=0.26, accent=4)
    S.chords(E['russia'], 2, bowed, prog=DARK, g=0.14, bright=1800, attack=0.6); S.add(horn(hz('D3'), 4.0, 0.7), E['russia'] + 3.0, 0.2)
    # ------------------------------------------------------------- 12. empire and ashes: no melody
    low(E['korea'] - 2.8, 15.0, names=('D2', 'A2', 'Eb3'), g=0.13, attack=3.0)
    for k in range(6): S.add(timpani(49.0, 0.4), E['invaded'] + k * 1.5, 0.22)
    for nm_ in ['D2', 'A2']: S.add(choir(hz(nm_), 6.0, 0.6, 'o'), E['millions'], 0.07)
    S.add(timpani(55.0, 0.8), E['pearlharbor'] + 0.2, 0.3)
    low(E['bombers'], 12.0, names=('D2', 'Eb2'), g=0.12, bright=700, attack=2.0)
    m_ = int(9 * SR); S.add(lp(np.sin(TAU * 36 * np.arange(m_) / SR), 120) * env_ar(m_, 1.0, 5.0) * 0.5, E['flash'] + 0.3, 0.4)   # the flash: silence, and something felt more than heard
    S.add(bonsho(1.0, 92, 14.0), E['surrendered'], 0.5)                              # one bell
    low(E['surrendered'] + 0.4, 8.0, names=('D2',), g=0.12)
    S.phrase(SAD, E['sadako'] + 0.2, koto, beat=0.8, g=0.28, vel=0.55)              # Sadako's cranes
    for i in range(8): S.add(koto(hz(['D5', 'A4', 'G4', 'D5', 'E5', 'A4', 'B4', 'D5'][i]), 2.0, 0.35), E['cranes'] + 0.3 + i * 0.36, 0.14, -0.4 + i * 0.1)
    sho_chord(E['wishpeace'] - 0.2, 5.0, g=0.10); S.chords(E['wishpeace'], 1, bowed, prog=WARM, g=0.12, bright=1800, attack=1.4)
    # ------------------------------------------------------------- 13. the miracle
    S.phrase(THEME_B, E['rebuilt'] + 0.2, piano, beat=0.6, g=0.30, vel=0.55)       # a piano, rebuilding
    S.chords(E['constitution'], 2, bowed, prog=WARM, g=0.13, bright=2000, attack=1.0)
    for k in range(int((E['toyota'] - E['tenpercent']) / (B / 2))): S.add(pulse(hz(['D3', 'A3', 'D4', 'E4'][k % 4]), 0.3, 0.3 + 0.5 * k / 18), E['tenpercent'] + k * B / 2, 0.2, 0.2)   # growing
    S.arp(E['tenpercent'], 2, piano, prog=WARM, sub=2, g=0.12, oct=1, vel=0.45)
    S.beats(E['toyota'], E['cord'], B / 2, lambda vel: pulse(hz('D3'), 0.25, vel), g=0.22, accent=2)   # the line
    S.beats(E['toyota'], E['cord'], B, shime, g=0.12, accent=4)
    for i, nm_ in enumerate(['A4', 'D5']): S.add(bz(hz(nm_), 3.0, 0.5), E['cord'] + 0.1 + i * 0.3, 0.2, 0.3)   # the andon chime: the line stops
    S.beats(E['fix'] + 0.4, E['radio'] - 0.6, B / 2, lambda vel: pulse(hz('D3'), 0.25, vel), g=0.16, accent=2)
    KZ = [[('D4', 1), ('E4', 1), ('A4', 2)], [('D4', 1), ('E4', 0.5), ('G4', 0.5), ('A4', 2)], [('D4', 0.5), ('E4', 0.5), ('G4', 0.5), ('A4', 0.5), ('B4', 1), ('D5', 1)]]
    for i, ph_ in enumerate(KZ): S.phrase(ph_, 597.8 + i * 1.5, piano, beat=0.32, g=0.24, vel=0.5 + i * 0.1)   # kaizen: the same phrase, a little better each time
    S.add(bp(render(THEME_A, piano, beat=0.32, oct=1), 500, 2000) * 2.2, E['radio'] + 0.4, 0.26, 0.35)   # the pocket radio
    S.phrase([('D4', 0.5), ('r', 0.5), ('A4', 0.5), ('G4', 0.5), ('A4', 1)], E['largerpockets'] + 0.4, koto, beat=0.35, g=0.2, vel=0.5)
    S.add(taiko(0.9, 50), E['olympics'], 0.4); S.add(timpani(73.4, 0.9), E['olympics'], 0.32)   # 1964
    S.phrase(THEME_A, E['olympics'] + 0.2, horn, beat=0.48, g=0.34, vel=0.8); S.chords(E['olympics'], 2, bowed, prog=WARM, g=0.15, bright=2400, attack=0.4)
    S.beats(E['shinkansen'], E['shinkansen'] + 9.0, B / 2, lambda vel: pulse(hz('D3'), 0.25, vel), g=0.2, accent=2)   # the bullet train
    S.arp(E['shinkansen'], 3, piano, prog=WARM, sub=4, g=0.10, oct=1, vel=0.4)
    S.line(THEME_B, E['shinkansen'] + 0.6, 'shaku', beat=0.55, g=0.26); S.chords(E['shinkansen'], 3, bowed, prog=WARM, g=0.13, bright=2400, attack=0.6)
    S.chords(E['second'] - 0.2, 2, bowed, prog=WARM, g=0.16, bright=2400, attack=0.5); S.chords(E['second'] - 0.2, 2, horn, prog=WARM, g=0.10, vel=0.6)
    S.add(timpani(73.4, 0.8), E['second'], 0.3)
    g0, g1 = E['glowed'], E['burst'] - 0.1                                           # the 1980s: city pop
    S.beats(g0, g1, B, kick, g=0.30, accent=2); S.beats(g0 + B, g1, B * 2, softsnare, g=0.22, accent=1)
    for k in range(int((g1 - g0) / (B * 4))):
        ch = POP[k % 4]; t0 = g0 + k * B * 4
        S.add(ebass(hz(ch[0]), 0.6, 0.9), t0, 0.32); S.add(ebass(hz(ch[0]), 0.3, 0.7), t0 + B * 1.5, 0.26); S.add(ebass(hz(ch[0]) * 2, 0.3, 0.6), t0 + B * 2.5, 0.22)
        for j, nm_ in enumerate(ch[1:]): S.add(epiano(hz(nm_), 1.4, 0.6), t0 + B * (0 if j == 0 else 0.02 * j), 0.14, -0.3 + j * 0.3); S.add(epiano(hz(nm_), 0.9, 0.45), t0 + B * 2.5, 0.10, -0.3 + j * 0.3)
        S.add(pad(hz(ch[1]), B * 4, 0.6), t0, 0.12)
    S.phrase(THEME_A, g0 + B * 4, epiano, beat=0.42, g=0.24, oct=1, vel=0.6)
    S.phrase(THEME_B, E['palace'] + 0.4, epiano, beat=0.42, g=0.22, oct=1, vel=0.55)
    for nm_ in POP[0][1:]: S.add(glidepad(hz(nm_), hz(nm_) * 0.5, 2.2, 0.8), E['burst'], 0.3)   # the bubble bursts
    # ------------------------------------------------------------- 14. ink and light
    S.phrase(THEME_B, E['tezuka'] - 3.4, piano, beat=0.75, g=0.24, vel=0.45)       # a student drawing late at night
    S.add(piano(hz('D5'), 2.0, 0.5), E['closeups'], 0.2); S.add(piano(hz('D3'), 2.5, 0.5), E['longshots'], 0.22)
    S.chords(E['eyes'], 1, bowed, prog=WARM, g=0.12, bright=1800, attack=0.8)
    for k in range(int((E['anime'] - 0.8 - E['everyone']) / (B / 2))): S.add(piano(hz(['D4', 'A4', 'E4', 'A4'][k % 4]), 0.6, 0.35), E['everyone'] + k * B / 2, 0.13, 0.2)   # the commuter train
    S.add(ebass(hz('D2'), 0.5, 0.7), E['everyone'], 0.2); S.beats(E['everyone'], E['anime'] - 0.8, B * 2, lambda vel: ebass(hz('D2'), 0.4, vel), g=0.2, accent=2)
    S.add(timpani(73.4, 0.9), E['anime'], 0.32)                                      # anime: the orchestra
    S.chords(E['anime'], 2, bowed, prog=WARM, g=0.17, bright=2600, attack=0.4); S.chords(E['anime'], 2, horn, prog=WARM, g=0.09, vel=0.7)
    S.phrase(THEME_A, E['anime'] + 0.2, horn, beat=0.42, g=0.28, vel=0.8); S.line(THEME_A, E['anime'] + 0.2, 'shaku', beat=0.42, g=0.18)
    S.beats(E['framebyframe'], E['foursecond'] - 0.2, B / 4, lambda vel: piano(hz('A4'), 0.2, vel * 0.4), g=0.12, accent=4)   # frame by frame
    S.chords(E['foursecond'], 1, bowed, prog=[['D3', 'A3', 'E4', 'A4']], g=0.12, bright=1600, attack=1.2)
    S.phrase(THEME_B, E['year'] - 0.2, piano, beat=0.7, g=0.22, vel=0.45)
    w0 = E['spirited'] - 0.6; WB = 0.42                                              # an anime summer: a waltz
    WZ = [['D2', 'A3', 'D4', 'F#4'], ['B1', 'F#3', 'B3', 'D4'], ['G1', 'D3', 'G3', 'B3'], ['A1', 'E3', 'A3', 'C#4']]
    for k in range(int((E['nintendo'] - 0.4 - w0) / (WB * 3))):
        ch = WZ[(k // 2) % 4]; t0 = w0 + k * WB * 3
        S.add(piano(hz(ch[0]) * 2, 1.2, 0.5), t0, 0.2, -0.2)
        for b in (1, 2):
            for nm_ in ch[1:]: S.add(piano(hz(nm_), 0.5, 0.3), t0 + b * WB, 0.10, 0.2)
    SUMMER = [('A4', 1), ('D5', 2), ('E5', 1), ('F#5', 2), ('E5', 1), ('D5', 1), ('B4', 1), ('A4', 4), ('r', 2), ('G4', 1), ('A4', 2), ('B4', 1), ('D5', 2), ('E5', 1), ('D5', 5)]
    S.add(lp(render(SUMMER, lambda f, d, vel=1.0: bowed(f, d, vel, bright=2400, attack=0.25), beat=WB, oct=0), 2600), w0 + WB * 3, 0.32, -0.1)
    S.chords(E['roundworld'], 2, bowed, prog=WARM, g=0.13, bright=2400, attack=0.6); S.chords(E['roundworld'], 1, choir, prog=WARM, g=0.06, vowel='a')
    S.add(timpani(73.4, 0.8), E['roundworld'], 0.28)
    S.phrase([('D4', 0.5), ('A4', 0.5), ('G4', 1)], E['nintendo'] + 0.2, koto, beat=0.4, g=0.22, vel=0.55); S.phrase([('E4', 0.5), ('G4', 0.5), ('D4', 1)], E['playingcards'] + 0.2, shamisen, beat=0.4, g=0.22)
    S.phrase(THEME_A, E['games'] + 0.1, chip, beat=0.26, g=0.9, oct=0)               # the theme, as a game might play it
    S.beats(E['games'] + 0.1, E['games'] + 0.1 + 15 * 0.26 * 1.0, 0.52, lambda vel: chip(hz('D3'), 0.2, vel * 1.4), g=0.9, accent=2)
    # ------------------------------------------------------------- 15. the hands
    S.phrase(THEME_A, E['crafts'] + 0.2, koto, beat=0.6, g=0.30, vel=0.65)
    S.line(THEME_B, E['companies'] + 2.6, 'shaku', beat=0.65, g=0.28); sho_chord(E['crafts'], 6.0, g=0.08)
    S.arp(E['inn'] - 0.2, 3, koto, sub=2, g=0.11, oct=1, vel=0.42)
    for k in range(10): S.add(shamisen(hz(['D3', 'A3', 'D4', 'E4'][k % 4]), 0.6, 0.45), E['sushichefs'] + k * B / 2, 0.12, 0.2)
    S.add(shime(0.8), E['swordsmiths'], 0.2); S.add(shime(0.6), E['swordsmiths'] + 0.6, 0.18)
    sho_chord(E['ise2013'], 6.0, g=0.11); strum(E['sixtysecond'] + 0.4, ['D4', 'A4', 'D5', 'E5'], step=0.07, g=0.22, vel=0.55)
    low(E['searose'] - 1.0, 12.0, names=('D2', 'Eb2', 'A2'), g=0.13, attack=2.5)     # 2011: no melody
    S.add(timpani(49.0, 0.6), E['searose'] + 0.4, 0.24); S.add(timpani(49.0, 0.4), E['fukushima'], 0.2)
    S.add(bonsho(0.9, 92, 12.0), E['oldstones'] + 0.2, 0.42)                          # the old stones
    for nm_ in ['D3', 'A3']: S.add(choir(hz(nm_), 5.0, 0.6, 'o'), E['dontbuild'] - 0.2, 0.06)
    S.chords(E['cherrytrees'] - 1.0, 2, bowed, prog=WARM, g=0.12, bright=1800, attack=1.6)   # cherry trees where the water stopped
    S.phrase(THEME_B, E['cherrytrees'] - 0.6, koto, beat=0.62, g=0.28, vel=0.6); S.phrase(THEME_B, E['cherrytrees'] + 0.0, piano, beat=0.62, g=0.12, oct=-1, vel=0.4)
    S.beats(E['floats'] - 0.4, E['asteroids'], B / 2, lambda vel: pulse(hz('D3'), 0.25, vel), g=0.18, accent=2)   # the floating train
    S.arp(E['floats'] - 0.4, 3, piano, prog=WARM, sub=2, g=0.10, oct=1, vel=0.4)
    for nm_ in ['D3', 'A3', 'E4']: S.add(pad(hz(nm_), 6.0, 0.7, bright=1000, attack=1.5), E['asteroids'] - 0.4, 0.14)
    for i, nm_ in enumerate(['A4', 'E5', 'D5', 'B4']): S.add(piano(hz(nm_), 2.0, 0.35), E['asteroids'] + 0.6 + i * 0.9, 0.14, -0.3 + i * 0.2)
    S.chords(793.6, 1, bowed, prog=WARM, g=0.12, bright=1800, attack=1.6); sho_chord(794.0, 4.5, g=0.08)
    # ------------------------------------------------------------- 16. mended with gold
    sho_chord(E['pull'] - 0.4, 6.0, g=0.11); low(E['pull'], 6.0, g=0.12)
    for i, k in enumerate(['war', 'fire', 'quake', 'seaend']):                       # each break: a blow, and a note out of the scale
        S.add(taiko(0.8 + 0.05 * i, 46), E[k], 0.38); S.add(koto(hz(['Eb3', 'Bb2', 'Eb3', 'A2'][i]), 2.4, 0.6), E[k] + 0.05, 0.2)
    for i in range(5): strum(E['mended'] + i * 0.5, yo('D4', 'B5')[i:i + 5], step=0.08, g=0.17, vel=0.5, pan=-0.4 + i * 0.2)   # gold laid along each crack
    S.phrase(THEME_A, E['byhand'] + 0.2, koto, beat=0.62, g=0.28, vel=0.6)
    S.chords(E['byhand'], 3, bowed, prog=PROG, g=0.13, bright=2000, attack=1.4)
    S.line(THEME_B, E['bowlend'] - 0.4, 'shaku', beat=0.65, g=0.30); sho_chord(E['bowlend'], 5.0, g=0.09)
    S.beats(E['bowlend'], E['shine'], 1.5, lambda vel: taiko(vel * 0.4, 48), g=0.24, accent=2)
    S.add(taiko(1.0, 44), E['shine'], 0.5); S.add(timpani(73.4, 0.9), E['shine'], 0.32)  # they shine: everything, together
    S.chords(E['shine'], 2, bowed, prog=PROG, g=0.17, bright=2400, attack=0.5); S.chords(E['shine'], 2, choir, prog=PROG, g=0.07, vowel='a')
    S.chords(E['shine'], 2, horn, prog=PROG, g=0.08, vel=0.6); sho_chord(E['shine'], 6.0, g=0.10)
    strum(E['shine'] + 0.05, yo('D4', 'D6'), step=0.05, g=0.2, vel=0.55)
    S.line(THEME_A, E['shine'] + 0.3, 'shaku', beat=0.62, g=0.34); S.phrase(THEME_A, E['shine'] + 0.3, piano, beat=0.62, g=0.14, oct=-1, vel=0.45)
    low(E['title'], 20.0, names=('D2', 'A2', 'D3'), g=0.09, bright=1200, attack=3.0); sho_chord(E['title'] + 0.2, 11.0, g=0.06)
    S.line(OPEN, E['title'] + 0.8, 'shaku', beat=0.8, g=0.5, pan=0.1)                # and the first sound returns, alone
    S.add(koto(hz('D4'), 5.0, 0.55), E['title'] + 12.2, 0.24); S.add(bonsho(0.6, 98, 12.0), E['title'] + 12.8, 0.3)
    # a drone under everything, the earth note D: gone in the moment of the bomb, and under the 1980s and the games
    n = S.n
    d = drone(n, [(hz('D2'), 0.5), (hz('A2'), 0.3), (hz('D3'), 0.14)])
    S.dry += d * curve(n, [(0, 0), (3, 0.08), (12, 0.12), (46, 0.16), (77, 0.12), (104, 0.16), (125, 0.2), (169, 0.16), (232, 0.12), (247, 0.08), (259, 0.14), (276, 0.16), (296, 0.1), (331, 0.08), (338, 0.14), (390, 0.16), (420, 0.1), (446, 0.16), (460, 0.1), (511, 0.08), (547.8, 0.06), (548.4, 0), (556, 0), (558, 0.1), (574, 0.14), (590, 0.12), (643, 0.1), (644.4, 0), (660, 0), (662, 0.1), (688, 0.16), (717.6, 0.12), (718.4, 0), (722, 0), (724, 0.16), (755, 0.08), (777, 0.14), (800, 0.16), (820, 0.22), (dur - 1, 0)])[:, None]
    wet = reverb(S.wet, rt=2.8, wet=0.42, bright=2400)
    # the Zen garden, Bashō's pond and the ending sound a little further away
    far = curve(n, [(0, 0), (295, 0), (296, 1), (301, 1), (302, 0), (424, 0), (425, 1), (433, 1), (434, 0), (825, 0), (827, 1), (dur, 1)])
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
    E = EV
    wind = W([(0, 0), (1.5, 0.4), (30, 0.4), (46, 0.3), (77, 0.5), (104, 0.4), (154, 0.5), (156, 0.9), (168, 0.8), (170, 0.4), (232, 0.4), (247, 0.7), (250, 1.5), (256, 1.4), (258.5, 0.3), (276, 0.3), (295, 0.3), (296, 0.6), (301, 0.6), (302, 0.3), (337, 0.4), (380, 0.5), (381, 0.9), (386, 0.8), (388, 0.3), (460, 0.4), (511, 0.6), (547.9, 0.6), (548.2, 0), (551.5, 0), (553, 0.9), (565, 0.4), (574, 0.3), (588, 0.15), (660, 0.15), (722, 0.3), (755, 0.5), (764, 0.9), (775, 0.5), (798, 0.4), (801, 0.9), (818, 0.4), (dur, 0)])
    for ch in range(2):
        w = bp(rs.randn(n), 160, 650) * (0.35 + 0.65 * slow_noise(n, 0.25, 40 + ch)) + bp(rs.randn(n), 800, 2000) * 0.08 * slow_noise(n, 0.4, 50 + ch)
        out[:, ch] += w * 0.05 * wind
    water = W([(0, 0), (28.5, 0), (29.5, 0.5), (35, 0.4), (37, 0), (46.5, 0), (47.5, 0.5), (56, 0.4), (58, 0), (278.5, 0), (280, 0.5), (287, 0.4), (288.5, 0), (424.5, 0), (425.5, 0.35), (434, 0.3), (435, 0), (731, 0), (732, 0.6), (737.5, 0.5), (738.5, 0), (dur, 0)])
    for ch in range(2):
        out[:, ch] += (lp(rs.randn(n), 500) * 0.05 + bp(rs.randn(n), 350, 1500) * 0.03 * (0.4 + 0.6 * slow_noise(n, 3, 60 + ch))) * water
    sea = W([(0, 0), (246.5, 0), (247.5, 0.8), (250.4, 1.4), (256, 1.2), (258.5, 0), (340.5, 0), (341.5, 0.5), (345, 0.4), (346, 0), (398.8, 0), (399.6, 0.6), (404.6, 0.5), (405.4, 0), (445.4, 0), (446.4, 1.3), (451, 0.9), (453, 0), (462.4, 0), (463.4, 0.7), (476, 0.5), (477, 0), (497.8, 0), (498.6, 0.4), (501, 0.3), (502, 0), (503.4, 0), (504.4, 0.6), (510, 0.5), (511, 0), (528.2, 0), (529, 0.4), (532, 0), (754.8, 0), (755.8, 1.5), (760, 1.2), (764, 0.4), (766, 0), (805.8, 0), (806.4, 0.8), (809, 0), (dur, 0)])
    for ch in range(2):
        swell = 0.35 + 0.65 * (0.5 + 0.5 * np.sin(TAU * t / (6.5 + ch * 1.3) + ch)) ** 2
        out[:, ch] += (lp(rs.randn(n), 500) * 0.06 + bp(rs.randn(n), 700, 2200) * 0.02 * swell) * swell * sea
    rain = W([(0, 0), (358.2, 0), (359.4, 0.8), (371.6, 0.7), (372.6, 0), (424.8, 0), (425.6, 0.45), (433.6, 0.4), (434.4, 0), (659.4, 0), (660.4, 0.7), (666, 0.5), (668, 0), (dur, 0)])
    for ch in range(2): out[:, ch] += (bp(rs.randn(n), 400, 2000) * 0.03 + lp(rs.randn(n), 300) * 0.02) * (0.7 + 0.3 * slow_noise(n, 2, 64 + ch)) * rain
    k = 0.0
    while k < dur:                                                                   # drops off the eaves
        k += rs.exponential(1 / 5); g = rain[min(n - 1, int(k * SR))]
        if g < 0.05: continue
        m, tv = tvec(0.12); f = 500 + rs.rand() * 500
        at(lp(np.sin(TAU * f * tv * (1 + 0.6 * np.exp(-tv / 0.01))) * np.exp(-tv / 0.025), 1600) * 0.012 * g, k, 1, rs.rand() - 0.5)
    frogs = W([(0, 0), (1, 0.5), (9, 0.4), (11, 0), (47, 0), (48, 0.6), (58, 0.4), (60, 0), (dur, 0)])   # low marsh frogs, no high calls
    for c in range(5):
        k = rs.rand() * 2
        while k < 62:
            m, tv = tvec(0.28); f = 300 + c * 60; y = bp(rs.randn(m), f, f * 2.2) * (np.sin(TAU * 24 * tv) > 0.1) * np.sin(np.pi * tv / tv[-1])
            at(lp(y, 1300) * 0.022 * frogs[min(n - 1, int(k * SR))], k, 1, -0.7 + c * 0.35); k += 1.2 + rs.rand() * 2.2
    crowd = W([(0, 0), (183.6, 0), (184.6, 0.7), (189.6, 0.6), (190.4, 0), (405.4, 0), (406.4, 0.8), (416.8, 0.7), (417.4, 1.0), (419.4, 0.8), (420, 0.4), (424, 0.3), (424.8, 0), (479.6, 0), (480.4, 0.4), (492, 0.3), (493, 0), (616.8, 0), (617.4, 1.1), (621, 0.6), (622, 0), (644.4, 0), (645.4, 0.6), (658.8, 0.6), (659.4, 0), (676.8, 0), (677.4, 0.35), (683, 0.3), (683.6, 0), (dur, 0)])
    for ch in range(2):
        babble = sum(bp(rs.randn(n), 300 + 150 * v, 1000 + 250 * v) * (0.5 + 0.5 * np.sin(TAU * (3 + v * 0.7) * t + rs.rand() * 6)) ** 4 for v in range(4))
        out[:, ch] += babble * 0.013 * crowd
    fire = W([(0, 0), (0.2, 0.5), (10.4, 0.5), (10.8, 0.8), (14, 0.6), (26, 0.4), (29, 0), (52.2, 0), (52.8, 0.4), (55, 0), (177.0, 0), (177.6, 0.6), (181, 0.4), (182, 0), (259.6, 0), (260, 0.45), (268, 0.6), (269.25, 0.6), (269.35, 0), (331.2, 0), (332, 0.9), (337, 0.7), (339, 0), (346.2, 0), (346.8, 0.35), (349, 0), (537.6, 0), (538.4, 1.1), (546, 0.8), (548.1, 0.6), (548.2, 0), (803.6, 0), (804, 0.5), (807, 0), (dur, 0)])
    for ch in range(2):
        out[:, ch] += lp(rs.randn(n), 420) * (0.5 + 0.5 * slow_noise(n, 5, 70 + ch)) * 0.08 * fire
    k = 0.0
    while k < dur:
        k += rs.exponential(1 / 9); g = fire[min(n - 1, int(k * SR))]
        if g < 0.02: continue
        ln = int((0.002 + rs.rand() ** 2 * 0.012) * SR); f0 = 500 + rs.rand() ** 2 * 1400
        pop = lp(bp(np.concatenate([rs.randn(ln), np.zeros(600)]), f0, f0 * 1.8) * np.exp(-np.arange(ln + 600) / (ln * 0.6)), 2200)
        at(pop, k, g * min(0.18, 0.05 + rs.pareto(2.5) * 0.04), rs.randn() * 0.15)
    city = W([(0, 0), (587, 0), (588.5, 0.4), (643, 0.5), (645, 0.9), (659, 0.8), (660, 0), (675, 0), (676, 0.4), (690, 0.3), (691, 0), (dur, 0)])   # traffic, far off
    for ch in range(2): out[:, ch] += (lp(rs.randn(n), 200) * 0.03 + bp(rs.randn(n), 250, 900) * 0.012 * slow_noise(n, 0.7, 75 + ch)) * city
    mach = W([(0, 0), (488.8, 0), (489.6, 0.7), (493, 0.5), (494, 0), (589.6, 0), (590.4, 0.9), (594.2, 0.9), (594.5, 0), (596.4, 0), (597, 0.6), (604, 0.4), (605, 0), (dur, 0)])
    for ch in range(2): out[:, ch] += (lp(rs.randn(n), 160) * 0.02 + np.sin(TAU * 55 * t + ch) * 0.006 + lp(rs.randn(n), 900) * 0.01 * (np.sin(TAU * 2.4 * t) > 0.6)) * mach
    k = 590.4
    while k < 604:                                                                    # the line: a press, a clunk, a ratchet
        if not (594.2 < k < 596.6): at(clank(0.04, 220 + rs.rand() * 60), k, 1, rs.rand() - 0.5); at(thud(0.05, 90), k + 0.37, 1, 0.2)
        k += 0.75
    rumble = W([(0, 0), (246.8, 0), (247.4, 0.4), (250.4, 0.8), (256, 0.6), (258, 0), (465.6, 0), (466.4, 0.6), (475, 0.4), (476.4, 0), (535, 0), (535.6, 0.5), (546, 0.6), (548.1, 0.6), (548.2, 0), (548.6, 0), (549.4, 0.9), (553, 0.3), (556, 0), (755.4, 0), (756, 1.0), (760, 0.6), (764, 0), (804.6, 0), (805, 0.9), (807.5, 0), (dur, 0)])
    for ch in range(2): out[:, ch] += lp(rs.randn(n), 120) * 0.05 * rumble * (0.6 + 0.4 * slow_noise(n, 1.2, 80 + ch))
    leaves = W([(0, 0), (155.6, 0), (157, 0.5), (168, 0.4), (169, 0), (349.6, 0), (350.4, 0.4), (357.6, 0.3), (358.4, 0), (dur, 0)])   # Ise's cedars, the maple wind
    for ch in range(2): out[:, ch] += bp(rs.randn(n), 400, 1600) * (0.3 + 0.7 * slow_noise(n, 1.5, 90 + ch) ** 2) * 0.03 * leaves
    planes = W([(0, 0), (528.2, 0), (529, 0.6), (533, 0.3), (534.4, 0), (535, 0.6), (538, 1.0), (546, 0.6), (547.6, 0), (dur, 0)])   # bombers: a low drone of engines, far up
    for ch in range(2): out[:, ch] += lp(np.sin(TAU * 92 * t + ch) * (1 + 0.3 * np.sin(TAU * 3.1 * t)) + 0.6 * np.sin(TAU * 97.5 * t) + lp(rs.randn(n), 300) * 0.8, 500) * 0.012 * planes
    # --- events, in order
    # 1. the fire, the pots, the cord
    at(whoosh(1.4, 120, 700) * 0.06, 0.1, 1, 0); at(whoosh(1.0, 140, 800) * 0.08, E['fired'] - 0.3, 1, 0)
    at(thud(0.08, 90), E['pot1'] - 0.1, 1, 0.1)
    m, tv = tvec(6.0); at(lp(rs.randn(m), 600) * (0.5 + 0.5 * np.sin(TAU * 1.3 * tv) ** 2) * env_ar(m, 0.5, 1.0) * 0.02, E['cordmark'] + 0.6, 1, 0)   # cord rolled on wet clay
    gallop(E['deerRun'], E['deerRun'] + 2.6, 0.035, 0.3, 0.32)
    for i in range(4): at(tok(0.2, 380), E['chestnut'] + 0.3 + i * 0.35, 1, -0.2)
    # 2. bronze and iron, moats, towers, the seal
    at(clank(0.07, 300), E['iron'] + 0.1, 1, 0.2); at(clank(0.05, 340), E['iron'] + 0.7, 1, 0.2)
    for i in range(5): at(lp(swish(0.5, 200, 900), 1100) * 0.05, E['moat'] + i * 0.55, 1, -0.3)   # spades
    for i in range(6): at(tok(0.35, 260), E['towers'] - 0.2 + i * 0.3, 1, 0.3)
    at(thud(0.1, 70), E['seal'] + 0.05, 1, 0)
    for i in range(8): at(clink(700 + i * 30, 0.02), E['mirrors'] + 0.2 + i * 0.2, 1, 0.4 - i * 0.1)
    # 3. haniwa set down on the mound
    for k_ in ['hClay', 'hHouse', 'hHorse', 'hWarrior', 'hDancers']: at(tok(0.4, 300), E[k_], 1, 0); at(thud(0.04, 120), E[k_] + 0.02, 1, 0)
    # 4. carpenters, the relay, Ise
    for i in range(8): at(tok(0.35, 330 + rs.rand() * 60), E['carpenters'] + 0.2 + i * 0.4, 1, 0.3)
    at(swish(0.8, 400, 1500) * 0.04, E['letter'] + 0.4, 1, 0.1); at(swish(0.6, 400, 1500) * 0.035, E['letter'] + 1.4, 1, 0.1)
    k = E['firm']
    while k < E['ise'] - 1.0: at(tok(0.3, 300 + rs.rand() * 80), k, 1, 0.2 * np.sin(k)); k += 0.75
    for i in range(6): at(tok(0.3, 360), E['iserebuilt'] - 0.4 + i * 0.32, 1, 0.2)
    # 5. bronze poured for the Buddha; the crowd at the cords
    m, tv = tvec(3.0); at(lp(rs.randn(m), 400) * env_ar(m, 0.3, 1.5) * 0.08 + bp(rs.randn(m), 600, 2000) * env_ar(m, 0.2, 1.5) * 0.02 * (0.5 + 0.5 * slow_noise(m, 12, 3)), E['bronzeall'], 1, 0.1)
    at(lp(rs.randn(int(1.4 * SR)), 1600) * np.exp(-np.arange(int(1.4 * SR)) / (0.35 * SR)) * 0.035, E['bronzeall'] + 2.6, 1, 0.1)
    # 6. brushes, a lifted roof
    for i in range(10): at(swish(0.3, 500, 1700) * 0.03, E['kana'] + i * 0.4 + rs.rand() * 0.15, 1, 0.2)
    for i in range(6): at(swish(0.3, 500, 1700) * 0.025, E['murasaki'] + 1.0 + i * 0.7, 1, -0.1)
    for i in range(3):
        m, tv = tvec(0.7); f = 150 + rs.rand() * 80; y = np.sin(TAU * np.cumsum(f * (1 + 0.3 * tv)) / SR) * (np.sin(TAU * 28 * tv) > 0.2) * np.sin(np.pi * tv / tv[-1])
        at(bp(y, 120, 1200) * 0.018, E['roofs'] + 0.2 + i * 0.6, 1, 0)                 # the roof's timbers, creaking up
    # 7. riders, the Mongol fleet, the forge, the plunge
    gallop(E['samurai'] + 0.3, E['samurai'] + 3.0, 0.05, 0.3, 0.4)
    for i in range(8):
        m, tv = tvec(0.7); f = 180 + rs.rand() * 120; y = np.sin(TAU * np.cumsum(f * (1 + 0.3 * tv)) / SR) * (np.sin(TAU * 30 * tv) > 0.2) * np.sin(np.pi * tv / tv[-1])
        at(bp(y, 150, 1500) * 0.02, E['mongols'] + 0.6 + i * 1.2 + rs.rand(), 1, 0.2)
    at(whoosh(3.0, 100, 700) * 0.14, E['kamikaze'] - 0.6, 1, -0.3)
    tt = E['folding']
    for i, d in enumerate([0.6] * 4 + [0.3] * 8 + [0.15] * 16): at(clank(0.05 + 0.02 * (i % 2 == 0), 300 + rs.rand() * 40), tt, 1, 0.2); tt += d
    for i in range(14): at(crackle(0.05), E['folding'] + 0.5 + rs.rand() * 4.5, 1, 0.2 + rs.randn() * 0.2)
    m, tv = tvec(2.6); at(lp(rs.randn(m), 1400) * np.exp(-tv / 0.6) * 0.07 + lp(rs.randn(m), 300) * np.exp(-tv / 0.3) * 0.05, E['plunge'], 1, 0.1)   # the quench: a hiss of steam
    # 8. a pond, a Zen rake, a tea bowl, staples
    for i in range(4): at(lp(swish(1.2, 250, 1000), 1100) * 0.045, E['raked'] + 0.4 + i * 1.3, 1, -0.2)
    at(thud(0.05, 140), E['bowl'] + 0.2, 1, 0.1)
    for i in range(3): at(clank(0.04, 380), E['staples'] + i * 0.4, 1, 0.1)
    at(swish(1.0, 300, 1200) * 0.03, E['gold'] + 0.3, 1, 0)
    # 9. ships, guns, smiths, the tea room, the sword, armies in fog
    for i in range(4): at(flutter(1.2) * 0.04, E['portuguese'] + 0.5 + i * 1.2, 1, 0.4)
    for i in range(3): at(boom(0.07), E['guns'] + 0.4 + i * 0.9, 1, 0.3 - i * 0.2); at(lp(rs.randn(int(0.8 * SR)), 900) * np.exp(-np.arange(int(0.8 * SR)) / (0.25 * SR)) * 0.03, E['guns'] + 0.42 + i * 0.9, 1, 0.3)
    for i in range(8): at(clank(0.05, 340 + rs.rand() * 60), E['ownguns'] + 0.3 + i * 0.45, 1, -0.2)
    m, tv = tvec(1.0); at(lp(bp(rs.randn(m), 200, 900) * np.sin(np.pi * tv / tv[-1]), 1000) * 0.05, E['door'] + 0.1, 1, 0.1)   # a sliding door
    at(tok(0.4, 240), E['sword'] + 0.3, 1, 0.1); at(lp(swish(0.4, 200, 800), 900) * 0.04, E['sword'] + 0.32, 1, 0.1)
    m, tv = tvec(4.0); at(lp(rs.randn(m), 900) * (0.4 + 0.6 * slow_noise(m, 6, 5)) * env_ar(m, 1.0, 1.5) * 0.02, E['rikyu'] + 1.0, 1, -0.2)   # the kettle, singing low
    steps(E['fog'] + 0.4, E['decided'] - 0.6, 0.5, 0.04, -0.2); gallop(E['ieyasu'], E['ieyasu'] + 2.4, 0.04, 0.3, 0.42)
    for i in range(6): at(clank(0.025, 260 + rs.rand() * 100), E['fog'] + 0.8 + i * 0.8 + rs.rand() * 0.3, 1, rs.rand() - 0.5)
    # 10. gates, Edo, sushi, kabuki, fireworks, the frog, the print shop, the wave
    at(thud(0.14, 60), E['closed'] + 0.1, 1, -0.2); at(thud(0.12, 64), E['closed'] + 0.5, 1, 0.2)
    for i in range(3): at(flutter(1.1) * 0.035, E['dutch'] + i * 1.0, 1, 0.4)
    steps(E['edo'] + 0.2, E['kabuki'] - 0.6, 0.38, 0.035, 0.0)                         # geta on the bridge
    for i in range(6): at(tok(0.25, 420), E['sushi'] + 0.3 + i * 0.32, 1, 0.3)          # a knife on the board
    for i, tf in enumerate([419.8, 420.6, 421.3, 422.0, 422.9, 423.6]):
        at(whoosh(0.8, 200, 800) * 0.035, tf - 0.8, 1, -0.4 + i * 0.16); at(boom(0.08), tf + 0.15, 1, -0.4 + i * 0.16)
        for j in range(8): at(crackle(0.025), tf + 0.4 + j * 0.1 + rs.rand() * 0.08, 1, -0.4 + i * 0.16 + rs.randn() * 0.2)
    m, tv = tvec(0.9); f = 260 * np.exp(-tv / 0.15) + 110                               # the frog jumps in
    at(lp(np.sin(TAU * np.cumsum(f) / SR) * np.exp(-tv / 0.18) * 0.6 + lp(rs.randn(m), 900) * np.exp(-tv / 0.06) * 0.4, 1200) * 0.10, E['frog'] + 0.7, 1, 0.1)
    for i in range(3): m, tv = tvec(0.5); at(lp(rs.randn(m), 700) * np.exp(-tv / 0.12) * 0.012, E['frog'] + 1.1 + i * 0.45, 1, 0.1)
    for i in range(10): at(lp(swish(0.25, 600, 1700), 1800) * 0.035, E['carve'] + 0.2 + i * 0.3 + rs.rand() * 0.1, 1, 0.2)   # gouges in cherry wood
    for i in range(4): at(lp(swish(0.9, 250, 1000), 1100) * 0.05, E['colour'] + i * 0.8, 1, -0.1)   # the baren, rubbing
    m, tv = tvec(4.0); at(lp(rs.randn(m), 700) * env_ar(m, 1.2, 2.0) * 0.12 + lp(rs.randn(m), 200) * env_ar(m, 1.5, 2.0) * 0.08, E['wave'] - 0.8, 1, 0.1)   # the wave rises and breaks
    # 11. black ships, cannon, a rickshaw, a train, the battle at Tsushima
    m, tv = tvec(10.0); at(lp(rs.randn(m), 160) * (0.6 + 0.4 * (np.sin(TAU * 2.2 * tv) > 0)) * env_ar(m, 2.0, 2.0) * 0.08, E['blackhulled'], 1, 0.3)   # engines
    for i in range(4): at(boom(0.10), E['salute'] + i * 1.1, 1, 0.3 - i * 0.1)
    at(flutter(1.4) * 0.05, E['shogunfell'] + 0.2, 1, -0.2)
    m, tv = tvec(3.0); at(lp(rs.randn(m), 600) * (0.5 + 0.5 * np.sin(TAU * 7 * tv) ** 2) * env_ar(m, 0.4, 1.0) * 0.025, E['raced'] + 0.2, 1, -0.3)   # rickshaw wheels
    steps(E['raced'] + 0.2, E['raced'] + 3.0, 0.24, 0.04, -0.3)
    m, tv = tvec(0.25); at(lp(swish(0.25, 400, 1500), 1600) * 0.05, E['topknots'] + 0.5, 1, 0.1)   # snip
    k = E['railways']
    for i in range(12): at(lp(rs.randn(int(0.25 * SR)), 500) * np.exp(-np.arange(int(0.25 * SR)) / (0.06 * SR)) * 0.06, k + i * 0.42, 1, -0.4 + i * 0.05)   # a steam engine, chuffing
    for i in range(8): at(boom(0.08), E['russia'] + 0.6 + i * 0.7 + rs.rand() * 0.3, 1, rs.rand() * 1.4 - 0.7)
    # 12. war (restrained)
    for k_ in range(8): at(boom(0.05), E['invaded'] + 0.5 + rs.rand() * 8.0, 1, rs.rand() * 1.6 - 0.8)
    for k_ in range(4): at(whoosh(1.4, 120, 600) * 0.06, E['pearlharbor'] + k_ * 0.6, 1, -0.6 + k_ * 0.4); at(boom(0.09), E['pearlharbor'] + 1.2 + k_ * 0.6, 1, -0.6 + k_ * 0.4)
    for k_ in range(10): at(boom(0.05), E['onenight'] + 0.5 + rs.rand() * 8, 1, rs.rand() * 1.6 - 0.8)
    for i in range(10): at(flutter(0.5) * 0.03, E['sadako'] + 0.6 + i * 0.5, 1, 0.1)          # paper folded
    for i in range(6): at(flutter(0.9) * 0.025, E['cranes'] + 0.4 + i * 0.5, 1, -0.4 + i * 0.16)
    # 13. rebuilding, the line, the train, the Olympics, the bubble
    for i in range(16): at(tok(0.3, 280 + rs.rand() * 120), E['rebuilt'] + 0.2 + i * 0.36 + rs.rand() * 0.1, 1, rs.rand() - 0.5)
    m, tv = tvec(0.6); at(lp(rs.randn(m), 600) * np.exp(-tv / 0.1) * 0.04, E['cord'] - 0.1, 1, 0.2)   # the cord pulled
    at(lp(swish(0.5, 200, 900), 1000) * 0.05, E['olympics'] + 0.2, 1, 0)
    at(whoosh(3.0, 110, 900) * 0.20, E['shinkansen'] + 0.8, 1, -0.5); at(whoosh(2.4, 120, 800) * 0.12, E['billions'] + 1.0, 1, 0.5)
    for i in range(10): at(lp(rs.randn(int(0.08 * SR)), 700) * np.exp(-np.arange(int(0.08 * SR)) / (0.02 * SR)) * 0.04, E['shinkansen'] + 0.4 + i * 0.18, 1, -0.5)   # rail joints
    m, tv = tvec(0.4); at(lp(rs.randn(m), 500) * np.exp(-tv / 0.04) * 0.12, E['burst'] + 0.02, 1, 0)   # pop
    at(whoosh(2.0, 90, 400) * 0.08, E['burst'] + 0.2, 1, 0)
    # 14. a pen, a commuter train, pages, frames, a crossing, cards
    for i in range(10): at(lp(swish(0.35, 300, 1200), 1300) * 0.025, E['tezuka'] - 3.0 + i * 0.5 + rs.rand() * 0.2, 1, 0.1)
    k = E['everyone'] - 2.0
    while k < E['sixmillion']:
        for dt in (0, 0.14): at(lp(rs.randn(int(0.1 * SR)), 450) * np.exp(-np.arange(int(0.1 * SR)) / (0.025 * SR)) * 0.05, k + dt, 1, -0.2)   # the rails: clack-clack
        k += 1.2
    for i in range(6): at(thud(0.05, 110), E['sixmillion'] + 0.3 + i * 0.3, 1, 0.2)
    for i in range(14): at(flutter(0.18) * 0.03, E['framebyframe'] + i * 0.19, 1, 0.1)    # a flip of drawings
    for k_ in range(int((709.4 - 702.4) / 0.5)):                                        # the level crossing: kan, kan (kept low and soft)
        m, tv = tvec(0.45); f = 660 if k_ % 2 else 620
        at(lp(np.sin(TAU * f * tv) * np.exp(-tv / 0.18) + 0.25 * np.sin(TAU * f * 2.01 * tv) * np.exp(-tv / 0.06), 1200) * 0.016, 702.4 + k_ * 0.5, 1, 0.3)
    k = 703.6
    while k < 708.6:
        for dt in (0, 0.12): at(lp(rs.randn(int(0.1 * SR)), 500) * np.exp(-np.arange(int(0.1 * SR)) / (0.025 * SR)) * 0.06, k + dt, 1, 0.2)
        k += 0.55
    at(whoosh(4.0, 110, 700) * 0.10, 704.0, 1, 0.3)
    for i in range(5): at(tok(0.35, 340), E['nintendo'] + 0.4 + i * 0.45, 1, 0.2)          # flower cards slapped down
    # 15. the inn's garden, knives, hammers, the sea, planting, a maglev, a capsule
    for tt_ in (E['inn'] + 1.4, E['y705'] + 0.8):                                     # the shishi-odoshi: bamboo tipping onto stone
        m, tv = tvec(0.5); at(lp(np.sin(TAU * 340 * tv) * np.exp(-tv / 0.06) + 0.5 * np.sin(TAU * 520 * tv) * np.exp(-tv / 0.03) + lp(rs.randn(m), 900) * np.exp(-tv / 0.005), 1400) * 0.08, tt_, 1, 0.3)
    for i in range(8): at(tok(0.3, 400), E['sushichefs'] + 0.4 + i * 0.3, 1, 0.2)
    for i in range(6): at(clank(0.05, 320), E['swordsmiths'] + 0.2 + i * 0.5, 1, -0.2)
    for i in range(5): at(tok(0.3, 360), E['ise2013'] + 0.6 + i * 0.4, 1, 0.1)
    m, tv = tvec(7.0); at(lp(rs.randn(m), 500) * env_ar(m, 1.5, 3.0) * 0.12, E['searose'] + 0.2, 1, 0.2)   # the surge
    for i in range(4): at(lp(swish(0.6, 200, 800), 900) * 0.05, E['cherrytrees'] + i * 0.8, 1, -0.2)
    at(whoosh(3.0, 120, 900) * 0.14, E['floats'] + 0.4, 1, -0.4)
    at(whoosh(2.0, 100, 600) * 0.07, E['asteroids'] + 0.6, 1, 0.2); at(thud(0.05, 80), E['asteroids'] + 2.4, 1, 0.2)
    # 16. the pull-back, the breaks, the mending
    at(whoosh(4.0, 100, 700) * 0.10, E['pull'] - 0.2, 1, 0)
    for k_ in ['broken', 'war', 'fire', 'quake', 'seaend']:                             # each crack opens
        for j in range(6): at(crackle(0.05), E[k_] + j * 0.12 + rs.rand() * 0.05, 1, rs.randn() * 0.3)
        at(thud(0.07, 60), E[k_], 1, 0)
    at(boom(0.08), E['war'] + 0.05, 1, -0.3)
    m, tv = tvec(2.4); at(lp(rs.randn(m), 110) * env_ar(m, 0.1, 1.5) * 0.2, E['quake'] - 0.1, 1, 0)
    for i in range(5): at(lp(swish(1.4, 200, 800), 900) * 0.035, E['mended'] + i * 0.5, 1, -0.4 + i * 0.2)   # a brush laying gold
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
    # Bashō's poem, read in a slightly larger, quieter room
    poem = curve(n, [(0, 0), (424.4, 0), (425.0, 1), (432.6, 1), (433.2, 0), (dur, 0)])
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
