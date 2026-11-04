/** Shared overview/tournament photo material. Opt-in notch height preserves
 * overview carousel sizing; bottom-anchored content never moves within a band. */
export function photoBandHeight(heightPx: number, includeSafeArea = false): number | string {
  return includeSafeArea ? `calc(${heightPx}px + var(--sat, 0px))` : heightPx;
}

export function PhotoBandFade() {
  return <div aria-hidden data-photo-band-fade style={{ position: 'absolute', inset: 0, background: 'var(--th-overview-photo-fade)', pointerEvents: 'none' }} />;
}