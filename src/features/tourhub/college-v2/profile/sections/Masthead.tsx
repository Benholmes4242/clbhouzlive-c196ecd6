/**
 * Masthead - college profile head.
 *
 * Thin wrapper around the shared CollegeHeroMasthead. Owns the Compare
 * button; Follow was removed per brief (2026-07-17). The crossed-swords
 * icon was removed (2026-08-02) - an icon decorating a relationship goes.
 * The button is an unfilled quiet Action with a trailing chevron.
 */

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';
import { collegeHubRoute } from '@/features/tourhub/routes';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { FONT } from '@/features/tourhub/_shared/tokens';
import { CollegeHeroMasthead } from '../../_shared/CollegeHeroMasthead';

interface Props {
  slug: string;
  displayName: string;
  rank: number | null;
  pointsTotal: number;
  alumniCount: number;
  playingNow: number;
  brandHex: string | null;
  rankChange?: number | null;
}

export function Masthead({
  slug,
  displayName,
  rank,
  pointsTotal,
  alumniCount,
  playingNow,
  brandHex,
  rankChange = null,
}: Props) {
  const { t } = useTranslation('tourhub');
  const logoUrl = getCollegeLogoUrl(displayName);

  const navigate = useNavigate();
  const handleCompare = () => {
    analyticsEvents.track('tour_college_compare_tapped', { slug });
    navigate(`${collegeHubRoute()}?compare=${encodeURIComponent(slug)}`);
  };

  return (
    <CollegeHeroMasthead
      displayName={displayName}
      logoUrl={logoUrl}
      brandHex={brandHex}
      rank={rank}
      pointsTotal={pointsTotal}
      alumniCount={alumniCount}
      playingNow={playingNow}
      rankChange={rankChange}
      actions={
        <button
          type="button"
          onClick={handleCompare}
          style={{
            flexShrink: 0,
            fontFamily: FONT,
            height: 32,
            padding: '0 16px',
            borderRadius: 999,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.13em',
            textTransform: 'uppercase',
            border: '0.75px solid rgba(255,255,255,0.28)',
            background: 'transparent',
            color: '#FFFFFF',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 120ms ease',
          }}
          aria-label={t('college.profile.compareAria')}
        >
          {t('college.profile.compare')}
          <span aria-hidden style={{ fontSize: 12, lineHeight: 1 }}>{'\u203A'}</span>
        </button>
      }
    />
  );
}

