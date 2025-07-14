import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MigrationProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  status: 'running' | 'completed' | 'error';
  errors: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const r2ApiToken = Deno.env.get('CLOUDFLARE_R2_API_TOKEN');
    const streamApiToken = Deno.env.get('CLOUDFLARE_STREAM_API_TOKEN');
    const accountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');

    if (!r2ApiToken || !streamApiToken || !accountId) {
      return new Response(
        JSON.stringify({ error: 'Missing Cloudflare credentials' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { batchSize = 10, resumeFrom = 0 } = await req.json();
    
    console.log(`Starting media migration (batch size: ${batchSize}, resume from: ${resumeFrom})`);

    // Get all media that needs migration
    const mediaSources = [
      { table: 'post_media', bucket: 'post-media', urlColumn: 'media_url', typeColumn: 'media_type' },
      { table: 'course_review_media', bucket: 'course-review-media', urlColumn: 'media_url', typeColumn: 'media_type' },
      { table: 'user_profiles', bucket: 'avatars', urlColumn: 'profile_photo_url', typeColumn: null },
      { table: 'user_profiles', bucket: 'avatars', urlColumn: 'cover_photo_url', typeColumn: null },
      { table: 'logos', bucket: 'logos', urlColumn: 'file_url', typeColumn: 'mime_type' }
    ];

    const progress: MigrationProgress = {
      total: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      status: 'running',
      errors: []
    };

    // Count total items
    for (const source of mediaSources) {
      const { count } = await supabase
        .from(source.table)
        .select('*', { count: 'exact', head: true })
        .not(source.urlColumn, 'is', null)
        .like(source.urlColumn, `${supabaseUrl}/storage/v1/object/public/${source.bucket}/%`);
      
      progress.total += count || 0;
    }

    console.log(`Total items to migrate: ${progress.total}`);

    // Process each source
    for (const source of mediaSources) {
      console.log(`Processing ${source.table} from ${source.bucket} bucket`);
      
      // Get records in batches
      let offset = resumeFrom;
      let hasMore = true;

      while (hasMore) {
        const { data: records, error } = await supabase
          .from(source.table)
          .select('*')
          .not(source.urlColumn, 'is', null)
          .like(source.urlColumn, `${supabaseUrl}/storage/v1/object/public/${source.bucket}/%`)
          .range(offset, offset + batchSize - 1);

        if (error) {
          console.error(`Error fetching ${source.table}:`, error);
          progress.errors.push(`Failed to fetch ${source.table}: ${error.message}`);
          break;
        }

        if (!records || records.length === 0) {
          hasMore = false;
          break;
        }

        // Process each record
        for (const record of records) {
          try {
            const oldUrl = record[source.urlColumn];
            const isVideo = source.typeColumn && record[source.typeColumn]?.startsWith('video/');
            const isImage = !isVideo;

            // Extract file path from URL
            const urlParts = oldUrl.split(`/storage/v1/object/public/${source.bucket}/`);
            if (urlParts.length !== 2) {
              throw new Error(`Invalid URL format: ${oldUrl}`);
            }
            const filePath = urlParts[1];

            // Download from Supabase Storage
            const { data: fileData, error: downloadError } = await supabase.storage
              .from(source.bucket)
              .download(filePath);

            if (downloadError) {
              throw new Error(`Download failed: ${downloadError.message}`);
            }

            let newUrl = '';

            if (isVideo) {
              // Upload to Cloudflare Stream
              console.log(`Uploading video to Stream: ${filePath}`);
              
              const formData = new FormData();
              formData.append('file', fileData, filePath);

              const streamResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/stream`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${streamApiToken}`,
                },
                body: formData,
              });

              if (!streamResponse.ok) {
                throw new Error(`Stream upload failed: ${streamResponse.status}`);
              }

              const streamResult = await streamResponse.json();
              if (streamResult.success) {
                newUrl = `https://videodelivery.net/${streamResult.result.uid}/manifest/video.m3u8`;
              } else {
                throw new Error(`Stream upload failed: ${streamResult.errors?.[0]?.message}`);
              }
            } else {
              // Upload to R2 - first ensure bucket exists
              console.log(`Uploading image to R2: ${filePath}`);
              
              // Try to ensure bucket exists - simplified approach
              console.log('Ensuring R2 bucket exists: clbhouz-media');
              
              try {
                const bucketListUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets`;
                const listResponse = await fetch(bucketListUrl, {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${r2ApiToken}`,
                  },
                });

                if (listResponse.ok) {
                  const buckets = await listResponse.json();
                  console.log('Bucket list response:', JSON.stringify(buckets, null, 2));
                  
                  // Handle different possible response structures
                  let bucketExists = false;
                  if (buckets.success && Array.isArray(buckets.result)) {
                    bucketExists = buckets.result.some((b: any) => b.name === 'clbhouz-media');
                  } else if (Array.isArray(buckets.result?.buckets)) {
                    bucketExists = buckets.result.buckets.some((b: any) => b.name === 'clbhouz-media');
                  }
                  
                  if (!bucketExists) {
                    console.log('Creating R2 bucket: clbhouz-media');
                    const createResponse = await fetch(bucketListUrl, {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${r2ApiToken}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ name: 'clbhouz-media' }),
                    });
                    
                    if (!createResponse.ok) {
                      const error = await createResponse.text();
                      console.error('Failed to create R2 bucket:', error);
                      // Don't throw error, just log and continue - bucket might exist
                      console.log('Continuing with upload attempt...');
                    } else {
                      console.log('Successfully created R2 bucket');
                    }
                  }
                } else {
                  console.error('Failed to list buckets:', listResponse.status, await listResponse.text());
                  console.log('Continuing with upload attempt anyway...');
                }
              } catch (bucketError) {
                console.error('Error checking/creating bucket:', bucketError);
                console.log('Continuing with upload attempt anyway...');
              }
              
              // Upload to R2 using the correct API
              const bucketName = 'clbhouz-media';
              
              // Use the Cloudflare API v4 endpoint for R2 uploads with correct content headers
              const r2Response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects/${encodeURIComponent(filePath)}`, {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${r2ApiToken}`,
                  'Content-Type': fileData.type || 'application/octet-stream',
                  'Content-Length': fileData.size.toString(),
                },
                body: fileData,
              });

              if (!r2Response.ok) {
                const errorText = await r2Response.text();
                console.error(`R2 upload failed for ${filePath}:`, {
                  status: r2Response.status,
                  statusText: r2Response.statusText,
                  error: errorText,
                  url: `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects/${filePath}`,
                  accountId,
                  hasToken: !!r2ApiToken
                });
                throw new Error(`R2 upload failed: ${r2Response.status} - ${errorText}`);
              }

              newUrl = `https://media.clbhouz.co.uk/${filePath}`;
            }

            // Update database with new URL
            const { error: updateError } = await supabase
              .from(source.table)
              .update({ [source.urlColumn]: newUrl })
              .eq('id', record.id);

            if (updateError) {
              throw new Error(`Database update failed: ${updateError.message}`);
            }

            progress.successful++;
            console.log(`✅ Migrated ${filePath} → ${newUrl}`);

          } catch (error) {
            progress.failed++;
            const errorMsg = `Failed to migrate ${record[source.urlColumn]}: ${error.message}`;
            console.error(errorMsg);
            progress.errors.push(errorMsg);
          }

          progress.processed++;
        }

        offset += batchSize;
        console.log(`Progress: ${progress.processed}/${progress.total} (${Math.round(progress.processed/progress.total*100)}%)`);
      }
    }

    progress.status = progress.failed === 0 ? 'completed' : (progress.successful === 0 ? 'error' : 'completed');

    console.log('Migration completed:', progress);

    return new Response(
      JSON.stringify(progress),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Migration error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Migration failed', 
        details: error.message,
        status: 'error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});