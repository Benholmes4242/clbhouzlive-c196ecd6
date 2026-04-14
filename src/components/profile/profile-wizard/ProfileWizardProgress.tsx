/**
 * Backward-compatible ProfileWizardProgress for business wizard
 */
interface Props {
  currentStep: number;
  totalSteps: number;
}

export function ProfileWizardProgress({ currentStep, totalSteps }: Props) {
  return (
    <div
      className="flex gap-1.5 px-4 pt-3 pb-2"
      style={{ background: 'var(--bg-page, #F8FAFC)' }}
    >
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
        <div
          key={s}
          className="h-1 flex-1 rounded-full transition-all duration-300"
          style={{ backgroundColor: s <= currentStep ? '#F7931E' : 'rgba(15,23,42,0.08)' }}
        />
      ))}
    </div>
  );
}
