import { App } from "@capacitor/app";
import { isNative } from "@/lib/asha/native";

/**
 * Is Asha's own screen showing right now?
 * Rule: Titli never makes a sound unless she can be seen. When Asha goes to the background, the web page keeps
 * running (her roaming, nudges and timers keep ticking), so everything that speaks or plays a sound asks here first.
 * Over other apps, on the home screen and on the lock screen, Android itself shows her and speaks (see Speaker.java).
 */
let nativeShown = true;
const onHide = new Set<() => void>();

export function appShown() {
  if (typeof document !== "undefined" && document.visibilityState === "hidden") return false;
  return !isNative || nativeShown;
}

/** Called when Asha leaves the screen (so a sentence in the middle stops at once). */
export function whenHidden(f: () => void) {
  onHide.add(f);
  return () => void onHide.delete(f);
}

function hidden() {
  onHide.forEach((f) => {
    try {
      f();
    } catch {
      /* ignore */
    }
  });
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") hidden();
  });
}
if (isNative) {
  void App.addListener("pause", () => {
    nativeShown = false;
    hidden();
  }).catch(() => undefined);
  void App.addListener("resume", () => {
    nativeShown = true;
  }).catch(() => undefined);
}

/** Is a fairy (any Pixie: the dock, a roaming trip, the tour, the intro, a sheet, or the speaking peek) drawn and visible? */
export function fairyDrawn(notPeek = false) {
  if (typeof document === "undefined") return true;
  for (const el of Array.from(document.querySelectorAll<HTMLElement>(".fairy-scene, .pixie, .fi-garden-scene"))) {
    if (notPeek && el.closest(".speaking-peek")) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) continue;
    if (r.bottom <= 0 || r.right <= 0 || r.top >= window.innerHeight || r.left >= window.innerWidth) continue;
    const st = window.getComputedStyle(el);
    if (st.visibility === "hidden" || st.display === "none") continue;
    let o = 1;
    for (let n: HTMLElement | null = el; n; n = n.parentElement) o *= Number(window.getComputedStyle(n).opacity || 1);
    if (o < 0.2) continue;
    return true;
  }
  return false;
}
