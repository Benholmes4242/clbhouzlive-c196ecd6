import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import type { AchievementToastData } from '@/hooks/useAchievementToasts';

interface AchievementToastProps {
  achievement: AchievementToastData | null;
  onDismiss: () => void;
  onShare: (achievement: AchievementToastData) => void;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  skill: '🎯',
  exploration: '🌍',
  social: '👥',
};

export const AchievementToast: React.FC<AchievementToastProps> = ({
  achievement,
  onDismiss,
  onShare,
}) => {
  const { t } = useTranslation('achievements');
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (achievement) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [achievement, onDismiss]);

  if (!achievement) return null;

  const emoji = CATEGORY_EMOJIS[achievement.category] || '🏆';

  const handleViewAll = () => {
    onDismiss();
    navigate('/profile');
  };

  const handleShare = () => {
    onShare(achievement);
    onDismiss();
  };

  return (
    <div className="fixed bottom-[109px] left-1/2 -translate-x-1/2 z-[9999] pointer-events-none max-w-md w-full px-4">
      <div
        className={`
          pointer-events-auto
          bg-card/95 backdrop-blur-lg 
          border border-border/[0.05] 
          rounded-2xl 
          shadow-2xl shadow-primary/10
          p-4
          transition-all duration-motion-medium ease-out-soft
          motion-reduce:transition-none
          ${isVisible ? 'opacity-100 translate-y-0 scale-100 animate-[toast-in_0.22s_ease-out_forwards] motion-reduce:animate-none' : 'opacity-0 translate-y-2 scale-[0.97]'}
        `}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 text-3xl">
            {emoji}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-meta font-medium text-primary uppercase tracking-wide mb-1">
              {t('toast.unlockedOverline')}
            </p>
            <h4 className="font-semibold text-foreground text-body-md mb-1">
              {achievement.name}
            </h4>
            <p className="text-body-sm text-muted-foreground line-clamp-2">
              {achievement.description}
            </p>
          </div>

          {achievement.points > 0 && (
            <div className="flex-shrink-0 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-meta font-semibold">
              {t('toast.xpBadge', { points: achievement.points })}
            </div>
          )}

          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-all duration-motion-fast ease-standard p-1"
            aria-label={t('a11y.dismiss')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <Button
            onClick={handleShare}
            size="sm"
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            {t('common:action.share', { defaultValue: 'Share' })}
          </Button>
          <Button
            onClick={handleViewAll}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            {t('common:action.viewAll', { defaultValue: 'View all' })}
          </Button>
        </div>
      </div>
    </div>
  );
};
