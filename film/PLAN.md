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

## Scheduled restarts
- None. The user asked to stop the restarts ("continue when we talk next"); both were deleted.

## Status
- [x] Template copied, tools installed (Playwright symlink, Kokoro venv in /home/user/tts), servers
- [x] Research + script + narration timing (tools/layout.py lays out film.json's narration; 86 lines, 847 s)
- [x] All sixteen chapters built and judged at desktop size (src/ch01..ch16)
- [x] Light script (ERAS + WX) for every era; crossfades checked
- [x] Score + ambience (shakuhachi, koto, shamisen, biwa, taiko, shō, temple bell, tonkori, sanshin; piano, city pop, orchestra)
- [x] Full sweep (every 3 s) and its fixes
- [x] Phone and phone-sideways sheets for every chapter; automated checks (scan 0 errors at both sizes, playtest, endtest, inapp x4, starttrace; memory: see report)
- [x] Share image, icon, README
- [x] Published: https://raycoding1-collab.github.io/Japan/ (gh-pages), short link https://tinyurl.com/mended-with-gold-japan

## Architecture
- `src/film_api.js`: shared tables (CAM, ZONES, SEAS, BUMPS, SKY/AMB/GRADE, ERAS, WX, NIGHTS, SUNS, ZOOM, FLOCKS, PAPER_SUN, MILKY, SEAMS) and helpers (add, hook, card, closeUp, drop...).
- `src/chNN_*.js`: one module per chapter: its camera keys, ground, cut-outs, hooks, light and weather.
- `src/film.js`: assembles them; ground, sky, weather (mist, fog, petals, maple, rain, ash, snowfall, embers, kasumi), seams (kintsugi cracks: open at t0, gold at t1).
- `src/kinds_japan.js` (pre-modern cut-outs), `src/sky_japan.js` (cards; `brush()` writes kanji/kana stroke by stroke).
- Events: film/film.json `events`, then `tools/narrate.py` regenerates src/timeline.js.
