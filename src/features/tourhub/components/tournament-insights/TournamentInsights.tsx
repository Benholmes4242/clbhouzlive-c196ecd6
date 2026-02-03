/**
 * TournamentInsights - Main container for the 5-chapter pre-round briefing
 */

import { memo } from 'react';
import { useTournamentInsights } from './hooks/useTournamentInsights';
import { TournamentHeroCard } from './TournamentHeroCard';
import { CourseDNACard } from './CourseDNACard';
import { AIInsightCard } from './AIInsightCard';
import { LikelyWinnersCarousel } from './LikelyWinnersCarousel';
import { DangerousProfilesRow } from './DangerousProfilesRow';
import { ChapterLabel } from './components/ChapterLabel';

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
    <section className="w-full max-w-[560px] mx-auto py-6">
      {/* ===== UNIFIED TOURNAMENT BLOCK (edge-to-edge) ===== */}
      <div className="w-full">
        {/* Hero - full bleed, rounded top only */}
        <TournamentHeroCard tournament={data.tournament} />
        
        {/* Course DNA - connected, no gap */}
        {data.courseDNA.length > 0 && (
          <div className="bg-white border-t border-slate-100 px-4 py-4">
            <CourseDNACard items={data.courseDNA} inline />
          </div>
        )}
        
        {/* The Edge - connected, rounded bottom */}
        <div className="bg-white border-t border-slate-100 px-4 py-4 rounded-b-2xl shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
          <AIInsightCard edge={data.aiEdge} inline />
        </div>
      </div>

      {/* ===== CONTENDERS (separate section with margins) ===== */}
      {data.winners.length > 0 && (
        <div className="px-4 md:px-6 mt-6">
          <ChapterLabel>Contenders</ChapterLabel>
          <LikelyWinnersCarousel winners={data.winners} />
        </div>
      )}

      {/* ===== THREATS (separate section with margins) ===== */}
      {data.dangerous.length > 0 && (
        <div className="px-4 md:px-6 mt-6">
          <ChapterLabel>Threats</ChapterLabel>
          <DangerousProfilesRow profiles={data.dangerous} />
        </div>
      )}
    </section>
  );
});
