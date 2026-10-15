import { Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, Hear, t, useNow } from "@/components/asha/bits";
import { ReminderHealth } from "@/components/asha/reminder-health";
import { VoiceCommand } from "@/components/asha/voice-command";
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

  const hello = greeting(lang, name, now);
  const helloSay = greeting(voiceLang, name, now);
  const agenda = buildAgenda({ name, lang, voiceLang, meds, meals, doseLogs, mealLogs, snooze }, now);
  const active = agenda.filter((item) => item.state === "now" || item.state === "snoozed" || item.state === "open");
  const later = agenda.filter((item) => item.state === "later");
  const featuredLater = active.length === 0 ? later[0] : undefined;
  const restLater = featuredLater ? later.slice(1) : later;
  const done = agenda.filter((item) => item.state === "taken" || item.state === "skipped");
  const progress = doseProgress(meds, doseLogs, now);
  const checkin = todayCheckin(checkins, now);
  const low = meds.filter((m) => m.pillsLeft !== null && m.pillsLeft <= 7);
  const hour = now.getHours();

  return (
    <div className="py-5">
      <h1 className="display text-4xl leading-tight">{hello.title}</h1>
      <p className="mt-3 text-lg text-quiet">{hello.line}</p>
      <div className="mt-4">
        <Hear say={`${helloSay.title} ${helloSay.line}`} label={t(lang, { en: "Hear this", hi: "इसे सुनें" })} />
      </div>

      <ReminderHealth />
      <VoiceCommand />

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

      <h2 className="mt-6 text-xl font-bold">{t(lang, { en: "Right now", hi: "अभी" })}</h2>
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
      {active.length > 0 ? (
        <div className="mt-3 flex flex-col gap-3">
          {active.map((item) => (
            <AgendaCard key={item.key} item={item} />
          ))}
        </div>
      ) : null}
      {featuredLater ? (
        <div className="mt-3">
          <AgendaCard item={featuredLater} />
        </div>
      ) : null}

      {sample ? (
        <p className="mt-4 text-base text-quiet">
          <span className="font-bold text-clay">{t(lang, { en: "Sample. ", hi: "नमूना. " })}</span>
          {t(lang, {
            en: "Practice data for Meena, not a real prescription. Erase it in Settings before you use her real list.",
            hi: "मीना का अभ्यास है, असली पर्ची नहीं. असली सूची से पहले सेटिंग में मिटा दें.",
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

      <Card className="mt-5">
        <div className="flex items-center gap-3">
          <Droplets className="size-6 text-sage" aria-hidden />
          <p className="text-lg font-bold">
            {t(lang, { en: "Water", hi: "पानी" })} · {checkin?.water ?? 0} / 8
          </p>
        </div>
        <p className="mt-2 text-base text-quiet">
          {t(lang, { en: "Tap when you finish a glass. Eight is plenty for most days.", hi: "गिलास खत्म हो तो दबाएँ. ज़्यादातर दिनों में आठ काफ़ी हैं." })}
        </p>
        <div className="mt-4">
          <Button variant="quiet" onClick={() => addWater()}>
            {t(lang, { en: "I drank a glass", hi: "एक गिलास पी लिया" })}
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

      <p className="mt-5 text-lg">
        {progress.total === 0
          ? t(lang, { en: "No doses are on the list yet.", hi: "सूची में अभी कोई खुराक नहीं." })
          : progress.marked === progress.total
            ? t(lang, { en: "Today's doses are marked. That is a good day's work.", hi: "आज की खुराकें चिह्नित हैं. यह अच्छे दिन का काम है." })
            : lang === "hi"
              ? `आज ${progress.total} में से ${progress.marked} खुराक चिह्नित हैं.`
              : `You have marked ${progress.marked} of ${progress.total} doses today.`}
      </p>

      {done.length > 0 ? (
        <details className="mt-4 rounded-3xl border border-line bg-paper px-4 py-3">
          <summary className="min-h-12 cursor-pointer text-lg font-bold">
            {t(lang, { en: "Already marked", hi: "पहले से चिह्नित" })} ({done.length})
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
          <li>{t(lang, { en: "Press the green button after it is taken.", hi: "ले लेने के बाद हरा बटन दबाएँ." })}</li>
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

function AgendaCard({ item }: { item: AgendaItem }) {
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
      <p className="text-base font-bold text-sage">
        {item.kind === "med" ? t(lang, { en: "Medicine", hi: "दवा" }) : t(lang, { en: "Meal", hi: "खाना" })} ·{" "}
        {speakClock(lang, item.time)}
      </p>
      <h3 className="display mt-1 text-3xl first-letter:uppercase">{item.title}</h3>
      {item.detail ? <p className="mt-1 text-base text-quiet">{item.detail}</p> : null}
      {item.state === "later" ? (
        <p className="mt-2 text-base text-quiet">
          {t(lang, {
            en: "Coming up. If you already did it, press the green button.",
            hi: "आने वाला है. हो चुका हो तो हरा बटन दबाएँ.",
          })}
        </p>
      ) : null}
      {item.state === "snoozed" ? (
        <p className="mt-2 text-base font-bold">{t(lang, { en: "Asha will speak again in a few minutes.", hi: "आशा कुछ मिनट में फिर बोलेगी." })}</p>
      ) : null}
      {item.state === "open" ? (
        <p className="mt-2 text-base font-bold">{t(lang, { en: "Still open from earlier. No scolding.", hi: "पहले से खुली है. कोई डाँट नहीं." })}</p>
      ) : null}
      <p className="mt-3 text-lg">{item.sentence}</p>
      <div className="mt-3">
        <Hear say={item.say} label={t(lang, { en: "Hear this", hi: "इसे सुनें" })} />
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <Button
          onClick={() => {
            if (item.kind === "med") logDose(item.id, item.time, "taken");
            else logMeal(item.id);
          }}
        >
          {primary}
        </Button>
        <Button variant="quiet" onClick={() => snoozeKey(item.key, 10)}>
          {t(lang, { en: "Remind me in 10 minutes", hi: "10 मिनट में याद दिलाएँ" })}
        </Button>
        {item.kind === "med" ? (
          <Button variant="ghost" onClick={() => logDose(item.id, item.time, "skipped")}>
            {t(lang, { en: "Skip today", hi: "आज छोड़ें" })}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
