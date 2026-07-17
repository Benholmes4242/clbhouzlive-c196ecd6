import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

import { corsFor } from '../_shared/cors.ts';
// Determine location precision from Mapbox place_type
function getPrecision(placeTypes: string[]): string {
  if (placeTypes.includes('address')) return 'address'
  if (placeTypes.includes('poi')) return 'poi'
  if (placeTypes.includes('postcode')) return 'postcode'
  if (placeTypes.includes('locality') || placeTypes.includes('place')) return 'city'
  if (placeTypes.includes('region')) return 'region'
  if (placeTypes.includes('country')) return 'country'
  return 'unknown'
}

serve(async (req) => {
  const corsHeaders = corsFor(req.headers.get('Origin'));
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const MAPBOX_TOKEN = Deno.env.get('MAPBOX_TOKEN')
    if (!MAPBOX_TOKEN) {
      console.error('[address-search] MAPBOX_TOKEN not configured')
      return new Response(
        JSON.stringify({ results: [], error: 'Search service not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const url = new URL(req.url)
    const query = url.searchParams.get('q')
    const country = url.searchParams.get('country')
    const proximity = url.searchParams.get('proximity') // optional: lng,lat
    
    // Country is required
    if (!country) {
      return new Response(
        JSON.stringify({ results: [], error: 'country parameter is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
    // Minimum query length
    if (!query || query.length < 3) {
      return new Response(
        JSON.stringify({ results: [], error: 'Query must be at least 3 characters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Type ramping based on query length
    // Short queries: broader types to help find area/postcode
    // Longer queries: focus on addresses
    const types = query.length < 6 
      ? 'postcode,place,locality,neighborhood,poi'
      : 'address,poi,postcode'
    
    // Build Mapbox URL
    let mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`
    mapboxUrl += `?access_token=${MAPBOX_TOKEN}`
    mapboxUrl += `&country=${country.toLowerCase()}`
    mapboxUrl += `&types=${types}`
    mapboxUrl += `&limit=6`
    mapboxUrl += `&autocomplete=true`
    mapboxUrl += `&language=en`
    
    // Add proximity bias if provided
    if (proximity) {
      mapboxUrl += `&proximity=${proximity}`
    }
    
    console.log('[address-search] Query:', query, 'Country:', country, 'Types:', types)
    
    const response = await fetch(mapboxUrl)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[address-search] Mapbox API error:', response.status, errorText)
      return new Response(
        JSON.stringify({ results: [], error: 'Search service unavailable' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 502 }
      )
    }
    
    const data = await response.json()
    
    // Helper to extract context values from Mapbox response
    function extractContext(feature: any): { city?: string; region?: string; country?: string; postcode?: string } {
      const context: { city?: string; region?: string; country?: string; postcode?: string } = {};
      
      // Check feature.context array for structured data
      if (feature.context && Array.isArray(feature.context)) {
        for (const ctx of feature.context) {
          const id = ctx.id || '';
          if (id.startsWith('place.') || id.startsWith('locality.')) {
            context.city = ctx.text;
          } else if (id.startsWith('region.')) {
            context.region = ctx.short_code?.replace(/^[A-Z]{2}-/, '') || ctx.text;
          } else if (id.startsWith('country.')) {
            context.country = ctx.text;
          } else if (id.startsWith('postcode.')) {
            context.postcode = ctx.text;
          }
        }
      }
      
      // If the feature itself is a place/locality, use it as city
      if (!context.city && feature.place_type?.includes('place')) {
        context.city = feature.text;
      }
      if (!context.city && feature.place_type?.includes('locality')) {
        context.city = feature.text;
      }
      
      return context;
    }
    
    // Transform to consistent structure
    const results = (data.features || []).map((feature: any) => {
      const contextData = extractContext(feature);
      return {
        label: feature.place_name,
        lat: feature.center[1],
        lng: feature.center[0],
        place_id: feature.id,
        precision: getPrecision(feature.place_type || []),
        // Extract components for display
        primary: feature.text,
        secondary: feature.place_name.replace(feature.text + ', ', '').replace(feature.text, ''),
        // Structured location data
        city: contextData.city || null,
        region: contextData.region || null,
        country: contextData.country || null,
        postcode: contextData.postcode || null,
      };
    })
    
    console.log('[address-search] Returning', results.length, 'results')
    
    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('[address-search] Error:', error)
    return new Response(
      JSON.stringify({ results: [], error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
