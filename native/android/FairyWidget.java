package com.agastyaray.asha;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONObject;

/**
 * The fairy on the home screen. She sleeps at night, glows when a family message arrives. Tap = open Asha.
 * While a reminder is ringing she shows it with big "Taken" and "Later" buttons, the same as the notification's.
 */
public class FairyWidget extends AppWidgetProvider {
    @Override
    public void onUpdate(Context ctx, AppWidgetManager mgr, int[] ids) {
        for (int id : ids) mgr.updateAppWidget(id, views(ctx));
        // the same half-hourly tick lets the floating fairy fall asleep at night and wake in the morning
        FairyBubbleService.refresh(ctx);
    }

    public static void refreshAll(Context ctx) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
        int[] ids = mgr.getAppWidgetIds(new ComponentName(ctx, FairyWidget.class));
        if (ids == null || ids.length == 0) return;
        RemoteViews v = views(ctx);
        for (int id : ids) mgr.updateAppWidget(id, v);
    }

    private static int id(Context ctx, String name) {
        return ctx.getResources().getIdentifier(name, "id", ctx.getPackageName());
    }

    static int drawableFor(Context ctx, String mood) {
        String name = "happy".equals(mood) ? "fairy_happy" : "sleep".equals(mood) ? "fairy_sleep" : "fairy_idle";
        return ctx.getResources().getIdentifier(name, "drawable", ctx.getPackageName());
    }

    private static RemoteViews views(Context ctx) {
        int layout = ctx.getResources().getIdentifier("fairy_widget", "layout", ctx.getPackageName());
        RemoteViews v = new RemoteViews(ctx.getPackageName(), layout);
        int img = ctx.getResources().getIdentifier("fairy_image", "id", ctx.getPackageName());
        int txt = ctx.getResources().getIdentifier("fairy_text", "id", ctx.getPackageName());
        int root = ctx.getResources().getIdentifier("fairy_root", "id", ctx.getPackageName());
        String mood = FamilyStore.mood(ctx);
        v.setImageViewResource(img, drawableFor(ctx, mood));
        int unread = FamilyStore.unread(ctx);
        String text = FamilyStore.text(ctx);
        if ("sleep".equals(mood)) {
            text = "hi".equals(FamilyStore.config(ctx).optString("lang")) ? "शुभ रात्रि… परी सो रही है." : "Good night… the fairy is sleeping.";
        }
        if (unread > 1) text = ("hi".equals(FamilyStore.config(ctx).optString("lang")) ? unread + " संदेश · " : unread + " messages · ") + text;
        v.setTextViewText(txt, text);
        Intent open = ctx.getPackageManager().getLaunchIntentForPackage(ctx.getPackageName());
        if (open != null) open.putExtra("openTab", "family");
        PendingIntent pi = PendingIntent.getActivity(ctx, 7100, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        v.setOnClickPendingIntent(root, pi);

        int row = id(ctx, "fairy_buttons");
        JSONObject due = AlarmStore.due(ctx);
        if (due == null) {
            v.setViewVisibility(row, View.GONE);
            return v;
        }
        String key = due.optString("key");
        boolean med = "med".equals(due.optString("kind"));
        v.setImageViewResource(img, drawableFor(ctx, "happy"));
        v.setTextViewText(txt, due.optString("title"));
        v.setViewVisibility(row, View.VISIBLE);
        v.setTextViewText(id(ctx, "fairy_taken"), due.optString("doneLabel", med ? "Taken" : "Eaten"));
        v.setTextViewText(id(ctx, "fairy_later"), due.optString("snoozeLabel", "10 min later"));
        v.setOnClickPendingIntent(id(ctx, "fairy_taken"), ActionReceiver.pending(ctx, key, "taken"));
        v.setOnClickPendingIntent(id(ctx, "fairy_later"), ActionReceiver.pending(ctx, key, "snooze"));
        return v;
    }
}
