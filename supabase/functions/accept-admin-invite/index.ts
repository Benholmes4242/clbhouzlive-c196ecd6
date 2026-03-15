import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { inviteId, userId, action } = await req.json();
    // action: 'accept' | 'decline'

    if (!inviteId || !userId || !action) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch the invite and verify it belongs to this user
    const { data: invite, error: fetchError } = await supabase
      .from('admin_invitations')
      .select('*')
      .eq('id', inviteId)
      .eq('invited_user_id', userId)
      .eq('status', 'pending')
      .maybeSingle();

    if (fetchError || !invite) {
      return new Response(JSON.stringify({ error: 'Invite not found or already actioned' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'accept') {
      // Grant admin role
      const { error: membershipError } = await supabase
        .from('admin_memberships')
        .insert({
          user_id: userId,
          role: invite.role || 'limited',
          granted_by: invite.invited_by,
        });

      if (membershipError) {
        console.error('[accept-admin-invite] Membership error:', membershipError);
        throw membershipError;
      }

      // Update invite status to accepted
      await supabase
        .from('admin_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', inviteId);
    } else {
      // Decline — update invite status to cancelled
      await supabase
        .from('admin_invitations')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', inviteId);
    }

    // Mark the notification as read
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('entity_id', inviteId)
      .eq('entity_type', 'admin_invitation')
      .eq('type', 'admin_invite');

    return new Response(JSON.stringify({ success: true, action }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[accept-admin-invite] Error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
