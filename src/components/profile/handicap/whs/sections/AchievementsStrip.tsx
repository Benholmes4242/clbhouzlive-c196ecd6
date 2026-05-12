import React, { useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import AllTrophiesSheet from './AllTrophiesSheet';
import { format } from 'date-fns';
import {
  Trophy, Crown, Flag, Link2, Target, MapPin, Globe, Hash,
  CheckCircle2, Plane, Users, Lock,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAllScores, useHandicapHistory, useTrophyAggregates } from '@/lib/whs/hooks';
import { computeAchievements, pickNextUpTrophies } from '@/lib/whs/achievements';
import type { Achievement } from '@/lib/whs/types';
import { supabase } from '@/integrations/supabase/client';
import { SectionHeader } from './SectionHeader';

interface Props {
  connectionId: string;
  connectionCreatedAt: string | null;
  userId?: string;
}

const ICONS: Record<string, React.ComponentType<any>> = {
  Trophy, Crown, Flag, Link2, Target, MapPin, Globe, Hash,
  CheckCircle2, Plane, Users,
};

const TROPHY_TILE_WIDTH = 130;
const HAIRLINE = 'rgba(15,23,42,0.08)';
const INK = '#0F172A';
const INK_55 = 'rgba(15,23,42,0.55)';
const INK_10 = 'rgba(15,23,42,0.10)';
const INK_06 = 'rgba(15,23,42,0.06)';
const INK_70 = '#475569';
const GOLD = '#D97706';
const AMBER = '#F7931E';
const AMBER_14 = 'rgba(247,147,30,0.14)';
const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

// Category accent palette (mirrors AllTrophiesSheet)
const CAT_ACCENT: Record<string, { accent: string; tint: string }> = {
  handicap:  { accent: '#059669', tint: 'rgba(5,150,105,0.10)' },
  scoring:   { accent: AMBER,     tint: AMBER_14 },
  courses:   { accent: '#0EA5E9', tint: 'rgba(14,165,233,0.10)' },
  community: { accent: '#7C3AED', tint: 'rgba(124,58,237,0.10)' },
};

const TrophyTile: React.FC<{ a: Achievement }> = ({ a }) => {
  const Icon = ICONS[a.icon_name] ?? Trophy;
  const cat = CAT_ACCENT[a.category] ?? CAT_ACCENT.handicap;
  const isCounter = a.kind === 'counter';
  const isList = a.kind === 'list';
  const isBinary = a.kind === 'binary';
  const isEarned = a.earned === true;
  const isLocked = isBinary && !isEarned;
  const listComplete = isList && (a.list_played ?? 0) >= (a.list_total ?? 100);

  return (
    <div
      style={{
        flex: `0 0 ${TROPHY_TILE_WIDTH}px`,
        position: 'relative',
        padding: '12px 12px',
        borderRadius: 12,
        background: isLocked ? 'rgba(15,23,42,0.025)' : '#fff',
        border: isLocked
          ? `1px dashed rgba(15,23,42,0.18)`
          : `0.5px solid ${INK_10}`,
        scrollSnapAlign: 'start',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        fontFamily: FONT_GEIST,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: isLocked ? INK_06 : cat.tint,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon
          size={16}
          color={isLocked ? 'rgba(15,23,42,0.40)' : cat.accent}
          strokeWidth={2.2}
        />
      </div>

      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: isLocked ? INK_55 : INK,
          letterSpacing: '-0.01em',
          lineHeight: 1.2,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {a.title}
      </div>

      {/* Render path by kind */}
      {isCounter && (
        <div style={{ marginTop: 'auto' }}>
          <div style={{
            fontSize: 20,
            fontWeight: 800,
            color: INK,
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.03em',
          }}>{(a.count ?? 0).toLocaleString()}</div>
          {a.count_label && (
            <div style={{
              fontSize: 9,
              fontWeight: 800,
              color: INK_55,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              marginTop: 3,
            }}>{a.count_label}</div>
          )}
        </div>
      )}

      {isList && !listComplete && (
        <div style={{ marginTop: 'auto' }}>
          <div style={{
            height: 3, background: INK_06, borderRadius: 999, overflow: 'hidden', marginBottom: 5,
          }}>
            <div style={{
              width: `${Math.min(100, ((a.list_played ?? 0) / (a.list_total ?? 100)) * 100)}%`,
              height: '100%',
              background: cat.accent,
              borderRadius: 999,
            }} />
          </div>
          <div style={{
            fontSize: 10, fontWeight: 700, color: INK_55,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {a.list_played ?? 0} / {a.list_total ?? 100}
          </div>
        </div>
      )}

      {isList && listComplete && (
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{
            fontSize: 18, fontWeight: 800, color: INK,
            fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em',
          }}>{a.list_total ?? 100}</span>
          <span style={{ fontSize: 14 }}>🏆</span>
        </div>
      )}

      {isBinary && isEarned && a.achieved_at && (
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, color: '#94A3B8',
            letterSpacing: '0.04em',
          }}>{format(new Date(a.achieved_at), 'd MMM yyyy').toUpperCase()}</span>
          <span style={{ fontSize: 12, marginLeft: 'auto' }}>🏆</span>
        </div>
      )}

      {isLocked && (
        <div style={{
          marginTop: 'auto',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 4,
          fontSize: 10,
          fontWeight: 500,
          color: 'rgba(15,23,42,0.55)',
          lineHeight: 1.3,
        }}>
          <Lock size={10} color="rgba(15,23,42,0.40)" strokeWidth={2.2}
            style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>{a.description}</span>
        </div>
      )}
    </div>
  );
};

const ViewAllTile: React.FC<{ totalCount: number; onClick: () => void }> = ({
  totalCount,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      style={{
        flex: `0 0 ${TROPHY_TILE_WIDTH}px`,
        padding: '14px 12px',
        borderRadius: 12,
        background:
          'linear-gradient(135deg, rgba(247,147,30,0.08) 0%, rgba(247,147,30,0.02) 100%)',
        border: `1.5px dashed rgba(247,147,30,0.55)`,
        scrollSnapAlign: 'start',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          background: 'rgba(247,147,30,0.14)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ChevronRight size={18} color={AMBER} strokeWidth={2.5} />
      </div>
      <div style={{ marginTop: 12 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: '#0F172A',
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
          }}
        >
          View all
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#C97211',
            marginTop: 4,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {totalCount} trophies
        </div>
      </div>
    </button>
  );
};

const SkeletonTile: React.FC = () => (
  <div
    style={{
      flex: `0 0 ${TROPHY_TILE_WIDTH}px`,
      height: 120,
      borderRadius: 12,
      background: '#F1F5F9',
      border: `1px solid ${HAIRLINE}`,
    }}
    className="animate-pulse"
  />
);

export const AchievementsStrip: React.FC<Props> = ({
  connectionId,
  connectionCreatedAt,
  userId,
}) => {
  const { data: scores, isLoading: sLoading } = useAllScores(connectionId);
  const { data: history, isLoading: hLoading } = useHandicapHistory(connectionId, 365);
  const { data: aggregates } = useTrophyAggregates(userId, connectionId);

  // Fetch primary club for "Home club master" trophy
  const { data: primaryClub } = useQuery({
    queryKey: ['user-primary-club', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data: profileRow } = await supabase
        .from('user_profiles')
        .select('primary_club_id')
        .eq('id', userId!)
        .maybeSingle();
      const primaryClubId = (profileRow as any)?.primary_club_id ?? null;
      if (!primaryClubId) {
        return { primary_club_id: null as string | null, primary_club_name: null as string | null };
      }
      const { data: club } = await supabase
        .from('golf_clubs')
        .select('id, name')
        .eq('id', primaryClubId)
        .maybeSingle();
      return {
        primary_club_id: primaryClubId as string,
        primary_club_name: ((club as any)?.name ?? null) as string | null,
      };
    },
    staleTime: 5 * 60_000,
  });

  const allAchievements = useMemo<Achievement[]>(() => {
    if (!scores || !history) return [];
    return computeAchievements({
      scores,
      history,
      connectionCreatedAt,
      primaryClubId: primaryClub?.primary_club_id ?? null,
      primaryClubName: primaryClub?.primary_club_name ?? null,
      aggregates: aggregates ?? null,
    });
  }, [scores, history, connectionCreatedAt, primaryClub, aggregates]);

  const earnedAchievements = useMemo(
    () => allAchievements.filter((a) => a.earned),
    [allAchievements],
  );

  const nextUpTrophies = useMemo(
    () => pickNextUpTrophies(allAchievements, 2),
    [allAchievements],
  );

  const displayList = useMemo(
    () => [...earnedAchievements, ...nextUpTrophies],
    [earnedAchievements, nextUpTrophies],
  );

  const earnedCount = earnedAchievements.length;
  const isLoading = sLoading || hLoading;
  const [showAll, setShowAll] = useState(false);

  if (!isLoading && displayList.length === 0) return null;

  const countBadge =
    !isLoading && earnedCount > 0 ? (
      <span
        style={{
          fontSize: 9,
          fontWeight: 900,
          color: AMBER,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        {earnedCount} Earned
      </span>
    ) : null;

  return (
    <section style={{ marginBottom: 24 }}>
      <SectionHeader
        eyebrow="Trophy Cabinet"
        title="What you've earned"
        sub={isLoading ? 'Loading...' : 'Achievements pulled from your real rounds'}
        right={countBadge}
      />

      <div
        style={{
          display: 'flex',
          gap: 10,
          padding: '0 20px 8px',
          overflowX: 'auto',
          scrollPaddingLeft: 20,
          scrollPaddingRight: 20,
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
        className="hide-scrollbar"
      >
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonTile key={i} />)
          : (
            <>
              {displayList.map((a) => <TrophyTile key={a.id} a={a} />)}
              {allAchievements.length > 0 && (
                <ViewAllTile
                  totalCount={allAchievements.length}
                  onClick={() => setShowAll(true)}
                />
              )}
            </>
          )}
      </div>

      <AllTrophiesSheet
        open={showAll}
        onClose={() => setShowAll(false)}
        achievements={allAchievements}
      />
    </section>
  );
};

export default AchievementsStrip;
