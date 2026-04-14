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
          style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(15,23,42,0.05)', border: '0.5px solid rgba(15,23,42,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
          <div style={{ width: 3, height: 8, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
          <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
            Step {step} of 3
          </span>
        </div>
        <p style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
          {STEP_TITLES[step]}
        </p>
      </div>

      {/* Right — Skip or Close */}
      {onSkip ? (
        <button
          onClick={onSkip}
          className="flex items-center justify-center min-h-[44px] -mr-2 text-[12px] font-normal"
          style={{ color: 'rgba(15,23,42,0.30)' }}
        >
          Skip for now
        </button>
      ) : (
        <button
          onClick={onClose}
          style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(15,23,42,0.05)', border: '0.5px solid rgba(15,23,42,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}
          aria-label="Close"
        >
          <X size={16} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}