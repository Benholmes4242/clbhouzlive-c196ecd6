import { ReactNode } from 'react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getInitialsFromName } from '@/lib/avatarFallback';
import TrophyIcon from '@/components/icons/TrophyIcon';

/**
 * StatRow — canonical Discover-tab leaderboard row.
 *
 * Flat row on canvas #F8FAFC, no card / no zebra / no shadow.
 * Used by: Eagles ledger, Birdie hauls ledger, The Record Book, Moments of the game,
 * and the TierSeeAllSheet.
 */

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const INK = '#0F172A';
const SLATE_400 = '#94A3B8';
const SLATE_500 = '#64748B';
const HAIRLINE = '#E2E8F0';
const AMBER = '#F7931E';
const BRONZE = '#B45309';
const SLATE_200 = '#E2E8F0';
const SLATE_600 = '#475569';

export interface StatRowChip {
  label: string;
  tone?: 'ace' | 'albatross' | 'default';
}

export interface StatRowProps {
  rank?: number;
  avatarUrl?: string | null;
  avatarUserId?: string | null;
  name: string;
  /** Small muted meta shown on the name line (e.g. relative age). */
  nameMeta?: ReactNode;
  subline?: ReactNode;
  /** Optional chip strip rendered beneath the subline (feat chips). */
  featChips?: ReactNode;
  /** Optional third text line beneath the subline (e.g. hole context). */
  metaLine?: ReactNode;

  statValue?: ReactNode;
  statLabel?: string;
  statSubLabel?: string;
  statColor?: string;
  chip?: StatRowChip;
  timestamp?: string;
  showWatermark?: boolean;
  isLast?: boolean;
  onPress?: () => void;
  /**
   * Row density. 'default' preserves legacy sizing for the 14 existing
   * consumers. 'compact' is the canonical Discover + Champions density:
   * 56 min-height, 8x16 padding, 34 avatar, 14.5/12.5 text, 17/9.5 stat.
   */
  density?: 'default' | 'compact';
}


function RankCell({ rank }: { rank: number }) {
  if (rank < 1) return <div style={{ width: 28, flexShrink: 0 }} />;
  if (rank > 3) {
    return (
      <div
        className="tabular-nums"
        style={{
          width: 28,
          flexShrink: 0,
          textAlign: 'center',
          fontSize: 13,
          fontWeight: 600,
          color: SLATE_400,
          lineHeight: 1,
        }}
      >
        {rank}
      </div>
    );
  }
  const styles: Record<number, { bg: string; fg: string }> = {
    1: { bg: 'rgba(247,147,30,0.12)', fg: AMBER },
    2: { bg: SLATE_200, fg: SLATE_600 },
    3: { bg: 'rgba(180,83,9,0.12)', fg: BRONZE },
  };
  const { bg, fg } = styles[rank];
  return (
    <div
      style={{
        width: 28,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className="tabular-nums"
        style={{
          width: 24,
          height: 24,
          borderRadius: 999,
          background: bg,
          color: fg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        {rank}
      </div>
    </div>
  );
}

function Chip({ chip }: { chip: StatRowChip }) {
  const tone = chip.tone ?? 'default';
  const styles: Record<string, { bg: string; fg: string }> = {
    ace: { bg: 'rgba(247,147,30,0.12)', fg: BRONZE },
    albatross: { bg: 'rgba(247,147,30,0.16)', fg: BRONZE },
    default: { bg: 'rgba(15,23,42,0.06)', fg: INK },
  };
  const { bg, fg } = styles[tone];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 8px',
        borderRadius: 999,
        background: bg,
        color: fg,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        lineHeight: 1,
      }}
    >
      {chip.label}
    </span>
  );
}

export function StatRow({
  rank,
  avatarUrl,
  avatarUserId,
  name,
  nameMeta,
  subline,
  featChips,
  metaLine,

  statValue,
  statLabel,
  statSubLabel,
  statColor,
  chip,
  timestamp,
  showWatermark = false,
  isLast = false,
  onPress,
  density = 'default',
}: StatRowProps) {
  const hasStat = statValue != null && statValue !== '';
  const rightTimestamp = !hasStat && !chip && timestamp;

  const compact = density === 'compact';
  const rowMinHeight = compact ? 56 : 64;
  const rowPadding = compact ? '8px 16px' : '10px 16px';
  const rowGap = compact ? 10 : 12;
  const avatarSize = compact ? 34 : 40;
  const nameSize = compact ? 14.5 : 15;
  const sublineSize = compact ? 12.5 : 13;
  const statValueSize = compact ? 17 : 20;
  const statLabelSize = compact ? 9.5 : 10;

  return (
    <button
      type="button"
      onClick={onPress}
      className="w-full text-left active:bg-slate-50 transition-colors"
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: rowGap,
        width: '100%',
        minHeight: rowMinHeight,
        padding: rowPadding,
        background: 'transparent',
        border: 'none',
        borderBottom: isLast ? 'none' : `1px solid ${HAIRLINE}`,
        cursor: onPress ? 'pointer' : 'default',
        fontFamily: FONT,
        overflow: 'hidden',
      }}
    >
      {showWatermark ? (
        <TrophyIcon
          aria-hidden
          style={{
            position: 'absolute',
            right: -8,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 72,
            height: 72,
            opacity: 0.06,
            color: INK,
            pointerEvents: 'none',
          }}
        />
      ) : null}

      {typeof rank === 'number' ? <RankCell rank={rank} /> : null}

      <div style={{ flexShrink: 0 }}>
        <SquircleAvatar
          size={avatarSize}
          srcCandidates={avatarUrl ? [avatarUrl] : []}
          alt={name}
          fallback={getInitialsFromName(name)}
          userId={avatarUserId ?? undefined}
          hairlineRing
        />
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
          <div
            style={{
              fontSize: nameSize,
              fontWeight: 600,
              color: INK,
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
              flex: '0 1 auto',
            }}
          >
            {name}
          </div>
          {nameMeta ? (
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: SLATE_400,
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {nameMeta}
            </div>
          ) : null}
        </div>
        {subline ? (
          <div
            style={{
              fontSize: sublineSize,
              fontWeight: 500,
              color: SLATE_500,
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {subline}
          </div>
        ) : null}
        {featChips ? (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 6,
              marginTop: 2,
            }}
          >
            {featChips}
          </div>
        ) : null}
        {metaLine ?? null}
      </div>


      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: chip ? 'center' : 'center',
          flexDirection: chip ? 'column' : 'row',
          gap: chip ? 4 : 8,
          position: 'relative',
        }}
      >
        {(chip || rightTimestamp) && timestamp ? (
          <span
            style={{
              fontSize: sublineSize,
              fontWeight: 500,
              color: SLATE_400,
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
            }}
          >
            {timestamp}
          </span>
        ) : null}
        {chip ? <Chip chip={chip} /> : null}
        {hasStat ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 2,
            }}
          >
            <div
              className="tabular-nums"
              style={{
                fontSize: statValueSize,
                fontWeight: 700,
                lineHeight: 1,
                color: statColor ?? INK,
                letterSpacing: '-0.01em',
              }}
            >
              {statValue}
            </div>
            {statLabel ? (
              <div
                style={{
                  fontSize: statLabelSize,
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
                  fontSize: statLabelSize,
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
      </div>
    </button>
  );
}

export default StatRow;
