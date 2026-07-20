/**
 * Draft persistence for admin sheets (Content page).
 * TEXT FIELDS ONLY - never persist File objects, Blob URLs or headshot binaries.
 *
 * Payload shape: { savedAt: <ms>, values: <Record<string, string|number|boolean|null>> }
 * Entries older than 24h are ignored by loadDraft (and evicted on access).
 * All localStorage access is wrapped in try/catch - failure means no persistence,
 * never a thrown error.
 */

const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24h
const DEBOUNCE_MS = 500;

const timers = new Map<string, ReturnType<typeof setTimeout>>();

type DraftPayload = { savedAt: number; values: Record<string, unknown> };

function safeGet(key: string): string | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, value);
  } catch {
    /* private mode / quota - ignore */
  }
}

function safeRemove(key: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Debounced save (500ms per key). */
export function saveDraft(key: string, values: Record<string, unknown>): void {
  const existing = timers.get(key);
  if (existing) clearTimeout(existing);
  const t = setTimeout(() => {
    timers.delete(key);
    const payload: DraftPayload = { savedAt: Date.now(), values };
    try {
      safeSet(key, JSON.stringify(payload));
    } catch {
      /* ignore serialisation failures */
    }
  }, DEBOUNCE_MS);
  timers.set(key, t);
}

/** Immediate load - returns null if missing, malformed, or expired. */
export function loadDraft(key: string): Record<string, unknown> | null {
  const raw = safeGet(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DraftPayload;
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof parsed.savedAt !== 'number' ||
      !parsed.values ||
      typeof parsed.values !== 'object'
    ) {
      safeRemove(key);
      return null;
    }
    if (Date.now() - parsed.savedAt > MAX_AGE_MS) {
      safeRemove(key);
      return null;
    }
    return parsed.values;
  } catch {
    safeRemove(key);
    return null;
  }
}

/** Clear a draft and cancel any pending debounced save for that key. */
export function clearDraft(key: string): void {
  const existing = timers.get(key);
  if (existing) {
    clearTimeout(existing);
    timers.delete(key);
  }
  safeRemove(key);
}

/** Key builders - keep names consistent across sheets. */
export const draftKeys = {
  course: (id: string) => `admin-draft:course:${id}`,
  courseNew: () => 'admin-draft:course-new',
  player: (id: string) => `admin-draft:player:${id}`,
};

/** Shallow equality on string-serialisable records. */
export function draftsEqual(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    const av = a[k];
    const bv = b[k];
    if (av === bv) continue;
    // Treat '' and null and undefined as equivalent (record vs form quirks).
    const aEmpty = av === '' || av == null;
    const bEmpty = bv === '' || bv == null;
    if (aEmpty && bEmpty) continue;
    if (typeof av === 'number' || typeof bv === 'number') {
      if (String(av) === String(bv)) continue;
    }
    return false;
  }
  return true;
}
