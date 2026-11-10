package de.pasci.f1manager;

import android.app.Activity;
import android.appwidget.AppWidgetManager;
import android.content.Intent;
import android.content.res.ColorStateList;
import android.content.res.Configuration;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.LinearLayout;
import android.widget.RadioButton;
import android.widget.RadioGroup;
import android.widget.ScrollView;
import android.widget.TextView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

/** Wird beim Platzieren (und beim Bearbeiten) eines Widgets geöffnet: Saison, Fahrer und Darstellung wählen. */
public class WidgetConfigActivity extends Activity {
    private int widgetId = AppWidgetManager.INVALID_APPWIDGET_ID;
    private JSONObject data;
    private String season = "cur";
    private final List<Integer> chosen = new ArrayList<>();
    private String theme = "app";
    private String bgMode = "glass";
    private TextView glassStatus;
    private static final int PICK_IMAGE = 41;
    private boolean driversMode;
    private LinearLayout driverBox;
    private TextView driverTitle;
    private int ink, sub, bg, card, accent, line;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        setResult(RESULT_CANCELED);
        Bundle ex = getIntent().getExtras();
        if (ex != null) widgetId = ex.getInt(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID);
        if (widgetId == AppWidgetManager.INVALID_APPWIDGET_ID) { finish(); return; }

        data = WidgetData.load(this);
        driversMode = BaseWidget.forId(this, widgetId) instanceof DriversWidget;
        season = WidgetData.seasonOf(this, widgetId);
        theme = WidgetData.themeOf(this, widgetId);
        bgMode = WidgetGlass.modeOf(this, widgetId);
        for (String p : WidgetData.driversOf(this, widgetId).split(",")) {
            try { chosen.add(Integer.parseInt(p.trim())); } catch (Exception ignored) {}
        }

        boolean night = (getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES;
        ink = night ? 0xFFF2F3F7 : 0xFF12141A;
        sub = night ? 0xFFA9AEBD : 0xFF4F5667;
        bg = night ? 0xFF0E0F14 : 0xFFECEEF3;
        card = night ? 0xFF181A22 : 0xFFFFFFFF;
        line = night ? 0xFF262A36 : 0xFFE1E4EB;
        accent = night ? 0xFFFF5A36 : 0xFFE2401C;
        getWindow().setStatusBarColor(bg);
        getWindow().setNavigationBarColor(bg);

        ScrollView scroll = new ScrollView(this);
        scroll.setBackgroundColor(bg);
        scroll.setFitsSystemWindows(true);
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(18), dp(24), dp(18), dp(24));
        scroll.addView(root);

        root.addView(text("F1 Manager", 12, sub, true));
        TextView h = text("Widget einrichten", 30, ink, true);
        h.setAllCaps(true);
        root.addView(h);

        if (data == null) {
            TextView t = text("Öffne die App einmal, damit das Widget deine Saisons kennt. Danach kannst du es hier einrichten.", 15, sub, false);
            t.setPadding(0, dp(16), 0, dp(16));
            root.addView(t);
        } else {
            root.addView(section("Saison"));
            RadioGroup rg = new RadioGroup(this);
            rg.setBackground(rounded(card, 16));
            rg.setPadding(dp(8), dp(4), dp(8), dp(4));
            addSeason(rg, "cur", "Immer die aktuelle Saison", "folgt der App");
            JSONArray list = data.optJSONArray("seasons");
            if (list != null) for (int i = 0; i < list.length(); i++) {
                JSONObject s = list.optJSONObject(i);
                if (s != null) addSeason(rg, s.optString("id"), s.optString("label"), s.optString("round"));
            }
            root.addView(rg);

            if (driversMode) {
                driverTitle = section("Fahrer");
                root.addView(driverTitle);
                driverBox = new LinearLayout(this);
                driverBox.setOrientation(LinearLayout.VERTICAL);
                driverBox.setBackground(rounded(card, 16));
                driverBox.setPadding(dp(8), dp(4), dp(8), dp(4));
                root.addView(driverBox);
                buildDrivers();
            }

            root.addView(section("Darstellung"));
            RadioGroup tg = new RadioGroup(this);
            tg.setOrientation(RadioGroup.HORIZONTAL);
            String[][] th = { { "app", "Wie App" }, { "light", "Hell" }, { "dark", "Dunkel" } };
            for (String[] x : th) {
                RadioButton rb = radio(x[1]);
                rb.setChecked(x[0].equals(theme));
                rb.setOnClickListener(v -> theme = x[0]);
                tg.addView(rb);
            }
            root.addView(tg);

            root.addView(section("Hintergrund"));
            RadioGroup bgg = new RadioGroup(this);
            String[][] bm = { { "glass", "Milchglas" }, { "tint", "Halbdurchsichtig" } };
            for (String[] x : bm) {
                RadioButton rb = radio(x[1]);
                rb.setChecked(x[0].equals(bgMode));
                rb.setOnClickListener(v -> bgMode = x[0]);
                bgg.addView(rb);
            }
            bgg.setOrientation(RadioGroup.HORIZONTAL);
            root.addView(bgg);
            glassStatus = text("", 14, sub, false);
            glassStatus.setPadding(dp(4), dp(6), 0, dp(8));
            root.addView(glassStatus);
            Button auto = smallButton("Hintergrundbild automatisch nutzen");
            auto.setOnClickListener(v -> askAllFiles());
            root.addView(auto);
            Button pick = smallButton("Bild aus der Galerie wählen");
            pick.setOnClickListener(v -> {
                Intent it = new Intent(Intent.ACTION_GET_CONTENT);
                it.setType("image/*");
                startActivityForResult(Intent.createChooser(it, "Hintergrundbild wählen"), PICK_IMAGE);
            });
            root.addView(pick);
            TextView tip = text("Tipp: Tippe das Widget nach dem Platzieren einmal an. Dann kennt es seine genaue Position und das Glas zeigt genau den Ausschnitt deines Hintergrunds.", 13, sub, false);
            tip.setPadding(dp(4), dp(10), 0, 0);
            root.addView(tip);
            updateGlassStatus();
        }

        Button ok = new Button(this);
        ok.setText(data == null ? "Schließen" : "Widget platzieren");
        ok.setAllCaps(true);
        ok.setTextColor(night ? 0xFF1A0A05 : 0xFFFFFFFF);
        ok.setTypeface(Typeface.create("sans-serif-condensed", Typeface.BOLD));
        ok.setTextSize(TypedValue.COMPLEX_UNIT_SP, 17);
        ok.setBackground(rounded(accent, 16));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(54));
        lp.topMargin = dp(24);
        ok.setLayoutParams(lp);
        ok.setOnClickListener(v -> done());
        root.addView(ok);

        setContentView(scroll);
    }

    private void addSeason(RadioGroup rg, String id, String label, String info) {
        RadioButton rb = radio(info == null || info.isEmpty() ? label : label + "  ·  " + info);
        rb.setChecked(id.equals(season));
        rb.setOnClickListener(v -> { season = id; chosen.clear(); if (driverBox != null) buildDrivers(); });
        rg.addView(rb);
    }

    private void buildDrivers() {
        driverBox.removeAllViews();
        JSONObject s = WidgetData.season(data, season);
        JSONArray ds = s == null ? null : s.optJSONArray("drivers");
        updateDriverTitle();
        if (ds == null) return;
        List<CheckBox> boxes = new ArrayList<>();
        for (int i = 0; i < ds.length(); i++) {
            JSONObject d = ds.optJSONObject(i);
            if (d == null) continue;
            int idx = d.optInt("d");
            String num = d.optString("num", "");
            CheckBox cb = new CheckBox(this);
            cb.setText((num.isEmpty() ? "" : "#" + num + "  ") + d.optString("name") + "   P" + d.optInt("rank") + " · " + d.optInt("pts") + " Pkt");
            cb.setTextColor(ink);
            cb.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
            cb.setButtonTintList(ColorStateList.valueOf(WidgetData.color(d.optString("col"), accent)));
            cb.setMinHeight(dp(44));
            cb.setChecked(chosen.contains(idx));
            cb.setTag(idx);
            cb.setOnCheckedChangeListener((b, on) -> {
                if (on && !chosen.contains(idx)) chosen.add(idx);
                if (!on) chosen.remove(Integer.valueOf(idx));
                for (CheckBox o : boxes) o.setEnabled(o.isChecked() || chosen.size() < 3);
                updateDriverTitle();
            });
            boxes.add(cb);
            driverBox.addView(cb);
        }
        for (CheckBox o : boxes) o.setEnabled(o.isChecked() || chosen.size() < 3);
    }

    private void updateDriverTitle() {
        if (driverTitle != null) driverTitle.setText(("Fahrer · " + chosen.size() + " von 3 gewählt").toUpperCase());
    }

    private void done() {
        if (data != null) {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < chosen.size(); i++) { if (i > 0) sb.append(','); sb.append(chosen.get(i)); }
            WidgetData.save(this, widgetId, season, sb.toString(), theme);
            WidgetGlass.setMode(this, widgetId, bgMode);
        }
        BaseWidget.forId(this, widgetId).update(this, AppWidgetManager.getInstance(this), widgetId);
        BaseWidget.updateAll(this);
        Intent r = new Intent();
        r.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, widgetId);
        setResult(RESULT_OK, r);
        finish();
    }

    @Override
    protected void onResume() {
        super.onResume();
        updateGlassStatus();
    }

    private void updateGlassStatus() {
        if (glassStatus == null) return;
        if (WidgetGlass.canReadWallpaper(this)) glassStatus.setText("Hintergrundbild: wird automatisch gelesen ✓");
        else if (WidgetGlass.hasPicked(this)) glassStatus.setText("Hintergrundbild: eigenes Bild aus der Galerie ✓");
        else glassStatus.setText("Für Milchglas braucht das Widget dein Hintergrundbild. Wähle unten, wie es das bekommt. Sonst wird es halbdurchsichtig.");
    }

    /** Ab Android 13 gibt Android das Hintergrundbild nur mit „Zugriff auf alle Dateien“ heraus. */
    private void askAllFiles() {
        if (android.os.Build.VERSION.SDK_INT >= 30) {
            try {
                Intent it = new Intent(android.provider.Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION, android.net.Uri.parse("package:" + getPackageName()));
                startActivity(it);
            } catch (Exception e) {
                startActivity(new Intent(android.provider.Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION));
            }
        } else {
            requestPermissions(new String[] { android.Manifest.permission.READ_EXTERNAL_STORAGE }, 7);
        }
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data2) {
        super.onActivityResult(req, res, data2);
        if (req != PICK_IMAGE || res != RESULT_OK || data2 == null || data2.getData() == null) return;
        try (java.io.InputStream in = getContentResolver().openInputStream(data2.getData())) {
            android.graphics.BitmapFactory.Options op = new android.graphics.BitmapFactory.Options();
            op.inSampleSize = 2;
            android.graphics.Bitmap b = android.graphics.BitmapFactory.decodeStream(in, null, op);
            if (b != null) { WidgetGlass.savePicked(this, b); bgMode = "glass"; }
        } catch (Exception ignored) {}
        updateGlassStatus();
    }

    private Button smallButton(String label) {
        Button b = new Button(this);
        b.setText(label);
        b.setAllCaps(false);
        b.setTextColor(ink);
        b.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
        b.setBackground(rounded(card, 14));
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(48));
        lp.topMargin = dp(8);
        b.setLayoutParams(lp);
        return b;
    }

    private RadioButton radio(String label) {
        RadioButton rb = new RadioButton(this);
        rb.setText(label);
        rb.setTextColor(ink);
        rb.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
        rb.setButtonTintList(ColorStateList.valueOf(accent));
        rb.setMinHeight(dp(46));
        rb.setPadding(dp(4), 0, dp(12), 0);
        return rb;
    }

    private TextView section(String s) {
        TextView t = text(s.toUpperCase(), 12, sub, true);
        t.setLetterSpacing(0.06f);
        t.setPadding(dp(4), dp(20), 0, dp(8));
        return t;
    }

    private TextView text(String s, int sp, int color, boolean bold) {
        TextView t = new TextView(this);
        t.setText(s);
        t.setTextSize(TypedValue.COMPLEX_UNIT_SP, sp);
        t.setTextColor(color);
        t.setTypeface(Typeface.create("sans-serif-condensed", bold ? Typeface.BOLD : Typeface.NORMAL));
        t.setGravity(Gravity.START);
        return t;
    }

    private GradientDrawable rounded(int color, int r) {
        GradientDrawable g = new GradientDrawable();
        g.setColor(color);
        g.setCornerRadius(dp(r));
        g.setStroke(dp(1) / 2 + 1, line);
        return g;
    }

    private int dp(int v) {
        return Math.round(v * getResources().getDisplayMetrics().density);
    }
}
