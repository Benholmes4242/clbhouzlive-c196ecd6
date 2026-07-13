/**
 * Fixed glass veil spanning the island band (safe-area + 62px island row).
 * Sits above scrolling content, below the floating islands. Non-interactive.
 *
 * Optional `visible` prop (default true) fades the plate in/out. Used by pages
 * that open with a cinematic hero (e.g. Courses) where a permanent plate would
 * wash the hero at scroll-top. Existing callers omit the prop and are unaffected.
 *
 * Perf note: blur is limited to this thin fixed band. Do NOT add will-change
 * or transforms. If older Android WebViews jank, downgrade to opaque:
 *   background: '#F8FAFC'; remove both backdrop-filter declarations.
 */
export function GlassHeaderPlate({ visible = true }: { visible?: boolean }) {
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 'calc(env(safe-area-inset-top, 0px) + 62px)',
        background: 'rgba(248,250,252,0.72)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        zIndex: 11,
        pointerEvents: 'none',
        opacity: visible ? 1 : 0,
        transition: 'opacity 180ms ease-out',
      }}
    />
  );
}

export default GlassHeaderPlate;
