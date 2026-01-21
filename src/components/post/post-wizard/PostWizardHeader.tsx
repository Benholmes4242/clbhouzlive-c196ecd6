// PostWizardHeader - World-Class Wizard Header
// Polished UI with centered step indicator, context-aware CTA, backdrop-blur
import { X, ArrowLeft, FileEdit, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { Button } from '@/components/ui/button';
import { PostWizardStep, ActorRef } from './types';

// Step titles for header - concise labels
const STEP_TITLES: Record<PostWizardStep, string> = {
  media: 'Media',
  caption: 'Story',
  confirm: 'Review',
};

// Step number mapping
const STEP_NUMBERS: Record<PostWizardStep, number> = {
  media: 1,
  caption: 2,
  confirm: 3,
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
  const stepNumber = STEP_NUMBERS[currentStep];

  return (
    <header className="flex-shrink-0 border-b border-border/60 bg-background/95 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Left: Close/Back button */}
        <div className="flex items-center gap-1 min-w-[70px]">
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
        
        {/* Center: Step indicator + title (always shown) */}
        <div className="flex flex-col items-center">
          <span className="text-xs text-muted-foreground">
            Step {stepNumber} of 3
          </span>
          <span className="text-sm font-semibold text-foreground">
            {STEP_TITLES[currentStep]}
          </span>
        </div>
        
        {/* Right: Schedule + Next/Post */}
        <div className="flex items-center gap-1 min-w-[70px] justify-end">
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
          
          {/* Context-aware CTA button */}
          <Button
            variant={isLastStep ? 'default' : 'outline'}
            size="sm"
            onClick={onNext}
            disabled={!canProceed || isSubmitting}
            className={cn(
              'min-w-[70px]',
              !canProceed && !isSubmitting && 'opacity-50'
            )}
          >
            {isSubmitting ? 'Posting...' : nextButtonText}
          </Button>
        </div>
      </div>
    </header>
  );
}

export default PostWizardHeader;
