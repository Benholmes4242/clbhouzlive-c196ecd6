/** The full-bleed, tappable photograph used only by the Tour Overview carousel. */
import { useTranslation } from 'react-i18next';
import { heroCanonBackground } from '../../../_shared/heroGradient';
import { getScoreColor } from '../../../_shared/scoreColor';
import {
  AMBER,
  CAPS_10,
  FONT,
  INK,
  STATUS_LIVE_ON_DARK,
} from '../../../_shared/tokens';
import { COURSE_GRADIENT, NUMERIC_STYLE, OVERVIEW_PHOTO_BAND_HEIGHT } from '../HybridHero.constants';
import { fmtScore, type HeroState } from '../HybridHero.utils';
import { DARK_CHROME_GLASS_MATERIAL } from '@/features/chrome-v2/ChromeIsland';
import { MASTHEAD_KICKER, MASTHEAD_NAME, MASTHEAD_PLACE } from '@/components/courses/CourseMasthead';
import { OVERVIEW } from '../overviewTokens';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';


export interface HeroLeaderTrio {
  score: number;
  /** At most three faces; a longer tie still states its true count in `caps`. */
  faces: Array<{ key: string; name: string; candidates: string[] }>;
  /** "THREE TIED" or the sole leader's surname (caps from CSS). */
  caps: string | null;
}


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
  leader: HeroLeaderTrio | null;
  countdown: OverviewCountdownUnit[];
  startDay: string | null;
  heightPx?: number;
  onOpen: () => void;
}

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
  heightPx = OVERVIEW_PHOTO_BAND_HEIGHT,
  onOpen,
}: PhotoBandProps) {
  const { t } = useTranslation('tourhub');
  const venueLine = [venueName, datesString].filter(Boolean).join(' · ');
  const isLive = state.kind === 'live';
  const isSuspended = state.kind === 'suspended';
  /** Live OR suspended: the scores are live scores, so the round and leader stay. */
  const inPlay = isLive || isSuspended;
  const isUpcoming = state.kind === 'upcoming';
  // FINAL is reachable ONLY from `results`; a suspended event can never print it.
  const stateLabel = isLive
    ? t('overview.hero.stateLive')
    : isSuspended
      ? t('overview.hero.stateSuspended')
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
              ...CAPS_10,
            }}
          >
            {isLive ? <span style={{ width: 7, height: 7, borderRadius: 999, background: STATUS_LIVE_ON_DARK }} /> : null}
            <span>{stateLabel}</span>
            {inPlay ? <span style={{ color: AMBER }}>{t('overview.hero.factRound')} {state.round}</span> : null}
          </div>
          {tourLabel ? <div style={MASTHEAD_KICKER}>{tourLabel}</div> : null}
          <h1
            style={{
              ...MASTHEAD_NAME,
              marginTop: 4,
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 3,
              overflow: 'hidden',
            }}
          >
            {title}
          </h1>
          {venueLine ? <div style={MASTHEAD_PLACE}>{venueLine}</div> : null}
          {inPlay ? <RoundSpine round={state.round} totalRounds={state.totalRounds} /> : null}
        </div>

        {inPlay && leader ? (
          <div data-overview-leader-trio style={{ flex: 'none', maxWidth: 150, alignSelf: 'flex-end', textAlign: 'right' }}>
            {leader.faces.length > 0 ? (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
                {leader.faces.map((face, i) => (
                  <span key={face.key} data-overview-trio-face style={{ display: 'inline-flex', flex: 'none', border: OVERVIEW.trio.faceBorder, borderRadius: '34%', marginLeft: i > 0 ? -9 : 0 }}>
                    <SquircleAvatar size={28} srcCandidates={face.candidates} alt={face.name} userId={face.key} hideRing />
                  </span>
                ))}
              </div>
            ) : null}
            <div style={{ ...NUMERIC_STYLE, fontSize: 26, lineHeight: 1, fontWeight: 800, letterSpacing: '-0.02em', color: getScoreColor(leader.score, 'dark') }}>{fmtScore(leader.score)}</div>
            {leader.caps ? <div data-overview-leader-name style={{ maxWidth: 150, marginTop: 5, marginLeft: 'auto', fontSize: 10, fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', color: OVERVIEW.trio.caps, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'right' }}>{leader.caps}</div> : null}
          </div>
        ) : null}

        {isUpcoming && countdown.length > 0 ? (
          <div style={{ display: 'flex', gap: 6, flex: 'none' }}>
            {countdown.map((unit) => (
              <div key={unit.label} style={{ minWidth: 50, padding: '8px 10px', borderRadius: 12, textAlign: 'center', ...DARK_CHROME_GLASS_MATERIAL }}>
                <div style={{ ...NUMERIC_STYLE, fontSize: 24, lineHeight: 1, fontWeight: 700 }}>{unit.value}</div>
                <div style={{ ...CAPS_10, marginTop: 5, fontSize: 9 }}>{t(`overview.hero.${unit.label}`)}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </button>
  );
}

/**
 * A.1 THE ROUND SPINE — one node per round, a connector between consecutive
 * nodes. In-play states only (the caller gates it): never upcoming, never a
 * finished result. Amber here is the round in progress, as on every Tour surface.
 */
function RoundSpine({ round, totalRounds }: { round: number; totalRounds: number }) {
  const { t } = useTranslation('tourhub');
  const nodes = Array.from({ length: Math.max(0, totalRounds) }, (_, i) => i + 1);
  return (
    <div data-overview-round-spine style={{ display: 'flex', alignItems: 'center', marginTop: 11 }}>
      {nodes.map((n, i) => {
        const live = n === round;
        const done = n < round;
        return (
          <div key={n} style={{ display: 'contents' }}>
            {i > 0 ? <span aria-hidden style={{ flex: 1, height: 1, background: OVERVIEW.spine.connector, margin: '0 7px' }} /> : null}
            <span data-round-node={live ? 'live' : done ? 'done' : 'todo'} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flex: 'none' }}>
              <span aria-hidden style={{ width: 7, height: 7, borderRadius: '50%', background: live ? OVERVIEW.amber : done ? OVERVIEW.spine.done : OVERVIEW.spine.todo, boxShadow: live ? OVERVIEW.spine.liveHalo : undefined }} />
              <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: live ? OVERVIEW.amber : OVERVIEW.spine.label }}>{t('overview.hero.roundNode', { round: n })}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default PhotoBand;
