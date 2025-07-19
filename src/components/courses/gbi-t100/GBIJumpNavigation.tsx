import React from 'react';
import { Button } from '@/components/ui/button';

interface GBIJumpNavigationProps {
  totalCourses: number;
  currentIndex: number;
  onJumpTo: (index: number) => void;
}

const GBIJumpNavigation: React.FC<GBIJumpNavigationProps> = ({
  totalCourses,
  currentIndex,
  onJumpTo
}) => {
  // Generate jump points every 10 courses (1, 10, 20, 30, etc.)
  const jumpPoints = [];
  for (let i = 0; i < totalCourses; i += 10) {
    jumpPoints.push(i);
  }
  
  // Always include the last course if it's not already included
  if (jumpPoints[jumpPoints.length - 1] !== totalCourses - 1) {
    jumpPoints.push(totalCourses - 1);
  }

  // Determine which range the current index falls into
  const getCurrentRange = () => {
    for (let i = 0; i < jumpPoints.length - 1; i++) {
      if (currentIndex >= jumpPoints[i] && currentIndex < jumpPoints[i + 1]) {
        return i;
      }
    }
    return jumpPoints.length - 1; // Last range
  };

  const currentRange = getCurrentRange();

  return (
    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-40">
      <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2 space-y-1">
        {jumpPoints.map((index, i) => {
          const isInCurrentRange = i === currentRange || (i === currentRange + 1 && currentIndex >= jumpPoints[i]);
          const displayNumber = index === totalCourses - 1 ? totalCourses : index + 1;
          
          return (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              className={`
                w-10 h-8 p-0 text-xs font-medium transition-all
                ${isInCurrentRange 
                  ? 'bg-white text-black hover:bg-white/90' 
                  : 'text-white/70 hover:text-white hover:bg-white/20'
                }
              `}
              onClick={() => onJumpTo(index)}
            >
              {displayNumber}
            </Button>
          );
        })}
      </div>

      {/* Current position indicator */}
      <div className="text-center mt-2">
        <div className="bg-black/50 backdrop-blur-sm rounded px-2 py-1">
          <span className="text-white text-xs font-medium">
            #{currentIndex + 1}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GBIJumpNavigation;