/**
 * Tap disambiguator — single vs double tap on the same surface.
 *
 * On first tap, starts a 250ms timer:
 *  - if it elapses uninterrupted -> fires `onSingle`
 *  - if a second tap lands within the window -> cancels the timer, fires `onDouble`
 *
 * Both single and double are treated as click-equivalent gestures; the caller is
 * responsible for stopPropagation/preventDefault inside the handlers if needed.
 */
export const DOUBLE_TAP_WINDOW_MS = 250;

export function createTapHandler(opts: {
  onSingle: (e: React.MouseEvent) => void;
  onDouble: (e: React.MouseEvent) => void;
  windowMs?: number;
}) {
  const windowMs = opts.windowMs ?? DOUBLE_TAP_WINDOW_MS;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pendingEvent: React.MouseEvent | null = null;

  return (e: React.MouseEvent) => {
    // React pools events — persist so we can reference asynchronously.
    (e as any).persist?.();
    if (timer != null) {
      clearTimeout(timer);
      timer = null;
      pendingEvent = null;
      opts.onDouble(e);
      return;
    }
    pendingEvent = e;
    timer = setTimeout(() => {
      timer = null;
      const captured = pendingEvent;
      pendingEvent = null;
      if (captured) opts.onSingle(captured);
    }, windowMs);
  };
}
