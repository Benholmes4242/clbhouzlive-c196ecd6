/**
 * YOU_TAB_STATE_AUDIT_1 W3 — ZERO TRACKED ROUNDS, one framing for both
 * branches. Kicker, title, lede, the open-board count tile, and — per
 * YOU_TAB_STATE_1 X2, drawn to state-1-no-handicap-course-empty.html — the
 * four boards a single round claims outright, each against "Open" in medal
 * gold, then the ALL BOARDS link. On state 1 this section ABSORBS Up for
 * grabs (X1): the count and the link live here and Up for grabs does not
 * separately render. On courses WITH rounds Up for grabs is unchanged.
 *
 * W4 — the other two tiles ("What you would face", "your course handicap
 * here") are NOT built: they need CR, slope and par, which a course with no
 * tracked rounds does not have, and no value is ever substituted or
 * defaulted.
 *
 * X6 — if the open-board count is unavailable the tile does not render;
 * never a zero, never a dash.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { A, FIGS, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { MEDAL_GOLD } from '@/lib/tokens/medals';
import { formatNumber } from '@/i18n/format';
import { CHAMPIONS_ORDER_ALL_TIME } from '@/components/profile/handicap/whs/sections/course-legends/_shared/championsOrder';
import { Sec, Lede } from './many/manyBits';

/* X2 — the four boards a single round claims outright, in the boards' own
   vocabulary. All four exist: lowest_gross, lowest_net, best_stableford and
   best_score_diff are all-time legend categories. */
const SINGLE_ROUND_BOARDS = ['lowestGross', 'lowestNet', 'bestStableford', 'bestDifferential'] as const;

interface Props {
  /** Null when the count is unavailable — the tile stands down (X6). */
  openBoards: number | null;
  onAllBoards: () => void;
}

export const UnclaimedCourseSection: React.FC<Props> = ({ openBoards, onAllBoards }) => {
  const { t } = useTranslation('courses');
  const boardTotal = CHAMPIONS_ORDER_ALL_TIME.length;
  return (
    <Sec kicker={t('courseDetail.youTab.unclaimed.kicker')} title={t('courseDetail.youTab.unclaimed.title')}>
      <Lede>{t('courseDetail.youTab.unclaimed.lede')}</Lede>
      {openBoards != null && openBoards > 0 ? (
        <div
          style={{
            marginTop: 15,
            background: A.PANEL,
            border: `1px solid ${A.SOFT}`,
            borderRadius: 11,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'baseline',
            gap: 10,
          }}
        >
          <div className="tabular-nums" style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, color: MEDAL_GOLD, ...FIGS }}>
            {formatNumber(openBoards)}
          </div>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: A.DIM }}>
            {t('courseDetail.youTab.unclaimed.tile', { count: openBoards })}
          </div>
        </div>
      ) : null}
      <div style={{ marginTop: 16 }}>
        {SINGLE_ROUND_BOARDS.map((key, i) => (
          <div
            key={key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 11,
              padding: '11px 0',
              borderBottom: i < SINGLE_ROUND_BOARDS.length - 1 ? `1px solid ${A.SOFT}` : undefined,
              fontFamily: SANS,
            }}
          >
            <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: A.BODY }}>
              {t(`courseDetail.youTab.unclaimed.boards.${key}`)}
            </div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: MEDAL_GOLD }}>
              {t('courseDetail.youTab.unclaimed.open')}
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onAllBoards}
        style={{
          marginTop: 14,
          padding: 0,
          border: 0,
          background: 'none',
          cursor: 'pointer',
          fontFamily: SANS,
          fontSize: 12.5,
          fontWeight: 700,
          color: A.AMBER,
        }}
      >
        {t('courseDetail.youTab.unclaimed.allBoards', { count: boardTotal })}
      </button>
    </Sec>
  );
};

export default UnclaimedCourseSection;
