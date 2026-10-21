package com.agastyaray.asha;

import android.annotation.SuppressLint;
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
import android.os.IBinder;
import android.provider.Settings;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.ViewConfiguration;
import android.view.WindowManager;
import android.widget.ImageView;

/**
 * The floating fairy that sits on top of other apps (off by default).
 * Drag her anywhere; tap her to open Asha. She glows when a family message arrives.
 * Needs the "Display over other apps" permission.
 * Runs as a foreground service with a quiet notification: Android does not let a plain background
 * service start after a restart, and stops one about a minute after Asha leaves the screen.
 */
public class FairyBubbleService extends Service {
    private static FairyBubbleService running;
    private WindowManager wm;
    private ImageView view;
    private WindowManager.LayoutParams lp;

    public static boolean canDraw(Context ctx) {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(ctx);
    }

    public static boolean start(Context ctx) {
        if (!canDraw(ctx)) return false;
        try {
            Intent i = new Intent(ctx, FairyBubbleService.class);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) ctx.startForegroundService(i);
            else ctx.startService(i);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public static void stop(Context ctx) {
        ctx.stopService(new Intent(ctx, FairyBubbleService.class));
    }

    public static void refresh(Context ctx) {
        FairyBubbleService s = running;
        if (s == null || s.view == null) return;
        s.view.post(() -> s.view.setImageResource(FairyWidget.drawableFor(ctx, FamilyStore.mood(ctx))));
    }

    @Override public IBinder onBind(Intent intent) { return null; }

    @SuppressLint("ClickableViewAccessibility")
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        goForeground();
        if (view != null) return START_STICKY;
        if (!canDraw(this) || !FamilyStore.bubbleOn(this)) { stopSelf(); return START_NOT_STICKY; }
        wm = (WindowManager) getSystemService(WINDOW_SERVICE);
        view = new ImageView(this);
        view.setImageResource(FairyWidget.drawableFor(this, FamilyStore.mood(this)));
        view.setContentDescription("Asha");
        int size = (int) (76 * getResources().getDisplayMetrics().density);
        int type = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            : WindowManager.LayoutParams.TYPE_PHONE;
        lp = new WindowManager.LayoutParams(size, (int) (size * 1.17), type,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT);
        lp.gravity = Gravity.TOP | Gravity.START;
        lp.x = FamilyStore.prefs(this).getInt("bx", 24);
        lp.y = FamilyStore.prefs(this).getInt("by", 400);
        final int slop = ViewConfiguration.get(this).getScaledTouchSlop();
        view.setOnTouchListener(new android.view.View.OnTouchListener() {
            int sx, sy;
            float tx, ty;
            boolean moved;
            @Override
            public boolean onTouch(android.view.View v, MotionEvent e) {
                switch (e.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        sx = lp.x; sy = lp.y; tx = e.getRawX(); ty = e.getRawY(); moved = false;
                        return true;
                    case MotionEvent.ACTION_MOVE:
                        int dx = (int) (e.getRawX() - tx), dy = (int) (e.getRawY() - ty);
                        if (Math.abs(dx) > slop || Math.abs(dy) > slop) moved = true;
                        lp.x = sx + dx; lp.y = sy + dy;
                        try { wm.updateViewLayout(view, lp); } catch (Exception ignored) { }
                        return true;
                    case MotionEvent.ACTION_UP:
                        if (!moved) {
                            Intent open = getPackageManager().getLaunchIntentForPackage(getPackageName());
                            if (open != null) {
                                open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                open.putExtra("openTab", "family");
                                startActivity(open);
                            }
                        } else {
                            FamilyStore.prefs(FairyBubbleService.this).edit().putInt("bx", lp.x).putInt("by", lp.y).apply();
                        }
                        return true;
                    default:
                        return false;
                }
            }
        });
        try {
            wm.addView(view, lp);
            running = this;
        } catch (Exception e) {
            view = null;
            stopSelf();
            return START_NOT_STICKY;
        }
        return START_STICKY;
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
        boolean hi = "hi".equals(FamilyStore.config(this).optString("lang"));
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

    @Override
    public void onDestroy() {
        running = null;
        if (view != null && wm != null) {
            try { wm.removeView(view); } catch (Exception ignored) { }
        }
        view = null;
        super.onDestroy();
    }
}
