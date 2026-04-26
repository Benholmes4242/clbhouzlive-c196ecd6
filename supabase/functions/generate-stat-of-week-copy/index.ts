// generate-stat-of-week-copy
//
// Weekly cron-driven AI generation of the StatOfTheWeek "standfirst"
// (sports-commentator headline) for each of the 13 gamified categories.
//
// Provider: Anthropic Claude (claude-sonnet-4-5) via direct API.
// This is a deliberate departure from the platform default of Lovable AI
// Gateway with Gemini — the brief explicitly chose Claude for tone fidelity.
//
// Trigger: weekly cron (Monday 06:00 UTC) + on-demand from dashboard.
// Output: upserts into public.stat_of_week_copy keyed by category_key.

import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

// ── 13 categories — title bible (kept in lockstep with frontend constants) ──
interface CategorySpec {
  key: string;
  gamifiedTitle: string;
  statLabel: string;
  verbVoice: string;
  /** 'asc' = lower is better; 'desc' = higher is better */
  sortDirection: 'asc' | 'desc';
  /** Reads numeric value out of sr_player_statistics row + raw_data. */
  accessor: (
    row: any,
    raw: any,
  ) => number | null;
  format: (v: number) => string;
}

const CATEGORIES: CategorySpec[] = [
  {
    key: 'world_rank',
    gamifiedTitle: 'WORLD #1',
    statLabel: 'World Ranking',
    verbVoice: 'holds the throne | sits atop the world | rules the rankings',
    sortDirection: 'desc',
    accessor: (_row, raw) => raw?.statistics?.world_rank ?? null,
    format: (v) => `${Math.round(v)} pts`,
  },
  {
    key: 'events_played',
    gamifiedTitle: 'THE GRINDER',
    statLabel: 'Events Played',
    verbVoice: 'grinds | shows up week in, week out | never sits a week out',
    sortDirection: 'desc',
    accessor: (row, raw) => row.events_played ?? raw?.statistics?.events_played ?? null,
    format: (v) => `${v} events`,
  },
  {
    key: 'cuts_made',
    gamifiedTitle: 'THE WEEKEND WARRIOR',
    statLabel: 'Cuts Made',
    verbVoice: 'plays every weekend | never misses the cut | always around for Sunday',
    sortDirection: 'desc',
    accessor: (row, raw) => row.cuts_made ?? raw?.statistics?.cuts_made ?? null,
    format: (v) => `${v} cuts`,
  },
  {
    key: 'top_10',
    gamifiedTitle: 'CONSISTENCY KING',
    statLabel: 'Top 10 Finishes',
    verbVoice: 'shows up when it matters | always in the mix | a fixture on the leaderboard',
    sortDirection: 'desc',
    accessor: (row, raw) => row.top_10s ?? raw?.statistics?.top_10 ?? null,
    format: (v) => `${v} top 10s`,
  },
  {
    key: 'earnings',
    gamifiedTitle: 'THE MONEY LIST',
    statLabel: 'Season Earnings',
    verbVoice: 'printing money | collecting cheques | cashing in week after week',
    sortDirection: 'desc',
    accessor: (_row, raw) => raw?.statistics?.earnings ?? null,
    format: (v) =>
      v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(2)}M` : `$${Math.round(v).toLocaleString()}`,
  },
  {
    key: 'strokes_gained_total',
    gamifiedTitle: 'MOST COMPLETE GOLFER',
    statLabel: 'Strokes Gained Total',
    verbVoice: 'dominating across the board | no weakness in his game | the best all-rounder out there',
    sortDirection: 'desc',
    accessor: (_row, raw) => raw?.statistics?.strokes_gained_total ?? null,
    format: (v) => (v >= 0 ? '+' : '') + v.toFixed(2),
  },
  {
    key: 'scoring_avg',
    gamifiedTitle: 'LOWEST OF THE LOW',
    statLabel: 'Scoring Average',
    verbVoice: 'shooting the lowest scores | posting numbers nobody else can | running cards through the floor',
    sortDirection: 'asc',
    accessor: (row, raw) => row.scoring_average ?? raw?.statistics?.scoring_avg ?? null,
    format: (v) => v.toFixed(3),
  },
  {
    key: 'drive_avg',
    gamifiedTitle: 'BIG DOG',
    statLabel: 'Driving Distance',
    verbVoice: 'bombing it | bombing the field | crushing drives nobody else can hit',
    sortDirection: 'desc',
    accessor: (row, raw) => row.driving_distance ?? raw?.statistics?.drive_avg ?? null,
    format: (v) => `${v.toFixed(1)} yds`,
  },
  {
    key: 'drive_acc',
    gamifiedTitle: 'STRAIGHT SHOOTER',
    statLabel: 'Driving Accuracy',
    verbVoice: 'finding fairways | hitting it straight | painting the short grass',
    sortDirection: 'desc',
    accessor: (row, raw) => row.driving_accuracy ?? raw?.statistics?.drive_acc ?? null,
    format: (v) => `${v.toFixed(1)}%`,
  },
  {
    key: 'gir_pct',
    gamifiedTitle: 'DARTS',
    statLabel: 'Greens in Regulation',
    verbVoice: 'sticking it close | hitting greens | throwing darts at every flag',
    sortDirection: 'desc',
    accessor: (row, raw) => row.greens_in_reg ?? raw?.statistics?.gir_pct ?? null,
    format: (v) => `${v.toFixed(1)}%`,
  },
  {
    key: 'putt_avg',
    gamifiedTitle: 'PUTTING GOD',
    statLabel: 'Putting Average',
    verbVoice: 'bewitching greens | draining everything | making the hole look like a bucket',
    sortDirection: 'asc',
    accessor: (row, raw) => row.putting_average ?? raw?.statistics?.putt_avg ?? null,
    format: (v) => v.toFixed(3),
  },
  {
    key: 'sand_saves_pct',
    gamifiedTitle: 'BUNKER BOSS',
    statLabel: 'Sand Saves',
    verbVoice: 'escaping bunkers | never afraid of sand | making bunker shots look like chip-ins',
    sortDirection: 'desc',
    accessor: (row, raw) => row.sand_saves ?? raw?.statistics?.sand_saves_pct ?? null,
    format: (v) => `${v.toFixed(1)}%`,
  },
  {
    key: 'scrambling_pct',
    gamifiedTitle: 'THE ESCAPE ARTIST',
    statLabel: 'Scrambling %',
    verbVoice: 'getting up and down | saving par from anywhere | turning bogeys into pars',
    sortDirection: 'desc',
    accessor: (_row, raw) => raw?.statistics?.scrambling_pct ?? null,
    format: (v) => `${v.toFixed(1)}%`,
  },
];

function lastNameOf(full: string): string {
  const parts = full.trim().split(/\s+/);
  return parts[parts.length - 1] || full;
}

const PROMPT_VERSION = 'v1';

function buildPrompt(spec: CategorySpec, leaderSurname: string, displayValue: string) {
  return `You are a sports commentator writing weekly headlines for a golf stats leaderboard. Each headline is one sentence, 8-12 words, written in the voice of a confident, witty, restrained Sports Illustrated columnist.

Format: [Player surname] is [verb phrase capturing dominance] in 2026.

Examples of GOOD lines:
- "Fitzpatrick is printing money in 2026."
- "Peterson is bewitching greens this season."
- "Scheffler is bombing it past the field this year."
- "Rose is sticking it tight every approach."

Examples of BAD lines (avoid):
- "Fitzpatrick is having a great season." (bland, no specificity)
- "Fitzpatrick is absolutely COOKING the field." (cringe, over-energy)
- "Fitzpatrick has been performing well in earnings." (textbook voice)

Now write a headline for: ${leaderSurname} leading ${spec.gamifiedTitle} (${spec.statLabel}) with ${displayValue}. Verb voice options: ${spec.verbVoice}.

Return ONLY the headline, no preamble.`;
}

async function callClaude(apiKey: string, prompt: string): Promise<string | null> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 100,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    console.error('[Claude] error', res.status, txt.slice(0, 400));
    return null;
  }

  const data = await res.json();
  const text: string | undefined = data?.content?.[0]?.text;
  if (!text) return null;
  // Sanitize: strip surrounding quotes, trailing whitespace, keep one line
  return text.trim().replace(/^["“]|["”]$/g, '').replace(/\n.*$/s, '').trim();
}

interface LeaderResolved {
  playerId: string;
  playerName: string;
  surname: string;
  value: number;
  display: string;
}

async function resolveLeaders(
  supabase: ReturnType<typeof createClient>,
): Promise<Map<string, LeaderResolved>> {
  const leaders = new Map<string, LeaderResolved>();

  // ── World rankings (separate table) ──
  const { data: worldRows } = await supabase
    .from('sr_world_rankings')
    .select('rank, points, ranking_date, player_id, player:sr_players(full_name)')
    .order('ranking_date', { ascending: false })
    .order('rank', { ascending: true })
    .limit(60);

  if (worldRows && worldRows.length > 0) {
    const latestDate = (worldRows[0] as any).ranking_date;
    const todayWorld = (worldRows as any[]).filter((r) => r.ranking_date === latestDate);
    const number1 = todayWorld.find((r) => r.rank === 1) ?? todayWorld[0];
    if (number1?.player) {
      const fullName = (number1.player as any).full_name as string;
      leaders.set('world_rank', {
        playerId: number1.player_id,
        playerName: fullName,
        surname: lastNameOf(fullName),
        value: number1.points ?? 0,
        display: `${Math.round(number1.points ?? 0)} pts`,
      });
    }
  }

  // ── Player statistics (12 categories) ──
  // Pick the season with the most recent stats
  const { data: latestStat } = await supabase
    .from('sr_player_statistics')
    .select('season_id, updated_at')
    .order('updated_at', { ascending: false })
    .limit(1);

  if (!latestStat?.length) return leaders;
  const seasonId = (latestStat[0] as any).season_id;

  const { data: stats } = await supabase
    .from('sr_player_statistics')
    .select('*, player:sr_players(full_name)')
    .eq('season_id', seasonId);

  if (!stats || stats.length === 0) return leaders;

  for (const spec of CATEGORIES) {
    if (spec.key === 'world_rank') continue;

    const rows = (stats as any[])
      .map((s) => {
        const value = spec.accessor(s, s.raw_data);
        if (value === null || value === undefined || !Number.isFinite(value)) return null;
        if (spec.sortDirection === 'asc' && value <= 0) return null;
        if (spec.sortDirection === 'desc' && value === 0) return null;
        return { s, value };
      })
      .filter((x): x is { s: any; value: number } => x !== null);

    rows.sort((a, b) => (spec.sortDirection === 'asc' ? a.value - b.value : b.value - a.value));
    const top = rows[0];
    if (!top || !top.s.player) continue;

    const fullName = top.s.player.full_name as string;
    leaders.set(spec.key, {
      playerId: top.s.player_id,
      playerName: fullName,
      surname: lastNameOf(fullName),
      value: top.value,
      display: spec.format(top.value),
    });
  }

  return leaders;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY');

    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return new Response(
        JSON.stringify({ error: 'Supabase env not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    if (!ANTHROPIC_KEY) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Resolve current leader for each category
    const leaders = await resolveLeaders(supabase);

    const results: Array<{
      category_key: string;
      status: 'generated' | 'skipped';
      reason?: string;
      standfirst?: string;
    }> = [];

    for (const spec of CATEGORIES) {
      const leader = leaders.get(spec.key);
      if (!leader) {
        results.push({ category_key: spec.key, status: 'skipped', reason: 'no leader resolved' });
        continue;
      }

      const prompt = buildPrompt(spec, leader.surname, leader.display);
      const text = await callClaude(ANTHROPIC_KEY, prompt);

      if (!text) {
        results.push({ category_key: spec.key, status: 'skipped', reason: 'claude returned empty' });
        continue;
      }

      const { error: upsertErr } = await supabase
        .from('stat_of_week_copy')
        .upsert(
          {
            category_key: spec.key,
            standfirst_text: text,
            leader_player_id: leader.playerId,
            leader_player_name: leader.playerName,
            leader_value: leader.value,
            leader_value_display: leader.display,
            generated_at: new Date().toISOString(),
            generated_by: 'anthropic-claude-sonnet-4-5',
            prompt_version: PROMPT_VERSION,
          },
          { onConflict: 'category_key' },
        );

      if (upsertErr) {
        console.error('[upsert]', spec.key, upsertErr);
        results.push({ category_key: spec.key, status: 'skipped', reason: 'upsert failed' });
      } else {
        results.push({ category_key: spec.key, status: 'generated', standfirst: text });
      }

      // Light pacing — Anthropic rate limits are generous but be polite
      await new Promise((r) => setTimeout(r, 250));
    }

    return new Response(
      JSON.stringify({ ok: true, count: results.filter((r) => r.status === 'generated').length, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[generate-stat-of-week-copy] fatal', msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
