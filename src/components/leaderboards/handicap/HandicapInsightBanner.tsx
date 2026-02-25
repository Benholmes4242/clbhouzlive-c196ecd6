import { Trophy, TrendingDown, Target, ChevronRight } from 'lucide-react';

interface HandicapInsightBannerProps {
  userRank?: number | null;
  improvement30d?: number | null;
  mode: 'lowest' | 'improved' | 'season';
}

function getRankMessage(rank: number): { message: string; highlightRank: boolean } {
  if (rank === 1) return { message: `You're #1 — top of the leaderboard! 👑`, highlightRank: true };
  if (rank <= 3) return { message: `You're #${rank} — leading the pack!`, highlightRank: true };
  if (rank <= 10) return { message: `You're #${rank} — in the top 10!`, highlightRank: true };
  if (rank <= 50) return { message: `You're #${rank} — climbing the ranks!`, highlightRank: false };
  return { message: `You're #${rank} — keep grinding!`, highlightRank: false };
}

export function HandicapInsightBanner({ 
  userRank, 
  improvement30d,
  mode 
}: HandicapInsightBannerProps) {
  let message: string | null = null;
  let Icon = Target;
  let isTopRank = false;
  let highlightNumber = '';

  if (userRank !== null && userRank !== undefined) {
    const result = getRankMessage(userRank);
    message = result.message;
    Icon = Trophy;
    isTopRank = result.highlightRank;
    highlightNumber = `#${userRank}`;
  }

  // Show improvement insight if in improved/season mode
  if (!message && improvement30d !== null && improvement30d !== undefined && improvement30d > 0) {
    if (mode === 'improved') {
      message = `Great progress: -${improvement30d.toFixed(1)} in 30 days`;
      Icon = TrendingDown;
    } else if (mode === 'season') {
      message = `Season improvement: -${improvement30d.toFixed(1)}`;
      Icon = TrendingDown;
    }
  }

  if (!message) return null;

  return (
    <div
      className="mx-5 flex items-center gap-3 rounded-[14px]"
      style={{
        background: 'linear-gradient(to right, rgba(212, 168, 83, 0.08), rgba(212, 168, 83, 0.04))',
        border: '1px solid rgba(212, 168, 83, 0.15)',
        padding: '12px 16px',
      }}
    >
      <div
        className="flex-shrink-0 flex items-center justify-center"
        style={{ filter: 'drop-shadow(0 0 8px rgba(212, 168, 83, 0.2))' }}
      >
        <Icon size={28} style={{ color: '#D4A853' }} />
      </div>
      <p className="text-sm font-semibold text-foreground flex-1">
        {isTopRank && highlightNumber ? (
          <>
            You're <span className="font-bold" style={{ color: '#D4A853' }}>{highlightNumber}</span>
            {message.substring(message.indexOf('—'))}
          </>
        ) : (
          message
        )}
      </p>
      <ChevronRight size={16} className="text-muted-foreground/50 flex-shrink-0" />
    </div>
  );
}
