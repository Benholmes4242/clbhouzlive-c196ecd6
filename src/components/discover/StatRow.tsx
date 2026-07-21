/**
 * StatRow — canonical Discover leaderboard row.
 *
 * Single source of truth for the four Discover lists:
 *   • Latest Eagles
 *   • Latest Birdie Hauls
 *   • The Record Book
 *   • Moments of the game (aces / albatrosses)
 *
 * Layout:
 *   [rank 24px] [avatar 40px squircle] [name / subline flex] [stat right block]
 *
 * Consumers pass display-only props; scoring colours arrive via `statColor`
 * from the canonical token helpers (never hardcoded hex at the call site).
 */
import React from 'react';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';

const AMBER = '#F7931E';
const INK = '#0F172A';
const SLATE_400 = '#94A3B8';
const SLATE_500 = '#64748B';
const SLATE_200 = '#E2E8F0';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

function initials(name: string): string {
  return (
    (name || '?')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}

export interface StatRowProps {
  rank?: number;
  avatarUrl?: string | null;
  avatarUserId?: string | null;
  name: string;
  subline?: React.ReactNode;
  /** Right block primary value; when omitted the block is not rendered. */
  statValue?: React.ReactNode;
  statLabel?: string;
  statSubLabel?: string;
  /** Colour override for statValue; falls back to ink. */
  statColor?: string;
  /** When set, renders as a right-aligned timestamp instead of a stat block. */
  timestamp?: string;
  onPress?: () => void;
}

export function StatRow({
  rank,
  avatarUrl,
  avatarUserId,
  name,
  subline,
  statValue,
  statLabel,
  statSubLabel,
  statColor,
  timestamp,
  onPress,
}: StatRowProps) {
  const displayName = name || 'A member';
  const rankColor = rank === 1 ? AMBER : SLATE_400;

  return (
    <button
      type="button"
      onClick={onPress}
      className="text-left w-full active:bg-slate-50 transition-colors"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        minHeight: 64,
        padding: '10px 16px',
        background: 'transparent',
        border: 'none',
        cursor: onPress ? 'pointer' : 'default',
        fontFamily: FONT,
      }}
    >
      {typeof rank === 'number' ? (
        <div
          className="tabular-nums"
          style={{
            width: 24,
            flexShrink: 0,
            fontSize: 13,
            fontWeight: 600,
            color: rankColor,
            textAlign: 'center',
          }}
        >
          {rank}
        </div>
      ) : null}

      <div style={{ flexShrink: 0 }}>
        <SquircleAvatar
          size={40}
          srcCandidates={avatarUrl ? [avatarUrl] : []}
          alt={displayName}
          fallback={initials(displayName)}
          userId={avatarUserId ?? undefined}
          hairlineRing
          ringColor={LIGHT_HAIRLINE}
        />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: INK,
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {displayName}
        </div>
        {subline ? (
          <div
            style={{
              marginTop: 2,
              fontSize: 13,
              fontWeight: 500,
              color: SLATE_500,
              lineHeight: 1.25,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {subline}
          </div>
        ) : null}
      </div>

      {timestamp ? (
        <div
          style={{
            flexShrink: 0,
            fontSize: 13,
            color: SLATE_400,
            fontWeight: 500,
            whiteSpace: 'nowrap',
          }}
        >
          {timestamp}
        </div>
      ) : statValue != null ? (
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 3,
            minWidth: 44,
          }}
        >
          <div
            className="tabular-nums"
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: statColor ?? INK,
              lineHeight: 1,
            }}
          >
            {statValue}
          </div>
          {statLabel ? (
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: SLATE_400,
                lineHeight: 1,
              }}
            >
              {statLabel}
            </div>
          ) : null}
          {statSubLabel ? (
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: SLATE_400,
                lineHeight: 1,
              }}
            >
              {statSubLabel}
            </div>
          ) : null}
        </div>
      ) : null}
    </button>
  );
}

/**
 * StatList — white rounded card container with hairline dividers between rows.
 * Removes any alternating row background logic; rows are separated by a
 * single 1px slate-200 hairline.
 */
export function StatList({ children }: { children: React.ReactNode }) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <div
      style={{
        margin: '0 14px',
        background: '#FFFFFF',
        borderRadius: 18,
        overflow: 'hidden',
        border: `1px solid ${SLATE_200}`,
      }}
    >
      {items.map((child, i) => (
        <div
          key={i}
          style={{
            borderTop: i === 0 ? 'none' : `1px solid ${SLATE_200}`,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

/**
 * Small caption used above a StatList to label sub-groups (e.g. ACES /
 * ALBATROSSES within the Moments of the game section).
 */
export function StatListCaption({
  children,
  color,
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <div
      style={{
        margin: '14px 14px 8px',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: color ?? SLATE_400,
        lineHeight: 1,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Canonical helper: given a to-par delta, returns the display token colour.
 * Uses the shared score-colour helper so hex values never appear at call sites.
 */
export { getScoreColor as getStatToParColor } from '@/features/tourhub/_shared/scoreColor';
