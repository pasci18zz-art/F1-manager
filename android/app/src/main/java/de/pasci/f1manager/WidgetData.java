package de.pasci.f1manager;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.res.Configuration;
import android.graphics.Color;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Liest die Widget-Daten, die die App unter "f1m-widget" in den Capacitor-Preferences ablegt,
 * und die Einstellungen der einzelnen Widgets.
 */
final class WidgetData {
    static final String APP_PREFS = "CapacitorStorage";
    static final String DATA_KEY = "f1m-widget";
    static final String CFG_PREFS = "f1m_widgets";

    private WidgetData() {}

    /** Alle Daten oder null, wenn die App noch nie geöffnet wurde. */
    static JSONObject load(Context ctx) {
        try {
            String raw = ctx.getSharedPreferences(APP_PREFS, Context.MODE_PRIVATE).getString(DATA_KEY, null);
            return raw == null ? null : new JSONObject(raw);
        } catch (Exception e) {
            return null;
        }
    }

    /** Die gewählte Saison des Widgets, sonst die aktuelle Saison der App. */
    static JSONObject season(JSONObject data, String seasonId) {
        if (data == null) return null;
        JSONArray list = data.optJSONArray("seasons");
        if (list == null || list.length() == 0) return null;
        String want = (seasonId == null || seasonId.isEmpty() || "cur".equals(seasonId)) ? data.optString("cur", "") : seasonId;
        JSONObject first = null;
        for (int i = 0; i < list.length(); i++) {
            JSONObject s = list.optJSONObject(i);
            if (s == null) continue;
            if (first == null) first = s;
            if (want.equals(s.optString("id"))) return s;
        }
        String cur = data.optString("cur", "");
        for (int i = 0; i < list.length(); i++) {
            JSONObject s = list.optJSONObject(i);
            if (s != null && cur.equals(s.optString("id"))) return s;
        }
        return first;
    }

    static SharedPreferences cfg(Context ctx) {
        return ctx.getSharedPreferences(CFG_PREFS, Context.MODE_PRIVATE);
    }

    static String seasonOf(Context ctx, int id) { return cfg(ctx).getString("season_" + id, "cur"); }
    static String driversOf(Context ctx, int id) { return cfg(ctx).getString("drivers_" + id, ""); }
    static String themeOf(Context ctx, int id) { return cfg(ctx).getString("theme_" + id, "app"); }

    static int teamOf(Context ctx, int id) { return cfg(ctx).getInt("team_" + id, -1); }

    static void save(Context ctx, int id, String season, String drivers, String theme, int team) {
        cfg(ctx).edit()
            .putInt("team_" + id, team)
            .putString("season_" + id, season)
            .putString("drivers_" + id, drivers)
            .putString("theme_" + id, theme)
            .apply();
    }

    static void remove(Context ctx, int id) {
        cfg(ctx).edit().remove("season_" + id).remove("drivers_" + id).remove("theme_" + id).remove("team_" + id).apply();
    }

    /** Dunkel oder hell: Widget-Einstellung, sonst wie in der App, sonst wie das Handy. */
    static boolean dark(Context ctx, int id, JSONObject data) {
        String t = themeOf(ctx, id);
        if ("app".equals(t) && data != null) t = data.optString("theme", "system");
        if ("dark".equals(t)) return true;
        if ("light".equals(t)) return false;
        int night = ctx.getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
        return night == Configuration.UI_MODE_NIGHT_YES;
    }

    static int color(String hex, int fallback) {
        try { return Color.parseColor(hex); } catch (Exception e) { return fallback; }
    }
}
