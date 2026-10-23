package com.agastyaray.asha;

import android.content.Context;
import android.media.AudioAttributes;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * One shared phone voice (Android TextToSpeech). Free and works offline.
 * Speaks on the ALARM audio stream so a reminder is heard even when the ringer is on silent.
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

    /** pitch 1.0 is the phone's own voice; the fairy speaks higher */
    public void speak(String text, String lang, float rate, float pitch, Done done) {
        // test builds only: lets the emulator test check what she said (and that she stayed silent)
        if (BuildConfig.DEBUG) android.util.Log.i("AshaSpeaker", text.length() > 240 ? text.substring(0, 240) : text);
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
            tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                @Override public void onStart(String utteranceId) { }
                @Override public void onDone(String utteranceId) {
                    if (id.equals(utteranceId) && done != null) done.done(true);
                }
                @Override @Deprecated public void onError(String utteranceId) {
                    if (id.equals(utteranceId) && done != null) done.done(false);
                }
                @Override public void onStop(String utteranceId, boolean interrupted) {
                    if (id.equals(utteranceId) && done != null) done.done(false);
                }
            });
            int res = tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, id);
            if (res != TextToSpeech.SUCCESS && done != null) done.done(false);
        });
    }

    public synchronized void stop() {
        if (tts != null && ready) tts.stop();
    }
}
