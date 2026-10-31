package com.agastyaray.asha;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Calendar;
import java.util.Locale;

/**
 * Runs for a few seconds when a reminder is due:
 * shows a big notification with "Taken" / "10 minutes" buttons, speaks the sentence out loud,
 * and lines up a follow-up if nobody presses anything.
 */
public class ReminderService extends Service {
    public static final String CHANNEL = "asha_reminders";
    private static final int SERVICE_NOTE = 7001;
    private final Handler main = new Handler(Looper.getMainLooper());

    @Override public IBinder onBind(Intent intent) { return null; }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String key = intent != null ? intent.getStringExtra("key") : null;
        int attempt = intent != null ? intent.getIntExtra("attempt", 0) : 0;
        boolean quietEnd = AlarmStore.QUIET_END.equals(key);
        JSONObject t = key != null && !quietEnd ? AlarmStore.find(this, key) : null;

        Notification busy = baseBuilder(this)
            .setContentTitle("Asha")
            .setContentText(t != null ? t.optString("title") : "")
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .build();
        try {
            if (Build.VERSION.SDK_INT >= 34) {
                startForeground(SERVICE_NOTE, busy, ServiceInfo.FOREGROUND_SERVICE_TYPE_SHORT_SERVICE);
            } else {
                startForeground(SERVICE_NOTE, busy);
            }
        } catch (Exception e) {
            // keep going without the foreground status
        }

        if (quietEnd) {
            String line = endQuiet(this);
            JSONObject cfg = AlarmStore.config(this);
            final int id = startId;
            if (line.isEmpty() || !cfg.optBoolean("speak", true)) { finish(id); return START_NOT_STICKY; }
            main.postDelayed(() -> finish(id), 60_000);
            Speaker.get(this).speakWhenSeen(line, cfg.optString("quietLang", "en"),
                (float) cfg.optDouble("rate", 0.92), 1.0f, SEEN_WAIT, ok -> main.post(() -> finish(id)));
            return START_NOT_STICKY;
        }
        if (t == null) { finish(startId); return START_NOT_STICKY; }

        showCard(this, t, attempt);
        FairyBubbleService.popUp(this, t, attempt);
        showHer(this, t, attempt);
        JSONObject cfg = AlarmStore.config(this);
        int maxRepeats = cfg.optInt("repeats", 2);
        int gap = cfg.optInt("repeatMinutes", 10);
        boolean greet = "greet".equals(t.optString("kind"));
        if (greet) {
            // greetings ring once, no follow-up
        } else if (attempt < maxRepeats) {
            AlarmStore.scheduleFollowUp(this, t.optString("key"), attempt + 1,
                System.currentTimeMillis() + gap * 60_000L);
        } else if ("med".equals(t.optString("kind"))) {
            alertFamily(this, t, cfg);
        }

        final int id = startId;
        if (!cfg.optBoolean("speak", true)) { finish(id); return START_NOT_STICKY; }
        main.postDelayed(() -> finish(id), 60_000); // safety stop
        final String key = t.optString("key");
        Speaker.get(this).speakWhenSeen(sentence(t, attempt, maxRepeats), t.optString("lang", "en"),
            (float) cfg.optDouble("rate", 0.92), 1.0f, SEEN_WAIT, () -> onCard(key), ok -> main.post(() -> finish(id)));
        return START_NOT_STICKY;
    }

    /**
     * Her words always match her card: while another reminder's card is up (two ring at the same minute), this one
     * waits its turn and is said when its own card comes (say()).
     */
    static boolean onCard(String key) {
        String a = ReminderAlarmActivity.currentKey();
        if (a != null) return a.equals(key);
        String p = FairyBubbleService.popKeyNow();
        return p == null || p.equals(key);
    }

    /** A reminder that waited its turn is on her card now: say it. */
    static void say(Context ctx, JSONObject t, int attempt) {
        JSONObject cfg = AlarmStore.config(ctx);
        if (t == null || !cfg.optBoolean("speak", true) || AlarmStore.quiet(ctx)) return;
        Speaker.get(ctx).speak(sentence(t, attempt, cfg.optInt("repeats", 2)), t.optString("lang", "en"),
            (float) cfg.optDouble("rate", 0.92), null);
    }

    /** How long the voice waits for her to fly onto the screen (her fly-in takes about a second). */
    static final long SEEN_WAIT = 8_000;

    /**
     * Makes sure she is on the screen with the reminder, so her voice never comes from nowhere.
     * In Asha the app shows it; in use she floats in over the app (popUp); on a locked or sleeping phone the
     * notification's full-screen alarm opens. With "Display over other apps" allowed, Android also lets Asha open
     * the alarm herself, which covers phones where the full-screen alarm is switched off.
     */
    static void showHer(Context ctx, JSONObject t, int attempt) {
        if (FairyBubbleService.appOnScreen() || FairyBubbleService.wouldPop(ctx) || AlarmStore.quiet(ctx)) return;
        if (!FairyBubbleService.canDraw(ctx) || ReminderAlarmActivity.shownNow()) return;
        android.os.PowerManager pm = (android.os.PowerManager) ctx.getSystemService(Context.POWER_SERVICE);
        android.app.KeyguardManager km = (android.app.KeyguardManager) ctx.getSystemService(Context.KEYGUARD_SERVICE);
        boolean lockedOrAsleep = (pm != null && !pm.isInteractive()) || (km != null && km.isKeyguardLocked());
        if (lockedOrAsleep) ReminderAlarmActivity.open(ctx, t.optString("key"), attempt);
    }

    private void finish(int startId) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) stopForeground(STOP_FOREGROUND_REMOVE);
            else stopForeground(true);
        } catch (Exception ignored) { }
        stopSelf(startId);
    }

    // Android 14+: a short service must stop when its time is up.
    @Override
    public void onTimeout(int startId) {
        Speaker.get(this).stop();
        finish(startId);
    }

    /**
     * Quiet mode is over. Shows again every reminder that only buzzed while she was quiet and is still
     * not done, lines up the usual follow-up, and returns what to say: "I'm back" plus those reminders.
     */
    static String endQuiet(Context ctx) {
        JSONObject cfg = AlarmStore.config(ctx);
        StringBuilder say = new StringBuilder(cfg.optString("quietBack"));
        JSONArray missed = AlarmStore.drainQuietMissed(ctx);
        long now = System.currentTimeMillis();
        int gap = cfg.optInt("repeatMinutes", 10);
        for (int i = 0; i < missed.length(); i++) {
            JSONObject t = AlarmStore.find(ctx, missed.optString(i));
            if (t == null || t.optLong("skipUntil", 0) > now) continue; // taken meanwhile
            showCard(ctx, t, 1);
            FairyBubbleService.popUp(ctx, t, 1);
            showHer(ctx, t, 1);
            AlarmStore.scheduleFollowUp(ctx, t.optString("key"), 2, now + gap * 60_000L);
            if (say.length() > 0) say.append(' ');
            say.append(t.optString("say"));
        }
        return say.toString().trim();
    }

    /** endQuiet for phones that refuse to start the service. */
    static void endQuietQuick(Context ctx, android.content.BroadcastReceiver.PendingResult pending) {
        String line = endQuiet(ctx);
        JSONObject cfg = AlarmStore.config(ctx);
        if (line.isEmpty() || !cfg.optBoolean("speak", true)) { pending.finish(); return; }
        Speaker.get(ctx).speakWhenSeen(line, cfg.optString("quietLang", "en"),
            (float) cfg.optDouble("rate", 0.92), 1.0f, SEEN_WAIT, ok -> pending.finish());
    }

    static String sentence(JSONObject t, int attempt, int maxRepeats) {
        if (attempt >= maxRepeats) {
            String last = t.optString("lastAgain");
            if (!last.isEmpty()) return last;
        }
        if (attempt > 0) {
            String again = t.optString("again");
            if (!again.isEmpty()) return again;
        }
        return t.optString("say");
    }

    static Notification.Builder baseBuilder(Context ctx) {
        ensureChannel(ctx);
        Notification.Builder b = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? new Notification.Builder(ctx, CHANNEL)
            : new Notification.Builder(ctx);
        return b.setColor(0xFF1D6B45);
    }

    static void ensureChannel(Context ctx) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        if (nm == null || nm.getNotificationChannel(CHANNEL) != null) return;
        NotificationChannel ch = new NotificationChannel(CHANNEL, "Medicine and meal reminders",
            NotificationManager.IMPORTANCE_HIGH);
        ch.setDescription("Asha speaks these out loud");
        ch.setSound(null, null); // Asha's voice is the sound
        ch.enableVibration(true);
        ch.setVibrationPattern(new long[]{0, 400, 250, 400});
        ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        nm.createNotificationChannel(ch);
    }

    /**
     * The day (yyyy-MM-dd, phone's own time zone) this card's dose belongs to. A repeat or snooze that rings after
     * midnight for a late-evening dose belongs to yesterday, so pressing "Taken" on it never ticks off today's dose.
     */
    static String doseDay(JSONObject t, int attempt) {
        Calendar c = Calendar.getInstance();
        int now = c.get(Calendar.HOUR_OF_DAY) * 60 + c.get(Calendar.MINUTE);
        int at = t.optInt("hour") * 60 + t.optInt("minute");
        if (attempt > 0 && now < at) c.add(Calendar.DAY_OF_YEAR, -1);
        return dayKey(c);
    }

    static String dayKey(Calendar c) {
        return String.format(Locale.US, "%04d-%02d-%02d", c.get(Calendar.YEAR), c.get(Calendar.MONTH) + 1, c.get(Calendar.DAY_OF_MONTH));
    }

    static java.io.File photoFile(Context ctx, String medId) {
        return new java.io.File(new java.io.File(ctx.getFilesDir(), "med-photos"), medId.replaceAll("[^A-Za-z0-9_-]", "") + ".jpg");
    }

    /** The medicine's photo (key looks like "med|<id>|08:00"), or null. */
    static android.graphics.Bitmap photoFor(Context ctx, String key) {
        String[] parts = key.split("\\|");
        if (parts.length < 2 || !"med".equals(parts[0])) return null;
        java.io.File f = photoFile(ctx, parts[1]);
        if (!f.exists()) return null;
        try { return android.graphics.BitmapFactory.decodeFile(f.getAbsolutePath()); } catch (Exception e) { return null; }
    }

    static void showCard(Context ctx, JSONObject t, int attempt) {
        showCard(ctx, t, attempt, true);
    }

    /** alarm = false: a silent card only (quiet mode) */
    static void showCard(Context ctx, JSONObject t, int attempt, boolean alarm) {
        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        String key = t.optString("key");
        boolean med = "med".equals(t.optString("kind"));
        String day = doseDay(t, attempt);

        Intent open = ctx.getPackageManager().getLaunchIntentForPackage(ctx.getPackageName());
        PendingIntent openPi = PendingIntent.getActivity(ctx, AlarmStore.notificationId(key), open,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Notification.Builder b = baseBuilder(ctx)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle(t.optString("title"))
            .setContentText(t.optString("body"))
            .setStyle(new Notification.BigTextStyle().bigText(t.optString("body")))
            .setCategory(Notification.CATEGORY_REMINDER)
            .setPriority(Notification.PRIORITY_MAX)
            .setVisibility(Notification.VISIBILITY_PUBLIC)
            .setContentIntent(openPi)
            .setAutoCancel(true)
            .setOngoing(false);
        if (!"greet".equals(t.optString("kind"))) {
            b.addAction(new Notification.Action.Builder(null, t.optString("doneLabel", med ? "Taken" : "Eaten"),
                ActionReceiver.pending(ctx, key, "taken", day)).build())
            .addAction(new Notification.Action.Builder(null, t.optString("snoozeLabel", "10 min later"),
                ActionReceiver.pending(ctx, key, "snooze", day)).build());
        }
        android.graphics.Bitmap photo = med ? photoFor(ctx, key) : null;
        if (photo != null) {
            // the photo of the real strip or tablet, so there is no doubt which one
            b.setLargeIcon(photo).setStyle(new Notification.BigPictureStyle().bigPicture(photo)
                .setSummaryText(t.optString("body")));
        }
        if (attempt > 0) b.setSubText(t.optString("againLabel", "Reminder " + (attempt + 1)));
        // Not lost among old notifications: on a locked or sleeping phone the fairy opens full screen, like an
        // alarm clock (in use, Android shows a big card at the top). Not in quiet mode, not while Asha is open,
        // and not when the floating fairy is about to fly in with it herself.
        if (alarm && !AlarmStore.quiet(ctx) && !FairyBubbleService.appOnScreen() && !FairyBubbleService.wouldPop(ctx)
            && !ReminderAlarmActivity.offer(key, attempt)) {
            b.setFullScreenIntent(ReminderAlarmActivity.pending(ctx, key, attempt), true);
            ReminderAlarmActivity.opening();
        }
        nm.notify(AlarmStore.notificationId(key), b.build());
        if (!"greet".equals(t.optString("kind"))) {
            AlarmStore.setDue(ctx, key);
            FairyWidget.refreshAll(ctx);
        }
    }

    /**
     * Last reminder went unanswered.
     * Family who use Asha get a free, instant alert through the app (if Maa agreed to share this).
     */
    static void alertFamily(Context ctx, JSONObject t, JSONObject cfg) {
        new Thread(() -> {
            if (FamilyStore.ready(ctx) && FamilyStore.config(ctx).optBoolean("inCircle", false)) {
                try {
                    JSONObject body = new JSONObject();
                    body.put("action", "alert");
                    body.put("template", "missed");
                    body.put("timeEn", t.optString("alertTimeEn"));
                    body.put("timeHi", t.optString("alertTimeHi"));
                    FamilyStore.post(ctx, body);
                } catch (Exception ignored) { }
            }
        }).start();
    }
}
