/**
 * HubEchoCardPolished - A* Polish
 * Warm gradient, golf-themed icons, pulse animation, tap states
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { ChevronRight, ArrowUp, Mic, Flag, Compass, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { haptic } from '@/utils/haptics';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { HUB_COLORS } from '../../constants/hubTheme';

interface HubEchoCardPolishedProps {
  onOpenEcho: (initialPrompt?: string) => void;
  expandable?: boolean;
  className?: string;
}

// Rotating prompts with unique icons
const WHISPER_PROMPTS = [
  { text: "Check today's weather in my location", icon: 'compass' },
  { text: "Find a hidden gem course near you", icon: 'flag' },
  { text: "Plan your next golf trip abroad", icon: 'compass' },
  { text: "What's the best links course in Scotland?", icon: 'flag' },
  { text: "Get tips to improve your short game", icon: 'target' },
  { text: "Discover top-rated courses in your area", icon: 'compass' },
  { text: "Find a course with availability this weekend", icon: 'flag' },
  { text: "Learn about golf etiquette and rules", icon: 'target' },
  { text: "Compare courses you've been wanting to play", icon: 'compass' },
  { text: "Find the perfect course for your skill level", icon: 'target' },
];

function PromptIcon({ type }: { type: string }) {
  const style = { color: '#FF9500' };
  const cls = "w-4 h-4 flex-shrink-0";
  
  switch (type) {
    case 'flag': return <Flag className={cls} style={style} />;
    case 'compass': return <Compass className={cls} style={style} />;
    case 'target': return <Target className={cls} style={style} />;
    default: return <Flag className={cls} style={style} />;
  }
}

export function HubEchoCardPolished({ onOpenEcho, expandable = false, className }: HubEchoCardPolishedProps) {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState('');
  const prefersReduced = usePrefersReducedMotion();
  const { isListening, transcript, startListening, stopListening, isSupported, error } = useSpeechToText();

  const shuffledPrompts = useMemo(() => {
    return [...WHISPER_PROMPTS].sort(() => Math.random() - 0.5);
  }, []);
  
  const hasText = inputValue.trim().length > 0;

  useEffect(() => {
    if (transcript) setInputValue(transcript);
  }, [transcript]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);
  
  const handleSubmit = useCallback(() => {
    const question = inputValue.trim();
    if (!question) return;
    haptic('light');
    onOpenEcho(question);
    setInputValue('');
  }, [inputValue, onOpenEcho]);

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
    <div 
      className={cn("rounded-[18px] overflow-hidden flex flex-col", className)}
      style={{ 
        background: HUB_COLORS.echoBgGradient,
        boxShadow: HUB_COLORS.cardShadow,
      }}
    >
      {/* Header row */}
      <button
        onClick={handleHeaderClick}
        className="flex-none w-full flex items-center justify-between px-4 pt-4 pb-3 transition-all active:opacity-80"
        role="button"
        aria-label="Open Echo"
      >
        <div className="flex items-center gap-3">
          {/* Orb with pulse animation */}
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ 
              backgroundColor: HUB_COLORS.echoOrb,
              animation: prefersReduced ? 'none' : 'echoPulse 2s ease-in-out infinite',
            }}
          >
            <div className="flex items-center gap-[2px]">
              <div 
                className="w-[2px] h-2 bg-white rounded-full"
                style={prefersReduced ? {} : { animation: 'gentleWave 3s ease-in-out infinite' }}
              />
              <div 
                className="w-[2px] h-3 bg-white rounded-full"
                style={prefersReduced ? {} : { animation: 'gentleWave 3s ease-in-out infinite', animationDelay: '0.5s' }}
              />
              <div 
                className="w-[2px] h-2 bg-white rounded-full"
                style={prefersReduced ? {} : { animation: 'gentleWave 3s ease-in-out infinite', animationDelay: '1s' }}
              />
            </div>
          </div>
          <div className="text-left">
            <span className="text-[1.0625rem] font-semibold block" style={{ color: HUB_COLORS.textPrimary }}>Echo</span>
            <span className="text-[0.8125rem]" style={{ color: HUB_COLORS.textSecondary }}>Your personal caddie</span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5" style={{ color: HUB_COLORS.chevron }} />
      </button>

      {/* Suggestion prompts with unique icons and tap states */}
      <div className="flex-1 flex flex-col justify-center gap-2 min-h-0 px-4">
        {shuffledPrompts.slice(0, 3).map((prompt, i) => (
          <button
            key={i}
            onClick={() => {
              haptic('light');
              onOpenEcho(prompt.text);
            }}
            className="px-4 py-3 bg-white/60 rounded-xl flex items-center gap-3 w-full transition-all duration-150 active:scale-[0.98] active:bg-white/80"
            aria-label={`Ask Echo: ${prompt.text}`}
          >
            <PromptIcon type={prompt.icon} />
            <span className="flex-1 text-[0.875rem] text-left leading-snug line-clamp-1" style={{ color: HUB_COLORS.textPrimary }}>
              {prompt.text}
            </span>
            <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: HUB_COLORS.chevron }} />
          </button>
        ))}
      </div>

      {/* Input bar with extra top spacing and border */}
      <div className="flex-none px-4 pb-4 pt-5">
        <div 
          className="flex items-center gap-2 h-[46px] bg-white rounded-full px-4 shadow-sm"
          style={{ border: `1px solid ${HUB_COLORS.echoInputBorder}` }}
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Echo anything..."
            aria-label="Type a question for Echo"
            className="flex-1 bg-transparent outline-none text-[0.9375rem]"
            style={{ color: HUB_COLORS.textPrimary }}
          />
          {hasText ? (
            <button
              onClick={handleSubmit}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95"
              style={{ backgroundColor: HUB_COLORS.echoOrb }}
              aria-label="Send message"
            >
              <ArrowUp className="w-4 h-4 text-white" />
            </button>
          ) : isSupported ? (
            <button
              onClick={() => {
                if (isListening) {
                  stopListening();
                } else {
                  haptic('light');
                  startListening();
                }
              }}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95",
                isListening ? "bg-red-500 animate-pulse" : "bg-transparent"
              )}
              aria-label={isListening ? "Stop listening" : "Voice input"}
            >
              <Mic className={cn("w-5 h-5", isListening ? "text-white" : "")} style={isListening ? {} : { color: HUB_COLORS.textSecondary }} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled
              className="w-8 h-8 rounded-full flex items-center justify-center bg-transparent opacity-50"
              aria-label="Send message"
            >
              <ArrowUp className="w-4 h-4" style={{ color: HUB_COLORS.textSecondary }} />
            </button>
          )}
        </div>
      </div>

      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes echoPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.03); }
        }
      `}</style>
    </div>
  );
}
