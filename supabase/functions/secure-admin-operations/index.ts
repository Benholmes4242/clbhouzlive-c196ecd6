import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdminOperationRequest {
  action: 'delete_user' | 'reset_password';
  targetUserId: string;
  targetEmail: string;
  reason?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Create Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the JWT from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the user is authenticated and is admin
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    
    if (userError || !user) {
      console.log('User verification failed:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin
    const { data: isAdminData, error: adminError } = await supabase.rpc('is_admin');
    if (adminError || !isAdminData) {
      console.log('Admin check failed:', adminError);
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, targetUserId, targetEmail, reason }: AdminOperationRequest = await req.json();

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
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Prevent admin from deleting themselves
        if (user.id === targetUserId) {
          return new Response(JSON.stringify({ error: 'Cannot delete your own account' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in secure-admin-operations:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});