import { Trophy } from 'lucide-react';

interface LeaderboardEmptyProps {
  title?: string;
  description?: string;
}

export function LeaderboardEmpty({
  title = 'No entries yet',
  description = 'Be the first to climb the leaderboard!',
}: LeaderboardEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Trophy className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="font-medium text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
    </div>
  );
}
