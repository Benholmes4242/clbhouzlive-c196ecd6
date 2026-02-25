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

  const messages: MotivationalMessage[] = [];

  if (isInTop3 && currentRank) {
    messages.push({
      id: 'top3',
      icon: Award,
      iconColor: '#D4A853',
      message:
        currentRank === 1
          ? "You're leading the pack! 👑"
          : `You're #${currentRank}! Just ${currentRank - 1} spot${currentRank > 2 ? 's' : ''} from the top`,
      subMessage: 'Keep up the incredible pace',
      priority: 100,
    });
  } else if (isInTop10 && currentRank) {
    messages.push({
      id: 'top10',
      icon: TrendingUp,
      iconColor: '#D4A853',
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
      iconColor: '#D4A853',
      message: `${friendAhead.name} is ${friendAhead.coursesAhead} course${friendAhead.coursesAhead > 1 ? 's' : ''} ahead`,
      subMessage: 'Complete more courses to catch up!',
      priority: 80,
    });
  }

  if (friendBehind) {
    messages.push({
      id: 'friend-behind',
      icon: Users,
      iconColor: '#D4A853',
      message: `You're ${friendBehind.coursesBehind} course${friendBehind.coursesBehind > 1 ? 's' : ''} ahead of ${friendBehind.name}`,
      subMessage: 'Stay ahead — keep logging courses!',
      priority: 70,
    });
  }

  if (rivalAhead) {
    messages.push({
      id: 'rival',
      icon: Target,
      iconColor: '#D4A853',
      message: `Your rival ${rivalAhead.name} is #${rivalAhead.rank}`,
      subMessage: `${rivalAhead.coursesAhead} course${rivalAhead.coursesAhead > 1 ? 's' : ''} to overtake them`,
      priority: 85,
    });
  }

  if (streak && streak >= 3) {
    messages.push({
      id: 'streak',
      icon: Flame,
      iconColor: '#D4A853',
      message: `${streak}-day streak! 🔥`,
      subMessage: 'Keep it going — play tomorrow!',
      priority: 60,
    });
  }

  if (coursesToNextRank && coursesToNextRank <= 2 && !isInTop10) {
    messages.push({
      id: 'close-to-rank',
      icon: Sparkles,
      iconColor: '#D4A853',
      message: `Just ${coursesToNextRank} course${coursesToNextRank > 1 ? 's' : ''} to move up!`,
      subMessage: "You're so close to the next rank",
      priority: 75,
    });
  }

  if (messages.length === 0) {
    messages.push({
      id: 'generic',
      icon: TrendingUp,
      iconColor: '#D4A853',
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

  // Highlight rank numbers in the message with gold
  const renderMessage = (msg: string) => {
    return msg.replace(/#(\d+)/g, '<gold>#$1</gold>').split(/(<gold>.*?<\/gold>)/).map((part, i) => {
      const match = part.match(/^<gold>(.*)<\/gold>$/);
      if (match) {
        return (
          <span key={i} className="font-bold" style={{ color: '#D4A853' }}>
            {match[1]}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div
      className="relative overflow-hidden px-4 py-3"
      style={{
        background: 'linear-gradient(135deg, rgba(212, 168, 83, 0.08), rgba(212, 168, 83, 0.04))',
        border: '1px solid rgba(212, 168, 83, 0.15)',
        borderRadius: '14px',
      }}
    >
      {/* Content */}
      <div className="relative flex items-center gap-3">
        {/* Trophy icon */}
        <div
          className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: 'rgba(212, 168, 83, 0.12)',
            boxShadow: '0 0 8px rgba(212, 168, 83, 0.15)',
          }}
        >
          <Icon className="w-[18px] h-[18px]" style={{ color: '#D4A853' }} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">
            {renderMessage(currentMessage.message)}
          </p>
          {currentMessage.subMessage && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {currentMessage.subMessage}
            </p>
          )}
        </div>
      </div>

      {/* Dot indicators */}
      {sortedMessages.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-2">
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
                        width: '16px',
                        height: '4px',
                        backgroundColor: '#D4A853',
                      }
                    : {
                        width: '4px',
                        height: '4px',
                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
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
