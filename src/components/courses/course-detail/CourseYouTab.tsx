/**
 * CourseYouTab - the personal half of the course detail page.
 *
 * Three states:
 *   A. Played        - your journey, your review, your hole-level layer.
 *   B. Connected, not played  - course-specific hook card + up for grabs.
 *   C. Not connected - the field's real shape, with a channel where yours belongs.
 * Logged out gets a sign-in nudge.
 *
 * STATE C RULE (BRIEF_YOU_TAB_EMPTY_MISSING_LINE §0, replacing the former
 * "ranges only" UnlockList): the empty state shows REAL FIELD DATA with a drawn
 * CHANNEL where the member's own line would sit. It never renders a
 * value-shaped placeholder ("+ -", "- of 18"): a placeholder cannot be told
 * apart from a figure that failed to load, and absent values render nothing.
 * Nothing on this screen is invented, and nothing implies the member has
 * played here.
 *
 * ASCII only.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWhsConnection } from '@/lib/whs/hooks';
import { useCoursePersonalStatus } from '@/hooks/useCoursePersonalStatus';
import { useCourseHoleAnalysis } from '@/hooks/gam/useCourseHoleAnalysis';
import { PersonalSection } from '@/components/courses/phase5';
import CourseHolesTab from '@/features/courses/components/holes/CourseHolesTab';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { fmtToPar } from '@/features/courses/_shared/holes/formatToPar';
import { formatLegendValueCompact } from '@/lib/gam/visuals';
import { useCourseRecordSummary } from './useCourseRecordSummary';
import { SLATE_50 } from '@/features/courses/_shared/tokens';
import { Skeleton } from '@/components/ui/skeleton';
import { ParTypeBars } from '@/features/courses/components/holes/analytical/ParTypeBars';
import { BAR_RADIUS } from '@/features/courses/components/holes/analytical/tokens';
import {
  A,
  DIFFICULTY_HARD_HEX,
  EmptyState,
  FIGS,
  Hairline,
  KICKER,
  LABEL,
  Panel,
  SANS,
  bizFigure,
  difficultyRampColor,
  difficultyRampStop,
} from '@/features/courses/components/holes/analytical/tokens';

interface Props {
  courseId: string;
  courseName: string;
}

const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
};

/**
 * NOISE FLOOR for the field chart. Under this many rounds the per-hole spread
 * is one or two members' bad afternoons drawn as a course shape, so the chart
 * and its channel are withheld and the hero keeps its headline alone. The
 * REFERENCE panel is unaffected: a stated figure carries its own sample size.
 */
const CHART_ROUNDS_FLOOR = 5;

/** Labels never take the DIM tone on this screen (§7). */
const LABEL_MUTE: React.CSSProperties = { ...LABEL, color: A.MUTE };

const Notice: React.FC<{ title: string; body: string; cta?: { label: string; onClick: () => void } }> = ({
  title, body, cta,
}) => (
  <div style={{ padding: '0 16px' }}>
    <EmptyState title={title} body={body} primary={cta ? { label: cta.label, onClick: cta.onClick } : undefined} />
  </div>
);

/** Course-specific hook shared by states B and C - plain panel, INK primary. */
const HookCard: React.FC<{
  headline: string;
  body: string;
  cta?: { label: string; onClick: () => void };
  footnote?: string;
}> = ({ headline, body, cta, footnote }) => (
  <div style={{ padding: '0 16px' }}>
    <EmptyState
      kicker="Your game here"
      title={headline}
      body={body}
      primary={cta ? { label: cta.label, onClick: cta.onClick } : undefined}
      footnote={footnote}
    />
  </div>
);

interface FieldHole {
  holeNo: number;
  par: number;
  toPar: number;
}

interface FieldShape {
  holes: FieldHole[];
  total: number;
  fieldAvg: string;
  rounds: number;
  hardest: FieldHole;
  easiest: FieldHole;
  /** True when every hole shares one average - the chart is flat and labels neither. */
  flat: boolean;
  beastHoleLabel: string;
  beastPct: number | null;
  parRows: { par: number; count: number; mean: number }[];
}

/**
 * THE EIGHTEEN-HOLE FIELD CHART (§2.1). One bar per hole from the field's
 * avg_to_par, on the demanding ramp, SIX DISCRETE STOPS - the stop is chosen by
 * the hole's normalised position on the course's own spread and then snapped, so
 * adjacent holes never read as an interpolation. Hardest and easiest carry their
 * own figures above their own bars, derived as max and min; on a tie the first
 * only; a flat chart labels neither.
 */
const FieldChart: React.FC<{ shape: FieldShape }> = ({ shape }) => {
  const { holes, hardest, easiest, flat } = shape;
  const values = holes.map((h) => h.toPar);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min;

  return (
    <div style={{ width: '100%' }}>
      {/* Figure row: only the two extremes speak, and only when they differ. */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 13, marginBottom: 4 }}>
        {holes.map((h) => {
          const isHardest = !flat && h.holeNo === hardest.holeNo;
          const isEasiest = !flat && h.holeNo === easiest.holeNo;
          if (!isHardest && !isEasiest) return <div key={h.holeNo} style={{ flex: 1 }} />;
          return (
            <div
              key={h.holeNo}
              style={{
                flex: 1,
                textAlign: 'center',
                ...FIGS,
                /* AXIS, STATED EXCEPTION (floor 10): a figure pinned to the
                   hardest / easiest column, not a line of language. */
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '-0.03em',
                /* §2.2 - the to-par law, not the difficulty ramp: the ramp is
                   already carried by the bar beneath this figure. */
                color: A.INK,
                whiteSpace: 'nowrap',
                lineHeight: 1,
              }}
            >
              {fmtToPar(h.toPar, 1)}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 62 }}>
        {holes.map((h) => {
          const t = span > 0 ? (h.toPar - min) / span : 0.5;
          const height = span > 0 ? 10 + Math.round(t * 52) : 28;
          return (
            <div
              key={h.holeNo}
              style={{
                flex: 1,
                height,
                borderRadius: BAR_RADIUS,
                background: span > 0 ? difficultyRampColor(t) : difficultyRampStop(2),
              }}
            />
          );
        })}
      </div>

      {/* §4.2 - PAR owns a separate row above the datum so it cannot collide
          with the 1 / 9 / 18 baseline labels. */}
      <div style={{ position: 'relative', height: 10, marginTop: 1 }}>
        <span
          style={{
            ...FIGS,
            position: 'absolute',
            left: 0,
            top: 0,
            color: A.DIM,
            fontSize: 8.5,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          PAR
        </span>
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 24,
            right: 0,
            bottom: 0,
            height: 1,
            background: 'rgba(255,255,255,0.20)',
          }}
        />
      </div>

      {/* §4.1 - 1, 9 and 18. Eighteen numerals under an
          eighteen-bar strip is a second chart competing with the first. */}
      <div style={{ display: 'flex', gap: 2, marginTop: 5, alignItems: 'baseline' }}>
        {holes.map((h, i) => {
          const shown = i === 0 || i === 8 || i === holes.length - 1;
          const isExtreme = !flat && (h.holeNo === hardest.holeNo || h.holeNo === easiest.holeNo);
          if (!shown) return <div key={h.holeNo} style={{ flex: 1 }} />;
          return (
            <div
              key={h.holeNo}
              style={{
                flex: 1,
                textAlign: 'center',
                ...FIGS,
                /* AXIS, STATED EXCEPTION (floor 10): hole numbers along the
                   strip are coordinates and stay quiet. */
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.02em',
                lineHeight: 1,
                color: isExtreme ? A.INK : A.MUTE,
              }}
            >
              {h.holeNo}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * THE CHANNEL (§2.2). A SOLID DASHED STROKE on the plain surface - not a tint of
 * the ramp, not a low-opacity fill, not a blurred ghost. UNSTARTED IS ITS OWN
 * STATE, not a weaker version of started, the same rule that governs the
 * unclaimed plates on the Champions gate. It renders only under a drawn line.
 */
const Channel: React.FC = () => (
  <div style={{ width: '100%' }}>
    <div
      style={{
        height: 34,
        borderRadius: 4,
        border: `1px dashed ${A.MUTE}`,
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span style={{ ...LABEL_MUTE, letterSpacing: '0.16em' }}>Your line here</span>
    </div>
  </div>
);

/**
 * STATE C HERO (§2). State C gets its own hero rather than bending HookCard,
 * which stays exactly as state B needs it.
 */
const FieldHero: React.FC<{
  courseName: string;
  shape: FieldShape | null;
  showChart: boolean;
  onConnect: () => void;
}> = ({ courseName, shape, showChart, onConnect }) => (
  <div style={{ padding: '0 16px' }}>
    <Panel>
      <div style={{ ...KICKER, marginBottom: 12 }}>Your game here</div>

      {shape ? (
        <>
          {/* §2.2 - a to-par figure takes the to-par law: over par is ink. */}
          <div style={{ ...bizFigure(46, A.INK), marginBottom: 6 }}>{shape.fieldAvg}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: A.INK, letterSpacing: '-0.01em' }}>
            {`What the field plays ${courseName} to`}
          </div>
          <p style={{ margin: '8px 0 0', fontSize: 13, fontWeight: 400, lineHeight: 1.55, color: A.MUTE }}>
            {`Across ${shape.rounds} ${shape.rounds === 1 ? 'round' : 'rounds'} posted here. Connect your handicap and every round you have already posted at this course comes across, going back years.`}
          </p>
        </>
      ) : (
        <>
          <div style={{ fontSize: 16, fontWeight: 700, color: A.INK, lineHeight: 1.25 }}>
            {`See how you play ${courseName}`}
          </div>
          <p style={{ margin: '8px 0 0', fontSize: 13, fontWeight: 400, lineHeight: 1.55, color: A.MUTE }}>
            Connect your handicap and every round you have already posted at this course comes across, going back years.
          </p>
        </>
      )}

      {shape && showChart && (
        <div style={{ marginTop: 18 }}>
          <div style={{ ...LABEL_MUTE, marginBottom: 8 }}>The field, hole by hole</div>
          <FieldChart shape={shape} />
          <div style={{ marginTop: 10 }}>
            <Channel />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onConnect}
        style={{
          marginTop: 18,
          width: '100%',
          border: 'none',
          background: A.INK,
          color: A.PANEL,
          borderRadius: 999,
          padding: '13px 22px',
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          fontFamily: SANS,
          cursor: 'pointer',
        }}
      >
        Connect your handicap
      </button>
      <div style={{ marginTop: 8, textAlign: 'center', fontSize: 12, fontWeight: 500, color: A.MUTE }}>
        About 30 seconds with your official WHS handicap
      </div>
    </Panel>
  </div>
);

/**
 * THE REFERENCE PANEL (§3), replacing UnlockList. Every figure is the FIELD'S
 * and every one is true. There is no member figure on this screen, so the
 * par-type rows render with the field ALONE - no empty amber slot where a tick
 * would go, because a missing value is not drawn.
 *
 * RECONCILIATION ASSERT (§3): the par-type means are unweighted means of the
 * per-hole field averages within each par type, so
 *   sum(mean_p * count_p) == sum over all holes of avg_to_par == the headline
 * exactly, by construction. A dev-only check below fails loudly on drift.
 */
const ReferencePanel: React.FC<{ shape: FieldShape }> = ({ shape }) => {
  const { fieldAvg, rounds, hardest, easiest, flat, parRows, total } = shape;

  if (import.meta.env.DEV && parRows.length > 0) {
    const recomposed = parRows.reduce((s, r) => s + r.mean * r.count, 0);
    if (Math.abs(recomposed - total) > 0.005) {
      // eslint-disable-next-line no-console
      console.error('[CourseYouTab] par-type rows do not reconcile with the field headline', {
        recomposed, total,
      });
    }
  }

  const rows: { label: string; figure: string; tone: string; sub?: string }[] = [];
  rows.push({
    label: 'Shots over par a round',
    figure: fieldAvg,
    /* §2.2 - to-par figure, to-par law. */
    tone: A.INK,
    sub: `${rounds} ${rounds === 1 ? 'round' : 'rounds'}`,
  });
  if (!flat) {
    rows.push({
      label: 'Hardest hole',
      figure: fmtToPar(hardest.toPar, 1),
      tone: A.INK,
      sub: `${ordinal(hardest.holeNo)}, par ${hardest.par}`,
    });
    rows.push({
      label: 'Easiest hole',
      figure: fmtToPar(easiest.toPar, 1),
      tone: A.INK,
      sub: `${ordinal(easiest.holeNo)}, par ${easiest.par}`,
    });
  }

  if (rows.length === 0 && parRows.length === 0) return null;

  const parMax = parRows.length > 0 ? Math.max(...parRows.map((r) => r.mean)) : 0;
  const parMin = parRows.length > 0 ? Math.min(...parRows.map((r) => r.mean)) : 0;
  const parSpan = parMax - parMin;

  return (
    <div style={{ padding: '0 16px' }}>
      <Panel>
        <div style={{ ...LABEL_MUTE, marginBottom: 14 }}>How this course plays</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          {rows.map((r) => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: A.INK, letterSpacing: '-0.01em' }}>{r.label}</div>
                {r.sub && (
                  <div style={{ marginTop: 2, fontSize: 11.5, fontWeight: 500, color: A.MUTE, ...FIGS }}>{r.sub}</div>
                )}
              </div>
              <div style={{ ...bizFigure(19, r.tone), whiteSpace: 'nowrap' }}>{r.figure}</div>
            </div>
          ))}
        </div>

        {parRows.length > 0 && (
          <>
            <Hairline style={{ margin: '16px 0 14px' }} />
            <div style={{ ...LABEL_MUTE, marginBottom: 12 }}>How each par plays</div>
            {/* §1 - ONE By-par implementation app-wide. This screen has no member
                figure, so the rows pass you: null and the amber tick is simply
                not drawn; the signed zone scale is identical to Discover's and
                the Course tab's. */}
            <ParTypeBars
              rows={parRows.map((r) => ({ par: r.par, holes: r.count, field: r.mean, you: null }))}
              fieldIsOnlyYou={false}
              density="default"
            />
          </>
        )}
      </Panel>
    </div>
  );
};

/**
 * UP FOR GRABS (§4) - blocks 3 (state C) and 2 (state B). The record gross is a
 * FIGURE with its holder beside it; the unclaimed count is its own figure in the
 * ramp's hard end. A count of zero renders no row - never "0 crowns". If
 * neither resolves the panel does not render.
 */
const UpForGrabs: React.FC<{
  recordLabel: string | null;
  holderName: string | null;
  unclaimedCount: number;
}> = ({ recordLabel, holderName, unclaimedCount }) => {
  const hasCrowns = unclaimedCount > 0;
  if (!recordLabel && !hasCrowns) return null;

  return (
    <div style={{ padding: '0 16px' }}>
      <Panel>
        <div style={{ ...LABEL_MUTE, marginBottom: 14 }}>Up for grabs</div>

        {recordLabel ? (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: A.INK, letterSpacing: '-0.01em' }}>Course record</div>
              {holderName && (
                <div
                  style={{
                    marginTop: 2,
                    fontSize: 11.5,
                    fontWeight: 500,
                    color: A.MUTE,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {holderName}
                </div>
              )}
            </div>
            <div style={{ ...bizFigure(24, A.INK), whiteSpace: 'nowrap' }}>{recordLabel}</div>
          </div>
        ) : (
          <div style={{ fontSize: 13.5, fontWeight: 700, color: A.INK, lineHeight: 1.45 }}>
            No course record yet - it is there for the taking.
          </div>
        )}

        {hasCrowns && (
          <>
            {recordLabel && <Hairline style={{ margin: '14px 0' }} />}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: recordLabel ? 0 : 14 }}>
              <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: A.INK, letterSpacing: '-0.01em' }}>
                {unclaimedCount === 1 ? 'Crown never claimed' : 'Crowns never claimed'}
              </div>
              {/* A COUNT OF UNCLAIMED CROWNS CARRIES NO SCORING DIRECTION, so it
                  cannot wear the under-par red. Default ink, like the record figure. */}
              <div style={{ ...bizFigure(24, A.INK), whiteSpace: 'nowrap' }}>{unclaimedCount}</div>
            </div>
          </>
        )}
      </Panel>
    </div>
  );
};

export const CourseYouTab: React.FC<Props> = ({ courseId, courseName }) => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { data: connection, isLoading: connectionLoading } = useWhsConnection(user?.id);
  const { status, isLoading: statusLoading, setWantToPlay, isUpdating } =
    useCoursePersonalStatus(courseId);
  const { data: analysis } = useCourseHoleAnalysis(courseId);
  const { courseRecord, unclaimedCount } = useCourseRecordSummary(courseId, user?.id ?? null);

  // The field's real shape, all of it from the EXISTING hole analysis query.
  // total: sum of the per-hole field averages to par (the headline).
  // hardest/easiest: max and min, first occurrence on a tie.
  // beastPct: share of the field over par on the hardest hole (state B copy).
  // parRows: unweighted mean over par per par type, which recomposes to total.
  const shape: FieldShape | null = React.useMemo(() => {
    const raw = analysis?.available ? (analysis.holes ?? []) : [];
    const holes: FieldHole[] = raw
      .filter((h) => Number.isFinite(h.avg_to_par))
      .map((h) => ({ holeNo: h.hole_no, par: h.par, toPar: h.avg_to_par }))
      .sort((a, b) => a.holeNo - b.holeNo);
    if (holes.length === 0) return null;

    const total = holes.reduce((sum, h) => sum + h.toPar, 0);
    // Strict comparisons only, so a tie keeps the FIRST hole.
    const hardest = holes.reduce((a, b) => (b.toPar > a.toPar ? b : a), holes[0]);
    const easiest = holes.reduce((a, b) => (b.toPar < a.toPar ? b : a), holes[0]);

    const beastRaw = raw.find((h) => h.hole_no === hardest.holeNo);
    const d = beastRaw?.dist;
    const played = d
      ? (d.ace ?? 0) + (d.albatross ?? 0) + (d.eagle ?? 0) + (d.birdie ?? 0) + (d.par ?? 0) + (d.bogey ?? 0) + (d.double ?? 0)
      : 0;
    const over = d ? (d.bogey ?? 0) + (d.double ?? 0) : 0;

    const byPar = new Map<number, number[]>();
    holes.forEach((h) => {
      if (!Number.isFinite(h.par) || h.par <= 0) return;
      const list = byPar.get(h.par) ?? [];
      list.push(h.toPar);
      byPar.set(h.par, list);
    });
    const parRows = Array.from(byPar.entries())
      .map(([par, vals]) => ({
        par,
        count: vals.length,
        mean: vals.reduce((s, v) => s + v, 0) / vals.length,
      }))
      .sort((a, b) => a.par - b.par);

    return {
      holes,
      total,
      fieldAvg: fmtToPar(total, 1),
      rounds: analysis?.total_rounds ?? 0,
      hardest,
      easiest,
      flat: hardest.toPar === easiest.toPar,
      beastHoleLabel: ordinal(hardest.holeNo),
      beastPct: played > 0 ? Math.round((over / played) * 100) : null,
      parRows,
    };
  }, [analysis]);

  const hasPlayed = status?.status === 'played';

  // SETTLED-STATE RULE (e8b6a14 / 9de5a23). Both empty states ASSERT AN ABSENCE,
  // so neither may render off `!isLoading`: in react-query v5 a disabled query
  // reports isLoading false while pending, having never run. The WHS connection
  // query is the second link in the chain — the ChromeIsland case taught that a
  // chained query has to be in the settled flag too, and it was missing here, so
  // "connect your handicap" could paint for a connected member on a slow network.
  const settled = Boolean(user) && !statusLoading && Boolean(status) && !connectionLoading;
  const emptyState: 'not_connected' | 'not_played' | null = !settled
    ? null
    : !connection
      ? 'not_connected'
      : !hasPlayed
        ? 'not_played'
        : null;

  // Fire once per mount of the You tab when an empty state renders.
  const emptyFired = React.useRef(false);
  React.useEffect(() => {
    if (!emptyState || emptyFired.current) return;
    emptyFired.current = true;
    analyticsEvents.track('course_you_empty_shown', { course_id: courseId, state: emptyState });
  }, [emptyState, courseId]);

  const recordLabel = courseRecord
    ? formatLegendValueCompact('lowest_gross_all_time', courseRecord.value)
    : null;
  const holderName = courseRecord?.user_display_name ?? null;

  const wrap = (children: React.ReactNode) => (
    <div className="animate-in fade-in duration-200" style={{ background: SLATE_50, paddingBottom: 8 }}>
      {children}
    </div>
  );

  if (!user) {
    return wrap(
      <div style={{ paddingTop: 20 }}>
        <Notice
          title="Your record at this course"
          body={`Sign in to track your rounds, ratings and hole-by-hole scoring at ${courseName}.`}
          cta={{ label: 'Sign in', onClick: () => navigate('/auth') }}
        />
      </div>,
    );
  }

  // An empty state is a claim about the data. While either query is in flight we
  // show a skeleton, never a statement that there is nothing here.
  if (statusLoading || !status || connectionLoading) {
    return wrap(
      <div style={{ paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ padding: '0 16px' }}>
          <Skeleton className="h-[128px] w-full rounded-[16px]" />
        </div>
      </div>,
    );
  }

  // State C - no handicap connection. Real field data, and a channel where the
  // member's own line belongs. No chart frame and no channel without a line
  // above it: with no hole data the hero stands alone.
  if (!connection) {
    const showChart = !!shape && shape.rounds >= CHART_ROUNDS_FLOOR;
    return wrap(
      <div style={{ paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <FieldHero
          courseName={courseName}
          shape={shape}
          showChart={showChart}
          onConnect={() => {
            analyticsEvents.track('course_connect_cta_tapped', { course_id: courseId, source: 'you_tab' });
            navigate('/handicap');
          }}
        />
        {shape && <ReferencePanel shape={shape} />}
        <UpForGrabs recordLabel={recordLabel} holderName={holderName} unclaimedCount={unclaimedCount} />
      </div>,
    );
  }

  // State B - connected, but nothing logged here yet.
  if (!hasPlayed) {
    const body = shape && shape.beastPct !== null
      ? `The field plays it to ${shape.fieldAvg}, and the ${shape.beastHoleLabel} beats ${shape.beastPct}% of everyone who walks up it. Post a round here and this page fills in on its own.`
      : shape
        ? `The field plays it to ${shape.fieldAvg}. Post a round here and this page fills in on its own.`
        : 'Post a round here and this page fills in on its own.';

    return wrap(
      <div style={{ paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <HookCard
          headline={`You haven't played ${courseName} yet`}
          body={body}
          cta={
            status?.status === 'want_to_play'
              ? undefined
              : { label: isUpdating ? 'Adding...' : 'Add to my list', onClick: () => setWantToPlay(true) }
          }
        />
        <UpForGrabs recordLabel={recordLabel} holderName={holderName} unclaimedCount={unclaimedCount} />
      </div>,
    );
  }

  // State A - played.
  return wrap(
    <>
      <PersonalSection courseId={courseId} courseName={courseName} />
      <CourseHolesTab
        courseId={courseId}
        section="you"
        showTeeCard={false}
        showGhost={false}
        showEmptyState={false}
      />
    </>,
  );
};

export default CourseYouTab;
