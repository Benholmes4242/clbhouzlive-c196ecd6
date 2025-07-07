import React, { useState, useEffect } from 'react';
import { Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface FloatingCTAProps {
  isVisible: boolean;
  onAddToPlayed: () => void;
}

const FloatingCTA = ({ isVisible, onAddToPlayed }: FloatingCTAProps) => {
  const [showButton, setShowButton] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isMobile) {
      setShowButton(false);
      return;
    }

    const handleScroll = () => {
      // Show button when user scrolls down past the hero section (400px)
      const shouldShow = window.scrollY > 400 && isVisible;
      setShowButton(shouldShow);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isVisible, isMobile]);

  if (!showButton) return null;

  return (
    <div className="fixed bottom-24 right-4 z-50 md:hidden">
      <Button
        onClick={onAddToPlayed}
        className="bg-green-600 hover:bg-green-700 text-white shadow-lg rounded-full px-4 py-2 text-base font-medium min-h-[44px]"
      >
        <Target className="h-4 w-4 mr-1" />
        Add to Played
      </Button>
    </div>
  );
};

export default FloatingCTA;