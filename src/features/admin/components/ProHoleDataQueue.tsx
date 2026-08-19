/**
 * PRO HOLE DATA QUEUE - the three cases that stop a course showing a PROS view
 * of its hole-by-hole analytics. Read-only: every case is resolved elsewhere
 * (the venue mapping, or the tournament data itself), so this states what is
 * blocked and why, and nothing else.
 *
 *   1 Venue unresolved       - tournament venue has no mapping row.
 *   2 Venue ambiguous        - the venue hosts more than one course and the
 *                              tournament's course name resolves none of them.
 *   3 Course name unresolved - the tournament names a course we do not map
 *                              (played away from the venue's traditional home).
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { adminTheme as t } from '../theme';

interface UnresolvedVenue {
  venue_name: string;
  venue_course_name: string | null;
  tournaments: number;
}

interface AmbiguousVenue {
  venue_name: string;
  course_names: (string | null)[];
  tournaments: number;
}

interface UnresolvedCourseName {
  venue_name: string;
  venue_course_name: string;
  tournaments: number;
}

interface Queue {
  unresolved_venues: UnresolvedVenue[];
  ambiguous_venues: AmbiguousVenue[];
  unresolved_course_names: UnresolvedCourseName[];
}


const Count: React.FC<{ n: number }> = ({ n }) => (
  <span
    style={{
      display: 'inline-flex',
      padding: '2px 8px',
      borderRadius: 999,
      background: t.neutralSoft,
      color: t.inkMuted,
      fontSize: 11,
      fontWeight: 700,
      fontVariantNumeric: 'tabular-nums',
    }}
  >
    {n}
  </span>
);

const Case: React.FC<{ title: string; note: string; count: number; children: React.ReactNode }> = ({
  title,
  note,
  count,
  children,
}) => (
  <div
    style={{
      background: t.surface,
      border: `1px solid ${t.line}`,
      borderRadius: t.radius.lg,
      padding: 14,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: t.ink }}>{title}</span>
      <Count n={count} />
    </div>
    <div style={{ fontSize: 12, color: t.inkMuted, lineHeight: 1.5 }}>{note}</div>
    {count > 0 ? (
      <div style={{ display: 'flex', flexDirection: 'column' }}>{children}</div>
    ) : (
      <div style={{ fontSize: 12, color: t.inkFaint }}>Nothing queued.</div>
    )}
  </div>
);

const Row: React.FC<{ left: React.ReactNode; right?: React.ReactNode; last?: boolean }> = ({
  left,
  right,
  last,
}) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: 10,
      padding: '8px 0',
      borderBottom: last ? 'none' : `1px solid ${t.hairline}`,
      fontSize: 12.5,
      color: t.ink,
      minWidth: 0,
    }}
  >
    <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{left}</span>
    {right != null && (
      <span
        style={{
          color: t.inkMuted,
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
          fontSize: 12,
        }}
      >
        {right}
      </span>
    )}
  </div>
);

/** Shared query - the page reads it for the tab count, the panel for its rows. */
export function useProHoleDataQueue() {
  return useQuery<Queue>({
    queryKey: ['admin-pro-hole-data-queue'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: res, error: err } = await (supabase.rpc as any)('get_pro_hole_data_queue');
      if (err) throw err;
      return res as Queue;
    },
    staleTime: 300_000,
  });
}

/** Item count for the tab badge: queued tournaments across every sub-group. */
export function proHoleQueueCount(q: Queue | undefined): number {
  if (!q) return 0;
  const sum = (rows: Array<{ tournaments: number }>) =>
    rows.reduce((n, r) => n + (r.tournaments ?? 0), 0);
  return (
    sum(q.unresolved_venues ?? []) +
    sum(q.ambiguous_venues ?? []) +
    sum(q.unresolved_course_names ?? [])
  );
}

const ProHoleDataQueue: React.FC = () => {
  const { data, isLoading, error } = useProHoleDataQueue();

  if (isLoading) return null;
  if (error) {
    return (
      <div
        style={{
          padding: '10px 12px',
          borderRadius: t.radius.md,
          background: t.dangerSoft,
          color: t.dangerText,
          fontSize: 12,
        }}
      >
        {(error as Error).message}
      </div>
    );
  }

  const q: Queue = data ?? {
    unresolved_venues: [],
    ambiguous_venues: [],
    unresolved_course_names: [],
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Case
        title="Venue unresolved"
        note="These tournament venues have no mapping row, so no course can show a Pros view of its holes."
        count={q.unresolved_venues.length}
      >
        {q.unresolved_venues.map((v, i, arr) => (
          <Row
            key={v.venue_name}
            left={
              <>
                <span style={{ fontWeight: 600 }}>{v.venue_name}</span>
                {v.venue_course_name ? (
                  <span style={{ color: t.inkMuted }}> · {v.venue_course_name}</span>
                ) : null}
              </>
            }
            right={`${v.tournaments} ${v.tournaments === 1 ? 'tournament' : 'tournaments'}`}
            last={i === arr.length - 1}
          />
        ))}
      </Case>

      <Case
        title="Venue ambiguous"
        note="The venue hosts more than one course and the tournament's course name resolves none of them - pro data cannot be attributed."
        count={q.ambiguous_venues.length}
      >
        {q.ambiguous_venues.map((v, i, arr) => (
          <Row
            key={`${v.venue_name}-${i}`}
            left={
              <>
                <span style={{ fontWeight: 600 }}>{v.venue_name}</span>
                <span style={{ color: t.inkMuted }}>
                  {' '}
                  · {v.course_names.filter(Boolean).join(' / ') || 'no course named'}
                </span>
              </>
            }
            right={`${v.tournaments} ${v.tournaments === 1 ? 'tournament' : 'tournaments'}`}
            last={i === arr.length - 1}
          />
        ))}
      </Case>

      <Case
        title="Course name unresolved"
        note="The tournament names a course we do not map - the event was played away from the venue's traditional home, so nothing is attributed."
        count={q.unresolved_course_names.length}
      >
        {q.unresolved_course_names.map((c, i, arr) => (
          <Row
            key={`${c.venue_name}-${c.venue_course_name}`}
            left={
              <>
                <span style={{ fontWeight: 600 }}>{c.venue_course_name}</span>
                <span style={{ color: t.inkMuted }}> · listed at {c.venue_name}</span>
              </>
            }
            right={`${c.tournaments} ${c.tournaments === 1 ? 'tournament' : 'tournaments'}`}
            last={i === arr.length - 1}
          />
        ))}
      </Case>

    </div>
  );
};

export default ProHoleDataQueue;
