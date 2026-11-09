# F1 Manager

Meisterschafts-App für die Karriere im F1-Spiel: Wertung, Rennwochenenden, Statistiken, Titelprognose und Teamentwicklung.
Hell- und Dunkelmodus, Animationen, eigene Team-Logos, Teamvergleich und schnelles Eintragen per Anfangsbuchstaben.

## Android-App

Jeder Push baut über GitHub Actions eine neue APK und legt sie als Release ab:
**https://github.com/pasci18zz-art/F1-manager/releases/latest/download/F1-Manager.apk**

Der Signaturschlüssel liegt nicht im Repository. Der Workflow erzeugt ihn einmal und bewahrt ihn im internen
Actions-Cache auf. Damit er dauerhaft gleich bleibt (auch wenn länger als 7 Tage nicht gebaut wird), kann er als
Repository-Secret hinterlegt werden: `ANDROID_KEYSTORE_BASE64` (Keystore als Base64) und `ANDROID_KEYSTORE_PASSWORD`.

## Aufbau

- `src/` – Quellcode der App (`style.css`, `body.html`, `app.js`, `native.js` für die Android-Plugins)
- `build.sh` – baut `www/` (Android-App und Browser) und `dist/f1-manager.html` (Version für claude.ai)
- `android/` – Capacitor-Projekt für Android
- `.github/workflows/android.yml` – baut die APK

Lokal bauen: `npm ci && npm run android`, danach `cd android && ./gradlew assembleRelease`.

## Daten

Daten bleiben auf dem Gerät. Über Einstellungen → Daten & Sync lassen sie sich als Text oder Datei sichern
und auf einem anderen Gerät wieder einfügen. Sicherungen der alten HTML-Datei werden beim Import erkannt.
