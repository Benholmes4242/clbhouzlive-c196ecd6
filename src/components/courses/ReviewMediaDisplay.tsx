
import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

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

  if (!media || media.length === 0) return null;

  const handleMediaClick = (mediaItem: ReviewMedia) => {
    setSelectedMedia(mediaItem);
  };

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:-mx-6 md:px-6">
        {media.map((mediaItem) => (
          <div
            key={mediaItem.id}
            className="relative min-w-[120px] h-[120px] rounded-[12px] overflow-hidden bg-slate-200 cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0"
            onClick={() => handleMediaClick(mediaItem)}
          >
            {mediaItem.media_type === 'video' ? (
              <>
                <video
                  src={mediaItem.media_url}
                  className="w-full h-full object-cover"
                  preload="metadata"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <Play className="w-4 h-4 text-white fill-white" />
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
        ))}
      </div>

      {/* Lightbox Modal */}
      <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogTitle className="sr-only">Review Media Viewer</DialogTitle>
          {selectedMedia && (
            <div className="relative w-full h-full">
              {selectedMedia.media_type === 'video' ? (
                <video
                  src={selectedMedia.media_url}
                  controls
                  autoPlay
                  className="w-full h-full max-h-[80vh] object-contain"
                />
              ) : (
                <img
                  src={selectedMedia.media_url}
                  alt={selectedMedia.file_name || 'Review media'}
                  className="w-full h-full max-h-[80vh] object-contain"
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReviewMediaDisplay;
