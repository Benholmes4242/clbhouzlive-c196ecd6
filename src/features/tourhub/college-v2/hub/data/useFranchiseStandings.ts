/**
 * useFranchiseStandings — the yearbook data source.
 *
 * Composes college_season_stats (ranking + points + alumni count),
 * college_media (name + logo), college_weekly_movers (rank movement),
 * and a single sr_players fetch (top-3 alumni faces per college).
 *
 * All returns are JSON-safe (Records + arrays, no Maps).
 *
 * Verified columns (types.ts):
 *   college_season_stats: normalized_name, player_count, earnings_total,
 *                         wins_total, top10_total, season_id
 *   sr_seasons:           id, year
 *   college_media:        normalized_name, college_name, short_name, logo_url
 *   college_weekly_movers: normalized_name, earnings_rank_change,
 *                         season_id, week_start
 *   sr_players:           id, first_name, last_name, full_name, photo_url,
 *                         college_normalized
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentSeasonId } from '@/features/tourhub/hooks/useCollegeStats';

export interface YearbookAlumnus {
  id: string;
  name: string;
  photoUrl: string | null;
}

export interface YearbookStanding {
  rank: number;
  normalizedName: string;
  collegeName: string;
  shortName: string | null;
  logoUrl: string | null;
  pointsTotal: number;
  alumniCount: number;
  winsTotal: number;
  top10Total: number;
  /** Positive = rose in rank; negative = fell; null = no data. */
  rankChange: number | null;
  topAlumni: YearbookAlumnus[];
}

export interface FranchiseStandingsData {
  year: number | null;
  standings: YearbookStanding[];
}

export function useFranchiseStandings() {
  const seasonId = useCurrentSeasonId();

  return useQuery<FranchiseStandingsData>({
    queryKey: ['college-v2', 'franchise-standings', seasonId ?? 'none'],
    enabled: !!seasonId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!seasonId) return { year: null, standings: [] };

      // --- 1. Season year ---
      const { data: seasonRow } = await supabase
        .from('sr_seasons')
        .select('year')
        .eq('id', seasonId)
        .maybeSingle();
      const year = seasonRow?.year ?? null;

      // --- 2. Season stats ---
      const { data: statsRows } = await supabase
        .from('college_season_stats')
        .select('normalized_name, player_count, earnings_total, wins_total, top10_total')
        .eq('season_id', seasonId);

      const stats = statsRows ?? [];
      if (stats.length === 0) return { year, standings: [] };

      const slugs = stats.map((s) => s.normalized_name);

      // --- 3. Media (crest + name) ---
      const { data: mediaRows } = await supabase
        .from('college_media')
        .select('normalized_name, college_name, short_name, logo_url')
        .in('normalized_name', slugs);
      const mediaByName: Record<string, { college_name: string; short_name: string | null; logo_url: string | null }> = {};
      for (const m of mediaRows ?? []) {
        mediaByName[m.normalized_name] = {
          college_name: m.college_name,
          short_name: m.short_name,
          logo_url: m.logo_url,
        };
      }

      // --- 4. Movement (latest week only) ---
      const { data: latestWeekRow } = await supabase
        .from('college_weekly_movers')
        .select('week_start')
        .eq('season_id', seasonId)
        .order('week_start', { ascending: false })
        .limit(1)
        .maybeSingle();

      const rankChangeByName: Record<string, number> = {};
      if (latestWeekRow?.week_start) {
        const { data: moveRows } = await supabase
          .from('college_weekly_movers')
          .select('normalized_name, earnings_rank_change')
          .eq('season_id', seasonId)
          .eq('week_start', latestWeekRow.week_start);
        for (const row of moveRows ?? []) {
          if (row.earnings_rank_change != null) {
            rankChangeByName[row.normalized_name] = row.earnings_rank_change;
          }
        }
      }

      // --- 5. Top-3 alumni faces per college (one batched query) ---
      const { data: alumniRows } = await supabase
        .from('sr_players')
        .select('id, first_name, last_name, full_name, photo_url, college_normalized')
        .in('college_normalized', slugs)
        .not('photo_url', 'is', null)
        .limit(slugs.length * 5);

      const alumniByCollege: Record<string, YearbookAlumnus[]> = {};
      for (const p of alumniRows ?? []) {
        const key = p.college_normalized;
        if (!key) continue;
        const bucket = (alumniByCollege[key] ??= []);
        if (bucket.length >= 3) continue;
        bucket.push({
          id: p.id,
          name: p.full_name || `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || 'Alumnus',
          photoUrl: p.photo_url,
        });
      }

      // --- 6. Assemble, rank by earnings_total desc ---
      const sorted = [...stats].sort((a, b) => (b.earnings_total ?? 0) - (a.earnings_total ?? 0));
      const standings: YearbookStanding[] = sorted.map((s, idx) => ({
        rank: idx + 1,
        normalizedName: s.normalized_name,
        collegeName: mediaByName[s.normalized_name]?.college_name ?? s.normalized_name,
        shortName: mediaByName[s.normalized_name]?.short_name ?? null,
        logoUrl: mediaByName[s.normalized_name]?.logo_url ?? null,
        pointsTotal: Math.round(s.earnings_total ?? 0),
        alumniCount: s.player_count ?? 0,
        rankChange: rankChangeByName[s.normalized_name] ?? null,
        topAlumni: alumniByCollege[s.normalized_name] ?? [],
      }));

      return { year, standings };
    },
  });
}
