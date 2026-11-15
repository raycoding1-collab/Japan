# The Long Thread

A twelve-and-a-half-minute narrated film about the history of China, made of paper, cardboard and code:
from a nine-thousand-year-old bone flute to the far side of the Moon. A tiny paper planet turns at the
bottom of the screen; each stretch of it is an age, and the next one is always rising over the horizon.
A red thread, stitched into the ground, runs through the whole of it.

Sixteen chapters: the bone flute and the first fields; Shang bronze and oracle bones; the hundred
schools; the First Emperor and his clay army; the Han and the Silk Road; the long division; the Tang;
the Song's inventions; the Mongols and the Ming; the last dynasty; war and revolution; Mao's China;
opening up; today; the breakthroughs (the Three Gorges, the Hong Kong–Zhuhai–Macao bridge, the
Huajiang canyon bridge, Hefei's artificial sun, quantum satellites and computers, humanoid robots,
dark factories, solar, wind and forests); and the long thread.

## Watch it

**https://tinyurl.com/the-long-thread** (with sound), which redirects to
https://raycoding1-collab.github.io/China-/. Built to be opened anywhere, including from an Instagram DM
on iPhone and Android. It is published from the `gh-pages` branch: run `tools/publish_pages.sh` to update it.

## Watch it locally

```sh
python3 -m http.server 8765
# open http://localhost:8765/ and press Begin (with sound)
```

`?t=SECONDS` freezes the film on one frame (used for checking frames).

## How it is made

- `film/film.json`: the master script, with narration lines, chapters and the times of every event.
- `src/film.js`: the film itself: the camera path, every cut-out's place on the globe, the paint of each era, sky and light over time, and the special moments.
- `src/engine.js`: the stage: the stacked turning discs, light, smoke, film grain and pop-up springs.
- `src/paper.js`: the cardboard material (hand-cut edges, board thickness, paper grain, uneven paint, shadows).
- `src/people.js`, `src/kinds_nature.js`, `src/kinds_built.js`, `src/cutouts.js`: the shared cut-outs.
- `src/kinds_china.js`: China from the Neolithic to the 1980s (halls of every dynasty, the Wall, the terracotta army, Sanxingdui, junks and treasure ships...).
- `src/kinds_modern_china.js`: the modern era, each built for its subject (Shanghai Tower, Fuxing trains, Long March 5, the Three Gorges, the HZMB pylons, the EAST tokamak, Micius, humanoid robots, robot arms).
- `src/sky_china.js`, `src/sky_borrowed.js`: the close-up cards hung on threads (the bone flute, oracle bones, Zhang Heng's seismoscope, the compass, the qilin...).
- `src/sound.js`: playback; the soundtrack is the clock, and paper flaps are played live as cut-outs spring up.
- `src/timeline.js`: generated; do not edit.

## Rebuilding the soundtrack

The narration is synthesised locally with [Kokoro](https://github.com/thewh1teagle/kokoro-onnx)
(a blend of two British male voices); Chinese names are respelt in `tools/narrate.py` so it says them close to Mandarin.
The score (guzheng, erhu, dizi, xiao, guqin, pipa, bronze bells, gong, sheng, and later piano and synths, on one
pentatonic theme first heard on the bone flute), the ambience and the effects are synthesised in Python, kept
below about 3 kHz so nothing is piercing.

```sh
python3 -m venv /home/user/tts/venv
/home/user/tts/venv/bin/pip install kokoro-onnx soundfile numpy scipy
# put kokoro-v1.0.onnx and voices-v1.0.bin (release model-files-v1.0) in /home/user/tts
/home/user/tts/venv/bin/python tools/narrate.py film/film.json     # times the narration, writes src/timeline.js
/home/user/tts/venv/bin/python tools/build_audio.py film/film.json # builds assets/audio/film.mp3
```

## Checking frames

```sh
node tools/sheet.mjs NAME "30,86.5,150.8" 1440x810 3   # contact sheet -> shots/sheet_NAME.jpg
node tools/crop.mjs out.png 87 1440x810 1 520,250,420,300
node tools/play.mjs 390x844 8                           # real-time playback test
```

## Made with the `paperfilm` skill

This film was made with the `paperfilm` skill and the "Everything So Far" engine from the
`raycoding1-collab/Globe` repository; the engine files here are that template, extended for China.
