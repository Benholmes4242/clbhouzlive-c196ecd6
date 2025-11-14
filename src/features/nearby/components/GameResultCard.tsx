/**
 * Game Result Card
 * Apple-level polished card for game search results
 */

import { TapButton } from '@/components/ui/TapButton';
import { haptic } from '@/utils/haptics';

type GameType = 'NINE_HOLES' | 'EIGHTEEN_HOLES' | 'CASUAL_GOLF' | 'PRACTICE';
type GameVisibility = 'PUBLIC' | 'FRIENDS_ONLY' | 'CLUB_MEMBERS';

export type GameCardData = {
  id: string;
  courseName: string;
  courseId?: string;
  gameType: GameType;
  teeTime: string;
  visibility: GameVisibility;
  hostId: string;
  taggedPlayerIds: string[];
  filledSlots: number;
  totalSlots: number;
  note?: string;
};

export type HostStats = {
  userId: string;
  gamesHosted: number;
  gamesCompleted: number;
  gamesCancelledByHost: number;
  avgPlayerRating: number | null;
};

export type PlayerAvatar = {
  userId: string;
  name: string;
  avatarUrl: string;
};

type GameResultCardProps = {
  game: GameCardData;
  hostStats?: HostStats;
  handicapsByUserId: Record<string, number | null>;
  visibilityLabel: string;
  onRequestToJoin: (gameId: string) => void;
  playerAvatars?: PlayerAvatar[];
  isPending?: boolean;
};

function formatTeeTime(isoTime: string): string {
  const date = new Date(isoTime);
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  
  return `${dayOfWeek} ${day} ${month} • ${time}`;
}

export function GameResultCard(props: GameResultCardProps) {
  const { game, hostStats, handicapsByUserId, visibilityLabel, onRequestToJoin, playerAvatars, isPending } = props;

  // Primary game type label
  const primaryGameTypeLabel = (() => {
    switch (game.gameType) {
      case 'NINE_HOLES': return '9 holes';
      case 'EIGHTEEN_HOLES': return '18 holes';
      case 'CASUAL_GOLF': return 'Casual golf';
      case 'PRACTICE': return 'Practice';
    }
  })();

  // Formatted date/time
  const formattedDateTime = formatTeeTime(game.teeTime);

  // Group handicaps
  const groupHandicaps = (() => {
    const values = game.taggedPlayerIds
      .map(id => handicapsByUserId[id])
      .filter((h): h is number => typeof h === 'number')
      .sort((a, b) => a - b);

    if (!values.length) return null;

    if (values.length <= 3) return values.join(', ');

    return `${values.slice(0, 3).join(', ')} +${values.length - 3} more`;
  })();

  // Should show avatars for friends/club games
  const shouldShowAvatars =
    game.visibility === 'FRIENDS_ONLY' || game.visibility === 'CLUB_MEMBERS';

  // Trusted host calculation
  const isTrustedHost = (() => {
    if (!hostStats) return false;
    if (hostStats.gamesHosted < 5) return false;

    const completionRate =
      hostStats.gamesHosted === 0
        ? 0
        : hostStats.gamesCompleted / hostStats.gamesHosted;

    const ratingFactor = hostStats.avgPlayerRating
      ? hostStats.avgPlayerRating / 5
      : 0.9;

    return completionRate >= 0.8 && ratingFactor >= 0.8;
  })();

  const handleRequestToJoin = () => {
    haptic('medium');
    onRequestToJoin(game.id);
  };

  return (
    <section className="rounded-2xl border border-white/6 bg-black/40 backdrop-blur-xl px-4 py-3 mb-3 shadow-[0_18px_40px_rgba(0,0,0,0.65)]">
      {/* Top row: course + game type */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <h3 className="truncate text-[16px] font-semibold text-white">
            {game.courseName}
          </h3>
          <p className="mt-1 text-[13px] text-white/65">
            {primaryGameTypeLabel}
          </p>
        </div>

        <div className="shrink-0 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[12px] font-medium text-emerald-400">
          {game.filledSlots}/{game.totalSlots} filled
        </div>
      </div>

      {/* Middle: time + handicaps */}
      <div className="mt-3 flex flex-col gap-1 text-[13px] text-white/70">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/5 text-[11px]">
            🗓
          </span>
          <span>{formattedDateTime}</span>
        </div>

        {groupHandicaps && (
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/5 text-[11px]">
              🎯
            </span>
            <span>Group handicaps: {groupHandicaps}</span>
          </div>
        )}
      </div>

      {/* Avatars + Trusted Host + Note */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          {/* Avatars (friends/club only) */}
          {shouldShowAvatars && playerAvatars && playerAvatars.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {playerAvatars.slice(0, 3).map(player => (
                  <img
                    key={player.userId}
                    src={player.avatarUrl}
                    alt={player.name}
                    className="h-7 w-7 rounded-full border border-black/80 object-cover"
                  />
                ))}
              </div>
              <span className="text-[11px] text-white/50">
                {visibilityLabel}
              </span>
            </div>
          )}

          {/* Host note */}
          {game.note && (
            <p className="line-clamp-2 max-w-[220px] text-[12px] text-white/60">
              {game.note}
            </p>
          )}
        </div>

        {/* Trusted Host badge */}
        {isTrustedHost && (
          <div className="ml-auto flex shrink-0 items-center gap-1 rounded-full border border-emerald-400/35 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
            <span className="text-[12px]">⭐</span>
            <span>Trusted host</span>
          </div>
        )}
      </div>

      {/* CTA row */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-[11px] text-white/40">
          Tap to request – host will review.
        </p>
        <TapButton
          onClick={handleRequestToJoin}
          disabled={isPending || game.filledSlots >= game.totalSlots}
          className="rounded-full border border-white/18 bg-white/5 px-4 py-1.5 text-[13px] font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04)] transition-transform duration-120 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {game.filledSlots >= game.totalSlots 
            ? 'Full' 
            : isPending 
            ? 'Requesting…' 
            : 'Request to join'}
        </TapButton>
      </div>
    </section>
  );
}
