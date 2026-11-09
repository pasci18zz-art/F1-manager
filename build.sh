#!/bin/sh
# Baut die App aus src/.
#  - www/index.html + www/native.js : Android-App (Capacitor) und eigenständige Version für den Browser
#  - dist/f1-manager.html           : Seite für claude.ai (ohne <html>-Gerüst, das kommt beim Veröffentlichen dazu)
set -e
cd "$(dirname "$0")"
mkdir -p dist www
HEAD='<title>F1 Manager</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="theme-color" content="#0E0F14">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Barlow+Semi+Condensed:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;700&display=swap" rel="stylesheet">'

# claude.ai
{
  printf '%s\n<style>\n' "$HEAD"
  cat src/style.css
  printf '</style>\n'
  cat src/body.html
  printf '<script>\n'
  cat src/app.js
  printf '</script>\n'
} > dist/f1-manager.html

# App: Claude-SDK und Capacitor-Plugins als eine Datei
npx esbuild src/native.js --bundle --minify --format=iife --platform=browser --target=chrome100 --log-level=warning --outfile=www/native.js
{
  printf '<!doctype html>\n<html lang="de">\n<head>\n<meta charset="utf-8">\n'
  printf '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
  printf '%s\n<style>\n' "$HEAD"
  cat src/style.css
  # Ohne claude.ai-Rahmen: Abstand zu Statusleiste und Gestenleiste selbst setzen
  printf 'body{padding-top:var(--sat)}\n.app{padding-bottom:calc(120px + var(--sab))}\nhtml{background:var(--bg)}\n'
  printf '</style>\n</head>\n<body>\n'
  cat src/body.html
  printf '<script src="native.js"></script>\n<script>\n'
  cat src/app.js
  printf '</script>\n</body>\n</html>\n'
} > www/index.html
echo "gebaut: www/index.html, www/native.js, dist/f1-manager.html"
