/**
 * UnifiedAchievementSheet - World-Class Achievement Bottom Sheet
 * 
 * Single unified structure for ALL achievements (milestone & regional).
 * Uses actual badge images, tier-specific colours, and positive framing.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, ChevronRight, Check } from 'lucide-react';
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
import { MILESTONE_BADGE_IMAGES, REGION_BADGE_IMAGES } from '@/config/badgeImages';

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

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function getMilestoneColor(threshold: number): string {
  // Always use the tier's own primary colour — both locked and unlocked
  const paletteKey = MILESTONE_PALETTE_MAP[threshold];
  if (paletteKey) {
    return CLBHOUZ_ACHIEVEMENT_PALETTE[paletteKey];
  }
  return '#A89F91'; // Warm stone fallback
}

function getRegionColor(listSlug: Top100ListSlug): string {
  return REGION_COLORS[listSlug];
}

function getMilestoneName(threshold: number): string {
  const tierMeta = CLUB_STEPS.find(s => s.threshold === threshold);
  return tierMeta?.tierName || `${threshold} Club`;
}

/** Get status text with positive framing for distant milestones */
function getStatusText(played: number, threshold: number, isUnlocked: boolean): string {
  if (isUnlocked) return 'Unlocked';
  
  const remaining = threshold - played;
  
  // Near completion (≤10 away) — urgency framing
  if (remaining <= 10) return `${remaining} course${remaining === 1 ? '' : 's'} to go`;
  
  // Mid-range and far-off — positive framing
  return `${played} of ${threshold} played`;
}

/** Get context-specific CTA text */
function getCtaText(type: string, isUnlocked: boolean, remaining: number): string {
  if (type === 'regional') return ''; // handled separately per-region
  
  if (isUnlocked) return 'View all achievements';
  if (remaining <= 3) return 'Find your next Top 100 course';
  return 'Browse Top 100 courses';
}

// ═══════════════════════════════════════════════════════════════════════════
// ICON DISC COMPONENT — Uses actual badge images
// ═══════════════════════════════════════════════════════════════════════════

interface IconDiscProps {
  type: AchievementType;
  threshold?: number;
  regionSlug?: Top100ListSlug;
  color: string;
  isUnlocked: boolean;
  isAnimating: boolean;
  animationPhase: number;
}

function IconDisc({ type, threshold, regionSlug, color, isUnlocked, isAnimating, animationPhase }: IconDiscProps) {
  // Get actual badge image
  const badgeImage = type === 'milestone' && threshold
    ? MILESTONE_BADGE_IMAGES[threshold]
    : regionSlug
      ? REGION_BADGE_IMAGES[regionSlug]
      : undefined;

  // Animation: scale from 0.96 → 1 at phase 1
  const scaleValue = isAnimating && animationPhase < 1 ? 0.96 : 1;
  const opacityValue = isAnimating && animationPhase < 1 ? 0.7 : 1;

  // During animation: start muted, transition to filled
  const showFilled = isUnlocked && (!isAnimating || animationPhase >= 2);

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
          <svg width="96" height="96" className="absolute">
            <motion.circle
              cx="48"
              cy="48"
              r="46"
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
        className="flex items-center justify-center"
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
          {badgeImage ? (
            <img
              src={badgeImage}
              alt={type === 'milestone' ? getMilestoneName(threshold ?? 0) : (regionSlug ?? 'badge')}
              className={cn(
                'w-20 h-24 object-contain drop-shadow-md transition-all duration-200',
                !showFilled && !isUnlocked && 'opacity-60 grayscale-[40%]'
              )}
            />
          ) : (
            // Fallback disc (should never appear with correct config)
            <div
              className="w-[72px] h-[72px] rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(255, 255, 255, 0.85)',
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.08)',
              }}
            />
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STATUS PILL COMPONENT — Tier-coloured with positive framing
// ═══════════════════════════════════════════════════════════════════════════

interface StatusPillProps {
  isUnlocked: boolean;
  statusText: string;
  color: string;
}

function StatusPill({ isUnlocked, statusText, color }: StatusPillProps) {
  if (isUnlocked) {
    return (
      <div className="flex justify-center mb-5">
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
          style={{
            backgroundColor: `${color}18`,
            color: color,
          }}
        >
          <Check className="w-3.5 h-3.5" />
          Unlocked
        </span>
      </div>
    );
  }

  return (
    <div className="flex justify-center mb-5">
      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-muted text-muted-foreground">
        {statusText}
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
  color: string;
  isUnlocked: boolean;
}

function ProgressModule({ played, total, color, isUnlocked }: ProgressModuleProps) {
  const displayedPlayed = isUnlocked ? total : played;
  const progressPercent = total > 0 ? Math.min(100, (displayedPlayed / total) * 100) : 0;
  
  return (
    <div className="rounded-xl border border-border/60 p-4 mb-5 bg-card/50">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-muted-foreground">Progress</span>
        <span 
          className="text-sm font-bold"
          style={{ color }}
        >
          {displayedPlayed} / {total}
        </span>
      </div>

      <div className="h-2.5 rounded-full bg-muted overflow-hidden mb-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>

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
  
  const [animationPhase, setAnimationPhase] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

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
  
  const unlockState = useAchievementUnlock(
    isMilestone ? 'milestone' : 'regional',
    identifier ?? 0,
    isUnlocked,
    isOpen
  );
  
  const isAnimating = unlockState.shouldAnimate && !unlockState.hasAnimated;

  useEffect(() => {
    if (!isAnimating) {
      setAnimationPhase(0);
      setShowConfetti(false);
      return;
    }
    
    const timers: NodeJS.Timeout[] = [];
    timers.push(setTimeout(() => setAnimationPhase(1), 120));
    timers.push(setTimeout(() => setAnimationPhase(2), 240));
    timers.push(setTimeout(() => setAnimationPhase(3), 320));
    timers.push(setTimeout(() => setAnimationPhase(4), 420));
    timers.push(setTimeout(() => setAnimationPhase(5), 520));
    timers.push(setTimeout(() => {
      setShowConfetti(true);
      haptic('medium');
      unlockState.markAnimated();
    }, 600));
    
    return () => { timers.forEach(clearTimeout); };
  }, [isAnimating, unlockState]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  if (!data) return null;

  // Derive all display values
  let title: string;
  let purposeSentence: string;
  let color: string;
  let regionSlug: Top100ListSlug | undefined;
  let milestoneThreshold: number | undefined;
  let primaryCtaLabel: string;
  let primaryCtaAction: () => void;

  if (isMilestone) {
    const { threshold, totalPlayed } = data as MilestoneData;
    milestoneThreshold = threshold;
    title = getMilestoneName(threshold);
    purposeSentence = getMilestoneTagline(threshold, firstName, isOwnProfile);
    color = getMilestoneColor(threshold);
    
    const remaining = Math.max(0, threshold - totalPlayed);
    primaryCtaLabel = getCtaText('milestone', isUnlocked, remaining);
    primaryCtaAction = isUnlocked 
      ? () => { navigate('/achievements'); onClose(); }
      : () => { navigate('/top100/global?filter=unplayed'); onClose(); };
  } else {
    const { listSlug, played: p, total: t } = data as RegionalData;
    regionSlug = listSlug;
    const theme = getRegionTheme(listSlug);
    title = REGION_FULL_NAMES[listSlug] || theme.primaryLabel;
    purposeSentence = getRegionalTagline(listSlug, firstName, isOwnProfile);
    color = getRegionColor(listSlug);
    
    primaryCtaLabel = `View ${theme.shortName} list`;
    primaryCtaAction = () => { navigate(`/top100/${listSlug}`); onClose(); };
  }

  const remaining = Math.max(0, total - played);
  const statusText = getStatusText(played, total, isUnlocked);
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
          
          {/* Backdrop */}
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

            {/* Close button — 44px tap target */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-muted active:scale-[0.95] transition-transform z-10"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Content */}
            <div className="px-6 pt-2 pb-6">
              {/* 2. Icon disc — actual badge image */}
              <IconDisc 
                type={isMilestone ? 'milestone' : 'regional'}
                threshold={milestoneThreshold}
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

              {/* 5. Status pill — tier-coloured, positive framing */}
              <motion.div
                animate={isAnimating && animationPhase >= 4 ? {
                  opacity: [0.5, 1],
                  scale: [0.95, 1],
                } : {}}
                transition={{ duration: 0.15 }}
              >
                <StatusPill 
                  isUnlocked={isUnlocked}
                  statusText={statusText}
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

              {/* 7. Primary CTA — tier-coloured */}
              <div className="pb-6">
                <Button
                  onClick={primaryCtaAction}
                  className="w-full rounded-full font-medium text-white min-h-[44px] active:scale-[0.98] transition-transform"
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
