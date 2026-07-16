import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { Trophy, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Confetti from 'react-confetti';
import { useWindowSize } from '@/hooks/useWindowSize';
import { supabase } from '@/integrations/supabase/client';
import { formatNumber } from '@/i18n/format';

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
  const { t } = useTranslation('achievements');
  const navigate = useNavigate();
  const { width, height } = useWindowSize();

  useEffect(() => {
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
          <DialogTitle>{t('season.titleVo')}</DialogTitle>
          <DialogDescription>{t('season.descriptionVo', { season: seasonName })}</DialogDescription>
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
            <h2 className="text-2xl font-bold">{t('season.headline')}</h2>
            <p className="text-muted-foreground">
              {t('season.ended', { season: seasonName })}
            </p>
          </div>

          <div className="w-full space-y-3 bg-muted/20 rounded-sq-sm p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('season.finalRank')}</span>
              <span className="font-bold text-lg">#{finalRank}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('season.totalXp')}</span>
              <span className="font-bold text-lg">{t('season.xpValue', { xp: formatNumber(finalXP) })}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('season.rewardTier')}</span>
              <span className="font-bold text-lg capitalize">{rewardTier}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full">
            <Button onClick={handleViewTrophies} className="w-full">
              <Trophy className="w-4 h-4 mr-2" />
              {t('season.viewCabinet')}
            </Button>
            <Button onClick={onClose} variant="outline" className="w-full">
              {t('season.continue')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
