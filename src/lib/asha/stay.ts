import { pushNativeConfig, useFamily } from "@/lib/asha/family";
import { AshaNative, isNative } from "@/lib/asha/native";
import { useAsha } from "@/lib/asha/store";
import { speak } from "@/lib/asha/voice";

/**
 * The fairy staying on the phone screen when Asha is closed.
 * 1. Always: she lives on the home (and lock) screen as a live wallpaper. No permission, one "Set wallpaper" press.
 * 2. Extra, from Settings: she floats over other apps. Android asks for "Display over other apps" on its own page
 *    (and on Android 13+ a phone that did not get Asha from the Play Store first wants "Allow restricted settings").
 *    People who say yes there do not have to come back and press anything again: she switches on by herself.
 */
const WANT = "asha.fairyStayWanted"; // "1" = they said yes, Android's page is (or was) open
const OFF = "asha.fairyStayOff"; // "1" = they turned her off in Settings: never switch her on by ourselves
const ASKED = "asha.fairyStayAsked"; // when they last said "Not now" (ms)
const ASK_AGAIN = 3 * 24 * 60 * 60_000;
const WANT_HOME = "asha.fairyHomeWanted"; // "1" = Android's wallpaper preview is (or was) open

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

/** They asked for the floating fairy and went to Android's page, and she is not on yet. */
export function wantedStay() {
  return get(WANT) === "1";
}

export function stayOff() {
  put(OFF, "1");
  put(WANT, null);
}

export function notNow() {
  put(ASKED, String(Date.now()));
}

/** Show the fairy's "may I live on your home screen?" question? */
export function shouldAsk(onHome: boolean, now = Date.now()) {
  if (!isNative || onHome) return false;
  return now - Number(get(ASKED) ?? 0) > ASK_AGAIN;
}

/** "Yes, live on my screen": Android's wallpaper preview, with its own "Set wallpaper" button. */
export async function wantHome() {
  put(WANT_HOME, "1");
  await AshaNative.openWallpaper().catch(() => undefined);
}

export async function onHomeScreen() {
  const st = await AshaNative.status().catch(() => null);
  return st?.wallpaper === true;
}

/** Back from the wallpaper preview: if she is the wallpaper now, a happy hello. Returns true when she is. */
export async function settleHome() {
  if (!isNative) return false;
  const on = await onHomeScreen();
  if (!on || get(WANT_HOME) !== "1") return on;
  put(WANT_HOME, null);
  const { voiceLang, name } = useAsha.getState();
  const line =
    voiceLang === "hi"
      ? `वाह! अब मैं आपकी होम स्क्रीन पर रहती हूँ${name ? `, ${name}` : ""}. दवा का समय हो तो मैं पूरी स्क्रीन पर आकर बताऊँगी.`
      : `Yay! Now I live on your home screen${name ? `, ${name}` : ""}. At medicine time I'll fill the whole screen and tell you.`;
  void speak(line, voiceLang, "fairy");
  return true;
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
