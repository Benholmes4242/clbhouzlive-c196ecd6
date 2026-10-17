/**
 * YOU_TAB_STATE_AUDIT_1 W3 — ZERO TRACKED ROUNDS, one framing for both
 * branches. The no-handicap branch and the connected branch lead with the
 * same section: kicker, title, lede, and ONE tile reading the open-board
 * count. The existing Up for grabs count and ALL BOARDS link follow it; the
 * connected branch keeps its bucket-list prompt beneath, the no-handicap
 * branch keeps its connect block.
 *
 * W4 — the other two tiles ("What you would face", "your course handicap
 * here") are NOT built: they need CR, slope and par, which a course with no
 * tracked rounds does not have, and no value is ever substituted or
 * defaulted. The row renders with one tile.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { A, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import { formatNumber } from '@/i18n/format';
import { Sec, Lede } from './many/manyBits';

export const UnclaimedCourseSection: React.FC<{ openBoards: number }> = ({ openBoards }) => {
  const { t } = useTranslation('courses');
  return (
    <Sec kicker={t('courseDetail.youTab.unclaimed.kicker')} title={t('courseDetail.youTab.unclaimed.title')}>
      <Lede>{t('courseDetail.youTab.unclaimed.lede')}</Lede>
      <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, background: A.TRACK, borderRadius: 10, padding: '14px 14px 12px' }}>
          <div className="tabular-nums" style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: A.INK, ...FIGS }}>
            {formatNumber(openBoards)}
          </div>
          <div style={{ marginTop: 2, fontSize: 11, fontWeight: 700, color: A.MUTE }}>
            {t('courseDetail.youTab.unclaimed.tile', { count: openBoards })}
          </div>
        </div>
      </div>
    </Sec>
  );
};

export default UnclaimedCourseSection;
