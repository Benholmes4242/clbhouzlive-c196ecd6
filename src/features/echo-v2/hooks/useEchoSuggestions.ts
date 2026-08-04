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

/**
 * `user_profiles.location` is FREE TEXT — "Kent", "Bromley, Kent",
 * "South East London", or a postcode. A postcode in a prompt reads as a
 * database leak ("...near BR1 3TD is worth the trip?"), so anything that is
 * too short or looks like a UK/US postcode falls through to the club country.
 */
const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?(\s*\d[A-Z]{2})?$/i;
const US_ZIP = /^\d{5}(-\d{4})?$/;

function cityFromLocation(location: string | null | undefined): string | null {
  if (!location) return null;
  const first = location.split(',')[0]?.trim();
  if (!first || first.length < 3) return null;
  if (UK_POSTCODE.test(first) || US_ZIP.test(first)) return null;
  // Reject anything that is mostly digits — plot numbers, coordinates, junk.
  if (/\d/.test(first) && first.replace(/\D/g, '').length >= first.length / 2) return null;
  return first;
}

export function useEchoSuggestions(): { suggestions: string[]; isLoading: boolean } {
  const { user } = useSupabaseSession();
  const { data: profile, isLoading: profileLoading } = useUserProfile(user?.id);
  const { data: connection, isLoading: whsLoading } = useWhsConnection(user?.id);
  const { data: trend, isLoading: trendLoading } = useHandicapTrend(connection?.id);

  const clubId = profile?.primary_club_id ?? null;
  const city = cityFromLocation(profile?.location);

  // Only needed when the profile carries no free-text location. Region
  // (county) is the right granularity for a golf trip — "in Kent" — so it
  // leads, then sub_country, then country as the coarse last resort.
  const { data: clubPlace, isLoading: clubLoading } = useQuery<string | null>({
    queryKey: ['echo-v2', 'club-place', clubId],
    enabled: !!clubId && !city,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('golf_clubs')
        .select('region, sub_country, country')
        .eq('id', clubId as string)
        .maybeSingle();
      if (error) throw error;
      const pick = (v: unknown) => {
        const t = typeof v === 'string' ? v.trim() : '';
        return t.length >= 3 ? t : null;
      };
      return pick(data?.region) ?? pick(data?.sub_country) ?? pick(data?.country) ?? null;
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
    const place = city ?? clubPlace ?? null;

    const out: string[] = [];
    // 1 — club name inline so echo_get_course_context fires. See file header.
    if (homeClub) out.push(`How should I play ${homeClub}?`);
    if (indexValue) out.push(`How does my game compare to a ${indexValue} handicap?`);
    if (place) out.push(`Which Top 100 course in ${place} is worth the trip?`);

    // Top up with the fallback set so the welcome always offers three, and
    // never repeats a prompt.
    for (const f of ECHO_FALLBACK_SUGGESTIONS) {
      if (out.length >= 3) break;
      if (!out.includes(f)) out.push(f);
    }
    return out.slice(0, 3);
  }, [isLoading, profile, trend, city, clubPlace]);

  return { suggestions, isLoading };
}
