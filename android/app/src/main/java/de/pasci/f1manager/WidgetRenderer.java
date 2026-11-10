package de.pasci.f1manager;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;
import android.graphics.Typeface;
import android.text.TextPaint;
import android.text.TextUtils;

import androidx.core.content.res.ResourcesCompat;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

/** Zeichnet jedes Widget als Bild: Milchglas, App-Schrift, Teamfarben, hell und dunkel. Maße in dp. */
final class WidgetRenderer {
    static final int[] RACE_PTS = { 0, 25, 18, 15, 12, 10, 8, 6, 4, 2, 1 };

    // Farben
    final boolean dark;
    final int ink, sub, faint, line, tile, accent, accentInk, green, red, gold, silver, bronze;
    // Schriften
    final Typeface black, bold, semi, semiBold;

    private Canvas c;
    private float W, H;
    private final TextPaint tp = new TextPaint(Paint.ANTI_ALIAS_FLAG | Paint.SUBPIXEL_TEXT_FLAG);
    private final Paint pp = new Paint(Paint.ANTI_ALIAS_FLAG);

    WidgetRenderer(Context ctx, boolean dark) {
        this.dark = dark;
        ink = dark ? 0xFFF2F3F7 : 0xFF12141A;
        sub = dark ? 0xFFA9AEBD : 0xFF4F5667;
        faint = dark ? 0xFF7F8598 : 0xFF6B7282;
        line = dark ? 0x26FFFFFF : 0x1F12141A;
        tile = dark ? 0x14FFFFFF : 0x99FFFFFF;
        accent = dark ? 0xFFFF5A36 : 0xFFE2401C;
        accentInk = dark ? 0xFF1A0A05 : 0xFFFFFFFF;
        green = dark ? 0xFF2FD47A : 0xFF11834A;
        red = dark ? 0xFFFF6B78 : 0xFFC92A3B;
        gold = dark ? 0xFFFFC93C : 0xFFA87700;
        silver = dark ? 0xFFC9CED8 : 0xFF667080;
        bronze = dark ? 0xFFD9925B : 0xFFA35E2B;
        black = font(ctx, R.font.barlow_condensed_black, Typeface.DEFAULT_BOLD);
        bold = font(ctx, R.font.barlow_condensed_bold, Typeface.DEFAULT_BOLD);
        semi = font(ctx, R.font.barlow_semi_semibold, Typeface.DEFAULT);
        semiBold = font(ctx, R.font.barlow_semi_bold, Typeface.DEFAULT_BOLD);
    }

    private static Typeface font(Context ctx, int id, Typeface fb) {
        try { Typeface t = ResourcesCompat.getFont(ctx, id); return t == null ? fb : t; } catch (Exception e) { return fb; }
    }

    int posColor(int rank) { return rank == 1 ? gold : rank == 2 ? silver : rank == 3 ? bronze : sub; }

    /** Hauptfunktion: Bild in Pixelgröße wDp*scale × hDp*scale. */
    Bitmap render(String kind, float wDp, float hDp, float scale, Bitmap glass, JSONObject season, Sel sel) {
        int pw = Math.max(2, Math.round(wDp * scale)), ph = Math.max(2, Math.round(hDp * scale));
        Bitmap bmp = Bitmap.createBitmap(pw, ph, Bitmap.Config.ARGB_8888);
        c = new Canvas(bmp);
        c.scale(scale, scale);
        W = wDp; H = hDp;
        float r = Math.min(26, Math.min(W, H) * 0.28f);
        background(glass, r, pw, ph, scale);
        JSONArray ds = season == null ? null : season.optJSONArray("drivers");
        if (ds == null || ds.length() == 0) {
            text("Öffne die App einmal,", W / 2, H / 2 - 4, 13, sub, semi, Paint.Align.CENTER, W - 20);
            text("dann erscheint hier die Wertung.", W / 2, H / 2 + 13, 13, sub, semi, Paint.Align.CENTER, W - 20);
            return bmp;
        }
        try {
            switch (kind) {
                case "place": place(season, sel); break;
                case "next1": next1(season); break;
                case "leader": leader(season); break;
                case "driver": driver(season, sel); break;
                case "rival": rival(season, sel); break;
                case "progress": progress(season); break;
                case "calendar": calendar(season, sel); break;
                case "top3c": top3c(season); break;
                case "next2": next2(season); break;
                case "duel": duel(season, sel); break;
                case "team": team(season, sel); break;
                case "podium": podium(season); break;
                case "mine": mine(season, sel); break;
                case "constructors": constructors(season); break;
                case "lastrace": lastRace(season, sel); break;
                case "top5": top5(season); break;
                case "top8": standings(season); break;
                case "graph": graph(season); break;
                case "dash": dash(season, sel); break;
                default: top3(season); break;
            }
        } catch (Exception e) {
            text("Widget konnte nicht gezeichnet werden", W / 2, H / 2, 12, sub, semi, Paint.Align.CENTER, W - 20);
        }
        return bmp;
    }

    /** Auswahl aus der Einrichtung. */
    static final class Sel {
        List<JSONObject> drivers = new ArrayList<>();
        JSONObject team;
    }

    // ---------- Hintergrund ----------
    private void background(Bitmap glass, float r, int pw, int ph, float scale) {
        RectF all = new RectF(0, 0, W, H);
        if (glass != null) {
            c.save();
            c.scale(1f / scale, 1f / scale);
            Paint gp = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.FILTER_BITMAP_FLAG);
            c.drawBitmap(glass, null, new RectF(0, 0, pw, ph), gp);
            c.restore();
            return;
        }
        pp.setStyle(Paint.Style.FILL);
        pp.setShader(null);
        pp.setColor(dark ? 0xB3181A22 : 0xC7FFFFFF);
        c.drawRoundRect(all, r, r, pp);
        pp.setStyle(Paint.Style.STROKE);
        pp.setStrokeWidth(1f);
        pp.setColor(dark ? 0x1FFFFFFF : 0xE6FFFFFF);
        c.drawRoundRect(new RectF(0.5f, 0.5f, W - 0.5f, H - 0.5f), r, r, pp);
        pp.setStyle(Paint.Style.FILL);
    }

    // ---------- Bausteine ----------
    float text(String s, float x, float y, float size, int color, Typeface tf, Paint.Align al, float maxW) {
        if (s == null) s = "";
        tp.setTypeface(tf);
        tp.setTextSize(size);
        tp.setColor(color);
        tp.setTextAlign(al);
        tp.setLetterSpacing(0);
        CharSequence cs = maxW > 0 ? TextUtils.ellipsize(s, tp, maxW, TextUtils.TruncateAt.END) : s;
        c.drawText(cs, 0, cs.length(), x, y, tp);
        return tp.measureText(cs, 0, cs.length());
    }

    float width(String s, float size, Typeface tf) {
        tp.setTypeface(tf); tp.setTextSize(size); tp.setLetterSpacing(0);
        return tp.measureText(s == null ? "" : s);
    }

    void label(String s, float x, float y, Paint.Align al) {
        tp.setTypeface(semiBold);
        tp.setTextSize(10);
        tp.setColor(sub);
        tp.setTextAlign(al);
        tp.setLetterSpacing(0.09f);
        c.drawText(s.toUpperCase(), x, y, tp);
        tp.setLetterSpacing(0);
    }

    void emoji(String s, float x, float y, float size, Paint.Align al) {
        tp.setTypeface(Typeface.DEFAULT);
        tp.setTextSize(size);
        tp.setColor(ink);
        tp.setTextAlign(al);
        tp.setLetterSpacing(0);
        c.drawText(s, x, y, tp);
    }

    void rr(float x, float y, float w, float h, float r, int color) {
        pp.setShader(null);
        pp.setStyle(Paint.Style.FILL);
        pp.setColor(color);
        c.drawRoundRect(new RectF(x, y, x + w, y + h), r, r, pp);
    }

    /** Startnummer auf einem Schild in Teamfarbe. Gibt die Breite zurück. */
    float badge(JSONObject d, float x, float yTop, float h) {
        String n = d.optString("num", "");
        if (n.isEmpty()) n = "–";
        float size = h * 0.62f;
        float w = Math.max(h * 1.2f, width(n, size, black) + h * 0.5f);
        rr(x, yTop, w, h, h * 0.3f, col(d));
        text(n, x + w / 2, yTop + h * 0.74f, size, fg(d), black, Paint.Align.CENTER, 0);
        return w;
    }

    void bar(float x, float y, float w, float h, float frac, int color) {
        rr(x, y, w, h, h / 2, line);
        if (frac > 0) rr(x, y, Math.max(h, w * Math.min(1, frac)), h, h / 2, color);
    }

    static int col(JSONObject o) { return WidgetData.color(o.optString("col"), 0xFF888888); }
    static int fg(JSONObject o) { return WidgetData.color(o.optString("fg"), 0xFFFFFFFF); }
    static JSONObject drv(JSONObject s, int i) { JSONArray a = s.optJSONArray("drivers"); return a == null ? null : a.optJSONObject(i); }
    static JSONObject byD(JSONObject s, int d) {
        JSONArray a = s.optJSONArray("drivers");
        if (a != null) for (int i = 0; i < a.length(); i++) { JSONObject o = a.optJSONObject(i); if (o != null && o.optInt("d", -1) == d) return o; }
        return null;
    }
    static JSONObject teamOf(JSONObject s, int t) {
        JSONArray a = s.optJSONArray("teams");
        if (a != null) for (int i = 0; i < a.length(); i++) { JSONObject o = a.optJSONObject(i); if (o != null && o.optInt("t", -1) == t) return o; }
        return null;
    }
    static int count(JSONObject s, String k) { JSONArray a = s.optJSONArray(k); return a == null ? 0 : a.length(); }

    private String trendText(int tr) {
        return tr > 0 ? "▲ " + tr : tr < 0 ? "▼ " + (-tr) : "●";
    }
    private int trendColor(int tr) { return tr > 0 ? green : tr < 0 ? red : sub; }

    private String wxEmoji(String k) {
        switch (k == null ? "" : k) {
            case "sun": return "☀️";
            case "mixed": return "⛅";
            case "cloud": return "☁️";
            case "rain": return "🌧️";
            case "storm": return "⛈️";
            default: return "";
        }
    }

    // ---------- 1×1 ----------
    private void place(JSONObject s, Sel sel) {
        JSONObject d = sel.drivers.isEmpty() ? drv(s, 0) : sel.drivers.get(0);
        float bh = Math.min(20, H * 0.24f);
        float bw = width(d.optString("num"), bh * 0.62f, black) + bh * 0.5f;
        badge(d, (W - Math.max(bh * 1.2f, bw)) / 2, H * 0.16f, bh);
        float size = Math.min(W, H) * 0.38f;
        text("P" + d.optInt("rank"), W / 2, H * 0.16f + bh + size * 0.92f, size, posColor(d.optInt("rank")) == sub ? ink : posColor(d.optInt("rank")), black, Paint.Align.CENTER, W - 8);
    }

    private void next1(JSONObject s) {
        if (s.optInt("nextIdx", -1) < 0) {
            emoji("🏁", W / 2, H * 0.48f, H * 0.32f, Paint.Align.CENTER);
            text("ENDE", W / 2, H * 0.78f, 14, ink, black, Paint.Align.CENTER, 0);
            return;
        }
        String f = s.optString("nextFlag");
        if (!f.isEmpty()) emoji(f, W / 2, H * 0.42f, H * 0.28f, Paint.Align.CENTER);
        text(s.optString("nextCode"), W / 2, H * (f.isEmpty() ? 0.52f : 0.66f), f.isEmpty() ? 22 : 16, ink, black, Paint.Align.CENTER, W - 6);
        label((s.optInt("nextIdx") + 1) + " / " + s.optInt("total"), W / 2, H * 0.84f, Paint.Align.CENTER);
        if (s.optBoolean("nextSprint")) rr(W - 16, 8, 8, 8, 4, red);
    }

    // ---------- 2×1 ----------
    private void leader(JSONObject s) {
        JSONObject d = drv(s, 0);
        float pad = 14;
        float big = Math.min(H * 0.55f, 36);
        text("1", pad, H / 2 + big * 0.36f, big, gold, black, Paint.Align.LEFT, 0);
        float x = pad + big * 0.7f + 8;
        badge(d, x, H / 2 - 18, 18);
        text(d.optString("name"), x, H / 2 + 17, 15, ink, semiBold, Paint.Align.LEFT, W - x - 50);
        text(String.valueOf(d.optInt("pts")), W - pad, H / 2 + 8, 22, ink, black, Paint.Align.RIGHT, 0);
    }

    private void driver(JSONObject s, Sel sel) {
        JSONObject d = sel.drivers.isEmpty() ? drv(s, 0) : sel.drivers.get(0);
        float pad = 14, y1 = H / 2 - 4;
        float bw = badge(d, pad, y1 - 16, 18);
        text(d.optString("name"), pad + bw + 8, y1 - 2, 15, ink, semiBold, Paint.Align.LEFT, W - pad * 2 - bw - 50);
        text("P" + d.optInt("rank"), W - pad, y1, 20, posColor(d.optInt("rank")) == sub ? ink : posColor(d.optInt("rank")), black, Paint.Align.RIGHT, 0);
        text(d.optInt("pts") + " Pkt", pad, y1 + 20, 13, sub, semi, Paint.Align.LEFT, 0);
        int tr = d.optInt("trend");
        text(trendText(tr), W - pad, y1 + 20, 13, trendColor(tr), semiBold, Paint.Align.RIGHT, 0);
    }

    // ---------- 3×1 ----------
    private void rival(JSONObject s, Sel sel) {
        JSONObject a = sel.drivers.size() > 0 ? sel.drivers.get(0) : drv(s, 1);
        JSONObject b = sel.drivers.size() > 1 ? sel.drivers.get(1) : drv(s, 0);
        float pad = 14;
        int diff = a.optInt("pts") - b.optInt("pts");
        float top = H / 2 - 16;
        text(a.optString("short") + "  vs  " + b.optString("short"), pad, top + 4, 14, ink, semiBold, Paint.Align.LEFT, W - pad * 2 - 56);
        text(diff > 0 ? "+" + diff : String.valueOf(diff), W - pad, top + 6, 20, diff >= 0 ? green : red, black, Paint.Align.RIGHT, 0);
        float tot = Math.max(1, a.optInt("pts") + b.optInt("pts"));
        float bw = W - pad * 2, fa = a.optInt("pts") / tot;
        rr(pad, top + 13, bw, 8, 4, line);
        rr(pad, top + 13, Math.max(8, bw * fa - 1), 8, 4, col(a));
        if (fa < 1) rr(pad + bw * fa + 1, top + 13, bw * (1 - fa) - 1, 8, 4, (col(b) & 0x00FFFFFF) | 0x80000000);
        text(a.optInt("pts") + " Pkt", pad, top + 37, 12, sub, semi, Paint.Align.LEFT, 0);
        text(b.optInt("pts") + " Pkt", W - pad, top + 37, 12, sub, semi, Paint.Align.RIGHT, 0);
    }

    // ---------- Leisten ----------
    private void progress(JSONObject s) {
        float pad = 16;
        int total = Math.max(1, s.optInt("total")), done = s.optInt("done"), nx = s.optInt("nextIdx", -1);
        label(s.optString("title"), pad, H / 2 - 8, Paint.Align.LEFT);
        text(done + " / " + total + " Rennen", W - pad, H / 2 - 7, 17, ink, black, Paint.Align.RIGHT, 0);
        JSONArray races = s.optJSONArray("races");
        float gap = total > 30 ? 1.5f : 3, segW = (W - pad * 2 - gap * (total - 1)) / total, y = H / 2 + 4;
        for (int i = 0; i < total; i++) {
            JSONObject R = races == null ? null : races.optJSONObject(i);
            boolean dn = R != null ? R.optBoolean("done") : i < done;
            int colr = dn ? accent : (i == nx ? ink : line);
            rr(pad + i * (segW + gap), y, segW, 8, 3, colr);
            if (R != null && R.optBoolean("sprint")) rr(pad + i * (segW + gap) + segW / 2 - 1.5f, y + 11, 3, 3, 1.5f, red);
        }
    }

    private void calendar(JSONObject s, Sel sel) {
        JSONArray races = s.optJSONArray("races");
        if (races == null || races.length() == 0) return;
        JSONObject me = sel.drivers.isEmpty() ? null : sel.drivers.get(0);
        int nx = s.optInt("nextIdx", -1), n = races.length();
        float pad = 10, gap = 6;
        int cells = Math.max(3, Math.min(n, (int) ((W - pad * 2 + gap) / (58 + gap))));
        int start = nx < 0 ? Math.max(0, n - cells) : Math.max(0, Math.min(nx - 2, n - cells));
        float cw = (W - pad * 2 - gap * (cells - 1)) / cells, ch = H - pad * 2;
        for (int k = 0; k < cells; k++) {
            int i = start + k; if (i >= n) break;
            JSONObject R = races.optJSONObject(i);
            float x = pad + k * (cw + gap);
            boolean isNext = i == nx;
            rr(x, pad, cw, ch, 14, isNext ? ((accent & 0x00FFFFFF) | 0x29000000) : tile);
            if (isNext) {
                pp.setStyle(Paint.Style.STROKE); pp.setStrokeWidth(1.2f); pp.setColor(accent);
                c.drawRoundRect(new RectF(x + 0.6f, pad + 0.6f, x + cw - 0.6f, pad + ch - 0.6f), 14, 14, pp);
                pp.setStyle(Paint.Style.FILL);
            }
            String f = R.optString("flag");
            float cy = pad + ch * 0.36f;
            if (!f.isEmpty()) emoji(f, x + cw / 2, cy, Math.min(18, ch * 0.3f), Paint.Align.CENTER);
            text(R.optString("code"), x + cw / 2, pad + ch * 0.62f, 13, ink, black, Paint.Align.CENTER, cw - 4);
            String res; int rc;
            if (R.optBoolean("done") && me != null) {
                JSONArray rs = R.optJSONArray("res"); Object v = rs == null ? null : rs.opt(me.optInt("d"));
                res = v instanceof Number ? "P" + v : ("DNF".equals(v) ? "DNF" : "–");
                rc = v instanceof Number ? (((Number) v).intValue() <= 10 ? green : sub) : red;
            } else if (R.optBoolean("done")) { res = "✓"; rc = green; }
            else if (isNext) { res = "Nächstes"; rc = accent; }
            else if (R.optBoolean("sprint")) { res = "Sprint"; rc = red; }
            else { res = "–"; rc = faint; }
            text(res, x + cw / 2, pad + ch * 0.86f, 11, rc, semiBold, Paint.Align.CENTER, cw - 4);
        }
    }

    // ---------- 2×2 ----------
    private void top3c(JSONObject s) {
        float pad = 14;
        label("Top 3", pad, pad + 10, Paint.Align.LEFT);
        float rowH = (H - pad * 2 - 18) / 3;
        for (int i = 0; i < 3 && i < count(s, "drivers"); i++) {
            JSONObject d = drv(s, i);
            float cy = pad + 18 + rowH * i + rowH / 2;
            text(String.valueOf(i + 1), pad, cy + 6, 18, posColor(i + 1), black, Paint.Align.LEFT, 0);
            float bw = badge(d, pad + 16, cy - 10, 20);
            text(d.optString("short"), pad + 24 + bw, cy + 5, 14, ink, semiBold, Paint.Align.LEFT, W - pad * 2 - bw - 60);
            text(String.valueOf(d.optInt("pts")), W - pad, cy + 6, 17, ink, black, Paint.Align.RIGHT, 0);
        }
    }

    private void next2(JSONObject s) {
        float pad = 14;
        label("Nächstes Rennen", pad, pad + 10, Paint.Align.LEFT);
        if (s.optInt("nextIdx", -1) < 0) {
            emoji("🏁", pad, H * 0.58f, 40, Paint.Align.LEFT);
            text("SAISON BEENDET", pad, H - pad - 6, 20, ink, black, Paint.Align.LEFT, W - pad * 2);
            return;
        }
        String f = s.optString("nextFlag");
        if (!f.isEmpty()) emoji(f, pad, H * 0.52f, Math.min(42, H * 0.26f), Paint.Align.LEFT);
        text(s.optString("next").toUpperCase(), pad, H - pad - 22, 23, ink, black, Paint.Align.LEFT, W - pad * 2);
        float w = text("Rennen " + (s.optInt("nextIdx") + 1) + " / " + s.optInt("total"), pad, H - pad - 4, 13, sub, semi, Paint.Align.LEFT, 0);
        if (s.optBoolean("nextSprint")) {
            rr(pad + w + 8, H - pad - 16, 20, 16, 5, red);
            text("S", pad + w + 18, H - pad - 4, 12, 0xFFFFFFFF, black, Paint.Align.CENTER, 0);
        }
    }

    private JSONObject selTeam(JSONObject s, Sel sel) {
        if (sel.team != null) return sel.team;
        if (!sel.drivers.isEmpty()) { JSONObject t = teamOf(s, sel.drivers.get(0).optInt("t")); if (t != null) return t; }
        return s.optJSONArray("teams").optJSONObject(0);
    }

    private void duel(JSONObject s, Sel sel) {
        JSONObject t = selTeam(s, sel);
        float pad = 14;
        label("Teamduell · " + t.optString("short"), pad, pad + 10, Paint.Align.LEFT);
        JSONArray dd = t.optJSONArray("drivers");
        if (dd == null || dd.length() < 2) { text("Nur ein Fahrer im Team", W / 2, H / 2, 13, sub, semi, Paint.Align.CENTER, W - 20); return; }
        JSONObject a = byD(s, dd.optInt(0)), b = byD(s, dd.optInt(1));
        JSONArray q = t.optJSONArray("qduel");
        float cy = pad + 44;
        badge(a, pad, cy - 14, 20);
        float bw = width(b.optString("num"), 12.4f, black) + 10;
        badge(b, W - pad - Math.max(24, bw), cy - 14, 20);
        text((q == null ? 0 : q.optInt(0)) + " : " + (q == null ? 0 : q.optInt(1)), W / 2, cy + 6, 28, ink, black, Paint.Align.CENTER, 0);
        text("Quali-Duell", W / 2, cy + 22, 11, sub, semi, Paint.Align.CENTER, 0);
        float by = H - pad - 10;
        text(String.valueOf(a.optInt("pts")), pad, by - 8, 14, ink, semiBold, Paint.Align.LEFT, 0);
        text("Punkte", W / 2, by - 8, 11, sub, semi, Paint.Align.CENTER, 0);
        text(String.valueOf(b.optInt("pts")), W - pad, by - 8, 14, ink, semiBold, Paint.Align.RIGHT, 0);
        float tot = Math.max(1, a.optInt("pts") + b.optInt("pts")), w = W - pad * 2, fa = a.optInt("pts") / tot;
        rr(pad, by, w, 7, 3.5f, (WidgetData.color(t.optString("col"), 0xFF888888) & 0x00FFFFFF) | 0x4D000000);
        rr(pad, by, Math.max(7, w * fa), 7, 3.5f, WidgetData.color(t.optString("col"), 0xFF888888));
    }

    private void team(JSONObject s, Sel sel) {
        JSONObject t = selTeam(s, sel);
        float pad = 14, size = Math.min(48, H * 0.3f);
        int tc = WidgetData.color(t.optString("col"), 0xFF888888);
        rr(pad, pad, size, size, size * 0.3f, tc);
        text(t.optString("short"), pad + size / 2, pad + size * 0.64f, size * 0.36f, WidgetData.color(t.optString("fg"), 0xFFFFFFFF), black, Paint.Align.CENTER, size - 4);
        text(t.optString("name"), pad, pad + size + 20, 16, ink, semiBold, Paint.Align.LEFT, W - pad * 2);
        float w = text("P" + t.optInt("rank"), pad, pad + size + 50, 28, posColor(t.optInt("rank")) == sub ? ink : posColor(t.optInt("rank")), black, Paint.Align.LEFT, 0);
        text(t.optInt("pts") + " Pkt", pad + w + 8, pad + size + 50, 14, sub, semi, Paint.Align.LEFT, 0);
        if (!t.isNull("power")) {
            int pw = t.optInt("power");
            String dl = t.isNull("powerDelta") ? "" : (t.optInt("powerDelta") >= 0 ? "  +" : "  ") + t.optInt("powerDelta");
            text("Auto " + pw + dl, pad, H - pad - 2, 12, t.isNull("powerDelta") ? sub : (t.optInt("powerDelta") >= 0 ? green : red), semiBold, Paint.Align.LEFT, W - pad * 2);
        }
    }

    // ---------- 3×2 / 4×2 / 5×2 ----------
    private void top3(JSONObject s) {
        float pad = 16;
        text(s.optString("title").toUpperCase(), pad, pad + 12, 15, ink, black, Paint.Align.LEFT, W * 0.55f);
        text(s.optString("round"), W - pad, pad + 12, 12, sub, semi, Paint.Align.RIGHT, 0);
        float rowH = (H - pad * 2 - 20) / 3;
        for (int i = 0; i < 3 && i < count(s, "drivers"); i++) {
            JSONObject d = drv(s, i);
            float cy = pad + 20 + rowH * i + rowH / 2;
            text(String.valueOf(i + 1), pad, cy + 7, 20, posColor(i + 1), black, Paint.Align.LEFT, 0);
            float bw = badge(d, pad + 20, cy - 11, 22);
            text(d.optString("name"), pad + 30 + bw, cy + 5, 15, ink, semiBold, Paint.Align.LEFT, W - pad * 2 - bw - 80);
            text(String.valueOf(d.optInt("pts")), W - pad, cy + 7, 20, ink, black, Paint.Align.RIGHT, 0);
        }
    }

    private void podium(JSONObject s) {
        float pad = 14, side = Math.min(118, W * 0.34f), lw = W - pad * 2 - side - 12;
        int[] order = { 1, 0, 2 };
        float[] hs = { 0.52f, 0.38f, 0.28f };
        float colW = lw / 3, base = H - pad;
        int[] steps = { (gold & 0x00FFFFFF) | 0x33000000, (silver & 0x00FFFFFF) | 0x29000000, (bronze & 0x00FFFFFF) | 0x2E000000 };
        for (int k = 0; k < 3; k++) {
            int i = order[k];
            JSONObject d = drv(s, i);
            if (d == null) continue;
            float x = pad + k * colW, sh = (H - pad * 2) * hs[i] * 0.62f;
            rr(x + 3, base - sh, colW - 6, sh, 8, steps[i]);
            text(String.valueOf(i + 1), x + colW / 2, base - sh + 17, 17, posColor(i + 1), black, Paint.Align.CENTER, 0);
            text(String.valueOf(d.optInt("pts")), x + colW / 2, base - sh - 6, 17, ink, black, Paint.Align.CENTER, 0);
            text(d.optString("short"), x + colW / 2, base - sh - 24, 12, ink, semiBold, Paint.Align.CENTER, colW - 4);
            float bw = Math.max(24, width(d.optString("num"), 12.4f, black) + 10);
            badge(d, x + colW / 2 - bw / 2, base - sh - 52, 20);
        }
        float sx = W - pad - side;
        rr(sx - 8, pad, 1, H - pad * 2, 0, line);
        boolean champ = s.optBoolean("champ");
        label(champ ? "Meister" : "Vorsprung", sx, pad + 10, Paint.Align.LEFT);
        int gap = s.optInt("gap");
        JSONObject d2 = drv(s, 1);
        if (champ) text(drv(s, 0).optString("short"), sx, pad + 38, 22, gold, black, Paint.Align.LEFT, side);
        else text((gap > 0 ? "+" : "") + gap, sx, pad + 40, 28, green, black, Paint.Align.LEFT, side);
        if (!champ && d2 != null) text("vor " + d2.optString("short"), sx, pad + 56, 12, sub, semi, Paint.Align.LEFT, side);
        boolean over = s.optInt("nextIdx", -1) < 0;
        label(over ? "Saison" : "Nächstes Rennen", sx, H - pad - 26, Paint.Align.LEFT);
        String f = s.optString("nextFlag");
        float fw = 0;
        if (!over && !f.isEmpty()) { emoji(f, sx, H - pad - 6, 15, Paint.Align.LEFT); fw = 22; }
        text(over ? "BEENDET" : s.optString("next").toUpperCase(), sx + fw, H - pad - 6, 16, ink, black, Paint.Align.LEFT, side - fw);
    }

    private void mine(JSONObject s, Sel sel) {
        List<JSONObject> list = new ArrayList<>(sel.drivers);
        if (list.isEmpty()) for (int i = 0; i < 3 && i < count(s, "drivers"); i++) list.add(drv(s, i));
        float pad = 12, gap = 8, n = list.size(), tw = (W - pad * 2 - gap * (n - 1)) / n, th = H - pad * 2;
        for (int k = 0; k < n; k++) {
            JSONObject d = list.get(k);
            float x = pad + k * (tw + gap);
            rr(x, pad, tw, th, 16, tile);
            c.save();
            Path clip = new Path(); clip.addRoundRect(new RectF(x, pad, x + tw, pad + th), 16, 16, Path.Direction.CW);
            c.clipPath(clip);
            rr(x, pad, tw, 3, 0, col(d));
            c.restore();
            float ix = x + 10;
            badge(d, ix, pad + 12, 20);
            text("P" + d.optInt("rank"), x + tw - 10, pad + 27, 15, posColor(d.optInt("rank")), black, Paint.Align.RIGHT, 0);
            text(d.optString("short"), ix, pad + 52, 14, ink, semiBold, Paint.Align.LEFT, tw - 20);
            text(d.optInt("pts") + "", ix, pad + 80, 26, ink, black, Paint.Align.LEFT, 0);
            text("Zuletzt " + d.optString("last", "–"), ix, th + pad - 26, 11, sub, semi, Paint.Align.LEFT, tw - 20);
            int tr = d.optInt("trend");
            text(tr > 0 ? "▲ " + tr + (tr == 1 ? " Platz" : " Plätze") : tr < 0 ? "▼ " + (-tr) + (tr == -1 ? " Platz" : " Plätze") : "● hält P" + d.optInt("rank"),
                ix, th + pad - 10, 11, trendColor(tr), semiBold, Paint.Align.LEFT, tw - 20);
        }
    }

    private void constructors(JSONObject s) {
        float pad = 16;
        label("Konstrukteure", pad, pad + 10, Paint.Align.LEFT);
        text(s.optString("title"), W - pad, pad + 10, 11, sub, semi, Paint.Align.RIGHT, W * 0.5f);
        JSONArray ts = s.optJSONArray("teams");
        int n = Math.min(ts.length(), Math.max(3, (int) ((H - pad * 2 - 18) / 22)));
        float rowH = (H - pad * 2 - 18) / n, lead = Math.max(1, ts.optJSONObject(0).optInt("pts")), nameW = Math.min(110, W * 0.3f);
        for (int i = 0; i < n; i++) {
            JSONObject t = ts.optJSONObject(i);
            float cy = pad + 18 + rowH * i + rowH / 2;
            text(String.valueOf(i + 1), pad, cy + 5, 14, posColor(i + 1), black, Paint.Align.LEFT, 0);
            text(t.optString("name"), pad + 16, cy + 5, 13, ink, semiBold, Paint.Align.LEFT, nameW);
            float bx = pad + 22 + nameW, bw = W - pad - bx - 40;
            bar(bx, cy - 3, bw, 6, t.optInt("pts") / lead, WidgetData.color(t.optString("col"), 0xFF888888));
            text(String.valueOf(t.optInt("pts")), W - pad, cy + 5, 15, ink, black, Paint.Align.RIGHT, 0);
        }
    }

    private void lastRace(JSONObject s, Sel sel) {
        float pad = 16;
        int li = s.optInt("last", -1);
        JSONArray races = s.optJSONArray("races");
        if (li < 0 || races == null) { label("Letztes Rennen", pad, pad + 10, Paint.Align.LEFT); text("Noch kein Rennen gefahren", pad, H / 2, 14, sub, semi, Paint.Align.LEFT, W - pad * 2); return; }
        JSONObject R = races.optJSONObject(li);
        String head = "Letztes Rennen · " + R.optString("name");
        label(head, pad, pad + 10, Paint.Align.LEFT);
        String wa = wxEmoji(R.optString("wxA")), we = wxEmoji(R.optString("wxE"));
        if (!wa.isEmpty()) emoji(we.isEmpty() || we.equals(wa) ? wa : wa + "→" + we, W - pad, pad + 12, 12, Paint.Align.RIGHT);
        JSONArray res = R.optJSONArray("res");
        List<int[]> order = new ArrayList<>();
        for (int d = 0; res != null && d < res.length(); d++) { Object v = res.opt(d); if (v instanceof Number) order.add(new int[] { ((Number) v).intValue(), d }); }
        order.sort((x, y) -> x[0] - y[0]);
        JSONObject me = sel.drivers.isEmpty() ? null : sel.drivers.get(0);
        float foot = me != null ? 24 : 0;
        int n = Math.min(order.size(), Math.max(2, (int) ((H - pad * 2 - 18 - foot) / 24)));
        float rowH = (H - pad * 2 - 18 - foot) / Math.max(1, n);
        for (int k = 0; k < n; k++) {
            int p = order.get(k)[0]; JSONObject d = byD(s, order.get(k)[1]); if (d == null) continue;
            float cy = pad + 18 + rowH * k + rowH / 2;
            text("P" + p, pad, cy + 5, 15, posColor(p), black, Paint.Align.LEFT, 0);
            float bw = badge(d, pad + 30, cy - 10, 20);
            text(d.optString("name"), pad + 38 + bw, cy + 5, 14, ink, semiBold, Paint.Align.LEFT, W - pad * 2 - bw - 90);
            if (p <= 10) text("+" + RACE_PTS[p], W - pad, cy + 5, 13, green, semiBold, Paint.Align.RIGHT, 0);
        }
        if (me != null) {
            rr(pad, H - pad - foot + 2, W - pad * 2, 1, 0, line);
            Object v = res == null ? null : res.opt(me.optInt("d"));
            String r = v instanceof Number ? "P" + v + (((Number) v).intValue() <= 10 ? "  ·  +" + RACE_PTS[((Number) v).intValue()] : "") : ("DNF".equals(v) ? "DNF" : "–");
            float w = text(me.optString("name"), pad, H - pad - 4, 13, ink, semiBold, Paint.Align.LEFT, W * 0.4f);
            text(r, pad + w + 10, H - pad - 4, 13, sub, semi, Paint.Align.LEFT, 0);
            int tr = me.optInt("trend");
            text(trendText(tr), W - pad, H - pad - 4, 13, trendColor(tr), semiBold, Paint.Align.RIGHT, 0);
        }
    }

    private void top5(JSONObject s) {
        float pad = 14;
        text("FAHRERWERTUNG", pad, pad + 12, 15, ink, black, Paint.Align.LEFT, W * 0.5f);
        text(s.optString("round"), W - pad, pad + 12, 12, sub, semi, Paint.Align.RIGHT, 0);
        int n = Math.min(5, count(s, "drivers"));
        float gap = 8, top = pad + 22, tw = (W - pad * 2 - gap * (n - 1)) / n, th = H - top - pad;
        for (int i = 0; i < n; i++) {
            JSONObject d = drv(s, i);
            float x = pad + i * (tw + gap), cx = x + tw / 2;
            rr(x, top, tw, th, 14, tile);
            c.save();
            Path clip = new Path(); clip.addRoundRect(new RectF(x, top, x + tw, top + th), 14, 14, Path.Direction.CW);
            c.clipPath(clip);
            rr(x, top, tw, 3, 0, col(d));
            c.restore();
            text(String.valueOf(i + 1), cx, top + th * 0.26f, 17, posColor(i + 1), black, Paint.Align.CENTER, 0);
            float bw = Math.max(24, width(d.optString("num"), 12.4f, black) + 10);
            badge(d, cx - bw / 2, top + th * 0.33f, 20);
            text(d.optString("short"), cx, top + th * 0.72f, 12, ink, semiBold, Paint.Align.CENTER, tw - 6);
            text(String.valueOf(d.optInt("pts")), cx, top + th * 0.92f, 17, ink, black, Paint.Align.CENTER, 0);
        }
    }

    // ---------- groß ----------
    private void standings(JSONObject s) {
        float pad = 16;
        text("FAHRERWERTUNG", pad, pad + 12, 15, ink, black, Paint.Align.LEFT, W * 0.5f);
        text(s.optString("round"), W - pad, pad + 12, 12, sub, semi, Paint.Align.RIGHT, 0);
        int total = count(s, "drivers");
        int n = Math.min(total, Math.max(4, (int) ((H - pad * 2 - 22) / 25)));
        float rowH = (H - pad * 2 - 22) / n;
        int lead = drv(s, 0).optInt("pts");
        for (int i = 0; i < n; i++) {
            JSONObject d = drv(s, i);
            float cy = pad + 24 + rowH * i + rowH / 2;
            text(String.valueOf(i + 1), pad + 8, cy + 5, 15, posColor(i + 1), black, Paint.Align.CENTER, 0);
            float bw = badge(d, pad + 22, cy - 10, 20);
            text(d.optString("name"), pad + 30 + bw, cy + 5, 14, ink, semiBold, Paint.Align.LEFT, W - pad * 2 - bw - 120);
            if (i > 0) text("−" + (lead - d.optInt("pts")), W - pad - 46, cy + 5, 12, sub, semi, Paint.Align.RIGHT, 0);
            text(String.valueOf(d.optInt("pts")), W - pad, cy + 5, 16, ink, black, Paint.Align.RIGHT, 0);
        }
    }

    private void graph(JSONObject s) {
        float pad = 16;
        text("SAISONVERLAUF", pad, pad + 12, 15, ink, black, Paint.Align.LEFT, W * 0.5f);
        text("Punkte", W - pad, pad + 12, 12, sub, semi, Paint.Align.RIGHT, 0);
        JSONObject ser = s.optJSONObject("series");
        JSONArray lines = ser == null ? null : ser.optJSONArray("lines");
        if (lines == null || lines.length() == 0 || ser.optJSONArray("labels").length() < 2) {
            text("Ab zwei Rennen siehst du hier den Verlauf.", W / 2, H / 2, 13, sub, semi, Paint.Align.CENTER, W - 30);
            return;
        }
        int nl = Math.min(3, lines.length());
        float gx = pad + 22, gy = pad + 26, gw = W - gx - pad - 4, gh = H - gy - pad - 26;
        int max = 1;
        for (int i = 0; i < nl; i++) { JSONArray v = lines.optJSONObject(i).optJSONArray("vals"); for (int j = 0; j < v.length(); j++) max = Math.max(max, v.optInt(j)); }
        float step = niceStep(max);
        max = (int) (Math.ceil(max / step) * step);
        for (float t = 0; t <= max + 0.1f; t += step) {
            float y = gy + gh - gh * (t / max);
            rr(gx, y, gw, 0.8f, 0, line);
            text(String.valueOf((int) t), gx - 4, y + 3, 9, faint, semi, Paint.Align.RIGHT, 0);
        }
        Paint lp = new Paint(Paint.ANTI_ALIAS_FLAG);
        lp.setStyle(Paint.Style.STROKE); lp.setStrokeCap(Paint.Cap.ROUND); lp.setStrokeJoin(Paint.Join.ROUND);
        List<Integer> used = new ArrayList<>();
        float lx = pad;
        for (int i = nl - 1; i >= 0; i--) {
            JSONObject L = lines.optJSONObject(i);
            JSONObject d = byD(s, L.optInt("d"));
            JSONArray v = L.optJSONArray("vals");
            int cl = d == null ? sub : col(d);
            int same = 0; for (int u : used) if (u == cl) same++;
            used.add(cl);
            if (same > 0) cl = (cl & 0x00FFFFFF) | 0xA0000000;
            lp.setColor(cl); lp.setStrokeWidth(i == 0 ? 2.8f : 2.2f);
            Path p = new Path();
            int n = v.length();
            for (int j = 0; j < n; j++) {
                float x = gx + gw * j / (n - 1f), y = gy + gh - gh * (v.optInt(j) / (float) max);
                if (j == 0) p.moveTo(x, y); else p.lineTo(x, y);
            }
            c.drawPath(p, lp);
            float ex = gx + gw, ey = gy + gh - gh * (v.optInt(n - 1) / (float) max);
            rr(ex - 4, ey - 4, 8, 8, 4, cl);
        }
        for (int i = 0; i < nl; i++) {
            JSONObject d = byD(s, lines.optJSONObject(i).optInt("d"));
            if (d == null) continue;
            rr(lx, H - pad - 9, 8, 8, 4, col(d));
            lx += 12 + text(d.optString("short"), lx + 12, H - pad - 1, 12, ink, semiBold, Paint.Align.LEFT, 0) + 14;
        }
    }

    private static float niceStep(int max) {
        float raw = max / 4f, mag = (float) Math.pow(10, Math.floor(Math.log10(Math.max(1, raw)))), f = raw / mag;
        return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * mag;
    }

    private void dash(JSONObject s, Sel sel) {
        float pad = 14;
        text(s.optString("title").toUpperCase(), pad, pad + 14, 17, ink, black, Paint.Align.LEFT, W * 0.6f);
        text(s.optString("round"), W - pad, pad + 13, 12, sub, semi, Paint.Align.RIGHT, 0);
        float top = pad + 26, tw = (W - pad * 2 - 10) / 2, th = Math.min(92, (H - top - pad) * 0.36f);
        JSONObject L = drv(s, 0);
        JSONObject me = sel.drivers.isEmpty() ? drv(s, Math.min(1, count(s, "drivers") - 1)) : sel.drivers.get(0);
        JSONObject[] two = { L, me };
        String[] lbl = { "Führt", me == L ? "Platz 1" : "Dein Fahrer" };
        for (int k = 0; k < 2; k++) {
            JSONObject d = two[k];
            float x = pad + k * (tw + 10);
            rr(x, top, tw, th, 16, tile);
            label(lbl[k], x + 10, top + 16, Paint.Align.LEFT);
            float bw = badge(d, x + 10, top + 24, 20);
            text(k == 0 ? d.optString("short") : "P" + d.optInt("rank") + "  " + d.optString("short"), x + 16 + bw, top + 39, 14, ink, semiBold, Paint.Align.LEFT, tw - bw - 26);
            float w = text(String.valueOf(d.optInt("pts")), x + 10, top + th - 12, 24, ink, black, Paint.Align.LEFT, 0);
            if (k == 0) { int g = s.optInt("gap"); text((g > 0 ? "+" : "") + g, x + 16 + w, top + th - 12, 13, green, semiBold, Paint.Align.LEFT, 0); }
            else { int tr = d.optInt("trend"); text(trendText(tr), x + 16 + w, top + th - 12, 13, trendColor(tr), semiBold, Paint.Align.LEFT, 0); }
        }
        float by = top + th + 10, bh = H - by - pad;
        rr(pad, by, W - pad * 2, bh, 16, tile);
        label("Nächstes Rennen", pad + 12, by + 18, Paint.Align.LEFT);
        boolean over = s.optInt("nextIdx", -1) < 0;
        String nxt = over ? "Saison beendet" : (s.optString("nextFlag").isEmpty() ? "" : s.optString("nextFlag") + " ") + s.optString("next");
        tp.setTypeface(Typeface.DEFAULT);
        text(nxt, W - pad - 12, by + 19, 13, ink, semiBold, Paint.Align.RIGHT, W * 0.5f);
        label("Konstrukteure", pad + 12, by + 42, Paint.Align.LEFT);
        JSONArray ts = s.optJSONArray("teams");
        int n = Math.min(ts.length(), Math.max(2, (int) ((bh - 52) / 22)));
        float rowH = (bh - 52) / n, lead = Math.max(1, ts.optJSONObject(0).optInt("pts")), nameW = Math.min(96, W * 0.28f);
        for (int i = 0; i < n; i++) {
            JSONObject t = ts.optJSONObject(i);
            float cy = by + 50 + rowH * i + rowH / 2;
            text(t.optString("name"), pad + 12, cy + 4, 12, ink, semiBold, Paint.Align.LEFT, nameW);
            float bx = pad + 18 + nameW, bw = W - pad - 12 - bx - 36;
            bar(bx, cy - 3, bw, 6, t.optInt("pts") / lead, WidgetData.color(t.optString("col"), 0xFF888888));
            text(String.valueOf(t.optInt("pts")), W - pad - 12, cy + 5, 14, ink, black, Paint.Align.RIGHT, 0);
        }
    }

    @SuppressWarnings("unused")
    private static int alpha(int color, int a) { return Color.argb(a, Color.red(color), Color.green(color), Color.blue(color)); }
}
