import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors Headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    // Route: POST /pings - Create ping
    if (req.method === 'POST' && pathParts.length === 2) {
      return await createPing(supabase, user.id, req);
    }

    // Route: GET /pings - List pings
    if (req.method === 'GET' && pathParts.length === 2) {
      return await listPings(supabase, user.id, url.searchParams);
    }

    // Route: GET /pings/me/active - Get my active ping
    if (req.method === 'GET' && pathParts[2] === 'me' && pathParts[3] === 'active') {
      return await getMyActivePing(supabase, user.id);
    }

    // Route: POST /pings/:id/respond - Respond to ping
    if (req.method === 'POST' && pathParts[3] === 'respond') {
      return await respondToPing(supabase, user.id, pathParts[2], req);
    }

    // Route: POST /pings/:id/review - Review responder
    if (req.method === 'POST' && pathParts[3] === 'review') {
      return await reviewResponder(supabase, user.id, pathParts[2], req);
    }

    // Route: POST /pings/:id/close - Close ping
    if (req.method === 'POST' && pathParts[3] === 'close') {
      return await closePing(supabase, user.id, pathParts[2]);
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function createPing(supabase: any, userId: string, req: Request) {
  const body = await req.json();
  const { clubId, lat, lng, playersNeeded, format, visibility, isAnonymous, note, durationMins } = body;

  // Validate input
  if (!format || !visibility) {
    return new Response(
      JSON.stringify({ error: 'VALIDATION', details: 'format and visibility are required' }),
      { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check for existing active ping
  const { data: existingPing } = await supabase
    .from('pings')
    .select('id')
    .eq('creator_id', userId)
    .eq('status', 'ACTIVE')
    .gt('expires_at', new Date().toISOString())
    .single();

  if (existingPing) {
    return new Response(
      JSON.stringify({ error: 'ACTIVE_PING_EXISTS' }),
      { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const duration = Math.min(durationMins || 20, 60);
  const expiresAt = new Date(Date.now() + duration * 60 * 1000);

  const { data: ping, error } = await supabase
    .from('pings')
    .insert({
      creator_id: userId,
      club_id: clubId || null,
      lat: lat || null,
      lng: lng || null,
      players_needed: playersNeeded || 1,
      format,
      visibility,
      is_anonymous: isAnonymous || false,
      note: note || null,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Create ping error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ ping }),
    { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function listPings(supabase: any, userId: string, params: URLSearchParams) {
  const scope = params.get('scope') || 'nearby';
  const lat = parseFloat(params.get('lat') || '0');
  const lng = parseFloat(params.get('lng') || '0');
  const limit = Math.min(parseInt(params.get('limit') || '20'), 100);

  let query = supabase
    .from('pings')
    .select(`
      *,
      creator:user_profiles!creator_id(id, display_name, username, profile_photo_url, home_club, handicap),
      club:golf_courses!club_id(id, name)
    `)
    .eq('status', 'ACTIVE')
    .gt('expires_at', new Date().toISOString())
    .limit(limit);

  // Apply visibility filter
  if (scope === 'friends') {
    const { data: following } = await supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', userId);
    
    const followingIds = following?.map((f: any) => f.following_id) || [];
    query = query.in('creator_id', followingIds);
  }

  const { data: pings, error } = await query;

  if (error) {
    console.error('List pings error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Transform to privacy-safe cards
  const items = pings.map((ping: any) => {
    if (ping.is_anonymous) {
      // Mask creator details
      return {
        id: ping.id,
        clubId: ping.club_id,
        clubName: ping.club?.name,
        format: ping.format,
        playersNeeded: ping.players_needed,
        visibility: ping.visibility,
        note: ping.note,
        expiresAt: ping.expires_at,
        isAnonymous: true,
        homeClub: ping.creator?.home_club,
        handicap: ping.creator?.handicap,
        distance: calculateDistance(lat, lng, ping.lat, ping.lng),
      };
    } else {
      return {
        id: ping.id,
        creator: ping.creator,
        clubId: ping.club_id,
        clubName: ping.club?.name,
        format: ping.format,
        playersNeeded: ping.players_needed,
        visibility: ping.visibility,
        note: ping.note,
        expiresAt: ping.expires_at,
        isAnonymous: false,
        distance: calculateDistance(lat, lng, ping.lat, ping.lng),
      };
    }
  });

  return new Response(
    JSON.stringify({ items }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getMyActivePing(supabase: any, userId: string) {
  const { data: ping, error } = await supabase
    .from('pings')
    .select(`
      *,
      club:golf_courses!club_id(id, name),
      responses:ping_responses(
        id,
        message,
        state,
        created_at,
        responder:user_profiles!responder_id(id, display_name, username, profile_photo_url, home_club, handicap)
      )
    `)
    .eq('creator_id', userId)
    .eq('status', 'ACTIVE')
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return new Response(
        JSON.stringify({ ping: null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ ping }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function respondToPing(supabase: any, userId: string, pingId: string, req: Request) {
  const body = await req.json();
  const { message } = body;

  // Check if ping is still active
  const { data: ping } = await supabase
    .from('pings')
    .select('id, status, expires_at')
    .eq('id', pingId)
    .single();

  if (!ping || ping.status !== 'ACTIVE' || new Date(ping.expires_at) < new Date()) {
    return new Response(
      JSON.stringify({ error: 'PING_CLOSED' }),
      { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Create response
  const { data: response, error } = await supabase
    .from('ping_responses')
    .insert({
      ping_id: pingId,
      responder_id: userId,
      message: message || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return new Response(
        JSON.stringify({ error: 'ALREADY_RESPONDED' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ response }),
    { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function reviewResponder(supabase: any, userId: string, pingId: string, req: Request) {
  const body = await req.json();
  const { responseId, decision } = body;

  // Verify ping ownership
  const { data: ping } = await supabase
    .from('pings')
    .select('id, creator_id, is_anonymous')
    .eq('id', pingId)
    .eq('creator_id', userId)
    .single();

  if (!ping) {
    return new Response(
      JSON.stringify({ error: 'UNAUTHORIZED' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Update response state
  const newState = decision === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED';
  const { data: response, error } = await supabase
    .from('ping_responses')
    .update({ state: newState })
    .eq('id', responseId)
    .eq('ping_id', pingId)
    .select(`
      *,
      responder:user_profiles!responder_id(id, display_name, username, profile_photo_url, home_club, handicap)
    `)
    .single();

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  let result: any = { result: newState };

  if (decision === 'ACCEPT') {
    // Create match
    await supabase
      .from('ping_matches')
      .insert({
        ping_id: pingId,
        participant_ids: [userId, response.responder_id],
      });

    // Return revealed profile if anonymous
    if (ping.is_anonymous) {
      const { data: creator } = await supabase
        .from('user_profiles')
        .select('id, display_name, username, profile_photo_url, home_club, handicap')
        .eq('id', userId)
        .single();
      
      result.revealedProfile = creator;
    }

    result.responder = response.responder;
  }

  return new Response(
    JSON.stringify(result),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function closePing(supabase: any, userId: string, pingId: string) {
  const { error } = await supabase
    .from('pings')
    .update({ status: 'CLOSED' })
    .eq('id', pingId)
    .eq('creator_id', userId);

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ status: 'CLOSED' }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  if (!lat1 || !lng1 || !lat2 || !lng2) return 0;
  
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
