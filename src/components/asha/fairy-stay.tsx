import { useEffect, useState } from "react";
import { App } from "@capacitor/app";
import { Button } from "@/components/ui/button";
import { Card, Hear, t } from "@/components/asha/bits";
import { Pixie } from "@/components/asha/pixie";
import { isNative } from "@/lib/asha/native";
import { notNow, onHomeScreen, settleHome, shouldAsk, wantHome } from "@/lib/asha/stay";
import { useAsha } from "@/lib/asha/store";

/**
 * The fairy asks, once, if she may live on the phone's home screen (as its wallpaper), so she is there
 * even when Asha is closed. No permission is needed: Android shows a preview with one "Set wallpaper" button.
 * "Not now" asks again in three days.
 */
export function FairyStayAsk() {
  const lang = useAsha((s) => s.lang);
  const voiceLang = useAsha((s) => s.voiceLang);
  const role = useAsha((s) => s.appRole);
  const [onHome, setOnHome] = useState<boolean | null>(null);
  const [step, setStep] = useState<"ask" | "preview" | "gone">("ask");

  useEffect(() => {
    if (!isNative) return;
    void onHomeScreen().then(setOnHome);
    let remove: (() => void) | undefined;
    void App.addListener("resume", () => void settleHome().then(setOnHome)).then((h) => {
      remove = () => void h.remove();
    });
    return () => remove?.();
  }, []);

  if (role === "family" || onHome !== false || step === "gone" || (step === "ask" && !shouldAsk(onHome))) return null;

  const ask = {
    en: "May I live on your phone's home screen? Then I'm with you even when Asha is closed, and at medicine time I come to you myself, not lost in the notifications.",
    hi: "क्या मैं आपके फ़ोन की होम स्क्रीन पर रह सकती हूँ? फिर आशा बंद हो तब भी मैं आपके साथ रहूँगी, और दवा के समय ख़ुद आपके पास आऊँगी, सूचनाओं में खो नहीं जाऊँगी.",
  };
  const how = {
    en: "On the page that opens, press 'Set wallpaper', then choose 'Home and lock screens'. That's all!",
    hi: "जो पन्ना खुलेगा, उसमें 'Set wallpaper' दबाएँ, फिर 'Home and lock screens' चुनें. बस!",
  };

  return (
    <div data-fairy-asks>
      <Card className="mt-5 border-[#f3c4d0]">
        <div className="flex items-start gap-3">
          <Pixie mood={step === "ask" ? "asking" : "point"} className="h-24 w-20 shrink-0" />
          <p className="min-w-0 flex-1 text-xl font-bold">{t(lang, step === "ask" ? ask : how)}</p>
        </div>
        <div className="mt-2 flex justify-end">
          <Hear say={t(voiceLang, step === "ask" ? ask : how)} label={t(lang, { en: "Hear this", hi: "इसे सुनें" })} />
        </div>
        <div className="mt-3 flex flex-col gap-2">
          <Button
            onClick={async () => {
              setStep("preview");
              await wantHome();
            }}
          >
            {step === "ask"
              ? t(lang, { en: "Yes, live on my screen", hi: "हाँ, मेरी स्क्रीन पर रहो" })
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
    </div>
  );
}
