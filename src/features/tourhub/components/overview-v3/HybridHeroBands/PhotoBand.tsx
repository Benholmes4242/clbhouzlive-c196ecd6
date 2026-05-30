/**
 * PhotoBand — Pass 7. 360px hero photo with broadcast title block:
 * top eyebrow (status tag + tour meta), bottom title block with lede,
 * 2-line title split, and venue · dates row. TourSwitcherOverlay removed.
 */

import React from 'react';
import { Star } from 'lucide-react';
import {
  PHOTO_BAND_HEIGHT,
  COURSE_GRADIENT,
  COURSE_GRADIENT_DUSK,
  COURSE_SCRIMS,
  GOLD,
  AMBER,
  GREEN_LIVE,
  NUMERIC_STYLE,
} from '../HybridHero.constants';
import { FONT, STATUS_LIVE, WHITE_ALPHA_55 } from '../../../_shared/tokens';
import type { HeroState } from '../HybridHero.utils';

interface PhotoBandProps {
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
}

function StatusTag({ state }: { state: HeroState }) {
  const isLive = state.kind === 'live';
  const isResults = state.kind === 'results';
  const dotColor = isLive ? STATUS_LIVE : AMBER;
  let label = isLive ? 'LIVE' : isResults ? 'FINAL' : 'UPCOMING';
  if (isResults && state.variant === 'cancelled') label = 'CANCELLED';
  else if (isResults && state.variant === 'awaiting-playoff') label = 'PLAYOFF';
  else if (isResults && state.variant === 'declared') label = 'DECLARED';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 999,
        background: 'rgba(0,0,0,0.45)',
        border: `0.5px solid rgba(255,255,255,0.25)`,
        backdropFilter: 'blur(4px)',
        color: 'white',
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: '0.18em',
      }}
    >
      <span
        className={isLive ? 'hybrid-live-pulse' : undefined}
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: dotColor,
          display: 'inline-block',
        }}
      />
      {label}
    </span>
  );
}

function ledeLine(state: HeroState, winnerName?: string | null): string | null {
  if (state.kind === 'results' && winnerName) return `Won by ${winnerName}`;
  if (state.kind === 'live') {
    return `Round ${state.round}`;
  }
  if (state.kind === 'upcoming') return state.countdown || null;
  return null;
}

function splitTitle(title: string): { main: string; sub: string } {
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
  winnerName,
  isMajor,
  isSignature,
  datesString,
}: PhotoBandProps) {
  const useDusk =
    state.kind === 'results' && (state.variant === 'declared' || state.variant === 'cancelled');
  const lede = ledeLine(state, winnerName);
  const titleSplit = splitTitle(title);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: PHOTO_BAND_HEIGHT,
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
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
            objectPosition: 'center',
            zIndex: 1,
          }}
        />
      )}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: COURSE_SCRIMS, zIndex: 2 }} />

      {/* Lighter top scrim — Pass 7 */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 70,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0) 100%)',
          zIndex: 2,
        }}
      />

      {/* Heavier bottom scrim — Pass 7 */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 220,
          background:
            'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.45) 35%, rgba(0,0,0,0.78) 75%, rgba(0,0,0,0.88) 100%)',
          zIndex: 2,
        }}
      />

      {/* Top eyebrow row — status tag left, tour meta right */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 20,
          right: 20,
          zIndex: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <StatusTag state={state} />
        {tourLabel && (
          <span
            style={{
              ...NUMERIC_STYLE,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.16em',
              color: 'rgba(255,255,255,0.75)',
              textShadow: '0 1px 3px rgba(0,0,0,0.45)',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            {tourLabel}
          </span>
        )}
      </div>

      {/* Bottom title block */}
      <div
        style={{
          position: 'absolute',
          left: 20,
          right: 20,
          bottom: 20,
          zIndex: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {(lede || isMajor || isSignature) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.14em',
              color: 'rgba(255,255,255,0.85)',
              textTransform: 'uppercase',
              textShadow: '0 1px 3px rgba(0,0,0,0.45)',
            }}
          >
            {lede && <span>{lede}</span>}
            {isMajor && (
              <Star size={12} fill={GOLD} color={GOLD} strokeWidth={0} style={{ flexShrink: 0 }} />
            )}
            {isSignature && (
              <span style={{ color: AMBER, fontSize: 9, letterSpacing: '0.18em' }}>
                SIGNATURE EVENT
              </span>
            )}
          </div>
        )}

        <h1
          style={{
            margin: 0,
            color: 'white',
            fontFamily: FONT,
            fontSize: 36,
            fontWeight: 800,
            lineHeight: 0.95,
            letterSpacing: '-0.02em',
            textShadow: '0 2px 12px rgba(0,0,0,0.55)',
          }}
        >
          <span>{titleSplit.main}</span>
          {titleSplit.sub && (
            <>
              <br />
              <span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
                {titleSplit.sub}
              </span>
            </>
          )}
        </h1>

        {(venueName || datesString) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 11,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.75)',
              textShadow: '0 1px 3px rgba(0,0,0,0.45)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {venueName && (
              <span
                style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  minWidth: 0,
                }}
              >
                {venueName}
                {venueCity ? ` · ${venueCity}` : ''}
              </span>
            )}
            {venueName && datesString && (
              <span
                aria-hidden="true"
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: '50%',
                  background: WHITE_ALPHA_55,
                  flexShrink: 0,
                }}
              />
            )}
            {datesString && (
              <span style={{ ...NUMERIC_STYLE, whiteSpace: 'nowrap', flexShrink: 0 }}>
                {datesString}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
