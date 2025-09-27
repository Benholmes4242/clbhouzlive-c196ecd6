import { serve } from "https://deno.land/std@0.220.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { normalizeError } from '../_shared/normalize-error.ts';

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
    const correctAccountId = '4ah4gni80ytefpck';

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔧 Fixing Stream URLs to use correct manifests...');
    console.log(`✅ Correct account ID: ${correctAccountId}`);

    let updateCount = 0;
    const errors: string[] = [];

    // Get all videos from Cloudflare Stream
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

    // Create mapping from old URLs to correct Stream URLs
    const urlMappings = new Map<string, string>();
    
    // Wrong account IDs found in the database
    const wrongAccountIds = [
      'a1b264d44ddbe2b5127bb6ff5c274108'
    ];

    // Get all Stream URLs from all media tables
    console.log('🔄 Finding all Stream URLs in database...');
    const allStreamUrls: {table: string, id: string, url: string}[] = [];
    
    // Get from post_media (both Stream and R2 URLs)
    const { data: postMedia, error: postError } = await supabase
      .from('post_media')
      .select('id, media_url')
      .or('media_url.like.%cloudflarestream.com%,media_url.like.%media.clbhouz.co.uk%');
    
    if (postError) {
      errors.push(`Error fetching post_media: ${postError.message}`);
    } else {
      postMedia.forEach(item => {
        allStreamUrls.push({table: 'post_media', id: item.id, url: item.media_url});
      });
    }

    // Get from profile_media (both Stream and R2 URLs)
    const { data: profileMedia, error: profileError } = await supabase
      .from('profile_media')
      .select('id, media_url')
      .or('media_url.like.%cloudflarestream.com%,media_url.like.%media.clbhouz.co.uk%');
    
    if (profileError) {
      errors.push(`Error fetching profile_media: ${profileError.message}`);
    } else {
      profileMedia.forEach(item => {
        allStreamUrls.push({table: 'profile_media', id: item.id, url: item.media_url});
      });
    }

    // Get from course_review_media (both Stream and R2 URLs)
    const { data: courseMedia, error: courseError } = await supabase
      .from('course_review_media')
      .select('id, media_url')
      .or('media_url.like.%cloudflarestream.com%,media_url.like.%media.clbhouz.co.uk%');
    
    if (courseError) {
      errors.push(`Error fetching course_review_media: ${courseError.message}`);
    } else {
      courseMedia.forEach(item => {
        allStreamUrls.push({table: 'course_review_media', id: item.id, url: item.media_url});
      });
    }

    console.log(`📊 Found ${allStreamUrls.length} Stream URLs in database`);

    // Try to map database URLs to correct Stream URLs
    for (const dbItem of allStreamUrls) {
      let correctStreamUrl = null;
      
      if (dbItem.url.includes('cloudflarestream.com')) {
        // Handle existing Stream URLs - extract video ID
        const videoIdMatch = dbItem.url.match(/\/([a-f0-9]{32})\//);
        if (!videoIdMatch) continue;
        
        const currentVideoId = videoIdMatch[1];
        
        // Find matching video in Stream
        const streamVideo = streamVideos.find((video: any) => video.uid === currentVideoId);
        
        if (streamVideo) {
          // Use the correct manifest URL
          correctStreamUrl = `https://customer-${correctAccountId}.cloudflarestream.com/${streamVideo.uid}/manifest/video.m3u8`;
        }
      } else if (dbItem.url.includes('media.clbhouz.co.uk')) {
        // Handle R2 URLs - extract filename and map to Stream video
        const filename = dbItem.url.split('/').pop();
        if (!filename) continue;
        
        // Find Stream video by filename in metadata
        const streamVideo = streamVideos.find((video: any) => {
          // Check if filename matches the original filename stored in meta
          if (video.meta?.name === filename) return true;
          
          // Also check for partial matches (some files might have been renamed)
          const baseFilename = filename.replace(/\.[^/.]+$/, ""); // Remove extension
          if (video.meta?.name && video.meta.name.includes(baseFilename)) return true;
          
          return false;
        });
        
        if (streamVideo) {
          correctStreamUrl = `https://customer-${correctAccountId}.cloudflarestream.com/${streamVideo.uid}/manifest/video.m3u8`;
          console.log(`🔄 Mapping R2 file ${filename} to Stream video ${streamVideo.uid}`);
        } else {
          console.log(`⚠️ No Stream video found for R2 file: ${filename}`);
          continue;
        }
      }
      
      if (correctStreamUrl && dbItem.url !== correctStreamUrl) {
        console.log(`🔄 Updating ${dbItem.table}:${dbItem.id} -> ${correctStreamUrl}`);
        
        const { error: updateError } = await supabase
          .from(dbItem.table)
          .update({ media_url: correctStreamUrl })
          .eq('id', dbItem.id);
        
        if (updateError) {
          errors.push(`Failed to update ${dbItem.table} ${dbItem.id}: ${updateError.message}`);
        } else {
          updateCount++;
        }
      }
    }

    console.log(`🎉 Stream URL fix complete: ${updateCount} URLs updated`);

    return new Response(JSON.stringify({
      success: true,
      updatedUrls: updateCount,
      correctAccountId: correctAccountId,
      wrongAccountIds: wrongAccountIds,
      errors: errors
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = normalizeError(error);
    console.error('❌ Account ID fix error:', err.name, err.message, err.stack);
    return new Response(JSON.stringify({ 
      error: err.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});