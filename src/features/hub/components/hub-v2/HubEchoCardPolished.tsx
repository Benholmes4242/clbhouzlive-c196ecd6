/**
 * HubEchoCardPolished - Apple-grade Echo Card
 * Warm gradient, Caddie Whisper, voice/text input
 */

import { useState, useEffect, useCallback } from 'react';
import { ChevronRight, Mic, Send, Lightbulb, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { haptic } from '@/utils/haptics';

interface HubEchoCardPolishedProps {
  onOpenEcho: (initialPrompt?: string) => void;
  recentContext?: string | null;
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
      className="flex-1 flex flex-col rounded-[28px] overflow-hidden transition-all duration-200 active:scale-[0.98]"
      style={{
        background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.12) 0%, rgba(251, 146, 60, 0.08) 50%, rgba(255, 255, 255, 0.9) 100%)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        boxShadow: '0 4px 24px rgba(251, 146, 60, 0.1), 0 1px 2px rgba(0, 0, 0, 0.04)',
        fontFamily: systemFontStack,
      }}
    >
      {/* Header */}
      <button
        onClick={() => onOpenEcho()}
        className="flex items-center justify-between px-5 pt-5 pb-3"
      >
        <div className="flex items-center gap-3">
          {/* Echo robot emoji in orange gradient container with sparkle */}
          <div className="relative">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, hsl(43 96% 56%) 0%, hsl(28 91% 60%) 50%, hsl(21 90% 55%) 100%)',
              }}
            >
              <span className="text-lg">🤖</span>
            </div>
            {/* Sparkle badge */}
            <div 
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, hsl(43 96% 56%) 0%, hsl(28 91% 60%) 100%)',
                boxShadow: '0 2px 4px rgba(251, 146, 60, 0.3)',
              }}
            >
              <Sparkles className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '17px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
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
        <ChevronRight className="w-5 h-5" style={{ color: 'hsl(var(--muted-foreground))' }} />
      </button>
      
      {/* Subtitle */}
      <div className="px-5 -mt-1 pb-2">
        <p style={{ fontSize: '14px', color: 'hsl(var(--muted-foreground))' }}>
          Your golf caddie, always ready
        </p>
      </div>
      
      {/* Caddie Whisper suggestion card */}
      <div className="px-5 pb-3 flex-shrink-0">
        <button
          onClick={handleWhisperClick}
          className="w-full flex items-center gap-3 py-3 px-4 rounded-2xl transition-all duration-200 active:scale-[0.98]"
          style={{
            background: 'rgba(255, 255, 255, 0.6)',
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
            className="flex-1 text-left truncate"
            style={{ fontSize: '14px', color: 'hsl(var(--foreground))' }}
          >
            Perfect morning for golf — check today's weather
          </span>
          <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} />
        </button>
      </div>
      
      {/* Quick prompt pills - flex-1 fills remaining space, centered */}
      <div className="flex-1 flex items-center px-5 pb-3">
        <div className="flex gap-2 flex-wrap">
          {QUICK_PROMPTS.map((prompt) => {
            const isActive = activePrompt === prompt;
            return (
              <motion.button
                key={prompt}
                onClick={() => handlePromptClick(prompt)}
                whileTap={{ scale: 0.95 }}
                className="py-2 px-4 rounded-full transition-all duration-200"
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  background: isActive 
                    ? 'linear-gradient(135deg, hsl(43 96% 56%) 0%, hsl(28 91% 60%) 100%)'
                    : 'rgba(251, 191, 36, 0.12)',
                  color: isActive ? 'white' : 'hsl(25 95% 40%)',
                  border: isActive ? 'none' : '1px solid rgba(251, 191, 36, 0.3)',
                }}
              >
                {prompt}
              </motion.button>
            );
          })}
        </div>
      </div>
      
      {/* Input field at bottom */}
      <div className="px-5 pb-4 flex-shrink-0">
        <div 
          className="w-full flex items-center gap-3 py-3 px-4 rounded-2xl transition-all duration-300"
          style={{
            background: 'rgba(255, 255, 255, 0.7)',
            border: isFocused ? '2px solid hsl(28 91% 60%)' : '1px solid rgba(0, 0, 0, 0.06)',
            boxShadow: isFocused ? '0 0 0 4px rgba(251, 146, 60, 0.15)' : 'none',
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
            className="flex-1 bg-transparent outline-none"
            style={{ 
              fontSize: '15px', 
              color: 'hsl(var(--foreground))',
              fontFamily: systemFontStack,
            }}
          />
          <motion.button
            onClick={handleSubmit}
            whileTap={{ scale: 0.9 }}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
            style={{
              background: hasText 
                ? 'linear-gradient(135deg, hsl(43 96% 56%) 0%, hsl(28 91% 60%) 100%)'
                : 'rgba(251, 191, 36, 0.12)',
            }}
          >
            {hasText ? (
              <Send className="w-4 h-4 text-white" />
            ) : (
              <Mic className="w-4 h-4" style={{ color: 'hsl(28 91% 45%)' }} />
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
