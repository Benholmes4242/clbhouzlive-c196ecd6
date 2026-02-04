/**
 * HubEchoCardPolished - Liquid Glass Echo Card
 * Warm amber/orange tint, Caddie Whisper, voice/text input
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { ChevronRight, Mic, Send, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

// Rotating prompts for Caddie Whisper (10 prompts, 5s interval)
const WHISPER_PROMPTS = [
  "Perfect morning for golf — check today's weather",
  "Find a hidden gem course near you",
  "Plan your next golf trip abroad",
  "What's the best links course in Scotland?",
  "Get tips to improve your short game",
  "Discover top-rated courses in your area",
  "Find a course with availability this weekend",
  "Learn about golf etiquette and rules",
  "Compare courses you've been wanting to play",
  "Find the perfect course for your skill level",
];

// ============ Main Component ============

export function HubEchoCardPolished({ onOpenEcho, recentContext }: HubEchoCardPolishedProps) {
  const [inputValue, setInputValue] = useState('');
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);
  
  const hasText = inputValue.trim().length > 0;
  
  // Rotating prompts carousel - 5 second interval
  useEffect(() => {
    const interval = setInterval(() => {
      setPromptIndex((prev) => (prev + 1) % WHISPER_PROMPTS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  
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
    onOpenEcho(WHISPER_PROMPTS[promptIndex]);
  }, [onOpenEcho, promptIndex]);

  return (
    <div 
      className="h-full flex flex-col rounded-[28px] border border-white/80 shadow-[0_2px_40px_-12px_rgba(0,0,0,0.08)] overflow-hidden bg-[#FFFBF5]"
    >
      {/* Card Header — fixed */}
      <button
        onClick={() => onOpenEcho()}
        className="flex-none flex items-center justify-between px-5 pt-5 pb-2"
      >
        <div className="flex items-center gap-3">
          {/* Solid Orange Orb with White Soundwave Bars */}
          <div className="relative w-12 h-12 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-[#FFBF66] flex items-center justify-center shadow-sm">
              {/* White soundwave bars */}
              <div className="flex items-center gap-[3px]">
                <div 
                  className="w-[3px] h-2 bg-white rounded-full" 
                  style={{ animation: 'gentleWave 3s ease-in-out infinite' }} 
                />
                <div 
                  className="w-[3px] h-4 bg-white rounded-full" 
                  style={{ animation: 'gentleWave 3s ease-in-out infinite', animationDelay: '0.5s' }} 
                />
                <div 
                  className="w-[3px] h-2 bg-white rounded-full" 
                  style={{ animation: 'gentleWave 3s ease-in-out infinite', animationDelay: '1s' }} 
                />
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-start">
            <span className="text-[17px] font-semibold text-gray-900">
              Echo
            </span>
            <p className="text-[14px] text-gray-500 mt-0.5">
              Your personal caddie
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </button>
      
      {/* Card Body — flexible, clips overflow */}
      <div className="flex-1 min-h-0 overflow-hidden px-5 flex flex-col">
        {/* Caddie Whisper Card - Rotating prompts with fade transition */}
        <button
          onClick={handleWhisperClick}
          className="flex-none flex items-center gap-3 py-3 px-4 rounded-2xl bg-white/60 backdrop-blur-xl border border-orange-100/40 active:scale-[0.98] transition-all duration-200"
        >
          {/* Lightbulb icon - 36px - Orange glass */}
          <div 
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#FF9500]/15 backdrop-blur-xl border border-[#FF9500]/25"
            style={{ boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.4), 0 1px 3px rgba(255,149,0,0.15)' }}
          >
            <Lightbulb className="w-4 h-4 text-[#FF9500]" />
          </div>
          <div className="flex-1 text-left min-h-[40px] flex items-center">
            <AnimatePresence mode="wait">
              <motion.span
                key={promptIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="text-[14px] text-gray-900 line-clamp-2"
              >
                {WHISPER_PROMPTS[promptIndex]}
              </motion.span>
            </AnimatePresence>
          </div>
          <ChevronRight className="w-4 h-4 flex-shrink-0 text-gray-400" />
        </button>
        
        {/* Quick prompt pills - single row */}
        <div className="flex-1 flex items-center py-3">
          <div className="flex gap-2 flex-nowrap overflow-hidden">
            {QUICK_PROMPTS.map((prompt) => {
              const isActive = activePrompt === prompt;
              return (
                <motion.button
                  key={prompt}
                  onClick={() => handlePromptClick(prompt)}
                  whileTap={{ scale: 0.95 }}
                  className={`py-2.5 px-4 rounded-xl text-[14px] font-medium transition-all duration-200 flex-shrink-0 ${
                    isActive 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0' 
                      : 'bg-white/70 text-orange-700 border border-orange-100/50'
                  }`}
                >
                  {prompt}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Card Footer — fixed (Input Bar) */}
      <div className="flex-none px-5 pb-5 pt-2">
        <div 
          className={`w-full flex items-center gap-3 h-[50px] rounded-[14px] px-4 transition-all duration-200 ${
            isFocused 
              ? 'bg-white border border-[#FF9500]/40' 
              : 'bg-[#F8F8F8] border border-[#E8E8E8]'
          }`}
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
            className="flex-1 bg-transparent outline-none text-[15px] text-[#1D1D1F] placeholder:text-[#AEAEB2]"
          />
          <motion.button
            onClick={handleSubmit}
            whileTap={{ scale: 0.9 }}
            className={`w-10 h-10 rounded-xl backdrop-blur-xl flex items-center justify-center transition-all duration-200 ${
              hasText 
                ? 'bg-[#FF9500]/25 border border-[#FF9500]/30 hover:bg-[#FF9500]/35' 
                : 'bg-[#FF9500]/20 border border-[#FF9500]/25 hover:bg-[#FF9500]/30'
            }`}
          >
            {hasText ? (
              <Send className="w-4 h-4 text-[#FF9500]" />
            ) : (
              <Mic className="w-5 h-5 text-[#FF9500]" />
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
