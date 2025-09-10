const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MapUrlRequest {
  latitude: number
  longitude: number
  size: string
  zoom?: number
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { latitude, longitude, size, zoom = 13 }: MapUrlRequest = await req.json()

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
    const params = new URLSearchParams({
      center: `${latitude},${longitude}`,
      zoom: zoom.toString(),
      size,
      scale: '2',
      maptype: 'roadmap',
      markers: `color:red|${latitude},${longitude}`,
      style: 'feature:all|element:labels|visibility:simplified',
      key: googleApiKey
    })

    const mapUrl = `${baseUrl}?${params.toString()}`

    return new Response(
      JSON.stringify({ mapUrl }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
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