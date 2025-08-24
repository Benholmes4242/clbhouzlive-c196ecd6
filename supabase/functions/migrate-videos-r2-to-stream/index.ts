import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MigrationProgress {
  totalVideos: number;
  processedVideos: number;
  migratedVideos: number;
  errors: string[];
  streamVideos: { r2Path: string; streamUrl: string; streamId: string }[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const cloudflareAccountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID')!;
    const cloudflareR2Token = Deno.env.get('CLOUDFLARE_R2_API_TOKEN')!;
    const cloudflareStreamToken = Deno.env.get('CLOUDFLARE_STREAM_API_TOKEN')!;

    if (!cloudflareStreamToken) {
      throw new Error('CLOUDFLARE_STREAM_API_TOKEN is required for video migration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const progress: MigrationProgress = {
      totalVideos: 0,
      processedVideos: 0,
      migratedVideos: 0,
      errors: [],
      streamVideos: []
    };

    console.log('🎬 Starting R2 to Stream video migration...');

    // List all objects in R2 bucket to find video files
    // Use a more comprehensive approach to list objects
    let allObjects: any[] = [];
    let cursor: string | undefined;
    
    do {
      const listUrl = `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/r2/buckets/clbhouz-media/objects${cursor ? `?cursor=${cursor}` : '?max-keys=1000'}`;
      
      console.log(`📋 Listing R2 objects with URL: ${listUrl}`);
      
      const listResponse = await fetch(listUrl, {
        headers: {
          'Authorization': `Bearer ${cloudflareR2Token}`,
        },
      });

      if (!listResponse.ok) {
        const errorText = await listResponse.text();
        console.error('❌ R2 list error:', errorText);
        throw new Error(`Failed to list R2 objects: ${listResponse.status} ${errorText}`);
      }

      const listData = await listResponse.json();
      console.log(`📋 Listed ${listData.result?.length || 0} objects, truncated: ${listData.result_info?.truncated}`);
      console.log(`📋 Sample objects:`, listData.result?.slice(0, 3).map((obj: any) => obj.key));
      
      if (listData.result && listData.result.length > 0) {
        allObjects.push(...listData.result);
        cursor = listData.result_info?.truncated ? listData.result_info?.cursor : undefined;
      } else {
        break;
      }
    } while (cursor);

    // Filter for video files (handle nested folders)
    const videoObjects = allObjects.filter((obj: any) => {
      const name = obj.key.toLowerCase();
      const isVideo = name.match(/\.(mov|mp4|avi|mkv|webm|m4v)$/);
      console.log(`🔍 Checking object: ${obj.key}, isVideo: ${!!isVideo}`);
      return isVideo;
    });

    progress.totalVideos = videoObjects.length;
    console.log(`📹 Found ${progress.totalVideos} video files in R2`);

    if (progress.totalVideos === 0) {
      return new Response(JSON.stringify({
        ...progress,
        message: 'No video files found in R2 bucket'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Process each video file
    for (const videoObj of videoObjects) {
      try {
        console.log(`🔄 Processing video: ${videoObj.key}`);
        
        // Download video from R2
        const downloadUrl = `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/r2/buckets/clbhouz-media/objects/${videoObj.key}`;
        
        const downloadResponse = await fetch(downloadUrl, {
          headers: {
            'Authorization': `Bearer ${cloudflareR2Token}`,
          },
        });

        if (!downloadResponse.ok) {
          progress.errors.push(`Failed to download ${videoObj.key} from R2: ${downloadResponse.statusText}`);
          progress.processedVideos++;
          continue;
        }

        const videoBlob = await downloadResponse.blob();
        console.log(`📥 Downloaded ${videoObj.key} (${videoBlob.size} bytes)`);

        // Create form data for Stream upload
        const formData = new FormData();
        formData.append('file', videoBlob);
        
        // Extract filename for metadata
        const fileName = videoObj.key.split('/').pop() || videoObj.key;
        const metadata = {
          name: fileName,
          source: 'migrated-from-r2',
          originalPath: videoObj.key
        };
        formData.append('meta', JSON.stringify(metadata));

        // Upload to Cloudflare Stream
        const streamUploadUrl = `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/stream`;
        
        const streamResponse = await fetch(streamUploadUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${cloudflareStreamToken}`,
          },
          body: formData,
        });

        if (!streamResponse.ok) {
          const errorText = await streamResponse.text();
          progress.errors.push(`Failed to upload ${videoObj.key} to Stream: ${streamResponse.status} ${errorText}`);
          progress.processedVideos++;
          continue;
        }

        const streamResult = await streamResponse.json();
        const streamId = streamResult.result?.uid;
        const streamUrl = `https://customer-${cloudflareAccountId}.cloudflarestream.com/${streamId}/manifest/video.m3u8`;

        if (!streamId) {
          progress.errors.push(`No stream ID returned for ${videoObj.key}`);
          progress.processedVideos++;
          continue;
        }

        console.log(`✅ Uploaded ${videoObj.key} to Stream with ID: ${streamId}`);

        // Update database references
        const oldR2Url = `https://media.clbhouz.co.uk/${videoObj.key}`;
        await updateDatabaseVideoReferences(supabase, oldR2Url, streamUrl);

        // Delete from R2
        const deleteUrl = `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/r2/buckets/clbhouz-media/objects/${videoObj.key}`;
        
        const deleteResponse = await fetch(deleteUrl, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${cloudflareR2Token}`,
          },
        });

        if (!deleteResponse.ok) {
          progress.errors.push(`Failed to delete ${videoObj.key} from R2: ${deleteResponse.statusText}`);
        } else {
          console.log(`🗑️ Deleted ${videoObj.key} from R2`);
        }

        progress.streamVideos.push({
          r2Path: videoObj.key,
          streamUrl,
          streamId
        });

        progress.migratedVideos++;
        progress.processedVideos++;

      } catch (error) {
        progress.errors.push(`Error processing ${videoObj.key}: ${error.message}`);
        progress.processedVideos++;
      }
    }

    console.log(`🎬 Migration complete: ${progress.migratedVideos}/${progress.totalVideos} videos migrated`);

    return new Response(JSON.stringify(progress), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Migration error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      totalVideos: 0,
      processedVideos: 0,
      migratedVideos: 0,
      errors: [error.message]
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function updateDatabaseVideoReferences(supabase: any, oldUrl: string, newStreamUrl: string) {
  try {
    console.log(`🔄 Updating database: ${oldUrl} -> ${newStreamUrl}`);
    
    // Update post media
    const { error: postMediaError } = await supabase
      .from('post_media')
      .update({ media_url: newStreamUrl })
      .eq('media_url', oldUrl);

    if (postMediaError) {
      console.error('Error updating post_media:', postMediaError);
    }

    // Update profile media
    const { error: profileMediaError } = await supabase
      .from('profile_media')
      .update({ media_url: newStreamUrl })
      .eq('media_url', oldUrl);

    if (profileMediaError) {
      console.error('Error updating profile_media:', profileMediaError);
    }

    // Update course review media
    const { error: courseReviewError } = await supabase
      .from('course_review_media')
      .update({ media_url: newStreamUrl })
      .eq('media_url', oldUrl);

    if (courseReviewError) {
      console.error('Error updating course_review_media:', courseReviewError);
    }

    console.log(`✅ Database updated for ${oldUrl}`);

  } catch (error) {
    console.error(`❌ Error updating database for ${oldUrl}:`, error);
  }
}