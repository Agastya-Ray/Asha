package com.agastyaray.asha;

import android.content.Context;

import androidx.annotation.NonNull;
import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * Backup for phones without instant delivery: every ~15 minutes, ask the server for new family messages.
 * (Android decides the exact time; battery saver can make it slower.)
 */
public class FamilyWorker extends Worker {
    static final String NAME = "asha-family-poll";

    public FamilyWorker(@NonNull Context ctx, @NonNull WorkerParameters params) {
        super(ctx, params);
    }

    public static void schedule(Context ctx, boolean on) {
        WorkManager wm = WorkManager.getInstance(ctx);
        if (!on) {
            wm.cancelUniqueWork(NAME);
            return;
        }
        PeriodicWorkRequest req = new PeriodicWorkRequest.Builder(FamilyWorker.class, 15, TimeUnit.MINUTES)
            .setConstraints(new Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
            .build();
        wm.enqueueUniquePeriodicWork(NAME, ExistingPeriodicWorkPolicy.KEEP, req);
    }

    @NonNull
    @Override
    public Result doWork() {
        Context ctx = getApplicationContext();
        if (!FamilyStore.ready(ctx)) return Result.success();
        try {
            JSONObject body = new JSONObject();
            body.put("action", "inbox");
            body.put("after", FamilyStore.lastId(ctx));
            JSONObject out = FamilyStore.post(ctx, body);
            if (out == null || !out.optBoolean("ok")) return Result.retry();
            JSONArray list = out.optJSONArray("messages");
            if (list == null) return Result.success();
            // oldest first, so they are read in order
            for (int i = list.length() - 1; i >= 0; i--) {
                JSONObject m = list.optJSONObject(i);
                if (m == null || m.optBoolean("mine") || m.optBoolean("silent")) continue;
                Map<String, String> d = new HashMap<>();
                d.put("id", String.valueOf(m.optLong("id")));
                d.put("kind", m.optString("kind"));
                d.put("en", m.optString("en"));
                d.put("hi", m.optString("hi"));
                d.put("title_en", "alert".equals(m.optString("kind")) ? "Asha · Urgent" : "Asha");
                d.put("title_hi", "alert".equals(m.optString("kind")) ? "आशा · ज़रूरी" : "आशा");
                d.put("urgent", "alert".equals(m.optString("kind")) ? "1" : "0");
                d.put("quiet", "0");
                FamilyNotify.handle(ctx, d);
            }
            return Result.success();
        } catch (Exception e) {
            return Result.retry();
        }
    }
}
