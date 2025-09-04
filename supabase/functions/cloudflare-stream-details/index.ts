import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Fallback function to read account ID from multiple possible env vars
  function readAccountId() {
    return (
      Deno.env.get('CLOUDFLARE_ACCOUNT_ID') ??
      Deno.env.get('CF_ACCOUNT_ID') ??
      Deno.env.get('CLOUDFLARE_ACCOUNT_ID_V2') ?? null
    );
  }

  // Temporary guard to verify secret accessibility
  const _cfId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
  if (!_cfId) {
    return new Response(
      JSON.stringify({ error: 'Missing CLOUDFLARE_ACCOUNT_ID' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
    let apiToken = Deno.env.get('CLOUDFLARE_API_TOKEN') || Deno.env.get('CLOUDFLARE_STREAM_API_TOKEN');

    console.log('🔧 Stream credentials check:', {
      hasAccountId: !!accountId,
      hasApiToken: !!apiToken,
      accountIdPreview: accountId?.substring(0, 8) + '...',
      allCloudflareVars: Object.keys(Deno.env.toObject()).filter(k => k.includes('CLOUDFLARE'))
    });

    // Early return if account ID not accessible
    if (!accountId) {
      console.error('❌ CLOUDFLARE_ACCOUNT_ID not set:', {
        availableEnvVars: Object.keys(Deno.env.toObject()).slice(0, 20)
      });
      
      return new Response(JSON.stringify({ 
        success: false,
        error: 'CLOUDFLARE_ACCOUNT_ID not set'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!apiToken) {
      console.error('❌ Missing Cloudflare Stream credentials:', {
        hasAccountId: !!accountId,
        hasApiToken: !!apiToken,
        availableEnvVars: Object.keys(Deno.env.toObject()).slice(0, 20)
      });
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Cloudflare Stream API credentials not configured' 
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