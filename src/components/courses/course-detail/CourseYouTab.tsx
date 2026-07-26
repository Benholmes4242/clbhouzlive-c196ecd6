/**
 * CourseYouTab — the personal half of the course detail page.
 *
 * Three states:
 *   A. Played        — your journey, your review, your hole-level layer.
 *   B. Connected, not played  — status toggle + "no rounds here yet" nudge.
 *   C. Not connected — connect-handicap ghost with course-specific copy.
 * Logged out gets a sign-in nudge.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWhsConnection } from '@/lib/whs/hooks';
import { useCoursePersonalStatus } from '@/hooks/useCoursePersonalStatus';
import { useCourseHoleAnalysis } from '@/hooks/gam/useCourseHoleAnalysis';
import { PersonalSection } from '@/components/courses/phase5';
import CourseHolesTab from '@/features/courses/components/holes/CourseHolesTab';
import ConnectGhostPrompt from '@/components/handicap/ConnectGhostPrompt';
import { HolesGhost } from '@/components/handicap/ConnectGhostPreviews';
import { AMBER, INK, INK_MUTE, SLATE_50, HAIRLINE_INK_7 } from '@/features/courses/_shared/tokens';

interface Props {
  courseId: string;
  courseName: string;
}

const Divider = () => (
  <div style={{ height: '0.5px', background: HAIRLINE_INK_7, margin: '16px' }} />
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

export const CourseYouTab: React.FC<Props> = ({ courseId, courseName }) => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { data: connection } = useWhsConnection(user?.id);
  const { status } = useCoursePersonalStatus(courseId);
  const { data: analysis } = useCourseHoleAnalysis(courseId);

  const roundsHere = analysis?.total_rounds ?? 0;
  const roundsLine = roundsHere > 0
    ? `${roundsHere.toLocaleString()} rounds have been logged at ${courseName}.`
    : `Be the first to log a round at ${courseName}.`;

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

  // State C — no handicap connection.
  if (!connection) {
    return wrap(
      <>
        <PersonalSection courseId={courseId} courseName={courseName} />
        <Divider />
        <ConnectGhostPrompt
          surface="holes"
          ghost={<HolesGhost />}
          onConnect={() => navigate('/handicap')}
          dismissible={false}
          headlineOverride={`See how you play ${courseName}`}
          bodyOverride={`${roundsLine} Connect your handicap record to unlock your scoring average, your toughest hole and where you sit against the field.`}
        />
      </>,
    );
  }

  const hasPlayed = status.status === 'played';

  // State B — connected, but nothing logged here yet.
  if (!hasPlayed) {
    return wrap(
      <>
        <PersonalSection courseId={courseId} courseName={courseName} />
        <Divider />
        <Notice
          title="No rounds here yet"
          body={`${roundsLine} Once a round at ${courseName} lands on your record, your hole-by-hole scoring and your standing against the field appear here.`}
        />
      </>,
    );
  }

  // State A — played.
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
