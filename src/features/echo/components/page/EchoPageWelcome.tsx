/**
 * EchoPageWelcome - Personalised empty state with time-aware greeting
 */

import React, { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { haptic } from '@/utils/haptics';
import type { EchoProfile } from '@/features/echo/hooks/useEchoProfile';

interface EchoPageWelcomeProps {
  profile: EchoProfile;
  onChipSelect: (prompt: string) => void;
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

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const getRandomPrompts = (count: number = 4): string[] => {
  const shuffled = [...ECHO_PROMPTS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

export function EchoPageWelcome({ profile, onChipSelect }: EchoPageWelcomeProps) {
  const prompts = useMemo(() => getRandomPrompts(4), []);
  const greeting = getGreeting();

  const handleChipClick = (prompt: string) => {
    haptic('light');
    onChipSelect(prompt);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center px-5 pb-32 overflow-visible">
      {/* Greeting block */}
      <div className="text-center mb-2">
        <h1 className="text-[28px] font-bold tracking-tight text-foreground">
          {profile.firstName ? `${greeting}, ${profile.firstName}.` : `${greeting}.`}
        </h1>
        <p className="text-[15px] text-muted-foreground mt-1.5">
          Your personal caddie is ready.
        </p>
      </div>

      {/* Echo identity mark */}
      <div className="flex items-center gap-3 my-8 w-full max-w-[340px]">
        <div className="flex-1 h-px bg-border" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Echo
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Prompt chips */}
      <div className="w-full max-w-[340px] flex flex-col gap-2">
        {prompts.map((prompt, index) => (
          <button
            key={index}
            onClick={() => handleChipClick(prompt)}
            className="px-4 py-3 rounded-2xl text-[13px] font-medium text-left active:bg-[hsl(38,92%,50%)]/5 active:scale-[0.98] transition-all duration-150 flex items-center justify-between gap-2 bg-background border border-border"
            aria-label={`Ask Echo: ${prompt}`}
          >
            <span className="text-foreground">{prompt}</span>
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
          </button>
        ))}
      </div>

      {/* Hint */}
      <p className="mt-4 text-[12px] text-muted-foreground/60 text-center">
        Ask me anything about golf
      </p>
    </div>
  );
}
