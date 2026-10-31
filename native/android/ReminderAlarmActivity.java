package com.agastyaray.asha;

import android.animation.ObjectAnimator;
import android.animation.ValueAnimator;
import android.app.Activity;
import android.app.KeyguardManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;
import android.view.animation.OvershootInterpolator;
import android.widget.FrameLayout;
import android.widget.ImageView;

import org.json.JSONObject;

import java.util.ArrayList;

/**
 * At reminder time the fairy fills the screen like an alarm clock, also over the lock screen, and waits
 * there until "Taken" or "Later" is pressed. Opened by the reminder notification's full-screen intent, so
 * it needs no special permission: when the phone is in use, Android shows the notification as a big card
 * at the top instead. Reminders that ring together come one after the other.
 */
public class ReminderAlarmActivity extends Activity {
    private static ReminderAlarmActivity showing;
    /** she is on the full screen right now (resumed), so her voice comes with her */
    private static volatile boolean resumed;

    static boolean shownNow() { return resumed && showing != null; }

    /** Opens her full screen directly. Only allowed from the background with "Display over other apps". */
    static boolean open(Context ctx, String key, int attempt) {
        try {
            ctx.startActivity(new Intent(ctx, ReminderAlarmActivity.class).putExtra("key", key).putExtra("attempt", attempt)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @Override protected void onResume() { super.onResume(); resumed = true; }
    @Override protected void onPause() { resumed = false; super.onPause(); }
    private final Handler main = new Handler(Looper.getMainLooper());
    private final ArrayList<Object[]> waiting = new ArrayList<>();
    private String key;
    private FrameLayout box;
    private View card;
    private ObjectAnimator bob;

    static PendingIntent pending(Context ctx, String key, int attempt) {
        Intent i = new Intent(ctx, ReminderAlarmActivity.class)
            .putExtra("key", key).putExtra("attempt", attempt)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        return PendingIntent.getActivity(ctx, AlarmStore.notificationId(key) + 1, i,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    /** Answered somewhere else (notification, home-screen fairy, inside Asha): stop showing it. */
    static void answered(String k) {
        ReminderAlarmActivity a = showing;
        if (a == null) return;
        a.main.post(() -> {
            for (java.util.Iterator<Object[]> it = a.waiting.iterator(); it.hasNext(); ) if (k == null || k.equals(it.next()[0])) it.remove();
            if (k == null || k.equals(a.key)) a.next();
        });
    }

    /**
     * Another reminder rang while she is already on the full screen: Android will not open the full screen
     * a second time over itself, so hand it to her directly; she shows it after this one. False = not showing.
     */
    static boolean offer(String k, int attempt) {
        ReminderAlarmActivity a = showing;
        if (a == null || a.isFinishing()) return false;
        a.main.post(() -> {
            if (k.equals(a.key)) return;
            for (Object[] w : a.waiting) if (k.equals(w[0])) { w[1] = attempt; return; }
            a.waiting.add(new Object[]{k, attempt});
        });
        return true;
    }

    /** After reminders change in the app: put away one that was marked there. */
    static void recheck(Context ctx) {
        ReminderAlarmActivity a = showing;
        if (a == null || a.key == null) return;
        JSONObject t = AlarmStore.find(ctx, a.key);
        if (t == null || t.optLong("skipUntil", 0) > System.currentTimeMillis()) answered(a.key);
    }

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        if (Build.VERSION.SDK_INT >= 27) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);
        }
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        FrameLayout root = new FrameLayout(this);
        box = root;
        root.setBackground(new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM, new int[]{0xFFFFE9C7, 0xFFFCD3DE}));
        int pad = (int) (20 * getResources().getDisplayMetrics().density);
        root.setPadding(pad, pad, pad, pad);
        setContentView(root);
        showing = this;
        show(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        String k = intent.getStringExtra("key");
        if (k == null) return;
        if (card != null && !k.equals(key)) {
            for (Object[] w : waiting) if (k.equals(w[0])) { w[1] = intent.getIntExtra("attempt", 0); return; }
            waiting.add(new Object[]{k, intent.getIntExtra("attempt", 0)});
            return;
        }
        show(intent);
    }

    private void show(Intent intent) {
        String k = intent.getStringExtra("key");
        JSONObject t = k == null ? null : AlarmStore.find(this, k);
        if (t == null || t.optLong("skipUntil", 0) > System.currentTimeMillis()) { next(); return; }
        show(t, intent.getIntExtra("attempt", 0));
    }

    private void show(JSONObject t, int attempt) {
        boolean fresh = card == null;
        boolean same = t.optString("key").equals(key);
        if (fresh) {
            int layout = getResources().getIdentifier("fairy_pop", "layout", getPackageName());
            card = LayoutInflater.from(this).inflate(layout, box, false);
            FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT, Gravity.CENTER);
            box.addView(card, lp);
        }
        key = t.optString("key");
        ImageView fairy = card.findViewById(FairyCard.id(this, "pop_fairy"));
        FairyCard.fill(this, card, t, attempt, new FairyCard.Actions() {
            @Override public void answer(PendingIntent pi, boolean taken) {
                key = null; // answered here: the "answered" call that follows must not cut her happy moment short
                try { pi.send(); } catch (Exception ignored) { }
                if (!taken) { next(); return; }
                if (bob != null) bob.cancel();
                fairy.setImageResource(FairyWidget.drawableFor(ReminderAlarmActivity.this, "happy"));
                fairy.animate().scaleX(1.15f).scaleY(1.15f).setDuration(250).withEndAction(() ->
                    fairy.animate().scaleX(1f).scaleY(1f).setDuration(250).start()).start();
                main.postDelayed(ReminderAlarmActivity.this::next, 900);
            }
            @Override public void dismiss() { next(); }
            @Override public void open() { openAsha(); }
        });
        if (!same) {
            if (bob != null) bob.cancel();
            fairy.setScaleX(1f);
            fairy.setScaleY(1f);
            flyIn(fairy);
        }
    }

    private void flyIn(ImageView fairy) {
        float d = getResources().getDisplayMetrics().density;
        View inner = card.findViewById(FairyCard.id(this, "pop_card"));
        inner.setAlpha(0f);
        inner.setScaleX(0.85f);
        inner.setScaleY(0.85f);
        fairy.setImageResource(getResources().getIdentifier("fairy_fly", "drawable", getPackageName()));
        fairy.setTranslationX(-260 * d);
        fairy.setTranslationY(-260 * d);
        fairy.setRotation(-18);
        fairy.animate().translationX(0).translationY(0).rotation(0).setDuration(900)
            .setInterpolator(new OvershootInterpolator(1.2f))
            .withEndAction(() -> {
                fairy.setImageResource(getResources().getIdentifier("fairy_wave", "drawable", getPackageName()));
                bob = ObjectAnimator.ofFloat(fairy, "translationY", 0, -10 * d);
                bob.setDuration(1300);
                bob.setRepeatMode(ValueAnimator.REVERSE);
                bob.setRepeatCount(ValueAnimator.INFINITE);
                bob.start();
            }).start();
        inner.animate().alpha(1f).scaleX(1f).scaleY(1f).setStartDelay(350).setDuration(450)
            .setInterpolator(new OvershootInterpolator()).start();
    }

    /** The next reminder that rang meanwhile, or close. */
    private void next() {
        while (!waiting.isEmpty()) {
            Object[] w = waiting.remove(0);
            JSONObject t = AlarmStore.find(this, (String) w[0]);
            if (t == null || t.optLong("skipUntil", 0) > System.currentTimeMillis()) continue;
            show(t, (Integer) w[1]);
            return;
        }
        key = null;
        finish();
    }

    private void openAsha() {
        Intent open = getPackageManager().getLaunchIntentForPackage(getPackageName());
        if (open == null) return;
        open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        open.putExtra("openTab", "today");
        KeyguardManager km = (KeyguardManager) getSystemService(KEYGUARD_SERVICE);
        // on a locked phone, ask for the PIN first, then open Asha
        if (km != null && km.isKeyguardLocked() && Build.VERSION.SDK_INT >= 26) {
            km.requestDismissKeyguard(this, new KeyguardManager.KeyguardDismissCallback() {
                @Override public void onDismissSucceeded() { startActivity(open); }
            });
        } else {
            startActivity(open);
        }
    }

    @Override
    protected void onDestroy() {
        if (showing == this) showing = null;
        if (bob != null) bob.cancel();
        main.removeCallbacksAndMessages(null);
        super.onDestroy();
    }
}
