package com.agastyaray.asha;

import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import java.util.Calendar;

/** "Taken" and "10 min later" buttons on the reminder notification. */
public class ActionReceiver extends BroadcastReceiver {
    /** day = the day the card's dose belongs to (see ReminderService.doseDay) */
    static PendingIntent pending(Context ctx, String key, String action, String day) {
        Intent i = new Intent(ctx, ActionReceiver.class);
        i.setAction("com.agastyaray.asha.ACTION." + action);
        i.putExtra("key", key);
        i.putExtra("action", action);
        i.putExtra("day", day);
        int code = (key + "#" + action).hashCode() & 0x7fffffff;
        return PendingIntent.getBroadcast(ctx, code, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    @Override
    public void onReceive(Context ctx, Intent intent) {
        String key = intent.getStringExtra("key");
        String action = intent.getStringExtra("action");
        if (key == null || action == null) return;
        Speaker.get(ctx).stop();
        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) nm.cancel(AlarmStore.notificationId(key));

        String day = intent.getStringExtra("day");
        boolean today = day == null || day.equals(ReminderService.dayKey(Calendar.getInstance()));
        if (!today) {
            // A card left over from yesterday: record it for yesterday, and leave today's reminder alone.
            if ("taken".equals(action)) AlarmStore.pushAction(ctx, key, action, day);
            return;
        }
        if ("taken".equals(action)) {
            AlarmStore.markDoneToday(ctx, key);
        } else if ("snooze".equals(action)) {
            int gap = AlarmStore.config(ctx).optInt("snoozeMinutes", 10);
            AlarmStore.scheduleFollowUp(ctx, key, 1, System.currentTimeMillis() + gap * 60_000L);
        }
        AlarmStore.pushAction(ctx, key, action, day);
    }
}
