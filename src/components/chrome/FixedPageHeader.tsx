import React from 'react';
import { A } from '@/features/courses/components/holes/analytical/tokens';

/**
 * FixedPageHeader — the Discover header's geometry, for pushed sub-pages.
 *
 * BRIEF_SETTINGS_HEADER_AND_HANDICAP_OVERFLOW S1.
 *
 * Same band as `DiscoverHeader`: it pays `env(safe-area-inset-top)` ITSELF,
 * carries a 42px control row, sits on A.CANVAS and closes with a 1px A.BORDER
 * edge. Difference: a BACK CONTROL on the left and the section name CENTRED
 * absolutely, so the title stays optically centred whatever flanks it. No tab
 * strip — tabs belong to Discover.
 *
 * WHY THE SPACER LIVES HERE (S1.4/S1.5). A fixed element is out of flow, so a
 * page that does not reserve its height renders underneath it. The reservation
 * is therefore NOT a margin guess at the call site: this component renders the
 * header AND the spacer, and the spacer's height is the header element's own
 * MEASURED height (ResizeObserver). Safe area, an optional `below` row and
 * font metrics are all included by construction, so the two cannot disagree.
 *
 * The CSS fallback (`--fixed-page-header-h`) covers the first paint, including
 * a COLD LAUNCH straight to the URL where main.tsx has already written the
 * immersive attribute before React mounts.
 */

export const FIXED_HEADER_ROW_H = 42;

/** First-paint fallback, replaced by the measured height on layout. */
export const FIXED_HEADER_H_CSS =
  `calc(env(safe-area-inset-top, 0px) + ${FIXED_HEADER_ROW_H + 1}px)`;

interface Props {
  title: string;
  onBack?: () => void;
  /** Optional right-aligned control (e.g. Save). */
  right?: React.ReactNode;
  /** Optional row rendered inside the header, below the control row. */
  below?: React.ReactNode;
  /** Hide the back control (e.g. a first-run screen with no history). */
  hideBack?: boolean;
  backLabel?: string;
}

export function FixedPageHeader({
  title,
  onBack,
  right,
  below,
  hideBack = false,
  backLabel = 'Back',
}: Props) {
  const ref = React.useRef<HTMLElement | null>(null);
  const [measured, setMeasured] = React.useState<number | null>(null);

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => setMeasured(el.getBoundingClientRect().height);
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    // Safe-area values can land after first paint on a cold launch.
    const t = window.setTimeout(read, 300);
    return () => {
      ro.disconnect();
      window.clearTimeout(t);
    };
  }, []);

  return (
    <>
      <header
        ref={ref}
        data-fixed-page-header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 60,
          background: A.CANVAS,
          borderBottom: `1px solid ${A.BORDER}`,
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        <div
          style={{
            position: 'relative',
            height: FIXED_HEADER_ROW_H,
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
          }}
        >
          {!hideBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label={backLabel}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                padding: 0,
                border: `1px solid ${A.BORDER}`,
                background: A.PANEL,
                color: A.INK,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M15 5l-7 7 7 7"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}

          {/* Absolutely centred so flanking controls cannot pull it off centre. */}
          <h1
            style={{
              position: 'absolute',
              left: 52,
              right: 52,
              top: 0,
              height: FIXED_HEADER_ROW_H,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: '-0.01em',
              color: A.INK,
              textAlign: 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              pointerEvents: 'none',
            }}
          >
            {title}
          </h1>

          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              minWidth: 0,
            }}
          >
            {right}
          </div>
        </div>
        {below}
      </header>

      {/* THE RESERVATION. Same element, measured height — never a guess. */}
      <div
        aria-hidden
        data-fixed-page-header-spacer
        style={{
          flexShrink: 0,
          height: measured != null ? `${measured}px` : FIXED_HEADER_H_CSS,
        }}
      />
    </>
  );
}

export default FixedPageHeader;
