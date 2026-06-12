import React, { useMemo } from 'react';
import {
  FONT,
  TAB,
  BG_1,
  T100,
  T50,
  T35,
  
  GREEN,
  RED,
  LINE,
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

const TRACK = 'rgba(255,255,255,0.07)';

export const CoursesPlayedSection: React.FC<Props> = ({
  row,
  dim,
  onCoursePick,
}) => {
  const courses = useMemo(() => aggregateCourses(row, dim), [row, dim]);
  if (courses.length === 0) return null;

  return (
    <section style={{ padding: '0 16px' }}>
      <div
        style={{
          margin: '26px 2px 10px',
          color: '#FFFFFF',
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          fontFamily: FONT,
        }}
      >
        Courses played together
      </div>
      <div
        style={{
          background: BG_1,
          border: `0.5px solid ${LINE}`,
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {courses.map((c, i) => {
          const decided = c.ownerWins + c.rivalWins;
          const fill =
            decided > 0
              ? Math.max(0.08, Math.min(0.92, c.ownerWins / decided))
              : 0.5;
          return (
            <button
              key={c.course_id}
              type="button"
              onClick={() => onCoursePick(c.course_id)}
              style={{
                display: 'grid',
                width: '100%',
                gridTemplateColumns: '1fr auto',
                gap: 12,
                alignItems: 'center',
                padding: '11px 14px',
                background: 'transparent',
                border: 'none',
                borderBottom:
                  i < courses.length - 1 ? `0.5px solid ${LINE}` : 'none',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: FONT,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    color: T100,
                    fontSize: 13.5,
                    fontWeight: 700,
                    lineHeight: 1.2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {c.course_name}
                </div>
                <div
                  style={{
                    marginTop: 7,
                    height: 3,
                    borderRadius: 999,
                    background: TRACK,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${fill * 100}%`,
                      height: '100%',
                      background: GREEN,
                    }}
                  />
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    ...TAB,
                  }}
                >
                  <span style={{ color: GREEN }}>{c.ownerWins}</span>
                  <span style={{ color: T35, margin: '0 4px' }}>–</span>
                  <span style={{ color: c.rivalWins > 0 ? RED : T50 }}>
                    {c.rivalWins}
                  </span>
                </div>
                <div
                  style={{
                    marginTop: 2,
                    color: T50,
                    fontSize: 9.5,
                    fontWeight: 600,
                    ...TAB,
                  }}
                >
                  {c.rounds} rds{c.ties > 0 ? ` · ${c.ties}T` : ''}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
