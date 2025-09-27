import { serve } from "https://deno.land/std@0.220.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

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
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔍 Analyzing video URLs across all tables...');

    const analysis = {
      post_media: { r2_videos: 0, stream_videos: 0, total: 0 },
      profile_media: { r2_videos: 0, stream_videos: 0, total: 0 },
      course_review_media: { r2_videos: 0, stream_videos: 0, total: 0 }
    };

    const r2Pattern = 'https://media.clbhouz.co.uk/';
    const streamPattern = 'customer-a1b264d44ddbe2b5127bb6ff5c274108.cloudflarestream.com';

    // Analyze post_media
    const { data: postMedia, error: postError } = await supabase
      .from('post_media')
      .select('id, media_url, media_type')
      .eq('media_type', 'video');

    if (postError) {
      console.error('Error fetching post_media:', postError);
    } else {
      analysis.post_media.total = postMedia.length;
      postMedia.forEach(item => {
        if (item.media_url.includes(r2Pattern)) {
          analysis.post_media.r2_videos++;
        } else if (item.media_url.includes(streamPattern)) {
          analysis.post_media.stream_videos++;
        }
      });
    }

    // Analyze profile_media
    const { data: profileMedia, error: profileError } = await supabase
      .from('profile_media')
      .select('id, media_url, media_type')
      .eq('media_type', 'video');

    if (profileError) {
      console.error('Error fetching profile_media:', profileError);
    } else {
      analysis.profile_media.total = profileMedia.length;
      profileMedia.forEach(item => {
        if (item.media_url.includes(r2Pattern)) {
          analysis.profile_media.r2_videos++;
        } else if (item.media_url.includes(streamPattern)) {
          analysis.profile_media.stream_videos++;
        }
      });
    }

    // Analyze course_review_media
    const { data: courseMedia, error: courseError } = await supabase
      .from('course_review_media')
      .select('id, media_url, media_type')
      .eq('media_type', 'video');

    if (courseError) {
      console.error('Error fetching course_review_media:', courseError);
    } else {
      analysis.course_review_media.total = courseMedia.length;
      courseMedia.forEach(item => {
        if (item.media_url.includes(r2Pattern)) {
          analysis.course_review_media.r2_videos++;
        } else if (item.media_url.includes(streamPattern)) {
          analysis.course_review_media.stream_videos++;
        }
      });
    }

    const totalR2 = analysis.post_media.r2_videos + analysis.profile_media.r2_videos + analysis.course_review_media.r2_videos;
    const totalStream = analysis.post_media.stream_videos + analysis.profile_media.stream_videos + analysis.course_review_media.stream_videos;

    console.log('📊 Video URL Analysis Complete');
    console.log(`Total R2 videos: ${totalR2}`);
    console.log(`Total Stream videos: ${totalStream}`);

    return new Response(JSON.stringify({
      success: true,
      analysis,
      summary: {
        total_r2_videos: totalR2,
        total_stream_videos: totalStream,
        total_videos: totalR2 + totalStream
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Analysis error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});