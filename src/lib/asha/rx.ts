import { useEffect, useState } from "react";
import type { Lang, Prescription } from "@/lib/asha/types";

// Photos of prescription pages stay on this phone, in IndexedDB (too big for localStorage).
const DB = "asha-rx";
const STORE = "pages";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T | undefined> {
  try {
    const db = await open();
    return await new Promise<T>((resolve, reject) => {
      const req = fn(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return undefined;
  }
}

export const putRxPhoto = (id: string, dataUrl: string) =>
  run("readwrite", (s) => s.put(dataUrl, id));
export const getRxPhoto = (id: string) => run<string>("readonly", (s) => s.get(id));
export const deleteRxPhoto = (id: string) => run("readwrite", (s) => s.delete(id));

export function useRxPhoto(id: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    setUrl(null);
    if (id) void getRxPhoto(id).then((u) => live && setUrl(u ?? null));
    return () => {
      live = false;
    };
  }, [id]);
  return url;
}

/** "12 Oct 2026" from YYYY-MM-DD */
export function rxDate(day: string, lang: Lang, weekday = false) {
  const [y, m, d] = day.split("-").map(Number);
  if (!y || !m || !d) return "";
  return new Date(y, m - 1, d).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-GB", {
    ...(weekday ? { weekday: "short" as const } : {}),
    day: "numeric",
    month: "short",
    year: weekday ? undefined : "numeric",
  });
}

/** Whole days from today to a YYYY-MM-DD date (negative once it has passed). */
export function daysUntil(day: string, now = new Date()) {
  const [y, m, d] = day.split("-").map(Number);
  if (!y || !m || !d) return NaN;
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((new Date(y, m - 1, d).getTime() - a) / 86400000);
}

/** What the doctor said, for the Talk context (English, short). The newest three pages. */
export function rxContext(list: Prescription[]) {
  if (!list.length) return "";
  return list
    .slice(0, 3)
    .map((p) => {
      const head = `Prescription${p.date ? ` of ${p.date}` : ""}${p.doctor ? ` by ${p.doctor}` : ""}`;
      const meds = p.meds.length ? ` Medicines: ${p.meds.join("; ")}.` : "";
      const said = p.instructions.length ? ` Doctor's advice: ${p.instructions.join(" ")}` : "";
      const next = p.followUp ? ` Next visit: ${p.followUp}.` : "";
      return `${head}.${meds}${said}${next}`;
    })
    .join(" ");
}

/** The fairy reading out the newest prescription, in the voice language. */
export function rxSpoken(p: Prescription | undefined, lang: Lang) {
  if (!p) {
    return lang === "hi"
      ? "अभी कोई पर्ची सहेजी नहीं है. दवा वाले पन्ने पर पर्ची की फ़ोटो लें, तो मैं याद रखूँगी."
      : "No prescription is saved yet. Take a photo of it on Meds, and I will remember what the doctor said.";
  }
  const who = p.doctor || (lang === "hi" ? "डॉक्टर" : "the doctor");
  const when = p.date ? rxDate(p.date, lang) : "";
  const said = p.instructions.join(" ");
  const next = p.followUp && daysUntil(p.followUp) >= 0 ? rxDate(p.followUp, lang, true) : "";
  if (lang === "hi") {
    return [
      `${when ? `${when} को ` : ""}${who} ने ${p.meds.length} दवाएँ लिखीं.`,
      said ? `उन्होंने कहा: ${said}` : "",
      next ? `अगली बार ${next} को मिलना है.` : "",
    ]
      .filter(Boolean)
      .join(" ");
  }
  return [
    `${who}${when ? ` on ${when}` : ""} wrote ${p.meds.length} ${p.meds.length === 1 ? "medicine" : "medicines"}.`,
    said ? `The advice was: ${said}` : "",
    next ? `Your next visit is ${next}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

/** The nearest follow-up visit today or tomorrow, if any. */
export function visitSoon(list: Prescription[], now = new Date()) {
  return list.find((p) => {
    const n = daysUntil(p.followUp, now);
    return n === 0 || n === 1;
  });
}
