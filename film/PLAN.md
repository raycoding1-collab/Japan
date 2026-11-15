# Mended with Gold — production plan

A paperfilm (skill: `raycoding1-collab/Globe`, branch `ccr-f077ed5e-n128tc`, `skill/paperfilm/`) about the
whole history of Japan, about 13.5 minutes. Title: **Mended with Gold**, kicker: *a history of Japan, in paper*.

The motif: **kintsugi**. In Muromachi a cracked tea bowl is mended with lacquer and gold (the story of the
shogun's bowl sent to China). From then on, every time the country breaks (Kyoto burning in the Ōnin war,
1945, 2011) a crack opens in the cardboard ground, and when it rebuilds the crack fills with gold. In the
pull-back at the end, all the golden seams shine across the whole little planet: the country as a bowl
mended with gold. The first sound (a low shakuhachi phrase at the Jōmon fire) returns.

The thread through it all: **the hand and the craft**: Jōmon potters, haniwa, temple carpenters, Ise rebuilt
every 20 years, the Nara eye-opening brush, kana calligraphy, the swordsmith, Noh, the tea room, woodblock
prints, kaizen, the animators, the sushi masters.

## Scheduled restarts (user's request, usage resets)
- `trig_01R852ZTmK4cZKegTn5Le9j4` at 16:35 UTC, `trig_01JjjZcQec7LWW5B24LwtU57` at 21:35 UTC (2026-11-15).
  Delete whichever is left once the film is finished.

## Status
- [x] Template copied, tools installed (Playwright symlink, Kokoro venv in /home/user/tts), servers
- [x] Research + script + narration timing (tools/layout.py lays out film.json's narration; 86 lines, 847 s)
- [x] Chapter 1 built and judged (desktop, phone, phone sideways)
- [ ] All chapters built: done ch1-7 (src/ch01..ch07); next ch08 Muromachi, ch09 Sengoku, ch10 Edo, ch11 Meiji, ch12 war, ch13 miracle, ch14 manga/anime, ch15 today, ch16 ending (kintsugi pull-back, SEAMS in film.js)
- [ ] Light script (ERAS + WX) for every era
- [ ] Score + ambience (shakuhachi, koto, shamisen, biwa, taiko, shō, temple bell)
- [ ] Review rounds + full sweep + automated checks
- [ ] Share image, icon, README, publish (GitHub Pages + TinyURL)

## Architecture
- `src/film_api.js`: shared tables (CAM, ZONES, SEAS, BUMPS, SKY/AMB/GRADE, ERAS, WX, NIGHTS, SUNS, ZOOM, FLOCKS, PAPER_SUN, MILKY, SEAMS) and helpers (add, hook, card, closeUp, drop...).
- `src/chNN_*.js`: one module per chapter: its camera keys, ground, cut-outs, hooks, light and weather.
- `src/film.js`: assembles them; ground, sky, weather (mist, fog, petals, maple, rain, ash, snowfall, embers, kasumi), seams (kintsugi cracks: open at t0, gold at t1).
- `src/kinds_japan.js` (pre-modern cut-outs), `src/sky_japan.js` (cards; `brush()` writes kanji/kana stroke by stroke).
- Events: film/film.json `events`, then `tools/narrate.py` regenerates src/timeline.js.
