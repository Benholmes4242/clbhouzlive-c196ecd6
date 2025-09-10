import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
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
    // Use service role key for server-side operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Read params from GET or POST
    let clubId: string | null = null
    let limit = 30

    if (req.method === 'GET') {
      const url = new URL(req.url)
      clubId = url.searchParams.get('clubId')
      limit = parseInt(url.searchParams.get('limit') ?? '30')
    } else if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}))
      clubId = body.clubId || null
      limit = parseInt(String(body.limit ?? 30))
    } else {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`get-club-media: ${req.method} request for clubId: ${clubId}, limit: ${limit}`)

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

    // Helper to extract Stream UID from HLS URL
    const extractStreamUidFromHls = (hls: string): string | null => {
      try {
        const url = new URL(hls)
        const parts = url.pathname.split('/').filter(Boolean)
        return parts[0] || null
      } catch {
        return null
      }
    }

    // Helper to generate safe thumbnail URL
    const getSafeThumbnailUrl = (mediaUrl: string, mediaType: string): string => {
      const isVideo = mediaType === 'video'
      
      if (isVideo) {
        // For videos, extract UID and generate thumbnail URL
        const uid = extractStreamUidFromHls(mediaUrl)
        return uid 
          ? `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg`
          : mediaUrl // fallback to original if can't extract UID
      } else {
        // For images, use the R2 URL directly
        return mediaUrl
      }
    }

    // Transform post media
    const transformedPostMedia: MediaItem[] = (postMedia || []).map(item => {
      const profile = profiles.find(p => p.id === item.posts.user_id)
      const safeThumbnail = getSafeThumbnailUrl(item.media_url, item.media_type)
      
      return {
        id: item.id,
        source: 'post' as const,
        sourceId: item.posts.id,
        type: item.media_type as 'image' | 'video',
        url: item.media_url,
        thumbnailUrl: safeThumbnail,
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
      const safeThumbnail = getSafeThumbnailUrl(item.media_url, item.media_type)
      
      return {
        id: item.id,
        source: 'review' as const,
        sourceId: item.course_ratings.id,
        type: item.media_type as 'image' | 'video',
        url: item.media_url,
        thumbnailUrl: safeThumbnail,
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
    const edges = [...transformedPostMedia, ...transformedReviewMedia]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)

    const hasMore = (transformedPostMedia.length + transformedReviewMedia.length) > limit
    const nextCursor = edges.length > 0 ? edges[edges.length - 1].createdAt : null

    return new Response(
      JSON.stringify({
        // New canonical key expected by the UI:
        edges,
        
        // Back-compat alias (can remove later once UI is confirmed):
        media: edges,
        
        pageInfo: { hasMore, nextCursor }
      }),
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