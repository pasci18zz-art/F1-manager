package de.pasci.f1manager;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Die App ruft refresh() auf, nachdem sie neue Widget-Daten gespeichert hat. */
@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridge extends Plugin {
    @PluginMethod
    public void refresh(PluginCall call) {
        try {
            BaseWidget.updateAll(getContext());
            call.resolve();
        } catch (Exception e) {
            call.reject("Widgets konnten nicht aktualisiert werden", e);
        }
    }
}
