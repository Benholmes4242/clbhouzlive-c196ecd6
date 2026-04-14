/**
 * CollegeCompareSheet - Bottom sheet for quick college comparison
 * Dispatch flat-row design
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useCollegeSeasonStats } from '../../hooks/useCollegeStats';
import { useCollegeMediaMap, type CollegeMedia } from '../../hooks/useCollegeMedia';

type CompareMetric = 'earnings' | 'wins' | 'top10s';

interface CollegeCompareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  college1: string;
  college2: string;
  rivals?: string[];
  onCollegeChange?: (rivalSlug: string) => void;
}

function formatValue(value: number, metric: CompareMetric): string {
  if (metric === 'earnings') {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
    return `$${value}`;
  }
  return value.toString();
}

interface RivalChipProps {
  normalizedName: string;
  college: CollegeMedia | null;
  isSelected: boolean;
  onClick: () => void;
}

function RivalChip({ normalizedName, college, isSelected, onClick }: RivalChipProps) {
  const displayName = college?.short_name || college?.college_name || normalizedName;
  const logoUrl = getCollegeLogoUrl(college?.college_name || displayName);
  return (
    <button onClick={onClick} style={{
      flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7,
      padding: '7px 12px', borderRadius: 8, cursor: 'pointer',
      background: isSelected ? 'rgba(247,147,30,0.06)' : 'transparent',
      border: isSelected ? '1.5px solid rgba(247,147,30,0.35)' : '1px solid rgba(15,23,42,0.1)',
    }}>
      <div style={{ width: 22, height: 22, borderRadius: 6, overflow: 'hidden', background: 'rgba(15,23,42,0.05)', border: '1px solid rgba(15,23,42,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {logoUrl
          ? <img src={logoUrl} alt={displayName} style={{ width: 16, height: 16, objectFit: 'contain' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
          : <span style={{ fontSize: 9, fontWeight: 900, color: 'rgba(15,23,42,0.3)' }}>{displayName.charAt(0)}</span>
        }
      </div>
      <span style={{ fontSize: 12, fontWeight: isSelected ? 800 : 600, color: '#0F172A', whiteSpace: 'nowrap' as const }}>{displayName}</span>
    </button>
  );
}

const METRICS: { key: CompareMetric; label: string }[] = [
  { key: 'earnings', label: 'Earnings' },
  { key: 'wins', label: 'Wins' },
  { key: 'top10s', label: 'Top 10s' },
];

export function CollegeCompareSheet({ 
  isOpen, onClose, college1, college2, rivals = [], onCollegeChange 
}: CollegeCompareSheetProps) {
  const [activeMetric, setActiveMetric] = useState<CompareMetric>('earnings');
  const [selectedCollege2, setSelectedCollege2] = useState(college2);
  
  const { data: allStats, error: statsError } = useCollegeSeasonStats();
  const { data: collegeMap, error: mediaError } = useCollegeMediaMap();

  useEffect(() => {
    if (isOpen && college2) setSelectedCollege2(college2);
  }, [college2, isOpen]);

  const stats1 = allStats?.find(s => s.normalized_name === college1);
  const stats2 = allStats?.find(s => s.normalized_name === selectedCollege2);
  const media1 = collegeMap?.get(college1) || null;
  const media2 = collegeMap?.get(selectedCollege2) || null;

  const hasError = !!(statsError || mediaError);
  const hasNoRivals = rivals.length === 0;

  const getValue = (stats: typeof stats1, metric: CompareMetric): number => {
    if (!stats) return 0;
    switch (metric) {
      case 'earnings': return stats.earnings_total;
      case 'wins': return stats.wins_total;
      case 'top10s': return stats.top10_total;
    }
  };

  const value1 = getValue(stats1, activeMetric);
  const value2 = getValue(stats2, activeMetric);
  
  const handleRivalSelect = (rivalSlug: string) => {
    setSelectedCollege2(rivalSlug);
    onCollegeChange?.(rivalSlug);
  };
  
  const hasValidComparison = college1 && selectedCollege2 && !hasNoRivals;

  return (
    <BottomSheet open={isOpen} onClose={onClose} ariaLabelledBy="compare-sheet-title">
      {/* Header */}
      <div style={{ padding: '6px 20px 14px' }}>
        <div style={{ fontSize: 8.5, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const, marginBottom: 4 }}>College Golf</div>
        <div id="compare-sheet-title" style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em' }}>Head to Head</div>
      </div>

      {/* Error state */}
      {hasError && (
        <div style={{ textAlign: 'center', padding: '32px 20px' }}>
          <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 12 }}>Unable to load college data</div>
          <button onClick={onClose} style={{ padding: '8px 20px', borderRadius: 8, background: '#0F172A', color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer' }}>Close</button>
        </div>
      )}

      {/* No rivals state */}
      {!hasError && hasNoRivals && (
        <div style={{ textAlign: 'center', padding: '32px 20px' }}>
          <div style={{ fontSize: 13, color: '#94A3B8' }}>No rivals defined for this college yet.</div>
        </div>
      )}

      {/* Rival chip selector */}
      {!hasError && rivals.length > 0 && (
        <div style={{ padding: '0 20px 12px' }}>
          <div style={{ fontSize: 9, fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 8 }}>Select Rival</div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' as const }}>
            {rivals.map((rivalSlug) => (
              <RivalChip
                key={rivalSlug}
                normalizedName={rivalSlug}
                college={collegeMap?.get(rivalSlug) || null}
                isSelected={selectedCollege2 === rivalSlug}
                onClick={() => handleRivalSelect(rivalSlug)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Metric — underline tabs */}
      {!hasError && !hasNoRivals && (
        <div style={{ display: 'flex', borderTop: '0.5px solid rgba(15,23,42,0.07)', borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}>
          {METRICS.map(({ key, label }) => {
            const on = activeMetric === key;
            return (
              <button key={key} onClick={() => setActiveMetric(key)} style={{
                flex: 1, padding: '9px 0', fontSize: 11, fontWeight: on ? 800 : 500,
                color: on ? '#0F172A' : '#94A3B8', background: 'transparent', border: 'none',
                borderBottom: `2px solid ${on ? '#F7931E' : 'transparent'}`, cursor: 'pointer',
              }}>{label}</button>
            );
          })}
        </div>
      )}

      {/* VS comparison — flat dispatch block */}
      {!hasError && !hasNoRivals && hasValidComparison && (
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px' }}>
          {/* College 1 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, overflow: 'hidden', background: 'rgba(15,23,42,0.04)', border: '1px solid rgba(15,23,42,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {getCollegeLogoUrl(media1?.college_name || '')
                ? <img src={getCollegeLogoUrl(media1?.college_name || '')} alt="" style={{ width: 26, height: 26, objectFit: 'contain' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
                : <span style={{ fontSize: 14, fontWeight: 900, color: 'rgba(15,23,42,0.3)' }}>{(media1?.short_name || 'C').charAt(0)}</span>
              }
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{media1?.short_name || 'College 1'}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: value1 > value2 ? '#F7931E' : '#94A3B8', letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>
              {formatValue(value1, activeMetric)}
            </div>
          </div>

          {/* VS slug */}
          <div style={{ fontSize: 11, fontWeight: 900, color: 'rgba(15,23,42,0.12)', padding: '0 12px' }}>VS</div>

          {/* College 2 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, overflow: 'hidden', background: 'rgba(15,23,42,0.04)', border: '1px solid rgba(15,23,42,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {getCollegeLogoUrl(media2?.college_name || '')
                ? <img src={getCollegeLogoUrl(media2?.college_name || '')} alt="" style={{ width: 26, height: 26, objectFit: 'contain' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
                : <span style={{ fontSize: 14, fontWeight: 900, color: 'rgba(15,23,42,0.3)' }}>{(media2?.short_name || 'C').charAt(0)}</span>
              }
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{media2?.short_name || 'College 2'}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: value2 > value1 ? '#F7931E' : '#94A3B8', letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>
              {formatValue(value2, activeMetric)}
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      {!hasError && !hasNoRivals && (
        <div style={{ padding: '4px 20px 0' }}>
          {hasValidComparison ? (
            <Link
              to={`/tourhub/college-golf/compare?c1=${college1}&c2=${selectedCollege2}`}
              onClick={onClose}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '13px 0', borderRadius: 10, background: '#0F172A', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', gap: 6 }}
            >
              Full Comparison →
            </Link>
          ) : (
            <div style={{ width: '100%', padding: '13px 0', borderRadius: 10, background: 'rgba(15,23,42,0.05)', color: '#94A3B8', fontSize: 14, fontWeight: 600, textAlign: 'center' as const }}>
              Select a rival to compare
            </div>
          )}
        </div>
      )}

      <div style={{ paddingBottom: 'calc(var(--sab, env(safe-area-inset-bottom, 0px)) + 8px)' }} />
    </BottomSheet>
  );
}
