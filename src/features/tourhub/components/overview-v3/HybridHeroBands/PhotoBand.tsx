/**
 * TYPE — THE HERO EXCEPTION (BRIEF_TOUR_OVERVIEW_TYPE_SCALE, Part 2).
 * The hero is a broadcast surface. Tracked-out caps over photography read
 * larger than their point size, so a ticker segment, a band label or a rank
 * marker takes the AXIS floor of 10 rather than the READ floor of 11 — the
 * same exception granted to the scorecard axis and the chart ticks. It covers
 * COORDINATES AND MARKERS ONLY. It does NOT cover leader names, tournament
 * names, course names, scores, or any sentence: those are language and take
 * 11. Nothing goes below 10.
 */
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
 * The lower-third stack now sits directly above the wire ticker; the removed
 * dots row freed the gap, so the title, venue, and moment chip move down.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';

import {
  PHOTO_BAND_HEIGHT,
  COURSE_GRADIENT,
  COURSE_GRADIENT_DUSK,
  NUMERIC_STYLE,
} from '../HybridHero.constants';
import { CHARCOAL, FONT } from '../../../_shared/tokens';
import { heroCanonScrimOn } from '../../../_shared/heroGradient';
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
  const titleSplit = splitTitle(title);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        // HARD height, not a floor. It ABSORBS the safe-area inset so the hero
        // column (photo + 36px ticker) exactly fills OVERVIEW_HERO_TOTAL_HEIGHT
        // — otherwise the inset showed as a white gap above the live board.
        height: `calc(${PHOTO_BAND_HEIGHT}px + env(safe-area-inset-top, 0px))`,
        // MICRO_BRIEF_TOUR_OVERVIEW_HERO_CANON_LAYERING took this hero's RAMP
        // and LAYERING onto the canon but DELIBERATELY NOT its height: HERO_MIN_H
        // ADDS the inset and is a floor, while PHOTO_BAND_HEIGHT is a term in
        // TOTAL_HERO_HEIGHT_TARGET and must ABSORB the inset. Do not "finish the
        // job" by swapping in HERO_MIN_H — it re-opens the white-gap bug.

        flexGrow: 0,
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
      {/* ONE gradient over the photograph — MICRO_BRIEF_TOUR_OVERVIEW_HERO_CANON_LAYERING.
          The radial ambient (COURSE_SCRIMS, green included) and the 80px top
          scrim are deleted; this is the canon ramp shared with the other six
          heroes.

          The ramp ends on the shared page canvas so the photograph, ticker,
          leaderboard and the content below read as one continuous surface. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0, right: 0, bottom: 0, height: 260,
          background: heroCanonScrimOn(CHARCOAL),
          zIndex: 2,
        }}
      />

      {/* Top eyebrow removed per brief — tour name and dates no longer displayed on hero */}



      {/* Lower-third stack — pulled down to the wire-ticker boundary now that
          the carousel dots are removed. */}
      <div
        style={{
          position: 'absolute',
          left: 20, right: 20, bottom: 8,
          zIndex: 3,
          display: 'flex', flexDirection: 'column', gap: 10,
        }}
      >
        {/* Title — clamped to two lines; long sponsor-prefixed names step down
            rather than clip mid-word (threshold from real sr_tournaments names). */}
        <h1
          style={{
            margin: 0,
            color: 'white',
            fontFamily: FONT,
            fontSize: title.length > 30 ? 25 : 30,
            fontWeight: 700,
            lineHeight: 0.96,
            letterSpacing: '-0.025em',
            textShadow: '0 2px 12px rgba(0,0,0,0.55)',
            textWrap: 'balance',
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
            overflow: 'hidden',
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
                      fontSize: 10 /* AXIS 10 — HERO BROADCAST EXCEPTION: tracked marker/coordinate over photography (see file header) */,
                      fontWeight: 700,
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
                      fontWeight: 700,
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
                  fontSize: 11,
                  fontWeight: 700,
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
