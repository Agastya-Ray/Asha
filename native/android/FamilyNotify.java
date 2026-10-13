package com.agastyaray.asha;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.os.Build;

import org.json.JSONObject;

import java.util.Map;

/**
 * Shows a family message: a notification card, the fairy wakes up on the widget and bubble,
 * and on Maa's phone Asha reads it out loud (not during quiet hours).
 */
public final class FamilyNotify {
    static final String CH_VOICE = "asha_family_voice"; // Maa: silent card, Asha's voice is the sound
    static final String CH_FAMILY = "asha_family";      // family members: normal notification sound
    static final String CH_URGENT = "asha_urgent";      // Help / missed medicine: alarm sound

    private FamilyNotify() { }

    public static void handle(Context ctx, Map<String, String> d) {
        JSONObject cfg = FamilyStore.config(ctx);
        String kind = val(d, "kind");
        long id = parseLong(val(d, "id"));
        if (id > 0 && id <= FamilyStore.lastId(ctx) && !"reaction".equals(kind)) return; // already shown
        if (id > 0 && !"reaction".equals(kind)) FamilyStore.setLastId(ctx, id);

        String lang = cfg.optString("lang", "en");
        String voiceLang = cfg.optString("voiceLang", lang);
        String text = pick(d, lang);
        String said = pick(d, voiceLang);
        String title = "hi".equals(lang) ? val(d, "title_hi") : val(d, "title_en");
        if (title.isEmpty()) title = "Asha";
        boolean urgent = "1".equals(val(d, "urgent"));
        boolean quiet = "1".equals(val(d, "quiet")) || (!urgent && FamilyStore.quietNow(ctx));
        boolean elder = "elder".equals(cfg.optString("role", "elder"));

        showCard(ctx, id, title, text, urgent, elder, quiet, kind);

        if (!"reaction".equals(kind)) {
            int unread = FamilyStore.unread(ctx) + 1;
            FamilyStore.setFace(ctx, "happy", text, unread);
            FairyWidget.refreshAll(ctx);
            FairyBubbleService.refresh(ctx);
            FamilyStore.markChanged(ctx, true);
            AshaNativePlugin.emitFamily();
        }

        // Maa hears it in Asha's voice. Family members are often at work, so their phones stay quiet.
        if (elder && cfg.optBoolean("voiceOn", true) && (!quiet || urgent) && !said.isEmpty()) {
            Speaker.get(ctx).speak(said, voiceLang, 0.92f, null);
        }
    }

    static void ensureChannels(Context ctx) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        if (nm == null) return;
        if (nm.getNotificationChannel(CH_VOICE) == null) {
            NotificationChannel c = new NotificationChannel(CH_VOICE, "Love from family (spoken)", NotificationManager.IMPORTANCE_HIGH);
            c.setDescription("Asha reads these messages out loud");
            c.setSound(null, null);
            c.enableVibration(true);
            nm.createNotificationChannel(c);
        }
        if (nm.getNotificationChannel(CH_FAMILY) == null) {
            NotificationChannel c = new NotificationChannel(CH_FAMILY, "Family updates", NotificationManager.IMPORTANCE_DEFAULT);
            c.setDescription("Sweet updates and messages from your family circle");
            nm.createNotificationChannel(c);
        }
        if (nm.getNotificationChannel(CH_URGENT) == null) {
            NotificationChannel c = new NotificationChannel(CH_URGENT, "Urgent: Help and missed medicine", NotificationManager.IMPORTANCE_HIGH);
            c.setDescription("When she presses Help, or misses a medicine");
            c.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM),
                new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).build());
            c.enableVibration(true);
            c.setVibrationPattern(new long[]{0, 600, 300, 600, 300, 600});
            c.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            nm.createNotificationChannel(c);
        }
    }

    private static void showCard(Context ctx, long id, String title, String text, boolean urgent, boolean elder, boolean quiet, String kind) {
        ensureChannels(ctx);
        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        String channel = urgent ? CH_URGENT : elder ? CH_VOICE : CH_FAMILY;
        Intent open = ctx.getPackageManager().getLaunchIntentForPackage(ctx.getPackageName());
        if (open != null) open.putExtra("openTab", "family");
        PendingIntent openPi = PendingIntent.getActivity(ctx, 9000 + (int) (id % 1000), open,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder b = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? new Notification.Builder(ctx, channel)
            : new Notification.Builder(ctx);
        b.setSmallIcon(android.R.drawable.star_on)
            .setColor(urgent ? 0xFF8F1D32 : 0xFF1D6B45)
            .setContentTitle(title)
            .setContentText(text)
            .setStyle(new Notification.BigTextStyle().bigText(text))
            .setContentIntent(openPi)
            .setAutoCancel(true)
            .setCategory(urgent ? Notification.CATEGORY_ALARM : Notification.CATEGORY_MESSAGE)
            .setVisibility(Notification.VISIBILITY_PUBLIC);
        try {
            b.setLargeIcon(android.graphics.BitmapFactory.decodeResource(ctx.getResources(),
                ctx.getResources().getIdentifier("fairy_happy", "drawable", ctx.getPackageName())));
        } catch (Exception ignored) { }
        if (quiet && !urgent) {
            b.setOnlyAlertOnce(true);
            if (Build.VERSION.SDK_INT >= 31) b.setSilent(true);
        }
        if (id > 0 && !"reaction".equals(kind) && !"test".equals(kind)) {
            String heart = "hi".equals(FamilyStore.config(ctx).optString("lang")) ? "❤️ दिल भेजें" : "❤️ Send a heart back";
            b.addAction(new Notification.Action.Builder(null, heart, FamilyActionReceiver.pending(ctx, id)).build());
        }
        nm.notify(id > 0 ? (int) (20000 + id % 100000) : 19999, b.build());
    }

    private static String pick(Map<String, String> d, String lang) {
        String t = val(d, "hi".equals(lang) ? "hi" : "en");
        return t.isEmpty() ? val(d, "en") : t;
    }

    static String val(Map<String, String> d, String k) {
        String v = d.get(k);
        return v == null ? "" : v;
    }

    static long parseLong(String s) {
        try { return Long.parseLong(s); } catch (Exception e) { return 0; }
    }
}
