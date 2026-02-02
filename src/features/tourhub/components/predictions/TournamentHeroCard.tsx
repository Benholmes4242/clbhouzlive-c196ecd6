/**
 * TournamentHeroCard - Full-bleed venue image with tournament info overlay
 * Uses the same course image logic as the hero carousel
 */

import { motion } from 'framer-motion';
import { Calendar, MapPin, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVenueImage } from '../../hooks/useVenueImage';

/**
 * Enhance image URL for maximum resolution
 * Handles common CDN patterns and adds quality parameters
 */
function enhanceImageUrl(url: string): string {
  // For Unsplash images, request maximum quality
  if (url.includes('unsplash.com')) {
    const baseUrl = url.split('?')[0];
    return `${baseUrl}?w=1920&q=90&fm=jpg&fit=crop`;
  }
  
  // For Cloudinary images, request high quality
  if (url.includes('cloudinary.com')) {
    return url.replace('/upload/', '/upload/q_auto:best,f_auto,w_1920/');
  }
  
  // For our media CDN (clbhouz), append quality params if not present
  if (url.includes('media.clbhouz.co.uk') && !url.includes('?')) {
    // These are likely already high quality uploads, return as-is
    return url;
  }
  
  // For other URLs, return as-is
  return url;
}

// Course archetype badge configurations
const ARCHETYPE_CONFIG: Record<string, { badgeBg: string; badgeText: string; icon: string }> = {
  bomber: { 
    badgeBg: 'bg-red-500/30', 
    badgeText: 'text-red-300', 
    icon: '💪' 
  },
  precision: { 
    badgeBg: 'bg-indigo-500/30', 
    badgeText: 'text-indigo-300', 
    icon: '🎯' 
  },
  scrambler: { 
    badgeBg: 'bg-emerald-500/30', 
    badgeText: 'text-emerald-300', 
    icon: '🛡️' 
  },
  balanced: { 
    badgeBg: 'bg-purple-500/30', 
    badgeText: 'text-purple-300', 
    icon: '⚖️' 
  },
  major: { 
    badgeBg: 'bg-amber-500/30', 
    badgeText: 'text-amber-300', 
    icon: '🏆' 
  },
};

// Importance-based colors for skill bars
const IMPORTANCE_BAR_COLORS: Record<string, string> = {
  critical: 'bg-red-400',
  moderate: 'bg-amber-400',
  minor: 'bg-white/50',
};

const IMPORTANCE_TEXT_COLORS: Record<string, string> = {
  critical: 'text-red-300',
  moderate: 'text-amber-300',
  minor: 'text-white/60',
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
  venueCity?: string;
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
      <span className="text-sm w-5">{icon}</span>
      <span className="text-[11px] text-white/80 w-16 truncate">{skill}</span>
      <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", IMPORTANCE_BAR_COLORS[importance])}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(level, 100)}%` }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        />
      </div>
      <span className={cn("text-[10px] w-12 text-right font-medium", IMPORTANCE_TEXT_COLORS[importance])}>
        {IMPORTANCE_LABELS[importance]}
      </span>
    </div>
  );
};

export const TournamentHeroCard = ({
  tournamentName,
  venue,
  venueCity,
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
  
  // Fetch venue image using the same logic as hero carousel
  const venueImageQuery = useVenueImage(venue, venueCity || null);
  const rawImageUrl = venueImageQuery.data?.imageUrl;
  const imageLoading = venueImageQuery.isLoading;
  
  // Enhance image URL for higher resolution where possible
  const imageUrl = rawImageUrl ? enhanceImageUrl(rawImageUrl) : null;
  
  // Show all 4 skills (sorted by importance)
  const topSkills = skills.slice(0, 4);

  return (
    <motion.div
      className="relative w-full overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Full-bleed background image */}
      <div className="absolute inset-0">
        {imageUrl && !imageLoading ? (
          <motion.img
            src={imageUrl}
            alt={venue}
            className="w-full h-full object-cover"
            style={{ 
              imageRendering: 'auto',
              // Force GPU acceleration for sharper rendering
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
            }}
            initial={{ scale: 1.0 }}
            animate={{ scale: 1.02 }}
            transition={{ duration: 12, ease: "linear" }}
            // Eager loading for hero image
            loading="eager"
            decoding="async"
            // Request high-quality image
            srcSet={`${imageUrl} 1x, ${imageUrl} 2x`}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-800 to-emerald-950" />
        )}
        
        {/* Dark overlay for legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/40" />
      </div>

      {/* Content overlay */}
      <div className="relative z-10 px-4 py-5">

        {/* Tournament name */}
        <h3 className="text-xl font-bold text-white mb-1.5 leading-tight drop-shadow-lg">
          {tournamentName}
        </h3>

        {/* Venue + dates row */}
        <div className="flex items-center gap-3 text-white/70 text-xs mb-2">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span className="truncate max-w-[160px]">{venue}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{dates}</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-[11px] mb-4">
          <div className="flex items-center gap-1 text-emerald-400 font-semibold">
            <Trophy className="w-3 h-3" />
            <span>{purse}</span>
          </div>
          <span className="text-white/40">•</span>
          <span className="text-white/60">Par {par}</span>
          <span className="text-white/40">•</span>
          <span className="text-white/60">{yardage.toLocaleString()} yds</span>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/20 mb-3" />

        {/* Course requirements */}
        <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold mb-2">
          What it takes to win
        </p>
        <div className="space-y-1.5">
          {topSkills.map((skill) => (
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
