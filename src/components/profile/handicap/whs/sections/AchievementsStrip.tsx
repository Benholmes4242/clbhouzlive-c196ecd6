import React, { useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import AllTrophiesSheet from './AllTrophiesSheet';
import { format } from 'date-fns';
import {
  Trophy,
  Flame,
  TrendingDown,
  Award,
  Map as MapIcon,
  Calendar,
  Star,
  Crown,
  Flag,
  Link2,
  Target,
  MapPin,
  BarChart3,
  CheckCircle2,
  Activity,
  Zap,
  Users,
  UserCheck,
  Swords,
  Plane,
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
  Trophy,
  Flame,
  TrendingDown,
  Award,
  Map: MapIcon,
  Calendar,
  Star,
  Flag,
  Link2,
  Target,
  MapPin,
  BarChart3,
  CheckCircle2,
  Activity,
  Zap,
  Users,
  UserCheck,
  Swords,
  Plane,
  Crown,
};

const TROPHY_TILE_WIDTH = 130;
const HAIRLINE = 'rgba(15,23,42,0.08)';
const GOLD = '#D97706';
const AMBER = '#F7931E';

const TrophyTile: React.FC<{ a: Achievement }> = ({ a }) => {
  const Icon = ICONS[a.icon_name] ?? Star;
  const isHighlight = a.highlight && a.earned;
  const isLocked = !a.earned;
  const isTiered = a.tier != null && a.totalTiers != null && a.totalTiers > 1;

  return (
    <div
      style={{
        flex: `0 0 ${TROPHY_TILE_WIDTH}px`,
        position: 'relative',
        padding: '14px 12px',
        borderRadius: 12,
        background: isHighlight
          ? 'linear-gradient(135deg, rgba(247,147,30,0.10) 0%, rgba(247,147,30,0.02) 100%)'
          : isLocked
          ? 'rgba(15,23,42,0.025)'
          : '#FAFAF7',
        border: isHighlight
          ? `1.5px solid rgba(247,147,30,0.45)`
          : isLocked
          ? `1px dashed rgba(15,23,42,0.18)`
          : `1px solid ${HAIRLINE}`,
        scrollSnapAlign: 'start',
        opacity: isLocked ? 0.85 : 1,
      }}
    >
      {isHighlight && (
        <div style={{ position: 'absolute', top: 8, right: 8 }}>
          <Crown size={12} color={GOLD} fill={GOLD} strokeWidth={2} />
        </div>
      )}

      {!isHighlight && isTiered && a.earned && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            fontSize: 8,
            fontWeight: 800,
            color: '#C97211',
            background: 'rgba(247,147,30,0.10)',
            padding: '2px 6px',
            borderRadius: 4,
            letterSpacing: '0.06em',
          }}
        >
          TIER {a.tier} / {a.totalTiers}
        </div>
      )}

      <Icon
        size={20}
        color={isHighlight ? AMBER : isLocked ? '#94A3B8' : '#64748B'}
        strokeWidth={2}
        style={{ opacity: isLocked ? 0.55 : 1 }}
      />

      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: isLocked ? 'rgba(15,23,42,0.55)' : '#0F172A',
          letterSpacing: '-0.01em',
          lineHeight: 1.2,
          marginTop: 10,
          marginBottom: 3,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {a.title}
      </div>

      <div
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: isLocked ? 'rgba(15,23,42,0.40)' : '#64748B',
          lineHeight: 1.3,
          marginBottom: 8,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {a.subtitle}
      </div>

      {(isTiered || isLocked) && a.progress != null && (
        <>
          <div
            style={{
              height: 4,
              borderRadius: 2,
              background: 'rgba(15,23,42,0.08)',
              overflow: 'hidden',
              marginBottom: 6,
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.round(a.progress * 100)}%`,
                background: isLocked ? 'rgba(247,147,30,0.55)' : AMBER,
                borderRadius: 2,
              }}
            />
          </div>
          {a.progressLabel && (
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: isLocked ? 'rgba(15,23,42,0.45)' : '#64748B',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {a.progressLabel}
            </div>
          )}
        </>
      )}

      {a.earned && !isTiered && a.achieved_at && (
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: '#94A3B8',
            letterSpacing: '0.02em',
          }}
        >
          {format(new Date(a.achieved_at), 'd MMM yyyy').toUpperCase()}
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
          scrollSnapType: 'x mandatory',
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
