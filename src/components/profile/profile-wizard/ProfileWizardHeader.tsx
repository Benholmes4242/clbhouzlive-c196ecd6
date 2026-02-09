/**
 * ProfileWizardHeader - Shared header for profile wizards
 * Clean minimal header with back/close and step info
 */
import { X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProfileWizardHeaderProps } from './types';

export function ProfileWizardHeader({
  title,
  currentStep,
  totalSteps,
  onBack,
  onClose,
}: ProfileWizardHeaderProps) {
  const isFirstStep = currentStep === 1;

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-md px-3">
      {/* Left: Back/Close button */}
      <div className="flex items-center min-w-[60px]">
        <Button
          variant="ghost"
          size="icon"
          onClick={isFirstStep ? onClose : onBack}
          className="h-9 w-9 rounded-full"
          aria-label={isFirstStep ? 'Close' : 'Back'}
        >
          {isFirstStep ? (
            <X className="h-5 w-5" />
          ) : (
            <ArrowLeft className="h-5 w-5" />
          )}
        </Button>
      </div>
      
      {/* Center: Title and step indicator */}
      <div className="flex-1 flex flex-col items-center">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Step {currentStep} of {totalSteps}
        </span>
        <h1 className="text-base font-semibold text-foreground">{title}</h1>
      </div>
      
      {/* Right: Spacer for balance */}
      <div className="min-w-[60px]" />
    </header>
  );
}

export default ProfileWizardHeader;
