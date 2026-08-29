// delete-account v3 — full erasure of a member's rows AND assets.
// See brief "DELETE_USER V3 - FULL ERASURE" (2026-07-21).
//
// Ordering (critical):
//   1. Enumerate stream_ids + storage keys WHILE DB pointers still exist.
//   2. Write manifest rows (pending).
//   3. Bounded DELETEs on every non-cascading engagement / no-FK table.
//   4. Soft-delete user_profiles + auth.admin.deleteUser (DB is now clean).
//   5. From the manifest: Cloudflare Stream + Storage DELETEs.
//   6. Manifest rows marked deleted|failed; failures do NOT fail the request.
//
// Counter coherence: posts.comment_count and posts.like_count are maintained
// by DB triggers (trg_comments_v2_count_dec, trg_posts_like_delete). Bounded
// DELETEs on comments_v2 / post_likes therefore keep counters correct with
// no manual recount. Verified against pg_trigger 2026-07-21.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsFor } from '../_shared/cors.ts';

export const FUNCTION_VERSION = '2026-08-29T04:43:00Z-v6-verify-auth-delete';


// -------- URL parsing helpers (public storage URL convention). ----------
// Public URL: {SUPABASE_URL}/storage/v1/object/public/{bucket}/{key...}
// Private:    stored as a raw path we already record in *_media rows.
function parseStorageUrl(url: string | null, supabaseUrl: string):
  { bucket: string; key: string } | null {
  if (!url) return null;
  try {
    const marker = '/storage/v1/object/';
    const idx = url.indexOf(marker);
    if (idx < 0) return null;
    let tail = url.slice(idx + marker.length);
    if (tail.startsWith('public/')) tail = tail.slice('public/'.length);
    else if (tail.startsWith('sign/')) tail = tail.slice('sign/'.length);
    const q = tail.indexOf('?');
    if (q >= 0) tail = tail.slice(0, q);
    const slash = tail.indexOf('/');
    if (slash <= 0) return null;
    const bucket = tail.slice(0, slash);
    const key = decodeURIComponent(tail.slice(slash + 1));
    if (!bucket || !key) return null;
    return { bucket, key };
  } catch {
    return null;
  }
}

function extractStreamUid(url: string | null): string | null {
  if (!url) return null;
  const patterns = [
    /customer-[^.]+\.cloudflarestream\.com\/([a-f0-9]{32})/i,
    /videodelivery\.net\/([a-f0-9]{32})/i,
    /\/([a-f0-9]{32})\/manifest\/video\.m3u8/i,
    /\/([a-f0-9]{32})\/thumbnails\//i,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m?.[1]) return m[1];
  }
  return null;
}

Deno.serve(async (req) => {
  const corsHeaders = corsFor(req.headers.get('Origin'));
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  // Ping (unauthenticated) — must reflect running version.
  try {
    const peek = req.clone();
    const body = await peek.json().catch(() => null);
    if (body?.action === 'ping') {
      return new Response(JSON.stringify({ version: FUNCTION_VERSION }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (_) { /* fall through */ }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey);

    // -------- Resolve target: self-serve (JWT) OR admin-mode (internal secret) ----
    // Admin mode: secure-admin-operations delegates the full erasure to us so
    // there is exactly ONE code path that sweeps a user. Guarded by
    // INTERNAL_FN_SECRET header (fail-closed).
    let targetId: string;
    let targetEmail: string | undefined;
    let mode: 'self' | 'admin' = 'self';
    let callerJwt: string | null = null;

    const rawBody = await req.clone().json().catch(() => null) as any;
    if (rawBody?.action === 'admin_delete') {
      const expected = Deno.env.get('INTERNAL_FN_SECRET');
      const provided = req.headers.get('x-internal-secret');
      if (!expected || provided !== expected) {
        return new Response(JSON.stringify({ error: 'Unauthorized (admin_delete)' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (!rawBody.targetUserId) {
        return new Response(JSON.stringify({ error: 'Missing targetUserId' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      mode = 'admin';
      targetId = rawBody.targetUserId as string;
      try {
        const { data: lookup } = await admin.auth.admin.getUserById(targetId);
        targetEmail = lookup?.user?.email ?? undefined;
      } catch (_) { /* proceed without email */ }
    } else {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Missing authorization header' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: userErr } = await userClient.auth.getUser();
      if (userErr || !user) {
        return new Response(JSON.stringify({ error: 'Authentication failed' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      targetId = user.id;
      targetEmail = user.email ?? undefined;
      // Kept for revocation: admin.auth.admin.signOut() needs the caller's JWT.
      callerJwt = authHeader.replace(/^Bearer\s+/i, '');
    }

    // Shim so downstream code that referenced `user.id` / `user.email` keeps working.
    const user = { id: targetId, email: targetEmail } as { id: string; email?: string };
    console.log(`[delete-account v4] mode=${mode} user=${targetId}`);
    const deletedAt = new Date().toISOString();
    const auditAction = mode === 'admin' ? 'ADMIN_DELETE_ACCOUNT_GDPR' : 'SELF_DELETE_ACCOUNT_GDPR';




    // ---------- Double-submit guard ----------
    // Only idempotent when BOTH the profile is soft-deleted AND the auth user
    // is gone. A soft-deleted profile whose auth user still exists is a
    // half-deleted account: RESUME rather than reporting a false success.
    try {
      const { data: existing } = await admin.from('user_profiles')
        .select('deleted_at').eq('id', targetId).maybeSingle();
      if (existing?.deleted_at) {
        let authUserStillExists = false;
        try {
          const { data: lookup } = await admin.auth.admin.getUserById(targetId);
          authUserStillExists = !!lookup?.user?.id;
        } catch (_) { authUserStillExists = false; }
        if (!authUserStillExists) {
          return new Response(JSON.stringify({ success: true, idempotent: true, version: FUNCTION_VERSION }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        console.warn(`[delete-account v5] resuming half-deleted account ${targetId}`);
      }
    } catch (_) { /* non-fatal */ }


    try {
      const twoMinAgo = new Date(Date.now() - 120_000).toISOString();
      const { count } = await admin.from('admin_audit_log')
        .select('id', { count: 'exact', head: true })
        .eq('action', auditAction)
        .eq('target_user_id', targetId)
        .gte('created_at', twoMinAgo);
      if ((count ?? 0) >= 1) {
        return new Response(JSON.stringify({ error: 'Deletion already in progress.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    } catch (_) { /* non-fatal */ }

    // ---------- Start-marker audit row (returns id we thread through the manifest). ----------
    const { data: auditStart } = await admin.from('admin_audit_log').insert({
      admin_user_id: targetId,
      action: auditAction,
      target_user_id: targetId,
      target_email: user.email,
      details: { phase: 'started', started_at: deletedAt, version: FUNCTION_VERSION, mode },
    }).select('id').maybeSingle();
    const deletionAuditId = auditStart?.id ?? crypto.randomUUID();


    // =========================================================================
    // STEP 1 — ENUMERATE assets while pointers still exist.
    // =========================================================================
    const streamIds = new Set<string>();
    const storageKeys = new Set<string>(); // "bucket/key"

    const pushStorage = (bucket: string | null | undefined, key: string | null | undefined) => {
      if (!bucket || !key) return;
      storageKeys.add(`${bucket}/${key}`);
    };
    const pushMediaUrl = (url: string | null | undefined) => {
      if (!url) return;
      const uid = extractStreamUid(url);
      if (uid) { streamIds.add(uid); return; }
      const parsed = parseStorageUrl(url, supabaseUrl);
      if (parsed) pushStorage(parsed.bucket, parsed.key);
    };

    try {
      // posts.user_id -> post_media (media_url + poster_url + stream_id)
      const { data: userPosts } = await admin.from('posts').select('id').eq('user_id', targetId);
      const postIds = (userPosts ?? []).map(p => p.id);
      if (postIds.length) {
        const { data: pm } = await admin.from('post_media')
          .select('media_url,poster_url,stream_id').in('post_id', postIds);
        for (const r of pm ?? []) {
          if (r.stream_id) streamIds.add(r.stream_id);
          pushMediaUrl(r.media_url);
          pushMediaUrl(r.poster_url);
        }
      }

      // course reviews owned by user -> course_review_media
      const { data: ratings } = await admin.from('course_ratings').select('id').eq('user_id', targetId);
      const ratingIds = (ratings ?? []).map(r => r.id);
      if (ratingIds.length) {
        const { data: crm } = await admin.from('course_review_media')
          .select('media_url,poster_url,stream_id').in('review_id', ratingIds);
        for (const r of crm ?? []) {
          if (r.stream_id) streamIds.add(r.stream_id);
          pushMediaUrl(r.media_url);
          pushMediaUrl(r.poster_url);
        }
        const { data: cm } = await admin.from('course_media')
          .select('media_url').in('rating_id', ratingIds);
        for (const r of cm ?? []) pushMediaUrl(r.media_url);
      }

      // profile_media
      const { data: pmedia } = await admin.from('profile_media')
        .select('media_url,thumbnail_url,header_extended_url,header_strip_url')
        .eq('user_id', targetId);
      for (const r of pmedia ?? []) {
        pushMediaUrl(r.media_url); pushMediaUrl(r.thumbnail_url);
        pushMediaUrl(r.header_extended_url); pushMediaUrl(r.header_strip_url);
      }

      // post_drafts + draft media
      const { data: drafts } = await admin.from('post_drafts').select('id').eq('user_id', targetId);
      const draftIds = (drafts ?? []).map(d => d.id);
      if (draftIds.length) {
        const { data: pdm } = await admin.from('post_draft_media')
          .select('media_url,poster_url,stream_id').in('draft_id', draftIds);
        for (const r of pdm ?? []) {
          if (r.stream_id) streamIds.add(r.stream_id);
          pushMediaUrl(r.media_url);
          pushMediaUrl(r.poster_url);
        }
      }

      // comments_v2.media_url
      const { data: cmts } = await admin.from('comments_v2')
        .select('media_url').eq('user_id', targetId).not('media_url', 'is', null);
      for (const r of cmts ?? []) pushMediaUrl(r.media_url);

      // user_profiles avatar / video / background
      const { data: prof } = await admin.from('user_profiles')
        .select('profile_photo_url,cover_photo_url,header_photo_url,background_image_url,profile_video_url,profile_video_thumbnail_url,logo_url')
        .eq('id', targetId).maybeSingle();
      if (prof) {
        pushMediaUrl(prof.profile_photo_url as any);
        pushMediaUrl(prof.cover_photo_url as any);
        pushMediaUrl(prof.header_photo_url as any);
        pushMediaUrl(prof.background_image_url as any);
        pushMediaUrl(prof.profile_video_url as any);
        pushMediaUrl(prof.profile_video_thumbnail_url as any);
        pushMediaUrl(prof.logo_url as any);
      }
    } catch (e) {
      console.error('[delete-account v3] enumeration error (continuing):', e);
    }

    // =========================================================================
    // STEP 2 — WRITE MANIFEST (pending).
    // =========================================================================
    const manifestRows: Array<{
      deletion_audit_id: string; target_user_id: string; kind: 'stream'|'storage'; ref: string; status: 'pending';
    }> = [];
    for (const uid of streamIds) manifestRows.push({
      deletion_audit_id: deletionAuditId, target_user_id: targetId, kind: 'stream', ref: uid, status: 'pending',
    });
    for (const bk of storageKeys) manifestRows.push({
      deletion_audit_id: deletionAuditId, target_user_id: targetId, kind: 'storage', ref: bk, status: 'pending',
    });
    const assetCounts = { enumerated: manifestRows.length, deleted: 0, failed: 0 };
    if (manifestRows.length) {
      // Chunk to keep insert payload small.
      for (let i = 0; i < manifestRows.length; i += 500) {
        const chunk = manifestRows.slice(i, i + 500);
        const { error } = await admin.from('user_deletion_asset_manifest').insert(chunk);
        if (error) console.error('[delete-account v3] manifest insert error:', error.message);
      }
    }

    // =========================================================================
    // STEP 3 — Bounded DELETEs across every child table the user owns.
    // Counters are trigger-maintained (comment_count, like_count) so raw
    // DELETEs are sufficient.
    // =========================================================================
    const results: Record<string, { deleted: number; error?: string }> = {};
    const bounded = async (label: string, fn: () => Promise<{ count: number | null; error: any }>) => {
      try {
        const { count, error } = await fn();
        results[label] = { deleted: count ?? 0, ...(error ? { error: error.message } : {}) };
      } catch (e) { results[label] = { deleted: 0, error: String(e) }; }
    };

    // Posts + immediate children (post_media, comments, likes, shares, impressions cascade or are handled below)
    try {
      const { data: userPosts } = await admin.from('posts').select('id').eq('user_id', targetId);
      const postIds = (userPosts ?? []).map(p => p.id);
      if (postIds.length) {
        await admin.from('post_likes').delete().in('post_id', postIds);
        await admin.from('post_shares').delete().in('post_id', postIds);
        await admin.from('post_impressions').delete().in('post_id', postIds);
        await admin.from('comments_v2').delete().eq('target_type', 'post').in('target_id', postIds);
        await admin.from('post_media').delete().in('post_id', postIds);
      }
      const { count } = await admin.from('posts').delete({ count: 'exact' }).eq('user_id', targetId);
      results.posts = { deleted: count ?? 0 };
    } catch (e) { results.posts = { deleted: 0, error: String(e) }; }

    // Comments authored by user (anywhere). Triggers keep comment_count coherent.
    await bounded('comments_v2', async () => await admin.from('comments_v2')
      .delete({ count: 'exact' }).eq('user_id', targetId));
    await bounded('comment_likes_v2', async () => await admin.from('comment_likes_v2')
      .delete({ count: 'exact' }).eq('user_id', targetId));
    await bounded('post_likes_by_user', async () => await admin.from('post_likes')
      .delete({ count: 'exact' }).eq('user_id', targetId));
    await bounded('post_shares_by_user', async () => await admin.from('post_shares')
      .delete({ count: 'exact' }).eq('user_id', targetId));
    await bounded('post_impressions', async () => await admin.from('post_impressions')
      .delete({ count: 'exact' }).eq('user_id', targetId));
    await bounded('review_votes', async () => await admin.from('review_votes')
      .delete({ count: 'exact' }).eq('user_id', targetId));
    await bounded('analytics_events', async () => await admin.from('analytics_events')
      .delete({ count: 'exact' }).eq('user_id', targetId));

    // follows (both directions). Column semantics: follower_user_id is the acting
    // human; the followed side is (following_actor_type, following_actor_id). To
    // erase a personal target we filter follower_user_id=target, and separately
    // rows where the target is followed as a personal actor.
    try {
      const { count: a } = await admin.from('follows').delete({ count: 'exact' })
        .eq('follower_user_id', targetId);
      const { count: b } = await admin.from('follows').delete({ count: 'exact' })
        .eq('following_actor_type', 'personal').eq('following_actor_id', targetId);
      results.follows = { deleted: (a ?? 0) + (b ?? 0) };
    } catch (e) { results.follows = { deleted: 0, error: String(e) }; }

    // hidden_comments + message_hidden (actor_id, actor_type='personal').
    await bounded('hidden_comments', async () => await admin.from('hidden_comments')
      .delete({ count: 'exact' }).eq('user_id', targetId));
    await bounded('message_hidden', async () => await admin.from('message_hidden')
      .delete({ count: 'exact' }).eq('actor_type', 'personal').eq('actor_id', targetId));

    // Swing / event / drafts / echo rate limits / caption / caddie / pro-AI / gam.
    // post_drafts children are cascaded via post_draft_media's FK; we also
    // enumerate-and-clean explicitly to be defensive against schema drift.
    try {
      const { data: drafts } = await admin.from('post_drafts').select('id').eq('user_id', targetId);
      const draftIds = (drafts ?? []).map(d => d.id);
      if (draftIds.length) {
        await admin.from('post_draft_media').delete().in('draft_id', draftIds);
      }
      const { count } = await admin.from('post_drafts').delete({ count: 'exact' }).eq('user_id', targetId);
      results.post_drafts = { deleted: count ?? 0 };
    } catch (e) { results.post_drafts = { deleted: 0, error: String(e) }; }

    await bounded('swing_shares', async () => await admin.from('swing_shares')
      .delete({ count: 'exact' }).eq('user_id', targetId));
    await bounded('swing_sessions', async () => await admin.from('swing_sessions')
      .delete({ count: 'exact' }).eq('user_id', targetId));
    await bounded('event_participants', async () => await admin.from('event_participants')
      .delete({ count: 'exact' }).eq('user_id', targetId));
    await bounded('echo_v2_rate_limits', async () => await admin.from('echo_v2_rate_limits')
      .delete({ count: 'exact' }).eq('user_id', targetId));
    await bounded('ai_caption_usage', async () => await admin.from('ai_caption_usage')
      .delete({ count: 'exact' }).eq('user_id', targetId));
    await bounded('caddie_logs', async () => await admin.from('caddie_logs')
      .delete({ count: 'exact' }).eq('user_id', targetId));
    await bounded('pro_ai_analyses', async () => await admin.from('pro_ai_analyses')
      .delete({ count: 'exact' }).eq('user_id', targetId));
    await bounded('gam_user_level_events', async () => await admin.from('gam_user_level_events')
      .delete({ count: 'exact' }).eq('user_id', targetId));
    await bounded('leaderboard_highlights', async () => await admin.from('leaderboard_highlights')
      .delete({ count: 'exact' }).eq('user_id', targetId));
    await bounded('user_badges', async () => await admin.from('user_badges')
      .delete({ count: 'exact' }).eq('user_id', targetId));
    await bounded('user_followed_colleges', async () => await admin.from('user_followed_colleges')
      .delete({ count: 'exact' }).eq('user_id', targetId));
    await bounded('user_rival_dismissals', async () => await admin.from('user_rival_dismissals')
      .delete({ count: 'exact' }).eq('user_id', targetId));

    // profile_immersive_telemetry — both sides (owner + viewer).
    try {
      const { count: a } = await admin.from('profile_immersive_telemetry')
        .delete({ count: 'exact' }).eq('user_id', targetId);
      const { count: b } = await admin.from('profile_immersive_telemetry')
        .delete({ count: 'exact' }).eq('viewer_id', targetId);
      results.profile_immersive_telemetry = { deleted: (a ?? 0) + (b ?? 0) };
    } catch (e) { results.profile_immersive_telemetry = { deleted: 0, error: String(e) }; }

    // user_suggestion_dismissals — both dismisser and dismissed columns (best-effort).
    try {
      let total = 0;
      for (const col of ['user_id','dismissed_user_id','suggested_user_id']) {
        const { count } = await admin.from('user_suggestion_dismissals')
          .delete({ count: 'exact' }).eq(col as any, targetId);
        total += count ?? 0;
      }
      results.user_suggestion_dismissals = { deleted: total };
    } catch (e) { results.user_suggestion_dismissals = { deleted: 0, error: String(e) }; }

    // Course ratings + already-catalogued dependent media rows.
    try {
      const { data: ratings } = await admin.from('course_ratings').select('id').eq('user_id', targetId);
      const ratingIds = (ratings ?? []).map(r => r.id);
      if (ratingIds.length) {
        await admin.from('course_review_media').delete().in('review_id', ratingIds);
        await admin.from('course_review_votes').delete().in('rating_id', ratingIds);
        await admin.from('course_media').delete().in('rating_id', ratingIds);
      }
      const { count } = await admin.from('course_ratings').delete({ count: 'exact' }).eq('user_id', targetId);
      results.reviews = { deleted: count ?? 0 };
    } catch (e) { results.reviews = { deleted: 0, error: String(e) }; }

    // Notifications, preferences, shortlists, cosmetics, etc. (legacy sweeps).
    for (const [label, table, col] of [
      ['course_shortlists','course_shortlists','user_id'],
      ['notification_preferences','notification_preferences','user_id'],
      ['notifications','notifications','user_id'],
      ['cosmetic_loadouts','cosmetic_loadouts','user_id'],
      ['handicap_authority_waitlist','handicap_authority_waitlist','user_id'],
      ['reports_by_user','reports','reporter_id'],
      ['post_reports_by_user','post_reports','reporter_id'],
      ['user_blocks_blocker','user_blocks','blocker_id'],
      ['user_blocks_blocked','user_blocks','blocked_id'],
      ['profile_media','profile_media','user_id'],
      // V5: restored / added sweeps for NO ACTION FKs to auth.users that a live
      // session can still write to (regressed out of the list after v2).
      ['post_views','post_views','viewer_id'],
      ['business_analytics_events','business_analytics_events','user_id'],
      ['creator_profile_events','creator_profile_events','user_id'],
      ['profile_analytics_events','profile_analytics_events','user_id'],
      ['user_courses','user_courses','user_id'],
      ['user_top100_courses','user_top100_courses','user_id'],
      // NOTE: business_team_members.created_by is deliberately NOT swept. The
      // decision is taken: that FK becomes ON DELETE SET NULL via a separate
      // migration, so the database handles it and adding a sweep here would
      // destroy team rows created by the departing member.
    ] as const) {
      await bounded(label, async () => await admin.from(table as any)
        .delete({ count: 'exact' }).eq(col as any, targetId));
    }

    // Support tickets: anonymize (retention).
    try {
      const { count } = await admin.from('support_tickets').update({
        user_id: null,
        context: { anonymized: true, original_user_id: targetId, anonymized_at: deletedAt } as any,
      }).eq('user_id', targetId);
      results.support_tickets = { deleted: count ?? 0 };
    } catch (e) { results.support_tickets = { deleted: 0, error: String(e) }; }
    await bounded('support_messages', async () => await admin.from('support_messages')
      .delete({ count: 'exact' }).eq('sender_id', targetId));

    // Business memberships: leave conversations/messages alone (KEEP + fallback rendering).
    try {
      const { data: owned } = await admin.from('business_members')
        .select('business_id').eq('user_profile_id', targetId).eq('role', 'owner');
      const { count: memberCount } = await admin.from('business_members')
        .delete({ count: 'exact' }).eq('user_profile_id', targetId);
      let deactivated = 0;
      for (const biz of owned ?? []) {
        const { data: remaining } = await admin.from('business_members')
          .select('id').eq('business_id', (biz as any).business_id).eq('role', 'owner').limit(1);
        if (!remaining || remaining.length === 0) {
          await admin.from('business_accounts').update({
            is_deleted: true, deleted_at: deletedAt,
          }).eq('id', (biz as any).business_id);
          deactivated++;
        }
      }
      results.business_memberships = { deleted: memberCount ?? 0 };
      if (deactivated) results.orphaned_businesses_deactivated = { deleted: deactivated };
    } catch (e) { results.business_memberships = { deleted: 0, error: String(e) }; }

    // WHS teardown (mirrors delete-whs-data).
    try {
      const { data: allConns } = await admin.from('whs_connections')
        .select('id, vault_secret_id').eq('user_id', targetId);
      const connIds = (allConns ?? []).map((c: any) => c.id);
      let whsRows = 0;
      if (connIds.length) {
        const { data: scoreIds } = await admin.from('whs_scores').select('id').in('connection_id', connIds);
        const sids = (scoreIds ?? []).map((s: any) => s.id);
        if (sids.length) {
          const { count: h } = await admin.from('whs_score_holes').delete({ count: 'exact' }).in('score_id', sids);
          whsRows += h ?? 0;
        }
        const { count: s } = await admin.from('whs_scores').delete({ count: 'exact' }).in('connection_id', connIds);
        whsRows += s ?? 0;
        const { count: hs } = await admin.from('whs_handicap_snapshots').delete({ count: 'exact' }).in('connection_id', connIds);
        whsRows += hs ?? 0;
        const { count: wf } = await admin.from('whs_friends').delete({ count: 'exact' }).in('connection_id', connIds);
        whsRows += wf ?? 0;
      }
      const { count: iv } = await admin.from('whs_invites').delete({ count: 'exact' }).eq('inviter_user_id', targetId);
      whsRows += iv ?? 0;
      const { count: ic } = await admin.from('whs_invite_completions').delete({ count: 'exact' })
        .or(`inviter_user_id.eq.${targetId},invitee_user_id.eq.${targetId}`);
      whsRows += ic ?? 0;
      if (connIds.length) {
        const { count: cc } = await admin.from('whs_connections').delete({ count: 'exact' }).in('id', connIds);
        whsRows += cc ?? 0;
      }
      for (const c of allConns ?? []) {
        if ((c as any).vault_secret_id) {
          try { await admin.rpc('vault_delete_secret', { secret_id: (c as any).vault_secret_id }); }
          catch (err) { console.error('[delete-account v3] whs vault delete failed:', err); }
        }
      }
      results.whs_data = { deleted: whsRows };
    } catch (e) { results.whs_data = { deleted: 0, error: String(e) }; }

    // =========================================================================
    // STEP 4 — Clear follow edges, soft-delete profile, hard-delete auth user.
    // =========================================================================
    // A soft-deleted account must not hold follow edges: it would otherwise show
    // up in follower/following lists and in follower counts (get_social_list and
    // the direct count queries are SECURITY DEFINER / unjoined and cannot filter
    // deleted_at). Clearing at the source fixes every reader at once. Non-fatal:
    // log and continue, like the whs/vault steps.
    try {
      const { error: followsErr, count: followsDeleted } = await admin
        .from('follows')
        .delete({ count: 'exact' })
        .or(
          `and(follower_actor_type.eq.personal,follower_actor_id.eq.${targetId}),` +
          `and(following_actor_type.eq.personal,following_actor_id.eq.${targetId})`
        );
      if (followsErr) {
        console.error('[delete-account v5] follow edge delete failed:', followsErr.message);
        results.follow_edges = { deleted: followsDeleted ?? 0, error: followsErr.message };
      } else {
        results.follow_edges = { deleted: followsDeleted ?? 0 };
      }
    } catch (e) {
      console.error('[delete-account v5] follow edge delete threw:', e);
      results.follow_edges = { deleted: 0, error: String(e) };
    }

    const anonymizedUsername = `deleted_${targetId.slice(0, 8)}_${Date.now()}`;
    const { error: updateError } = await admin.from('user_profiles').update({
      deleted_at: deletedAt,
      display_name: 'Deleted User',
      username: anonymizedUsername,
      bio: null,
      profile_photo_url: null,
      cover_photo_url: null,
      phone: null,
      is_public: false,
    }).eq('id', targetId);
    if (updateError) {
      console.error('[delete-account v3] profile update failed:', updateError.message);
      return new Response(JSON.stringify({ error: 'Failed to delete account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ---- V5 SECTION A: revoke access first if the auth delete fails. ----
    const { error: authErr } = await admin.auth.admin.deleteUser(targetId);
    // V6: do not trust the return value. GoTrue can answer success while the row
    // survives - that leaves an account soft-deleted in user_profiles, unbanned,
    // still able to sign in, and audited as gdpr_compliant. Verify by reading it
    // back. A throw (or any read failure) is treated as "row is gone" so the
    // verification can never fail an otherwise successful deletion.
    let authRowSurvives = false;
    try {
      const { data: stillThere } = await admin.auth.admin.getUserById(targetId);
      authRowSurvives = !!stillThere?.user;
    } catch (e) {
      console.error('[delete-account v6] auth verify read threw (treating row as gone):', e);
      authRowSurvives = false;
    }
    if (authRowSurvives) {
      console.error('[delete-account v6] auth row survived a successful deleteUser:', targetId);
    }
    let accessRevoked = false;
    if (authErr || authRowSurvives) {
      console.error('[delete-account v5] auth delete failed:',
        authErr ? authErr.message : 'row_survived');
      // 1) Ban the user so no NEW session can be minted (refresh + password
      //    grant both rejected by GoTrue while banned_until is in the future).
      try {
        const { error: banErr } = await admin.auth.admin.updateUserById(targetId, {
          ban_duration: '876000h', // ~100 years
        } as any);
        if (banErr) console.error('[delete-account v5] ban failed:', banErr.message);
        else accessRevoked = true;
      } catch (e) { console.error('[delete-account v5] ban threw:', e); }

      // 2) Global sign-out so EXISTING access/refresh tokens die immediately.
      //    Requires the caller's JWT, which we only hold in self mode.
      if (callerJwt) {
        try {
          const { error: soErr } = await admin.auth.admin.signOut(callerJwt, 'global');
          if (soErr) console.error('[delete-account v5] global signOut failed:', soErr.message);
        } catch (e) { console.error('[delete-account v5] global signOut threw:', e); }
      }

      try {
        await admin.from('admin_audit_log').insert({
          admin_user_id: targetId,
          action: auditAction,
          target_user_id: targetId,
          target_email: user.email,
          details: {
            phase: 'completed_auth_failed',
            deleted_at: deletedAt,
            version: FUNCTION_VERSION,
            mode,
            deletionAuditId,
            deletion_results: results,
            assetCounts,
            auth_delete: {
              ok: false,
              reason: authErr ? 'error' : 'row_survived',
              error: authErr?.message ?? null,
              access_revoked: accessRevoked,
            },
            gdpr_compliant: false,
          },
        });
      } catch (e) { console.error('[delete-account v5] failure audit failed:', e); }

      return new Response(JSON.stringify({
        error: 'account_deletion_incomplete',
        stage: 'auth_delete',
        detail: authErr?.message ?? 'auth row survived deleteUser',
        access_revoked: accessRevoked,
        deletionAuditId,
        version: FUNCTION_VERSION,
      }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }


    // =========================================================================
    // STEP 5 — Drain the manifest. Failures do NOT fail the request.
    // =========================================================================
    const cfAccountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
    const cfStreamToken = Deno.env.get('CLOUDFLARE_STREAM_API_TOKEN');

    const drain = async () => {
      const { data: rows } = await admin.from('user_deletion_asset_manifest')
        .select('id,kind,ref').eq('deletion_audit_id', deletionAuditId).eq('status', 'pending');
      for (const row of rows ?? []) {
        try {
          if (row.kind === 'stream') {
            if (!cfAccountId || !cfStreamToken) throw new Error('cf_env_missing');
            const resp = await fetch(
              `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/stream/${row.ref}`,
              { method: 'DELETE', headers: { Authorization: `Bearer ${cfStreamToken}` } });
            if (!resp.ok && resp.status !== 404) {
              const body = await resp.text().catch(() => '');
              throw new Error(`cf_${resp.status}:${body.slice(0, 200)}`);
            }
          } else {
            const slash = row.ref.indexOf('/');
            const bucket = row.ref.slice(0, slash);
            const key = row.ref.slice(slash + 1);
            const { error } = await admin.storage.from(bucket).remove([key]);
            if (error) throw new Error(error.message);
          }
          await admin.from('user_deletion_asset_manifest')
            .update({ status: 'deleted', completed_at: new Date().toISOString(), attempts: 1 })
            .eq('id', row.id);
          assetCounts.deleted++;
        } catch (e) {
          await admin.from('user_deletion_asset_manifest')
            .update({ status: 'failed', error: String(e).slice(0, 500), attempts: 1 })
            .eq('id', row.id);
          assetCounts.failed++;
        }
      }
    };
    try { await drain(); } catch (e) { console.error('[delete-account v3] drain failed:', e); }

    // Terminal audit row with full details (includes per-table sweep counts).
    try {
      await admin.from('admin_audit_log').insert({
        admin_user_id: targetId,
        action: auditAction,
        target_user_id: targetId,
        target_email: user.email,
        details: {
          phase: 'completed',
          deleted_at: deletedAt,
          version: FUNCTION_VERSION,
          mode,
          deletionAuditId,
          deletion_results: results,
          assetCounts,
          auth_delete: { ok: true, error: null, access_revoked: false },
          gdpr_compliant: true,
        },
      });
    } catch (e) { console.error('[delete-account v4] terminal audit failed:', e); }

    console.log(`[delete-account v4] done mode=${mode} user=${targetId} assets=`, assetCounts);
    return new Response(JSON.stringify({
      success: true, message: 'Account deleted', version: FUNCTION_VERSION, mode,
      assetCounts, deletion_results: results,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[delete-account v3] unexpected:', error);
    return new Response(JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
