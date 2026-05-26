/**
 * PhotoBand — universal 310px photo + scrims + state-coloured eyebrow + title.
 * §4 of HYBRID_HERO_IMPLEMENTATION_BRIEF.
 */

import React from 'react';
import { Star } from 'lucide-react';
import {
  PHOTO_BAND_HEIGHT,
  COURSE_GRADIENT,
  COURSE_GRADIENT_DUSK,
  COURSE_SCRIMS,
  LEGIBILITY_SCRIM,
  GOLD,
  AMBER,
  GREEN_LIVE,
  RED,
  FONT_MONO,
} from '../HybridHero.constants';
import type { HeroState } from '../HybridHero.utils';

interface PhotoBandProps {
  title: string;
  venueName: string | null;
  venueCity: string | null;
  venueImageUrl: string | null;
  state: HeroState;
  tourLabel: string;
  isMajor?: boolean;
}

function MajorBadge() {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 9px 4px 7px',
        borderRadius: 999,
        background: 'rgba(255,184,0,0.22)',
        border: '1px solid rgba(255,184,0,0.45)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        color: '#FFB800',
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: '0.14em',
        textShadow: '0 1px 3px rgba(0,0,0,0.4)',
      }}
    >
      <Star size={10} fill="#FFB800" stroke="#FFB800" strokeWidth={1} />
      MAJOR
    </span>
  );
}

function StatusPill({ state }: { state: HeroState }) {
  if (state.kind === 'live') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          borderRadius: 999,
          background: 'rgba(22,163,74,0.18)',
          border: `0.5px solid ${GREEN_LIVE}`,
          color: '#86EFAC',
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: '0.16em',
        }}
      >
        <span
          className="hybrid-live-pulse"
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: GREEN_LIVE,
            display: 'inline-block',
          }}
        />
        LIVE
      </span>
    );
  }
  if (state.kind === 'results') {
    if (state.variant === 'cancelled') {
      return (
        <Pill bg="rgba(220,38,38,0.18)" border={RED} color="#FCA5A5">
          CANCELLED
        </Pill>
      );
    }
    if (state.variant === 'declared') {
      return (
        <Pill bg="rgba(247,147,30,0.18)" border={AMBER} color="#FED7AA">
          DECLARED · 54 HOLES
        </Pill>
      );
    }
    if (state.variant === 'awaiting-playoff') {
      return (
        <Pill bg="rgba(251,188,46,0.18)" border={GOLD} color={GOLD}>
          🏆 PLAYOFF · IN PROGRESS
        </Pill>
      );
    }
    return null;

  }
  // Upcoming
  return (
    <Pill bg="rgba(247,147,30,0.18)" border={AMBER} color="#FED7AA">
      ⏱ UPCOMING
    </Pill>
  );
}

function Pill({
  children,
  bg,
  border,
  color,
}: {
  children: React.ReactNode;
  bg: string;
  border: string;
  color: string;
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 10px',
        borderRadius: 999,
        background: bg,
        border: `0.5px solid ${border}`,
        color,
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: '0.16em',
      }}
    >
      {children}
    </span>
  );
}

function rightTimestamp(state: HeroState): string {
  if (state.kind === 'live') {
    return `R${state.round} OF ${state.totalRounds} · ${state.thruLabel}`;
  }
  if (state.kind === 'results') {
    if (state.variant === 'cancelled') return `${state.finishDate ? state.meta : ''} · CANCELLED`;
    if (state.variant === 'awaiting-playoff') return 'R4 · PLAYOFF';
    if (state.variant === 'declared') return `3 OF 4 · WEATHER`;
    // Pass 1: date range MMM D – MMM D (state.meta is built upstream in deriveHeroState)
    return state.meta || '';
  }
  return state.countdown;
}

export function PhotoBand({
  title,
  venueName,
  venueCity,
  venueImageUrl,
  state,
  tourLabel,
  isMajor = false,
}: PhotoBandProps) {
  const useDusk = state.kind === 'results' && (state.variant === 'declared' || state.variant === 'cancelled');
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
      {/* gradient base */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: useDusk ? COURSE_GRADIENT_DUSK : COURSE_GRADIENT,
          zIndex: 0,
        }}
      />
      {/* image */}
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
      {/* scrims */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: COURSE_SCRIMS, zIndex: 2 }} />
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: LEGIBILITY_SCRIM, zIndex: 2 }} />

      {/* eyebrow row */}
      <div
        style={{
          position: 'absolute',
          top: 18,
          left: 20,
          right: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 3,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isMajor ? (
            <MajorBadge />
          ) : (
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.18em',
                color: 'rgba(255,255,255,0.85)',
                textShadow: '0 1px 3px rgba(0,0,0,0.4)',
              }}
            >
              {tourLabel}
            </span>
          )}
          <StatusPill state={state} />
        </div>
        <span
          style={{
            fontFamily: FONT_MONO,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: 'rgba(255,255,255,0.85)',
            textShadow: '0 1px 3px rgba(0,0,0,0.4)',
            whiteSpace: 'nowrap',
          }}
        >
          {rightTimestamp(state)}
        </span>
      </div>

      {/* title block */}
      <div
        style={{
          position: 'absolute',
          left: 20,
          right: 20,
          bottom: 20,
          zIndex: 3,
        }}
      >
        <h1 className="hybrid-hero-title">{title}</h1>
        {venueName && (
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.80)',
              marginTop: 10,
              textShadow: '0 1px 3px rgba(0,0,0,0.45)',
              letterSpacing: '0.02em',
            }}
          >
            {venueName}
            {venueCity ? ` · ${venueCity}` : ''}
          </div>
        )}
      </div>
    </div>
  );
}
