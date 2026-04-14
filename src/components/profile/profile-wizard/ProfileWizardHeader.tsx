/**
 * Backward-compatible ProfileWizardHeader for business wizard
 */
import { X, ChevronLeft } from 'lucide-react';

interface Props {
  title: string;
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onClose: () => void;
}

export function ProfileWizardHeader({ title, currentStep, totalSteps, onBack, onClose }: Props) {
  const isFirstStep = currentStep === 1;

  return (
    <div
      className="flex items-center justify-between px-4"
      style={{
        paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
        height: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 56px)',
        background: 'var(--bg-page, #F8FAFC)',
        borderBottom: '0.5px solid rgba(15,23,42,0.07)',
      }}
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
          Step {currentStep} of {totalSteps}
        </p>
        <p className="text-[16px] text-foreground leading-tight mt-0.5" style={{ fontWeight: 900 }}>
          {title}
        </p>
      </div>

      <button
        onClick={onClose}
        className="flex items-center justify-center min-h-[44px] min-w-[44px] -mr-2 text-muted-foreground"
        aria-label="Close"
      >
        <X size={20} strokeWidth={2} />
      </button>
    </div>
  );
}
