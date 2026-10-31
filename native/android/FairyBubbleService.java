package com.agastyaray.asha;

import android.animation.ObjectAnimator;
import android.animation.ValueAnimator;
import android.annotation.SuppressLint;
import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.pm.ServiceInfo;
import android.content.Context;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.SystemClock;
import android.provider.Settings;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewConfiguration;
import android.view.WindowManager;
import android.view.animation.OvershootInterpolator;
import android.widget.ImageView;
import android.widget.TextView;

import org.json.JSONObject;

/**
 * The floating fairy that lives on the phone screen, on top of other apps, even when Asha is closed.
 * Drag her anywhere; tap her to open Asha. She glows when a family message arrives and sleeps at night
 * and in quiet mode. Drop her at the bottom of the screen and she naps for an hour.
 *
 * At reminder time she flies to the middle of the screen with big "Taken" / "Later" buttons and stays
 * there until answered, so a reminder is never lost among old notifications. She does this even if the
 * person turned the floating fairy off (as long as "Display over other apps" is allowed): she visits,
 * then leaves again.
 *
 * While Asha itself is open she hides, because the fairy inside the app takes over.
 * Needs the "Display over other apps" permission.
 * Runs as a foreground service with a quiet notification: Android does not let a plain background
 * service start after a restart, and stops one about a minute after Asha leaves the screen.
 */
public class FairyBubbleService extends Service {
    static final String ACTION_CHECK = "com.agastyaray.asha.FAIRY_CHECK";
    private static final long NAP = 60 * 60_000L;
    private static final long POP_FOR = 3 * 60 * 60_000L;

    private static FairyBubbleService running;
    /** Asha's own screen is showing: the fairy inside the app takes over */
    private static boolean appVisible;

    private final Handler main = new Handler(Looper.getMainLooper());
    private WindowManager wm;
    private ImageView view;
    private WindowManager.LayoutParams lp;
    private TextView napZone;
    private View pop;
    private String popKey;
    /** reminders that rang while she was showing another one (key, attempt), shown next */
    private final java.util.ArrayList<Object[]> waiting = new java.util.ArrayList<>();
    private ObjectAnimator bob;
    private final Runnable napOver = this::wake;
    private final Runnable popTimeout = () -> closePop(null);

    public static boolean canDraw(Context ctx) {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(ctx);
    }

    public static boolean isRunning() { return running != null; }

    public static boolean start(Context ctx) {
        if (!canDraw(ctx)) return false;
        keepAlive(ctx, true);
        return launch(ctx, new Intent(ctx, FairyBubbleService.class));
    }

    private static boolean launch(Context ctx, Intent i) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) ctx.startForegroundService(i);
            else ctx.startService(i);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public static void stop(Context ctx) {
        keepAlive(ctx, false);
        FairyBubbleService s = running;
        // a reminder she is showing stays until it is answered
        if (s != null && s.pop != null) { s.main.post(s::removeBubble); return; }
        ctx.stopService(new Intent(ctx, FairyBubbleService.class));
    }

    public static void refresh(Context ctx) {
        FairyBubbleService s = running;
        if (s == null || s.view == null) return;
        s.view.post(() -> { if (s.view != null) s.view.setImageResource(FairyWidget.drawableFor(ctx, face(ctx))); });
    }

    /** Asha's screen came up or went away (from the plugin). Leaving Asha is also the moment to bring her back. */
    public static void setAppVisible(Context ctx, boolean visible) {
        appVisible = visible;
        FairyBubbleService s = running;
        if (s != null) s.main.post(s::applyVisibility);
        else if (!visible && FamilyStore.bubbleOn(ctx)) start(ctx);
    }

    /**
     * Will popUp show the reminder on the screen right now? (The phone is in use, unlocked, outside Asha.)
     * If not, the reminder notification opens the full-screen alarm instead.
     */
    public static boolean wouldPop(Context ctx) {
        if (appVisible || !canDraw(ctx) || AlarmStore.quiet(ctx)) return false;
        android.os.PowerManager pm = (android.os.PowerManager) ctx.getSystemService(Context.POWER_SERVICE);
        android.app.KeyguardManager km = (android.app.KeyguardManager) ctx.getSystemService(Context.KEYGUARD_SERVICE);
        return pm != null && pm.isInteractive() && (km == null || !km.isKeyguardLocked());
    }

    /**
     * Which of her floating windows is on the screen right now: "pop" (the big card), "bubble" (the little
     * fairy), or null. Overlays never show over the lock screen, and not while the screen is off.
     */
    static String drawnNow(Context ctx) {
        FairyBubbleService s = running;
        if (s == null) return null;
        android.os.PowerManager pm = (android.os.PowerManager) ctx.getSystemService(Context.POWER_SERVICE);
        android.app.KeyguardManager km = (android.app.KeyguardManager) ctx.getSystemService(Context.KEYGUARD_SERVICE);
        if (pm == null || !pm.isInteractive() || (km != null && km.isKeyguardLocked())) return null;
        View p = s.pop, v = s.view;
        if (p != null && p.isAttachedToWindow() && p.getVisibility() == View.VISIBLE && p.getWindowVisibility() == View.VISIBLE) return "pop";
        if (v != null && v.isAttachedToWindow() && v.getVisibility() == View.VISIBLE && v.getWindowVisibility() == View.VISIBLE && v.getAlpha() > 0.2f) return "bubble";
        return null;
    }

    /**
     * A family message is read out loud: she flies in with it on her card (just "Okay"), so the voice never
     * comes from nowhere. Only when the phone is in use outside Asha and she may draw over apps.
     */
    public static void popMessage(Context ctx, long id, String title, String body) {
        if (!wouldPop(ctx)) return;
        FairyBubbleService s = running;
        JSONObject t = messageCard(id, title, body);
        if (s != null) { s.main.post(() -> s.showPop(t, 0)); return; }
        Intent i = new Intent(ctx, FairyBubbleService.class);
        i.putExtra("msgId", id);
        i.putExtra("msgTitle", title);
        i.putExtra("msgBody", body);
        launch(ctx, i);
    }

    private static JSONObject messageCard(long id, String title, String body) {
        JSONObject t = new JSONObject();
        try {
            t.put("key", "family|" + id);
            t.put("kind", "greet"); // one "Okay" button
            t.put("title", title);
            t.put("body", body);
        } catch (Exception ignored) { }
        return t;
    }

    /** The reminder on her floating card right now, or null. */
    static String popKeyNow() {
        FairyBubbleService s = running;
        return s == null || s.pop == null ? null : s.popKey;
    }

    /** Asha's own screen is showing (the app shows due reminders itself). */
    public static boolean appOnScreen() { return appVisible; }

    /** A reminder is ringing: fly onto the screen with it. Not while Asha is open (it shows the reminder itself). */
    public static void popUp(Context ctx, JSONObject t, int attempt) {
        if (t == null || appVisible || !canDraw(ctx) || AlarmStore.quiet(ctx)) return;
        FairyBubbleService s = running;
        if (s != null) { s.main.post(() -> s.showPop(t, attempt)); return; }
        Intent i = new Intent(ctx, FairyBubbleService.class);
        i.putExtra("pop", t.optString("key"));
        i.putExtra("attempt", attempt);
        launch(ctx, i);
    }

    /** The reminder was answered somewhere (notification, home-screen fairy, inside Asha). key null = whatever she shows. */
    public static void answered(String key) {
        FairyBubbleService s = running;
        if (s == null) return;
        s.main.post(() -> {
            if (key != null) {
                for (java.util.Iterator<Object[]> it = s.waiting.iterator(); it.hasNext(); ) if (key.equals(it.next()[0])) it.remove();
            }
            if (key == null || key.equals(s.popKey)) s.closePop(null);
        });
    }

    /** After reminders change in the app: put away a reminder that was marked there. */
    public static void recheck(Context ctx) {
        FairyBubbleService s = running;
        if (s == null || s.popKey == null) return;
        JSONObject t = AlarmStore.find(ctx, s.popKey);
        if (t == null || t.optLong("skipUntil", 0) > System.currentTimeMillis()) answered(s.popKey);
    }

    /**
     * Every half hour (whenever the phone is awake anyway, so no extra battery) check she is still there.
     * Some phones close apps that sit in the background for long; this brings her back.
     */
    static void keepAlive(Context ctx, boolean on) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        Intent i = new Intent(ctx, BootReceiver.class).setAction(ACTION_CHECK);
        PendingIntent pi = PendingIntent.getBroadcast(ctx, 7202, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        if (on) am.setInexactRepeating(AlarmManager.ELAPSED_REALTIME, SystemClock.elapsedRealtime() + AlarmManager.INTERVAL_HALF_HOUR,
            AlarmManager.INTERVAL_HALF_HOUR, pi);
        else am.cancel(pi);
    }

    private static String face(Context ctx) {
        return AlarmStore.quiet(ctx) ? "sleep" : FamilyStore.mood(ctx);
    }

    private static boolean hindi(Context ctx) {
        return "hi".equals(FamilyStore.config(ctx).optString("lang"));
    }

    @Override public IBinder onBind(Intent intent) { return null; }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        goForeground();
        wm = (WindowManager) getSystemService(WINDOW_SERVICE);
        running = this;
        String popWanted = intent != null ? intent.getStringExtra("pop") : null;
        if (!canDraw(this)) { quit(); return START_NOT_STICKY; }
        if (FamilyStore.bubbleOn(this)) {
            long napUntil = FamilyStore.prefs(this).getLong("napUntil", 0);
            long left = napUntil - System.currentTimeMillis();
            if (left > 0) { main.removeCallbacks(napOver); main.postDelayed(napOver, left); }
            else addBubble();
        }
        if (popWanted != null) showPop(AlarmStore.find(this, popWanted), intent.getIntExtra("attempt", 0));
        String msgTitle = intent != null ? intent.getStringExtra("msgTitle") : null;
        if (msgTitle != null) showPop(messageCard(intent.getLongExtra("msgId", 0), msgTitle, intent.getStringExtra("msgBody")), 0);
        if (view == null && pop == null && !FamilyStore.bubbleOn(this)) { quit(); return START_NOT_STICKY; }
        return START_STICKY;
    }

    // ---------- the little fairy that sits on the screen ----------

    @SuppressLint("ClickableViewAccessibility")
    private void addBubble() {
        if (view != null) return;
        view = new ImageView(this);
        view.setImageResource(FairyWidget.drawableFor(this, face(this)));
        view.setContentDescription("Asha");
        int size = (int) (76 * getResources().getDisplayMetrics().density);
        lp = new WindowManager.LayoutParams(size, (int) (size * 1.17), overlayType(),
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT);
        lp.gravity = Gravity.TOP | Gravity.START;
        lp.x = FamilyStore.prefs(this).getInt("bx", 24);
        lp.y = FamilyStore.prefs(this).getInt("by", 400);
        final int slop = ViewConfiguration.get(this).getScaledTouchSlop();
        view.setOnTouchListener(new View.OnTouchListener() {
            int sx, sy;
            float tx, ty;
            boolean moved;
            @Override
            public boolean onTouch(View v, MotionEvent e) {
                switch (e.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        sx = lp.x; sy = lp.y; tx = e.getRawX(); ty = e.getRawY(); moved = false;
                        return true;
                    case MotionEvent.ACTION_MOVE:
                        int dx = (int) (e.getRawX() - tx), dy = (int) (e.getRawY() - ty);
                        if (!moved && (Math.abs(dx) > slop || Math.abs(dy) > slop)) { moved = true; showNapZone(true); }
                        lp.x = sx + dx; lp.y = sy + dy;
                        try { wm.updateViewLayout(view, lp); } catch (Exception ignored) { }
                        if (napZone != null) napZone.setAlpha(inNapZone(e.getRawY()) ? 1f : 0.6f);
                        return true;
                    case MotionEvent.ACTION_UP:
                        if (!moved) {
                            openAsha("family");
                        } else {
                            showNapZone(false);
                            if (inNapZone(e.getRawY())) nap(); // she curls up right where she was dropped, on the floor of the screen
                            else FamilyStore.prefs(FairyBubbleService.this).edit().putInt("bx", lp.x).putInt("by", lp.y).apply();
                        }
                        return true;
                    default:
                        return false;
                }
            }
        });
        try {
            wm.addView(view, lp);
            applyVisibility();
        } catch (Exception e) {
            view = null;
        }
    }

    private void removeBubble() {
        main.removeCallbacks(napOver);
        showNapZone(false);
        if (view != null) {
            try { wm.removeView(view); } catch (Exception ignored) { }
            view = null;
        }
        if (pop == null) quit();
    }

    private void applyVisibility() {
        if (view != null) view.setVisibility(appVisible || pop != null ? View.GONE : View.VISIBLE);
        if (pop != null) pop.setVisibility(appVisible ? View.GONE : View.VISIBLE);
    }

    private boolean inNapZone(float rawY) {
        return rawY > getResources().getDisplayMetrics().heightPixels * 0.85f;
    }

    /** While she is dragged: "drop me here to nap" at the bottom of the screen. */
    private void showNapZone(boolean show) {
        if (!show) {
            if (napZone != null) { try { wm.removeView(napZone); } catch (Exception ignored) { } napZone = null; }
            return;
        }
        if (napZone != null) return;
        float d = getResources().getDisplayMetrics().density;
        napZone = new TextView(this);
        napZone.setText(hindi(this) ? "🌙  यहाँ छोड़ें, मैं एक घंटा सो लूँगी" : "🌙  Drop me here and I'll nap for an hour");
        napZone.setTextSize(18);
        napZone.setTextColor(0xFF33210F);
        napZone.setGravity(Gravity.CENTER);
        napZone.setBackgroundResource(getResources().getIdentifier("fairy_pop_bg", "drawable", getPackageName()));
        napZone.setPadding((int) (16 * d), (int) (14 * d), (int) (16 * d), (int) (14 * d));
        napZone.setAlpha(0.6f);
        WindowManager.LayoutParams p = new WindowManager.LayoutParams(WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.WRAP_CONTENT, overlayType(),
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE,
            PixelFormat.TRANSLUCENT);
        p.gravity = Gravity.BOTTOM;
        p.y = (int) (24 * d);
        p.horizontalMargin = 0.04f;
        try { wm.addView(napZone, p); } catch (Exception e) { napZone = null; }
    }

    /** She yawns, curls up and fades away; back in an hour. Reminders still bring her straight back. */
    private void nap() {
        FamilyStore.prefs(this).edit().putLong("napUntil", System.currentTimeMillis() + NAP).apply();
        final ImageView v = view;
        if (v == null) return;
        v.setImageResource(getResources().getIdentifier("fairy_yawn", "drawable", getPackageName()));
        main.postDelayed(() -> {
            if (view != v) return;
            v.setImageResource(FairyWidget.drawableFor(this, "sleep"));
            v.animate().alpha(0f).setStartDelay(900).setDuration(1400).withEndAction(() -> {
                if (view != v) return;
                try { wm.removeView(v); } catch (Exception ignored) { }
                view = null;
            }).start();
        }, 1200);
        main.removeCallbacks(napOver);
        main.postDelayed(napOver, NAP);
    }

    private void wake() {
        FamilyStore.prefs(this).edit().remove("napUntil").apply();
        if (FamilyStore.bubbleOn(this)) addBubble();
        else if (pop == null) quit();
    }

    // ---------- at reminder time: she flies onto the screen with the reminder ----------

    private void showPop(JSONObject t, int attempt) {
        if (t == null || !canDraw(this)) return;
        String key = t.optString("key");
        if (pop != null && !key.equals(popKey)) {
            // one at a time, big and clear: the other waits its turn
            for (Object[] w : waiting) if (key.equals(w[0])) { w[1] = attempt; return; }
            waiting.add(new Object[]{key, attempt});
            return;
        }
        boolean fresh = pop == null;
        if (fresh) {
            int layout = getResources().getIdentifier("fairy_pop", "layout", getPackageName());
            pop = LayoutInflater.from(this).inflate(layout, null);
        }
        popKey = key;
        ImageView fairy = pop.findViewById(id("pop_fairy"));
        FairyCard.fill(this, pop, t, attempt, new FairyCard.Actions() {
            @Override public void answer(PendingIntent pi, boolean taken) { act(pi, taken ? fairy : null); }
            @Override public void dismiss() { closePop(null); }
            @Override public void open() { openAsha("today"); }
        });

        if (fresh) {
            WindowManager.LayoutParams p = new WindowManager.LayoutParams(WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.WRAP_CONTENT, overlayType(),
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE, PixelFormat.TRANSLUCENT);
            p.gravity = Gravity.CENTER;
            p.horizontalMargin = 0.05f;
            try {
                wm.addView(pop, p);
            } catch (Exception e) {
                pop = null;
                popKey = null;
                return;
            }
            flyIn(fairy);
        } else {
            // she rings again: a little hop so it is noticed
            fairy.animate().translationY(-40 * getResources().getDisplayMetrics().density).setDuration(220)
                .withEndAction(() -> fairy.animate().translationY(0).setDuration(380).setInterpolator(new OvershootInterpolator()).start()).start();
        }
        applyVisibility();
        main.removeCallbacks(popTimeout);
        main.postDelayed(popTimeout, POP_FOR);
    }

    /** She swoops in from where she sat, then floats gently up and down while she waits. */
    private void flyIn(ImageView fairy) {
        float d = getResources().getDisplayMetrics().density;
        View card = pop.findViewById(id("pop_card"));
        card.setAlpha(0f);
        card.setScaleX(0.85f);
        card.setScaleY(0.85f);
        fairy.setImageResource(getResources().getIdentifier("fairy_fly", "drawable", getPackageName()));
        fairy.setTranslationX(-260 * d);
        fairy.setTranslationY(-220 * d);
        fairy.setRotation(-18);
        fairy.animate().translationX(0).translationY(0).rotation(0).setDuration(900)
            .setInterpolator(new OvershootInterpolator(1.2f))
            .withEndAction(() -> {
                fairy.setImageResource(getResources().getIdentifier("fairy_wave", "drawable", getPackageName()));
                bob = ObjectAnimator.ofFloat(fairy, "translationY", 0, -8 * d);
                bob.setDuration(1300);
                bob.setRepeatMode(ValueAnimator.REVERSE);
                bob.setRepeatCount(ValueAnimator.INFINITE);
                bob.start();
            }).start();
        card.animate().alpha(1f).scaleX(1f).scaleY(1f).setStartDelay(350).setDuration(450)
            .setInterpolator(new OvershootInterpolator()).start();
    }

    private void act(PendingIntent pi, ImageView happyFairy) {
        popKey = null; // answered here: the "answered" call that follows must not cut her happy moment short
        try { pi.send(); } catch (Exception ignored) { }
        if (happyFairy == null) { closePop(null); return; }
        // "Taken": a happy little moment before she goes back to her spot
        if (bob != null) bob.cancel();
        happyFairy.setImageResource(FairyWidget.drawableFor(this, "happy"));
        happyFairy.animate().scaleX(1.15f).scaleY(1.15f).setDuration(250).withEndAction(() ->
            happyFairy.animate().scaleX(1f).scaleY(1f).setDuration(250).start()).start();
        main.postDelayed(() -> closePop(null), 900);
    }

    private void closePop(Runnable after) {
        main.removeCallbacks(popTimeout);
        if (bob != null) { bob.cancel(); bob = null; }
        if (pop != null) {
            final View p = pop;
            pop = null;
            popKey = null;
            p.animate().alpha(0f).translationY(60 * getResources().getDisplayMetrics().density).setDuration(350)
                .withEndAction(() -> { try { wm.removeView(p); } catch (Exception ignored) { } }).start();
        }
        // the next reminder that rang meanwhile, if it is still not done
        while (!waiting.isEmpty()) {
            Object[] w = waiting.remove(0);
            JSONObject next = AlarmStore.find(this, (String) w[0]);
            if (next == null || next.optLong("skipUntil", 0) > System.currentTimeMillis()) continue;
            main.postDelayed(() -> {
                showPop(next, (Integer) w[1]);
                ReminderService.say(this, next, (Integer) w[1]); // her words match the card now on screen
            }, 700);
            return;
        }
        applyVisibility();
        // she only visited for the reminder: leave again
        if (view == null && !FamilyStore.bubbleOn(this)) main.postDelayed(this::quit, 500);
        else if (view == null && FamilyStore.prefs(this).getLong("napUntil", 0) <= System.currentTimeMillis()) addBubble();
    }

    // ---------- helpers ----------

    private int id(String name) {
        return getResources().getIdentifier(name, "id", getPackageName());
    }

    private static int overlayType() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            : WindowManager.LayoutParams.TYPE_PHONE;
    }

    private void openAsha(String tab) {
        Intent open = getPackageManager().getLaunchIntentForPackage(getPackageName());
        if (open == null) return;
        open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        open.putExtra("openTab", tab);
        try { startActivity(open); } catch (Exception ignored) { }
    }

    private void quit() {
        if (pop != null || view != null) return;
        running = null;
        stopSelf();
    }

    static final String CHANNEL = "asha_fairy";
    private static final int NOTE_ID = 7200;

    /** The quiet "fairy is on your screen" notification that keeps her alive. Tap it to open Asha. */
    private void goForeground() {
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        Notification.Builder b;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (nm != null && nm.getNotificationChannel(CHANNEL) == null) {
                NotificationChannel ch = new NotificationChannel(CHANNEL, "Floating fairy", NotificationManager.IMPORTANCE_MIN);
                ch.setShowBadge(false);
                nm.createNotificationChannel(ch);
            }
            b = new Notification.Builder(this, CHANNEL);
        } else {
            b = new Notification.Builder(this).setPriority(Notification.PRIORITY_MIN);
        }
        boolean hi = hindi(this);
        Intent open = getPackageManager().getLaunchIntentForPackage(getPackageName());
        if (open != null) b.setContentIntent(PendingIntent.getActivity(this, 7201, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
        Notification n = b
            .setSmallIcon(android.R.drawable.star_on)
            .setContentTitle(hi ? "परी आपकी स्क्रीन पर है" : "The fairy is on your screen")
            .setContentText(hi ? "छूकर आशा खोलें. Settings में बंद कर सकते हैं." : "Tap to open Asha. Turn her off in Settings.")
            .setOngoing(true)
            .build();
        try {
            if (Build.VERSION.SDK_INT >= 34) startForeground(NOTE_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
            else startForeground(NOTE_ID, n);
        } catch (Exception ignored) { }
    }

    /** Swiped away from recent apps: some phones then close Asha completely. Come back a moment later. */
    @Override
    public void onTaskRemoved(Intent rootIntent) {
        super.onTaskRemoved(rootIntent);
        if (!FamilyStore.bubbleOn(this)) return;
        AlarmManager am = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        Intent i = new Intent(this, BootReceiver.class).setAction(ACTION_CHECK);
        PendingIntent pi = PendingIntent.getBroadcast(this, 7203, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        am.set(AlarmManager.ELAPSED_REALTIME, SystemClock.elapsedRealtime() + 3000, pi);
    }

    @Override
    public void onDestroy() {
        if (running == this) running = null;
        main.removeCallbacksAndMessages(null);
        if (bob != null) bob.cancel();
        showNapZone(false);
        for (View v : new View[]{view, pop}) {
            if (v != null && wm != null) { try { wm.removeView(v); } catch (Exception ignored) { } }
        }
        view = null;
        pop = null;
        super.onDestroy();
    }
}
