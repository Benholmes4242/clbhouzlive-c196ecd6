/**
 * LiveOverviewTab — Overview tab content shown ONLY while tournament.status === 'inprogress'.
 *
 * Three sections, in order:
 *   1. LEADER       — top-5 condensed leaderboard with "View full leaderboard" CTA
 *   2. CUT          — round/cut context (R2+: projected/official cut + made-cut count)
 *   3. COURSE       — re-uses CourseInfoCard so the live tab still surfaces venue context
 *
 * The Upcoming and Completed states keep using the existing overview composition
 * inside TournamentDetailPage. This component is purpose-built for live moments
 * — it stays narrow, story-driven, and avoids duplicating the hero pills.
 *
 * Empty fallbacks use EditorialEmpty (3px amber rail) instead of generic spinners.
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { LeaderboardCard } from './LeaderboardCard';
import { CourseInfoCard } from './CourseInfoCard';
import { EditorialEmpty } from './EditorialEmpty';
import type { TourTournament } from '../../hooks/useTourHubData';

interface LiveOverviewTabProps {
  tournament: TourTournament;
  leaderboard: any[] | null | undefined;
  courseImage?: string | null;
  courseId?: string | null;
  onViewLeaderboard: () => void;
}

const sectionRule = (label: string) => (
  <div style={{ padding: '14px 20px 8px', background: '#F8FAFC' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 3, height: 14, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
      <span
        style={{
          fontSize: 10,
          fontWeight: 900,
          color: '#F7931E',
          letterSpacing: '0.16em',
          textTransform: 'uppercase' as const,
        }}
      >
        {label}
      </span>
    </div>
  </div>
);

function CutContextCard({
  tournament,
  leaderboard,
}: {
  tournament: TourTournament;
  leaderboard: any[] | null | undefined;
}) {
  const round = tournament.current_round ?? 1;
  const cut = tournament.cutline ?? null;
  const projectedCut = tournament.projected_cutline ?? null;

  // Counts derived from leaderboard.status (per audit: 'active' | 'CUT' | 'WD' | null).
  const counts = useMemo(() => {
    if (!leaderboard?.length) return { active: 0, made: 0, cutCount: 0, wd: 0 };
    let active = 0, cutCount = 0, wd = 0;
    for (const e of leaderboard as any[]) {
      const s = (e?.status ?? '').toUpperCase();
      if (s === 'CUT') cutCount += 1;
      else if (s === 'WD' || s === 'DQ') wd += 1;
      else active += 1;
    }
    return { active, made: active, cutCount, wd };
  }, [leaderboard]);

  // Pre-cut (R1 or early R2): show projected cut messaging.
  if (round < 2 || (cut == null && projectedCut == null)) {
    return (
      <EditorialEmpty
        eyebrow={`Round ${round}`}
        title="Cut line forms after Round 2"
        body="The cut is set once the second round completes. We'll show projected and official cut lines here as scoring develops."
        accent={projectedCut != null ? `Projected ${projectedCut > 0 ? '+' : ''}${projectedCut}` : undefined}
      />
    );
  }

  const cutValue = cut ?? projectedCut!;
  const cutLabel = cut != null ? 'Cut' : 'Projected cut';
  const formattedCut = cutValue === 0 ? 'E' : cutValue > 0 ? `+${cutValue}` : String(cutValue);

  return (
    <div
      style={{
        background: '#ffffff',
        borderTop: '1px solid rgba(15,23,42,0.07)',
        borderBottom: '1px solid rgba(15,23,42,0.07)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
        }}
      >
        {[
          { label: cutLabel.toUpperCase(), value: formattedCut },
          { label: 'MADE CUT', value: counts.made > 0 ? String(counts.made) : '—' },
          { label: 'MISSED', value: counts.cutCount > 0 ? String(counts.cutCount) : '—' },
        ].map((s, i) => (
          <div
            key={s.label}
            style={{
              padding: '14px 0 14px',
              textAlign: 'center' as const,
              borderRight: i < 2 ? '0.5px solid rgba(15,23,42,0.07)' : 'none',
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 900,
                color: '#94A3B8',
                letterSpacing: '0.12em',
                marginBottom: 4,
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: '#0F172A',
                letterSpacing: '-0.02em',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LiveOverviewTab({
  tournament,
  leaderboard,
  courseImage,
  courseId,
  onViewLeaderboard,
}: LiveOverviewTabProps) {
  const hasLeaderboard = !!leaderboard && leaderboard.length > 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      {/* 1. LEADER */}
      {sectionRule('Leader')}
      {hasLeaderboard ? (
        <LeaderboardCard
          entries={leaderboard!}
          onViewAll={onViewLeaderboard}
          limit={5}
        />
      ) : (
        <EditorialEmpty
          eyebrow="Live"
          title="Scoring loading"
          body="Live scoring rows will populate here as players post numbers in the current round."
        />
      )}

      {/* 2. CUT */}
      {sectionRule('Cut')}
      <CutContextCard tournament={tournament} leaderboard={leaderboard} />

      {/* 3. COURSE */}
      <CourseInfoCard
        tournament={tournament}
        courseImage={courseImage ?? undefined}
        courseId={courseId ?? undefined}
      />
    </motion.div>
  );
}
