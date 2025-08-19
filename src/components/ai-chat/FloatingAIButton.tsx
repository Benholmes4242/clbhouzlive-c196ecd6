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
        className="fixed bottom-24 right-6 z-50 h-12 px-3 py-2 rounded-full text-white shadow-lg border-0 transition-all duration-300 hover:scale-105"
        style={{
          ...glassStyles,
          background: `var(--glass-bg)`,
          backdropFilter: `var(--glass-blur)`,
          border: `var(--glass-border)`,
          boxShadow: `var(--glass-shadow)`,
          color: `var(--glass-text)`,
        }}
      >
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <span className="text-lg">🏌️</span>
          </div>
          <span className="font-medium text-lg">clbhouz caddie AI</span>
        </div>
      </Button>
    </>
  );
};

export default FloatingAIButton;