/**
 * HubEchoCardDark - Dark-mode Liquid Glass Echo Card
 * Warm orange accents, Caddie Whisper, anchored input bar
 */

import { useState, useCallback } from 'react';
import { ChevronRight, Mic, Send, Lightbulb, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { haptic } from '@/utils/haptics';

interface HubEchoCardDarkProps {
  onOpenEcho: (initialPrompt?: string) => void;
  recentContext?: string | null;
  className?: string;
}

// ============ System Font Stack ============
const systemFontStack = '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif';

// Quick prompt pills
const QUICK_PROMPTS = [
  "Find a course",
  "Weather",
  "Trip ideas",
];

// ============ Main Component ============

export function HubEchoCardDark({ onOpenEcho, recentContext, className }: HubEchoCardDarkProps) {
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
    setTimeout(() => setActivePrompt(null), 300);
  }, [onOpenEcho]);
  
  const handleWhisperClick = useCallback(() => {
    haptic('light');
    onOpenEcho("Perfect morning for golf — check today's weather");
  }, [onOpenEcho]);

  return (
    <div 
      className={`flex flex-col rounded-[28px] overflow-hidden ${className || ''}`}
      style={{
        background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.12) 0%, rgba(251, 191, 36, 0.08) 50%, rgba(255, 255, 255, 0.03) 100%)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: '1px solid rgba(251, 191, 36, 0.15)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(251, 191, 36, 0.2)',
        fontFamily: systemFontStack,
      }}
    >
      {/* Header - flex-none */}
      <motion.button
        onClick={() => onOpenEcho()}
        whileTap={{ scale: 0.98 }}
        className="flex-none flex items-center justify-between px-4 pt-4 pb-2"
      >
        <div className="flex items-center gap-3">
          {/* Echo robot emoji in orange gradient container */}
          <div className="relative">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, hsl(43 96% 56%) 0%, hsl(28 91% 60%) 50%, hsl(21 90% 55%) 100%)',
                boxShadow: '0 4px 12px rgba(251, 146, 60, 0.4)',
              }}
            >
              <span className="text-lg">🤖</span>
            </div>
            {/* Sparkle badge */}
            <div 
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, hsl(43 96% 56%) 0%, hsl(28 91% 60%) 100%)',
                boxShadow: '0 2px 4px rgba(251, 146, 60, 0.5)',
              }}
            >
              <Sparkles className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '17px', fontWeight: 600, color: 'white' }}>
              Echo
            </span>
            {/* AI pill badge */}
            <span 
              className="px-1.5 py-0.5 rounded-md"
              style={{ 
                fontSize: '10px', 
                fontWeight: 700, 
                background: 'linear-gradient(135deg, hsl(43 96% 56%) 0%, hsl(28 91% 60%) 100%)',
                color: 'white',
                letterSpacing: '0.5px',
              }}
            >
              AI
            </span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5" style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
      </motion.button>
      
      {/* Subtitle - flex-none */}
      <div className="flex-none px-4 pb-2">
        <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }}>
          Your golf caddie, always ready
        </p>
      </div>
      
      {/* Caddie Whisper suggestion card - flex-none */}
      <div className="flex-none px-4 pb-2">
        <motion.button
          onClick={handleWhisperClick}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center gap-3 py-3 px-3 rounded-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(251, 191, 36, 0.2)',
          }}
        >
          {/* Lightbulb in orange gradient */}
          <div 
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, hsl(43 96% 56%) 0%, hsl(28 91% 60%) 100%)',
            }}
          >
            <Lightbulb className="w-4 h-4 text-white" />
          </div>
          <span 
            className="flex-1 text-left line-clamp-2"
            style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)' }}
          >
            Perfect morning for golf — check today's weather
          </span>
          <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(255, 255, 255, 0.4)' }} />
        </motion.button>
      </div>
      
      {/* Quick prompt pills - flex-1 min-h-0 overflow-hidden */}
      <div className="flex-1 min-h-0 overflow-hidden flex items-center px-4 py-2">
        <div className="flex gap-2 flex-wrap">
          {QUICK_PROMPTS.map((prompt) => {
            const isActive = activePrompt === prompt;
            return (
              <motion.button
                key={prompt}
                onClick={() => handlePromptClick(prompt)}
                whileTap={{ scale: 0.95 }}
                className="py-2 px-3 rounded-full"
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  background: isActive 
                    ? 'linear-gradient(135deg, hsl(43 96% 56%) 0%, hsl(28 91% 60%) 100%)'
                    : 'rgba(251, 191, 36, 0.15)',
                  color: isActive ? 'white' : 'hsl(43 96% 70%)',
                  border: isActive ? 'none' : '1px solid rgba(251, 191, 36, 0.25)',
                }}
              >
                {prompt}
              </motion.button>
            );
          })}
        </div>
      </div>
      
      {/* Input field at bottom - flex-none (anchored) */}
      <div className="flex-none px-4 pb-4 pt-2">
        <div 
          className="w-full flex items-center gap-2 py-2.5 px-3 rounded-2xl transition-all duration-300"
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: isFocused ? '2px solid hsl(28 91% 60%)' : '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: isFocused ? '0 0 0 4px rgba(251, 146, 60, 0.2)' : 'none',
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
            placeholder="Ask Echo anything about golf…"
            className="flex-1 bg-transparent outline-none"
            style={{ 
              fontSize: '15px', 
              color: 'white',
              fontFamily: systemFontStack,
            }}
          />
          <motion.button
            onClick={handleSubmit}
            whileTap={{ scale: 0.9 }}
            disabled={!hasText && false} // Mic always enabled
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
            style={{
              background: hasText 
                ? 'linear-gradient(135deg, hsl(43 96% 56%) 0%, hsl(28 91% 60%) 100%)'
                : 'rgba(251, 191, 36, 0.2)',
              opacity: hasText ? 1 : 0.7,
            }}
          >
            {hasText ? (
              <Send className="w-4 h-4 text-white" />
            ) : (
              <Mic className="w-4 h-4" style={{ color: 'hsl(43 96% 70%)' }} />
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
