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
        className="fixed bottom-24 right-6 z-50 h-12 px-3 py-2 rounded-full text-white shadow-lg transition-all duration-300 hover:scale-105"
        style={{
          ...glassStyles,
          background: `var(--glass-bg)`,
          backdropFilter: `var(--glass-blur)`,
          boxShadow: `var(--glass-shadow)`,
          color: `var(--glass-text)`,
        }}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-lg">💬</span>
          <span className="font-medium text-lg">Ask Your Caddie</span>
        </div>
      </Button>
    </>
  );
};

export default FloatingAIButton;