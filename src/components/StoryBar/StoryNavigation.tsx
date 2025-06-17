
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface StoryNavigationProps {
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

const StoryNavigation: React.FC<StoryNavigationProps> = ({
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext
}) => {
  return (
    <>
      {/* Previous button */}
      {canGoPrevious && (
        <button
          onClick={onPrevious}
          className="absolute left-0 z-10 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
          aria-label="Previous stories"
        >
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        </button>
      )}

      {/* Next button */}
      {canGoNext && (
        <button
          onClick={onNext}
          className="absolute right-0 z-10 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
          aria-label="Next stories"
        >
          <ChevronRight className="h-4 w-4 text-gray-600" />
        </button>
      )}
    </>
  );
};

export default StoryNavigation;
