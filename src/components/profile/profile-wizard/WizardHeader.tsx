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
      style={{
        paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
        height: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 56px)',
      }}
    >
      {/* Left — hide on first step when Skip is available, show back on subsequent steps */}
      {(!isFirstStep || !onSkip) ? (
        <button
          onClick={isFirstStep ? onClose : onBack}
          className="w-9 h-9 rounded-full bg-black/[0.06] flex items-center justify-center text-foreground flex-shrink-0"
          aria-label={isFirstStep ? 'Close' : 'Back'}
        >
          {isFirstStep
            ? <X size={16} strokeWidth={2.5} />
            : <ChevronLeft size={18} strokeWidth={2.5} />
          }
        </button>
      ) : (
        <div className="w-9 h-9 flex-shrink-0" />
      )}

      {/* Centre — step eyebrow + title */}
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-muted-foreground">
          Step {step} of 3
        </p>
        <p className="text-[16px] font-bold text-foreground leading-tight mt-0.5">
          {STEP_TITLES[step]}
        </p>
      </div>

      {/* Right — Skip or Close */}
      {onSkip ? (
        <button
          onClick={onSkip}
          className="flex items-center justify-center min-h-[44px] -mr-2 text-muted-foreground text-[13px] font-medium"
        >
          Skip
        </button>
      ) : (
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-black/[0.06] flex items-center justify-center text-muted-foreground flex-shrink-0"
          aria-label="Close"
        >
          <X size={16} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
