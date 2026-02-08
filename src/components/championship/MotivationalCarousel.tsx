import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, 
  Target, 
  Users, 
  Flame, 
  Award,
  Sparkles
} from 'lucide-react';

interface MotivationalMessage {
  id: string;
  icon: React.ElementType;
  iconColor: string;
  message: string;
  subMessage?: string;
  priority: number;
}

interface Props {
  currentRank: number | null;
  totalPlayers: number;
  coursesThisSeason: number;
  friendAhead?: { name: string; rank: number; coursesAhead: number } | null;
  friendBehind?: { name: string; rank: number; coursesBehind: number } | null;
  rivalAhead?: { name: string; rank: number; coursesAhead: number } | null;
  coursesToNextRank?: number;
  isInTop10: boolean;
  isInTop3: boolean;
  streak?: number;
}

export const MotivationalCarousel: React.FC<Props> = ({
  currentRank,
  totalPlayers,
  coursesThisSeason,
  friendAhead,
  friendBehind,
  rivalAhead,
  coursesToNextRank,
  isInTop10,
  isInTop3,
  streak,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Build dynamic messages based on user's situation
  const messages: MotivationalMessage[] = [];

  // Top 3 message (highest priority) - Golf Chartreus gold
  if (isInTop3 && currentRank) {
    messages.push({
      id: 'top3',
      icon: Award,
      iconColor: '#C1A84C',
      message: currentRank === 1 
        ? "You're leading the pack! 👑" 
        : `You're #${currentRank}! Just ${currentRank - 1} spot${currentRank > 2 ? 's' : ''} from the top`,
      subMessage: 'Keep up the incredible pace',
      priority: 100,
    });
  }
  else if (isInTop10 && currentRank) {
    messages.push({
      id: 'top10',
      icon: TrendingUp,
      iconColor: '#334E3D',
      message: `You're #${currentRank} — in the top 10!`,
      subMessage: coursesToNextRank 
        ? `${coursesToNextRank} course${coursesToNextRank > 1 ? 's' : ''} to climb higher`
        : 'Keep pushing to climb higher',
      priority: 90,
    });
  }

  if (friendAhead) {
    messages.push({
      id: 'friend-ahead',
      icon: Users,
      iconColor: '#B8C6C9',
      message: `${friendAhead.name} is ${friendAhead.coursesAhead} course${friendAhead.coursesAhead > 1 ? 's' : ''} ahead`,
      subMessage: 'Complete more courses to catch up!',
      priority: 80,
    });
  }

  if (friendBehind) {
    messages.push({
      id: 'friend-behind',
      icon: Users,
      iconColor: '#334E3D',
      message: `You're ${friendBehind.coursesBehind} course${friendBehind.coursesBehind > 1 ? 's' : ''} ahead of ${friendBehind.name}`,
      subMessage: 'Stay ahead — keep logging courses!',
      priority: 70,
    });
  }

  if (rivalAhead) {
    messages.push({
      id: 'rival',
      icon: Target,
      iconColor: '#C1A84C',
      message: `Your rival ${rivalAhead.name} is #${rivalAhead.rank}`,
      subMessage: `${rivalAhead.coursesAhead} course${rivalAhead.coursesAhead > 1 ? 's' : ''} to overtake them`,
      priority: 85,
    });
  }

  if (streak && streak >= 3) {
    messages.push({
      id: 'streak',
      icon: Flame,
      iconColor: '#E5D0A1',
      message: `${streak}-day streak! 🔥`,
      subMessage: 'Keep it going — play tomorrow!',
      priority: 60,
    });
  }

  if (coursesToNextRank && coursesToNextRank <= 2 && !isInTop10) {
    messages.push({
      id: 'close-to-rank',
      icon: Sparkles,
      iconColor: '#334E3D',
      message: `Just ${coursesToNextRank} course${coursesToNextRank > 1 ? 's' : ''} to move up!`,
      subMessage: "You're so close to the next rank",
      priority: 75,
    });
  }

  if (messages.length === 0) {
    messages.push({
      id: 'generic',
      icon: TrendingUp,
      iconColor: '#334E3D',
      message: currentRank 
        ? `You're #${currentRank} of ${totalPlayers} players`
        : 'Log courses to join the leaderboard!',
      subMessage: 'Every course counts',
      priority: 10,
    });
  }

  const sortedMessages = messages.sort((a, b) => b.priority - a.priority);

  useEffect(() => {
    if (sortedMessages.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sortedMessages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [sortedMessages.length]);

  const currentMessage = sortedMessages[currentIndex];
  if (!currentMessage) return null;

  const Icon = currentMessage.icon;

  return (
    <div 
      className={cn(
        'relative overflow-hidden rounded-2xl',
        'backdrop-blur-xl',
        'border border-border/30',
        'shadow-[0_4px_24px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.8)]',
        'p-4'
      )}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 50%, rgba(248,250,252,0.8) 100%)',
      }}
    >
      {/* Liquid glass highlight effect */}
      <div 
        className="absolute top-0 left-0 right-0 h-1/2 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 100%)',
          borderRadius: '16px 16px 0 0',
        }}
      />

      {/* Content */}
      <div className="relative flex items-center gap-3">
        {/* Icon with colored background */}
        <div 
          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ 
            backgroundColor: `${currentMessage.iconColor}15`,
          }}
        >
          <Icon 
            className="w-5 h-5" 
            style={{ color: currentMessage.iconColor }}
          />
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {currentMessage.message}
          </p>
          {currentMessage.subMessage && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {currentMessage.subMessage}
            </p>
          )}
        </div>

        {/* Carousel indicator dots */}
        {sortedMessages.length > 1 && (
          <div className="flex items-center gap-1">
            {sortedMessages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className="p-2 -m-1.5"
                aria-label={`Go to message ${idx + 1}`}
              >
                <div className={cn(
                  'w-2.5 h-2.5 rounded-full transition-all duration-300',
                  idx === currentIndex 
                    ? 'bg-foreground w-4' 
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                )} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MotivationalCarousel;