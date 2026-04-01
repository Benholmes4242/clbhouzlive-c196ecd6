import { WizardStep } from './types';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface Props {
  step: WizardStep;
  isSaving: boolean;
  isValid: boolean;
  isDirty: boolean;
  completionPct: number;
  onNext: () => void;
  onBack: () => void;
}

export function WizardNavigation({
  step, isSaving, isValid, isDirty, completionPct, onNext, onBack,
}: Props) {
  const isFinalStep = step === 3;
  const showCompletion = !isFinalStep && completionPct > 0;

  return (
    <div
      className="px-4 pt-3 bg-background border-t border-border"
      style={{ paddingBottom: 'calc(var(--sab) + 16px)' }}
    >
      <div className="flex gap-3">
        {step > 1 && (
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isSaving}
            className="flex-1 min-h-[50px] rounded-xl text-[15px] font-semibold border-0"
          >
            Back
          </Button>
        )}
        <Button
          onClick={onNext}
          disabled={(isFinalStep && (!isValid || !isDirty)) || isSaving}
          className="flex-1 min-h-[52px] rounded-[14px] text-[15px] font-semibold bg-foreground hover:bg-foreground/90 text-background border-0"
        >
          {isSaving ? (
            <><Loader2 size={18} className="animate-spin mr-2" /> Saving…</>
          ) : isFinalStep ? (
            isDirty ? 'Save Profile' : 'All Saved'
          ) : showCompletion ? (
            <span className="flex flex-col items-center leading-tight">
              <span>Continue</span>
              <span className="text-[11px] font-normal opacity-60">Profile {completionPct}% complete</span>
            </span>
          ) : (
            'Continue'
          )}
        </Button>
      </div>
    </div>
  );
}