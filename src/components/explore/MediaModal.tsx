
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Heart, MessageCircle, Share, Volume2, VolumeX } from 'lucide-react';
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

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Share button clicked - Event type:', e.type);
    console.log('Touch support:', 'ontouchstart' in window);
    console.log('Navigator share available:', !!navigator.share);
    console.log('User agent:', navigator.userAgent);
    
    const shareData = {
      title: item.title || 'Check out this content',
      text: `Check out this ${item.type} from ${item.user?.name || 'clbhouz'}`,
      url: window.location.href
    };

    console.log('Share data:', shareData);

    try {
      // Check for Web Share API support
      if (navigator.share) {
        console.log('Web Share API available');
        
        // Check if the data can be shared
        if (navigator.canShare && !navigator.canShare(shareData)) {
          console.log('Share data not supported, falling back to clipboard');
          throw new Error('Share data not supported');
        }
        
        console.log('Attempting native share...');
        await navigator.share(shareData);
        console.log('Native share completed successfully');
        
        toast({
          title: "Shared successfully",
          description: "Content shared via native sharing",
        });
      } else {
        console.log('Web Share API not available, using clipboard fallback');
        throw new Error('Web Share API not supported');
      }
    } catch (error) {
      console.error('Share error:', error);
      console.log('Error name:', error instanceof Error ? error.name : 'Unknown');
      
      // Don't show error toast if user cancelled the share
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('User cancelled share dialog');
        return;
      }
      
      // Fallback to clipboard
      try {
        console.log('Attempting clipboard fallback...');
        await navigator.clipboard.writeText(window.location.href);
        console.log('Clipboard write successful');
        
        toast({
          title: "Link copied",
          description: "Link copied to clipboard",
        });
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError);
        
        // Final fallback - show a simple alert with the URL
        const url = window.location.href;
        if (window.confirm(`Copy this link to share:\n\n${url}\n\nClick OK to continue.`)) {
          console.log('User acknowledged share URL');
        }
        
        toast({
          title: "Manual copy required",
          description: "Please copy the URL from your browser's address bar",
          variant: "destructive",
        });
      }
    }
  };

  // Instant video setup when modal opens
  useEffect(() => {
    if (isOpen && item.type === 'video') {
      setVideoReady(false);
      
      const timer = setTimeout(() => {
        const video = document.getElementById('modal-video') as HTMLVideoElement;
        if (video) {
          // Preload and prepare for instant playback
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
      <DialogContent className="max-w-[100vw] max-h-[100vh] w-full h-full p-0 gap-0 flex items-center justify-center bg-black border-0 [&>button]:hidden">
        <DialogTitle className="sr-only">
          {item.title || `${item.type} content`}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {item.type === 'video' ? 'Video content' : 'Image content'} from {item.user?.name || 'user'}
        </DialogDescription>
        
        <div className="relative w-full h-full bg-black flex flex-col">
          {/* Top controls bar */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
            {/* Back button - top left */}
            <button 
              onClick={onClose}
              className="text-white min-w-[40px] min-h-[40px] flex items-center justify-center"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>

            {/* Mute/Unmute button - top right (only for videos) */}
            {item.type === 'video' && (
              <button
                onClick={toggleMute}
                className="text-white min-w-[40px] min-h-[40px] flex items-center justify-center"
              >
                {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
              </button>
            )}
          </div>

          {/* Media Content */}
          <div className="flex-1 flex items-center justify-center relative">
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
                />

                {/* Play/Pause indicator */}
                {!isPlaying && videoReady && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center cursor-pointer"
                    onClick={handleVideoClick}
                  >
                    <div className="w-16 h-16 bg-black/60 rounded-full flex items-center justify-center">
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
              />
            )}
          </div>

          {/* Bottom overlay with user info and actions */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
            <div className="flex items-center justify-between text-white">
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
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-white hover:bg-white/20 active:bg-white/30 transition-colors" 
                  onClick={handleShare}
                  onTouchStart={(e) => {
                    console.log('Touch start detected on share button');
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)';
                  }}
                  onTouchEnd={(e) => {
                    console.log('Touch end detected on share button');
                    e.currentTarget.style.backgroundColor = '';
                  }}
                >
                  <Share className="h-5 w-5" />
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
