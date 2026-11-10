package de.pasci.f1manager;

import android.content.Context;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

/** 3 × 2: die drei Führenden einer Saison. */
public class Top3SmallWidget extends BaseWidget {
    private static final int[] ROW = { R.id.row1, R.id.row2, R.id.row3 };
    private static final int[] POS = { R.id.pos1, R.id.pos2, R.id.pos3 };
    private static final int[] BG = { R.id.b1_bg, R.id.b2_bg, R.id.b3_bg };
    private static final int[] NUM = { R.id.b1_num, R.id.b2_num, R.id.b3_num };
    private static final int[] NAME = { R.id.name1, R.id.name2, R.id.name3 };
    private static final int[] PTS = { R.id.pts1, R.id.pts2, R.id.pts3 };

    @Override int layout() { return R.layout.widget_top3_small; }

    @Override
    void fill(Context ctx, RemoteViews v, int id, JSONObject season, JSONArray drivers, Theme t) {
        v.setTextViewText(R.id.title, season.optString("title"));
        v.setTextColor(R.id.title, t.ink);
        v.setTextViewText(R.id.round, season.optString("round"));
        v.setTextColor(R.id.round, t.sub);
        for (int i = 0; i < 3; i++) {
            JSONObject d = drivers.optJSONObject(i);
            v.setViewVisibility(ROW[i], d == null ? View.INVISIBLE : View.VISIBLE);
            if (d == null) continue;
            int rank = d.optInt("rank", i + 1);
            v.setTextViewText(POS[i], String.valueOf(rank));
            v.setTextColor(POS[i], t.posColor(rank));
            badge(v, BG[i], NUM[i], d);
            v.setTextViewText(NAME[i], d.optString("name"));
            v.setTextColor(NAME[i], t.ink);
            v.setTextViewText(PTS[i], String.valueOf(d.optInt("pts")));
            v.setTextColor(PTS[i], t.ink);
        }
    }

    @Override
    void hideContent(RemoteViews v) {
        for (int r : ROW) v.setViewVisibility(r, View.GONE);
        v.setTextViewText(R.id.title, "F1 Manager");
        v.setTextViewText(R.id.round, "");
    }
}
