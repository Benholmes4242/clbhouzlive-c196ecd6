import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MigrationProgress {
  totalFiles: number;
  processedFiles: number;
  migratedFiles: number;
  errors: string[];
  bucketResults: Record<string, any>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const cloudflareAccountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID')!;
    const cloudflareApiToken = Deno.env.get('CLOUDFLARE_R2_API_TOKEN')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const progress: MigrationProgress = {
      totalFiles: 0,
      processedFiles: 0,
      migratedFiles: 0,
      errors: [],
      bucketResults: {}
    };

    // Define Supabase storage buckets to migrate
    const storageBuckets = [
      'avatars',
      'logos', 
      'profile-backgrounds',
      'profile-images',
      'profile-media',
      'post-media',
      'course-media',
      'course-images',
      'course-review-media'
    ];

    // Create R2 bucket if it doesn't exist
    const createR2Bucket = async (bucketName: string) => {
      try {
        const response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/r2/buckets`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${cloudflareApiToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: bucketName }),
          }
        );

        if (!response.ok && response.status !== 409) { // 409 means bucket already exists
          throw new Error(`Failed to create R2 bucket: ${response.statusText}`);
        }

        return true;
      } catch (error) {
        console.error(`Error creating R2 bucket ${bucketName}:`, error);
        return false;
      }
    };

    // Ensure main R2 bucket exists
    await createR2Bucket('clbhouz-media');

    // Process each Supabase storage bucket
    for (const bucket of storageBuckets) {
      try {
        console.log(`Processing bucket: ${bucket}`);
        
        // List all files in the bucket (including subdirectories)
        const { data: files, error: listError } = await supabase.storage
          .from(bucket)
          .list('', { 
            limit: 1000, 
            sortBy: { column: 'name', order: 'asc' },
            search: ''
          });

        if (listError) {
          progress.errors.push(`Error listing files in ${bucket}: ${listError.message}`);
          continue;
        }

        if (!files || files.length === 0) {
          console.log(`No files found in bucket: ${bucket}`);
          continue;
        }

        progress.totalFiles += files.length;
        const bucketResult = {
          totalFiles: files.length,
          migratedFiles: 0,
          errors: []
        };

        // Process files in batches
        for (const file of files) {
          try {
            // Download file from Supabase
            const { data: fileData, error: downloadError } = await supabase.storage
              .from(bucket)
              .download(file.name);

            if (downloadError) {
              const errorDetails = downloadError.message || JSON.stringify(downloadError) || 'Unknown download error';
              bucketResult.errors.push(`Download error for ${file.name}: ${errorDetails}`);
              console.error(`Failed to download ${file.name} from ${bucket}:`, downloadError);
              progress.processedFiles++;
              continue;
            }

            // Check if file actually has content
            if (!fileData || fileData.size === 0) {
              bucketResult.errors.push(`Empty file or no data for ${file.name}`);
              progress.processedFiles++;
              continue;
            }

            // Upload to Cloudflare R2 directly
            const uploadUrl = `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/r2/buckets/clbhouz-media/objects/${bucket}/${file.name}`;
            
            const uploadResponse = await fetch(uploadUrl, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${cloudflareApiToken}`,
                'Content-Type': fileData.type || 'application/octet-stream',
              },
              body: fileData,
            });

            if (!uploadResponse.ok) {
              const errorText = await uploadResponse.text();
              bucketResult.errors.push(`R2 upload error for ${file.name}: ${uploadResponse.status} ${errorText}`);
              progress.processedFiles++;
              continue;
            }

            const publicUrl = `https://media.clbhouz.co.uk/${bucket}/${file.name}`;

            console.log(`Successfully migrated ${file.name} from ${bucket} to R2`);
            bucketResult.migratedFiles++;
            progress.migratedFiles++;
            progress.processedFiles++;

            // Update database references (for specific known tables)
            await updateDatabaseReferences(supabase, bucket, file.name, publicUrl);

          } catch (error) {
            bucketResult.errors.push(`Error processing ${file.name}: ${error.message}`);
            progress.processedFiles++;
          }
        }

        progress.bucketResults[bucket] = bucketResult;
        console.log(`Completed bucket ${bucket}: ${bucketResult.migratedFiles}/${bucketResult.totalFiles} files migrated`);

      } catch (error) {
        progress.errors.push(`Error processing bucket ${bucket}: ${error.message}`);
      }
    }

    return new Response(JSON.stringify(progress), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Migration error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      totalFiles: 0,
      processedFiles: 0,
      migratedFiles: 0,
      errors: [error.message]
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function updateDatabaseReferences(supabase: any, bucket: string, fileName: string, newUrl: string) {
  try {
    const oldUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/${bucket}/${fileName}`;
    
    // Update user profiles
    if (bucket === 'avatars' || bucket === 'profile-images') {
      await supabase
        .from('user_profiles')
        .update({ profile_photo_url: newUrl })
        .eq('profile_photo_url', oldUrl);
      
      await supabase
        .from('user_profiles')
        .update({ header_photo_url: newUrl })
        .eq('header_photo_url', oldUrl);
    }

    // Update profile backgrounds
    if (bucket === 'profile-backgrounds') {
      await supabase
        .from('user_profiles')
        .update({ cover_photo_url: newUrl })
        .eq('cover_photo_url', oldUrl);
    }

    // Update logos
    if (bucket === 'logos') {
      await supabase
        .from('user_profiles')
        .update({ logo_url: newUrl })
        .eq('logo_url', oldUrl);
    }

    // Update profile media
    if (bucket === 'profile-media') {
      await supabase
        .from('profile_media')
        .update({ media_url: newUrl })
        .eq('media_url', oldUrl);
    }

    // Update post media
    if (bucket === 'post-media') {
      await supabase
        .from('post_media')
        .update({ media_url: newUrl })
        .eq('media_url', oldUrl);
    }

    // Update course media
    if (bucket === 'course-media' || bucket === 'course-images') {
      await supabase
        .from('golf_courses')
        .update({ thumbnail_image: newUrl })
        .eq('thumbnail_image', oldUrl);
    }

    // Update course review media
    if (bucket === 'course-review-media') {
      await supabase
        .from('course_review_media')
        .update({ media_url: newUrl })
        .eq('media_url', oldUrl);
    }

  } catch (error) {
    console.error(`Error updating database references for ${fileName}:`, error);
  }
}