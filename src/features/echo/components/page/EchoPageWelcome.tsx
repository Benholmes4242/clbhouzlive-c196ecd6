 /**
  * EchoPageWelcome - Cleo-style welcome state with glowing orb
  * Glass prompt chips on warm gradient canvas
  */
 
 import React, { useMemo } from 'react';
 import { haptic } from '@/utils/haptics';
 import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface EchoPageWelcomeProps {
  onPromptClick: (prompt: string) => void;
  onFocusInput: () => void;
}

// Pool of 50 diverse golf prompts
const ECHO_PROMPTS = [
  "What's the best play from 155y?",
  "How do I play a downhill lie?",
  "Tips for playing in the wind",
  "How to escape a fairway bunker",
  "Best strategy for a blind tee shot",
  "How to play a punch shot under trees",
  "When should I lay up vs go for it?",
  "How to read a breaking putt",
  "Tips for playing fast greens",
  "How to judge distance without a rangefinder",
  "Explain stableford scoring",
  "What's the rule for a lost ball?",
  "Can I move my ball from a divot?",
  "What's the penalty for an unplayable lie?",
  "Explain the new stroke and distance rule",
  "What are the rules for taking relief?",
  "How does match play scoring work?",
  "What's a provisional ball and when to use it?",
  "Can I repair spike marks on the green?",
  "What's the rule for a ball in a water hazard?",
  "Course tips for Portrush",
  "Best links courses in Scotland",
  "Hidden gem courses near London",
  "Top courses in Northern Ireland",
  "Best public courses in Ireland",
  "Bucket list courses in the UK",
  "Best courses for beginners",
  "Most challenging courses in Europe",
  "Best winter golf destinations",
  "Courses with the best views",
  "Build a 3-day NI golf trip",
  "Plan a Scotland golf tour",
  "Best golf resorts in Spain",
  "Weekend golf trip ideas",
  "Golf and stay packages in Portugal",
  "Best time to visit St Andrews",
  "How to book Old Course tee times",
  "Golf trip packing checklist",
  "Best golf destinations in March",
  "Affordable golf trips in Europe",
  "What clubs should I carry?",
  "How to choose the right driver",
  "Best golf balls for mid handicappers",
  "When should I replace my grips?",
  "Hybrid vs long iron - which is better?",
  "Best golf shoes for walking",
  "How to fit a putter to my stroke",
  "What loft should my wedges be?",
  "Best rangefinder under £200",
  "How often should I change my ball?",
];

const getRandomPrompts = (count: number = 4): string[] => {
  const shuffled = [...ECHO_PROMPTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

export function EchoPageWelcome({ onPromptClick, onFocusInput }: EchoPageWelcomeProps) {
  const prompts = useMemo(() => getRandomPrompts(4), []);
   const prefersReduced = usePrefersReducedMotion();

  const handleChipClick = (prompt: string) => {
    haptic('light');
    onPromptClick(prompt);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center px-5 pb-20 overflow-visible">
      {/* Orb with glow */}
      <div className="relative mb-6">
        <div 
          className="absolute inset-0 rounded-full blur-2xl opacity-30 scale-[2]"
           style={{ 
             background: 'linear-gradient(135deg, #F97316, #FBBF24)',
             animation: prefersReduced ? 'none' : 'glowPulse 4s ease-in-out infinite',
           }}
        />
        
        <div 
          className="relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #F97316, #FBBF24)',
            animation: prefersReduced ? 'none' : 'pulseGlow 3s ease-in-out infinite',
          }}
        >
          <div className="flex items-center gap-1">
            <div 
              className="w-1 h-4 bg-white rounded-full" 
               style={prefersReduced ? {} : { animation: 'gentleWave 3s ease-in-out infinite' }} 
            />
            <div 
              className="w-1 h-6 bg-white rounded-full" 
               style={prefersReduced ? {} : { animation: 'gentleWave 3s ease-in-out infinite', animationDelay: '0.5s' }} 
            />
            <div 
              className="w-1 h-4 bg-white rounded-full" 
               style={prefersReduced ? {} : { animation: 'gentleWave 3s ease-in-out infinite', animationDelay: '1s' }} 
            />
          </div>
        </div>
      </div>

      {/* Title */}
       <h1 className="text-[1.75rem] font-bold tracking-tight mb-2" style={{ color: '#1C1917', fontFamily: "'DM Sans', sans-serif" }}>
        Ask Echo
      </h1>
      
      {/* Subtitle */}
       <p className="text-[0.9375rem] text-center leading-relaxed mb-8 max-w-[260px]" style={{ color: '#92400E', opacity: 0.65, fontFamily: "'DM Sans', sans-serif" }}>
        Your personal caddie — distances, rules, course intel, gear, and trip planning.
      </p>

      {/* Prompt chips - Glass style */}
      <div className="w-full max-w-[340px] flex flex-col gap-2">
        {prompts.map((prompt, index) => (
          <button
            key={index}
            onClick={() => handleChipClick(prompt)}
            className="px-[14px] py-[9px] rounded-[12px] text-[13px] font-medium text-left active:scale-[0.98] transition-transform backdrop-blur-[8px] flex items-center justify-between gap-2"
            style={{
              background: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(255,255,255,0.35)',
              color: '#44403C',
              fontFamily: "'DM Sans', sans-serif",
            }}
             aria-label={`Ask Echo: ${prompt}`}
          >
            <span>{prompt}</span>
            <span className="text-[11px] flex-shrink-0" style={{ color: '#D97706' }}>→</span>
          </button>
        ))}
      </div>
    </div>
  );
}
