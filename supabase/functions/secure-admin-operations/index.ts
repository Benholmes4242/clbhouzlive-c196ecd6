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
  | 'delete_course';

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
}

const ALLOWED_NONFULL_DURATIONS = new Set<number>([1, 7, 30]);

serve(async (req) => {
  const corsHeaders = corsFor(req.headers.get('Origin'));
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
    } = body;

    // Per-action gate
    const fullOnlyActions: AdminAction[] = ['delete_user', 'reset_password', 'delete_course'];
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
        if (!targetUserId || !targetEmail) {
          return new Response(JSON.stringify({ error: 'Missing required fields' }), {
            status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }
        if (user.id === targetUserId) {
          return new Response(JSON.stringify({ error: 'Cannot delete your own account' }), {
            status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }
        const { error: deleteError } = await supabase.auth.admin.deleteUser(targetUserId);
        if (deleteError) {
          auditDetails.error = deleteError.message;
          result = { error: deleteError.message };
        } else {
          result = { success: true, message: `User ${targetEmail} deleted successfully` };
        }
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
