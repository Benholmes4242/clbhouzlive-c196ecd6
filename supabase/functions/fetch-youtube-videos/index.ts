
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // For demo purposes, returning mock YouTube golf videos
    // In production, you would use the YouTube Data API
    const mockYouTubeVideos = [
      {
        id: 'yt-1',
        type: 'youtube',
        user: {
          name: 'Golf Channel',
          username: '@golfchannel',
          avatar: 'https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=150&h=150&fit=crop&crop=face',
          verified: true,
        },
        content: {
          type: 'video',
          description: 'Tiger Woods Best Shots Compilation 2024 🔥',
          thumbnail: 'https://images.unsplash.com/photo-1587174486073-ae5e5cec4674?w=600&h=400&fit=crop',
          duration: '10:24',
          youtubeId: 'dQw4w9WgXcQ', // Example YouTube ID
        },
        stats: {
          likes: 45200,
          comments: 1200,
          shares: 890,
        },
        timeAgo: '3h',
      },
      {
        id: 'yt-2',
        type: 'youtube',
        user: {
          name: 'PGA Tour',
          username: '@pgatour',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          verified: true,
        },
        content: {
          type: 'video',
          description: 'Incredible Eagle on 18th Hole! 🦅',
          thumbnail: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=600&h=400&fit=crop',
          duration: '3:15',
          youtubeId: 'dQw4w9WgXcQ',
        },
        stats: {
          likes: 23100,
          comments: 567,
          shares: 234,
        },
        timeAgo: '5h',
      },
    ]

    console.log('Fetched YouTube videos successfully')

    return new Response(
      JSON.stringify({ videos: mockYouTubeVideos }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error fetching YouTube videos:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch YouTube videos' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
