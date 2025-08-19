import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Sparkles } from 'lucide-react';
import { useAdaptiveGlass } from '@/hooks/useAdaptiveGlass';

interface FloatingAIButtonProps {
  onClick: () => void;
}

const FloatingAIButton: React.FC<FloatingAIButtonProps> = ({ onClick }) => {
  const { glassMode, glassStyles, sentinelRef } = useAdaptiveGlass();

  return (
    <>
      {/* Invisible sentinel for background sampling */}
      <div
        ref={sentinelRef}
        className="fixed bottom-24 right-4 w-16 h-16 pointer-events-none z-0"
        style={{ opacity: 0 }}
      />
      
      <Button
        onClick={onClick}
        className="fixed bottom-20 right-4 z-50 h-14 px-4 rounded-full text-white shadow-lg border-0 transition-all duration-300 hover:scale-105"
        style={{
          ...glassStyles,
          background: `var(--glass-bg)`,
          backdropFilter: `var(--glass-blur)`,
          border: `var(--glass-border)`,
          boxShadow: `var(--glass-shadow)`,
          color: `var(--glass-text)`,
        }}
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="text-lg">🏌️</span>
          </div>
          <span className="font-medium">clbhouz caddie AI</span>
        </div>
      </Button>
    </>
  );
};

export default FloatingAIButton;