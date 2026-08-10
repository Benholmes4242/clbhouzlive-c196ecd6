/**
 * footerTapProbe — on-device hit-test drift logger for the ReviewBottomSheet
 * footer (BRIEF_REVIEW_SHEET_PHOTOS_AND_FOOTER, D2).
 *
 * WHY NOT elementFromPoint: the Chromium probe that used it was tautological.
 * `getBoundingClientRect` and `elementFromPoint` are both answered from the
 * SAME layout pass, so the pair can only ever confirm that an element is where
 * layout says it is. Drift is by definition the case where the COMPOSITOR
 * disagrees with layout: the button paints at one place while the touch lands
 * somewhere else. Only the raw pointer coordinate — the number the OS gave us,
 * untouched by our layout read — can expose that.
 *
 * So this logs, per pointerdown on the footer:
 *   • the raw event.clientX/clientY
 *   • the intended button's rect (layout's answer)
 *   • the SIGNED delta from the pointer to that rect (0/0 = inside; a positive
 *     value on an axis = that many px outside that edge)
 *   • msSinceOpen — time from the sheet's open transition starting. If the
 *     mis-taps cluster inside the first ~300ms (the entry spring is damping 28 /
 *     stiffness 300, so it settles around there), the cause is the ENTRY
 *     ANIMATION transform, not the momentum scroller. A flat spread across
 *     later timestamps points back at -webkit-overflow-scrolling.
 *
 * FLAG-GATED, no cost when off. Enable on device from a Safari/Median console:
 *   localStorage.setItem('REVIEW_FOOTER_TAP_PROBE', '1')
 */

export function footerTapProbeEnabled(): boolean {
  try {
    return localStorage.getItem('REVIEW_FOOTER_TAP_PROBE') === '1';
  } catch {
    return false;
  }
}

export interface FooterTapProbeSample {
  /** Raw pointer coordinates as delivered by the OS/WebView. */
  pointer: { x: number; y: number };
  /** Which footer button the pointer was nominally aimed at, if any resolved. */
  target: string;
  /** Layout's answer for that button. */
  rect: { left: number; top: number; width: number; height: number };
  /**
   * Signed miss distance in px. 0 on an axis = the pointer is within the rect
   * on that axis. dx > 0 = that far outside the nearest horizontal edge (sign
   * indicates which: negative = left of the rect, positive = right).
   */
  delta: { dx: number; dy: number };
  inside: boolean;
  /** ms from sheet-open to this pointerdown. */
  msSinceOpen: number;
  pointerType: string;
  /** Node the browser attributed the event to — recorded, never used to judge. */
  eventTargetTag: string;
}

/** Signed horizontal/vertical distance from a point to a rect. 0 = inside. */
function signedDelta(x: number, y: number, r: DOMRect) {
  const dx = x < r.left ? x - r.left : x > r.right ? x - r.right : 0;
  const dy = y < r.top ? y - r.top : y > r.bottom ? y - r.bottom : 0;
  return { dx: Math.round(dx * 10) / 10, dy: Math.round(dy * 10) / 10 };
}

/**
 * Records one pointerdown against the footer's buttons. Picks the button whose
 * rect is nearest the raw pointer, then reports the delta to it — so a tap that
 * lands 6px below a button still attributes to that button and shows dy = 6.
 */
export function recordFooterTap(
  e: PointerEvent,
  footer: HTMLElement,
  openedAt: number,
): FooterTapProbeSample | null {
  const buttons = Array.from(footer.querySelectorAll('button'));
  if (buttons.length === 0) return null;

  const x = e.clientX;
  const y = e.clientY;

  let best: { btn: HTMLButtonElement; rect: DOMRect; d: { dx: number; dy: number } } | null = null;
  for (const btn of buttons as HTMLButtonElement[]) {
    const rect = btn.getBoundingClientRect();
    const d = signedDelta(x, y, rect);
    const dist = Math.hypot(d.dx, d.dy);
    if (!best || dist < Math.hypot(best.d.dx, best.d.dy)) best = { btn, rect, d };
  }
  if (!best) return null;

  const sample: FooterTapProbeSample = {
    pointer: { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 },
    target: (best.btn.textContent || '').trim().slice(0, 24),
    rect: {
      left: Math.round(best.rect.left),
      top: Math.round(best.rect.top),
      width: Math.round(best.rect.width),
      height: Math.round(best.rect.height),
    },
    delta: best.d,
    inside: best.d.dx === 0 && best.d.dy === 0,
    msSinceOpen: Math.round(performance.now() - openedAt),
    pointerType: e.pointerType || 'unknown',
    eventTargetTag:
      e.target instanceof Element ? e.target.tagName.toLowerCase() : 'unknown',
  };

  // eslint-disable-next-line no-console
  console.log(
    `[footer-tap] ${sample.inside ? 'INSIDE' : `MISS dx=${sample.delta.dx} dy=${sample.delta.dy}`} ` +
      `@${sample.msSinceOpen}ms pointer=(${sample.pointer.x},${sample.pointer.y}) ` +
      `rect=(${sample.rect.left},${sample.rect.top},${sample.rect.width}x${sample.rect.height}) ` +
      `target="${sample.target}" type=${sample.pointerType} on=${sample.eventTargetTag}`,
  );

  try {
    const w = window as any;
    (w.__footerTaps ||= []).push(sample);
  } catch {}

  return sample;
}
