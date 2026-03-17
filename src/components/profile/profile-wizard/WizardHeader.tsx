import { X, ChevronLeft } from 'lucide-react';
import { WizardStep, STEP_TITLES } from './types';

interface Props {
  step: WizardStep;
  isFirstStep: boolean;
  onBack: () => void;
  onClose: () => void;
  onSkip?: () => void;
}

export function WizardHeader({ step, isFirstStep, onBack, onClose, onSkip }: Props) {
  return (
    <div
      className="flex items-center justify-between px-4 bg-background border-b border-border"
      style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)', height: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 56px)' }}
    >
      <button
        onClick={isFirstStep ? onClose : onBack}
        className="flex items-center justify-center min-h-[44px] min-w-[44px] -ml-2 text-foreground"
        aria-label={isFirstStep ? 'Close' : 'Back'}
      >
        {isFirstStep
          ? <X size={20} strokeWidth={2} />
          : <ChevronLeft size={22} strokeWidth={2.5} />
        }
      </button>

      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-muted-foreground">
          Step {step} of 3
        </p>
        <p className="text-[16px] font-bold text-foreground leading-tight mt-0.5">
          {STEP_TITLES[step]}
        </p>
      </div>

      {onSkip ? (
        <button
          onClick={onSkip}
          className="flex items-center justify-center min-h-[44px] -mr-2 text-muted-foreground text-[13px] font-medium"
        >
          Skip for now
        </button>
      ) : (
        <button
          onClick={onClose}
          className="flex items-center justify-center min-h-[44px] min-w-[44px] -mr-2 text-muted-foreground"
          aria-label="Close"
        >
          <X size={20} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
