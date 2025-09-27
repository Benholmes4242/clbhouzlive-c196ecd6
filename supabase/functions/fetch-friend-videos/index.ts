
import { serve } from "https://deno.land/std@0.220.0/http/server.ts"

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
    // Mock friend videos - in production, this would fetch from your database
    const mockFriendVideos = [
      {
        id: 'friend-1',
        type: 'friend',
        user: {
          name: 'Mike Johnson',
          username: '@mikej_golf',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
          verified: false,
        },
        content: {
          type: 'video',
          description: 'Hole in one at my local course! Still can\'t believe it! 🎯⛳',
          thumbnail: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=600&h=400&fit=crop',
          duration: '0:45',
          videoUrl: 'https://example.com/video1.mp4',
        },
        stats: {
          likes: 156,
          comments: 23,
          shares: 8,
        },
        timeAgo: '1h',
      },
      {
        id: 'friend-2',
        type: 'friend',
        user: {
          name: 'Sarah Chen',
          username: '@sarahgolf',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b302?w=150&h=150&fit=crop&crop=face',
          verified: false,
        },
        content: {
          type: 'video',
          description: 'Working on my swing at the driving range. Any tips? 🏌️‍♀️',
          thumbnail: 'https://images.unsplash.com/photo-1587174486073-ae5e5cec4674?w=600&h=400&fit=crop',
          duration: '1:30',
          videoUrl: 'https://example.com/video2.mp4',
        },
        stats: {
          likes: 89,
          comments: 12,
          shares: 3,
        },
        timeAgo: '7h',
      },
    ]

    console.log('Fetched friend videos successfully')

    return new Response(
      JSON.stringify({ videos: mockFriendVideos }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error fetching friend videos:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch friend videos' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
