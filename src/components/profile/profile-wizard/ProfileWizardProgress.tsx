/**
 * Backward-compatible ProfileWizardProgress for business wizard
 */
interface Props {
  currentStep: number;
  totalSteps: number;
}

export function ProfileWizardProgress({ currentStep, totalSteps }: Props) {
  return (
    <div className="flex gap-1.5 px-4 pt-3 pb-2 bg-background">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
        <div
          key={s}
          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
            s <= currentStep ? 'bg-[#f59e0b]' : 'bg-muted'
          }`}
        />
      ))}
    </div>
  );
}
