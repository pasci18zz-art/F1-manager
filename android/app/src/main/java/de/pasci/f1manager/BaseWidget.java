package de.pasci.f1manager;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

/** Gemeinsame Teile der drei Widgets: Farben, Abzeichen, Antippen öffnet die App. */
abstract class BaseWidget extends AppWidgetProvider {

    /** Farben eines Themas. */
    static final class Theme {
        final boolean dark;
        final int ink, sub, green, red, gold, silver, bronze, step1, step2, step3;
        final int bg, tile;
        Theme(boolean dark) {
            this.dark = dark;
            ink = dark ? 0xFFF2F3F7 : 0xFF12141A;
            sub = dark ? 0xFFA9AEBD : 0xFF555C6B;
            green = dark ? 0xFF2FD47A : 0xFF11834A;
            red = dark ? 0xFFFF6B78 : 0xFFC92A3B;
            gold = dark ? 0xFFFFC93C : 0xFFA87700;
            silver = dark ? 0xFFC9CED8 : 0xFF667080;
            bronze = dark ? 0xFFD9925B : 0xFFA35E2B;
            step1 = dark ? 0x2EFFC93C : 0x2EA87700;
            step2 = dark ? 0x24C9CED8 : 0x24667080;
            step3 = dark ? 0x29D9925B : 0x29A35E2B;
            bg = dark ? R.drawable.widget_bg_dark : R.drawable.widget_bg_light;
            tile = dark ? R.drawable.widget_tile_dark : R.drawable.widget_tile_light;
        }
        int posColor(int rank) { return rank == 1 ? gold : rank == 2 ? silver : rank == 3 ? bronze : sub; }
    }

    @Override
    public void onUpdate(Context ctx, AppWidgetManager mgr, int[] ids) {
        for (int id : ids) update(ctx, mgr, id);
    }

    @Override
    public void onDeleted(Context ctx, int[] ids) {
        for (int id : ids) { WidgetData.remove(ctx, id); WidgetGlass.forget(ctx, id); }
    }

    void update(Context ctx, AppWidgetManager mgr, int id) {
        JSONObject data = WidgetData.load(ctx);
        JSONObject season = WidgetData.season(data, WidgetData.seasonOf(ctx, id));
        Theme t = new Theme(WidgetData.dark(ctx, id, data));
        RemoteViews v = new RemoteViews(ctx.getPackageName(), layout());
        android.graphics.Bitmap glass = WidgetGlass.render(ctx, id, t.dark);
        if (glass != null) {
            v.setImageViewBitmap(R.id.glass, glass);
            v.setViewVisibility(R.id.glass, View.VISIBLE);
            v.setInt(R.id.panel, "setBackgroundResource", 0);
        } else {
            v.setViewVisibility(R.id.glass, View.GONE);
            v.setInt(R.id.panel, "setBackgroundResource", t.bg);
        }
        Intent open = new Intent(ctx, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        open.putExtra(MainActivity.EXTRA_WIDGET, id);
        PendingIntent pi = PendingIntent.getActivity(ctx, id, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        v.setOnClickPendingIntent(R.id.root, pi);
        JSONArray drivers = season == null ? null : season.optJSONArray("drivers");
        boolean empty = drivers == null || drivers.length() == 0;
        v.setViewVisibility(R.id.empty, empty ? View.VISIBLE : View.GONE);
        v.setTextColor(R.id.empty, t.sub);
        if (!empty) fill(ctx, v, id, season, drivers, t);
        else hideContent(v);
        mgr.updateAppWidget(id, v);
    }

    abstract int layout();
    abstract void fill(Context ctx, RemoteViews v, int id, JSONObject season, JSONArray drivers, Theme t);
    abstract void hideContent(RemoteViews v);

    /** Startnummer auf einem Schild in Teamfarbe. */
    static void badge(RemoteViews v, int bgId, int numId, JSONObject d) {
        v.setInt(bgId, "setColorFilter", WidgetData.color(d.optString("col"), 0xFF888888));
        String num = d.optString("num", "");
        v.setTextViewText(numId, num.isEmpty() ? "–" : num);
        v.setTextColor(numId, WidgetData.color(d.optString("fg"), 0xFFFFFFFF));
    }

    /** Alle Widgets einer Art neu zeichnen. */
    static void updateAll(Context ctx) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
        BaseWidget[] all = { new Top3SmallWidget(), new Top3LargeWidget(), new DriversWidget() };
        for (BaseWidget w : all) {
            int[] ids = mgr.getAppWidgetIds(new ComponentName(ctx, w.getClass()));
            for (int id : ids) w.update(ctx, mgr, id);
        }
    }

    /** Das passende Widget für eine ID finden (für die Einrichtung). */
    static BaseWidget forId(Context ctx, int id) {
        android.appwidget.AppWidgetProviderInfo info = AppWidgetManager.getInstance(ctx).getAppWidgetInfo(id);
        String cls = info == null ? "" : info.provider.getClassName();
        if (cls.endsWith("DriversWidget")) return new DriversWidget();
        if (cls.endsWith("Top3LargeWidget")) return new Top3LargeWidget();
        return new Top3SmallWidget();
    }
}
