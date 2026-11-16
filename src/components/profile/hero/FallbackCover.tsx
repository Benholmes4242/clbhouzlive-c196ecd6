/** Shared no-photo cover; consumers retain their own PhotoBandFade and identity layers. */
export const FALLBACK_COVER_GRADIENT = 'var(--profile-fallback-cover-gradient)';
export function FallbackCover() {
  return <div aria-hidden data-fallback-cover style={{ position: 'absolute', inset: 0, background: FALLBACK_COVER_GRADIENT }} />;
}
export default FallbackCover;