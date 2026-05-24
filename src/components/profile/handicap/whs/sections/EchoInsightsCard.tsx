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

const HeroCard: React.FC<{
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
      background: 'var(--hcp-bg-1)',
      border: '1px solid var(--hcp-line-2)',
      borderRadius: 14,
      overflow: 'hidden',
      cursor: 'pointer',
      fontFamily: FONT_GEIST,
      textAlign: 'left',
      padding: 0,
      boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
      display: 'flex',
      flexDirection: 'column',
      marginBottom: 10,
    }}
    className="active:scale-[0.99] transition-transform"
  >
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16 / 8',
        background: `linear-gradient(135deg, ${accentTint} 0%, rgba(255,255,255,0) 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: `0.5px solid ${INK_10}`,
        overflow: 'hidden',
      }}
    >
      {course.thumbnail_image ? (
        <img
          src={course.thumbnail_image}
          alt=""
          aria-hidden
          loading="lazy"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <MapPin size={32} color={accent} strokeWidth={1.8} />
      )}
      <div
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          background: 'var(--hcp-bg-1)',
          border: '1px solid var(--hcp-line-2)',
          borderRadius: 10,
          padding: '6px 11px',
          display: 'flex',
          alignItems: 'baseline',
          gap: 5,
          boxShadow: '0 1px 2px rgba(15,23,42,0.06)',
          zIndex: 1,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: accent,
            letterSpacing: '0.14em',
          }}
        >
          EXP
        </span>
        <span
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: accent,
            letterSpacing: '-0.02em',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}
        >
          {course.expected_differential != null
            ? fmtDiff(course.expected_differential, { plus: true })
            : '—'}
        </span>
      </div>
    </div>

    <div style={{ padding: 14, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        style={{
          fontSize: 16,
          fontWeight: 800,
          color: 'var(--hcp-t-100)',
          letterSpacing: '-0.015em',
          lineHeight: 1.25,
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
            fontSize: 11.5,
            color: 'var(--hcp-t-60)',
            minWidth: 0,
          }}
        >
          <MapPin size={11} color={INK_40} strokeWidth={2} style={{ flexShrink: 0 }} />
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
      <StatStrip course={course} size="hero" />
    </div>
  </button>
);

const StatStrip: React.FC<{ course: SuitedCourse; size: 'hero' | 'mini' }> = ({ course, size }) => {
  const stats: Array<{ label: string; value: string }> = [];
  if (course.slope_rating != null) {
    stats.push({ label: 'SLOPE', value: String(course.slope_rating) });
  }
  if (course.course_rating != null) {
    stats.push({ label: 'RATING', value: course.course_rating.toFixed(1) });
  }
  if (course.distance_miles != null) {
    stats.push({ label: 'DISTANCE', value: `${course.distance_miles} mi` });
  }
  if (stats.length === 0) return null;

  const isHero = size === 'hero';
  const labelSize = isHero ? 9 : 8;
  const valueSize = isHero ? 14 : 11;
  const padTop = isHero ? 8 : 6;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: 0,
        marginTop: padTop,
        paddingTop: padTop,
        borderTop: `0.5px solid ${INK_10}`,
      }}
    >
      {stats.map((s, i) => (
        <div
          key={s.label}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            paddingLeft: i === 0 ? 0 : isHero ? 12 : 8,
            paddingRight: i === stats.length - 1 ? 0 : isHero ? 12 : 8,
            borderLeft: i === 0 ? 'none' : `0.5px solid ${INK_10}`,
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontSize: labelSize,
              fontWeight: 800,
              color: 'var(--hcp-t-60)',
              letterSpacing: '0.12em',
            }}
          >
            {s.label}
          </span>
          <span
            style={{
              fontSize: valueSize,
              fontWeight: 800,
              color: 'var(--hcp-t-100)',
              letterSpacing: '-0.01em',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1.1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {s.value}
          </span>
        </div>
      ))}
    </div>
  );
};

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
      background: 'var(--hcp-bg-1)',
      border: '1px solid var(--hcp-line-2)',
      borderRadius: 12,
      overflow: 'hidden',
      cursor: 'pointer',
      fontFamily: FONT_GEIST,
      textAlign: 'left',
      padding: 0,
      display: 'flex',
      flexDirection: 'column',
    }}
    className="active:scale-[0.99] transition-transform"
  >
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16 / 10',
        background: `linear-gradient(135deg, ${accentTint} 0%, rgba(255,255,255,0) 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: `0.5px solid ${INK_10}`,
        overflow: 'hidden',
      }}
    >
      {course.thumbnail_image ? (
        <img
          src={course.thumbnail_image}
          alt=""
          aria-hidden
          loading="lazy"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <MapPin size={22} color={accent} strokeWidth={1.8} />
      )}
      {course.expected_differential != null && (
        <div
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            background: 'var(--hcp-bg-1)',
            border: '1px solid var(--hcp-line-2)',
            borderRadius: 7,
            padding: '3px 7px',
            display: 'flex',
            alignItems: 'baseline',
            gap: 3,
            zIndex: 1,
          }}
        >
          <span style={{ fontSize: 8, fontWeight: 800, color: accent, letterSpacing: '0.12em' }}>
            EXP
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: accent,
              letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
            }}
          >
            {fmtDiff(course.expected_differential, { plus: true })}
          </span>
        </div>
      )}
    </div>

    <div style={{ padding: 10, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div
        style={{
          fontSize: 12.5,
          fontWeight: 800,
          color: 'var(--hcp-t-100)',
          letterSpacing: '-0.01em',
          lineHeight: 1.25,
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
            fontSize: 10,
            color: 'var(--hcp-t-60)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {course.region}
        </div>
      )}
    </div>
  </button>
);

const HeroSkeleton = () => (
  <div
    style={{
      width: '100%',
      height: 280,
      background: INK_06,
      borderRadius: 14,
      animation: 'echoInsightsPulse 1.6s ease-in-out infinite',
      marginBottom: 10,
    }}
  />
);

const MiniSkeleton = () => (
  <div
    style={{
      width: '100%',
      aspectRatio: '16 / 14',
      background: INK_06,
      borderRadius: 12,
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
        padding: '32px 0 0',
        marginTop: 8,
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
