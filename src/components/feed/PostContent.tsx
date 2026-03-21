import React, { useRef, useState, useId } from 'react';
import { Play } from 'lucide-react';
import { SwipeCarousel } from '@/components/ui/swipe-carousel';
import CoursePostBadge from '../posts/CoursePostBadge';
import EnhancedVideoPlayer from '@/components/ui/enhanced-video-player';
import LazyImage from '@/components/ui/lazy-image';
import { MediaRuntime } from '@/media/runtime/MediaRuntime';
import TaggedText from '@/components/posts/TaggedText';
import CourseLocationRow from '@/components/posts/CourseLocationRow';
import { useMediaViewer } from '@/hooks/useMediaViewer';

interface Tag {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  start_index?: number;
  end_index?: number;
}

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
      slug?: string;
    };
    /** Tags for @mentions */
    tags?: Tag[];
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
  const mediaId = useId();

  const { openViewer } = useMediaViewer();

  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (content.videoUrl && videoRef.current) {
      if (videoRef.current.paused) {
        MediaRuntime.requestPlay({ id: mediaId, surface: 'grid', reason: 'user' });
        setIsPlaying(true);
      } else {
        MediaRuntime.requestPause({ id: mediaId, reason: 'user' });
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

  const handleImageClick = (imageUrl: string, index: number = 0) => {
    // Transform to explore content items for unified player
    const allImages = getAllImages();
    const mediaItems = allImages.map((url, i) => ({
      id: `post-image-${i}`,
      type: 'image' as const,
      src: url,
      title: content.description?.slice(0, 50) || 'Image',
      likes: 0,
      golfCourse: content.golfCourse,
    }));
    console.log('[PostContent] handleImageClick fired', { imageUrl, index, mediaItems });
    openViewer(mediaItems, index);
    console.log('[PostContent] openViewer called');
  };

  const handleVideoFullscreen = (videoUrl: string) => {
    const mediaItems = [{
      id: 'post-video',
      type: 'video' as const,
      src: videoUrl,
      title: content.description?.slice(0, 50) || 'Video',
      likes: 0,
      golfCourse: content.golfCourse,
    }];
    console.log('[PostContent] handleVideoFullscreen fired', { videoUrl, mediaItems });
    openViewer(mediaItems, 0);
    console.log('[PostContent] openViewer called for video');
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
      <LazyImage
        src={imageUrl}
        alt={`Post content ${index + 1}`}
        className="w-full h-80 cursor-pointer"
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
              country: null,
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
      {/* Description with mention parsing */}
      <div className="mb-3">
        {content.tags && content.tags.length > 0 ? (
          <TaggedText 
            text={content.description} 
            tags={content.tags}
            className="text-sm"
          />
        ) : (
          <p className="text-sm">{content.description}</p>
        )}
        
        {/* Course CTA row */}
        {content.golfCourse && (
          <div className="mt-2">
            <CourseLocationRow 
              course={{
                id: content.golfCourse.id,
                name: content.golfCourse.name,
                country: content.golfCourse.country,
                region: content.golfCourse.region,
                slug: content.golfCourse.slug,
              }}
              showChevron={true}
            />
          </div>
        )}
      </div>
      
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
                    <LazyImage
                      src={content.thumbnail || getYouTubeThumbnail(content.youtubeId)}
                      alt="Video thumbnail"
                      className="w-full h-80"
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
                            country: null,
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
                <EnhancedVideoPlayer
                  src={content.videoUrl}
                  autoplay={false}
                  muted={true}
                  loop={true}
                  className="w-full h-80"
                  enableHLS={true}
                />
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
    </>
  );
};

export default PostContent;
