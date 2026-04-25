import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Trophy, X } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Sheet, SheetContent } from '@/components/ui/sheet';

interface FriendLeaderboardEntry {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  playedOnList: number;
  totalTop100Played?: number;
}

interface Top100ListLeaderboardProps {
  friends: FriendLeaderboardEntry[];
  totalInList: number;
  listName: string;
  currentUserPlayed: number;
  currentUserId?: string;
  currentUserName?: string;
  currentUserUsername?: string;
  currentUserAvatarUrl?: string | null;
  regionAccentColor?: string;
}

const PREVIEW_COUNT = 5;

const ordinal = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};

const firstName = (name: string): string => name.trim().split(/\s+/)[0] || name;

interface RankedEntry extends FriendLeaderboardEntry {
  rank: number;
  isMe: boolean;
}

interface LeaderboardRowProps {
  entry: RankedEntry;
  totalInList: number;
  topCount: number;
  accentColor: string;
  onClick?: () => void;
}

const LeaderboardRow: React.FC<LeaderboardRowProps> = ({
  entry,
  totalInList,
  topCount,
  accentColor,
  onClick,
}) => {
  const pct = totalInList > 0 ? Math.min(100, (entry.playedOnList / Math.max(topCount, 1)) * 100) : 0;
  const barColor = entry.isMe ? accentColor : '#0F172A';
  const barBg = entry.isMe ? `${accentColor}1A` : 'rgba(15,23,42,0.06)';

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 py-2.5 active:opacity-70 transition-opacity text-left"
    >
      {/* Rank */}
      <div
        className="w-6 flex-shrink-0 tabular-nums text-right"
        style={{
          fontSize: 13,
          fontWeight: entry.isMe ? 800 : 600,
          color: entry.isMe ? accentColor : '#94A3B8',
        }}
      >
        {entry.rank}
      </div>

      {/* Avatar */}
      <div className="flex-shrink-0">
        <SquircleAvatar
          size={32}
          src={entry.avatarUrl}
          alt={entry.name}
          fallback={entry.name[0]?.toUpperCase() || '?'}
        />
      </div>

      {/* Name + bar */}
      <div className="flex-1 min-w-0">
        <div
          className="truncate"
          style={{
            fontSize: 13,
            fontWeight: entry.isMe ? 700 : 500,
            color: '#0F172A',
            lineHeight: 1.2,
          }}
        >
          {entry.isMe ? 'You' : entry.name}
        </div>
        <div
          className="mt-1 h-[3px] w-full rounded-full overflow-hidden"
          style={{ background: barBg }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              backgroundColor: barColor,
              transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </div>
      </div>

      {/* Count */}
      <div
        className="flex-shrink-0 tabular-nums text-right"
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: entry.isMe ? accentColor : '#0F172A',
          minWidth: 28,
        }}
      >
        {entry.playedOnList}
      </div>
    </button>
  );
};

/**
 * Social leaderboard — vertical ranked list, current user inlined.
 * Shows top 5 in preview; "View full leaderboard" opens a bottom sheet with all entries.
 */
export const Top100ListLeaderboard: React.FC<Top100ListLeaderboardProps> = ({
  friends,
  totalInList,
  listName,
  currentUserPlayed,
  currentUserId,
  currentUserName = 'You',
  currentUserUsername,
  currentUserAvatarUrl,
  regionAccentColor = '#F7931E',
}) => {
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);

  // Build ranked list including the current user
  const rankedAll: RankedEntry[] = useMemo(() => {
    const meEntry: FriendLeaderboardEntry | null = currentUserId
      ? {
          id: currentUserId,
          name: currentUserName,
          username: currentUserUsername || '',
          avatarUrl: currentUserAvatarUrl ?? null,
          playedOnList: currentUserPlayed,
        }
      : null;

    // De-duplicate: friends list might already contain the current user
    const dedupedFriends = currentUserId
      ? friends.filter((f) => f.id !== currentUserId)
      : friends;

    const all: FriendLeaderboardEntry[] = meEntry ? [meEntry, ...dedupedFriends] : dedupedFriends;

    // Sort by playedOnList desc, ties → "me" first, then name A→Z
    const sorted = [...all].sort((a, b) => {
      if (b.playedOnList !== a.playedOnList) return b.playedOnList - a.playedOnList;
      const aMe = a.id === currentUserId ? 0 : 1;
      const bMe = b.id === currentUserId ? 0 : 1;
      if (aMe !== bMe) return aMe - bMe;
      return a.name.localeCompare(b.name);
    });

    return sorted.map((entry, idx) => ({
      ...entry,
      rank: idx + 1,
      isMe: entry.id === currentUserId,
    }));
  }, [friends, currentUserId, currentUserName, currentUserUsername, currentUserAvatarUrl, currentUserPlayed]);

  // Top count for bar normalization
  const topCount = rankedAll[0]?.playedOnList ?? 1;

  // Find me's rank and the entry directly ahead
  const myEntry = rankedAll.find((e) => e.isMe);
  const myRank = myEntry?.rank ?? 0;
  const personAhead = myEntry ? rankedAll.find((e) => e.rank === myEntry.rank - 1) : null;

  // Headline copy
  let headline = '';
  if (myEntry) {
    if (myRank === 1) {
      headline = "You're leading the chase";
    } else if (personAhead) {
      const aheadByCount = personAhead.playedOnList - myEntry.playedOnList;
      const ahead = firstName(personAhead.name);
      if (aheadByCount === 0) {
        headline = `You're tied for ${ordinal(myRank)} with ${ahead}`;
      } else {
        const courseWord = aheadByCount === 1 ? 'course' : 'courses';
        headline = `${aheadByCount} ${courseWord} behind ${ahead}`;
      }
    }
  }

  const previewEntries = rankedAll.slice(0, PREVIEW_COUNT);
  const hasMore = rankedAll.length > PREVIEW_COUNT;

  const handleRowClick = (entry: RankedEntry) => {
    if (entry.isMe) return;
    if (entry.username) navigate(`/profile/${entry.username}`);
  };

  // Empty state — no friends and no current user data
  if (friends.length === 0 && !currentUserId) {
    return (
      <section className="px-4">
        <div className="flex items-center gap-1.5 mb-4">
          <div style={{ width: 3, height: 8, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
          <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
            Your {listName.replace('Great Britain & Ireland', 'GB&I')} Leaderboard
          </span>
        </div>
        <motion.div
          className="text-center py-6 px-4 rounded-2xl"
          style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)' }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(15,23,42,0.05)' }}>
            <Users className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">No friends here yet</p>
          <p className="mt-2 text-sm text-muted-foreground max-w-[260px] mx-auto">
            Follow golfers to compare progress on this Top 100.
          </p>
          <button
            onClick={() => navigate('/golferstofollow')}
            className="w-full max-w-[260px] h-11 rounded-2xl mt-4 text-sm font-semibold active:scale-[0.97] transition-transform"
            style={{ background: '#0F172A', color: '#ffffff' }}
          >
            Find golfers to follow
          </button>
        </motion.div>
      </section>
    );
  }

  // Empty-progress state — current user has data but everyone is at zero
  if (rankedAll.every((e) => e.playedOnList === 0)) {
    return (
      <section className="px-4">
        <div className="flex items-center gap-1.5 mb-4">
          <div style={{ width: 3, height: 8, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
          <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
            Your {listName.replace('Great Britain & Ireland', 'GB&I')} Leaderboard
          </span>
        </div>
        <motion.div
          className="text-center py-6 px-4 rounded-2xl"
          style={{ background: '#ffffff', border: '1px solid rgba(15,23,42,0.07)' }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(15,23,42,0.05)' }}>
            <Trophy className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">Be the first</p>
          <p className="mt-2 text-sm text-muted-foreground max-w-[260px] mx-auto">
            Start rating courses to set the pace for your friends.
          </p>
          <button
            onClick={() => navigate('/courses')}
            className="w-full max-w-[260px] h-11 rounded-2xl mt-4 text-sm font-semibold active:scale-[0.97] transition-transform"
            style={{ background: '#0F172A', color: '#ffffff' }}
          >
            Explore courses
          </button>
        </motion.div>
      </section>
    );
  }

  return (
    <section>
      {/* Header — dispatch eyebrow */}
      <div className="px-4 mb-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <div style={{ width: 3, height: 8, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
          <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
            Your {listName.replace('Great Britain & Ireland', 'GB&I')} Leaderboard
          </span>
        </div>
        {headline && (
          <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A', lineHeight: 1.3 }}>
            {headline}
          </p>
        )}
      </div>

      {/* Preview card */}
      <div className="px-4">
        <div
          className="rounded-2xl bg-white px-3 py-1"
          style={{ border: '1px solid rgba(15,23,42,0.07)' }}
        >
          {previewEntries.map((entry, idx) => (
            <div
              key={entry.id}
              style={{
                borderBottom: idx < previewEntries.length - 1 ? '0.5px solid rgba(15,23,42,0.07)' : 'none',
              }}
            >
              <LeaderboardRow
                entry={entry}
                totalInList={totalInList}
                topCount={topCount}
                accentColor={regionAccentColor}
                onClick={() => handleRowClick(entry)}
              />
            </div>
          ))}
        </div>

        {hasMore && (
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="w-full mt-2 h-10 rounded-xl text-[13px] font-semibold active:scale-[0.98] transition-all"
            style={{
              background: 'transparent',
              color: '#0F172A',
              border: '1px solid rgba(15,23,42,0.10)',
            }}
          >
            View full leaderboard ({rankedAll.length})
          </button>
        )}
      </div>

      {/* Bottom Sheet — full leaderboard */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl p-0 max-h-[85vh] flex flex-col"
          style={{ background: '#F8FAFC' }}
        >
          {/* Pull handle */}
          <div className="pt-2 pb-1 flex justify-center">
            <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(15,23,42,0.15)' }} />
          </div>

          {/* Header */}
          <div className="px-4 pt-2 pb-3 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <div style={{ width: 3, height: 8, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
                <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
                  Full Leaderboard
                </span>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em' }}>
                {listName.replace('Great Britain & Ireland', 'GB&I')}
              </h2>
              <p className="mt-0.5" style={{ fontSize: 12, color: '#64748B' }}>
                {rankedAll.length} {rankedAll.length === 1 ? 'golfer' : 'golfers'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              aria-label="Close"
              className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform"
              style={{ background: 'rgba(15,23,42,0.06)' }}
            >
              <X className="w-4 h-4" style={{ color: '#0F172A' }} />
            </button>
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto px-4 pb-8">
            <div
              className="rounded-2xl bg-white px-3 py-1"
              style={{ border: '1px solid rgba(15,23,42,0.07)' }}
            >
              {rankedAll.map((entry, idx) => (
                <div
                  key={entry.id}
                  style={{
                    borderBottom: idx < rankedAll.length - 1 ? '0.5px solid rgba(15,23,42,0.07)' : 'none',
                  }}
                >
                  <LeaderboardRow
                    entry={entry}
                    totalInList={totalInList}
                    topCount={topCount}
                    accentColor={regionAccentColor}
                    onClick={() => {
                      handleRowClick(entry);
                      if (!entry.isMe && entry.username) setSheetOpen(false);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
};
