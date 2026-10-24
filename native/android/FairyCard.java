package com.agastyaray.asha;

import android.app.PendingIntent;
import android.content.Context;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;

import org.json.JSONObject;

/**
 * Fills the fairy's reminder card (layout fairy_pop): the medicine or meal, its photo, big "Taken" / "Later".
 * Used by the floating fairy's pop-up and by the full-screen alarm.
 */
final class FairyCard {
    interface Actions {
        /** a button was pressed; pi tells ActionReceiver; taken = the happy "done" answer */
        void answer(PendingIntent pi, boolean taken);
        /** "Okay" on a greeting */
        void dismiss();
        /** the fairy or the title was tapped */
        void open();
    }

    private FairyCard() { }

    static int id(Context ctx, String name) {
        return ctx.getResources().getIdentifier(name, "id", ctx.getPackageName());
    }

    static void fill(Context ctx, View pop, JSONObject t, int attempt, Actions a) {
        String key = t.optString("key");
        boolean greet = "greet".equals(t.optString("kind"));
        boolean med = "med".equals(t.optString("kind"));
        boolean hi = "hi".equals(FamilyStore.config(ctx).optString("lang"));
        TextView title = pop.findViewById(id(ctx, "pop_title"));
        TextView body = pop.findViewById(id(ctx, "pop_body"));
        ImageView photoView = pop.findViewById(id(ctx, "pop_photo"));
        ImageView fairy = pop.findViewById(id(ctx, "pop_fairy"));
        Button taken = pop.findViewById(id(ctx, "pop_taken"));
        Button later = pop.findViewById(id(ctx, "pop_later"));
        title.setText(t.optString("title"));
        if ((ctx.getApplicationInfo().flags & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0) android.util.Log.i("AshaFairy", "pop " + key + " | " + t.optString("title"));
        String text = t.optString("body");
        if (attempt > 0) text = t.optString("againLabel", "Reminder " + (attempt + 1)) + (text.isEmpty() ? "" : " · " + text);
        body.setText(text);
        body.setVisibility(text.isEmpty() ? View.GONE : View.VISIBLE);
        android.graphics.Bitmap photo = med ? ReminderService.photoFor(ctx, key) : null;
        photoView.setVisibility(photo != null ? View.VISIBLE : View.GONE);
        if (photo != null) photoView.setImageBitmap(photo);
        String day = ReminderService.doseDay(t, attempt);
        if (greet) {
            taken.setText(hi ? "ठीक है" : "Okay");
            taken.setOnClickListener(v -> a.dismiss());
            later.setVisibility(View.GONE);
        } else {
            taken.setText(t.optString("doneLabel", med ? "Taken" : "Eaten"));
            taken.setOnClickListener(v -> a.answer(ActionReceiver.pending(ctx, key, "taken", day), true));
            later.setText(t.optString("snoozeLabel", "10 min later"));
            later.setVisibility(View.VISIBLE);
            later.setOnClickListener(v -> a.answer(ActionReceiver.pending(ctx, key, "snooze", day), false));
        }
        fairy.setOnClickListener(v -> a.open());
        title.setOnClickListener(v -> a.open());
    }
}
