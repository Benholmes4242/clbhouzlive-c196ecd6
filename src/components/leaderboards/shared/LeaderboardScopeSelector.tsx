import { PillToggle } from '@/components/ui/PillToggle';
import type { LeaderboardScope } from '@/types/leaderboards';

interface LeaderboardScopeSelectorProps {
  value: LeaderboardScope;
  onChange: (scope: LeaderboardScope) => void;
  showClub?: boolean;
  showCountry?: boolean;
}

const allScopeOptions: { id: LeaderboardScope; label: string }[] = [
  { id: 'global', label: 'Global' },
  { id: 'friends', label: 'Friends' },
  { id: 'club', label: 'Clubs' },
  { id: 'country', label: 'Country' },
];

export function LeaderboardScopeSelector({
  value,
  onChange,
  showClub = true,
  showCountry = true,
}: LeaderboardScopeSelectorProps) {
  let options = allScopeOptions;
  if (!showClub) {
    options = options.filter(o => o.id !== 'club');
  }
  if (!showCountry) {
    options = options.filter(o => o.id !== 'country');
  }
  
  return (
    <div className="flex justify-center">
      <PillToggle 
        options={options} 
        selected={value} 
        onSelect={(id) => onChange(id as LeaderboardScope)}
        size="small"
      />
    </div>
  );
}
