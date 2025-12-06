import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, Calendar, Share2, CheckCircle, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { AchievementV2 } from './AchievementBadgeV2';

interface AchievementDetailModalProps {
  achievement: AchievementV2 | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  relatedPhotos?: string[];
}

/**
 * AchievementDetailModal - Profile 2.0 Achievement Detail
 * Shows: Description, Unlock criteria, Date achieved, Related photos, Share button
 */
const AchievementDetailModal: React.FC<AchievementDetailModalProps> = ({
  achievement,
  open,
  onOpenChange,
  relatedPhotos = []
}) => {
  if (!achievement) return null;

  const handleShare = async () => {
    if (navigator.share && achievement.isUnlocked) {
      try {
        await navigator.share({
          title: `I unlocked ${achievement.name}!`,
          text: achievement.description,
        });
      } catch (err) {
        // User cancelled or error
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto rounded-sq-lg">
        <DialogHeader className="text-center pb-4">
          {/* Badge Icon */}
          <div className={cn(
            "mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4",
            achievement.isUnlocked
              ? "bg-primary/20"
              : "bg-muted"
          )}>
            {achievement.isUnlocked ? (
              <Trophy className="w-10 h-10 text-primary" />
            ) : (
              <Lock className="w-10 h-10 text-muted-foreground" />
            )}
          </div>
          
          <DialogTitle className="text-xl font-semibold">
            {achievement.name}
          </DialogTitle>
          
          {/* Status badge */}
          <div className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm mx-auto mt-2",
            achievement.isUnlocked
              ? "bg-green-500/10 text-green-600"
              : "bg-muted text-muted-foreground"
          )}>
            {achievement.isUnlocked ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Unlocked</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Locked</span>
              </>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-5">
          {/* Description */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
            <p className="text-foreground">{achievement.description}</p>
          </div>

          {/* Unlock criteria */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">How to unlock</h4>
            <p className="text-foreground text-sm">
              {achievement.category === 'skill' 
                ? 'Complete skill-based milestones in your golf journey'
                : 'Explore and play Top 100 courses around the world'
              }
            </p>
            
            {/* Progress bar for locked */}
            {!achievement.isUnlocked && achievement.progress !== undefined && achievement.maxProgress && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>{achievement.progress} / {achievement.maxProgress}</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Date achieved */}
          {achievement.isUnlocked && achievement.unlockedAt && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Achieved on</span>
              <span className="font-medium">
                {format(new Date(achievement.unlockedAt), 'MMMM d, yyyy')}
              </span>
            </div>
          )}

          {/* Related photos */}
          {achievement.isUnlocked && relatedPhotos.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Related moments</h4>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {relatedPhotos.slice(0, 4).map((photo, idx) => (
                  <img
                    key={idx}
                    src={photo}
                    alt=""
                    className="w-16 h-16 rounded-sq-sm object-cover flex-shrink-0"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Share button */}
          {achievement.isUnlocked && (
            <Button
              onClick={handleShare}
              className="w-full rounded-full"
              variant="outline"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share Achievement
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AchievementDetailModal;
