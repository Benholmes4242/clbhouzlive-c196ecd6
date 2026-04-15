import React, { useState } from 'react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

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

  const maxRounds = trimmed[0]?.roundCount || 1;

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
    <div style={{ background: '#ffffff', borderTop: '1px solid rgba(15,23,42,0.07)', borderBottom: '1px solid rgba(15,23,42,0.07)', marginTop: '8px' }}>
      {/* Section rule marker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 20px 0', marginBottom: '10px' }}>
        <div style={{ width: 3, height: 14, background: '#0F172A', borderRadius: 1, flexShrink: 0 }} />
        <span style={{ fontSize: '11px', fontWeight: 900, color: '#0F172A', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
          Most Active Friends
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: '11px', color: '#CBD5E1', fontWeight: 600 }}>{getTimeLabel()}</span>
      </div>

      {/* Column headers */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '5px 20px', background: 'rgba(15,23,42,0.02)', borderTop: '0.5px solid rgba(15,23,42,0.07)', borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}>
        <span style={{ width: '36px', fontSize: '10px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em' }}>RK</span>
        <span style={{ flex: 1, fontSize: '10px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em' }}>FRIEND</span>
        <span style={{ width: '80px', textAlign: 'right' as const, fontSize: '10px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em' }}>ROUNDS</span>
      </div>

      {/* Friend rows */}
      {visible.map((entry, index) => (
        <div
          key={entry.friendId}
          onClick={() => navigate(`/profile/${entry.friendId}`)}
          style={{
            display: 'flex', alignItems: 'center', padding: '10px 20px',
            borderBottom: index < visible.length - 1 ? '0.5px solid rgba(15,23,42,0.07)' : 'none',
            borderLeft: index === 0 ? '3px solid #F7931E' : '3px solid transparent',
            background: index === 0 ? 'rgba(247,147,30,0.025)' : 'transparent',
            cursor: 'pointer',
          }}
          className="active:opacity-80 transition-opacity"
        >
          {/* Faded rank */}
          <div style={{ width: '36px', fontSize: '16px', fontWeight: 900, color: index === 0 ? 'rgba(247,147,30,0.25)' : 'rgba(15,23,42,0.1)', flexShrink: 0 }}>
            {index + 1}
          </div>
          {/* Avatar + name */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <SquircleAvatar size={34} src={entry.avatarUrl} alt={entry.friendName} fallback={entry.friendName.charAt(0)} hideRing />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: index === 0 ? 800 : 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                {entry.friendName}
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '1px' }}>
                Last played {formatDistanceToNow(new Date(entry.lastPlayedAt), { addSuffix: true })}
              </div>
            </div>
          </div>
          {/* Rounds + proportion bar */}
          <div style={{ width: '80px', display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
            <span style={{ fontSize: '15px', fontWeight: 800, color: index === 0 ? '#F7931E' : '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
              {entry.roundCount}
            </span>
            <div style={{ width: '64px', height: '3px', borderRadius: '2px', background: 'rgba(15,23,42,0.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(entry.roundCount / maxRounds) * 100}%`, background: index === 0 ? '#F7931E' : 'rgba(15,23,42,0.2)' }} />
            </div>
          </div>
        </div>
      ))}

      {/* See all / Show less */}
      {!showAll && trimmed.length > 3 && (
        <button onClick={() => setShowAll(true)} style={{ width: '100%', padding: '10px 20px', fontSize: '11px', fontWeight: 700, color: '#0F172A', background: 'transparent', border: 'none', borderTop: '0.5px solid rgba(15,23,42,0.07)', cursor: 'pointer', textAlign: 'left' as const }}>
          See all {trimmed.length} friends ▾
        </button>
      )}
      {showAll && (
        <button onClick={() => setShowAll(false)} style={{ width: '100%', padding: '10px 20px', fontSize: '11px', fontWeight: 700, color: '#0F172A', background: 'transparent', border: 'none', borderTop: '0.5px solid rgba(15,23,42,0.07)', cursor: 'pointer', textAlign: 'left' as const }}>
          Show less ▴
        </button>
      )}
    </div>
  );
};

export default FriendsActivityCard;
