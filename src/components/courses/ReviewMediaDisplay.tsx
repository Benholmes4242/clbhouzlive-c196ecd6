import React, { useState, useRef, useEffect } from 'react';
import { Play } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { HLSPlayer, HLSPlayerRef } from '@/media';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { generateStreamHlsUrl, generateStreamThumbnailUrl } from '@/config/cloudflareStream';
import { usePinchZoomPointer } from '@/hooks/usePinchZoomPointer';

interface ReviewMedia {
  id: string;
  media_url: string;
  media_type: 'image' | 'video';
  file_name?: string;
}

interface ReviewMediaDisplayProps {
  media: ReviewMedia[];
}

const ReviewMediaDisplay = ({ media }: ReviewMediaDisplayProps) => {
  const [selectedMedia, setSelectedMedia] = useState<ReviewMedia | null>(null);
  const playerRef = useRef<HLSPlayerRef>(null);
  const { ref: zoomRef, imgRef, style: zoomStyle, reset: resetZoom } = usePinchZoomPointer();

  // Reset zoom when changing media or closing
  useEffect(() => {
    resetZoom();
  }, [selectedMedia, resetZoom]);

  if (!media || media.length === 0) return null;

  const handleMediaClick = (mediaItem: ReviewMedia) => {
    setSelectedMedia(mediaItem);
  };

  const handleClose = () => {
    setSelectedMedia(null);
  };

  const getVideoProps = (mediaItem: ReviewMedia) => {
    const uid = uidFromNode({ src: mediaItem.media_url });
    if (uid) {
      return {
        hlsUrl: generateStreamHlsUrl(uid),
        poster: generateStreamThumbnailUrl(uid, { height: 600 }),
        mp4Fallback: mediaItem.media_url
      };
    }
    return {
      hlsUrl: null,
      poster: undefined,
      mp4Fallback: mediaItem.media_url
    };
  };

  return (
    <>
      <div className="mt-3 flex flex-wrap gap-2">
        {media.map((mediaItem) => {
          const videoProps = mediaItem.media_type === 'video' ? getVideoProps(mediaItem) : null;
          
          return (
            <div
              key={mediaItem.id}
              className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => handleMediaClick(mediaItem)}
            >
              {mediaItem.media_type === 'video' ? (
                <>
                  {videoProps?.poster ? (
                    <img
                      src={videoProps.poster}
                      alt={mediaItem.file_name || 'Video thumbnail'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={mediaItem.media_url}
                      className="w-full h-full object-cover"
                      preload="metadata"
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <Play className="w-3 h-3 text-white fill-white" />
                    </div>
                  </div>
                </>
              ) : (
                <img
                  src={mediaItem.media_url}
                  alt={mediaItem.file_name || 'Review media'}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Lightbox Modal */}
      <Dialog open={!!selectedMedia} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogTitle className="sr-only">Review Media Viewer</DialogTitle>
          {selectedMedia && (
            <div className="relative w-full h-full">
              {selectedMedia.media_type === 'video' ? (
                (() => {
                  const videoProps = getVideoProps(selectedMedia);
                  
                  if (videoProps.hlsUrl) {
                    return (
                      <div className="relative w-full h-full max-h-[80vh]">
                        <HLSPlayer
                          ref={playerRef}
                          src={videoProps.hlsUrl}
                          mp4FallbackUrl={videoProps.mp4Fallback}
                          muted={false}
                          autoplay={true}
                          className="w-full h-full max-h-[80vh] object-contain"
                        />
                      </div>
                    );
                  }
                  
                  return (
                    <video
                      src={selectedMedia.media_url}
                      controls
                      autoPlay
                      className="w-full h-full max-h-[80vh] object-contain"
                    />
                  );
                })()
              ) : (
                <div ref={zoomRef} style={zoomStyle} className="w-full h-full flex items-center justify-center">
                  <img
                    ref={imgRef}
                    src={selectedMedia.media_url}
                    alt={selectedMedia.file_name || 'Review media'}
                    className="w-full h-full max-h-[80vh] object-contain"
                    draggable={false}
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReviewMediaDisplay;
