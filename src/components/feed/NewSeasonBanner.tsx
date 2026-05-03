import React from 'react';
import { Trophy, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCurrentSeason } from '@/hooks/useCurrentSeason';

export const NewSeasonBanner: React.FC = () => {
  const navigate = useNavigate();
  const { data: currentSeason } = useCurrentSeason();

  if (!currentSeason) return null;

  // Check if season started recently (within 7 days)
  const seasonStart = new Date(currentSeason.starts_at);
  const now = new Date();
  const daysSinceStart = Math.floor((now.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSinceStart > 7) return null; // Only show for first week

  return (
    <button
      onClick={() => {
        navigate('/profile');
      }}
      className="w-full bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 rounded-xl p-4 mb-6 hover:from-primary/15 hover:via-primary/10 hover:to-primary/15 transition-all group"
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <Trophy className="w-8 h-8 text-primary" />
          <Sparkles className="w-4 h-4 text-primary absolute -top-1 -right-1 animate-pulse" />
        </div>
        <div className="flex-1 text-left">
          <h3 className="font-semibold text-foreground group-hover:text-secondary transition-colors">
            {currentSeason.name} has begun!
          </h3>
          <p className="text-sm text-muted-foreground">
            Explore Season Pass, shop cosmetics, and climb the leaderboard
          </p>
        </div>
        <div className="text-primary">→</div>
      </div>
    </button>
  );
};
