import { Button } from "@/components/ui/button";
import { Card, Hear, t, useNow } from "@/components/asha/bits";
import { useAsha } from "@/lib/asha/store";
import { shiftDay, todayKey } from "@/lib/asha/time";
import { unmarkedYesterday, yesterdayLine } from "@/lib/asha/yesterday";

/**
 * The morning after a dose went unmarked: a kind note that never asks for a double dose
 * and points to today's doses. "I did take it" fixes yesterday's record.
 */
export function YesterdayNote() {
  const now = useNow();
  const lang = useAsha((s) => s.lang);
  const voiceLang = useAsha((s) => s.voiceLang);
  const meds = useAsha((s) => s.meds);
  const doseLogs = useAsha((s) => s.doseLogs);
  const sample = useAsha((s) => s.sample);
  const noted = useAsha((s) => s.yesterdayNoted);
  const noteYesterday = useAsha((s) => s.noteYesterday);
  const logDose = useAsha((s) => s.logDose);

  const today = todayKey(now);
  if (sample || noted === today) return null;
  const items = unmarkedYesterday(meds, doseLogs, now);
  if (!items.length) return null;
  const copy = yesterdayLine(lang, items);
  const say = yesterdayLine(voiceLang, items);
  const yesterday = shiftDay(1, now);

  return (
    <Card className="mt-5 bg-clay-soft">
      <p className="text-xl font-bold">{copy.title}</p>
      <p className="mt-2 text-lg">{copy.line}</p>
      <div className="mt-3">
        <Hear
          say={`${say.title}. ${say.line}`}
          label={t(lang, { en: "Hear this", hi: "इसे सुनें" })}
        />
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <Button
          onClick={() =>
            noteYesterday(
              today,
              items.map((i) => ({ medId: i.med.id, time: i.time, day: yesterday })),
            )
          }
        >
          {t(lang, { en: "Okay, today's doses on time", hi: "ठीक है, आज की दवा समय पर" })}
        </Button>
        <Button
          variant="quiet"
          onClick={() => {
            for (const i of items) logDose(i.med.id, i.time, "taken", yesterday);
            noteYesterday(today, []);
          }}
        >
          {items.length === 1
            ? t(lang, { en: "I did take it, I forgot to press", hi: "मैंने ली थी, दबाना भूल गई" })
            : t(lang, {
                en: "I did take them, I forgot to press",
                hi: "मैंने ली थीं, दबाना भूल गई",
              })}
        </Button>
      </div>
    </Card>
  );
}
