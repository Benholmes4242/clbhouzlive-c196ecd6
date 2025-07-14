import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('R2 upload request started');

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;
    const bucketName = formData.get('bucketName') as string;

    if (!file || !fileName || !bucketName) {
      console.error('Missing required parameters', { file: !!file, fileName, bucketName });
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const apiToken = Deno.env.get('CLOUDFLARE_R2_API_TOKEN');
    const accountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
    
    if (!apiToken || !accountId) {
      console.error('Missing Cloudflare credentials', { apiToken: !!apiToken, accountId: !!accountId });
      return new Response(
        JSON.stringify({ error: 'Cloudflare credentials not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Uploading to R2:', { fileName, bucketName, fileSize: file.size });

    // First, ensure the bucket exists
    const bucketListUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets`;
    const listResponse = await fetch(bucketListUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
      },
    });

    if (listResponse.ok) {
      const buckets = await listResponse.json();
      const bucketExists = buckets.result?.some((b: any) => b.name === bucketName);
      
      if (!bucketExists) {
        console.log(`Creating R2 bucket: ${bucketName}`);
        const createResponse = await fetch(bucketListUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: bucketName }),
        });
        
        if (!createResponse.ok) {
          const error = await createResponse.text();
          console.error('Failed to create bucket:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to create R2 bucket', details: error }),
            { status: createResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        console.log(`Successfully created bucket: ${bucketName}`);
      }
    }

    // Upload to Cloudflare R2 using the correct API endpoint
    const r2Url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects/${fileName}`;
    
    const uploadResponse = await fetch(r2Url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': file.type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('R2 upload failed:', uploadResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'R2 upload failed', details: errorText }),
        { 
          status: uploadResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('R2 upload successful');

    // Return the R2 public URL (using custom domain if provided)
    const customDomain = 'https://media.clbhouz.co.uk';
    const publicUrl = `${customDomain}/${fileName}`;

    return new Response(
      JSON.stringify({ 
        success: true, 
        url: publicUrl,
        fileName: fileName
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('R2 upload error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});