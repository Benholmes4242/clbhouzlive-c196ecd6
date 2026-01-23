import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, Users, Building2 } from 'lucide-react';
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
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as LeaderboardScope)}>
      <TabsList className="grid w-full grid-cols-3 h-9">
        <TabsTrigger value="global" className="text-xs gap-1">
          <Globe className="h-3.5 w-3.5" />
          Global
        </TabsTrigger>
        <TabsTrigger value="friends" className="text-xs gap-1">
          <Users className="h-3.5 w-3.5" />
          Friends
        </TabsTrigger>
        {showClub && (
          <TabsTrigger value="club" className="text-xs gap-1">
            <Building2 className="h-3.5 w-3.5" />
            Club
          </TabsTrigger>
        )}
      </TabsList>
    </Tabs>
  );
}
