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
    ? `${played} · ${t('handicap.friendsRounds.nineHoles')}`
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
        <FigureCell label={t('handicap.friendsRounds.diff')} width={COL_DIFF} value={diff == null ? null : diff.toFixed(1)} />
      </div>
      {canInvite && (
        <button
          type="button"
          disabled={inviting}
          onClick={() => onInvite(activity)}
          style={{ border: 0, padding: '8px 0 8px 8px', background: 'transparent', color: CHART.AMBER, fontFamily: CHART_FONT, fontSize: 11, lineHeight: '13px', fontWeight: 700, letterSpacing: 0, textTransform: 'uppercase', opacity: inviting ? 0.5 : 1 }}
        >
          {t('handicap.friendsRounds.invite')}
        </button>
      )}
    </>
  );

  const rowStyle: React.CSSProperties = {
    width: '100%',
    minHeight: 64,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: 0,
    border: 0,
    background: 'transparent',
    textAlign: 'left',
  };

  return (
    canOpen ? (
      <button
        type="button"
        onClick={() => onOpenRound(activity)}
        style={{ width: '100%', padding: '12px 0', border: 0, borderBottom: `1px solid ${CHART.BORDER}`, background: 'transparent', textAlign: 'left' }}
      >
        <span style={rowStyle}>{main}</span>
        <span style={{ display: 'block', marginTop: GAP_FIGURES_TO_COURSE, fontFamily: CHART_FONT, fontSize: 12, lineHeight: '16px', fontWeight: 500, color: CHART.MUTE, overflowWrap: 'anywhere' }}>
          {course}
        </span>
      </button>
    ) : (
      <div style={{ padding: '12px 0', borderBottom: `1px solid ${CHART.BORDER}` }}>
        <div style={rowStyle}>{main}</div>
        <p style={{ margin: `${GAP_FIGURES_TO_COURSE}px 0 0`, fontFamily: CHART_FONT, fontSize: 12, lineHeight: '16px', fontWeight: 500, color: CHART.MUTE, overflowWrap: 'anywhere' }}>
          {course}
        </p>
      </div>
    )
  );
};

export default FriendRoundRow;