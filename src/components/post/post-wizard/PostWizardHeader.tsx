// PostWizardHeader - Header with profile selector, schedule, drafts
// World-class wizard header with backdrop blur and context-aware CTA
import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronDown, FileEdit, Clock, Loader2, ChevronLeft, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { Button } from '@/components/ui/button';
import { PostWizardStep, ActorRef } from './types';
import { format } from 'date-fns';

const SCHEDULE_TOOLTIP_KEY = 'pw-schedule-tooltip-seen';

export interface PostWizardHeaderProps {
  currentStep: PostWizardStep;
  currentStepIndex: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  
  // Actor info for profile selector
  actor: ActorRef;
  actorName: string;
  actorAvatarUrl?: string;
  actorVerified?: boolean;
  onOpenProfileSelector: () => void;
  
  // Counts for badges
  draftCount: number;
  scheduledCount: number;
  
  // Schedule state
  scheduledAt?: Date | null;
  onClearSchedule?: () => void;
  
  // Callbacks
  onBack: () => void;
  onOpenDrafts: () => void;
  onOpenScheduled: () => void;
  onOpenScheduleSheet: () => void;
  
  // Next/Post button
  canProceed: boolean;
  isSubmitting: boolean;
  onNext: () => void;
  
  // Safe-area handling - when true, hero handles safe-area so header doesn't need it
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
      className="sticky top-0 z-10 flex items-center justify-between px-3"
      style={{ 
        height: hasHeroAbove ? '55px' : 'calc(55px + max(env(safe-area-inset-top, 0px), 47px))',
        paddingTop: hasHeroAbove ? '0px' : 'max(env(safe-area-inset-top, 0px), 47px)',
        background: 'hsl(210 40% 98% / 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '0.5px solid hsl(215 25% 27% / 0.2)',
      }}
    >
      {/* Left: Close button */}
      <div className="flex items-center gap-1 min-w-[72px]">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-8 w-8 rounded-full"
          aria-label={isFirstStep ? 'Close' : 'Back'}
        >
          {isFirstStep ? (
            <X className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>
        
        {/* Drafts button with badge - only on first step */}
        {isFirstStep && draftCount > 0 && (
          <button
            onClick={onOpenDrafts}
            className="w-8 h-8 rounded-full flex items-center justify-center relative transition-colors hover:bg-muted"
            aria-label={`View ${draftCount} drafts`}
          >
            <FileEdit className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] rounded-full bg-destructive text-destructive-foreground text-[8px] font-semibold flex items-center justify-center">
              {draftCount > 9 ? '9+' : draftCount}
            </span>
          </button>
        )}
      </div>
      
      {/* Center: Avatar-only profile selector — clean creation flow */}
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
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>
      
      {/* Right: Context-aware CTA */}
      <div className="flex items-center gap-1 min-w-[72px] justify-end">
        {/* Schedule button — always visible on Step 1 */}
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
              <Clock className="h-4 w-4 text-muted-foreground" />
              {scheduledCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full bg-primary text-primary-foreground text-[9px] font-semibold flex items-center justify-center">
                  {scheduledCount > 9 ? '9+' : scheduledCount}
                </span>
              )}
            </button>
            
            {/* First-time tooltip */}
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

        {/* Schedule button on Step 3 — opens picker */}
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
        
        {/* Next/Post/Schedule button */}
        <div className="flex flex-col items-end">
          <Button
            size="sm"
            onClick={onNext}
            disabled={!canProceed || isSubmitting}
            className={cn(
              'px-4 py-1.5 h-8 rounded-full text-sm font-medium transition-all duration-200 active:scale-[0.96]',
              !canProceed || isSubmitting
                ? 'bg-muted text-muted-foreground'
                : hasSchedule
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : isLastStep
                    ? 'text-white shadow-md hover:shadow-lg'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
            style={canProceed && !isSubmitting && isLastStep && !hasSchedule ? {
              background: 'linear-gradient(135deg, #10b981, #059669)',
            } : undefined}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                <span>{hasSchedule ? 'Scheduling…' : 'Posting…'}</span>
              </>
            ) : <span className="text-inherit">{nextButtonText}</span>}
          </Button>
        </div>
      </div>
    </header>
  );
}

export default PostWizardHeader;
