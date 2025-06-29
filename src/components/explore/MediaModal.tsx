
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Heart, MessageCircle, Volume2, VolumeX } from 'lucide-react';
import { ExploreContentItem } from './types';
import { useToast } from '@/hooks/use-toast';

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ExploreContentItem | null;
}

const MediaModal = ({ isOpen, onClose, item }: MediaModalProps) => {
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const { toast } = useToast();

  if (!item) return null;

  const handleVideoClick = () => {
    const video = document.getElementById('modal-video') as HTMLVideoElement;
    if (video) {
      if (video.paused) {
        video.play();
        setIsPlaying(true);
      } else {
        video.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleMute = () => {
    const video = document.getElementById('modal-video') as HTMLVideoElement;
    if (video) {
      video.muted = !video.muted;
      setIsMuted(video.muted);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Instant video setup when modal opens
  useEffect(() => {
    if (isOpen && item.type === 'video') {
      setVideoReady(false);
      
      const timer = setTimeout(() => {
        const video = document.getElementById('modal-video') as HTMLVideoElement;
        if (video) {
          video.preload = 'auto';
          video.oncanplaythrough = () => {
            setVideoReady(true);
            video.play().then(() => {
              setIsPlaying(true);
            }).catch(() => {
              console.log('Autoplay blocked');
              setVideoReady(true);
            });
          };
          
          video.onloadeddata = () => {
            setVideoReady(true);
          };
        }
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, item.type]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="fixed inset-0 z-[9999] max-w-none max-h-none w-full h-full p-0 gap-0 bg-black/90 border-0 [&>button]:hidden"
        onClick={handleBackdropClick}
      >
        <DialogTitle className="sr-only">
          {item.title || `${item.type} content`}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {item.type === 'video' ? 'Video content' : 'Image content'} from {item.user?.name || 'user'}
        </DialogDescription>
        
        {/* Modal backdrop that prevents interaction with background */}
        <div className="fixed inset-0 bg-black/90 z-[10000]" onClick={handleBackdropClick} />
        
        {/* Content container */}
        <div className="relative w-full h-full flex flex-col overflow-hidden z-[10001]" onClick={(e) => e.stopPropagation()}>
          {/* Single close button - top right */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-[10002] text-white hover:text-gray-300 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-8 w-8" />
          </button>

          {/* Mute/Unmute button - top left (only for videos) */}
          {item.type === 'video' && (
            <button
              onClick={toggleMute}
              className="absolute top-4 left-4 z-[10002] text-white hover:text-gray-300 transition-colors"
            >
              {isMuted ? <VolumeX className="h-8 w-8" /> : <Volume2 className="h-8 w-8" />}
            </button>
          )}

          {/* Centered Media Content */}
          <div className="flex-1 flex items-center justify-center relative w-full h-full">
            {item.type === 'video' ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <video
                  id="modal-video"
                  src={item.src}
                  className="max-w-full max-h-full object-contain cursor-pointer"
                  muted={isMuted}
                  loop
                  playsInline
                  onClick={handleVideoClick}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  preload="auto"
                  style={{
                    width: 'auto',
                    height: 'auto',
                    maxWidth: '100vw',
                    maxHeight: '100vh'
                  }}
                />

                {/* Play/Pause indicator */}
                {!isPlaying && videoReady && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center cursor-pointer"
                    onClick={handleVideoClick}
                  >
                    <div className="w-16 h-16 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors">
                      <div className="w-0 h-0 border-l-[12px] border-l-white border-y-[8px] border-y-transparent ml-1"></div>
                    </div>
                  </div>
                )}

                {/* Loading indicator for video */}
                {!videoReady && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            ) : (
              <img
                src={item.src}
                alt={item.title || 'Content'}
                className="max-w-full max-h-full object-contain"
                style={{
                  width: 'auto',
                  height: 'auto',
                  maxWidth: '100vw',
                  maxHeight: '100vh'
                }}
              />
            )}
          </div>

          {/* Bottom overlay with user info and actions */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 z-[10002]">
            <div className="flex items-center justify-between text-white max-w-6xl mx-auto">
              <div className="flex items-center space-x-3">
                {item.user && (
                  <>
                    <img
                      src={item.user.avatar}
                      alt={item.user.name}
                      className="w-8 h-8 rounded-full border border-white/20"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
                      }}
                    />
                    <div>
                      <div className="font-semibold text-sm">{item.user.name}</div>
                      {item.title && (
                        <div className="text-xs text-white/80">{item.title}</div>
                      )}
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 hover:text-red-500">
                  <Heart className="h-5 w-5 mr-1" />
                  <span className="text-sm">{item.likes}</span>
                </Button>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <MessageCircle className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaModal;
