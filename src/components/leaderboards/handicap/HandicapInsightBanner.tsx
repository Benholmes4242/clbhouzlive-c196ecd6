import { ChevronRight } from 'lucide-react';
import { formatHcp } from '@/lib/formatHcp';
import { Link } from 'react-router-dom';

interface HandicapInsightBannerProps {
  userRank?: number | null;
  topHandicap?: number | null;
  userHandicap?: number | null;
  userId?: string | null;
  scope: string;
  scopeLabel: string;
  mode: 'lowest' | 'improved' | 'season';
}

function getIcon(rank: number): string {
  if (rank === 1) return '🏆';
  if (rank === 2) return '🥈';
  if (rank <= 10) return '📉';
  return '⛳';
}

export function HandicapInsightBanner({
  userRank,
  topHandicap,
  userHandicap,
  userId,
  scope,
  scopeLabel,
  mode,
}: HandicapInsightBannerProps) {
  if (userRank === null || userRank === undefined) return null;

  const icon = getIcon(userRank);

  // Calculate gap to #1 for rank 2
  const gap =
    userRank === 2 && topHandicap !== null && topHandicap !== undefined && userHandicap !== null && userHandicap !== undefined
      ? userHandicap - topHandicap
      : null;

  let messageNode: React.ReactNode;

  if (userRank === 1) {
    messageNode = (
      <>
        You're <span className="font-bold" style={{ color: '#F7931E' }}>#{userRank}</span> {scopeLabel} — the best handicap!
      </>
    );
  } else if (userRank === 2 && gap !== null) {
    messageNode = (
      <>
        Drop <span className="font-bold" style={{ color: '#F7931E' }}>{formatHcp(gap)}</span> shots to take the top spot {scopeLabel}
      </>
    );
  } else if (userRank <= 10) {
    messageNode = (
      <>
        You're <span className="font-bold" style={{ color: '#F7931E' }}>#{userRank}</span> {scopeLabel} — in the top 10
      </>
    );
  } else {
    messageNode = (
      <>
        You're <span className="font-bold" style={{ color: '#F7931E' }}>#{userRank}</span> {scopeLabel} — keep improving
      </>
    );
  }

  const content = (
    <div
      className="flex items-center gap-3"
      style={{
        background: '#FFFBF0',
        border: '1px solid rgba(245, 166, 35, 0.2)',
        borderRadius: 14,
        padding: '12px 14px',
      }}
    >
      <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
      <p className="flex-1 text-[13px] font-semibold" style={{ color: '#0F172A' }}>
        {messageNode}
      </p>
      <ChevronRight size={16} style={{ color: '#94A3B8', flexShrink: 0 }} />
    </div>
  );

  if (userId) {
    return (
      <Link to={`/profile/${userId}`} className="block active:scale-[0.98] transition-transform">
        {content}
      </Link>
    );
  }

  return content;
}
