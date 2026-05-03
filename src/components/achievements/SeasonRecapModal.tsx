import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { Trophy, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Confetti from 'react-confetti';
import { useWindowSize } from '@/hooks/useWindowSize';
import { supabase } from '@/integrations/supabase/client';

interface SeasonRecapModalProps {
  isOpen: boolean;
  onClose: () => void;
  seasonName: string;
  finalRank: number;
  finalXP: number;
  rewardTier: string;
  seasonId: string;
  userId: string;
}

export const SeasonRecapModal: React.FC<SeasonRecapModalProps> = ({
  isOpen,
  onClose,
  seasonName,
  finalRank,
  finalXP,
  rewardTier,
  seasonId,
  userId,
}) => {
  const navigate = useNavigate();
  const { width, height } = useWindowSize();

  useEffect(() => {
    // Mark as seen when modal opens
    if (isOpen) {
      const markAsSeen = async () => {
        await supabase
          .from('user_seen_season_recaps' as any)
          .insert({
            user_id: userId,
            season_id: seasonId,
          });
      };
      markAsSeen();
    }
  }, [isOpen, userId, seasonId]);

  const handleViewTrophies = () => {
    onClose();
    navigate('/profile');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <VisuallyHidden>
          <DialogTitle>Season Complete</DialogTitle>
          <DialogDescription>Your season recap for {seasonName}</DialogDescription>
        </VisuallyHidden>
        {isOpen && <Confetti width={width} height={height} recycle={false} numberOfPieces={200} />}
        
        <div className="flex flex-col items-center text-center space-y-6 py-6">
          <div className="relative">
            <div className="absolute inset-0 animate-ping">
              <Sparkles className="w-16 h-16 text-primary opacity-20" />
            </div>
            <Trophy className="w-16 h-16 text-primary relative z-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Season Complete!</h2>
            <p className="text-muted-foreground">
              {seasonName} has ended
            </p>
          </div>

          <div className="w-full space-y-3 bg-muted/20 rounded-sq-sm p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Final Rank</span>
              <span className="font-bold text-lg">#{finalRank}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total XP</span>
              <span className="font-bold text-lg">{finalXP.toLocaleString()} XP</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Reward Tier</span>
              <span className="font-bold text-lg capitalize">{rewardTier}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full">
            <Button onClick={handleViewTrophies} className="w-full">
              <Trophy className="w-4 h-4 mr-2" />
              View Trophy Cabinet
            </Button>
            <Button onClick={onClose} variant="outline" className="w-full">
              Continue to New Season
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
