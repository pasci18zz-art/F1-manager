// Bündelt die Capacitor-Plugins für die Android-App.
// esbuild macht daraus eine Datei, die als window.F1N bereitsteht.
import { Capacitor, SystemBars, SystemBarsStyle } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Clipboard } from "@capacitor/clipboard";
import { Preferences } from "@capacitor/preferences";
import { Camera, MediaTypeSelection } from "@capacitor/camera";

window.F1N = {
  Capacitor, SystemBars, SystemBarsStyle,
  App, Filesystem, Directory, Encoding, Share, Clipboard, Preferences, Camera, MediaTypeSelection,
  native: Capacitor.isNativePlatform()
};
