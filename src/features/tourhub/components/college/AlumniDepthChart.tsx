/**
 * AlumniDepthChart - Squad-style depth chart with tier-colored left borders
 * Photos resolved via pga_tour_id for Cloudinary CDN quality.
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Cog, Rocket, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollegeAlumni, type CollegeAlumnus } from '../../hooks/useCollegeAlumni';
import { resolvePhotoUrl } from '../../utils/resolvePhotoUrl';
import { formatCurrency } from '@/lib/utils/formatCurrency';

interface AlumniDepthChartProps {
  normalizedName: string;
  className?: string;
}

type TierAccent = 'amber' | 'blue' | 'green';

interface AlumniRowProps {
  alumnus: CollegeAlumnus;
  index: number;
  tierAccent: TierAccent;
}

const tierBorderClass: Record<TierAccent, string> = {
  amber: 'border-l-4 border-l-amber-400',
  blue: 'border-l-4 border-l-blue-400',
  green: 'border-l-4 border-l-green-400',
};

function AlumniRow({ alumnus, index, tierAccent }: AlumniRowProps) {
  const fullName = `${alumnus.first_name} ${alumnus.last_name}`;
  const hasWins = (alumnus.wins || 0) > 0;
  const hasEarnings = (alumnus.earnings || 0) > 0;
  const hasWorldRank = alumnus.world_ranking && alumnus.world_ranking < 500;
  const photoUrl = resolvePhotoUrl(alumnus.photo_url, alumnus.pga_tour_id);

  const initials = fullName
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Build meta line: #N OWGR · $X.XM · X wins
  const metaParts: string[] = [];
  if (hasWorldRank) metaParts.push(`#${alumnus.world_ranking} OWGR`);
  if (hasEarnings) metaParts.push(formatCurrency(alumnus.earnings || 0));
  if (hasWins) metaParts.push(`${alumnus.wins} ${alumnus.wins === 1 ? 'win' : 'wins'}`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
    >
      <Link
        to={`/tourhub/player/${alumnus.id}`}
        className={cn(
          "flex overflow-hidden",
          "bg-card rounded-xl border border-border/40 shadow-sm",
          tierBorderClass[tierAccent],
          "hover:border-primary/30 hover:shadow-md",
          "active:scale-[0.98] transition-all"
        )}
        style={{ height: '110px' }}
      >
        {/* Photo section — left */}
        <div className="relative w-[110px] shrink-0 bg-muted overflow-hidden">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={fullName}
              className="w-full h-full object-cover object-top"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
              <span className="text-2xl font-bold text-muted-foreground/40">{initials}</span>
            </div>
          )}
        </div>

        {/* Info section — right */}
        <div className="flex-1 min-w-0 px-3.5 py-3 flex flex-col justify-center">
          <h3 className="text-base font-semibold text-foreground truncate leading-tight">
            {fullName}
          </h3>

          {/* Meta line */}
          {metaParts.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1.5 tabular-nums truncate">
              {metaParts.join(' · ')}
            </p>
          )}
        </div>

        {/* Chevron */}
        <div className="flex items-center pr-3 shrink-0">
          <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
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
  tierAccent: TierAccent;
}

function Section({ title, subtitle, icon: Icon, iconColor, alumni, defaultExpanded = true, tierAccent }: SectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const COLLAPSED_COUNT = 3;
  
  if (alumni.length === 0) return null;
  
  const displayedAlumni = isExpanded ? alumni : alumni.slice(0, COLLAPSED_COUNT);
  const hasMore = alumni.length > COLLAPSED_COUNT;
  
  return (
    <div className="mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full mb-3 group min-h-[44px]"
      >
        <div className="flex items-center gap-2">
          <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", "bg-muted/50")}>
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
      
      <AnimatePresence initial={false}>
        <motion.div className="space-y-2" initial={false} animate={{ height: 'auto' }}>
          {displayedAlumni.map((alumnus, index) => (
            <AlumniRow key={alumnus.id} alumnus={alumnus} index={index} tierAccent={tierAccent} />
          ))}
        </motion.div>
      </AnimatePresence>
      
      {hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "w-full mt-2 py-2.5 text-xs font-medium text-muted-foreground",
            "hover:bg-muted/50 rounded-lg transition-colors",
            "flex items-center justify-center gap-1",
            "min-h-[44px]"
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
  const { data: alumni, isLoading, error } = useCollegeAlumni(normalizedName, { 
    orderBy: 'earnings',
    limit: 50 
  });
  
  const { headliners, engineRoom, pipeline } = useMemo(() => {
    if (!alumni) return { headliners: [], engineRoom: [], pipeline: [] };
    
    const headliners: CollegeAlumnus[] = [];
    const engineRoom: CollegeAlumnus[] = [];
    const pipeline: CollegeAlumnus[] = [];
    
    alumni.forEach(a => {
      if ((a.world_ranking && a.world_ranking <= 50) || (a.wins || 0) > 0) {
        headliners.push(a);
      } else if ((a.cuts_made || 0) >= 5 || (a.earnings || 0) >= 100_000) {
        engineRoom.push(a);
      } else if ((a.earnings || 0) > 0) {
        pipeline.push(a);
      }
    });
    
    return { headliners, engineRoom, pipeline };
  }, [alumni]);
  
  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-[110px] bg-card/50 border border-border/30 rounded-xl animate-pulse" />
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
      <Section title="Headliners" subtitle="Elite performers and winners" icon={Crown} iconColor="text-amber-500" alumni={headliners} defaultExpanded={true} tierAccent="amber" />
      <Section title="Engine Room" subtitle="Reliable contributors making cuts" icon={Cog} iconColor="text-blue-400" alumni={engineRoom} defaultExpanded={engineRoom.length <= 5} tierAccent="blue" />
      <Section title="Pipeline" subtitle="Rising talent building careers" icon={Rocket} iconColor="text-green-500" alumni={pipeline} defaultExpanded={false} tierAccent="green" />
    </div>
  );
}
