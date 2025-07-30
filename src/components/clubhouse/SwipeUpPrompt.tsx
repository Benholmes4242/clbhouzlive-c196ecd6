import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

interface SwipeUpPromptProps {
  isVisible: boolean;
  onDismiss: () => void;
}

export const SwipeUpPrompt: React.FC<SwipeUpPromptProps> = ({ 
  isVisible, 
  onDismiss 
}) => {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldShow(true);
      
      // Auto-hide after 8 seconds
      const timer = setTimeout(() => {
        setShouldShow(false);
        setTimeout(onDismiss, 300); // Wait for fade-out animation
      }, 8000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onDismiss]);

  if (!isVisible) return null;

  return (
    <div 
      className={`
        fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50
        flex flex-col items-center gap-2 px-4 py-3
        bg-black/30 backdrop-blur-sm rounded-2xl
        transition-all duration-300 ease-out
        ${shouldShow ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
      style={{
        animation: shouldShow ? 'gentle-pulse 4s ease-in-out infinite' : 'none'
      }}
    >
      {/* Animated Arrow */}
      <ChevronUp 
        className="w-6 h-6 text-white animate-bounce" 
        style={{
          filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))',
          animationDuration: '2s'
        }}
      />
      
      {/* Text */}
      <span 
        className="text-white text-sm font-medium text-center"
        style={{ 
          textShadow: '0 1px 3px rgba(0,0,0,0.5)' 
        }}
      >
        Swipe up to see more
      </span>
      
      {/* Global styles for the pulse animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes gentle-pulse {
            0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.9; }
            50% { transform: translateX(-50%) scale(1.02); opacity: 1; }
          }
        `
      }} />
    </div>
  );
};