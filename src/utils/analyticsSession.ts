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
 *
 * KNOWN AND ACCEPTED: the id now survives logout, so on a shared device a
 * second member's first 30 minutes carry the previous session id. user_id is
 * on every row, so nothing is misattributed to the wrong person - only the
 * session boundary is wrong. Deliberately NOT cleared on logout.
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
 * SESSIONS ARE SESSIONS. session_start fires exactly when an id is minted,
 * never on App mount. The listener is registered by analyticsEvents; a mint
 * that happens before it registers is held and delivered on registration.
 */
type MintListener = (id: string) => void;
let mintListener: MintListener | null = null;
let pendingMint: string | null = null;

export function onSessionMinted(fn: MintListener): void {
  mintListener = fn;
  if (pendingMint) {
    const id = pendingMint;
    pendingMint = null;
    fn(id);
  }
}

/**
 * Current session id, minting a new one when the last activity was more than
 * 30 minutes ago. `minted` is true exactly when this call created the id.
 * Never throws.
 */
export function getSessionInfo(): { id: string; minted: boolean } {
  const now = Date.now();
  let id = safeLocalStorage.get(ID_KEY);
  const seenRaw = safeLocalStorage.get(SEEN_KEY);
  const seen = seenRaw ? Number(seenRaw) : 0;
  let minted = false;

  if (!id || !Number.isFinite(seen) || seen <= 0 || now - seen > TIMEOUT_MS) {
    id = mint();
    minted = true;
    safeLocalStorage.set(ID_KEY, id);
  }
  safeLocalStorage.set(SEEN_KEY, String(now));
  if (minted) {
    if (mintListener) {
      try { mintListener(id); } catch { /* analytics never throws */ }
    } else {
      pendingMint = id;
    }
  }
  return { id, minted };
}

export function getSessionId(): string {
  return getSessionInfo().id;
}

/**
 * THE user agent accessor for analytics props. One definition, because the
 * server-side bot filters read `ua ILIKE ...` and a NULL ua makes the whole
 * predicate NULL — `NOT NULL` is NULL, so an unlabelled row is silently
 * dropped from WAU, MAU, cohorts and the funnel. Every emitter must stamp it.
 *
 * Never throws and never returns undefined: a missing navigator yields ''.
 */
export function getUserAgent(): string {
  try {
    if (typeof navigator === 'undefined' || !navigator) return '';
    return (navigator.userAgent || '').slice(0, 200);
  } catch {
    return '';
  }
}
