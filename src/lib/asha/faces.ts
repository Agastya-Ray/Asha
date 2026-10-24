// Photos of loved ones for the call buttons on Today, kept on the phone in IndexedDB (localStorage is too small).
import { useEffect, useState } from "react";

const DB = "asha-faces";
const STORE = "faces";
const cache = new Map<string, string>();

function db(): Promise<IDBDatabase> {
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
): Promise<T> {
  const d = await db();
  return new Promise((resolve, reject) => {
    const req = fn(d.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function putFace(id: string, dataUrl: string) {
  cache.set(id, dataUrl);
  try {
    await run("readwrite", (s) => s.put(dataUrl, id));
  } catch {
    /* kept in memory for this session */
  }
}

export async function deleteFace(id: string) {
  cache.delete(id);
  try {
    await run("readwrite", (s) => s.delete(id));
  } catch {
    /* nothing to remove */
  }
}

export function useFace(id: string, photoAt: number | undefined) {
  const [url, setUrl] = useState<string | null>(cache.get(id) ?? null);
  useEffect(() => {
    let live = true;
    if (!photoAt) {
      setUrl(null);
      return;
    }
    if (cache.has(id)) {
      setUrl(cache.get(id) ?? null);
      return;
    }
    void run("readonly", (s) => s.get(id))
      .then((v) => {
        if (typeof v === "string") cache.set(id, v);
        if (live) setUrl(typeof v === "string" ? v : null);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [id, photoAt]);
  return url;
}

/** A face photo, cropped square and small (about 25 KB). */
export async function faceToJpeg(file: Blob, size = 360) {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    size,
    size,
  );
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.8);
}
