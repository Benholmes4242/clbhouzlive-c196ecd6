import { X, ChevronLeft } from 'lucide-react';
import { WizardStep, STEP_TITLES } from './types';

const GEIST = 'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

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
      className="flex items-end justify-between px-4 bg-background"
      style={{
        paddingTop: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 8px)',
        paddingBottom: 12,
      }}
    >
      {/* Left: back/close + eyebrow + big step title (Activity layout) */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={isFirstStep ? onClose : onBack}
          style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(15,23,42,0.05)', border: '0.5px solid rgba(15,23,42,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}
          aria-label={isFirstStep ? 'Close' : 'Back'}
        >
          {isFirstStep ? <X size={16} strokeWidth={2.5} /> : <ChevronLeft size={18} strokeWidth={2.5} />}
        </button>
        <div className="min-w-0">
          <div style={{ marginBottom: 6 }}>
            <span style={{ fontFamily: GEIST, fontSize: 9, fontWeight: 800, color: '#64748B', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
              Step {step} of 3
            </span>
          </div>
          <h1 style={{ fontFamily: GEIST, fontSize: 34, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.025em', lineHeight: 1, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {STEP_TITLES[step]}
          </h1>
        </div>
      </div>

      {/* Right: Skip (onboarding) or close — retained wizard control */}
      {onSkip ? (
        <button
          onClick={onSkip}
          className="flex items-center justify-center min-h-[44px] -mr-2 text-[12px] font-normal flex-shrink-0"
          style={{ color: '#64748B' }}
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