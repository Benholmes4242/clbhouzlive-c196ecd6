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
    console.log(`🔧 Account ID: ${cloudflareAccountId}`);
    console.log(`🔑 R2 Token present: ${!!cloudflareR2Token}`);
    console.log(`🎥 Stream Token present: ${!!cloudflareStreamToken}`);

    // Since R2 doesn't have a REST API for listing, let's find videos by scanning the database
    console.log('🔍 Finding video URLs from database...');
    
    const allVideoUrls = new Set<string>();
    
    // Check post_media table for video URLs
    const { data: postMedia, error: postMediaError } = await supabase
      .from('post_media')
      .select('media_url, media_type')
      .or('media_type.eq.video/mp4,media_type.eq.video/quicktime,media_type.eq.video/mov')
      .like('media_url', '%media.clbhouz.co.uk%');
    
    if (postMediaError) {
      console.error('Error fetching post_media:', postMediaError);
    } else {
      console.log(`📹 Found ${postMedia.length} videos in post_media`);
      postMedia.forEach(item => allVideoUrls.add(item.media_url));
    }
    
    // Check profile_media table for video URLs
    const { data: profileMedia, error: profileMediaError } = await supabase
      .from('profile_media')
      .select('media_url, media_type')
      .or('media_type.eq.video/mp4,media_type.eq.video/quicktime,media_type.eq.video/mov')
      .like('media_url', '%media.clbhouz.co.uk%');
    
    if (profileMediaError) {
      console.error('Error fetching profile_media:', profileMediaError);
    } else {
      console.log(`📹 Found ${profileMedia.length} videos in profile_media`);
      profileMedia.forEach(item => allVideoUrls.add(item.media_url));
    }
    
    // Check course_review_media table for video URLs
    const { data: courseReviewMedia, error: courseReviewError } = await supabase
      .from('course_review_media')
      .select('media_url, media_type')
      .or('media_type.eq.video/mp4,media_type.eq.video/quicktime,media_type.eq.video/mov')
      .like('media_url', '%media.clbhouz.co.uk%');
    
    if (courseReviewError) {
      console.error('Error fetching course_review_media:', courseReviewError);
    } else {
      console.log(`📹 Found ${courseReviewMedia.length} videos in course_review_media`);
      courseReviewMedia.forEach(item => allVideoUrls.add(item.media_url));
    }
    
    const videoUrls = Array.from(allVideoUrls);
    console.log(`📊 Total unique video URLs found: ${videoUrls.length}`);
    console.log(`📋 Sample URLs:`, videoUrls.slice(0, 3));
    
    // Convert URLs to R2 object keys
    const allObjects = videoUrls.map(url => {
      // Extract path from URL like https://media.clbhouz.co.uk/post-media/filename.mp4
      const path = url.replace('https://media.clbhouz.co.uk/', '');
      return { key: path, url: url };
    });

    // Filter for video files
    const videoObjects = allObjects.filter((obj: any) => {
      const name = obj.key.toLowerCase();
      const isVideo = name.match(/\.(mov|mp4|avi|mkv|webm|m4v)$/);
      console.log(`🔍 Checking: ${obj.key}, isVideo: ${!!isVideo}`);
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
        await updateDatabaseVideoReferences(supabase, videoObj.url, streamUrl);

        // Note: We're not deleting from R2 since we don't have direct API access
        // The videos can be manually cleaned up later from the Cloudflare dashboard
        console.log(`⚠️ Note: ${videoObj.key} needs to be manually deleted from R2`);

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