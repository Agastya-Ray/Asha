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
        if (AlarmStore.QUIET_END.equals(key)) { startService(ctx, key, 0, null); return; }
        JSONObject t = AlarmStore.find(ctx, key);
        if (t == null) return;

        // First ring of the day: line up tomorrow's ring straight away.
        if (attempt == 0) AlarmStore.scheduleNext(ctx, t, true);

        if (t.optLong("skipUntil", 0) > System.currentTimeMillis()) return; // already done today
        // a note hours late (phone was off) is not said out of the blue; the app shows it instead
        long once = t.optLong("onceAt", 0);
        if (once > 0 && System.currentTimeMillis() - once > 2 * 60 * 60 * 1000L) return;

        // Quiet mode: greetings wait for another day; medicines and meals only buzz a silent card
        // and are said out loud when quiet ends.
        if (AlarmStore.quiet(ctx)) {
            if ("greet".equals(t.optString("kind")) && once == 0) return;
            AlarmStore.addQuietMissed(ctx, key);
            ReminderService.showCard(ctx, t, attempt);
            return;
        }
        startService(ctx, key, attempt, t);
    }

    private void startService(Context ctx, String key, int attempt, JSONObject t) {
        Intent svc = new Intent(ctx, ReminderService.class);
        svc.putExtra("key", key);
        svc.putExtra("attempt", attempt);
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) ctx.startForegroundService(svc);
            else ctx.startService(svc);
        } catch (Exception notAllowed) {
            // Some phones refuse background services. Still show the card and speak briefly.
            if (t == null) { ReminderService.endQuietQuick(ctx, goAsync()); return; }
            ReminderService.showCard(ctx, t, attempt);
            FairyBubbleService.popUp(ctx, t, attempt);
            if (!AlarmStore.config(ctx).optBoolean("speak", true)) return;
            PendingResult pending = goAsync();
            Speaker.get(ctx).speak(ReminderService.sentence(t, attempt, AlarmStore.config(ctx).optInt("repeats", 2)), t.optString("lang", "en"),
                (float) AlarmStore.config(ctx).optDouble("rate", 0.92), ok -> pending.finish());
        }
    }
}
