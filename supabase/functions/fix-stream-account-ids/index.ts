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
    const correctAccountId = 'a1b264d44ddbe2b5127bb6ff5c274108';

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔧 Fixing Stream account IDs in URLs...');
    console.log(`✅ Correct account ID: ${correctAccountId}`);

    let updateCount = 0;
    const errors: string[] = [];

    // Wrong account IDs found in the database
    const wrongAccountIds = [
      '4ah4gni80ytefpck'
    ];

    // Update post_media table
    console.log('🔄 Updating post_media table...');
    for (const wrongId of wrongAccountIds) {
      const { data: postMedia, error: fetchError } = await supabase
        .from('post_media')
        .select('id, media_url')
        .like('media_url', `%customer-${wrongId}.cloudflarestream.com%`);

      if (fetchError) {
        console.error('Error fetching post_media:', fetchError);
        errors.push(`Error fetching post_media: ${fetchError.message}`);
        continue;
      }

      console.log(`📹 Found ${postMedia.length} post_media records with wrong account ID: ${wrongId}`);

      for (const item of postMedia) {
        const fixedUrl = item.media_url.replace(
          `customer-${wrongId}.cloudflarestream.com`,
          `customer-${correctAccountId}.cloudflarestream.com`
        );

        const { error: updateError } = await supabase
          .from('post_media')
          .update({ media_url: fixedUrl })
          .eq('id', item.id);

        if (updateError) {
          errors.push(`Failed to update post_media ${item.id}: ${updateError.message}`);
        } else {
          console.log(`✅ Fixed post_media URL: ${wrongId} -> ${correctAccountId}`);
          updateCount++;
        }
      }
    }

    // Update profile_media table
    console.log('🔄 Updating profile_media table...');
    for (const wrongId of wrongAccountIds) {
      const { data: profileMedia, error: fetchError } = await supabase
        .from('profile_media')
        .select('id, media_url, thumbnail_url')
        .like('media_url', `%customer-${wrongId}.cloudflarestream.com%`);

      if (fetchError) {
        console.error('Error fetching profile_media:', fetchError);
        errors.push(`Error fetching profile_media: ${fetchError.message}`);
        continue;
      }

      console.log(`📹 Found ${profileMedia.length} profile_media records with wrong account ID: ${wrongId}`);

      for (const item of profileMedia) {
        const fixedUrl = item.media_url.replace(
          `customer-${wrongId}.cloudflarestream.com`,
          `customer-${correctAccountId}.cloudflarestream.com`
        );

        const fixedThumbnailUrl = item.thumbnail_url?.replace(
          `customer-${wrongId}.cloudflarestream.com`,
          `customer-${correctAccountId}.cloudflarestream.com`
        );

        const updateData: any = { media_url: fixedUrl };
        if (fixedThumbnailUrl) {
          updateData.thumbnail_url = fixedThumbnailUrl;
        }

        const { error: updateError } = await supabase
          .from('profile_media')
          .update(updateData)
          .eq('id', item.id);

        if (updateError) {
          errors.push(`Failed to update profile_media ${item.id}: ${updateError.message}`);
        } else {
          console.log(`✅ Fixed profile_media URL: ${wrongId} -> ${correctAccountId}`);
          updateCount++;
        }
      }
    }

    // Update course_review_media table
    console.log('🔄 Updating course_review_media table...');
    for (const wrongId of wrongAccountIds) {
      const { data: courseReviewMedia, error: fetchError } = await supabase
        .from('course_review_media')
        .select('id, media_url')
        .like('media_url', `%customer-${wrongId}.cloudflarestream.com%`);

      if (fetchError) {
        console.error('Error fetching course_review_media:', fetchError);
        errors.push(`Error fetching course_review_media: ${fetchError.message}`);
        continue;
      }

      console.log(`📹 Found ${courseReviewMedia.length} course_review_media records with wrong account ID: ${wrongId}`);

      for (const item of courseReviewMedia) {
        const fixedUrl = item.media_url.replace(
          `customer-${wrongId}.cloudflarestream.com`,
          `customer-${correctAccountId}.cloudflarestream.com`
        );

        const { error: updateError } = await supabase
          .from('course_review_media')
          .update({ media_url: fixedUrl })
          .eq('id', item.id);

        if (updateError) {
          errors.push(`Failed to update course_review_media ${item.id}: ${updateError.message}`);
        } else {
          console.log(`✅ Fixed course_review_media URL: ${wrongId} -> ${correctAccountId}`);
          updateCount++;
        }
      }
    }

    console.log(`🎉 Account ID fix complete: ${updateCount} URLs updated`);

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
    console.error('❌ Account ID fix error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});