
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
    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');
    
    if (!youtubeApiKey) {
      console.error('YouTube API key not found');
      // Return mock data if no API key is available
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
            youtubeId: 'dQw4w9WgXcQ',
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
      ];

      return new Response(
        JSON.stringify({ videos: mockYouTubeVideos }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      );
    }

    // Search for trending golf videos
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=golf+trending&type=video&order=relevance&maxResults=10&key=${youtubeApiKey}`
    );

    if (!searchResponse.ok) {
      throw new Error(`YouTube API search failed: ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();
    
    // Get video details including duration and statistics
    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
    
    const detailsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${youtubeApiKey}`
    );

    if (!detailsResponse.ok) {
      throw new Error(`YouTube API details failed: ${detailsResponse.statusText}`);
    }

    const detailsData = await detailsResponse.json();

    // Format duration from ISO 8601 to readable format
    const formatDuration = (duration: string) => {
      const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
      const hours = (match?.[1] || '').replace('H', '');
      const minutes = (match?.[2] || '').replace('M', '');
      const seconds = (match?.[3] || '').replace('S', '');
      
      if (hours) {
        return `${hours}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
      }
      return `${minutes || '0'}:${seconds.padStart(2, '0')}`;
    };

    // Calculate time ago
    const getTimeAgo = (publishedAt: string) => {
      const now = new Date();
      const published = new Date(publishedAt);
      const diffInHours = Math.floor((now.getTime() - published.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) return 'just now';
      if (diffInHours < 24) return `${diffInHours}h`;
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays}d`;
      const diffInWeeks = Math.floor(diffInDays / 7);
      return `${diffInWeeks}w`;
    };

    const formattedVideos = detailsData.items.map((video: any, index: number) => ({
      id: `yt-${video.id}`,
      type: 'youtube',
      user: {
        name: video.snippet.channelTitle,
        username: `@${video.snippet.channelTitle.toLowerCase().replace(/\s+/g, '')}`,
        avatar: `https://images.unsplash.com/photo-${1566753323558 + index}?w=150&h=150&fit=crop&crop=face`,
        verified: Math.random() > 0.5, // Randomly assign verified status
      },
      content: {
        type: 'video',
        description: video.snippet.title,
        thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default?.url,
        duration: formatDuration(video.contentDetails.duration),
        youtubeId: video.id,
      },
      stats: {
        likes: parseInt(video.statistics.likeCount || '0'),
        comments: parseInt(video.statistics.commentCount || '0'),
        shares: Math.floor(parseInt(video.statistics.viewCount || '0') * 0.01), // Estimate shares as 1% of views
      },
      timeAgo: getTimeAgo(video.snippet.publishedAt),
    }));

    console.log('Fetched real YouTube videos successfully', formattedVideos.length);

    return new Response(
      JSON.stringify({ videos: formattedVideos }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error fetching YouTube videos:', error)
    
    // Return mock data as fallback
    const mockYouTubeVideos = [
      {
        id: 'yt-fallback-1',
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
          youtubeId: 'dQw4w9WgXcQ',
        },
        stats: {
          likes: 45200,
          comments: 1200,
          shares: 890,
        },
        timeAgo: '3h',
      }
    ];

    return new Response(
      JSON.stringify({ videos: mockYouTubeVideos }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  }
})
