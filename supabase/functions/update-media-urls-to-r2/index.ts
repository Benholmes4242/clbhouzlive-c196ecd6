import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'
import { normalizeError } from '../_shared/normalize-error.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DatabaseError {
  message: string;
  details: string;
  hint: string;
  code: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting media URL conversion from Supabase to R2...')

    // Function to convert Supabase URL to R2 URL
    const convertToR2Url = (supabaseUrl: string): string => {
      // Extract the file path from Supabase URL
      // Format: https://project.supabase.co/storage/v1/object/public/bucket/path
      const match = supabaseUrl.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+)/)
      if (!match) {
        console.warn('Could not parse Supabase URL:', supabaseUrl)
        return supabaseUrl
      }

      const [, bucket, filePath] = match
      
      // Convert to R2 URL format
      const r2Url = `https://media.clbhouz.co.uk/${filePath}`
      console.log(`Converting ${supabaseUrl} -> ${r2Url}`)
      return r2Url
    }

    let totalUpdated = 0

    // Update post_media table
    console.log('Updating post_media table...')
    const { data: postMediaData, error: postMediaError } = await supabaseClient
      .from('post_media')
      .select('id, media_url')
      .like('media_url', '%supabase%')

    if (postMediaError) {
      throw postMediaError
    }

    for (const row of postMediaData || []) {
      const newUrl = convertToR2Url(row.media_url)
      if (newUrl !== row.media_url) {
        const { error: updateError } = await supabaseClient
          .from('post_media')
          .update({ media_url: newUrl })
          .eq('id', row.id)

        if (updateError) {
          console.error(`Failed to update post_media ${row.id}:`, updateError)
        } else {
          totalUpdated++
          console.log(`Updated post_media ${row.id}`)
        }
      }
    }

    // Update user_profiles table (avatars, cover images)
    console.log('Updating user_profiles table...')
    const { data: profilesData, error: profilesError } = await supabaseClient
      .from('user_profiles')
      .select('id, profile_photo_url, cover_photo_url, logo_url')
      .or('profile_photo_url.like.%supabase%,cover_photo_url.like.%supabase%,logo_url.like.%supabase%')

    if (profilesError) {
      throw profilesError
    }

    for (const row of profilesData || []) {
      const updates: any = {}
      
      if (row.profile_photo_url?.includes('supabase')) {
        updates.profile_photo_url = convertToR2Url(row.profile_photo_url)
      }
      
      if (row.cover_photo_url?.includes('supabase')) {
        updates.cover_photo_url = convertToR2Url(row.cover_photo_url)
      }
      
      if (row.logo_url?.includes('supabase')) {
        updates.logo_url = convertToR2Url(row.logo_url)
      }

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabaseClient
          .from('user_profiles')
          .update(updates)
          .eq('id', row.id)

        if (updateError) {
          console.error(`Failed to update user_profiles ${row.id}:`, updateError)
        } else {
          totalUpdated++
          console.log(`Updated user_profiles ${row.id}`)
        }
      }
    }

    // Update profile_media table
    console.log('Updating profile_media table...')
    const { data: profileMediaData, error: profileMediaError } = await supabaseClient
      .from('profile_media')
      .select('id, media_url')
      .like('media_url', '%supabase%')

    if (profileMediaError) {
      throw profileMediaError
    }

    for (const row of profileMediaData || []) {
      const newUrl = convertToR2Url(row.media_url)
      if (newUrl !== row.media_url) {
        const { error: updateError } = await supabaseClient
          .from('profile_media')
          .update({ media_url: newUrl })
          .eq('id', row.id)

        if (updateError) {
          console.error(`Failed to update profile_media ${row.id}:`, updateError)
        } else {
          totalUpdated++
          console.log(`Updated profile_media ${row.id}`)
        }
      }
    }

    // Update golf_courses table (thumbnail images)
    console.log('Updating golf_courses table...')
    const { data: coursesData, error: coursesError } = await supabaseClient
      .from('golf_courses')
      .select('id, thumbnail_image')
      .like('thumbnail_image', '%supabase%')

    if (coursesError) {
      throw coursesError
    }

    for (const row of coursesData || []) {
      const newUrl = convertToR2Url(row.thumbnail_image)
      if (newUrl !== row.thumbnail_image) {
        const { error: updateError } = await supabaseClient
          .from('golf_courses')
          .update({ thumbnail_image: newUrl })
          .eq('id', row.id)

        if (updateError) {
          console.error(`Failed to update golf_courses ${row.id}:`, updateError)
        } else {
          totalUpdated++
          console.log(`Updated golf_courses ${row.id}`)
        }
      }
    }

    console.log(`URL conversion completed. Total records updated: ${totalUpdated}`)

    return new Response(
      JSON.stringify({
        success: true,
        totalUpdated,
        message: `Successfully updated ${totalUpdated} media URLs to R2`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    const err = normalizeError(error);
    console.error('Error updating media URLs:', err.message)
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})