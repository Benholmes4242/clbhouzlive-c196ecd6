import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MigrationProgress {
  totalVideos: number;
  processedVideos: number;
  migratedVideos: number;
  errors: string[];
  streamVideos: { supabasePath: string; streamUrl: string; streamId: string }[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const cloudflareAccountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
    const cloudflareStreamToken = Deno.env.get('CLOUDFLARE_STREAM_API_TOKEN');

    if (!cloudflareAccountId || !cloudflareStreamToken) {
      throw new Error('CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_STREAM_API_TOKEN are required for video migration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const progress: MigrationProgress = {
      totalVideos: 0,
      processedVideos: 0,
      migratedVideos: 0,
      errors: [],
      streamVideos: []
    };

    console.log('🎬 Starting Supabase Storage to Stream video migration...');
    console.log(`🔧 Account ID: ${cloudflareAccountId}`);
    console.log(`🎥 Stream Token present: ${!!cloudflareStreamToken}`);

    // Get all videos from Supabase storage in post_media table
    const { data: videos, error: videosError } = await supabase
      .from('post_media')
      .select('*')
      .eq('media_type', 'video')
      .like('media_url', '%supabase.co/storage%');

    if (videosError) {
      throw new Error(`Failed to fetch videos from database: ${videosError.message}`);
    }

    if (!videos || videos.length === 0) {
      console.log('🎬 No Supabase storage videos found to migrate');
      return new Response(JSON.stringify(progress), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    progress.totalVideos = videos.length;
    console.log(`📹 Found ${videos.length} videos in Supabase storage to migrate`);

    for (const video of videos) {
      try {
        console.log(`🔄 Processing video: ${video.media_url}`);

        // Extract file path from Supabase storage URL
        const urlParts = video.media_url.split('/storage/v1/object/public/');
        if (urlParts.length !== 2) {
          throw new Error('Invalid Supabase storage URL format');
        }
        const filePath = urlParts[1];

        // Download video from Supabase storage
        const { data: videoBlob, error: downloadError } = await supabase.storage
          .from('post-media')
          .download(filePath.replace('post-media/', ''));

        if (downloadError || !videoBlob) {
          throw new Error(`Failed to download video: ${downloadError?.message || 'Unknown error'}`);
        }

        // Upload to Cloudflare Stream
        const formData = new FormData();
        formData.append('file', videoBlob, video.id + '.mp4');

        const uploadResponse = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/stream`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${cloudflareStreamToken}`,
            },
            body: formData,
          }
        );

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          throw new Error(`Cloudflare Stream upload failed: ${uploadResponse.status} ${errorText}`);
        }

        const streamResult = await uploadResponse.json();
        
        if (!streamResult.success) {
          throw new Error(`Cloudflare Stream API error: ${JSON.stringify(streamResult.errors)}`);
        }

        const streamId = streamResult.result.uid;
        const streamUrl = `https://customer-${cloudflareAccountId.slice(0, 32)}.cloudflarestream.com/${streamId}/manifest/video.m3u8`;

        console.log(`✅ Video uploaded to Stream: ${streamId}`);

        // Update database with new Stream URL
        const { error: updateError } = await supabase
          .from('post_media')
          .update({ media_url: streamUrl })
          .eq('id', video.id);

        if (updateError) {
          console.error(`⚠️ Failed to update database for video ${video.id}:`, updateError);
          progress.errors.push(`Database update failed for ${video.id}: ${updateError.message}`);
        } else {
          console.log(`📝 Updated database with new Stream URL for video ${video.id}`);
        }

        // Note: We don't automatically delete from Supabase storage for safety
        console.log(`📝 Note: Please manually delete ${filePath} from Supabase storage after migration completes`);

        progress.streamVideos.push({
          supabasePath: filePath,
          streamUrl,
          streamId
        });

        progress.migratedVideos++;
        progress.processedVideos++;

      } catch (error) {
        console.error(`❌ Error processing video ${video.id}:`, error);
        progress.errors.push(`Error processing ${video.id}: ${error.message}`);
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