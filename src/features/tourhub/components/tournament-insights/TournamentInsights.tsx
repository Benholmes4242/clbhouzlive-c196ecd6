/**
 * TournamentInsights - Main container with tab navigation
 */

import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { useTournamentInsights } from './hooks/useTournamentInsights';
import { TournamentHeroCard } from './TournamentHeroCard';
import { CourseDNACard } from './CourseDNACard';
import { ClubhouseIntelligence } from './ClubhouseIntelligence';
import { LikelyWinnersCarousel } from './LikelyWinnersCarousel';
import IntelligenceTabSwitcher from './components/IntelligenceTabSwitcher';

type IntelligenceTab = 'courseDNA' | 'predictions';

// Skeleton loader
const TournamentInsightsSkeleton = () => (
  <div className="space-y-4 animate-pulse px-4">
    <div className="h-52 bg-slate-200 rounded-2xl" />
    <div className="h-8 bg-slate-200 rounded-lg w-3/4" />
    <div className="h-40 bg-slate-200 rounded-2xl" />
  </div>
);

export const TournamentInsights = memo(function TournamentInsights() {
  const { data, isLoading, error } = useTournamentInsights();
  const [activeTab, setActiveTab] = useState<IntelligenceTab>('courseDNA');

  if (isLoading) {
    return <TournamentInsightsSkeleton />;
  }

  if (error || !data) {
    return null;
  }

  return (
    <div className="space-y-0">
      {/* Hero Card — stays outside the intelligence wrapper */}
      <TournamentHeroCard tournament={data.tournament} />

      {/* ═══ UNIFIED INTELLIGENCE WRAPPER ═══ */}
      <div className="mt-0 px-4">
        {/* Section Header */}
        <div className="flex items-center gap-2.5 mt-6 mb-4 px-0">
          {/* Gold brain icon */}
          <div
            className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center text-[15px]"
            style={{
              background: 'linear-gradient(135deg, #B8860B, #96700A)',
              boxShadow: '0 2px 8px rgba(184,134,11,0.2)',
            }}
          >
            🧠
          </div>

          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight m-0 leading-tight">
              clbhouz intelligence
            </h2>
            <p className="text-[11px] font-medium text-slate-400 m-0">
              AI-powered tournament analysis
            </p>
          </div>

          {/* World First badge */}
          <div
            className="text-[9px] font-bold uppercase tracking-widest px-2 py-[3px] rounded"
            style={{
              color: '#B8860B',
              backgroundColor: '#F5ECD7',
              border: '1px solid #E8D5A3',
            }}
          >
            World First
          </div>
        </div>

        {/* Tab Switcher */}
        <IntelligenceTabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        {activeTab === 'courseDNA' && (
          <motion.div
            key="courseDNA"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            {data.courseDNA.length > 0 && (
              <CourseDNACard
                items={data.courseDNA}
                courseName={data.tournament.courseName}
              />
            )}
            <ClubhouseIntelligence insight={data.clubhouseIntelligence} />
          </motion.div>
        )}

        {activeTab === 'predictions' && (
          <motion.div
            key="predictions"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {data.winners.length > 0 && (
              <LikelyWinnersCarousel
                featured={data.winners[0]}
                cards={data.contenderCards}
              />
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
});
