package com.agastyaray.asha;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import org.json.JSONObject;

/** Receives instant family messages from Firebase, even when Asha is closed. */
public class AshaMessagingService extends FirebaseMessagingService {
    @Override
    public void onMessageReceived(RemoteMessage msg) {
        if (msg.getData().isEmpty()) return;
        FamilyNotify.handle(getApplicationContext(), msg.getData());
    }

    @Override
    public void onNewToken(String token) {
        FamilyStore.setToken(getApplicationContext(), token);
        if (!FamilyStore.ready(getApplicationContext())) return;
        new Thread(() -> {
            try {
                JSONObject body = new JSONObject();
                body.put("action", "update");
                body.put("fcmToken", token);
                FamilyStore.post(getApplicationContext(), body);
            } catch (Exception ignored) { }
        }).start();
    }
}
