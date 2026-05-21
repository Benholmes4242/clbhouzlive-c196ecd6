import React, { useMemo } from 'react';
import {
  FONT,
  TAB,
  BG_1,
  T60,
  T100,
  T40,
  LINE,
  LINE_2,
} from './_shared/tokens';
import type { FriendRivalryHydrated } from '@/lib/whs/types';
import type { RivalryDimension } from '@/lib/whs/utils/useRivalryDimension';

interface CourseAgg {
  course_id: string;
  course_name: string;
  rounds: number;
  ownerWins: number;
  rivalWins: number;
  ties: number;
  lastPlayed: string;
}

function outcomeFor(
  r: FriendRivalryHydrated['shared_round_results'][number],
  dim: RivalryDimension,
): 'W' | 'L' | 'T' {
  return dim === 'gross' ? r.gross_outcome : r.stableford_outcome;
}

export function aggregateCourses(
  row: FriendRivalryHydrated,
  dim: RivalryDimension,
): CourseAgg[] {
  const map = new Map<string, CourseAgg>();
  for (const r of row.shared_round_results ?? []) {
    let agg = map.get(r.course_id);
    if (!agg) {
      agg = {
        course_id: r.course_id,
        course_name: r.course_name,
        rounds: 0,
        ownerWins: 0,
        rivalWins: 0,
        ties: 0,
        lastPlayed: r.play_date,
      };
      map.set(r.course_id, agg);
    }
    agg.rounds += 1;
    const o = outcomeFor(r, dim);
    if (o === 'W') agg.ownerWins += 1;
    else if (o === 'L') agg.rivalWins += 1;
    else agg.ties += 1;
    if (r.play_date > agg.lastPlayed) agg.lastPlayed = r.play_date;
  }
  return Array.from(map.values()).sort(
    (a, b) => b.rounds - a.rounds || b.lastPlayed.localeCompare(a.lastPlayed),
  );
}

interface Props {
  row: FriendRivalryHydrated;
  dim: RivalryDimension;
  onCoursePick: (courseId: string) => void;
}

export const CoursesPlayedSection: React.FC<Props> = ({
  row,
  dim,
  onCoursePick,
}) => {
  const courses = useMemo(() => aggregateCourses(row, dim), [row, dim]);
  if (courses.length === 0) return null;

  return (
    <section style={{ padding: '24px 16px 8px' }}>
      <div
        style={{
          color: T60,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          borderTop: `0.5px solid ${LINE_2}`,
          paddingTop: 12,
          fontFamily: FONT,
        }}
      >
        Courses played together
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          marginTop: 12,
        }}
      >
        {courses.map((c) => (
          <button
            key={c.course_id}
            type="button"
            onClick={() => onCoursePick(c.course_id)}
            style={{
              textAlign: 'left',
              padding: 14,
              background: BG_1,
              border: `1px solid ${LINE}`,
              borderRadius: 12,
              cursor: 'pointer',
              color: T100,
              fontFamily: FONT,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                lineHeight: 1.25,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {c.course_name}
            </div>
            <div
              style={{
                marginTop: 8,
                display: 'flex',
                alignItems: 'baseline',
                gap: 6,
                color: T100,
                fontSize: 18,
                fontWeight: 800,
                ...TAB,
              }}
            >
              <span>{c.ownerWins}</span>
              <span style={{ color: T40, fontSize: 13, fontWeight: 600 }}>
                —
              </span>
              <span>{c.rivalWins}</span>
              <span
                style={{
                  marginLeft: 'auto',
                  color: T60,
                  fontSize: 11,
                  fontWeight: 600,
                  ...TAB,
                }}
              >
                {c.rounds}rd{c.ties > 0 ? ` · ${c.ties}T` : ''}
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};
