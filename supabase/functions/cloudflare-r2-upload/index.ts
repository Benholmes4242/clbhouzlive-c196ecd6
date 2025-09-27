import { serve } from "https://deno.land/std@0.220.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { S3Client, PutObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.400.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE'
};

console.log('🔍 Starting cloudflare-r2-upload function');

// Comprehensive runtime verification logging
const env = (k: string) => (Deno.env.get(k) ? '✓' : '✗');
console.log('🔧 RUNTIME CHECK', {
  CLOUDFLARE_ACCOUNT_ID: env('CLOUDFLARE_ACCOUNT_ID'),
  R2_ACCESS_KEY_ID: env('R2_ACCESS_KEY_ID'),
  R2_SECRET_ACCESS_KEY: env('R2_SECRET_ACCESS_KEY'),
  R2_BUCKET: env('R2_BUCKET'),
  R2_PUBLIC_BASE_URL: env('R2_PUBLIC_BASE_URL'),
  CLOUDFLARE_R2_API_TOKEN: env('CLOUDFLARE_R2_API_TOKEN'),
  CLOUDFLARE_API_TOKEN: env('CLOUDFLARE_API_TOKEN'),
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

  // Ping endpoint for testing
  if (req.method === 'GET') {
    console.log('🏓 PING: Health check endpoint hit');
    return new Response(JSON.stringify({ ok: true, service: 'cloudflare-r2-upload' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
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

    // Get R2 credentials (S3-compatible)
    console.log('🔧 STEP 4: Checking R2 credentials');
    const r2AccountId = readAccountId();
    const r2AccessKeyId = Deno.env.get('R2_ACCESS_KEY_ID');
    const r2SecretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY');
    const r2Bucket = Deno.env.get('R2_BUCKET') || 'clbhouz-media';
    const r2PublicBaseUrl = Deno.env.get('R2_PUBLIC_BASE_URL') || 'https://media.clbhouz.co.uk';

    console.log('🔧 STEP 4.2: R2 credential check results:', {
      hasAccountId: !!r2AccountId,
      hasAccessKeyId: !!r2AccessKeyId,
      hasSecretAccessKey: !!r2SecretAccessKey,
      hasBucket: !!r2Bucket,
      hasPublicBaseUrl: !!r2PublicBaseUrl,
      accountIdPreview: r2AccountId?.substring(0, 8) + '...',
      bucket: r2Bucket,
      publicBaseUrl: r2PublicBaseUrl
    });

    // Check for required R2 credentials
    if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey) {
      console.error('❌ STEP 4.3: Missing required R2 credentials');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'R2 credentials not configured. Need R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and CLOUDFLARE_ACCOUNT_ID'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ STEP 4.4: All R2 credentials found');

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
      targetBucket: r2Bucket
    });

    // Create S3-compatible client for R2
    console.log('🚀 STEP 8: Creating S3-compatible R2 client');
    const s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: r2AccessKeyId,
        secretAccessKey: r2SecretAccessKey,
      },
    });
    console.log('✅ STEP 8.1: S3 client created successfully');

    // Get file content as array buffer
    console.log('🚀 STEP 8.2: Preparing file content');
    const fileContent = await file.arrayBuffer();
    console.log('✅ STEP 8.3: File content prepared, size:', fileContent.byteLength);

    // Upload to R2 using S3 API
    console.log('🚀 STEP 8.4: Starting R2 upload via S3 API');
    const putCommand = new PutObjectCommand({
      Bucket: r2Bucket,
      Key: fullPath,
      Body: new Uint8Array(fileContent),
      ContentType: file.type || 'application/octet-stream',
    });

    const uploadResult = await s3Client.send(putCommand);
    console.log('✅ STEP 8.5: R2 upload successful:', uploadResult);

    // Construct the public URL
    console.log('🔗 STEP 9: Generating public URL');
    const publicUrl = `${r2PublicBaseUrl}/${fullPath}`;

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
    console.error('❌ STEP ERROR.1: Error type:', (error as Error).constructor.name);
    console.error('❌ STEP ERROR.2: Error message:', (error as Error).message);
    console.error('❌ STEP ERROR.3: Error stack:', (error as Error).stack);
    
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