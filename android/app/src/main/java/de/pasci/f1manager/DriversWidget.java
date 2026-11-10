package de.pasci.f1manager;

import android.content.Context;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

/** 4 × 2: bis zu drei frei gewählte Fahrer. Ohne Auswahl die drei Führenden. */
public class DriversWidget extends BaseWidget {
    private static final int[] TILE = { R.id.tile1, R.id.tile2, R.id.tile3 };
    private static final int[] STRIP = { R.id.strip1, R.id.strip2, R.id.strip3 };
    private static final int[] BG = { R.id.b1_bg, R.id.b2_bg, R.id.b3_bg };
    private static final int[] NUM = { R.id.b1_num, R.id.b2_num, R.id.b3_num };
    private static final int[] RANK = { R.id.rank1, R.id.rank2, R.id.rank3 };
    private static final int[] NAME = { R.id.name1, R.id.name2, R.id.name3 };
    private static final int[] PTS = { R.id.pts1, R.id.pts2, R.id.pts3 };
    private static final int[] LAST = { R.id.last1, R.id.last2, R.id.last3 };
    private static final int[] TREND = { R.id.trend1, R.id.trend2, R.id.trend3 };

    @Override int layout() { return R.layout.widget_drivers; }

    @Override
    void fill(Context ctx, RemoteViews v, int id, JSONObject season, JSONArray drivers, Theme t) {
        v.setViewVisibility(R.id.content, View.VISIBLE);
        List<JSONObject> chosen = new ArrayList<>();
        String sel = WidgetData.driversOf(ctx, id);
        if (!sel.isEmpty()) {
            for (String part : sel.split(",")) {
                int want;
                try { want = Integer.parseInt(part.trim()); } catch (Exception e) { continue; }
                for (int i = 0; i < drivers.length(); i++) {
                    JSONObject d = drivers.optJSONObject(i);
                    if (d != null && d.optInt("d", -1) == want) { chosen.add(d); break; }
                }
            }
        }
        if (chosen.isEmpty()) for (int i = 0; i < Math.min(3, drivers.length()); i++) chosen.add(drivers.optJSONObject(i));
        for (int i = 0; i < 3; i++) {
            JSONObject d = i < chosen.size() ? chosen.get(i) : null;
            v.setViewVisibility(TILE[i], d == null ? View.GONE : View.VISIBLE);
            if (d == null) continue;
            v.setInt(TILE[i], "setBackgroundResource", t.tile);
            v.setInt(STRIP[i], "setColorFilter", WidgetData.color(d.optString("col"), 0xFF888888));
            badge(v, BG[i], NUM[i], d);
            v.setTextViewText(RANK[i], "P" + d.optInt("rank"));
            v.setTextColor(RANK[i], t.posColor(d.optInt("rank")));
            v.setTextViewText(NAME[i], d.optString("name"));
            v.setTextColor(NAME[i], t.ink);
            v.setTextViewText(PTS[i], d.optInt("pts") + " Pkt");
            v.setTextColor(PTS[i], t.ink);
            v.setTextViewText(LAST[i], "Zuletzt " + d.optString("last", "–"));
            v.setTextColor(LAST[i], t.sub);
            int tr = d.optInt("trend", 0);
            v.setTextViewText(TREND[i], tr > 0 ? "▲ " + tr + (tr == 1 ? " Platz" : " Plätze") : tr < 0 ? "▼ " + (-tr) + (tr == -1 ? " Platz" : " Plätze") : "● hält P" + d.optInt("rank"));
            v.setTextColor(TREND[i], tr > 0 ? t.green : tr < 0 ? t.red : t.sub);
        }
    }

    @Override
    void hideContent(RemoteViews v) {
        v.setViewVisibility(R.id.content, View.GONE);
    }
}
