import React, { useState, useMemo } from 'react';
import { MapPin, Info, Trophy } from 'lucide-react';
import { useCourseForm } from '@/lib/whs/hooks';
import type { CourseForm } from '@/lib/whs/types';

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

const MIN_ROUNDS_FOR_RANKINGS = 3;
const TOP_N = 3;

type ViewKey = 'most_played' | 'best' | 'toughest';

interface ViewMeta {
  label: string;
  sublabel: string;
  select: (all: CourseForm[]) => CourseForm[];
}

const VIEWS: Record<ViewKey, ViewMeta> = {
  best: {
    label: 'Best form',
    sublabel: `Your three best courses (${MIN_ROUNDS_FOR_RANKINGS}+ rounds)`,
    select: (all) =>
      [...all]
        .filter((c) => c.rounds_played >= MIN_ROUNDS_FOR_RANKINGS)
        .sort((a, b) => a.delta - b.delta)
        .slice(0, TOP_N),
  },
  most_played: {
    label: 'Most played',
    sublabel: 'Your three most played courses, ranked by form',
    select: (all) => [...all].sort((a, b) => b.rounds_played - a.rounds_played).slice(0, TOP_N),
  },
  toughest: {
    label: 'Toughest',
    sublabel: `Your three toughest courses (${MIN_ROUNDS_FOR_RANKINGS}+ rounds)`,
    select: (all) =>
      [...all]
        .filter((c) => c.rounds_played >= MIN_ROUNDS_FOR_RANKINGS)
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


const CARD_STYLE: React.CSSProperties = {
  background: T.cardBg,
  borderRadius: 16,
  border: `1px solid ${T.hairline}`,
  marginBottom: 14,
  overflow: 'hidden',
  fontFamily: FONT,
};

const CardHeader: React.FC<{ sublabel: string }> = ({ sublabel }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 16px',
      borderBottom: `1px solid ${T.hairline}`,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 9,
          background: T.amberTint,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <MapPin size={15} color={T.amberDeep} strokeWidth={2.2} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 700,
            color: T.ink,
            letterSpacing: '-0.01em',
            fontFamily: FONT,
          }}
        >
          Course Form
        </p>
        <p
          style={{
            margin: 0,
            fontSize: 10,
            color: T.inkMute,
            marginTop: 1,
            fontFamily: FONT,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {sublabel}
        </p>
      </div>
    </div>
    {/* Detail sheet TBD — placeholder button for visual continuity. */}
    <button
      aria-label="Open detail sheet"
      style={{
        width: 26,
        height: 26,
        borderRadius: 999,
        border: `1px solid ${T.hairline}`,
        background: 'transparent',
        color: T.inkMute,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        flexShrink: 0,
        marginLeft: 8,
      }}
    >
      <Info size={13} strokeWidth={2.2} />
    </button>
  </div>
);

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
      margin: '12px 16px 4px',
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

interface RankAccent {
  color: string;
  textColor: string;
  label: string;
  showTrophy: boolean;
}

function getRankAccent(rank: number): RankAccent {
  if (rank === 1) return { color: T.gold, textColor: T.ink, label: '1ST', showTrophy: true };
  if (rank === 2) return { color: T.silver, textColor: '#fff', label: '2ND', showTrophy: false };
  return { color: T.bronze, textColor: '#fff', label: '3RD', showTrophy: false };
}

const PodiumCard: React.FC<{ course: CourseForm; rank: number }> = ({ course, rank }) => {
  const accent = getRankAccent(rank);
  const valueColor = deltaColor(course.delta);
  const isFirst = rank === 1;

  return (
    <div
      style={{
        background: T.cardBg,
        borderRadius: 14,
        border: `1px solid ${isFirst ? 'rgba(247,147,30,0.25)' : T.hairline}`,
        overflow: 'hidden',
        padding: '12px 14px',
        boxShadow: isFirst
          ? '0 2px 4px rgba(15,23,42,0.04), 0 6px 16px rgba(247,147,30,0.10)'
          : '0 1px 2px rgba(15,23,42,0.04)',
        marginBottom: 8,
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1, minWidth: 0 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              padding: '3px 8px',
              borderRadius: 99,
              background: accent.color,
              color: accent.textColor,
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: '0.08em',
              flexShrink: 0,
              boxShadow: '0 1px 2px rgba(0,0,0,0.10)',
              fontFamily: FONT,
              marginTop: 1,
            }}
          >
            {accent.showTrophy && <Trophy size={9} strokeWidth={2.6} fill={accent.textColor} />}
            {accent.label}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 800,
                color: T.ink,
                letterSpacing: '-0.01em',
                lineHeight: 1.25,
                fontFamily: FONT,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {course.course_name}
            </div>
            <div
              style={{
                fontSize: 10.5,
                color: T.inkMute,
                marginTop: 4,
                fontWeight: 600,
                fontFamily: FONT,
              }}
            >
              <strong style={{ color: T.ink, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                {course.rounds_played}
              </strong>{' '}
              {course.rounds_played === 1 ? 'round' : 'rounds'}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: valueColor,
              lineHeight: 1,
              letterSpacing: '-0.03em',
              fontVariantNumeric: 'tabular-nums',
              fontFamily: FONT,
            }}
          >
            {fmtDelta(course.delta)}
          </div>
          <div
            style={{
              fontSize: 9,
              color: T.inkMute,
              fontWeight: 700,
              letterSpacing: '0.10em',
              marginTop: 3,
              fontFamily: FONT,
            }}
          >
            VS HCP
          </div>
        </div>
      </div>
    </div>
  );
};

const PodiumCards: React.FC<{ courses: CourseForm[] }> = ({ courses }) => {
  if (courses.length === 0) {
    return (
      <div style={{ padding: '24px 16px 28px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 12, color: T.inkMute, lineHeight: 1.55, fontFamily: FONT }}>
          Need at least {MIN_ROUNDS_FOR_RANKINGS} rounds at a course before it appears here. Play a few more rounds to unlock this view.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '12px 16px 8px' }}>
      {courses.map((c, i) => (
        <PodiumCard key={c.course_id} course={c} rank={i + 1} />
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
      <div style={CARD_STYLE}>
        <CardHeader sublabel="Loading…" />
        <div
          className="animate-pulse"
          style={{
            margin: '12px 16px 4px',
            height: 36,
            background: T.slateTint,
            borderRadius: 10,
          }}
        />
        <div style={{ padding: '14px 16px 16px' }}>
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
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={CARD_STYLE}>
        <CardHeader sublabel="Play more rounds to see how each course suits your game" />
        <div style={{ padding: '24px 16px 28px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.ink, fontFamily: FONT }}>
            Add some rounds to get started
          </p>
          <p style={{ margin: '6px 0 0', fontSize: 12, color: T.inkMute, lineHeight: 1.5, fontFamily: FONT }}>
            We&apos;ll show how you score at each course once you&apos;ve logged a few rounds.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={CARD_STYLE}>
      <CardHeader sublabel={view.sublabel} />
      <ViewToggle activeView={activeView} onChange={setActiveView} />
      <CourseRows courses={courses} />
      {courses.length > 0 && (() => {
        const top = courses[0];
        const sign = top.delta < 0 ? 'under' : 'over';
        const deltaAbs = Math.abs(top.delta).toFixed(1);
        const role =
          activeView === 'toughest'
            ? 'toughest test'
            : activeView === 'best'
              ? 'home advantage'
              : 'home course';
        return (
          <div
            style={{
              margin: '4px 16px 16px',
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
  );
};

export default CourseFormCard;
