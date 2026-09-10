import React from 'react';
import { useTranslation } from 'react-i18next';
import type { WhsFriendActivityWithImage } from '@/lib/whs/types';
import { displayName } from '@/lib/whs/utils/initials';
import { fmtAbsoluteDate } from '@/lib/whs/utils/nameFormat';
import { CHART, CHART_FONT } from '../../charts';

export type FriendRoundVariant = 'clbhouz-synced' | 'clbhouz-not-synced' | 'eg-only';

interface Props {
  activity: WhsFriendActivityWithImage;
  variant: FriendRoundVariant;
  onOpenRound: (activity: WhsFriendActivityWithImage) => void;
  onInvite: (activity: WhsFriendActivityWithImage) => void;
  inviting?: boolean;
}

const COL_GROSS = 44;
const COL_STBL = 40;
const COL_DIFF = 48;
const FIGURE_GAP = 3;
const GAP_NAME_TO_DATE = 3;
const GAP_FIGURES_TO_COURSE = 8;
/**
 * THE ACTION SLOT IS RESERVED ON EVERY ROW, INVITE OR NOT.
 *
 * This is why GROSS was moving between rows: only eg-only rows render the
 * Invite button, and those are also the rows that carry a gross and nothing
 * else, so the three figure columns were pushed left by the button's width on
 * exactly the rows the reader compares against. The columns themselves were
 * never the fault. The slot is now always present and always this wide, so the
 * gross column sits at the same offset from the right edge on every row shape.
 */
const COL_ACTION = 52;

const KICKER: React.CSSProperties = {
  margin: 0,
  fontFamily: CHART_FONT,
  fontSize: 9,
  lineHeight: '11px',
  fontWeight: 700,
  letterSpacing: 0,
  textTransform: 'uppercase',
  color: CHART.DIM,
};

const FIGURE: React.CSSProperties = {
  margin: `${FIGURE_GAP}px 0 0`,
  minHeight: 19,
  fontFamily: CHART_FONT,
  fontSize: 16,
  lineHeight: '19px',
  fontWeight: 700,
  letterSpacing: '-0.04em',
  fontVariantNumeric: 'tabular-nums lining-nums',
  color: CHART.INK,
};

function formatDifferential(value: number | null): string | null {
  if (value == null) return null;
  if (value < 0) return `−${Math.abs(value).toFixed(1)}`;
  return value > 0 ? `+${value.toFixed(1)}` : '0.0';
}

const FigureCell: React.FC<{ label: string; width: number; value: React.ReactNode }> = ({ label, width, value }) => (
  <div style={{ width, flexShrink: 0, textAlign: 'right' }}>
    <p style={KICKER}>{value == null ? '' : label}</p>
    <p style={FIGURE}>{value ?? ''}</p>
  </div>
);

export const FriendRoundRow: React.FC<Props> = ({
  activity,
  variant,
  onOpenRound,
  onInvite,
  inviting = false,
}) => {
  const { t } = useTranslation('common');
  const canOpen = variant === 'clbhouz-synced' && !!activity.last_round_score_id;
  const canInvite = variant === 'eg-only' && activity.friend_passport_id != null;
  const played = fmtAbsoluteDate(activity.last_round_played_at);
  const dateMeta = activity.is_nine_hole || activity.total_holes === 9
    ? `${played} - ${t('handicap.friendsRounds.nineHoles')}`
    : played;
  const course = activity.last_round_course_name ?? t('handicap.friendsRounds.unknownCourse');
  const diff = activity.last_round_differential;

  const main = (
    <>
      <div style={{ minWidth: 0, flex: '1 1 auto' }}>
        <p style={{ margin: 0, fontFamily: CHART_FONT, fontSize: 13, lineHeight: '16px', fontWeight: 700, color: CHART.INK, overflowWrap: 'anywhere' }}>
          {displayName(activity.friend_name)}
        </p>
        <p style={{ ...KICKER, marginTop: GAP_NAME_TO_DATE }}>{dateMeta}</p>
      </div>
      <div style={{ display: 'flex', gap: FIGURE_GAP, flexShrink: 0 }}>
        <FigureCell label={t('handicap.friendsRounds.gross')} width={COL_GROSS} value={activity.last_round_adjusted_gross} />
        <FigureCell label={t('handicap.friendsRounds.stbl')} width={COL_STBL} value={activity.last_round_stableford} />
        <FigureCell label={t('handicap.friendsRounds.diff')} width={COL_DIFF} value={formatDifferential(diff)} />
      </div>
      <div style={{ width: COL_ACTION, flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}>
        {canInvite && (
          <button
            type="button"
            disabled={inviting}
            onClick={(e) => { e.stopPropagation(); onInvite(activity); }}
            style={{ border: 0, padding: '4px 0 4px 8px', background: 'transparent', color: CHART.AMBER, fontFamily: CHART_FONT, fontSize: 11, lineHeight: '13px', fontWeight: 700, letterSpacing: 0, textTransform: 'uppercase', opacity: inviting ? 0.5 : 1 }}
          >
            {t('handicap.friendsRounds.invite')}
          </button>
        )}
      </div>
    </>
  );

  /* NO MIN-HEIGHT. It was 64, which on a short row left the course line
     stranded near the hairline and reading as the NEXT golfer's course. The
     block now closes up to its own content: name, date, figures, course, and
     the row's breathing space sits BENEATH the course line. */
  const rowStyle: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: 0,
    border: 0,
    background: 'transparent',
    textAlign: 'left',
  };

  const courseStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: CHART_FONT,
    fontSize: 12,
    lineHeight: '16px',
    fontWeight: 500,
    color: CHART.MUTE,
    overflowWrap: 'anywhere',
  };

  /* 12px above the name, 8px from the figures to the course, 14px below it. */
  const blockPadding = '12px 0 14px';

  return (
    canOpen ? (
      <button
        type="button"
        onClick={() => onOpenRound(activity)}
        style={{ width: '100%', padding: blockPadding, border: 0, borderBottom: `1px solid ${CHART.BORDER}`, background: 'transparent', textAlign: 'left' }}
      >
        <span style={rowStyle}>{main}</span>
        <span style={{ ...courseStyle, marginTop: GAP_FIGURES_TO_COURSE }}>{course}</span>
      </button>
    ) : (
      <div style={{ padding: blockPadding, borderBottom: `1px solid ${CHART.BORDER}` }}>
        <div style={rowStyle}>{main}</div>
        <p style={{ ...courseStyle, margin: `${GAP_FIGURES_TO_COURSE}px 0 0` }}>{course}</p>
      </div>
    )
  );
};

export default FriendRoundRow;
