import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import HLSVideoCard from '@/components/ui/HLSVideoCard';

interface HighlightsSectionProps {
  userId?: string;
  isOwnProfile?: boolean;
}

// Enhanced video element interface for HLS videos
interface HLSVideoElement extends HTMLVideoElement {
  attachHLS?: () => Promise<void>;
}

const HighlightsSection: React.FC<HighlightsSectionProps> = ({ 
  userId = '',
  isOwnProfile = false 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  // Video state management for exclusive playback
  const [videoMuteStates, setVideoMuteStates] = useState<Map<string, boolean>>(new Map());
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [firstCardId, setFirstCardId] = useState<string | null>(null);
  const [userInitiated, setUserInitiated] = useState(false);
  const videoRefs = useRef<Map<string, HLSVideoElement>>(new Map());
  
  // Track window width for responsive breakpoints
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Helper function to get mute state for a video (default to muted)
  const getVideoMuteState = useCallback((videoId: string) => {
    return videoMuteStates.get(videoId) ?? true; // Default to muted
  }, [videoMuteStates]);

  // Helper function to set mute state for a video
  const setVideoMuteState = useCallback((videoId: string, isMuted: boolean) => {
    setVideoMuteStates(prev => new Map(prev.set(videoId, isMuted)));
  }, []);

  // Video management functions
  const toggleMute = useCallback((videoId: string) => {
    const currentMuted = getVideoMuteState(videoId);
    const newMuted = !currentMuted;
    
    setVideoMuteState(videoId, newMuted);
    
    // Update the actual video element if it exists
    const video = videoRefs.current.get(videoId);
    if (video) {
      video.muted = newMuted;
    }
  }, [getVideoMuteState, setVideoMuteState]);

  const pauseAllVideos = useCallback(() => {
    videoRefs.current.forEach((video, videoId) => {
      if (!video.paused) {
        video.pause();
      }
      video.muted = true; // Ensure all non-active videos are muted
      // Reset stored mute state to muted for paused videos
      setVideoMuteState(videoId, true);
    });
  }, [setVideoMuteState]);

  const playExclusive = useCallback((videoId: string, isUserInitiated = true) => {
    const targetVideo = videoRefs.current.get(videoId);
    if (!targetVideo) {
      return;
    }

    // If user-initiated and there's a currently playing video, transfer its audio state
    let shouldTransferAudio = false;
    let transferredMuteState = true; // default to muted
    
    if (isUserInitiated && playingVideoId && playingVideoId !== videoId) {
      const currentPlayingVideo = videoRefs.current.get(playingVideoId);
      if (currentPlayingVideo) {
        // Transfer the current audio state to the new video
        transferredMuteState = !currentPlayingVideo.muted; // invert because we want to transfer the unmuted state
        shouldTransferAudio = true;
      }
    }

    // Pause all other videos first (this will mute them)
    pauseAllVideos();

    // Set state
    setPlayingVideoId(videoId);
    setUserInitiated(isUserInitiated);

    // Attach HLS if needed and play
    const playVideo = async () => {
      try {
        if (targetVideo.attachHLS) {
          await targetVideo.attachHLS();
        }
        
        // Configure mute state - use transferred state if applicable, otherwise use stored state
        let videoMuted;
        if (shouldTransferAudio) {
          videoMuted = transferredMuteState;
          // Update the stored mute state for this video
          setVideoMuteState(videoId, transferredMuteState);
        } else {
          videoMuted = getVideoMuteState(videoId);
        }
        
        targetVideo.muted = videoMuted;
        targetVideo.loop = true;
        await targetVideo.play();
        
      } catch (error) {
        console.error('Failed to play video:', videoId, error);
      }
    };

    playVideo();
  }, [pauseAllVideos, getVideoMuteState, setVideoMuteState, playingVideoId]);

  const pauseVideo = useCallback((videoId: string) => {
    const targetVideo = videoRefs.current.get(videoId);
    if (targetVideo && !targetVideo.paused) {
      targetVideo.pause();
    }
    
    if (playingVideoId === videoId) {
      setPlayingVideoId(null);
      setUserInitiated(false);
      
      // Resume first card autoplay if available
      if (firstCardId && firstCardId !== videoId) {
        setTimeout(() => playExclusive(firstCardId, false), 100);
      }
    }
  }, [playingVideoId, firstCardId, playExclusive]);

  const registerVideo = useCallback((videoId: string, video: HLSVideoElement) => {
    // Prevent duplicate registration
    if (videoRefs.current.has(videoId)) {
      return () => {}; // Return empty cleanup silently
    }
    
    // Ensure video is a valid HTMLVideoElement
    if (!video || typeof video.addEventListener !== 'function') {
      console.error('Invalid video element:', video);
      return () => {}; // Return empty cleanup function
    }
    
    videoRefs.current.set(videoId, video);
    
    // Set initial mute state (default to muted)
    const videoMuted = getVideoMuteState(videoId);
    video.muted = videoMuted;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'metadata';
    
    // Attach HLS source if video has attachHLS method
    if (video.attachHLS) {
      video.attachHLS().catch(console.error);
    }
    
    // Set up event listeners
    const handleEnded = () => {
      if (playingVideoId === videoId) {
        if (videoId === firstCardId) {
          // First card ended, restart it
          video.currentTime = 0;
          video.play().catch(console.error);
        } else {
          // Non-first card ended, resume first card
          setPlayingVideoId(null);
          setUserInitiated(false);
          if (firstCardId) {
            setTimeout(() => playExclusive(firstCardId, false), 100);
          }
        }
      }
    };

    const handlePlay = () => {
      // Ensure exclusivity when any video starts playing
      if (playingVideoId && playingVideoId !== videoId) {
        pauseAllVideos();
      }
      setPlayingVideoId(videoId);
    };

    const handlePause = () => {
      // Video paused
    };

    video.addEventListener('ended', handleEnded);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    
    return () => {
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      videoRefs.current.delete(videoId);
    };
  }, [getVideoMuteState, playingVideoId, firstCardId, playExclusive, pauseAllVideos]);

  // Calculate cards per view for Highlights
  const getCardsPerView = () => {
    if (windowWidth >= 1200) return 3; // Desktop: 3 cards
    if (windowWidth >= 1024) return 3; // Laptop: 3 cards  
    if (windowWidth >= 768) return 2;  // Tablet: 2 cards
    return 1; // Mobile: 1 with peek
  };
  
  const cardsPerView = getCardsPerView();

  // Query to get courses from videos tagged at top 100 courses
  const { data: allPlayedCourses = [] } = useQuery({
    queryKey: ['highlightsCourses', userId],
    queryFn: async () => {
      if (!userId) {
        return [];
      }

      // Get all posts with video media
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          post_media!inner (
            id,
            media_type,
            media_url
          )
        `)
        .eq('user_id', userId)
        .eq('post_media.media_type', 'video')
        .order('created_at', { ascending: false });
      
      if (!posts || posts.length === 0) {
        return [];
      }

      // Get post tags for these posts
      const postIds = posts.map(p => p.id);
      const { data: tags, error: tagsError } = await supabase
        .from('post_tags')
        .select(`
          post_id,
          taggable_entities!inner (
            entity_type,
            entity_id,
            name
          )
        `)
        .in('post_id', postIds)
        .eq('taggable_entities.entity_type', 'golf_club');

      if (tagsError) throw tagsError;

      // Get golf course details for tagged courses
      const courseIds = tags?.map(tag => tag.taggable_entities.entity_id) || [];
      if (courseIds.length === 0) {
        return [];
      }

      const { data: courses, error: coursesError } = await supabase
        .from('golf_courses')
        .select(`
          id,
          name,
          country,
          region,
          sub_country,
          continent,
          global_rank,
          regional_rank,
          usa_rank,
          description,
          thumbnail_image
        `)
        .in('id', courseIds)
        .or('global_rank.not.is.null,regional_rank.not.is.null,usa_rank.not.is.null'); // Only top 100 courses

      if (coursesError) throw coursesError;

      // Transform posts into course format for existing card structure
      const courseData = posts
        .map(post => {
          // Find the tag for this post
          const postTag = tags?.find(tag => tag.post_id === post.id);
          if (!postTag) return null;

          // Find the course details
          const course = courses?.find(c => c.id === postTag.taggable_entities.entity_id);
          if (!course) return null;

          // Get the video media for this post
          const videoMedia = post.post_media?.find(media => media.media_type === 'video');
          if (!videoMedia) return null;

          return {
            course_id: course.id,
            post_id: post.id,
            video_url: videoMedia.media_url,
            played_date: post.created_at,
            golf_courses: course,
            rating: null, // No rating for highlight videos
            id: `highlight-${post.id}` // Unique ID
          };
        })
        .filter(Boolean); // Remove null entries

      return courseData.slice(0, 20); // Limit to 20 most recent
    },
    enabled: !!userId,
  });

  // Auto-play first card
  useEffect(() => {
    if (firstCardId && !userInitiated) {
      playExclusive(firstCardId, false);
    }
  }, [firstCardId, userInitiated, playExclusive]);

  // Set first card ID when courses load
  useEffect(() => {
    if (allPlayedCourses.length > 0 && !firstCardId) {
      const firstCourseId = `highlight-${allPlayedCourses[0].post_id}`;
      setFirstCardId(firstCourseId);
    }
  }, [allPlayedCourses, firstCardId]);

  const maxIndex = Math.max(0, allPlayedCourses.length - cardsPerView);

  const nextSlide = () => {
    setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  if (allPlayedCourses.length === 0) {
    return null; // Don't render if no video highlights
  }

  return (
    <div className="w-full px-4 pt-6 pb-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg sm:text-xl md:text-2xl lg:text-2xl xl:text-2xl text-foreground">
            Highlights from my Journey
          </h3>
          
          {/* Navigation arrows */}
          {allPlayedCourses.length > cardsPerView && (
            <div className="flex gap-2">
              <button
                onClick={prevSlide}
                disabled={currentIndex === 0}
                className="p-2 rounded-full bg-white shadow-sm border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition-shadow"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextSlide}
                disabled={currentIndex >= maxIndex}
                className="p-2 rounded-full bg-white shadow-sm border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition-shadow"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Video cards carousel */}
        <div className="relative overflow-hidden">
          <div 
            className="flex gap-4 transition-transform duration-300 ease-out"
            style={{ 
              transform: `translateX(-${currentIndex * (100 / cardsPerView)}%)`,
              width: `${(allPlayedCourses.length / cardsPerView) * 100}%`
            }}
          >
            {allPlayedCourses.map((courseData, index) => {
              const course = courseData.golf_courses;
              if (!course || !courseData.video_url) return null;

              const videoId = `highlight-${courseData.post_id}`;

              return (
                <div 
                  key={videoId}
                  className="flex-shrink-0"
                  style={{ width: `${100 / allPlayedCourses.length}%` }}
                >
                  <HLSVideoCard
                    ref={(video) => video && registerVideo(videoId, video)}
                    hlsUrl={courseData.video_url}
                    className="w-full aspect-video rounded-lg overflow-hidden cursor-pointer"
                    onClick={() => playExclusive(videoId, true)}
                    muted={getVideoMuteState(videoId)}
                    externallyManaged={true}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HighlightsSection;