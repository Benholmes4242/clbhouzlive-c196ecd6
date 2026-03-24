import { PillToggle } from '@/components/ui/PillToggle';

interface ViewModeToggleProps {
  value: 'player' | 'country';
  onChange: (mode: 'player' | 'country') => void;
}

const options = [
  { id: 'player', label: 'By Player' },
  { id: 'country', label: 'By Country' },
];

export function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  return (
    <div className="flex justify-center">
      <PillToggle
        options={options}
        selected={value}
        onSelect={(id) => onChange(id as 'player' | 'country')}
      />
    </div>
  );
}
