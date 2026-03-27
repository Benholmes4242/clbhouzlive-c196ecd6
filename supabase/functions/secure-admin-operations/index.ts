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

interface AdminOperationRequest {
  action: 'delete_user' | 'reset_password' | 'suspend_user' | 'delete_course';
  targetUserId?: string;
  targetEmail?: string;
  courseId?: string;
  reason?: string;
  suspended?: boolean;
}

serve(async (req) => {
  const headers = corsHeaders(req.headers.get('Origin'));

  // Handle CORS preflight requests
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
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
        status: 500,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // Get the JWT from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with user JWT to get authenticated user
    const userSupabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the user is authenticated
    const { data: { user }, error: userError } = await userSupabase.auth.getUser();
    
    if (userError || !user) {
      console.log('User verification failed:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // Create service role client for privileged operations
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check if user is FULL admin via admin_memberships (service role check)
    const { data: actorMem } = await supabase
      .from('admin_memberships')
      .select('role, expires_at')
      .eq('user_id', user.id)
      .maybeSingle();

    const notExpired = !actorMem?.expires_at || new Date(actorMem.expires_at) > new Date();
    const isFull = actorMem?.role === 'full' && notExpired;

    if (!isFull) {
      console.log('Admin check failed: user lacks full admin role');
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const { action, targetUserId, targetEmail, reason, suspended }: AdminOperationRequest = await req.json();

    // Block operations on admin accounts
    const { data: targetMem } = await supabase
      .from('admin_memberships')
      .select('role')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (targetMem?.role) {
      console.log(`Blocked: Cannot operate on admin account ${targetEmail}`);
      return new Response(JSON.stringify({ error: 'Cannot operate on admin accounts' }), {
        status: 403,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // Get client info for audit logging
    const userAgent = req.headers.get('User-Agent') || 'Unknown';
    const clientInfo = req.headers.get('X-Forwarded-For') || 'Unknown';

    console.log(`Admin ${user.email} performing ${action} on user ${targetEmail}`);

    let result: any = {};
    let auditDetails: any = { reason };

    switch (action) {
      case 'delete_user':
        // Additional validation for user deletion
        if (!targetUserId || !targetEmail) {
          return new Response(JSON.stringify({ error: 'Missing required fields' }), {
            status: 400,
            headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }

        // Prevent admin from deleting themselves
        if (user.id === targetUserId) {
          return new Response(JSON.stringify({ error: 'Cannot delete your own account' }), {
            status: 400,
            headers: { ...headers, 'Content-Type': 'application/json' },
          });
        }

        // Delete user using service role
        const { error: deleteError } = await supabase.auth.admin.deleteUser(targetUserId);
        
        if (deleteError) {
          console.error('Error deleting user:', deleteError);
          auditDetails.error = deleteError.message;
          result = { error: deleteError.message };
        } else {
          console.log(`Successfully deleted user ${targetEmail}`);
          result = { success: true, message: `User ${targetEmail} deleted successfully` };
        }
        break;

      case 'reset_password':
        // Send password reset email
        const { error: resetError } = await supabase.auth.admin.generateLink({
          type: 'recovery',
          email: targetEmail,
        });
        
        if (resetError) {
          console.error('Error sending password reset:', resetError);
          auditDetails.error = resetError.message;
          result = { error: resetError.message };
        } else {
          console.log(`Password reset sent to ${targetEmail}`);
          result = { success: true, message: `Password reset email sent to ${targetEmail}` };
        }
        break;

      case 'suspend_user': {
        const isSuspending = suspended !== false; // default to suspend if not specified
        
        const { error: suspendError } = await supabase
          .from('user_profiles')
          .update({ is_suspended: isSuspending })
          .eq('id', targetUserId);

        if (suspendError) {
          console.error('Error suspending user:', suspendError);
          auditDetails.error = suspendError.message;
          auditDetails.suspended = isSuspending;
          result = { error: suspendError.message };
        } else {
          // If suspending, also fail any pending scheduled posts immediately
          if (isSuspending) {
            const { error: postsError } = await supabase
              .from('posts')
              .update({ status: 'failed', updated_at: new Date().toISOString() })
              .eq('user_id', targetUserId)
              .eq('status', 'scheduled');

            if (postsError) {
              console.error('Error failing scheduled posts:', postsError);
              auditDetails.scheduled_posts_error = postsError.message;
            }
          }

          const actionLabel = isSuspending ? 'suspended' : 'unsuspended';
          console.log(`Successfully ${actionLabel} user ${targetEmail}`);
          auditDetails.suspended = isSuspending;
          result = { success: true, message: `User ${targetEmail} ${actionLabel} successfully` };
        }
        break;
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
        });
    }

    // Log the admin action for audit trail
    const { error: auditError } = await supabase
      .from('admin_audit_log')
      .insert({
        admin_user_id: user.id,
        action,
        target_user_id: targetUserId,
        target_email: targetEmail,
        details: auditDetails,
        ip_address: clientInfo,
        user_agent: userAgent,
      });

    if (auditError) {
      console.error('Failed to log admin action:', auditError);
    }

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