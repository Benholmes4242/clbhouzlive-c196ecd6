// generate-round-share-card
//
// Renders a 1200x630 PNG share card for a posted round and writes it to the
// public `share-cards` bucket at the deterministic path:
//
//   share-cards/round/{post_id}.png
//
// Deterministic so a regeneration overwrites rather than accumulating.
//
// Invocations:
//   { postId }                      -> generate one card
//   { scoreId }                     -> generate for the post carrying that score
//   { action: 'backfill', limit }   -> resumable batch (see BACKFILL below)
//
// Never throws at the caller: a failure returns 200 with ok:false so a
// fire-and-forget call from the post path can safely ignore the result.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { renderRoundCardPng, type RoundCardData } from './card.ts';

const BUCKET = 'share-cards';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const cardPath = (postId: string) => 'round/' + postId + '.png';

interface RoundPost {
  post_id: string;
  score_id: string;
  user_id: string | null;
}

async function loadCardData(post: RoundPost): Promise<RoundCardData | null> {
  // gam_round_stats is the settled round-figures surface (course name, gross,
  // par, stableford, birdies, play date all live there).
  const { data: stats } = await admin
    .from('gam_round_stats')
    .select('course_name, course_par, gross_score, stableford_points, birdies, play_date, course_id')
    .eq('whs_score_id', post.score_id)
    .maybeSingle();

  let courseName: string | null = (stats?.course_name as string | null) ?? null;
  let playDate: string | null = (stats?.play_date as string | null) ?? null;
  let gross: number | null = (stats?.gross_score as number | null) ?? null;
  let par: number | null = (stats?.course_par as number | null) ?? null;
  const stableford: number | null = (stats?.stableford_points as number | null) ?? null;
  const birdies: number | null = (stats?.birdies as number | null) ?? null;

  if (gross == null || playDate == null) {
    const { data: score } = await admin
      .from('whs_scores')
      .select('actual_gross, play_date, course_id')
      .eq('id', post.score_id)
      .maybeSingle();
    gross = gross ?? ((score?.actual_gross as number | null) ?? null);
    playDate = playDate ?? ((score?.play_date as string | null) ?? null);
    if (!courseName && score?.course_id) {
      const { data: course } = await admin
        .from('golf_courses')
        .select('name, par')
        .eq('id', score.course_id as string)
        .maybeSingle();
      courseName = (course?.name as string | null) ?? null;
      par = par ?? ((course?.par as number | null) ?? null);
    }
  }

  let playerName: string | null = null;
  if (post.user_id) {
    const { data: profile } = await admin
      .from('public_profiles')
      .select('display_name, username')
      .eq('id', post.user_id)
      .maybeSingle();
    playerName =
      ((profile?.display_name as string | null) ?? (profile?.username as string | null)) ?? null;
  }

  // Nothing worth showing - leave the post to the existing fallback chain.
  if (!courseName && gross == null) return null;

  return {
    playDate,
    courseName,
    grossScore: gross,
    coursePar: par,
    stablefordPoints: stableford,
    birdies,
    playerName,
  };
}

async function generateFor(post: RoundPost): Promise<{ ok: boolean; path?: string; error?: string }> {
  const data = await loadCardData(post);
  if (!data) return { ok: false, error: 'no round data' };
  const png = await renderRoundCardPng(data);
  const { error } = await admin.storage.from(BUCKET).upload(cardPath(post.post_id), png, {
    contentType: 'image/png',
    cacheControl: '31536000',
    upsert: true,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, path: cardPath(post.post_id) };
}

async function resolvePost(opts: { postId?: string; scoreId?: string }): Promise<RoundPost | null> {
  const q = admin.from('posts').select('id, whs_score_id, user_id').not('whs_score_id', 'is', null);
  const { data } = opts.postId
    ? await q.eq('id', opts.postId).maybeSingle()
    : await q.eq('whs_score_id', opts.scoreId!).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (!data?.whs_score_id) return null;
  return {
    post_id: data.id as string,
    score_id: data.whs_score_id as string,
    user_id: (data.user_id as string | null) ?? null,
  };
}

// BACKFILL - separate invocable action, never runs on deploy and never on the
// normal generation path. Resumable: it lists what already exists in the
// bucket and skips those, so running it twice is safe and cheap.
async function backfill(limit: number, force: boolean) {
  const { data: existing } = await admin.storage.from(BUCKET).list('round', { limit: 10000 });
  const done = new Set((existing ?? []).map((f) => f.name.replace(/\.png$/, '')));

  const { data: posts } = await admin
    .from('posts')
    .select('id, whs_score_id, user_id')
    .not('whs_score_id', 'is', null)
    .order('created_at', { ascending: false });

  const pending = (posts ?? []).filter((p) => force || !done.has(p.id as string)).slice(0, limit);

  let ok = 0;
  const failures: { post_id: string; error: string }[] = [];
  for (const p of pending) {
    try {
      const res = await generateFor({
        post_id: p.id as string,
        score_id: p.whs_score_id as string,
        user_id: (p.user_id as string | null) ?? null,
      });
      if (res.ok) ok++;
      else failures.push({ post_id: p.id as string, error: res.error ?? 'unknown' });
    } catch (e) {
      failures.push({ post_id: p.id as string, error: String(e) });
    }
  }

  return {
    ok: true,
    total_round_posts: (posts ?? []).length,
    already_had_card: done.size,
    attempted: pending.length,
    generated: ok,
    remaining: Math.max(0, (posts ?? []).length - done.size - pending.length),
    failures,
  };
}

// AUTHORISATION
//   - No Authorization header            -> 401
//   - Invalid / unresolvable JWT         -> 401
//   - Service role                       -> full access (backfill + any post)
//   - Member                             -> single post, own posts only (403)
//   - action:'backfill' as a member       -> 403
type Caller = { kind: 'service' } | { kind: 'user'; userId: string } | null;

async function resolveCaller(req: Request): Promise<Caller> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) return null;
  if (token === SERVICE_KEY) return { kind: 'service' };

  const { data, error } = await admin.auth.getClaims(token);
  const claims = data?.claims as { sub?: string; role?: string } | undefined;
  if (error || !claims) return null;
  if (claims.role === 'service_role') return { kind: 'service' };
  if (!claims.sub) return null;
  return { kind: 'user', userId: claims.sub };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const caller = await resolveCaller(req);
  if (!caller) return json({ ok: false, error: 'unauthorized' }, 401);

  let body: { postId?: string; scoreId?: string; action?: string; limit?: number; force?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: 'invalid body' }, 400);
  }

  try {
    if (body.action === 'backfill') {
      if (caller.kind !== 'service') return json({ ok: false, error: 'forbidden' }, 403);
      const limit = Math.min(Math.max(Number(body.limit ?? 25), 1), 100);
      return json(await backfill(limit, !!body.force));
    }

    if (!body.postId && !body.scoreId) return json({ ok: false, error: 'postId or scoreId required' }, 400);

    const post = await resolvePost(body);
    if (!post) return json({ ok: false, error: 'not a round post' });

    // Ownership: members may only generate cards for their own round posts.
    if (caller.kind === 'user' && post.user_id !== caller.userId) {
      return json({ ok: false, error: 'forbidden' }, 403);
    }

    return json(await generateFor(post));
  } catch (e) {
    console.error('[generate-round-share-card]', e);
    return json({ ok: false, error: String(e) });
  }
});

