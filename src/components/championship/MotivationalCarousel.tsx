import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  Target,
  Users,
  Flame,
  Award,
  Sparkles,
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
  seasonColor?: string;
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
  seasonColor,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const amberColor = 'hsl(var(--accent-amber))';
  const accentColor = seasonColor || amberColor;
  const messages: MotivationalMessage[] = [];

  if (isInTop3 && currentRank) {
    messages.push({
      id: 'top3',
      icon: Award,
      iconColor: amberColor,
      message:
        currentRank === 1
          ? "You're leading the pack!"
          : `You're #${currentRank}! Just ${currentRank - 1} spot${currentRank > 2 ? 's' : ''} from the top`,
      subMessage: 'Keep up the incredible pace',
      priority: 100,
    });
  } else if (isInTop10 && currentRank) {
    messages.push({
      id: 'top10',
      icon: TrendingUp,
      iconColor: amberColor,
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
      iconColor: amberColor,
      message: `${friendAhead.name} is ${friendAhead.coursesAhead} course${friendAhead.coursesAhead > 1 ? 's' : ''} ahead`,
      subMessage: 'Complete more courses to catch up!',
      priority: 80,
    });
  }

  if (friendBehind) {
    messages.push({
      id: 'friend-behind',
      icon: Users,
      iconColor: amberColor,
      message: `You're ${friendBehind.coursesBehind} course${friendBehind.coursesBehind > 1 ? 's' : ''} ahead of ${friendBehind.name}`,
      subMessage: 'Stay ahead — keep logging courses!',
      priority: 70,
    });
  }

  if (rivalAhead) {
    messages.push({
      id: 'rival',
      icon: Target,
      iconColor: amberColor,
      message: `Your rival ${rivalAhead.name} is #${rivalAhead.rank}`,
      subMessage: `${rivalAhead.coursesAhead} course${rivalAhead.coursesAhead > 1 ? 's' : ''} to overtake them`,
      priority: 85,
    });
  }

  if (streak && streak >= 3) {
    messages.push({
      id: 'streak',
      icon: Flame,
      iconColor: amberColor,
      message: `${streak}-day streak!`,
      subMessage: 'Keep it going — play tomorrow!',
      priority: 60,
    });
  }

  if (coursesToNextRank && coursesToNextRank <= 2 && !isInTop10) {
    messages.push({
      id: 'close-to-rank',
      icon: Sparkles,
      iconColor: amberColor,
      message: `Just ${coursesToNextRank} course${coursesToNextRank > 1 ? 's' : ''} to move up!`,
      subMessage: "You're so close to the next rank",
      priority: 75,
    });
  }

  if (messages.length === 0) {
    messages.push({
      id: 'generic',
      icon: TrendingUp,
      iconColor: amberColor,
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

  // Highlight rank numbers — #1 gets amber, all others get muted-foreground
  const renderMessage = (msg: string) => {
    return msg.replace(/#(\d+)/g, '<rank>#$1</rank>').split(/(<rank>.*?<\/rank>)/).map((part, i) => {
      const match = part.match(/^<rank>#(\d+)<\/rank>$/);
      if (match) {
        const rankNum = parseInt(match[1], 10);
        const color = rankNum === 1 ? 'hsl(var(--accent-amber))' : 'hsl(var(--muted-foreground))';
        return (
          <span key={i} className="font-extrabold" style={{ color, fontSize: '20px' }}>
            #{match[1]}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div
      className="relative overflow-hidden px-5 py-4"
      style={{
        background: 'hsl(var(--accent-amber) / 0.05)',
        borderRadius: '16px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Top accent bar — replaces left border */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{
          background: `linear-gradient(90deg, ${accentColor}, ${accentColor}40)`,
        }}
      />

      {/* Content */}
      <div className="relative flex items-center gap-3">
        {/* Premium icon box — rounded square */}
        <div
          className="flex-shrink-0 flex items-center justify-center"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: `${currentMessage.iconColor}15`,
          }}
        >
          <Icon className="w-[18px] h-[18px]" style={{ color: currentMessage.iconColor }} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-foreground line-clamp-2">
            {renderMessage(currentMessage.message)}
          </p>
          {currentMessage.subMessage && (
            <p className="text-[14px] text-muted-foreground truncate mt-0.5">
              {currentMessage.subMessage}
            </p>
          )}
        </div>
      </div>

      {/* Dot indicators */}
      {sortedMessages.length > 1 && (
        <div className="flex items-center justify-center gap-1 mt-2">
          {sortedMessages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className="p-1"
              aria-label={`Go to message ${idx + 1}`}
            >
              <div
                className="rounded-full transition-all duration-300"
                style={{
                  ...(idx === currentIndex
                    ? {
                        width: 6,
                        height: 6,
                        backgroundColor: accentColor,
                      }
                    : {
                        width: 4,
                        height: 4,
                        backgroundColor: '#E2E8F0',
                      }),
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MotivationalCarousel;
