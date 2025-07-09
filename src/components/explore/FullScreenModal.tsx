import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Heart, MessageCircle, Share2, Volume2, VolumeX, ChevronUp, ChevronDown } from 'lucide-react';
import { ExploreContentItem } from './types';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
// VideoPlayer not needed - using native video element
import OptimizedImage from '@/components/ui/optimized-image';

interface FullScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialItem: ExploreContentItem;
  allContent: ExploreContentItem[];
  onLike: (contentId: string) => void;
}

const FullScreenModal: React.FC<FullScreenModalProps> = ({
  isOpen,
  onClose,
  initialItem,
  allContent,
  onLike
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Find initial index and filter content
  useEffect(() => {
    if (isOpen && initialItem) {
      const index = allContent.findIndex(item => item.id === initialItem.id);
      setCurrentIndex(index >= 0 ? index : 0);
    }
  }, [isOpen, initialItem, allContent]);

  const currentItem = allContent[currentIndex];

  // Swipe gesture handling
  const swipeRef = useSwipeGesture({
    onSwipeLeft: () => {
      // Handle swipe left if needed for future features
    },
    onSwipeRight: () => {
      // Handle swipe right if needed for future features
    },
    threshold: 50
  });

  // Navigate to next/previous item
  const goToNext = useCallback(() => {
    if (currentIndex < allContent.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, allContent.length]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowDown':
          e.preventDefault();
          goToNext();
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, goToNext, goToPrevious, onClose]);

  // Prevent background scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  // Auto-play video when modal opens
  useEffect(() => {
    if (isOpen && currentItem?.type === 'video' && videoRef.current) {
      videoRef.current.play().catch(console.error);
    }
  }, [isOpen, currentItem]);

  const handleLike = () => {
    if (currentItem) {
      onLike(currentItem.id);
    }
  };

  const handleShare = () => {
    if (navigator.share && currentItem) {
      navigator.share({
        title: currentItem.title,
        text: `Check out this ${currentItem.type} from ${currentItem.user?.name}`,
        url: window.location.href
      }).catch(console.error);
    }
  };

  const handleComment = () => {
    // Placeholder for comment functionality
    console.log('Comment clicked');
  };

  const renderCaption = (text: string) => {
    // Enhanced caption rendering with clickable mentions and hashtags
    return text.replace(
      /(@\w+|#\w+)/g,
      (match) => {
        if (match.startsWith('@')) {
          return `<span class="text-blue-400 cursor-pointer hover:underline">${match}</span>`;
        } else if (match.startsWith('#')) {
          return `<span class="text-blue-400 cursor-pointer hover:underline">${match}</span>`;
        }
        return match;
      }
    );
  };

  if (!isOpen || !currentItem) return null;

  return (
    <div 
      ref={modalRef}
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999
      }}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 flex items-center justify-center w-10 h-10 text-white hover:bg-white/10 rounded-full transition-colors"
        aria-label="Close"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Swipe Indicator */}
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 flex flex-col items-center space-y-2">
        {currentIndex > 0 && (
          <button
            onClick={goToPrevious}
            className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
        )}
        <div className="w-1 h-12 bg-white/30 rounded-full"></div>
        {currentIndex < allContent.length - 1 && (
          <button
            onClick={goToNext}
            className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Media Content */}
      <div 
        ref={swipeRef}
        className="relative w-full h-full flex items-center justify-center"
      >
        {currentItem.type === 'video' ? (
          <div className="relative w-full h-full max-w-4xl max-h-full">
            <video
              ref={videoRef}
              src={currentItem.src}
              autoPlay={true}
              muted={isMuted}
              loop={true}
              className="w-full h-full object-contain"
              playsInline
              controls={false}
            />
            
            {/* Video Controls */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="absolute top-4 left-4 z-10 flex items-center justify-center w-10 h-10 text-white bg-black/50 hover:bg-black/70 rounded-full transition-colors"
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
          </div>
        ) : (
          <OptimizedImage
            src={currentItem.src}
            alt={currentItem.title}
            className="max-w-full max-h-full object-contain"
            width={800}
            height={800}
          />
        )}
      </div>

      {/* User Info & Caption - Bottom Overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-6">
        <div className="flex justify-between items-end">
          {/* Left Side - User Info & Caption */}
          <div className="flex-1 max-w-[70%]">
            {currentItem.user && (
              <div className="flex items-center space-x-3 mb-3">
                <img
                  src={currentItem.user.avatar}
                  alt={currentItem.user.name}
                  className="w-10 h-10 rounded-full border-2 border-white/50"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
                  }}
                />
                <div>
                  <div className="text-white font-semibold text-lg flex items-center">
                    {currentItem.user.name}
                    {currentItem.user.verified && (
                      <span className="text-blue-400 ml-2">✓</span>
                    )}
                  </div>
                  {currentItem.user.username && (
                    <div className="text-white/70 text-sm">
                      @{currentItem.user.username}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {currentItem.title && (
              <div 
                className="text-white text-base leading-relaxed"
                dangerouslySetInnerHTML={{ __html: renderCaption(currentItem.title) }}
              />
            )}
          </div>

          {/* Right Side - Action Buttons */}
          <div className="flex flex-col space-y-4 items-center">
            {/* Like Button */}
            <button
              onClick={handleLike}
              className="flex flex-col items-center space-y-1 text-white hover:scale-110 transition-transform"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                <Heart className="h-6 w-6" />
              </div>
              <span className="text-xs font-medium">{currentItem.likes}</span>
            </button>

            {/* Comment Button */}
            <button
              onClick={handleComment}
              className="flex flex-col items-center space-y-1 text-white hover:scale-110 transition-transform"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                <MessageCircle className="h-6 w-6" />
              </div>
              <span className="text-xs font-medium">{currentItem.comments || 0}</span>
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="flex flex-col items-center space-y-1 text-white hover:scale-110 transition-transform"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                <Share2 className="h-6 w-6" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullScreenModal;