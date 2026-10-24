package com.agastyaray.asha;

import android.Manifest;
import android.app.AlarmManager;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.provider.Settings;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;

/**
 * Asha's bridge to the phone: voice out (TextToSpeech), voice in (SpeechRecognizer),
 * daily spoken reminders that work with the app closed, SMS / calls for Help, and sharing.
 */
@CapacitorPlugin(
    name = "AshaNative",
    permissions = {
        @Permission(alias = "microphone", strings = { Manifest.permission.RECORD_AUDIO }),
        @Permission(alias = "phone", strings = { Manifest.permission.CALL_PHONE }),
        @Permission(alias = "notifications", strings = { Manifest.permission.POST_NOTIFICATIONS })
    }
)
public class AshaNativePlugin extends Plugin {
    private SpeechRecognizer recognizer;
    private static AshaNativePlugin instance;
    private static String pendingTab = "";

    @Override
    public void load() {
        instance = this;
        FamilyNotify.ensureChannels(getContext());
        Intent start = getActivity() != null ? getActivity().getIntent() : null;
        if (start != null && start.hasExtra("openTab")) pendingTab = start.getStringExtra("openTab");
    }

    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);
        if (intent != null && intent.hasExtra("openTab")) {
            pendingTab = intent.getStringExtra("openTab");
            notifyListeners("family", new JSObject());
        }
    }

    /** Called by FamilyNotify when a message arrives while the app is running. */
    static void emitFamily() {
        AshaNativePlugin p = instance;
        if (p == null) return;
        try { p.notifyListeners("family", new JSObject()); } catch (Exception ignored) { }
    }

    // ---------------- family circle ----------------

    @PluginMethod
    public void getPushToken(PluginCall call) {
        try {
            com.google.firebase.messaging.FirebaseMessaging.getInstance().getToken()
                .addOnCompleteListener(task -> {
                    JSObject r = new JSObject();
                    String token = task.isSuccessful() && task.getResult() != null ? task.getResult() : FamilyStore.token(getContext());
                    if (token != null && !token.isEmpty()) FamilyStore.setToken(getContext(), token);
                    r.put("token", token == null ? "" : token);
                    call.resolve(r);
                });
        } catch (Exception e) {
            // Firebase not set up in this build: the 15-minute check is used instead
            JSObject r = new JSObject();
            r.put("token", "");
            call.resolve(r);
        }
    }

    @PluginMethod
    public void setFamilyConfig(PluginCall call) {
        JSObject cfg = call.getData();
        FamilyStore.saveConfig(getContext(), cfg);
        FamilyWorker.schedule(getContext(), cfg.optBoolean("poll", false) && cfg.optBoolean("inCircle", false));
        call.resolve();
    }

    @PluginMethod
    public void drainFamily(PluginCall call) {
        JSObject r = new JSObject();
        r.put("changed", FamilyStore.changed(getContext()));
        r.put("openTab", pendingTab);
        FamilyStore.markChanged(getContext(), false);
        pendingTab = "";
        call.resolve(r);
    }

    @PluginMethod
    public void updateWidget(PluginCall call) {
        FamilyStore.setFace(getContext(), call.getString("mood", "idle"), call.getString("text", ""), call.getInt("unread", 0));
        FairyWidget.refreshAll(getContext());
        FairyBubbleService.refresh(getContext());
        call.resolve();
    }

    @PluginMethod
    public void canDrawOverlays(PluginCall call) {
        call.resolve(ok(FairyBubbleService.canDraw(getContext())));
    }

    @PluginMethod
    public void openOverlaySettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Intent i = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + getContext().getPackageName()));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            try { getContext().startActivity(i); } catch (Exception ignored) { }
        }
        call.resolve();
    }

    @PluginMethod
    public void setBubble(PluginCall call) {
        boolean on = call.getBoolean("on", false);
        FamilyStore.setBubble(getContext(), on);
        if (on) call.resolve(ok(FairyBubbleService.start(getContext())));
        else {
            FairyBubbleService.stop(getContext());
            call.resolve(ok(true));
        }
    }

    // ---------------- voice out ----------------

    @PluginMethod
    public void speak(PluginCall call) {
        String text = call.getString("text", "");
        String lang = call.getString("lang", "en");
        float rate = call.getFloat("rate", 0.92f);
        float pitch = call.getFloat("pitch", 1.0f);
        if (text == null || text.trim().isEmpty()) { call.resolve(ok(true)); return; }
        Speaker.get(getContext()).speak(text, lang, rate, pitch, done -> call.resolve(ok(done)));
    }

    @PluginMethod
    public void stopSpeaking(PluginCall call) {
        Speaker.get(getContext()).stop();
        call.resolve();
    }

    // ---------------- voice in ----------------

    @PluginMethod
    public void listen(PluginCall call) {
        if (getPermissionState("microphone") != PermissionState.GRANTED) {
            requestPermissionForAlias("microphone", call, "micResult");
            return;
        }
        startListening(call);
    }

    @PermissionCallback
    private void micResult(PluginCall call) {
        if (getPermissionState("microphone") == PermissionState.GRANTED) startListening(call);
        else call.reject("microphone-denied");
    }

    private void startListening(PluginCall call) {
        final String lang = "hi".equals(call.getString("lang", "en")) ? "hi-IN" : "en-IN";
        getActivity().runOnUiThread(() -> {
            if (!SpeechRecognizer.isRecognitionAvailable(getContext())) {
                call.reject("speech-unavailable");
                return;
            }
            if (recognizer != null) recognizer.destroy();
            recognizer = SpeechRecognizer.createSpeechRecognizer(getContext());
            Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang);
            i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, lang);
            i.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
            i.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false);
            final boolean[] answered = { false };
            recognizer.setRecognitionListener(new RecognitionListener() {
                @Override public void onReadyForSpeech(Bundle params) { notifyListeners("listening", ok(true)); }
                @Override public void onBeginningOfSpeech() { }
                @Override public void onRmsChanged(float rmsdB) { }
                @Override public void onBufferReceived(byte[] buffer) { }
                @Override public void onEndOfSpeech() { }
                @Override public void onPartialResults(Bundle partialResults) { }
                @Override public void onEvent(int eventType, Bundle params) { }

                @Override public void onError(int error) {
                    if (answered[0]) return;
                    answered[0] = true;
                    JSObject r = new JSObject();
                    r.put("text", "");
                    r.put("error", error);
                    call.resolve(r);
                    cleanup();
                }

                @Override public void onResults(Bundle results) {
                    if (answered[0]) return;
                    answered[0] = true;
                    ArrayList<String> list = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                    JSObject r = new JSObject();
                    r.put("text", list != null && !list.isEmpty() ? list.get(0) : "");
                    call.resolve(r);
                    cleanup();
                }
            });
            recognizer.startListening(i);
        });
    }

    private void cleanup() {
        getActivity().runOnUiThread(() -> {
            if (recognizer != null) { recognizer.destroy(); recognizer = null; }
        });
    }

    @PluginMethod
    public void stopListening(PluginCall call) {
        getActivity().runOnUiThread(() -> { if (recognizer != null) recognizer.stopListening(); });
        call.resolve();
    }

    // ---------------- reminders ----------------

    /** items: [{key, hour, minute, kind, title, body, say, again, lang, skipUntil, missedText, doneLabel, snoozeLabel}] */
    @PluginMethod
    public void setReminders(PluginCall call) {
        JSArray items = call.getArray("items");
        JSObject config = call.getObject("config");
        long oldQuiet = AlarmStore.config(getContext()).optLong("quietUntil", 0);
        if (config != null) AlarmStore.saveConfig(getContext(), config);
        AlarmStore.replaceAll(getContext(), items != null ? items : new JSONArray());
        AlarmStore.applyQuiet(getContext(), oldQuiet, AlarmStore.config(getContext()).optLong("quietUntil", 0));
        // a dose marked inside the app takes its buttons off the home-screen fairy
        FairyWidget.refreshAll(getContext());
        call.resolve(ok(true));
    }

    @PluginMethod
    public void drainActions(PluginCall call) {
        JSONArray list = AlarmStore.drainActions(getContext());
        JSObject r = new JSObject();
        try { r.put("actions", new JSArray(list.toString())); }
        catch (JSONException e) { r.put("actions", new JSArray()); }
        call.resolve(r);
    }

    @PluginMethod
    public void status(PluginCall call) {
        Context ctx = getContext();
        JSObject r = new JSObject();
        boolean exact = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
            exact = am != null && am.canScheduleExactAlarms();
        }
        r.put("exactAlarms", exact);
        r.put("notifications", notificationsOn());
        PowerManager pm = (PowerManager) ctx.getSystemService(Context.POWER_SERVICE);
        r.put("batteryFree", pm != null && pm.isIgnoringBatteryOptimizations(ctx.getPackageName()));
        r.put("phone", getPermissionState("phone") == PermissionState.GRANTED);
        r.put("microphone", getPermissionState("microphone") == PermissionState.GRANTED);
        r.put("speechInput", SpeechRecognizer.isRecognitionAvailable(ctx));
        call.resolve(r);
    }

    private boolean notificationsOn() {
        NotificationManager nm = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) return nm.areNotificationsEnabled();
        return true;
    }

    @PluginMethod
    public void requestNotifications(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 33 && getPermissionState("notifications") != PermissionState.GRANTED) {
            requestPermissionForAlias("notifications", call, "notesResult");
            return;
        }
        call.resolve(ok(notificationsOn()));
    }

    @PermissionCallback
    private void notesResult(PluginCall call) {
        call.resolve(ok(notificationsOn()));
    }

    @PluginMethod
    public void openExactAlarmSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            Intent i = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
            i.setData(Uri.parse("package:" + getContext().getPackageName()));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            try { getContext().startActivity(i); } catch (Exception ignored) { }
        }
        call.resolve();
    }

    @PluginMethod
    public void openBatterySettings(PluginCall call) {
        Intent i = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try { getContext().startActivity(i); } catch (Exception ignored) { }
        call.resolve();
    }

    // ---------------- help: calls ----------------
    // No SMS permission: Play Protect blocks sideloaded apps that can text by themselves.
    // Help opens the messages app with the text ready instead (sms: links need no permission).

    @PluginMethod
    public void requestPhone(PluginCall call) {
        if (getPermissionState("phone") == PermissionState.GRANTED) { call.resolve(ok(true)); return; }
        requestPermissionForAlias("phone", call, "phoneResult");
    }

    @PermissionCallback
    private void phoneResult(PluginCall call) {
        call.resolve(ok(getPermissionState("phone") == PermissionState.GRANTED));
    }

    /** Calls straight away when allowed; otherwise opens the dialer with the number filled in. */
    @PluginMethod
    public void call(PluginCall call) {
        String number = call.getString("number", "").replaceAll("[^0-9+]", "");
        if (number.isEmpty()) { call.reject("no-number"); return; }
        boolean direct = getPermissionState("phone") == PermissionState.GRANTED;
        Intent i = new Intent(direct ? Intent.ACTION_CALL : Intent.ACTION_DIAL, Uri.parse("tel:" + number));
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            getContext().startActivity(i);
            JSObject r = new JSObject();
            r.put("direct", direct);
            call.resolve(r);
        } catch (Exception e) {
            call.reject("call-failed");
        }
    }

    @PluginMethod
    public void share(PluginCall call) {
        Intent send = new Intent(Intent.ACTION_SEND);
        send.setType("text/plain");
        send.putExtra(Intent.EXTRA_TEXT, call.getString("text", ""));
        send.putExtra(Intent.EXTRA_SUBJECT, call.getString("title", "Asha"));
        Intent chooser = Intent.createChooser(send, call.getString("title", "Share"));
        chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try { getContext().startActivity(chooser); } catch (Exception ignored) { }
        call.resolve();
    }

    private static JSObject ok(boolean value) {
        JSObject r = new JSObject();
        r.put("ok", value);
        return r;
    }
}
