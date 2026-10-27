/**
 * BRIEF_COURSE_TAB_1A Phase 2 — HOW IT DEFENDS PAR.
 *
 * ONE source: get_course_hole_analysis. F1: the lede states total_rounds
 * (rounds logged with hole-by-hole detail), never rounds_tracked; with
 * total_rounds 0 or no holes the whole section is absent, with no fallback.
 * The red/green bars, the Worst hole cell and the observation all read
 * deriveCourseVerdict, the same computation as the verdict's fact tiles.
 * D4: no cross-course par-type comparison exists, so none is drawn.
 * Replaces HowItPlays on this tab (HowItPlays.tsx is left on disk).
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { formatNumber } from '@/i18n/format';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { A, FIGS, RAMP_TOPAR, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { useCourseHoleAnalysis } from '@/hooks/gam/useCourseHoleAnalysis';
import AboutSection from './AboutSection';
import AllHolesSheet from './AllHolesSheet';
import { deriveCourseVerdict, sharePct, signed } from './courseVerdict';
import { B, BAR_NEUTRAL, Said, SMALL_LABEL } from './verdictBits';

const CHART_H = 56;

/* PTR1.1 — the par-type rows share ONE FIXED scale, −0.20 to +1.20 shots over
   par. It is a constant, never derived from the data: a dot in the same place
   means the same thing on every course, which the old normalise-to-maximum
   bars could never claim. Out-of-range values clamp the DOT to the track end;
   the printed figure always shows the true value. */
export const PAR_SCALE_MIN = -0.2;
export const PAR_SCALE_MAX = 1.2;

/* PTR1.5 (corrected) — the minimum lead before the block may call one par
   type the hardest and paint it red. It governs TWO FIELD AVERAGES being
   close to each other. It deliberately does NOT share LEVEL_EDGE from
   youDerivations (a player's edge against the field on one hole) even though
   both are 0.05 today: tuning the You tab's edge chart must never change when
   the Course tab claims a hardest par type. */
export const HARDEST_MIN_GAP = 0.05;

export interface ParTypeRowInput {
  par: number;
  holes: number;
  perHole: number;
}

/** PTR1.1/PTR1.3 — clamped 0–100 position of a value on the fixed scale. */
export const parTypeTrackPct = (value: number): number =>
  Math.min(100, Math.max(0, ((value - PAR_SCALE_MIN) / (PAR_SCALE_MAX - PAR_SCALE_MIN)) * 100));

/** The level tick's position: where zero sits on the fixed scale. */
export const LEVEL_TICK_PCT = parTypeTrackPct(0);

/** PTR1.4 — hardest first; an exact tie goes to the type with more holes,
 *  then to the lower par number. */
export function orderParTypes(rows: ParTypeRowInput[]): ParTypeRowInput[] {
  return [...rows].sort((a, b) => b.perHole - a.perHole || b.holes - a.holes || a.par - b.par);
}

/** PTR1.5 — the par type that may take red, or null when the leader's gap
 *  over the second is under HARDEST_MIN_GAP (a near-tie claims no hardest). */
export function hardestParType(ordered: ParTypeRowInput[]): ParTypeRowInput | null {
  const [top, second] = ordered;
  if (!top) return null;
  if (second && top.perHole - second.perHole < HARDEST_MIN_GAP) return null;
  return top;
}

const DefendsPar: React.FC<{ courseId: string; courseName?: string | null }> = ({ courseId, courseName }) => {
  const { t } = useTranslation('courses');
  const [searchParams, setSearchParams] = useSearchParams();
  const { data } = useCourseHoleAnalysis(courseId);
  const sample = Number(data?.total_rounds ?? 0);
  const v = React.useMemo(() => (sample > 0 ? deriveCourseVerdict(data?.holes) : null), [data?.holes, sample]);
  const open = searchParams.get('sheet') === 'holes';

  const setSheet = (on: boolean) => {
    const next = new URLSearchParams(searchParams);
    if (on) next.set('sheet', 'holes');
    else next.delete('sheet');
    setSearchParams(next, { replace: true });
  };

  if (!v) return null;

  const max = Math.max(0.01, ...v.holes.map((h) => Math.max(0, h.avg_to_par)));
  const parRows = orderParTypes(v.parTypes);
  const hardestPar = hardestParType(parRows)?.par ?? null;
  const labelled = new Set([v.holes[0].hole_no, 9, v.easiest.hole_no, v.hardest.hole_no]);

  let nineLine: React.ReactNode = null;
  if (v.front != null && v.back != null) {
    const d = v.back - v.front;
    const hardestClause =
      v.hardest.hole_no === v.holes[v.holes.length - 1].hole_no
        ? t('courseDetail.defends.lastHardest', { hole: v.hardest.hole_no })
        : t('courseDetail.defends.hardest', { hole: v.hardest.hole_no });
    nineLine =
      Math.abs(d) < 0.05 ? (
        <>
          {t('courseDetail.defends.ninesLevel')}
          <B>{hardestClause}</B>.
        </>
      ) : (
        <>
          {t(d > 0 ? 'courseDetail.defends.backCosts' : 'courseDetail.defends.frontCosts')}
          <B>{t('courseDetail.defends.shotsMore', { shots: Math.abs(d).toFixed(1) })}</B>
          {t(d > 0 ? 'courseDetail.defends.thanFront' : 'courseDetail.defends.thanBack')}
          <B>{hardestClause}</B>.
        </>
      );
  }

  const o = v.outcomes;
  const bands = o
    ? [
        { key: 'birdie', n: o.birdie, color: RAMP_TOPAR.birdie, label: t('holes.preview.legendBirdie') },
        { key: 'par', n: o.par, color: RAMP_TOPAR.par, label: t('holes.preview.legendPar') },
        { key: 'bogey', n: o.bogey, color: RAMP_TOPAR.bogey, label: t('holes.preview.legendBogey') },
        { key: 'double', n: o.double, color: RAMP_TOPAR.double, label: t('holes.preview.legendDouble') },
      ]
    : [];

  return (
    <AboutSection kicker={t('courseDetail.defends.kicker')} title={t('courseDetail.defends.title')}>
      <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: A.MUTE, fontFamily: SANS, ...FIGS }}>
        {t('courseDetail.defends.lede', { count: sample, rounds: formatNumber(sample) })}
      </p>

      <div style={{ marginTop: 14 }} aria-hidden="true">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${v.holes.length}, minmax(0, 1fr))`,
            gap: 4,
            alignItems: 'end',
            height: CHART_H,
            borderBottom: `1px solid ${A.HAIRLINE}`,
          }}
        >
          {v.holes.map((h) => (
            <span
              key={h.hole_no}
              data-testid={`defends-bar-${h.hole_no}`}
              style={{
                display: 'block',
                height: Math.max(2, (Math.max(0, h.avg_to_par) / max) * CHART_H),
                borderRadius: 1.5,
                background:
                  h.hole_no === v.hardest.hole_no ? A.RED : h.hole_no === v.easiest.hole_no ? A.GREEN : BAR_NEUTRAL,
              }}
            />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${v.holes.length}, minmax(0, 1fr))`, gap: 4, marginTop: 6 }}>
          {v.holes.map((h) => {
            const hi = h.hole_no === v.hardest.hole_no ? A.RED : h.hole_no === v.easiest.hole_no ? A.GREEN : null;
            return (
              <span
                key={h.hole_no}
                style={{ textAlign: 'center', fontSize: 8.5, fontWeight: hi ? 800 : 700, color: hi ?? A.FAINT, ...FIGS }}
              >
                {labelled.has(h.hole_no) ? h.hole_no : ''}
              </span>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 13 }}>
        {[
          ...(v.front != null && v.back != null
            ? [
                { v: signed(v.front), l: t('courseDetail.defends.front') },
                { v: signed(v.back), l: t('courseDetail.defends.back') },
              ]
            : []),
          { v: signed(v.hardest.avg_to_par), l: t('courseDetail.defends.worst') },
        ].map((c) => (
          <div key={c.l} style={{ flex: 1, border: `1px solid ${A.HAIRLINE}`, borderRadius: 10, padding: 10 }}>
            <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.03em', color: A.INK, ...FIGS }}>{c.v}</div>
            <div style={{ ...SMALL_LABEL, lineHeight: 1, marginTop: 4 }}>{c.l}</div>
          </div>
        ))}
      </div>
      {nineLine ? <Said>{nineLine}</Said> : null}

      <div style={{ ...SMALL_LABEL, marginTop: 18 }}>{t('courseDetail.defends.parScaleLabel')}</div>
      <div style={{ marginTop: 10 }}>
        {parRows.map((p) => {
          const amber = p.par === hardestPar;
          return (
            <div
              key={p.par}
              data-testid={`par-type-row-${p.par}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '74px minmax(0, 1fr) 58px',
                alignItems: 'center',
                gap: 11,
                padding: '7px 0',
                fontFamily: SANS,
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: A.INK, lineHeight: 1.2 }}>
                  {t('courseDetail.verdict.parType', { par: p.par })}
                </div>
                <div style={{ fontSize: 9.5, fontWeight: 400, color: A.DIM, marginTop: 2, ...FIGS }}>
                  {t('courseDetail.defends.parHoles', { count: p.holes, holes: formatNumber(p.holes) })}
                </div>
              </div>
              <div style={{ position: 'relative', height: 3, borderRadius: 2, background: A.TRACK }}>
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: `${LEVEL_TICK_PCT}%`,
                    top: -4,
                    width: 1,
                    height: 11,
                    background: 'rgba(255,255,255,0.22)',
                  }}
                />
                <span
                  data-testid={`par-type-dot-${p.par}`}
                  style={{
                    position: 'absolute',
                    left: `${parTypeTrackPct(p.perHole)}%`,
                    top: '50%',
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: amber ? A.RED : 'rgba(248,250,252,0.62)',
                  }}
                />
              </div>
              <div
                data-testid={`par-type-figure-${p.par}`}
                style={{
                  textAlign: 'right',
                  fontSize: 15,
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  color: amber ? A.RED : A.INK,
                  ...FIGS,
                }}
              >
                {signed(p.perHole, 2)}
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 3,
          paddingLeft: 85,
          paddingRight: 69,
          fontSize: 9.5,
          color: A.FAINT,
          fontFamily: SANS,
          ...FIGS,
        }}
      >
        <span>{signed(PAR_SCALE_MIN, 2)}</span>
        <span>{t('courseDetail.defends.parScaleLevel')}</span>
        <span>{signed(PAR_SCALE_MAX, 2)}</span>
      </div>

      {o ? (
        <>
          <div style={{ display: 'flex', height: 7, borderRadius: 999, overflow: 'hidden', marginTop: 16 }} aria-hidden="true">
            {bands.map((b) => (
              <div key={b.key} style={{ width: `${(b.n / o.total) * 100}%`, background: b.color }} />
            ))}
          </div>
          <div style={{ display: 'flex', marginTop: 9 }}>
            {bands.map((b, i) => (
              <div key={b.key} style={{ flex: 1, textAlign: i >= 2 ? 'right' : 'left' }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: b.key === 'par' ? A.INK : b.color, ...FIGS }}>
                  {sharePct(b.n, o.total)}%
                </div>
                <div style={{ ...SMALL_LABEL, lineHeight: 1, marginTop: 2 }}>{b.label}</div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      <button
        type="button"
        onClick={() => {
          analyticsEvents.track('course_all_18_holes', { course_id: courseId, holes: v.holes.length });
          setSheet(true);
        }}
        style={{ display: 'block', marginTop: 9, padding: 0, background: 'transparent', border: 0, cursor: 'pointer', fontFamily: SANS, fontSize: 12, fontWeight: 700, color: A.AMBER }}
      >
        {t('courseDetail.plays.allHoles', { count: v.holes.length, holes: formatNumber(v.holes.length) })} ›
      </button>
      <AllHolesSheet open={open} onClose={() => setSheet(false)} courseId={courseId} courseName={courseName ?? ''} />
    </AboutSection>
  );
};

export default DefendsPar;
