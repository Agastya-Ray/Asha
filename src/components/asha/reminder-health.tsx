import { useEffect, useState } from "react";
import { App } from "@capacitor/app";
import { Button } from "@/components/ui/button";
import { Card, t } from "@/components/asha/bits";
import { syncReminders } from "@/lib/asha/alarms";
import { AshaNative, isNative, type NativeStatus } from "@/lib/asha/native";
import { useAsha } from "@/lib/asha/store";

const BATTERY_OK = "asha.batteryAsked";

/**
 * Android can quietly stop reminders (notifications off, exact alarms off, battery saver).
 * This card shows only when something needs fixing, with one button per fix.
 */
export function ReminderHealth({ always = false }: { always?: boolean }) {
  const lang = useAsha((s) => s.lang);
  const [st, setSt] = useState<NativeStatus | null>(null);
  const [batteryAsked, setBatteryAsked] = useState(() => {
    try {
      return localStorage.getItem(BATTERY_OK) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!isNative) return;
    const check = () =>
      void AshaNative.status()
        .then(setSt)
        .catch(() => undefined);
    check();
    let remove: (() => void) | undefined;
    void App.addListener("resume", check).then((h) => {
      remove = () => void h.remove();
    });
    return () => remove?.();
  }, []);

  if (!isNative || !st) return null;
  const needNotes = !st.notifications;
  const needExact = !st.exactAlarms;
  const needBattery = !st.batteryFree && !batteryAsked;
  if (!always && !needNotes && !needExact && !needBattery) return null;

  return (
    <Card className="mt-5 border-clay bg-clay-soft">
      <p className="text-xl font-bold">{t(lang, { en: "So Asha never misses a reminder", hi: "ताकि आशा कोई याद न चूके" })}</p>
      {!needNotes && !needExact && !needBattery ? (
        <p className="mt-2 text-lg">{t(lang, { en: "All set. Reminders will ring on time.", hi: "सब ठीक है. याद समय पर आएगी." })}</p>
      ) : null}
      <div className="mt-3 flex flex-col gap-2">
        {needNotes ? (
          <Button
            onClick={async () => {
              await AshaNative.requestNotifications().catch(() => undefined);
              setSt(await AshaNative.status());
            }}
          >
            {t(lang, { en: "1. Allow reminders on screen", hi: "1. स्क्रीन पर याद की अनुमति दें" })}
          </Button>
        ) : null}
        {needExact ? (
          <>
            <Button onClick={() => void AshaNative.openExactAlarmSettings()}>
              {t(lang, { en: "2. Allow exact times", hi: "2. ठीक समय की अनुमति दें" })}
            </Button>
            <p className="text-base text-quiet">
              {t(lang, {
                en: "A settings page opens. Turn on 'Alarms & reminders' for Asha, then come back.",
                hi: "एक सेटिंग पन्ना खुलेगा. आशा के लिए 'Alarms & reminders' चालू करें, फिर वापस आएँ.",
              })}
            </p>
          </>
        ) : null}
        {needBattery ? (
          <>
            <Button
              variant="quiet"
              onClick={() => {
                void AshaNative.openBatterySettings();
                try {
                  localStorage.setItem(BATTERY_OK, "1");
                } catch {
                  /* ignore */
                }
                setBatteryAsked(true);
              }}
            >
              {t(lang, { en: "3. Stop battery saver from muting Asha", hi: "3. बैटरी सेवर आशा को चुप न कराए" })}
            </Button>
            <p className="text-base text-quiet">
              {t(lang, {
                en: "In the list, find Asha and choose 'Don't optimise' or 'No restrictions'. Phones like Xiaomi, Vivo, Oppo and Realme need this most.",
                hi: "सूची में आशा ढूँढें और 'Don't optimise' या 'No restrictions' चुनें. शाओमी, वीवो, ओप्पो, रियलमी फ़ोन में यह सबसे ज़रूरी है.",
              })}
            </p>
          </>
        ) : null}
        <Button variant="ghost" onClick={() => syncReminders(true)}>
          {t(lang, { en: "Refresh reminders", hi: "याद फिर से लगाएँ" })}
        </Button>
      </div>
    </Card>
  );
}
