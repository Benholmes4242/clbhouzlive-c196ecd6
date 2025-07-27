import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, X, Maximize2, VolumeX, Volume2 } from 'lucide-react';

interface VideoHighlight {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  course_name: string;
  course_location: string;
  course_rank: number;
  media_url: string;
}

interface Top100VideoHighlightsProps {
  userId?: string;
}

const Top100VideoHighlights: React.FC<Top100VideoHighlightsProps> = ({ userId }) => {
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Function to extract video ID from Cloudflare Stream URL and generate thumbnail
  const getVideoThumbnail = (videoUrl: string) => {
    if (videoUrl.includes('cloudflarestream.com')) {
      // Extract video ID from HLS URL pattern
      const match = videoUrl.match(/cloudflarestream\.com\/([^/]+)\/manifest/);
      if (match && match[1]) {
        const videoId = match[1];
        const baseUrl = videoUrl.split('/manifest')[0];
        return `${baseUrl}/thumbnails/thumbnail.jpg`;
      }
    }
    return null;
  };
  const { data: videoHighlights = [], isLoading } = useQuery({
    queryKey: ['top100VideoHighlights', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          user_id,
          post_media!inner (
            media_url,
            media_type
          ),
          post_tags!inner (
            taggable_entities!inner (
              name,
              entity_id,
              entity_type
            )
          )
        `)
        .eq('user_id', userId)
        .eq('post_media.media_type', 'video')
        .eq('post_tags.taggable_entities.entity_type', 'golf_club')
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) {
        console.error('Error fetching video highlights:', error);
        return [];
      }

      // Filter for posts tagged with top 100 courses and get user details
      const processedHighlights: VideoHighlight[] = [];
      
      for (const post of data || []) {
        // Get course details to check ranking
        const courseId = post.post_tags[0]?.taggable_entities?.entity_id;
        if (!courseId) continue;

        const { data: courseData } = await supabase
          .from('golf_courses')
          .select('name, global_rank, regional_rank, usa_rank, country, region, sub_country')
          .eq('id', courseId)
          .single();

        // Check if course is in top 100 of any ranking
        const isTop100 = courseData && (
          (courseData.global_rank && courseData.global_rank <= 100) ||
          (courseData.regional_rank && courseData.regional_rank <= 100) ||
          (courseData.usa_rank && courseData.usa_rank <= 100)
        );

        if (!isTop100) continue;

        // Create location string
        const location = [courseData?.sub_country, courseData?.region, courseData?.country]
          .filter(Boolean)
          .join(', ');

        processedHighlights.push({
          id: post.id,
          content: post.content || '',
          created_at: post.created_at,
          user_id: post.user_id,
          course_name: courseData?.name || 'Unknown Course',
          course_location: location || 'Unknown Location',
          course_rank: courseData?.global_rank || courseData?.regional_rank || courseData?.usa_rank || 0,
          media_url: post.post_media[0]?.media_url || ''
        });

        if (processedHighlights.length >= 3) break;
      }

      return processedHighlights;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!userId
  });

  if (isLoading) {
    return (
      <div className="bg-white/20 backdrop-blur-sm rounded-[8px] px-4 py-3 border border-white/30">
        <div className="space-y-4">
          <div>
            <h3 className="font-bold text-lg text-white">Latest Highlights</h3>
            <p className="text-white/80 text-sm">Recent videos from Top 100 courses</p>
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                  <div className="w-16 h-12 bg-white/20 rounded"></div>
                  <div className="flex-1">
                    <div className="h-3 bg-white/20 rounded mb-1"></div>
                    <div className="h-2 bg-white/20 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/20 backdrop-blur-sm rounded-[8px] px-4 py-3 border border-white/30">
      <div className="space-y-4">
        <div>
          <h3 className="font-bold text-lg text-white">Latest Highlights</h3>
          <p className="text-white/80 text-sm">Recent videos from Top 100 courses</p>
        </div>
        
        {videoHighlights.length > 0 ? (
          <div className="space-y-2">
            {/* Show only the first video highlight */}
            {videoHighlights.slice(0, 1).map((highlight) => (
              <div
                key={highlight.id}
                className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-800/50 border border-white/20 hover:border-white/40 transition-all group"
              >
                {/* Video Player */}
                <video 
                  ref={videoRef}
                  src={highlight.media_url}
                  className="w-full h-full object-cover"
                  muted={isMuted}
                  autoPlay
                  loop
                  playsInline
                  preload="metadata"
                  poster={getVideoThumbnail(highlight.media_url) || undefined}
                />

              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-8 h-8 text-white/40 mx-auto mb-2 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            <p className="text-white/60 text-sm">No video highlights yet</p>
            <p className="text-white/40 text-xs">Be the first to share a moment!</p>
          </div>
        )}
        
      </div>
    </div>
  );
};

export default Top100VideoHighlights;