/**
 * tourhub-seed-media - Seed player_media, event_winners, and event_moments
 * 
 * Seeds:
 * - Top 30 player headshots (from existing photo_url or placeholder)
 * - Winners for closed tournaments
 * - 1-2 moments per closed tournament
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const results = {
      playerMedia: { inserted: 0, skipped: 0, errors: [] as string[] },
      eventWinners: { inserted: 0, skipped: 0, errors: [] as string[] },
      eventMoments: { inserted: 0, skipped: 0, errors: [] as string[] },
    };

    // 1. Get top 30 players by world rank
    const { data: topPlayers, error: playersError } = await supabase
      .from("sr_player_statistics")
      .select(`
        player_id,
        raw_data,
        player:sr_players!inner(id, full_name, photo_url)
      `)
      .order("raw_data->statistics->world_rank", { ascending: true })
      .limit(50);

    if (playersError) {
      console.error("Error fetching players:", playersError);
    }

    // Filter to those with valid world rank and take top 30
    const rankedPlayers = (topPlayers || [])
      .filter((p: any) => {
        const rank = p.raw_data?.statistics?.world_rank;
        return rank && rank > 0;
      })
      .slice(0, 30);

    console.log(`Found ${rankedPlayers.length} ranked players for headshots`);

    // Check existing player_media
    const playerIds = rankedPlayers.map((p: any) => p.player_id);
    const { data: existingMedia } = await supabase
      .from("player_media")
      .select("player_id")
      .in("player_id", playerIds);

    const existingMediaIds = new Set((existingMedia || []).map((m: any) => m.player_id));

    // Insert headshots for players without them
    for (const playerStat of rankedPlayers) {
      const player = (playerStat as any).player;
      if (!player || existingMediaIds.has(player.id)) {
        results.playerMedia.skipped++;
        continue;
      }

      // Use existing photo_url or generate placeholder
      const imageUrl = player.photo_url || 
        `https://ui-avatars.com/api/?name=${encodeURIComponent(player.full_name)}&size=400&background=1e293b&color=fff&bold=true`;

      const { error: insertError } = await supabase
        .from("player_media")
        .insert({
          player_id: player.id,
          headshot_url: imageUrl,
          source: player.photo_url ? "sportradar" : "placeholder",
          confidence: player.photo_url ? 1.0 : 0.5,
        });

      if (insertError) {
        results.playerMedia.errors.push(`${player.full_name}: ${insertError.message}`);
      } else {
        results.playerMedia.inserted++;
      }
    }

    // 2. Get closed tournaments without winners
    const { data: closedTournaments, error: tournamentsError } = await supabase
      .from("sr_tournaments")
      .select("id, name, start_date, end_date")
      .eq("status", "closed")
      .order("end_date", { ascending: false })
      .limit(50);

    if (tournamentsError) {
      console.error("Error fetching tournaments:", tournamentsError);
    }

    // Check existing winners
    const tournamentIds = (closedTournaments || []).map((t: any) => t.id);
    const { data: existingWinners } = await supabase
      .from("event_winners")
      .select("tournament_id")
      .in("tournament_id", tournamentIds);

    const existingWinnerIds = new Set((existingWinners || []).map((w: any) => w.tournament_id));

    // Get leaderboard data for winners
    for (const tournament of closedTournaments || []) {
      if (existingWinnerIds.has(tournament.id)) {
        results.eventWinners.skipped++;
        continue;
      }

      // Get leader from leaderboard
      const { data: leaderboard } = await supabase
        .from("sr_leaderboards")
        .select(`
          player_id,
          position,
          score,
          total,
          player:sr_players(id, full_name)
        `)
        .eq("tournament_id", tournament.id)
        .order("position", { ascending: true })
        .limit(3);

      if (!leaderboard || leaderboard.length === 0) {
        results.eventWinners.skipped++;
        continue;
      }

      const winner = leaderboard[0] as any;
      const runnerUp = leaderboard[1] as any;
      
      // Calculate margin
      const margin = runnerUp ? 
        (winner.total || winner.score || 0) - (runnerUp.total || runnerUp.score || 0) : 
        null;

      const winnerData = {
        tournament_id: tournament.id,
        player_id: winner.player_id,
        score_to_par: winner.score || null,
        winning_score: winner.total || null,
        margin: margin ? Math.abs(margin) : null,
        is_playoff: margin === 0,
        headline: `${winner.player?.full_name || 'Winner'} claims ${tournament.name} title`,
        narrative: margin === 0 
          ? `Won in a playoff` 
          : margin && margin > 0 
            ? `Won by ${Math.abs(margin)} stroke${Math.abs(margin) > 1 ? 's' : ''}`
            : `Captured the title`,
      };

      const { error: winnerError } = await supabase
        .from("event_winners")
        .insert(winnerData);

      if (winnerError) {
        results.eventWinners.errors.push(`${tournament.name}: ${winnerError.message}`);
      } else {
        results.eventWinners.inserted++;
      }
    }

    // 3. Seed event moments for tournaments without them
    const { data: existingMoments } = await supabase
      .from("event_moments")
      .select("tournament_id")
      .in("tournament_id", tournamentIds);

    const existingMomentIds = new Set((existingMoments || []).map((m: any) => m.tournament_id));

    for (const tournament of closedTournaments || []) {
      if (existingMomentIds.has(tournament.id)) {
        results.eventMoments.skipped++;
        continue;
      }

      // Get winner for this tournament
      const { data: winner } = await supabase
        .from("event_winners")
        .select("player_id, headline, narrative")
        .eq("tournament_id", tournament.id)
        .single();

      const moments = [
        {
          tournament_id: tournament.id,
          player_id: winner?.player_id || null,
          moment_type: "winner",  // Valid: winner, playoff, record, ace, milestone, comeback, streak
          headline: winner?.headline || `Champion crowned at ${tournament.name}`,
          description: winner?.narrative || "A memorable finish to the tournament.",
          sort_order: 1,
        },
        {
          tournament_id: tournament.id,
          player_id: null,
          moment_type: "milestone",  // Valid type
          headline: `${tournament.name} delivers drama`,
          description: "The tournament provided exciting golf throughout the week.",
          sort_order: 2,
        },
      ];

      const { error: momentsError } = await supabase
        .from("event_moments")
        .insert(moments);

      if (momentsError) {
        results.eventMoments.errors.push(`${tournament.name}: ${momentsError.message}`);
      } else {
        results.eventMoments.inserted += 2;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        summary: {
          playerMedia: `${results.playerMedia.inserted} inserted, ${results.playerMedia.skipped} skipped`,
          eventWinners: `${results.eventWinners.inserted} inserted, ${results.eventWinners.skipped} skipped`,
          eventMoments: `${results.eventMoments.inserted} inserted, ${results.eventMoments.skipped} skipped`,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in tourhub-seed-media:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
