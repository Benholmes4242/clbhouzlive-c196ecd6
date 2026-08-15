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
import { FONT, HERO_BOARD_SURFACE } from '../../../_shared/tokens';
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

      {/* Bottom scrim — heavier so the lower-third holds legibility, and it ENDS
          on HERO_BOARD_SURFACE so the seam into the board below is invisible.
          Ending on rgba(0,0,0,0.92) let the green base gradient bleed through as
          a cast at the top of the board. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0, right: 0, bottom: 0, height: 260,
          background:
            `linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0.85) 78%, ${HERO_BOARD_SURFACE} 100%)`,
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
                      fontSize: 9,
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
