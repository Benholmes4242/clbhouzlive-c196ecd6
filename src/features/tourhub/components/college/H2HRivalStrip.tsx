/**
 * H2HRivalStrip — inline horizontal-scroll rival strip on the College
 * Franchise individual page (Phase 1 fix step). Replaces the legacy
 * CollegeRivalsCarousel + Compare bottom-sheet pair with a direct
 * tap-through to the H2H comparison page.
 *
 * Data source: useCollegeRivalries — already implements the spec's
 * earnings-proximity fallback (E28(c)). Subtitle is derived in priority order:
 *   1. college_rivalries.context_label (editorial, e.g. "In-state rival")
 *   2. real rivalry row without label → "Conference rival"
 *   3. earnings-proximity fallback row → "Top program"
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
import { AMBER, HAIRLINE_INK_8, INK, INK_FAINT, INK_MUTE, INK_TINT_06, INK_TINT_07, SLATE_50, SURFACE } from '../../_shared/tokens';

interface H2HRivalStripProps {
  normalizedName: string;
  className?: string;
}

const SECTION_PADDING = '14px 16px 0';

export function H2HRivalStrip({ normalizedName, className }: H2HRivalStripProps) {
  const { data: rivalries, isLoading } = useCollegeRivalries(normalizedName);

  if (isLoading) {
    return (
      <div className={className} style={{ background: SLATE_50, borderTop: `0.5px solid ${INK_TINT_07}` }}>

        <SectionHeader />
        <div style={{ display: 'flex', gap: 10, padding: '4px 16px 16px', overflowX: 'auto' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse" style={{ flexShrink: 0, width: 168, height: 78, borderRadius: 12, background: INK_TINT_06 }} />
          ))}
        </div>
      </div>
    );
  }

  const rivals = (rivalries ?? []).slice(0, 3);
  if (rivals.length === 0) return null;

  return (
    <div className={className} style={{ background: SLATE_50, borderTop: `0.5px solid ${INK_TINT_07}` }}>
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
          // Editorial label from college_rivalries.context_label when present;
          // fall back to generic copy distinguishing real vs proximity-fallback rows.
          const subtitle = r.context_label ?? (r.isFallback ? 'Top program' : 'Conference rival');

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
                background: SLATE_50,
                border: `1px solid ${HAIRLINE_INK_8}`,
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
                imageBg="#FFFFFF"
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.015em' }}>
                  {displayName}
                </div>
                <div style={{ fontSize: 10, fontWeight: 500, color: INK_MUTE, marginTop: 1 }}>
                  {subtitle}
                </div>
              </div>
              <ArrowLeftRight size={13} strokeWidth={2.5} style={{ color: AMBER, flexShrink: 0 }} />
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
            background: SURFACE,
            border: '1px dashed rgba(15,23,42,0.18)',
            textDecoration: 'none',
          }}
          className="active:scale-[0.98] transition-transform"
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: INK }}>Browse all</span>
          <ChevronRight size={14} strokeWidth={2.5} style={{ color: INK_FAINT }} />
        </Link>
      </div>
    </div>
  );
}

function SectionHeader() {
  return (
    <div style={{ padding: SECTION_PADDING }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 9, fontWeight: 800, color: INK_MUTE, letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
          Head-to-Head
        </span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, color: INK_MUTE, marginBottom: 10 }}>
        Compare with another program
      </div>
    </div>
  );
}
