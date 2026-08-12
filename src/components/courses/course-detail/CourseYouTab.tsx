/**
 * CourseYouTab - the personal half of the course detail page.
 *
 * Three states:
 *   A. Played        - your journey, your review, your hole-level layer.
 *   B. Connected, not played  - course-specific hook card + up for grabs.
 *   C. Not connected - hook card, what you'd unlock, up for grabs.
 * Logged out gets a sign-in nudge.
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
import { A, EmptyState, FIGS, LABEL, Panel } from '@/features/courses/components/holes/analytical/tokens';

interface Props {
  courseId: string;
  courseName: string;
}

const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
};

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

/** State C block 2 - no invented figures, ranges only. */
const UnlockList: React.FC<{ unclaimedCount: number }> = ({ unclaimedCount }) => {
  const rows: { label: string; hint: string }[] = [
    { label: 'Your average score here', hint: '+ -' },
    { label: 'Your most damaging holes', hint: '1-18' },
    { label: "Holes you've birdied", hint: '- of 18' },
    { label: 'Your line against the field', hint: '18 holes' },
  ];
  if (unclaimedCount > 0) {
    rows.push({ label: 'Crowns you could take', hint: `${unclaimedCount} open` });
  }

  return (
    <div style={{ padding: '0 16px' }}>
      <Panel>
        <div style={{ ...LABEL, marginBottom: 12 }}>What you'd unlock</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: A.INK, letterSpacing: '-0.01em', marginBottom: 14 }}>
          Your side of this course
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {rows.map((r) => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: A.INK }}>{r.label}</div>
              <div style={{ ...FIGS, fontSize: 12.5, fontWeight: 700, color: A.DIM, whiteSpace: 'nowrap' }}>
                {r.hint}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
};

/** Blocks 3 (state C) and 2 (state B). */
const UpForGrabs: React.FC<{
  recordLabel: string | null;
  holderName: string | null;
  unclaimedCount: number;
}> = ({ recordLabel, holderName, unclaimedCount }) => (
  <div style={{ padding: '0 16px' }}>
    <Panel>
      <div style={{ ...LABEL, marginBottom: 10 }}>Up for grabs</div>
      {recordLabel ? (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: A.INK }}>
            {`Course record: ${recordLabel}${holderName ? ` by ${holderName}` : ''}`}
          </div>
          {unclaimedCount > 0 && (
            <div style={{ marginTop: 4, fontSize: 13, color: A.MUTE, lineHeight: 1.5 }}>
              {`${unclaimedCount} more crowns here have never been claimed`}
            </div>
          )}
        </div>
      ) : (
        <div style={{ fontSize: 14, fontWeight: 700, color: A.INK, lineHeight: 1.5 }}>
          No course record yet - it is there for the taking.
        </div>
      )}
    </Panel>
  </div>
);

export const CourseYouTab: React.FC<Props> = ({ courseId, courseName }) => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { data: connection, isLoading: connectionLoading } = useWhsConnection(user?.id);
  const { status, isLoading: statusLoading, setWantToPlay, isUpdating } =
    useCoursePersonalStatus(courseId);
  const { data: analysis } = useCourseHoleAnalysis(courseId);
  const { courseRecord, unclaimedCount } = useCourseRecordSummary(courseId, user?.id ?? null);

  // fieldAvg: sum of the per-hole field averages to par. beastHole: the hole
  // with the highest field average. beastPct: share of the field over par on
  // that hole, derived from its scoring distribution.
  const { fieldAvg, beastHoleLabel, beastPct } = React.useMemo(() => {
    const holes = analysis?.available ? (analysis.holes ?? []) : [];
    if (holes.length === 0) return { fieldAvg: null as string | null, beastHoleLabel: null as string | null, beastPct: null as number | null };
    const total = holes.reduce((sum, h) => sum + (Number.isFinite(h.avg_to_par) ? h.avg_to_par : 0), 0);
    const beast = holes.reduce((a, b) => (b.avg_to_par > a.avg_to_par ? b : a), holes[0]);
    const d = beast.dist;
    const played = d
      ? (d.ace ?? 0) + (d.albatross ?? 0) + (d.eagle ?? 0) + (d.birdie ?? 0) + (d.par ?? 0) + (d.bogey ?? 0) + (d.double ?? 0)
      : 0;
    const over = d ? (d.bogey ?? 0) + (d.double ?? 0) : 0;
    return {
      fieldAvg: fmtToPar(total, 1),
      beastHoleLabel: `${ordinal(beast.hole_no)}`,
      beastPct: played > 0 ? Math.round((over / played) * 100) : null,
    };
  }, [analysis]);

  const hasPlayed = status?.status === 'played';
  const emptyState: 'not_connected' | 'not_played' | null = !user || statusLoading || !status
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
    <div className="animate-in fade-in duration-200" style={{ background: SLATE_50, paddingBottom: 32 }}>
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

  // State C - no handicap connection.
  if (!connection) {
    return wrap(
      <div style={{ paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <HookCard
          headline={fieldAvg ? `The field plays this course to ${fieldAvg}` : `See how you play ${courseName}`}
          body="Where do you sit? Connect your handicap and every round you have ever posted here appears straight away, going back years."
          cta={{
            label: 'Connect your handicap',
            onClick: () => {
              analyticsEvents.track('course_connect_cta_tapped', { course_id: courseId, source: 'you_tab' });
              navigate('/handicap');
            },
          }}
          footnote="Takes about 30 seconds with your England Golf login"
        />
        <UnlockList unclaimedCount={unclaimedCount} />
        <UpForGrabs recordLabel={recordLabel} holderName={holderName} unclaimedCount={unclaimedCount} />
      </div>,
    );
  }

  // State B - connected, but nothing logged here yet.
  if (!hasPlayed) {
    const body = fieldAvg && beastHoleLabel && beastPct !== null
      ? `The field plays it to ${fieldAvg}, and the ${beastHoleLabel} beats ${beastPct}% of everyone who walks up it. Post a round here and this page fills in on its own.`
      : fieldAvg
        ? `The field plays it to ${fieldAvg}. Post a round here and this page fills in on its own.`
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
