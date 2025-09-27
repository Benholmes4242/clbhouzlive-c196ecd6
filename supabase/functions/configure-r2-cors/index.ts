import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.220.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bucketName = 'clbhouz-media' } = await req.json().catch(() => ({}));
    
    const cloudflareAccountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
    const cloudflareApiToken = Deno.env.get('CLOUDFLARE_R2_API_TOKEN');

    if (!cloudflareAccountId || !cloudflareApiToken) {
      throw new Error('Missing Cloudflare credentials');
    }

    console.log(`🔧 Configuring CORS for R2 bucket: ${bucketName}`);

    // CORS policy that allows Lovable preview domains
    const corsPolicy = [
      {
        "AllowedOrigins": [
          "https://*.lovable.dev",
          "https://*.sandbox.lovable.dev", 
          "https://clbhouz.co.uk",
          "https://*.clbhouz.co.uk",
          "https://localhost:*"
        ],
        "AllowedMethods": [
          "GET",
          "HEAD"
        ],
        "AllowedHeaders": [
          "*"
        ],
        "ExposeHeaders": [],
        "MaxAgeSeconds": 3600
      }
    ];

    // Make API call to Cloudflare to set CORS policy
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/r2/buckets/${bucketName}/cors`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${cloudflareApiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(corsPolicy)
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Cloudflare API error:', result);
      throw new Error(`Cloudflare API error: ${result.errors?.[0]?.message || 'Unknown error'}`);
    }

    console.log('✅ CORS policy configured successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      message: `CORS policy configured for bucket: ${bucketName}`,
      corsPolicy: corsPolicy
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error configuring CORS:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});