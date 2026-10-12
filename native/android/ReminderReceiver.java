package com.agastyaray.asha;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import org.json.JSONObject;

/** Woken by the system alarm. Hands the work to ReminderService, which shows the card and speaks. */
public class ReminderReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context ctx, Intent intent) {
        String key = intent.getStringExtra("key");
        int attempt = intent.getIntExtra("attempt", 0);
        if (key == null) return;
        JSONObject t = AlarmStore.find(ctx, key);
        if (t == null) return;

        // First ring of the day: line up tomorrow's ring straight away.
        if (attempt == 0) AlarmStore.scheduleNext(ctx, t, true);

        if (t.optLong("skipUntil", 0) > System.currentTimeMillis()) return; // already done today

        Intent svc = new Intent(ctx, ReminderService.class);
        svc.putExtra("key", key);
        svc.putExtra("attempt", attempt);
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) ctx.startForegroundService(svc);
            else ctx.startService(svc);
        } catch (Exception notAllowed) {
            // Some phones refuse background services. Still show the card and speak briefly.
            ReminderService.showCard(ctx, t, attempt);
            if (!AlarmStore.config(ctx).optBoolean("speak", true)) return;
            PendingResult pending = goAsync();
            Speaker.get(ctx).speak(ReminderService.sentence(t, attempt), t.optString("lang", "en"),
                (float) AlarmStore.config(ctx).optDouble("rate", 0.92), ok -> pending.finish());
        }
    }
}
