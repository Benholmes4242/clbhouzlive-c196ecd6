import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, MapPin, Sparkles, Target, TrendingDown } from 'lucide-react';
import { useHandicapInsights } from '@/lib/whs/insights/useHandicapInsights';
import type { SuitedCourse } from '@/lib/whs/insights/types';
import { useCounters } from '@/lib/whs/hooks';
import { analyticsEvents } from '@/utils/analyticsEvents';

const INK = '#0F172A';
const INK_55 = 'rgba(15,23,42,0.55)';
const INK_40 = 'rgba(15,23,42,0.40)';
const INK_10 = 'rgba(15,23,42,0.10)';
const INK_06 = 'rgba(15,23,42,0.06)';
const AMBER = '#F7931E';
const AMBER_DEEP = '#C97211';
const AMBER_INK = '#9A6116';
const GREEN = '#059669';
const FONT_SERIF = 'Georgia, "Times New Roman", serif';
const FONT_DISPLAY = 'SF Pro Display, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface Props {
  connectionId: string;
}

const EchoWaveform = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
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
      width: 44,
      height: 44,
      borderRadius: '50%',
      background: `linear-gradient(135deg, ${AMBER} 0%, ${AMBER_DEEP} 100%)`,
      boxShadow: '0 4px 16px rgba(247,147,30,0.35)',
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
  <div style={{ marginBottom: 10 }}>
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
          fontWeight: 800,
          letterSpacing: '0.22em',
          color: INK_55,
        }}
      >
        ECHO · YOUR AI CADDIE
      </span>
    </div>
  </div>
);

const CourseCard: React.FC<{ course: SuitedCourse; stripe: string; onTap: (id: string) => void }> = ({
  course,
  stripe,
  onTap,
}) => (
  <button
    type="button"
    onClick={() => onTap(course.id)}
    style={{
      width: '100%',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      background: '#fff',
      border: `0.5px solid ${INK_10}`,
      borderLeft: `2px solid ${stripe}`,
      borderRadius: 8,
      padding: '10px 12px',
      textAlign: 'left',
      cursor: 'pointer',
    }}
    className="active:scale-[0.99] transition-transform"
  >
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: INK,
          lineHeight: 1.2,
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
            marginTop: 3,
            fontSize: 10,
            color: INK_55,
          }}
        >
          <MapPin size={9} strokeWidth={2.2} />
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 220,
            }}
          >
            {course.region}
          </span>
        </div>
      )}
      {course.rationale && (
        <p
          style={{
            margin: '6px 0 0',
            fontSize: 11.5,
            lineHeight: 1.45,
            color: INK_55,
          }}
        >
          {course.rationale}
        </p>
      )}
    </div>
    <ChevronRight size={13} strokeWidth={2.2} color={INK_40} style={{ marginTop: 2, flexShrink: 0 }} />
  </button>
);

// Render **bold** markdown inline as bold spans
const renderBoldMarkdown = (text: string): React.ReactNode => {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return (
        <strong key={i} style={{ color: INK, fontWeight: 800, fontVariantNumeric: 'tabular-nums lining-nums' }}>
          {p.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={i}>{p}</React.Fragment>;
  });
};

const BlockHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  color: string;
}> = ({ icon, title, color }) => (
  <div style={{ marginBottom: 8 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ color, display: 'flex' }}>{icon}</span>
      <span
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.18em',
          color,
        }}
      >
        {title}
      </span>
    </div>
  </div>
);

const SkeletonBubble = () => (
  <div>
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${AMBER}, ${AMBER_DEEP})`,
          opacity: 0.6,
          boxShadow: '0 4px 16px rgba(247,147,30,0.35)',
          animation: 'echoInsightsPulse 1.6s ease-in-out infinite',
          flexShrink: 0,
        }}
      />
      <div
        style={{
          flex: 1,
          background: INK_06,
          borderRadius: '6px 16px 16px 16px',
          height: 120,
          animation: 'echoInsightsPulse 1.6s ease-in-out infinite',
        }}
      />
    </div>
  </div>
);

const SkeletonCard = () => (
  <div
    style={{
      height: 56,
      background: INK_06,
      borderRadius: 8,
      animation: 'echoInsightsPulse 1.6s ease-in-out infinite',
    }}
  />
);

export const EchoInsightsCard: React.FC<Props> = ({ connectionId }) => {
  const navigate = useNavigate();
  const { data: counters } = useCounters(connectionId);
  const { data: insights, isLoading, error } = useHandicapInsights(connectionId);

  // Edge case: fewer than 8 rounds — render nothing.
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

  const handleCourseTap = (courseId: string) => {
    analyticsEvents.track('echo_insights_course_tap', { course_id: courseId });
    navigate(`/courses/${courseId}`);
  };

  return (
    <section
      style={{
        background:
          'linear-gradient(180deg, rgba(247,147,30,0.06) 0%, rgba(247,147,30,0) 60%)',
        borderTop: `0.5px solid ${INK_10}`,
        padding: '32px 16px 40px',
        marginTop: 8,
      }}
    >
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
        <div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <Avatar />
            <button
              type="button"
              onClick={handleBubbleTap}
              style={{
                flex: 1,
                textAlign: 'left',
                background: '#fff',
                border: `0.5px solid ${INK_10}`,
                borderRadius: '6px 16px 16px 16px',
                boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
                padding: '10px 12px 10px 12px',
                cursor: 'pointer',
                minWidth: 0,
              }}
              className="active:scale-[0.99] transition-transform"
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: INK }}>Echo</span>
                <ChevronRight size={14} color={INK_40} />
              </div>
              <p
                style={{
                  margin: '8px 0 12px',
                  fontFamily: FONT_SERIF,
                  fontSize: 15,
                  lineHeight: 1.55,
                  color: INK,
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
                <Sparkles size={11} color={AMBER_DEEP} strokeWidth={2.2} />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: AMBER_INK,
                    letterSpacing: '0.02em',
                  }}
                >
                  Tap to ask Echo a follow-up
                </span>
              </div>
            </button>
          </div>
        </div>
      )}

      {error && (
        <div style={{ paddingTop: 12, fontSize: 11, color: INK_55 }}>
          Couldn't generate insights right now.
        </div>
      )}

      {/* Suited */}
      <div style={{ marginTop: 24 }}>
        <BlockHeader
          icon={<TrendingDown size={11} strokeWidth={2.5} />}
          title="SUITED TO YOUR GAME"
          color={GREEN}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
              <CourseCard key={c.id} course={c} stripe={GREEN} onTap={handleCourseTap} />
            ))
          )}
        </div>
      </div>

      {/* Test yourself */}
      <div style={{ marginTop: 24 }}>
        <BlockHeader
          icon={<Target size={11} strokeWidth={2.5} />}
          title="TEST YOURSELF"
          color={AMBER_DEEP}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
      borderRadius: 8,
      textAlign: 'center',
    }}
  >
    No nearby courses match this profile yet.
  </div>
);

export default EchoInsightsCard;
