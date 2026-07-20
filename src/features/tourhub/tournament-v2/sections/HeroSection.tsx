/**
 * HeroSection — cinematic tournament hero (mock: tournament-hero-states).
 *
 * Full-bleed course image (useSingleCourseImage) under the same scrim as the
 * overview cinematic hero. NO boxed glass panel — content sits directly on
 * the scrim above a 0.5px hairline; a state band pivots on `state`
 * (live -> LEADER row, upcoming -> DEFENDING + countdown, completed ->
 * CHAMPION + winning score).
 */
import { differenceInCalendarDays } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Trophy, Star } from 'lucide-react';
import { PlayerAvatar } from '../../components/PlayerAvatar';
import { LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { formatPurse } from '../../_shared/formatPurse';
import { formatNumber } from '@/i18n/format';
import { FONT, WHITE_ALPHA_65 } from '../../_shared/tokens';
import { useTournamentDefendingChamp } from '../../hooks/useTournamentDefendingChamp';

import type { TournamentMeta } from '../../leaderboard/useTournamentMeta';
import type { EventState } from '../../components/overview-v3/useTournamentPulse';

// Canonical hero height (matches GolfClubView / course detail hero).
const HERO_MIN_H =
  'calc(clamp(380px, 44dvh, 460px) + env(safe-area-inset-top, 0px))';

// Same scrim as CinematicHeroFullBleed (overview hero) — grep both files.
const CINEMATIC_SCRIM =
  'linear-gradient(180deg, rgba(15,23,42,0.10) 0%, rgba(15,23,42,0) 30%, rgba(15,23,42,0.32) 58%, rgba(13,30,22,0.82) 100%)';
const FALLBACK_BG = 'linear-gradient(180deg, #0A0E14 0%, #1A2130 100%)';
const IMAGE_FOCAL = '50% 72%';
const TEXT_SHADOW = '0 2px 16px rgba(0,0,0,0.55)';
const HAIRLINE = 'rgba(255,255,255,0.18)';

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

function fmtScoreSigned(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n === 0) return 'E';
  return n > 0 ? `+${n}` : String(n);
}

function CountdownTile({ value, label }: { value: number; label: string }) {
  return (
    <div
      style={{
        minWidth: 52,
        padding: '8px 10px',
        borderRadius: 10,
        background: 'rgba(255,255,255,0.10)',
        backdropFilter: 'blur(10px) saturate(140%)',
        WebkitBackdropFilter: 'blur(10px) saturate(140%)',
        border: '0.5px solid rgba(255,255,255,0.16)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <span
        style={{
          fontSize: 17,
          fontWeight: 800,
          lineHeight: 1,
          color: '#fff',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.01em',
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: 7.5,
          fontWeight: 700,
          letterSpacing: '0.14em',
          color: 'rgba(255,255,255,0.62)',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
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

  const background = imageUrl
    ? `${CINEMATIC_SCRIM}, url("${imageUrl}") ${IMAGE_FOCAL} / cover no-repeat`
    : `${CINEMATIC_SCRIM}, ${FALLBACK_BG}`;

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

  // Countdown tiles for upcoming.
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

  return (
    <div
      style={{
        position: 'relative',
        minHeight: HERO_MIN_H,
        paddingTop: 'max(env(safe-area-inset-top, 0px), 48px)',
        background,
        fontFamily: FONT,
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      <div style={{ padding: '16px' }}>
        {/* Shared lockup */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 8px',
            borderRadius: 4,
            background: chip.bg,
            border: `1px solid ${chip.border}`,
            fontSize: 9.5,
            fontWeight: 800,
            color: chip.color,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            marginBottom: 12,
            textShadow: TEXT_SHADOW,
          }}
        >
          {chip.label}
        </div>

        <h1
          style={{
            fontSize: 27,
            fontWeight: 800,
            color: '#fff',
            lineHeight: 1.02,
            letterSpacing: '-0.02em',
            margin: 0,
            textShadow: TEXT_SHADOW,
          }}
        >
          {meta.name}
        </h1>

        {venueLine && (
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.65)',
              marginTop: 6,
              fontVariantNumeric: 'tabular-nums',
              textShadow: TEXT_SHADOW,
            }}
          >
            {venueLine}
          </div>
        )}

        {/* Hairline separator (0.5px, no boxed panel). */}
        <div
          style={{
            height: 0,
            borderTop: `0.5px solid ${HAIRLINE}`,
            marginTop: 14,
            marginBottom: 12,
          }}
        />

        {/* STATE BAND: LIVE */}
        {state === 'live' && leader && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <PlayerAvatar
              playerId={leader.player?.id ?? ''}
              playerName={leader.player?.full_name ?? ''}
              tourCode={tourCode}
              photoUrl={leader.player?.photo_url ?? null}
              size="md"
              ringColor={LIGHT_HAIRLINE}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  color: 'rgba(255,255,255,0.62)',
                  textTransform: 'uppercase',
                  textShadow: TEXT_SHADOW,
                }}
              >
                {t('tournament.hero.leaderLabel')}
              </div>
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: '#fff',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginTop: 2,
                  textShadow: TEXT_SHADOW,
                }}
              >
                {leader.player?.full_name ?? t('tournament.hero.tbdPlayer')}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: LEADER_RED,
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.01em',
                  textShadow: TEXT_SHADOW,
                }}
              >
                {fmtScoreSigned(leader.score)}
              </div>
              {leader.thru != null && (
                <div
                  style={{
                    fontSize: 10,

                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    color: 'rgba(255,255,255,0.62)',
                    textTransform: 'uppercase',
                    marginTop: 4,
                    textShadow: TEXT_SHADOW,
                  }}
                >
                  {t('tournament.hero.thru', {
                    thru: leader.thru === 18 ? 'F' : leader.thru,
                    defaultValue: `THRU ${leader.thru === 18 ? 'F' : leader.thru}`,
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STATE BAND: UPCOMING */}
        {state === 'upcoming' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 9.5,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  color: GOLD,
                  textTransform: 'uppercase',
                  textShadow: TEXT_SHADOW,
                }}
              >
                <Star size={11} fill={GOLD} color={GOLD} strokeWidth={0} />
                {t('tournament.hero.defendingLabel', { defaultValue: 'DEFENDING CHAMPION' })}
              </div>
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: '#fff',
                  marginTop: 3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textShadow: TEXT_SHADOW,
                }}
              >
                {defendingChamp?.name ?? meta.defending_champion ?? '—'}
              </div>
              {(defendingChamp?.year || defendingChamp?.score) && (
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: WHITE_ALPHA_65,
                    marginTop: 2,
                    fontVariantNumeric: 'tabular-nums',
                    textShadow: TEXT_SHADOW,
                  }}
                >
                  {[defendingChamp?.year, defendingChamp?.score].filter(Boolean).join(' · ')}
                </div>
              )}
            </div>
            {countdown && (
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {countdown.d > 0 && (
                  <CountdownTile
                    value={countdown.d}
                    label={t('overview.comingUp.daysLabel', { defaultValue: 'DAYS' })}
                  />
                )}
                <CountdownTile
                  value={countdown.h}
                  label={t('overview.cinematic.countdownHoursLabel', { defaultValue: 'HRS' })}
                />
                <CountdownTile
                  value={countdown.m}
                  label={t('overview.cinematic.countdownMinutesLabel', { defaultValue: 'MIN' })}
                />
              </div>
            )}
            {!countdown && daysUntil != null && (
              <CountdownTile
                value={daysUntil}
                label={t('overview.comingUp.daysLabel', { defaultValue: 'DAYS' })}
              />
            )}
          </div>
        )}

        {/* STATE BAND: FINAL */}
        {state === 'completed' && champion && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 9.5,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  color: GOLD,
                  textTransform: 'uppercase',
                  textShadow: TEXT_SHADOW,
                }}
              >
                <Trophy size={11} color={GOLD} strokeWidth={2.4} />
                {t('tournament.hero.championLabel', { defaultValue: 'CHAMPION' })}
              </div>
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: '#fff',
                  marginTop: 3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textShadow: TEXT_SHADOW,
                }}
              >
                {champion.player?.full_name ?? t('tournament.hero.championFallback')}
              </div>
              {(margin != null || meta.purse != null) && (
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: WHITE_ALPHA_65,
                    marginTop: 2,
                    fontVariantNumeric: 'tabular-nums',
                    textShadow: TEXT_SHADOW,
                  }}
                >
                  {[
                    margin != null
                      ? t('tournament.hero.wonBy', {
                          margin,
                          defaultValue: `Won by ${margin}`,
                        })
                      : null,
                    meta.purse != null ? formatPurse(meta.purse) : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: GOLD,
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.01em',
                  textShadow: TEXT_SHADOW,
                }}
              >
                {fmtScoreSigned(champion.score)}
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  color: 'rgba(255,255,255,0.62)',
                  textTransform: 'uppercase',
                  marginTop: 4,
                  textShadow: TEXT_SHADOW,
                }}
              >
                {t('tournament.hero.holesLabel', { defaultValue: '72 HOLES' })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
