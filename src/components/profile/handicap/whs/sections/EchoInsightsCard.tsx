import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { useHandicapInsights } from '@/lib/whs/insights/useHandicapInsights';
import type { SuitedCourse } from '@/lib/whs/insights/types';
import { useCounters } from '@/lib/whs/hooks';
import { fmtDiff } from '@/lib/whs/format';
import { analyticsEvents } from '@/utils/analyticsEvents';
import SectionHeader from './SectionHeader';

const INK = '#0F172A';
const INK_55 = 'rgba(15,23,42,0.55)';
const INK_40 = 'rgba(15,23,42,0.40)';
const INK_10 = 'rgba(15,23,42,0.10)';
const INK_06 = 'rgba(15,23,42,0.06)';
const AMBER_DEEP = '#C97211';
const GREEN = '#059669';
const GREEN_06 = 'rgba(5,150,105,0.06)';
const AMBER_06 = 'rgba(247,147,30,0.06)';
const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

interface Props {
  connectionId: string;
}

const CourseCarouselCard: React.FC<{
  course: SuitedCourse;
  accent: string;
  accentTint: string;
  onTap: (id: string) => void;
}> = ({ course, accent, accentTint, onTap }) => (
  <button
    type="button"
    onClick={() => onTap(course.id)}
    style={{
      flexShrink: 0,
      width: 240,
      background: '#fff',
      border: `0.5px solid ${INK_10}`,
      borderRadius: 14,
      overflow: 'hidden',
      cursor: 'pointer',
      fontFamily: FONT_GEIST,
      textAlign: 'left',
      padding: 0,
      boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
      display: 'flex',
      flexDirection: 'column',
    }}
    className="active:scale-[0.99] transition-transform"
  >
    {/* Image / fallback strip — 16:9 ratio */}
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16 / 9',
        background: `linear-gradient(135deg, ${accentTint} 0%, rgba(255,255,255,0) 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: `0.5px solid ${INK_10}`,
      }}
    >
      <MapPin size={28} color={accent} strokeWidth={1.8} />
      {course.expected_differential != null && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: '#fff',
            border: `0.5px solid ${INK_10}`,
            borderRadius: 8,
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'baseline',
            gap: 4,
            boxShadow: '0 1px 2px rgba(15,23,42,0.06)',
          }}
        >
          <span
            style={{
              fontSize: 8,
              fontWeight: 800,
              color: accent,
              letterSpacing: '0.14em',
            }}
          >
            EXP
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: accent,
              letterSpacing: '-0.01em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {fmtDiff(course.expected_differential, { plus: true })}
          </span>
        </div>
      )}
    </div>

    {/* Body */}
    <div style={{ padding: 12, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: INK,
          letterSpacing: '-0.01em',
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
            gap: 4,
            fontSize: 11,
            color: INK_55,
            minWidth: 0,
          }}
        >
          <MapPin size={10} color={INK_40} strokeWidth={2} style={{ flexShrink: 0 }} />
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {course.region}
          </span>
        </div>
      )}
      {course.rationale && (
        <p
          style={{
            margin: '4px 0 0',
            fontSize: 12,
            lineHeight: 1.45,
            color: INK_55,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical' as const,
            overflow: 'hidden',
          }}
        >
          {course.rationale}
        </p>
      )}
    </div>
  </button>
);

const BlockHeader: React.FC<{
  icon: React.ReactNode;
  eyebrow: string;
  color: string;
  title: string;
  subtitle: string;
}> = ({ icon, eyebrow, color, title, subtitle }) => (
  <div style={{ padding: '0 16px 10px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
      <span style={{ color, display: 'flex' }}>{icon}</span>
      <span
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.18em',
          color,
          textTransform: 'uppercase',
        }}
      >
        {eyebrow}
      </span>
    </div>
    <div
      style={{
        fontSize: 17,
        fontWeight: 800,
        color: INK,
        letterSpacing: '-0.02em',
        lineHeight: 1.25,
      }}
    >
      {title}
    </div>
    <div
      style={{
        marginTop: 2,
        fontSize: 12,
        color: INK_55,
        lineHeight: 1.4,
      }}
    >
      {subtitle}
    </div>
  </div>
);

const SkeletonCard = () => (
  <div
    style={{
      flexShrink: 0,
      width: 240,
      height: 200,
      background: INK_06,
      borderRadius: 14,
      animation: 'echoInsightsPulse 1.6s ease-in-out infinite',
    }}
  />
);

const EmptyBlock = () => (
  <div
    style={{
      flexShrink: 0,
      width: 240,
      padding: '24px 14px',
      fontSize: 11,
      color: INK_55,
      background: '#fff',
      border: `0.5px dashed ${INK_10}`,
      borderRadius: 14,
      textAlign: 'center',
    }}
  >
    No nearby courses match this profile yet.
  </div>
);

export const EchoInsightsCard: React.FC<Props> = ({ connectionId }) => {
  const navigate = useNavigate();
  const { data: counters } = useCounters(connectionId);
  const { data: insights, isLoading, error } = useHandicapInsights(connectionId);

  // Edge case: fewer than 8 rounds — render nothing.
  if (counters && counters.length < 8) return null;

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
        padding: '32px 0 40px',
        marginTop: 8,
      }}
    >
      <style>{`
        @keyframes echoInsightsPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
        .insightsCarousel {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding: 4px 16px 12px;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }
        .insightsCarousel::-webkit-scrollbar { display: none; }
      `}</style>

      {error && (
        <div style={{ padding: '0 16px 12px', fontSize: 11, color: INK_55 }}>
          Couldn't generate insights right now.
        </div>
      )}

      {/* Suited */}
      <div>
        <BlockHeader
          icon={<TrendingDown size={11} strokeWidth={2.5} />}
          eyebrow="Suited to your game"
          color={GREEN}
          title="Three courses for posting low scores"
          subtitle="Layouts that match your strengths."
        />
        <div className="insightsCarousel">
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
              <CourseCarouselCard
                key={c.id}
                course={c}
                accent={GREEN}
                accentTint={GREEN_06}
                onTap={handleCourseTap}
              />
            ))
          )}
        </div>
      </div>

      {/* Test yourself */}
      <div style={{ marginTop: 16 }}>
        <BlockHeader
          icon={<Target size={11} strokeWidth={2.5} />}
          eyebrow="Test yourself"
          color={AMBER_DEEP}
          title="Three courses to grow your game"
          subtitle="Layouts that stretch what you don't usually face."
        />
        <div className="insightsCarousel">
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
              <CourseCarouselCard
                key={c.id}
                course={c}
                accent={AMBER_DEEP}
                accentTint={AMBER_06}
                onTap={handleCourseTap}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default EchoInsightsCard;
