/**
 * Top100NetworkPage — /top100/network
 *
 * Phase C sub-page: full friends leaderboard for the Top 100 chase.
 * Pulls from useTop100FriendsSnapshot (returns `me` + `friends`).
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Users, Crown } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useTop100FriendsSnapshot } from '@/hooks/useTop100FriendsSnapshot';
import { PageRoot } from '@/components/layout/PageRoot';
import { Skeleton } from '@/components/ui/skeleton';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

type LeaderboardRow = {
  id: string;
  display_name: string;
  profile_photo_url: string | null;
  home_club: string | null;
  total: number;
  isMe: boolean;
};

const Top100NetworkPage: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useSupabaseSession();
  const userId = session?.user?.id ?? null;
  const { data: profile } = useUserProfile(userId);
  const { data: snapshot, isLoading } = useTop100FriendsSnapshot();

  // Build merged + ranked leaderboard
  const rows = useMemo<LeaderboardRow[]>(() => {
    if (!snapshot) return [];
    const all: LeaderboardRow[] = [];

    if (snapshot.me) {
      all.push({
        id: snapshot.me.friend_id,
        display_name: snapshot.me.display_name,
        profile_photo_url: snapshot.me.profile_photo_url,
        home_club: snapshot.me.home_club,
        total: snapshot.me.total_top100_played ?? 0,
        isMe: true,
      });
    }

    snapshot.friends.forEach((f) => {
      all.push({
        id: f.friend_id,
        display_name: f.display_name,
        profile_photo_url: f.profile_photo_url,
        home_club: f.home_club,
        total: f.total_top100_played ?? 0,
        isMe: false,
      });
    });

    // Sort by total desc, then by name asc for stable ties
    return all.sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return (a.display_name ?? '').localeCompare(b.display_name ?? '');
    });
  }, [snapshot]);

  const myCount = snapshot?.me?.total_top100_played ?? 0;
  const myRank = useMemo(() => {
    const idx = rows.findIndex((r) => r.isMe);
    return idx >= 0 ? idx + 1 : null;
  }, [rows]);
  const friendsCount = snapshot?.friends.length ?? 0;
  const leader = rows.find((r) => !r.isMe);
  const isLeading =
    rows.length > 0 && rows[0].isMe && (!leader || myCount >= leader.total);

  // ===== Signed-out state =====
  if (!userId) {
    return (
      <PageRoot>
        <NetworkHeader onBack={() => navigate(-1)} />
        <div className="px-4 py-20 flex flex-col items-center text-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(247,147,30,0.10)' }}
          >
            <Users size={26} color="#F7931E" />
          </div>
          <div>
            <p className="text-base font-semibold" style={{ color: '#0F172A' }}>
              See where your network stands
            </p>
            <p className="mt-1 text-sm" style={{ color: '#64748B' }}>
              Sign in to compare your Top 100 chase with friends.
            </p>
          </div>
          <button
            onClick={() => navigate('/auth')}
            className="h-11 px-6 text-sm font-semibold text-white rounded-full active:scale-[0.97] transition-all"
            style={{ background: '#F7931E' }}
          >
            Sign in
          </button>
        </div>
      </PageRoot>
    );
  }

  // ===== Loading skeleton =====
  if (isLoading || !snapshot) {
    return (
      <PageRoot>
        <NetworkHeader onBack={() => navigate(-1)} />
        <div className="px-4 pt-2 pb-10 space-y-4">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <div className="space-y-2 pt-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </PageRoot>
    );
  }

  // ===== Empty network state =====
  if (friendsCount === 0) {
    return (
      <PageRoot>
        <NetworkHeader onBack={() => navigate(-1)} />
        <div className="px-4 pt-2">
          <SectionTag label="Your Network" />
          <h1
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: '#0F172A',
              letterSpacing: '-0.03em',
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            The friends leaderboard
          </h1>
        </div>
        <div className="px-4 py-16 flex flex-col items-center text-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(247,147,30,0.10)' }}
          >
            <Users size={26} color="#F7931E" />
          </div>
          <div>
            <p className="text-base font-semibold" style={{ color: '#0F172A' }}>
              No friends yet
            </p>
            <p className="mt-1 text-sm" style={{ color: '#64748B', maxWidth: 280 }}>
              Follow other golfers to see how your Top 100 chase compares.
            </p>
          </div>
          <button
            onClick={() => navigate('/discover')}
            className="h-11 px-6 text-sm font-semibold text-white rounded-full active:scale-[0.97] transition-all"
            style={{ background: '#F7931E' }}
          >
            Find golfers
          </button>
        </div>
      </PageRoot>
    );
  }

  const displayName = profile?.display_name ?? session?.user?.user_metadata?.full_name ?? null;

  return (
    <PageRoot>
      <NetworkHeader onBack={() => navigate(-1)} />

      <div className="pb-10">
        {/* ============ Hero ============ */}
        <div className="px-4 pt-2">
          <SectionTag label="Your Network" />
          <h1
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: '#0F172A',
              letterSpacing: '-0.03em',
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            {isLeading ? "You're leading your friends" : 'The friends leaderboard'}
          </h1>

          {/* Stats card */}
          <div
            style={{
              marginTop: 16,
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
              padding: '14px 12px',
              background: '#ffffff',
              border: '1px solid rgba(15,23,42,0.10)',
              borderRadius: 14,
            }}
          >
            <HeroStat label="Your total" value={myCount} accent />
            <HeroStat
              label="Your rank"
              value={myRank ? `#${myRank}` : '—'}
              suffix={myRank ? ` of ${rows.length}` : undefined}
            />
            <HeroStat label="Friends" value={friendsCount} />
          </div>
        </div>

        {/* ============ Leaderboard ============ */}
        <div className="pt-7">
          <div className="px-4 pb-2">
            <SectionTag label="Standings" />
          </div>
          <div>
            {rows.map((row, i) => {
              const rank = i + 1;
              return <LeaderboardRowItem key={row.id} row={row} rank={rank} />;
            })}
          </div>
        </div>
      </div>
    </PageRoot>
  );
};

// ============ Local components ============

const NetworkHeader: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '10px 12px 8px',
      background: '#F8FAFC',
    }}
  >
    <button
      type="button"
      onClick={onBack}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 36,
        height: 36,
        borderRadius: 10,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
      }}
      className="active:scale-[0.94] transition-transform"
      aria-label="Back"
    >
      <ChevronLeft size={22} color="#0F172A" strokeWidth={2.2} />
    </button>
  </div>
);

const SectionTag: React.FC<{ label: string }> = ({ label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
    <div style={{ width: 3, height: 8, background: '#F7931E', borderRadius: 1 }} />
    <span
      style={{
        fontSize: 9,
        fontWeight: 900,
        color: '#F7931E',
        letterSpacing: '0.16em',
        textTransform: 'uppercase' as const,
      }}
    >
      {label}
    </span>
  </div>
);

const HeroStat: React.FC<{
  label: string;
  value: number | string;
  suffix?: string;
  accent?: boolean;
}> = ({ label, value, suffix, accent }) => (
  <div>
    <div
      style={{
        fontSize: 9,
        fontWeight: 800,
        color: '#64748B',
        letterSpacing: '0.06em',
        textTransform: 'uppercase' as const,
      }}
    >
      {label}
    </div>
    <div
      style={{
        marginTop: 4,
        display: 'flex',
        alignItems: 'baseline',
        gap: 3,
      }}
    >
      <span
        style={{
          fontSize: 22,
          fontWeight: 900,
          color: accent ? '#F7931E' : '#0F172A',
          letterSpacing: '-0.03em',
          fontVariantNumeric: 'tabular-nums' as const,
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      {suffix && (
        <span style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8' }}>{suffix}</span>
      )}
    </div>
  </div>
);

const LeaderboardRowItem: React.FC<{ row: LeaderboardRow; rank: number }> = ({
  row,
  rank,
}) => {
  const navigate = useNavigate();
  const initials =
    row.display_name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  const isTop3 = rank <= 3;
  const rankColor = rank === 1 ? '#F7931E' : rank === 2 ? '#94A3B8' : rank === 3 ? '#A47551' : '#94A3B8';

  return (
    <button
      type="button"
      onClick={() => !row.isMe && navigate(`/profile/${row.id}`)}
      disabled={row.isMe}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: row.isMe ? 'rgba(247,147,30,0.05)' : '#ffffff',
        borderTop: '0.5px solid rgba(15,23,42,0.08)',
        borderBottom: '0.5px solid rgba(15,23,42,0.08)',
        marginTop: -0.5,
        textAlign: 'left' as const,
        cursor: row.isMe ? 'default' : 'pointer',
        border: 'none',
      }}
      className={!row.isMe ? 'active:bg-slate-50 transition-colors' : ''}
    >
      {/* Rank */}
      <div
        style={{
          width: 28,
          textAlign: 'center' as const,
          fontSize: 14,
          fontWeight: 900,
          color: rankColor,
          letterSpacing: '-0.02em',
          fontVariantNumeric: 'tabular-nums' as const,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        {rank === 1 && <Crown size={11} color="#F7931E" strokeWidth={2.4} fill="#F7931E" fillOpacity={0.3} />}
        {rank}
      </div>

      {/* Avatar */}
      <SquircleAvatar
        size={40}
        src={row.profile_photo_url}
        alt={row.display_name ?? 'Friend'}
        fallback={initials}
        thinRing={isTop3}
        ringColor={isTop3 ? rankColor : undefined}
      />

      {/* Name + home club */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: '#0F172A',
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {row.display_name}
          {row.isMe && (
            <span
              style={{
                marginLeft: 6,
                fontSize: 9,
                fontWeight: 800,
                color: '#F7931E',
                letterSpacing: '0.06em',
                textTransform: 'uppercase' as const,
              }}
            >
              You
            </span>
          )}
        </div>
        {row.home_club && (
          <div
            style={{
              fontSize: 11,
              color: '#64748B',
              marginTop: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {row.home_club}
          </div>
        )}
      </div>

      {/* Total */}
      <div
        style={{
          textAlign: 'right' as const,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: 900,
            color: '#0F172A',
            letterSpacing: '-0.03em',
            fontVariantNumeric: 'tabular-nums' as const,
            lineHeight: 1,
          }}
        >
          {row.total}
        </div>
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: '#94A3B8',
            letterSpacing: '0.04em',
            textTransform: 'uppercase' as const,
            marginTop: 3,
          }}
        >
          of 100
        </div>
      </div>
    </button>
  );
};

export default Top100NetworkPage;
