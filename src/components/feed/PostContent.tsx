
import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Maximize2 } from 'lucide-react';

interface PostContentProps {
  content: {
    type: 'video' | 'image';
    description: string;
    thumbnail?: string;
    image?: string;
    duration?: string;
    videoUrl?: string;
    youtubeId?: string;
  };
  onVideoClick?: () => void;
}

const PostContent = ({ content, onVideoClick }: PostContentProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);

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
                      className="w-full h-80 object-cover"
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
                  className="w-full h-80 object-cover cursor-pointer"
                  onClick={handleVideoClick}
                  muted
                  loop
                  playsInline
                />
                
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
                <div className={`absolute top-2 right-2 transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                  <button
                    onClick={handleFullscreen}
                    className="bg-black/70 text-white p-2 rounded-full hover:bg-black/80 transition-colors"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Duration Badge */}
                {content.duration && (
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {content.duration}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ) : (
          <img
            src={content.image}
            alt="Post content"
            className="w-full h-80 object-cover"
          />
        )}
      </div>
    </>
  );
};

export default PostContent;
