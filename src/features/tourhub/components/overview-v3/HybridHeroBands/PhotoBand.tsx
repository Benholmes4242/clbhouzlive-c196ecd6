/** The full-bleed, tappable photograph used only by the Tour Overview carousel. */
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { HeadlineSegment } from '../../../overview/magazineCopy';
import { getScoreColor } from '../../../_shared/scoreColor';
import {
  AMBER,
  CAPS_10,
  FONT,
  INK,
  OVERVIEW_SITUATION_INK,
  WHITE_ALPHA_32,
  STATUS_LIVE_ON_DARK,
} from '../../../_shared/tokens';
import { COURSE_GRADIENT, NUMERIC_STYLE, OVERVIEW_PHOTO_BAND_HEIGHT } from '../HybridHero.constants';
import { fmtScore, type HeroState } from '../HybridHero.utils';
import { DARK_CHROME_GLASS_MATERIAL } from '@/features/chrome-v2/ChromeIsland';
import { MASTHEAD_KICKER, MASTHEAD_NAME, MASTHEAD_PLACE } from '@/components/courses/CourseMasthead';
import { OVERVIEW } from '../overviewTokens';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { PhotoBandFade, photoBandHeight } from './photoBandMaterial';


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
  segments?: HeadlineSegment[];
  note?: string | null;
  onFullBoard?: () => void;
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
  segments = [],
  note,
  onFullBoard,
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
    : state.kind === 'results' && state.variant === 'awaiting-playoff'
      ? t('overview.hero.statePlayoff', { defaultValue: 'PLAYOFF' }) // never RESULTS; no live dot
    : isUpcoming && startDay
      ? t('overview.hero.starts', { day: startDay })
      : t('overview.hero.stateFinal');

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpen(); }
      }}
      aria-label={title}
      data-overview-photo-band
      data-overview-photo-state={state.kind}
      data-overview-photo-fallback={venueImageUrl ? undefined : 'true'}
      style={{
        position: 'relative',
        display: 'block',
        width: '100%',
        height: photoBandHeight(heightPx),
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        border: 'none',
        borderRadius: 0,
        background: venueImageUrl ? `url("${venueImageUrl}") 50% 55% / cover no-repeat` : COURSE_GRADIENT,
        color: INK,
        fontFamily: FONT,
        textAlign: 'left',
        cursor: 'pointer',
      }}
    >
      <PhotoBandFade />
      <div
        data-overview-photo-text
        style={{
          position: 'absolute',
          left: 20,
          right: 20,
          bottom: 14,
          minWidth: 0,
        }}
      >
        <div data-overview-photo-pill-row style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              minHeight: 28,
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
          {onFullBoard ? <Button type="button" variant="ghost" data-overview-full-board aria-label="Full leaderboard"
            onClick={(event) => { event.stopPropagation(); onFullBoard(); }}
            onKeyDown={(event) => event.stopPropagation()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 3, minHeight: 44, height: 44, padding: '0 0 0 12px', margin: '-8px 0', background: 'none', border: 'none', borderRadius: 0, fontFamily: FONT, fontSize: 12, fontWeight: 700, color: INK, cursor: 'pointer' }}>
            {t('overview.situation.fullBoard', { defaultValue: 'Full board' })}<ChevronRight size={13} strokeWidth={2.6} color={WHITE_ALPHA_32} aria-hidden />
          </Button> : null}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginTop: 10, minWidth: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {tourLabel ? <div style={MASTHEAD_KICKER}>{tourLabel}</div> : null}
          <h1
            style={{
              ...MASTHEAD_NAME,
              fontSize: 26,
              letterSpacing: 0,
              marginTop: 4,
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 3,
              overflow: 'hidden',
            }}
          >
            {title}
          </h1>
          {venueLine ? <div style={{ ...MASTHEAD_PLACE, marginTop: 4 }}>{venueLine}</div> : null}
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
            <div style={{ ...NUMERIC_STYLE, fontSize: 26, lineHeight: 1, fontWeight: 800, letterSpacing: 0, color: getScoreColor(leader.score, 'dark') }}>{fmtScore(leader.score)}</div>
            {leader.caps ? <div data-overview-leader-name style={{ maxWidth: 150, marginTop: 5, marginLeft: 'auto', fontSize: 10, fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', color: OVERVIEW.trio.caps, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'right' }}>{leader.caps}</div> : null}
          </div>
        ) : null}

        {isUpcoming && countdown.length > 0 ? (
          <div data-overview-countdown style={{ display: 'flex', gap: 6, flex: 'none' }}>
            {countdown.map((unit) => (
              <div key={unit.label} style={{ minWidth: 50, padding: '8px 10px', borderRadius: 12, textAlign: 'center', ...DARK_CHROME_GLASS_MATERIAL }}>
                <div style={{ ...NUMERIC_STYLE, fontSize: 24, lineHeight: 1, fontWeight: 700 }}>{unit.value}</div>
                <div style={{ ...CAPS_10, marginTop: 5, fontSize: 9 }}>{t(`overview.hero.${unit.label}`)}</div>
              </div>
            ))}
          </div>
        ) : null}
        </div>
        {segments.length > 0 ? <p data-overview-photo-situation style={{ margin: '9px 0 0', fontSize: 13.5, lineHeight: 1.4, fontWeight: 400, color: OVERVIEW_SITUATION_INK }}>
          {segments.map((segment, index) => segment.figure ? <strong key={index} style={{ fontWeight: 700, fontStyle: 'normal', color: 'var(--th-text-primary)', fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum" 1, "kern" 1, "liga" 1' }}>{segment.text}</strong> : <span key={index}>{segment.text}</span>)}
        </p> : null}
        {note ? <p data-overview-situation-note style={{ margin: '4px 0 0', fontSize: 12.5, lineHeight: 1.4, color: OVERVIEW.soft }}>{note}</p> : null}
        {inPlay ? <RoundSpine round={state.round} totalRounds={state.totalRounds} /> : null}
      </div>
    </div>
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
    <div data-overview-round-spine style={{ display: 'flex', alignItems: 'center', marginTop: 10 }}>
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
