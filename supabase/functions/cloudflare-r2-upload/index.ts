import { serve } from "https://deno.land/std@0.220.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE'
};

console.log('🔍 Starting cloudflare-r2-upload function');

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  console.log('📤 R2 Upload request received');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  // Health check endpoint
  if (req.method === 'GET') {
    console.log('🏓 Health check endpoint hit');
    return new Response(JSON.stringify({ ok: true, service: 'cloudflare-r2-upload' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  console.log('📋 Processing POST request for R2 upload');

  try {
    // Get R2 credentials
    console.log('🔧 Checking R2 credentials');
    const r2AccountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
    const r2ApiToken = Deno.env.get('CLOUDFLARE_API_TOKEN') || Deno.env.get('CLOUDFLARE_R2_API_TOKEN');
    const r2Bucket = Deno.env.get('R2_BUCKET') || 'clbhouz-media';
    const r2PublicBaseUrl = Deno.env.get('R2_PUBLIC_BASE_URL') || 'https://media.clbhouz.co.uk';

    console.log('🔧 R2 credential check results:', {
      hasAccountId: !!r2AccountId,
      hasApiToken: !!r2ApiToken,
      bucket: r2Bucket,
      publicBaseUrl: r2PublicBaseUrl
    });

    if (!r2AccountId || !r2ApiToken) {
      console.error('❌ Missing required R2 credentials');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'R2 credentials not configured. Need CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the authorization header
    console.log('🔐 Checking authentication');
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ No authorization header found');
      throw new Error('No authorization header');
    }

    // Verify the user is authenticated
    console.log('🔐 Verifying user authentication with Supabase');
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError?.message);
      throw new Error('Authentication failed');
    }
    console.log('✅ User authenticated successfully, user ID:', user.id);

    console.log('📋 Parsing form data');
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;
    const bucketType = formData.get('bucketType') as string;
    
    console.log('📋 Form data parsed:', {
      hasFile: !!file,
      fileName: fileName,
      bucketType: bucketType,
      fileSize: file?.size,
      fileType: file?.type
    });
    
    if (!file || !fileName) {
      console.error('❌ Missing required parameters:', { hasFile: !!file, hasFileName: !!fileName });
      throw new Error('Missing required parameters: file or fileName');
    }

    // Generate unique file path
    console.log('📁 Generating file path');
    const fileExtension = fileName.split('.').pop();
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const uniqueFileName = `${timestamp}-${randomId}.${fileExtension}`;
    const fullPath = `${user.id}/${bucketType || 'course-media'}/${uniqueFileName}`;

    console.log('📁 File path generated:', {
      originalFileName: fileName,
      uniqueFileName: uniqueFileName,
      bucketType: bucketType,
      fileSize: file.size,
      userId: user.id,
      fullPath: fullPath,
      targetBucket: r2Bucket
    });

    // Get file content as array buffer
    console.log('🚀 Preparing file content');
    const fileContent = await file.arrayBuffer();
    console.log('✅ File content prepared, size:', fileContent.byteLength);

    // Upload to R2 using Cloudflare API
    console.log('🚀 Starting R2 upload via Cloudflare API');
    const uploadUrl = `https://api.cloudflare.com/client/v4/accounts/${r2AccountId}/r2/buckets/${r2Bucket}/objects/${encodeURIComponent(fullPath)}`;
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${r2ApiToken}`,
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: fileContent,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('❌ R2 upload failed:', errorText);
      throw new Error(`R2 upload failed: ${uploadResponse.status} - ${errorText}`);
    }
    
    console.log('✅ R2 upload successful');

    // Construct the public URL
    console.log('🔗 Generating public URL');
    const publicUrl = `${r2PublicBaseUrl}/${fullPath}`;

    console.log('✅ Upload process completed successfully:', {
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
    console.error('❌ Exception caught in R2 upload function:', (error as Error).message);
    console.error('❌ Error stack:', (error as Error).stack);
    
    return new Response(JSON.stringify({ 
      error: (error as Error).message,
      success: false,
      errorType: (error as Error).constructor.name
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});