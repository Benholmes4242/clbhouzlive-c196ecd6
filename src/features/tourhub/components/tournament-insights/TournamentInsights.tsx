/**
 * TournamentInsights - Main container with tab navigation
 * Light theme (#f8fafc) with premium white cards
 */

import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { Brain } from 'lucide-react';
import { useTournamentInsights } from './hooks/useTournamentInsights';
import { TournamentHeroCard } from './TournamentHeroCard';
import { CourseDNACard } from './CourseDNACard';
import { ClubhouseIntelligence } from './ClubhouseIntelligence';
import { LikelyWinnersCarousel } from './LikelyWinnersCarousel';
import IntelligenceTabSwitcher from './components/IntelligenceTabSwitcher';

type IntelligenceTab = 'courseDNA' | 'predictions';

// Skeleton loader - light themed
const TournamentInsightsSkeleton = () => (
  <div className="space-y-4 animate-pulse px-4">
    <div className="h-52 bg-black/[0.04] rounded-2xl" />
    <div className="h-8 bg-black/[0.04] rounded-lg w-3/4" />
    <div className="h-40 bg-black/[0.04] rounded-2xl" />
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
    <section aria-label="Featured tournament analysis" className="space-y-0">
      {/* Section Header — ABOVE hero card */}
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        viewport={{ once: true }}
        className="flex items-center justify-between mb-4"
      >
        {/* Left: Brain icon + text */}
        <div className="flex items-center gap-3">
          {/* Gold brain icon container */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 184, 0, 0.12) 0%, rgba(255, 140, 0, 0.06) 100%)',
              border: '1px solid rgba(255, 184, 0, 0.2)',
            }}
          >
            <Brain className="w-5 h-5" style={{ color: '#B8860B' }} />
          </div>

          <div className="flex flex-col">
            <h2 
              className="text-lg font-bold tracking-tight leading-tight text-foreground"
              style={{ letterSpacing: '-0.3px' }}
            >
              clbhouz intelligence
            </h2>
            <p className="text-xs font-normal mt-0.5 text-muted-foreground">
              AI-powered tournament analysis
            </p>
          </div>
        </div>
      </motion.div>

      {/* Hero Card — full bleed, negative margin to escape parent padding */}
      <div className="-mx-4">
        <TournamentHeroCard tournament={data.tournament} />
      </div>

      {/* ═══ UNIFIED INTELLIGENCE WRAPPER — LIGHT THEME ═══ */}
      <div 
        className="mt-0 px-4 pt-7 bg-background"
        style={{ borderTop: '1px solid rgba(0, 0, 0, 0.05)' }}
      >

        {/* Tab Switcher — Premium Pill Selector */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          viewport={{ once: true }}
        >
          <IntelligenceTabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />
        </motion.div>

        {/* Tab Content */}
        {activeTab === 'courseDNA' && (
          <motion.div
            key="courseDNA"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            className="pb-6"
          >
            {/* Unified Course DNA + Breakdown card */}
            <div 
              className="rounded-2xl bg-card border border-border overflow-hidden"
              style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
            >
              {data.courseDNA.length > 0 && (
                <CourseDNACard
                  items={data.courseDNA}
                  courseName={data.tournament.courseName}
                  inline
                />
              )}
              <ClubhouseIntelligence insight={data.clubhouseIntelligence} inline />
            </div>
          </motion.div>
        )}

        {activeTab === 'predictions' && (
          <motion.div
            key="predictions"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            className="pb-6"
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
    </section>
  );
});
