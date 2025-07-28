
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MediaCarouselProps {
  mediaUrls: string[];
  mediaTypes: string[];
  className?: string;
}

const MediaCarousel = ({ mediaUrls, mediaTypes, className = '' }: MediaCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const hasMultipleMedia = mediaUrls.length > 1;

  const handlePrevious = () => {
    setCurrentIndex(prev => prev > 0 ? prev - 1 : mediaUrls.length - 1);
  };

  const handleNext = () => {
    setCurrentIndex(prev => prev < mediaUrls.length - 1 ? prev + 1 : 0);
  };

  const getCurrentMedia = () => {
    const currentUrl = mediaUrls[currentIndex];
    const currentType = mediaTypes[currentIndex];
    const isVideo = currentType?.startsWith('video/');

    return (
      <div className="relative w-full h-full">
        {isVideo ? (
          <video
            src={currentUrl}
            className="w-full h-full object-cover"
            controls
            muted
            preload="metadata"
          />
        ) : (
          <img
            src={currentUrl}
            alt={`Media ${currentIndex + 1}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        )}
        
        {/* Navigation arrows for multiple media */}
        {hasMultipleMedia && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors z-10"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors z-10"
            >
              <ChevronRight size={20} />
            </button>
            
            {/* Media counter */}
            <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-sm z-10">
              {currentIndex + 1} / {mediaUrls.length}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className={`relative ${className}`}>
      {getCurrentMedia()}
      
      {/* Dots indicator */}
      {hasMultipleMedia && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1 z-10">
          {mediaUrls.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-black' : 'bg-black/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaCarousel;
