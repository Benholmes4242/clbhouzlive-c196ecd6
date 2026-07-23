import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';


const ALLOWED_ORIGINS = new Set([
  'https://clbhouz.com',
  'https://www.clbhouz.com',
  'https://www.clbhouz.co.uk',
  'https://app.clbhouz.co.uk',
  'https://admin.clbhouz.co.uk',
  'http://localhost:3000',
  'http://localhost:5173',
]);

const isAllowedOrigin = (origin: string | null): boolean => {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  if (origin.endsWith('.lovableproject.com')) return true;
  if (origin.endsWith('.lovable.app')) return true;
  return false;
};

const corsHeaders = (origin: string | null): HeadersInit => {
  const allowOrigin = isAllowedOrigin(origin) ? origin! : '';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
};

type AdminAction =
  | 'delete_user'
  | 'reset_password'
  | 'suspend_user'
  | 'unsuspend'
  | 'warn_user'
  | 'hide_post'
  | 'unhide_post'
  | 'delete_course'
  | 'change_username'
  | 'retry_asset_cleanup'
  | 'verify_golfer'
  | 'unverify_golfer';

interface AdminOperationRequest {
  action: AdminAction;
  targetUserId?: string;
  targetEmail?: string;
  courseId?: string;
  postId?: string;
  reason?: string;
  message?: string;
  suspended?: boolean;
  durationDays?: number | null;
  newUsername?: string;
  adminNote?: string;
}

// Username format — source of truth: src/pages/ManageProfile.tsx L140
// /^[a-z0-9_.]{3,20}$/ applied after trim + lowercase.
const USERNAME_RE = /^[a-z0-9_.]{3,20}$/;

const ALLOWED_NONFULL_DURATIONS = new Set<number>([1, 7, 30]);

serve(async (req) => {
  
  const headers = corsHeaders(req.headers.get('Origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  // Unauthenticated ping to verify running function version.
  // Bump FUNCTION_VERSION on every change to this function.
  const FUNCTION_VERSION = '2026-07-23T18:00:00Z-v6-golfer-verify';

  try {
    const peek = req.clone();
    const peekBody = await peek.json().catch(() => null);
    if (peekBody?.action === 'ping') {
      return new Response(JSON.stringify({ version: FUNCTION_VERSION }), {
        status: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }
  } catch (_) { /* fall through */ }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
        status: 500,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const userSupabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userSupabase.auth.getUser();

    if (userError || !user) {
      console.log('User verification failed:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Resolve actor role from admin_memberships (respect expires_at).
    const { data: actorMem } = await supabase
      .from('admin_memberships')
      .select('role, expires_at')
      .eq('user_id', user.id)
      .maybeSingle();

    const notExpired = !actorMem?.expires_at || new Date(actorMem.expires_at) > new Date();
    const role: 'full' | 'limited' | 'moderator' | 'none' = notExpired
      ? ((actorMem?.role as any) ?? 'none')
      : 'none';

    const isFull = role === 'full';
    const canModerate = role === 'full' || role === 'limited' || role === 'moderator';

    const body: AdminOperationRequest = await req.json();
    const {
      action,
      targetUserId,
      targetEmail,
      courseId,
      postId,
      reason,
      message,
      suspended,
      durationDays,
      newUsername,
      adminNote,
    } = body;

    // Per-action gate
    const fullOnlyActions: AdminAction[] = ['delete_user', 'reset_password', 'delete_course', 'change_username', 'verify_golfer', 'unverify_golfer'];
    const moderationActions: AdminAction[] = [
      'suspend_user', 'unsuspend', 'warn_user', 'hide_post', 'unhide_post',
    ];

    if (fullOnlyActions.includes(action)) {
      if (!isFull) {
        return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
          status: 403,
          headers: { ...headers, 'Content-Type': 'application/json' },
        });
      }
    } else if (moderationActions.includes(action)) {
      if (!canModerate) {
        return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
          status: 403,
          headers: { ...headers, 'Content-Type': 'application/json' },
        });
      }
    } else {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // Block operations against admin accounts (user-targeted actions only).
    const userTargeted = targetUserId && action !== 'delete_course' && action !== 'hide_post' && action !== 'unhide_post';
    if (userTargeted) {
      const { data: targetMem } = await supabase
        .from('admin_memberships')
        .select('role')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (targetMem?.role) {
        return new Response(JSON.stringify({ error: 'Cannot operate on admin accounts' }), {
          status: 403,
          headers: { ...headers, 'Content-Type': 'application/json' },
        });
      }
    }

    const userAgent = req.headers.get('User-Agent') || 'Unknown';
    const clientInfo = req.headers.get('X-Forwarded-For') || 'Unknown';

    console.log(`Admin ${user.email} (${role}) -> ${action}${targetEmail ? ` on ${targetEmail}` : ''}${postId ? ` post=${postId}` : ''}${courseId ? ` course=${courseId}` : ''}`);

    let result: any = {};
    let auditDetails: any = { reason };
    let auditTargetUserId: string | undefined = targetUserId;

    switch (action) {
      case 'delete_user': {
        if (!targetUserId) {
          return new Response(JSON.stringify({ error: 'Missing required fields' }), {
            status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }
        if (user.id === targetUserId) {
          return new Response(JSON.stringify({ error: 'Cannot delete your own account' }), {
            status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }
        // Resolve email server-side for audit/log line if not provided by caller.
        let resolvedEmail = targetEmail;
        if (!resolvedEmail) {
          try {
            const { data: lookup } = await supabase.auth.admin.getUserById(targetUserId);
            resolvedEmail = lookup?.user?.email ?? undefined;
          } catch (_) { /* proceed without email */ }
        }
        const label = resolvedEmail ?? targetUserId;

        // CANONICAL ERASURE PATH — delegate to delete-account (admin mode).
        // Prior to v5 this function maintained its own preCleanup list which
        // drifted from delete-account and left orphans (see Jul 22 incident:
        // 45 orphan post_likes for a deleted user_id). We now have exactly
        // one path that sweeps a user; both self-serve and admin console go
        // through delete-account/index.ts. Per-table counts + assetCounts
        // come back in the response and land in this audit row's details.
        const internalSecret = Deno.env.get('INTERNAL_FN_SECRET');
        if (!internalSecret) {
          auditDetails.error = 'INTERNAL_FN_SECRET not configured';
          result = { error: auditDetails.error };
          break;
        }
        const deleteAcctUrl = `${supabaseUrl}/functions/v1/delete-account`;
        let delegated: any = null;
        try {
          const resp = await fetch(deleteAcctUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-internal-secret': internalSecret,
              // Service-role Authorization satisfies Supabase's function gateway;
              // delete-account itself gates admin mode on x-internal-secret.
              'Authorization': `Bearer ${serviceRoleKey}`,
              'apikey': serviceRoleKey,
            },
            body: JSON.stringify({ action: 'admin_delete', targetUserId }),
          });
          delegated = await resp.json().catch(() => ({ error: 'invalid_json' }));
          if (!resp.ok || delegated?.error) {
            auditDetails.error = `delete-account failed: ${delegated?.error ?? resp.status}`;
            auditDetails.delegated = delegated;
            result = { error: auditDetails.error };
            break;
          }
        } catch (e) {
          auditDetails.error = `delete-account invoke failed: ${String(e)}`;
          result = { error: auditDetails.error };
          break;
        }

        auditDetails.deleteAccountVersion = delegated?.version;
        auditDetails.deletion_results = delegated?.deletion_results;
        auditDetails.assetCounts = delegated?.assetCounts;
        auditDetails.orchestratorVersion = FUNCTION_VERSION;
        result = { success: true, message: `User ${label} deleted successfully`, delegated };
        break;
      }


      case 'reset_password': {
        const { error: resetError } = await supabase.auth.admin.generateLink({
          type: 'recovery',
          email: targetEmail!,
        });
        if (resetError) {
          auditDetails.error = resetError.message;
          result = { error: resetError.message };
        } else {
          result = { success: true, message: `Password reset email sent to ${targetEmail}` };
        }
        break;
      }

      case 'suspend_user': {
        if (!targetUserId) {
          return new Response(JSON.stringify({ error: 'targetUserId required' }), {
            status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }
        // Back-compat: `suspended:false` from the old client == unsuspend.
        if (suspended === false) {
          return await doUnsuspend();
        }

        const permanent = durationDays == null;
        if (permanent && !isFull) {
          const msg = role === 'limited'
            ? 'Permanent bans require full admin approval'
            : 'Permanent bans are restricted to full admins';
          return new Response(JSON.stringify({ error: msg }), {
            status: 403, headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }
        if (!permanent) {
          const d = Number(durationDays);
          if (!Number.isFinite(d) || d <= 0 || !Number.isInteger(d)) {
            return new Response(JSON.stringify({ error: 'Invalid durationDays' }), {
              status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
            });
          }
          if (!isFull) {
            if (d > 30) {
              return new Response(JSON.stringify({
                error: 'Moderators and limited admins can suspend up to 30 days',
              }), {
                status: 403, headers: { ...headers, 'Content-Type': 'application/json' },
              });
            }
            if (!ALLOWED_NONFULL_DURATIONS.has(d)) {
              return new Response(JSON.stringify({
                error: 'Allowed durations for this role are 1, 7, or 30 days',
              }), {
                status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
              });
            }
          }
        }

        const suspendedUntil = permanent
          ? null
          : new Date(Date.now() + Number(durationDays) * 24 * 3600 * 1000).toISOString();
        const finalReason = (reason ?? message ?? 'Violation of community guidelines').toString();

        const { error: suspendError } = await supabase
          .from('user_profiles')
          .update({
            is_suspended: true,
            suspended_until: suspendedUntil,
            suspension_reason: finalReason,
            suspended_by: user.id,
            suspended_at: new Date().toISOString(),
          })
          .eq('id', targetUserId);

        if (suspendError) {
          auditDetails.error = suspendError.message;
          result = { error: suspendError.message };
          break;
        }

        // Cancel scheduled posts
        const { error: postsError } = await supabase
          .from('posts')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('user_id', targetUserId)
          .eq('status', 'scheduled');
        if (postsError) auditDetails.scheduled_posts_error = postsError.message;

        // Notify the user
        const humanUntil = permanent
          ? 'permanently'
          : `until ${new Date(suspendedUntil!).toLocaleString()}`;
        await supabase.from('notifications').insert({
          user_id: targetUserId,
          type: 'suspension',
          title: 'Your account has been suspended',
          message: `Your account has been suspended ${humanUntil}. Reason: ${finalReason}`,
          data: { suspended_until: suspendedUntil, reason: finalReason, permanent },
        });

        auditDetails = {
          ...auditDetails,
          suspended: true,
          permanent,
          duration_days: permanent ? null : Number(durationDays),
          suspended_until: suspendedUntil,
          reason: finalReason,
        };
        result = {
          success: true,
          message: `User ${targetEmail ?? targetUserId} suspended ${humanUntil}`,
          suspended_until: suspendedUntil,
          permanent,
        };
        break;

        async function doUnsuspend() {
          // Moderators can only lift temp suspensions.
          if (role === 'moderator') {
            const { data: prof } = await supabase
              .from('user_profiles')
              .select('is_suspended, suspended_until')
              .eq('id', targetUserId!)
              .maybeSingle();
            if (prof?.is_suspended && !prof?.suspended_until) {
              return new Response(JSON.stringify({
                error: 'Only full admins can lift a permanent ban',
              }), {
                status: 403, headers: { ...headers, 'Content-Type': 'application/json' },
              });
            }
          }
          const { error: unsuspendError } = await supabase
            .from('user_profiles')
            .update({
              is_suspended: false,
              suspended_until: null,
              suspension_reason: null,
              suspended_at: null,
            })
            .eq('id', targetUserId!);
          if (unsuspendError) {
            auditDetails.error = unsuspendError.message;
            result = { error: unsuspendError.message };
          } else {
            await supabase.from('notifications').insert({
              user_id: targetUserId!,
              type: 'moderation',
              title: 'Your suspension has been lifted',
              message: 'You can use your account again. Please follow the community guidelines.',
              data: { kind: 'unsuspended' },
            });
            auditDetails.suspended = false;
            result = { success: true, message: `User ${targetEmail ?? targetUserId} unsuspended` };
          }
          // Fall through to audit + return using the outer handler by re-emitting.
          const { error: auditError } = await supabase
            .from('admin_audit_log')
            .insert({
              admin_user_id: user.id,
              action: 'unsuspend',
              ...(targetUserId ? { target_user_id: targetUserId } : {}),
              ...(targetEmail ? { target_email: targetEmail } : {}),
              details: auditDetails,
              ip_address: clientInfo,
              user_agent: userAgent,
            });
          if (auditError) console.error('audit log failure:', auditError);
          return new Response(JSON.stringify(result), {
            status: result.error ? 400 : 200,
            headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }
      }

      case 'unsuspend': {
        if (!targetUserId) {
          return new Response(JSON.stringify({ error: 'targetUserId required' }), {
            status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }
        if (role === 'moderator') {
          const { data: prof } = await supabase
            .from('user_profiles')
            .select('is_suspended, suspended_until')
            .eq('id', targetUserId)
            .maybeSingle();
          if (prof?.is_suspended && !prof?.suspended_until) {
            return new Response(JSON.stringify({
              error: 'Only full admins can lift a permanent ban',
            }), {
              status: 403, headers: { ...headers, 'Content-Type': 'application/json' },
            });
          }
        }
        const { error: unsuspendError } = await supabase
          .from('user_profiles')
          .update({
            is_suspended: false,
            suspended_until: null,
            suspension_reason: null,
            suspended_at: null,
          })
          .eq('id', targetUserId);
        if (unsuspendError) {
          auditDetails.error = unsuspendError.message;
          result = { error: unsuspendError.message };
        } else {
          await supabase.from('notifications').insert({
            user_id: targetUserId,
            type: 'moderation',
            title: 'Your suspension has been lifted',
            message: 'You can use your account again. Please follow the community guidelines.',
            data: { kind: 'unsuspended' },
          });
          auditDetails.suspended = false;
          result = { success: true, message: `User ${targetEmail ?? targetUserId} unsuspended` };
        }
        break;
      }

      case 'warn_user': {
        if (!targetUserId) {
          return new Response(JSON.stringify({ error: 'targetUserId required' }), {
            status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }
        const warning = (message ?? reason ?? 'Please review the community guidelines.').toString();
        const { error: notifyError } = await supabase.from('notifications').insert({
          user_id: targetUserId,
          type: 'moderation',
          title: 'Warning from the clbhouz team',
          message: warning,
          data: { kind: 'warning' },
        });
        if (notifyError) {
          auditDetails.error = notifyError.message;
          result = { error: notifyError.message };
        } else {
          auditDetails = { ...auditDetails, message: warning };
          result = { success: true, message: 'Warning sent' };
        }
        break;
      }

      case 'hide_post': {
        if (!postId) {
          return new Response(JSON.stringify({ error: 'postId required' }), {
            status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }
        const hideReason = (reason ?? message ?? 'Violation of community guidelines').toString();
        const { data: postRow, error: hideError } = await supabase
          .from('posts')
          .update({
            moderation_hidden: true,
            moderation_hidden_at: new Date().toISOString(),
            moderation_hidden_by: user.id,
            moderation_hidden_reason: hideReason,
          })
          .eq('id', postId)
          .select('user_id')
          .maybeSingle();
        if (hideError) {
          auditDetails.error = hideError.message;
          result = { error: hideError.message };
        } else {
          auditDetails = { postId, reason: hideReason };
          auditTargetUserId = postRow?.user_id ?? undefined;
          result = { success: true, message: 'Post hidden' };
        }
        break;
      }

      case 'unhide_post': {
        if (!postId) {
          return new Response(JSON.stringify({ error: 'postId required' }), {
            status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }
        const { data: postRow, error: unhideError } = await supabase
          .from('posts')
          .update({
            moderation_hidden: false,
            moderation_hidden_at: null,
            moderation_hidden_by: null,
            moderation_hidden_reason: null,
            auto_hidden: false,
          })
          .eq('id', postId)
          .select('user_id')
          .maybeSingle();
        if (unhideError) {
          auditDetails.error = unhideError.message;
          result = { error: unhideError.message };
        } else {
          auditDetails = { postId };
          auditTargetUserId = postRow?.user_id ?? undefined;
          result = { success: true, message: 'Post restored' };
        }
        break;
      }

      case 'delete_course': {
        if (!courseId) {
          return new Response(JSON.stringify({ error: 'courseId required' }), {
            status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }

        const [ratingsRes, postsRes] = await Promise.all([
          supabase.from('course_ratings').select('id', { count: 'exact', head: true }).eq('course_id', courseId),
          supabase.from('posts').select('id', { count: 'exact', head: true }).eq('course_id', courseId),
        ]);

        const ratingCount = ratingsRes.count ?? 0;
        const postCount = postsRes.count ?? 0;

        if (ratingCount > 0 || postCount > 0) {
          result = {
            error: `Cannot delete: this course has ${ratingCount} user rating${ratingCount !== 1 ? 's' : ''} and ${postCount} post${postCount !== 1 ? 's' : ''}. Only delete courses with no user data.`,
            counts: { ratings: ratingCount, posts: postCount },
          };
          break;
        }

        const tables: Array<{ table: string; column: string }> = [
          { table: 'sr_course_map',              column: 'golf_course_id' },
          { table: 'course_top100_memberships',  column: 'course_id' },
          { table: 'business_claimed_courses',   column: 'course_id' },
          { table: 'user_top10_exclusions',      column: 'course_id' },
          { table: 'course_shortlists',          column: 'course_id' },
          { table: 'user_courses',               column: 'course_id' },
          { table: 'course_ratings',             column: 'course_id' },
        ];

        for (const { table, column } of tables) {
          const { error: delErr } = await supabase.from(table as any).delete().eq(column, courseId);
          if (delErr) console.warn(`delete_course: cleanup of ${table} failed:`, delErr.message);
        }

        const { error: finalErr } = await supabase.from('golf_courses').delete().eq('id', courseId);
        if (finalErr) {
          result = { error: `Failed to delete course: ${finalErr.message}` };
        } else {
          result = { success: true, message: 'Course deleted successfully' };
        }

        auditDetails = { courseId, reason };
        break;
      }

      case 'change_username': {
        if (!targetUserId || !newUsername) {
          return new Response(JSON.stringify({ error: 'targetUserId and newUsername required' }), {
            status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }
        const candidate = String(newUsername).trim().toLowerCase();
        if (!USERNAME_RE.test(candidate)) {
          return new Response(JSON.stringify({ error: 'invalid_format' }), {
            status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }

        // Load target current username first (for audit + no-op check).
        const { data: targetProfile, error: targetErr } = await supabase
          .from('user_profiles')
          .select('username')
          .eq('id', targetUserId)
          .maybeSingle();
        if (targetErr || !targetProfile) {
          return new Response(JSON.stringify({ error: 'target_not_found' }), {
            status: 404, headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }
        const oldUsername = targetProfile.username ?? null;
        if (oldUsername === candidate) {
          result = { success: true, message: 'Username unchanged' };
          auditDetails = { newUsername: candidate, oldUsername, noop: true };
          break;
        }

        // Case-insensitive uniqueness check, excluding the target.
        const escaped = candidate.replace(/[\\%_]/g, '\\$&');
        const { count: takenCount, error: takenErr } = await supabase
          .from('user_profiles')
          .select('id', { count: 'exact', head: true })
          .ilike('username', escaped)
          .neq('id', targetUserId);
        if (takenErr) {
          result = { error: takenErr.message };
          auditDetails.error = takenErr.message;
          break;
        }
        if ((takenCount ?? 0) > 0) {
          return new Response(JSON.stringify({ error: 'username_taken' }), {
            status: 409, headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }

        // username_is_custom semantics (src/hooks/useProfileSave.ts L90-97):
        // setting true locks the username the same way a user-chosen save does.
        const { error: updErr } = await supabase
          .from('user_profiles')
          .update({ username: candidate, username_is_custom: true })
          .eq('id', targetUserId);
        if (updErr) {
          result = { error: updErr.message };
          auditDetails.error = updErr.message;
          break;
        }

        // Analytics audit trail (required by brief).
        await supabase.from('analytics_events').insert({
          name: 'admin_username_changed',
          user_id: user.id,
          props: {
            target_user_id: targetUserId,
            old_username: oldUsername,
            new_username: candidate,
          },
        });

        auditDetails = { oldUsername, newUsername: candidate };
        result = { success: true, message: `Username changed to @${candidate}`, username: candidate };
        break;
      }

      case 'retry_asset_cleanup': {
        // Drain any 'pending' or 'failed' manifest rows for the target user.
        // Safe to invoke repeatedly; missing/already-deleted assets are treated as success.
        if (!targetUserId) {
          return new Response(JSON.stringify({ error: 'targetUserId required' }),
            { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } });
        }
        const cfAccountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
        const cfStreamToken = Deno.env.get('CLOUDFLARE_STREAM_API_TOKEN');
        const { data: rows } = await supabase.from('user_deletion_asset_manifest')
          .select('id,kind,ref,attempts').eq('target_user_id', targetUserId).in('status', ['pending','failed']);
        let deleted = 0, failed = 0;
        for (const row of rows ?? []) {
          try {
            if (row.kind === 'stream') {
              if (!cfAccountId || !cfStreamToken) throw new Error('cf_env_missing');
              const resp = await fetch(
                `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/stream/${row.ref}`,
                { method: 'DELETE', headers: { Authorization: `Bearer ${cfStreamToken}` } });
              if (!resp.ok && resp.status !== 404) {
                const body = await resp.text().catch(() => '');
                throw new Error(`cf_${resp.status}:${body.slice(0,200)}`);
              }
            } else {
              const slash = row.ref.indexOf('/');
              const bucket = row.ref.slice(0, slash);
              const key = row.ref.slice(slash + 1);
              const { error } = await supabase.storage.from(bucket).remove([key]);
              if (error) throw new Error(error.message);
            }
            await supabase.from('user_deletion_asset_manifest')
              .update({ status: 'deleted', completed_at: new Date().toISOString(), attempts: (row.attempts ?? 0) + 1, error: null })
              .eq('id', row.id);
            deleted++;
          } catch (e) {
            await supabase.from('user_deletion_asset_manifest')
              .update({ status: 'failed', error: String(e).slice(0, 500), attempts: (row.attempts ?? 0) + 1 })
              .eq('id', row.id);
            failed++;
          }
        }
        auditDetails = { targetUserId, deleted, failed, total: rows?.length ?? 0 };
        result = { success: true, deleted, failed, total: rows?.length ?? 0 };
        break;
      }

      case 'verify_golfer': {
        if (!targetUserId) {
          return new Response(JSON.stringify({ error: 'targetUserId required' }), {
            status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }
        const { data: prof, error: profErr } = await supabase
          .from('user_profiles')
          .select('id, is_verified_golfer, display_name, username')
          .eq('id', targetUserId)
          .maybeSingle();
        if (profErr || !prof) {
          return new Response(JSON.stringify({ error: 'target_not_found' }), {
            status: 404, headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }
        if (prof.is_verified_golfer === true) {
          return new Response(JSON.stringify({ error: 'already_verified' }), {
            status: 409, headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }
        const { error: updErr } = await supabase
          .from('user_profiles')
          .update({ is_verified_golfer: true })
          .eq('id', targetUserId);
        if (updErr) {
          auditDetails.error = updErr.message;
          result = { error: updErr.message };
          break;
        }
        // In-app notification (auto_queue_push_notification trigger fans this
        // out to push). NULL actor_id -> system-authored, lowercase clbhouz.
        await supabase.from('notifications').insert({
          user_id: targetUserId,
          recipient_actor_type: 'personal',
          recipient_actor_id: targetUserId,
          actor_id: null,
          type: 'golfer_verified',
          entity_type: 'profile',
          entity_id: targetUserId,
          title: "You're verified",
          message: 'clbhouz has verified your account.',
          data: { route: '/profile' },
        });
        auditDetails = { targetUserId, verified: true, adminNote: adminNote ?? null };
        result = { success: true, message: 'Golfer verified' };
        break;
      }

      case 'unverify_golfer': {
        if (!targetUserId) {
          return new Response(JSON.stringify({ error: 'targetUserId required' }), {
            status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }
        const { data: prof, error: profErr } = await supabase
          .from('user_profiles')
          .select('id, is_verified_golfer')
          .eq('id', targetUserId)
          .maybeSingle();
        if (profErr || !prof) {
          return new Response(JSON.stringify({ error: 'target_not_found' }), {
            status: 404, headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }
        if (prof.is_verified_golfer !== true) {
          return new Response(JSON.stringify({ error: 'already_unverified' }), {
            status: 409, headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }
        const { error: updErr } = await supabase
          .from('user_profiles')
          .update({ is_verified_golfer: false })
          .eq('id', targetUserId);
        if (updErr) {
          auditDetails.error = updErr.message;
          result = { error: updErr.message };
          break;
        }
        // Deliberately NO notification — removal is silent to the user.
        auditDetails = { targetUserId, verified: false, adminNote: adminNote ?? null };
        result = { success: true, message: 'Verification removed' };
        break;
      }
    }

    const { error: auditError } = await supabase
      .from('admin_audit_log')
      .insert({
        admin_user_id: user.id,
        action,
        ...(auditTargetUserId ? { target_user_id: auditTargetUserId } : {}),
        ...(targetEmail ? { target_email: targetEmail } : {}),
        details: auditDetails,
        ip_address: clientInfo,
        user_agent: userAgent,
      });
    if (auditError) console.error('Failed to log admin action:', auditError);

    return new Response(JSON.stringify(result), {
      status: result.error ? 400 : 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in secure-admin-operations:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
});
