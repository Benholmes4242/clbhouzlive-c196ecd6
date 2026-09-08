/**
 * THE FULL SCHEDULE (BRIEF_TOUR_REBUILD).
 *
 * The see-all destination for Coming Up. Same row, imported not restated, so the
 * five on the page and the hundred here cannot drift apart.
 *
 * The header owns the safe area; the foot pays NAV_CLEARANCE.
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

import { DISCOVER_QUIET, FIGS, SANS } from '@/components/explore-tab-new/courseled/tokens';
import { FONT, INK } from '@/features/tourhub/_shared/tokens';
import { NAV_CLEARANCE } from '@/lib/navClearance';
import { analyticsEvents } from '@/utils/analyticsEvents';

import { ComingUpRow, useComingUp } from './TourComingUpBlock';

const CANVAS = '#0D0F14';

const KICKER: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.13em',
  textTransform: 'uppercase',
};

export default function TourSchedulePage() {
  const navigate = useNavigate();
  const events = useComingUp();

  useEffect(() => {
    analyticsEvents.track('tour_schedule_viewed', { total: events.length });
  }, [events.length]);

  return (
    <div style={{ background: CANVAS, minHeight: '100dvh', fontFamily: FONT, ...FIGS }}>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: CANVAS,
          borderBottom: '0.5px solid rgba(255,255,255,0.12)',
          padding: `max(env(safe-area-inset-top, 0px), 47px) 14px 0`,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <button
          type="button"
          aria-label="Back"
          onClick={() => navigate(-1)}
          style={{
            height: 44,
            display: 'flex',
            alignItems: 'center',
            border: 0,
            background: 'transparent',
            padding: 0,
            color: INK,
            cursor: 'pointer',
          }}
        >
          <ChevronLeft size={22} strokeWidth={1.6} />
        </button>
        <span style={{ ...KICKER, height: 44, display: 'flex', alignItems: 'center', color: INK }}>
          Coming up
        </span>
      </header>

      <main style={{ padding: `12px 14px ${NAV_CLEARANCE}`, fontFamily: SANS }}>
        <div style={{ ...KICKER, color: DISCOVER_QUIET, paddingBottom: 8 }}>
          {events.length > 0 ? `${events.length} events` : ''}
        </div>
        {events.map((t) => (
          <ComingUpRow key={t.id} t={t} onPress={() => navigate(`/tourhub/tournament/${t.id}`)} />
        ))}
      </main>
    </div>
  );
}
