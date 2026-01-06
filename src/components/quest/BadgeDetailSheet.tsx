/**
 * BadgeDetailSheet - Cinematic badge detail view
 * Shows large badge, description, progress, tips, and CTA
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Lock, Award, MapPin, ChevronRight, Sparkles } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { CLUB_STEPS } from '@/lib/top100Club';
import { getRingColorForThreshold } from '@/lib/globalAchievementMilestoneSystem';
import { useNavigate } from 'react-router-dom';

interface BadgeDetailSheetProps {
  open: boolean;
  onClose: () => void;
  badgeType: 'milestone' | 'region' | null;
  badgeId: string | null;
  totalPlayed: number;
  regionProgress?: {
    id: string;
    name: string;
    played: number;
    total: number;
  }[];
}

export const BadgeDetailSheet: React.FC<BadgeDetailSheetProps> = ({
  open,
  onClose,
  badgeType,
  badgeId,
  totalPlayed,
  regionProgress = [],
}) => {
  const navigate = useNavigate();

  // Get badge data based on type
  const badgeData = useMemo(() => {
    if (!badgeType || !badgeId) return null;

    if (badgeType === 'milestone') {
      const threshold = parseInt(badgeId, 10);
      const step = CLUB_STEPS.find(s => s.threshold === threshold);
      if (!step) return null;

      const isUnlocked = totalPlayed >= threshold;
      const remaining = threshold - totalPlayed;
      const progress = Math.min((totalPlayed / threshold) * 100, 100);
      const tierColor = getRingColorForThreshold(threshold);

      return {
        type: 'milestone' as const,
        title: `${threshold} Club`,
        tierName: step.tierName,
        description: `Achieve the ${step.tierName} status by playing ${threshold} Top 100 courses worldwide.`,
        threshold,
        isUnlocked,
        remaining,
        progress,
        tierColor,
        tips: [
          'Focus on courses near you first',
          'Check the Journey Summary for regional progress',
          'Each region has its own Top 100 list to explore',
        ],
      };
    } else {
      const region = regionProgress.find(r => r.id === badgeId);
      if (!region) return null;

      const isUnlocked = region.played >= region.total && region.total > 0;
      const remaining = region.total - region.played;
      const progress = region.total > 0 ? Math.min((region.played / region.total) * 100, 100) : 0;

      // Region colors
      const regionColors: Record<string, string> = {
        'gb-i': '#4A7C59',
        'europe': '#5B7EC0',
        'usa': '#C75B5B',
        'global': '#7A8FC0',
      };
      const tierColor = regionColors[badgeId] || '#6e9277';

      return {
        type: 'region' as const,
        title: `${region.name} Complete`,
        tierName: region.name,
        description: `Master the ${region.name} Top 100 by playing all ${region.total} courses on the list.`,
        threshold: region.total,
        isUnlocked,
        remaining,
        progress,
        tierColor,
        played: region.played,
        total: region.total,
        tips: [
          `You've played ${region.played} of ${region.total} courses`,
          'Explore the region page for course details',
          'Start with the highest-rated courses',
        ],
      };
    }
  }, [badgeType, badgeId, totalPlayed, regionProgress]);

  if (!badgeData) return null;

  const handleExploreCourses = () => {
    onClose();
    if (badgeData.type === 'region') {
      // Navigate to explore with region filter
      navigate(`/explore?region=${badgeId}`);
    } else {
      navigate('/explore');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-t max-h-[85vh] overflow-y-auto"
        style={{
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F9FAFB 100%)',
          borderColor: 'var(--quest-stroke)',
        }}
      >
        <div className="pb-8">
          <SheetHeader className="text-center pb-6">
            {/* Large badge display */}
            <motion.div 
              className="flex justify-center mb-6 pt-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              {/* Outer glow */}
              <motion.div
                className="absolute w-32 h-32 rounded-3xl pointer-events-none"
                style={{
                  background: `radial-gradient(circle, ${badgeData.tierColor}25 0%, transparent 70%)`,
                  filter: 'blur(20px)',
                }}
                animate={badgeData.isUnlocked ? {
                  opacity: [0.6, 1, 0.6],
                  scale: [1, 1.1, 1],
                } : {}}
                transition={{ duration: 3, repeat: Infinity }}
              />
              
              <div
                className="relative w-24 h-24 rounded-3xl flex items-center justify-center"
                style={{
                  background: badgeData.isUnlocked 
                    ? `linear-gradient(145deg, ${badgeData.tierColor}20 0%, ${badgeData.tierColor}08 100%)`
                    : 'var(--quest-pill-inactive)',
                  border: badgeData.isUnlocked 
                    ? `2px solid ${badgeData.tierColor}40`
                    : '2px solid var(--quest-stroke)',
                  boxShadow: badgeData.isUnlocked 
                    ? `0 8px 32px ${badgeData.tierColor}25, inset 0 1px 2px rgba(255,255,255,0.8)`
                    : 'var(--quest-shadow-sm)',
                }}
              >
                {badgeData.isUnlocked ? (
                  <>
                    {badgeData.type === 'milestone' ? (
                      <span 
                        className="text-3xl font-bold"
                        style={{ color: badgeData.tierColor }}
                      >
                        {badgeData.threshold}
                      </span>
                    ) : (
                      <MapPin 
                        className="w-10 h-10"
                        style={{ color: badgeData.tierColor }}
                      />
                    )}
                    <Sparkles 
                      className="absolute -top-2 -right-2 w-6 h-6"
                      style={{ color: badgeData.tierColor }}
                    />
                  </>
                ) : (
                  <Lock 
                    className="w-10 h-10"
                    style={{ color: 'var(--quest-text-tertiary)' }}
                  />
                )}
              </div>
            </motion.div>

            {/* Tier label */}
            <div 
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full mx-auto mb-3"
              style={{
                background: `${badgeData.tierColor}12`,
                border: `1px solid ${badgeData.tierColor}25`,
              }}
            >
              <Award className="w-3 h-3" style={{ color: badgeData.tierColor }} />
              <span 
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: badgeData.tierColor }}
              >
                {badgeData.tierName}
              </span>
            </div>

            <SheetTitle 
              className="text-2xl font-bold"
              style={{ color: 'var(--quest-text-primary)' }}
            >
              {badgeData.title}
            </SheetTitle>
          </SheetHeader>

          {/* Description */}
          <p 
            className="text-center text-sm mb-6 px-4"
            style={{ color: 'var(--quest-text-secondary)' }}
          >
            {badgeData.description}
          </p>

          {/* Progress section */}
          <div 
            className="rounded-2xl p-4 mb-6 mx-4"
            style={{
              background: 'var(--quest-surface)',
              border: '1px solid var(--quest-stroke)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span 
                className="text-sm font-medium"
                style={{ color: 'var(--quest-text-secondary)' }}
              >
                Progress
              </span>
              <span 
                className="text-sm font-bold"
                style={{ color: 'var(--quest-text-primary)' }}
              >
                {badgeData.type === 'region' 
                  ? `${badgeData.played} / ${badgeData.total}`
                  : `${totalPlayed} / ${badgeData.threshold}`
                }
              </span>
            </div>
            
            <div
              className="h-3 rounded-full overflow-hidden mb-3"
              style={{ background: 'var(--quest-track)' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${badgeData.tierColor} 0%, ${badgeData.tierColor}CC 100%)`,
                  boxShadow: `0 0 8px ${badgeData.tierColor}40`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${badgeData.progress}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>

            {/* Status chip */}
            <div className="flex justify-center">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
                style={{
                  background: badgeData.isUnlocked
                    ? `${badgeData.tierColor}15`
                    : 'var(--quest-chip-bg)',
                  border: `1px solid ${badgeData.isUnlocked ? `${badgeData.tierColor}30` : 'var(--quest-chip-stroke)'}`,
                  color: badgeData.isUnlocked
                    ? badgeData.tierColor
                    : 'var(--quest-text-secondary)',
                }}
              >
                {badgeData.isUnlocked ? '✓ Earned' : `${badgeData.remaining} more to earn`}
              </div>
            </div>
          </div>

          {/* Tips section */}
          {!badgeData.isUnlocked && (
            <div className="px-4 mb-6">
              <h3 
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: 'var(--quest-text-tertiary)' }}
              >
                How to Get It
              </h3>
              <div className="space-y-2">
                {badgeData.tips.map((tip, i) => (
                  <div 
                    key={i}
                    className="flex items-start gap-2 text-sm"
                    style={{ color: 'var(--quest-text-secondary)' }}
                  >
                    <span style={{ color: badgeData.tierColor }}>•</span>
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="px-4">
            <Button
              onClick={handleExploreCourses}
              className="w-full py-6 rounded-xl font-semibold text-base"
              style={{
                background: 'var(--quest-text-primary)',
                color: '#FFFFFF',
              }}
            >
              <span>Explore Courses</span>
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BadgeDetailSheet;
