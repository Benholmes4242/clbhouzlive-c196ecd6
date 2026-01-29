/**
 * MilestoneUnlockSheet - Premium celebration for milestone unlocks
 * Phase 2: Enhanced with bigger badge, confetti, and stronger "earned" feeling
 * Phase 5: Tier-colored confetti, badge scale animation, enhanced celebrations
 */

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Trophy, Share2, ChevronRight, Sparkles, X, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Confetti from 'react-confetti';
import { ACHIEVEMENT_MILESTONES, MILESTONE_TIER_META } from '@/config/achievements';
import { CLBHOUZ_ACHIEVEMENT_PALETTE, MILESTONE_PALETTE_MAP } from '@/lib/clbhouzAchievementPalette';
import { haptic } from '@/utils/haptics';

// Import badge images for celebration display
import rookieBadgeImage from '@/assets/badges/rookie-badge.png';
import fairwayBadgeImage from '@/assets/badges/fairway-badge.png';
import foundersBadgeImage from '@/assets/badges/founders-badge.png';
import heritageBadgeImage from '@/assets/badges/heritage-badge.png';
import centuryBadgeImage from '@/assets/badges/century-badge.png';
import eliteBadgeImage from '@/assets/badges/elite-badge.png';
import legendaryBadgeImage from '@/assets/badges/legendary-badge.png';
import grandslamBadgeImage from '@/assets/badges/grandslam-badge.png';

interface MilestoneUnlockSheetProps {
  totalPlayed: number;
  onShare?: () => void;
}

const SNOOZE_STORAGE_KEY = 'quest-milestone-snooze-until';

interface Milestone {
  id: string;
  name: string;
  threshold: number;
  description: string;
  tierName: string;
  accentColor: string;
  badgeImage?: string;
}

const STORAGE_KEY = 'quest-milestones-seen';

// Badge image mapping
const BADGE_IMAGES: Record<number, string> = {
  5: rookieBadgeImage,
  10: fairwayBadgeImage,
  20: foundersBadgeImage,
  50: heritageBadgeImage,
  100: centuryBadgeImage,
  200: eliteBadgeImage,
  300: legendaryBadgeImage,
  400: grandslamBadgeImage,
};

// Phase 5: Tier-specific confetti color palettes
const TIER_CONFETTI_COLORS: Record<number, string[]> = {
  5: ['#D4A574', '#C08050', '#E8C4A0', '#B8860B'],     // Copper/Bronze
  10: ['#94A3B8', '#64748B', '#CBD5E1', '#E2E8F0'],   // Silver/Slate
  20: ['#F0C850', '#D4AF37', '#FFD700', '#E8C96A'],   // Classic Gold
  50: ['#64748B', '#475569', '#94A3B8', '#334155'],   // Steel Blue
  100: ['#1E1E1E', '#D4AF37', '#F0C850', '#FFD700'],  // Black & Gold
  200: ['#A8A29E', '#78716C', '#D6D3D1', '#57534E'],  // Warm Stone
  300: ['#8B5CF6', '#7C3AED', '#A78BFA', '#C4B5FD'],  // Royal Violet
  400: ['#FBBF24', '#F59E0B', '#FCD34D', '#D97706'],  // Radiant Amber
};

// Build milestones from single source of truth
const MILESTONES: Milestone[] = MILESTONE_TIER_META.map(meta => {
  const paletteKey = MILESTONE_PALETTE_MAP[meta.threshold];
  const accentColor = paletteKey ? CLBHOUZ_ACHIEVEMENT_PALETTE[paletteKey] : '#D2B461';
  
  return {
    id: `${meta.threshold}-club`,
    name: `${meta.threshold} Club`,
    threshold: meta.threshold,
    description: meta.threshold === 100 
      ? 'You have completed the Top 100 Quest'
      : `You have played ${meta.threshold} Top 100 courses`,
    tierName: meta.tierName,
    accentColor,
    badgeImage: BADGE_IMAGES[meta.threshold],
  };
});

function getSeenMilestones(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function markMilestoneSeen(id: string) {
  try {
    const seen = getSeenMilestones();
    seen.add(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]));
  } catch {
    // Ignore storage errors
  }
}

function isSnoozeActive(): boolean {
  try {
    const snoozeUntil = localStorage.getItem(SNOOZE_STORAGE_KEY);
    if (!snoozeUntil) return false;
    return Date.now() < parseInt(snoozeUntil, 10);
  } catch {
    return false;
  }
}

function activateSnooze(): void {
  try {
    // Snooze for 7 days
    const snoozeUntil = Date.now() + (7 * 24 * 60 * 60 * 1000);
    localStorage.setItem(SNOOZE_STORAGE_KEY, snoozeUntil.toString());
  } catch {
    // Ignore storage errors
  }
}

export const MilestoneUnlockSheet: React.FC<MilestoneUnlockSheetProps> = ({
  totalPlayed,
  onShare,
}) => {
  const [unlockedMilestone, setUnlockedMilestone] = useState<Milestone | null>(null);
  const [progress, setProgress] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // Get window size for confetti
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  useEffect(() => {
    // Check if snoozed - don't show unlocks
    if (isSnoozeActive()) return;
    
    // Find newly unlocked milestone
    const seen = getSeenMilestones();
    
    for (const milestone of MILESTONES) {
      if (totalPlayed >= milestone.threshold && !seen.has(milestone.id)) {
        setUnlockedMilestone(milestone);
        // Phase 5: Trigger haptic immediately on unlock detection
        haptic('medium');
        // Animate progress bar and confetti
        setTimeout(() => {
          setProgress(100);
          setShowConfetti(true);
          haptic('heavy'); // Strong haptic at celebration peak
        }, 300);
        // Stop confetti after 3 seconds
        setTimeout(() => setShowConfetti(false), 3500);
        break;
      }
    }
  }, [totalPlayed]);

  const handleClose = useCallback(() => {
    if (unlockedMilestone) {
      markMilestoneSeen(unlockedMilestone.id);
    }
    setUnlockedMilestone(null);
    setProgress(0);
    setShowConfetti(false);
  }, [unlockedMilestone]);

  const handleNotNow = useCallback(() => {
    activateSnooze();
    if (unlockedMilestone) {
      markMilestoneSeen(unlockedMilestone.id);
    }
    setUnlockedMilestone(null);
    setProgress(0);
    setShowConfetti(false);
  }, [unlockedMilestone]);

  const handleShare = useCallback(() => {
    onShare?.();
    handleClose();
  }, [onShare, handleClose]);

  if (!unlockedMilestone) return null;

  const accentColor = unlockedMilestone.accentColor;
  // Phase 5: Use tier-specific confetti colors
  const confettiColors = TIER_CONFETTI_COLORS[unlockedMilestone.threshold] || [accentColor, '#D2B461', '#88B67B', '#5B9E55'];

  return (
    <Sheet open={!!unlockedMilestone} onOpenChange={handleClose}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-t overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F9FAFB 100%)',
          borderColor: 'var(--quest-stroke)',
        }}
      >
        {/* Phase 5: Tier-colored confetti */}
        {showConfetti && (
          <Confetti
            width={windowSize.width}
            height={400}
            recycle={false}
            numberOfPieces={180}
            gravity={0.25}
            colors={confettiColors}
            style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
          />
        )}

        {/* Not now button - top left */}
        <button
          onClick={handleNotNow}
          className="absolute top-4 left-4 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors hover:bg-black/5 z-20"
          style={{ color: 'var(--quest-text-tertiary)' }}
        >
          <X className="w-3.5 h-3.5" />
          Not now
        </button>

        <div className="py-8 text-center relative">
          {/* Background glow */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 50% 30%, ${accentColor}15 0%, transparent 60%)`,
            }}
          />

          {/* Phase 5: Enhanced badge display with scale animation */}
          <motion.div 
            className="flex justify-center mb-6 relative"
            initial={{ scale: 0.8, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ 
              type: 'spring', 
              stiffness: 300, 
              damping: 20,
              delay: 0.1 
            }}
          >
            {/* Outer glow ring */}
            <motion.div
              className="absolute inset-0 m-auto"
              style={{
                width: 140,
                height: 140,
                background: `radial-gradient(circle, ${accentColor}30 0%, transparent 60%)`,
                filter: 'blur(20px)',
              }}
              animate={{
                opacity: [0.5, 0.9, 0.5],
                scale: [1, 1.15, 1],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            
            {/* Badge image or trophy icon */}
            {unlockedMilestone.badgeImage ? (
              <motion.img
                src={unlockedMilestone.badgeImage}
                alt={unlockedMilestone.tierName}
                className="relative w-28 h-32 object-contain drop-shadow-2xl"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 400, 
                  damping: 15,
                  delay: 0.2 
                }}
              />
            ) : (
              <div
                className="relative w-24 h-24 rounded-3xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(145deg, ${accentColor}20 0%, ${accentColor}10 100%)`,
                  border: `2px solid ${accentColor}40`,
                  boxShadow: `0 8px 32px ${accentColor}30`,
                }}
              >
                <Trophy className="w-12 h-12" style={{ color: accentColor }} />
              </div>
            )}
            
            {/* Sparkle decoration */}
            <motion.div
              className="absolute -top-2 -right-2"
              animate={{ rotate: [0, 15, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles className="w-7 h-7" style={{ color: accentColor }} />
            </motion.div>
          </motion.div>

          {/* Title section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p
              className="text-xs font-bold uppercase tracking-widest mb-2"
              style={{ color: accentColor }}
            >
              Milestone Unlocked
            </p>
            <h2
              className="text-3xl font-bold mb-1"
              style={{ color: 'var(--quest-text-primary)' }}
            >
              {unlockedMilestone.name}
            </h2>
            <p
              className="text-sm font-medium mb-1"
              style={{ color: 'var(--quest-text-secondary)' }}
            >
              {unlockedMilestone.tierName}
            </p>
            <p
              className="text-sm mb-6"
              style={{ color: 'var(--quest-text-tertiary)' }}
            >
              {unlockedMilestone.description}
            </p>
          </motion.div>

          {/* Progress bar animation */}
          <motion.div 
            className="px-8 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div
              className="h-3 rounded-full overflow-hidden"
              style={{ 
                background: 'var(--quest-track)',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.08)',
              }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor}CC 100%)`,
                  boxShadow: `0 0 12px ${accentColor}50`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs font-medium" style={{ color: 'var(--quest-text-tertiary)' }}>
                Progress
              </span>
              <span className="text-xs font-bold" style={{ color: accentColor }}>
                {totalPlayed} / {unlockedMilestone.threshold}
              </span>
            </div>
          </motion.div>

          {/* Achievement badge */}
          <motion.div
            className="flex justify-center mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, type: 'spring' }}
          >
            <div
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold"
              style={{
                background: `${accentColor}15`,
                border: `1.5px solid ${accentColor}35`,
                color: accentColor,
              }}
            >
              <Trophy className="w-4 h-4" />
              Achievement Earned
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div 
            className="flex gap-3 px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Button
              variant="outline"
              className="flex-1 h-12"
              onClick={handleShare}
              style={{
                background: 'var(--quest-card)',
                borderColor: 'var(--quest-stroke)',
                color: 'var(--quest-text-primary)',
              }}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button
              className="flex-1 h-12 font-semibold"
              onClick={handleClose}
              style={{
                background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}DD 100%)`,
                color: '#000',
                boxShadow: `0 4px 12px ${accentColor}40`,
              }}
            >
              Continue
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MilestoneUnlockSheet;
