/**
 * TourPageShell — the ONE header for EVERY Tour surface.
 *
 * BRIEF_TOUR_FIXED_HEADER S3. Same construction as the Discover header:
 * background A.CANVAS, a 42px control row, a 1px A.BORDER base. The control row
 * carries what the chrome island carried — the back control, the tour picker
 * where it applies (leftAccessory) and the side menu (right). NO TAB STRIP:
 * tabs belong to Discover.
 *
 * WHO PAYS THE SAFE AREA (S3.5). Nobody here. Tour routes are no longer in
 * IMMERSIVE_ROUTE_PREFIXES, so `.app-shell` pays var(--sat) once for the whole
 * page. This header therefore adds NO inset of its own — it would double it.
 * It is `position: sticky` in normal flow and locks at `top: var(--sat)`, i.e.
 * directly beneath the opaque #safe-area-shield, so scrolled content never
 * appears in the notch.
 *
 * The former `immersive` mode (fixed + transparent over a bleeding hero) is
 * GONE: no photograph runs to physical y=0 on any Tour surface. The prop is
 * accepted and ignored so existing callers keep compiling.
 *
 * Sticky rows inside `children` lock to `var(--tour-header-h)`, which this
 * shell measures and publishes.
 */
import { ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { useSetChromeSuppressed } from '@/features/chrome-v2/leftOverride';
import { safeGoBack } from '@/utils/navigation';

const SF_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

interface Props {
  title: string;
  /** Optional second line under the title (e.g. venue, city). */
  subtitle?: string;
  children: ReactNode;
  /** Right-aligned slot (menu button, actions). */
  right?: ReactNode;
  /**
   * Rendered immediately after the back chevron. The tour tabs put their tour
   * picker trigger here (BRIEF_TOUR_HEADER_ONE_ROW): this shell suppresses the
   * global ChromeIsland, so the island's left capsule is NOT on screen here and
   * the picker has to live in the shell's own left group.
   */
  leftAccessory?: ReactNode;
  /** Rendered inside the header, below the title row (chips / search). */
  belowTitle?: ReactNode;
  /** Overrides history back. */
  onBack?: () => void;
  /** safeGoBack fallback when there is no history to return to. */
  backFallback?: string;
  /**
   * The Tour Hub overview is a bottom-nav destination, so it carries NO back
   * control regardless of how the member arrived. Everything else does.
   */
  showBack?: boolean;
  /** DEPRECATED (BRIEF_TOUR_FIXED_HEADER S4): there is no bleeding hero to
   *  float over any more. Accepted and ignored. */
  immersive?: boolean;
  /** Page background. Defaults to the analytical canvas. */
  background?: string;
}

export function TourPageShell({
  title,
  subtitle,
  children,
  right,
  leftAccessory,
  belowTitle,
  onBack,
  backFallback = '/tourhub',
  showBack = true,
  immersive: _immersiveIgnored = false,
  background = A.CANVAS,
}: Props) {
  const navigate = useNavigate();
  const headerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // One chrome only: the global island stands down while this shell is mounted.
  useSetChromeSuppressed(true);

  const handleBack = useCallback(() => {
    if (onBack) onBack();
    else safeGoBack(navigate, backFallback);
  }, [onBack, navigate, backFallback]);

  // Publish the measured header height so sticky rows inside children can lock
  // directly beneath it instead of guessing at safe-area + island math.
  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    // Published on <html> (not the shell root) so page code that reads it via
    // getComputedStyle(document.documentElement) — e.g. the schedule anchor
    // scroll offset — sees the same number the CSS does.
    const publish = () => {
      document.documentElement.style.setProperty(
        '--tour-header-h',
        `${Math.round(el.getBoundingClientRect().height)}px`,
      );
    };
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => {
      ro.disconnect();
      document.documentElement.style.removeProperty('--tour-header-h');
    };
  }, [belowTitle, subtitle]);


  return (
    <div
      ref={rootRef}
      style={{ background, minHeight: '100vh', fontFamily: SF_STACK, position: 'relative' }}
    >
      <div
        ref={headerRef}
        style={{
          position: 'sticky',
          /* Locks beneath the opaque safe-area shield, which is what covers the
             notch on a non-immersive route. NOT a safe-area payment — the shell
             already made that once (S3.5). */
          top: 'var(--sat, env(safe-area-inset-top, 0px))',
          left: 0,
          right: 0,
          zIndex: 60,
          background,
          borderBottom: `1px solid ${A.BORDER}`,
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{
            /* Discover's control row: 42px tall, 12px gutter, no inset. */
            height: 42,
            paddingLeft: 12,
            paddingRight: 12,
            boxSizing: 'border-box',
          }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {showBack && (
              <button
                onClick={handleBack}
                aria-label="Back"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: A.PANEL,
                  border: `1px solid ${A.BORDER}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  cursor: 'pointer',
                }}
              >
                <ChevronLeft size={18} strokeWidth={2.5} style={{ color: A.INK }} />
              </button>
            )}
            {/* Titles were removed platform-wide: the back chevron is the only
                identity the tour headers carry. `title` / `subtitle` remain in
                the props for a11y labelling only. */}
            {leftAccessory}

          </div>
          {right}
        </div>
        {belowTitle}
      </div>

      {children}
    </div>
  );
}

export default TourPageShell;
