import React from 'react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/BottomSheet';
import RailChips from '@/components/ui/RailChips';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useCourseHoleAnalysis, type CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import { useMyHolePerformance, type MyHolePerformanceRow } from '@/hooks/gam/useMyHolePerformance';
import { useCourseScoringBreakdown, type ScoringBreakdownHole } from '@/features/courses/components/holes/useCourseScoringBreakdown';
import { formatNumber } from '@/i18n/format';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { A, BAR_RADIUS, FIGS, RAMP_TOPAR, SANS, toParParts } from '@/features/courses/components/holes/analytical/tokens';
import { ABOUT_KICKER } from '../about/AboutSection';

type SortMode = 'hole' | 'worst';

interface Props {
  open: boolean;
  onClose: () => void;
  courseId: string;
  courseName: string;
}

interface PersonalHole {
  mine: MyHolePerformanceRow;
  field: CourseHole | null;
  scoring: ScoringBreakdownHole | null;
}

const FIGURE: React.CSSProperties = {
  fontFamily: SANS,
  fontVariantNumeric: 'tabular-nums lining-nums',
  fontFeatureSettings: '"kern" 1, "liga" 1',
  letterSpacing: 0,
};

const HeadFigure: React.FC<{ label: string; value: string; amber?: boolean }> = ({ label, value, amber }) => (
  <div style={{ minWidth: 0 }}>
    <div style={{ ...FIGURE, fontSize: 18, fontWeight: 700, lineHeight: 1, color: amber ? A.AMBER : A.INK }}>{value}</div>
    <div style={{ ...ABOUT_KICKER, marginTop: 5, whiteSpace: 'nowrap' }}>{label}</div>
  </div>
);

const pct = (value: number, total: number) => total > 0 ? Math.round((value / total) * 100) : 0;
const signed = (value: number) => toParParts(value, 1)?.text ?? 'E';

function memberBuckets(mine: MyHolePerformanceRow, scoring: ScoringBreakdownHole | null) {
  const under = Math.max(0, (mine.birdie_count ?? 0) + (mine.eagle_or_better_count ?? 0));
  const parOrBetter = Math.max(under, scoring?.par_or_better ?? under);
  return {
    birdie: under,
    par: Math.max(0, parOrBetter - under),
    bogey: Math.max(0, scoring?.bogeys ?? 0),
    double: Math.max(0, scoring?.doubles_plus ?? 0),
  };
}

const DistributionBar: React.FC<{ row: PersonalHole }> = ({ row }) => {
  const buckets = memberBuckets(row.mine, row.scoring);
  const total = Object.values(buckets).reduce((sum, value) => sum + value, 0) || 1;
  return (
    <span style={{ display: 'flex', height: 5, overflow: 'hidden', borderRadius: BAR_RADIUS, background: A.TRACK }}>
      {(Object.keys(buckets) as Array<keyof typeof buckets>).map((key) => (
        <i key={key} style={{ width: `${(buckets[key] / total) * 100}%`, background: RAMP_TOPAR[key] }} />
      ))}
    </span>
  );
};

const YourHolesSheet: React.FC<Props> = ({ open, onClose, courseId, courseName }) => {
  const { t } = useTranslation('courses');
  const { user } = useSupabaseSession();
  const { data: analysis, isLoading: fieldLoading } = useCourseHoleAnalysis(courseId);
  const { data: mineData, isLoading: mineLoading } = useMyHolePerformance(user?.id, courseId, { enabled: open && Boolean(user?.id) });
  const { data: breakdown, isLoading: breakdownLoading } = useCourseScoringBreakdown(open ? courseId : undefined);
  const [sort, setSort] = React.useState<SortMode>('hole');

  React.useEffect(() => {
    if (open) setSort('hole');
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    analyticsEvents.track('course_holes_page_viewed', { course_id: courseId, scope: 'you', surface: 'sheet' });
  }, [open, courseId]);

  const fieldByHole = React.useMemo(() => new Map((analysis?.holes ?? []).map((row) => [row.hole_no, row])), [analysis?.holes]);
  const scoringByHole = React.useMemo(() => new Map((breakdown?.holes ?? []).map((row) => [row.hole_no, row])), [breakdown?.holes]);
  const rows = React.useMemo<PersonalHole[]>(() => (mineData ?? []).map((mine) => ({
    mine,
    field: fieldByHole.get(mine.hole_no) ?? null,
    scoring: scoringByHole.get(mine.hole_no) ?? null,
  })), [mineData, fieldByHole, scoringByHole]);
  const ordered = React.useMemo(() => [...rows].sort((a, b) => sort === 'worst'
    ? b.mine.avg_to_par - a.mine.avg_to_par || a.mine.hole_no - b.mine.hole_no
    : a.mine.hole_no - b.mine.hole_no), [rows, sort]);

  const rounds = Number(breakdown?.rounds ?? Math.max(0, ...rows.map((row) => row.mine.times_played), 0));
  const yourTotal = breakdown?.total_over_par ?? rows.reduce((sum, row) => sum + row.mine.avg_to_par, 0);
  const fieldTotal = rows.reduce((sum, row) => sum + (row.field?.avg_to_par ?? 0), 0);
  const compared = rows.filter((row) => row.field != null);
  const beatField = compared.filter((row) => row.mine.avg_to_par < (row.field?.avg_to_par ?? 0)).length;
  const aggregates = rows.reduce((acc, row) => {
    const buckets = memberBuckets(row.mine, row.scoring);
    acc.birdie += buckets.birdie;
    acc.par += buckets.par;
    acc.bogey += buckets.bogey;
    acc.double += buckets.double;
    return acc;
  }, { birdie: 0, par: 0, bogey: 0, double: 0 });
  const aggregateTotal = Object.values(aggregates).reduce((sum, value) => sum + value, 0);
  const doublesPerRound = rounds > 0 ? aggregates.double / rounds : 0;

  const parRows = React.useMemo(() => {
    const grouped = new Map<number, { you: number; field: number; fieldCount: number }>();
    rows.forEach((row) => {
      const current = grouped.get(row.mine.par) ?? { you: 0, field: 0, fieldCount: 0 };
      current.you += row.mine.avg_to_par;
      if (row.field) { current.field += row.field.avg_to_par; current.fieldCount += 1; }
      grouped.set(row.mine.par, current);
    });
    return [...grouped.entries()].sort((a, b) => a[0] - b[0]).map(([par, values]) => ({ par, ...values }));
  }, [rows]);
  const parScale = Math.max(0.1, ...parRows.flatMap((row) => [Math.max(0, row.you), Math.max(0, row.field)]));

  const thirds = [
    rows.filter((row) => row.mine.hole_no <= 6).reduce((sum, row) => sum + row.mine.avg_to_par, 0),
    rows.filter((row) => row.mine.hole_no >= 7 && row.mine.hole_no <= 12).reduce((sum, row) => sum + row.mine.avg_to_par, 0),
    rows.filter((row) => row.mine.hole_no >= 13).reduce((sum, row) => sum + row.mine.avg_to_par, 0),
  ];
  const worstThird = thirds.indexOf(Math.max(...thirds));
  const bestThird = thirds.indexOf(Math.min(...thirds));
  const thirdDifference = Math.max(0, thirds[worstThird] - thirds[bestThird]);
  const thirdLabels = ['opening six', 'middle six', 'closing six'];
  const thirdsMax = Math.max(0.1, ...thirds.map((value) => Math.max(0, value)));
  const thirdsSentence = thirdDifference < 0.1
    ? t('courseDetail.yourHolesSheet.thirdsEven')
    : t('courseDetail.yourHolesSheet.thirdsDifference', {
        difference: thirdDifference.toFixed(1),
        worst: thirdLabels[worstThird],
        best: thirdLabels[bestThird],
      });
  const worstRow = [...rows].sort((a, b) => b.mine.avg_to_par - a.mine.avg_to_par)[0] ?? null;
  const holeSentence = worstRow?.field == null
    ? t('courseDetail.yourHolesSheet.costliestNoField', { hole: worstRow?.mine.hole_no ?? '' })
    : worstRow.mine.avg_to_par <= worstRow.field.avg_to_par
      ? t('courseDetail.yourHolesSheet.costliestBetter', { hole: worstRow.mine.hole_no })
      : t('courseDetail.yourHolesSheet.costliestWorse', {
          hole: worstRow.mine.hole_no,
          difference: Math.abs(worstRow.mine.avg_to_par - worstRow.field.avg_to_par).toFixed(1),
        });
  const loading = fieldLoading || mineLoading || breakdownLoading;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      variant="light"
      maxHeight="85dvh"
      topRadius={22}
      grabberColor="rgba(248,250,252,0.22)"
      grabberRadius={999}
      grabberPadding="10px 0 4px"
      ariaLabelledBy="your-holes-sheet-title"
      style={{ height: '85dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: SANS }}
    >
      <header style={{ flex: '0 0 auto', padding: '2px 20px 16px', borderBottom: `1px solid ${A.HAIRLINE}`, background: A.CANVAS }}>
        <div style={{ ...ABOUT_KICKER, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{courseName}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginTop: 5 }}>
          <h2 id="your-holes-sheet-title" style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.15, color: A.INK }}>
            {t('courseDetail.yourHolesSheet.title')}
          </h2>
          <span style={{ ...FIGURE, flexShrink: 0, fontSize: 11, fontWeight: 700, color: A.DIM }}>
            {t('courseDetail.plays.rounds', { count: rounds, rounds: formatNumber(rounds) })}
          </span>
        </div>
        {!loading && rows.length > 0 ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginTop: 18 }}>
              <HeadFigure label={t('courseDetail.plays.yourAvg')} value={signed(yourTotal)} amber />
              <HeadFigure label={t('courseDetail.yourHolesSheet.field')} value={signed(fieldTotal)} />
              <HeadFigure label={t('courseDetail.plays.youBeat')} value={`${beatField}/${compared.length}`} />
            </div>
            {rounds >= 10 ? (
              <RailChips
                options={[
                  { id: 'hole', label: t('courseDetail.yourHolesSheet.byHole') },
                  { id: 'worst', label: t('courseDetail.yourHolesSheet.worstFirst') },
                ]}
                value={sort}
                onChange={(next) => setSort(next as SortMode)}
                ariaLabel={t('courseDetail.yourHolesSheet.sortA11y')}
                style={{ marginTop: 18 }}
              />
            ) : null}
          </>
        ) : null}
      </header>

      <div style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', willChange: 'transform', paddingBottom: 24 }}>
        {loading ? (
          <p style={{ margin: '24px 20px', fontSize: 13, color: A.MUTE }}>{t('courseDetail.yourHolesSheet.loading')}</p>
        ) : rows.length === 0 ? (
          <p style={{ margin: '24px 20px', fontSize: 13, color: A.MUTE }}>{t('courseDetail.yourHolesSheet.empty')}</p>
        ) : (
          <>
            <section style={{ padding: '34px 20px 0' }}>
              <div style={ABOUT_KICKER}>{t('courseDetail.yourHolesSheet.distribution')}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, marginTop: 12 }}>
                {(Object.keys(aggregates) as Array<keyof typeof aggregates>).map((key) => (
                  <div key={key} style={{ minWidth: 0 }}>
                    <div style={{ height: 4, borderRadius: BAR_RADIUS, background: RAMP_TOPAR[key] }} />
                    <div style={{ ...FIGURE, marginTop: 7, fontSize: 13, fontWeight: 700, color: A.INK }}>{pct(aggregates[key], aggregateTotal)}%</div>
                    <div style={{ ...ABOUT_KICKER, marginTop: 4 }}>{t(`courseDetail.yourHolesSheet.${key}`)}</div>
                  </div>
                ))}
              </div>
              <p style={{ margin: '12px 0 0', fontSize: 11, lineHeight: 1.45, color: A.DIM }}>
                {t('courseDetail.yourHolesSheet.doublesLine', { count: doublesPerRound.toFixed(1) })}
              </p>
            </section>

            <section style={{ padding: '34px 20px 0' }}>
              <div style={ABOUT_KICKER}>{t('courseDetail.yourHolesSheet.holes')}</div>
              <div style={{ marginTop: 10 }}>
                {ordered.map((row) => {
                  const buckets = memberBuckets(row.mine, row.scoring);
                  const bucketTotal = Object.values(buckets).reduce((sum, value) => sum + value, 0);
                  const doubleShare = pct(buckets.double, bucketTotal);
                  const best = row.mine.par + row.mine.best_to_par;
                  const hasBirdied = row.mine.best_to_par <= -1;
                  return (
                    <div key={row.mine.hole_no} style={{ display: 'grid', gridTemplateColumns: '20px 54px minmax(64px, 1fr) 34px 34px', gap: 10, alignItems: 'center', minHeight: 54, borderBottom: `1px solid ${A.HAIRLINE}` }}>
                      <span style={{ ...FIGURE, fontSize: 16, fontWeight: 700, color: A.INK, textAlign: 'center' }}>{row.mine.hole_no}</span>
                      <span style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                        <span style={{ textAlign: 'center' }}><b style={{ ...FIGURE, display: 'block', fontSize: 12, color: A.MUTE }}>{row.mine.par}</b><i style={{ ...ABOUT_KICKER, display: 'block', marginTop: 3, fontStyle: 'normal' }}>PAR</i></span>
                        <span style={{ textAlign: 'center' }}><b style={{ ...FIGURE, display: 'block', fontSize: 12, color: hasBirdied ? A.AMBER : A.MUTE }}>{best}</b><i style={{ ...ABOUT_KICKER, display: 'block', marginTop: 3, fontStyle: 'normal' }}>BEST</i></span>
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <DistributionBar row={row} />
                        {doubleShare > 8 ? <i style={{ ...ABOUT_KICKER, display: 'block', marginTop: 4, fontStyle: 'normal', color: RAMP_TOPAR.double }}>{doubleShare}% DOUBLE+</i> : null}
                      </span>
                      <span style={{ textAlign: 'right' }}><b style={{ ...FIGURE, display: 'block', fontSize: 13, color: A.AMBER }}>{signed(row.mine.avg_to_par)}</b><i style={{ ...ABOUT_KICKER, display: 'block', marginTop: 3, fontStyle: 'normal' }}>YOU</i></span>
                      <span style={{ textAlign: 'right' }}><b style={{ ...FIGURE, display: 'block', fontSize: 13, color: A.INK }}>{row.field ? signed(row.field.avg_to_par) : ''}</b><i style={{ ...ABOUT_KICKER, display: 'block', marginTop: 3, fontStyle: 'normal' }}>FIELD</i></span>
                    </div>
                  );
                })}
              </div>
              <p style={{ margin: '12px 0 0', fontSize: 11, lineHeight: 1.45, color: A.DIM }}>{holeSentence}</p>
            </section>

            <section style={{ padding: '34px 20px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><div style={ABOUT_KICKER}>{t('courseDetail.yourHolesSheet.pars')}</div><div style={ABOUT_KICKER}>{t('courseDetail.yourHolesSheet.parsMeta')}</div></div>
              <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
                {parRows.map((row) => (
                  <div key={row.par} style={{ display: 'grid', gridTemplateColumns: '52px 1fr 34px 34px', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: A.MUTE }}>Par {row.par}s</span>
                    <span style={{ position: 'relative', display: 'block', height: 7, borderRadius: BAR_RADIUS, background: A.TRACK }}>
                      <i style={{ display: 'block', width: `${Math.max(2, Math.max(0, row.you) / parScale * 100)}%`, height: '100%', borderRadius: BAR_RADIUS, background: A.AMBER }} />
                      {row.fieldCount > 0 ? <i style={{ position: 'absolute', left: `${Math.max(0, row.field) / parScale * 100}%`, top: -2, width: 2, height: 11, borderRadius: 1, background: 'rgba(248,250,252,0.55)' }} /> : null}
                    </span>
                    <span style={{ ...FIGURE, fontSize: 13, fontWeight: 700, color: A.AMBER, textAlign: 'right' }}>{signed(row.you)}</span>
                    <span style={{ ...FIGURE, fontSize: 13, fontWeight: 700, color: A.MUTE, textAlign: 'right' }}>{row.fieldCount > 0 ? signed(row.field) : ''}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, paddingTop: 10, borderTop: `1px solid ${A.HAIRLINE}` }}><span style={{ ...ABOUT_KICKER, color: A.DIM }}>TOTAL</span><span style={{ ...FIGURE, fontSize: 13, fontWeight: 700, color: A.AMBER }}>{signed(yourTotal)}</span></div>
            </section>

            <section style={{ padding: '34px 20px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><div style={ABOUT_KICKER}>{t('courseDetail.yourHolesSheet.thirds')}</div><div style={ABOUT_KICKER}>{t('courseDetail.yourHolesSheet.thirdsMeta')}</div></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, alignItems: 'end', height: 112, marginTop: 14 }}>
                {thirds.map((value, index) => {
                  const worst = index === worstThird;
                  return <div key={thirdLabels[index]} style={{ display: 'flex', height: '100%', flexDirection: 'column', justifyContent: 'flex-end', textAlign: 'center' }}><span style={{ ...FIGURE, fontSize: 15, fontWeight: 700, color: worst ? A.RED : A.INK }}>{signed(value)}</span><span style={{ display: 'block', height: `${Math.max(4, Math.max(0, value) / thirdsMax * 70)}px`, marginTop: 7, borderRadius: `${BAR_RADIUS}px ${BAR_RADIUS}px 0 0`, background: worst ? A.RED : 'rgba(248,250,252,0.22)' }} /><span style={{ ...ABOUT_KICKER, marginTop: 7 }}>{index === 0 ? '1-6' : index === 1 ? '7-12' : '13-18'}</span></div>;
                })}
              </div>
              <p style={{ margin: '14px 0 0', fontSize: 11, lineHeight: 1.45, color: A.DIM }}>{thirdsSentence}</p>
            </section>
          </>
        )}
      </div>
    </BottomSheet>
  );
};

export default YourHolesSheet;