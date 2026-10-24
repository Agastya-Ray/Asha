import { pushNativeConfig, useFamily } from "@/lib/asha/family";
import { AshaNative, isNative } from "@/lib/asha/native";
import { useAsha } from "@/lib/asha/store";
import { speak } from "@/lib/asha/voice";

/**
 * The fairy staying on the phone screen when Asha is closed (the floating fairy).
 * Android asks for "Display over other apps" on its own settings page. People who say yes there
 * should not have to come back and press anything again: she switches on by herself on return.
 */
const WANT = "asha.fairyStayWanted"; // "1" = they said yes, Android's page is (or was) open
const OFF = "asha.fairyStayOff"; // "1" = they turned her off in Settings: never switch her on by ourselves
const ASKED = "asha.fairyStayAsked"; // when they last said "Not now" (ms)
const ASK_AGAIN = 3 * 24 * 60 * 60_000;

function get(k: string) {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
}
function put(k: string, v: string | null) {
  try {
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  } catch {
    /* private mode: the fairy just asks again next time */
  }
}

async function switchOn(): Promise<boolean> {
  const r = await AshaNative.setBubble({ on: true }).catch(() => ({ ok: false }));
  useFamily.setState({ bubble: r.ok });
  void pushNativeConfig();
  return r.ok;
}

/** "Yes, stay with me". Returns "on", or "settings" when Android's permission page was opened. */
export async function wantStay(): Promise<"on" | "settings"> {
  put(OFF, null);
  const can = await AshaNative.canDrawOverlays().catch(() => ({ ok: false }));
  if (can.ok && (await switchOn())) return "on";
  put(WANT, "1");
  await AshaNative.openOverlaySettings().catch(() => undefined);
  return "settings";
}

export function stayOff() {
  put(OFF, "1");
  put(WANT, null);
}

export function notNow() {
  put(ASKED, String(Date.now()));
}

/** Show the fairy's "may I stay on your screen?" question? */
export function shouldAsk(bubble: boolean, now = Date.now()) {
  if (!isNative || bubble || get(OFF) === "1") return false;
  return now - Number(get(ASKED) ?? 0) > ASK_AGAIN;
}

/**
 * On opening Asha and on every return to it: if the permission is there now (and nobody turned her off),
 * switch her on. Says a happy hello the first time, after the person went through Android's page.
 */
export async function settleStay() {
  if (!isNative || useFamily.getState().bubble || get(OFF) === "1") return;
  const can = await AshaNative.canDrawOverlays().catch(() => ({ ok: false }));
  if (!can.ok) return;
  const asked = get(WANT) === "1";
  put(WANT, null);
  if (!(await switchOn()) || !asked) return;
  const { voiceLang, name } = useAsha.getState();
  const line =
    voiceLang === "hi"
      ? `वाह! अब मैं आपकी स्क्रीन पर रहूँगी${name ? `, ${name}` : ""}. आशा बंद हो तब भी. दवा के समय मैं ख़ुद आकर बताऊँगी.`
      : `Yay! Now I'll stay on your screen${name ? `, ${name}` : ""}, even when Asha is closed. At medicine time I'll come and tell you myself.`;
  void speak(line, voiceLang, "fairy");
}
