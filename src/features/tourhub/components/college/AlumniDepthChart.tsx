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

const tierBorderColor: Record<TierAccent, string> = {
  amber: '#f59e0b',
  blue: '#60A5FA',
  green: '#22C55E',
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
        aria-label={`${fullName}, rank ${alumnus.world_ranking || 'N/A'}, ${formatCurrency(alumnus.earnings || 0)}${hasWins ? `, ${alumnus.wins} ${alumnus.wins === 1 ? 'win' : 'wins'}` : ''}`}
        onClick={() => sessionStorage.setItem('college-detail-scroll', String(window.scrollY))}
        className={cn(
          "flex overflow-hidden",
          "bg-card rounded-2xl border border-border/50",
          "hover:border-primary/30 hover:shadow-md",
          "active:scale-[0.98] transition-all"
        )}
        style={{
          minHeight: '100px',
          borderLeftWidth: '3px',
          borderLeftStyle: 'solid',
          borderLeftColor: tierBorderColor[tierAccent],
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        {/* Photo section — 140px left */}
        <div className="relative shrink-0 bg-muted overflow-hidden" style={{ width: '140px', borderRadius: '16px 0 0 16px' }}>
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

        {/* Info section */}
        <div className="flex-1 min-w-0 flex flex-col justify-center" style={{ padding: '12px 12px 12px 14px' }}>
          <h3 className="text-foreground truncate leading-tight" style={{ fontSize: '16px', fontWeight: 600 }}>
            {fullName}
          </h3>

          {/* Meta line */}
          {metaParts.length > 0 && (
            <p className="text-muted-foreground truncate" style={{ fontSize: '13px', fontWeight: 500, marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
              {metaParts.join(' · ')}
            </p>
          )}
        </div>

        {/* Chevron */}
        <div className="flex items-center pr-3 shrink-0">
          <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
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
    <div style={{ marginBottom: '20px' }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full group min-h-[44px]"
        style={{ marginBottom: '10px' }}
      >
        <div className="flex items-center gap-2">
          <Icon className={cn('w-5 h-5', iconColor)} />
          <div className="text-left">
            <h3 className="text-foreground" style={{ fontSize: '16px', fontWeight: 600 }}>{title}</h3>
            <p className="text-muted-foreground" style={{ fontSize: '12px', fontWeight: 400 }}>{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground/50" style={{ fontSize: '13px', fontWeight: 500 }}>
            {alumni.length}
          </span>
          {hasMore && (
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-muted-foreground/40 group-hover:text-foreground transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          )}
        </div>
      </button>
      
      <AnimatePresence initial={false}>
        <motion.div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} initial={false} animate={{ height: 'auto' }}>
          {displayedAlumni.map((alumnus, index) => (
            <AlumniRow key={alumnus.id} alumnus={alumnus} index={index} tierAccent={tierAccent} />
          ))}
        </motion.div>
      </AnimatePresence>
      
      {hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "w-full rounded-lg transition-colors",
            "hover:bg-muted/50",
            "flex items-center justify-center gap-1",
            "min-h-[44px] text-muted-foreground/50"
          )}
          style={{ marginTop: '8px', fontSize: '14px', fontWeight: 600 }}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Show less
            </>
          ) : (
            <>
              View all {alumni.length}
              <ChevronDown className="w-4 h-4" />
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
          <div key={i} className="bg-card/50 border border-border/30 rounded-2xl animate-pulse" style={{ height: '100px' }} />
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
      <Section title="Headliners" subtitle="Elite performers and winners" icon={Crown} iconColor="text-[#f59e0b]" alumni={headliners} defaultExpanded={true} tierAccent="amber" />
      <Section title="Engine Room" subtitle="Reliable contributors making cuts" icon={Cog} iconColor="text-blue-400" alumni={engineRoom} defaultExpanded={engineRoom.length <= 5} tierAccent="blue" />
      <Section title="Pipeline" subtitle="Rising talent building careers" icon={Rocket} iconColor="text-[#22C55E]" alumni={pipeline} defaultExpanded={false} tierAccent="green" />
    </div>
  );
}
