import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { normalizeError } from '../_shared/normalize-error.ts';

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
    console.log(`🔧 Account ID: ${cloudflareAccountId}`);
    console.log(`🎥 Stream Token present: ${!!cloudflareStreamToken}`);

    // Known video files from your R2 bucket
    const knownVideoFiles = [
      'compilation-6a5bcbb9-c22c-4655-ad8e-088b2858ca3e-1754346035959.mp4',
      'temp-compilation-1754346018561-0.mov',
      'temp-compilation-1754346022372-1.mov',
      'temp-compilation-1754346026582-2.mov',
      'temp-compilation-1754427492632-0.mov',
      'temp-compilation-1754427510403-1.mov',
      'temp-compilation-1754427517604-2.mov',
      'temp-compilation-1754428340070-0.mov',
      'temp-compilation-1754428343857-1.mov',
      'temp-compilation-1754428346822-2.mov',
      'temp-compilation-1754428361227-0.mov',
      'temp-compilation-1754428365049-1.mov',
      'temp-compilation-1754428367916-2.mov',
      'temp-compilation-1754430245175-0.mov',
      'temp-compilation-1754430249420-1.mov',
      'temp-compilation-1754430252186-2.mov',
      'temp-compilation-1754430276388-0.mov',
      'temp-compilation-1754430280241-1.mov',
      'temp-compilation-1754430283212-2.mov',
      'temp-compilation-1754430341461-0.mov',
      'temp-compilation-1754430345058-1.mov',
      'temp-compilation-1754430348024-2.mov',
      'temp-compilation-1754430654770-0.mov',
      'temp-compilation-1754430658240-1.mov',
      'temp-compilation-1754430661053-2.mov',
      'temp-compilation-1754456276151-0.MOV',
      'temp-compilation-1754456280153-1.MOV',
      'temp-compilation-1754456284372-2.MOV',
      'temp-compilation-1754456477031-0.MOV',
      'temp-compilation-1754456480419-1.MOV',
      'temp-compilation-1754456482251-2.MOV',
      'temp-compilation-1754456701520-0.MOV',
      'temp-compilation-1754456705100-1.MOV',
      'temp-compilation-1754456707342-2.MOV',
      'temp-compilation-1754456986288-0.MOV',
      'temp-compilation-1754456989656-1.MOV',
      'temp-compilation-1754457240377-0.MOV',
      'temp-compilation-1754457243551-1.MOV',
      'temp-compilation-1754457687547-0.MOV',
      'temp-compilation-1754457690679-1.MOV',
      'temp-compilation-1754457830808-0.MOV',
      'temp-compilation-1754457834127-1.MOV',
      'temp-compilation-1754458020895-0.MOV',
      'temp-compilation-1754458023780-1.MOV'
    ];

    // Convert to full URLs and video objects
    const allObjects = knownVideoFiles.map(filename => ({
      key: `post-media/${filename}`,
      url: `https://media.clbhouz.co.uk/post-media/${filename}`,
      filename: filename
    }));

    console.log(`📊 Total known videos to migrate: ${allObjects.length}`);

    // All objects are already videos from our known list
    const videoObjects = allObjects;

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
        
        // Download video from R2 using public URL
        const downloadUrl = videoObj.url;
        
        const downloadResponse = await fetch(downloadUrl);

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
        const fileName = videoObj.filename;
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

        console.log(`✅ Uploaded ${videoObj.filename} to Stream with ID: ${streamId}`);

        // Update database references
        await updateDatabaseVideoReferences(supabase, videoObj.url, streamUrl);

        console.log(`📝 Note: Please manually delete ${videoObj.filename} from R2 after migration completes`);

        progress.streamVideos.push({
          r2Path: videoObj.key,
          streamUrl,
          streamId
        });

        progress.migratedVideos++;
        progress.processedVideos++;

      } catch (error) {
        const err = normalizeError(error);
        progress.errors.push(`Error processing ${videoObj.key}: ${err.message}`);
        progress.processedVideos++;
      }
    }

    console.log(`🎬 Migration complete: ${progress.migratedVideos}/${progress.totalVideos} videos migrated`);

    return new Response(JSON.stringify(progress), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = normalizeError(error);
    console.error('❌ Migration error:', err.message);
    return new Response(JSON.stringify({ 
      error: err.message,
      totalVideos: 0,
      processedVideos: 0,
      migratedVideos: 0,
      errors: [err.message]
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