#!/bin/sh
# Baut die App aus src/ zu einer Datei zusammen.
#  - dist/f1-manager.html : Seite für claude.ai (ohne <html>-Gerüst, das kommt beim Veröffentlichen dazu)
#  - index.html           : eigenständige Datei zum Öffnen im Browser
set -e
cd "$(dirname "$0")"
mkdir -p dist
HEAD='<title>F1 Manager</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="theme-color" content="#0E0F14">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Barlow+Semi+Condensed:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;700&display=swap" rel="stylesheet">'
{
  printf '%s\n<style>\n' "$HEAD"
  cat src/style.css
  printf '</style>\n'
  cat src/body.html
  printf '<script>\n'
  cat src/app.js
  printf '</script>\n'
} > dist/f1-manager.html
{
  printf '<!doctype html>\n<html lang="de">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
  printf '%s\n<style>\n' "$HEAD"
  cat src/style.css
  printf '</style>\n</head>\n<body>\n'
  cat src/body.html
  printf '<script>\n'
  cat src/app.js
  printf '</script>\n</body>\n</html>\n'
} > index.html
echo "gebaut: dist/f1-manager.html, index.html"
