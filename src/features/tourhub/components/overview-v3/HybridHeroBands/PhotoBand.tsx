/**
 * PhotoBand — Tour Hub hero photo band (Lower-Third redesign).
 *
 * Full-bleed venue image with a bottom-anchored editorial lower-third that
 * collapses everything the old MiddleBand tried to carry (status, insight,
 * headline moment) into one legible stack over the image.
 *
 * Stack (bottom → up):
 *   1. TOURNAMENT link (right-aligned CTA, amber)
 *   2. Moment row      — leader / champion / defending champ chip
 *   3. Venue · Dates
 *   4. Title (2-line split — headline + subhead)
 *   5. Insight line    — labelled editorial line (AI course insight / winner narrative)
 *   6. State pill      — LIVE · FINAL · UPCOMING (with round/countdown)
 *
 * The dots row (rendered by OverviewHero) sits above the wire ticker below.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';

import {
  PHOTO_BAND_HEIGHT,
  COURSE_GRADIENT,
  COURSE_GRADIENT_DUSK,
  COURSE_SCRIMS,
  NUMERIC_STYLE,
} from '../HybridHero.constants';
import { FONT } from '../../../_shared/tokens';
import { getScoreColor } from '../../../_shared/scoreColor';

import { type HeroState } from '../HybridHero.utils';

/** Score chip colour: canonical to-par grammar on dark (red under par). */
function momentScoreColour(s: string): string {
  if (s.startsWith('\u2212') || s.startsWith('-')) return getScoreColor(-1, 'dark', 'standard');
  if (s.startsWith('+')) return getScoreColor(1, 'dark', 'standard');
  return getScoreColor(0, 'dark', 'standard');
}


export interface PhotoBandProps {
  title: string;
  venueName: string | null;
  venueCity: string | null;
  venueImageUrl: string | null;
  state: HeroState;
  tourLabel?: string | null;
  winnerName?: string | null;
  isMajor?: boolean;
  isSignature?: boolean;
  datesString?: string | null;
  /** Editorial line — AI course insight (upcoming/live) or derived winner beat (results). */
  insight?: string | null;
  /** Which kind of line `insight` carries — drives the kicker label. */
  insightKind?: 'course' | 'result';
  /** Moment row: single chip surfacing the headline person. */
  momentLabel?: string | null;
  momentName?: string | null;
  momentScore?: string | null;
  /** Optional right-side CTA (TOURNAMENT ›) */
  onCtaTap?: () => void;
  ctaLabel?: string;
  /** Extra venue data — surfaced by the enriched Insight sheet. All optional. */
  venueCourseName?: string | null;
  venueState?: string | null;
  venueCountry?: string | null;
  venuePar?: number | null;
  venueYardage?: number | null;
  purse?: number | null;
}

function statePillText(
  state: HeroState,
  t: (k: string, opts?: any) => string,
): { text: string; tone: 'live' | 'final' | 'upcoming' } {
  if (state.kind === 'live') {
    // Round has rolled over but play has not started: show the round only,
    // with the non-live pill treatment (no LIVE word, no live tint).
    if (state.roundStatus === 'scheduled') {
      return {
        text: `${t('tournament.hero.chip.roundN', { round: state.round, defaultValue: `ROUND ${state.round}` })}`.toUpperCase(),
        tone: 'upcoming',
      };
    }
    // Platform live marker copy — same string as the leaderboard masthead.
    return {
      text: t('tour.roundInProgress', { n: state.round }),
      tone: 'live',
    };

  }
  if (state.kind === 'results') {
    if (state.variant === 'cancelled') return { text: t('overview.pillState.cancelled'), tone: 'final' };
    if (state.variant === 'playoff') return { text: t('overview.pillState.playoff'), tone: 'final' };
    return { text: t('overview.pillState.final'), tone: 'final' };
  }
  return {
    text: state.countdown ? state.countdown.toUpperCase() : t('overview.pillState.upcoming'),
    tone: 'upcoming',
  };
}

function splitTitle(title: string): { main: string; sub: string } {
  // NEVER-KEY: source-derived title tokens (English data fields).
  const m = title.match(/^(.+?(?:CUP|OPEN|CHAMPIONSHIP|INVITATIONAL|CLASSIC))\s+(.+)$/i);
  if (m) return { main: m[1], sub: m[2] };
  return { main: title, sub: '' };
}

export function PhotoBand({
  title,
  venueName,
  venueCity,
  venueImageUrl,
  state,
  tourLabel,
  datesString,
  momentLabel,
  momentName,
  momentScore,
  onCtaTap,
  ctaLabel,
  venueCourseName = null,
  venueState = null,
  venueCountry = null,
  venuePar = null,
  venueYardage = null,
  purse = null,
}: PhotoBandProps) {
  const { t } = useTranslation('tourhub');
  const useDusk =
    state.kind === 'results' && (state.variant === 'declared' || state.variant === 'cancelled');
  const pill = statePillText(state, t);
  const titleSplit = splitTitle(title);

  // Live tone is the platform live marker: a 7px green dot with a soft halo
  // followed by a plain label. No capsule, no tint, no pulse (broadcast
  // convention, shared with the leaderboard masthead and the tour menu).
  const pillTone =
    pill.tone === 'live'
      ? {
          bg: 'transparent',
          color: 'rgba(255,255,255,0.98)',
          border: 'transparent',
          radius: 0,
          padding: 0,
          fontSize: 10,
          letterSpacing: '0.14em',
        }
      : pill.tone === 'final'
        ? {
            bg: 'rgba(255,255,255,0.14)',
            color: 'rgba(255,255,255,0.95)',
            border: 'transparent',
            radius: 999,
            padding: '4px 9px',
            fontSize: 10,
            letterSpacing: '0.14em',
          }
        : {
            bg: 'rgba(255,255,255,0.14)',
            color: 'rgba(255,255,255,0.95)',
            border: 'transparent',
            radius: 999,
            padding: '4px 9px',
            fontSize: 10,
            letterSpacing: '0.14em',
          };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        flex: 1,
        minHeight: PHOTO_BAND_HEIGHT,
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Base gradient (behind photo) */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: useDusk ? COURSE_GRADIENT_DUSK : COURSE_GRADIENT,
          zIndex: 0,
        }}
      />
      {venueImageUrl && (
        <img
          src={venueImageUrl}
          alt=""
          loading="lazy"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: '50% 55%',
            zIndex: 1,
          }}
        />
      )}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: COURSE_SCRIMS, zIndex: 2 }} />

      {/* Top scrim — protects the top eyebrow row */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, height: 80,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 100%)',
          zIndex: 2,
        }}
      />

      {/* Bottom scrim — heavier so the lower-third holds legibility */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0, right: 0, bottom: 0, height: 260,
          background:
            'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0.85) 78%, rgba(0,0,0,0.92) 100%)',
          zIndex: 2,
        }}
      />

      {/* Top eyebrow removed per brief — tour name and dates no longer displayed on hero */}



      {/* Lower-third stack */}
      <div
        style={{
          position: 'absolute',
          left: 20, right: 20, bottom: 18,
          zIndex: 3,
          display: 'flex', flexDirection: 'column', gap: 10,
        }}
      >
        {/* State pill — live is a dot + label, other states keep the capsule */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: pillTone.padding,
              borderRadius: pillTone.radius,
              background: pillTone.bg,
              color: pillTone.color,
              border: pillTone.border === 'transparent'
                ? undefined
                : `1px solid ${pillTone.border}`,
              fontSize: pillTone.fontSize,
              fontWeight: 800,
              letterSpacing: pillTone.letterSpacing,
              textTransform: 'uppercase',
              ...NUMERIC_STYLE,
              backdropFilter: pill.tone === 'live' ? undefined : 'blur(6px)',
              WebkitBackdropFilter: pill.tone === 'live' ? undefined : 'blur(6px)',
            }}
          >
            {pill.tone === 'live' && (
              <span
                aria-hidden
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#22C55E',
                  boxShadow: '0 0 0 3px rgba(34,197,94,0.18)',
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
            )}
            {pill.text}
          </span>
        </div>




        {/* Title */}
        <h1
          style={{
            margin: 0,
            color: 'white',
            fontFamily: FONT,
            fontSize: 34,
            fontWeight: 800,
            lineHeight: 0.96,
            letterSpacing: '-0.025em',
            textShadow: '0 2px 12px rgba(0,0,0,0.55)',
            textWrap: 'balance',
          }}
        >
          <span>{titleSplit.main}</span>
          {titleSplit.sub && (
            <>
              <br />
              <span style={{ color: 'rgba(255,255,255,0.72)', fontWeight: 600 }}>{titleSplit.sub}</span>
            </>
          )}
        </h1>

        {/* Venue */}
        {venueName && (
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.75)',
              textShadow: '0 1px 3px rgba(0,0,0,0.45)',
              letterSpacing: '0.01em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {venueName}
            {venueCity ? ` · ${venueCity}` : ''}
          </div>
        )}

        {/* Moment row + CTA */}
        {(momentName || onCtaTap) && (
          <div
            style={{
              marginTop: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            {momentName ? (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'baseline',
                  gap: 8,
                  padding: '6px 10px',
                  background: 'rgba(255,255,255,0.10)',
                  border: '0.5px solid rgba(255,255,255,0.18)',
                  borderRadius: 6,
                  backdropFilter: 'blur(6px)',
                  WebkitBackdropFilter: 'blur(6px)',
                  minWidth: 0,
                  maxWidth: '78%',
                }}
              >
                {momentLabel && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      letterSpacing: '0.14em',
                      color: 'rgba(255,255,255,0.65)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {momentLabel}
                  </span>
                )}
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'white',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    minWidth: 0,
                  }}
                >
                  {momentName}
                </span>
                {momentScore && (
                  <span
                    style={{
                      ...NUMERIC_STYLE,
                      fontSize: 13,
                      fontWeight: 800,
                      color: momentScoreColour(momentScore),
                    }}
                  >
                    {momentScore}
                  </span>
                )}
              </div>
            ) : (
              <span />
            )}

            {onCtaTap && (
              <button
                type="button"
                onClick={onCtaTap}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 2,
                  background: 'transparent',
                  border: 'none',
                  padding: '6px 4px',
                  margin: '-6px -4px',
                  cursor: 'pointer',
                  fontFamily: FONT,
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  // Quiet action on a dark hero band: white-62, never amber
                  // (ACTION INK FLIP). Amber here stays only on the figure above.
                  color: 'rgba(255,255,255,0.62)',
                  textTransform: 'uppercase',
                  textShadow: '0 1px 3px rgba(0,0,0,0.55)',
                  flexShrink: 0,
                }}
              >
                {ctaLabel ?? t('overview.photoBand.tournamentCta')}
                <ChevronRight size={14} strokeWidth={2.5} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
