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
    <section className="w-full max-w-[560px] mx-auto px-4 md:px-6 space-y-6 py-6">
      {/* Chapter 1: Tournament Hero */}
      <div>
        <ChapterLabel>Tournament</ChapterLabel>
        <TournamentHeroCard tournament={data.tournament} />
      </div>

      {/* Chapter 2: Course DNA */}
      {data.courseDNA.length > 0 && (
        <div>
          <ChapterLabel>Course</ChapterLabel>
          <CourseDNACard items={data.courseDNA} />
        </div>
      )}

      {/* Chapter 3: The Edge (AI Insight) */}
      <div>
        <ChapterLabel>Insight</ChapterLabel>
        <AIInsightCard edge={data.aiEdge} />
      </div>

      {/* Chapter 4: Likely Winners */}
      {data.winners.length > 0 && (
        <div>
          <ChapterLabel>Contenders</ChapterLabel>
          <LikelyWinnersCarousel winners={data.winners} />
        </div>
      )}

      {/* Chapter 5: Dangerous Profiles */}
      {data.dangerous.length > 0 && (
        <div>
          <ChapterLabel>Threats</ChapterLabel>
          <DangerousProfilesRow profiles={data.dangerous} />
        </div>
      )}
    </section>
  );
});
