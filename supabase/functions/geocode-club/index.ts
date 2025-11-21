import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GeocodeRequest {
  courseId: string
  clubName: string
  region?: string
  country: string
  subCountry?: string
}

interface GeocodeResponse {
  latitude: number
  longitude: number
  confidence: string
  geocoded_at: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { courseId, clubName, region, country, subCountry }: GeocodeRequest = await req.json()

    if (!courseId || !clubName || !country) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: courseId, clubName, country' }),
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

    // Try progressively broader queries
    const queries = [
      `${clubName}, ${region || ''}, ${subCountry || ''}, ${country}`.replace(/,\s*,/g, ',').trim(),
      `${clubName} golf club, ${subCountry || ''}, ${country}`.replace(/,\s*,/g, ',').trim(),
      `${clubName} golf club, ${country}`,
      `${clubName}, ${country}`
    ]

    let bestResult: GeocodeResponse | null = null

    for (const query of queries) {
      console.log(`Trying geocode query: ${query}`)
      
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${googleApiKey}`
        )
        
        const data = await response.json()
        
        if (data.status === 'OK' && data.results.length > 0) {
          const result = data.results[0]
          const location = result.geometry.location
          
          // Determine confidence based on result type and query specificity
          let confidence = 'low'
          if (result.types.includes('establishment') || result.types.includes('point_of_interest')) {
            confidence = 'high'
          } else if (result.types.includes('locality') || result.types.includes('sublocality')) {
            confidence = 'medium'
          }
          
          bestResult = {
            latitude: location.lat,
            longitude: location.lng,
            confidence,
            geocoded_at: new Date().toISOString()
          }
          
          console.log(`Geocoded successfully with confidence: ${confidence}`)
          break
        }
      } catch (error) {
        console.error(`Error with query "${query}":`, error)
        continue
      }
    }

    if (!bestResult) {
      return new Response(
        JSON.stringify({ error: 'Could not geocode the club location' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update the golf course with coordinates
    const { error: updateError } = await supabase
      .from('golf_courses')
      .update({
        latitude: bestResult.latitude,
        longitude: bestResult.longitude,
        updated_at: new Date().toISOString()
      })
      .eq('id', courseId)

    if (updateError) {
      console.error('Error updating golf course:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update club coordinates' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify(bestResult),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in geocode-club function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})