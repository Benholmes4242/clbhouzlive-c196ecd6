/**
 * inject-tournament-post — Creates a synthetic tournament result post in the Clubhouse feed
 *
 * Called by tournament-live-sync when a tournament transitions to closed/complete.
 * Idempotent: checks tournament_result_meta before inserting (one post per tournament ever).
 *
 * Input: { tournamentId: string } — the sr_tournaments.id (UUID)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// ── Tour priority & display mapping ─────────────────────────────────────────

interface TourInfo {
  priority: number;
  display: string;
}

function getTourInfo(tourSlug: string): TourInfo {
  const map: Record<string, TourInfo> = {
    pga:   { priority: 800, display: 'PGA TOUR' },
    lpga:  { priority: 600, display: 'LPGA Tour' },
    pgad:  { priority: 500, display: 'Korn Ferry Tour' },
    champ: { priority: 500, display: 'Champions Tour' },
    liv:   { priority: 700, display: 'LIV Golf' },
    euro:  { priority: 700, display: 'DP World Tour' },
    dpw:   { priority: 700, display: 'DP World Tour' },
  };
  return map[tourSlug.toLowerCase()] || { priority: 500, display: tourSlug };
}

function mapTourName(tourName: string): string {
  const name = tourName.toLowerCase();
  if (name.includes('liv')) return 'liv';
  if (name.includes('lpga')) return 'lpga';
  if (name.includes('dp world') || name.includes('european') || name.includes('euro')) return 'euro';
  if (name.includes('champions') || name.includes('champ')) return 'champ';
  if (name.includes('korn ferry') || name.includes('pgad')) return 'pgad';
  if (name.includes('pga')) return 'pga';
  return 'pga';
}

function formatScoreDisplay(score: number | null): string {
  if (score === null || score === undefined) return 'E';
  if (score === 0) return 'E';
  if (score > 0) return `+${score}`;
  return `${score}`;
}

// ── R2 headshot URL (mirrors src/utils/playerHeadshot.ts) ───────────────────

const R2_BASE = 'https://pub-f598829c702247c88b3281e7ee9e35ea.r2.dev';

const TOUR_FOLDER: Record<string, string> = {
  pga:   'PGA%20Tour',
  euro:  'DP%20World%20Tour',
  lpga:  'LPGA',
  pgad:  'Korn%20Ferry',
  liv:   'LIV',
  champ: 'Champions%20Tour',
};

function getPlayerHeadshotUrl(fullName: string, tourCode: string): string | null {
  const folder = TOUR_FOLDER[tourCode.toLowerCase()];
  if (!folder || !fullName) return null;
  const encoded = encodeURIComponent(fullName);
  return `${R2_BASE}/${folder}/${encoded}.webp`;
}

// ── Main handler ────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const systemAccountUserId = Deno.env.get('SYSTEM_ACCOUNT_USER_ID');

    if (!systemAccountUserId) {
      console.error('[InjectPost] SYSTEM_ACCOUNT_USER_ID not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'SYSTEM_ACCOUNT_USER_ID not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { tournamentId } = await req.json();

    if (!tournamentId) {
      return new Response(
        JSON.stringify({ success: false, error: 'tournamentId required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[InjectPost] Processing tournament ${tournamentId}`);

    // ── STEP 1: Idempotency guard ───────────────────────────────────────
    const { data: existingMeta } = await supabase
      .from('tournament_result_meta')
      .select('id')
      .eq('tournament_id', tournamentId)
      .maybeSingle();

    if (existingMeta) {
      console.log(`[InjectPost] Post already exists for tournament ${tournamentId} — skipping`);
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'already_exists' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── STEP 2: Fetch tournament data ───────────────────────────────────
    const { data: tournament, error: tournamentError } = await supabase
      .from('sr_tournaments')
      .select('id, name, status, venue_name, venue_city, venue_country, season_id, purse, currency')
      .eq('id', tournamentId)
      .maybeSingle();

    if (tournamentError || !tournament) {
      console.error('[InjectPost] Tournament not found:', tournamentError?.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Tournament not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validStatuses = ['closed', 'complete', 'completed', 'official'];
    if (!validStatuses.includes((tournament.status || '').toLowerCase())) {
      console.log(`[InjectPost] Tournament status is '${tournament.status}' — not closed, skipping`);
      return new Response(
        JSON.stringify({ success: false, error: `Tournament status '${tournament.status}' is not closed/complete` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── STEP 3: Determine tour slug and priority ────────────────────────
    const { data: seasonData } = await supabase
      .from('sr_seasons')
      .select('tour_name')
      .eq('id', tournament.season_id)
      .maybeSingle();

    const tourSlug = mapTourName(seasonData?.tour_name || 'pga');
    const tourInfo = getTourInfo(tourSlug);

    // ── STEP 4: Fetch winner from leaderboard ───────────────────────────
    const { data: winnerEntries } = await supabase
      .from('sr_leaderboards')
      .select(`
        player_id, position, position_tied, score, strokes,
        player:sr_players!inner(id, first_name, last_name, full_name, photo_url, pga_tour_id, headshot_override)
      `)
      .eq('tournament_id', tournamentId)
      .eq('position', 1)
      .gt('strokes', 0)
      .order('strokes', { ascending: true })
      .limit(1);

    if (!winnerEntries || winnerEntries.length === 0) {
      console.log('[InjectPost] No winner found — data not ready');
      return new Response(
        JSON.stringify({ success: false, error: 'No winner found — data not ready' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const winnerEntry = winnerEntries[0];
    // deno-lint-ignore no-explicit-any
    const winnerPlayer = winnerEntry.player as any;
    const winnerName = winnerPlayer.full_name || `${winnerPlayer.first_name || ''} ${winnerPlayer.last_name || ''}`.trim();
    const winnerScore = winnerEntry.score ?? 0;
    const winnerScoreDisplay = formatScoreDisplay(winnerScore);

    // ── STEP 5: Determine winner_by string ──────────────────────────────
    let winnerBy = '';
    const { data: secondEntries } = await supabase
      .from('sr_leaderboards')
      .select('score')
      .eq('tournament_id', tournamentId)
      .eq('position', 2)
      .gt('strokes', 0)
      .limit(1);

    if (winnerEntry.position_tied) {
      winnerBy = 'Won in playoff';
    } else if (secondEntries && secondEntries.length > 0) {
      const secondScore = secondEntries[0].score ?? 0;
      // Both scores are relative to par (negative = under par)
      // margin = how much better the winner is. E.g. winner -19, second -14 → margin = 5
      const margin = secondScore - winnerScore;
      if (margin === 1) {
        winnerBy = 'Won by 1 stroke';
      } else if (margin > 1) {
        winnerBy = `Won by ${margin} strokes`;
      } else {
        winnerBy = 'Winner';
      }
    } else {
      winnerBy = 'Winner';
    }

    // ── STEP 6: Fetch scorecard stats for winner (soft failure) ─────────
    let statEagles = 0;
    let statBirdies = 0;
    let statPars = 0;
    let statBogeys = 0;

    try {
      const { data: scorecardStats } = await supabase
        .from('sr_scorecards')
        .select('eagles, birdies, pars, bogeys')
        .eq('tournament_id', tournamentId)
        .eq('player_id', winnerPlayer.id);

      if (scorecardStats && scorecardStats.length > 0) {
        for (const row of scorecardStats) {
          statEagles += row.eagles ?? 0;
          statBirdies += row.birdies ?? 0;
          statPars += row.pars ?? 0;
          statBogeys += row.bogeys ?? 0;
        }
      }
    } catch (err) {
      console.error('[InjectPost] Scorecard stats fetch failed (non-blocking):', (err as Error).message);
    }

    // ── STEP 7: Season stats for winner (soft failure) ──────────────────
    // Currently no sr_player_season_stats table — set all to null
    const statDrivingDistance: number | null = null;
    const statFairwaysPct: number | null = null;
    const statGirPct: number | null = null;
    const statPutts: number | null = null;

    // ── STEP 8: Fetch top finishers for podium rows ─────────────────────
    const { data: topFinishers } = await supabase
      .from('sr_leaderboards')
      .select(`
        position, position_tied, score,
        player:sr_players!inner(id, first_name, last_name, full_name, photo_url, pga_tour_id, headshot_override)
      `)
      .eq('tournament_id', tournamentId)
      .lte('position', 4)
      .gt('strokes', 0)
      .order('position', { ascending: true });

    // Build podium_rows JSONB — skip position 1 (winner shown separately)
    // deno-lint-ignore no-explicit-any
    const podiumRows: any[] = [];
    if (topFinishers && topFinishers.length > 0) {
      // Group by position
      const byPosition = new Map<number, typeof topFinishers>();
      for (const entry of topFinishers) {
        if (entry.position === 1) continue; // Skip winner
        const pos = entry.position!;
        if (!byPosition.has(pos)) byPosition.set(pos, []);
        byPosition.get(pos)!.push(entry);
      }

      const sortedPositions = [...byPosition.keys()].sort((a, b) => a - b);
      for (const pos of sortedPositions) {
        const entries = byPosition.get(pos)!;
        const isTied = entries.length > 1;
        podiumRows.push({
          position: pos,
          label: isTied ? `T${pos}` : `${pos}`,
          // deno-lint-ignore no-explicit-any
          players: entries.map((e: any) => {
            const p = e.player;
            const name = p.full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim();
            const photoUrl = getPlayerHeadshotUrl(
              p.headshot_override || name,
              tourSlug
            );
            return {
              name,
              photoUrl,
              score: formatScoreDisplay(e.score),
            };
          }),
          isTied,
        });
      }
    }

    // ── STEP 9: Resolve winner photo URL (soft failure) ─────────────────
    let winnerPhotoUrl: string | null = null;
    try {
      const nameForLookup = winnerPlayer.headshot_override || winnerPlayer.full_name || winnerName;
      winnerPhotoUrl = getPlayerHeadshotUrl(nameForLookup, tourSlug);
    } catch (err) {
      console.error('[InjectPost] Winner photo resolution failed (non-blocking):', (err as Error).message);
    }

    // ── STEP 10: Course image URL — match venue against golf_courses ───
    let courseImageUrl: string | null = null;
    try {
      const venueName = tournament.venue_name ?? '';
      if (venueName) {
        // Strategy 1: exact name match
        const { data: exactMatch } = await supabase
          .from('golf_courses')
          .select('thumbnail_image')
          .ilike('name', venueName)
          .not('thumbnail_image', 'is', null)
          .limit(1)
          .maybeSingle();

        if (exactMatch?.thumbnail_image) {
          courseImageUrl = exactMatch.thumbnail_image;
        } else {
          // Strategy 2: partial match on first 3 significant words
          const venueWords = venueName.split(' ').slice(0, 3).join(' ');
          const { data: partialMatch } = await supabase
            .from('golf_courses')
            .select('thumbnail_image')
            .ilike('name', `%${venueWords}%`)
            .not('thumbnail_image', 'is', null)
            .limit(1)
            .maybeSingle();

          courseImageUrl = partialMatch?.thumbnail_image ?? null;
        }
      }
    } catch (err) {
      console.error('[InjectPost] Course image lookup failed (non-blocking):', (err as Error).message);
      courseImageUrl = null;
    }

    // ── STEP 11: INSERT into posts table ────────────────────────────────
    const { data: newPost, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: systemAccountUserId,
        actor_type: 'system',
        actor_id: systemAccountUserId,
        post_type: 'tournament_result',
        status: 'published',
        content: null,
        visibility: 'anyone',
      })
      .select('id')
      .single();

    if (postError || !newPost) {
      console.error('[InjectPost] Failed to insert post:', postError?.message);
      return new Response(
        JSON.stringify({ success: false, error: `Post insert failed: ${postError?.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const postId = newPost.id;
    console.log(`[InjectPost] Created post ${postId}`);

    // ── STEP 12: INSERT into tournament_result_meta ──────────────────────
    const { error: metaError } = await supabase
      .from('tournament_result_meta')
      .insert({
        post_id: postId,
        tournament_id: tournamentId,
        tournament_name: tournament.name,
        venue_name: tournament.venue_name,
        venue_city: tournament.venue_city,
        venue_country: tournament.venue_country,
        tour_slug: tourSlug,
        tour_name: tourInfo.display,
        tour_priority: tourInfo.priority,
        winner_id: winnerPlayer.id,
        winner_name: winnerName,
        winner_score: winnerScore,
        winner_score_display: winnerScoreDisplay,
        winner_photo_url: winnerPhotoUrl,
        winner_by: winnerBy,
        stat_eagles: statEagles,
        stat_birdies: statBirdies,
        stat_pars: statPars,
        stat_bogeys: statBogeys,
        stat_driving_distance: statDrivingDistance,
        stat_fairways_pct: statFairwaysPct,
        stat_gir_pct: statGirPct,
        stat_putts: statPutts,
        podium_rows: podiumRows,
        course_image_url: courseImageUrl,
      });

    if (metaError) {
      // If meta insert fails (e.g., unique constraint), clean up the post
      console.error('[InjectPost] Meta insert failed:', metaError.message);
      await supabase.from('posts').delete().eq('id', postId);
      return new Response(
        JSON.stringify({ success: false, error: `Meta insert failed: ${metaError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── STEP 13: Return success ─────────────────────────────────────────
    console.log(`[InjectPost] ✓ Tournament result post created: ${postId} for "${tournament.name}" — ${winnerName} (${winnerScoreDisplay})`);

    return new Response(
      JSON.stringify({
        success: true,
        postId,
        tournamentName: tournament.name,
        winnerName,
        winnerScore: winnerScoreDisplay,
        winnerBy,
        tourSlug,
        tourPriority: tourInfo.priority,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[InjectPost] Fatal error:', (error as Error).message);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
