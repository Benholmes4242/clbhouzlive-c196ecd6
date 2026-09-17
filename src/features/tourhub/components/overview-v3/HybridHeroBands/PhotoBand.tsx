/** The full-bleed, tappable photograph used only by the Tour Overview carousel. */
import { useTranslation } from 'react-i18next';
import { heroCanonBackground } from '../../../_shared/heroGradient';
import { getScoreColor } from '../../../_shared/scoreColor';
import {
  AMBER,
  FONT,
  INK,
  INK_MUTE,
  LEADER_GOLD,
  STATUS_LIVE_ON_DARK,
  SURFACE,
} from '../../../_shared/tokens';
import { COURSE_GRADIENT, NUMERIC_STYLE, OVERVIEW_PHOTO_BAND_HEIGHT } from '../HybridHero.constants';
import { fmtScore, type HeroState } from '../HybridHero.utils';
import { DARK_CHROME_GLASS_MATERIAL } from '@/features/chrome-v2/ChromeIsland';

export interface OverviewCountdownUnit {
  value: number;
  label: 'days' | 'hours' | 'minutes';
}

interface PhotoBandProps {
  title: string;
  venueName: string | null;
  datesString: string | null;
  venueImageUrl: string | null;
  state: HeroState;
  tourLabel: string | null;
  leader: { score: number; name: string | null } | null;
  countdown: OverviewCountdownUnit[];
  startDay: string | null;
  champion: { name: string; score: number; margin: number | null; playoff: boolean } | null;
  heightPx?: number;
  onOpen: () => void;
}

const CAPS: React.CSSProperties = {
  fontFamily: FONT,
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
};

export function PhotoBand({
  title,
  venueName,
  datesString,
  venueImageUrl,
  state,
  tourLabel,
  leader,
  countdown,
  startDay,
  champion,
  heightPx = OVERVIEW_PHOTO_BAND_HEIGHT,
  onOpen,
}: PhotoBandProps) {
  const { t } = useTranslation('tourhub');
  const venueLine = [venueName, datesString].filter(Boolean).join(' · ');
  const isLive = state.kind === 'live';
  const isUpcoming = state.kind === 'upcoming';
  const stateLabel = isLive
    ? t('overview.hero.stateLive')
    : isUpcoming && startDay
      ? t('overview.hero.starts', { day: startDay })
      : t('overview.hero.stateFinal');

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={title}
      data-overview-photo-band
      data-overview-photo-state={state.kind}
      data-overview-photo-fallback={venueImageUrl ? undefined : 'true'}
      style={{
        position: 'relative',
        display: 'block',
        width: '100%',
        height: heightPx,
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        border: 'none',
        borderRadius: 0,
        background: heroCanonBackground(venueImageUrl, COURSE_GRADIENT, '50% 55%'),
        color: INK,
        fontFamily: FONT,
        textAlign: 'left',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 24,
          right: 24,
          bottom: 16,
          display: 'flex',
          alignItems: 'flex-end',
          gap: 16,
          minWidth: 0,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              minHeight: 28,
              marginBottom: 8,
              padding: '0 10px',
              borderRadius: 999,
              ...DARK_CHROME_GLASS_MATERIAL,
              ...CAPS,
            }}
          >
            {isLive ? <span style={{ width: 7, height: 7, borderRadius: 999, background: STATUS_LIVE_ON_DARK }} /> : null}
            <span>{stateLabel}</span>
            {isLive ? <span style={{ color: AMBER }}>{t('overview.hero.factRound')} {state.round}</span> : null}
          </div>
          {tourLabel ? <div style={{ ...CAPS, color: INK_MUTE, letterSpacing: '0.14em' }}>{tourLabel}</div> : null}
          <h1
            style={{
              margin: '4px 0 0',
              fontSize: 25,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: 0,
              color: INK,
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              overflow: 'hidden',
            }}
          >
            {title}
          </h1>
          {venueLine ? (
            <div style={{ marginTop: 5, fontSize: 13, color: 'rgba(248,250,252,0.82)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {venueLine}
            </div>
          ) : null}
        </div>

        {isLive && leader ? (
          <div style={{ flex: 'none', maxWidth: 150, alignSelf: 'flex-end', textAlign: 'right' }}>
            <div style={{ ...NUMERIC_STYLE, fontSize: 34, lineHeight: 1, fontWeight: 800, color: getScoreColor(leader.score, 'dark') }}>{fmtScore(leader.score)}</div>
            {leader.name ? <div data-overview-leader-name style={{ maxWidth: 150, marginTop: 4, marginLeft: 'auto', fontSize: 12, fontWeight: 600, lineHeight: 1.25, color: INK_MUTE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'right' }}>{leader.name}</div> : null}
          </div>
        ) : null}

        {isUpcoming && countdown.length > 0 ? (
          <div style={{ display: 'flex', gap: 6, flex: 'none' }}>
            {countdown.map((unit) => (
              <div key={unit.label} style={{ minWidth: 50, padding: '8px 10px', borderRadius: 12, textAlign: 'center', ...DARK_CHROME_GLASS_MATERIAL }}>
                <div style={{ ...NUMERIC_STYLE, fontSize: 24, lineHeight: 1, fontWeight: 700 }}>{unit.value}</div>
                <div style={{ ...CAPS, marginTop: 5, fontSize: 9 }}>{t(`overview.hero.${unit.label}`)}</div>
              </div>
            ))}
          </div>
        ) : null}

        {state.kind === 'results' && champion ? (
          <div style={{ flex: 'none', maxWidth: 122, textAlign: 'right' }}>
            <div style={{ ...CAPS, color: LEADER_GOLD, letterSpacing: '0.14em' }}>{t('overview.hero.champion')}</div>
            <div style={{ marginTop: 3, fontSize: 17, lineHeight: 1.1, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{champion.name}</div>
            <div style={{ ...NUMERIC_STYLE, marginTop: 4, fontSize: 13, fontWeight: 700, color: getScoreColor(champion.score, 'dark') }}>
              {fmtScore(champion.score)}
              {champion.playoff ? ` · ${t('overview.hero.playoff')}` : champion.margin != null ? ` · ${t('overview.hero.wonBy', { count: champion.margin })}` : ''}
            </div>
          </div>
        ) : null}
      </div>
    </button>
  );
}

export default PhotoBand;
