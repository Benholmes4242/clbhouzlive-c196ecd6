// Geocode a golf_clubs row on demand via Photon (OpenStreetMap golf courses),
// persist lat/lng back to the row only where both are null, and return them.
// Used by useCourseCoordinates (course page fallback) and the Home Club Weather card.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

import { corsFor } from '../_shared/cors.ts';
import { geocodeGolfClub } from '../_shared/geocodeGolfClub.ts';
import { geocodeClub } from './handler.ts';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  const corsHeaders = corsFor(req.headers.get('Origin'));
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  const reply = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    const { club_id } = await req.json();
    if (!club_id || typeof club_id !== 'string') return reply({ error: 'club_id required' }, 400);
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { status, body } = await geocodeClub(club_id, {
      loadClub: async (id) => {
        const { data, error } = await supabase.from('golf_clubs')
          .select('id, name, sub_country, latitude, longitude').eq('id', id).maybeSingle();
        return error ? null : data;
      },
      geocode: (club) => geocodeGolfClub(club),
      writeCoords: (id, coords) =>
        supabase.from('golf_clubs').update(coords).eq('id', id).is('latitude', null).is('longitude', null),
    });
    return reply(body, status);
  } catch (err) {
    return reply({ error: String(err) }, 500);
  }
});
