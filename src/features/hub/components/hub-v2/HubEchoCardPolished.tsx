/**
 * HubEchoCardPolished - Apple-Grade Echo Card
 * Solid warm white, layered shadows, precise Apple typography
 */

import { useState, useCallback } from 'react';
import { ChevronRight, Mic, Send, Lightbulb, Sparkles } from 'lucide-react';
import { haptic } from '@/utils/haptics';

interface HubEchoCardPolishedProps {
  onOpenEcho: (initialPrompt?: string) => void;
  recentContext?: string | null;
}

// Quick prompt pills
const QUICK_PROMPTS = [
  "Find a course",
  "Weather",
  "Trip ideas",
];

// ============ Apple System Colors ============
const APPLE_COLORS = {
  label: '#1D1D1F',
  secondaryLabel: '#86868B',
  tertiaryLabel: '#AEAEB2',
  separator: '#E5E5EA',
  systemOrange: '#FF9500',
  systemGray6: '#F2F2F7',
  warmBackground: '#FFFBF5',
  whisperBorder: '#F0E6D9',
  aiBadgeBg: '#FFF0D6',
  aiBadgeText: '#CC7700',
};

// ============ Main Component ============

export function HubEchoCardPolished({ onOpenEcho, recentContext }: HubEchoCardPolishedProps) {
  const [inputValue, setInputValue] = useState('');
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  
  const hasText = inputValue.trim().length > 0;
  
  const handleSubmit = useCallback(() => {
    if (hasText) {
      haptic('light');
      onOpenEcho(inputValue.trim());
      setInputValue('');
    } else {
      // Mic button behavior when no text
      haptic('medium');
      onOpenEcho();
    }
  }, [hasText, inputValue, onOpenEcho]);
  
  const handlePromptClick = useCallback((prompt: string) => {
    haptic('light');
    setActivePrompt(prompt);
    onOpenEcho(prompt);
    // Reset after animation
    setTimeout(() => setActivePrompt(null), 300);
  }, [onOpenEcho]);
  
  const handleWhisperClick = useCallback(() => {
    haptic('light');
    onOpenEcho("Perfect morning for golf — check today's weather");
  }, [onOpenEcho]);

  return (
    <div 
      className="h-full flex flex-col rounded-[20px] overflow-hidden"
      style={{
        backgroundColor: APPLE_COLORS.warmBackground,
        boxShadow: '0 0 0 1px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)',
      }}
    >
      {/* Card Header — fixed */}
      <button
        onClick={() => onOpenEcho()}
        className="flex-none flex items-center justify-between px-5 pt-5 pb-2 transition-transform duration-150 active:scale-[0.97]"
      >
        <div className="flex items-center gap-3">
          {/* Echo avatar - 56px with sparkle, solid orange */}
          <div className="relative">
            <div 
              className="w-14 h-14 rounded-[16px] flex items-center justify-center"
              style={{ backgroundColor: APPLE_COLORS.systemOrange }}
            >
              <span className="text-2xl">🤖</span>
            </div>
            {/* Sparkle badge */}
            <div 
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ 
                backgroundColor: APPLE_COLORS.systemOrange,
                boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
              }}
            >
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          </div>
          
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2">
              <span 
                className="text-[17px] font-semibold"
                style={{ color: APPLE_COLORS.label }}
              >
                Echo
              </span>
              {/* AI pill badge */}
              <span 
                className="px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide"
                style={{ 
                  backgroundColor: APPLE_COLORS.aiBadgeBg,
                  color: APPLE_COLORS.aiBadgeText,
                }}
              >
                AI
              </span>
            </div>
            <p 
              className="text-[13px] font-normal mt-0.5"
              style={{ color: APPLE_COLORS.secondaryLabel }}
            >
              Your golf caddie, always ready
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5" style={{ color: APPLE_COLORS.tertiaryLabel }} />
      </button>
      
      {/* Card Body — flexible, clips overflow */}
      <div className="flex-1 min-h-0 overflow-hidden px-5 flex flex-col">
        {/* Caddie Whisper Card - solid white */}
        <button
          onClick={handleWhisperClick}
          className="flex-none flex items-center gap-3 py-4 px-4 rounded-[14px] bg-white transition-transform duration-150 active:scale-[0.97]"
          style={{ 
            border: `1px solid ${APPLE_COLORS.whisperBorder}`,
          }}
        >
          {/* Lightbulb icon - 36px, solid orange tint bg */}
          <div 
            className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: APPLE_COLORS.aiBadgeBg }}
          >
            <Lightbulb className="w-4 h-4" style={{ color: APPLE_COLORS.systemOrange }} />
          </div>
          <span 
            className="flex-1 text-left text-[15px] font-normal line-clamp-2"
            style={{ color: APPLE_COLORS.label }}
          >
            Perfect morning for golf — check today's weather
          </span>
          <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: APPLE_COLORS.tertiaryLabel }} />
        </button>
        
        {/* Quick prompt pills - single row */}
        <div className="flex-1 flex items-center py-3">
          <div className="flex gap-3 flex-nowrap overflow-hidden">
            {QUICK_PROMPTS.map((prompt) => {
              const isActive = activePrompt === prompt;
              return (
                <button
                  key={prompt}
                  onClick={() => handlePromptClick(prompt)}
                  className="py-2 px-4 rounded-full text-[14px] font-medium flex-shrink-0 transition-all duration-150 active:scale-[0.97]"
                  style={isActive ? {
                    backgroundColor: APPLE_COLORS.systemOrange,
                    color: '#FFFFFF',
                    border: '1px solid transparent',
                  } : {
                    backgroundColor: '#FFFFFF',
                    color: APPLE_COLORS.label,
                    border: `1px solid ${APPLE_COLORS.separator}`,
                  }}
                >
                  {prompt}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Card Footer — fixed (Input Bar), 50px height */}
      <div className="flex-none px-5 pb-5 pt-2">
        <div 
          className="w-full flex items-center gap-2 rounded-[12px] px-4 h-[50px] transition-all duration-150"
          style={{
            backgroundColor: APPLE_COLORS.systemGray6,
            border: 'none',
            boxShadow: isFocused ? `0 0 0 2px ${APPLE_COLORS.systemOrange}30` : 'none',
          }}
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSubmit();
              }
            }}
            placeholder="Ask Echo anything golf..."
            className="flex-1 bg-transparent outline-none text-[15px]"
            style={{ 
              color: APPLE_COLORS.label,
            }}
          />
          <style>{`
            input::placeholder {
              color: ${APPLE_COLORS.tertiaryLabel};
            }
          `}</style>
          <button
            onClick={handleSubmit}
            className="w-9 h-9 rounded-[10px] flex items-center justify-center transition-all duration-150 active:scale-[0.9]"
            style={hasText ? {
              backgroundColor: APPLE_COLORS.systemOrange,
            } : {
              backgroundColor: '#FFFFFF',
              boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
            }}
          >
            {hasText ? (
              <Send className="w-4 h-4 text-white" />
            ) : (
              <Mic className="w-4 h-4" style={{ color: APPLE_COLORS.systemOrange }} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
