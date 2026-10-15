package com.agastyaray.asha;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Calendar;

/** Family Circle settings kept on the phone (address, this phone's key, language, quiet hours, widget state). */
public final class FamilyStore {
    private static final String PREFS = "asha_family";

    private FamilyStore() { }

    static SharedPreferences prefs(Context ctx) {
        return ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    public static JSONObject config(Context ctx) {
        try { return new JSONObject(prefs(ctx).getString("config", "{}")); }
        catch (JSONException e) { return new JSONObject(); }
    }

    public static void saveConfig(Context ctx, JSONObject cfg) {
        long known = lastId(ctx);
        prefs(ctx).edit().putString("config", cfg.toString()).apply();
        long fromApp = cfg.optLong("lastId", 0);
        if (fromApp > known) setLastId(ctx, fromApp);
    }

    public static boolean ready(Context ctx) {
        JSONObject c = config(ctx);
        return !c.optString("url").isEmpty() && !c.optString("deviceId").isEmpty() && !c.optString("secret").isEmpty();
    }

    public static long lastId(Context ctx) { return prefs(ctx).getLong("lastId", 0); }
    public static void setLastId(Context ctx, long id) {
        if (id > lastId(ctx)) prefs(ctx).edit().putLong("lastId", id).apply();
    }

    public static void setToken(Context ctx, String token) { prefs(ctx).edit().putString("token", token).apply(); }
    public static String token(Context ctx) { return prefs(ctx).getString("token", ""); }

    /** Something new arrived while the app was closed: the app should refresh. */
    public static void markChanged(Context ctx, boolean v) { prefs(ctx).edit().putBoolean("changed", v).apply(); }
    public static boolean changed(Context ctx) { return prefs(ctx).getBoolean("changed", false); }

    // ---------- widget / bubble state ----------

    public static void setFace(Context ctx, String mood, String text, int unread) {
        prefs(ctx).edit().putString("w_mood", mood).putString("w_text", text).putInt("w_unread", unread).apply();
    }
    public static String mood(Context ctx) {
        String m = prefs(ctx).getString("w_mood", "idle");
        int unread = prefs(ctx).getInt("w_unread", 0);
        if (unread == 0) {
            int h = Calendar.getInstance().get(Calendar.HOUR_OF_DAY);
            if (h >= 22 || h < 6) return "sleep";
        }
        return m;
    }
    public static String text(Context ctx) {
        String t = prefs(ctx).getString("w_text", "");
        if (!t.isEmpty()) return t;
        return "hi".equals(config(ctx).optString("lang")) ? "मैं यहीं हूँ. छूकर आशा खोलें." : "I'm right here. Tap to open Asha.";
    }
    public static int unread(Context ctx) { return prefs(ctx).getInt("w_unread", 0); }

    public static boolean bubbleOn(Context ctx) { return prefs(ctx).getBoolean("bubble", false); }
    public static void setBubble(Context ctx, boolean on) { prefs(ctx).edit().putBoolean("bubble", on).apply(); }

    /** True between quiet-start and quiet-end (for example 21:30 to 07:00). */
    public static boolean quietNow(Context ctx) {
        JSONObject c = config(ctx);
        int a = toMin(c.optString("quietStart", "21:30"));
        int b = toMin(c.optString("quietEnd", "07:00"));
        Calendar now = Calendar.getInstance();
        int m = now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE);
        return a <= b ? (m >= a && m < b) : (m >= a || m < b);
    }

    private static int toMin(String hhmm) {
        try { return Integer.parseInt(hhmm.substring(0, 2)) * 60 + Integer.parseInt(hhmm.substring(3, 5)); }
        catch (Exception e) { return 0; }
    }

    // ---------- talking to the server (call from a background thread) ----------

    public static JSONObject post(Context ctx, JSONObject body) {
        JSONObject c = config(ctx);
        String url = c.optString("url");
        if (url.isEmpty()) return null;
        HttpURLConnection conn = null;
        try {
            conn = (HttpURLConnection) new URL(url).openConnection();
            conn.setRequestMethod("POST");
            conn.setConnectTimeout(12000);
            conn.setReadTimeout(15000);
            conn.setDoOutput(true);
            conn.setRequestProperty("content-type", "application/json");
            conn.setRequestProperty("x-device-id", c.optString("deviceId"));
            conn.setRequestProperty("x-device-secret", c.optString("secret"));
            try (OutputStream os = conn.getOutputStream()) {
                os.write(body.toString().getBytes(StandardCharsets.UTF_8));
            }
            int code = conn.getResponseCode();
            BufferedReader r = new BufferedReader(new InputStreamReader(
                code >= 400 ? conn.getErrorStream() : conn.getInputStream(), StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = r.readLine()) != null) sb.append(line);
            r.close();
            JSONObject out = new JSONObject(sb.toString());
            out.put("_status", code);
            return out;
        } catch (Exception e) {
            return null;
        } finally {
            if (conn != null) conn.disconnect();
        }
    }
}
