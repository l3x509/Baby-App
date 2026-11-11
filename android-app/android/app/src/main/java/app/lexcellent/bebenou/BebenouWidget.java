package app.lexcellent.bebenou;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;
import org.json.JSONObject;

/**
 * Home-screen widget: last feed, last diaper and sleep. The web app writes a small JSON
 * summary to Capacitor Preferences (SharedPreferences "CapacitorStorage", key "bebenou_widget");
 * this widget reads it. Free accounts see a short "part of Premium" message instead.
 */
public class BebenouWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context ctx, AppWidgetManager mgr, int[] ids) {
        for (int id : ids) mgr.updateAppWidget(id, build(ctx));
    }

    public static void refreshAll(Context ctx) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
        int[] ids = mgr.getAppWidgetIds(new ComponentName(ctx, BebenouWidget.class));
        for (int id : ids) mgr.updateAppWidget(id, build(ctx));
    }

    private static String ago(long t, String agoWord) {
        long m = Math.max(0, (System.currentTimeMillis() - t) / 60000);
        if (m < 1) return "<1m " + agoWord;
        if (m < 60) return m + "m " + agoWord;
        return (m / 60) + "h " + (m % 60) + "m " + agoWord;
    }

    static RemoteViews build(Context ctx) {
        RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget_bebenou);
        Intent open = new Intent(ctx, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pi = PendingIntent.getActivity(ctx, 0, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        v.setOnClickPendingIntent(R.id.w_root, pi);
        try {
            SharedPreferences sp = ctx.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
            String raw = sp.getString("bebenou_widget", null);
            if (raw == null) { v.setTextViewText(R.id.w_name, "Bebenou"); v.setTextViewText(R.id.w_feed, "Open the app to start"); v.setTextViewText(R.id.w_diaper, ""); v.setTextViewText(R.id.w_sleep, ""); return v; }
            JSONObject d = new JSONObject(raw);
            v.setTextViewText(R.id.w_name, d.optString("name", "Baby"));
            if (d.optBoolean("locked", false)) {
                v.setTextViewText(R.id.w_feed, d.optString("msg", "Widget is part of Premium"));
                v.setTextViewText(R.id.w_diaper, ""); v.setTextViewText(R.id.w_sleep, "");
                return v;
            }
            JSONObject L = d.optJSONObject("labels"); if (L == null) L = new JSONObject();
            String agoW = L.optString("ago", "ago");
            JSONObject f = d.optJSONObject("feed"), di = d.optJSONObject("diaper"), s = d.optJSONObject("sleep");
            v.setTextViewText(R.id.w_feed, L.optString("feed", "Feed") + "  " + (f != null ? ago(f.optLong("t"), agoW) + " · " + f.optString("l") : "—"));
            v.setTextViewText(R.id.w_diaper, L.optString("diaper", "Diaper") + "  " + (di != null ? ago(di.optLong("t"), agoW) + " · " + di.optString("l") : "—"));
            String sl = "—";
            if (s != null) sl = s.optBoolean("on") ? L.optString("now", "now") + " · " + ago(s.optLong("t"), "").trim() : ago(s.optLong("t"), agoW);
            v.setTextViewText(R.id.w_sleep, L.optString("sleep", "Sleep") + "  " + sl);
        } catch (Exception e) {
            v.setTextViewText(R.id.w_feed, "Open Bebenou");
        }
        return v;
    }
}
