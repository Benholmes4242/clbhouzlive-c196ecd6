import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';
import { useCollegeRivalries } from '../../hooks/useCollegeMovers';
import { useCollegeSeasonStats } from '../../hooks/useCollegeStats';

interface CollegeRivalsCarouselProps {
  normalizedName: string;
  className?: string;
  onCompare?: (rivalNormalizedName: string) => void;
}

export function CollegeRivalsCarousel({ normalizedName, className, onCompare }: CollegeRivalsCarouselProps) {
  const { data: rivalries, isLoading } = useCollegeRivalries(normalizedName);
  const { data: allStats } = useCollegeSeasonStats();
  
  const enrichedRivalries = useMemo(() => {
    if (!rivalries || !allStats) return [];
    
    const myStats = allStats.find(s => s.normalized_name === normalizedName);
    if (!myStats) return rivalries.map(r => ({ ...r, h2h: null }));
    
    return rivalries.map(rivalry => {
      const rivalStats = allStats.find(s => s.normalized_name === rivalry.rivalNormalizedName);
      if (!rivalStats) return { ...rivalry, h2h: null };
      
      let winsA = 0;
      let winsB = 0;
      
      if (myStats.earnings_total > rivalStats.earnings_total) winsA++;
      else if (rivalStats.earnings_total > myStats.earnings_total) winsB++;
      
      if (myStats.wins_total > rivalStats.wins_total) winsA++;
      else if (rivalStats.wins_total > myStats.wins_total) winsB++;
      
      if (myStats.top10_total > rivalStats.top10_total) winsA++;
      else if (rivalStats.top10_total > myStats.top10_total) winsB++;
      
      const earningsDiff = myStats.earnings_total - rivalStats.earnings_total;
      
      return {
        ...rivalry,
        h2h: {
          winsA,
          winsB,
          earningsDiff,
          winner: winsA > winsB ? 'A' : winsB > winsA ? 'B' : 'tie',
        } as const,
      };
    });
  }, [rivalries, allStats, normalizedName]);
  
  if (isLoading) {
    return (
      <div style={{ background: '#ffffff', borderTop: '1px solid rgba(15,23,42,0.07)', borderBottom: '1px solid rgba(15,23,42,0.07)' }}>
        <div style={{ padding: '14px 20px 0' }}>
          <div className="animate-pulse" style={{ width: '60px', height: '9px', borderRadius: '4px', background: 'rgba(15,23,42,0.06)', marginBottom: '10px' }} />
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 20px', borderBottom: '0.5px solid rgba(15,23,42,0.07)', height: '52px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(15,23,42,0.06)' }} />
            <div style={{ flex: 1, height: '14px', borderRadius: '4px', background: 'rgba(15,23,42,0.06)' }} />
            <div style={{ width: '72px', height: '20px', borderRadius: '5px', background: 'rgba(15,23,42,0.06)' }} />
          </div>
        ))}
      </div>
    );
  }

  if (!enrichedRivalries?.length) return null;

  const sectionTitle = rivalries?.every(r => r.isFallback) ? 'Similar Programs' : 'Rivals';

  return (
    <div className={className} style={{ background: '#ffffff', borderTop: '1px solid rgba(15,23,42,0.07)', borderBottom: '1px solid rgba(15,23,42,0.07)' }}>
      {/* Section rule marker */}
      <div style={{ padding: '14px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <div style={{ width: 3, height: 14, background: '#0F172A', borderRadius: 1, flexShrink: 0 }} />
          <span style={{ fontSize: '10px', fontWeight: 900, color: '#0F172A', letterSpacing: '0.16em', textTransform: 'uppercase' as const, flex: 1 }}>
            {sectionTitle}
          </span>
        </div>
      </div>

      {/* Column headers */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '5px 20px', background: 'rgba(15,23,42,0.02)', borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}>
        <span style={{ flex: 1, fontSize: '10px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em' }}>PROGRAM</span>
        <span style={{ width: '44px', textAlign: 'right' as const, fontSize: '10px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', flexShrink: 0 }}>WIN</span>
        <span style={{ width: '52px', textAlign: 'right' as const, fontSize: '10px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', flexShrink: 0 }}>EARN</span>
        <span style={{ width: '80px', textAlign: 'right' as const, fontSize: '10px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', flexShrink: 0 }}>HEAD-TO-HEAD</span>
      </div>

      {enrichedRivalries.map((rivalry, i) => {
        const rivalName = rivalry.rivalNormalizedName;
        const college = rivalry.college;
        const displayName = college?.short_name || college?.college_name || rivalName;
        const logoUrl = getCollegeLogoUrl(college?.college_name || rivalName);
        const rivalStats = allStats?.find(s => s.normalized_name === rivalName);
        const isWinning = rivalry.h2h?.winner === 'A';
        const isTied = rivalry.h2h?.winner === 'tie';
        const h2hLabel = rivalry.h2h
          ? isTied
            ? 'Tied'
            : isWinning
            ? `Leading ${rivalry.h2h.winsA}–${rivalry.h2h.winsB}`
            : `Trailing ${rivalry.h2h.winsA}–${rivalry.h2h.winsB}`
          : null;
        const h2hColor = isTied ? '#94A3B8' : isWinning ? '#16A34A' : '#DC2626';
        const h2hBg = isTied ? 'rgba(15,23,42,0.05)' : isWinning ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)';

        const rowContent = (
          <div
            style={{ display: 'flex', alignItems: 'center', padding: '11px 20px', borderBottom: i < enrichedRivalries.length - 1 ? '0.5px solid rgba(15,23,42,0.07)' : 'none' }}
          >
            {/* Logo chip + name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', flex: 1, minWidth: 0 }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0, background: 'rgba(15,23,42,0.04)', border: '1px solid rgba(15,23,42,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={displayName}
                    style={{ width: '22px', height: '22px', objectFit: 'contain' }}
                    loading="lazy"
                    onError={e => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <span style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(15,23,42,0.3)' }}>{displayName.charAt(0)}</span>
                )}
              </div>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                {displayName}
              </span>
            </div>

            {/* Wins */}
            <span style={{ width: '44px', textAlign: 'right' as const, fontSize: '12px', fontWeight: 600, color: '#64748B', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
              {rivalStats?.wins_total ?? '—'}
            </span>

            {/* Earnings compact */}
            <span style={{ width: '52px', textAlign: 'right' as const, fontSize: '12px', fontWeight: 600, color: '#64748B', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
              {rivalStats ? `$${(rivalStats.earnings_total / 1_000_000).toFixed(0)}M` : '—'}
            </span>

            {/* H2H chip */}
            {h2hLabel && (
              <div style={{ width: '80px', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: h2hColor, background: h2hBg, padding: '3px 7px', borderRadius: '5px', whiteSpace: 'nowrap' as const }}>
                  {h2hLabel}
                </span>
              </div>
            )}
          </div>
        );

        if (onCompare) {
          return (
            <button
              key={rivalry.id || rivalName}
              onClick={() => onCompare(rivalName)}
              style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' as const }}
              className="active:bg-black/[0.02] transition-colors"
            >
              {rowContent}
            </button>
          );
        }

        return (
          <Link
            key={rivalry.id || rivalName}
            to={`/tourhub/college-golf/compare?c1=${normalizedName}&c2=${rivalName}`}
            style={{ display: 'block', textDecoration: 'none' }}
            className="active:bg-black/[0.02] transition-colors"
          >
            {rowContent}
          </Link>
        );
      })}

      {/* Compare footer link */}
      <div style={{ padding: '10px 20px', borderTop: '0.5px solid rgba(15,23,42,0.07)', textAlign: 'center' as const }}>
        <span
          onClick={onCompare ? () => onCompare(enrichedRivalries[0]?.rivalNormalizedName ?? '') : undefined}
          style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', cursor: 'pointer' }}
        >
          Compare franchises ›
        </span>
      </div>
    </div>
  );
}
