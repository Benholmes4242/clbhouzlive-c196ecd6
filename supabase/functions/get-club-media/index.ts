import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MediaItem {
  id: string
  source: 'post' | 'review'
  sourceId: string
  type: 'image' | 'video'
  url: string
  thumbnailUrl?: string
  width?: number
  height?: number
  createdAt: string
  author: {
    id: string
    displayName: string
    username?: string
    avatarUrl?: string
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const url = new URL(req.url)
    const clubId = url.searchParams.get('clubId')
    const limit = parseInt(url.searchParams.get('limit') ?? '30')

    if (!clubId) {
      return new Response(
        JSON.stringify({ error: 'Club ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get media from tagged posts
    const { data: postMedia, error: postError } = await supabaseClient
      .from('post_media')
      .select(`
        id,
        media_url,
        media_type,
        created_at,
        posts!inner (
          id,
          user_id,
          created_at,
          post_tags!inner (
            tagged_entity_id,
            taggable_entities!inner (
              entity_type,
              entity_id
            )
          )
        )
      `)
      .eq('posts.post_tags.taggable_entities.entity_type', 'golf_club')
      .eq('posts.post_tags.taggable_entities.entity_id', clubId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (postError) {
      console.error('Error fetching post media:', postError)
    }

    // Get media from course reviews
    const { data: reviewMedia, error: reviewError } = await supabaseClient
      .from('course_review_media')
      .select(`
        id,
        media_url,
        media_type,
        created_at,
        course_ratings!inner (
          id,
          user_id,
          course_id
        )
      `)
      .eq('course_ratings.course_id', clubId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (reviewError) {
      console.error('Error fetching review media:', reviewError)
    }

    // Get all unique user IDs
    const postUserIds = postMedia?.map(item => item.posts.user_id) || []
    const reviewUserIds = reviewMedia?.map(item => item.course_ratings.user_id) || []
    const allUserIds = [...new Set([...postUserIds, ...reviewUserIds])]

    // Get user profiles
    let profiles: any[] = []
    if (allUserIds.length > 0) {
      const { data: userProfiles, error: profileError } = await supabaseClient
        .from('user_profiles')
        .select('id, username, display_name, profile_photo_url')
        .in('id', allUserIds)

      if (profileError) {
        console.error('Error fetching user profiles:', profileError)
      } else {
        profiles = userProfiles || []
      }
    }

    // Transform post media
    const transformedPostMedia: MediaItem[] = (postMedia || []).map(item => {
      const profile = profiles.find(p => p.id === item.posts.user_id)
      return {
        id: item.id,
        source: 'post' as const,
        sourceId: item.posts.id,
        type: item.media_type as 'image' | 'video',
        url: item.media_url,
        createdAt: item.created_at,
        author: {
          id: item.posts.user_id,
          displayName: profile?.display_name || profile?.username || 'Anonymous',
          username: profile?.username,
          avatarUrl: profile?.profile_photo_url
        }
      }
    })

    // Transform review media
    const transformedReviewMedia: MediaItem[] = (reviewMedia || []).map(item => {
      const profile = profiles.find(p => p.id === item.course_ratings.user_id)
      return {
        id: item.id,
        source: 'review' as const,
        sourceId: item.course_ratings.id,
        type: item.media_type as 'image' | 'video',
        url: item.media_url,
        createdAt: item.created_at,
        author: {
          id: item.course_ratings.user_id,
          displayName: profile?.display_name || profile?.username || 'Anonymous',
          username: profile?.username,
          avatarUrl: profile?.profile_photo_url
        }
      }
    })

    // Combine and sort by creation date
    const allMedia = [...transformedPostMedia, ...transformedReviewMedia]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)

    return new Response(
      JSON.stringify({ media: allMedia }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})