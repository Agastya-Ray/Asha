import { VisitSoon } from "@/components/asha/ideas/prescriptions";
import { useState } from "react";
import { Droplets, HeartPulse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, Hear, t, useNow } from "@/components/asha/bits";
import { ReminderHealth } from "@/components/asha/reminder-health";
import { VoiceCommand } from "@/components/asha/voice-command";
import { DayRitual } from "@/components/asha/ideas/day-ritual";
import { FamilyPhotoOffer } from "@/components/asha/ideas/family-med-photos";
import { CallFaces } from "@/components/asha/ideas/call-faces";
import { YesterdayNote } from "@/components/asha/ideas/yesterday-note";
import { isNative } from "@/lib/asha/native";
import { plateLine } from "@/lib/asha/plans";
import { buildAgenda, doseProgress, todayCheckin } from "@/lib/asha/schedule";
import { greeting } from "@/lib/asha/speech";
import { speakClock } from "@/lib/asha/time";
import { useAsha } from "@/lib/asha/store";
import type { AgendaItem } from "@/lib/asha/types";

export function TodayScreen() {
  const now = useNow();
  const lang = useAsha((s) => s.lang);
  const voiceLang = useAsha((s) => s.voiceLang);
  const name = useAsha((s) => s.name);
  const conditions = useAsha((s) => s.conditions);
  const sample = useAsha((s) => s.sample);
  const coach = useAsha((s) => s.coachDismissed);
  const dismiss = useAsha((s) => s.dismissCoach);
  const meds = useAsha((s) => s.meds);
  const meals = useAsha((s) => s.meals);
  const doseLogs = useAsha((s) => s.doseLogs);
  const mealLogs = useAsha((s) => s.mealLogs);
  const snooze = useAsha((s) => s.snooze);
  const checkins = useAsha((s) => s.checkins);
  const logDose = useAsha((s) => s.logDose);
  const undoDose = useAsha((s) => s.undoDose);
  const logMeal = useAsha((s) => s.logMeal);
  const undoMeal = useAsha((s) => s.undoMeal);
  const snoozeKey = useAsha((s) => s.snoozeKey);
  const patchCheckin = useAsha((s) => s.patchCheckin);
  const addWater = useAsha((s) => s.addWater);
  const setTab = useAsha((s) => s.setTab);
  const [picked, setPicked] = useState("");

  const hello = greeting(lang, name, now);
  const helloSay = greeting(voiceLang, name, now);
  const agenda = buildAgenda({ name, lang, voiceLang, meds, meals, doseLogs, mealLogs, snooze }, now);
  const active = agenda.filter((item) => item.state === "now" || item.state === "snoozed" || item.state === "open");
  const later = agenda.filter((item) => item.state === "later");
  // one reminder at a time: the one due now (or the one the person tapped), the rest as short rows
  const first = active.find((item) => item.key === picked) ?? active.find((item) => item.state === "now" || item.state === "open") ?? active[0];
  const waiting = active.filter((item) => item !== first);
  const featuredLater = active.length === 0 ? later[0] : undefined;
  const restLater = featuredLater ? later.slice(1) : later;
  const done = agenda.filter((item) => item.state === "taken" || item.state === "skipped");
  const progress = doseProgress(meds, doseLogs, now);
  const checkin = todayCheckin(checkins, now);
  const low = meds.filter((m) => m.pillsLeft !== null && m.pillsLeft <= 7);
  const hour = now.getHours();

  return (
    <div className="py-5">
      <div className="hero flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="display text-4xl leading-tight">{hello.title}</h1>
          <p className="mt-2 text-lg text-quiet">{hello.line}</p>
        </div>
        <Hear round say={`${helloSay.title} ${helloSay.line}`} label={t(lang, { en: "Hear this", hi: "इसे सुनें" })} />
      </div>

      <DayRitual />
      <ReminderHealth />

      {conditions.includes("heart") && checkin?.chestOk !== true ? (
        <Card className="mt-5 border-sos bg-sos-soft">
          <p className="text-lg font-bold">
            {checkin?.chestOk === false
              ? t(lang, { en: "You said there is tightness. Call now.", hi: "आपने कहा सीने में जकड़न है. अभी कॉल करें." })
              : t(lang, { en: "Any chest tightness today?", hi: "आज सीने में कोई जकड़न?" })}
          </p>
          <p className="mt-2 text-base text-quiet">
            {t(lang, {
              en: "Pressure, pain into the arm or jaw, cold sweat, or breath you cannot catch is not something to wait out.",
              hi: "दबाव, बाँह या जबड़े तक दर्द, ठंडा पसीना, या साँस जो न आए — इसे बाद पर न छोड़ें.",
            })}
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Button
              variant="sos"
              onClick={() => {
                patchCheckin({ chestOk: false });
                setTab("sos");
              }}
            >
              {t(lang, { en: "Yes — open Help", hi: "हाँ — मदद खोलें" })}
            </Button>
            {checkin?.chestOk !== false ? (
              <Button variant="quiet" onClick={() => patchCheckin({ chestOk: true })}>
                {t(lang, { en: "No tightness", hi: "जकड़न नहीं" })}
              </Button>
            ) : null}
          </div>
        </Card>
      ) : null}

      <div className="mt-7 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">{t(lang, { en: "Right now", hi: "अभी" })}</h2>
        {progress.total > 0 ? (
          <span className="pill-progress shrink-0 rounded-full px-3 py-1 text-base font-bold tabular-nums">
            {lang === "hi" ? `${progress.total} में से ${progress.marked}` : `${progress.marked} of ${progress.total} done`}
          </span>
        ) : null}
      </div>
      <section data-tour="now">
      {active.length === 0 && !featuredLater ? (
        <Card className="mt-3">
          <p className="text-lg">
            {t(lang, {
              en: "Nothing is on the list yet. Add a medicine when you are ready.",
              hi: "सूची अभी खाली है. तैयार हों तो एक दवा जोड़ें.",
            })}
          </p>
        </Card>
      ) : null}
      {first ? (
        <div className="mt-3">
          <AgendaCard key={first.key} item={first} perch />
        </div>
      ) : null}
      {waiting.length > 0 ? (
        <>
          <h2 className="mt-5 text-lg font-bold text-quiet">{t(lang, { en: "Also waiting", hi: "ये भी बाकी हैं" })}</h2>
          <div className="mt-2 flex flex-col gap-2">
            {waiting.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setPicked(item.key)}
                className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-line bg-paper px-4 py-3 text-left"
              >
                <span className="text-lg font-bold first-letter:uppercase">{item.title}</span>
                <span className="shrink-0 text-base font-bold text-sage">{t(lang, { en: "Open", hi: "खोलें" })}</span>
              </button>
            ))}
          </div>
        </>
      ) : null}
      {featuredLater ? (
        <div className="mt-3">
          <AgendaCard item={featuredLater} />
        </div>
      ) : null}
      </section>

      <FamilyPhotoOffer />
      <VisitSoon />
      <YesterdayNote />
      <VoiceCommand />

      {sample ? (
        <p className="mt-4 text-base text-quiet">
          <span className="font-bold text-clay">{t(lang, { en: "Sample. ", hi: "नमूना. " })}</span>
          {t(lang, {
            en: "Practice medicines, not a real prescription. Erase them in Settings before you add your real list.",
            hi: "ये अभ्यास की दवाइयाँ हैं, असली पर्ची नहीं. असली सूची से पहले सेटिंग में मिटा दें.",
          })}
        </p>
      ) : null}

      <p className="mt-4 text-lg">{plateLine(conditions, lang)}</p>

      {restLater.length > 0 ? (
        <>
          <h2 className="mt-6 text-xl font-bold">{t(lang, { en: "Later today", hi: "आज बाद में" })}</h2>
          <div className="mt-3 flex flex-col gap-2">
            {restLater.map((item) => (
              <div key={item.key} className="flex items-baseline justify-between gap-3 rounded-2xl border border-line bg-paper px-4 py-3">
                <p className="text-lg font-bold first-letter:uppercase">{item.title}</p>
                <p className="shrink-0 text-base tabular-nums text-quiet">{speakClock(lang, item.time)}</p>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {low.length > 0 ? (
        <Card className="mt-5">
          <p className="text-lg font-bold">{t(lang, { en: "Refill soon", hi: "जल्द रिफिल" })}</p>
          <ul className="mt-2 space-y-1 text-lg">
            {low.map((m) => (
              <li key={m.id}>
                {m.name}: {m.pillsLeft} {t(lang, { en: "left", hi: "बची" })}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-base text-quiet">
            {t(lang, { en: "Ask the pharmacy before the bottle is empty.", hi: "डिब्बी खाली होने से पहले दवा की दुकान से कहें." })}
          </p>
        </Card>
      ) : null}

      <CallFaces />

      <Card className="mt-5">
        <div data-pet="water" className="flex flex-wrap items-center gap-3">
          <Droplets className="size-7 shrink-0 text-sage" aria-hidden />
          <p className="min-w-0 flex-1 text-lg font-bold">
            {t(lang, { en: "Water", hi: "पानी" })} · {checkin?.water ?? 0} / 8
            <span className="block text-base font-normal text-quiet">{t(lang, { en: "Eight glasses is plenty.", hi: "आठ गिलास काफ़ी हैं." })}</span>
          </p>
          <Button variant="quiet" className="w-auto px-5" onClick={() => addWater()}>
            {t(lang, { en: "+ 1 glass", hi: "+ 1 गिलास" })}
          </Button>
        </div>
      </Card>

      <Card className="mt-5">
        <div className="flex flex-wrap items-center gap-3">
          <HeartPulse className="size-7 shrink-0 text-sage" aria-hidden />
          <p className="min-w-0 flex-1 text-lg font-bold">
            {t(lang, { en: "Meals and my chart", hi: "खाना और मेरा चार्ट" })}
            <span className="block text-base font-normal text-quiet">
              {t(lang, { en: "Meal times, how you feel, and your health chart.", hi: "खाने का समय, आप कैसे हैं, और सेहत चार्ट." })}
            </span>
          </p>
          <Button variant="quiet" className="w-auto px-5" aria-label={t(lang, { en: "Open meals and my chart", hi: "खाना और मेरा चार्ट खोलें" })} onClick={() => setTab("care")}>
            {t(lang, { en: "Open", hi: "खोलें" })}
          </Button>
        </div>
      </Card>

      {conditions.includes("diabetes") && hour >= 18 && !checkin?.footCheck ? (
        <Card className="mt-5">
          <p className="text-lg font-bold">{t(lang, { en: "Look at both feet tonight.", hi: "आज रात दोनों पैर देखें." })}</p>
          <p className="mt-2 text-lg">
            {t(lang, {
              en: "Cuts, redness, or a dark spot is worth telling the doctor. Do not wait for pain.",
              hi: "कट, लालिमा या काला धब्बा डॉक्टर को बताने लायक है. दर्द का इंतज़ार न करें.",
            })}
          </p>
          <div className="mt-4">
            <Button variant="quiet" onClick={() => patchCheckin({ footCheck: true })}>
              {t(lang, { en: "I looked", hi: "देख लिया" })}
            </Button>
          </div>
        </Card>
      ) : null}

      {progress.total > 0 && progress.marked === progress.total ? (
        <p className="mt-5 text-lg">
          {t(lang, { en: "Today's doses are marked. That is a good day's work.", hi: "आज की खुराकें चिह्नित हैं. यह अच्छे दिन का काम है." })}
        </p>
      ) : null}

      {done.length > 0 ? (
        <details className="mt-4 rounded-3xl border border-line bg-paper px-4 py-3">
          <summary className="min-h-12 cursor-pointer text-lg font-bold">
            {t(lang, { en: "Done today ✓", hi: "आज हो गया ✓" })} ({done.length})
          </summary>
          <div className="mt-3 flex flex-col gap-3">
            {done.map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-3">
                <p className="text-lg">
                  {item.title}
                  <span className="block text-base text-quiet">
                    {item.state === "skipped"
                      ? t(lang, { en: "Skipped", hi: "छोड़ी" })
                      : t(lang, { en: "Taken", hi: "ले ली" })}
                  </span>
                </p>
                <button
                  type="button"
                  className="min-h-12 shrink-0 font-bold text-sage"
                  onClick={() => (item.kind === "med" ? undoDose(item.id, item.time) : undoMeal(item.id))}
                >
                  {t(lang, { en: "Undo", hi: "वापस" })}
                </button>
              </div>
            ))}
          </div>
        </details>
      ) : null}

      {coach ? null : <details className="mt-5 rounded-3xl border border-line bg-paper px-4 py-3">
        <summary className="min-h-12 cursor-pointer text-lg font-bold">
          {t(lang, { en: "How today works", hi: "आज कैसे चलता है" })}
        </summary>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-lg">
          <li>{t(lang, { en: "When a dose is due, Asha speaks the sentence on the card.", hi: "जब दवा का समय हो, आशा कार्ड वाला वाक्य बोलती है." })}</li>
          <li>{t(lang, { en: "Press the big button after it is taken.", hi: "ले लेने के बाद बड़ा बटन दबाएँ." })}</li>
          <li>{t(lang, { en: "Help stays at the top and opens the numbers you saved.", hi: "मदद ऊपर रहती है और सहेजे नंबर खोलती है." })}</li>
        </ol>
        <p className="mt-3 text-base text-quiet">
          {isNative
            ? t(lang, {
                en: "She speaks even when the phone is locked. If you do not press anything, she asks again twice, ten minutes apart.",
                hi: "फ़ोन लॉक हो तब भी वह बोलती है. कुछ न दबाएँ तो दस-दस मिनट पर दो बार और पूछती है.",
              })
            : t(lang, {
                en: "In a web browser she can speak only while this page is open. The Android app speaks even when the phone is locked.",
                hi: "ब्राउज़र में वह तभी बोलती है जब यह पन्ना खुला हो. एंड्रॉइड ऐप फ़ोन लॉक होने पर भी बोलता है.",
              })}
        </p>
        <div className="mt-4">
          <Button variant="quiet" onClick={() => dismiss()}>
            {t(lang, { en: "Hide this note", hi: "यह नोट छिपाएँ" })}
          </Button>
        </div>
      </details>}
      {isNative ? null : <Card className="mt-5">
        <p className="text-lg font-bold">{t(lang, { en: "Keep Asha on the home screen", hi: "आशा को होम स्क्रीन पर रखें" })}</p>
        <p className="mt-2 text-base text-quiet">
          {t(lang, {
            en: "In Chrome, open the menu (three dots), then Install app or Add to Home screen. Open her from that icon.",
            hi: "क्रोम में मेनू खोलें (तीन बिंदु), फिर Install app या होम स्क्रीन में जोड़ें. उसी आइकन से खोलें.",
          })}
        </p>
      </Card>}
    </div>
  );
}

function AgendaCard({ item, perch = false }: { item: AgendaItem; perch?: boolean }) {
  const lang = useAsha((s) => s.lang);
  const logDose = useAsha((s) => s.logDose);
  const logMeal = useAsha((s) => s.logMeal);
  const snoozeKey = useAsha((s) => s.snoozeKey);
  const primary =
    item.kind === "med"
      ? t(lang, { en: "I took it", hi: "ले ली" })
      : t(lang, { en: "I have eaten", hi: "खा लिया" });
  return (
    <Card className={item.state === "now" ? "border-sage" : undefined}>
      {/* the fairy perches in this corner (FairyDock), and the words flow around her */}
      {perch ? <div data-fairy-perch className="fairy-perch" /> : null}
      <p className="text-base font-bold text-sage">
        {item.kind === "med" ? t(lang, { en: "Medicine", hi: "दवा" }) : t(lang, { en: "Meal", hi: "खाना" })} ·{" "}
        {speakClock(lang, item.time)}
      </p>
      <h3 className="display mt-1 text-3xl first-letter:uppercase">{item.title}</h3>
      {item.detail ? <p className="mt-1 text-base text-quiet">{item.detail}</p> : null}
      {item.state === "later" ? (
        <p className="mt-2 text-base text-quiet">
          {t(lang, {
            en: "Coming up. If you already did it, press the big button.",
            hi: "आने वाला है. हो चुका हो तो बड़ा बटन दबाएँ.",
          })}
        </p>
      ) : null}
      {item.state === "snoozed" ? (
        <p className="mt-2 text-base font-bold">{t(lang, { en: "Asha will speak again in a few minutes.", hi: "आशा कुछ मिनट में फिर बोलेगी." })}</p>
      ) : null}
      {item.state === "open" ? (
        <p className="mt-2 text-base font-bold">{t(lang, { en: "Still open from earlier. No scolding.", hi: "पहले से खुली है. कोई डाँट नहीं." })}</p>
      ) : null}
      <div className="mt-3 flex items-start gap-3">
        <Hear round say={item.say} label={t(lang, { en: "Hear this", hi: "इसे सुनें" })} />
        <p className="min-w-0 flex-1 text-lg">{item.sentence}</p>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <Button
          data-tour-done
          onClick={() => {
            if (item.kind === "med") logDose(item.id, item.time, "taken");
            else logMeal(item.id);
          }}
        >
          {primary}
        </Button>
        <div className={item.kind === "med" ? "grid grid-cols-2 gap-2" : undefined}>
          <Button variant="quiet" onClick={() => snoozeKey(item.key, 10)}>
            {t(lang, { en: "In 10 min", hi: "10 मिनट में" })}
          </Button>
          {item.kind === "med" ? (
            <Button variant="ghost" onClick={() => logDose(item.id, item.time, "skipped")}>
              {t(lang, { en: "Skip today", hi: "आज छोड़ें" })}
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
