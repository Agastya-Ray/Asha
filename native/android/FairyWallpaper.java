package com.agastyaray.asha;

import android.app.WallpaperManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.Shader;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.service.wallpaper.WallpaperService;
import android.text.Layout;
import android.text.StaticLayout;
import android.text.TextPaint;
import android.view.SurfaceHolder;

import org.json.JSONObject;

import java.util.Calendar;

/**
 * The fairy as a live wallpaper: she lives on the home screen (and the lock screen, if chosen) all the time,
 * with no special permission. She floats gently, turns toward where you tap, waves with the medicine's name
 * when a reminder is due, and curls up asleep at night and in quiet mode. Tap her to open Asha.
 * She only moves while the wallpaper is on screen; behind an app or with the screen off she draws nothing.
 */
public class FairyWallpaper extends WallpaperService {

    public static ComponentName component(Context ctx) {
        return new ComponentName(ctx, FairyWallpaper.class);
    }

    /** True when the fairy is the phone's wallpaper right now. */
    public static boolean isSet(Context ctx) {
        try {
            android.app.WallpaperInfo info = WallpaperManager.getInstance(ctx).getWallpaperInfo();
            return info != null && ctx.getPackageName().equals(info.getPackageName());
        } catch (Exception e) {
            return false;
        }
    }

    /** Android's own preview with its "Set wallpaper" button. */
    public static boolean openPicker(Context ctx) {
        Intent i = new Intent(WallpaperManager.ACTION_CHANGE_LIVE_WALLPAPER)
            .putExtra(WallpaperManager.EXTRA_LIVE_WALLPAPER_COMPONENT, component(ctx))
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try { ctx.startActivity(i); return true; } catch (Exception e) { }
        try {
            // some phones only have the general live-wallpaper list
            ctx.startActivity(new Intent(WallpaperManager.ACTION_LIVE_WALLPAPER_CHOOSER).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public Engine onCreateEngine() {
        return new FairyEngine();
    }

    private class FairyEngine extends Engine {
        private final Handler main = new Handler(Looper.getMainLooper());
        private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.FILTER_BITMAP_FLAG);
        private final TextPaint text = new TextPaint(Paint.ANTI_ALIAS_FLAG);
        private final float d = getResources().getDisplayMetrics().density;
        private boolean visible;
        private int w, h;
        private Bitmap idle, happy, sleep, wave;
        // what she is doing, re-read every few seconds (cheap: two small preference reads)
        private String mood = "idle";
        private String say = "";
        private long readAt;
        // where she looks (-1 left .. 1 right) and a little hop after a tap
        private float facing = 1f;
        private long hopAt;
        private final RectF fairyBox = new RectF();
        private final long born = SystemClock.uptimeMillis();
        private final Runnable frame = this::drawFrame;

        @Override
        public void onCreate(SurfaceHolder holder) {
            super.onCreate(holder);
            setTouchEventsEnabled(false); // taps come through onCommand, so the launcher keeps its own gestures
            idle = load("fairy_idle");
            happy = load("fairy_happy");
            sleep = load("fairy_sleep");
            wave = load("fairy_wave");
            text.setColor(0xFF33210F);
            text.setTextSize(18 * d);
            text.setFakeBoldText(true);
        }

        private Bitmap load(String name) {
            int id = getResources().getIdentifier(name, "drawable", getPackageName());
            return id == 0 ? null : BitmapFactory.decodeResource(getResources(), id);
        }

        @Override
        public void onVisibilityChanged(boolean v) {
            visible = v;
            main.removeCallbacks(frame);
            if (v) { readAt = 0; drawFrame(); }
        }

        @Override
        public void onSurfaceChanged(SurfaceHolder holder, int format, int width, int height) {
            super.onSurfaceChanged(holder, format, width, height);
            w = width;
            h = height;
            drawFrame();
        }

        @Override
        public void onSurfaceDestroyed(SurfaceHolder holder) {
            visible = false;
            main.removeCallbacks(frame);
            super.onSurfaceDestroyed(holder);
        }

        @Override
        public void onDestroy() {
            main.removeCallbacks(frame);
            super.onDestroy();
        }

        @Override
        public Bundle onCommand(String action, int x, int y, int z, Bundle extras, boolean resultRequested) {
            if (WallpaperManager.COMMAND_TAP.equals(action)) {
                RectF hit = new RectF(fairyBox);
                hit.inset(-24 * d, -24 * d);
                if (hit.contains(x, y)) {
                    hopAt = SystemClock.uptimeMillis();
                    Intent open = getPackageManager().getLaunchIntentForPackage(getPackageName());
                    if (open != null) {
                        open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        open.putExtra("openTab", "today");
                        try { startActivity(open); } catch (Exception ignored) { }
                    }
                } else {
                    // she turns toward the tap and gives a little hop: "I saw that!"
                    facing = x < fairyBox.centerX() ? -1f : 1f;
                    hopAt = SystemClock.uptimeMillis();
                }
                if (visible) { main.removeCallbacks(frame); drawFrame(); }
            }
            return null;
        }

        private void readState() {
            long now = SystemClock.uptimeMillis();
            if (now - readAt < 3000) return;
            readAt = now;
            Context ctx = FairyWallpaper.this;
            boolean hi = "hi".equals(FamilyStore.config(ctx).optString("lang"));
            JSONObject due = AlarmStore.due(ctx);
            if (AlarmStore.quiet(ctx)) {
                mood = "sleep";
                say = "";
            } else if (due != null) {
                mood = "wave";
                say = due.optString("title") + (hi ? " · मुझे छुएँ" : " · tap me");
            } else {
                mood = FamilyStore.mood(ctx);
                say = "sleep".equals(mood) ? "" : FamilyStore.unread(ctx) > 0 || !FamilyStore.prefs(ctx).getString("w_text", "").isEmpty()
                    ? FamilyStore.text(ctx) : "";
            }
        }

        private void drawFrame() {
            if (!visible || w == 0) return;
            readState();
            SurfaceHolder holder = getSurfaceHolder();
            Canvas c = null;
            try {
                c = holder.lockCanvas();
                if (c != null) paint(c);
            } catch (Exception ignored) {
            } finally {
                if (c != null) { try { holder.unlockCanvasAndPost(c); } catch (Exception ignored) { } }
            }
            // asleep she breathes slowly, so fewer frames; awake 20 a second (gentle on the battery)
            if (visible) main.postDelayed(frame, "sleep".equals(mood) ? 100 : 50);
        }

        private void paint(Canvas c) {
            long t = SystemClock.uptimeMillis() - born;
            int hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY);
            boolean night = "sleep".equals(mood) || hour >= 20 || hour < 6;
            sky(c, hour, night, t);

            Bitmap img = "sleep".equals(mood) ? sleep : "wave".equals(mood) ? wave : "happy".equals(mood) ? happy : idle;
            if (img == null) return;
            float fh = Math.min(h * 0.24f, 260 * d);
            float fw = fh * img.getWidth() / img.getHeight();
            float cx = w / 2f;
            float cy;
            float scale = 1f;
            if ("sleep".equals(mood)) {
                // curled up on the floor of the screen, breathing
                fh *= 0.75f;
                fw = fh * img.getWidth() / img.getHeight();
                cy = h * 0.70f;
                scale = 1f + 0.025f * (float) Math.sin(t / 900.0);
            } else {
                float bob = (float) Math.sin(t / 650.0) * 10 * d;
                long sinceHop = SystemClock.uptimeMillis() - hopAt;
                float hop = sinceHop < 500 ? (float) Math.sin(Math.PI * sinceHop / 500.0) * 34 * d : 0;
                float sway = (float) Math.sin(t / 1300.0) * 14 * d;
                cx += sway;
                cy = h * 0.52f + bob - hop;
                if ("wave".equals(mood)) scale = 1.08f + 0.04f * (float) Math.sin(t / 220.0);
            }
            fairyBox.set(cx - fw / 2, cy - fh / 2, cx + fw / 2, cy + fh / 2);

            // a soft shadow on the "floor" under her
            paint.setShader(null);
            paint.setColor(night ? 0x33000000 : 0x22603010);
            float floorY = "sleep".equals(mood) ? cy + fh * 0.42f : h * 0.52f + fh * 0.62f;
            float shadowW = fw * ("sleep".equals(mood) ? 0.9f : 0.55f);
            c.drawOval(cx - shadowW / 2, floorY - 6 * d, cx + shadowW / 2, floorY + 6 * d, paint);

            Matrix m = new Matrix();
            m.postScale(fw / img.getWidth() * scale * ("sleep".equals(mood) ? 1f : facing), fh / img.getHeight() * scale);
            float drawnW = fw * scale, drawnH = fh * scale;
            m.postTranslate(facing < 0 && !"sleep".equals(mood) ? cx + drawnW / 2 : cx - drawnW / 2, cy - drawnH / 2);
            paint.setColor(Color.WHITE);
            c.drawBitmap(img, m, paint);

            if ("sleep".equals(mood)) zees(c, cx + fw * 0.3f, cy - fh * 0.4f, t);
            if (!say.isEmpty()) bubble(c, cx, fairyBox.top - 14 * d, say);
        }

        /** Day: warm cream and pink. Evening: peach. Night: deep blue with twinkling stars. */
        private void sky(Canvas c, int hour, boolean night, long t) {
            int top, bottom;
            if (night) { top = 0xFF1B2450; bottom = 0xFF3B3470; }
            else if (hour < 10) { top = 0xFFFFE9C7; bottom = 0xFFFCD3DE; }
            else if (hour < 17) { top = 0xFFFFF6EC; bottom = 0xFFFADDE4; }
            else { top = 0xFFFFD6B0; bottom = 0xFFF3B7C6; }
            paint.setShader(new LinearGradient(0, 0, 0, h, top, bottom, Shader.TileMode.CLAMP));
            c.drawRect(0, 0, w, h, paint);
            paint.setShader(null);
            if (night) {
                for (int i = 0; i < 40; i++) {
                    float sx = (i * 9973 % 1000) / 1000f * w;
                    float sy = (i * 7919 % 1000) / 1000f * h * 0.6f;
                    float tw = 0.5f + 0.5f * (float) Math.sin(t / 700.0 + i);
                    paint.setColor(Color.argb((int) (90 + 140 * tw), 255, 250, 220));
                    c.drawCircle(sx, sy, (1.2f + (i % 3)) * d, paint);
                }
            } else {
                // a few drifting sparkles of fairy dust
                for (int i = 0; i < 14; i++) {
                    float sx = ((i * 9973 % 1000) / 1000f * w + t / 40f * (1 + i % 3)) % w;
                    float sy = (i * 7919 % 1000) / 1000f * h;
                    float tw = 0.5f + 0.5f * (float) Math.sin(t / 500.0 + i * 1.7);
                    paint.setColor(Color.argb((int) (60 + 120 * tw), 255, 200, 120));
                    c.drawCircle(sx, sy, (1.5f + (i % 2)) * d, paint);
                }
            }
        }

        private void zees(Canvas c, float x, float y, long t) {
            text.setColor(0xFFE8E4FF);
            for (int i = 0; i < 3; i++) {
                float p = ((t / 1600f) + i / 3f) % 1f;
                text.setTextSize((14 + 10 * p) * d);
                text.setAlpha((int) (255 * (1 - p)));
                c.drawText("z", x + p * 30 * d, y - p * 70 * d, text);
            }
            text.setAlpha(255);
            text.setColor(0xFF33210F);
            text.setTextSize(18 * d);
        }

        private void bubble(Canvas c, float cx, float bottom, String s) {
            int maxW = (int) Math.min(w - 48 * d, 320 * d);
            StaticLayout lay = new StaticLayout(s, text, maxW, Layout.Alignment.ALIGN_CENTER, 1.1f, 0, false);
            float lw = 0;
            for (int i = 0; i < lay.getLineCount(); i++) lw = Math.max(lw, lay.getLineWidth(i));
            float pad = 14 * d;
            float bw = lw + pad * 2, bh = lay.getHeight() + pad * 2;
            float left = Math.max(16 * d, Math.min(w - 16 * d - bw, cx - bw / 2));
            RectF r = new RectF(left, bottom - bh, left + bw, bottom);
            paint.setShader(null);
            paint.setColor(0xF2FFFAF3);
            c.drawRoundRect(r, 22 * d, 22 * d, paint);
            paint.setStyle(Paint.Style.STROKE);
            paint.setStrokeWidth(2.5f * d);
            paint.setColor(0xFFF3C4D0);
            c.drawRoundRect(r, 22 * d, 22 * d, paint);
            paint.setStyle(Paint.Style.FILL);
            c.save();
            c.translate(r.centerX() - maxW / 2f, r.top + pad);
            lay.draw(c);
            c.restore();
        }
    }
}
