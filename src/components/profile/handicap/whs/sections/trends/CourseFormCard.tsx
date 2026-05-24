import React, { useState, useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { CourseImageFallback } from '@/components/whs/CourseImageFallback';
import { useCourseForm } from '@/lib/whs/hooks';
import type { CourseForm } from '@/lib/whs/types';
import SectionHeader from '../SectionHeader';

interface Props {
  connectionId: string;
  currentHandicap: number | null | undefined;
  /** Override the canonical top margin. Pass 0 for the first card on the tab. */
  topMargin?: number;
}

const T = {
  ink: 'var(--hcp-t-100)',
  inkMute: 'var(--hcp-t-60)',
  inkSoft: 'var(--hcp-t-80)',
  hairline: 'var(--hcp-line-2)',
  cardBg: 'var(--hcp-bg-1)',
  amber: '#F7931E',
  amberDeep: '#C97211',
  amberTint: 'rgba(247,147,30,0.10)',
  amberInk: '#854F0B',
  greenInk: '#065F46',
  redInk: '#991B1B',
  slateTint: 'var(--hcp-bg-2)',
  ink04: 'var(--hcp-bg-2)',
  ink08: 'var(--hcp-line-2)',
  ink40: 'var(--hcp-t-40)',
};
const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

const TOP_N = 6;
const MIN_ROUNDS_FOR_TOUGHEST = 2;

type ViewKey = 'most_played' | 'best' | 'toughest';

interface ViewMeta {
  label: string;
  sublabel: string;
  select: (all: CourseForm[]) => CourseForm[];
}

const VIEWS: Record<ViewKey, ViewMeta> = {
  best: {
    label: 'Best form',
    sublabel: 'Your courses ranked by form',
    select: (all) =>
      [...all]
        .sort((a, b) => a.delta - b.delta)
        .slice(0, TOP_N),
  },
  most_played: {
    label: 'Most played',
    sublabel: 'Your courses ranked by play count',
    select: (all) =>
      [...all]
        .sort((a, b) => b.rounds_played - a.rounds_played)
        .slice(0, TOP_N),
  },
  toughest: {
    label: 'Toughest',
    sublabel: `Highest avg differential (${MIN_ROUNDS_FOR_TOUGHEST}+ rounds)`,
    select: (all) =>
      [...all]
        .filter((c) => c.rounds_played >= MIN_ROUNDS_FOR_TOUGHEST)
        .sort((a, b) => b.delta - a.delta)
        .slice(0, TOP_N),
  },
};

function fmtDelta(d: number): string {
  if (d === 0) return '0.0';
  const sign = d < 0 ? '\u2212' : '+';
  return `${sign}${Math.abs(d).toFixed(1)}`;
}

function deltaColor(d: number): string {
  if (d < 0) return T.greenInk;
  if (d > 0) return T.redInk;
  return T.inkMute;
}

/**
 * Text-shadow halo to lift the score value off the dark canvas.
 * Matches the value's color so the glow reads as the value emitting light.
 * Neutral (delta = 0) returns 'none' — no halo on grey.
 */
function glowFor(d: number): string {
  if (d < 0) {
    return '0 0 8px rgba(34,197,94,0.28), 0 0 3px rgba(34,197,94,0.18)';
  }
  if (d > 0) {
    return '0 0 8px rgba(239,68,68,0.28), 0 0 3px rgba(239,68,68,0.18)';
  }
  return 'none';
}


const SECTION_STYLE: React.CSSProperties = {
  marginTop: 32,
  fontFamily: FONT,
};

const ViewToggle: React.FC<{
  activeView: ViewKey;
  onChange: (next: ViewKey) => void;
}> = ({ activeView, onChange }) => (
  <div
    role="tablist"
    aria-label="Course form view"
    style={{
      display: 'flex',
      padding: 4,
      marginTop: 14,
      marginBottom: 4,
      background: T.slateTint,
      borderRadius: 10,
      gap: 2,
    }}
  >
    {(Object.keys(VIEWS) as ViewKey[]).map((key) => {
      const active = activeView === key;
      return (
        <button
          key={key}
          role="tab"
          aria-selected={active}
          onClick={() => onChange(key)}
          style={{
            flex: 1,
            padding: '7px 10px',
            fontSize: 11,
            fontWeight: 700,
            borderRadius: 7,
            border: 'none',
            background: active ? T.cardBg : 'transparent',
            color: active ? T.ink : T.inkSoft,
            cursor: 'pointer',
            fontFamily: FONT,
            letterSpacing: '-0.01em',
            transition: 'background 150ms ease',
            boxShadow: active ? '0 1px 2px rgba(15,23,42,0.06)' : 'none',
          }}
        >
          {VIEWS[key].label}
        </button>
      );
    })}
  </div>
);

const Pill: React.FC<{ label: string; color: string; bg: string; bold?: boolean }> = ({
  label,
  color,
  bg,
  bold,
}) => (
  <span
    style={{
      padding: '3px 8px',
      borderRadius: 999,
      background: bg,
      fontSize: 10,
      fontWeight: bold ? 800 : 700,
      color,
      letterSpacing: '-0.005em',
      fontVariantNumeric: 'tabular-nums',
      fontFamily: FONT,
    }}
  >
    {label}
  </span>
);

const CourseRow: React.FC<{
  course: CourseForm;
  rank: number;
  expanded: boolean;
  view: ViewKey;
  /** Largest |delta| among the visible courses. Used to scale the
   *  ambient magnitude gradient behind the row. */
  maxMag: number;
  /** Largest rounds_played among visible courses. Used to scale the
   *  compact rounds-played bar. */
  maxRounds: number;
  /** True for the last row in the list — suppresses the bottom hairline. */
  isLast: boolean;
}> = ({ course, rank, expanded, view, maxMag, maxRounds, isLast }) => {
  const valueColor = deltaColor(course.delta);

  // Compact list row — replaces the old large featured row for the
  // multi-course case. Expanded mode (single course) keeps the old layout.
  if (!expanded) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 12px',
          borderBottom: isLast ? 'none' : `1px solid ${T.ink08}`,
          fontFamily: FONT,
        }}
      >
        {/* Rank number */}
        <span
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: T.ink40,
            width: 18,
            fontVariantNumeric: 'tabular-nums',
            textAlign: 'left',
            flexShrink: 0,
          }}
        >
          {rank}
        </span>

        {/* Mini thumbnail */}
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            overflow: 'hidden',
            flexShrink: 0,
            background: course.course_thumbnail_image
              ? `url(${course.course_thumbnail_image}) center/cover no-repeat`
              : T.ink04,
            position: 'relative',
          }}
          aria-hidden
        >
          {!course.course_thumbnail_image && (
            <CourseImageFallback flagOpacity={0.22} />
          )}
          {course.course_thumbnail_image && (
            <>
              <span
                aria-hidden
                style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '40%',
                  background: 'linear-gradient(180deg, rgba(5,8,16,0.55) 0%, rgba(5,8,16,0) 100%)',
                  pointerEvents: 'none',
                }}
              />
              <span
                aria-hidden
                style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%',
                  background: 'linear-gradient(180deg, rgba(5,8,16,0) 0%, rgba(5,8,16,0.92) 90%)',
                  pointerEvents: 'none',
                }}
              />
            </>
          )}
        </div>

        {/* Name + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: T.ink,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              letterSpacing: '-0.005em',
            }}
          >
            {course.course_name}
          </div>
          <div
            style={{
              fontSize: 10.5,
              color: T.ink40,
              marginTop: 1,
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {course.course_region ? `${course.course_region} · ` : ''}
            {course.rounds_played} {course.rounds_played === 1 ? 'round' : 'rounds'}
          </div>
        </div>

        {/* Mini rounds-played bar */}
        <div
          style={{
            width: 32,
            height: 4,
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 2,
            position: 'relative',
            overflow: 'hidden',
            flexShrink: 0,
          }}
          aria-label={`${course.rounds_played} of max ${maxRounds} rounds played`}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: `${Math.max(8, (course.rounds_played / Math.max(maxRounds, 1)) * 100)}%`,
              background: 'rgba(255,255,255,0.40)',
              borderRadius: 2,
            }}
          />
        </div>

        {/* Delta */}
        <span
          style={{
            fontSize: 15,
            fontWeight: 800,
            color: view === 'most_played' ? T.ink : valueColor,
            fontVariantNumeric: 'tabular-nums',
            minWidth: 52,
            textAlign: 'right',
            textShadow: view === 'most_played' ? 'none' : glowFor(course.delta),
            flexShrink: 0,
            letterSpacing: '-0.02em',
          }}
        >
          {view !== 'most_played' && course.delta !== 0 && (
            <span
              aria-hidden
              style={{
                fontSize: 11,
                verticalAlign: 1,
                marginRight: 1,
                fontWeight: 700,
              }}
            >
              {course.delta < 0 ? '\u2193' : '\u2191'}
            </span>
          )}
          {view === 'most_played'
            ? course.rounds_played
            : course.delta !== 0
              ? Math.abs(course.delta).toFixed(1)
              : '0.0'}
        </span>
      </div>
    );
  }

  const headline = (() => {
    if (view === 'most_played') {
      return {
        value: String(course.rounds_played),
        label: course.rounds_played === 1 ? 'ROUND' : 'ROUNDS',
        color: T.ink,
      };
    }
    return {
      value: fmtDelta(course.delta),
      label: 'VS HCP',
      color: valueColor,
    };
  })();

  const magFrac = Math.max(0.12, Math.abs(course.delta) / maxMag);

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        padding: '10px 10px 10px 13px',
        background: T.cardBg,
        border: `1px solid ${T.hairline}`,
        borderRadius: 12,
        marginBottom: 8,
        alignItems: 'center',
        boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: FONT,
      }}
    >
      {/* Ambient magnitude gradient. Green for negative deltas (better
       *  than hcp), red for positive. Width proportional to |delta| / maxMag
       *  with a floor of 0.12 so even small deltas show a hint of fill. */}
      {course.delta !== 0 && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${magFrac * 100}%`,
            background:
              course.delta < 0
                ? 'linear-gradient(90deg, rgba(34,197,94,0.14) 0%, transparent 100%)'
                : 'linear-gradient(90deg, rgba(239,68,68,0.14) 0%, transparent 100%)',
            opacity: 0.5,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}
      <div
        style={{
          width: expanded ? 80 : 56,
          height: expanded ? 80 : 56,
          borderRadius: 8,
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
          background: course.course_thumbnail_image
            ? `url(${course.course_thumbnail_image})`
            : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 1,
        }}
        aria-hidden
      >
        {!course.course_thumbnail_image && (
          <CourseImageFallback flagOpacity={0.18} />
        )}
        {course.course_thumbnail_image && (
          <>
            <span
              aria-hidden
              style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '40%',
                background: 'linear-gradient(180deg, rgba(5,8,16,0.55) 0%, rgba(5,8,16,0) 100%)',
                pointerEvents: 'none',
              }}
            />
            <span
              aria-hidden
              style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%',
                background: 'linear-gradient(180deg, rgba(5,8,16,0) 0%, rgba(5,8,16,0.92) 90%)',
                pointerEvents: 'none',
              }}
            />
          </>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: T.ink,
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginBottom: 3,
          }}
        >
          {course.course_name}
        </div>
        {expanded ? (
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            <Pill
              label={`${course.rounds_played} ${course.rounds_played === 1 ? 'round' : 'rounds'}`}
              color={T.ink}
              bg={T.ink04}
              bold
            />
            <Pill
              label={`Best ${fmtDelta(course.best_differential - course.expected_differential)}`}
              color={T.greenInk}
              bg="rgba(34,197,94,0.10)"
            />
            <Pill
              label={`Worst ${fmtDelta(course.worst_differential - course.expected_differential)}`}
              color={T.redInk}
              bg="rgba(220,38,38,0.10)"
            />
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--hcp-t-60)',
              letterSpacing: '-0.005em',
              minWidth: 0,
            }}
          >
            {course.course_region && (
              <>
                <MapPin size={10} color="var(--hcp-t-40)" strokeWidth={2} style={{ flexShrink: 0 }} />
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    minWidth: 0,
                  }}
                >
                  {course.course_region}
                </span>
                <span aria-hidden style={{ color: 'var(--hcp-t-40)' }}>·</span>
              </>
            )}
            <span style={{ fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
              {course.rounds_played} {course.rounds_played === 1 ? 'round' : 'rounds'}
            </span>
          </div>
        )}
      </div>

      {!expanded && (
        <div style={{ textAlign: 'right', flexShrink: 0, position: 'relative', zIndex: 1 }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: headline.color,
              lineHeight: 1,
              letterSpacing: '-0.03em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {view !== 'most_played' && course.delta !== 0 && (
              <span
                aria-hidden
                style={{
                  fontSize: 14,
                  verticalAlign: 2,
                  marginRight: 2,
                  fontWeight: 700,
                }}
              >
                {course.delta < 0 ? '\u2193' : '\u2191'}
              </span>
            )}
            {view !== 'most_played' && course.delta !== 0
              ? Math.abs(course.delta).toFixed(1)
              : headline.value}
          </div>
          <div
            style={{
              fontSize: 9,
              color: headline.color !== T.ink ? headline.color : T.inkMute,
              opacity: headline.color !== T.ink ? 0.7 : 1,
              fontWeight: 700,
              letterSpacing: '0.10em',
              marginTop: 3,
            }}
          >
            {headline.label}
          </div>
        </div>
      )}
    </div>
  );
};

const CourseList: React.FC<{ courses: CourseForm[]; view: ViewKey }> = ({ courses, view }) => {
  if (courses.length === 0) {
    const emptyCopy =
      view === 'toughest'
        ? `Need at least ${MIN_ROUNDS_FOR_TOUGHEST} rounds at a course to identify your toughest. Play a few more.`
        : 'Add a few rounds to see this view.';
    return (
      <div style={{ padding: '24px 16px 28px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 12, color: T.inkMute, lineHeight: 1.55, fontFamily: FONT }}>
          {emptyCopy}
        </p>
      </div>
    );
  }

  const expanded = courses.length === 1;
  // Largest absolute delta among the visible courses. Floor at 2 so that
  // small-magnitude deltas don't fill the whole row.
  const maxMag = Math.max(2, ...courses.map((c) => Math.abs(c.delta)));
  const maxRounds = Math.max(1, ...courses.map((c) => c.rounds_played));

  if (expanded) {
    return (
      <div style={{ paddingTop: 12, paddingBottom: 8 }}>
        {courses.map((c, i) => (
          <CourseRow
            key={c.course_id}
            course={c}
            rank={i + 1}
            expanded
            view={view}
            maxMag={maxMag}
            maxRounds={maxRounds}
            isLast={i === courses.length - 1}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: 12,
        background: 'rgba(255,255,255,0.012)',
        border: `1px solid ${T.ink08}`,
        borderRadius: 14,
        overflow: 'hidden',
        padding: '4px 0',
      }}
    >
      {courses.map((c, i) => (
        <CourseRow
          key={c.course_id}
          course={c}
          rank={i + 1}
          expanded={false}
          view={view}
          maxMag={maxMag}
          maxRounds={maxRounds}
          isLast={i === courses.length - 1}
        />
      ))}
    </div>
  );
};

export const CourseFormCard: React.FC<Props> = ({ connectionId, currentHandicap, topMargin }) => {
  const { data, isLoading } = useCourseForm(connectionId, currentHandicap);
  const [activeView, setActiveView] = useState<ViewKey>('best');

  const view = VIEWS[activeView];
  const courses = useMemo(() => (data ? view.select(data) : []), [data, view]);
  const sectionStyle: React.CSSProperties = { ...SECTION_STYLE, marginTop: topMargin ?? 32 };

  if (currentHandicap === null || currentHandicap === undefined) return null;

  if (isLoading) {
    return (
      <section style={sectionStyle}>
        <SectionHeader eyebrow="COURSE FORM" title="Your courses ranked" />
        <div style={{ padding: '0 20px' }}>
          <div
            className="animate-pulse"
            style={{
              marginTop: 14,
              marginBottom: 4,
              height: 36,
              background: T.slateTint,
              borderRadius: 10,
            }}
          />
          <div style={{ paddingTop: 14, paddingBottom: 16 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse"
                style={{
                  height: 56,
                  background: T.slateTint,
                  borderRadius: 4,
                  marginBottom: i < 2 ? 12 : 0,
                }}
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!data || data.length === 0) {
    return (
      <section style={sectionStyle}>
        <SectionHeader
          eyebrow="COURSE FORM"
          title="Your courses ranked"
        />
        <div style={{ padding: '24px 20px 28px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.ink, fontFamily: FONT }}>
            Add some rounds to get started
          </p>
          <p style={{ margin: '6px 0 0', fontSize: 12, color: T.inkMute, lineHeight: 1.5, fontFamily: FONT }}>
            We&apos;ll show how you score at each course once you&apos;ve logged a few rounds.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section style={sectionStyle}>
      <SectionHeader eyebrow="COURSE FORM" title="Your courses ranked" />
      <div style={{ padding: '0 20px' }}>
        <ViewToggle activeView={activeView} onChange={setActiveView} />
        <CourseList courses={courses} view={activeView} />
        {courses.length > 0 && (() => {
          const top = courses[0];
          const sign = top.delta < 0 ? 'under' : 'over';
          const deltaAbs = Math.abs(top.delta).toFixed(1);
          const role =
            activeView === 'toughest'
              ? 'toughest test'
              : activeView === 'best'
                ? 'best course'
                : 'home course';
          const lowConfidence = top.rounds_played < 2;
          const verbAndAfter = lowConfidence ? (
            <>
              {' '}leads on a single round — small sample.{' '}
              <span style={{ color: T.inkMute }}>Play it again to confirm.</span>
            </>
          ) : (
            <>
              {' '}is your {role}.{' '}
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                {sign === 'over' ? '+' : '\u2212'}{deltaAbs}
              </span>{' '}
              vs hcp across {top.rounds_played} rounds.
            </>
          );
          return (
            <div
              style={{
                marginTop: 4,
                marginBottom: 16,
                padding: '10px 12px',
                background: T.slateTint,
                borderRadius: 10,
              }}
            >
              <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: T.inkSoft, fontFamily: FONT }}>
                <span style={{ fontWeight: 700, color: T.ink }}>{top.course_name}</span>
                {verbAndAfter}
              </p>
            </div>
          );
        })()}
      </div>
    </section>
  );
};

export default CourseFormCard;
