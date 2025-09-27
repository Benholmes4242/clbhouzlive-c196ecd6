import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { normalizeError } from '../_shared/normalize-error.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CountryFlag {
  code: string;
  name: string;
  url: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting country flags upload to R2...');

    // First, get list of flag files from GitHub API
    const githubApiUrl = 'https://api.github.com/repos/catamphetamine/country-flag-icons/contents/flags/3x2';
    const response = await fetch(githubApiUrl);
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const files = await response.json();
    console.log(`Found ${files.length} flag files`);

    const uploadResults = [];
    let successCount = 0;
    let errorCount = 0;

    // Process flags in batches of 5 to avoid overwhelming R2
    const batchSize = 5;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (file: any) => {
        try {
          if (!file.name.endsWith('.svg')) {
            console.log(`Skipping non-SVG file: ${file.name}`);
            return null;
          }

          const countryCode = file.name.replace('.svg', '').toUpperCase();
          console.log(`Processing flag for country: ${countryCode}`);

          // Download the flag file from GitHub
          const flagResponse = await fetch(file.download_url);
          if (!flagResponse.ok) {
            throw new Error(`Failed to download ${file.name}: ${flagResponse.statusText}`);
          }

          const flagContent = await flagResponse.blob();
          
          // Create form data for R2 upload
          const formData = new FormData();
          formData.append('file', flagContent, `${countryCode}.svg`);
          formData.append('fileName', `${countryCode}.svg`);
          formData.append('bucketType', 'country-flags');

          // Upload to R2 via existing edge function
          const { data, error } = await supabaseClient.functions.invoke('cloudflare-r2-upload', {
            body: formData,
          });

          if (error) {
            console.error(`R2 upload error for ${countryCode}:`, error);
            errorCount++;
            return { countryCode, error: error.message };
          }

          if (data?.success) {
            console.log(`Successfully uploaded flag for ${countryCode}`);
            successCount++;
            
            // Store flag metadata in database
            const { error: dbError } = await supabaseClient
              .from('country_flags')
              .upsert({
                country_code: countryCode,
                flag_url: data.publicUrl,
                file_name: `${countryCode}.svg`,
                created_at: new Date().toISOString()
              });

            if (dbError) {
              console.error(`Database error for ${countryCode}:`, dbError);
            }

            return { 
              countryCode, 
              success: true, 
              url: data.publicUrl 
            };
          } else {
            console.error(`R2 upload failed for ${countryCode}:`, data);
            errorCount++;
            return { countryCode, error: data?.error || 'Upload failed' };
          }

        } catch (error) {
          const err = normalizeError(error);
          console.error(`Error processing ${file.name}:`, err.message);
          errorCount++;
          return { countryCode: file.name, error: err.message };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      uploadResults.push(...batchResults.map(result => 
        result.status === 'fulfilled' ? result.value : { error: result.reason }
      ));

      // Small delay between batches
      if (i + batchSize < files.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`Upload completed. Success: ${successCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Country flags upload completed`,
        statistics: {
          total: files.length,
          successful: successCount,
          failed: errorCount
        },
        results: uploadResults.filter(r => r !== null)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    const err = normalizeError(error);
    console.error('Country flags upload error:', err.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})