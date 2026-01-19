import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, X, Maximize2, VolumeX, Volume2 } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
// REMOVED: safePlay import - playback is now handled by HLSPlayer autoplay

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
  badgeText?: string;
}

const Top100VideoHighlights: React.FC<Top100VideoHighlightsProps> = ({ userId, badgeText = 'My Highlights' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const handleMuteToggle = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    // Apply mute state to all videos
    videoRefs.current.forEach(video => {
      if (video) {
        video.muted = newMutedState;
      }
    });
  };

  // Function to extract video ID from Cloudflare Stream URL and generate thumbnail
  const getVideoThumbnail = (videoUrl: string) => {
    if (videoUrl.includes('cloudflarestream.com')) {
      // Extract video ID from HLS URL pattern
      const match = videoUrl.match(/cloudflarestream\.com\/([^/]+)\/manifest/);
      if (match && match[1]) {
        const videoId = match[1];
        const baseUrl = videoUrl.split('/manifest')[0];
        // IMPORTANT: Use fit=crop (NOT fit=cover) - Cloudflare only supports: clip, scale, crop, fill, fillmax
        return `${baseUrl}/thumbnails/thumbnail.jpg?time=1s&fit=crop`;
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
          course_id,
          badges,
          post_media!inner (
            media_url,
            media_type,
            filter_id,
            studio_edits
          ),
          post_tags (
            taggable_entities (
              name,
              entity_id,
              entity_type
            )
          )
        `)
        .eq('user_id', userId)
        .eq('post_media.media_type', 'video')
        .order('created_at', { ascending: false })
        .limit(20); // Fetch more, then filter for top 100

      if (error) {
        console.error('Error fetching video highlights:', error);
        return [];
      }

      // Filter for posts tagged with top 100 courses and get user details
      const processedHighlights: VideoHighlight[] = [];
      
      for (const post of data || []) {
        // Get course ID from tags OR direct course_id FK
        const golfClubTag = post.post_tags?.find(
          (tag: any) => tag.taggable_entities?.entity_type === 'golf_club'
        );
        const courseId = golfClubTag?.taggable_entities?.entity_id || post.course_id;
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

        if (processedHighlights.length >= 5) break; // Up to 5 videos
      }

      return processedHighlights;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!userId
  });

  // REMOVED: IntersectionObserver for autoplay
  // Playback control is now MediaRuntime's responsibility.
  // This component's video section has been removed anyway.

  // Handle swipe navigation
  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % videoHighlights.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + videoHighlights.length) % videoHighlights.length);
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: goToNext,
    onSwipedRight: goToPrevious,
    trackMouse: true
  });

  if (isLoading) {
    return (
      <div className="bg-black/40 backdrop-blur-sm rounded-[8px] px-4 py-3 border border-black/20">
        <div className="space-y-4">
          <div>
            <h3 className="font-bold text-lg text-white">Highlights & Achievements</h3>
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
    <div className="space-y-4">
      {/* This component is now empty - video highlights section removed */}
      <div className="text-center py-8">
        <p className="text-muted-foreground text-sm">Video highlights section removed</p>
      </div>
    </div>
  );
};

export default Top100VideoHighlights;