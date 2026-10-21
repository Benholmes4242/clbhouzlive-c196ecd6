/**
 * Pure helpers shared by FullscreenTopProgress and FullscreenVideoScrubber.
 * The owner-key pair lives here once so both files agree on which lane owner
 * belongs to the active slide.
 */

export function fractionFromX(clientX: number, left: number, width: number): number {
  if (!(width > 0)) return 0;
  const f = (clientX - left) / width;
  if (!Number.isFinite(f)) return 0;
  return Math.max(0, Math.min(1, f));
}

/** m:ss under an hour, h:mm:ss from an hour. Floored; negative/NaN → 0:00. */
export function formatClock(seconds: number): string {
  const s = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h >= 1 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

export function expectedOwnerKey(postId: string | undefined, mediaIdx: number): string | null {
  if (!postId) return null;
  return postId.includes(':') ? postId : `${postId}:${mediaIdx}`;
}

// Owner-key match: engine returns either bare postId or `${postId}:${idx}`.
export function ownerMatches(snapPostId: string | null | undefined, expected: string): boolean {
  if (!snapPostId) return false;
  if (snapPostId === expected) return true;
  // Legacy: engine stored bare id, expected is `${id}:0`.
  if (!snapPostId.includes(':') && expected === `${snapPostId}:0`) return true;
  // Or engine stored `${id}:0`, expected is bare.
  if (!expected.includes(':') && snapPostId === `${expected}:0`) return true;
  return false;
}
