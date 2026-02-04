/**
 * EchoPageWelcome - WhatsApp-style welcome state with glowing orb
 * Clean, centered design with bubble-style prompt buttons
 */

import React, { useMemo } from 'react';
import { haptic } from '@/utils/haptics';

interface EchoPageWelcomeProps {
  onPromptClick: (prompt: string) => void;
  onFocusInput: () => void;
}

// Pool of 50 diverse golf prompts
const ECHO_PROMPTS = [
  // Course & Play Strategy
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
  
  // Rules & Scoring
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
  
  // Course Research
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
  
  // Trip Planning
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
  
  // Equipment & Gear
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

// Get random prompts - shuffles and picks first n
const getRandomPrompts = (count: number = 4): string[] => {
  const shuffled = [...ECHO_PROMPTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

export function EchoPageWelcome({ onPromptClick, onFocusInput }: EchoPageWelcomeProps) {
  // Get 4 random prompts - persists during session, changes on remount
  const prompts = useMemo(() => getRandomPrompts(4), []);

  const handleChipClick = (prompt: string) => {
    haptic('light');
    onPromptClick(prompt);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center px-5 pb-20 overflow-visible">
      {/* Orb with glow */}
      <div className="relative mb-6">
        {/* Glow layer */}
        <div 
          className="absolute inset-0 rounded-full bg-[#FFBF66] blur-2xl opacity-30 scale-[2]"
          style={{ animation: 'glowPulse 4s ease-in-out infinite' }}
        />
        
        {/* Main orb */}
        <div className="relative w-20 h-20 rounded-full bg-[#FFBF66] flex items-center justify-center shadow-lg">
          {/* Soundwave bars */}
          <div className="flex items-center gap-1">
            <div 
              className="w-1 h-4 bg-white rounded-full" 
              style={{ animation: 'gentleWave 3s ease-in-out infinite' }} 
            />
            <div 
              className="w-1 h-6 bg-white rounded-full" 
              style={{ animation: 'gentleWave 3s ease-in-out infinite', animationDelay: '0.5s' }} 
            />
            <div 
              className="w-1 h-4 bg-white rounded-full" 
              style={{ animation: 'gentleWave 3s ease-in-out infinite', animationDelay: '1s' }} 
            />
          </div>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-[28px] font-bold text-[#1D1D1F] tracking-tight mb-2">
        Ask Echo
      </h1>
      
      {/* Subtitle */}
      <p className="text-[15px] text-[#8E8E93] text-center leading-relaxed mb-8 max-w-[260px]">
        Instant golf answers - distances, rules, course intel, gear, and trip planning.
      </p>

      {/* Prompt bubbles - WhatsApp style */}
      <div className="w-full max-w-[340px] flex flex-col gap-2">
        {prompts.map((prompt, index) => (
          <button
            key={index}
            onClick={() => handleChipClick(prompt)}
            className="px-4 py-3.5 bg-white rounded-[18px] shadow-[0_1px_3px_rgba(0,0,0,0.08)] text-[15px] text-[#1D1D1F] text-left active:bg-[#F5F5F5] transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
