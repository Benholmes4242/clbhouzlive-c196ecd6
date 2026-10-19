/**
 * BRIEF_COURSE_TAB_1A Phase 1 — THE VERDICT, the first section under the tabs.
 *
 * Figure and caption: get_course_stats_detail.avg_over_par over rounds_tracked
 * (every member, all time, 18 holes — D1). Placing bar: harder_than_pct, which
 * is NOT regional (D2) — never print a geography beside it.
 * Fact tiles and observation: deriveCourseVerdict over get_course_hole_analysis
 * ONLY (F2/F3); hardest_hole_* from the stats RPC is never read here.
 * Nothing here is about the viewer (V1): no viewer columns, no viewer RPCs.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/i18n/format';
import { A, FIGS, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { useCourseStatsDetail } from '@/hooks/feed/useCourseStatsDetail';
import { useCourseHoleAnalysis } from '@/hooks/gam/useCourseHoleAnalysis';
import AboutSection from './AboutSection';
import { deriveCourseVerdict, shotsInWords, signed } from './courseVerdict';
import { B, Said, SMALL_LABEL, TILE_FILL } from './verdictBits';

const TRACK = A.TRACK;

const Fact: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div style={{ flex: 1, minWidth: 0, background: TILE_FILL, borderRadius: 10, padding: '10px 9px' }}>
    <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em', color: A.INK, ...FIGS }}>{value}</div>
    <div style={{ ...SMALL_LABEL, marginTop: 4 }}>{label}</div>
  </div>
);

const TheVerdict: React.FC<{ courseId: string }> = ({ courseId }) => {
  const { t } = useTranslation('courses');
  const { data: stats } = useCourseStatsDetail(courseId, true);
  const { data: analysis } = useCourseHoleAnalysis(courseId);

  const avg = stats?.avg_over_par;
  const rounds = Number(stats?.rounds_tracked ?? 0);
  const verdict = React.useMemo(
    () => (analysis && Number(analysis.total_rounds ?? 0) > 0 ? deriveCourseVerdict(analysis.holes) : null),
    [analysis],
  );
  if (avg == null || !Number.isFinite(avg) || rounds <= 0) return null;

  const r = Math.round(avg);
  const title =
    r >= 1
      ? t('courseDetail.verdict.titleOver', { count: r, words: shotsInWords(r) })
      : r <= -1
        ? t('courseDetail.verdict.titleUnder')
        : t('courseDetail.verdict.titleLevel');

  const harder = stats?.harder_than_pct;
  const pct = harder != null && Number.isFinite(harder) ? Math.max(0, Math.min(100, harder)) : null;
  const parLabel = (p: number) => t('courseDetail.verdict.parType', { par: p });

  return (
    <AboutSection first kicker={t('courseDetail.verdict.kicker')} title={title}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 13, fontFamily: SANS }}>
        <div style={{ fontSize: 62, fontWeight: 800, letterSpacing: '-0.055em', lineHeight: 0.82, color: A.INK, ...FIGS }}>
          {signed(avg)}
        </div>
        <div style={{ paddingBottom: 5 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: A.BODY }}>{t('courseDetail.verdict.overPar')}</div>
          <div style={{ fontSize: 12, color: A.DIM, marginTop: 3, ...FIGS }}>
            {t('courseDetail.verdict.across', { count: rounds, rounds: formatNumber(rounds) })}
          </div>
        </div>
      </div>

      {pct != null ? (
        <div style={{ marginTop: 15 }} data-testid="verdict-placing">
          <div style={{ position: 'relative', height: 24 }} aria-hidden="true">
            <div style={{ position: 'absolute', left: 0, right: 0, top: 10, height: 4, borderRadius: 2, background: TRACK }} />
            <div style={{ position: 'absolute', left: 0, top: 10, height: 4, width: `${pct}%`, borderRadius: 2, background: A.AMBER, opacity: 0.8 }} />
            <div
              style={{
                position: 'absolute',
                top: 5.5,
                left: `calc(${pct}% - 6.5px)`,
                width: 13,
                height: 13,
                borderRadius: '50%',
                background: A.INK,
              }}
            />
          </div>
          <div style={{ ...SMALL_LABEL, lineHeight: 1, display: 'flex', justifyContent: 'space-between', marginTop: 7 }}>
            <span>{t('courseDetail.verdict.gentlest')}</span>
            <span>{t('courseDetail.verdict.harderThan', { pct: Math.round(pct) })}</span>
          </div>
        </div>
      ) : null}

      {verdict ? (
        <>
          <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
            <Fact value={String(verdict.hardest.hole_no)} label={t('courseDetail.verdict.hardestHole')} />
            <Fact value={String(verdict.easiest.hole_no)} label={t('courseDetail.verdict.letOff')} />
            {verdict.defender ? (
              <Fact value={parLabel(verdict.defender.par)} label={t('courseDetail.verdict.defends')} />
            ) : null}
          </div>
          <Said>
            <B>{t('courseDetail.verdict.saidHardest', { hole: verdict.hardest.hole_no })}</B>
            {verdict.defender ? (
              <>
                {t('courseDetail.verdict.saidJoin')}
                <B>{t('courseDetail.verdict.saidDefender', { par: verdict.defender.par })}</B>
                {t('courseDetail.verdict.saidEnd')}
              </>
            ) : (
              t('courseDetail.verdict.saidEndOnly')
            )}
          </Said>
        </>
      ) : null}
    </AboutSection>
  );
};

export default TheVerdict;
