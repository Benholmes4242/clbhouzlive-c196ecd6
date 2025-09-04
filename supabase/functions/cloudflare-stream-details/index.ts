import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

console.log('🔧 CLOUDFLARE-STREAM-DETAILS STARTUP - Environment check:', {
  hasAccountId: Boolean(Deno.env.get('CLOUDFLARE_ACCOUNT_ID')),
  hasR2Token: Boolean(Deno.env.get('CLOUDFLARE_R2_API_TOKEN')),
  hasApiToken: Boolean(Deno.env.get('CLOUDFLARE_API_TOKEN')),
  hasStreamToken: Boolean(Deno.env.get('CLOUDFLARE_STREAM_API_TOKEN'))
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Fallback function to read account ID from multiple possible env vars
  function readAccountId() {
    return (
      Deno.env.get('CLOUDFLARE_ACCOUNT_ID') ??
      Deno.env.get('CF_ACCOUNT_ID') ??
      Deno.env.get('CLOUDFLARE_ACCOUNT_ID_V2') ?? 
      'ybxkehyomcakqjvuhnna' // Fallback to project ID
    );
  }

  try {
    console.log('🔄 Processing stream details request');
    
    const { videoId } = await req.json()
    
    if (!videoId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Video ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get Cloudflare API credentials using fallback logic
    const accountId = readAccountId();
    let apiToken = Deno.env.get('CLOUDFLARE_STREAM_API_TOKEN') || Deno.env.get('CLOUDFLARE_API_TOKEN');

    console.log('🔧 Stream details credentials check:', {
      hasAccountId: !!accountId,
      hasApiToken: !!apiToken,
      accountIdValue: accountId,
      tokenPreview: apiToken ? apiToken.substring(0, 8) + '...' : 'null'
    });

    if (!apiToken) {
      console.error('❌ Missing Cloudflare Stream API token');
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Cloudflare Stream API token not configured' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Fetch video details from Cloudflare Stream API
    const cloudflareResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${videoId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const cloudflareData = await cloudflareResponse.json()

    if (!cloudflareResponse.ok) {
      console.error('Cloudflare API error:', cloudflareData)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: cloudflareData.errors?.[0]?.message || 'Failed to fetch video details'
        }),
        { 
          status: cloudflareResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify(cloudflareData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in cloudflare-stream-details function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})