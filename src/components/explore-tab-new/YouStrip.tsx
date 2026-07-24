import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { DISCOVER_YOU_STRIP } from '@/config/featureFlags';

/**
 * YouStrip — Discover "where you sit" affordance (G1 shell).
 *
 * Presentational only. Renders behind the `DISCOVER_YOU_STRIP` flag
 * (default OFF). No live data, no queries — mock props via `preview`.
 *
 * Anatomy mirrors StatRow:
 * - 64px min-height row on canvas #F8FAFC
 * - 16px horizontal padding, 12px gap
 * - 40px squircle avatar (canonical hairline ring inherited from SquircleAvatar)
 * - Bottom hairline #E2E8F0 unless `isLast`
 * - `variant="onList"` paints a 6% amber wash + 1px 24% amber top-accent
 * - `variant="offList"` shows a muted delta sub-label ("N shots to Top 100")
 * - `variant="empty"` renders the auth-gated / no-data line
 */

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const INK = '#0F172A';
const SLATE_400 = '#94A3B8';
const SLATE_500 = '#64748B';
const HAIRLINE = '#E2E8F0';
const AMBER = '#F7931E';
const AMBER_TOP = 'rgba(247,147,30,0.24)';
const AMBER_WASH = 'rgba(247,147,30,0.06)';

export type YouStripVariant = 'onList' | 'offList' | 'empty';

export interface YouStripPreview {
  variant: YouStripVariant;
  avatarUrl?: string | null;
  name?: string;
  rank?: number | null;
  statValue?: string;
  statLabel?: string;
  /** e.g. "1 shot to Top 100" or "+2 vs last week" — offList only */
  delta?: string;
  emptyMessage?: string;
  isLast?: boolean;
  onPress?: () => void;
}

function initials(name?: string): string {
  return (
    (name ?? '?')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}

interface Props {
  preview?: YouStripPreview;
}

export function YouStrip({ preview }: Props) {
  if (!DISCOVER_YOU_STRIP) return null;
  if (!preview) return null;

  const isOnList = preview.variant === 'onList';
  const isEmpty = preview.variant === 'empty';
  const isLast = !!preview.isLast;

  const borderBottom = isLast ? 'none' : `1px solid ${HAIRLINE}`;
  const borderTop = isOnList ? `1px solid ${AMBER_TOP}` : 'none';
  const background = isOnList ? AMBER_WASH : 'transparent';

  return (
    <button
      type="button"
      onClick={preview.onPress}
      style={{
        width: '100%',
        minHeight: 56,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 16px',
        background,
        borderTop,
        borderBottom,
        borderLeft: 'none',
        borderRight: 'none',
        textAlign: 'left',
        fontFamily: FONT,
        color: INK,
        cursor: preview.onPress ? 'pointer' : 'default',
      }}
    >
      {isEmpty ? (
        <div
          style={{
            flex: 1,
            fontSize: 12.5,
            fontWeight: 600,
            color: SLATE_500,
          }}
        >
          {preview.emptyMessage ?? 'Sign in to see where you sit'}
        </div>
      ) : (
        <>
          {/* rank cell */}
          <div
            className="tabular-nums"
            style={{
              width: 28,
              flexShrink: 0,
              textAlign: 'center',
              fontSize: 13,
              fontWeight: 700,
              color: isOnList ? AMBER : SLATE_400,
              lineHeight: 1,
            }}
          >
            {preview.rank ? preview.rank : '—'}
          </div>

          <SquircleAvatar
            src={preview.avatarUrl ?? null}
            fallback={initials(preview.name)}
            size={34}
          />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 14.5,
                fontWeight: 700,
                color: INK,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {preview.name ?? 'You'}
            </div>
            {!isOnList && preview.delta ? (
              <div
                style={{
                  marginTop: 2,
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: SLATE_500,
                }}
              >
                {preview.delta}
              </div>
            ) : null}
          </div>

          {preview.statValue ? (
            <div style={{ textAlign: 'right' }}>
              <div
                className="tabular-nums"
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: INK,
                  lineHeight: 1,
                }}
              >
                {preview.statValue}
              </div>
              {preview.statLabel ? (
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 9.5,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: SLATE_400,
                  }}
                >
                  {preview.statLabel}
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </button>
  );
}

export default YouStrip;
