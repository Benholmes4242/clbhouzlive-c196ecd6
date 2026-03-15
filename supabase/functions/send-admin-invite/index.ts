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

    const { invitedUserId, invitedByUserId, role } = await req.json();

    if (!invitedUserId || !invitedByUserId || !role) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check inviter is a full admin
    const { data: inviterRole } = await supabase
      .from('admin_memberships')
      .select('role')
      .eq('user_id', invitedByUserId)
      .single();

    if (inviterRole?.role !== 'full') {
      return new Response(JSON.stringify({ error: 'Only full admins can send invites' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check target user isn't already an admin
    const { data: existing } = await supabase
      .from('admin_memberships')
      .select('user_id')
      .eq('user_id', invitedUserId)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: 'User is already an admin' }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check no pending invite already exists
    const { data: pendingInvite } = await supabase
      .from('admin_invitations')
      .select('id')
      .eq('invited_user_id', invitedUserId)
      .eq('status', 'pending')
      .maybeSingle();

    if (pendingInvite) {
      return new Response(JSON.stringify({ error: 'User already has a pending invite' }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get inviter profile for the notification message
    const { data: inviterProfile } = await supabase
      .from('user_profiles')
      .select('display_name, username, profile_photo_url')
      .eq('id', invitedByUserId)
      .single();

    const inviterName = inviterProfile?.display_name || inviterProfile?.username || 'An admin';
    const roleLabel = role === 'full' ? 'a Full Admin' : 'a Limited Admin';

    // Generate token for the invitation record
    const token = crypto.randomUUID();

    // Create the invitation record
    const { data: invite, error: inviteError } = await supabase
      .from('admin_invitations')
      .insert({
        invited_user_id: invitedUserId,
        invited_by: invitedByUserId,
        role,
        status: 'pending',
        token,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (inviteError) {
      console.error('[send-admin-invite] Insert error:', inviteError);
      throw inviteError;
    }

    // Create in-app notification for the invited user
    const { error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: invitedUserId,
        recipient_actor_type: 'personal',
        recipient_actor_id: invitedUserId,
        actor_id: invitedByUserId,
        type: 'admin_invite',
        title: 'Admin Invitation',
        message: `${inviterName} has invited you to join the Clbhouz admin team as ${roleLabel}.`,
        entity_type: 'admin_invitation',
        entity_id: invite.id,
        data: {
          invite_id: invite.id,
          role,
          inviter_name: inviterName,
          inviter_avatar_url: inviterProfile?.profile_photo_url || null,
        },
      });

    if (notifError) {
      console.error('[send-admin-invite] Notification error:', notifError);
    }

    return new Response(JSON.stringify({ success: true, inviteId: invite.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[send-admin-invite] Error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
