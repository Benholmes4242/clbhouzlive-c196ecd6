
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

  // Auto-play video when modal opens
  useEffect(() => {
    if (isOpen && item.type === 'video') {
      setVideoReady(false);
      setIsPlaying(false);
      
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
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, item.type]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed inset-0 z-50 flex items-center justify-center p-0 border-0 bg-black/95 max-w-none max-h-none w-full h-full [&>button]:hidden">
        <DialogTitle className="sr-only">
          {item.title || `${item.type} content`}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {item.type === 'video' ? 'Video content' : 'Image content'} from {item.user?.name || 'user'}
        </DialogDescription>
        
        {/* Close button - top right */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-50 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full p-2"
          aria-label="Close modal"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Mute/Unmute button - top left (only for videos) */}
        {item.type === 'video' && (
          <button
            onClick={toggleMute}
            className="absolute top-6 left-6 z-50 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full p-2"
          >
            {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
          </button>
        )}

        {/* Centered Media Content */}
        <div className="flex items-center justify-center w-full h-full p-8">
          {item.type === 'video' ? (
            <div className="relative flex items-center justify-center">
              <video
                id="modal-video"
                src={item.src}
                className="max-w-[85vw] max-h-[75vh] w-auto h-auto object-contain cursor-pointer"
                muted={isMuted}
                loop
                playsInline
                onClick={handleVideoClick}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                preload="auto"
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
              className="max-w-[85vw] max-h-[75vh] w-auto h-auto object-contain"
            />
          )}
        </div>

        {/* Bottom overlay with user info and actions */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6 z-40">
          <div className="flex items-center justify-between text-white max-w-6xl mx-auto">
            <div className="flex items-center space-x-3">
              {item.user && (
                <>
                  <img
                    src={item.user.avatar}
                    alt={item.user.name}
                    className="w-10 h-10 rounded-full border-2 border-white/30"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
                    }}
                  />
                  <div>
                    <div className="font-semibold text-base">{item.user.name}</div>
                    {item.title && (
                      <div className="text-sm text-white/80">{item.title}</div>
                    )}
                  </div>
                </>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 hover:text-red-500 rounded-full">
                <Heart className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">{item.likes}</span>
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 rounded-full">
                <MessageCircle className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaModal;
