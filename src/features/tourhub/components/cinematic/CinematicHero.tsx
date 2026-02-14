/**
 * CinematicHero - 85vh immersive hero with Ken Burns animation
 * Apple TV+ inspired tournament showcase
 */

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight, Radio, BarChart3, MapPin, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LiveIndicator } from '../premium/LiveIndicator';
import { getCourseImage } from '../../utils/placeholders';

interface LeaderEntry {
  playerId: string;
  playerName: string;
  position: number;
  score: string;
  today?: string;
  thru?: string;
}

interface CinematicHeroProps {
  tournament: {
    id: string;
    name: string;
    status: string;
    venueName?: string | null;
    venueCity?: string | null;
    venueCountry?: string | null;
    courseName?: string | null;
    purse?: number | null;
    startDate: string;
    endDate: string;
  };
  leaders?: LeaderEntry[];
  courseImageUrl?: string | null;
}

function MiniLeaderboardGlass({ leaders }: { leaders: LeaderEntry[] }) {
  if (!leaders || leaders.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <p className="text-white/50 text-sm text-center">Leaderboard coming soon</p>
      </div>
    );
  }

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      {leaders.slice(0, 3).map((leader, idx) => (
        <div
          key={leader.playerId}
          className={cn(
            "flex items-center justify-between px-4 py-3",
            idx !== leaders.length - 1 && "border-b border-white/10"
          )}
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">{medals[idx] || `${idx + 1}`}</span>
            <span className="text-white font-medium">{leader.playerName}</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-white font-bold tabular-nums">{leader.score}</span>
            {leader.thru && leader.thru !== 'F' && (
              <span className="text-white/50 tabular-nums">Thru {leader.thru}</span>
            )}
            {leader.thru === 'F' && (
              <span className="text-white/50 tabular-nums">F</span>
            )}
            {leader.today && (
              <span className={cn(
                "tabular-nums font-medium",
                leader.today.startsWith('-') ? "text-emerald-400" : "text-white/70"
              )}>
                {leader.today}
              </span>
            )}
          </div>
        </div>
      ))}
      {leaders.length > 3 && (
        <div className="px-4 py-2 text-center">
          <span className="text-white/40 text-xs">+ {leaders.length - 3} more playing</span>
        </div>
      )}
    </div>
  );
}

function FloatingActionPill({ 
  icon: Icon, 
  label, 
  active = false 
}: { 
  icon: React.ElementType; 
  label: string; 
  active?: boolean;
}) {
  return (
    <motion.button
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full transition-colors",
        active 
          ? "bg-white text-black" 
          : "bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/20"
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Icon className="h-4 w-4" />
      <span className="text-sm font-medium">{label}</span>
    </motion.button>
  );
}

function LastUpdatedPill() {
  return (
    <div className="flex items-center gap-1.5 text-white/50 text-xs">
      <span>Updated 2m ago</span>
    </div>
  );
}

export function CinematicHero({ tournament, leaders = [], courseImageUrl }: CinematicHeroProps) {
  const isLive = tournament.status === 'inprogress';
  const isUpcoming = tournament.status === 'scheduled' || tournament.status === 'upcoming';
  
  const backgroundImage = courseImageUrl || getCourseImage({ id: tournament.id });
  
  const location = [tournament.venueCity, tournament.venueCountry]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="relative h-[85vh] min-h-[600px] w-full overflow-hidden" style={{ background: 'var(--th-bg-canvas, #000)' }}>
      {/* Background Image with Ken Burns */}
      <motion.div 
        className="absolute inset-0"
        animate={{ scale: [1, 1.08], x: [0, -20] }}
        transition={{ duration: 30, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
      >
        <img 
          src={backgroundImage}
          alt={tournament.venueName || 'Golf course'}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </motion.div>
      
      {/* Cinematic Gradient Overlay - Reduced for more image visibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-black/25" />
      
      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 pb-44">
        {/* Glass Card */}
        <motion.div 
          className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 max-w-lg"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Status Badge */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {isLive ? (
                <>
                  <LiveIndicator />
                  <span className="text-xs font-bold text-white tracking-wider uppercase">Live Now</span>
                </>
              ) : isUpcoming ? (
                <span className="text-xs font-semibold text-blue-400 tracking-wider uppercase">
                  Coming Up
                </span>
              ) : (
                <span className="text-xs font-semibold text-white/60 tracking-wider uppercase">
                  Completed
                </span>
              )}
            </div>
            {isLive && <LastUpdatedPill />}
          </div>
          
          {/* Tournament Name */}
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-none mb-2">
            {tournament.name}
          </h1>
          
          {/* Venue */}
          <p className="text-white/70 text-base mb-5">
            {tournament.courseName || tournament.venueName}
            {location && ` • ${location}`}
          </p>
          
          {/* Mini Leaderboard (only for live/in-progress) */}
          {isLive && leaders.length > 0 && (
            <MiniLeaderboardGlass leaders={leaders} />
          )}
          
          {/* Purse for upcoming */}
          {isUpcoming && tournament.purse && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-white/50 text-sm">Total Purse</span>
                <span className="text-white font-bold text-lg">
                  ${(tournament.purse / 1000000).toFixed(1)}M
                </span>
              </div>
            </div>
          )}
          
          {/* CTA */}
          <Link to={`/tourhub/tournament/${tournament.id}`}>
            <Button className="mt-4 w-full bg-white text-black hover:bg-white/90 h-12 text-base font-semibold rounded-xl">
              {isLive ? 'View Full Leaderboard' : 'View Tournament'}
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
      
      {/* Floating Actions */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {isLive && <FloatingActionPill icon={Radio} label="Watch" active />}
        <FloatingActionPill icon={BarChart3} label="Stats" />
        <FloatingActionPill icon={MapPin} label="Course" />
        <FloatingActionPill icon={Bell} label="Alert" />
      </div>
    </div>
  );
}
