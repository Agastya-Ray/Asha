package com.agastyaray.asha;

import android.content.Context;
import android.media.AudioAttributes;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * One shared phone voice (Android TextToSpeech). Free and works offline.
 * Speaks on the ALARM audio stream so a reminder is heard even when the ringer is on silent.
 * She only speaks while she can be seen (see seenAt): in Asha, on her alarm, floating over apps, or as the wallpaper.
 */
public final class Speaker {
    public interface Done { void done(boolean ok); }

    private static Speaker instance;
    private final Context app;
    private TextToSpeech tts;
    private boolean ready = false;
    private final List<Runnable> waiting = new ArrayList<>();

    private Speaker(Context ctx) {
        app = ctx.getApplicationContext();
    }

    public static synchronized Speaker get(Context ctx) {
        if (instance == null) instance = new Speaker(ctx);
        return instance;
    }

    private synchronized void ensure(Runnable then) {
        if (tts != null && ready) { then.run(); return; }
        waiting.add(then);
        if (tts != null) return;
        tts = new TextToSpeech(app, status -> {
            synchronized (Speaker.this) {
                ready = status == TextToSpeech.SUCCESS;
                if (ready) {
                    tts.setAudioAttributes(new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                        .build());
                }
                List<Runnable> copy = new ArrayList<>(waiting);
                waiting.clear();
                for (Runnable r : copy) r.run();
                if (!ready) { tts.shutdown(); tts = null; }
            }
        });
    }

    public void speak(String text, String lang, float rate, Done done) {
        speak(text, lang, rate, 1.0f, done);
    }

    /**
     * Where she can be seen right now, or null: Asha's own screen ("app"), her full-screen alarm ("alarm"),
     * her card or little fairy floating over other apps ("pop", "bubble"), or the live wallpaper on the home
     * or lock screen ("wallpaper").
     */
    public static String seenAt(Context ctx) {
        if (ReminderAlarmActivity.shownNow()) return "alarm";
        if (FairyBubbleService.appOnScreen()) return "app";
        String floating = FairyBubbleService.drawnNow(ctx);
        if (floating != null) return floating;
        if (FairyWallpaper.shownNow(ctx)) return "wallpaper";
        return null;
    }

    private boolean debug() {
        return (app.getApplicationInfo().flags & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0;
    }

    private void log(String what, String text) {
        // test builds only: lets the emulator test check what she said, where she was, and that she stayed silent
        if (debug()) android.util.Log.i("AshaSpeaker", what + " " + (text.length() > 240 ? text.substring(0, 240) : text));
    }

    /**
     * Speaks once she is on the screen: waits up to waitMs for her card, full-screen alarm or wallpaper to
     * appear (she flies in first). If she cannot be shown at all, she stays silent: never a voice from nowhere.
     */
    public void speakWhenSeen(String text, String lang, float rate, float pitch, long waitMs, Done done) {
        speakWhenSeen(text, lang, rate, pitch, waitMs, null, done);
    }

    /** Says whether this line still belongs on the screen (false: another card is showing; it is said when its own card comes). */
    public interface Still { boolean ok(); }

    public void speakWhenSeen(String text, String lang, float rate, float pitch, long waitMs, Still still, Done done) {
        final Handler h = new Handler(Looper.getMainLooper());
        final long until = SystemClock.uptimeMillis() + waitMs;
        h.post(new Runnable() {
            @Override public void run() {
                if (still != null && !still.ok()) {
                    log("WAITS (another card is showing; said when this one comes)", text);
                    if (done != null) done.done(false);
                    return;
                }
                if (seenAt(app) != null) { speak(text, lang, rate, pitch, done); return; }
                if (SystemClock.uptimeMillis() >= until) {
                    log("SILENT (not on screen)", text);
                    if (done != null) done.done(false);
                    return;
                }
                h.postDelayed(this, 250);
            }
        });
    }

    /** pitch 1.0 is the phone's own voice; the fairy speaks higher */
    public void speak(String text, String lang, float rate, float pitch, Done done) {
        String where = seenAt(app);
        if (where == null) {
            // nobody can see her: no voice from nowhere
            log("SILENT (not on screen)", text);
            if (done != null) done.done(false);
            return;
        }
        log("SAY at=" + where, text);
        ensure(() -> {
            if (!ready || tts == null) { if (done != null) done.done(false); return; }
            Locale locale = "hi".equals(lang) ? new Locale("hi", "IN") : new Locale("en", "IN");
            int ok = tts.setLanguage(locale);
            if (ok == TextToSpeech.LANG_MISSING_DATA || ok == TextToSpeech.LANG_NOT_SUPPORTED) {
                tts.setLanguage("hi".equals(lang) ? new Locale("hi") : Locale.ENGLISH);
            }
            tts.setSpeechRate(rate > 0 ? rate : 0.92f);
            tts.setPitch(pitch > 0 ? pitch : 1.0f);
            final String id = "asha-" + System.nanoTime();
            current = id;
            tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                @Override public void onStart(String utteranceId) { }
                @Override public void onDone(String utteranceId) {
                    ended(utteranceId);
                    if (id.equals(utteranceId) && done != null) done.done(true);
                }
                @Override @Deprecated public void onError(String utteranceId) {
                    ended(utteranceId);
                    if (id.equals(utteranceId) && done != null) done.done(false);
                }
                @Override public void onStop(String utteranceId, boolean interrupted) {
                    ended(utteranceId);
                    if (id.equals(utteranceId) && done != null) done.done(false);
                }
            });
            int res = tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, id);
            if (res != TextToSpeech.SUCCESS) { ended(id); if (done != null) done.done(false); return; }
            AshaNativePlugin.emitSpeaking(true); // in Asha: screens without a fairy show her while she speaks
            watch(id);
        });
    }

    private volatile String current;
    private final Handler watcher = new Handler(Looper.getMainLooper());

    private void ended(String id) {
        if (id != null && id.equals(current)) { current = null; AshaNativePlugin.emitSpeaking(false); }
    }

    /** If she leaves the screen mid-sentence (card answered, Asha closed, screen off), the voice stops with her. */
    private void watch(String id) {
        watcher.postDelayed(new Runnable() {
            @Override public void run() {
                if (!id.equals(current)) return;
                if (seenAt(app) == null) {
                    log("STOPPED (left the screen)", "");
                    stop();
                    return;
                }
                watcher.postDelayed(this, 400);
            }
        }, 400);
    }

    public synchronized void stop() {
        if (tts != null && ready) tts.stop();
    }
}
