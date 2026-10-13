import { Card, t } from "@/components/asha/bits";
import { FairyScene } from "@/components/asha/fairy";
import { useAsha } from "@/lib/asha/store";

/** Right after the introduction: is this phone for the person cared for, or for family? */
export function RoleChoice() {
  const lang = useAsha((s) => s.lang);
  const choose = useAsha((s) => s.chooseRole);
  return (
    <div className="py-6">
      <div className="flex justify-center">
        <FairyScene news={false} mood="happy" size="lg" />
      </div>
      <h1 className="display mt-4 text-center text-4xl leading-tight">{t(lang, { en: "Who will use this phone?", hi: "यह फ़ोन कौन इस्तेमाल करेगा?" })}</h1>
      <div className="mt-6 flex flex-col gap-3">
        <button type="button" onClick={() => choose("elder")} className="text-left">
          <Card className="border-2 border-sage">
            <p className="text-2xl font-bold">🌿 {t(lang, { en: "Me — for my own care", hi: "मैं — अपनी देखभाल के लिए" })}</p>
            <p className="mt-2 text-lg text-quiet">
              {t(lang, { en: "Medicine and meal reminders, health chart, Help button, and love from family.", hi: "दवा और खाने की याद, सेहत चार्ट, मदद बटन, और परिवार का प्यार." })}
            </p>
          </Card>
        </button>
        <button type="button" onClick={() => choose("family")} className="text-left">
          <Card className="border-2 border-line">
            <p className="text-2xl font-bold">💛 {t(lang, { en: "I'm family", hi: "मैं परिवार से हूँ" })}</p>
            <p className="mt-2 text-lg text-quiet">
              {t(lang, {
                en: "Son, daughter, husband, wife… Join with her 6-digit code, see how her day is going, and send her love.",
                hi: "बेटा, बेटी, पति, पत्नी… उनके 6 अंकों के कोड से जुड़ें, उनका दिन देखें और प्यार भेजें.",
              })}
            </p>
          </Card>
        </button>
      </div>
    </div>
  );
}
