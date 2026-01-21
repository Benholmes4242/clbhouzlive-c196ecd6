// PostWizardHeader - Header with profile selector, schedule, drafts
// World-class wizard header with backdrop blur and context-aware CTA
import { X, ChevronDown, FileEdit, Clock, Loader2 } from 'lucide-react';
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
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border/50 bg-[#F8FAFC]/80 backdrop-blur-md px-3">
      {/* Left: Close button */}
      <div className="flex items-center gap-1 min-w-[80px]">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-9 w-9 rounded-full"
          aria-label={isFirstStep ? 'Close' : 'Back'}
        >
          <X className="h-5 w-5" />
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
      
      {/* Center: Profile dropdown (KEEP - essential for profile/visibility selection) */}
      <div className="flex-1 flex justify-center">
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
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
      
      {/* Right: Context-aware CTA */}
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
        
        {/* Next/Post button - context-aware styling */}
        <Button
          variant={isLastStep ? 'default' : 'ghost'}
          size="sm"
          onClick={onNext}
          disabled={!canProceed || isSubmitting}
          className={cn(
            'min-w-[60px] font-semibold transition-opacity',
            isLastStep && 'bg-primary text-primary-foreground hover:bg-primary/90',
            (!canProceed || isSubmitting) && 'opacity-50'
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              Posting...
            </>
          ) : nextButtonText}
        </Button>
      </div>
    </header>
  );
}

export default PostWizardHeader;
