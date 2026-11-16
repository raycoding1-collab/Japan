# Mended with Gold

A fourteen-minute narrated film about the history of Japan, made of paper, cardboard and code:
from the world's oldest pots, fired by the Jōmon fifteen thousand years ago, to a train that floats at
six hundred kilometres an hour. A tiny paper planet turns at the bottom of the screen; each stretch of it
is an age, and the next one is always rising over the horizon. When the country breaks, cracks open in the
ground; when it mends, they fill with gold, like a tea bowl repaired by kintsugi.

Sixteen chapters: clay and fire (the Jōmon); rice and mirrors (the Yayoi and Queen Himiko); keyholes (the
kofun and their haniwa); the rising sun (Buddhism, Prince Shōtoku, Hōryū-ji, Ise rebuilt every twenty
years); the Great Buddha of Nara; the court of beauty (Heian-kyō, kana and The Tale of Genji); the
warriors (the shoguns, the Mongol storms, the folded sword); gold and stillness (Kinkaku-ji, Noh, the Zen
garden, kintsugi); guns and tea (the warlords, Himeji, Sen no Rikyū, Sekigahara); the floating world (Edo,
kabuki, fireworks, Bashō's frog, the woodblock print and the Great Wave); black ships (Meiji, the Ainu,
Ryukyu, Tsushima); empire and ashes (told with restraint, and Sadako's cranes); the miracle (kaizen, the
pocket radio, 1964 and the Shinkansen, the bubble); ink and light (Tezuka, manga, anime drawn frame by
frame, an anime summer, Nintendo's playing cards); the hands (the old crafts, 2011, the warning stones,
cherry trees where the water stopped); and mended with gold.

## Watch it

https://raycoding1-collab.github.io/Japan/ (with sound). Built to be opened anywhere, including from an
Instagram DM on iPhone and Android. It is published from the `gh-pages` branch: run
`tools/publish_pages.sh` to update it.

## Watch it locally

```sh
python3 -m http.server 8765
# open http://localhost:8765/ and press Begin (with sound)
```

`?t=SECONDS` freezes the film on one frame (used for checking frames).

## How it is made

- `film/film.json`: the master script, with narration lines, chapters and the times of every event
  (`tools/layout.py` lays the narration out).
- `src/film.js`: the film's frame: the camera path, the ground and sea of each era, sky and light over
  time, weather, the kintsugi seams. Each chapter adds its own scenes in `src/ch01_jomon.js` …
  `src/ch16_gold.js`, through the shared tracks in `src/film_api.js`.
- `src/engine.js`: the stage: the stacked turning discs, light, smoke, film grain and pop-up springs.
- `src/paper.js`: the cardboard material (hand-cut edges, board thickness, paper grain, uneven paint, shadows).
- `src/people.js`: the paper people, with Japanese hair, hats, armour, kimono and props.
- `src/kinds_japan.js`: Japan from the Jōmon to Meiji (pit dwellings and flame pots, dōtaku, kofun and
  haniwa, pagodas and Ise, the Great Buddha, Heian halls, Kinkaku-ji, Himeji, the Edo city, the Great
  Wave, black ships...).
- `src/kinds_modern_japan.js`: the modern era, each built for its subject (Tokyo Tower, the Shinkansen,
  the Toyota line, neon Tokyo, a manga studio, a level crossing, the Skytree, a maglev).
- `src/sky_japan.js`: the close-up cards hung on threads (the first pot, Himiko's seal, haniwa, the
  letter to China, the Noh mask, the kintsugi bowl, the woodblock print, the pocket radio...).
- `src/sound.js`: playback; the soundtrack is the clock, and paper flaps are played live as cut-outs spring up.
- `src/timeline.js`: generated; do not edit.

## Rebuilding the soundtrack

The narration is synthesised locally with [Kokoro](https://github.com/thewh1teagle/kokoro-onnx)
(a blend of two British male voices); Japanese names are respelt in `tools/narrate.py` so it says them
close to Japanese. The score is synthesised in Python on Japanese instruments (shakuhachi, koto,
shamisen, biwa, taiko, shō, temple bell, and the Ainu tonkori and Okinawan sanshin), growing into piano,
1980s city pop and an orchestra, on one theme in the yo scale first heard on a shakuhachi by the Jōmon
fire. The ambience and effects are synthesised too, kept below about 3 kHz so nothing is piercing.

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
```

## Made with the `paperfilm` skill

This film was made with the `paperfilm` skill from the `raycoding1-collab/Globe` repository; the engine
files here are its template, extended for Japan.
