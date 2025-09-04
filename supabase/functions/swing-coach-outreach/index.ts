// deno-lint-ignore-file no-explicit-any
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OutreachRequest {
  swingAnalysisId: string;
  city?: string;
  region?: string;
  country?: string;
  lat?: number;
  lng?: number;
  radiusKm: number;
  focus?: string;
  priceMin?: number;
  priceMax?: number;
  shareVideo: boolean;
  shareAnalysisText: boolean;
  firstNameOnly: boolean;
  maskPreciseLocation: boolean;
}

interface Coach {
  id: string;
  name: string;
  academy?: string;
  city?: string;
  region?: string;
  country?: string;
  lat?: number;
  lng?: number;
  specialties?: string[];
  price_min?: number;
  price_max?: number;
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { 
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      },
      global: { 
        headers: { Authorization: authHeader } 
      }
    });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body: OutreachRequest = await req.json();
    console.log('Creating outreach request:', body);

    // Rate limiting: Check for recent active outreach
    const { data: recentOutreach, error: recentError } = await supabase
      .from('swing_coach_outreach')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'open')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (recentError) {
      console.error('Error checking recent outreach:', recentError);
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (recentOutreach && recentOutreach.length > 0) {
      return new Response(JSON.stringify({ 
        error: 'You already have an active coach request. Please wait 24 hours before creating another.' 
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create outreach record
    const outreachData = {
      user_id: user.id,
      swing_analysis_id: body.swingAnalysisId,
      city: body.city,
      region: body.region,
      country: body.country,
      lat: body.lat,
      lng: body.lng,
      radius_km: body.radiusKm,
      focus: body.focus,
      price_min: body.priceMin,
      price_max: body.priceMax,
      share_video: body.shareVideo,
      share_analysis_text: body.shareAnalysisText,
      first_name_only: body.firstNameOnly,
      mask_precise_location: body.maskPreciseLocation,
      consented_at: body.shareVideo || body.shareAnalysisText ? new Date().toISOString() : null,
      terms_version: '1.0',
      status: 'open'
    };

    const { data: outreach, error: outreachError } = await supabase
      .from('swing_coach_outreach')
      .insert([outreachData])
      .select()
      .single();

    if (outreachError) {
      console.error('Error creating outreach:', outreachError);
      return new Response(JSON.stringify({ error: 'Failed to create outreach request' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Outreach created:', outreach.id);

    // Find matching coaches
    const { data: coaches, error: coachError } = await supabase
      .from('coaches')
      .select('*')
      .eq('active', true);

    if (coachError) {
      console.error('Error fetching coaches:', coachError);
      return new Response(JSON.stringify({ error: 'Failed to fetch coaches' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let matchedCoaches: Coach[] = [];

    if (body.lat && body.lng && coaches) {
      // Filter by distance
      matchedCoaches = coaches.filter((coach: Coach) => {
        if (!coach.lat || !coach.lng) return false;
        
        const distance = calculateDistance(body.lat!, body.lng!, coach.lat, coach.lng);
        if (distance > body.radiusKm) return false;

        // Filter by specialty if specified
        if (body.focus && coach.specialties && coach.specialties.length > 0) {
          return coach.specialties.includes(body.focus);
        }

        // Filter by price range if specified
        if (body.priceMin && coach.price_max && coach.price_max < body.priceMin) return false;
        if (body.priceMax && coach.price_min && coach.price_min > body.priceMax) return false;

        return true;
      });
    } else if (coaches) {
      // Fallback to all coaches if no location provided
      matchedCoaches = coaches.filter((coach: Coach) => {
        if (body.focus && coach.specialties && coach.specialties.length > 0) {
          return coach.specialties.includes(body.focus);
        }
        
        if (body.priceMin && coach.price_max && coach.price_max < body.priceMin) return false;
        if (body.priceMax && coach.price_min && coach.price_min > body.priceMax) return false;

        return true;
      });
    }

    // Limit to top 3 coaches
    const selectedCoaches = matchedCoaches.slice(0, 3);
    
    console.log(`Found ${matchedCoaches.length} matching coaches, selected ${selectedCoaches.length}`);

    // Create outreach targets
    if (selectedCoaches.length > 0) {
      const targets = selectedCoaches.map(coach => ({
        outreach_id: outreach.id,
        coach_id: coach.id
      }));

      const { error: targetsError } = await supabase
        .from('swing_coach_outreach_targets')
        .insert(targets);

      if (targetsError) {
        console.error('Error creating targets:', targetsError);
        return new Response(JSON.stringify({ error: 'Failed to create coach targets' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log(`Created targets for ${selectedCoaches.length} coaches`);
    }

    return new Response(JSON.stringify({
      outreachId: outreach.id,
      matchedCoaches: selectedCoaches.length,
      selectedCoaches: selectedCoaches.map(c => ({
        id: c.id,
        name: c.name,
        academy: c.academy,
        city: c.city,
        specialties: c.specialties
      }))
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in swing-coach-outreach function:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});