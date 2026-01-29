/**
 * UnifiedAchievementSheet - World-Class Achievement Bottom Sheet
 * 
 * Single unified structure for ALL achievements (milestone & regional).
 * Follows exact hierarchy - no deviations:
 * 
 * 1. Drag handle
 * 2. Icon disc (72px, frosted white, Apple-style)
 * 3. Title (large, confident)
 * 4. Purpose sentence (from achievementTaglines - single source of truth)
 * 5. Status pill (emotional feedback)
 * 6. Progress module
 * 7. Primary CTA
 * 8. Secondary CTA
 * 
 * Animation triggers ONLY on locked → unlocked transition (single-fire)
 */

import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Trophy, X, ChevronRight, Check } from 'lucide-react';
import { FaLandmarkDome, FaFlagUsa } from 'react-icons/fa6';
import { GiEuropeanFlag, GiWorld } from 'react-icons/gi';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { CLUB_STEPS } from '@/lib/top100Club';
import { CLBHOUZ_ACHIEVEMENT_PALETTE, MILESTONE_PALETTE_MAP } from '@/lib/clbhouzAchievementPalette';
import { getRegionTheme, type Top100ListSlug } from '@/lib/regionTheme';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAchievementUnlock } from '@/hooks/useAchievementUnlock';
import { AchievementConfetti, getConfettiTheme } from './AchievementConfetti';
import { haptic } from '@/utils/haptics';
import { getMilestoneTagline, getRegionalTagline, REGION_FULL_NAMES } from '@/config/achievementTaglines';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type AchievementType = 'milestone' | 'regional';

interface MilestoneData {
  type: 'milestone';
  threshold: number;
  totalPlayed: number;
}

interface RegionalData {
  type: 'regional';
  listSlug: Top100ListSlug;
  played: number;
  total: number;
}

export type AchievementData = MilestoneData | RegionalData;

interface UnifiedAchievementSheetProps {
  isOpen: boolean;
  onClose: () => void;
  data: AchievementData | null;
  /** First name of the profile user (for contextual taglines) */
  firstName?: string;
  /** Whether viewing own profile (defaults to true) */
  isOwnProfile?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// REGION COLORS (from brief)
// ═══════════════════════════════════════════════════════════════════════════

const REGION_COLORS: Record<Top100ListSlug, string> = {
  global: '#C9A961',    // Soft gold
  'gb-i': '#1B4D2E',    // Deep racing green  
  usa: '#8B3A3A',       // Muted heritage red
  europe: '#5B6B7C',    // Calm slate-blue
};

// Milestone colors: neutral warm stone when locked, upgrade to tier color when unlocked
const MILESTONE_LOCKED_COLOR = '#A89F91'; // Warm stone

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

// Success green used for all unlocked achievements
const SUCCESS_COLOR = '#10b981';

function getMilestoneColor(threshold: number, isUnlocked: boolean): string {
  // Unlocked always uses success green
  if (isUnlocked) return SUCCESS_COLOR;
  
  // In progress / locked uses tier colour (never greyed out - keeps aspiration high)
  if (MILESTONE_PALETTE_MAP[threshold]) {
    return CLBHOUZ_ACHIEVEMENT_PALETTE[MILESTONE_PALETTE_MAP[threshold]];
  }
  return MILESTONE_LOCKED_COLOR;
}

function getRegionColor(listSlug: Top100ListSlug, isUnlocked: boolean): string {
  // Unlocked always uses success green
  if (isUnlocked) return SUCCESS_COLOR;
  
  // In progress / locked uses region colour
  return REGION_COLORS[listSlug];
}

function getMilestoneName(threshold: number): string {
  const tierMeta = CLUB_STEPS.find(s => s.threshold === threshold);
  return tierMeta?.tierName || `${threshold} Club`;
}

// Removed getMotivationalSubcopy - no longer used per polish spec

// ═══════════════════════════════════════════════════════════════════════════
// ICON DISC COMPONENT (72px, frosted white, Apple-style)
// ═══════════════════════════════════════════════════════════════════════════

interface IconDiscProps {
  type: AchievementType;
  regionSlug?: Top100ListSlug;
  color: string;
  isUnlocked: boolean;
  isAnimating: boolean;
  animationPhase: number; // 0-5 for animation stages
}

function IconDisc({ type, regionSlug, color, isUnlocked, isAnimating, animationPhase }: IconDiscProps) {
  const iconClass = 'w-8 h-8';
  
  // During animation: start muted, transition to filled
  const showFilled = isUnlocked && (!isAnimating || animationPhase >= 2);
  const iconColor = showFilled ? color : `${color}80`;
  const strokeWidth = showFilled ? 2.5 : 1.5;
  
  const getIcon = () => {
    if (type === 'milestone') {
      return <Trophy className={iconClass} style={{ color: iconColor }} strokeWidth={strokeWidth} />;
    }
    
    // Regional icons
    switch (regionSlug) {
      case 'global':
        return <GiWorld className={iconClass} style={{ color: iconColor }} />;
      case 'gb-i':
        return <FaLandmarkDome className={iconClass} style={{ color: iconColor }} />;
      case 'usa':
        return <FaFlagUsa className={iconClass} style={{ color: iconColor }} />;
      case 'europe':
        return <GiEuropeanFlag className={iconClass} style={{ color: iconColor }} />;
      default:
        return <Trophy className={iconClass} style={{ color: iconColor }} />;
    }
  };

  // Animation: scale from 0.96 → 1 at phase 1
  const scaleValue = isAnimating && animationPhase < 1 ? 0.96 : 1;
  const opacityValue = isAnimating && animationPhase < 1 ? 0.7 : 1;

  return (
    <div className="flex justify-center mb-5 relative">
      {/* Ring stroke animation - draws clockwise at phase 3 */}
      {isAnimating && animationPhase >= 3 && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1 }}
        >
          <svg width="80" height="80" className="absolute">
            <motion.circle
              cx="40"
              cy="40"
              r="38"
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{
                transform: 'rotate(-90deg)',
                transformOrigin: 'center',
              }}
            />
          </svg>
        </motion.div>
      )}
      
      <motion.div 
        className="w-[72px] h-[72px] rounded-full flex items-center justify-center"
        style={{
          background: 'rgba(255, 255, 255, 0.85)',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.06), inset 0 -1px 2px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.08)',
        }}
        animate={{
          scale: scaleValue,
          opacity: opacityValue,
        }}
        transition={{ duration: 0.12, ease: 'easeOut' }}
      >
        <motion.div
          animate={{
            scale: isAnimating && animationPhase === 2 ? [1, 1.1, 1] : 1,
          }}
          transition={{ duration: 0.15 }}
        >
          {getIcon()}
        </motion.div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STATUS PILL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface StatusPillProps {
  isUnlocked: boolean;
  remaining: number;
  color: string;
}

function StatusPill({ isUnlocked, remaining, color }: StatusPillProps) {
  if (isUnlocked) {
    return (
      <div className="flex justify-center mb-5">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-emerald-500/10 text-emerald-600">
          <Check className="w-3.5 h-3.5" />
          Unlocked
        </span>
      </div>
    );
  }

  // Single concise status chip - "XX courses to go"
  return (
    <div className="flex justify-center mb-5">
      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-muted text-muted-foreground">
        {remaining} {remaining === 1 ? 'course' : 'courses'} to go
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PROGRESS MODULE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface ProgressModuleProps {
  played: number;
  total: number;
  color: string; // Unified accent color (already accounts for unlock state)
  isUnlocked: boolean;
}

function ProgressModule({ played, total, color, isUnlocked }: ProgressModuleProps) {
  // Cap displayed progress at total when unlocked (e.g., 22 played but milestone is 5 → show 5/5)
  const displayedPlayed = isUnlocked ? total : played;
  const progressPercent = total > 0 ? Math.min(100, (displayedPlayed / total) * 100) : 0;
  
  return (
    <div className="rounded-xl border border-border/60 p-4 mb-5 bg-card/50">
      {/* Header row */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-muted-foreground">Progress</span>
        <span 
          className="text-sm font-bold"
          style={{ color }}
        >
          {displayedPlayed} / {total}
        </span>
      </div>

      {/* Single progress bar - rounded ends, 8-10px height */}
      <div className="h-2.5 rounded-full bg-muted overflow-hidden mb-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>

      {/* Footer copy - "Milestone achieved" or "Progress in motion" */}
      <p className="text-xs text-muted-foreground text-center">
        {isUnlocked ? 'Milestone achieved' : 'Progress in motion'}
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function UnifiedAchievementSheet({
  isOpen,
  onClose,
  data,
  firstName,
  isOwnProfile = true,
}: UnifiedAchievementSheetProps) {
  const navigate = useNavigate();
  const dragControls = useDragControls();
  
  // Animation state
  const [animationPhase, setAnimationPhase] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  // Derive values early for unlock detection
  const isMilestone = data?.type === 'milestone';
  const identifier = isMilestone 
    ? (data as MilestoneData)?.threshold 
    : (data as RegionalData)?.listSlug;
  
  const played = isMilestone 
    ? (data as MilestoneData)?.totalPlayed ?? 0
    : (data as RegionalData)?.played ?? 0;
  const total = isMilestone 
    ? (data as MilestoneData)?.threshold ?? 0
    : (data as RegionalData)?.total ?? 0;
  const isUnlocked = played >= total && total > 0;
  
  // Single-fire unlock detection
  const unlockState = useAchievementUnlock(
    isMilestone ? 'milestone' : 'regional',
    identifier ?? 0,
    isUnlocked,
    isOpen
  );
  
  const isAnimating = unlockState.shouldAnimate && !unlockState.hasAnimated;

  // Run animation sequence when unlock detected
  useEffect(() => {
    if (!isAnimating) {
      setAnimationPhase(0);
      setShowConfetti(false);
      return;
    }
    
    // Animation timeline: ≈900ms total
    // Phase 0: 0ms - Sheet opens, icon muted
    // Phase 1: 120ms - Icon disc scales 0.96 → 1, opacity increases
    // Phase 2: 240ms - Icon switches to filled, color animates in
    // Phase 3: 320ms - Ring stroke animates clockwise
    // Phase 4: 420ms - Status pill transition
    // Phase 5: 520ms - Progress bar snaps to 100%
    // Phase 6: 600-900ms - Confetti + haptic
    
    const timers: NodeJS.Timeout[] = [];
    
    timers.push(setTimeout(() => setAnimationPhase(1), 120));
    timers.push(setTimeout(() => setAnimationPhase(2), 240));
    timers.push(setTimeout(() => setAnimationPhase(3), 320));
    timers.push(setTimeout(() => setAnimationPhase(4), 420));
    timers.push(setTimeout(() => setAnimationPhase(5), 520));
    timers.push(setTimeout(() => {
      setShowConfetti(true);
      haptic('medium'); // Success haptic at icon fill moment
      unlockState.markAnimated();
    }, 600));
    
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [isAnimating, unlockState]);

  // Prevent underlying page scroll
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!data) return null;

  // Derive all display values based on type
  let title: string;
  let purposeSentence: string;
  let color: string;
  let regionSlug: Top100ListSlug | undefined;
  let primaryCtaLabel: string;
  let primaryCtaAction: () => void;
  let secondaryCtaLabel: string;
  let secondaryCtaAction: () => void;

  if (isMilestone) {
    const { threshold, totalPlayed } = data as MilestoneData;
    title = getMilestoneName(threshold);
    // Use dynamic tagline with user context
    purposeSentence = getMilestoneTagline(threshold, firstName, isOwnProfile);
    
    // Unified colour: success green when unlocked, tier colour when in progress
    color = getMilestoneColor(threshold, isUnlocked);
    
    primaryCtaLabel = isUnlocked ? 'View all achievements' : 'View unplayed Top 100 courses';
    primaryCtaAction = isUnlocked 
      ? () => { navigate('/achievements'); onClose(); }
      : () => { navigate('/top100/global?filter=unplayed'); onClose(); };
    secondaryCtaLabel = 'View all achievements';
    secondaryCtaAction = () => { navigate('/achievements'); onClose(); };
  } else {
    const { listSlug, played: p, total: t } = data as RegionalData;
    regionSlug = listSlug;
    const theme = getRegionTheme(listSlug);
    // Use full region name (not abbreviation) - e.g. "Great Britain & Ireland Top 100"
    title = REGION_FULL_NAMES[listSlug] || theme.primaryLabel;
    // Use dynamic tagline with user context
    purposeSentence = getRegionalTagline(listSlug, firstName, isOwnProfile);
    
    // Unified colour: success green when unlocked, region colour when in progress
    const isComplete = p >= t && t > 0;
    color = getRegionColor(listSlug, isComplete);
    
    primaryCtaLabel = `View ${theme.shortName} list`;
    primaryCtaAction = () => { navigate(`/top100/${listSlug}`); onClose(); };
    secondaryCtaLabel = isComplete ? 'View all achievements' : 'View unplayed courses';
    secondaryCtaAction = isComplete 
      ? () => { navigate('/achievements'); onClose(); }
      : () => { navigate(`/top100/${listSlug}?filter=unplayed`); onClose(); };
  }

  const remaining = Math.max(0, total - played);
  const confettiTheme = getConfettiTheme(isMilestone ? 'milestone' : 'regional', regionSlug);

  const content = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Confetti overlay */}
          <AchievementConfetti 
            isActive={showConfetti} 
            theme={confettiTheme}
            onComplete={() => setShowConfetti(false)}
          />
          
          {/* Backdrop - consistent dim level */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            onTouchMove={(e) => e.preventDefault()}
            className="fixed inset-0 bg-black/50 z-[120] touch-none"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) onClose();
            }}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-[130]',
              'bg-background rounded-t-3xl max-h-[85vh] overflow-hidden',
              'shadow-2xl'
            )}
            style={{
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            {/* 1. Drag handle */}
            <div
              className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Close button (top-right) */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors z-10"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Content - scrolled to top by default */}
            <div className="px-6 pt-2 pb-6">
              {/* 2. Icon disc */}
              <IconDisc 
                type={isMilestone ? 'milestone' : 'regional'}
                regionSlug={regionSlug}
                color={color}
                isUnlocked={isUnlocked}
                isAnimating={isAnimating}
                animationPhase={animationPhase}
              />

              {/* 3. Title */}
              <h2 className="text-xl font-bold text-center text-foreground mb-1">
                {title}
              </h2>

              {/* 4. Purpose sentence */}
              <p className="text-sm text-muted-foreground text-center mb-4">
                {purposeSentence}
              </p>

              {/* 5. Status pill - animate at phase 4 */}
              <motion.div
                animate={isAnimating && animationPhase >= 4 ? {
                  opacity: [0.5, 1],
                  scale: [0.95, 1],
                } : {}}
                transition={{ duration: 0.15 }}
              >
                <StatusPill 
                  isUnlocked={isUnlocked}
                  remaining={remaining}
                  color={color}
                />
              </motion.div>

              {/* 6. Progress module */}
              <ProgressModule
                played={played}
                total={total}
                color={color}
                isUnlocked={isUnlocked}
              />

              {/* 7. Primary CTA - 24px from bottom */}
              <div className="pb-6">
                <Button
                  onClick={primaryCtaAction}
                  className="w-full rounded-full font-medium text-white"
                  style={{ backgroundColor: color }}
                >
                  {primaryCtaLabel}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (typeof window === 'undefined') return null;
  return createPortal(content, document.body);
}

export default UnifiedAchievementSheet;
