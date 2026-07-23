// gam-weekly-digest — Sunday 18:00 UTC.
// One "Your week in golf" push per eligible user for the ISO week that just
// ended (Mon..Sun). Runs BEFORE gam-refresh-streaks-weekly (23:00 UTC) so a
// "play one round" nudge is still actionable that evening.
//
// Contract:
//   * Never renders 0 / none / undefined / empty phrasing in a push.
//   * Every line is conditional on having real content.
//   * Silence beats an empty digest — if there is literally nothing truthful
//     to say we send nothing at all.
//   * Max one push per user per week — dedup key `digest:{userId}:{weekStartISO}`.
//   * Names always come from user_profiles.display_name -> username; the PII
//     tables (whs_friends / whs_friend_matches) are never read.
//   * Urgency is low/medium — never high — so quiet-hours logic in the
//     dispatcher is always respected.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsFor } from '../_shared/cors.ts';

export const FUNCTION_VERSION = '2026-07-23T05:20:00Z-v1-weekly-digest';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } },
);

// ─── Types ───────────────────────────────────────────────────────────────────
interface RoundStat {
  whs_score_id: string;
  user_id: string;
  play_date: string;
  course_id: string | null;
  course_name: string | null;
  course_par: number | null;
  gross_score: number | null;
  birdies: number | null;
  eagles: number | null;
  albatrosses: number | null;
  holes_in_one: number | null;
  delta_index: number | null;
  is_counter: boolean | null;
}

interface DigestFacts {
  rounds: RoundStat[];
  bestRound: RoundStat | null;
  birdies: number;
  eagles: number;
  aces: number;
  netDeltaIndex: number;              // negative = improved
  crownsGained: Array<{ course_id: string; course_name: string; category: string }>;
  crownsLost:   Array<{ course_id: string; course_name: string; category: string }>;
  crownsUnderThreat: Array<{
    course_id: string; course_name: string; category: string; gapAbs: number;
  }>;
  rivalActivity: null | {
    rival_user_id: string; name: string; rounds: number; crowns_gained: number;
  };
}

interface Rendered {
  title: string;
  body: string;
  data: Record<string, unknown>;
  urgency: 'low' | 'medium';
}

// ─── HTTP entry ──────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const corsHeaders = corsFor(req.headers.get('Origin'));
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = new URL(req.url);
  const dryRun = url.searchParams.get('dry_run') === '1';
  const previewOnly = url.searchParams.get('preview') === '1';

  if (req.method === 'GET' && url.searchParams.get('action') === 'ping') {
    return json({ version: FUNCTION_VERSION }, 200, corsHeaders);
  }

  try {
    const body: any = req.method === 'POST'
      ? await req.clone().json().catch(() => ({}))
      : {};
    if (body?.action === 'ping') {
      return json({ version: FUNCTION_VERSION }, 200, corsHeaders);
    }
    const result = await runOnce({ dryRun: dryRun || !!body?.dry_run, previewOnly: previewOnly || !!body?.preview });
    return json(result, 200, corsHeaders);
  } catch (e) {
    console.error('[gam-weekly-digest] fatal', e);
    return json({ error: (e as Error).message }, 500, corsHeaders);
  }
});

// ─── Main loop ───────────────────────────────────────────────────────────────
async function runOnce(opts: { dryRun: boolean; previewOnly: boolean }) {
  const { weekStart, weekEnd, weekStartISO } = weekJustEnded();

  // 1. Candidate universe. Push-registered + enabled + notifications not
  //    explicitly disabled at the profile level. This upper bound is what
  //    the dispatcher itself uses — we mirror it here so the "eligible count"
  //    in the ship report is honest.
  const { data: devices, error: devErr } = await supabase
    .from('user_push_devices')
    .select('user_id')
    .eq('enabled', true);
  if (devErr) throw devErr;
  const candidateIds = [...new Set((devices ?? []).map((d: any) => d.user_id as string))];

  const stats = { candidates: candidateIds.length, eligible: 0, sent: 0, silent: 0, previews: [] as any[] };

  for (const userId of candidateIds) {
    const facts = await gatherFacts(userId, weekStart, weekEnd);
    if (!hasAnyEngagementSignal(facts)) {
      // "no rounds ever, no crowns held, no rival, no league position" — brief.
      // gatherFacts populates crownsUnderThreat from currently-held crowns; if
      // that is empty, rivalActivity is null, and there are no rounds this
      // week, we exclude the user entirely.
      stats.silent++;
      continue;
    }
    stats.eligible++;

    const rendered = renderDigest(facts);
    if (!rendered) { stats.silent++; continue; }

    if (opts.previewOnly && stats.previews.length < 5) {
      stats.previews.push({ user_id: userId, ...rendered });
    }
    if (opts.dryRun || opts.previewOnly) continue;

    // Enqueue. Dedup key includes weekStart so re-runs same Sunday collapse.
    const dedupKey = `digest:${userId}:${weekStartISO}`;
    const { error } = await supabase
      .from('gam_notification_outbox')
      .upsert(
        {
          user_id: userId,
          notification_type: 'weekly_digest',
          template_id: 'weekly_digest',
          template_payload: {
            week_start: weekStartISO,
            title: rendered.title,
            body: rendered.body,
            data: rendered.data,
          },
          deduplication_key: dedupKey,
          scheduled_for: new Date().toISOString(),
          urgency: rendered.urgency,
          status: 'pending',
        },
        { onConflict: 'deduplication_key', ignoreDuplicates: true },
      );
    if (error) {
      console.warn('[gam-weekly-digest] upsert failed', userId, error.message);
      continue;
    }
    stats.sent++;
  }

  const summary = { ok: true, version: FUNCTION_VERSION, weekStart: weekStartISO, ...stats };
  console.log(JSON.stringify({ evt: 'gam_weekly_digest', ...summary }));
  return summary;
}

// ─── Fact gathering ──────────────────────────────────────────────────────────
async function gatherFacts(userId: string, weekStart: Date, weekEnd: Date): Promise<DigestFacts> {
  const weekStartISO = weekStart.toISOString().slice(0, 10);
  const weekEndISO = weekEnd.toISOString().slice(0, 10);

  // Rounds — is_counter=true matches the streak jobs' predicate for parity.
  const { data: roundRows } = await supabase
    .from('gam_round_stats')
    .select('whs_score_id,user_id,play_date,course_id,course_name,course_par,gross_score,birdies,eagles,albatrosses,holes_in_one,delta_index,is_counter')
    .eq('user_id', userId)
    .eq('is_counter', true)
    .gte('play_date', weekStartISO)
    .lt('play_date', weekEndISO)
    .order('play_date', { ascending: true });
  const rounds = (roundRows ?? []) as RoundStat[];

  const birdies = sum(rounds, (r) => r.birdies);
  const eagles  = sum(rounds, (r) => r.eagles) + sum(rounds, (r) => r.albatrosses);
  const aces    = sum(rounds, (r) => r.holes_in_one);
  const netDeltaIndex = rounds.reduce((a, r) => a + (Number(r.delta_index) || 0), 0);

  let bestRound: RoundStat | null = null;
  for (const r of rounds) {
    if (r.gross_score == null || r.course_par == null) continue;
    const vsPar = r.gross_score - r.course_par;
    const prev = bestRound && bestRound.gross_score != null && bestRound.course_par != null
      ? bestRound.gross_score - bestRound.course_par : Number.POSITIVE_INFINITY;
    if (vsPar < prev) bestRound = r;
  }

  // Crown pulse events for this user this week.
  const { data: pulses } = await supabase
    .from('gam_legend_pulse_events')
    .select('kind,course_id,category,user_id,counterparty_user_id,occurred_at')
    .or(`user_id.eq.${userId},counterparty_user_id.eq.${userId}`)
    .gte('occurred_at', weekStart.toISOString())
    .lt('occurred_at', weekEnd.toISOString());

  const crownsGained: DigestFacts['crownsGained'] = [];
  const crownsLost:   DigestFacts['crownsLost']   = [];
  const courseIdsInPulses = new Set<string>();
  for (const p of pulses ?? []) {
    if (p.course_id) courseIdsInPulses.add(p.course_id);
  }
  const courseNameMap = await fetchCourseNames([...courseIdsInPulses]);
  for (const p of pulses ?? []) {
    const cname = p.course_id ? courseNameMap.get(p.course_id) ?? null : null;
    if (!p.course_id || !cname) continue; // no name → don't render
    if (p.kind === 'gained' && p.user_id === userId) {
      crownsGained.push({ course_id: p.course_id, course_name: cname, category: p.category });
    } else if (p.kind === 'lost' && p.counterparty_user_id === userId) {
      crownsLost.push({ course_id: p.course_id, course_name: cname, category: p.category });
    }
  }

  // Held crowns → threat check. "Chasing player within a small margin" —
  // rank 1 held by this user AND rank 2's `value` is within the category's
  // threshold (5% of leader for numeric categories, or exact tie for count
  // categories). Defensive: bail on unknown category shapes.
  const { data: heldRanks } = await supabase
    .from('gam_course_legends')
    .select('course_id,category,rank,value,user_id')
    .eq('user_id', userId)
    .eq('is_current', true)
    .eq('rank', 1);
  const crownsUnderThreat: DigestFacts['crownsUnderThreat'] = [];
  for (const held of heldRanks ?? []) {
    const { data: chasers } = await supabase
      .from('gam_course_legends')
      .select('value,rank,user_id')
      .eq('course_id', held.course_id)
      .eq('category', held.category)
      .eq('is_current', true)
      .in('rank', [1, 2])
      .order('rank', { ascending: true })
      .limit(2);
    const c2 = (chasers ?? []).find((c: any) => c.rank === 2);
    if (!c2) continue;
    const leader = Number(held.value ?? 0);
    const chase  = Number(c2.value ?? 0);
    if (!Number.isFinite(leader) || !Number.isFinite(chase)) continue;
    const gapAbs = Math.abs(leader - chase);
    // Threat threshold: gap <= max(1, 5% of leader). Same treatment for
    // categories where lower value wins — value ordering is enforced by rank
    // on the row itself so the sign of (leader - chase) is not meaningful
    // here; only the magnitude.
    const threshold = Math.max(1, Math.abs(leader) * 0.05);
    if (gapAbs <= threshold) {
      const cname = (await fetchCourseNames([held.course_id!])).get(held.course_id!);
      if (cname) crownsUnderThreat.push({
        course_id: held.course_id!,
        course_name: cname,
        category: held.category,
        gapAbs,
      });
    }
  }

  // Rival activity this week.
  const { data: rivalRow } = await supabase
    .from('user_rivals')
    .select('rival_id, rival_type, is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();
  let rivalActivity: DigestFacts['rivalActivity'] = null;
  if (rivalRow && rivalRow.rival_type === 'user' && rivalRow.rival_id) {
    const rivalId = rivalRow.rival_id as string;
    const { data: rivalRounds } = await supabase
      .from('gam_round_stats')
      .select('whs_score_id')
      .eq('user_id', rivalId)
      .eq('is_counter', true)
      .gte('play_date', weekStartISO)
      .lt('play_date', weekEndISO);
    const rivalRoundsN = (rivalRounds ?? []).length;
    const { count: rivalCrownsGained } = await supabase
      .from('gam_legend_pulse_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', rivalId)
      .eq('kind', 'gained')
      .gte('occurred_at', weekStart.toISOString())
      .lt('occurred_at', weekEnd.toISOString());
    if (rivalRoundsN > 0 || (rivalCrownsGained ?? 0) > 0) {
      const name = await displayNameOf(rivalId);
      if (name) rivalActivity = {
        rival_user_id: rivalId,
        name,
        rounds: rivalRoundsN,
        crowns_gained: rivalCrownsGained ?? 0,
      };
    }
  }

  return {
    rounds,
    bestRound,
    birdies,
    eagles,
    aces,
    netDeltaIndex,
    crownsGained,
    crownsLost,
    crownsUnderThreat,
    rivalActivity,
  };
}

// ─── Render ──────────────────────────────────────────────────────────────────
function renderDigest(f: DigestFacts): Rendered | null {
  const active = f.rounds.length > 0;

  if (active) {
    // Title — the user's own week. Only render numbers > 0.
    const parts: string[] = [`${f.rounds.length} round${f.rounds.length === 1 ? '' : 's'}`];
    if (f.birdies > 0) parts.push(`${f.birdies} birdie${f.birdies === 1 ? '' : 's'}`);
    else if (f.eagles > 0) parts.push(`${f.eagles} eagle${f.eagles === 1 ? '' : 's'}`);
    const title = `⛳ Your week: ${parts.join(', ')}`;

    // Body — sharpest secondary fact.
    const body = pickActiveBody(f);
    // If we have absolutely no secondary fact and the round count is the only
    // thing to say, that is still fine for an active week — round count itself
    // is a truthful non-empty statement.
    return {
      title,
      body: body ?? `Best round: ${bestRoundPhrase(f) ?? 'logged'}. Tap to review your week.`,
      data: pickRoute(f),
      urgency: 'medium',
    };
  }

  // Quiet week. Lead with what happened around them; never mention 0 rounds.
  const quiet = pickQuietBody(f);
  if (!quiet) return null; // silence beats an empty digest
  return {
    title: quiet.title,
    body: quiet.body,
    data: quiet.data,
    urgency: 'low',
  };
}

function pickActiveBody(f: DigestFacts): string | null {
  if (f.aces > 0) return `Hole in one this week. Legendary.`;
  if (f.crownsGained.length > 0) {
    const c = f.crownsGained[0];
    return `You took the ${humanCategory(c.category)} crown at ${c.course_name}.`;
  }
  if (f.crownsLost.length > 0) {
    const c = f.crownsLost[0];
    return `You lost the ${humanCategory(c.category)} crown at ${c.course_name} — take it back.`;
  }
  if (f.netDeltaIndex < 0) {
    const drop = Math.abs(f.netDeltaIndex).toFixed(1);
    return `Handicap index down ${drop} on the week.`;
  }
  if (f.eagles > 0 && f.birdies > 0) {
    return `${f.eagles} eagle${f.eagles === 1 ? '' : 's'} and ${f.birdies} birdie${f.birdies === 1 ? '' : 's'} in the book.`;
  }
  if (f.crownsUnderThreat.length > 0) {
    const c = f.crownsUnderThreat[0];
    return `Heads up — your ${c.course_name} crown is under threat.`;
  }
  if (f.rivalActivity && f.rivalActivity.rounds > 0) {
    return `${f.rivalActivity.name} played ${f.rivalActivity.rounds} round${f.rivalActivity.rounds === 1 ? '' : 's'} this week.`;
  }
  return null;
}

function pickQuietBody(f: DigestFacts):
  | { title: string; body: string; data: Record<string, unknown> }
  | null
{
  if (f.crownsUnderThreat.length > 0) {
    const c = f.crownsUnderThreat[0];
    return {
      title: `👑 Your ${c.course_name} crown is under threat`,
      body: `Play a round to defend it.`,
      data: { route: `/courses/${c.course_id}?tab=legends`, course_id: c.course_id },
    };
  }
  if (f.crownsLost.length > 0) {
    const c = f.crownsLost[0];
    return {
      title: `👑 Crown lost at ${c.course_name}`,
      body: `Take it back.`,
      data: { route: `/courses/${c.course_id}?tab=legends`, course_id: c.course_id },
    };
  }
  if (f.rivalActivity && f.rivalActivity.rounds > 0) {
    return {
      title: `🎯 ${f.rivalActivity.name} played ${f.rivalActivity.rounds} round${f.rivalActivity.rounds === 1 ? '' : 's'} this week`,
      body: `See how you compare.`,
      data: { route: `/handicap` },
    };
  }
  return null;
}

function pickRoute(f: DigestFacts): Record<string, unknown> {
  // If a single fact dominates, deep-link into the arena.
  if (f.crownsLost.length === 1 && f.crownsGained.length === 0) {
    const c = f.crownsLost[0];
    return { route: `/courses/${c.course_id}?tab=legends`, course_id: c.course_id };
  }
  if (f.crownsGained.length === 1 && f.crownsLost.length === 0) {
    const c = f.crownsGained[0];
    return { route: `/courses/${c.course_id}?tab=legends`, course_id: c.course_id };
  }
  // No dedicated digest view yet — /handicap is the fallback per brief.
  return { route: '/handicap' };
}

function bestRoundPhrase(f: DigestFacts): string | null {
  const b = f.bestRound;
  if (!b || b.gross_score == null || b.course_par == null) return null;
  const vsPar = b.gross_score - b.course_par;
  const label = vsPar === 0 ? 'level par' : vsPar > 0 ? `+${vsPar}` : `${vsPar}`;
  return b.course_name ? `${b.gross_score} (${label}) at ${b.course_name}` : `${b.gross_score} (${label})`;
}

function humanCategory(cat: string): string {
  switch (cat) {
    case 'course_regular':   return 'Regular';
    case 'lowest_gross':     return 'lowest gross';
    case 'lowest_nett':      return 'lowest nett';
    case 'most_birdies':     return 'birdie king';
    case 'most_pars':        return 'pars king';
    default: return cat.replace(/_/g, ' ');
  }
}

function hasAnyEngagementSignal(f: DigestFacts): boolean {
  return (
    f.rounds.length > 0 ||
    f.crownsGained.length > 0 ||
    f.crownsLost.length > 0 ||
    f.crownsUnderThreat.length > 0 ||
    (f.rivalActivity !== null)
  );
}

// ─── helpers ─────────────────────────────────────────────────────────────────
function sum<T>(rows: T[], pick: (r: T) => number | null | undefined): number {
  let s = 0; for (const r of rows) s += Number(pick(r) ?? 0) || 0; return s;
}

async function fetchCourseNames(ids: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (ids.length === 0) return map;
  const { data } = await supabase
    .from('golf_courses')
    .select('id,name')
    .in('id', ids);
  for (const c of data ?? []) if (c.name?.trim()) map.set(c.id as string, c.name as string);
  return map;
}

async function displayNameOf(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('user_profiles')
    .select('display_name,username')
    .eq('id', userId)
    .maybeSingle();
  return (data?.display_name?.trim() || data?.username?.trim() || null);
}

function weekJustEnded(): { weekStart: Date; weekEnd: Date; weekStartISO: string } {
  // Same helper as the streak jobs: ISO week (Mon..Mon) containing (now - 1d).
  const yesterday = new Date(Date.now() - 86_400_000);
  const day = yesterday.getUTCDay() || 7;
  const weekStart = new Date(Date.UTC(
    yesterday.getUTCFullYear(), yesterday.getUTCMonth(), yesterday.getUTCDate(),
  ));
  weekStart.setUTCDate(weekStart.getUTCDate() - (day - 1));
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);
  return { weekStart, weekEnd, weekStartISO: weekStart.toISOString().slice(0, 10) };
}

function json(body: any, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    headers: { ...headers, 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    status,
  });
}
