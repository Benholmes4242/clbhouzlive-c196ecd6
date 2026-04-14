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
  const isDisabled = (isFinalStep && (!isValid || !isDirty)) || isSaving;

  return (
    <div
      className="px-4 pt-3 bg-background border-t border-border"
      style={{ paddingBottom: 'calc(var(--sab) + 16px)' }}
    >
      <div className="flex gap-3">
        {step > 1 && (
          <button
            onClick={onBack}
            disabled={isSaving}
            style={{
              flex: 1, minHeight: 50, borderRadius: 12,
              background: 'transparent',
              border: '0.5px solid rgba(15,23,42,0.12)',
              fontSize: 15, fontWeight: 600,
              color: '#0F172A',
              cursor: isSaving ? 'not-allowed' : 'pointer',
            }}
          >
            Back
          </button>
        )}
        <Button
          onClick={onNext}
          disabled={isDisabled}
          className="flex-1 min-h-[52px] rounded-[14px] text-[15px] font-bold border-0 active:opacity-90 transition-opacity"
          style={{
            background: isDisabled ? 'rgba(247,147,30,0.40)' : '#F7931E',
            color: '#ffffff',
            boxShadow: isDisabled ? 'none' : '0 4px 16px rgba(247,147,30,0.28)',
          }}
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