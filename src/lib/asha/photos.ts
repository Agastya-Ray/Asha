// Photos of each medicine (the strip or tablet the person really has), kept on the phone in IndexedDB.
// localStorage is too small and is rewritten on every change, so only a timestamp (Med.photoAt) lives there.
import { useEffect, useState } from "react";
import { AshaNative, isNative } from "@/lib/asha/native";

const DB = "asha-photos";
const STORE = "meds";

function db(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const d = await db();
  return new Promise((resolve, reject) => {
    const req = fn(d.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

const cache = new Map<string, string>();

export async function getPhoto(medId: string): Promise<string | null> {
  if (cache.has(medId)) return cache.get(medId) ?? null;
  try {
    const v = (await run("readonly", (s) => s.get(medId))) as string | undefined;
    if (v) cache.set(medId, v);
    return v ?? null;
  } catch {
    return null;
  }
}

/** Saves a JPEG data URL. On Android a copy goes to the app's files too, so the reminder notification can show it. */
export async function putPhoto(medId: string, dataUrl: string) {
  cache.set(medId, dataUrl);
  try {
    await run("readwrite", (s) => s.put(dataUrl, medId));
  } catch {
    /* kept in memory for this session */
  }
  if (isNative) await AshaNative.savePhoto({ id: medId, data: dataUrl.split(",")[1] ?? "" }).catch(() => undefined);
}

export async function deletePhoto(medId: string) {
  cache.delete(medId);
  try {
    await run("readwrite", (s) => s.delete(medId));
  } catch {
    /* nothing to remove */
  }
  if (isNative) await AshaNative.savePhoto({ id: medId, data: "" }).catch(() => undefined);
}

/** The photo for a medicine, or null. `photoAt` changes when a new photo is saved. */
export function usePhoto(medId: string | undefined, photoAt: number | undefined) {
  const [url, setUrl] = useState<string | null>(medId ? (cache.get(medId) ?? null) : null);
  useEffect(() => {
    let live = true;
    if (!medId || !photoAt) {
      setUrl(null);
      return;
    }
    void getPhoto(medId).then((v) => live && setUrl(v));
    return () => {
      live = false;
    };
  }, [medId, photoAt]);
  return url;
}

/** A phone photo shrunk to a size that is sharp on screen but small to keep (about 60 KB). */
export async function photoToJpeg(file: Blob, max = 900) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.75);
}
