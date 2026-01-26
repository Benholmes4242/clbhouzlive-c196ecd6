import { cn } from '@/lib/utils';
import type { LeaderboardScope } from '@/types/leaderboards';

interface LeaderboardScopeSelectorProps {
  value: LeaderboardScope;
  onChange: (scope: LeaderboardScope) => void;
  showClub?: boolean;
}

const scopeOptions: { value: LeaderboardScope; label: string }[] = [
  { value: 'global', label: 'Global' },
  { value: 'friends', label: 'Friends' },
  { value: 'club', label: 'Clubs' },
];

export function LeaderboardScopeSelector({
  value,
  onChange,
  showClub = true,
}: LeaderboardScopeSelectorProps) {
  const options = showClub ? scopeOptions : scopeOptions.filter(o => o.value !== 'club');
  
  return (
    <div className="flex p-1 bg-[#e2e8f0] rounded-xl">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'flex-1 py-2.5 min-h-[44px] text-xs font-medium rounded-lg transition-all flex items-center justify-center',
            value === option.value
              ? 'bg-white text-[#1e293b] shadow-sm border border-[#e2e8f0]'
              : 'text-[#64748b] hover:text-[#1e293b]'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
