/**
 * Echo welcome suggestions — personalised where Echo can actually answer.
 *
 * GROUNDING RULE (do not "improve" this away):
 * echo_get_user_context returns profile fields ONLY — no rounds, no holes,
 * no strokes gained. So every connected prompt below is answerable from
 * profile + course + tour context. Any prompt that asks Echo about the
 * member's scoring ("where am I losing shots?") would produce an
 * interrogation, not an answer.
 *
 * Prompt 1 deliberately carries the CLUB NAME IN THE PROMPT TEXT, because
 * that is what triggers echo_get_course_context server-side. Do not
 * simplify the wording to "How should I play my home club?" — that silently
 * breaks the course lookup.
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useWhsConnection, useHandicapTrend } from '@/lib/whs/hooks';

/** Unconnected / unknown-profile set. Answerable with zero member data. */
export const ECHO_FALLBACK_SUGGESTIONS = [
  'What makes a great links course?',
  'Who is in form on tour this week?',
  'Which Top 100 courses should be on my list?',
] as const;

/** First segment of a free-text location ("St Andrews, Fife" -> "St Andrews"). */
function cityFromLocation(location: string | null | undefined): string | null {
  if (!location) return null;
  const first = location.split(',')[0]?.trim();
  return first && first.length > 1 ? first : null;
}

export function useEchoSuggestions(): { suggestions: string[]; isLoading: boolean } {
  const { user } = useSupabaseSession();
  const { data: profile, isLoading: profileLoading } = useUserProfile(user?.id);
  const { data: connection, isLoading: whsLoading } = useWhsConnection(user?.id);
  const { data: trend, isLoading: trendLoading } = useHandicapTrend(connection?.id);

  const clubId = profile?.primary_club_id ?? null;
  const city = cityFromLocation(profile?.location);

  // Only needed when the profile carries no free-text location: the home
  // club's country is the coarsest acceptable place anchor for prompt 3.
  const { data: clubCountry, isLoading: clubLoading } = useQuery<string | null>({
    queryKey: ['echo-v2', 'club-country', clubId],
    enabled: !!clubId && !city,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('golf_clubs')
        .select('country')
        .eq('id', clubId as string)
        .maybeSingle();
      if (error) throw error;
      return (data?.country as string | null) ?? null;
    },
  });

  const isLoading =
    profileLoading ||
    whsLoading ||
    (!!connection?.id && trendLoading) ||
    (!!clubId && !city && clubLoading);

  const suggestions = useMemo(() => {
    if (isLoading) return [];

    const homeClub = profile?.home_club?.trim() || null;
    const indexValue =
      trend?.current != null
        ? Number(trend.current).toFixed(1)
        : profile?.eg_handicap_index != null
          ? Number(profile.eg_handicap_index).toFixed(1)
          : null;
    const place = city ?? clubCountry ?? null;

    const out: string[] = [];
    // 1 — club name inline so echo_get_course_context fires. See file header.
    if (homeClub) out.push(`How should I play ${homeClub}?`);
    if (indexValue) out.push(`How does my game compare to a ${indexValue} handicap?`);
    if (place) out.push(`Which Top 100 course near ${place} is worth the trip?`);

    // Top up with the fallback set so the welcome always offers three, and
    // never repeats a prompt.
    for (const f of ECHO_FALLBACK_SUGGESTIONS) {
      if (out.length >= 3) break;
      if (!out.includes(f)) out.push(f);
    }
    return out.slice(0, 3);
  }, [isLoading, profile, trend, city, clubCountry]);

  return { suggestions, isLoading };
}
