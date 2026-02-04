/**
 * HubEchoCardPolished - WhatsApp-Style Echo Card
 * Orange bubble (like sent message), minimal chrome
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { ChevronRight, Mic, ArrowUp, Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { haptic } from '@/utils/haptics';

interface HubEchoCardPolishedProps {
  onOpenEcho: (initialPrompt?: string) => void;
  expandable?: boolean;
}

// Rotating prompts for Caddie Whisper
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

export function HubEchoCardPolished({ onOpenEcho, expandable = false }: HubEchoCardPolishedProps) {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState('');
  const [promptIndex, setPromptIndex] = useState(0);
  
  // Shuffle prompts on mount for variety
  const shuffledPrompts = useMemo(() => {
    return [...WHISPER_PROMPTS].sort(() => Math.random() - 0.5);
  }, []);
  
  const currentPrompt = shuffledPrompts[promptIndex];
  const hasText = inputValue.trim().length > 0;
  
  // Rotate prompts every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPromptIndex((prev) => (prev + 1) % shuffledPrompts.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [shuffledPrompts.length]);
  
  const handleSubmit = useCallback(() => {
    const question = inputValue.trim();
    if (!question) return;
    
    console.log('[HubEchoCard] Submitting question:', question);
    haptic('light');
    
    // Navigate BEFORE clearing input
    onOpenEcho(question);
    setInputValue('');
  }, [inputValue, onOpenEcho]);
  
  const handlePromptClick = useCallback(() => {
    haptic('light');
    onOpenEcho(currentPrompt);
  }, [onOpenEcho, currentPrompt]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const handleHeaderClick = useCallback(() => {
    haptic('light');
    navigate('/echo');
  }, [navigate]);

  return (
    <div className={`bg-[#FFF4E6] rounded-[18px] shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden ${
      expandable ? 'h-full flex flex-col' : ''
    }`}>
      {/* Header row - tappable to go to Echo - fixed height */}
      <button
        onClick={handleHeaderClick}
        className="flex-none w-full flex items-center justify-between px-4 pt-4 pb-3 active:bg-[#FFECDA] transition-colors"
      >
        <div className="flex items-center gap-3">
          {/* Small animated orb */}
          <div className="w-10 h-10 rounded-full bg-[#FFBF66] flex items-center justify-center">
            <div className="flex items-center gap-[2px]">
              <div 
                className="w-[2px] h-2 bg-white rounded-full"
                style={{ animation: 'gentleWave 3s ease-in-out infinite' }}
              />
              <div 
                className="w-[2px] h-3 bg-white rounded-full"
                style={{ animation: 'gentleWave 3s ease-in-out infinite', animationDelay: '0.5s' }}
              />
              <div 
                className="w-[2px] h-2 bg-white rounded-full"
                style={{ animation: 'gentleWave 3s ease-in-out infinite', animationDelay: '1s' }}
              />
            </div>
          </div>
          <div className="text-left">
            <span className="text-[17px] font-semibold text-[#1D1D1F] block">Echo</span>
            <span className="text-[13px] text-[#8E8E93]">Your personal caddie</span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-[#C7C7CC]" />
      </button>

      {/* Middle content - expands when expandable */}
      <div className={`${expandable ? 'flex-1 flex flex-col justify-center' : ''} px-4 ${expandable ? '' : 'mb-3'}`}>
        {/* Prompt suggestion bubble - like a chat message */}
        <button
          onClick={handlePromptClick}
          className={`px-4 py-3 bg-white/70 rounded-2xl flex items-center gap-3 active:bg-white transition-colors w-full ${expandable ? 'mb-0' : ''}`}
        >
          <Lightbulb className="w-5 h-5 text-[#FF9500] flex-shrink-0" />
          <AnimatePresence mode="wait">
            <motion.span
              key={promptIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex-1 text-[15px] text-[#1D1D1F] text-left leading-snug"
            >
              {currentPrompt}
            </motion.span>
          </AnimatePresence>
          <ChevronRight className="w-4 h-4 text-[#C7C7CC] flex-shrink-0" />
        </button>
      </div>

      {/* Input bar - fixed at bottom */}
      <div className="flex-none px-4 pb-4 pt-3">
        <div className="flex items-center gap-2 h-[46px] bg-white rounded-full px-4 shadow-sm">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Echo anything..."
            className="flex-1 bg-transparent outline-none text-[15px] text-[#1D1D1F] placeholder:text-[#8E8E93]"
          />
          <button
            onClick={handleSubmit}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              hasText ? "bg-[#FFBF66]" : "bg-transparent"
            }`}
            aria-label={hasText ? 'Send message' : 'Microphone'}
          >
            {hasText ? (
              <ArrowUp className="w-4 h-4 text-white" />
            ) : (
              <Mic className="w-5 h-5 text-[#8E8E93]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}