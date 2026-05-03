import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentSeason } from '@/hooks/useCurrentSeason';
import { useUserSeasonXP } from '@/hooks/useUserSeasonXP';
import { Button } from '@/components/ui/button';
import { Trophy, ArrowRight } from 'lucide-react';
import { getSeasonLevel } from '@/utils/seasonLevels';

interface SeasonStatusCardProps {
  userId: string;
}

export const SeasonStatusCard: React.FC<SeasonStatusCardProps> = ({ userId }) => {
  const navigate = useNavigate();
  const { data: currentSeason } = useCurrentSeason();
  const { data: seasonXP } = useUserSeasonXP(userId, currentSeason?.id);

  if (!currentSeason || !seasonXP) return null;

  return (
    <div className="bg-gradient-to-br from-primary/5 via-card/50 to-card/50 backdrop-blur-sm border border-primary/20 rounded-2xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-primary">{currentSeason.name}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {getSeasonLevel(seasonXP.total_xp)}
          </p>
        </div>
        {seasonXP.season_rank && (
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">#{seasonXP.season_rank}</div>
            <div className="text-xs text-muted-foreground">Season Rank</div>
          </div>
        )}
      </div>

      <div className="mb-4">
        <p className="text-sm mb-2">
          You've earned <span className="font-semibold text-primary">{seasonXP.total_xp.toLocaleString()} XP</span> this season.
          {seasonXP.season_rank && ' Keep going to climb the ladder!'}
        </p>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate('/profile')}
        className="w-full"
      >
        View Season Hub
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
};
