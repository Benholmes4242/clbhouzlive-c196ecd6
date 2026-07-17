import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { corsFor } from '../_shared/cors.ts';
serve(async (req) => {
  const corsHeaders = corsFor(req.headers.get('Origin'));
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create service role client (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    
    // Create user client to verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    
    // Verify the caller is authenticated
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify caller is an admin
    const { data: adminMembership } = await supabaseAdmin
      .from('admin_memberships')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    if (!adminMembership) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'create') {
      return await handleCreate(supabaseAdmin, body);
    } else if (action === 'reset') {
      return await handleReset(supabaseAdmin, body);
    } else {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error in admin-testlab-business-access:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleCreate(supabase: any, body: any) {
  const {
    business_id,
    requester_user_profile_id,
    requested_role,
    message,
    seed_key,
  } = body;

  if (!business_id || !requester_user_profile_id || !requested_role || !seed_key) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  console.log('[admin-testlab-business-access] Creating request:', {
    business_id,
    requester_user_profile_id,
    requested_role,
    seed_key,
  });

  // Get business info
  const { data: business, error: businessError } = await supabase
    .from('business_accounts')
    .select('id, name, logo_url')
    .eq('id', business_id)
    .single();

  if (businessError || !business) {
    console.error('Business not found:', businessError);
    return new Response(JSON.stringify({ error: 'Business not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Get requester info
  const { data: requester, error: requesterError } = await supabase
    .from('user_profiles')
    .select('id, display_name, username, profile_photo_url')
    .eq('id', requester_user_profile_id)
    .single();

  if (requesterError || !requester) {
    console.error('Requester not found:', requesterError);
    return new Response(JSON.stringify({ error: 'Requester not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Check for existing pending request (handle 23505 duplicate gracefully)
  const { data: existingRequest } = await supabase
    .from('business_access_requests')
    .select('id')
    .eq('business_id', business_id)
    .eq('requester_user_profile_id', requester_user_profile_id)
    .eq('status', 'pending')
    .maybeSingle();

  if (existingRequest) {
    console.log('[admin-testlab-business-access] Request already pending:', existingRequest.id);
    
    // Still need admin count for response
    const { data: admins } = await supabase
      .from('business_members')
      .select('user_profile_id')
      .eq('business_id', business_id)
      .in('role', ['owner', 'admin', 'primary_manager', 'manager', 'member']);
    
    return new Response(JSON.stringify({
      success: true,
      already_pending: true,
      request_id: existingRequest.id,
      admin_count: admins?.length || 0,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Insert access request
  const { data: request, error: requestError } = await supabase
    .from('business_access_requests')
    .insert({
      business_id,
      requester_user_profile_id,
      requested_role,
      message: message || null,
      status: 'pending',
    })
    .select('id')
    .single();

  if (requestError) {
    // Handle unique constraint violation (23505)
    if (requestError.code === '23505') {
      console.log('[admin-testlab-business-access] Duplicate request detected via constraint');
      const { data: existing } = await supabase
        .from('business_access_requests')
        .select('id')
        .eq('business_id', business_id)
        .eq('requester_user_profile_id', requester_user_profile_id)
        .eq('status', 'pending')
        .single();
      
      return new Response(JSON.stringify({
        success: true,
        already_pending: true,
        request_id: existing?.id || null,
        admin_count: 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.error('Failed to create request:', requestError);
    return new Response(JSON.stringify({ error: 'Failed to create request: ' + requestError.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  console.log('[admin-testlab-business-access] Request created:', request.id);

  // Get business admins to notify (owners, admins, managers, primary_manager, member with management perms)
  // Include ALL roles that might have management permissions
  const { data: admins, error: adminsError } = await supabase
    .from('business_members')
    .select('user_profile_id')
    .eq('business_id', business_id)
    .in('role', ['owner', 'admin', 'primary_manager', 'manager']);

  if (adminsError) {
    console.error('Failed to fetch admins:', adminsError);
  }

  const adminIds = admins?.map((a: any) => a.user_profile_id) || [];
  console.log('[admin-testlab-business-access] Found admins to notify:', adminIds.length, adminIds);

  // Create notifications for each admin
  const requesterName = requester.display_name || requester.username || 'A user';
  const notifications = adminIds.map((adminId: string) => ({
    user_id: adminId,
    actor_id: requester_user_profile_id,
    type: 'business_access_request',
    title: 'Access request',
    entity_type: 'business',
    entity_id: business_id,
    data: {
      seed_key,
      request_id: request.id,
      business_id,
      business_name: business.name,
      business_avatar_url: business.logo_url,
      entity_name: business.name,
      entity_avatar_url: business.logo_url,
      requester_id: requester_user_profile_id,
      requester_name: requesterName,
      requester_avatar_url: requester.profile_photo_url,
      role_requested: requested_role,
    },
  }));

  if (notifications.length > 0) {
    const { error: notifError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (notifError) {
      console.error('Failed to create notifications:', notifError);
    } else {
      console.log('[admin-testlab-business-access] Created', notifications.length, 'notifications');
    }
  }

  return new Response(JSON.stringify({
    success: true,
    request_id: request.id,
    admin_count: adminIds.length,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleReset(supabase: any, body: any) {
  const { seed_key } = body;

  if (!seed_key) {
    return new Response(JSON.stringify({ error: 'Missing seed_key' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  console.log('[admin-testlab-business-access] Resetting test state for seed_key:', seed_key);

  // STEP 1: First fetch seeded notifications to extract request_ids BEFORE deleting
  const { data: seededNotifs } = await supabase
    .from('notifications')
    .select('data')
    .filter('data->>seed_key', 'eq', seed_key);
  
  const requestIds = (seededNotifs || [])
    .map((n: any) => n.data?.request_id)
    .filter(Boolean);

  console.log('[admin-testlab-business-access] Found request_ids from notifications:', requestIds);

  // STEP 2: Delete the access requests by those ids
  let reqCount = 0;
  if (requestIds.length > 0) {
    const { data: deletedReqs, error: reqError } = await supabase
      .from('business_access_requests')
      .delete()
      .in('id', requestIds)
      .select('id');
    
    reqCount = deletedReqs?.length || 0;
    if (reqError) {
      console.error('Failed to delete requests:', reqError);
    } else {
      console.log('[admin-testlab-business-access] Deleted requests:', reqCount);
    }
  }

  // STEP 3: Now delete the notifications
  const { data: deletedNotifs, error: notifError } = await supabase
    .from('notifications')
    .delete()
    .filter('data->>seed_key', 'eq', seed_key)
    .select('id');

  const notifCount = deletedNotifs?.length || 0;
  if (notifError) {
    console.error('Failed to delete notifications:', notifError);
  } else {
    console.log('[admin-testlab-business-access] Deleted notifications:', notifCount);
  }

  return new Response(JSON.stringify({
    success: true,
    deleted_notifications: notifCount,
    deleted_requests: reqCount,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
