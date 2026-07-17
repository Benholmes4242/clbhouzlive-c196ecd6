import { serve } from "https://deno.land/std@0.220.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { normalizeError } from '../_shared/normalize-error.ts';

import { corsFor } from '../_shared/cors.ts';
serve(async (req) => {
  const corsHeaders = corsFor(req.headers.get('Origin'));
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const cloudflareAccountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID')!;
    const cloudflareStreamToken = Deno.env.get('CLOUDFLARE_STREAM_API_TOKEN')!;
    const correctSubdomain = 'customer-4ah4gni80ytefpck';
    const wrongSubdomain = 'customer-9p8qw7hk8dxqwnx6';

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔧 Fixing Stream URLs to use correct customer subdomain...');
    console.log(`✅ Correct subdomain: ${correctSubdomain}`);
    console.log(`❌ Wrong subdomain to fix: ${wrongSubdomain}`);

    let updateCount = 0;
    const errors: string[] = [];

    // STEP 1: Fix wrong customer subdomain in all tables
    console.log('📹 Step 1: Fixing wrong customer subdomain in URLs...');
    
    // Fix post_media
    const { data: postMediaToFix, error: postFetchError } = await supabase
      .from('post_media')
      .select('id, media_url, poster_url')
      .like('media_url', `%${wrongSubdomain}%`);
    
    if (postFetchError) {
      errors.push(`Error fetching post_media: ${postFetchError.message}`);
    } else if (postMediaToFix && postMediaToFix.length > 0) {
      console.log(`Found ${postMediaToFix.length} post_media rows with wrong subdomain`);
      for (const item of postMediaToFix) {
        const newMediaUrl = item.media_url.replace(wrongSubdomain, correctSubdomain);
        const newPosterUrl = item.poster_url ? item.poster_url.replace(wrongSubdomain, correctSubdomain) : null;
        
        const { error: updateError } = await supabase
          .from('post_media')
          .update({ 
            media_url: newMediaUrl,
            poster_url: newPosterUrl 
          })
          .eq('id', item.id);
        
        if (updateError) {
          errors.push(`Failed to update post_media ${item.id}: ${updateError.message}`);
        } else {
          updateCount++;
          console.log(`✅ Updated post_media ${item.id}`);
        }
      }
    }

    // Fix profile_media
    const { data: profileMediaToFix, error: profileFetchError } = await supabase
      .from('profile_media')
      .select('id, media_url, poster_url')
      .like('media_url', `%${wrongSubdomain}%`);
    
    if (profileFetchError) {
      errors.push(`Error fetching profile_media: ${profileFetchError.message}`);
    } else if (profileMediaToFix && profileMediaToFix.length > 0) {
      console.log(`Found ${profileMediaToFix.length} profile_media rows with wrong subdomain`);
      for (const item of profileMediaToFix) {
        const newMediaUrl = item.media_url.replace(wrongSubdomain, correctSubdomain);
        const newPosterUrl = item.poster_url ? item.poster_url.replace(wrongSubdomain, correctSubdomain) : null;
        
        const { error: updateError } = await supabase
          .from('profile_media')
          .update({ 
            media_url: newMediaUrl,
            poster_url: newPosterUrl 
          })
          .eq('id', item.id);
        
        if (updateError) {
          errors.push(`Failed to update profile_media ${item.id}: ${updateError.message}`);
        } else {
          updateCount++;
          console.log(`✅ Updated profile_media ${item.id}`);
        }
      }
    }

    // Fix course_review_media
    const { data: courseMediaToFix, error: courseFetchError } = await supabase
      .from('course_review_media')
      .select('id, media_url, poster_url')
      .like('media_url', `%${wrongSubdomain}%`);
    
    if (courseFetchError) {
      errors.push(`Error fetching course_review_media: ${courseFetchError.message}`);
    } else if (courseMediaToFix && courseMediaToFix.length > 0) {
      console.log(`Found ${courseMediaToFix.length} course_review_media rows with wrong subdomain`);
      for (const item of courseMediaToFix) {
        const newMediaUrl = item.media_url.replace(wrongSubdomain, correctSubdomain);
        const newPosterUrl = item.poster_url ? item.poster_url.replace(wrongSubdomain, correctSubdomain) : null;
        
        const { error: updateError } = await supabase
          .from('course_review_media')
          .update({ 
            media_url: newMediaUrl,
            poster_url: newPosterUrl 
          })
          .eq('id', item.id);
        
        if (updateError) {
          errors.push(`Failed to update course_review_media ${item.id}: ${updateError.message}`);
        } else {
          updateCount++;
          console.log(`✅ Updated course_review_media ${item.id}`);
        }
      }
    }

    console.log(`📊 Step 1 complete: Fixed ${updateCount} URLs with wrong subdomain`);

    console.log(`🎉 Stream subdomain fix complete: ${updateCount} URLs updated`);

    return new Response(JSON.stringify({
      success: true,
      updatedUrls: updateCount,
      correctSubdomain,
      wrongSubdomain,
      errors
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const err = normalizeError(error);
    console.error('❌ Subdomain fix error:', err.name, err.message, err.stack);
    return new Response(JSON.stringify({ 
      error: err.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});