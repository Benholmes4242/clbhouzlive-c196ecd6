import React, { useState } from 'react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface LeaderboardEntry {
  friendId: string;
  friendName: string;
  avatarUrl: string | null;
  roundCount: number;
  lastPlayedAt: string;
}

interface FriendsActivityCardProps {
  leaderboard: LeaderboardEntry[];
  timeframe: string;
}

const FriendsActivityCard: React.FC<FriendsActivityCardProps> = ({ leaderboard, timeframe }) => {
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();

  const trimmed = leaderboard.slice(0, 10);
  const visible = showAll ? trimmed : trimmed.slice(0, 3);

  if (trimmed.length === 0) return null;

  const getTimeLabel = () => {
    switch (timeframe) {
      case '7d': return 'This week';
      case '30d': return 'This month';
      case '90d': return 'Last 90 days';
      case '12m': return 'This year';
      default: return 'All time';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-foreground">Most Active Friends</h3>
        <span className="text-xs text-muted-foreground">{getTimeLabel()}</span>
      </div>

      {/* Friend rows */}
      <div>
        <AnimatePresence mode="sync">
          {visible.map((entry, index) => (
            <motion.div
              key={entry.friendId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, delay: index * 0.03 }}
              onClick={() => navigate(`/profile/${entry.friendId}`)}
              className="flex items-center gap-3 py-3 cursor-pointer active:scale-[0.98] transition-transform"
              style={{
                borderBottom: index < visible.length - 1 ? '1px solid hsl(var(--border) / 0.3)' : 'none',
              }}
            >
              {/* Avatar */}
              <SquircleAvatar
                size={40}
                src={entry.avatarUrl}
                alt={entry.friendName}
                fallback={entry.friendName.charAt(0)}
                hideRing
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{entry.friendName}</p>
                <p className="text-xs text-muted-foreground">
                  {entry.roundCount} round{entry.roundCount !== 1 ? 's' : ''}
                  <span className="mx-1">·</span>
                  Last played {formatDistanceToNow(new Date(entry.lastPlayedAt), { addSuffix: true })}
                </p>
              </div>

              {/* Rank number */}
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                  color: index === 0
                    ? 'hsl(var(--accent-amber))'
                    : 'hsl(var(--muted-foreground))',
                  width: 18,
                  textAlign: 'center',
                  flexShrink: 0,
                }}
              >
                {index + 1}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* See all */}
      {!showAll && trimmed.length > 3 && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-1 text-xs font-medium text-muted-foreground active:opacity-70 transition-opacity"
        >
          See all {trimmed.length} friends
        </button>
      )}
    </motion.div>
  );
};

export default FriendsActivityCard;
