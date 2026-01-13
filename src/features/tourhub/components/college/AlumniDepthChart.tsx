/**
 * AlumniDepthChart - Grouped alumni sections with contribution chips
 * 
 * Sections:
 * - Stars: Top ranked / winners
 * - Core Contributors: Made cuts / earnings
 * - Next Wave: Rookies / newer pros
 * 
 * Each player shows contribution chip: "+$420k this season"
 */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Users, Sparkles, DollarSign, Trophy, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollegeAlumni, type CollegeAlumnus } from '../../hooks/useCollegeAlumni';
import { PlayerAvatar } from '../PlayerAvatar';

interface AlumniDepthChartProps {
  normalizedName: string;
  className?: string;
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }
  return `$${amount.toFixed(0)}`;
}

interface AlumniRowProps {
  alumnus: CollegeAlumnus;
  index: number;
}

function AlumniRow({ alumnus, index }: AlumniRowProps) {
  const fullName = `${alumnus.first_name} ${alumnus.last_name}`;
  const hasWins = (alumnus.wins || 0) > 0;
  const hasEarnings = (alumnus.earnings || 0) > 0;
  const hasWorldRank = alumnus.world_ranking && alumnus.world_ranking < 500;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link
        to={`/tourhub/player/${alumnus.id}`}
        className={cn(
          'flex items-center gap-3 p-3 rounded-xl',
          'bg-card/60 backdrop-blur-sm',
          'border border-border/30',
          'hover:border-primary/30 hover:bg-card hover:shadow-md',
          'transition-all duration-200',
          'group'
        )}
      >
        {/* Avatar */}
        <PlayerAvatar
          playerId={alumnus.id}
          playerName={fullName}
          fallbackPhotoUrl={alumnus.photo_url}
          size="md"
        />
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {fullName}
          </p>
          
          {/* Contribution Chips */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {/* Earnings chip - primary contribution */}
            {hasEarnings && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600">
                <DollarSign className="w-3 h-3" />
                +{formatCurrency(alumnus.earnings || 0)}
              </span>
            )}
            
            {/* Wins chip */}
            {hasWins && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600">
                <Trophy className="w-3 h-3" />
                {alumnus.wins} win{alumnus.wins !== 1 ? 's' : ''}
              </span>
            )}
            
            {/* World rank chip if notable */}
            {hasWorldRank && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                <Globe className="w-3 h-3" />
                #{alumnus.world_ranking}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

interface SectionProps {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  iconColor: string;
  alumni: CollegeAlumnus[];
}

function Section({ title, subtitle, icon: Icon, iconColor, alumni }: SectionProps) {
  if (alumni.length === 0) return null;
  
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn('w-4 h-4', iconColor)} />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground">({alumni.length})</span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">{subtitle}</p>
      <div className="space-y-2">
        {alumni.map((alumnus, index) => (
          <AlumniRow key={alumnus.id} alumnus={alumnus} index={index} />
        ))}
      </div>
    </div>
  );
}

export function AlumniDepthChart({ normalizedName, className }: AlumniDepthChartProps) {
  // Fetch all alumni (larger limit to categorize)
  const { data: alumni, isLoading, error } = useCollegeAlumni(normalizedName, { 
    orderBy: 'earnings',
    limit: 50 
  });
  
  // Categorize alumni into sections
  const { stars, core, nextWave } = useMemo(() => {
    if (!alumni) return { stars: [], core: [], nextWave: [] };
    
    const stars: CollegeAlumnus[] = [];
    const core: CollegeAlumnus[] = [];
    const nextWave: CollegeAlumnus[] = [];
    
    alumni.forEach(a => {
      // Stars: Top 50 world rank OR has wins
      if ((a.world_ranking && a.world_ranking <= 50) || (a.wins || 0) > 0) {
        stars.push(a);
      }
      // Core: Made cuts and significant earnings but not a star
      else if ((a.cuts_made || 0) >= 5 || (a.earnings || 0) >= 100_000) {
        core.push(a);
      }
      // Next Wave: Everyone else with some activity
      else if ((a.earnings || 0) > 0) {
        nextWave.push(a);
      }
    });
    
    return { stars, core, nextWave };
  }, [alumni]);
  
  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div 
            key={i}
            className="h-[72px] bg-card/50 border border-border/30 rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }
  
  if (error || !alumni?.length) {
    return (
      <div className={cn('text-center py-12 text-sm text-muted-foreground', className)}>
        No alumni found for this college
      </div>
    );
  }
  
  return (
    <div className={className}>
      <Section
        title="Stars"
        subtitle="Top ranked players and winners"
        icon={Star}
        iconColor="text-amber-500"
        alumni={stars}
      />
      
      <Section
        title="Core Contributors"
        subtitle="Consistent performers making cuts"
        icon={Users}
        iconColor="text-primary"
        alumni={core}
      />
      
      <Section
        title="Next Wave"
        subtitle="Rising players building their careers"
        icon={Sparkles}
        iconColor="text-purple-500"
        alumni={nextWave}
      />
    </div>
  );
}
