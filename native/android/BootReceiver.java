package com.agastyaray.asha;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** After the phone restarts, or the clock/time zone changes, set all reminders again. */
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context ctx, Intent intent) {
        AlarmStore.scheduleAll(ctx);
    }
}
