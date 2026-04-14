/**
 * AlumniDepthChart - Dispatch-style depth chart with tier-colored left borders
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useCollegeAlumni, type CollegeAlumnus } from '../../hooks/useCollegeAlumni';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
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
  amber: '#F7931E',
  blue: '#3B82F6',
  green: '#16A34A',
};

function AlumniRow({ alumnus, index, tierAccent }: AlumniRowProps) {
  const fullName = `${alumnus.first_name} ${alumnus.last_name}`;
  const hasWins = (alumnus.wins || 0) > 0;
  const hasEarnings = (alumnus.earnings || 0) > 0;
  const hasWorldRank = alumnus.world_ranking && alumnus.world_ranking < 500;
  const photoUrl = getPlayerHeadshotUrl(fullName, alumnus.tour_codes?.[0] ?? 'pga');

  const initials = fullName
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
    >
      <Link
        to={`/tourhub/player/${alumnus.id}`}
        aria-label={`${fullName}, rank ${alumnus.world_ranking ?? 'N/A'}, ${formatCurrency(alumnus.earnings ?? 0)}${hasWins ? `, ${alumnus.wins} ${alumnus.wins === 1 ? 'win' : 'wins'}` : ''}`}
        style={{
          display: 'flex', alignItems: 'center',
          padding: '10px 20px',
          borderBottom: '0.5px solid rgba(15,23,42,0.07)',
          borderLeft: `3px solid ${tierBorderColor[tierAccent]}`,
          textDecoration: 'none',
        }}
        className="active:bg-black/[0.02] transition-colors"
      >
        {/* 34px squircle avatar */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '34%', overflow: 'hidden', flexShrink: 0, background: 'rgba(15,23,42,0.06)' }}>
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={fullName}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 5%' }}
                loading="lazy"
                onError={e => { (e.target as HTMLImageElement).src = PLAYER_SILHOUETTE_URL; }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8' }}>{initials}</span>
              </div>
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, letterSpacing: '-0.2px' }}>
              {fullName}
            </div>
            {hasWorldRank && (
              <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '1px' }}>
                #{alumnus.world_ranking} OWGR
              </div>
            )}
          </div>
        </div>

        {/* OWGR number */}
        <span style={{ width: '48px', textAlign: 'right' as const, fontSize: '12px', color: '#94A3B8', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
          {hasWorldRank ? `#${alumnus.world_ranking}` : '—'}
        </span>

        {/* Earnings */}
        <span style={{ width: '56px', textAlign: 'right' as const, fontSize: '13px', fontWeight: 700, color: '#F7931E', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
          {hasEarnings ? formatCurrency(alumnus.earnings ?? 0) : '—'}
        </span>

        {/* Wins */}
        <span style={{ width: '28px', textAlign: 'right' as const, fontSize: '12px', fontWeight: 600, color: '#64748B', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
          {alumnus.wins ?? 0}
        </span>
      </Link>
    </motion.div>
  );
}

interface SectionProps {
  title: string;
  subtitle: string;
  alumni: CollegeAlumnus[];
  defaultExpanded?: boolean;
  tierAccent: TierAccent;
}

function Section({ title, subtitle, alumni, defaultExpanded = true, tierAccent }: SectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const COLLAPSED_COUNT = 3;
  
  if (alumni.length === 0) return null;
  
  const displayedAlumni = isExpanded ? alumni : alumni.slice(0, COLLAPSED_COUNT);
  const hasMore = alumni.length > COLLAPSED_COUNT;
  
  return (
    <div style={{ marginBottom: 0 }}>
      {/* Dispatch rule header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' as const, borderTop: '0.5px solid rgba(15,23,42,0.07)' }}
      >
        <div style={{ width: 3, height: 14, background: tierBorderColor[tierAccent], borderRadius: 1, flexShrink: 0 }} />
        <span style={{ fontSize: '12px', fontWeight: 900, color: tierBorderColor[tierAccent], letterSpacing: '0.16em', textTransform: 'uppercase' as const, flex: 1 }}>
          {title} · {subtitle}
        </span>
        <span style={{ fontSize: '12px', color: '#94A3B8' }}>{alumni.length}</span>
        <span style={{ fontSize: '12px', color: '#CBD5E1', marginLeft: '4px' }}>
          {isExpanded ? '▾' : '▸'}
        </span>
      </button>

      {isExpanded && (
        <>
          {/* Column headers */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '4px 20px', background: 'rgba(15,23,42,0.02)', borderTop: '0.5px solid rgba(15,23,42,0.07)', borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}>
            <span style={{ flex: 1, fontSize: '12px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em' }}>PLAYER</span>
            <span style={{ width: '48px', textAlign: 'right' as const, fontSize: '12px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', flexShrink: 0 }}>OWGR</span>
            <span style={{ width: '56px', textAlign: 'right' as const, fontSize: '12px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', flexShrink: 0 }}>EARN</span>
            <span style={{ width: '28px', textAlign: 'right' as const, fontSize: '12px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', flexShrink: 0 }}>W</span>
          </div>

          {displayedAlumni.map((alumnus, index) => (
            <AlumniRow key={alumnus.id} alumnus={alumnus} index={index} tierAccent={tierAccent} />
          ))}

          {hasMore && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              style={{ width: '100%', padding: '10px 0', fontSize: '12px', fontWeight: 700, color: '#0F172A', background: 'transparent', border: 'none', borderTop: '0.5px solid rgba(15,23,42,0.07)', cursor: 'pointer' }}
            >
              {isExpanded ? `View all ${alumni.length} ▾` : 'Show less ▴'}
            </button>
          )}
        </>
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
      } else if ((a.cuts_made || 0) >= 3 || (a.earnings || 0) >= 75_000) {
        engineRoom.push(a);
      } else {
        pipeline.push(a);
      }
    });
    
    return { headliners, engineRoom, pipeline };
  }, [alumni]);
  
  if (isLoading) {
    return (
      <div className={cn('', className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 20px', borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '34%', background: 'rgba(15,23,42,0.06)', flexShrink: 0 }} />
            <div style={{ flex: 1, height: '13px', borderRadius: '4px', background: 'rgba(15,23,42,0.06)' }} />
            <div style={{ width: '56px', height: '12px', borderRadius: '4px', background: 'rgba(15,23,42,0.06)' }} />
          </div>
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
    <div className={cn('', className)}>
      <Section title="Stars" subtitle="Top ranked & winners" alumni={headliners} defaultExpanded={true} tierAccent="amber" />
      <Section title="Regulars" subtitle="Consistent performers on tour" alumni={engineRoom} defaultExpanded={engineRoom.length <= 5} tierAccent="blue" />
      <Section title="Rising" subtitle="Building their tour career" alumni={pipeline} defaultExpanded={false} tierAccent="green" />
    </div>
  );
}
