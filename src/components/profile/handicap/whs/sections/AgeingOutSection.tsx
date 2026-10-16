/**
 * AgeingOutSection (BRIEF_HANDICAP_TAB_REBUILD phase 3 + A4).
 *
 * Renders ONLY when a counting round is about to expire and the settled index
 * exceeds today's by more than 0.05, with a full twenty. Otherwise nothing —
 * no reassuring version. All figures come from deriveAgeingOut.
 */
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';
import { useAllScores } from '@/lib/whs/hooks';
import { deriveAgeingOut } from '@/lib/whs/ageingOut';
import { counterWindow } from '@/lib/whs/counting';
import { MEMBER_PANEL } from '@/lib/tokens/surfaces';
import { playDateStandalone } from '@/components/explore-tab-new/courseled/discoverWhen';
import { CHART } from '../charts/tokens';
import { pickCourse } from '@/lib/whs/pickCourse';

const fmt = (d: number) => (d < 0 ? `\u2212${Math.abs(d).toFixed(1)}` : d.toFixed(1));
const FIG: React.CSSProperties = { fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"kern" 1, "liga" 1' };
/** 3A C6: prose at MUTE; bolded figures inside it at INK. */
const BODY = CHART.MUTE;

const AgeingOutSection: React.FC<{ connectionId: string; currentHandicap: number | null }> = ({
  connectionId,
  currentHandicap,
}) => {
  const { t } = useTranslation(['common']);
  const { data: scores } = useAllScores(connectionId);
  if (!scores) return null;
  const window = counterWindow(scores);
  const course = pickCourse(window);
  const a = deriveAgeingOut(scores, currentHandicap, course);
  if (!a) return null;

  const r = a.expiring;
  const count = a.inRounds ?? 0;
  const bodyVars = {
    gross: r.adjusted_gross ?? '',
    course: r.course?.name ?? '',
    date: playDateStandalone(r.play_date),
    diff: fmt(r.handicap_differential as number),
    next: fmt(a.replacement),
    settle: a.settleAt.toFixed(1),
    count,
  };

  return (
    <section style={{ marginTop: 34 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: CHART.AMBER }}>
        {t('common:handicap.ageingOut.kicker')}
      </div>
      <h3 style={{ margin: '6px 0 10px', fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em', color: CHART.INK }}>
        {t(a.isBest ? 'common:handicap.ageingOut.titleBest' : 'common:handicap.ageingOut.title')}
      </h3>
      <div data-hcp-ageing style={{ background: MEMBER_PANEL, border: `1px solid ${CHART.AMBER}`, borderRadius: 14, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', color: CHART.DIM, ...FIG }}>{a.current.toFixed(1)}</span>
          <ArrowRight size={18} color={CHART.FAINT} aria-hidden />
          <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', color: CHART.AMBER, ...FIG }}>{a.settleAt.toFixed(1)}</span>
          {a.inRounds != null && (
            <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: CHART.DIM }}>
              {t('common:handicap.ageingOut.inRounds', { count })}
            </span>
          )}
        </div>
        {a.inRounds != null && (
          <p style={{ margin: '10px 0 0', fontSize: 12.5, fontWeight: 400, lineHeight: 1.45, color: BODY, ...FIG }}>
            <Trans
              t={t}
              i18nKey={a.isBest ? 'common:handicap.ageingOut.body' : 'common:handicap.ageingOut.bodyNotBest'}
              values={bodyVars}
              components={{ b: <strong style={{ fontWeight: 700, color: CHART.INK }} /> }}
            />
          </p>
        )}
        {course && a.holdGross != null && (
          <p style={{ margin: '12px 0 0', paddingTop: 12, borderTop: `1px solid ${CHART.BORDER}`, fontSize: 12.5, fontWeight: 400, lineHeight: 1.45, color: CHART.MUTE, ...FIG }}>
            {t('common:handicap.ageingOut.hold', { index: a.current.toFixed(1), gross: a.holdGross, course: course.name, count })}
            {a.repeat && <> {t('common:handicap.ageingOut.holdRepeat', { gross: a.repeat.gross, times: a.repeat.times })}</>}
          </p>
        )}
      </div>
      <p style={{ margin: '8px 0 0', fontSize: 11, fontWeight: 400, lineHeight: 1.45, color: CHART.DIM }}>
        {t('common:handicap.ageingOut.caption')}
      </p>
    </section>
  );
};

export default AgeingOutSection;
