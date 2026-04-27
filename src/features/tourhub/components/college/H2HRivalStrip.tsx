/**
 * H2HRivalStrip — inline horizontal-scroll rival strip on the College
 * Franchise individual page (Phase 1 fix step). Replaces the legacy
 * CollegeRivalsCarousel + Compare bottom-sheet pair with a direct
 * tap-through to the H2H comparison page.
 *
 * Data source: useCollegeRivalries — already implements the spec's
 * earnings-proximity fallback (E28(c)). Subtitle is derived as a prop:
 *   - real college_rivalries row → "Conference rival" (placeholder until
 *     a context_label column is added in Phase 2)
 *   - earnings-proximity fallback row → "Top program"
 *
 * Layout: 3 rival cards + a "Browse all" terminal card. Tap a card to
 * route to the H2H page with the rival pre-selected.
 */

import { Link } from 'react-router-dom';
import { ArrowLeftRight, ChevronRight } from 'lucide-react';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';
import { useCollegeRivalries } from '../../hooks/useCollegeMovers';
import { collegeH2HRoute } from '../../routes';
import { PlayerInitialAvatar } from '../shared/PlayerInitialAvatar';

interface H2HRivalStripProps {
  normalizedName: string;
  className?: string;
}

const SECTION_PADDING = '14px 16px 0';

export function H2HRivalStrip({ normalizedName, className }: H2HRivalStripProps) {
  const { data: rivalries, isLoading } = useCollegeRivalries(normalizedName);

  if (isLoading) {
    return (
      <div className={className} style={{ background: '#fff', borderTop: '1px solid rgba(15,23,42,0.07)', borderBottom: '1px solid rgba(15,23,42,0.07)', marginTop: 8 }}>
        <SectionHeader />
        <div style={{ display: 'flex', gap: 10, padding: '4px 16px 16px', overflowX: 'auto' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse" style={{ flexShrink: 0, width: 168, height: 78, borderRadius: 12, background: 'rgba(15,23,42,0.06)' }} />
          ))}
        </div>
      </div>
    );
  }

  const rivals = (rivalries ?? []).slice(0, 3);
  if (rivals.length === 0) return null;

  return (
    <div className={className} style={{ background: '#fff', borderTop: '1px solid rgba(15,23,42,0.07)', borderBottom: '1px solid rgba(15,23,42,0.07)', marginTop: 8 }}>
      <SectionHeader />
      <div
        style={{
          display: 'flex', gap: 10,
          padding: '4px 16px 16px',
          overflowX: 'auto',
          scrollbarWidth: 'none' as const,
          WebkitOverflowScrolling: 'touch',
        }}
        className="[&::-webkit-scrollbar]:hidden"
      >
        {rivals.map(r => {
          const college = r.college;
          const displayName = college?.short_name || college?.college_name || r.rivalNormalizedName;
          const logoUrl = getCollegeLogoUrl(college?.college_name || displayName);
          // Spec subtitle: real rivalry → "Conference rival" (until context_label
          // ships in Phase 2); fallback row → "Top program".
          const subtitle = r.isFallback ? 'Top program' : 'Conference rival';

          return (
            <Link
              key={r.rivalNormalizedName}
              to={collegeH2HRoute(normalizedName, r.rivalNormalizedName)}
              style={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: 200,
                padding: '12px 12px',
                borderRadius: 12,
                background: '#F8FAFC',
                border: '1px solid rgba(15,23,42,0.08)',
                textDecoration: 'none',
              }}
              className="active:scale-[0.98] transition-transform"
            >
              <PlayerInitialAvatar
                name={displayName}
                src={logoUrl}
                size={28}
                radius={8}
                imageScale={0.78}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.2px' }}>
                  {displayName}
                </div>
                <div style={{ fontSize: 10, fontWeight: 500, color: '#64748B', marginTop: 1 }}>
                  {subtitle}
                </div>
              </div>
              <ArrowLeftRight size={13} strokeWidth={2.5} style={{ color: '#F7931E', flexShrink: 0 }} />
            </Link>
          );
        })}

        {/* Browse all terminal card */}
        <Link
          to={collegeH2HRoute(normalizedName)}
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '12px 14px',
            borderRadius: 12,
            background: '#fff',
            border: '1px dashed rgba(15,23,42,0.18)',
            textDecoration: 'none',
          }}
          className="active:scale-[0.98] transition-transform"
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>Browse all</span>
          <ChevronRight size={14} strokeWidth={2.5} style={{ color: '#94A3B8' }} />
        </Link>
      </div>
    </div>
  );
}

function SectionHeader() {
  return (
    <div style={{ padding: SECTION_PADDING }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <div style={{ width: 3, height: 12, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 800, color: '#F7931E', letterSpacing: '1.4px', textTransform: 'uppercase' as const }}>
          Head-to-Head
        </span>
      </div>
      <div style={{ fontSize: 12, fontWeight: 500, color: '#64748B', marginBottom: 10, paddingLeft: 13 }}>
        Compare with another program
      </div>
    </div>
  );
}
