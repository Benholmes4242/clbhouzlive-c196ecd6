/**
 * StandingFigures - the three figures the Circle leaderboard leads with.
 *
 *   YOUR RANK   "#7"   sub "of 25"
 *   PERCENTILE  "12%"  sub "of your circle"
 *   TO CATCH    "1.4"  sub the name of the player above
 *
 * THE DENOMINATOR RULE: `totalActive` here is the SAME number the ranked rows
 * are numbered against (the active cohort), and `rank` is the member's index
 * in that same cohort. The two old sections disagreed (8th of 28 against 7th
 * of 25) because they derived from different cohorts. Never source either
 * figure from anywhere but buildLeaderboardCohorts.
 *
 * Renders NOTHING without a self row.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { CHART, CHART_FONT, LABEL_STYLE } from '../../charts';
import { firstName } from '@/lib/whs/utils/initials';
import type { FriendLeaderboardEntry } from '@/lib/whs/types';

interface Props {
  selfRow: FriendLeaderboardEntry | null;
  rowAbove: FriendLeaderboardEntry | null;
  rank: number | null;
  totalActive: number;
  percentileTop: number | null;
  viewMode?: 'owner' | 'friend';
  ownerFirstName?: string | null;
}

const FIGURE: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 700,
  lineHeight: 1,
  letterSpacing: '-0.045em',
  color: CHART.INK,
  fontVariantNumeric: 'tabular-nums lining-nums',
};

// Local LABEL: the shared chart token is 9/800; this surface is 7.5/700.
const LBL: React.CSSProperties = {
  ...LABEL_STYLE,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.16em',
};

const Figure: React.FC<{ label: string; value: string; sub?: string | null }> = ({
  label,
  value,
  sub,
}) => (
  <div style={{ minWidth: 0 }}>
    <div style={FIGURE}>{value}</div>
    <div style={{ ...LBL, marginTop: 6, color: CHART.MUTE }}>{label}</div>
    {sub && (
      <div
        style={{
          ...LBL,
          marginTop: 3,
          overflowWrap: 'anywhere',
        }}
      >
        {sub}
      </div>
    )}
  </div>
);


export const StandingFigures: React.FC<Props> = ({
  selfRow,
  rowAbove,
  rank,
  totalActive,
  percentileTop,
  viewMode = 'owner',
  ownerFirstName = null,
}) => {
  const { t } = useTranslation('common');

  if (!selfRow || rank == null) return null;

  const isFriend = viewMode === 'friend';
  const rankLabel = isFriend
    ? ownerFirstName
      ? t('handicap.circle.standing.rankOwned', { name: ownerFirstName })
      : t('handicap.circle.standing.rankOwnedUnknown')
    : t('handicap.circle.standing.rank');

  const gap =
    rowAbove &&
    selfRow.friend_handicap_index != null &&
    rowAbove.friend_handicap_index != null
      ? Math.abs(rowAbove.friend_handicap_index - selfRow.friend_handicap_index)
      : null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 12,
        padding: '16px 16px 14px',
        fontFamily: CHART_FONT,
      }}
    >
      <Figure
        label={rankLabel}
        value={`#${rank}`}
        sub={t('handicap.circle.standing.ofTotal', { count: totalActive })}
      />
      {percentileTop != null && (
        <Figure
          label={t('handicap.circle.standing.top')}
          value={`${percentileTop}%`}

          sub={
            isFriend
              ? t('handicap.circle.standing.ofCircleFriend')
              : t('handicap.circle.standing.ofCircleOwner')
          }
        />
      )}
      {gap != null && rowAbove && (
        <Figure
          label={t('handicap.circle.standing.toCatch')}
          value={gap.toFixed(1)}
          sub={firstName(rowAbove.friend_name)}
        />
      )}
    </div>
  );
};

export default StandingFigures;
