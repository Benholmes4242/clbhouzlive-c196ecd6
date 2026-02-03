/**
 * TournamentInsights - Main container for the 5-chapter pre-round briefing
 */

import { memo } from 'react';
import { useTournamentInsights } from './hooks/useTournamentInsights';
import { TournamentHeroCard } from './TournamentHeroCard';
import { CourseDNACard } from './CourseDNACard';
import { ClubhouseIntelligence } from './ClubhouseIntelligence';
import { LikelyWinnersCarousel } from './LikelyWinnersCarousel';

// Skeleton loader
const TournamentInsightsSkeleton = () => (
  <div className="space-y-6 px-4 animate-pulse">
    <div className="h-[200px] bg-slate-200 rounded-2xl" />
    <div className="h-[180px] bg-slate-200 rounded-2xl" />
    <div className="h-[120px] bg-slate-200 rounded-2xl" />
    <div className="h-[200px] bg-slate-200 rounded-2xl" />
  </div>
);

export const TournamentInsights = memo(function TournamentInsights() {
  const { data, isLoading, error } = useTournamentInsights();

  if (isLoading) {
    return <TournamentInsightsSkeleton />;
  }

  if (error || !data) {
    return null;
  }

  return (
    <section className="w-full max-w-[560px] mx-auto">
      {/* ===== UNIFIED TOURNAMENT BLOCK (pointed corners, edge-to-edge) ===== */}
      <div className="w-full overflow-hidden shadow-[0_4px_20px_rgba(15,23,42,0.08)]">
        {/* Hero - full bleed, pointed corners */}
        <TournamentHeroCard tournament={data.tournament} />
        
        {/* Course DNA - connected */}
        {data.courseDNA.length > 0 && (
          <div className="bg-white border-t border-slate-100 px-4 py-4">
            <CourseDNACard items={data.courseDNA} courseName={data.tournament.courseName} inline />
          </div>
        )}
        
        {/* Clubhouse Intelligence - connected, closes the block */}
        <div className="bg-white border-t border-slate-100 px-4 py-4">
          <ClubhouseIntelligence insight={data.clubhouseIntelligence} inline />
        </div>
      </div>

      {/* ===== LIKELY WINNERS (includes contenders + threats in unified carousel) ===== */}
      {data.winners.length > 0 && (
        <div className="mt-5 px-4 pb-4">
          <LikelyWinnersCarousel 
            featured={data.winners[0]} 
            cards={data.contenderCards}
          />
        </div>
      )}
    </section>
  );
});
