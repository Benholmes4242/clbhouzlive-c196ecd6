import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

/**
 * THE REVIEW A COURSE CARD QUOTES (BRIEF_COURSES_DISCOVERY §A4).
 *
 * PAGE-SCOPED, same shape as useReviewPageEnrichment / useCourseCardMeta: the
 * visible course ids go in, ONE course_ratings read (plus one batched profile
 * read for the chosen reviewers) comes back, and a Map keyed on course_id is
 * returned. Never a read per card, never a correlated per-row lookup.
 *
 * ONE PER COURSE, picked client-side: most helpful first, then most recent.
 */
export interface CourseQuote {
  reviewId: string;
  courseId: string;
  userId: string | null;
  rating: number;
  text: string;
  name: string | null;
  avatar: string | null;
}

const EMPTY = new Map<string, CourseQuote>();

function firstSentence(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  const match = trimmed.match(/^.+?[.!?](\s|$)/);
  return (match ? match[0] : trimmed).trim();
}

export function useCourseQuotes(courseIds: string[]) {
  const ids = useMemo(() => Array.from(new Set(courseIds.filter(Boolean))).sort(), [courseIds]);
  const query = useQuery<Map<string, CourseQuote>>({
    queryKey: ['explore-magazine', 'course-quotes', ids.join(',')],
    enabled: ids.length > 0,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_ratings')
        .select('id, course_id, user_id, rating, review, helpful_count, created_at')
        .in('course_id', ids)
        .eq('is_mock', false)
        .not('review', 'is', null)
        .neq('review', '');
      if (error) throw error;
      const picked = new Map<string, {
        id: string; course_id: string; user_id: string | null; rating: number; review: string;
        helpful_count: number | null; created_at: string;
      }>();
      for (const row of data ?? []) {
        if (!row.review || !row.review.trim()) continue;
        const current = picked.get(row.course_id);
        const better =
          !current ||
          (row.helpful_count ?? 0) > (current.helpful_count ?? 0) ||
          ((row.helpful_count ?? 0) === (current.helpful_count ?? 0) && row.created_at > current.created_at);
        if (better) picked.set(row.course_id, row as never);
      }
      const userIds = Array.from(new Set(Array.from(picked.values()).map((r) => r.user_id).filter((id): id is string => !!id)));
      const profiles = new Map<string, { name: string | null; avatar: string | null }>();
      if (userIds.length > 0) {
        const { data: people } = await supabase
          .from('profiles')
          .select('id, display_name, username, avatar_url')
          .in('id', userIds);
        for (const p of (people ?? []) as Array<{ id: string; display_name: string | null; username: string | null; avatar_url: string | null }>) {
          profiles.set(p.id, { name: p.display_name || p.username || null, avatar: p.avatar_url });
        }
      }
      const out = new Map<string, CourseQuote>();
      for (const [courseId, row] of picked) {
        const person = row.user_id ? profiles.get(row.user_id) : undefined;
        out.set(courseId, {
          reviewId: row.id,
          courseId,
          userId: row.user_id,
          rating: Number(row.rating),
          text: firstSentence(row.review),
          name: person?.name ?? null,
          avatar: person?.avatar ?? null,
        });
      }
      return out;
    },
  });
  return query.data ?? EMPTY;
}
