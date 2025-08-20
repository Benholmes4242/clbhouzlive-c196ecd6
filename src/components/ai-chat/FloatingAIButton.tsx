import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Sparkles } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAdaptiveGlass } from '@/hooks/useAdaptiveGlass';

interface FloatingAIButtonProps {
  onClick: () => void;
}

const FloatingAIButton: React.FC<FloatingAIButtonProps> = ({ onClick }) => {
  const { glassMode, glassStyles, sentinelRef } = useAdaptiveGlass();
  const location = useLocation();

  // Don't show on clubhouse page
  if (location.pathname === '/clubhouse' || location.pathname === '/') {
    return null;
  }

  return (
    <>
      {/* Invisible sentinel for background sampling */}
      <div
        ref={sentinelRef}
        className="fixed bottom-28 right-6 w-16 h-16 pointer-events-none z-0"
        style={{ opacity: 0 }}
      />
      
      <Button
        onClick={onClick}
        className="fixed bottom-24 right-6 z-50 transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-100 bg-white border border-black/[0.08] shadow-[0_2px_6px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
        style={{
          minHeight: '44px',
          minWidth: '44px',
        }}
        aria-label="Open Echo"
      >
        <div className="flex items-center gap-2">
          {/* Mobile: icon only, Tablet: compact label, Desktop: full label */}
          <span className="text-lg text-[#f7931e]">🤖</span>
          <span className="font-medium text-sm text-black hidden sm:inline lg:inline">
            Echo
          </span>
        </div>
      </Button>
    </>
  );
};

export default FloatingAIButton;