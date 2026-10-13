/**
 * BRIEF_YOU_TAB_BRANCH_C_SCOUTING_REPORT §5 — "Where it is won and lost".
 * The field's bars (FieldHoleBars, one home) and the three costliest holes that
 * clear a plays floor. The right figure is INK, never a ramp hue: red in the
 * chart above means a birdie.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import { A, FIGS, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { formatNumber } from '@/i18n/format';
import AboutSection from '../about/AboutSection';
import { FieldHoleBars } from './NotConnectedInvitation';
import { YouAction } from './youBits';

interface Props {
  holes: CourseHole[];
  totalRounds: number;
  onAllHoles: () => void;
}

const signed2 = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(2)}`;

const WonAndLostSection: React.FC<Props> = ({ holes, totalRounds, onAllHoles }) => {
  const { t } = useTranslation('courses');
  const floor = Math.max(5, totalRounds * 0.25);
  const ranked = holes
    .filter((h) => h.rounds >= floor)
    .sort((a, b) => b.avg_to_par - a.avg_to_par)
    .slice(0, 3);
  const rows = ranked.length >= 3 ? ranked : [];

  return (
    <AboutSection
      heading={t('courseDetail.youTab.wonAndLost.heading')}
      meta={t('courseDetail.youTab.connect.roundsMeta', { count: totalRounds, rounds: formatNumber(totalRounds) })}
    >
      <FieldHoleBars holes={holes} />
      {rows.length > 0 ? (
        <div style={{ marginTop: 16 }}>
          {rows.map((h, i) => {
            const shots = Math.max(0, h.avg_to_par).toFixed(2);
            return (
              <div
                key={h.hole_no}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '11px 0',
                  borderTop: i > 0 ? `1px solid ${A.SOFT}` : undefined,
                  fontFamily: SANS,
                }}
              >
                <span
                  style={{
                    width: 38,
                    height: 38,
                    flexShrink: 0,
                    borderRadius: 10,
                    background: A.TRACK,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    fontWeight: 700,
                    letterSpacing: '-0.03em',
                    color: A.INK,
                    ...FIGS,
                  }}
                >
                  {h.hole_no}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em', color: A.INK, ...FIGS }}>
                    {h.stroke_index != null
                      ? t('courseDetail.youTab.wonAndLost.holeTitle', { par: h.par, si: h.stroke_index })
                      : t('courseDetail.youTab.wonAndLost.holeTitleNoIndex', { par: h.par })}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 11, fontWeight: 500, color: A.DIM, ...FIGS }}>
                    {h.yards != null
                      ? t('courseDetail.youTab.wonAndLost.holeSub', { yards: formatNumber(h.yards), shots })
                      : t('courseDetail.youTab.wonAndLost.holeSubNoYards', { shots })}
                  </div>
                </div>
                <span
                  style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.035em', color: A.INK, flexShrink: 0, ...FIGS }}
                >
                  {signed2(h.avg_to_par)}
                </span>
              </div>
            );
          })}
        </div>
      ) : null}
      <YouAction label={t('courseDetail.youTab.wonAndLost.allHoles')} onPress={onAllHoles} />
    </AboutSection>
  );
};

export default WonAndLostSection;
