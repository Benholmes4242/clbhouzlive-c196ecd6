/**
 * AlumniDepthChart - Squad-style depth chart with expand/collapse sections
 * 
 * Sections (franchise-style naming):
 * - Headliners: Top ranked / winners (formerly "Stars")
 * - Engine Room: Made cuts / earnings (formerly "Core Contributors")
 * - Pipeline: Rookies / newer pros (formerly "Next Wave")
 * 
 * Each player shows contribution chips: earnings, wins (if any), rank (if notable)
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Cog, Rocket, DollarSign, Trophy, Globe, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollegeAlumni, type CollegeAlumnus } from '../../hooks/useCollegeAlumni';
import { PlayerAvatar } from '../PlayerAvatar';

interface AlumniDepthChartProps {
  normalizedName: string;
  className?: string;
}

import { formatCurrency } from '@/lib/utils/formatCurrency';

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
          
          {/* Contribution Chips - earnings, wins, rank */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {/* Earnings chip - primary contribution */}
            {hasEarnings && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600">
                <DollarSign className="w-3 h-3" />
                {formatCurrency(alumnus.earnings || 0)}
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
  defaultExpanded?: boolean;
}

function Section({ title, subtitle, icon: Icon, iconColor, alumni, defaultExpanded = true }: SectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const COLLAPSED_COUNT = 3;
  
  if (alumni.length === 0) return null;
  
  const displayedAlumni = isExpanded ? alumni : alumni.slice(0, COLLAPSED_COUNT);
  const hasMore = alumni.length > COLLAPSED_COUNT;
  
  return (
    <div className="mb-6">
      {/* Section Header - Tappable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full mb-3 group"
      >
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center",
            "bg-muted/50"
          )}>
            <Icon className={cn('w-4 h-4', iconColor)} />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-foreground">{title}</h3>
            <p className="text-[11px] text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
            {alumni.length}
          </span>
          {hasMore && (
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-muted-foreground group-hover:text-foreground transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          )}
        </div>
      </button>
      
      {/* Alumni List */}
      <AnimatePresence initial={false}>
        <motion.div 
          className="space-y-2"
          initial={false}
          animate={{ height: 'auto' }}
        >
          {displayedAlumni.map((alumnus, index) => (
            <AlumniRow key={alumnus.id} alumnus={alumnus} index={index} />
          ))}
        </motion.div>
      </AnimatePresence>
      
      {/* View All / Collapse toggle */}
      {hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "w-full mt-2 py-2 text-xs font-medium text-primary",
            "hover:bg-primary/5 rounded-lg transition-colors",
            "flex items-center justify-center gap-1"
          )}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              Show less
            </>
          ) : (
            <>
              View all {alumni.length}
              <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      )}
    </div>
  );
}

export function AlumniDepthChart({ normalizedName, className }: AlumniDepthChartProps) {
  // Fetch all alumni (larger limit to categorize)
  const { data: alumni, isLoading, error } = useCollegeAlumni(normalizedName, { 
    orderBy: 'earnings',
    limit: 50 
  });
  
  // Categorize alumni into sections (franchise-style)
  const { headliners, engineRoom, pipeline } = useMemo(() => {
    if (!alumni) return { headliners: [], engineRoom: [], pipeline: [] };
    
    const headliners: CollegeAlumnus[] = [];
    const engineRoom: CollegeAlumnus[] = [];
    const pipeline: CollegeAlumnus[] = [];
    
    alumni.forEach(a => {
      // Headliners: Top 50 world rank OR has wins
      if ((a.world_ranking && a.world_ranking <= 50) || (a.wins || 0) > 0) {
        headliners.push(a);
      }
      // Engine Room: Made cuts and significant earnings but not a headliner
      else if ((a.cuts_made || 0) >= 5 || (a.earnings || 0) >= 100_000) {
        engineRoom.push(a);
      }
      // Pipeline: Everyone else with some activity
      else if ((a.earnings || 0) > 0) {
        pipeline.push(a);
      }
    });
    
    return { headliners, engineRoom, pipeline };
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
        title="Headliners"
        subtitle="Elite performers and winners"
        icon={Crown}
        iconColor="text-amber-500"
        alumni={headliners}
        defaultExpanded={true}
      />
      
      <Section
        title="Engine Room"
        subtitle="Reliable contributors making cuts"
        icon={Cog}
        iconColor="text-primary"
        alumni={engineRoom}
        defaultExpanded={engineRoom.length <= 5}
      />
      
      <Section
        title="Pipeline"
        subtitle="Rising talent building careers"
        icon={Rocket}
        iconColor="text-purple-500"
        alumni={pipeline}
        defaultExpanded={false}
      />
    </div>
  );
}
