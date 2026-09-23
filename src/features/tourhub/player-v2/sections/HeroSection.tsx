import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import CountryFlag from '@/components/ui/country-flag';
import CollegeStamp from '@/components/profile/CollegeStamp';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { resolvePlayerAvatarCandidates } from '../../_shared/resolvePlayerAvatar';
import { titleCaseCountry } from '../../utils/countryFlags';
import { TOUR_LABEL } from '../../_shared/tourOrder';
import type { TourPlayer, TourPlayerStatistics } from '../../hooks/useTourHubData';
import type { PlayerSeasonSelection } from '../playerSeason';
import { playerOrdinal } from '../playerOrdinal';
import { INK_DEEP, TOUR_HERO_PHOTO_H, WHITE_ALPHA_18 } from '../../_shared/tokens';
import { APP_SHELL_SURFACE, surfaceWithAlpha } from '@/lib/tokens/surfaces';

interface HeroSectionProps {
  player: TourPlayer;
  playerStats: TourPlayerStatistics | null;
  selection: PlayerSeasonSelection;
}

const LABEL = {
  fontSize: 10,
  fontWeight: 700 as const,
  letterSpacing: '0.13em',
  textTransform: 'uppercase' as const,
};

function tourLabel(codes: string[] | null, t: TFunction): string {
  const first = codes?.[0] as keyof typeof TOUR_LABEL | undefined;
  return first ? t('player.hero.tourSuffix', { tour: TOUR_LABEL[first] ?? first.toUpperCase() }) : t('player.hero.fallback');
}

function RankFigure({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 21, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em', color: '#FFFFFF', fontVariantNumeric: 'tabular-nums lining-nums' }}>
        {value}
      </div>
      <div style={{ ...LABEL, marginTop: 4, color: 'rgba(255,255,255,0.42)' }}>{label}</div>
    </div>
  );
}

export function HeroSection({ player, playerStats, selection }: HeroSectionProps) {
  const { t } = useTranslation('tourhub');
  const candidates = resolvePlayerAvatarCandidates({
    name: player.full_name,
    photoUrl: player.photo_url ?? null,
    tourSlug: player.tour_codes?.[0] ?? 'pga',
  });
  const [photoIndex, setPhotoIndex] = useState(0);
  const photo = candidates[photoIndex] ?? null;
  const country = player.country ? titleCaseCountry(player.country) : null;
  const worldRank = playerStats?.world_rank && playerStats.world_rank > 0 ? playerStats.world_rank : null;
  const fedexRank = playerStats?.fedex_rank && playerStats.fedex_rank > 0 && player.tour_codes?.includes('pga') ? playerStats.fedex_rank : null;
  const raceProof = !worldRank && !fedexRank ? selection.raceProof : null;
  const nameSize = player.full_name.length > 25 ? 27 : player.full_name.length > 18 ? 31 : 35;

  return (
    <section style={{ position: 'relative', height: TOUR_HERO_PHOTO_H, overflow: 'hidden', background: INK_DEEP }}>
      {photo && (
        <img
          key={photo}
          src={photo}
          alt=""
          loading="eager"
          fetchPriority="high"
          onError={() => setPhotoIndex((index) => index + 1)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'right bottom' }}
        />
      )}
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 76% 35%, rgba(255,255,255,0.12), transparent 38%), linear-gradient(90deg, ${surfaceWithAlpha(APP_SHELL_SURFACE, 0.98)} 0%, ${surfaceWithAlpha(APP_SHELL_SURFACE, 0.84)} 43%, ${surfaceWithAlpha(APP_SHELL_SURFACE, 0.12)} 78%), linear-gradient(0deg, ${surfaceWithAlpha(APP_SHELL_SURFACE, 0.96)} 0%, transparent 58%)` }} />
      <div style={{ position: 'relative', height: '100%', padding: '24px 16px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, maxWidth: '88%', ...LABEL, color: 'rgba(255,255,255,0.68)' }}>
          <span>{tourLabel(player.tour_codes, t)}</span>
          {country && <><span aria-hidden>{'\u00b7'}</span><CountryFlag country={player.country_code || player.country} size="sm" /><span>{country}</span></>}
          {player.college && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
              <span aria-hidden>{'\u00b7'}</span>
              <CollegeStamp normalizedName={player.college_normalized ?? ''} fallbackName={player.college} variant="player" tone="dark" onActivate={(mode) => void analyticsEvents.track('tour_player_college_stamp_activated', { player_id: player.id, college: player.college, college_slug: player.college_normalized, mode })} />
            </span>
          )}
        </div>
        <h1 style={{ margin: '10px 0 0', maxWidth: '82%', fontSize: nameSize, lineHeight: 0.98, fontWeight: 780, color: '#FFFFFF' }}>{player.full_name}</h1>
        {selection.verdict && (
          <p style={{ margin: '10px 0 0', maxWidth: 310, fontSize: 13, lineHeight: 1.42, fontWeight: 520, color: 'rgba(255,255,255,0.72)' }}>
            {t(selection.verdict.key, selection.verdict.values)}
          </p>
        )}
        {(worldRank || fedexRank || raceProof) && (
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${WHITE_ALPHA_18}`, display: 'flex', gap: 32 }}>
            {worldRank && <RankFigure label={t('player.hero.worldLabel')} value={worldRank} />}
            {fedexRank && <RankFigure label={t('player.hero.fedexLabel')} value={fedexRank} />}
            {raceProof && <RankFigure label={raceProof.points.label} value={raceProof.points.tied ? `T${raceProof.points.rank}` : playerOrdinal(t, raceProof.points)} />}
            {/* Correction 6 (2026-09-20): the wins figure is deliberately NOT rendered here —
                it is a rank ("T5") and reads as a win count under a WINS label, contradicting
                the verdict sentence above. One proof cell is acceptable on its own; raceProof.wins
                stays on the selection type for other consumers. */}
          </div>
        )}
      </div>
    </section>
  );
}