/**
 * HeroSection — dark cinematic identity band.
 *
 * ~210px tall (+ safe-area). Gradient #262B33 → #15171F. The identity IS
 * the image — no course photo. 74px avatar squircle w/ white-alpha ring,
 * eyebrow "{TOUR} · {flag} {COUNTRY}", name 23/800, meta row surfaces
 * only what actually exists on the DB row (world_rank, fedex_rank).
 */

import CountryFlag from '@/components/ui/country-flag';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { resolvePlayerAvatarCandidates } from '../../_shared/resolvePlayerAvatar';
import { titleCaseCountry } from '../../utils/countryFlags';
import { TOUR_LABEL } from '../../_shared/tourOrder';
import type { TourPlayer, TourPlayerStatistics } from '../../hooks/useTourHubData';
import { CHARCOAL, WHITE_ALPHA_18, WHITE_ALPHA_55, WHITE_ALPHA_65 } from '../../_shared/tokens';

interface HeroSectionProps {

  player: TourPlayer;
  playerStats: TourPlayerStatistics | null;
}

function tourLabel(codes: string[] | null): string {
  const first = codes?.[0] as keyof typeof TOUR_LABEL | undefined;
  return first ? `${TOUR_LABEL[first] ?? first.toUpperCase()} TOUR` : 'PLAYER';
}

export function HeroSection({ player, playerStats }: HeroSectionProps) {
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

  return (
    <div
      style={{
        background: `linear-gradient(180deg, #262B33 0%, ${CHARCOAL} 100%)`,
        paddingTop: 'calc(var(--chrome-total-h, 0px) + 8px)',
        paddingBottom: 16,
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
              fontSize: 9.5,
              fontWeight: 800,
              letterSpacing: '0.10em',
              color: WHITE_ALPHA_55,
              textTransform: 'uppercase',
              marginBottom: 6,
              minHeight: 14,
              flexWrap: 'wrap',
            }}
          >
            <span>{tourLabel(player.tour_codes)}</span>
            {country && (
              <>
                <span aria-hidden style={{ opacity: 0.6 }}>·</span>
                <CountryFlag country={player.country_code || player.country} size="sm" />
                <span>{country}</span>
              </>
            )}
          </div>

          {/* Name */}
          <h1
            style={{
              margin: 0,
              fontSize: 23,
              fontWeight: 800,
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

          {/* Meta */}
          {(worldRank || (isPga && fedexRank)) && (
            <div
              style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginTop: 12,
              fontSize: 11.5,
              fontWeight: 700,
              color: WHITE_ALPHA_65,
              fontVariantNumeric: 'tabular-nums',
            }}
            >
              {worldRank && <span>World No. {worldRank}</span>}
              {worldRank && isPga && fedexRank && (
                <span aria-hidden style={{ opacity: 0.5 }}>·</span>
              )}
              {isPga && fedexRank && <span>FedEx No. {fedexRank}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
