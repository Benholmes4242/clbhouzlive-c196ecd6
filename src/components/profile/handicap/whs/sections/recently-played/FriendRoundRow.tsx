/**
 * FriendRoundRow - a friend's posted round as a HOUSE ROW, in TWO LINES.
 *
 * LINE 1: identity (name + date) | GROSS | STBL | DIFF | chevron.
 * LINE 2: the COURSE, spanning the full row width.
 *
 * The course used to live in a ~140px column and needed ~150, which is why
 * every club read as "SUND...". It now has the whole row.
 *
 * ALL THREE FIGURE COLUMNS RENDER ON EVERY VARIANT. Where a value is absent
 * the cell is EMPTY - the label still renders and the column keeps its width,
 * so GROSS never moves between variants. No em dashes.
 *
 * THE ACTION USES THE DEAD COLUMNS. On an unconnected friend STBL and DIFF
 * carry no figures, so the action occupies exactly that span (100px): a LABEL
 * in INK with a chevron, plus a 7px DIM sub-label naming the state. Never
 * amber.
 *
 * THE ENGLAND GOLF BADGE IS DELETED. The sub-label states the same fact, in
 * the place where it explains the empty columns beside it.
 *
 * RHYTHM: a label belongs to its figure and a date belongs to its name.
 * Tightening those pairs is what separates the blocks.
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
const GAP = 12;

/** Rhythm, named so it cannot drift. Pairs are tight; blocks separate. */
const GAP_NAME_TO_DATE = 3;
const GAP_DATE_TO_CLUB = 3;
const GAP_FIGURE_TO_LABEL = 3;

/** Dark LABEL, this surface: READ 11 / 700 / 0.16em. */
const LABEL: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: CHART.MUTE,
  lineHeight: 1.4,
  margin: 0,
};

/** ONE treatment for the date and the course. Defined once, used twice. */
const SECONDARY: React.CSSProperties = {
  fontSize: 11.5,
  fontWeight: 400,
  lineHeight: 1.35,
  color: 'var(--hcp-t-60)',
  overflowWrap: 'anywhere',
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
    <div style={{ ...LABEL, marginTop: GAP_FIGURE_TO_LABEL }}>{label}</div>
  </div>
);

export const FriendRoundRow: React.FC<Props> = ({ activity, variant, onClick }) => {
  const { t } = useTranslation('common');
  const gross = activity.last_round_adjusted_gross;
  const stableford = activity.last_round_stableford;
  const diff = activity.last_round_differential;
  const course = activity.last_round_course_name ?? t('handicap.circle.round.unknownCourse');
  const played = fmtAbsoluteDate(activity.last_round_played_at);
  const unconnected = variant !== 'clbhouz-synced';

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
        padding: '13px 16px',
        fontFamily: CHART_FONT,
        cursor: 'pointer',
      }}
    >
      {/* LINE 1 - flex-start so a wrapped name cannot drag the figures down. */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: GAP }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...DARK_ROW_TITLE, overflowWrap: 'anywhere' }}>
            {displayName(activity.friend_name)}
          </div>
          <div style={{ ...SECONDARY, marginTop: GAP_NAME_TO_DATE }}>{played}</div>
        </div>

        <Cell label={t('handicap.circle.round.gross')} width={COL_GROSS}>
          {gross ?? null}
        </Cell>

        {unconnected ? (
          // The dead columns, used: STBL + DIFF + the gap between them.
          <div
            style={{
              width: COL_STBL + COL_DIFF + GAP,
              flexShrink: 0,
              textAlign: 'right',
            }}
          >
            <div
              style={{
                height: 15,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 3,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '-0.01em',
                color: 'var(--hcp-t-100)',
              }}
            >
              {variant === 'eg-only'
                ? t('handicap.circle.round.invite')
                : t('handicap.circle.round.askToSync')}
              <ChevronRight size={10} strokeWidth={2.6} />
            </div>
            <div style={{ ...LABEL, color: CHART.DIM, marginTop: GAP_FIGURE_TO_LABEL }}>
              {variant === 'eg-only'
                ? t('handicap.circle.round.notOnClbhouz')
                : t('handicap.circle.round.noHandicap')}
            </div>
          </div>
        ) : (
          <>
            <Cell label={t('handicap.circle.round.stbl')} width={COL_STBL}>
              {stableford ?? null}
            </Cell>
            <Cell label={t('handicap.circle.round.diff')} width={COL_DIFF}>
              {diff != null ? `${diff > 0 ? '+' : ''}${diff.toFixed(1)}` : null}
            </Cell>
          </>
        )}

        <ChevronRight
          size={15}
          strokeWidth={2.2}
          color={CHART.DIM}
          style={{ flexShrink: 0, marginTop: 1 }}
        />
      </div>

      {/* LINE 2 - the course, full row width, same treatment as the date. */}
      <div style={{ ...SECONDARY, marginTop: GAP_DATE_TO_CLUB }}>{course}</div>
    </div>
  );
};

export default FriendRoundRow;
