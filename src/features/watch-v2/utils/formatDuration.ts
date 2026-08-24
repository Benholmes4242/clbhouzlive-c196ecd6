export function formatDuration(seconds: number | null): string {
  if (!seconds) return '';
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (h >= 1) return `${h}:${pad(m)}:${pad(sec)}`;
  return `${m}:${pad(sec)}`;
}

/**
 * Remaining time for a playing video, floored to whole seconds.
 *
 * FLOORED, NOT ROUNDED, and clamped at 0: a video at 2.4s remaining reads
 * "0:02", and the badge never shows a negative or a phantom extra second at
 * the end. Returns null when either input is unusable, and the caller then
 * falls back to total length rather than rendering nothing.
 */
export function formatRemaining(
  durationSeconds: number | null | undefined,
  currentTime: number | null | undefined,
): string | null {
  const d = durationSeconds;
  const c = currentTime;
  if (d == null || c == null) return null;
  if (!Number.isFinite(d) || !Number.isFinite(c)) return null;
  if (d <= 0) return null;
  const remaining = Math.max(0, Math.floor(d - c));
  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const sec = remaining % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (h >= 1) return `${h}:${pad(m)}:${pad(sec)}`;
  return `${m}:${pad(sec)}`;
}
