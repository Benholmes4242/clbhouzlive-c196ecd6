import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import CountryFlag from '@/components/ui/country-flag';
import CollegeStamp from '@/components/profile/CollegeStamp';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { PlayerAvatar } from '../../components/PlayerAvatar';
import { titleCaseCountry } from '../../utils/countryFlags';
import { TOUR_LABEL } from '../../_shared/tourOrder';
import type { TourPlayer, TourPlayerStatistics } from '../../hooks/useTourHubData';
import type { PlayerSeasonSelection } from '../playerSeason';
import { playerOrdinal } from '../playerOrdinal';
import { TOUR_PLAYER_HERO_H, WHITE_ALPHA_18 } from '../../_shared/tokens';
import { PAGE_CANVAS } from '@/lib/tokens/surfaces';

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
  const country = player.country ? titleCaseCountry(player.country) : null;
  const worldRank = playerStats?.world_rank && playerStats.world_rank > 0 ? playerStats.world_rank : null;
  const fedexRank = playerStats?.fedex_rank && playerStats.fedex_rank > 0 && player.tour_codes?.includes('pga') ? playerStats.fedex_rank : null;
  const raceProof = !worldRank && !fedexRank ? selection.raceProof : null;
  const nameSize = player.full_name.length > 22 ? 25 : player.full_name.length > 14 ? 29 : 33;

  return (
    <section style={{ position: 'relative', display: 'flex', flexDirection: 'column', minHeight: TOUR_PLAYER_HERO_H, overflow: 'hidden', background: PAGE_CANVAS }}>
      {/* No full-bleed photo: the band is 430x340 landscape and the headshot library is
          mostly 400x533 portrait cut-outs — a full-bleed photo is a 3.2x upscale that no
          CSS can sharpen. Do not reintroduce it. */}
      <div style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 2 }}>
        <PlayerAvatar
          playerId={player.id}
          playerName={player.full_name}
          tourCode={player.tour_codes?.[0] ?? 'pga'}
          photoUrl={player.photo_url ?? null}
          headshotOverride={player.headshot_override ?? null}
          size={80}
          surface="canvas"
          imagePosition="50% 2%"
        />
      </div>
      <div style={{ position: 'relative', flex: 1, padding: '24px 16px 16px', paddingRight: 114, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, rowGap: 5, maxWidth: '100%', ...LABEL, color: 'rgba(255,255,255,0.68)' }}>
          <span>{tourLabel(player.tour_codes, t)}</span>
          {country && <><span aria-hidden>{'\u00b7'}</span><CountryFlag country={player.country_code || player.country} size="sm" /><span>{country}</span></>}
          {player.college && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
              <span aria-hidden>{'\u00b7'}</span>
              <CollegeStamp normalizedName={player.college_normalized ?? ''} fallbackName={player.college} variant="player" tone="dark" onActivate={(mode) => void analyticsEvents.track('tour_player_college_stamp_activated', { player_id: player.id, college: player.college, college_slug: player.college_normalized, mode })} />
            </span>
          )}
        </div>
        <h1 style={{ margin: '10px 0 0', fontSize: nameSize, lineHeight: 0.98, fontWeight: 780, letterSpacing: '-0.012em', color: '#FFFFFF' }}>{player.full_name}</h1>
        {selection.verdict && (
          <p style={{ margin: '10px 0 0', fontSize: 13, lineHeight: 1.42, fontWeight: 520, color: 'rgba(255,255,255,0.72)' }}>
            {t(selection.verdict.key, selection.verdict.values)}
          </p>
        )}
        {(worldRank || fedexRank || raceProof) && (
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${WHITE_ALPHA_18}`, display: 'flex', flexWrap: 'wrap', gap: 32, rowGap: 12 }}>
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