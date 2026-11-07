/** Shared overview/tournament photo material. Opt-in notch height preserves
 * overview carousel sizing; bottom-anchored content never moves within a band. */
export function photoBandHeight(heightPx: number, includeSafeArea = false): number | string {
  return includeSafeArea ? `calc(${heightPx}px + var(--sat, 0px))` : heightPx;
}

/** The five fade stops, built in any canvas colour so a hero on another
 * background still ends seamlessly. Hex only; anything else falls back to the
 * token so a bad value can never paint a wrong-colour foot. */
export function photoBandFade(canvas: string): string {
  const m = /^#([0-9a-fA-F]{6})$/.exec(canvas.trim());
  if (!m) return 'var(--th-overview-photo-fade)';
  const r = parseInt(m[1].slice(0, 2), 16);
  const g = parseInt(m[1].slice(2, 4), 16);
  const b = parseInt(m[1].slice(4, 6), 16);
  const c = (a: number) => `rgba(${r},${g},${b},${a})`;
  return `linear-gradient(180deg, ${c(0.15)} 0%, ${c(0)} 20%, ${c(0.62)} 48%, ${c(0.97)} 88%, ${c(1)} 100%)`;
}

export function PhotoBandFade({ canvas }: { canvas?: string }) {
  return <div aria-hidden data-photo-band-fade style={{ position: 'absolute', inset: 0, background: canvas ? photoBandFade(canvas) : 'var(--th-overview-photo-fade)', pointerEvents: 'none' }} />;
}
