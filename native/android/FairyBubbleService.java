package com.agastyaray.asha;

import android.annotation.SuppressLint;
import android.app.Service;
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
            ctx.startService(new Intent(ctx, FairyBubbleService.class));
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
        if (view != null) return START_STICKY;
        if (!canDraw(this)) { stopSelf(); return START_NOT_STICKY; }
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
