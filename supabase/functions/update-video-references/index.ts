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
    const { oldUrl, newUrl } = await req.json();
    
    if (!oldUrl || !newUrl) {
      throw new Error('Both oldUrl and newUrl are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`🔄 Updating video references: ${oldUrl} -> ${newUrl}`);

    // Update post media
    const { error: postMediaError } = await supabase
      .from('post_media')
      .update({ media_url: newUrl })
      .eq('media_url', oldUrl);

    if (postMediaError) {
      console.error('Error updating post_media:', postMediaError);
      throw postMediaError;
    }

    // Update profile media
    const { error: profileMediaError } = await supabase
      .from('profile_media')
      .update({ media_url: newUrl })
      .eq('media_url', oldUrl);

    if (profileMediaError) {
      console.error('Error updating profile_media:', profileMediaError);
      throw profileMediaError;
    }

    // Update course review media
    const { error: courseReviewError } = await supabase
      .from('course_review_media')
      .update({ media_url: newUrl })
      .eq('media_url', oldUrl);

    if (courseReviewError) {
      console.error('Error updating course_review_media:', courseReviewError);
      throw courseReviewError;
    }

    console.log(`✅ Successfully updated database references for ${oldUrl}`);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Database references updated successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error updating video references:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});