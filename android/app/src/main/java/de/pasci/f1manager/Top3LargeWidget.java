package de.pasci.f1manager;

import android.content.Context;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

/** 4 × 2: Podium, Vorsprung des Führenden und nächstes Rennen. */
public class Top3LargeWidget extends BaseWidget {
    // Index 0..2 = Platz 1..3
    private static final int[] BG = { R.id.b1_bg, R.id.b2_bg, R.id.b3_bg };
    private static final int[] NUM = { R.id.b1_num, R.id.b2_num, R.id.b3_num };
    private static final int[] NAME = { R.id.name1, R.id.name2, R.id.name3 };
    private static final int[] PTS = { R.id.pts1, R.id.pts2, R.id.pts3 };
    private static final int[] POS = { R.id.pos1, R.id.pos2, R.id.pos3 };
    private static final int[] STEP = { R.id.step1, R.id.step2, R.id.step3 };

    @Override int layout() { return R.layout.widget_top3_large; }

    @Override
    void fill(Context ctx, RemoteViews v, int id, JSONObject season, JSONArray drivers, Theme t) {
        v.setViewVisibility(R.id.content, View.VISIBLE);
        int[] steps = { t.step1, t.step2, t.step3 };
        for (int i = 0; i < 3; i++) {
            JSONObject d = drivers.optJSONObject(i);
            if (d == null) {
                v.setTextViewText(NAME[i], "");
                v.setTextViewText(PTS[i], "");
                continue;
            }
            badge(v, BG[i], NUM[i], d);
            v.setTextViewText(NAME[i], d.optString("short"));
            v.setTextColor(NAME[i], t.ink);
            v.setTextViewText(PTS[i], String.valueOf(d.optInt("pts")));
            v.setTextColor(PTS[i], t.ink);
            v.setTextViewText(POS[i], String.valueOf(i + 1));
            v.setTextColor(POS[i], t.posColor(i + 1));
            v.setInt(STEP[i], "setColorFilter", steps[i]);
        }
        v.setInt(R.id.divider, "setColorFilter", t.sub);
        v.setTextColor(R.id.lbl_gap, t.sub);
        v.setTextColor(R.id.lbl_next, t.sub);
        JSONObject p2 = drivers.optJSONObject(1);
        int gap = season.optInt("gap", 0);
        if (season.optBoolean("champ", false)) {
            v.setTextViewText(R.id.lbl_gap, "Meister");
            v.setTextViewText(R.id.gap, drivers.optJSONObject(0).optString("short"));
            v.setTextViewText(R.id.gap_who, season.optString("title"));
        } else {
            v.setTextViewText(R.id.lbl_gap, "Vorsprung");
            v.setTextViewText(R.id.gap, gap > 0 ? "+" + gap : String.valueOf(gap));
            v.setTextViewText(R.id.gap_who, p2 == null ? "" : "vor " + p2.optString("name"));
        }
        v.setTextColor(R.id.gap, t.green);
        v.setTextColor(R.id.gap_who, t.sub);
        String next = season.optString("next", "");
        v.setTextViewText(R.id.lbl_next, next.isEmpty() ? "Saison" : "Nächstes Rennen");
        v.setTextViewText(R.id.next, next.isEmpty() ? "Beendet" : next);
        v.setTextColor(R.id.next, t.ink);
        v.setTextViewText(R.id.round, season.optString("round"));
        v.setTextColor(R.id.round, t.sub);
    }

    @Override
    void hideContent(RemoteViews v) {
        v.setViewVisibility(R.id.content, View.GONE);
    }
}
