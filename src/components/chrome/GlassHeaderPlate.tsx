/**
 * Fixed glass veil spanning the island band (safe-area + 62px island row).
 * Sits above scrolling content, below the floating islands. Non-interactive.
 *
 * Optional `visible` prop (default true). Visibility is a CONDITIONAL MOUNT,
 * not an opacity transition. WebKit mishandles opacity (especially transitioned
 * opacity) on the same element as backdrop-filter: the backdrop gets captured
 * into a stale snapshot layer instead of live-sampling, rendering as a flat
 * opaque band. Never re-add `opacity` or `transition` to this element.
 *
 * Safe-area source: `var(--sat, env(safe-area-inset-top, 0px))` so the plate
 * height and sticky rows below it (which read --sat) stay in lockstep.
 *
 * Perf note: blur is limited to this thin fixed band. Do NOT add will-change
 * or transforms. If older Android WebViews jank, downgrade to opaque:
 *   background: '#15171F'; remove both backdrop-filter declarations.
 */
export function GlassHeaderPlate({
  visible = true,
  heightPx = 1,
}: {
  visible?: boolean;
  /** Non-safe-area portion of the plate. Default 1px — the plate is now a
   *  NOTCH VEIL only; the page's single sticky row (chips/tabs) locks at
   *  var(--sat) and owns the rest of the stuck-header footprint. */
  heightPx?: number;
}) {
  if (!visible) return null;
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: `calc(var(--sat, env(safe-area-inset-top, 0px)) + ${heightPx}px)`,
         background: 'var(--glass-bg)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        zIndex: 11,
        pointerEvents: 'none',
      }}
    />
  );
}

export default GlassHeaderPlate;
