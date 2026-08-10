/**
 * FriendRoundRow - a friend's posted round as a HOUSE ROW.
 *
 * THE COLUMNS ACTUALLY LINE UP NOW. Every row renders the same trailing
 * group - GROSS, STBL, DIFF and a chevron - on every variant. Where a value
 * is absent the cell is EMPTY: the label still renders and the column keeps
 * its width, so a friend with no stableford does not shove their gross 67px
 * right of everybody else's.
 *
 * The per-row INVITE / ASK TO SYNC action is GONE, not hidden. The whole row
 * was already the invite: the feed's handleOpen routes every variant on a
 * whole-row tap. The label was a second affordance for a tap the row already
 * performed, and it spent amber to do it. The count of unconnected friends
 * now sits once beneath the list.
 *
 * The ENGLAND GOLF badge stays. It is a fact about the friend - their round
 * arrived from the governing body with no clbhouz account behind it - not
 * decoration.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { displayName } from '@/lib/whs/utils/initials';
import { fmtAbsoluteDate } from '@/lib/whs/utils/nameFormat';
import { CHART, CHART_FONT } from '../../charts';
import { DARK_ROW_TITLE } from '../_shared/darkAtoms';
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

/** Dark LABEL, this surface's scale: 7/700/0.16em. Not the 9/800 chart token. */
const LABEL: React.CSSProperties = {
  fontSize: 7,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: CHART.MUTE,
  lineHeight: 1.4,
  margin: 0,
};

const Cell: React.FC<{ label: string; width: number; children?: React.ReactNode }> = ({
  label,
  width,
  children,
}) => (
  <div style={{ width, flexShrink: 0, textAlign: 'right' }}>
    {/* Fixed slot: an absent value must not collapse the cell. */}
    <div
      style={{
        height: 15,
        fontSize: 15,
        fontWeight: 700,
        color: CHART.INK,
        letterSpacing: '-0.03em',
        lineHeight: '15px',
        fontVariantNumeric: 'tabular-nums lining-nums',
      }}
    >
      {children}
    </div>
    <div style={{ ...LABEL, marginTop: 5 }}>{label}</div>
  </div>
);

export const FriendRoundRow: React.FC<Props> = ({ activity, variant, onClick }) => {
  const { t } = useTranslation('common');
  const gross = activity.last_round_adjusted_gross;
  const stableford = activity.last_round_stableford;
  const diff = activity.last_round_differential;
  const course = activity.last_round_course_name ?? t('handicap.circle.round.unknownCourse');
  const played = fmtAbsoluteDate(activity.last_round_played_at);

  // Date and course only. Whether their round counted toward THEIR index is
  // not something the viewer can act on.
  const meta = [played, course].filter(Boolean).join(' \u00B7 ');

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
        // flex-start: a wrapped name must not drag the figures down with it.
        alignItems: 'flex-start',
        gap: 8,
        padding: '13px 16px',
        fontFamily: CHART_FONT,
        cursor: 'pointer',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Name and badge wrap as a group; the name itself never truncates. */}
        <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 6 }}>
          <span style={{ ...DARK_ROW_TITLE, overflowWrap: 'anywhere' }}>
            {displayName(activity.friend_name)}
          </span>
          {variant === 'eg-only' && (
            <span style={{ ...LABEL, whiteSpace: 'nowrap' }}>
              {t('handicap.circle.round.englandGolf')}
            </span>
          )}
        </div>
        {/* Sentence case, wraps. Six courses read as six courses. */}
        <div
          style={{
            marginTop: 4,
            fontSize: 11.5,
            fontWeight: 400,
            lineHeight: 1.4,
            color: 'var(--hcp-t-60)',
            overflowWrap: 'anywhere',
          }}
        >
          {meta}
        </div>
      </div>

      <Cell label={t('handicap.circle.round.gross')} width={COL_GROSS}>
        {gross ?? null}
      </Cell>
      <Cell label={t('handicap.circle.round.stbl')} width={COL_STBL}>
        {stableford ?? null}
      </Cell>
      <Cell label={t('handicap.circle.round.diff')} width={COL_DIFF}>
        {diff != null ? `${diff > 0 ? '+' : ''}${diff.toFixed(1)}` : null}
      </Cell>

      {/* Every row is tappable and every tap resolves somewhere. */}
      <ChevronRight
        size={15}
        strokeWidth={2.2}
        color={CHART.DIM}
        style={{ flexShrink: 0, marginTop: 1 }}
      />
    </div>
  );
};

export default FriendRoundRow;
