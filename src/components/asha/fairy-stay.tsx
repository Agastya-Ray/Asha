import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, Hear, t } from "@/components/asha/bits";
import { Pixie } from "@/components/asha/pixie";
import { useFamily } from "@/lib/asha/family";
import { notNow, shouldAsk, wantStay } from "@/lib/asha/stay";
import { useAsha } from "@/lib/asha/store";

/**
 * The fairy asks, once, if she may stay on the phone screen when Asha is closed.
 * Old phones are full of notifications nobody reads; she comes to the person herself at medicine time.
 * "Not now" asks again in three days. Android's own permission page explains itself badly, so she says what to press.
 */
export function FairyStayAsk() {
  const lang = useAsha((s) => s.lang);
  const voiceLang = useAsha((s) => s.voiceLang);
  const role = useAsha((s) => s.appRole);
  const bubble = useFamily((f) => f.bubble);
  const [step, setStep] = useState<"ask" | "settings" | "gone">("ask");
  if (role === "family" || step === "gone" || (step === "ask" && !shouldAsk(bubble))) return null;
  if (bubble) return null;

  const ask = {
    en: "May I stay on your phone screen, even when Asha is closed? Then at medicine time I'll come to you myself, not get lost in the notifications.",
    hi: "क्या मैं आपकी फ़ोन स्क्रीन पर रह सकती हूँ, आशा बंद हो तब भी? फिर दवा के समय मैं ख़ुद आपके पास आऊँगी, सूचनाओं में खो नहीं जाऊँगी.",
  };
  const how = {
    en: "On the page that opens, find Asha and turn on 'Display over other apps' (or 'Allow display over other apps'). Then press Back. I'll be there.",
    hi: "जो पन्ना खुलेगा, उसमें आशा ढूँढें और 'Display over other apps' चालू करें. फिर Back दबाएँ. मैं वहाँ मिलूँगी.",
  };

  return (
    <Card className="mt-5 border-[#f3c4d0]">
      <div className="flex items-start gap-3">
        <Pixie mood={step === "ask" ? "asking" : "point"} className="h-24 w-20 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-xl font-bold">{t(lang, step === "ask" ? ask : how)}</p>
        </div>
      </div>
      <div className="mt-2 flex justify-end">
        <Hear say={t(voiceLang, step === "ask" ? ask : how)} label={t(lang, { en: "Hear this", hi: "इसे सुनें" })} />
      </div>
      <div className="mt-3 flex flex-col gap-2">
        <Button
          onClick={async () => {
            const r = await wantStay();
            setStep(r === "on" ? "gone" : "settings");
          }}
        >
          {step === "ask"
            ? t(lang, { en: "Yes, stay with me", hi: "हाँ, मेरे साथ रहो" })
            : t(lang, { en: "Open the page again", hi: "पन्ना फिर खोलें" })}
        </Button>
        <Button
          variant="quiet"
          onClick={() => {
            notNow();
            setStep("gone");
          }}
        >
          {t(lang, { en: "Not now", hi: "अभी नहीं" })}
        </Button>
      </div>
    </Card>
  );
}
