/**
 * PRO HOLE DATA QUEUE - the three cases that stop a course showing a PROS view
 * of its hole-by-hole analytics. Read-only: every case is resolved elsewhere
 * (the venue mapping, or the tournament data itself), so this states what is
 * blocked and why, and nothing else.
 *
 *   1 Venue unresolved      - tournament venue has no mapping row.
 *   2 Venue ambiguous       - mapping resolves to nothing, or the venue hosts
 *                             more than one course and the mapping names none.
 *   3 Par disagreement      - pooled tournaments disagree on a hole's par, so
 *                             the guard withholds the whole course.
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { adminTheme as t } from '../theme';

interface UnresolvedVenue {
  venue_name: string;
  venue_course_name: string | null;
  venue_city: string | null;
  venue_country: string | null;
  tournaments: number;
}

interface AmbiguousVenue {
  venue_name: string;
  mapped_course_name: string | null;
  golf_course_id: string | null;
  tournament_course_names: (string | null)[];
}

interface ParDisagreement {
  golf_course_id: string;
  course_name: string;
  bad_holes: number;
  holes: { hole_no: number; pars: number[] }[];
}

interface Queue {
  unresolved_venues: UnresolvedVenue[];
  ambiguous_venues: AmbiguousVenue[];
  par_disagreements: ParDisagreement[];
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

const ProHoleDataQueue: React.FC = () => {
  const { data, isLoading, error } = useQuery<Queue>({
    queryKey: ['admin-pro-hole-data-queue'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: res, error: err } = await (supabase.rpc as any)('get_pro_hole_data_queue');
      if (err) throw err;
      return res as Queue;
    },
    staleTime: 300_000,
  });

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

  const q: Queue = data ?? { unresolved_venues: [], ambiguous_venues: [], par_disagreements: [] };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: t.inkFaint,
        }}
      >
        Pro hole data
      </div>

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
                <span style={{ color: t.inkMuted }}>
                  {' '}
                  · {[v.venue_city, v.venue_country].filter(Boolean).join(', ') || '—'}
                </span>
              </>
            }
            right={`${v.tournaments} ${v.tournaments === 1 ? 'tournament' : 'tournaments'}`}
            last={i === arr.length - 1}
          />
        ))}
      </Case>

      <Case
        title="Venue ambiguous"
        note="The mapping row resolves to nothing, or the venue hosts more than one course and the mapping names none - pro data cannot be attributed."
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
                  · {v.golf_course_id ? 'course names differ' : 'no course linked'}
                </span>
              </>
            }
            right={v.tournament_course_names.filter(Boolean).join(' / ') || undefined}
            last={i === arr.length - 1}
          />
        ))}
      </Case>

      <Case
        title="Par disagreement"
        note="Pooled tournaments disagree on a hole's par. The guard withholds the whole course rather than average two different holes."
        count={q.par_disagreements.length}
      >
        {q.par_disagreements.map((c, i, arr) => (
          <Row
            key={c.golf_course_id}
            left={
              <>
                <span style={{ fontWeight: 600 }}>{c.course_name}</span>
                <span style={{ color: t.inkMuted }}>
                  {' '}
                  ·{' '}
                  {c.holes
                    .slice(0, 4)
                    .map((h) => `${h.hole_no}: ${h.pars.join('/')}`)
                    .join(', ')}
                  {c.holes.length > 4 ? '…' : ''}
                </span>
              </>
            }
            right={`${c.bad_holes} ${c.bad_holes === 1 ? 'hole' : 'holes'}`}
            last={i === arr.length - 1}
          />
        ))}
      </Case>
    </div>
  );
};

export default ProHoleDataQueue;
