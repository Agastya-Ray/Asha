package com.agastyaray.asha;

import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import org.json.JSONArray;
import org.json.JSONObject;

/** "Send a heart back" button on a family message card. */
public class FamilyActionReceiver extends BroadcastReceiver {
    static PendingIntent pending(Context ctx, long id) {
        Intent i = new Intent(ctx, FamilyActionReceiver.class);
        i.setAction("com.agastyaray.asha.FAMILY_HEART." + id);
        i.putExtra("id", id);
        return PendingIntent.getBroadcast(ctx, (int) (30000 + id % 100000), i,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    @Override
    public void onReceive(Context ctx, Intent intent) {
        long id = intent.getLongExtra("id", 0);
        if (id <= 0) return;
        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) nm.cancel((int) (20000 + id % 100000));
        Speaker.get(ctx).stop();
        PendingResult pending = goAsync();
        new Thread(() -> {
            try {
                JSONObject react = new JSONObject();
                react.put("action", "react");
                react.put("id", id);
                react.put("reaction", "❤️");
                FamilyStore.post(ctx, react);
                JSONObject heard = new JSONObject();
                heard.put("action", "heard");
                heard.put("ids", new JSONArray().put(id));
                FamilyStore.post(ctx, heard);
                FamilyStore.setFace(ctx, "idle", "", Math.max(0, FamilyStore.unread(ctx) - 1));
                FairyWidget.refreshAll(ctx);
                FairyBubbleService.refresh(ctx);
                FamilyStore.markChanged(ctx, true);
            } catch (Exception ignored) {
            } finally {
                pending.finish();
            }
        }).start();
    }
}
