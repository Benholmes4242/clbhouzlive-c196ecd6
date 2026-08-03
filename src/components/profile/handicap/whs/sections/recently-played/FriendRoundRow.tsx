/**
 * FriendRoundRow - a friend's posted round as a HOUSE ROW.
 *
 * Was a 280px photo card in a paged carousel. It is a row now: no card per
 * row, no rule between rows, fixed columns so the figures line up down the
 * column, and a single LABEL meta line.
 *
 * The two states that are REAL survive: the ENGLAND GOLF badge on rounds that
 * arrived from the governing body without a clbhouz account behind them, and
 * the INVITE / ASK TO SYNC action on unconnected friends. They are facts about
 * the friend, not decoration.
 */
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { displayName } from '@/lib/whs/utils/initials';
import { fmtAbsoluteDate } from '@/lib/whs/utils/nameFormat';
import { CHART, CHART_FONT, LABEL_STYLE } from '../../charts';
import type { WhsFriendActivityWithImage } from '@/lib/whs/types';

export type FriendRoundVariant = 'clbhouz-synced' | 'clbhouz-not-synced' | 'eg-only';

interface Props {
  activity: WhsFriendActivityWithImage;
  variant: FriendRoundVariant;
  onClick: () => void;
}

/** Fixed column widths - the figures must line up row to row. */
const COL_GROSS = 44;
const COL_STBL = 40;
const COL_DIFF = 48;

const Cell: React.FC<{ label: string; width: number; children: React.ReactNode }> = ({
  label,
  width,
  children,
}) => (
  <div style={{ width, flexShrink: 0, textAlign: 'right' }}>
    <div
      style={{
        fontSize: 15,
        fontWeight: 800,
        color: CHART.INK,
        letterSpacing: '-0.02em',
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums lining-nums',
      }}
    >
      {children}
    </div>
    <div style={{ ...LABEL_STYLE, marginTop: 5 }}>{label}</div>
  </div>
);

export const FriendRoundRow: React.FC<Props> = ({ activity, variant, onClick }) => {
  const isSynced = variant === 'clbhouz-synced';
  const gross = activity.last_round_adjusted_gross;
  const stableford = activity.last_round_stableford;
  const diff = activity.last_round_differential;
  const course = activity.last_round_course_name ?? 'Unknown course';
  const played = fmtAbsoluteDate(activity.last_round_played_at);

  const meta = [played, course, activity.is_counter ? 'Counts' : null]
    .filter(Boolean)
    .join(' \u00B7 ');

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '13px 16px',
        fontFamily: CHART_FONT,
        cursor: 'pointer',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: CHART.INK,
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {displayName(activity.friend_name)}
          </span>
          {variant === 'eg-only' && (
            <span style={{ ...LABEL_STYLE, color: CHART.MUTE, flexShrink: 0 }}>
              England Golf
            </span>
          )}
        </div>
        <div
          style={{
            ...LABEL_STYLE,
            marginTop: 5,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {meta}
        </div>
      </div>

      <Cell label="Gross" width={COL_GROSS}>
        {gross ?? '\u2014'}
      </Cell>

      {isSynced ? (
        <>
          <Cell label="Stbl" width={COL_STBL}>
            {stableford ?? '\u2014'}
          </Cell>
          <Cell label="Diff" width={COL_DIFF}>
            {diff != null ? `${diff > 0 ? '+' : ''}${diff.toFixed(1)}` : '\u2014'}
          </Cell>
          {activity.last_round_score_id && (
            <ChevronRight
              size={15}
              strokeWidth={2.2}
              color={CHART.DIM}
              style={{ flexShrink: 0 }}
            />
          )}
        </>
      ) : (
        <span
          style={{
            ...LABEL_STYLE,
            color: CHART.AMBER,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
            flexShrink: 0,
          }}
        >
          {variant === 'clbhouz-not-synced' ? 'Ask to sync' : 'Invite'}
          <ChevronRight size={13} strokeWidth={2.6} />
        </span>
      )}
    </div>
  );
};

export default FriendRoundRow;
