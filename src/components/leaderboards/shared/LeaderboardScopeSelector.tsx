import { Globe, Users, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LeaderboardScope } from '@/types/leaderboards';

interface LeaderboardScopeSelectorProps {
  value: LeaderboardScope;
  onChange: (scope: LeaderboardScope) => void;
  showClub?: boolean;
}

export function LeaderboardScopeSelector({
  value,
  onChange,
  showClub = true,
}: LeaderboardScopeSelectorProps) {
  const options = [
    { value: 'global' as const, label: 'Global', icon: Globe },
    { value: 'friends' as const, label: 'Friends', icon: Users },
    ...(showClub ? [{ value: 'club' as const, label: 'Clubs', icon: Building2 }] : []),
  ];

  return (
    <div className="flex p-1 bg-[#e2e8f0] rounded-xl">
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex-1 py-2 px-2 text-xs font-medium rounded-lg transition-all duration-150 flex items-center justify-center gap-1',
              value === option.value
                ? 'bg-white shadow-sm text-[#1e293b] border border-[#e2e8f0]'
                : 'text-[#64748b] hover:text-[#1e293b] hover:bg-white/50'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
