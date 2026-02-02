/**
 * TournamentHeroCard - Combined tournament info + precision track
 * Merges the dark tournament card with course profile into single container
 */

import { motion } from 'framer-motion';
import { Calendar, MapPin, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

// Course archetype configurations
const ARCHETYPE_CONFIG: Record<string, { gradient: string; badge: string; icon: string }> = {
  bomber: { 
    gradient: 'from-red-600 to-orange-700', 
    badge: "BOMBER'S PARADISE", 
    icon: '💪' 
  },
  precision: { 
    gradient: 'from-blue-600 to-indigo-700', 
    badge: 'PRECISION TRACK', 
    icon: '🎯' 
  },
  scrambler: { 
    gradient: 'from-emerald-600 to-teal-700', 
    badge: "SCRAMBLER'S TEST", 
    icon: '🛡️' 
  },
  balanced: { 
    gradient: 'from-purple-600 to-violet-700', 
    badge: 'ALL-AROUND TEST', 
    icon: '⚖️' 
  },
  major: { 
    gradient: 'from-amber-500 to-yellow-600', 
    badge: 'MAJOR CHAMPIONSHIP', 
    icon: '🏆' 
  },
};

interface SkillRequirement {
  skill: string;
  icon: string;
  level: number; // 0-100
  importance: 'critical' | 'moderate' | 'minor';
}

interface TournamentHeroCardProps {
  tournamentName: string;
  venue: string;
  dates: string;
  purse: string;
  par: number;
  yardage: number;
  archetype: string;
  archetypeLabel: string;
  archetypeDescription: string;
  skills: SkillRequirement[];
}

const SkillBar = ({ skill, icon, level, importance }: SkillRequirement) => {
  const barColor = importance === 'critical' 
    ? 'bg-white' 
    : importance === 'moderate' 
    ? 'bg-white/70' 
    : 'bg-white/40';
  
  const label = importance === 'critical' 
    ? 'Key' 
    : importance === 'moderate' 
    ? 'Important' 
    : 'Minor';

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm w-6">{icon}</span>
      <span className="text-xs text-white/80 w-20 truncate">{skill}</span>
      <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", barColor)}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(level, 100)}%` }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        />
      </div>
      <span className="text-[10px] text-white/60 w-12 text-right">{label}</span>
    </div>
  );
};

export const TournamentHeroCard = ({
  tournamentName,
  venue,
  dates,
  purse,
  par,
  yardage,
  archetype,
  archetypeLabel,
  archetypeDescription,
  skills,
}: TournamentHeroCardProps) => {
  const config = ARCHETYPE_CONFIG[archetype] || ARCHETYPE_CONFIG.balanced;
  
  // Show top 3 skills only
  const topSkills = skills.slice(0, 3);

  return (
    <motion.div
      className={cn(
        "mx-4 rounded-2xl overflow-hidden shadow-lg",
        "bg-gradient-to-br",
        config.gradient
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Top section - Tournament info */}
      <div className="p-4 pb-3">
        {/* Archetype badge */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{config.icon}</span>
          <span className="text-[10px] font-bold tracking-wider text-white/90 uppercase">
            {config.badge}
          </span>
        </div>

        {/* Tournament name */}
        <h3 className="text-lg font-bold text-white mb-1 leading-tight">
          {tournamentName}
        </h3>

        {/* Venue + dates row */}
        <div className="flex items-center gap-3 text-white/70 text-xs mb-2">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span className="truncate max-w-[140px]">{venue}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{dates}</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-[11px] text-white/60">
          <div className="flex items-center gap-1">
            <Trophy className="w-3 h-3" />
            <span>{purse}</span>
          </div>
          <span>•</span>
          <span>Par {par}</span>
          <span>•</span>
          <span>{yardage.toLocaleString()} yds</span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/10 mx-4" />

      {/* Bottom section - Course requirements */}
      <div className="p-4 pt-3">
        <p className="text-[11px] text-white/60 uppercase tracking-wider font-semibold mb-2">
          What it takes to win
        </p>
        <div className="space-y-2">
          {topSkills.map((skill, i) => (
            <SkillBar key={skill.skill} {...skill} />
          ))}
        </div>
        
        {/* Insight */}
        <p className="mt-3 text-xs text-white/50 italic">
          {archetypeDescription}
        </p>
      </div>
    </motion.div>
  );
};
