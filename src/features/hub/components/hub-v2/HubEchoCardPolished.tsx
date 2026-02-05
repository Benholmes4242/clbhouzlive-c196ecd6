 /**
  * HubEchoCardPolished - WhatsApp-Style Echo Card
  * Orange bubble (like sent message), minimal chrome
  */
 
 import { useState, useCallback, useMemo, useEffect } from 'react';
 import { ChevronRight, ArrowUp, Lightbulb, Mic } from 'lucide-react';
 import { useNavigate } from 'react-router-dom';
 import { haptic } from '@/utils/haptics';
 import { useSpeechToText } from '@/hooks/useSpeechToText';
 import { toast } from 'sonner';
 import { cn } from '@/lib/utils';
 import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface HubEchoCardPolishedProps {
  onOpenEcho: (initialPrompt?: string) => void;
  expandable?: boolean;
  className?: string;
}

// Rotating prompts for Caddie Whisper
const WHISPER_PROMPTS = [
  "Check today's weather in my location",
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

export function HubEchoCardPolished({ onOpenEcho, expandable = false, className }: HubEchoCardPolishedProps) {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState('');
   const prefersReduced = usePrefersReducedMotion();
   const { isListening, transcript, startListening, stopListening, isSupported, error } = useSpeechToText();
 
  // Shuffle prompts on mount for variety
  const shuffledPrompts = useMemo(() => {
    return [...WHISPER_PROMPTS].sort(() => Math.random() - 0.5);
  }, []);
  
  const hasText = inputValue.trim().length > 0;
 
   // Insert transcript into input when voice recognition produces text
   useEffect(() => {
     if (transcript) {
       setInputValue(transcript);
     }
   }, [transcript]);
 
   // Show toast on voice input error
   useEffect(() => {
     if (error) {
       toast.error(error);
     }
   }, [error]);
  
  const handleSubmit = useCallback(() => {
    const question = inputValue.trim();
    if (!question) return;
    
    console.log('[HubEchoCard] Submitting question:', question);
    haptic('light');
    
    // Navigate BEFORE clearing input
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
    <div className={`bg-[#FFF4E6] rounded-[18px] shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col ${className || ''}`}>
      {/* Header row - tappable to go to Echo - fixed height */}
      <button
        onClick={handleHeaderClick}
        className="flex-none w-full flex items-center justify-between px-4 pt-4 pb-3 active:bg-[#FFECDA] transition-colors"
         role="button"
         aria-label="Open Echo"
      >
        <div className="flex items-center gap-3">
          {/* Small animated orb */}
          <div className="w-10 h-10 rounded-full bg-[#FFBF66] flex items-center justify-center">
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
             <span className="text-[1.0625rem] font-semibold text-[#1D1D1F] block">Echo</span>
             <span className="text-[0.8125rem] text-[#8E8E93]">Your personal caddie</span>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-[#C7C7CC]" />
      </button>

      {/* Middle content - expands to fill space with 3 prompts */}
      <div className="flex-1 flex flex-col justify-center gap-2 min-h-0 px-4">
        {shuffledPrompts.slice(0, 3).map((prompt, i) => (
          <button
            key={i}
            onClick={() => {
              haptic('light');
              onOpenEcho(prompt);
            }}
            className="px-4 py-3 bg-white/60 rounded-xl flex items-center gap-3 active:bg-white/80 transition-colors w-full"
           aria-label={`Ask Echo: ${prompt}`}
          >
            <Lightbulb className="w-4 h-4 text-[#FF9500] flex-shrink-0" />
           <span className="flex-1 text-[0.875rem] text-[#1D1D1F] text-left leading-snug line-clamp-1">
              {prompt}
            </span>
            <ChevronRight className="w-4 h-4 text-[#C7C7CC] flex-shrink-0" />
          </button>
        ))}
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
           aria-label="Type a question for Echo"
           className="flex-1 bg-transparent outline-none text-[0.9375rem] text-[#1D1D1F] placeholder:text-[#8E8E93]"
          />
         {hasText ? (
           <button
             onClick={handleSubmit}
             className="w-8 h-8 rounded-full flex items-center justify-center bg-[#FFBF66] transition-all active:scale-95"
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
             <Mic className={cn("w-5 h-5", isListening ? "text-white" : "text-[#8E8E93]")} />
           </button>
         ) : (
           <button
             onClick={handleSubmit}
             disabled
             className="w-8 h-8 rounded-full flex items-center justify-center bg-transparent opacity-50"
             aria-label="Send message"
           >
             <ArrowUp className="w-4 h-4 text-[#8E8E93]" />
           </button>
         )}
        </div>
      </div>
    </div>
  );
}