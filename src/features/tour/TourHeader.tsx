/**
 * THE TOUR HEADER (BRIEF_TOUR_REBUILD).
 *
 * Fixed, transparent over the hero photograph, solid once the page has moved.
 * THIS HEADER OWNS THE SAFE AREA and the page never pays it a second time —
 * the same single-owner rule the chrome islands settled for every immersive
 * route. The registry marks /tour chrome:'none', so there is no island here to
 * double up with.
 *
 * No burger, no tabs: one page, one scroll. The only control is the wire link,
 * because the news block is capped and the wire is the rest of it.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { FONT, INK, INK_MUTE } from '@/features/tourhub/_shared/tokens';

/** The bar itself, excluding the notch. */
export const TOUR_HEADER_H = 44;

export function TourHeader() {
  const navigate = useNavigate();
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    /* The threshold is the hero's own depth minus the bar: the header goes
       solid at the moment the photograph stops being behind it. */
    const onScroll = () => setSolid((window.scrollY || 0) > 280);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
        height: `calc(max(env(safe-area-inset-top, 0px), 47px) + ${TOUR_HEADER_H}px)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `max(env(safe-area-inset-top, 0px), 47px) 14px 0`,
        background: solid ? '#0D0F14' : 'transparent',
        borderBottom: solid ? '0.5px solid rgba(255,255,255,0.12)' : '0.5px solid transparent',
        transition: 'background 160ms linear, border-color 160ms linear',
        fontFamily: FONT,
      }}
    >
      <span
        style={{
          height: TOUR_HEADER_H,
          display: 'flex',
          alignItems: 'center',
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: '0.13em',
          textTransform: 'uppercase',
          color: INK,
          textShadow: solid ? 'none' : '0 1px 2px rgba(0,0,0,0.72)',
        }}
      >
        Tour
      </span>

      <button
        type="button"
        onClick={() => navigate('/tour/news')}
        style={{
          height: TOUR_HEADER_H,
          display: 'flex',
          alignItems: 'center',
          border: 0,
          background: 'transparent',
          padding: 0,
          fontFamily: FONT,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.13em',
          textTransform: 'uppercase',
          color: solid ? INK_MUTE : INK,
          textShadow: solid ? 'none' : '0 1px 2px rgba(0,0,0,0.72)',
          cursor: 'pointer',
        }}
      >
        Wire
      </button>
    </header>
  );
}

export default TourHeader;
