/**
 * HeadToHeadSection — orchestrator. Mounts the H2HScoreBanner + the three
 * StatsGroups (Lifetime, Personal Bests, Current Form).
 *
 * Hidden entirely when the rival is a non-Clbhouz friend (no rivalUserId)
 * or when both players have no data.
 */
import React, { useMemo } from 'react';
import {
  BG_1,
  LINE,
  FONT,
  T60,
} from '@/pages/rivalry-page/_shared/tokens';
import { useHeadToHeadStats } from './h2h/_shared/useHeadToHeadStats';
import {
  LIFETIME_STATS,
  PERSONAL_BESTS,
  CURRENT_FORM,
  ALL_STAT_DEFS,
  valueFor,
  type H2HStatDef,
} from './h2h/_shared/h2hStats';
import { whoLeads } from './h2h/_shared/whoLeads';
import { H2HScoreBanner } from './h2h/H2HScoreBanner';
import { StatsGroup, type StatItem } from './h2h/StatsGroup';

interface Props {
  viewerId: string | undefined;
  viewerConnectionId: string | undefined;
  rivalUserId: string | null;
  rivalFirstName: string;
  bestMargins: { me: number | null; them: number | null };
}

export const HeadToHeadSection: React.FC<Props> = ({
  viewerId,
  viewerConnectionId,
  rivalUserId,
  rivalFirstName,
  bestMargins,
}) => {
  const { data, isLoading } = useHeadToHeadStats(
    viewerId,
    viewerConnectionId,
    rivalUserId,
    rivalFirstName,
    bestMargins,
  );

  const buildStats = (defs: H2HStatDef[]): StatItem[] => {
    if (!data) return [];
    return defs.map((def) => ({
      def,
      meValue: valueFor(def, data.me, data.meBestMargin),
      themValue: valueFor(def, data.them, data.themBestMargin),
    }));
  };

  const tally = useMemo(() => {
    if (!data) return { me: 0, them: 0, ties: 0, total: 0 };
    let me = 0;
    let them = 0;
    let ties = 0;
    for (const def of ALL_STAT_DEFS) {
      const meVal = valueFor(def, data.me, data.meBestMargin);
      const themVal = valueFor(def, data.them, data.themBestMargin);
      const { winner } = whoLeads(def, meVal, themVal);
      if (winner === 'me') me++;
      else if (winner === 'them') them++;
      else ties++;
    }
    return { me, them, ties, total: ALL_STAT_DEFS.length };
  }, [data]);

  // Non-Clbhouz friend → hide
  if (!rivalUserId) return null;

  if (isLoading) return <H2HSkeleton />;
  if (!data) return null;

  return (
    <div style={{ marginTop: 20 }}>
      <H2HScoreBanner
        myWins={tally.me}
        theirWins={tally.them}
        ties={tally.ties}
        total={tally.total}
        rivalFirstName={rivalFirstName}
      />
      <StatsGroup title="Lifetime" stats={buildStats(LIFETIME_STATS)} />
      <StatsGroup title="Personal bests" stats={buildStats(PERSONAL_BESTS)} />
      <StatsGroup title="Current form" stats={buildStats(CURRENT_FORM)} />
    </div>
  );
};

const H2HSkeleton: React.FC = () => (
  <div style={{ padding: '20px 16px 0', fontFamily: FONT }}>
    <div
      className="animate-pulse"
      style={{
        height: 96,
        background: BG_1,
        border: `1px solid ${LINE}`,
        borderRadius: 12,
        marginBottom: 16,
      }}
    />
    {[0, 1, 2].map((g) => (
      <div key={g} style={{ marginBottom: 16 }}>
        <div
          style={{
            color: T60,
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          Loading…
        </div>
        <div
          className="animate-pulse"
          style={{
            height: 220,
            background: BG_1,
            border: `1px solid ${LINE}`,
            borderRadius: 12,
          }}
        />
      </div>
    ))}
  </div>
);
