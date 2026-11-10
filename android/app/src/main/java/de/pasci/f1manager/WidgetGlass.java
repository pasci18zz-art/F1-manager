package de.pasci.f1manager;

import android.Manifest;
import android.app.WallpaperManager;
import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.Shader;
import android.graphics.drawable.Drawable;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.util.DisplayMetrics;
import android.view.WindowManager;

import java.io.File;
import java.io.FileOutputStream;

/**
 * Milchglas für Widgets. Android kann hinter RemoteViews nicht weichzeichnen, deshalb:
 * Hintergrundbild lesen, auf Bildschirmgröße bringen, weichzeichnen, den Ausschnitt hinter dem
 * Widget herausschneiden und als Bild unter das Widget legen.
 *
 * Quelle des Hintergrundbilds: das echte Hintergrundbild (ab Android 13 nur mit „Zugriff auf alle Dateien“)
 * oder ein Bild, das der Nutzer in der Einrichtung selbst wählt.
 */
final class WidgetGlass {
    private static final int SCALE = 4;          // Bildschirm wird auf 1/4 verkleinert, das macht die Unschärfe schnell
    private static final int RADIUS = 9;         // Weichzeichnen auf 1/4 Größe ≈ 36 px auf dem Bildschirm
    private static final String PICKED = "glass_wallpaper.jpg";
    private static final String BLUR = "glass_blur.png";

    private WidgetGlass() {}

    static SharedPreferences prefs(Context ctx) { return WidgetData.cfg(ctx); }

    /** "glass" oder "tint" für dieses Widget. */
    static String modeOf(Context ctx, int id) { return prefs(ctx).getString("bg_" + id, "glass"); }
    static void setMode(Context ctx, int id, String m) { prefs(ctx).edit().putString("bg_" + id, m).apply(); }

    static boolean canReadWallpaper(Context ctx) {
        if (Build.VERSION.SDK_INT >= 30 && Environment.isExternalStorageManager()) return true;
        if (Build.VERSION.SDK_INT >= 33) return false;
        return ctx.checkSelfPermission(Manifest.permission.READ_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED;
    }

    static boolean hasPicked(Context ctx) { return new File(ctx.getFilesDir(), PICKED).exists(); }

    static void savePicked(Context ctx, Bitmap bmp) throws Exception {
        try (FileOutputStream out = new FileOutputStream(new File(ctx.getFilesDir(), PICKED))) {
            bmp.compress(Bitmap.CompressFormat.JPEG, 88, out);
        }
        prefs(ctx).edit().putString("glass_sig", "").apply();
    }

    static void clearPicked(Context ctx) {
        new File(ctx.getFilesDir(), PICKED).delete();
        prefs(ctx).edit().putString("glass_sig", "").apply();
    }

    /** Position des Widgets auf dem Bildschirm, gemeldet vom Launcher beim Antippen. */
    static void saveBounds(Context ctx, int id, Rect r) {
        if (r == null || r.width() <= 0) return;
        prefs(ctx).edit().putString("bounds_" + id, r.left + "," + r.top + "," + r.right + "," + r.bottom).apply();
    }

    static boolean hasBounds(Context ctx, int id) { return prefs(ctx).contains("bounds_" + id); }

    static void forget(Context ctx, int id) { prefs(ctx).edit().remove("bounds_" + id).remove("bg_" + id).apply(); }

    /** Gespeicherte Position (nach Antippen) oder null. */
    static Rect boundsOf(Context ctx, int id) {
        String b = prefs(ctx).getString("bounds_" + id, null);
        if (b == null) return null;
        try {
            String[] p = b.split(",");
            return new Rect(Integer.parseInt(p[0]), Integer.parseInt(p[1]), Integer.parseInt(p[2]), Integer.parseInt(p[3]));
        } catch (Exception e) { return null; }
    }

    private static Rect bounds(Context ctx, int id, int sw, int sh) {
        String b = prefs(ctx).getString("bounds_" + id, null);
        if (b != null) {
            try {
                String[] p = b.split(",");
                return new Rect(Integer.parseInt(p[0]), Integer.parseInt(p[1]), Integer.parseInt(p[2]), Integer.parseInt(p[3]));
            } catch (Exception ignored) {}
        }
        // Noch unbekannt: Größe aus den Widget-Optionen, Position grob in der Bildschirmmitte
        Bundle o = AppWidgetManager.getInstance(ctx).getAppWidgetOptions(id);
        float dens = ctx.getResources().getDisplayMetrics().density;
        int w = Math.round(o.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 300) * dens);
        int h = Math.round(o.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 160) * dens);
        int l = (sw - w) / 2, t = sh / 3 - h / 2;
        return new Rect(l, t, l + w, t + h);
    }

    private static int[] screen(Context ctx) {
        DisplayMetrics m = new DisplayMetrics();
        WindowManager wm = (WindowManager) ctx.getSystemService(Context.WINDOW_SERVICE);
        wm.getDefaultDisplay().getRealMetrics(m);
        int w = Math.min(m.widthPixels, m.heightPixels), h = Math.max(m.widthPixels, m.heightPixels);
        return new int[] { w, h };
    }

    /** Woher das Bild kommt und ob es sich geändert hat. */
    private static String signature(Context ctx) {
        if (canReadWallpaper(ctx)) {
            try { return "wp:" + WallpaperManager.getInstance(ctx).getWallpaperId(WallpaperManager.FLAG_SYSTEM); }
            catch (Exception ignored) {}
        }
        File f = new File(ctx.getFilesDir(), PICKED);
        return f.exists() ? "pick:" + f.lastModified() : null;
    }

    private static Drawable source(Context ctx) {
        if (canReadWallpaper(ctx)) {
            try {
                Drawable d = WallpaperManager.getInstance(ctx).getDrawable();
                if (d != null) return d;
            } catch (Throwable ignored) {}
        }
        File f = new File(ctx.getFilesDir(), PICKED);
        if (f.exists()) {
            BitmapFactory.Options op = new BitmapFactory.Options();
            op.inSampleSize = 2;
            Bitmap b = BitmapFactory.decodeFile(f.getAbsolutePath(), op);
            if (b != null) return new android.graphics.drawable.BitmapDrawable(ctx.getResources(), b);
        }
        return null;
    }

    /** Weichgezeichneter Bildschirm in 1/4 Größe, zwischengespeichert. */
    private static Bitmap blurredScreen(Context ctx) {
        String sig = signature(ctx);
        if (sig == null) return null;
        int[] s = screen(ctx);
        String full = sig + "|" + s[0] + "x" + s[1];
        File cache = new File(ctx.getFilesDir(), BLUR);
        if (full.equals(prefs(ctx).getString("glass_sig", "")) && cache.exists()) {
            Bitmap b = BitmapFactory.decodeFile(cache.getAbsolutePath());
            if (b != null) return b;
        }
        Drawable d = source(ctx);
        if (d == null) return null;
        int w = Math.max(1, s[0] / SCALE), h = Math.max(1, s[1] / SCALE);
        Bitmap small = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(small);
        int iw = Math.max(1, d.getIntrinsicWidth()), ih = Math.max(1, d.getIntrinsicHeight());
        float sc = Math.max((float) w / iw, (float) h / ih);   // wie der Launcher: Bildschirm füllen, mittig
        int dw = Math.round(iw * sc), dh = Math.round(ih * sc);
        int dx = (w - dw) / 2, dy = (h - dh) / 2;
        d.setBounds(dx, dy, dx + dw, dy + dh);
        d.draw(c);
        boxBlur(small, RADIUS);
        boxBlur(small, RADIUS);
        boxBlur(small, RADIUS);
        try (FileOutputStream out = new FileOutputStream(cache)) {
            small.compress(Bitmap.CompressFormat.PNG, 100, out);
            prefs(ctx).edit().putString("glass_sig", full).apply();
        } catch (Exception ignored) {}
        return small;
    }

    /** Glas-Bild für ein Widget, oder null (dann bleibt die halbdurchsichtige Fläche). */
    static Bitmap render(Context ctx, int id, boolean dark) {
        if (!"glass".equals(modeOf(ctx, id))) return null;
        try {
            Bitmap scr = blurredScreen(ctx);
            if (scr == null) return null;
            int[] s = screen(ctx);
            Rect b = bounds(ctx, id, s[0], s[1]);
            Rect src = new Rect(b.left / SCALE, b.top / SCALE, b.right / SCALE, b.bottom / SCALE);
            src.intersect(0, 0, scr.getWidth(), scr.getHeight());
            if (src.width() <= 1 || src.height() <= 1) return null;
            float dens = ctx.getResources().getDisplayMetrics().density;
            int ow = Math.max(2, b.width() / 2), oh = Math.max(2, b.height() / 2);
            Bitmap out = Bitmap.createBitmap(ow, oh, Bitmap.Config.ARGB_8888);
            Canvas c = new Canvas(out);
            float r = Math.min(26f, Math.min(b.width(), b.height()) / dens * 0.28f) * dens / 2;
            RectF all = new RectF(0, 0, ow, oh);
            Paint p = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.FILTER_BITMAP_FLAG);
            // abgerundete Form, darin der weichgezeichnete Ausschnitt
            c.drawRoundRect(all, r, r, p);
            p.setXfermode(new android.graphics.PorterDuffXfermode(android.graphics.PorterDuff.Mode.SRC_IN));
            c.drawBitmap(scr, src, all, p);
            p.setXfermode(null);
            // Tönung wie die Leiste in der App
            p.setShader(null);
            p.setColor(dark ? 0x80121419 : 0x8CFFFFFF);
            c.drawRoundRect(all, r, r, p);
            // leichter Glanz von oben
            p.setShader(new LinearGradient(0, 0, 0, oh * 0.6f, dark ? 0x1FFFFFFF : 0x33FFFFFF, 0x00FFFFFF, Shader.TileMode.CLAMP));
            c.drawRoundRect(all, r, r, p);
            p.setShader(null);
            // feiner Rand
            p.setStyle(Paint.Style.STROKE);
            p.setStrokeWidth(Math.max(1f, dens / 2));
            p.setColor(dark ? 0x26FFFFFF : 0xB3FFFFFF);
            RectF in = new RectF(0.5f, 0.5f, ow - 0.5f, oh - 0.5f);
            c.drawRoundRect(in, r, r, p);
            return out;
        } catch (Throwable e) {
            return null;
        }
    }

    /** Schnelles Weichzeichnen (Box-Blur, waagrecht und senkrecht). */
    private static void boxBlur(Bitmap bmp, int rad) {
        int w = bmp.getWidth(), h = bmp.getHeight();
        int[] px = new int[w * h], tmp = new int[w * h];
        bmp.getPixels(px, 0, w, 0, 0, w, h);
        pass(px, tmp, w, h, rad, true);
        pass(tmp, px, w, h, rad, false);
        bmp.setPixels(px, 0, w, 0, 0, w, h);
    }

    private static void pass(int[] in, int[] out, int w, int h, int rad, boolean horiz) {
        int len = horiz ? w : h, lines = horiz ? h : w, div = rad * 2 + 1;
        for (int l = 0; l < lines; l++) {
            int ta = 0, tr = 0, tg = 0, tb = 0;
            for (int i = -rad; i <= rad; i++) {
                int c = in[idx(l, clampI(i, len), w, horiz)];
                ta += c >>> 24; tr += (c >> 16) & 255; tg += (c >> 8) & 255; tb += c & 255;
            }
            for (int i = 0; i < len; i++) {
                out[idx(l, i, w, horiz)] = ((ta / div) << 24) | ((tr / div) << 16) | ((tg / div) << 8) | (tb / div);
                int add = in[idx(l, clampI(i + rad + 1, len), w, horiz)], rem = in[idx(l, clampI(i - rad, len), w, horiz)];
                ta += (add >>> 24) - (rem >>> 24);
                tr += ((add >> 16) & 255) - ((rem >> 16) & 255);
                tg += ((add >> 8) & 255) - ((rem >> 8) & 255);
                tb += (add & 255) - (rem & 255);
            }
        }
    }

    private static int clampI(int v, int len) { return v < 0 ? 0 : (v >= len ? len - 1 : v); }
    private static int idx(int line, int i, int w, boolean horiz) { return horiz ? line * w + i : i * w + line; }
}
