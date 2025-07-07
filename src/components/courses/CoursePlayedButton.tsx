import React from 'react';
import { Button } from '@/components/ui/button';
import { Target } from 'lucide-react';

interface CoursePlayedButtonProps {
  isPlayed: boolean;
  onAddToPlayed: () => void;
}

const CoursePlayedButton = ({ isPlayed, onAddToPlayed }: CoursePlayedButtonProps) => {
  return (
    <div className="absolute bottom-6 right-4 z-20">
      <Button
        onClick={onAddToPlayed}
        className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-0 text-white font-medium px-4 py-2 rounded-full transition-all duration-200"
      >
        <>
          <Target className="h-4 w-4 mr-2" />
          {isPlayed ? 'Played' : 'Add to Played'}
        </>
      </Button>
    </div>
  );
};

export default CoursePlayedButton;