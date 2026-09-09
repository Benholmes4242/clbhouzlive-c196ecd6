import React from 'react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { formatNumber } from '@/i18n/format';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useCourseHoleAnalysis, type CourseHole } from '@/hooks/gam/useCourseHoleAnalysis';
import { useMyHolePerformance, type MyHolePerformanceRow } from '@/hooks/gam/useMyHolePerformance';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWhsConnection } from '@/lib/whs/hooks';
import { buildSiLadder, type SiLadder as SiLadderData, type SiLadderRow } from '@/features/courses/_shared/siLadder';
import { A, BAR_RADIUS, FIGS, RAMP_TOPAR, SANS, toParParts } from '@/features/courses/components/holes/analytical/tokens';
import { BUCKETS, courseBucketShares, type BucketShares } from '@/features/courses/components/holes/analytical/HoleRowV2';
import { buildParTypeRows, type ParTypeRow } from '@/features/courses/components/holes/analytical/CourseAnalyticsPanels';
import AboutSection, { ABOUT_KICKER, AboutHairline } from './AboutSection';
import { CourseDistributionSummary } from './HowItPlays';

const MIN_ROUNDS = 20;
const ROW_KICKER: React.CSSProperties = {
  fontFamily: SANS,
  fontSize: 7,
  fontWeight: 700,
  letterSpacing: '0.12em',
  lineHeight: 1.1,
  textTransform: 'uppercase',
  color: A.DIM,
};
const FIGURE: React.CSSProperties = {
  fontFamily: SANS,
  fontVariantNumeric: 'tabular-nums lining-nums',
  letterSpacing: '-0.04em',
};

function bucketValues(hole: CourseHole): number[] {
  return BUCKETS.map((bucket) =>
    bucket.keys.reduce((sum, key) => sum + Number(hole.dist[key] ?? 0), 0),
  );
}

const SheetFigure: React.FC<{ label: string; value: string; amber?: boolean }> = ({ label, value, amber }) => (
  <div style={{ minWidth: 0 }}>
    <div style={{ ...FIGURE, fontSize: 18, fontWeight: 700, lineHeight: 1, color: amber ? A.AMBER : A.INK }}>
      {value}
    </div>
    <div style={{ ...ABOUT_KICKER, marginTop: 5, whiteSpace: 'nowrap' }}>{label}</div>
  </div>
);

const HoleDistribution: React.FC<{ hole: CourseHole }> = ({ hole }) => {
  const values = bucketValues(hole);
  const total = values.reduce((sum, value) => sum + Math.max(0, value), 0);
  return (
    <span style={{ display: 'flex', gap: 2, minWidth: 0, height: 4 }}>
      {values.map((value, index) => (
        <i
          key={BUCKETS[index].key}
          style={{
            width: total > 0 && value > 0 ? `${(value / total) * 100}%` : 2,
            flexShrink: 0,
            borderRadius: BAR_RADIUS,
            background: BUCKETS[index].bg,
            opacity: value > 0 ? 1 : 0.28,
          }}
        />
      ))}
    </span>
  );
};

const CompactHoleRow: React.FC<{
  hole: CourseHole;
  mine: MyHolePerformanceRow | null;
  hasYou: boolean;
  last: boolean;
}> = ({ hole, mine, hasYou, last }) => {
  const { t } = useTranslation('courses');
  const field = toParParts(hole.avg_to_par);
  const you = toParParts(mine?.avg_to_par);
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: hasYou
          ? '20px 54px minmax(42px, 1fr) 34px 34px'
          : '20px 54px minmax(42px, 1fr) 34px',
        alignItems: 'center',
        gap: 8,
        minHeight: 52,
        borderBottom: last ? 0 : `1px solid ${A.HAIRLINE}`,
      }}
    >
      <span style={{ ...FIGURE, fontSize: 16, fontWeight: 700, color: A.INK }}>{hole.hole_no}</span>
      <span style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4, textAlign: 'center' }}>
        <span>
          <span style={{ ...FIGURE, display: 'block', fontSize: 12, fontWeight: 700, color: A.MUTE }}>{hole.par}</span>
          <span style={{ ...ROW_KICKER, display: 'block', marginTop: 2 }}>{t('courseDetail.holes.colPar')}</span>
        </span>
        <span>
          <span style={{ ...FIGURE, display: 'block', fontSize: 12, fontWeight: 700, color: A.MUTE }}>{hole.stroke_index ?? ''}</span>
          <span style={{ ...ROW_KICKER, display: 'block', marginTop: 2 }}>{t('courseDetail.holes.colSi')}</span>
        </span>
      </span>
      <HoleDistribution hole={hole} />
      <span style={{ textAlign: 'right', minWidth: 0 }}>
        <span style={{ ...FIGURE, display: 'block', fontSize: 13, fontWeight: 700, color: A.INK }}>{field?.text ?? ''}</span>
        <span style={{ ...ROW_KICKER, display: 'block', marginTop: 2 }}>{t('courseDetail.plays.legendField')}</span>
      </span>
      {hasYou ? (
        <span style={{ textAlign: 'right', minWidth: 0 }}>
          <span style={{ ...FIGURE, display: 'block', fontSize: 13, fontWeight: 700, color: A.AMBER }}>{you?.text ?? ''}</span>
          {you ? <span style={{ ...ROW_KICKER, display: 'block', marginTop: 2 }}>{t('courseDetail.plays.legendYou')}</span> : null}
        </span>
      ) : null}
    </div>
  );
};

function signedPosition(value: number, min: number, max: number): number {
  return ((value - min) / Math.max(0.01, max - min)) * 100;
}

const ParTracks: React.FC<{ rows: ParTypeRow[]; hasYou: boolean }> = ({ rows, hasYou }) => {
  const { t } = useTranslation('courses');
  const values = rows.flatMap((row) => row.you == null || !hasYou ? [row.field] : [row.field, row.you]);
  const min = Math.min(0, ...values);
  const max = Math.max(0.1, ...values);
  const zero = signedPosition(0, min, max);
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {rows.map((row) => {
        const field = toParParts(row.field);
        const you = hasYou ? toParParts(row.you) : null;
        const fieldPos = signedPosition(row.field, min, max);
        const left = Math.min(zero, fieldPos);
        const width = Math.max(1, Math.abs(fieldPos - zero));
        return (
          <div
            key={row.par}
            style={{
              display: 'grid',
              gridTemplateColumns: hasYou ? '52px minmax(48px, 1fr) 34px 34px' : '52px minmax(48px, 1fr) 34px',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: A.MUTE }}>
              {t('courseDetail.parTypes.parNPlural', { n: row.par })}
            </span>
            <span style={{ position: 'relative', height: 4, borderRadius: BAR_RADIUS, background: A.TRACK }}>
              <i style={{ position: 'absolute', left: `${left}%`, width: `${width}%`, insetBlock: 0, borderRadius: BAR_RADIUS, background: A.RED }} />
              {hasYou && row.you != null ? (
                <i style={{ position: 'absolute', left: `${signedPosition(row.you, min, max)}%`, top: -3, width: 2, height: 10, borderRadius: 1, background: A.AMBER }} />
              ) : null}
            </span>
            <span style={{ ...FIGURE, fontSize: 13, fontWeight: 700, color: A.INK, textAlign: 'right' }}>{field?.text ?? ''}</span>
            {hasYou ? (
              <span style={{ ...FIGURE, fontSize: 13, fontWeight: 700, color: A.AMBER, textAlign: 'right' }}>{you?.text ?? ''}</span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

const ladderTone = (row: SiLadderRow) => row.direction === 'harder' ? A.RED : row.direction === 'easier' ? A.GREEN : `color-mix(in srgb, ${A.INK} 14%, transparent)`;

const FlatSiLadder: React.FC<{ ladder: SiLadderData }> = ({ ladder }) => {
  const { t } = useTranslation('courses');
  const rows = [...ladder.rows].sort((a, b) => a.strokeIndex - b.strokeIndex);
  const rowHeight = 17;
  const height = rows.length * rowHeight;
  const y = (position: number) => (position - 1) * rowHeight + rowHeight / 2;
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 40px', alignItems: 'center' }}>
        <span style={{ ...ROW_KICKER, fontSize: 8 }}>{t('courseDetail.allHolesSheet.si')}</span>
        <span />
        <span style={{ ...ROW_KICKER, fontSize: 8, textAlign: 'right' }}>{t('courseDetail.allHolesSheet.plays')}</span>
        <span>
          {rows.map((row) => (
            <span key={row.holeNo} style={{ ...FIGURE, display: 'block', height: rowHeight, lineHeight: `${rowHeight}px`, fontSize: 11, fontWeight: 700, color: row.flagged ? ladderTone(row) : A.DIM }}>
              {row.holeNo}
            </span>
          ))}
        </span>
        <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" width="100%" height={height} style={{ display: 'block', overflow: 'visible' }} aria-hidden="true">
          {rows.map((row) => (
            <line key={row.holeNo} x1={1} y1={y(row.strokeIndex)} x2={99} y2={y(row.measuredRank)} stroke={ladderTone(row)} strokeWidth={row.flagged ? 2 : 1} vectorEffect="non-scaling-stroke" />
          ))}
        </svg>
        <span>
          {Array.from({ length: rows.length }, (_, index) => (
            <span key={index} style={{ ...FIGURE, display: 'block', height: rowHeight, lineHeight: `${rowHeight}px`, textAlign: 'right', fontSize: 11, color: A.DIM }}>{index + 1}</span>
          ))}
        </span>
      </div>

      {ladder.flagged.length > 0 ? (
        <div style={{ marginTop: 18 }}>
          {ladder.flagged.map((row, index) => (
            <React.Fragment key={row.holeNo}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, padding: '10px 0' }}>
                <span>
                  <span style={{ display: 'block', fontFamily: SANS, fontSize: 14, fontWeight: 600, color: A.INK }}>{t('courseDetail.plays.holeN', { hole: row.holeNo })}</span>
                  <span style={{ display: 'block', marginTop: 3, fontFamily: SANS, fontSize: 12, color: A.DIM }}>
                    {t('courseDetail.allHolesSheet.indexedPlays', { index: row.strokeIndex, plays: row.measuredRank })}
                  </span>
                </span>
                <span style={{ ...FIGURE, fontSize: 13, fontWeight: 700, color: ladderTone(row) }}>
                  {row.shotsGap > 0 ? '+' : '\u2212'}{Math.abs(row.shotsGap).toFixed(2)}
                </span>
              </div>
              {index < ladder.flagged.length - 1 ? <AboutHairline /> : null}
            </React.Fragment>
          ))}
        </div>
      ) : null}

      <p style={{ margin: '14px 0 0', fontFamily: SANS, fontSize: 11, lineHeight: 1.55, color: A.DIM }}>
        {t('courseDetail.allHolesSheet.explainer', { floor: ladder.shotsFloor.toFixed(2) })}
      </p>
    </>
  );
};

interface AllHolesSheetProps {
  open: boolean;
  onClose: () => void;
  courseId: string;
  courseName: string;
}

const AllHolesSheet: React.FC<AllHolesSheetProps> = ({ open, onClose, courseId, courseName }) => {
  const { t } = useTranslation('courses');
  const { user } = useSupabaseSession();
  const { data: connection } = useWhsConnection(user?.id);
  const { data } = useCourseHoleAnalysis(courseId);
  const canLoadMine = Boolean(user?.id && connection);
  const { data: myPerf } = useMyHolePerformance(user?.id, courseId, { enabled: open && canLoadMine });
  const holes = React.useMemo(() => [...(data?.holes ?? [])].sort((a, b) => a.hole_no - b.hole_no), [data?.holes]);
  const myByHole = React.useMemo(() => new Map((myPerf ?? []).map((row) => [row.hole_no, row])), [myPerf]);
  const hasYou = myByHole.size > 0 && holes.some((hole) => myByHole.has(hole.hole_no));
  const rounds = Number(data?.total_rounds ?? 0);
  const stats = React.useMemo(() => {
    if (holes.length === 0) return null;
    const fieldAvg = holes.reduce((sum, hole) => sum + hole.avg_to_par, 0) / holes.length;
    const mine = holes.map((hole) => myByHole.get(hole.hole_no)).filter((row): row is MyHolePerformanceRow => row != null);
    const yourAvg = mine.length ? mine.reduce((sum, row) => sum + row.avg_to_par, 0) / mine.length : null;
    const beat = holes.filter((hole) => {
      const yours = myByHole.get(hole.hole_no);
      return yours != null && yours.avg_to_par < hole.avg_to_par;
    }).length;
    return { fieldAvg, yourAvg, beat, compared: mine.length };
  }, [holes, myByHole]);
  const shares: BucketShares | null = React.useMemo(() => courseBucketShares(holes), [holes]);
  const parRows = React.useMemo(() => buildParTypeRows(holes, myByHole), [holes, myByHole]);
  const ladder = React.useMemo(() => buildSiLadder(holes, rounds), [holes, rounds]);

  const trackedOpen = React.useRef(false);
  React.useEffect(() => {
    if (!open || trackedOpen.current) return;
    trackedOpen.current = true;
    analyticsEvents.track('course_holes_page_viewed', { course_id: courseId, scope: 'course', surface: 'sheet' });
  }, [open, courseId]);
  React.useEffect(() => {
    if (!open) trackedOpen.current = false;
  }, [open]);

  const field = toParParts(stats?.fieldAvg);
  const you = toParParts(stats?.yourAvg);
  const drawable = rounds >= MIN_ROUNDS && holes.length > 0 && stats != null;

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      variant="light"
      surfaceColor={A.CANVAS}
      maxHeight="85dvh"
      topRadius={22}
      grabberColor="rgba(248,250,252,0.22)"
      grabberRadius={999}
      grabberPadding="10px 0 4px"
      ariaLabelledBy="all-holes-sheet-title"
      style={{ height: '85dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: SANS }}
    >
      <header style={{ flex: '0 0 auto', padding: '2px 20px 16px', borderBottom: `1px solid ${A.HAIRLINE}`, background: A.CANVAS }}>
        <div style={{ ...ABOUT_KICKER, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{courseName}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginTop: 5 }}>
          <h2 id="all-holes-sheet-title" style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.15, color: A.INK }}>
            {t('courseDetail.allHolesSheet.title')}
          </h2>
          <span style={{ ...FIGURE, flexShrink: 0, fontSize: 11, fontWeight: 700, letterSpacing: 0, color: A.DIM }}>
            {t('courseDetail.plays.rounds', { count: rounds, rounds: formatNumber(rounds) })}
          </span>
        </div>
        {drawable ? (
          <div style={{ display: 'grid', gridTemplateColumns: hasYou ? 'repeat(3, minmax(0, 1fr))' : '1fr', gap: 12, marginTop: 18 }}>
            <SheetFigure label={t('courseDetail.plays.fieldAvg')} value={field?.text ?? ''} />
            {hasYou && you ? <SheetFigure label={t('courseDetail.plays.yourAvg')} value={you.text} amber /> : null}
            {hasYou ? <SheetFigure label={t('courseDetail.plays.youBeat')} value={`${stats.beat}/${stats.compared}`} /> : null}
          </div>
        ) : null}
      </header>

      <div style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 24 }}>
        {!drawable ? (
          <div style={{ padding: '24px 20px', fontFamily: SANS, fontSize: 13, lineHeight: 1.55, color: A.MUTE }}>
            {t('courseDetail.plays.notEnoughRounds', { count: rounds, rounds: formatNumber(rounds) })}
          </div>
        ) : (
          <>
            <AboutSection first heading={t('courseDetail.allHolesSheet.holes')}>
              {shares ? <CourseDistributionSummary shares={shares} /> : null}
              <div style={{ marginTop: shares ? 16 : 0 }}>
                {holes.map((hole, index) => (
                  <CompactHoleRow key={hole.hole_no} hole={hole} mine={myByHole.get(hole.hole_no) ?? null} hasYou={hasYou} last={index === holes.length - 1} />
                ))}
              </div>
            </AboutSection>

            <AboutSection heading={t('courseDetail.allHolesSheet.pars')}>
              <ParTracks rows={parRows} hasYou={hasYou} />
            </AboutSection>

            {ladder ? (
              <AboutSection
                heading={t('courseDetail.allHolesSheet.ladder')}
                meta={t('courseDetail.allHolesSheet.outOfStep', { count: ladder.flagged.length })}
              >
                <FlatSiLadder ladder={ladder} />
              </AboutSection>
            ) : null}
          </>
        )}
      </div>
    </BottomSheet>
  );
};

export default AllHolesSheet;