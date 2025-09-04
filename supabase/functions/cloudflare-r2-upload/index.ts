import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('🔍 Starting cloudflare-r2-upload function');

// Runtime verification logging
console.log('🔧 RUNTIME CHECK - CLOUDFLARE_ACCOUNT_ID accessible:', Boolean(Deno.env.get('CLOUDFLARE_ACCOUNT_ID')));
console.log('🔧 RUNTIME CHECK - Available fallback tokens:', {
  hasR2Token: Boolean(Deno.env.get('CLOUDFLARE_R2_API_TOKEN')),
  hasApiToken: Boolean(Deno.env.get('CLOUDFLARE_API_TOKEN')),
  hasStreamToken: Boolean(Deno.env.get('CLOUDFLARE_STREAM_API_TOKEN'))
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
      Deno.env.get('CLOUDFLARE_ACCOUNT_ID_V2') ?? null
    );
  }

  // Log all available environment variables for debugging
  console.log('🔍 Available env vars:', Object.keys(Deno.env.toObject()).filter(k => k.includes('CLOUDFLARE')));

  try {
    console.log('🔄 Processing R2 upload request');

    // Get Cloudflare credentials using fallback logic
    const cloudflareAccountId = readAccountId();
    let cloudflareR2Token = Deno.env.get('CLOUDFLARE_R2_API_TOKEN');

    // Try alternative names if not found
    if (!cloudflareR2Token) {
      cloudflareR2Token = Deno.env.get('CLOUDFLARE_API_TOKEN');
    }

    // Log what we found
    console.log('🔧 Credential check:', {
      hasAccountId: !!cloudflareAccountId,
      hasR2Token: !!cloudflareR2Token,
      accountIdPreview: cloudflareAccountId?.substring(0, 8) + '...',
      allCloudflareVars: Object.keys(Deno.env.toObject()).filter(k => k.includes('CLOUDFLARE'))
    });

    // Early return if account ID not accessible
    if (!cloudflareAccountId) {
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

    // Check if credentials are available
    if (!cloudflareR2Token) {
      console.error('❌ Missing Cloudflare credentials:', { 
        hasAccountId: !!cloudflareAccountId,
        hasR2Token: !!cloudflareR2Token,
        allEnvVars: Object.keys(Deno.env.toObject()).slice(0, 20) // First 20 env vars
      });
      
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Cloudflare R2 credentials not configured'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the user is authenticated
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;
    const bucketType = formData.get('bucketType') as string;
    
    if (!file || !fileName) {
      throw new Error('Missing required parameters: file or fileName');
    }

    // Map bucket types to actual Cloudflare R2 bucket name
    // All uploads go to the main media bucket in Cloudflare R2
    const targetBucket = 'clbhouz-media';

    // Generate unique file path with proper organization
    const fileExtension = fileName.split('.').pop();
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const uniqueFileName = `${timestamp}-${randomId}.${fileExtension}`;
    const fullPath = `${user.id}/${bucketType || 'course-media'}/${uniqueFileName}`;

    console.log('📤 Uploading to R2:', {
      fileName: uniqueFileName,
      bucketType,
      fileSize: file.size,
      userId: user.id,
      fullPath
    });

    // Upload to Cloudflare R2
    const uploadUrl = `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/r2/buckets/${targetBucket}/objects/${fullPath}`;
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${cloudflareR2Token}`,
        'Content-Type': file.type,
        'Content-Length': file.size.toString(),
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌ R2 upload failed:', {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        error: errorText
      });
      throw new Error(`Failed to upload to R2: ${uploadResponse.status} ${errorText}`);
    }

    // Construct the public URL
    const publicUrl = `https://media.clbhouz.co.uk/${fullPath}`;

    console.log('✅ File uploaded successfully:', {
      publicUrl,
      fileName: uniqueFileName,
      bucketType,
      fullPath
    });

    return new Response(JSON.stringify({
      success: true,
      publicUrl,
      fileName: uniqueFileName,
      fullPath
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in cloudflare-r2-upload function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});