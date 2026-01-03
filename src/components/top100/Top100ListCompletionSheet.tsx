/**
 * Top100ListCompletionSheet - Region-aware completion detail sheet
 * 
 * Opened from Top 100 List Completions row cards.
 * Uses region-specific accent colours from the Top 100 page theme system.
 */

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, ChevronRight, Check, Map } from 'lucide-react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { FaLandmarkDome, FaFlagUsa } from 'react-icons/fa6';
import { GiEuropeanFlag, GiWorld } from 'react-icons/gi';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getRegionTheme } from '@/lib/regionTheme';

type RegionSlug = 'global' | 'gb-i' | 'usa' | 'europe';

interface Top100ListCompletionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  listSlug: RegionSlug | null;
  played: number;
  total: number;
}

// Short labels for CTAs
const SHORT_LABELS: Record<RegionSlug, string> = {
  global: 'World',
  'gb-i': 'GB&I',
  usa: 'USA',
  europe: 'Europe',
};

function getRegionIcon(slug: RegionSlug) {
  const iconClass = 'w-6 h-6';
  switch (slug) {
    case 'global':
      return <GiWorld className={iconClass} />;
    case 'gb-i':
      return <FaLandmarkDome className={iconClass} />;
    case 'usa':
      return <FaFlagUsa className={iconClass} />;
    case 'europe':
      return <GiEuropeanFlag className={iconClass} />;
    default:
      return <Map className={iconClass} />;
  }
}

export function Top100ListCompletionSheet({
  isOpen,
  onClose,
  listSlug,
  played,
  total,
}: Top100ListCompletionSheetProps) {
  const navigate = useNavigate();
  const dragControls = useDragControls();

  // Prevent underlying page scroll while sheet is open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!listSlug) return null;

  // Get theme from Top 100 page theme system (same colors as the actual list pages)
  const theme = getRegionTheme(listSlug);
  const shortLabel = SHORT_LABELS[listSlug];
  const remaining = Math.max(0, total - played);
  const progressPercent = total > 0 ? (played / total) * 100 : 0;
  const isComplete = remaining === 0 && total > 0;

  const handleViewList = () => {
    navigate(`/top100/${listSlug}`);
    onClose();
  };

  const handleViewUnplayed = () => {
    navigate(`/top100/${listSlug}?filter=unplayed`);
    onClose();
  };

  const content = (
    <AnimatePresence>
      {isOpen && (
        <>
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

            {/* Content */}
            <div className="px-6 pt-1" style={{ paddingBottom: '24px' }}>
              {/* Header row: Icon + Title */}
              <div className="flex items-center gap-3 mb-6">
                {/* Region icon container - tinted with region colour */}
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                    theme.bgClass
                  )}
                  style={{ color: theme.ringColor }}
                >
                  {getRegionIcon(listSlug)}
                </div>

                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-foreground truncate">
                    {theme.primaryLabel}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Completion progress
                  </p>
                </div>
              </div>

              {/* Progress card */}
              <div
                className={cn(
                  "rounded-xl border p-4 mb-5 bg-card/50",
                  theme.bgClass
                )}
              >
                {/* Big progress numbers */}
                <div className="flex justify-between items-baseline mb-3">
                  <span className="text-3xl font-bold text-foreground">
                    {played}{' '}
                    <span className="text-lg font-medium text-muted-foreground">
                      / {total}
                    </span>
                  </span>

                  {isComplete ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600">
                      <Check className="w-3.5 h-3.5" />
                      Complete 🎉
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-muted-foreground">
                      {remaining} away
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="h-2.5 rounded-full bg-muted overflow-hidden mb-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className={cn("h-full rounded-full", isComplete ? "bg-emerald-500" : theme.barClass)}
                  />
                </div>

                {/* Microcopy */}
                <p className="text-xs text-muted-foreground text-center">
                  {isComplete
                    ? 'Completion badge earned.'
                    : `Finish the list to earn the ${shortLabel} completion badge.`}
                </p>
              </div>

              {/* CTAs */}
              <div className="space-y-3">
                <Button
                  onClick={handleViewList}
                  className={cn("w-full rounded-full font-medium text-white", theme.barClass)}
                >
                  View {shortLabel} list
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>

                {!isComplete && (
                  <button
                    onClick={handleViewUnplayed}
                    className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                  >
                    View unplayed courses
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
