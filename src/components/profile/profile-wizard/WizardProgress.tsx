import { WizardStep } from './types';

interface Props {
  step: WizardStep;
}

export function WizardProgress({ step }: Props) {
  return (
    <div className="flex gap-1.5 px-4 pt-3 pb-0 bg-background">
      {([1, 2, 3] as WizardStep[]).map((s) => (
        <div
          key={s}
          className={`h-[3px] flex-1 rounded-full transition-all duration-300 ${
            s <= step ? 'bg-[hsl(38,92%,50%)]' : 'bg-muted'
          }`}
        />
      ))}
    </div>
  );
}
