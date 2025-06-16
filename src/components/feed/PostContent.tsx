
import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause } from 'lucide-react';

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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showThumbnail, setShowThumbnail] = useState(true);

  const handleVideoClick = () => {
    if (content.youtubeId) {
      setShowThumbnail(false);
      setIsPlaying(true);
    } else if (content.videoUrl && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && videoRef.current && content.videoUrl) {
            videoRef.current.play();
            setIsPlaying(true);
          } else if (!entry.isIntersecting && videoRef.current && content.videoUrl) {
            videoRef.current.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.5 }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current);
      }
    };
  }, [content.videoUrl]);

  return (
    <>
      <p className="text-sm mb-3">{content.description}</p>
      
      <div className="relative rounded-lg overflow-hidden mb-3">
        {content.type === 'video' ? (
          <div className="relative">
            {content.youtubeId ? (
              <>
                {showThumbnail ? (
                  <div 
                    className="relative cursor-pointer group"
                    onClick={handleVideoClick}
                  >
                    <img
                      src={content.thumbnail}
                      alt="Video thumbnail"
                      className="w-full h-80 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/30 transition-all">
                      <div className="bg-white/90 rounded-full p-3 group-hover:scale-110 transition-transform">
                        <Play className="h-6 w-6 text-green-600 fill-current" />
                      </div>
                    </div>
                    {content.duration && (
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {content.duration}
                      </div>
                    )}
                  </div>
                ) : (
                  <iframe
                    ref={iframeRef}
                    src={`https://www.youtube.com/embed/${content.youtubeId}?autoplay=1`}
                    title="YouTube video player"
                    className="w-full h-80"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )}
              </>
            ) : content.videoUrl ? (
              <div className="relative">
                <video
                  ref={videoRef}
                  src={content.videoUrl}
                  className="w-full h-80 object-cover cursor-pointer"
                  onClick={handleVideoClick}
                  muted
                  loop
                />
                <div 
                  className="absolute inset-0 flex items-center justify-center cursor-pointer"
                  onClick={handleVideoClick}
                >
                  <div className="bg-white/90 rounded-full p-3 hover:scale-110 transition-transform">
                    {isPlaying ? (
                      <Pause className="h-6 w-6 text-green-600" />
                    ) : (
                      <Play className="h-6 w-6 text-green-600 fill-current" />
                    )}
                  </div>
                </div>
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
