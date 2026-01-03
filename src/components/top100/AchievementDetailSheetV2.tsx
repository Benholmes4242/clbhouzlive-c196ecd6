/**
 * AchievementDetailSheetV2 - Gamified Premium Achievement Detail Sheet
 * 
 * Single sheet, multiple entry points:
 * - Closest Badge card
 * - "X more to..." nudge pill
 * - Any milestone tile in the milestone carousel
 * 
 * All triggers pass threshold as primary key.
 * 
 * Features:
 * - Tier-specific title, subtitle, and flavour line
 * - Tier-specific icon + trophy/crest styling with glass ring
 * - Tier-specific glow intensity (subtle → strong for higher tiers)
 * - Progress module with dynamic tone (locked vs unlocked)
 * - Context-aware CTAs
 * - Proper z-layer + footer-safe sheet behaviour
 */

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Trophy, X, ChevronRight, Check } from 'lucide-react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { CLUB_STEPS, type Top100ClubMeta } from '@/lib/top100Club';
import { MILESTONE_THEMES, type MilestoneTier } from '@/lib/globalAchievementMilestoneSystem';
import { CLBHOUZ_ACHIEVEMENT_PALETTE, MILESTONE_PALETTE_MAP } from '@/lib/clbhouzAchievementPalette';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AchievementDetailSheetV2Props {
  isOpen: boolean;
  onClose: () => void;
  threshold: number | null;
  totalTop100Played: number;
  context?: 'closest' | 'nudge' | 'milestone';
}

function getTierMeta(threshold: number): Top100ClubMeta | undefined {
  return CLUB_STEPS.find(s => s.threshold === threshold);
}

function getTierTheme(threshold: number) {
  return MILESTONE_THEMES[threshold as MilestoneTier];
}

function getTierAccentColor(threshold: number): string {
  if (MILESTONE_PALETTE_MAP[threshold]) {
    return CLBHOUZ_ACHIEVEMENT_PALETTE[MILESTONE_PALETTE_MAP[threshold]];
  }
  return '#94a3b8';
}

function getGlowIntensity(threshold: number): { opacity: number; blur: number; spread: number } {
  // Higher tiers get stronger glow
  const intensityMap: Record<number, { opacity: number; blur: number; spread: number }> = {
    5: { opacity: 0.08, blur: 12, spread: 4 },
    10: { opacity: 0.10, blur: 14, spread: 5 },
    20: { opacity: 0.12, blur: 16, spread: 6 },
    50: { opacity: 0.15, blur: 18, spread: 7 },
    100: { opacity: 0.18, blur: 20, spread: 8 },
    200: { opacity: 0.22, blur: 24, spread: 10 },
    300: { opacity: 0.28, blur: 28, spread: 12 },
    400: { opacity: 0.35, blur: 32, spread: 14 },
  };
  return intensityMap[threshold] || { opacity: 0.10, blur: 14, spread: 5 };
}

function getMicroMotivation(remaining: number): string {
  if (remaining <= 3) return 'So close.';
  if (remaining <= 10) return 'Momentum building.';
  return 'Keep chipping away.';
}

export function AchievementDetailSheetV2({
  isOpen,
  onClose,
  threshold,
  totalTop100Played,
  context,
}: AchievementDetailSheetV2Props) {
  const navigate = useNavigate();
  const dragControls = useDragControls();

  // Prevent the underlying page from scrolling while the sheet is open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!threshold) return null;

  const tierMeta = getTierMeta(threshold);
  const tierTheme = getTierTheme(threshold);
  const accentColor = getTierAccentColor(threshold);
  const glowConfig = getGlowIntensity(threshold);

  if (!tierMeta) return null;

  const isUnlocked = totalTop100Played >= threshold;
  const remaining = Math.max(0, threshold - totalTop100Played);
  const progressPercent = Math.min(100, (totalTop100Played / threshold) * 100);

  const handleViewCourses = () => {
    navigate('/top100/global?filter=unplayed');
    onClose();
  };

  const handleViewAchievements = () => {
    navigate('/achievements');
    onClose();
  };

  const content = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - must sit above bottom nav (nav is z-100) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            onTouchMove={(e) => e.preventDefault()}
            className="fixed inset-0 bg-black/50 z-[120] touch-none"
          />

          {/* Sheet - sit above bottom nav by offsetting by its height */}
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
              "fixed bottom-0 left-0 right-0 z-[130]",
              "bg-background rounded-t-3xl max-h-[85vh] overflow-hidden",
              "shadow-2xl"
            )}
            style={{
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)',
            }}
          >
            {/* Drag handle */}
            <div
              className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors z-10"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Content - nudged slightly upward for visual balance */}
            <div className="px-6 pb-6 pt-1">
              {/* Hero Medal - gamified "level" feel */}
              <div className="flex justify-center mb-5">
                <div className="relative">
                  {/* Outer glow ring - tier-specific intensity */}
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `radial-gradient(circle, ${accentColor}${Math.round(glowConfig.opacity * 255).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
                      transform: `scale(${1.3 + (glowConfig.spread / 50)})`,
                      filter: `blur(${glowConfig.blur}px)`,
                    }}
                  />
                  
                  {/* Glass ring container */}
                  <div
                    className="relative w-20 h-20 rounded-full flex items-center justify-center"
                    style={{
                      background: isUnlocked
                        ? `linear-gradient(135deg, ${tierTheme?.bgLight || accentColor}40, ${tierTheme?.bgDark || accentColor}60)`
                        : 'linear-gradient(135deg, hsl(210 20% 98%), hsl(210 15% 94%))',
                      border: `2px solid ${isUnlocked ? accentColor : 'hsl(210 15% 85%)'}`,
                      boxShadow: isUnlocked
                        ? `0 0 ${glowConfig.blur}px ${accentColor}${Math.round(glowConfig.opacity * 255).toString(16).padStart(2, '0')}, inset 0 1px 1px rgba(255,255,255,0.4)`
                        : 'inset 0 1px 1px rgba(255,255,255,0.4)',
                    }}
                  >
                    {isUnlocked ? (
                      <Check className="w-9 h-9 text-white drop-shadow-md" />
                    ) : (
                      <Trophy 
                        className="w-8 h-8" 
                        style={{ color: isUnlocked ? '#fff' : accentColor }} 
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-xl font-bold text-center text-foreground mb-1">
                {tierMeta.tierName}
              </h2>

              {/* Subtitle - requirement description */}
              <p className="text-sm text-muted-foreground text-center mb-3">
                Awarded for playing {threshold} Top 100 courses worldwide
              </p>

              {/* Status line - dynamic */}
              <div className="flex justify-center mb-1">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium",
                    isUnlocked
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-muted text-foreground"
                  )}
                >
                  {isUnlocked ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Unlocked 🎉
                    </>
                  ) : (
                    `${remaining} more course${remaining === 1 ? '' : 's'} to unlock`
                  )}
                </span>
              </div>

              {/* Micro-motivation line - subtle, one line */}
              {!isUnlocked && (
                <p className="text-xs text-muted-foreground/70 text-center mb-5">
                  {getMicroMotivation(remaining)}
                </p>
              )}

              {isUnlocked && <div className="mb-5" />}

              {/* Progress card - premium + clear */}
              <div
                className="rounded-xl border p-4 mb-5 bg-card/50"
                style={{ borderColor: `${accentColor}25` }}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Progress</span>
                  <span
                    className="text-sm font-bold"
                    style={{ color: isUnlocked ? '#10b981' : accentColor }}
                  >
                    {totalTop100Played} / {threshold}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-2.5 rounded-full bg-muted overflow-hidden mb-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: isUnlocked ? '#10b981' : accentColor,
                    }}
                  />
                </div>

                {/* Under bar status */}
                <p className="text-xs text-muted-foreground text-center">
                  {isUnlocked ? 'Achievement complete' : `${remaining} more courses to go`}
                </p>
              </div>

              {/* CTAs - context-aware, minimal */}
              <div className="space-y-3">
                {!isUnlocked && (
                  <Button
                    onClick={handleViewCourses}
                    className="w-full rounded-full font-medium"
                    style={{ backgroundColor: accentColor }}
                  >
                    View unplayed Top 100 courses
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}

                {/* Optional secondary CTA - only text link style */}
                <button
                  onClick={handleViewAchievements}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  View all achievements
                </button>
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
