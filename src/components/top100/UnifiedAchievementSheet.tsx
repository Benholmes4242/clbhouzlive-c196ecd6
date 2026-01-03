/**
 * UnifiedAchievementSheet - World-Class Achievement Bottom Sheet
 * 
 * Single unified structure for ALL achievements (milestone & regional).
 * Follows exact hierarchy - no deviations:
 * 
 * 1. Drag handle
 * 2. Icon disc (72px, frosted white, Apple-style)
 * 3. Title (large, confident)
 * 4. Purpose sentence
 * 5. Status pill (emotional feedback)
 * 6. Progress module
 * 7. Primary CTA
 * 8. Secondary CTA
 */

import React, { useEffect } from 'react';
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

function getMilestoneColor(threshold: number): string {
  if (MILESTONE_PALETTE_MAP[threshold]) {
    return CLBHOUZ_ACHIEVEMENT_PALETTE[MILESTONE_PALETTE_MAP[threshold]];
  }
  return MILESTONE_LOCKED_COLOR;
}

function getMilestoneName(threshold: number): string {
  const tierMeta = CLUB_STEPS.find(s => s.threshold === threshold);
  return tierMeta?.tierName || `${threshold} Club`;
}

function getMotivationalSubcopy(remaining: number): string {
  if (remaining <= 3) return 'Momentum building';
  if (remaining <= 10) return 'Keep chipping away';
  if (remaining <= 25) return 'On the hunt';
  return 'More ahead';
}

// ═══════════════════════════════════════════════════════════════════════════
// ICON DISC COMPONENT (72px, frosted white, Apple-style)
// ═══════════════════════════════════════════════════════════════════════════

interface IconDiscProps {
  type: AchievementType;
  regionSlug?: Top100ListSlug;
  color: string;
  isUnlocked: boolean;
}

function IconDisc({ type, regionSlug, color, isUnlocked }: IconDiscProps) {
  const iconClass = isUnlocked ? 'w-8 h-8' : 'w-8 h-8';
  const iconColor = isUnlocked ? color : `${color}80`; // Muted version for locked
  
  const getIcon = () => {
    if (type === 'milestone') {
      return <Trophy className={iconClass} style={{ color: iconColor }} strokeWidth={isUnlocked ? 2.5 : 1.5} />;
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

  return (
    <div className="flex justify-center mb-5">
      <div 
        className="w-[72px] h-[72px] rounded-full flex items-center justify-center"
        style={{
          background: 'rgba(255, 255, 255, 0.85)',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.06), inset 0 -1px 2px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.08)',
        }}
      >
        {getIcon()}
      </div>
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
      <div className="flex flex-col items-center gap-1 mb-5">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-emerald-500/10 text-emerald-600">
          <Check className="w-3.5 h-3.5" />
          Unlocked
        </span>
      </div>
    );
  }

  // In Progress (close) or Locked (far away)
  const isInProgress = remaining <= 50;
  const subcopy = getMotivationalSubcopy(remaining);
  
  return (
    <div className="flex flex-col items-center gap-1 mb-5">
      <span 
        className={cn(
          "inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium",
          isInProgress 
            ? "bg-amber-500/10 text-amber-700" 
            : "bg-muted text-muted-foreground"
        )}
      >
        {remaining} {remaining === 1 ? 'more course' : 'more courses'} to unlock
      </span>
      <span className="text-xs text-muted-foreground/70">
        {subcopy}
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
  const progressPercent = total > 0 ? Math.min(100, (played / total) * 100) : 0;
  const remaining = Math.max(0, total - played);
  
  return (
    <div className="rounded-xl border border-border/60 p-4 mb-5 bg-card/50">
      {/* Header row */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-muted-foreground">Progress</span>
        <span 
          className="text-sm font-bold"
          style={{ color: isUnlocked ? '#10b981' : color }}
        >
          {played} / {total}
        </span>
      </div>

      {/* Single progress bar - rounded ends, 8-10px height */}
      <div className="h-2.5 rounded-full bg-muted overflow-hidden mb-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{
            backgroundColor: isUnlocked ? '#10b981' : color,
          }}
        />
      </div>

      {/* Dynamic copy below bar */}
      <p className="text-xs text-muted-foreground text-center">
        {isUnlocked 
          ? 'Achievement complete' 
          : `${remaining} more ${remaining === 1 ? 'course' : 'courses'} to go`
        }
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
}: UnifiedAchievementSheetProps) {
  const navigate = useNavigate();
  const dragControls = useDragControls();

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
  const isMilestone = data.type === 'milestone';
  
  let title: string;
  let purposeSentence: string;
  let played: number;
  let total: number;
  let color: string;
  let regionSlug: Top100ListSlug | undefined;
  let primaryCtaLabel: string;
  let primaryCtaAction: () => void;
  let secondaryCtaLabel: string;
  let secondaryCtaAction: () => void;

  if (isMilestone) {
    const { threshold, totalPlayed } = data as MilestoneData;
    title = getMilestoneName(threshold);
    purposeSentence = `Awarded for playing ${threshold} Top 100 courses worldwide`;
    played = totalPlayed;
    total = threshold;
    color = totalPlayed >= threshold ? getMilestoneColor(threshold) : MILESTONE_LOCKED_COLOR;
    
    const isUnlocked = totalPlayed >= threshold;
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
    title = theme.primaryLabel;
    purposeSentence = `Complete the ${theme.shortName} Top 100 to earn this badge`;
    played = p;
    total = t;
    color = REGION_COLORS[listSlug];
    
    const isComplete = p >= t && t > 0;
    primaryCtaLabel = `View ${theme.shortName} list`;
    primaryCtaAction = () => { navigate(`/top100/${listSlug}`); onClose(); };
    secondaryCtaLabel = isComplete ? 'View all achievements' : 'View unplayed courses';
    secondaryCtaAction = isComplete 
      ? () => { navigate('/achievements'); onClose(); }
      : () => { navigate(`/top100/${listSlug}?filter=unplayed`); onClose(); };
  }

  const isUnlocked = played >= total && total > 0;
  const remaining = Math.max(0, total - played);

  const content = (
    <AnimatePresence>
      {isOpen && (
        <>
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
              />

              {/* 3. Title */}
              <h2 className="text-xl font-bold text-center text-foreground mb-1">
                {title}
              </h2>

              {/* 4. Purpose sentence */}
              <p className="text-sm text-muted-foreground text-center mb-4">
                {purposeSentence}
              </p>

              {/* 5. Status pill */}
              <StatusPill 
                isUnlocked={isUnlocked}
                remaining={remaining}
                color={color}
              />

              {/* 6. Progress module */}
              <ProgressModule
                played={played}
                total={total}
                color={color}
                isUnlocked={isUnlocked}
              />

              {/* 7. Primary CTA */}
              <div className="space-y-3">
                <Button
                  onClick={primaryCtaAction}
                  className="w-full rounded-full font-medium text-white"
                  style={{ backgroundColor: isUnlocked ? '#10b981' : color }}
                >
                  {primaryCtaLabel}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>

                {/* 8. Secondary CTA (text button, low visual weight) */}
                {(!isUnlocked || !isMilestone) && (
                  <button
                    onClick={secondaryCtaAction}
                    className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                  >
                    {secondaryCtaLabel}
                  </button>
                )}
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
