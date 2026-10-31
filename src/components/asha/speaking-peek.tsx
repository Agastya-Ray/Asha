import { useEffect, useState } from "react";
import { FairyScene } from "@/components/asha/fairy";
import { t } from "@/components/asha/bits";
import { AshaNative, isNative } from "@/lib/asha/native";
import { fairyDrawn } from "@/lib/asha/onscreen";
import { useAsha } from "@/lib/asha/store";
import { useSpeech } from "@/lib/asha/voice";

/**
 * Whenever a voice speaks in Asha, Titli is on the screen saying it. Some screens have no fairy of their own
 * (Family, Help, Settings, Talk, or after she was sent to sleep), and a reminder or a message can still be read
 * out there; then she floats in gently at the top corner for as long as she speaks, and floats away after.
 */
export function SpeakingPeek() {
  const own = useSpeech((s) => s.active);
  // Android speaking a reminder or a message while Asha is open
  const [android, setAndroid] = useState(false);
  useEffect(() => {
    if (!isNative) return;
    let off: (() => void) | undefined;
    void AshaNative.addListener("speaking", (e) => setAndroid(!!e?.on))
      .then((h) => {
        off = () => void h.remove();
      })
      .catch(() => undefined);
    return () => off?.();
  }, []);
  const speaking = own || android;
  const lang = useAsha((s) => s.lang);
  const fairyName = useAsha((s) => s.fairyName);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!speaking) {
      setShow(false);
      return;
    }
    const check = () => setShow(!fairyDrawn(true));
    check();
    const id = window.setInterval(check, 800);
    return () => window.clearInterval(id);
  }, [speaking]);
  if (!show) return null;
  const who = fairyName || t(lang, { en: "Your fairy", hi: "आपकी परी" });
  return (
    <div className="speaking-peek fixed right-3 top-20 z-40 pointer-events-none" data-fairy="speaking">
      <FairyScene news={false} mood="talk" size="sm" label={t(lang, { en: `${who} is talking`, hi: `${who} बोल रही है` })} />
    </div>
  );
}
