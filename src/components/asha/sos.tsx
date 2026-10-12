import { Phone, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, t } from "@/components/asha/bits";
import { digits, smsHref, telHref, todayCheckin } from "@/lib/asha/schedule";
import { smsBody } from "@/lib/asha/speech";
import { useAsha } from "@/lib/asha/store";

export function SosScreen() {
  const lang = useAsha((s) => s.lang);
  const name = useAsha((s) => s.name);
  const contacts = useAsha((s) => s.contacts);
  const emergency = useAsha((s) => s.emergencyNumber);
  const checkins = useAsha((s) => s.checkins);
  const tight = todayCheckin(checkins)?.chestOk === false;
  const openSettings = useAsha((s) => s.openSettings);
  const body = smsBody(lang, name);
  const people = contacts.filter((c) => digits(c.phone).length >= 3);
  const hasEmergency = digits(emergency).length >= 3;

  return (
    <div className="py-5">
      <h1 className="display text-4xl text-sos">{t(lang, { en: "Help", hi: "मदद" })}</h1>
      <p className="mt-3 text-lg">
        {t(lang, {
          en: "Press a button. Your phone opens the call or message screen. Then press the green call button there. Asha cannot dial by herself.",
          hi: "बटन दबाएँ. फ़ोन कॉल या संदेश की स्क्रीन खोलेगा. वहाँ हरा कॉल बटन दबाएँ. आशा खुद डायल नहीं कर सकती.",
        })}
      </p>
      {tight ? (
        <Card className="mt-4 border-sos bg-sos-soft">
          <p className="text-lg font-bold">
            {t(lang, {
              en: "Chest tightness was marked today. Call now. Do not wait to see if it passes.",
              hi: "आज सीने की जकड़न चिह्नित है. अभी कॉल करें. गुज़र जाने का इंतज़ार न करें.",
            })}
          </p>
        </Card>
      ) : null}

      <div className="mt-5">
        {hasEmergency ? (
          <a href={telHref(emergency)} className="inline-flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl bg-sos px-5 text-xl font-bold text-paper">
            <Phone className="size-6" aria-hidden />
            {t(lang, { en: "Call emergency", hi: "इमरजेंसी कॉल" })} {emergency}
          </a>
        ) : (
          <Card>
            <p className="text-lg">
              {t(lang, {
                en: "No emergency number yet. Add 112, 911, or the number your family uses.",
                hi: "अभी इमरजेंसी नंबर नहीं. 112, 911, या जो नंबर परिवार इस्तेमाल करे, वह डालें.",
              })}
            </p>
          </Card>
        )}
      </div>

      <h2 className="mt-6 text-2xl font-bold">{t(lang, { en: "Loved ones", hi: "अपने लोग" })}</h2>
      {people.length === 0 ? (
        <p className="mt-2 text-lg text-quiet">
          {t(lang, { en: "No phone numbers saved yet.", hi: "अभी कोई फ़ोन नंबर सहेजा नहीं." })}
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          {people.map((person) => (
            <Card key={person.id}>
              <p className="text-2xl font-bold">{person.name}</p>
              <p className="text-base text-quiet">
                {person.relation} · {person.phone}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <a href={telHref(person.phone)} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-sage px-3 text-lg font-bold text-paper">
                  <Phone className="size-5" aria-hidden />
                  {t(lang, { en: "Call", hi: "कॉल" })}
                </a>
                <a href={smsHref(person.phone, body)} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-line bg-paper px-3 text-lg font-bold text-ink">
                  <MessageSquare className="size-5" aria-hidden />
                  {t(lang, { en: "Message", hi: "संदेश" })}
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}
      <p className="mt-4 text-base text-quiet">
        {t(lang, { en: "The message says you need help now and asks them to call or come.", hi: "संदेश कहता है कि अभी मदद चाहिए और उन्हें कॉल या आने को कहता है." })}
      </p>
      <div className="mt-4">
        <Button variant="quiet" onClick={() => openSettings()}>
          {t(lang, { en: "Add or change numbers", hi: "नंबर जोड़ें या बदलें" })}
        </Button>
      </div>
    </div>
  );
}
