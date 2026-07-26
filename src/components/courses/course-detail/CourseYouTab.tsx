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
import { Crown } from 'lucide-react';
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
import {
  AMBER, INK, INK_MUTE, INK_FAINT, SLATE_50, HAIRLINE_INK_7, INK_TINT_04, INK_TINT_06,
} from '@/features/courses/_shared/tokens';

interface Props {
  courseId: string;
  courseName: string;
}

const Divider = () => (
  <div style={{ height: '0.5px', background: HAIRLINE_INK_7, margin: '16px' }} />
);

const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
};

const Eyebrow: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = AMBER }) => (
  <div
    style={{
      fontSize: 10,
      fontWeight: 800,
      letterSpacing: '0.11em',
      textTransform: 'uppercase',
      color,
      marginBottom: 6,
    }}
  >
    {children}
  </div>
);

const Notice: React.FC<{ title: string; body: string; cta?: { label: string; onClick: () => void } }> = ({
  title, body, cta,
}) => (
  <div
    style={{
      margin: '0 16px',
      background: '#FFFFFF',
      border: `1px solid ${HAIRLINE_INK_7}`,
      borderRadius: 16,
      padding: 16,
    }}
  >
    <div style={{ fontSize: 15, fontWeight: 800, color: INK, letterSpacing: '-0.01em' }}>{title}</div>
    <p style={{ margin: '6px 0 0', fontSize: 13, color: INK_MUTE, lineHeight: 1.55 }}>{body}</p>
    {cta && (
      <button
        type="button"
        onClick={cta.onClick}
        style={{
          marginTop: 12,
          width: '100%',
          minHeight: 44,
          padding: '11px 0',
          borderRadius: 14,
          background: 'rgba(247,147,30,0.06)',
          border: '1.5px solid rgba(247,147,30,0.2)',
          fontSize: 13,
          fontWeight: 700,
          color: AMBER,
          cursor: 'pointer',
        }}
      >
        {cta.label}
      </button>
    )}
  </div>
);

/** Warm-wash hook card shared by states B and C. */
const HookCard: React.FC<{
  headline: string;
  body: string;
  cta?: { label: string; onClick: () => void };
  footnote?: string;
}> = ({ headline, body, cta, footnote }) => (
  <div
    style={{
      margin: '0 16px',
      background: 'rgba(247,147,30,0.06)',
      border: '1px solid rgba(247,147,30,0.22)',
      borderRadius: 16,
      padding: 16,
    }}
  >
    <Eyebrow>Your game here</Eyebrow>
    <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.03em', color: INK, lineHeight: 1.2 }}>
      {headline}
    </div>
    <p style={{ margin: '6px 0 0', fontSize: 13.5, color: INK_MUTE, lineHeight: 1.5 }}>{body}</p>
    {cta && (
      <button
        type="button"
        onClick={cta.onClick}
        style={{
          marginTop: 14,
          width: '100%',
          minHeight: 44,
          padding: '13px 0',
          background: AMBER,
          color: '#FFFFFF',
          border: 'none',
          borderRadius: 13,
          fontSize: 14,
          fontWeight: 800,
          cursor: 'pointer',
        }}
      >
        {cta.label}
      </button>
    )}
    {footnote && (
      <div style={{ marginTop: 10, fontSize: 12, fontWeight: 600, color: INK_FAINT, textAlign: 'center' }}>
        {footnote}
      </div>
    )}
  </div>
);

/** State C block 2 - no invented figures, dashes and ranges only. */
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
    <div
      style={{
        margin: '0 16px',
        background: '#FFFFFF',
        border: `1px solid ${HAIRLINE_INK_7}`,
        borderRadius: 16,
        padding: 16,
      }}
    >
      <Eyebrow color={INK_FAINT}>What you'd unlock</Eyebrow>
      <div style={{ fontSize: 15, fontWeight: 800, color: INK, letterSpacing: '-0.01em', marginBottom: 12 }}>
        Your side of this course
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rows.map((r) => (
          <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              aria-hidden="true"
              style={{ width: 32, height: 32, borderRadius: 10, background: INK_TINT_06, flexShrink: 0 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: INK }}>{r.label}</div>
              <div style={{ marginTop: 5, height: 4, borderRadius: 999, background: INK_TINT_04 }}>
                <div style={{ width: '45%', height: '100%', borderRadius: 999, background: 'rgba(15,23,42,0.12)' }} />
              </div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: INK_FAINT, whiteSpace: 'nowrap' }}>{r.hint}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

/** Blocks 3 (state C) and 2 (state B). */
const UpForGrabs: React.FC<{
  recordLabel: string | null;
  holderName: string | null;
  unclaimedCount: number;
}> = ({ recordLabel, holderName, unclaimedCount }) => (
  <div
    style={{
      margin: '0 16px',
      background: '#FFFFFF',
      border: `1px solid ${HAIRLINE_INK_7}`,
      borderRadius: 16,
      padding: 16,
    }}
  >
    <Eyebrow color={INK_FAINT}>Up for grabs</Eyebrow>
    {recordLabel ? (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <Crown size={16} color={AMBER} strokeWidth={2.4} style={{ marginTop: 2, flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: INK }}>
            {`Course record: ${recordLabel}${holderName ? ` by ${holderName}` : ''}`}
          </div>
          {unclaimedCount > 0 && (
            <div style={{ marginTop: 4, fontSize: 13, color: INK_MUTE, lineHeight: 1.5 }}>
              {`${unclaimedCount} more crowns here have never been claimed`}
            </div>
          )}
        </div>
      </div>
    ) : (
      <div style={{ fontSize: 14, fontWeight: 700, color: INK, lineHeight: 1.5 }}>
        No course record yet - it is there for the taking.
      </div>
    )}
  </div>
);

export const CourseYouTab: React.FC<Props> = ({ courseId, courseName }) => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { data: connection } = useWhsConnection(user?.id);
  const { status, setWantToPlay, isUpdating } = useCoursePersonalStatus(courseId);
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

  const hasPlayed = status.status === 'played';
  const emptyState: 'not_connected' | 'not_played' | null = !user
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
            status.status === 'want_to_play'
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
      <Divider />
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
