package com.agastyaray.asha;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * After the phone restarts, or the clock/time zone changes, set all reminders again,
 * bring the floating fairy back if she was on, and let the fairy wake up or fall asleep for the new time.
 */
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context ctx, Intent intent) {
        AlarmStore.scheduleAll(ctx);
        if (FamilyStore.bubbleOn(ctx)) FairyBubbleService.start(ctx);
        FairyWidget.refreshAll(ctx);
        FairyBubbleService.refresh(ctx);
    }
}
