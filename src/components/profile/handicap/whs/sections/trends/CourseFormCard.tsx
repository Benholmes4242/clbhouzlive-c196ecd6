import React, { useState, useMemo } from 'react';
import { Trophy } from 'lucide-react';
import { CourseImageFallback } from '@/components/whs/CourseImageFallback';
import { useCourseForm } from '@/lib/whs/hooks';
import type { CourseForm } from '@/lib/whs/types';
import SectionHeader from '../SectionHeader';

interface Props {
  connectionId: string;
  currentHandicap: number | null | undefined;
}

const T = {
  ink: '#0F172A',
  inkMute: 'rgba(15,23,42,0.55)',
  inkSoft: 'rgba(15,23,42,0.78)',
  hairline: 'rgba(15,23,42,0.08)',
  cardBg: '#FFFFFF',
  amber: '#F7931E',
  amberDeep: '#C97211',
  amberTint: 'rgba(247,147,30,0.10)',
  amberInk: '#854F0B',
  greenInk: '#065F46',
  redInk: '#991B1B',
  slateTint: 'rgba(15,23,42,0.04)',
  gold: '#FBBC2E',
  silver: '#94A3B8',
  bronze: '#B45309',
  ink04: 'rgba(15,23,42,0.04)',
  ink08: 'rgba(15,23,42,0.08)',
  ink40: 'rgba(15,23,42,0.40)',
};
const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

const TOP_N = 3;
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


const SECTION_STYLE: React.CSSProperties = {
  marginTop: 28,
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
}> = ({ course, rank, expanded, view }) => {
  const valueColor = deltaColor(course.delta);
  const isFirst = rank === 1;

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

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        padding: 10,
        background: T.cardBg,
        border: `1px solid ${isFirst ? 'rgba(247,147,30,0.25)' : T.hairline}`,
        borderRadius: 12,
        marginBottom: 8,
        alignItems: 'center',
        boxShadow: isFirst
          ? '0 2px 4px rgba(15,23,42,0.04), 0 6px 16px rgba(247,147,30,0.10)'
          : '0 1px 2px rgba(15,23,42,0.04)',
        fontFamily: FONT,
      }}
    >
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
        }}
        aria-hidden
      >
        {!course.course_thumbnail_image && (
          <CourseImageFallback flagOpacity={0.18} />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            marginBottom: 2,
          }}
        >
          {isFirst && (
            <Trophy size={11} color={T.amberDeep} fill={T.amberTint} strokeWidth={2.4} />
          )}
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              color: isFirst ? T.amberDeep : T.inkMute,
              letterSpacing: '0.14em',
            }}
          >
            {rank === 1 ? '1ST' : rank === 2 ? '2ND' : '3RD'}
          </span>
        </div>
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
              fontSize: 10.5,
              color: T.inkMute,
              marginTop: 2,
              fontWeight: 600,
            }}
          >
            <strong style={{ color: T.ink, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
              {course.rounds_played}
            </strong>{' '}
            {course.rounds_played === 1 ? 'round' : 'rounds'}
          </div>
        )}
      </div>

      {!expanded && (
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
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
            {headline.value}
          </div>
          <div
            style={{
              fontSize: 9,
              color: T.inkMute,
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

  return (
    <div style={{ paddingTop: 12, paddingBottom: 8 }}>
      {courses.map((c, i) => (
        <CourseRow key={c.course_id} course={c} rank={i + 1} expanded={expanded} view={view} />
      ))}
    </div>
  );
};

export const CourseFormCard: React.FC<Props> = ({ connectionId, currentHandicap }) => {
  const { data, isLoading } = useCourseForm(connectionId, currentHandicap);
  const [activeView, setActiveView] = useState<ViewKey>('best');

  const view = VIEWS[activeView];
  const courses = useMemo(() => (data ? view.select(data) : []), [data, view]);

  if (currentHandicap === null || currentHandicap === undefined) return null;

  if (isLoading) {
    return (
      <section style={SECTION_STYLE}>
        <SectionHeader eyebrow="COURSE FORM" title="Your courses ranked" sub="Loading…" />
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
      <section style={SECTION_STYLE}>
        <SectionHeader
          eyebrow="COURSE FORM"
          title="Your courses ranked"
          sub="Play more rounds to see how each course suits your game"
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
    <section style={SECTION_STYLE}>
      <SectionHeader eyebrow="COURSE FORM" title="Your courses ranked" sub={view.sublabel} />
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
                <span style={{ fontWeight: 700, color: T.ink }}>{top.course_name}</span>{' '}
                is your {role}.{' '}
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {sign === 'over' ? '+' : '\u2212'}{deltaAbs}
                </span>{' '}
                vs hcp across {top.rounds_played} {top.rounds_played === 1 ? 'round' : 'rounds'}.
              </p>
            </div>
          );
        })()}
      </div>
    </section>
  );
};

export default CourseFormCard;
