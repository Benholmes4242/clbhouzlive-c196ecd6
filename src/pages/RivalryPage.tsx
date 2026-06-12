/**
 * RivalryPage — Dossier redesign orchestrator.
 *
 * Routes:
 *   /handicap/rivalry/:rivalUserId                      → owner-view ("you vs X")
 *   /handicap/:friendUserId/rivalry/:rivalUserId        → friend-view ("Friend vs Rival")
 *
 * The :rivalUserId param accepts either a real user UUID (Clbhouz friend)
 * or a whs_friend_matches.friend_row_id (non-Clbhouz friend, owner-view only).
 */
import React, { useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabase } from '@/integrations/supabase/client';
import { useFriendRivalries, useWhsConnection } from '@/lib/whs/hooks';
import { fetchPrimaryRivalryWithOwner, fetchAdHocRivalry } from '@/lib/whs/friendViewRivalries';
import type { FriendRivalryHydrated } from '@/lib/whs/types';
import { PageRoot } from '@/components/layout/PageRoot';
import { useRivalryDimension } from '@/lib/whs/utils/useRivalryDimension';
import { useOpenFriendSheet } from '@/components/friend-sheet/FriendSheetProvider';

import { pickAvatarSrc } from '@/lib/whs/utils/avatarSrc';
import { HeroScoreboard } from './rivalry-page/HeroScoreboard';
import { DimensionToggle } from './rivalry-page/DimensionToggle';
import { ActionRail } from './rivalry-page/ActionRail';
import { InsightsGrid } from './rivalry-page/InsightsGrid';
import { CoursesPlayedSection } from './rivalry-page/CoursesPlayedSection';
import { RoundByRoundSection } from './rivalry-page/RoundByRoundSection';
import { HeadToHeadSection } from './rivalry-page/HeadToHeadSection';
import { computeInsights } from './rivalry-page/_shared/insights';
import { firstName } from './rivalry-page/_shared/helpers';
import {
  FONT,
  BG_0,
  BG_1,
  T100,
  T60,
  AMBER,
  LINE_2,
} from './rivalry-page/_shared/tokens';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── Data hooks (preserved from monolith for friend-view) ────────────────
function useOwnerRivalry(
  viewerId: string | undefined,
  rivalParamId: string | undefined,
) {
  const { data, isLoading, error } = useFriendRivalries(viewerId);
  const row = useMemo(() => {
    if (!data || !rivalParamId) return null;
    return (
      data.find(
        (r) =>
          r.rival_user_id === rivalParamId ||
          r.rival_friend_row_id === rivalParamId,
      ) ?? null
    );
  }, [data, rivalParamId]);
  return { row, isLoading, error };
}

function useAdHocRivalry(
  viewerId: string | undefined,
  rivalParamId: string | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['rivalry', 'ad-hoc', viewerId, rivalParamId],
    enabled: enabled && !!viewerId && !!rivalParamId,
    staleTime: 30_000,
    queryFn: () => fetchPrimaryRivalryWithOwner(viewerId!, rivalParamId!),
  });
}

function useRivalProfileExists(userId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['rival-profile-exists', userId],
    enabled: enabled && !!userId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('id, display_name')
        .eq('id', userId!)
        .maybeSingle();
      if (!data) return null;
      return { exists: true, displayName: (data as any).display_name as string | null };
    },
  });
}



function useFriendViewRivalry(
  viewerId: string | undefined,
  friendId: string | undefined,
  rivalId: string | undefined,
) {
  return useQuery({
    queryKey: ['rivalry', 'friend-view', viewerId, friendId, rivalId],
    enabled: !!viewerId && !!friendId && !!rivalId,
    staleTime: 30_000,
    queryFn: async (): Promise<FriendRivalryHydrated | null> => {
      const { data: rpcRows, error } = await (supabase as any).rpc(
        'get_friend_view_rivalry',
        {
          p_viewer_id: viewerId,
          p_friend_id: friendId,
          p_rival_id: rivalId,
        },
      );
      if (error) {
        // eslint-disable-next-line no-console
        console.warn('[rivalry] friend-view RPC error', error);
        return null;
      }
      const raw = (rpcRows as any[])?.[0];
      if (!raw) return null;
      const ids = [friendId!, rivalId!];
      const { data: profiles } = await (supabase as any)
        .from('user_profiles')
        .select('user_id, full_name, profile_photo_url')
        .in('user_id', ids);
      const byId = new Map<string, any>();
      (profiles ?? []).forEach((p: any) => byId.set(p.user_id, p));
      return {
        ...raw,
        rival_name: byId.get(rivalId!)?.full_name ?? null,
        rival_thumbnail_url: byId.get(rivalId!)?.profile_photo_url ?? null,
        rival_is_clbhouz_user: true,
        rival_friend_connection_id: null,
      } as FriendRivalryHydrated;
    },
  });
}

function useUserProfileMini(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-profile-mini', userId],
    enabled: !!userId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, display_name, profile_photo_url, eg_handicap_index')
        .eq('id', userId!)
        .maybeSingle();
      if (error) {
        console.error('[useUserProfileMini] query error', error);
        return null;
      }
      return data as {
        id: string;
        display_name: string | null;
        profile_photo_url: string | null;
        eg_handicap_index: number | null;
      } | null;
    },
  });
}

const RivalryPage: React.FC = () => {
  const params = useParams<{
    rivalUserId?: string;
    friendUserId?: string;
    rivalId?: string;
  }>();
  const rivalParam = params.rivalUserId ?? params.rivalId ?? undefined;
  const friendParam = params.friendUserId ?? undefined;
  const isFriendView = !!friendParam;

  
  const { user } = useSupabaseSession();
  const viewerId = user?.id;
  const openHybridSheet = useOpenFriendSheet().open;

  const owner = useOwnerRivalry(
    !isFriendView ? viewerId : undefined,
    rivalParam,
  );
  const friend = useFriendViewRivalry(
    isFriendView ? viewerId : undefined,
    isFriendView ? friendParam : undefined,
    isFriendView ? rivalParam : undefined,
  );

  const { data: viewerProfile } = useUserProfileMini(
    !isFriendView ? viewerId : undefined,
  );
  const { data: friendProfile } = useUserProfileMini(
    isFriendView ? friendParam : undefined,
  );

  // Owner fallback: if the rivalParam is a valid UUID but no rivalry row
  // exists in the user's pre-computed list, try a direct fetch (lets the
  // page work for any user, not just current rivals).
  const adHocEnabled =
    !isFriendView &&
    !owner.isLoading &&
    !owner.row &&
    !!rivalParam &&
    UUID_RE.test(rivalParam);
  const adHoc = useAdHocRivalry(viewerId, rivalParam, adHocEnabled);

  // When the ad-hoc fetch also returns null, check whether the rival's
  // profile exists so we can distinguish "no shared rounds" from "unknown id".
  const profileCheckEnabled =
    adHocEnabled && !adHoc.isLoading && !adHoc.data && !!rivalParam;
  const profileExists = useRivalProfileExists(rivalParam, profileCheckEnabled);

  const row = isFriendView ? friend.data ?? null : (owner.row ?? adHoc.data ?? null);
  const isLoading = isFriendView
    ? friend.isLoading
    : owner.isLoading || (adHocEnabled && adHoc.isLoading) || (profileCheckEnabled && profileExists.isLoading);
  const errored = isFriendView ? !!friend.error : !!owner.error;


  // Course-filter shared state
  const [courseFilter, setCourseFilter] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const handleCoursePick = (id: string) => {
    setCourseFilter(id);
    requestAnimationFrame(() => {
      timelineRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

  const [dim, setDim] = useRivalryDimension(rivalParam ?? null);

  // Owner / "you" side identity
  const yourFullName = isFriendView
    ? friendProfile?.display_name ?? null
    : viewerProfile?.display_name ?? null;
  const yourAvatarUrl = isFriendView
    ? friendProfile?.profile_photo_url ?? null
    : viewerProfile?.profile_photo_url ?? null;
  const yourHandicap = isFriendView
    ? friendProfile?.eg_handicap_index ?? null
    : viewerProfile?.eg_handicap_index ?? null;
  const yourFirstName = isFriendView ? firstName(yourFullName) : 'You';

  const rivalFirst = firstName(row?.rival_name);

  // Insights + streak + first-round date
  const insights = useMemo(
    () => (row ? computeInsights(row, dim, rivalFirst) : []),
    [row, dim, rivalFirst],
  );

  const currentStreak = useMemo<{
    side: 'you' | 'them' | null;
    count: number;
  }>(() => {
    if (!row?.shared_round_results?.length)
      return { side: null, count: 0 };
    const sorted = [...row.shared_round_results].sort((a, b) =>
      b.play_date.localeCompare(a.play_date),
    );
    const firstOutcome =
      dim === 'stableford'
        ? sorted[0].stableford_outcome
        : sorted[0].gross_outcome;
    if (firstOutcome === 'T') return { side: null, count: 0 };
    let count = 0;
    for (const r of sorted) {
      const o = dim === 'stableford' ? r.stableford_outcome : r.gross_outcome;
      if (o === firstOutcome) count++;
      else break;
    }
    return {
      side: firstOutcome === 'W' ? 'you' : 'them',
      count,
    };
  }, [row, dim]);

  const firstRoundDate = useMemo(() => {
    if (!row?.shared_round_results?.length) return null;
    return [...row.shared_round_results].sort((a, b) =>
      a.play_date.localeCompare(b.play_date),
    )[0].play_date;
  }, [row]);

  // Action handlers
  const rivalUserId = row?.rival_user_id ?? null;
  const rivalIsClbhouzUser =
    !!rivalUserId && UUID_RE.test(rivalUserId);

  // Viewer's WHS connection (for H2H trophy aggregates fetch)
  const { data: viewerConn } = useWhsConnection(
    !isFriendView ? viewerId : undefined,
  );
  const viewerConnectionId = (viewerConn as any)?.id ?? undefined;

  // H2H best gross margins from shared_round_results
  const bestMargins = useMemo(() => {
    const rounds = row?.shared_round_results ?? [];
    let me: number | null = null;
    let them: number | null = null;
    for (const r of rounds) {
      if (r.user_gross == null || r.rival_gross == null) continue;
      const d = r.rival_gross - r.user_gross;
      if (d > 0 && (me == null || d > me)) me = d;
      if (d < 0 && (them == null || -d > them)) them = -d;
    }
    return { me, them };
  }, [row]);


  const handleProfile = () => {
    if (rivalIsClbhouzUser && rivalUserId) {
      openHybridSheet({
        targetUserId: rivalUserId,
        source: 'rivalry_page' as never,
      });
    } else {
      toast('Profile not available for this rival');
    }
  };

  // v1: messaging falls back to profile sheet
  const handleMessage = () => {
    if (rivalIsClbhouzUser && rivalUserId) {
      openHybridSheet({
        targetUserId: rivalUserId,
        source: 'rivalry_page_message' as never,
      });
    } else {
      toast('Messaging coming soon');
    }
  };

  const handleShare = async () => {
    if (!row) return;
    const record =
      dim === 'stableford' ? row.stableford_record : row.gross_record;
    const total =
      (record?.wins ?? 0) + (record?.losses ?? 0) + (record?.ties ?? 0);
    const text = `My rivalry with ${
      row.rival_name ?? 'this rival'
    }: ${record?.wins ?? 0}-${record?.losses ?? 0} (${
      record?.ties ?? 0
    } ties) over ${total} rounds. Clbhouz.`;
    const url = window.location.href;
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: 'My Clbhouz Rivalry',
          text,
          url,
        });
      } catch {
        /* user cancelled */
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        toast.success('Link copied');
      } catch {
        toast.error('Could not copy link');
      }
    }
  };

  return (
    <PageRoot
      className="hcp-dark"
      style={{
        background: BG_0,
        minHeight: '100vh',
        fontFamily: FONT,
        color: T100,
        paddingTop: 'calc(var(--header-h, 55px) + 34px)',
      }}
    >


      {!viewerId && (
        <div style={{ padding: 48, textAlign: 'center', color: T60 }}>
          Sign in to view rivalry
        </div>
      )}

      {viewerId && isLoading && <RivalrySkeleton />}

      {viewerId && !isLoading && (errored || (!row && !isFriendView)) && (() => {
        const noSharedRounds = !errored && !!profileExists.data?.exists;
        const rivalDisplayFirst = firstName(profileExists.data?.displayName ?? null) || 'this player';
        return (
          <div
            style={{
              padding: '64px 24px',
              textAlign: 'center',
              fontFamily: FONT,
            }}
          >
            <div style={{ color: T100, fontSize: 16, fontWeight: 700 }}>
              {noSharedRounds
                ? `No shared rounds with ${rivalDisplayFirst} yet`
                : 'Rivalry not found'}
            </div>
            <div style={{ color: T60, fontSize: 13, marginTop: 8 }}>
              {noSharedRounds
                ? 'A rivalry starts when you play the same course on the same day.'
                : 'This rivalry may no longer exist.'}
            </div>
          </div>
        );
      })()}

      {viewerId && !isLoading && isFriendView && !row && !errored && (
        <PrivacyBlockedView />
      )}

      {viewerId && !isLoading && row && (
        <>
          <PageEyebrow
            firstRoundDate={firstRoundDate}
            totalRounds={
              (row.shared_round_results?.length) ??
              ((row.gross_record?.wins ?? 0) +
                (row.gross_record?.losses ?? 0) +
                (row.gross_record?.ties ?? 0))
            }
            titleLeft={isFriendView ? firstName(yourFullName) : 'You'}
            rivalName={row.rival_name ?? 'Rival'}
          />
          <HeroScoreboard
            rivalry={row}
            dim={dim}
            yourAvatarUrl={yourAvatarUrl}
            yourFirstName={yourFirstName}
            yourFullName={yourFullName}
            yourHandicap={yourHandicap != null ? Number(yourHandicap) : null}
            firstRoundDate={firstRoundDate}
            currentStreak={currentStreak}
            ownerView={!isFriendView}
          />


          <div
            style={{
              marginTop: 16,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <DimensionToggle value={dim} onChange={setDim} />
          </div>

          <div style={{ marginTop: 16 }}>
            <ActionRail
              onMessage={handleMessage}
              onProfile={handleProfile}
              onShare={handleShare}
            />
          </div>

          {!isFriendView && rivalIsClbhouzUser && (
            <HeadToHeadSection
              viewerId={viewerId}
              viewerConnectionId={viewerConnectionId}
              rivalUserId={rivalUserId}
              rivalFirstName={rivalFirst}
              bestMargins={bestMargins}
            />
          )}

          <InsightsGrid insights={insights} />


          <CoursesPlayedSection
            row={row}
            dim={dim}
            onCoursePick={handleCoursePick}
          />

          <RoundByRoundSection
            row={row}
            dim={dim}
            youLabel={yourFirstName}
            rivalFirstName={rivalFirst}
            courseFilter={courseFilter}
            setCourseFilter={setCourseFilter}
            scrollAnchor={timelineRef}
          />
        </>
      )}
    </PageRoot>
  );
};

const PageEyebrow: React.FC<{
  firstRoundDate: string | null;
  totalRounds: number;
  titleLeft: string;
  rivalName: string;
}> = ({ firstRoundDate, totalRounds, titleLeft, rivalName }) => {
  const since = firstRoundDate
    ? new Date(firstRoundDate).toLocaleDateString('en-GB', {
        month: 'short',
        year: 'numeric',
      }).toUpperCase()
    : null;
  return (
    <div style={{ padding: '0 16px', marginBottom: 12 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
          gap: 12,
        }}
      >
        <div
          style={{
            color: AMBER,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            fontFamily: FONT,
          }}
        >
          Rivalry
        </div>
        <div
          style={{
            color: 'rgba(248,250,252,0.50)',
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            fontFamily: FONT,
            fontVariantNumeric: 'tabular-nums',
            textAlign: 'right',
          }}
        >
          {since ? `Since ${since} · ` : ''}
          {totalRounds} {totalRounds === 1 ? 'Round' : 'Rounds'}
        </div>
      </div>
      <div
        style={{
          color: T100,
          fontSize: 26,
          fontWeight: 900,
          lineHeight: 1.1,
          letterSpacing: '-0.01em',
          fontFamily: FONT,
        }}
      >
        {titleLeft} vs {rivalName}
      </div>
    </div>
  );
};


const PrivacyBlockedView: React.FC = () => (
  <div
    style={{
      padding: '64px 24px',
      textAlign: 'center',
      fontFamily: FONT,
      color: T100,
    }}
  >
    <div style={{ fontSize: 16, fontWeight: 700 }}>Rivalry not visible</div>
    <div
      style={{
        fontSize: 13,
        color: T60,
        marginTop: 8,
        maxWidth: 320,
        margin: '8px auto 0',
      }}
    >
      This rivalry is between two users you're not connected to.
    </div>
    <Link
      to="/handicap"
      style={{
        display: 'inline-block',
        marginTop: 24,
        padding: '10px 18px',
        background: AMBER,
        color: '#0F172A',
        borderRadius: 999,
        fontWeight: 700,
        fontSize: 13,
        textDecoration: 'none',
      }}
    >
      Back to handicap
    </Link>
  </div>
);

const RivalrySkeleton: React.FC = () => (
  <div style={{ padding: 16 }}>
    <div
      className="animate-pulse"
      style={{
        height: 260,
        background: BG_1,
        border: `1px solid ${LINE_2}`,
        borderRadius: 16,
        marginBottom: 16,
      }}
    />
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 8,
        marginBottom: 16,
      }}
    >
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="animate-pulse"
          style={{ height: 80, background: BG_1, borderRadius: 12 }}
        />
      ))}
    </div>
    {[0, 1, 2, 3, 4].map((i) => (
      <div
        key={i}
        className="animate-pulse"
        style={{
          height: 82,
          background: BG_1,
          borderRadius: 12,
          marginBottom: 8,
        }}
      />
    ))}
  </div>
);

export default RivalryPage;
