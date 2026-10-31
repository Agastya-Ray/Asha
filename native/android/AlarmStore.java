package com.agastyaray.asha;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.Calendar;

/**
 * Keeps the daily reminder list on the phone and sets the system alarms.
 * Each reminder is a "template": a time of day that repeats every day.
 * After an alarm rings, the next day's alarm is set, so reminders keep going
 * even if the app is never opened again.
 */
public final class AlarmStore {
    private static final String PREFS = "asha_alarms";
    private static final String KEY_TEMPLATES = "templates";
    /** follow-ups and "Later" snoozes still to ring: key -> {at, attempt}, so they survive the app's re-sync and a restart */
    private static final String KEY_FOLLOW = "followUps";
    private static final String KEY_ACTIONS = "actions";
    private static final String KEY_CONFIG = "config";
    private static final String KEY_QUIET_MISSED = "quietMissed";
    public static final String QUIET_END = "quiet|end";

    private AlarmStore() { }

    static SharedPreferences prefs(Context ctx) {
        return ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    // ---------- config (repeat, family alert) ----------

    public static JSONObject config(Context ctx) {
        try { return new JSONObject(prefs(ctx).getString(KEY_CONFIG, "{}")); }
        catch (JSONException e) { return new JSONObject(); }
    }

    public static void saveConfig(Context ctx, JSONObject cfg) {
        prefs(ctx).edit().putString(KEY_CONFIG, cfg.toString()).apply();
    }

    // ---------- quiet mode ("I'm going to an event, be quiet") ----------

    /** True while the person asked the fairy to stay silent. */
    public static boolean quiet(Context ctx) {
        return config(ctx).optLong("quietUntil", 0) > System.currentTimeMillis();
    }

    /** Sets (or clears) the alarm that ends quiet mode. Ending early rings the end straight away. */
    public static void applyQuiet(Context ctx, long oldUntil, long newUntil) {
        long now = System.currentTimeMillis();
        if (newUntil > now) {
            scheduleFollowUp(ctx, QUIET_END, 0, newUntil);
        } else {
            cancel(ctx, QUIET_END, true);
            if (oldUntil > now) scheduleFollowUp(ctx, QUIET_END, 0, now + 1500);
        }
    }

    /** A reminder that came while quiet: remember it, so she says it out loud when quiet ends. */
    public static synchronized void addQuietMissed(Context ctx, String key) {
        JSONArray list = quietMissedList(ctx);
        for (int i = 0; i < list.length(); i++) if (key.equals(list.optString(i))) return;
        list.put(key);
        prefs(ctx).edit().putString(KEY_QUIET_MISSED, list.toString()).apply();
    }

    public static synchronized JSONArray drainQuietMissed(Context ctx) {
        JSONArray list = quietMissedList(ctx);
        prefs(ctx).edit().putString(KEY_QUIET_MISSED, "[]").apply();
        return list;
    }

    private static JSONArray quietMissedList(Context ctx) {
        try { return new JSONArray(prefs(ctx).getString(KEY_QUIET_MISSED, "[]")); }
        catch (JSONException e) { return new JSONArray(); }
    }

    // ---------- templates ----------

    public static JSONArray templates(Context ctx) {
        try { return new JSONArray(prefs(ctx).getString(KEY_TEMPLATES, "[]")); }
        catch (JSONException e) { return new JSONArray(); }
    }

    public static JSONObject find(Context ctx, String key) {
        JSONArray list = templates(ctx);
        for (int i = 0; i < list.length(); i++) {
            JSONObject t = list.optJSONObject(i);
            if (t != null && key.equals(t.optString("key"))) return t;
        }
        return null;
    }

    /** Replaces every reminder with a new list and sets the alarms. */
    public static void replaceAll(Context ctx, JSONArray next) {
        JSONArray old = templates(ctx);
        for (int i = 0; i < old.length(); i++) {
            JSONObject t = old.optJSONObject(i);
            if (t == null) continue;
            cancel(ctx, t.optString("key"), false);
            cancel(ctx, t.optString("key"), true);
        }
        prefs(ctx).edit().putString(KEY_TEMPLATES, next.toString()).apply();
        scheduleAll(ctx);
    }

    public static void scheduleAll(Context ctx) {
        JSONArray list = templates(ctx);
        for (int i = 0; i < list.length(); i++) {
            JSONObject t = list.optJSONObject(i);
            if (t != null) scheduleNext(ctx, t, false);
        }
        restoreFollowUps(ctx, list);
    }

    /**
     * Opening Asha re-sends the reminder list (replaceAll), which cancels every alarm, and a restart clears them all.
     * A "Later" pressed before that must still ring: set again each follow-up that is still ahead and not yet done.
     */
    private static synchronized void restoreFollowUps(Context ctx, JSONArray list) {
        JSONObject all = followUps(ctx);
        JSONObject keep = new JSONObject();
        long now = System.currentTimeMillis();
        java.util.Iterator<String> it = all.keys();
        while (it.hasNext()) {
            String key = it.next();
            JSONObject f = all.optJSONObject(key);
            if (f == null) continue;
            long at = f.optLong("at");
            JSONObject t = null;
            for (int i = 0; i < list.length(); i++) {
                JSONObject x = list.optJSONObject(i);
                if (x != null && key.equals(x.optString("key"))) { t = x; break; }
            }
            if (t == null || at <= now || t.optLong("skipUntil", 0) > now) continue; // gone, past, or done today
            setAlarm(ctx, key, at, f.optInt("attempt", 1), true);
            try { keep.put(key, f); } catch (JSONException ignored) { }
        }
        prefs(ctx).edit().putString(KEY_FOLLOW, keep.toString()).apply();
    }

    private static JSONObject followUps(Context ctx) {
        try { return new JSONObject(prefs(ctx).getString(KEY_FOLLOW, "{}")); } catch (JSONException e) { return new JSONObject(); }
    }

    private static synchronized void rememberFollowUp(Context ctx, String key, int attempt, long at) {
        JSONObject all = followUps(ctx);
        try {
            if (at > 0) all.put(key, new JSONObject().put("at", at).put("attempt", attempt));
            else all.remove(key);
        } catch (JSONException ignored) { }
        prefs(ctx).edit().putString(KEY_FOLLOW, all.toString()).apply();
    }

    /** Sets the alarm for the next time this reminder is due. */
    public static void scheduleNext(Context ctx, JSONObject t, boolean forceTomorrow) {
        long now = System.currentTimeMillis();
        // A one-off note ("remind me to call Ravi at 5"): rings once, never again.
        long once = t.optLong("onceAt", 0);
        if (once > 0) {
            if (once > now) setAlarm(ctx, t.optString("key"), once, 0, false);
            return;
        }
        Calendar c = Calendar.getInstance();
        c.set(Calendar.HOUR_OF_DAY, t.optInt("hour"));
        c.set(Calendar.MINUTE, t.optInt("minute"));
        c.set(Calendar.SECOND, 0);
        c.set(Calendar.MILLISECOND, 0);
        long skipUntil = t.optLong("skipUntil", 0);
        if (forceTomorrow || c.getTimeInMillis() <= now || c.getTimeInMillis() <= skipUntil) {
            c.add(Calendar.DAY_OF_YEAR, 1);
        }
        while (c.getTimeInMillis() <= skipUntil) c.add(Calendar.DAY_OF_YEAR, 1);
        // Medicines taken only on some weekdays: move on to the next of those days.
        JSONArray days = t.optJSONArray("days");
        if (days != null && days.length() > 0) {
            for (int i = 0; i < 7 && !hasDay(days, c.get(Calendar.DAY_OF_WEEK)); i++) c.add(Calendar.DAY_OF_YEAR, 1);
        }
        setAlarm(ctx, t.optString("key"), c.getTimeInMillis(), 0, false);
    }

    private static boolean hasDay(JSONArray days, int day) {
        for (int i = 0; i < days.length(); i++) if (days.optInt(i) == day) return true;
        return false;
    }

    /** A follow-up ("are you sure you took it?") some minutes after the first reminder. */
    public static void scheduleFollowUp(Context ctx, String key, int attempt, long atMillis) {
        if (!QUIET_END.equals(key)) rememberFollowUp(ctx, key, attempt, atMillis);
        setAlarm(ctx, key, atMillis, attempt, true);
    }

    private static void setAlarm(Context ctx, String key, long at, int attempt, boolean followUp) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        PendingIntent pi = alarmIntent(ctx, key, attempt, followUp);
        boolean exact = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || am.canScheduleExactAlarms();
        try {
            if (exact) {
                Intent open = ctx.getPackageManager().getLaunchIntentForPackage(ctx.getPackageName());
                PendingIntent show = PendingIntent.getActivity(ctx, 0, open,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
                am.setAlarmClock(new AlarmManager.AlarmClockInfo(at, show), pi);
            } else {
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
            }
        } catch (SecurityException e) {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
        }
    }

    public static void cancel(Context ctx, String key, boolean followUp) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        PendingIntent pi = alarmIntent(ctx, key, 0, followUp);
        am.cancel(pi);
        pi.cancel();
    }

    private static PendingIntent alarmIntent(Context ctx, String key, int attempt, boolean followUp) {
        Intent i = new Intent(ctx, ReminderReceiver.class);
        i.setAction("com.agastyaray.asha.REMIND." + (followUp ? "F" : "M"));
        i.putExtra("key", key);
        i.putExtra("attempt", attempt);
        int code = requestCode(key, followUp);
        return PendingIntent.getBroadcast(ctx, code, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    public static int requestCode(String key, boolean followUp) {
        return (key + (followUp ? "#f" : "#m")).hashCode() & 0x7fffffff;
    }

    public static int notificationId(String key) {
        return (key + "#n").hashCode() & 0x7fffffff;
    }

    /** Marks a reminder as done for today (from the notification button) so it does not ring again today. */
    public static void markDoneToday(Context ctx, String key) {
        JSONArray list = templates(ctx);
        Calendar end = Calendar.getInstance();
        end.set(Calendar.HOUR_OF_DAY, 23);
        end.set(Calendar.MINUTE, 59);
        end.set(Calendar.SECOND, 59);
        for (int i = 0; i < list.length(); i++) {
            JSONObject t = list.optJSONObject(i);
            if (t != null && key.equals(t.optString("key"))) {
                try { t.put("skipUntil", end.getTimeInMillis()); } catch (JSONException ignored) { }
            }
        }
        prefs(ctx).edit().putString(KEY_TEMPLATES, list.toString()).apply();
        cancel(ctx, key, true);
        rememberFollowUp(ctx, key, 0, 0); // done: no more follow-ups
    }

    // ---------- actions pressed on the notification, read by the app later ----------

    public static synchronized void pushAction(Context ctx, String key, String action, String day) {
        JSONArray list;
        try { list = new JSONArray(prefs(ctx).getString(KEY_ACTIONS, "[]")); }
        catch (JSONException e) { list = new JSONArray(); }
        JSONObject o = new JSONObject();
        try {
            o.put("key", key);
            o.put("action", action);
            o.put("at", System.currentTimeMillis());
            if (day != null) o.put("day", day);
        } catch (JSONException ignored) { }
        list.put(o);
        prefs(ctx).edit().putString(KEY_ACTIONS, list.toString()).apply();
    }

    public static synchronized JSONArray drainActions(Context ctx) {
        JSONArray list;
        try { list = new JSONArray(prefs(ctx).getString(KEY_ACTIONS, "[]")); }
        catch (JSONException e) { list = new JSONArray(); }
        prefs(ctx).edit().putString(KEY_ACTIONS, "[]").apply();
        return list;
    }

    // ---------- the reminder ringing now, shown with Taken / Later on the home-screen fairy ----------

    private static final String KEY_DUE = "dueNow";
    private static final long DUE_FOR = 3 * 60 * 60_000L;

    public static void setDue(Context ctx, String key) {
        prefs(ctx).edit().putString(KEY_DUE, key + "|" + System.currentTimeMillis()).apply();
    }

    public static void clearDue(Context ctx, String key) {
        String cur = prefs(ctx).getString(KEY_DUE, "");
        if (key == null || cur.startsWith(key + "|")) prefs(ctx).edit().remove(KEY_DUE).apply();
    }

    /** The reminder still waiting for an answer, or null: rang in the last 3 hours and not marked since. */
    public static JSONObject due(Context ctx) {
        String cur = prefs(ctx).getString(KEY_DUE, "");
        int bar = cur.lastIndexOf('|');
        if (bar <= 0) return null;
        long at;
        try { at = Long.parseLong(cur.substring(bar + 1)); } catch (NumberFormatException e) { return null; }
        long now = System.currentTimeMillis();
        if (now - at > DUE_FOR) return null;
        JSONObject t = find(ctx, cur.substring(0, bar));
        if (t == null || "greet".equals(t.optString("kind")) || t.optLong("skipUntil", 0) > now) return null;
        return t;
    }
}
