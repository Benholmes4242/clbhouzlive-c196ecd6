import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { createPortal } from 'react-dom';

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  alt?: string;
}

interface MediaLightboxProps {
  items: MediaItem[];
  startIndex?: number;
  onClose: () => void;
}

const MediaLightbox: React.FC<MediaLightboxProps> = ({
  items,
  startIndex = 0,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const currentItem = items[currentIndex];

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowRight':
          setCurrentIndex((prev) => (prev + 1) % items.length);
          break;
        case 'ArrowLeft':
          setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items.length, onClose]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const nextItem = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const prevItem = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const lightboxContent = (
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors duration-200"
        aria-label="Close lightbox"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Navigation arrows */}
      {items.length > 1 && (
        <>
          <button
            onClick={prevItem}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors duration-200"
            aria-label="Previous media"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          
          <button
            onClick={nextItem}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors duration-200"
            aria-label="Next media"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Media content */}
      <div className="w-[92vw] max-w-5xl h-[92vh] flex items-center justify-center">
        {currentItem.type === 'image' ? (
          <img
            src={currentItem.url}
            alt={currentItem.alt || ''}
            className="max-w-full max-h-full object-contain rounded-2xl"
            loading="eager"
          />
        ) : (
          <video
            src={currentItem.url}
            controls
            autoPlay
            className="max-w-full max-h-full rounded-2xl"
            playsInline
          />
        )}
      </div>

      {/* Counter */}
      {items.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/50 text-white text-sm font-medium">
          {currentIndex + 1} / {items.length}
        </div>
      )}

      {/* Backdrop click to close */}
      <div
        className="absolute inset-0 -z-10"
        onClick={onClose}
        aria-label="Close lightbox"
      />
    </div>
  );

  // Try to render in modal portal if available, otherwise in document body
  const portalTarget = document.getElementById('modal-portal') || document.body;
  return createPortal(lightboxContent, portalTarget);
};

export default MediaLightbox;