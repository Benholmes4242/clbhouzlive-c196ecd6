// PostWizardHeader - Header with profile selector, schedule, drafts
// World-class wizard header with backdrop blur and context-aware CTA
import { X, ChevronDown, FileEdit, Clock, Loader2, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { Button } from '@/components/ui/button';
import { PostWizardStep, ActorRef } from './types';

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
  
  const truncateDisplayName = (name: string, maxLength = 16) => {
    if (!name) return '';
    return name.length > maxLength ? `${name.slice(0, maxLength)}…` : name;
  };
  
  const nextButtonText = isLastStep ? 'Post' : 'Next';

  return (
    <header 
      className="sticky top-0 z-10 flex items-center justify-between px-3"
      style={{ 
        height: hasHeroAbove ? '55px' : 'calc(55px + env(safe-area-inset-top, 0px))',
        paddingTop: hasHeroAbove ? '0px' : 'env(safe-area-inset-top, 0px)',
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
      
      {/* Center: Profile dropdown - tighter, refined */}
      <div className="flex-1 flex justify-center">
        <button 
          onClick={onOpenProfileSelector}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-colors hover:bg-muted/60 active:bg-muted/80"
        >
          <SquircleAvatar
            size={24}
            src={actorAvatarUrl}
            alt={actorName}
            fallback={getInitials(actorName)}
            hideRing
          />
          <span className="font-medium text-sm max-w-[100px] truncate text-slate-900">
            {truncateDisplayName(actorName)}
          </span>
          {actorVerified && <VerifiedBadge size="sm" />}
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>
      
      {/* Right: Context-aware CTA - removed clock icon unless needed */}
      <div className="flex items-center gap-1 min-w-[72px] justify-end">
        {/* Schedule button - only on first step */}
        {isFirstStep && (
          <>
            {scheduledCount > 0 ? (
              <button
                onClick={onOpenScheduled}
                className="w-9 h-9 rounded-full flex items-center justify-center relative transition-colors hover:bg-muted"
                aria-label={`View ${scheduledCount} scheduled posts`}
              >
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full bg-primary text-primary-foreground text-[9px] font-semibold flex items-center justify-center">
                  {scheduledCount > 9 ? '9+' : scheduledCount}
                </span>
              </button>
            ) : (
              <button
                onClick={onOpenScheduleSheet}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-muted"
                aria-label="Schedule post"
              >
                <Clock className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </>
        )}
        
        {/* Next/Post button - Apple-style: dark sophisticated button with VISIBLE text */}
        <Button
          size="sm"
          onClick={onNext}
          disabled={!canProceed || isSubmitting}
          className={cn(
            'px-4 py-1.5 h-8 rounded-full text-sm font-medium transition-all duration-200',
            canProceed && !isSubmitting
              ? 'bg-foreground text-background hover:bg-foreground/90'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              <span>Posting...</span>
            </>
          ) : <span className={canProceed && !isSubmitting ? 'text-background' : 'text-muted-foreground'}>{nextButtonText}</span>}
        </Button>
      </div>
    </header>
  );
}

export default PostWizardHeader;
