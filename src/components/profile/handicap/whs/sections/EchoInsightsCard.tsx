import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { useHandicapInsights } from '@/lib/whs/insights/useHandicapInsights';
import type { SuitedCourse } from '@/lib/whs/insights/types';
import { useCounters } from '@/lib/whs/hooks';
import { fmtDiff } from '@/lib/whs/format';
import { analyticsEvents } from '@/utils/analyticsEvents';
import SectionHeader from './SectionHeader';

const INK = 'var(--hcp-t-100)';
const INK_55 = 'var(--hcp-t-60)';
const INK_40 = 'var(--hcp-t-40)';
const INK_10 = 'var(--hcp-line-2)';
const INK_06 = 'var(--hcp-bg-3)';
const AMBER_DEEP = '#C97211';
const GREEN = '#059669';
const GREEN_06 = 'rgba(5,150,105,0.06)';
const AMBER_06 = 'rgba(247,147,30,0.06)';
const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

interface Props {
  connectionId: string;
}

function hexToRgba(hex: string, alpha: number): string {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const HeroCard: React.FC<{
  course: SuitedCourse;
  accent: string;
  accentTint: string;
  onTap: (id: string) => void;
  leadLabel: string;
}> = ({ course, accent, accentTint, onTap, leadLabel }) => (
  <div style={{ marginBottom: 10 }}>
    <button
      type="button"
      onClick={() => onTap(course.id)}
      style={{
        width: '100%',
        aspectRatio: '1 / 1',
        position: 'relative',
        background: course.thumbnail_image
          ? 'transparent'
          : `linear-gradient(180deg, ${accentTint} 0%, var(--hcp-bg-2) 100%)`,
        borderRadius: 18,
        overflow: 'hidden',
        border: '1px solid var(--hcp-line-2)',
        padding: 0,
        cursor: 'pointer',
        fontFamily: FONT_GEIST,
      }}
      className="active:scale-[0.99] transition-transform"
    >
      {course.thumbnail_image && (
        <img
          src={course.thumbnail_image}
          alt=""
          aria-hidden
          loading="lazy"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
      <div
        aria-hidden
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '40%',
          background: 'linear-gradient(180deg, rgba(5,8,16,0.55) 0%, rgba(5,8,16,0) 100%)',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%',
          background: 'linear-gradient(180deg, rgba(5,8,16,0) 0%, rgba(5,8,16,0.92) 90%)',
        }}
      />
      <div
        style={{
          position: 'absolute', top: 14, left: 16, right: 16,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.20em',
            color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase',
          }}
        >
          {leadLabel}
        </span>
      </div>
      <div style={{ position: 'absolute', left: 18, right: 18, bottom: 16, textAlign: 'left' }}>
        {(course.country || course.region) && (
          <div
            style={{
              fontSize: 11, fontWeight: 800, letterSpacing: '0.14em',
              color: 'rgba(255,255,255,0.65)', marginBottom: 6, textTransform: 'uppercase',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            }}
          >
            {[course.country, course.region].filter(Boolean).join(' · ')}
          </div>
        )}
        <div
          style={{
            fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em',
            lineHeight: 1.1, color: '#F8FAFC',
            textShadow: '0 1px 3px rgba(0,0,0,0.6)',
          }}
        >
          {course.name || '—'}
        </div>
      </div>
    </button>
  </div>
);

const MiniCard: React.FC<{
  course: SuitedCourse;
  accent: string;
  accentTint: string;
  onTap: (id: string) => void;
}> = ({ course, accent, accentTint, onTap }) => (
  <button
    type="button"
    onClick={() => onTap(course.id)}
    style={{
      width: '100%',
      aspectRatio: '4 / 5',
      position: 'relative',
      background: course.thumbnail_image
        ? 'transparent'
        : `linear-gradient(180deg, ${accentTint} 0%, var(--hcp-bg-2) 100%)`,
      borderRadius: 14,
      overflow: 'hidden',
      border: '1px solid var(--hcp-line-2)',
      padding: 0,
      cursor: 'pointer',
      fontFamily: FONT_GEIST,
    }}
    className="active:scale-[0.99] transition-transform"
  >
    {course.thumbnail_image && (
      <img
        src={course.thumbnail_image}
        alt=""
        aria-hidden
        loading="lazy"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />
    )}
    <div
      aria-hidden
      style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
        background: 'linear-gradient(180deg, rgba(5,8,16,0) 0%, rgba(5,8,16,0.92) 90%)',
      }}
    />
    {course.expected_differential != null && (
      <span
        style={{
          position: 'absolute', top: 10, right: 10,
          padding: '3px 7px', borderRadius: 6,
          fontSize: 11, fontWeight: 800, letterSpacing: '-0.01em',
          background: 'rgba(5,8,16,0.82)',
          color: accent,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {fmtDiff(course.expected_differential, { plus: true })}
      </span>
    )}
    <div style={{ position: 'absolute', left: 12, right: 12, bottom: 12, textAlign: 'left' }}>
      <div
        style={{
          fontSize: 14, fontWeight: 800, color: '#F8FAFC',
          lineHeight: 1.15, letterSpacing: '-0.01em',
        }}
      >
        {course.name || '—'}
      </div>
      {(course.country || course.region) && (
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
          {[course.country, course.region].filter(Boolean).join(' · ')}
        </div>
      )}
    </div>
  </button>
);

const HeroSkeleton = () => (
  <div style={{ marginBottom: 10 }}>
    <div
      style={{
        width: '100%',
        aspectRatio: '1 / 1',
        background: INK_06,
        borderRadius: 18,
        animation: 'echoInsightsPulse 1.6s ease-in-out infinite',
      }}
    />
  </div>
);

const MiniSkeleton = () => (
  <div
    style={{
      width: '100%',
      aspectRatio: '4 / 5',
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
      color: 'var(--hcp-t-60)',
      background: 'var(--hcp-bg-1)',
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

  // Sort SUITED ascending (easiest = lowest EXP first); TEST descending
  // (hardest = highest EXP first). Null EXPs sort to the end so they never
  // accidentally become the hero card.
  const suitedSorted = React.useMemo(() => {
    if (!insights?.suited_courses) return [];
    return [...insights.suited_courses].sort((a, b) => {
      if (a.expected_differential == null && b.expected_differential == null) return 0;
      if (a.expected_differential == null) return 1;
      if (b.expected_differential == null) return -1;
      return a.expected_differential - b.expected_differential;
    });
  }, [insights?.suited_courses]);

  const testSorted = React.useMemo(() => {
    if (!insights?.test_courses) return [];
    return [...insights.test_courses].sort((a, b) => {
      if (a.expected_differential == null && b.expected_differential == null) return 0;
      if (a.expected_differential == null) return 1;
      if (b.expected_differential == null) return -1;
      return b.expected_differential - a.expected_differential;
    });
  }, [insights?.test_courses]);

  return (
    <section
      style={{
        marginTop: 32,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes echoInsightsPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
        @keyframes echoSparkleFloat {
          0%, 100% { opacity: 0; transform: translate(0, 0) scale(0.5); }
          20% { opacity: 1; transform: translate(8px, -6px) scale(1); }
          50% { opacity: 0.8; transform: translate(20px, 4px) scale(1.2); }
          80% { opacity: 0.4; transform: translate(35px, -2px) scale(0.8); }
        }
        .echoPlume {
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          pointer-events: none;
          background: radial-gradient(
            ellipse 320px 200px at 0% 55%,
            rgba(247,147,30,0.28) 0%,
            rgba(247,147,30,0.10) 30%,
            transparent 65%
          );
          z-index: 0;
        }
        .echoSparkle {
          position: absolute;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: #FFE5B0;
          box-shadow: 0 0 4px rgba(255,229,176,0.9), 0 0 10px rgba(247,147,30,0.5);
          pointer-events: none;
          z-index: 0;
        }
        .echoSparkle.s1 { top: 48%; left: 20px;  animation: echoSparkleFloat 5s ease-in-out infinite; }
        .echoSparkle.s2 { top: 58%; left: 60px;  animation: echoSparkleFloat 6.5s ease-in-out infinite 1s; }
        .echoSparkle.s3 { top: 52%; left: 110px; animation: echoSparkleFloat 7s ease-in-out infinite 2.5s; }
        .echoSparkle.s4 { top: 46%; left: 160px; animation: echoSparkleFloat 8s ease-in-out infinite 0.5s; }
        .echoSparkle.s5 { top: 60%; left: 200px; animation: echoSparkleFloat 5.5s ease-in-out infinite 3s; }
      `}</style>

      {/* Background plume — amber radial glow + drifting sparkles. Sits behind all content. */}
      <div className="echoPlume" aria-hidden="true" />
      <span className="echoSparkle s1" aria-hidden="true" />
      <span className="echoSparkle s2" aria-hidden="true" />
      <span className="echoSparkle s3" aria-hidden="true" />
      <span className="echoSparkle s4" aria-hidden="true" />
      <span className="echoSparkle s5" aria-hidden="true" />

      {error && (
        <div style={{ padding: '0 20px 12px', fontSize: 11, color: 'var(--hcp-t-60)' }}>
          Couldn't generate insights right now.
        </div>
      )}

      {/* Suited */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <SectionHeader
          eyebrow="SUITED TO YOUR GAME"
          title="Three courses for posting low scores"
        />
        <div style={{ padding: '4px 20px 12px' }}>
          {isLoading || !insights ? (
            <>
              <HeroSkeleton />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <MiniSkeleton />
                <MiniSkeleton />
              </div>
            </>
          ) : suitedSorted.length === 0 ? (
            <EmptyBlock />
          ) : (
            <>
              {suitedSorted[0] && (
                <HeroCard
                  course={suitedSorted[0]}
                  accent={GREEN}
                  accentTint={GREEN_06}
                  onTap={handleCourseTap}
                  leadLabel="YOUR TOP MATCH"
                />

              )}
              {suitedSorted.length > 1 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {suitedSorted.slice(1).map((c) => (
                    <MiniCard
                      key={c.id}
                      course={c}
                      accent={GREEN}
                      accentTint={GREEN_06}
                      onTap={handleCourseTap}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Test yourself */}
      <div style={{ marginTop: 16, position: 'relative', zIndex: 1 }}>
        <SectionHeader
          eyebrow="TEST YOURSELF"
          title="Three courses to grow your game"
        />
        <div style={{ padding: '4px 20px 12px' }}>
          {isLoading || !insights ? (
            <>
              <HeroSkeleton />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <MiniSkeleton />
                <MiniSkeleton />
              </div>
            </>
          ) : testSorted.length === 0 ? (
            <EmptyBlock />
          ) : (
            <>
              {testSorted[0] && (
                <HeroCard
                  course={testSorted[0]}
                  accent={AMBER_DEEP}
                  accentTint={AMBER_06}
                  onTap={handleCourseTap}
                  leadLabel="YOUR HARDEST TEST"
                />

              )}
              {testSorted.length > 1 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {testSorted.slice(1).map((c) => (
                    <MiniCard
                      key={c.id}
                      course={c}
                      accent={AMBER_DEEP}
                      accentTint={AMBER_06}
                      onTap={handleCourseTap}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default EchoInsightsCard;
