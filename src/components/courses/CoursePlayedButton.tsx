import React from 'react';
import { Button } from '@/components/ui/button';
import { Circle, CheckCircle } from 'lucide-react';

interface CoursePlayedButtonProps {
  isPlayed: boolean;
  onAddToPlayed: () => void;
}

const CoursePlayedButton = ({ isPlayed, onAddToPlayed }: CoursePlayedButtonProps) => {
  return (
    <div className="absolute bottom-4 right-4 z-20">
      <Button
        onClick={onAddToPlayed}
        className={`${
          isPlayed 
            ? 'bg-white/20 hover:bg-white/30' 
            : 'bg-green-600 hover:bg-green-700'
        } backdrop-blur-sm border-0 text-white font-medium px-4 py-2 rounded-full transition-all duration-200`}
      >
        {isPlayed ? (
          <>
            <CheckCircle className="h-4 w-4 mr-2 fill-green-500 text-white" />
            Played
          </>
        ) : (
          <>
            <Circle className="h-4 w-4 mr-2" />
            Add to Played
          </>
        )}
      </Button>
    </div>
  );
};

export default CoursePlayedButton;