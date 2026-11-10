package de.pasci.f1manager;

import android.content.Intent;
import android.graphics.Rect;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    static final String EXTRA_WIDGET = "f1m_widget";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WidgetBridge.class);
        super.onCreate(savedInstanceState);
        fromWidget(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        fromWidget(intent);
    }

    /** Beim Antippen eines Widgets meldet der Launcher dessen Position: damit passt das Milchglas genau. */
    private void fromWidget(Intent intent) {
        if (intent == null || !intent.hasExtra(EXTRA_WIDGET)) return;
        int id = intent.getIntExtra(EXTRA_WIDGET, -1);
        Rect r = intent.getSourceBounds();
        if (id < 0 || r == null) return;
        WidgetGlass.saveBounds(this, id, r);
        new Thread(() -> BaseWidget.updateAll(getApplicationContext())).start();
    }
}
