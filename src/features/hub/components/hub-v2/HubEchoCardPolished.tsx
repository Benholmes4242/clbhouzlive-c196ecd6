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

export function HubEchoCardPolished({ onOpenEcho }: HubEchoCardPolishedProps) {
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
    const question = inputValue.trim();
    if (!question) return;
    
    console.log('[HubEchoCard] Submitting question:', question);
    haptic('light');
    
    // Navigate BEFORE clearing input to ensure question is passed
    onOpenEcho(question);
    
    // Clear input after navigation is triggered
    setInputValue('');
  }, [inputValue, onOpenEcho]);
  
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
    <div className="flex flex-col rounded-[24px] bg-[#FFF8F0] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      {/* Header row */}
      <button
        onClick={() => onOpenEcho()}
        className="w-full flex items-center justify-between mb-4"
      >
        <div className="flex items-center gap-3">
          {/* Animated orb */}
          <div className="w-12 h-12 rounded-full bg-[#FFBF66] flex items-center justify-center shadow-sm">
            <div className="flex items-center gap-[3px]">
              <div 
                className="w-[3px] h-2.5 bg-white rounded-full" 
                style={{ animation: 'gentleWave 3s ease-in-out infinite' }} 
              />
              <div 
                className="w-[3px] h-4 bg-white rounded-full" 
                style={{ animation: 'gentleWave 3s ease-in-out infinite', animationDelay: '0.5s' }} 
              />
              <div 
                className="w-[3px] h-2.5 bg-white rounded-full" 
                style={{ animation: 'gentleWave 3s ease-in-out infinite', animationDelay: '1s' }} 
              />
            </div>
          </div>
          <div className="text-left">
            <span className="text-[18px] font-semibold text-[#1D1D1F] block">Echo</span>
            <span className="text-[13px] text-[#86868B]">Your personal caddie</span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-[#C7C7CC]" />
      </button>
      
      {/* Prompt suggestion */}
      <button
        onClick={handleWhisperClick}
        className="w-full bg-white/80 rounded-2xl p-4 mb-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
      >
        <div className="w-10 h-10 rounded-xl bg-[#FFF0D6] flex items-center justify-center flex-shrink-0">
          <Lightbulb className="w-5 h-5 text-[#FF9500]" />
        </div>
        <div className="flex-1 text-left min-h-[40px] flex items-center">
          <AnimatePresence mode="wait">
            <motion.span
              key={promptIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="text-[15px] text-[#1D1D1F] leading-snug line-clamp-2"
            >
              {WHISPER_PROMPTS[promptIndex]}
            </motion.span>
          </AnimatePresence>
        </div>
        <ChevronRight className="w-4 h-4 text-[#C7C7CC] flex-shrink-0" />
      </button>
      
      {/* Input bar */}
      <div 
        className={`flex items-center gap-3 h-[52px] rounded-2xl px-4 transition-all duration-150 ${
          isFocused 
            ? 'bg-white border border-[#FF9500]/40' 
            : 'bg-white border border-[#E8E0D8]'
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
        <button
          onClick={handleSubmit}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            hasText 
              ? 'bg-[#FFBF66] shadow-sm active:scale-95' 
              : 'bg-[#F0F0F5] opacity-50 cursor-not-allowed'
          }`}
          aria-label={hasText ? 'Send message' : 'Microphone (disabled)'}
        >
          {hasText ? (
            <Send className="w-5 h-5 text-white" />
          ) : (
            <Mic className="w-5 h-5 text-[#AEAEB2]" />
          )}
        </button>
      </div>
    </div>
  );
}
