import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAPBOX_TOKEN = 'pk.eyJ1IjoiY2xiaG91eiIsImEiOiJjbTVyejIzMXcxemx2MmpzZDU3YjkxNjNkIn0.H_w9d-UAvvMRkJ_9DoVQ-A'

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const query = url.searchParams.get('q')
    
    if (!query || query.length < 2) {
      return new Response(
        JSON.stringify({ features: [], error: 'Query must be at least 2 characters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Use Mapbox Geocoding API with address-focused types
    // Include address, poi, postcode, place to get better results for addresses
    const types = url.searchParams.get('types') || 'address,poi,postcode,place'
    
    const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&types=${types}&limit=8&language=en`
    
    const response = await fetch(mapboxUrl)
    
    if (!response.ok) {
      console.error('Mapbox API error:', response.status, await response.text())
      return new Response(
        JSON.stringify({ features: [], error: 'Search service unavailable' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
      )
    }
    
    const data = await response.json()
    
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Address search error:', error)
    return new Response(
      JSON.stringify({ features: [], error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
