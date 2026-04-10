/**
 * Offline mutation queue.
 *
 * Wraps IndexedDB to persist POST/PUT/PATCH/DELETE requests that
 * failed because the device was offline. On reconnect, the queue
 * replays them in the order they were enqueued.
 *
 * Every queued request carries an Idempotency-Key header generated at
 * enqueue time, so even if the server already processed the request
 * (e.g. network acknowledged but the response was lost), the replay
 * is a no-op.
 *
 * Storage schema (db: "iffe-offline", store: "mutations"):
 *   key (auto): number
 *   value: {
 *     id: string                     // ULID, also used as Idempotency-Key
 *     path: string                   // "/api/v1/..."
 *     method: "POST"|"PUT"|"PATCH"|"DELETE"
 *     body: any
 *     headers: Record<string,string>
 *     enqueuedAt: number
 *     attempts: number
 *     lastError?: string
 *   }
 */

export type QueuedMutation = {
  id: string;
  path: string;
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  body: unknown;
  headers: Record<string, string>;
  enqueuedAt: number;
  attempts: number;
  lastError?: string;
  summary?: string;
};

const DB_NAME = "iffe-offline";
const STORE = "mutations";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("enqueuedAt", "enqueuedAt", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function newId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const base = btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
  return `oq-${Date.now().toString(36)}-${base.slice(0, 16)}`;
}

export async function enqueue(input: Omit<QueuedMutation, "id" | "enqueuedAt" | "attempts">): Promise<QueuedMutation> {
  const db = await openDb();
  const mutation: QueuedMutation = {
    id: newId(),
    ...input,
    enqueuedAt: Date.now(),
    attempts: 0,
    headers: {
      ...input.headers,
      "Idempotency-Key": input.headers["Idempotency-Key"] || newId(),
    },
  };
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(mutation);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  notifySubscribers();
  // Ask the SW to drain on the next online event if available.
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    try {
      // @ts-ignore - Background Sync is optional
      const reg = await navigator.serviceWorker.ready;
      if ("sync" in reg) {
        // @ts-ignore
        await reg.sync.register("drain-offline-queue");
      }
    } catch {
      // no-op
    }
  }
  return mutation;
}

export async function list(): Promise<QueuedMutation[]> {
  try {
    const db = await openDb();
    return await new Promise<QueuedMutation[]>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve((req.result as QueuedMutation[]).sort((a, b) => a.enqueuedAt - b.enqueuedAt));
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function count(): Promise<number> {
  const items = await list();
  return items.length;
}

async function remove(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function update(mutation: QueuedMutation): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(mutation);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Replay every queued mutation in order. Stops on the first network
 * failure (assumes still offline); keeps going past application errors
 * (4xx/5xx) so a single bad request doesn't block the queue forever —
 * those are removed and reported to the caller.
 *
 * Returns a summary of the replay pass.
 */
export async function drain(options: { onProgress?: (remaining: number) => void } = {}): Promise<{
  delivered: number;
  failedPermanent: number;
  stillQueued: number;
}> {
  const items = await list();
  let delivered = 0;
  let failedPermanent = 0;

  for (const m of items) {
    try {
      const res = await fetch(m.path, {
        method: m.method,
        credentials: "include",
        headers: { "Content-Type": "application/json", ...m.headers },
        body: m.body ? JSON.stringify(m.body) : undefined,
      });
      if (res.ok) {
        await remove(m.id);
        delivered += 1;
      } else if (res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429) {
        // Client error — won't succeed on replay. Drop it and report.
        await remove(m.id);
        failedPermanent += 1;
      } else {
        // Transient (5xx, 408, 429) — leave in place with an updated attempt count.
        await update({ ...m, attempts: m.attempts + 1, lastError: `HTTP ${res.status}` });
        break;
      }
    } catch (err) {
      // Network failure — abort the drain and let the next online event retry.
      await update({
        ...m,
        attempts: m.attempts + 1,
        lastError: err instanceof Error ? err.message : "network error",
      });
      break;
    }
    options.onProgress?.((await count()));
  }

  notifySubscribers();
  const stillQueued = await count();
  return { delivered, failedPermanent, stillQueued };
}

// ===== Tiny pub/sub so the OfflineBanner UI can reflect queue depth =====

type Subscriber = () => void;
const subscribers = new Set<Subscriber>();

export function subscribe(cb: Subscriber): () => void {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}

function notifySubscribers() {
  for (const cb of subscribers) cb();
}

/** Auto-drain the queue when the browser comes back online. */
export function installAutoDrain(): () => void {
  if (typeof window === "undefined") return () => undefined;
  const handler = () => {
    void drain();
  };
  window.addEventListener("online", handler);
  return () => window.removeEventListener("online", handler);
}
