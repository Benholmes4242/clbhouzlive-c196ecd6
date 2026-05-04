// Geocode a golf_clubs row on demand via OpenStreetMap Nominatim,
// persist lat/lng back to the row, and return the coordinates.
//
// Used by the Morning Moment Home Club Weather card when a user's
// primary_club has no latitude/longitude yet.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface NominatimResult {
  lat: string;
  lon: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { club_id } = await req.json();
    if (!club_id || typeof club_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'club_id required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: club, error: clubErr } = await supabase
      .from('golf_clubs')
      .select('id, name, country, region, sub_country, latitude, longitude')
      .eq('id', club_id)
      .maybeSingle();

    if (clubErr || !club) {
      return new Response(
        JSON.stringify({ error: 'Club not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    if (club.latitude !== null && club.longitude !== null) {
      return new Response(
        JSON.stringify({
          latitude: club.latitude,
          longitude: club.longitude,
          cached: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const locationParts = [club.name, club.sub_country, club.region, club.country]
      .filter(Boolean)
      .join(', ');

    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', locationParts);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');

    const geoRes = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Clbhouz/1.0 (https://clbhouz.com)',
      },
    });

    if (!geoRes.ok) {
      return new Response(
        JSON.stringify({ error: 'Geocoding service error' }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const results = (await geoRes.json()) as NominatimResult[];
    if (!results || results.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No geocoding match', latitude: null, longitude: null }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const latitude = parseFloat(results[0].lat);
    const longitude = parseFloat(results[0].lon);

    await supabase
      .from('golf_clubs')
      .update({ latitude, longitude })
      .eq('id', club_id);

    return new Response(
      JSON.stringify({ latitude, longitude, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
