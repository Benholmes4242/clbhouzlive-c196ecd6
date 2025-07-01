
import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Maximize2 } from 'lucide-react';
import { SwipeCarousel } from '@/components/ui/swipe-carousel';
import CoursePostBadge from '../posts/CoursePostBadge';
import FullscreenMediaModal from '@/components/ui/fullscreen-media-modal';
import { useFullscreenMedia } from '@/hooks/useFullscreenMedia';

interface PostContentProps {
  content: {
    type: 'video' | 'image';
    description: string;
    thumbnail?: string;
    image?: string;
    images?: string[]; // Add support for multiple images
    duration?: string;
    videoUrl?: string;
    youtubeId?: string;
    golfCourse?: {
      id: string;
      name: string;
      country: string;
      region?: string;
    };
  };
  onVideoClick?: () => void;
  golfClubTags?: {
    id: string;
    entity_type: 'golf_club';
    entity_id: string;
    name: string;
    username: string | null;
  }[];
}

const PostContent = ({ content, onVideoClick, golfClubTags = [] }: PostContentProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const { isOpen, currentMedia, openMedia, closeMedia } = useFullscreenMedia();

  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (content.videoUrl && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(console.error);
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleYouTubeClick = () => {
    setIsPlaying(true);
  };

  // Get high quality YouTube thumbnail
  const getYouTubeThumbnail = (youtubeId: string) => {
    // Try different quality options in order of preference
    return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
  };

  const handleImageClick = (imageUrl: string) => {
    openMedia(imageUrl, 'image');
  };

  const handleVideoFullscreen = (videoUrl: string) => {
    openMedia(videoUrl, 'video');
  };

  // Get all images for carousel
  const getAllImages = () => {
    const images = [];
    if (content.image) images.push(content.image);
    if (content.images) images.push(...content.images);
    return images;
  };

  const allImages = getAllImages();

  // Create image elements with golf course pin overlay
  const createImageWithPin = (imageUrl: string, index: number) => (
    <div key={index} className="relative">
      <img
        src={imageUrl}
        alt={`Post content ${index + 1}`}
        className="w-full h-80 object-cover object-center cursor-pointer"
        loading="lazy"
        onClick={() => handleImageClick(imageUrl)}
      />
      {/* Golf Course Badge overlay */}
      {content.golfCourse && (
        <div className="absolute top-2 right-2 z-10">
          <CoursePostBadge 
            course={{
              id: content.golfCourse.id,
              name: content.golfCourse.name,
              country: content.golfCourse.country,
              region: content.golfCourse.region
            }}
            className="m-0"
          />
        </div>
      )}
      {golfClubTags.length > 0 && !content.golfCourse && (
        <div className="absolute top-2 right-2 z-10">
          <CoursePostBadge 
            course={{
              id: golfClubTags[0].entity_id,
              name: golfClubTags[0].name,
              country: 'Unknown',
              region: undefined
            }}
            className="m-0"
          />
        </div>
      )}
    </div>
  );

  return (
    <>
      <p className="text-sm mb-3">{content.description}</p>
      
      <div className="relative rounded-lg overflow-hidden mb-3">
        {content.type === 'video' ? (
          <div className="relative">
            {content.youtubeId ? (
              <>
                {!isPlaying ? (
                  <div 
                    className="relative cursor-pointer group"
                    onClick={handleYouTubeClick}
                  >
                    <img
                      src={content.thumbnail || getYouTubeThumbnail(content.youtubeId)}
                      alt="Video thumbnail"
                      className="w-full h-80 object-cover object-center"
                      loading="lazy"
                      onError={(e) => {
                        // Fallback to lower quality if maxres fails
                        const target = e.target as HTMLImageElement;
                        if (target.src.includes('maxresdefault')) {
                          target.src = `https://img.youtube.com/vi/${content.youtubeId}/hqdefault.jpg`;
                        } else if (target.src.includes('hqdefault')) {
                          target.src = `https://img.youtube.com/vi/${content.youtubeId}/mqdefault.jpg`;
                        }
                      }}
                    />
                    {/* Golf Course Badge overlay on video thumbnail */}
                    {content.golfCourse && (
                      <div className="absolute top-2 right-2 z-10">
                        <CoursePostBadge 
                          course={{
                            id: content.golfCourse.id,
                            name: content.golfCourse.name,
                            country: content.golfCourse.country,
                            region: content.golfCourse.region
                          }}
                          className="m-0"
                        />
                      </div>
                    )}
                    {golfClubTags.length > 0 && !content.golfCourse && (
                      <div className="absolute top-2 right-2 z-10">
                        <CoursePostBadge 
                          course={{
                            id: golfClubTags[0].entity_id,
                            name: golfClubTags[0].name,
                            country: 'Unknown',
                            region: undefined
                          }}
                          className="m-0"
                        />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/30 transition-all">
                      <div className="bg-white/90 rounded-full p-4 group-hover:scale-110 transition-transform shadow-lg">
                        <Play className="h-8 w-8 text-red-600 fill-current ml-1" />
                      </div>
                    </div>
                    {content.duration && (
                      <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded font-medium">
                        {content.duration}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <iframe
                      src={`https://www.youtube.com/embed/${content.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                      title="YouTube video player"
                      className="w-full h-80"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}
              </>
            ) : content.videoUrl ? (
              <div 
                className="relative"
                onMouseEnter={() => setShowControls(true)}
                onMouseLeave={() => setShowControls(false)}
              >
                <video
                  ref={videoRef}
                  src={content.videoUrl}
                  className="w-full h-80 object-cover object-center cursor-pointer"
                  onClick={handleVideoClick}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                />
                
                {/* Golf Course Badge overlay on video */}
                {content.golfCourse && (
                  <div className="absolute top-2 right-2 z-10">
                    <CoursePostBadge 
                      course={{
                        id: content.golfCourse.id,
                        name: content.golfCourse.name,
                        country: content.golfCourse.country,
                        region: content.golfCourse.region
                      }}
                      className="m-0"
                    />
                  </div>
                )}
                {golfClubTags.length > 0 && !content.golfCourse && (
                  <div className="absolute top-2 right-2 z-10">
                    <CoursePostBadge 
                      course={{
                        id: golfClubTags[0].entity_id,
                        name: golfClubTags[0].name,
                        country: 'Unknown',
                        region: undefined
                      }}
                      className="m-0"
                    />
                  </div>
                )}
                
                {/* Video Controls Overlay */}
                <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
                  <div 
                    className="bg-white/90 rounded-full p-3 hover:scale-110 transition-transform cursor-pointer"
                    onClick={handleVideoClick}
                  >
                    {isPlaying ? (
                      <Pause className="h-6 w-6 text-green-600" />
                    ) : (
                      <Play className="h-6 w-6 text-green-600 fill-current" />
                    )}
                  </div>
                </div>

                {/* Fullscreen Button */}
                <div className={`absolute top-2 left-2 transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                  <button
                    onClick={() => handleVideoFullscreen(content.videoUrl!)}
                    className="bg-black/70 text-white p-2 rounded-full hover:bg-black/80 transition-colors"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Duration Badge */}
                {content.duration && (
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {content.duration}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ) : allImages.length > 1 ? (
          // Multiple images - use SwipeCarousel with click handlers and pins
          <SwipeCarousel
            items={allImages.map((imageUrl, index) => createImageWithPin(imageUrl, index))}
            showDots={true}
            showArrows={false}
          />
        ) : allImages.length === 1 ? (
          // Single image with click handler and pin
          createImageWithPin(allImages[0], 0)
        ) : null}
      </div>

      {/* Fullscreen Media Modal */}
      <FullscreenMediaModal
        isOpen={isOpen}
        onClose={closeMedia}
        mediaUrl={currentMedia?.url || ''}
        mediaType={currentMedia?.type || 'image'}
        alt={currentMedia?.alt}
      />
    </>
  );
};

export default PostContent;
