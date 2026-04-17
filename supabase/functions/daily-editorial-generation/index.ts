// daily-editorial-generation
//
// Phase 1: deterministic template-based editorial generation for the
// Top 100 front page AND the Global tab. Runs daily (cron 06:00 UTC)
// and on-demand from the Supabase dashboard.
//
// Each surface ("top100", "global") gets its own row in
// `championship_editorial_daily`, keyed by (surface, season_id, time_filter, date).
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
type Surface = 'top100' | 'global' | 'courses' | 'handicap';

type HandicapStoryType =
  | 'global_summit'        // who sits at the top of the global handicap board
  | 'biggest_improver'     // someone in the top 30 has cut 1.0+ in 30 days
  | 'handicap_quiet';      // fallback

type CoursesStoryType =
  | 'personal_pick'
  | 'circle_activity'
  | 'region_trending'
  | 'course_top'
  | 'course_new_entry'
  | 'courses_quiet';

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

type GlobalStoryType =
  | 'global_leader_change'
  | 'global_continent_milestone'
  | 'global_gap_at_top'
  | 'global_steady'
  | 'global_quiet';

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

interface GlobalLeader {
  user_id: string;
  display_name: string;
  countries: number;
  continents: number;
  courses: number;
  rank: number;
}

interface GlobalSnapshot {
  leader: GlobalLeader | null;
  second: GlobalLeader | null;
  tenth: GlobalLeader | null;
  topTen: GlobalLeader[];
  highestContinents: GlobalLeader | null;
}

interface EditorialOutput {
  storyType: string;
  eyebrow: string;
  headline: string;
  headlineTwo: string;
  standfirst: string;
}

// ----------------------------------------------------------------------------
// Top 100 snapshot building
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
// Global snapshot building
// ----------------------------------------------------------------------------

async function buildGlobalSnapshot(
  supabase: ReturnType<typeof createClient>,
): Promise<GlobalSnapshot> {
  // Use the exploration leaderboard sorted by countries (default).
  const { data: rows, error } = await supabase.rpc(
    'get_exploration_leaderboard',
    {
      p_scope: 'global',
      p_metric: 'countries',
      p_current_user_id: null,
      p_club_id: null,
      p_limit: 30,
      p_offset: 0,
      p_country: null,
    },
  );
  if (error) throw error;

  const list = (rows ?? []) as Array<{
    user_id: string;
    display_name: string;
    username: string;
    rank: number;
    countries_count: number;
    continents_count: number;
    courses_count: number;
  }>;

  const mapped: GlobalLeader[] = list.map((r) => ({
    user_id: r.user_id,
    display_name: r.display_name || r.username || 'A member',
    countries: r.countries_count ?? 0,
    continents: r.continents_count ?? 0,
    courses: r.courses_count ?? 0,
    rank: r.rank,
  }));

  const highestContinents =
    [...mapped].sort((a, b) => b.continents - a.continents)[0] ?? null;

  return {
    leader: mapped[0] ?? null,
    second: mapped[1] ?? null,
    tenth: mapped[9] ?? null,
    topTen: mapped.slice(0, 10),
    highestContinents,
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

function selectGlobalStoryType(snap: GlobalSnapshot): GlobalStoryType {
  if (!snap.leader || snap.leader.countries === 0) return 'global_quiet';
  if (snap.highestContinents && snap.highestContinents.continents >= 5) {
    return 'global_continent_milestone';
  }
  if (
    snap.leader && snap.tenth &&
    snap.leader.countries - snap.tenth.countries >= 5
  ) {
    return 'global_gap_at_top';
  }
  if (snap.leader && snap.second) {
    const gap = snap.leader.countries - snap.second.countries;
    if (gap >= 3) return 'global_leader_change';
  }
  return 'global_steady';
}

// ----------------------------------------------------------------------------
// Templates — Top 100
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
// Templates — Global
// ----------------------------------------------------------------------------

function spellNumber(n: number): string {
  const map = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve'];
  return n >= 0 && n < map.length ? map[n] : String(n);
}

function generateGlobalEditorial(
  snap: GlobalSnapshot,
  storyType: GlobalStoryType,
): EditorialOutput {
  const leader = snap.leader;
  const second = snap.second;
  const milestone = snap.highestContinents;

  switch (storyType) {
    case 'global_leader_change':
      return {
        storyType,
        eyebrow: 'THE GLOBAL FIELD',
        headline: leader ? `${leader.display_name} leads` : 'A new leader',
        headlineTwo: leader
          ? `with ${spellNumber(leader.countries)} countries.`
          : 'takes the field.',
        standfirst: leader && second
          ? `${leader.display_name} now sits at the top of the global standings on ${leader.countries} countries across ${leader.continents} continents — ${leader.countries - second.countries} ahead of ${second.display_name} in second.`
          : 'A new name leads the global standings as the field continues to expand.',
      };

    case 'global_continent_milestone':
      return {
        storyType,
        eyebrow: 'CONTINENTAL MILESTONE',
        headline: milestone
          ? `${milestone.display_name} reaches`
          : 'A continental',
        headlineTwo: milestone
          ? `${spellNumber(milestone.continents)} continents.`
          : 'milestone arrives.',
        standfirst: milestone
          ? `${milestone.display_name} has now played in ${milestone.continents} continents and ${milestone.countries} countries — a benchmark few in the field have approached.`
          : 'A leading explorer has crossed onto a fifth continent.',
      };

    case 'global_gap_at_top':
      return {
        storyType,
        eyebrow: 'THE GLOBAL FIELD',
        headline: leader ? `${leader.display_name} leads` : 'The leader',
        headlineTwo: 'the explorer\u2019s race.',
        standfirst: leader && snap.tenth
          ? `${leader.display_name} sits at the top of the global standings on ${leader.countries} countries — ${leader.countries - snap.tenth.countries} more than the player at rank ten.`
          : 'A clear gap has opened between the leader and the chasing pack.',
      };

    case 'global_steady':
      return {
        storyType,
        eyebrow: 'THE GLOBAL FIELD',
        headline: leader ? `${leader.display_name} leads` : 'The standings',
        headlineTwo: leader
          ? `with ${spellNumber(leader.countries)} countries.`
          : 'take shape.',
        standfirst: leader && second
          ? `${leader.display_name} continues to lead the global standings from ${second.display_name}, who sits ${Math.max(1, leader.countries - second.countries)} ${leader.countries - second.countries === 1 ? 'country' : 'countries'} adrift.`
          : 'The global standings continue to take shape as members add new countries to their map.',
      };

    case 'global_quiet':
    default:
      return {
        storyType: 'global_quiet',
        eyebrow: 'THE GLOBAL FIELD',
        headline: 'The map',
        headlineTwo: 'is open.',
        standfirst:
          'The global standings are just getting started. Every new country logged is one closer to the top of the explorer\u2019s board.',
      };
  }
}

// ----------------------------------------------------------------------------
// Courses snapshot, story selection, templates
// ----------------------------------------------------------------------------

interface CoursesLeaderRow {
  course_id: string;
  course_name: string;
  country: string | null;
  city: string | null;
  region: string | null;
  image_url: string | null;
  avg_rating: number;
  rating_count: number;
  total_rounds: number;
  rank: number;
  rank_change: number;
}

interface CoursesSnapshot {
  leader: CoursesLeaderRow | null;
  movers: CoursesLeaderRow[];
  newEntryInTop10: CoursesLeaderRow | null;
  regionTrending: { country: string; count: number } | null;
  topThirty: CoursesLeaderRow[];
}

async function buildCoursesSnapshot(
  supabase: ReturnType<typeof createClient>,
): Promise<CoursesSnapshot> {
  const { data: rows, error } = await supabase.rpc('get_course_leaderboard', {
    p_sort_by: 'rating',
    p_sort_order: 'desc',
    p_time_period: 'all_time',
    p_current_user_id: null,
    p_limit: 30,
    p_offset: 0,
    p_country: null,
    p_sub_country: null,
    p_exclude_countries: null,
  });
  if (error) throw error;

  const list = ((rows ?? []) as Array<Record<string, unknown>>).map((r) => ({
    course_id: String(r.course_id ?? ''),
    course_name: String(r.course_name ?? 'A course'),
    country: (r.country as string | null) ?? null,
    city: (r.city as string | null) ?? null,
    region: (r.region as string | null) ?? null,
    image_url: (r.image_url as string | null) ?? null,
    avg_rating: Number(r.avg_rating ?? 0),
    rating_count: Number(r.rating_count ?? 0),
    total_rounds: Number(r.total_rounds ?? 0),
    rank: Number(r.rank ?? 0),
    rank_change: Number(r.rank_change ?? 0),
  })) as CoursesLeaderRow[];

  const movers = list.filter((r) => r.rank_change > 0).slice(0, 5);
  const newEntries = list.filter((r) => r.rank <= 10 && r.rank_change >= 5);

  const regionCounts: Record<string, number> = {};
  for (const m of movers) {
    if (m.country) regionCounts[m.country] = (regionCounts[m.country] ?? 0) + 1;
  }
  const topRegion = Object.entries(regionCounts).sort((a, b) => b[1] - a[1])[0];
  const regionTrending =
    topRegion && topRegion[1] >= 3
      ? { country: topRegion[0], count: topRegion[1] }
      : null;

  return {
    leader: list[0] ?? null,
    movers,
    newEntryInTop10: newEntries[0] ?? null,
    regionTrending,
    topThirty: list,
  };
}

function selectCoursesStory(snap: CoursesSnapshot): CoursesStoryType {
  if (snap.newEntryInTop10) return 'course_new_entry';
  if (snap.regionTrending) return 'region_trending';
  if (snap.leader) return 'course_top';
  return 'courses_quiet';
}

function ordinalCourse(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

function spellCourseNumber(n: number): string {
  const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  return words[n] ?? String(n);
}

function generateCoursesEditorial(
  snap: CoursesSnapshot,
  storyType: CoursesStoryType,
): EditorialOutput {
  switch (storyType) {
    case 'course_top': {
      const l = snap.leader!;
      return {
        storyType,
        eyebrow: 'THE COURSE OF THE DAY',
        headline: l.course_name,
        headlineTwo: `sits at ${l.avg_rating.toFixed(1)}.`,
        standfirst: `${l.course_name} leads the Clbhouz list, with ${l.rating_count} ${l.rating_count === 1 ? 'rating' : 'ratings'} from the community averaging ${l.avg_rating.toFixed(1)} out of ten.`,
      };
    }
    case 'course_new_entry': {
      const e = snap.newEntryInTop10!;
      const where = e.country ? ` in ${e.country}` : '';
      return {
        storyType,
        eyebrow: 'NEW IN THE TOP TEN',
        headline: e.course_name,
        headlineTwo: 'enters the top ten.',
        standfirst: `${e.course_name}${where} has climbed ${e.rank_change} ${e.rank_change === 1 ? 'place' : 'places'} to rank ${ordinalCourse(e.rank)}, rated ${e.avg_rating.toFixed(1)} across the community.`,
      };
    }
    case 'region_trending': {
      const r = snap.regionTrending!;
      const names = snap.movers
        .filter((m) => m.country === r.country)
        .slice(0, 2)
        .map((m) => m.course_name);
      const namesText = names.length === 2 ? `${names[0]} and ${names[1]}` : names[0] ?? '';
      return {
        storyType,
        eyebrow: `THIS WEEK IN ${r.country.toUpperCase()}`,
        headline: r.country,
        headlineTwo: 'rises on the board.',
        standfirst: `${spellCourseNumber(r.count)} courses from ${r.country} have climbed the rankings this week${namesText ? `, including ${namesText}` : ''}.`,
      };
    }
    case 'circle_activity':
      return {
        storyType,
        eyebrow: 'FROM YOUR CIRCLE',
        headline: 'Your friends played',
        headlineTwo: 'notable courses this week.',
        standfirst:
          'Scroll down to see where your circle has been logging rounds across the Clbhouz list.',
      };
    case 'personal_pick':
      // Phase 2 — per-user. Falls back to quiet copy in the shared editorial.
      return {
        storyType: 'courses_quiet',
        eyebrow: 'THE CLBHOUZ LIST',
        headline: 'The world\u2019s greatest',
        headlineTwo: 'courses, ranked.',
        standfirst:
          'The Clbhouz community continues to rate, play, and record rounds across the most prestigious courses on earth. The list refreshes every day.',
      };
    case 'courses_quiet':
    default:
      return {
        storyType: 'courses_quiet',
        eyebrow: 'THE CLBHOUZ LIST',
        headline: 'The world\u2019s greatest',
        headlineTwo: 'courses, ranked.',
        standfirst:
          'The Clbhouz community continues to rate, play, and record rounds across the most prestigious courses on earth. The list refreshes every day.',
      };
  }
}

// ----------------------------------------------------------------------------
// Handicap snapshot + templates
// ----------------------------------------------------------------------------

// Internal copy of formatHcp for the edge runtime (no shared TS imports here).
function formatHcpEdge(value: unknown): string {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return '—';
  if (n < 0) return `+${Math.abs(n).toFixed(1)}`;
  if (n === 0) return '0.0';
  return n.toFixed(1);
}

interface HandicapPlayer {
  user_id: string;
  display_name: string;
  handicap_index: number;
}

interface HandicapImprover extends HandicapPlayer {
  improvement_30d: number; // positive = improved (handicap dropped)
}

interface HandicapSnapshot {
  leader: HandicapPlayer | null;
  second: HandicapPlayer | null;
  topThirty: HandicapPlayer[];
  biggestImprover: HandicapImprover | null;
}

async function buildHandicapSnapshot(
  supabase: ReturnType<typeof createClient>,
): Promise<HandicapSnapshot> {
  const { data, error } = await supabase.rpc('get_lowest_handicap_leaderboard', {
    p_scope: 'global',
    p_current_user_id: null,
    p_club_id: null,
    p_country: null,
    p_limit: 30,
    p_offset: 0,
  });
  if (error) throw error;

  const rows = (data ?? []) as Array<{
    user_id: string;
    display_name: string | null;
    handicap_index: number | null;
  }>;

  const topThirty: HandicapPlayer[] = rows
    .filter((r) => r.handicap_index !== null && r.display_name)
    .map((r) => ({
      user_id: r.user_id,
      display_name: r.display_name as string,
      handicap_index: Number(r.handicap_index),
    }));

  const leader = topThirty[0] ?? null;
  const second = topThirty[1] ?? null;
  const biggestImprover = await findBiggestImprover(supabase, topThirty);

  return { leader, second, topThirty, biggestImprover };
}

async function findBiggestImprover(
  supabase: ReturnType<typeof createClient>,
  candidates: HandicapPlayer[],
): Promise<HandicapImprover | null> {
  if (candidates.length === 0) return null;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoff = thirtyDaysAgo.toISOString();

  const userIds = candidates.map((c) => c.user_id);

  const { data, error } = await supabase
    .from('user_handicap_history')
    .select('user_id, handicap_value, recorded_at')
    .in('user_id', userIds)
    .lte('recorded_at', cutoff)
    .order('recorded_at', { ascending: false });

  if (error) {
    console.error('[handicap] history fetch failed', error);
    return null;
  }

  // Newest reading per user from before the cutoff = baseline 30d ago.
  const baseline = new Map<string, number>();
  (data ?? []).forEach((row) => {
    if (!baseline.has(row.user_id)) {
      baseline.set(row.user_id, Number(row.handicap_value));
    }
  });

  let best: HandicapImprover | null = null;
  for (const c of candidates) {
    const prev = baseline.get(c.user_id);
    if (prev === undefined) continue;
    const delta = prev - c.handicap_index; // positive = improvement
    if (delta < 1.0) continue;
    if (!best || delta > best.improvement_30d) {
      best = { ...c, improvement_30d: delta };
    }
  }
  return best;
}

function selectHandicapStory(snapshot: HandicapSnapshot): HandicapStoryType {
  if (snapshot.biggestImprover) return 'biggest_improver';
  if (snapshot.leader) return 'global_summit';
  return 'handicap_quiet';
}

interface HandicapEditorialBase {
  eyebrow: string;
  headline: string;
  headlineTwo: string;
  standfirst: string;
}

const HANDICAP_TEMPLATES: Record<HandicapStoryType, (s: HandicapSnapshot) => HandicapEditorialBase> = {
  global_summit: (s) => {
    const leader = s.leader!;
    const second = s.second;
    const standfirst = second
      ? `${leader.display_name} sits at the top of the Clbhouz handicap board on ${formatHcpEdge(leader.handicap_index)}, with ${second.display_name} on ${formatHcpEdge(second.handicap_index)} in second.`
      : `${leader.display_name} sits at the top of the Clbhouz handicap board on ${formatHcpEdge(leader.handicap_index)}.`;
    return {
      eyebrow: 'THE HANDICAP RECORD',
      headline: `${leader.display_name} leads`,
      headlineTwo: `on ${formatHcpEdge(leader.handicap_index)}.`,
      standfirst,
    };
  },

  biggest_improver: (s) => {
    const i = s.biggestImprover!;
    return {
      eyebrow: 'SHARPEST OF THE MONTH',
      headline: `${i.display_name}`,
      headlineTwo: `drops ${i.improvement_30d.toFixed(1)}.`,
      standfirst: `${i.display_name} has cut ${i.improvement_30d.toFixed(1)} from their index over the past thirty days, now playing off ${formatHcpEdge(i.handicap_index)}.`,
    };
  },

  handicap_quiet: () => ({
    eyebrow: 'THE HANDICAP RECORD',
    headline: 'Index · Tier',
    headlineTwo: 'Trajectory.',
    standfirst:
      'The Clbhouz handicap board tracks every member who plays off a verified index. Rate more rounds to refine yours.',
  }),
};



async function writeEditorial(
  supabase: ReturnType<typeof createClient>,
  args: {
    surface: Surface;
    seasonId: string | null;
    timeFilter: TimeFilter;
    editorial: EditorialOutput;
    snapshotData: unknown;
  },
) {
  const today = new Date().toISOString().slice(0, 10);

  const row = {
    surface: args.surface,
    season_id: args.seasonId,
    time_filter: args.timeFilter,
    date: today,
    story_type: args.editorial.storyType,
    eyebrow: args.editorial.eyebrow,
    headline: args.editorial.headline,
    headline_two: args.editorial.headlineTwo,
    standfirst: args.editorial.standfirst,
    generated_by: 'template' as const,
    snapshot_data: args.snapshotData,
  };

  // Postgrest upsert can't target partial unique indexes, so do a
  // delete-then-insert scoped to today's row for this (surface, season, time_filter).
  let deleteQuery = supabase
    .from('championship_editorial_daily')
    .delete()
    .eq('surface', args.surface)
    .eq('time_filter', args.timeFilter)
    .eq('date', today);
  deleteQuery = args.seasonId
    ? deleteQuery.eq('season_id', args.seasonId)
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
      surface: Surface;
      timeFilter: TimeFilter;
      seasonId: string | null;
      storyType: string;
      headline: string;
    }> = [];

    // 1. Top 100 — active season editorial
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
      await writeEditorial(supabase, {
        surface: 'top100',
        seasonId: season.id,
        timeFilter: 'seasonal',
        editorial,
        snapshotData: {
          seasonId: snapshot.seasonId,
          seasonName: snapshot.seasonName,
          daysRemaining: snapshot.daysRemaining,
          daysIntoSeason: snapshot.daysIntoSeason,
          leader: snapshot.leader,
          second: snapshot.second,
          biggestClimber: snapshot.biggestClimber,
          longestStreak: snapshot.longestStreak,
        },
      });
      results.push({
        surface: 'top100',
        timeFilter: 'seasonal',
        seasonId: season.id,
        storyType,
        headline: editorial.headline,
      });
    }

    // 2. Top 100 — all-time editorial — only refresh on Sundays
    const isSunday = new Date().getUTCDay() === 0;
    const url = new URL(req.url);
    const forceAllTime = url.searchParams.get('force_all_time') === '1';
    if (isSunday || forceAllTime) {
      const snapshot = await buildAllTimeSnapshot(supabase);
      const storyType = selectStoryType(snapshot);
      const editorial = generateEditorial(snapshot, storyType);
      await writeEditorial(supabase, {
        surface: 'top100',
        seasonId: null,
        timeFilter: 'all_time',
        editorial,
        snapshotData: {
          leader: snapshot.leader,
          second: snapshot.second,
        },
      });
      results.push({
        surface: 'top100',
        timeFilter: 'all_time',
        seasonId: null,
        storyType,
        headline: editorial.headline,
      });
    }

    // 3. Global editorial — daily, all_time / no season
    try {
      const globalSnapshot = await buildGlobalSnapshot(supabase);
      const globalStoryType = selectGlobalStoryType(globalSnapshot);
      const globalEditorial = generateGlobalEditorial(globalSnapshot, globalStoryType);
      await writeEditorial(supabase, {
        surface: 'global',
        seasonId: null,
        timeFilter: 'all_time',
        editorial: globalEditorial,
        snapshotData: {
          leader: globalSnapshot.leader,
          second: globalSnapshot.second,
          tenth: globalSnapshot.tenth,
          highestContinents: globalSnapshot.highestContinents,
        },
      });
      results.push({
        surface: 'global',
        timeFilter: 'all_time',
        seasonId: null,
        storyType: globalStoryType,
        headline: globalEditorial.headline,
      });
    } catch (err) {
      console.error('Global editorial generation failed', err);
      // Don't throw — let the seasonal editorial still succeed
    }

    // 4. Courses editorial — daily, all_time / no season
    try {
      const coursesSnapshot = await buildCoursesSnapshot(supabase);
      const coursesStoryType = selectCoursesStory(coursesSnapshot);
      const coursesEditorial = generateCoursesEditorial(coursesSnapshot, coursesStoryType);
      await writeEditorial(supabase, {
        surface: 'courses',
        seasonId: null,
        timeFilter: 'all_time',
        editorial: coursesEditorial,
        snapshotData: {
          leader: coursesSnapshot.leader,
          movers: coursesSnapshot.movers,
          newEntryInTop10: coursesSnapshot.newEntryInTop10,
          regionTrending: coursesSnapshot.regionTrending,
        },
      });
      results.push({
        surface: 'courses',
        timeFilter: 'all_time',
        seasonId: null,
        storyType: coursesEditorial.storyType,
        headline: coursesEditorial.headline,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Courses editorial generation failed', msg);
      results.push({
        surface: 'courses' as Surface,
        timeFilter: 'all_time',
        seasonId: null,
        storyType: 'error',
        headline: `__error: ${msg}`,
      });
      // Don't throw — let seasonal + global editorials still succeed
    }

    // 5. Handicap editorial — daily, all_time / no season
    try {
      const handicapSnapshot = await buildHandicapSnapshot(supabase);
      const handicapStoryType = selectHandicapStory(handicapSnapshot);
      const handicapEditorial = HANDICAP_TEMPLATES[handicapStoryType](handicapSnapshot);
      await writeEditorial(supabase, {
        surface: 'handicap',
        seasonId: null,
        timeFilter: 'all_time',
        editorial: { ...handicapEditorial, storyType: handicapStoryType },
        snapshotData: {
          leader: handicapSnapshot.leader,
          second: handicapSnapshot.second,
          biggestImprover: handicapSnapshot.biggestImprover,
        },
      });
      results.push({
        surface: 'handicap',
        timeFilter: 'all_time',
        seasonId: null,
        storyType: handicapStoryType,
        headline: handicapEditorial.headline,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Handicap editorial generation failed', msg);
      results.push({
        surface: 'handicap' as Surface,
        timeFilter: 'all_time',
        seasonId: null,
        storyType: 'error',
        headline: `__error: ${msg}`,
      });
      // Don't throw — let other surfaces still succeed
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
