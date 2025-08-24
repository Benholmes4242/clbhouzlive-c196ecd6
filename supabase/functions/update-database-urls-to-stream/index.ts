import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const cloudflareAccountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID')!;
    const cloudflareStreamToken = Deno.env.get('CLOUDFLARE_STREAM_API_TOKEN')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔄 Starting database URL update from R2 to Stream...');

    let updateCount = 0;
    const errors: string[] = [];

    // Get all videos from Stream
    console.log('📹 Fetching videos from Cloudflare Stream...');
    const streamResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/stream`, {
      headers: {
        'Authorization': `Bearer ${cloudflareStreamToken}`,
      },
    });

    if (!streamResponse.ok) {
      throw new Error(`Failed to fetch Stream videos: ${streamResponse.statusText}`);
    }

    const streamData = await streamResponse.json();
    const streamVideos = streamData.result || [];
    console.log(`Found ${streamVideos.length} videos in Stream`);

    // Create mapping from filename to Stream URL
    const streamUrlMap = new Map<string, string>();
    streamVideos.forEach((video: any) => {
      if (video.meta?.name) {
        const streamUrl = `https://customer-${cloudflareAccountId}.cloudflarestream.com/${video.uid}/manifest/video.m3u8`;
        streamUrlMap.set(video.meta.name, streamUrl);
        console.log(`📝 Mapped ${video.meta.name} -> ${streamUrl}`);
      }
    });

    // Update post_media table
    console.log('🔄 Updating post_media table...');
    const { data: postMedia, error: postMediaFetchError } = await supabase
      .from('post_media')
      .select('id, media_url')
      .like('media_url', '%media.clbhouz.co.uk%')
      .or('media_type.eq.video/mp4,media_type.eq.video/quicktime,media_type.eq.video/mov');

    if (postMediaFetchError) {
      console.error('Error fetching post_media:', postMediaFetchError);
      errors.push(`Error fetching post_media: ${postMediaFetchError.message}`);
    } else {
      for (const item of postMedia) {
        // Extract filename from R2 URL
        const filename = item.media_url.split('/').pop();
        const streamUrl = streamUrlMap.get(filename);
        
        if (streamUrl) {
          const { error: updateError } = await supabase
            .from('post_media')
            .update({ media_url: streamUrl })
            .eq('id', item.id);
          
          if (updateError) {
            errors.push(`Failed to update post_media ${item.id}: ${updateError.message}`);
          } else {
            console.log(`✅ Updated post_media: ${filename} -> Stream URL`);
            updateCount++;
          }
        } else {
          console.log(`⚠️ No Stream URL found for ${filename}`);
        }
      }
    }

    // Update profile_media table
    console.log('🔄 Updating profile_media table...');
    const { data: profileMedia, error: profileMediaFetchError } = await supabase
      .from('profile_media')
      .select('id, media_url')
      .like('media_url', '%media.clbhouz.co.uk%')
      .or('media_type.eq.video/mp4,media_type.eq.video/quicktime,media_type.eq.video/mov');

    if (profileMediaFetchError) {
      console.error('Error fetching profile_media:', profileMediaFetchError);
      errors.push(`Error fetching profile_media: ${profileMediaFetchError.message}`);
    } else {
      for (const item of profileMedia) {
        const filename = item.media_url.split('/').pop();
        const streamUrl = streamUrlMap.get(filename);
        
        if (streamUrl) {
          const { error: updateError } = await supabase
            .from('profile_media')
            .update({ media_url: streamUrl })
            .eq('id', item.id);
          
          if (updateError) {
            errors.push(`Failed to update profile_media ${item.id}: ${updateError.message}`);
          } else {
            console.log(`✅ Updated profile_media: ${filename} -> Stream URL`);
            updateCount++;
          }
        }
      }
    }

    // Update course_review_media table
    console.log('🔄 Updating course_review_media table...');
    const { data: courseReviewMedia, error: courseReviewFetchError } = await supabase
      .from('course_review_media')
      .select('id, media_url')
      .like('media_url', '%media.clbhouz.co.uk%')
      .or('media_type.eq.video/mp4,media_type.eq.video/quicktime,media_type.eq.video/mov');

    if (courseReviewFetchError) {
      console.error('Error fetching course_review_media:', courseReviewFetchError);
      errors.push(`Error fetching course_review_media: ${courseReviewFetchError.message}`);
    } else {
      for (const item of courseReviewMedia) {
        const filename = item.media_url.split('/').pop();
        const streamUrl = streamUrlMap.get(filename);
        
        if (streamUrl) {
          const { error: updateError } = await supabase
            .from('course_review_media')
            .update({ media_url: streamUrl })
            .eq('id', item.id);
          
          if (updateError) {
            errors.push(`Failed to update course_review_media ${item.id}: ${updateError.message}`);
          } else {
            console.log(`✅ Updated course_review_media: ${filename} -> Stream URL`);
            updateCount++;
          }
        }
      }
    }

    console.log(`🎉 Database update complete: ${updateCount} URLs updated`);

    return new Response(JSON.stringify({
      success: true,
      updatedUrls: updateCount,
      streamVideosFound: streamVideos.length,
      errors: errors
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Database update error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});