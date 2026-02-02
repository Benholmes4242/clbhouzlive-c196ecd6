/**
 * TournamentHeroCard - Combined tournament info + precision track
 * Dark premium aesthetic with skill bars colored by importance
 */

import { motion } from 'framer-motion';
import { Calendar, MapPin, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

// Course archetype badge configurations
const ARCHETYPE_CONFIG: Record<string, { badgeBg: string; badgeText: string; icon: string }> = {
  bomber: { 
    badgeBg: 'bg-red-500/20', 
    badgeText: 'text-red-400', 
    icon: '💪' 
  },
  precision: { 
    badgeBg: 'bg-indigo-500/20', 
    badgeText: 'text-indigo-400', 
    icon: '🎯' 
  },
  scrambler: { 
    badgeBg: 'bg-emerald-500/20', 
    badgeText: 'text-emerald-400', 
    icon: '🛡️' 
  },
  balanced: { 
    badgeBg: 'bg-purple-500/20', 
    badgeText: 'text-purple-400', 
    icon: '⚖️' 
  },
  major: { 
    badgeBg: 'bg-amber-500/20', 
    badgeText: 'text-amber-400', 
    icon: '🏆' 
  },
};

// Importance-based colors for skill bars
const IMPORTANCE_BAR_COLORS: Record<string, string> = {
  critical: 'bg-red-500',
  moderate: 'bg-amber-500',
  minor: 'bg-gray-400',
};

const IMPORTANCE_TEXT_COLORS: Record<string, string> = {
  critical: 'text-red-400',
  moderate: 'text-amber-400',
  minor: 'text-gray-500',
};

const IMPORTANCE_LABELS: Record<string, string> = {
  critical: 'Key',
  moderate: 'Important',
  minor: 'Minor',
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
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm w-6">{icon}</span>
      <span className="text-xs text-slate-300 w-20 truncate">{skill}</span>
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", IMPORTANCE_BAR_COLORS[importance])}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(level, 100)}%` }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        />
      </div>
      <span className={cn("text-[10px] w-14 text-right font-medium", IMPORTANCE_TEXT_COLORS[importance])}>
        {IMPORTANCE_LABELS[importance]}
      </span>
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
  
  // Show all 4 skills (sorted by importance)
  const topSkills = skills.slice(0, 4);

  return (
    <motion.div
      className="mx-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 shadow-xl overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Top section - Tournament info */}
      <div className="pb-3">
        {/* Archetype badge */}
        <div className="flex items-center gap-2 mb-2">
          <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-full", config.badgeBg)}>
            <span className="text-sm">{config.icon}</span>
            <span className={cn("text-[10px] font-bold tracking-wider uppercase", config.badgeText)}>
              {archetypeLabel}
            </span>
          </div>
        </div>

        {/* Tournament name */}
        <h3 className="text-lg font-bold text-white mb-1 leading-tight">
          {tournamentName}
        </h3>

        {/* Venue + dates row */}
        <div className="flex items-center gap-3 text-slate-400 text-xs mb-2">
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
        <div className="flex items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1 text-emerald-400 font-semibold">
            <Trophy className="w-3 h-3" />
            <span>{purse}</span>
          </div>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">Par {par}</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">{yardage.toLocaleString()} yds</span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-slate-700 -mx-4 mb-3" />

      {/* Bottom section - Course requirements */}
      <div>
        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-2">
          What it takes to win
        </p>
        <div className="space-y-2">
          {topSkills.map((skill) => (
            <SkillBar key={skill.skill} {...skill} />
          ))}
        </div>
        
        {/* Insight */}
        <p className="mt-3 text-xs text-slate-400 italic">
          {archetypeDescription}
        </p>
      </div>
    </motion.div>
  );
};
