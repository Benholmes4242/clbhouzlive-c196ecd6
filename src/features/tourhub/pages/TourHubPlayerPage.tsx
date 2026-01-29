/**
 * TourHubPlayerPage - Premium cinematic player profile page
 */

import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Flag, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTourPlayer, useTourSeason, useTourPlayerStatistics } from '../hooks/useTourHubData';
import { PlayerProfileHero, PlayerStatsGrid, PlayerRecentResults } from '../components/player-profile';
import { GlassCard } from '../components/premium';

export function TourHubPlayerPage() {
  const { athleteId } = useParams<{ athleteId: string }>();
  
  const { data: player, isLoading: playerLoading } = useTourPlayer(athleteId || '');
  const { data: season } = useTourSeason();
  const { data: allStats } = useTourPlayerStatistics(season?.id);
  
  // Find this player's stats
  const playerStats = allStats?.find(s => s.player_id === athleteId);
  
  if (playerLoading) {
    return (
      <div className="min-h-screen bg-th-bg-canvas">
        <div className="animate-pulse">
          <div className="h-[50vh] bg-white/5" />
          <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
            <div className="h-8 w-48 bg-white/10 rounded" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-24 bg-white/5 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!player) {
    return (
      <div className="min-h-screen bg-th-bg-canvas flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/60 text-lg">Player not found</p>
          <Link 
            to="/tourhub" 
            className="inline-flex items-center gap-2 mt-4 text-th-accent hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tour Hub
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-th-bg-canvas">
      {/* Back Link - Floating */}
      <div className="absolute top-4 left-4 z-20">
        <Link 
          to="/tourhub?tab=players" 
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm text-sm text-white/80 hover:text-white hover:bg-black/60 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Players
        </Link>
      </div>
      
      {/* Hero Section */}
      <PlayerProfileHero player={player} stats={playerStats} />
      
      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Stats Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-th-accent" />
            Season Statistics
          </h2>
          {playerStats ? (
            <PlayerStatsGrid stats={playerStats} />
          ) : (
            <GlassCard className="p-8 text-center">
              <p className="text-white/60">No statistics available for this season</p>
            </GlassCard>
          )}
        </motion.section>
        
        {/* Recent Results Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
            <Flag className="w-5 h-5 text-th-accent" />
            Recent Finishes
          </h2>
          <PlayerRecentResults playerId={athleteId || ''} />
        </motion.section>
        
        {/* Career Highlights Placeholder */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-th-accent" />
            Career Highlights
          </h2>
          <GlassCard className="p-8 text-center">
            <p className="text-white/60">Career timeline coming soon</p>
          </GlassCard>
        </motion.section>
      </div>
    </div>
  );
}
