/**
 * UnifiedAchievementSheet - World-Class Achievement Bottom Sheet (v3)
 *
 * Three modes:
 *  - 'browse'    : own profile, exploring (default)
 *  - 'celebrate' : auto-fires on first unlock detection (own profile only)
 *  - 'peer'      : viewing another user's profile
 */

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, ChevronRight, Share2 } from 'lucide-react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { CLBHOUZ_ACHIEVEMENT_PALETTE, MILESTONE_PALETTE_MAP } from '@/lib/clbhouzAchievementPalette';
import { getRegionTheme, type Top100ListSlug } from '@/lib/regionTheme';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAchievementUnlock } from '@/hooks/useAchievementUnlock';
import { AchievementConfetti, getConfettiTheme } from './AchievementConfetti';
import { haptic } from '@/utils/haptics';
import {
  getSheetMilestoneTagline,
  getSheetRegionalTagline,
  REGION_FULL_NAMES,
} from '@/config/achievementTaglines';
import { MILESTONE_BADGE_IMAGES, REGION_BADGE_IMAGES, MILESTONE_NAMES } from '@/config/badgeImages';

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
  /** First name of the profile user (used in peer mode) */
  firstName?: string;
  /** Whether viewing own profile (defaults to true) */
  isOwnProfile?: boolean;
  /**
   * Display mode. Controls visuals + copy + CTA destination.
   * Defaults to 'browse'. When 'celebrate', confetti fires once on open.
   */
  mode?: 'browse' | 'celebrate' | 'peer';
}

// ═══════════════════════════════════════════════════════════════════════════
// REGION COLORS
// ═══════════════════════════════════════════════════════════════════════════

const REGION_COLORS: Record<Top100ListSlug, string> = {
  global: '#C9A961',
  'gb-i': '#1B4D2E',
  usa: '#8B3A3A',
  europe: '#5B6B7C',
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function getMilestoneColor(threshold: number): string {
  const paletteKey = MILESTONE_PALETTE_MAP[threshold];
  if (paletteKey) return CLBHOUZ_ACHIEVEMENT_PALETTE[paletteKey];
  return '#A89F91';
}

function getRegionColor(listSlug: Top100ListSlug): string {
  return REGION_COLORS[listSlug];
}

function getMilestoneName(threshold: number): string {
  return MILESTONE_NAMES[threshold] || `${threshold} Club`;
}

// ═══════════════════════════════════════════════════════════════════════════
// ICON DISC — actual badge image, parameterised size
// ═══════════════════════════════════════════════════════════════════════════

interface IconDiscProps {
  type: AchievementType;
  threshold?: number;
  regionSlug?: Top100ListSlug;
  color: string;
  isUnlocked: boolean;
  isAnimating: boolean;
  animationPhase: number;
  size?: number;
}

function IconDisc({
  type,
  threshold,
  regionSlug,
  color,
  isUnlocked,
  isAnimating,
  animationPhase,
  size = 96,
}: IconDiscProps) {
  const badgeImage = type === 'milestone' && threshold
    ? MILESTONE_BADGE_IMAGES[threshold]
    : regionSlug
      ? REGION_BADGE_IMAGES[regionSlug]
      : undefined;

  const scaleValue = isAnimating && animationPhase < 1 ? 0.96 : 1;
  const opacityValue = isAnimating && animationPhase < 1 ? 0.7 : 1;
  const showFilled = isUnlocked && (!isAnimating || animationPhase >= 2);

  return (
    <div className="flex justify-center mb-5 relative" style={{ minHeight: size }}>
      {isAnimating && animationPhase >= 3 && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1 }}
        >
          <svg width={size} height={size} className="absolute">
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={size / 2 - 2}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
            />
          </svg>
        </motion.div>
      )}

      <motion.div
        className="flex items-center justify-center"
        animate={{ scale: scaleValue, opacity: opacityValue }}
        transition={{ duration: 0.12, ease: 'easeOut' }}
      >
        <motion.div
          animate={{ scale: isAnimating && animationPhase === 2 ? [1, 1.1, 1] : 1 }}
          transition={{ duration: 0.15 }}
        >
          {badgeImage ? (
            <img
              src={badgeImage}
              alt={type === 'milestone' ? getMilestoneName(threshold ?? 0) : (regionSlug ?? 'badge')}
              style={{ width: size, height: size }}
              className={cn(
                'object-contain drop-shadow-md transition-all duration-200',
                !showFilled && !isUnlocked && 'opacity-40 grayscale-[40%]'
              )}
            />
          ) : (
            <div
              style={{ width: size * 0.75, height: size * 0.75 }}
              className="rounded-full"
            />
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PROGRESS MODULE — v3: tier-coloured top rule + state label + count + bar
// ═══════════════════════════════════════════════════════════════════════════

interface ProgressModuleProps {
  played: number;
  total: number;
  color: string;
  isUnlocked: boolean;
}

function ProgressModule({ played, total, color, isUnlocked }: ProgressModuleProps) {
  const displayedPlayed = played; // lifetime count, no cap
  const pct = total > 0 ? Math.min(100, (displayedPlayed / total) * 100) : 0;

  const remaining = Math.max(0, total - played);
  const stateLabel = isUnlocked
    ? 'Complete'
    : remaining <= 10
      ? `${remaining} to go`
      : 'In progress';

  const topRuleColor = isUnlocked ? color : 'rgba(15,23,42,0.10)';
  const countColor = isUnlocked ? color : '#0F172A';

  return (
    <div className="mb-6">
      <div style={{ height: 2, background: topRuleColor, borderRadius: 1, marginBottom: 12 }} />
      <div className="flex items-center justify-between mb-2">
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#64748B',
          }}
        >
          {stateLabel}
        </span>
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: countColor,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {displayedPlayed} <span style={{ color: '#94A3B8', fontWeight: 600 }}>/ {total}</span>
        </span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: 'rgba(15,23,42,0.06)', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ height: '100%', background: color, borderRadius: 2 }}
        />
      </div>
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
  mode,
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

  // Derive effective mode (default 'browse'; isOwnProfile=false → 'peer')
  const effectiveMode: 'browse' | 'celebrate' | 'peer' =
    mode ?? (isOwnProfile === false ? 'peer' : 'browse');
  const isCelebrate = effectiveMode === 'celebrate';
  const isPeer = effectiveMode === 'peer';

  const unlockState = useAchievementUnlock(
    isMilestone ? 'milestone' : 'regional',
    identifier ?? 0,
    isUnlocked,
    isOpen
  );

  const isAnimating = unlockState.shouldAnimate && !unlockState.hasAnimated;

  // Confetti only fires in celebrate mode
  useEffect(() => {
    if (!isCelebrate || !isAnimating) {
      setAnimationPhase(0);
      setShowConfetti(false);
      return;
    }

    setShowConfetti(true);
    haptic('medium');
    const timers: NodeJS.Timeout[] = [];
    timers.push(setTimeout(() => setAnimationPhase(1), 120));
    timers.push(setTimeout(() => setAnimationPhase(2), 240));
    timers.push(setTimeout(() => setAnimationPhase(3), 320));
    timers.push(setTimeout(() => setAnimationPhase(4), 420));
    timers.push(setTimeout(() => {
      unlockState.markAnimated();
    }, 600));

    return () => { timers.forEach(clearTimeout); };
  }, [isCelebrate, isAnimating, unlockState]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  if (!data) return null;

  // Derive copy + CTA per mode
  let title: string;
  let tagline: string;
  let primaryCtaLabel: string;
  let primaryCtaAction: () => void;
  let regionSlug: Top100ListSlug | undefined;
  let milestoneThreshold: number | undefined;

  const color = isMilestone
    ? getMilestoneColor((data as MilestoneData).threshold)
    : getRegionColor((data as RegionalData).listSlug);

  if (isMilestone) {
    const { threshold, totalPlayed } = data as MilestoneData;
    milestoneThreshold = threshold;
    title = getMilestoneName(threshold);
    tagline = getSheetMilestoneTagline(threshold, isUnlocked, effectiveMode, {
      firstName,
      played: totalPlayed,
    });

    if (isPeer) {
      primaryCtaLabel = 'View your own progress';
      primaryCtaAction = () => { navigate('/achievements'); onClose(); };
    } else if (isCelebrate) {
      primaryCtaLabel = 'Continue';
      primaryCtaAction = () => { onClose(); };
    } else if (isUnlocked) {
      primaryCtaLabel = 'View all achievements';
      primaryCtaAction = () => { navigate('/achievements'); onClose(); };
    } else {
      const remaining = Math.max(0, threshold - totalPlayed);
      primaryCtaLabel = remaining <= 3 ? 'Find your next course' : 'Browse Top 100';
      primaryCtaAction = () => { navigate('/top100/global?filter=unplayed'); onClose(); };
    }
  } else {
    const { listSlug, played: p, total: t } = data as RegionalData;
    regionSlug = listSlug;
    const theme = getRegionTheme(listSlug);
    title = REGION_FULL_NAMES[listSlug] || theme.primaryLabel;
    tagline = getSheetRegionalTagline(listSlug, isUnlocked, effectiveMode, {
      firstName,
      played: p,
      total: t,
    });

    if (isPeer) {
      primaryCtaLabel = 'View your own progress';
      primaryCtaAction = () => { navigate('/achievements'); onClose(); };
    } else if (isCelebrate) {
      primaryCtaLabel = 'Continue';
      primaryCtaAction = () => { onClose(); };
    } else {
      primaryCtaLabel = `View ${theme.shortName} list`;
      primaryCtaAction = () => { navigate(`/top100/${listSlug}`); onClose(); };
    }
  }

  const confettiTheme = getConfettiTheme(isMilestone ? 'milestone' : 'regional', regionSlug);
  const taglineItalic = isCelebrate && isUnlocked;
  const badgeSize = isCelebrate ? 112 : 96;

  const content = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Confetti — only in celebrate mode */}
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
            dragListener={true}
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
              paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
            }}
          >
            {/* Close button — top-right */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-full hover:bg-muted active:scale-[0.97] transition-transform z-10"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Content */}
            <div className="px-6 pt-8 pb-6">
              {/* Hero badge */}
              <IconDisc
                type={isMilestone ? 'milestone' : 'regional'}
                threshold={milestoneThreshold}
                regionSlug={regionSlug}
                color={color}
                isUnlocked={isUnlocked}
                isAnimating={isAnimating}
                animationPhase={animationPhase}
                size={badgeSize}
              />

              {/* Title */}
              <h2
                className="text-center text-foreground mb-2"
                style={{
                  fontSize: isCelebrate ? 22 : 20,
                  fontWeight: isCelebrate ? 900 : 800,
                  letterSpacing: '-0.01em',
                }}
              >
                {title}
              </h2>

              {/* Tagline */}
              <p
                className="text-center mb-5"
                style={{
                  fontSize: 14,
                  color: '#475569',
                  fontStyle: taglineItalic ? 'italic' : 'normal',
                  lineHeight: 1.45,
                }}
              >
                {tagline}
              </p>

              {/* Progress block */}
              <ProgressModule
                played={played}
                total={total}
                color={color}
                isUnlocked={isUnlocked}
              />

              {/* CTAs */}
              {isCelebrate ? (
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => { onClose(); }}
                    className="flex-1 rounded-full font-semibold min-h-[44px] active:scale-[0.98] transition-transform"
                  >
                    <Share2 className="w-4 h-4 mr-1.5" />
                    Share
                  </Button>
                  <Button
                    onClick={primaryCtaAction}
                    className="flex-1 rounded-full font-semibold text-white min-h-[44px] active:scale-[0.98] transition-transform"
                    style={{ backgroundColor: color }}
                  >
                    {primaryCtaLabel}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={primaryCtaAction}
                  className="w-full rounded-full font-medium text-white min-h-[44px] active:scale-[0.98] transition-transform"
                  style={{ backgroundColor: color }}
                >
                  {primaryCtaLabel}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
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
