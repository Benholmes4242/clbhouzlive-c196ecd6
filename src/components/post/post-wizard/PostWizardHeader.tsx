// PostWizardHeader - Header with profile selector, schedule, drafts
// World-class wizard header with backdrop blur and context-aware CTA
import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronDown, FileEdit, Clock, Loader2, ChevronLeft, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { PostWizardStep, ActorRef } from './types';
import { format } from 'date-fns';

const SCHEDULE_TOOLTIP_KEY = 'pw-schedule-tooltip-seen';

export interface PostWizardHeaderProps {
  currentStep: PostWizardStep;
  currentStepIndex: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  
  actor: ActorRef;
  actorName: string;
  actorAvatarUrl?: string;
  actorVerified?: boolean;
  onOpenProfileSelector: () => void;
  
  draftCount: number;
  scheduledCount: number;
  
  scheduledAt?: Date | null;
  onClearSchedule?: () => void;
  
  onBack: () => void;
  onOpenDrafts: () => void;
  onOpenScheduled: () => void;
  onOpenScheduleSheet: () => void;
  
  canProceed: boolean;
  isSubmitting: boolean;
  onNext: () => void;
  
  hasHeroAbove?: boolean;
}

export function PostWizardHeader({
  currentStep,
  currentStepIndex,
  totalSteps,
  isFirstStep,
  isLastStep,
  actor,
  actorName,
  actorAvatarUrl,
  actorVerified,
  onOpenProfileSelector,
  draftCount,
  scheduledCount,
  scheduledAt,
  onClearSchedule,
  onBack,
  onOpenDrafts,
  onOpenScheduled,
  onOpenScheduleSheet,
  canProceed,
  isSubmitting,
  onNext,
  hasHeroAbove = false,
}: PostWizardHeaderProps) {
  const getInitials = (name: string) => name.charAt(0).toUpperCase();
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipSeenRef = useRef(false);
  
  // One-time tooltip for schedule discoverability
  useEffect(() => {
    if (!isFirstStep || tooltipSeenRef.current) return;
    try {
      const seen = localStorage.getItem(SCHEDULE_TOOLTIP_KEY);
      if (seen) {
        tooltipSeenRef.current = true;
        return;
      }
      const timer = setTimeout(() => setShowTooltip(true), 800);
      return () => clearTimeout(timer);
    } catch {}
  }, [isFirstStep]);

  const dismissTooltip = useCallback(() => {
    setShowTooltip(false);
    tooltipSeenRef.current = true;
    try { localStorage.setItem(SCHEDULE_TOOLTIP_KEY, '1'); } catch {}
  }, []);

  // Auto-dismiss tooltip after 3 seconds
  useEffect(() => {
    if (!showTooltip) return;
    const timer = setTimeout(dismissTooltip, 3000);
    return () => clearTimeout(timer);
  }, [showTooltip, dismissTooltip]);

  const handleClockTap = () => {
    dismissTooltip();
    if (scheduledCount > 0) {
      onOpenScheduled();
    } else {
      onOpenScheduleSheet();
    }
  };
  
  const hasSchedule = !!scheduledAt;
  const nextButtonText = hasSchedule
    ? 'Schedule'
    : isLastStep ? 'Post' : 'Next';

  return (
    <header 
      className="sticky top-0 z-10 flex items-center justify-between px-3 bg-amber-50"
      style={{ 
        height: hasHeroAbove ? '55px' : 'calc(55px + max(env(safe-area-inset-top, 0px), 47px))',
        paddingTop: hasHeroAbove ? '0px' : 'max(env(safe-area-inset-top, 0px), 47px)',
      }}
    >
      {/* Left: Close button */}
      <div className="flex items-center gap-1 min-w-[72px]">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-amber-100/80 text-amber-700 flex items-center justify-center active:bg-amber-200/80 transition-colors"
          aria-label={isFirstStep ? 'Close' : 'Back'}
        >
          {isFirstStep ? (
            <X className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
        
        {isFirstStep && draftCount > 0 && (
          <button
            onClick={onOpenDrafts}
            className="w-8 h-8 rounded-full flex items-center justify-center relative transition-colors hover:bg-muted"
            aria-label={`View ${draftCount} drafts`}
          >
            <FileEdit className="h-3.5 w-3.5 text-amber-600" />
            <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] rounded-full bg-amber-500 text-white text-[8px] font-semibold flex items-center justify-center">
              {draftCount > 9 ? '9+' : draftCount}
            </span>
          </button>
        )}
      </div>
      
      {/* Center: Avatar-only profile selector */}
      <div className="flex-1 flex justify-center">
        <button 
          onClick={onOpenProfileSelector}
          className="flex items-center gap-1 px-2 py-1 rounded-full transition-colors hover:bg-muted/60 active:bg-muted/80"
        >
          <SquircleAvatar
            size={28}
            src={actorAvatarUrl}
            alt={actorName}
            fallback={getInitials(actorName)}
            hideRing
          />
          {actorVerified && <VerifiedBadge size="sm" />}
          <ChevronDown className="h-3 w-3 text-amber-700" />
        </button>
      </div>
      
      {/* Right: Context-aware CTA */}
      <div className="flex items-center gap-1 min-w-[72px] justify-end">
        {isFirstStep && (
          <div className="relative">
            <button
              onClick={handleClockTap}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center relative transition-colors hover:bg-muted",
                showTooltip && "animate-pulse"
              )}
              aria-label={scheduledCount > 0 ? `View ${scheduledCount} scheduled posts` : "Schedule post"}
            >
              <Clock className="h-4 w-4 text-amber-600" />
              {scheduledCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full bg-primary text-primary-foreground text-[9px] font-semibold flex items-center justify-center">
                  {scheduledCount > 9 ? '9+' : scheduledCount}
                </span>
              )}
            </button>
            
            <AnimatePresence>
              {showTooltip && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  onClick={dismissTooltip}
                  className="absolute top-full right-0 mt-2 px-3 py-1.5 bg-foreground text-background text-xs font-medium rounded-lg whitespace-nowrap shadow-lg z-20"
                >
                  Schedule your post
                  <div className="absolute -top-1 right-3 w-2 h-2 bg-foreground rotate-45" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {isLastStep && !isFirstStep && (
          <button
            onClick={onOpenScheduleSheet}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
              hasSchedule 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:bg-muted"
            )}
            aria-label="Schedule post"
          >
            <Calendar className="h-4 w-4" />
          </button>
        )}
        
        {/* Next/Post/Schedule button — amber accent */}
        <div className="flex flex-col items-end">
            <button
            onClick={onNext}
            disabled={!canProceed || isSubmitting}
            className={cn(
              'px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 active:scale-[0.97]',
              !canProceed || isSubmitting
                ? 'bg-amber-100/80 text-amber-700 cursor-not-allowed'
                : 'text-white shadow-sm'
            )}
            style={canProceed && !isSubmitting ? {
              background: isLastStep && !hasSchedule 
                ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' 
                : '#f59e0b',
            } : undefined}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {hasSchedule ? 'Scheduling…' : 'Posting…'}
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                {hasSchedule && isLastStep && <Calendar className="h-3.5 w-3.5" />}
                {nextButtonText}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

export default PostWizardHeader;
