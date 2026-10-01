/**
 * VenueRotationLine — "Also played at X and Y" beneath the overview venue.
 *
 * Reads sr_tournaments.venue_rotation (ordered golf_course_ids). DORMANT until
 * that column exists: the row is selected with `*`, so a missing column is
 * simply absent. Absent, null, empty, or only the primary venue → renders
 * nothing (no label, no row, no reserved space).
 */
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Fragment } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PAGE_CANVAS } from '@/lib/tokens/surfaces';
import { FONT, INK, WHITE_ALPHA_65 } from '../../../_shared/tokens';

interface RotationCourse { id: string; name: string }

export function VenueRotationLine({ tournamentId }: { tournamentId: string | undefined }) {
  const navigate = useNavigate();
  const { data } = useQuery<RotationCourse[]>({
    queryKey: ['tourhub', 'venue-rotation', tournamentId],
    enabled: !!tournamentId,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data: row } = await supabase
        .from('sr_tournaments')
        .select('*')
        .eq('id', tournamentId as string)
        .maybeSingle();
      const r = row as Record<string, unknown> | null;
      const rotation = Array.isArray(r?.venue_rotation) ? (r!.venue_rotation as unknown[]) : [];
      const primary = (r?.golf_course_id as string | null) ?? null;
      const others = rotation.filter((id): id is string => typeof id === 'string' && id !== primary);
      if (others.length === 0) return [];
      const { data: courses } = await supabase.from('golf_courses').select('id, name').in('id', others);
      const byId = new Map(((courses ?? []) as RotationCourse[]).map((c) => [c.id, c]));
      return others.map((id) => byId.get(id)).filter((c): c is RotationCourse => !!c);
    },
  });

  if (!data || data.length === 0) return null;

  return (
    <div
      data-overview-venue-rotation
      style={{ background: PAGE_CANVAS, padding: '8px 24px', fontFamily: FONT, fontSize: 13, color: WHITE_ALPHA_65 }}
    >
      Also played at{' '}
      {data.map((c, i) => (
        <Fragment key={c.id}>
          {i > 0 ? (i === data.length - 1 ? ' and ' : ', ') : null}
          <button
            type="button"
            onClick={() => navigate(`/courses/${c.id}`)}
            style={{ margin: 0, padding: 0, border: 'none', background: 'transparent', color: INK, font: 'inherit', fontWeight: 600, cursor: 'pointer' }}
          >
            {c.name.replace(/\s*\([^)]*\)\s*$/, '')}
          </button>
        </Fragment>
      ))}
    </div>
  );
}
