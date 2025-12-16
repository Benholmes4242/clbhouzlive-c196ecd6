import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const MAPBOX_TOKEN = Deno.env.get('MAPBOX_TOKEN')
    if (!MAPBOX_TOKEN) {
      console.error('MAPBOX_TOKEN not configured')
      return new Response(
        JSON.stringify({ features: [], error: 'Search service not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const url = new URL(req.url)
    const query = url.searchParams.get('q')
    
    // Minimum query length for rate limiting
    if (!query || query.length < 3) {
      return new Response(
        JSON.stringify({ features: [], error: 'Query must be at least 3 characters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Use Mapbox Geocoding API with address-focused types
    const types = url.searchParams.get('types') || 'address,poi,postcode,place'
    
    const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&types=${types}&limit=8&language=en`
    
    console.log('[address-search] Querying Mapbox for:', query)
    
    const response = await fetch(mapboxUrl)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[address-search] Mapbox API error:', response.status, errorText)
      return new Response(
        JSON.stringify({ features: [], error: 'Search service unavailable' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
      )
    }
    
    const data = await response.json()
    console.log('[address-search] Returning', data.features?.length || 0, 'results')
    
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('[address-search] Error:', error)
    return new Response(
      JSON.stringify({ features: [], error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
