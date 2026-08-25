/**
 * HeroSection - dark cinematic identity band.
 *
 * Height is HERO_MIN_H from _shared/tokens - the canonical tour hero height,
 * sourced from the course detail hero. FIXED in all cases; it does not vary
 * on whether a photo is present. The identity IS the image - no course photo.
 * 74px avatar squircle w/ white-alpha ring, LABEL eyebrow
 * "{TOUR} . {flag} {COUNTRY}", name 26/800, then a two-figure rank row
 * (WORLD / FEDEX) that surfaces only what actually exists on the DB row.
 */

import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import CountryFlag from '@/components/ui/country-flag';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { resolvePlayerAvatarCandidates } from '../../_shared/resolvePlayerAvatar';
import { titleCaseCountry } from '../../utils/countryFlags';
import { TOUR_LABEL, mapTourSlug } from '../../_shared/tourOrder';
import type { TourPlayer, TourPlayerStatistics } from '../../hooks/useTourHubData';
import { HERO_MIN_H, WHITE_ALPHA_18 } from '../../_shared/tokens';
import { heroTintGradient } from '../../_shared/heroGradient';
import { TOUR_CONFIG } from '../../hooks/useOverviewData';

interface HeroSectionProps {
  player: TourPlayer;
  playerStats: TourPlayerStatistics | null;
}

/* HERO EXCEPTION.
   This is the same immersive/broadcast register as the tour overview hero:
   tracked caps over photography read materially larger than their point size.
   So the hero's band labels and markers take AXIS 10, while its names,
   tournament titles and sentences take READ 11. LABEL_ON_DARK carries only
   band labels (the RankFigure captions) and the eyebrow markers, so it is AXIS. */
const LABEL_ON_DARK = {
  fontSize: 10, // AXIS floor — hero band labels and eyebrow markers.
  fontWeight: 700 as const,
  letterSpacing: '0.13em',
  textTransform: 'uppercase' as const,
};

function tourLabel(codes: string[] | null, t: TFunction): string {
  const first = codes?.[0] as keyof typeof TOUR_LABEL | undefined;
  return first
    ? t('player.hero.tourSuffix', { tour: TOUR_LABEL[first] ?? first.toUpperCase() })
    : t('player.hero.fallback');
}

function RankFigure({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ ...LABEL_ON_DARK, color: 'rgba(255,255,255,0.42)' }}>{label}</div>
      <div
        style={{
          marginTop: 4,
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          color: '#FFFFFF',
          fontVariantNumeric: 'tabular-nums lining-nums',
        }}
      >
        {value}
      </div>
    </div>
  );
}

export function HeroSection({ player, playerStats }: HeroSectionProps) {
  const { t } = useTranslation('tourhub');
  const avatarCandidates = resolvePlayerAvatarCandidates({
    name: player.full_name,
    photoUrl: player.photo_url ?? null,
    tourSlug: player.tour_codes?.[0] ?? 'pga',
  });

  const country = player.country ? titleCaseCountry(player.country) : null;
  const worldRank =
    playerStats?.world_rank && playerStats.world_rank > 0 ? playerStats.world_rank : null;
  const fedexRank =
    playerStats?.fedex_rank && playerStats.fedex_rank > 0 ? playerStats.fedex_rank : null;
  const isPga = player.tour_codes?.includes('pga') ?? false;
  const showFedex = isPga && !!fedexRank;
  const showRankRow = !!worldRank || showFedex;

  const tourId = mapTourSlug(player.tour_codes?.[0] ?? 'pga');
  const tourColor = TOUR_CONFIG[tourId]?.color ?? null;
  const heroBg = heroTintGradient(tourColor, 0.3);

  return (
    <div
      style={{
        background: heroBg,
        minHeight: HERO_MIN_H,
        paddingTop: 'calc(var(--chrome-total-h, 0px) + 8px)',
        paddingBottom: 16,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      <div style={{ padding: '10px 16px 0', display: 'flex', gap: 16, alignItems: 'flex-end' }}>
        <SquircleAvatar
          size={74}
          srcCandidates={avatarCandidates}
          alt={player.full_name}
          userId={player.id ?? player.full_name}
          ringColor={WHITE_ALPHA_18}
          hairlineRing
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Eyebrow */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              ...LABEL_ON_DARK,
              color: 'rgba(255,255,255,0.45)',
              marginBottom: 6,
              minHeight: 14,
              flexWrap: 'wrap',
            }}
          >
            <span>{tourLabel(player.tour_codes, t)}</span>
            {country && (
              <>
                <span aria-hidden style={{ opacity: 0.6 }}>
                  {'\u00b7'}
                </span>
                <CountryFlag country={player.country_code || player.country} size="sm" />
                <span>{country}</span>
              </>
            )}
          </div>

          {/* Name */}
          <h1
            style={{
              margin: 0,
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: '-0.01em',
              lineHeight: 1.1,
              color: '#FFFFFF',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {player.full_name}
          </h1>
        </div>
      </div>

      {/* Two-figure rank row. Group boundary rule is permitted here. */}
      {showRankRow && (
        <div
          style={{
            margin: '14px 16px 0',
            paddingTop: 12,
            borderTop: '1px solid rgba(255,255,255,0.10)',
            display: 'flex',
            gap: 32,
          }}
        >
          {worldRank && <RankFigure label={t('player.hero.worldLabel')} value={worldRank} />}
          {showFedex && <RankFigure label={t('player.hero.fedexLabel')} value={fedexRank!} />}
        </div>
      )}
    </div>
  );
}
