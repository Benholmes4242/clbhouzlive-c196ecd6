// daily-editorial-generation
//
// Phase 1: deterministic template-based editorial generation for the
// "Top 100" front page. Runs daily (cron 06:00 UTC) and on-demand from
// the Supabase dashboard.
//
// Pulls a snapshot of the championship leaderboard, picks the most
// interesting story using a fixed priority order, then writes a
// templated headline/standfirst into `championship_editorial_daily`.
//
// Phase 2 (NOT in this build) will add Anthropic Claude generation
// with validation; for now `generated_by` is always 'template'.

import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

type TimeFilter = 'seasonal' | 'all_time';

type StoryType =
  | 'leader_change'
  | 'big_climber'
  | 'streak_milestone'
  | 'new_top_10'
  | 'leader_extends'
  | 'season_opening'
  | 'season_closing'
  | 'gap_tightens'
  | 'mid_season_quiet'
  | 'all_time_record'
  | 'all_time_quiet';

interface LeaderRow {
  user_id: string;
  display_name: string;
  username: string | null;
  home_club: string | null;
  rank: number;
  courses: number;
  rank_change_week: number;
  streak_days: number;
}

interface Snapshot {
  timeFilter: TimeFilter;
  seasonId: string | null;
  seasonName: string | null;
  daysRemaining: number | null;
  daysIntoSeason: number | null;
  totalDays: number | null;
  leader: LeaderRow | null;
  second: LeaderRow | null;
  topTen: LeaderRow[];
  topThirty: LeaderRow[];
  biggestClimber: LeaderRow | null;
  longestStreak: LeaderRow | null;
}

interface EditorialOutput {
  storyType: StoryType;
  eyebrow: string;
  headline: string;
  headlineTwo: string;
  standfirst: string;
}

// ----------------------------------------------------------------------------
// Snapshot building
// ----------------------------------------------------------------------------

async function buildSeasonalSnapshot(
  supabase: ReturnType<typeof createClient>,
  season: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
  },
): Promise<Snapshot> {
  const { data: rows, error } = await supabase.rpc(
    'get_championship_leaderboard',
    {
      p_scope: 'global',
      p_limit: 30,
      p_offset: 0,
    },
  );
  if (error) throw error;

  const list = (rows ?? []) as Array<{
    user_id: string;
    display_name: string;
    username: string;
    home_club: string;
    rank: number;
    courses_logged: number;
    rank_change_week: number;
    streak_days: number;
  }>;

  const mapped: LeaderRow[] = list.map((r) => ({
    user_id: r.user_id,
    display_name: r.display_name || r.username || 'A member',
    username: r.username ?? null,
    home_club: r.home_club ?? null,
    rank: r.rank,
    courses: r.courses_logged ?? 0,
    rank_change_week: r.rank_change_week ?? 0,
    streak_days: r.streak_days ?? 0,
  }));

  const start = new Date(season.start_date);
  const end = new Date(season.end_date);
  const now = new Date();
  const totalDays = Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
  );
  const daysIntoSeason = Math.max(
    0,
    Math.round((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
  );
  const daysRemaining = Math.max(
    0,
    Math.round((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
  );

  const topTen = mapped.slice(0, 10);
  const biggestClimber = [...mapped].sort(
    (a, b) => b.rank_change_week - a.rank_change_week,
  )[0] ?? null;
  const longestStreak = [...mapped].sort(
    (a, b) => b.streak_days - a.streak_days,
  )[0] ?? null;

  return {
    timeFilter: 'seasonal',
    seasonId: season.id,
    seasonName: season.name,
    daysRemaining,
    daysIntoSeason,
    totalDays,
    leader: mapped[0] ?? null,
    second: mapped[1] ?? null,
    topTen,
    topThirty: mapped,
    biggestClimber,
    longestStreak,
  };
}

async function buildAllTimeSnapshot(
  supabase: ReturnType<typeof createClient>,
): Promise<Snapshot> {
  const { data: rows, error } = await supabase.rpc(
    'get_championship_leaderboard_alltime',
    { p_scope: 'global', p_limit: 30, p_offset: 0 },
  );
  if (error) throw error;

  const list = (rows ?? []) as Array<{
    user_id: string;
    display_name: string;
    username: string;
    home_club: string;
    rank: number;
    total_courses: number;
  }>;

  const mapped: LeaderRow[] = list.map((r) => ({
    user_id: r.user_id,
    display_name: r.display_name || r.username || 'A member',
    username: r.username ?? null,
    home_club: r.home_club ?? null,
    rank: r.rank,
    courses: r.total_courses ?? 0,
    rank_change_week: 0,
    streak_days: 0,
  }));

  return {
    timeFilter: 'all_time',
    seasonId: null,
    seasonName: null,
    daysRemaining: null,
    daysIntoSeason: null,
    totalDays: null,
    leader: mapped[0] ?? null,
    second: mapped[1] ?? null,
    topTen: mapped.slice(0, 10),
    topThirty: mapped,
    biggestClimber: null,
    longestStreak: null,
  };
}

// ----------------------------------------------------------------------------
// Story selection — deterministic priority order
// ----------------------------------------------------------------------------

function selectStoryType(snapshot: Snapshot): StoryType {
  if (snapshot.timeFilter === 'all_time') {
    return snapshot.leader && snapshot.leader.courses > 0
      ? 'all_time_record'
      : 'all_time_quiet';
  }

  if ((snapshot.daysRemaining ?? 999) <= 7) return 'season_closing';
  if ((snapshot.daysIntoSeason ?? 999) <= 3) return 'season_opening';

  if (snapshot.biggestClimber && snapshot.biggestClimber.rank_change_week >= 3) {
    return 'big_climber';
  }
  if (snapshot.longestStreak && snapshot.longestStreak.streak_days >= 35) {
    return 'streak_milestone';
  }
  if (snapshot.leader && snapshot.second) {
    const gap = snapshot.leader.courses - snapshot.second.courses;
    if (gap >= 5) return 'leader_extends';
    if (gap <= 1) return 'gap_tightens';
  }
  return 'mid_season_quiet';
}

// ----------------------------------------------------------------------------
// Templates
// ----------------------------------------------------------------------------

function generateEditorial(snapshot: Snapshot, storyType: StoryType): EditorialOutput {
  const seasonLabel = (snapshot.seasonName ?? 'Season').toUpperCase();
  const leader = snapshot.leader;
  const second = snapshot.second;
  const climber = snapshot.biggestClimber;
  const streaker = snapshot.longestStreak;

  switch (storyType) {
    case 'season_opening':
      return {
        storyType,
        eyebrow: `OPENING WEEK · ${seasonLabel}`,
        headline: 'A new season',
        headlineTwo: 'begins.',
        standfirst:
          `The board resets and the field is wide open. Every round logged this week sets the tempo for ${snapshot.seasonName ?? 'the season'} ahead — early movers will define the chase.`,
      };

    case 'season_closing':
      return {
        storyType,
        eyebrow: `FINAL DAYS · ${snapshot.daysRemaining ?? 0}D REMAINING`,
        headline: leader
          ? `${leader.display_name} holds`
          : 'The race tightens',
        headlineTwo: 'as time runs out.',
        standfirst: leader && second
          ? `With days left in ${snapshot.seasonName ?? 'the season'}, ${leader.display_name} leads on ${leader.courses} courses — but ${second.display_name} sits ${leader.courses - second.courses} back. Every round counts.`
          : 'The closing days reward composure. Every entry into the standings now carries the weight of the season.',
      };

    case 'leader_extends':
      return {
        storyType,
        eyebrow: `THE LEADER · ${seasonLabel}`,
        headline: leader ? `${leader.display_name}` : 'The leader',
        headlineTwo: 'pulls clear.',
        standfirst: leader && second
          ? `${leader.display_name} now sits ${leader.courses - second.courses} courses ahead of ${second.display_name}, the largest gap of ${snapshot.seasonName ?? 'the season'} so far. The chase is on.`
          : 'The leader has opened daylight at the top of the table.',
      };

    case 'gap_tightens':
      return {
        storyType,
        eyebrow: `THE CHASE · ${seasonLabel}`,
        headline: leader && second
          ? `${second.display_name} closes`
          : 'The gap closes',
        headlineTwo: 'on the leader.',
        standfirst: leader && second
          ? `${second.display_name} sits within ${Math.max(1, leader.courses - second.courses)} of ${leader.display_name} at the top. The lead, once comfortable, now feels fragile.`
          : 'The race for top spot has tightened to within a single course.',
      };

    case 'big_climber':
      return {
        storyType,
        eyebrow: `THE MOVE · ${seasonLabel}`,
        headline: climber ? `${climber.display_name} climbs` : 'A big move',
        headlineTwo: climber ? `${climber.rank_change_week} places.` : 'on the board.',
        standfirst: climber
          ? `${climber.display_name} has surged into rank ${climber.rank} this week, the largest jump in the top thirty. Form is building at exactly the right moment.`
          : 'A surge in form has reshaped the top of the standings this week.',
      };

    case 'streak_milestone':
      return {
        storyType,
        eyebrow: `THE STREAK · ${seasonLabel}`,
        headline: streaker
          ? `${streaker.display_name} on a`
          : 'A streak runs',
        headlineTwo: streaker
          ? `${Math.floor(streaker.streak_days / 7)}-week run.`
          : 'on and on.',
        standfirst: streaker
          ? `${streaker.display_name} has logged a course every week for ${Math.floor(streaker.streak_days / 7)} weeks running. Consistency, not heroics, is what wins seasons.`
          : 'Consistent week-on-week play is starting to separate the contenders.',
      };

    case 'mid_season_quiet':
      return {
        storyType,
        eyebrow: `THE STANDINGS · ${seasonLabel}`,
        headline: leader
          ? `${leader.display_name} leads`
          : 'The standings',
        headlineTwo: leader ? `on ${leader.courses}.` : 'take shape.',
        standfirst: leader && second
          ? `${leader.display_name} sits at the top with ${leader.courses} courses logged, ${Math.max(0, leader.courses - second.courses)} clear of ${second.display_name}. The race is finely balanced with weeks still to play.`
          : 'The board is taking shape as members log rounds across the season.',
      };

    case 'all_time_record':
      return {
        storyType,
        eyebrow: 'THE ALL-TIME RECORD',
        headline: leader ? `${leader.display_name}` : 'The record holder',
        headlineTwo: leader ? `at ${leader.courses}.` : 'leads the way.',
        standfirst: leader
          ? `${leader.display_name} sits atop the all-time standings on ${leader.courses} courses logged across every season. The mark to beat.`
          : 'The all-time leader sets the standard the rest of the field is chasing.',
      };

    case 'all_time_quiet':
    default:
      return {
        storyType: 'all_time_quiet',
        eyebrow: 'THE ALL-TIME RECORD',
        headline: 'The record',
        headlineTwo: 'is open.',
        standfirst:
          'The all-time leaderboard is just getting started. Every course you log is one closer to the top.',
      };
  }
}

// ----------------------------------------------------------------------------
// Persist
// ----------------------------------------------------------------------------

async function writeEditorial(
  supabase: ReturnType<typeof createClient>,
  snapshot: Snapshot,
  editorial: EditorialOutput,
) {
  const today = new Date().toISOString().slice(0, 10);

  const row = {
    season_id: snapshot.seasonId,
    time_filter: snapshot.timeFilter,
    date: today,
    story_type: editorial.storyType,
    eyebrow: editorial.eyebrow,
    headline: editorial.headline,
    headline_two: editorial.headlineTwo,
    standfirst: editorial.standfirst,
    generated_by: 'template' as const,
    snapshot_data: {
      seasonId: snapshot.seasonId,
      seasonName: snapshot.seasonName,
      daysRemaining: snapshot.daysRemaining,
      daysIntoSeason: snapshot.daysIntoSeason,
      leader: snapshot.leader,
      second: snapshot.second,
      biggestClimber: snapshot.biggestClimber,
      longestStreak: snapshot.longestStreak,
    },
  };

  // Postgrest upsert can't target partial unique indexes, so do a
  // delete-then-insert scoped to today's row for this (season, time_filter).
  let deleteQuery = supabase
    .from('championship_editorial_daily')
    .delete()
    .eq('time_filter', snapshot.timeFilter)
    .eq('date', today);
  deleteQuery = snapshot.seasonId
    ? deleteQuery.eq('season_id', snapshot.seasonId)
    : deleteQuery.is('season_id', null);

  const { error: deleteErr } = await deleteQuery;
  if (deleteErr) throw deleteErr;

  const { error } = await supabase
    .from('championship_editorial_daily')
    .insert(row);

  if (error) throw error;

  return row;
}

// ----------------------------------------------------------------------------
// Handler
// ----------------------------------------------------------------------------

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const results: Array<{
      timeFilter: TimeFilter;
      seasonId: string | null;
      storyType: StoryType;
      headline: string;
    }> = [];

    // 1. Active season editorial
    const { data: seasons, error: seasonErr } = await supabase
      .from('championship_seasons')
      .select('id, name, start_date, end_date')
      .eq('status', 'active')
      .limit(1);
    if (seasonErr) throw seasonErr;

    if (seasons && seasons.length > 0) {
      const season = seasons[0] as {
        id: string;
        name: string;
        start_date: string;
        end_date: string;
      };
      const snapshot = await buildSeasonalSnapshot(supabase, season);
      const storyType = selectStoryType(snapshot);
      const editorial = generateEditorial(snapshot, storyType);
      await writeEditorial(supabase, snapshot, editorial);
      results.push({
        timeFilter: 'seasonal',
        seasonId: season.id,
        storyType,
        headline: editorial.headline,
      });
    }

    // 2. All-time editorial — only refresh on Sundays (per brief)
    const isSunday = new Date().getUTCDay() === 0;
    const url = new URL(req.url);
    const forceAllTime = url.searchParams.get('force_all_time') === '1';
    if (isSunday || forceAllTime) {
      const snapshot = await buildAllTimeSnapshot(supabase);
      const storyType = selectStoryType(snapshot);
      const editorial = generateEditorial(snapshot, storyType);
      await writeEditorial(supabase, snapshot, editorial);
      results.push({
        timeFilter: 'all_time',
        seasonId: null,
        storyType,
        headline: editorial.headline,
      });
    }

    return new Response(
      JSON.stringify({ ok: true, generated: results }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (err) {
    console.error('daily-editorial-generation error', err);
    const message =
      err instanceof Error
        ? err.message
        : typeof err === 'object' && err !== null
          ? JSON.stringify(err)
          : String(err);
    return new Response(
      JSON.stringify({ ok: false, error: message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
