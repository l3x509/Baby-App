package app.lexcellent.bebenou;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Lets the web app ask the home-screen widget to redraw right after it saves new data. */
@CapacitorPlugin(name = "BebenouWidget")
public class WidgetPlugin extends Plugin {
    @PluginMethod
    public void refresh(PluginCall call) {
        BebenouWidget.refreshAll(getContext());
        call.resolve();
    }
}
