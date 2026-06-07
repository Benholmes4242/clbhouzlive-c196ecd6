/**
 * EchoPageWelcome - Light dispatch welcome state
 */

import React, { useMemo } from 'react';
import { ChevronRight, Target, BookOpen, MapPin, Settings2, Plane, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { haptic } from '@/utils/haptics';
import { AnimatedEchoWave } from '@/features/echo/components/ui/AnimatedEchoWave';
import type { EchoProfile } from '@/features/echo/hooks/useEchoProfile';

function getCategoryIcon(category: CategoryTag) {
  switch (category) {
    case 'strategy': return Target;
    case 'rules': return BookOpen;
    case 'courses': return MapPin;
    case 'gear': return Settings2;
    case 'travel': return Plane;
    default: return Sparkles;
  }
}

function getSubline(): string {
  const hour = new Date().getHours();
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  let variants: string[];
  if (hour >= 5 && hour < 12) {
    variants = ['Ready when you are.', "Let's get you on the course.", 'Coffee in hand. Ask away.'];
  } else if (hour >= 12 && hour < 18) {
    variants = ["What's the plan today?", 'Mid-round questions, course advice — ask away.', 'Pick my brain.'];
  } else {
    variants = ['Wrapping up a round, or planning the next?', "Evening rounds, tomorrow's tee time — what's on your mind?", 'Ask me anything.'];
  }
  return variants[dayOfYear % variants.length];
}

interface EchoPageWelcomeProps {
  profile: EchoProfile;
  onChipSelect: (prompt: string) => void;
}

type SkillBracket = 'beginner' | 'mid' | 'low';
type RegionTag = 'gb-i' | 'europe' | 'usa' | 'global';
type CategoryTag = 'rules' | 'strategy' | 'courses' | 'gear' | 'travel' | 'general';

interface PromptMeta {
  text: string;
  skills: SkillBracket[];
  regions: RegionTag[];
  category: CategoryTag;
  personalizable?: boolean;
}

const ECHO_PROMPTS: PromptMeta[] = [
  // Strategy
  { text: "What's the best play from 155y?", skills: ['mid', 'low'], regions: [], category: 'strategy' },
  { text: "How do I play a downhill lie?", skills: [], regions: [], category: 'strategy' },
  { text: "Tips for playing in the wind", skills: [], regions: ['gb-i'], category: 'strategy', personalizable: true },
  { text: "How to escape a fairway bunker", skills: [], regions: [], category: 'strategy' },
  { text: "Best strategy for a blind tee shot", skills: ['mid', 'low'], regions: [], category: 'strategy' },
  { text: "How to play a punch shot under trees", skills: ['mid', 'low'], regions: [], category: 'strategy' },
  { text: "When should I lay up vs go for it?", skills: ['mid', 'low'], regions: [], category: 'strategy' },
  { text: "How to read a breaking putt", skills: [], regions: [], category: 'strategy' },
  { text: "Tips for playing fast greens", skills: [], regions: [], category: 'strategy' },
  { text: "How to judge distance without a rangefinder", skills: ['beginner', 'mid'], regions: [], category: 'strategy' },
  // Rules
  { text: "Explain stableford scoring", skills: [], regions: [], category: 'rules' },
  { text: "What's the rule for a lost ball?", skills: [], regions: [], category: 'rules' },
  { text: "Can I move my ball from a divot?", skills: [], regions: [], category: 'rules' },
  { text: "What's the penalty for an unplayable lie?", skills: [], regions: [], category: 'rules' },
  { text: "Explain the new stroke and distance rule", skills: ['mid', 'low'], regions: [], category: 'rules' },
  { text: "What are the rules for taking relief?", skills: [], regions: [], category: 'rules' },
  { text: "How does match play scoring work?", skills: [], regions: [], category: 'rules' },
  { text: "What's a provisional ball and when to use it?", skills: [], regions: [], category: 'rules' },
  { text: "Can I repair spike marks on the green?", skills: [], regions: [], category: 'rules' },
  { text: "What's the rule for a ball in a water hazard?", skills: [], regions: [], category: 'rules' },
  // Courses
  { text: "Course tips for Portrush", skills: [], regions: ['gb-i'], category: 'courses', personalizable: true },
  { text: "Best links courses in Scotland", skills: [], regions: ['gb-i'], category: 'courses', personalizable: true },
  { text: "Hidden gem courses near London", skills: [], regions: ['gb-i'], category: 'courses', personalizable: true },
  { text: "Top courses in Northern Ireland", skills: [], regions: ['gb-i'], category: 'courses', personalizable: true },
  { text: "Best public courses in Ireland", skills: [], regions: ['gb-i'], category: 'courses', personalizable: true },
  { text: "Bucket list courses in the UK", skills: [], regions: ['gb-i'], category: 'courses', personalizable: true },
  { text: "Best courses for beginners", skills: ['beginner'], regions: [], category: 'courses' },
  { text: "Most challenging courses in Europe", skills: ['mid', 'low'], regions: ['europe'], category: 'courses' },
  { text: "Best winter golf destinations", skills: [], regions: [], category: 'travel' },
  { text: "Courses with the best views", skills: [], regions: [], category: 'courses' },
  // Travel
  { text: "Build a 3-day NI golf trip", skills: [], regions: ['gb-i'], category: 'travel', personalizable: true },
  { text: "Plan a Scotland golf tour", skills: [], regions: ['gb-i'], category: 'travel', personalizable: true },
  { text: "Best golf resorts in Spain", skills: [], regions: ['europe'], category: 'travel' },
  { text: "Weekend golf trip ideas", skills: [], regions: [], category: 'travel' },
  { text: "Golf and stay packages in Portugal", skills: [], regions: ['europe'], category: 'travel' },
  { text: "Best time to visit St Andrews", skills: [], regions: ['gb-i'], category: 'travel', personalizable: true },
  { text: "How to book Old Course tee times", skills: [], regions: ['gb-i'], category: 'travel', personalizable: true },
  { text: "Golf trip packing checklist", skills: [], regions: [], category: 'travel' },
  { text: "Best golf destinations in March", skills: [], regions: [], category: 'travel' },
  { text: "Affordable golf trips in Europe", skills: [], regions: ['europe'], category: 'travel' },
  // Gear
  { text: "What clubs should I carry?", skills: ['beginner', 'mid'], regions: [], category: 'gear' },
  { text: "How to choose the right driver", skills: [], regions: [], category: 'gear' },
  { text: "Best golf balls for mid handicappers", skills: ['mid'], regions: [], category: 'gear', personalizable: true },
  { text: "When should I replace my grips?", skills: [], regions: [], category: 'gear' },
  { text: "Hybrid vs long iron - which is better?", skills: ['mid', 'low'], regions: [], category: 'gear' },
  { text: "Best golf shoes for walking", skills: [], regions: [], category: 'gear' },
  { text: "How to fit a putter to my stroke", skills: ['mid', 'low'], regions: [], category: 'gear' },
  { text: "What loft should my wedges be?", skills: ['mid', 'low'], regions: [], category: 'gear' },
  { text: "Best rangefinder under £200", skills: [], regions: [], category: 'gear' },
  { text: "How often should I change my ball?", skills: ['beginner', 'mid'], regions: [], category: 'gear' },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function deriveSkillBracket(handicap: number | null): SkillBracket | null {
  if (handicap === null || handicap === undefined) return null;
  if (handicap < 6) return 'low';
  if (handicap < 18) return 'mid';
  return 'beginner';
}

function deriveRegion(homeClub: string | null, location: string | null): RegionTag | null {
  const haystack = `${homeClub || ''} ${location || ''}`.toLowerCase();
  if (/\b(uk|united kingdom|england|scotland|wales|ireland|london|edinburgh|dublin|belfast)\b/.test(haystack)) return 'gb-i';
  if (/\b(spain|portugal|france|germany|italy|netherlands|belgium|sweden|denmark)\b/.test(haystack)) return 'europe';
  if (/\b(usa|united states|new york|california|florida|texas)\b/.test(haystack)) return 'usa';
  return null;
}

interface SelectedPrompt {
  text: string;
  isPersonalized: boolean;
  category: CategoryTag;
}

interface SessionPromptCache {
  prompts: SelectedPrompt[];
  expiresAt: number;
}

const SESSION_KEY = 'echo:welcome-prompts';
const SESSION_TTL_MS = 30 * 60 * 1000;

function loadCachedPrompts(): SessionPromptCache | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionPromptCache;
    if (Date.now() > parsed.expiresAt) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveCachedPrompts(prompts: SelectedPrompt[]): void {
  try {
    const cache: SessionPromptCache = { prompts, expiresAt: Date.now() + SESSION_TTL_MS };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(cache));
  } catch { /* storage quota or disabled */ }
}

function selectPrompts(profile: EchoProfile, count: number = 4): SelectedPrompt[] {
  const skill = deriveSkillBracket(profile.handicap);
  const region = deriveRegion(profile.homeClub, profile.location);

  const skillFiltered = ECHO_PROMPTS.filter(p => {
    if (p.skills.length === 0) return true;
    if (skill && p.skills.includes(skill)) return true;
    return false;
  });

  const scored = skillFiltered.map(p => {
    let score = Math.random();
    if (region && p.regions.includes(region)) score += 2.0;
    if (region && p.regions.length === 0) score += 0.3;
    return { prompt: p, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const seen = new Set<CategoryTag>();
  const selected: PromptMeta[] = [];
  for (const { prompt } of scored) {
    if (selected.length >= count) break;
    if (selected.length < count - 1 && seen.has(prompt.category)) continue;
    selected.push(prompt);
    seen.add(prompt.category);
  }
  while (selected.length < count && scored.length > selected.length) {
    const next = scored[selected.length].prompt;
    if (!selected.includes(next)) selected.push(next);
  }

  const personalizedIdx = selected.findIndex(p =>
    p.personalizable && region && p.regions.includes(region)
  );

  return selected.map((p, i) => ({
    text: p.text,
    isPersonalized: i === personalizedIdx && personalizedIdx !== -1,
    category: p.category,
  }));
}

export function EchoPageWelcome({ profile, onChipSelect }: EchoPageWelcomeProps) {
  const prompts = useMemo(() => {
    const cached = loadCachedPrompts();
    if (cached) return cached.prompts;
    const fresh = selectPrompts(profile, 4);
    saveCachedPrompts(fresh);
    return fresh;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.handicap, profile.homeClub, profile.location]);
  const greeting = getGreeting();

  const handleChipClick = (prompt: string) => {
    haptic('light');
    onChipSelect(prompt);
  };

  return (
    <div className="h-full flex flex-col items-center px-5 overflow-y-auto" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>
      <div className="flex flex-col items-center w-full my-auto py-6">
        {/* Ambient amber glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[320px] h-[320px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(247,147,30,0.08) 0%, transparent 70%)' }}
        />

        {/* Waveform orb */}
        <motion.div
          className="flex items-center justify-center mb-4 mt-0"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
        >
          <div
            className="w-[88px] h-[88px] rounded-full flex items-center justify-center"
            style={{
              background: 'radial-gradient(circle, rgba(247,147,30,0.14) 0%, transparent 70%)',
            }}
          >
            <AnimatedEchoWave size={44} active={true} />
          </div>
        </motion.div>

        {/* Greeting */}
        <div className="text-center mb-2">
          <h1
            className="text-[30px] font-extrabold"
            style={{ color: '#0F172A', letterSpacing: '-0.03em', lineHeight: 1.1 }}
          >
            {profile.firstName ? `${greeting}, ${profile.firstName}.` : `${greeting}.`}
          </h1>
          <p
            className="text-[15px] mt-1.5"
            style={{ color: '#64748B' }}
          >
            {getSubline()}
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mt-7 mb-5 w-full max-w-[340px]">
          <div className="flex-1 h-px" style={{ background: 'rgba(15,23,42,0.05)' }} />
          <span
            className="text-[9px] font-extrabold uppercase"
            style={{ color: '#94A3B8', letterSpacing: '0.16em' }}
          >
            Try asking
          </span>
          <div className="flex-1 h-px" style={{ background: 'rgba(15,23,42,0.05)' }} />
        </div>

        {/* Prompt chips */}
        <div className="w-full max-w-[340px] flex flex-col gap-[6px]">
          {prompts.map((prompt, index) => {
            const CategoryIcon = getCategoryIcon(prompt.category);
            return (
              <button
                key={index}
                onClick={() => handleChipClick(prompt.text)}
                className="px-4 py-[11px] rounded-[13px] text-[13px] font-medium text-left active:scale-[0.98] transition-all duration-150 flex items-center justify-between gap-2.5"
                style={{
                  background: prompt.isPersonalized
                    ? 'linear-gradient(135deg, rgba(247,147,30,0.06), #ffffff)'
                    : '#ffffff',
                  border: prompt.isPersonalized
                    ? '1px solid rgba(247,147,30,0.20)'
                    : '1px solid rgba(15,23,42,0.07)',
                }}
                aria-label={`Ask Echo: ${prompt.text}`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <CategoryIcon
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: 'rgba(247,147,30,0.65)' }}
                    strokeWidth={2}
                  />
                  {prompt.isPersonalized && (
                    <span
                      className="flex-shrink-0 rounded text-[8px] font-extrabold uppercase"
                      style={{ background: 'rgba(247,147,30,0.15)', color: '#F7931E', padding: '2px 6px', letterSpacing: '0.14em' }}
                    >
                      For You
                    </span>
                  )}
                  <span style={{ color: '#0F172A' }} className="truncate">{prompt.text}</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(247,147,30,0.4)' }} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
