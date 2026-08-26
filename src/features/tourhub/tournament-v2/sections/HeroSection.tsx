/**
 * HeroSection — cinematic tournament hero (mock: tournament-hero-states).
 *
 * Full-bleed course image (useSingleCourseImage) under the same scrim as the
 * overview cinematic hero. NO boxed glass panel — content sits directly on
 * the scrim above a 0.5px hairline; a state band pivots on `state`
 * (live -> LEADER row, upcoming -> DEFENDING + countdown, completed ->
 * CHAMPION + winning score).
 *
 * TYPE SCALE — HERO EXCEPTION (MICRO_BRIEF_TOURNAMENT_PAGE_TYPE_SCALE). This is
 * the same cinematic register as the overview hero: a broadcast surface over
 * photography, where tracked caps read larger than their point size. Its band
 * labels, column headers and status markers therefore take AXIS 10 rather than
 * the READ floor of 11, each commented at the site; its names, tournament
 * titles and sentences take 11 or above. Nothing already above a floor comes
 * down — a floor is a minimum, never a target.
 */
import { differenceInCalendarDays } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Trophy, Star, ChevronRight } from 'lucide-react';
import { PlayerAvatar } from '../../components/PlayerAvatar';
import { formatPurse } from '../../_shared/formatPurse';
import { formatNumber } from '@/i18n/format';
import {
  FONT, WHITE_ALPHA_65, WHITE_ALPHA_12,
  HERO_BOARD_SURFACE, HERO_BOARD_SURFACE_SOFT,
} from '../../_shared/tokens';
import { fmtScore } from '../../utils/fmtScore';
import { getScoreColor } from '../../_shared/scoreColor';
import { HERO_MIN_H } from '../../_shared/tokens';
import { heroCanonScrimOn } from '../../_shared/heroGradient';

import { useTournamentDefendingChamp } from '../../hooks/useTournamentDefendingChamp';

import type { TournamentMeta } from '../../leaderboard/useTournamentMeta';
import type { EventState } from '../../components/overview-v3/useTournamentPulse';

// Canonical hero height: HERO_MIN_H from _shared/tokens, sourced from the
// course detail hero (GolfClubView). Do not re-declare it locally.

/**
 * ONE canon scrim — heroCanonScrimOn (BRIEF_HERO_GRADIENT_AND_HEIGHT_CANON).
 * The canon is that the ramp ends on whatever surface sits BENEATH the photo.
 * That surface is no longer the canvas: it is the stat strip, so the gradient
 * and the flat fallback both terminate on HERO_BOARD_SURFACE_SOFT (#121820).
 * No text shadow, no second layer.
 */
const FALLBACK_BG = `linear-gradient(180deg, #1A2130 0%, ${HERO_BOARD_SURFACE_SOFT} 100%)`;
const IMAGE_FOCAL = '50% 72%';


const LEADER_RED = '#FF6B6B';
const GOLD = '#FBBC2E';
const GREEN_LIVE = '#6EE7B7';

interface LbEntry {
  position: number | null;
  score: number | null;
  today?: number | null;
  thru?: number | null;
  player?: {
    id?: string;
    full_name?: string;
    country?: string | null;
    country_code?: string | null;
    photo_url?: string | null;
  } | null;
}

interface Props {
  meta: TournamentMeta;
  state: EventState;
  imageUrl: string | null;
  tourCode: string;
  leaderboard: LbEntry[] | undefined;
}

/**
 * Figure - one hero figure. Flat: no glass tile, no border, no backdrop
 * filter. Three of these sit in ONE row for every state, so the hero has a
 * single figure grammar instead of a per-state widget.
 */
function Figure({ value, label, tone }: { value: string; label: string; tone?: string }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          fontSize: 19,
          fontWeight: 700,
          lineHeight: 1,
          color: tone ?? '#fff',
          fontVariantNumeric: 'tabular-nums lining-nums',
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </div>
      <div
        style={{
          marginTop: 5,
          // AXIS 10 (hero exception): stat-band column label over photography,
          // where tracked caps read larger than their point size.
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.14em',
          color: 'rgba(255,255,255,0.62)',
          textTransform: 'uppercase',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </div>
    </div>
  );
}

/**
 * PersonLockup - the ONE person treatment in the hero. Leader (live),
 * defending champion (upcoming) and champion (completed) all render through
 * this so the avatar, label, name and sub-line never drift apart.
 */
function PersonLockup({
  label,
  labelTone,
  icon,
  name,
  sub,
  playerId,
  photoUrl,
  tourCode,
  showAvatar,
}: {
  label: string;
  labelTone?: string;
  icon?: React.ReactNode;
  name: string;
  sub?: string | null;
  playerId?: string | null;
  photoUrl?: string | null;
  tourCode: string;
  showAvatar?: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
      {showAvatar && (
        <PlayerAvatar
          playerId={playerId ?? ''}
          playerName={name}
          tourCode={tourCode}
          photoUrl={photoUrl ?? null}
          size="md"
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            // AXIS 10 (hero exception): band label / marker, not a sentence.
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.12em',
            color: labelTone ?? 'rgba(255,255,255,0.62)',
            textTransform: 'uppercase',
          }}
        >
          {icon}
          {label}
        </div>
        <div
          style={{
            fontSize: 15.5,
            fontWeight: 700,
            color: '#fff',
            marginTop: 3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {name}
        </div>
        {sub && (
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: WHITE_ALPHA_65,
              marginTop: 2,
              fontVariantNumeric: 'tabular-nums lining-nums',
            }}
          >
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}


export function HeroSection({ meta, state, imageUrl, tourCode, leaderboard }: Props) {
  const { t } = useTranslation('tourhub');
  const startDate = meta.start_date ? new Date(meta.start_date) : null;
  const now = new Date();
  const daysUntil = startDate
    ? Math.max(0, differenceInCalendarDays(startDate, now))
    : null;

  const { data: defendingChamp } = useTournamentDefendingChamp(
    state === 'upcoming' ? meta.id : null,
  );

  const background = heroCanonBackground(imageUrl, FALLBACK_BG, IMAGE_FOCAL);

  const leader =
    state === 'live'
      ? (leaderboard ?? []).find((e) => e.position === 1) ??
        (leaderboard ?? [])[0] ??
        null
      : null;
  const champion =
    state === 'completed'
      ? (leaderboard ?? []).find((e) => e.position === 1) ??
        (leaderboard ?? [])[0] ??
        null
      : null;

  // Winning margin (completed): champion score − next non-tied score.
  const margin = (() => {
    if (state !== 'completed' || !leaderboard || leaderboard.length < 2) return null;
    const topScore = leaderboard[0]?.score;
    if (topScore == null) return null;
    const runnerUp = leaderboard.find((e) => e.score != null && e.score !== topScore);
    if (!runnerUp || runnerUp.score == null) return null;
    return Math.abs(runnerUp.score - topScore);
  })();

  // Venue meta line: {venue} · {city}, {country} · Par {n} · {yds} yds
  const cityCountry = [meta.venue_city, meta.venue_country].filter(Boolean).join(', ');
  const venueLine = [
    meta.venue_name,
    cityCountry || null,
    meta.venue_par ? t('board.meta.par', { par: meta.venue_par }) : null,
    meta.venue_yardage
      ? t('tournament.eventInfo.yardageShort', { yardage: formatNumber(meta.venue_yardage) })
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const tourLabel = (meta.tour_full_name ?? tourCode ?? '').toUpperCase();

  // State chip (LIVE·R{n} / UPCOMING·{TOUR} / FINAL·{TOUR}).
  const chip = (() => {
    if (state === 'live') {
      const round = meta.current_round ?? 1;
      // Calendar rolled over, today's round has not teed off: show the round
      // without the LIVE treatment (reuse the neutral/upcoming pill style).
      if (meta.current_round_status === 'scheduled') {
        return {
          label: t('tournament.hero.chip.roundN', { round, defaultValue: `ROUND ${round}` }).toUpperCase(),
          color: '#fff',
          border: 'rgba(255,255,255,0.42)',
          bg: 'rgba(255,255,255,0.10)',
        };
      }
      return {
        label: `${t('status.live')} · R${round}`,
        color: GREEN_LIVE,
        border: 'rgba(110,231,183,0.55)',
        bg: 'rgba(16,185,129,0.14)',
      };
    }
    if (state === 'completed') {
      return {
        label: `${t('status.final')}${tourLabel ? ` · ${tourLabel}` : ''}`,
        color: GOLD,
        border: 'rgba(251,188,46,0.55)',
        bg: 'rgba(251,188,46,0.12)',
      };
    }
    return {
      label: t('tournament.hero.chip.upcomingTour', {
        tour: tourLabel,
        defaultValue: tourLabel ? `UPCOMING · ${tourLabel}` : 'UPCOMING',
      }),
      color: '#fff',
      border: 'rgba(255,255,255,0.42)',
      bg: 'rgba(255,255,255,0.10)',
    };
  })();

  // Countdown for upcoming (feeds the figure row).
  const countdown = (() => {
    if (state !== 'upcoming' || !startDate) return null;
    const totalMs = startDate.getTime() - now.getTime();
    if (totalMs <= 0) return null;
    const totalMin = Math.max(0, Math.floor(totalMs / 60000));
    const d = Math.floor(totalMin / 1440);
    const h = Math.floor((totalMin % 1440) / 60);
    const m = totalMin % 60;
    return { d, h, m };
  })();

  /**
   * THE THREE FIGURES - the same row in every state, so the hero reads as one
   * component with a state input rather than three bespoke bands.
   *   live      -> leader to par / thru / round
   *   upcoming  -> days / hrs / min (or days + purse when the clock is gone)
   *   completed -> winning score / margin / purse
   */
  const figures: Array<{ value: string; label: string; tone?: string }> = (() => {
    if (state === 'live' && leader) {
      const out: Array<{ value: string; label: string; tone?: string }> = [
        {
          value: leader.score == null ? 'E' : fmtScore(leader.score),
          label: t('board.columns.tot'),
          tone: getScoreColor(leader.score, 'dark'),
        },
      ];
      if (leader.thru != null) {
        out.push({
          value: leader.thru >= 18 ? 'F' : String(leader.thru),
          label: t('board.columns.thru'),
        });
      }
      out.push({
        value: `R${meta.current_round ?? 1}`,
        label: t('board.columns.round', { defaultValue: 'ROUND' }),
      });
      return out;
    }

    if (state === 'upcoming') {
      const out: Array<{ value: string; label: string; tone?: string }> = [];
      if (countdown) {
        if (countdown.d > 0) {
          out.push({
            value: String(countdown.d),
            label: t('overview.comingUp.daysLabel', { defaultValue: 'DAYS' }),
          });
        }
        out.push({
          value: String(countdown.h),
          label: t('overview.cinematic.countdownHoursLabel', { defaultValue: 'HRS' }),
        });
        out.push({
          value: String(countdown.m),
          label: t('overview.cinematic.countdownMinutesLabel', { defaultValue: 'MIN' }),
        });
      } else if (daysUntil != null) {
        out.push({
          value: String(daysUntil),
          label: t('overview.comingUp.daysLabel', { defaultValue: 'DAYS' }),
        });
      }
      if (out.length < 3 && meta.purse != null) {
        out.push({ value: formatPurse(meta.purse), label: t('tournament.hero.purseLabel') });
      }
      return out.slice(0, 3);
    }

    if (state === 'completed' && champion) {
      const out: Array<{ value: string; label: string; tone?: string }> = [
        {
          value: champion.score == null ? 'E' : fmtScore(champion.score),
          label: t('tournament.hero.winningLabel', { defaultValue: 'WINNING SCORE' }),
          tone: GOLD,
        },
      ];
      if (margin != null) {
        out.push({
          value: margin === 0 ? 'E' : `+${margin}`,
          label: t('tournament.hero.marginLabel', { defaultValue: 'MARGIN' }),
        });
      }
      if (meta.purse != null) {
        out.push({ value: formatPurse(meta.purse), label: t('tournament.hero.purseLabel') });
      }
      return out.slice(0, 3);
    }

    return [];
  })();



  /**
   * THE ACTION ROW — one disclosure at the foot of the hero.
   * Targets are the page's OWN existing in-page anchor (#the-act, the target
   * TournamentPage's inbound ?tab=leaderboard / ?tab=tee-times deep link
   * scrolls to at TournamentPage.tsx:127-141). No new route is invented and
   * TournamentPage is not edited, so no sheet is opened from here.
   */
  const actionLabel =
    state === 'live'
      ? t('tournament.shell.board.action')
      : state === 'completed'
        ? t('tournament.shell.leaderboard.finalEyebrow')
        : t('tournament.teeTimesBand.title');

  const onAction = () => {
    const el = document.getElementById('the-act');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div style={{ fontFamily: FONT, color: '#fff' }}>
      {/* PHOTO BAND — chip, title, venue line. Nothing else. */}
      <div
        style={{
          position: 'relative',
          minHeight: HERO_MIN_H,
          paddingTop: 'max(env(safe-area-inset-top, 0px), 48px)',
          background,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
        }}
      >
        <div style={{ padding: '10px 16px 12px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px 8px',
              borderRadius: 4,
              background: chip.bg,
              border: `1px solid ${chip.border}`,
              // AXIS 10 (hero exception): status marker chip.
              fontSize: 10,
              fontWeight: 700,
              color: chip.color,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            {chip.label}
          </div>

          <h1
            style={{
              fontSize: 'clamp(22px, 7.2vw, 28px)',
              fontWeight: 700,
              color: '#fff',
              lineHeight: 1.04,
              letterSpacing: '-0.02em',
              margin: 0,
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              overflow: 'hidden',
            }}
          >
            {meta.name}
          </h1>

          {venueLine && (
            <div
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: 'rgba(255,255,255,0.65)',
                marginTop: 4,
                fontVariantNumeric: 'tabular-nums lining-nums',
              }}
            >
              {venueLine}
            </div>
          )}
        </div>
      </div>

      {/* STAT STRIP — three figures on HERO_BOARD_SURFACE_SOFT, the surface the
          photo gradient terminates on. Renders whatever the state produced;
          never padded to three. */}
      {figures.length > 0 && (
        <div
          style={{
            background: HERO_BOARD_SURFACE_SOFT,
            padding: '12px 16px 14px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}
        >
          {figures.map((f) => (
            <Figure key={f.label} value={f.value} label={f.label} tone={f.tone} />
          ))}
        </div>
      )}

      {/* PERSON BAND — one row on HERO_BOARD_SURFACE. */}
      {state === 'live' && leader && (
        <PersonLockup
          label={t('tournament.hero.leaderLabel')}
          name={leader.player?.full_name ?? t('tournament.hero.tbdPlayer')}
          sub={
            leader.today != null
              ? t('board.columns.today') + ' ' + fmtScore(leader.today)
              : null
          }
          playerId={leader.player?.id ?? null}
          photoUrl={leader.player?.photo_url ?? null}
          tourCode={tourCode}
          showAvatar
        />
      )}

      {state === 'upcoming' && (
        <PersonLockup
          label={t('tournament.hero.defendingLabel', { defaultValue: 'DEFENDING CHAMPION' })}
          labelTone={GOLD}
          icon={<Star size={11} fill={GOLD} color={GOLD} strokeWidth={0} />}
          name={defendingChamp?.name ?? meta.defending_champion ?? t('tournament.hero.tbdPlayer')}
          sub={[defendingChamp?.year, defendingChamp?.score].filter(Boolean).join(' \u00B7 ') || null}
          tourCode={tourCode}
        />
      )}

      {state === 'completed' && champion && (
        <PersonLockup
          label={t('tournament.hero.championLabel', { defaultValue: 'CHAMPION' })}
          labelTone={GOLD}
          icon={<Trophy size={11} color={GOLD} strokeWidth={2.4} />}
          name={champion.player?.full_name ?? t('tournament.hero.championFallback')}
          playerId={champion.player?.id ?? null}
          photoUrl={champion.player?.photo_url ?? null}
          tourCode={tourCode}
          showAvatar
        />
      )}

      {/* ACTION ROW */}
      <button
        type="button"
        onClick={onAction}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: HERO_BOARD_SURFACE,
          borderTop: `0.5px solid ${WHITE_ALPHA_12}`,
          borderLeft: 'none',
          borderRight: 'none',
          borderBottom: 'none',
          padding: '11px 16px',
          textAlign: 'left',
          cursor: 'pointer',
          fontFamily: FONT,
        }}
      >
        <span
          style={{
            // AXIS 10 (hero exception): disclosure label, tracked caps.
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: WHITE_ALPHA_65,
          }}
        >
          {actionLabel}
        </span>
        <ChevronRight size={14} strokeWidth={2.5} color={WHITE_ALPHA_65} style={{ marginLeft: 'auto' }} aria-hidden />
      </button>
    </div>
  );
}

