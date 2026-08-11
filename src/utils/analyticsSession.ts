/**
 * THE session id accessor. One definition of "session" for the whole product.
 *
 * Previously the id lived in sessionStorage, which an iOS WebView clears on
 * background/resume - so every app reopen minted a new id and the metric
 * measured app opens, not sessions.
 *
 * Now: localStorage, with a 30 minute inactivity timeout. Reading the id is
 * also a heartbeat - it refreshes last-seen - so any call site keeps the
 * session alive exactly as a user action should.
 *
 * Every reader must come through getSessionId(). No copies of the timeout.
 */
import { safeLocalStorage } from './safeLocalStorage';

const ID_KEY = 'analytics_session_id';
const SEEN_KEY = 'analytics_session_last_seen';
const TIMEOUT_MS = 30 * 60 * 1000;

function mint(): string {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  } catch { /* fall through */ }
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Current session id, minting a new one when the last activity was more than
 * 30 minutes ago. Always returns a string; never throws.
 */
export function getSessionId(): string {
  const now = Date.now();
  let id = safeLocalStorage.get(ID_KEY);
  const seenRaw = safeLocalStorage.get(SEEN_KEY);
  const seen = seenRaw ? Number(seenRaw) : 0;

  if (!id || !Number.isFinite(seen) || seen <= 0 || now - seen > TIMEOUT_MS) {
    id = mint();
    safeLocalStorage.set(ID_KEY, id);
  }
  safeLocalStorage.set(SEEN_KEY, String(now));
  return id;
}
