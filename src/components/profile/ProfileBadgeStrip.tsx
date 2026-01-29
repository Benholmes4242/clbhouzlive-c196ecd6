import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Target, Zap } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';
import { getTop100Club } from '@/lib/top100Club';

interface ProfileBadgeStripProps {
  coursesPlayed: number;
  totalXP: number;
  britainIrelandCompleted?: number;
  europeCompleted?: number;
  usaCompleted?: number;
  worldwideCompleted?: number;
  className?: string;
}

const ProfileBadgeStrip: React.FC<ProfileBadgeStripProps> = ({
  coursesPlayed,
  totalXP,
  britainIrelandCompleted = 0,
  europeCompleted = 0,
  usaCompleted = 0,
  worldwideCompleted = 0,
  className
}) => {
  const navigate = useNavigate();
  const badges = [];

  // Trophy Level Badge using unified tier system
  const club = getTop100Club(coursesPlayed);
  
  if (club.meta && club.threshold && club.threshold >= 50) {
    const colorMap: Record<string, string> = {
      green: 'from-emerald-500 to-green-600',
      silver: 'from-blue-500 to-indigo-600',
      gold: 'from-amber-500 to-orange-600',
      platinum: 'from-purple-500 to-violet-600',
      obsidian: 'from-slate-700 to-slate-900',
    };
    
    const emojiMap: Record<string, string> = {
      green: '🥈',
      silver: '🥇',
      gold: '🏆',
      platinum: '👑',
      obsidian: '💎',
    };

    badges.push({
      id: 'trophy',
      icon: emojiMap[club.tierId] || '🎯',
      text: club.tierName,
      color: colorMap[club.tierId] || 'from-gray-400 to-slate-500',
      tooltip: `${club.tierName} - ${coursesPlayed} courses played`,
      type: 'milestone',
    });
  }

  // Regional Completion Badges
  if (britainIrelandCompleted >= 20) {
    badges.push({
      id: 'gb-ireland',
      icon: '🇬🇧',
      text: 'GB&I Complete',
      color: 'from-red-500 to-blue-600',
      tooltip: 'Completed Great Britain & Ireland Top 100 list',
      type: 'regional',
      slug: 'gb-i',
    });
  }

  if (europeCompleted >= 100) {
    badges.push({
      id: 'europe',
      icon: '🇪🇺',
      text: 'Europe Complete',
      color: 'from-blue-500 to-yellow-500',
      tooltip: 'Completed Europe Top 100 list',
      type: 'regional',
      slug: 'europe',
    });
  }

  if (usaCompleted >= 100) {
    badges.push({
      id: 'usa',
      icon: '🇺🇸',
      text: 'USA Complete',
      color: 'from-red-500 to-blue-700',
      tooltip: 'Completed USA Top 100 list',
      type: 'regional',
      slug: 'usa',
    });
  }

  if (worldwideCompleted >= 100) {
    badges.push({
      id: 'worldwide',
      icon: '🌍',
      text: 'Global Complete',
      color: 'from-green-500 to-blue-500',
      tooltip: 'Completed Global Top 100 list',
      type: 'regional',
      slug: 'global',
    });
  }

  // XP Milestone Badges
  if (totalXP >= 10000) {
    badges.push({
      id: 'xp-milestone',
      icon: '✨',
      text: `${Math.floor(totalXP / 1000)}k XP`,
      color: 'from-yellow-400 to-orange-500',
      tooltip: `Total Experience Points: ${totalXP.toLocaleString()}`,
      type: 'xp',
    });
  }

  // Show only first 4 badges to prevent overflow
  const displayBadges = badges.slice(0, 4);

  if (displayBadges.length === 0) return null;

  const handleBadgeClick = (badge: any) => {
    if (badge.type === 'milestone' || badge.type === 'xp') {
      navigate('/top100?tab=my-progress');
    } else if (badge.type === 'regional' && badge.slug) {
      navigate(`/top100/${badge.slug}`);
    }
  };

  return (
    <Tooltip.Provider>
      <div className={cn('flex items-center gap-2 flex-wrap', className)}>
        {displayBadges.map((badge) => (
          <Tooltip.Root key={badge.id}>
            <Tooltip.Trigger asChild>
              <button
                onClick={() => handleBadgeClick(badge)}
                className="focus:outline-none"
              >
                <Badge 
                  variant="secondary" 
                  className={cn(
                    'text-foreground border-0 bg-gradient-to-r cursor-pointer hover:scale-105 active:scale-95 transition-transform duration-200',
                    badge.color
                  )}
                >
                  <span className="mr-1">{badge.icon}</span>
                  {badge.text}
                </Badge>
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="bg-popover text-popover-foreground text-sm px-3 py-2 rounded-sq-sm max-w-xs z-50"
                sideOffset={4}
              >
                {badge.tooltip}
                <Tooltip.Arrow className="fill-black/90" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        ))}
      </div>
    </Tooltip.Provider>
  );
};

export default ProfileBadgeStrip;
