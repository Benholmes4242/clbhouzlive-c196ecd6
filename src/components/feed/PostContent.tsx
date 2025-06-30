
import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Maximize2 } from 'lucide-react';
import { SwipeCarousel } from '@/components/ui/swipe-carousel';
import CoursePostBadge from '../posts/CoursePostBadge';
import EmojiReactions from '../posts/EmojiReactions';
import InlineCommentPreview from '../posts/InlineCommentPreview';
import FullscreenMediaModal from '@/components/ui/fullscreen-media-modal';
import { useFullscreenMedia } from '@/hooks/useFullscreenMedia';
import { Button } from '@/components/ui/button';

interface PostContentProps {
  content: {
    type: 'video' | 'image';
    description: string;
    thumbnail?: string;
    image?: string;
    images?: string[];
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
  postId?: string;
}

const PostContent = ({ content, onVideoClick, golfClubTags = [], postId = 'post' }: PostContentProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { isOpen, currentMedia, openMedia, closeMedia } = useFullscreenMedia();

  // Handle caption truncation
  const shouldTruncate = content.description && content.description.length > 150;
  const displayDescription = shouldTruncate && !isExpanded 
    ? content.description.substring(0, 150) + '...' 
    : content.description;

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

  const getYouTubeThumbnail = (youtubeId: string) => {
    return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
  };

  const handleImageClick = (imageUrl: string) => {
    openMedia(imageUrl, 'image');
  };

  const handleVideoFullscreen = (videoUrl: string) => {
    openMedia(videoUrl, 'video');
  };

  const getAllImages = () => {
    const images = [];
    if (content.image) images.push(content.image);
    if (content.images) images.push(...content.images);
    return images;
  };

  const allImages = getAllImages();

  return (
    <>
      {/* Golf Course Badge - Show above media when available from either source */}
      {(content.golfCourse || golfClubTags.length > 0) && (
        <div className="mb-3">
          {content.golfCourse && (
            <CoursePostBadge course={content.golfCourse} />
          )}
          {golfClubTags.map((tag) => (
            <CoursePostBadge
              key={tag.id}
              course={{
                id: tag.entity_id,
                name: tag.name,
                country: 'Scotland',
                region: undefined
              }}
              className="mb-2 last:mb-0"
            />
          ))}
        </div>
      )}
      
      {/* Media Content with improved centering */}
      <div className="relative rounded-lg overflow-hidden mb-3 bg-black">
        {content.type === 'video' ? (
          <div className="relative aspect-square">
            {content.youtubeId ? (
              <>
                {!isPlaying ? (
                  <div 
                    className="relative cursor-pointer group h-full"
                    onClick={handleYouTubeClick}
                  >
                    <img
                      src={content.thumbnail || getYouTubeThumbnail(content.youtubeId)}
                      alt="Video thumbnail"
                      className="w-full h-full object-contain"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src.includes('maxresdefault')) {
                          target.src = `https://img.youtube.com/vi/${content.youtubeId}/hqdefault.jpg`;
                        } else if (target.src.includes('hqdefault')) {
                          target.src = `https://img.youtube.com/vi/${content.youtubeId}/mqdefault.jpg`;
                        }
                      }}
                    />
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
                  <div className="relative h-full">
                    <iframe
                      src={`https://www.youtube.com/embed/${content.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                      title="YouTube video player"
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}
              </>
            ) : content.videoUrl ? (
              <div 
                className="relative h-full flex items-center justify-center"
                onMouseEnter={() => setShowControls(true)}
                onMouseLeave={() => setShowControls(false)}
              >
                <video
                  ref={videoRef}
                  src={content.videoUrl}
                  className="w-full h-full object-contain cursor-pointer"
                  onClick={handleVideoClick}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                />
                
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

                <div className={`absolute top-2 right-2 transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                  <button
                    onClick={() => handleVideoFullscreen(content.videoUrl!)}
                    className="bg-black/70 text-white p-2 rounded-full hover:bg-black/80 transition-colors"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                </div>

                {content.duration && (
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {content.duration}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ) : allImages.length > 1 ? (
          <div className="aspect-square">
            <SwipeCarousel
              items={allImages.map((imageUrl, index) => (
                <div key={index} className="w-full h-full bg-black flex items-center justify-center">
                  <img
                    src={imageUrl}
                    alt={`Post content ${index + 1}`}
                    className="w-full h-full object-contain cursor-pointer"
                    loading="lazy"
                    onClick={() => handleImageClick(imageUrl)}
                  />
                </div>
              ))}
              showDots={true}
              showArrows={false}
            />
          </div>
        ) : allImages.length === 1 ? (
          <div className="aspect-square flex items-center justify-center">
            <img
              src={allImages[0]}
              alt="Post content"
              className="w-full h-full object-contain cursor-pointer"
              loading="lazy"
              onClick={() => handleImageClick(allImages[0])}
            />
          </div>
        ) : null}
      </div>

      {/* Post Description with Threaded Caption */}
      <div className="text-sm mb-3">
        <p>{displayDescription}</p>
        {shouldTruncate && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground p-0 h-auto font-normal text-sm ml-1"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Show less' : 'Read more...'}
          </Button>
        )}
      </div>

      {/* Emoji Reactions */}
      <EmojiReactions 
        postId={postId}
        onReact={(emoji) => console.log('Reacted with:', emoji, 'to post:', postId)}
      />

      {/* Inline Comment Preview */}
      <InlineCommentPreview 
        postId={postId}
        onViewAllComments={() => console.log('View all comments for post:', postId)}
      />

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
