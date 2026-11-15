#!/bin/sh
# Package the "paperfilm" skill: the guides in skill/paperfilm plus a finished film's code as its template.
# usage: TEMPLATE=/path/to/newest/film sh tools/make_skill.sh [path/to/skill-creator]   -> skill/paperfilm.skill
# TEMPLATE defaults to this project; use the newest, most capable film (now "The Long Thread", repo China-).
set -e
cd "$(dirname "$0")/.."
ROOT=$(pwd)
TPL=${TEMPLATE:-$ROOT}
SC=${1:-$(ls -d /root/.claude/skills/synced/*/skill-creator 2>/dev/null | head -1)}
STAGE="$ROOT/.cache/skill-stage"
rm -rf "$STAGE"
T="$STAGE/paperfilm/assets/template"
mkdir -p "$T/film" "$T/src" "$T/tools" "$T/assets"
cp -R skill/paperfilm/. "$STAGE/paperfilm/"
cp "$TPL/index.html" "$TPL/README.md" "$T/"
cp "$TPL/film/film.json" "$T/film/"
if [ -f "$TPL/film/PLAN.md" ]; then cp "$TPL/film/PLAN.md" "$T/film/"; fi
cp "$TPL"/src/*.js "$TPL"/src/*.css "$T/src/"
cp "$TPL"/tools/*.mjs "$TPL"/tools/*.py "$TPL"/tools/*.sh "$T/tools/"
cp "$TPL/assets/share.jpg" "$TPL/assets/icon.png" "$T/assets/"
# the soundtrack is rebuilt by tools/build_audio.py, so it stays out of the skill
cd "$SC" && python3 -m scripts.package_skill "$STAGE/paperfilm" "$ROOT/skill"
