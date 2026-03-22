/**
 * EchoPageWelcome - Personalised empty state with time-aware greeting
 */

import React, { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { haptic } from '@/utils/haptics';
import { AnimatedEchoWave } from '@/features/echo/components/ui/AnimatedEchoWave';
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
      {/* Animated waveform hero */}
      <motion.div
        className="flex items-center justify-center my-6"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
      >
        <div
          className="w-[88px] h-[88px] rounded-full flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle, rgba(245,166,35,0.12) 0%, transparent 70%)',
          }}
        >
          <AnimatedEchoWave size={44} active={true} />
        </div>
      </motion.div>

      {/* Greeting block */}
      <div className="text-center mb-2">
        <h1 className="text-[28px] font-bold tracking-tight" style={{ color: '#0f172a' }}>
          {profile.firstName ? `${greeting}, ${profile.firstName}.` : `${greeting}.`}
        </h1>
        <p className="text-[15px] mt-1.5" style={{ color: '#64748b' }}>
          Your personal caddie is ready.
        </p>
      </div>

      {/* Divider with label */}
      <div className="flex items-center gap-3 my-6 w-full max-w-[340px]">
        <div className="flex-1 h-px" style={{ background: 'rgba(0,0,0,0.06)' }} />
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: '#94a3b8' }}>
          Try asking
        </span>
        <div className="flex-1 h-px" style={{ background: 'rgba(0,0,0,0.06)' }} />
      </div>

      {/* Prompt chips */}
      <div className="w-full max-w-[340px] flex flex-col gap-2">
        {prompts.map((prompt, index) => (
          <button
            key={index}
            onClick={() => handleChipClick(prompt)}
            className="px-4 py-3 rounded-[14px] text-[13px] font-medium text-left active:scale-[0.98] transition-all duration-150 flex items-center justify-between gap-2"
            style={{
              background: '#ffffff',
              border: '1px solid rgba(0,0,0,0.07)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
            aria-label={`Ask Echo: ${prompt}`}
          >
            <span style={{ color: '#0f172a' }}>{prompt}</span>
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#94a3b8' }} />
          </button>
        ))}
      </div>

      {/* Hint */}
      <p className="mt-4 text-[12px] text-center" style={{ color: 'rgba(100,116,139,0.6)' }}>
        Ask me anything about golf
      </p>
    </div>
  );
}
