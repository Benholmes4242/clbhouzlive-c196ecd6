/** Rendered line count of a title: height ÷ computed line-height. Own module so tests can stub layout. */
export function measureTitleLines(el: HTMLElement): number {
  const cs = getComputedStyle(el);
  let lh = parseFloat(cs.lineHeight);
  if (!Number.isFinite(lh)) lh = parseFloat(cs.fontSize) * 1.2;
  const h = el.getBoundingClientRect().height;
  if (!lh || !h) return 1;
  return Math.max(1, Math.round(h / lh));
}
