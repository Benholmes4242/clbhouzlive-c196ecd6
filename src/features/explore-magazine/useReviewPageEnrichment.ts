import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

export interface ReviewBreakdown {
  design: number | null;
  conditions: number | null;
  clubhouse: number | null;
  facilities: number | null;
}

export interface ReviewPageEnrichment {
  breakdown: ReviewBreakdown;
  photoCount: number;
}

interface ReviewEnrichmentRow {
  id: string;
  design_score: number | null;
  condition_score: number | null;
  clubhouse_score: number | null;
  facilities_score: number | null;
  course_review_media: Array<{ id: string }> | null;
}

/** Resolved review IDs survive page growth and remounts for this browser session. */
const resolved = new Map<string, ReviewPageEnrichment>();

function normaliseIds(reviewIds: string[]): string[] {
  return Array.from(new Set(reviewIds.filter(Boolean))).sort();
}

export function useReviewPageEnrichment(reviewIds: string[]): Map<string, ReviewPageEnrichment> {
  const ids = useMemo(() => normaliseIds(reviewIds), [reviewIds]);
  const idKey = ids.join('|');
  const missing = ids.filter((id) => !resolved.has(id));
  const missingKey = missing.join('|');

  const query = useQuery({
    queryKey: ['explore', 'review-page-enrichment-v1', missingKey],
    enabled: missing.length > 0,
    staleTime: Infinity,
    gcTime: 60 * 60_000,
    queryFn: async (): Promise<Map<string, ReviewPageEnrichment>> => {
      const out = new Map<string, ReviewPageEnrichment>();
      const { data, error } = await supabase
        .from('course_ratings')
        .select(`
          id,
          design_score,
          condition_score,
          clubhouse_score,
          facilities_score,
          course_review_media!left(id)
        `)
        .in('id', missing)
        .eq('course_review_media.media_type', 'image');
      if (error) throw error;

      for (const row of (data ?? []) as ReviewEnrichmentRow[]) {
        out.set(row.id, {
          breakdown: {
            design: row.design_score,
            conditions: row.condition_score,
            clubhouse: row.clubhouse_score,
            facilities: row.facilities_score,
          },
          photoCount: row.course_review_media?.length ?? 0,
        });
      }
      /* A requested ID with no visible row is resolved as absent. This prevents
         repeated reads on every render while preserving the card's empty state. */
      for (const id of missing) {
        if (!out.has(id)) {
          out.set(id, {
            breakdown: { design: null, conditions: null, clubhouse: null, facilities: null },
            photoCount: 0,
          });
        }
      }
      return out;
    },
  });

  if (query.data) {
    for (const [id, value] of query.data) resolved.set(id, value);
  }

  return useMemo(() => {
    const out = new Map<string, ReviewPageEnrichment>();
    for (const id of ids) {
      const value = resolved.get(id);
      if (value) out.set(id, value);
    }
    return out;
  }, [idKey, query.data]);
}