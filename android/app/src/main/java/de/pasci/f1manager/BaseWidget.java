package de.pasci.f1manager;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.os.Bundle;
import android.util.DisplayMetrics;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

/** Alle Widgets: werden komplett als Bild gezeichnet (WidgetRenderer). Antippen öffnet die App. */
abstract class BaseWidget extends AppWidgetProvider {

    abstract String kind();
    /** Wie viele Fahrer man in der Einrichtung wählen kann (0 = keine Auswahl). */
    int maxDrivers() { return 0; }
    /** Ob man ein Team wählt. */
    boolean needTeam() { return false; }

    static BaseWidget[] all() { return new BaseWidget[] { new PlaceWidget(), new Next1Widget(), new LeaderWidget(), new DriverWidget(), new RivalWidget(), new ProgressWidget(), new CalendarWidget(), new Top3CompactWidget(), new Next2Widget(), new DuelWidget(), new TeamWidget(), new Top3SmallWidget(), new Top3LargeWidget(), new DriversWidget(), new ConstructorsWidget(), new LastRaceWidget(), new Top5Widget(), new StandingsWidget(), new GraphWidget(), new DashWidget() }; }

    @Override
    public void onUpdate(Context ctx, AppWidgetManager mgr, int[] ids) {
        for (int id : ids) update(ctx, mgr, id);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context ctx, AppWidgetManager mgr, int id, Bundle opts) {
        update(ctx, mgr, id);
    }

    @Override
    public void onDeleted(Context ctx, int[] ids) {
        for (int id : ids) { WidgetData.remove(ctx, id); WidgetGlass.forget(ctx, id); }
    }

    /** Größe des Widgets in dp: genaue Position (nach Antippen), sonst aus den Widget-Optionen. */
    static float[] sizeDp(Context ctx, AppWidgetManager mgr, int id) {
        DisplayMetrics dm = ctx.getResources().getDisplayMetrics();
        android.graphics.Rect b = WidgetGlass.boundsOf(ctx, id);
        if (b != null && b.width() > 0 && b.height() > 0) return new float[] { b.width() / dm.density, b.height() / dm.density };
        Bundle o = mgr.getAppWidgetOptions(id);
        boolean land = dm.widthPixels > dm.heightPixels;
        int w = o.getInt(land ? AppWidgetManager.OPTION_APPWIDGET_MAX_WIDTH : AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 0);
        int h = o.getInt(land ? AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT : AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 0);
        if (w <= 0) w = 250;
        if (h <= 0) h = 110;
        return new float[] { w, h };
    }

    void update(Context ctx, AppWidgetManager mgr, int id) {
        try {
            JSONObject data = WidgetData.load(ctx);
            JSONObject season = WidgetData.season(data, WidgetData.seasonOf(ctx, id));
            boolean dark = WidgetData.dark(ctx, id, data);
            float[] sz = sizeDp(ctx, mgr, id);
            float dens = ctx.getResources().getDisplayMetrics().density;
            // Bildgröße begrenzen: RemoteViews dürfen nicht zu groß werden
            float scale = Math.min(dens, 2.5f);
            float maxPx = 1100f;
            scale = Math.min(scale, maxPx / Math.max(sz[0], sz[1]));
            Bitmap glass = WidgetGlass.render(ctx, id, dark);
            WidgetRenderer.Sel sel = selection(ctx, id, season);
            Bitmap img = new WidgetRenderer(ctx, dark).render(kind(), sz[0], sz[1], scale, glass, season, sel);
            RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget_canvas);
            v.setImageViewBitmap(R.id.img, img);
            Intent open = new Intent(ctx, MainActivity.class);
            open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            open.putExtra(MainActivity.EXTRA_WIDGET, id);
            PendingIntent pi = PendingIntent.getActivity(ctx, id, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            v.setOnClickPendingIntent(R.id.root, pi);
            mgr.updateAppWidget(id, v);
        } catch (Throwable ignored) {}
    }

    /** Gewählte Fahrer/Team; ohne Auswahl bleibt die Liste leer und das Widget nimmt sinnvolle Vorgaben. */
    WidgetRenderer.Sel selection(Context ctx, int id, JSONObject season) {
        WidgetRenderer.Sel sel = new WidgetRenderer.Sel();
        if (season == null) return sel;
        JSONArray ds = season.optJSONArray("drivers");
        String chosen = WidgetData.driversOf(ctx, id);
        if (ds != null && !chosen.isEmpty() && maxDrivers() > 0) {
            for (String part : chosen.split(",")) {
                int want;
                try { want = Integer.parseInt(part.trim()); } catch (Exception e) { continue; }
                for (int i = 0; i < ds.length(); i++) {
                    JSONObject d = ds.optJSONObject(i);
                    if (d != null && d.optInt("d", -1) == want) { sel.drivers.add(d); break; }
                }
                if (sel.drivers.size() >= maxDrivers()) break;
            }
        }
        // Standard: der eigene Fahrer ("Du"/"Ich"), falls es ihn gibt
        if (sel.drivers.isEmpty() && maxDrivers() > 0 && ds != null) {
            for (int i = 0; i < ds.length(); i++) {
                JSONObject d = ds.optJSONObject(i);
                String n = d == null ? "" : d.optString("name").trim().toLowerCase();
                if (n.equals("du") || n.equals("ich") || n.equals("me")) { sel.drivers.add(d); break; }
            }
        }
        JSONArray ts = season.optJSONArray("teams");
        int team = WidgetData.teamOf(ctx, id);
        if (needTeam() && ts != null && team >= 0) {
            for (int i = 0; i < ts.length(); i++) {
                JSONObject t = ts.optJSONObject(i);
                if (t != null && t.optInt("t", -1) == team) { sel.team = t; break; }
            }
        }
        return sel;
    }

    /** Alle Widgets neu zeichnen. */
    static void updateAll(Context ctx) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
        for (BaseWidget w : all()) {
            int[] ids = mgr.getAppWidgetIds(new ComponentName(ctx, w.getClass()));
            for (int id : ids) w.update(ctx, mgr, id);
        }
    }

    /** Das passende Widget für eine ID finden (für die Einrichtung). */
    static BaseWidget forId(Context ctx, int id) {
        android.appwidget.AppWidgetProviderInfo info = AppWidgetManager.getInstance(ctx).getAppWidgetInfo(id);
        String cls = info == null ? "" : info.provider.getClassName();
        for (BaseWidget w : all()) if (w.getClass().getName().equals(cls)) return w;
        return new Top3SmallWidget();
    }
}
