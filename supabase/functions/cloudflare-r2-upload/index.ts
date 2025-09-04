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
  console.log('📤 STEP 1: R2 Upload request received');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ STEP 1.1: Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  console.log('📋 STEP 2: Processing POST request for R2 upload');

  // Fallback function to read account ID from multiple possible env vars
  function readAccountId() {
    return (
      Deno.env.get('CLOUDFLARE_ACCOUNT_ID') ??
      Deno.env.get('CF_ACCOUNT_ID') ??
      Deno.env.get('CLOUDFLARE_ACCOUNT_ID_V2') ?? null
    );
  }

  // Log all available environment variables for debugging
  console.log('🔍 STEP 3: Available Cloudflare env vars:', Object.keys(Deno.env.toObject()).filter(k => k.includes('CLOUDFLARE')));

  try {

    // Get Cloudflare credentials using fallback logic
    console.log('🔧 STEP 4: Checking Cloudflare credentials');
    const cloudflareAccountId = readAccountId();
    let cloudflareR2Token = Deno.env.get('CLOUDFLARE_R2_API_TOKEN');

    // Try alternative names if not found
    if (!cloudflareR2Token) {
      console.log('⚠️ STEP 4.1: Primary R2 token not found, trying fallback');
      cloudflareR2Token = Deno.env.get('CLOUDFLARE_API_TOKEN');
    }

    // Log what we found
    console.log('🔧 STEP 4.2: Credential check results:', {
      hasAccountId: !!cloudflareAccountId,
      hasR2Token: !!cloudflareR2Token,
      accountIdPreview: cloudflareAccountId?.substring(0, 8) + '...',
      allCloudflareVars: Object.keys(Deno.env.toObject()).filter(k => k.includes('CLOUDFLARE'))
    });

    // Early return if account ID not accessible
    if (!cloudflareAccountId) {
      console.error('❌ STEP 4.3: CLOUDFLARE_ACCOUNT_ID not set');
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
      console.error('❌ STEP 4.4: Missing Cloudflare R2 API token');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Cloudflare R2 credentials not configured'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ STEP 4.5: All Cloudflare credentials found');

    // Get the authorization header
    console.log('🔐 STEP 5: Checking authentication');
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ STEP 5.1: No authorization header found');
      throw new Error('No authorization header');
    }
    console.log('✅ STEP 5.1: Authorization header found');

    // Verify the user is authenticated
    console.log('🔐 STEP 5.2: Verifying user authentication with Supabase');
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('❌ STEP 5.3: Authentication failed:', authError?.message);
      throw new Error('Authentication failed');
    }
    console.log('✅ STEP 5.3: User authenticated successfully, user ID:', user.id);

    console.log('📋 STEP 6: Parsing form data');
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;
    const bucketType = formData.get('bucketType') as string;
    
    console.log('📋 STEP 6.1: Form data parsed:', {
      hasFile: !!file,
      fileName: fileName,
      bucketType: bucketType,
      fileSize: file?.size,
      fileType: file?.type
    });
    
    if (!file || !fileName) {
      console.error('❌ STEP 6.2: Missing required parameters:', { hasFile: !!file, hasFileName: !!fileName });
      throw new Error('Missing required parameters: file or fileName');
    }
    console.log('✅ STEP 6.2: All required form data present');

    // Map bucket types to actual Cloudflare R2 bucket name
    // All uploads go to the main media bucket in Cloudflare R2
    const targetBucket = 'clbhouz-media';

    // Generate unique file path with proper organization
    console.log('📁 STEP 7: Generating file path');
    const fileExtension = fileName.split('.').pop();
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const uniqueFileName = `${timestamp}-${randomId}.${fileExtension}`;
    const fullPath = `${user.id}/${bucketType || 'course-media'}/${uniqueFileName}`;

    console.log('📁 STEP 7.1: File path generated:', {
      originalFileName: fileName,
      uniqueFileName: uniqueFileName,
      bucketType: bucketType,
      fileSize: file.size,
      userId: user.id,
      fullPath: fullPath,
      targetBucket: targetBucket
    });

    // Upload to Cloudflare R2
    console.log('🚀 STEP 8: Starting R2 upload');
    const uploadUrl = `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/r2/buckets/${targetBucket}/objects/${fullPath}`;
    console.log('🚀 STEP 8.1: Upload URL constructed:', uploadUrl);
    
    console.log('🚀 STEP 8.2: Making R2 API call');
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${cloudflareR2Token}`,
        'Content-Type': file.type,
        'Content-Length': file.size.toString(),
      },
      body: file,
    });

    console.log('🚀 STEP 8.3: R2 API response received:', {
      status: uploadResponse.status,
      statusText: uploadResponse.statusText,
      ok: uploadResponse.ok
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌ STEP 8.4: R2 upload failed:', {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        error: errorText,
        uploadUrl: uploadUrl
      });
      throw new Error(`Failed to upload to R2: ${uploadResponse.status} ${errorText}`);
    }

    console.log('✅ STEP 8.4: R2 upload successful');

    // Construct the public URL
    console.log('🔗 STEP 9: Generating public URL');
    const publicUrl = `https://media.clbhouz.co.uk/${fullPath}`;

    console.log('✅ STEP 9.1: Upload process completed successfully:', {
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
    console.error('❌ STEP ERROR: Exception caught in R2 upload function:');
    console.error('❌ STEP ERROR.1: Error type:', error.constructor.name);
    console.error('❌ STEP ERROR.2: Error message:', error.message);
    console.error('❌ STEP ERROR.3: Error stack:', error.stack);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false,
      errorType: error.constructor.name
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});