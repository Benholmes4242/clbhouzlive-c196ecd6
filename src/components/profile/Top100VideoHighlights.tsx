import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, X, Maximize2, VolumeX, Volume2 } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';

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
        .limit(5); // Changed to 5 videos

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

        if (processedHighlights.length >= 5) break; // Up to 5 videos
      }

      return processedHighlights;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!userId
  });

  // Setup intersection observer for current video
  useEffect(() => {
    const currentVideo = videoRefs.current[currentIndex];
    if (!currentVideo || videoHighlights.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          // Video is in view, play it
          currentVideo.play().catch(console.error);
        } else {
          // Video is out of view, pause it
          currentVideo.pause();
        }
      },
      {
        threshold: 0.5, // Trigger when 50% of video is visible
      }
    );

    observer.observe(currentVideo);

    return () => {
      observer.disconnect();
    };
  }, [currentIndex, videoHighlights]);

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
    <div className="space-y-4">
      <div>
        <h3 className="font-bold text-lg text-foreground">Latest Highlights</h3>
        <p className="text-muted-foreground text-sm">Recent videos from Top 100 courses</p>
      </div>
      
      {videoHighlights.length > 0 ? (
        <div className="space-y-6">
          {/* Fan Deck Video Container */}
          <div 
            {...swipeHandlers}
            className="relative w-full h-[300px] md:h-[400px] overflow-visible"
            style={{ perspective: '1000px' }}
          >
            {videoHighlights.map((highlight, index) => {
              // Calculate fan deck positions
              const offset = index - currentIndex;
              const absOffset = Math.abs(offset);
              
              // Only show up to 5 videos in the fan deck
              const isVisible = absOffset <= 2;
              
              // Calculate positioning for fan deck effect
              const translateX = offset * 15; // Horizontal spread
              const translateY = absOffset * 8; // Vertical offset for depth
              const rotateY = offset * 6; // Rotation for fan effect
              const scale = 1 - (absOffset * 0.08); // Scale for depth
              const zIndex = 10 - absOffset; // Z-index for layering
              const opacity = index === currentIndex ? 1 : 0.8;
              
              return (
                <div
                  key={highlight.id}
                  className={`absolute inset-0 transition-all duration-500 ease-out cursor-pointer ${
                    isVisible ? 'pointer-events-auto' : 'pointer-events-none opacity-0'
                  }`}
                  style={{
                    transform: `translateX(${translateX}px) translateY(${translateY}px) rotateY(${rotateY}deg) scale(${scale})`,
                    zIndex,
                    opacity: isVisible ? opacity : 0,
                    transformOrigin: 'center center'
                  }}
                  onClick={() => setCurrentIndex(index)}
                >
                  <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden shadow-2xl">
                    <video
                      ref={(el) => {
                        if (el) videoRefs.current[index] = el;
                      }}
                      className="w-full h-full object-cover"
                      src={highlight.media_url}
                      muted={isMuted}
                      loop
                      playsInline
                      autoPlay={index === currentIndex}
                      poster={getVideoThumbnail(highlight.media_url) || undefined}
                    />
                    
                    {/* Video Info Overlay - Only show on current video */}
                    {index === currentIndex && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6">
                        <h4 className="text-white font-semibold text-base line-clamp-2">
                          {highlight.content}
                        </h4>
                        <p className="text-white/90 text-sm mt-2">
                          {highlight.course_name} • #{highlight.course_rank}
                        </p>
                        <p className="text-white/70 text-xs mt-1">
                          {highlight.course_location}
                        </p>
                      </div>
                    )}
                    
                    {/* Mute Toggle - Only show on current video */}
                    {index === currentIndex && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMuteToggle();
                        }}
                        className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                      >
                        {isMuted ? (
                          <VolumeX className="w-5 h-5" />
                        ) : (
                          <Volume2 className="w-5 h-5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* White Pagination Dots */}
          {videoHighlights.length > 1 && (
            <div className="flex justify-center space-x-3">
              {videoHighlights.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? 'bg-white scale-110' 
                      : 'bg-white/50 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
          <p className="text-muted-foreground text-sm">No video highlights yet</p>
          <p className="text-muted-foreground/60 text-xs">Be the first to share a moment!</p>
        </div>
      )}
    </div>
  );
};

export default Top100VideoHighlights;