import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, MapPin, Sparkles, Target, TrendingDown } from 'lucide-react';
import { useHandicapInsights } from '@/lib/whs/insights/useHandicapInsights';
import type { SuitedCourse } from '@/lib/whs/insights/types';
import { useCounters } from '@/lib/whs/hooks';
import { analyticsEvents } from '@/utils/analyticsEvents';

const INK = '#0F172A';
const INK_70 = 'rgba(15,23,42,0.70)';
const INK_55 = 'rgba(15,23,42,0.55)';
const INK_40 = 'rgba(15,23,42,0.40)';
const INK_10 = 'rgba(15,23,42,0.10)';
const INK_06 = 'rgba(15,23,42,0.06)';
const AMBER = '#F7931E';
const AMBER_DEEP = '#C97211';
const AMBER_INK = '#9A6116';
const GREEN = '#059669';

interface Props {
  connectionId: string;
}

const EchoWaveform = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="8" width="2" height="8" rx="1" fill="white" opacity="0.7" />
    <rect x="7" y="5" width="2" height="14" rx="1" fill="white" opacity="0.85" />
    <rect x="11" y="3" width="2" height="18" rx="1" fill="white" />
    <rect x="15" y="6" width="2" height="12" rx="1" fill="white" opacity="0.85" />
    <rect x="19" y="9" width="2" height="6" rx="1" fill="white" opacity="0.7" />
  </svg>
);

const Avatar = () => (
  <div
    style={{
      width: 32,
      height: 32,
      borderRadius: 9,
      background: `linear-gradient(135deg, ${AMBER} 0%, ${AMBER_DEEP} 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}
  >
    <EchoWaveform />
  </div>
);

const SectionHeader = () => (
  <div style={{ padding: '0 12px', marginBottom: 10 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: AMBER,
          animation: 'echoInsightsPulse 1.6s ease-in-out infinite',
        }}
      />
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 1,
          color: INK_55,
        }}
      >
        ECHO INSIGHTS
      </span>
    </div>
    <p
      style={{
        margin: '4px 0 0',
        fontSize: 12,
        color: INK_55,
        lineHeight: 1.4,
      }}
    >
      Echo's read on your game, drawn from your round history.
    </p>
  </div>
);

const CourseCard: React.FC<{ course: SuitedCourse; stripe: string }> = ({
  course,
  stripe,
}) => (
  <button
    type="button"
    style={{
      width: '100%',
      display: 'flex',
      gap: 10,
      background: '#fff',
      border: `0.5px solid ${INK_10}`,
      borderRadius: 12,
      padding: 0,
      overflow: 'hidden',
      textAlign: 'left',
      cursor: 'pointer',
    }}
  >
    <div style={{ width: 3, alignSelf: 'stretch', background: stripe }} />
    <div style={{ flex: 1, padding: '10px 11px 11px 8px', minWidth: 0 }}>
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: INK,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {course.name || '—'}
      </div>
      {course.region && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            marginTop: 2,
            fontSize: 11,
            color: INK_55,
          }}
        >
          <MapPin size={10} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {course.region}
          </span>
        </div>
      )}
      <div style={{ display: 'flex', gap: 4, marginTop: 7 }}>
        <Chip label={`${course.yards || '—'} yds`} />
        <Chip label={`Slope ${course.slope || '—'}`} />
        <Chip label={`Par ${course.par || '—'}`} />
      </div>
      <p
        style={{
          margin: '7px 0 0',
          fontSize: 11,
          color: INK_70,
          fontStyle: 'italic',
          lineHeight: 1.4,
        }}
      >
        {course.rationale}
      </p>
    </div>
  </button>
);

const Chip: React.FC<{ label: string }> = ({ label }) => (
  <span
    style={{
      fontSize: 9,
      fontWeight: 700,
      color: INK_55,
      background: INK_06,
      padding: '3px 6px',
      borderRadius: 999,
      letterSpacing: 0.3,
    }}
  >
    {label}
  </span>
);

const BlockHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  caption: string;
  color: string;
}> = ({ icon, title, caption, color }) => (
  <div style={{ padding: '0 12px', marginBottom: 8 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ color, display: 'flex' }}>{icon}</span>
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 1,
          color: INK_55,
        }}
      >
        {title}
      </span>
    </div>
    <p style={{ margin: '3px 0 0', fontSize: 11, color: INK_55, lineHeight: 1.35 }}>
      {caption}
    </p>
  </div>
);

const SkeletonBubble = () => (
  <div style={{ padding: '0 12px' }}>
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 9,
          background: `linear-gradient(135deg, ${AMBER}, ${AMBER_DEEP})`,
          opacity: 0.6,
          animation: 'echoInsightsPulse 1.6s ease-in-out infinite',
        }}
      />
      <div
        style={{
          flex: 1,
          background: INK_06,
          borderRadius: '4px 14px 14px 14px',
          height: 96,
          animation: 'echoInsightsPulse 1.6s ease-in-out infinite',
        }}
      />
    </div>
  </div>
);

const SkeletonCard = () => (
  <div
    style={{
      height: 92,
      background: INK_06,
      borderRadius: 12,
      animation: 'echoInsightsPulse 1.6s ease-in-out infinite',
    }}
  />
);

export const EchoInsightsCard: React.FC<Props> = ({ connectionId }) => {
  const navigate = useNavigate();
  const { data: counters } = useCounters(connectionId);
  const { data: insights, isLoading, error } = useHandicapInsights(connectionId);

  // Edge case: fewer than 8 rounds — render nothing.
  // We use counters as a proxy: 8 counters means at least 8 rounds eligible.
  if (counters && counters.length < 8) return null;

  const handleBubbleTap = () => {
    if (!insights) return;
    const seedPrompt = `Here's your read on my game:\n\n"${insights.scoring_profile}"\n\nI'd like to ask you a follow-up about this.`;
    analyticsEvents.track('echo_contextual_tap', {
      source: 'handicap_insights_bubble',
      prompt_preview: seedPrompt.slice(0, 80),
    });
    navigate(
      `/echo?prompt=${encodeURIComponent(seedPrompt)}&returnTo=${encodeURIComponent(
        window.location.pathname,
      )}`,
    );
  };

  return (
    <section style={{ marginTop: 24, marginBottom: 24 }}>
      <style>{`
        @keyframes echoInsightsPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
      `}</style>

      <SectionHeader />

      {/* Bubble */}
      {isLoading || !insights ? (
        <SkeletonBubble />
      ) : (
        <div style={{ padding: '0 12px' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <Avatar />
            <button
              type="button"
              onClick={handleBubbleTap}
              style={{
                flex: 1,
                textAlign: 'left',
                background: '#fff',
                border: `0.5px solid ${INK_10}`,
                borderRadius: '4px 14px 14px 14px',
                padding: '10px 12px 10px 12px',
                cursor: 'pointer',
                minWidth: 0,
              }}
              className="active:scale-[0.99] transition-transform"
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: INK }}>Echo</span>
                  <span style={{ fontSize: 10, color: INK_40 }}>· just now</span>
                </div>
                <ChevronRight size={14} color={INK_40} />
              </div>
              <p
                style={{
                  margin: '6px 0 8px',
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: INK_70,
                }}
              >
                {insights.scoring_profile}
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  paddingTop: 7,
                  borderTop: `0.5px solid ${INK_10}`,
                }}
              >
                <Sparkles size={11} color={AMBER} />
                <span style={{ fontSize: 10, fontWeight: 700, color: AMBER_INK, letterSpacing: 0.3 }}>
                  Tap to ask Echo a follow-up
                </span>
              </div>
            </button>
          </div>
        </div>
      )}

      {error && (
        <div style={{ padding: '12px', fontSize: 11, color: INK_55 }}>
          Couldn't generate insights right now.
        </div>
      )}

      {/* Suited */}
      <div style={{ marginTop: 22 }}>
        <BlockHeader
          icon={<TrendingDown size={12} />}
          title="SUITED TO YOUR GAME"
          caption="Courses where Echo expects you to score well."
          color={GREEN}
        />
        <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {isLoading || !insights ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : insights.suited_courses.length === 0 ? (
            <EmptyBlock />
          ) : (
            insights.suited_courses.map((c) => (
              <CourseCard key={c.id} course={c} stripe={GREEN} />
            ))
          )}
        </div>
      </div>

      {/* Test yourself */}
      <div style={{ marginTop: 22 }}>
        <BlockHeader
          icon={<Target size={12} />}
          title="TEST YOURSELF"
          caption="Courses that will push your game and grow it."
          color={AMBER_DEEP}
        />
        <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {isLoading || !insights ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : insights.test_courses.length === 0 ? (
            <EmptyBlock />
          ) : (
            insights.test_courses.map((c) => (
              <CourseCard key={c.id} course={c} stripe={AMBER_DEEP} />
            ))
          )}
        </div>
      </div>
    </section>
  );
};

const EmptyBlock = () => (
  <div
    style={{
      padding: '14px 12px',
      fontSize: 11,
      color: INK_55,
      background: '#fff',
      border: `0.5px dashed ${INK_10}`,
      borderRadius: 12,
      textAlign: 'center',
    }}
  >
    No nearby courses match this profile yet.
  </div>
);

export default EchoInsightsCard;
