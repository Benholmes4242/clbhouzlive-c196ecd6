const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type MapType = 'roadmap' | 'satellite' | 'hybrid' | 'terrain';

interface MapUrlRequest {
  latitude: number
  longitude: number
  size: string    // e.g. "600x300"
  zoom?: number   // default 13
  maptype?: MapType // NEW (defaults to 'hybrid')
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { latitude, longitude, size, zoom = 13, maptype }: MapUrlRequest = await req.json()
    const finalMapType: MapType = (maptype as MapType) ?? 'hybrid' // DEFAULT → HYBRID

    if (!latitude || !longitude || !size) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: latitude, longitude, size' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const googleApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY')
    if (!googleApiKey) {
      return new Response(
        JSON.stringify({ error: 'Google Maps API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap'
    // Cache buster changes once every 24h
    const today = new Date();
    const ymd = `${today.getUTCFullYear()}${today.getUTCMonth() + 1}${today.getUTCDate()}`;
    const cacheBuster = `&cb=${ymd}`
    const mapUrl =
      `${baseUrl}?center=${latitude},${longitude}` +
      `&zoom=${zoom}` +
      `&size=${size}` +
      `&scale=2` +
      `&maptype=${finalMapType}` +
      `&key=${googleApiKey}` +
      cacheBuster

    return new Response(
      JSON.stringify({ mapUrl }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=86400, s-maxage=86400'
        } 
      }
    )

  } catch (error) {
    console.error('Error in generate-map-url function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})