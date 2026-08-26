/**
 * TourPageShell — the ONE header + safe-area owner for every Tour surface
 * except the Tour Overview.
 *
 * Geometry is the Activity page's (ManagePageShell): opaque canvas band that
 * owns the safe-area inset, 32px circle back chevron, 18/600 title, 1px
 * hairline base. Two modes:
 *
 *   default   — the header is `sticky top: 0` and sits in normal flow, so page
 *               content starts BELOW it (schedule / players / leaders /
 *               college hub / compare).
 *   immersive — hero pages (tournament, player, college profile). The header is
 *               `position: fixed`, transparent over the hero at rest, and picks
 *               up the opaque canvas + hairline the moment the member scrolls.
 *
 * The global ChromeIsland is suppressed for the shell's lifetime, so there is
 * exactly one top chrome on screen. Sticky rows inside `children` must lock to
 * `var(--tour-header-h)`, which this shell measures and publishes.
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
  /** Rendered inside the header, below the title row (chips / search). */
  belowTitle?: ReactNode;
  /** Overrides history back. */
  onBack?: () => void;
  /** safeGoBack fallback when there is no history to return to. */
  backFallback?: string;
  /** Hero pages: header floats over the hero and solidifies on scroll. */
  immersive?: boolean;
  /** Page background. Defaults to the analytical canvas. */
  background?: string;
}

export function TourPageShell({
  title,
  subtitle,
  children,
  right,
  belowTitle,
  onBack,
  backFallback = '/tourhub',
  immersive = false,
  background = A.CANVAS,
}: Props) {
  const navigate = useNavigate();
  const headerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

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
    const root = rootRef.current;
    if (!el || !root) return;
    const publish = () => {
      root.style.setProperty('--tour-header-h', `${Math.round(el.getBoundingClientRect().height)}px`);
    };
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => ro.disconnect();
  }, [belowTitle, subtitle]);

  // Immersive pages only: transparent -> opaque on first scroll.
  useEffect(() => {
    if (!immersive) return;
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [immersive]);

  const solid = !immersive || scrolled;

  return (
    <div
      ref={rootRef}
      style={{ background, minHeight: '100vh', fontFamily: SF_STACK, position: 'relative' }}
    >
      <div
        ref={headerRef}
        style={{
          position: immersive ? 'fixed' : 'sticky',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 60,
          background: solid ? background : 'transparent',
          borderBottom: solid ? `1px solid ${A.BORDER}` : '1px solid transparent',
          transition: 'background 160ms linear, border-color 160ms linear',
        }}
      >
        <div
          className="flex items-center justify-between px-4"
          style={{
            paddingTop: 'calc(var(--sat, env(safe-area-inset-top, 0px)) + 8px)',
            paddingBottom: belowTitle ? 8 : 12,
            minHeight: 'calc(var(--sat, env(safe-area-inset-top, 0px)) + 56px)',
            boxSizing: 'border-box',
          }}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={handleBack}
              aria-label="Back"
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: solid ? A.PANEL : 'rgba(0,0,0,0.38)',
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
            <div style={{ minWidth: 0 }}>
              <h1
                style={{
                  fontFamily: SF_STACK,
                  fontSize: 18,
                  fontWeight: 600,
                  color: A.INK,
                  letterSpacing: '-0.01em',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {title}
              </h1>
              {subtitle && (
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: A.MUTE,
                    marginTop: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {subtitle}
                </div>
              )}
            </div>
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
