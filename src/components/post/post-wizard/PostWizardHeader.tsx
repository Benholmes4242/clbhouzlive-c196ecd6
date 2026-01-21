// PostWizardHeader - Header with profile selector, schedule, drafts
import { X, ArrowLeft, FileEdit, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { Button } from '@/components/ui/button';
import { PostWizardStep, ActorRef } from './types';

// Step titles for header
const STEP_TITLES: Record<PostWizardStep, string> = {
  media: 'Add Media',
  caption: 'Add Details',
  confirm: 'Review & Post',
};

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
}: PostWizardHeaderProps) {
  const getInitials = (name: string) => name.charAt(0).toUpperCase();
  
  const truncateDisplayName = (name: string, maxLength = 16) => {
    if (!name) return '';
    return name.length > maxLength ? `${name.slice(0, maxLength)}…` : name;
  };
  
  const nextButtonText = isLastStep ? 'Post' : 'Next';

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-background px-3">
      {/* Left: Back/Close button */}
      <div className="flex items-center gap-1 min-w-[80px]">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-9 w-9"
          aria-label={isFirstStep ? 'Close' : 'Back'}
        >
          {isFirstStep ? (
            <X className="h-5 w-5" />
          ) : (
            <ArrowLeft className="h-5 w-5" />
          )}
        </Button>
        
        {/* Drafts button with badge - only on first step */}
        {isFirstStep && draftCount > 0 && (
          <button
            onClick={onOpenDrafts}
            className="w-9 h-9 rounded-full flex items-center justify-center relative transition-colors hover:bg-muted"
            aria-label={`View ${draftCount} drafts`}
          >
            <FileEdit className="h-4 w-4 text-muted-foreground" />
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full bg-destructive text-destructive-foreground text-[9px] font-semibold flex items-center justify-center">
              {draftCount > 9 ? '9+' : draftCount}
            </span>
          </button>
        )}
      </div>
      
      {/* Center: Profile selector OR step info */}
      <div className="flex-1 flex justify-center">
        {isFirstStep ? (
          // Profile selector on first step
          <button 
            onClick={onOpenProfileSelector}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors hover:bg-muted active:bg-muted/80"
          >
            <SquircleAvatar
              size={28}
              src={actorAvatarUrl}
              alt={actorName}
              fallback={getInitials(actorName)}
              hideRing
            />
            <span className="font-medium text-sm max-w-[120px] truncate text-foreground">
              {truncateDisplayName(actorName)}
            </span>
            {actorVerified && <VerifiedBadge size="sm" />}
            <svg 
              width="12" 
              height="12" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        ) : (
          // Step title on other steps
          <div className="flex flex-col items-center">
            <span className="text-sm font-medium text-foreground">
              {STEP_TITLES[currentStep]}
            </span>
            <span className="text-xs text-muted-foreground">
              Step {currentStepIndex + 1} of {totalSteps}
            </span>
          </div>
        )}
      </div>
      
      {/* Right: Schedule + Next/Post */}
      <div className="flex items-center gap-1 min-w-[80px] justify-end">
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
        
        {/* Next/Post button */}
        <Button
          variant={isLastStep ? 'default' : 'ghost'}
          size="sm"
          onClick={onNext}
          disabled={!canProceed || isSubmitting}
          className={cn(
            'min-w-[60px]',
            isLastStep && 'bg-primary text-primary-foreground'
          )}
        >
          {isSubmitting ? 'Posting...' : nextButtonText}
        </Button>
      </div>
    </header>
  );
}

export default PostWizardHeader;
