/**
 * Pass 6: Dispatch · Moment of the Week.
 * 16:9 editorial card rendered directly below the hero CTA on Tour Hub Overview.
 * Returns null cleanly when no moment is currently featured.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatchMoment } from '../../hooks/useDispatchMoment';

const AMBER = '#F7931E';

function formatDuration(seconds: number | null): string {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export function DispatchModule() {
  const { data: moment, isLoading } = useDispatchMoment();
  const navigate = useNavigate();

  if (isLoading) return null;
  if (!moment) return null;

  const handleTap = () => {
    if (moment.streamId) {
      navigate(`/watch/${moment.streamId}`, {
        state: { from: 'dispatch', momentId: moment.id },
      });
    } else if (moment.tournamentId) {
      navigate(`/tour/tournament/${moment.tournamentId}`);
    }
  };

  return (
    <div style={{ background: '#F8FAFC', padding: '24px 16px 8px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 12,
        }}
      >
        <div>
          <div
            style={{
              color: AMBER,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.18em',
              fontFamily: "'Geist', sans-serif",
            }}
          >
            ◆ DISPATCH
          </div>
          <div
            style={{
              color: '#0F172A',
              fontSize: 17,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              marginTop: 2,
              fontFamily: "'Geist', sans-serif",
            }}
          >
            Moment of the week
          </div>
        </div>
        {moment.durationSeconds && (
          <div
            style={{
              color: 'rgba(15,23,42,0.45)',
              fontSize: 10,
              fontWeight: 600,
              fontFamily: "'Geist', sans-serif",
              fontVariantNumeric: 'tabular-nums',
              fontFeatureSettings: '"zero" 0',
            }}
          >
            {formatDuration(moment.durationSeconds)}
          </div>
        )}
      </div>

      <div
        onClick={handleTap}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleTap();
        }}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 9',
          borderRadius: 14,
          overflow: 'hidden',
          background: moment.posterUrl
            ? `url(${moment.posterUrl}) center / cover`
            : 'linear-gradient(160deg, #1a3a2a 0%, #4a7a5d 100%)',
          cursor: 'pointer',
        }}
        aria-label={`Watch: ${moment.headline}`}
      >
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.55) 100%)',
            pointerEvents: 'none',
          }}
        />

        {moment.streamId && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2,
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="white"
              style={{ transform: 'translateX(2px)' }}
            >
              <polygon points="6 4 20 12 6 20 6 4" />
            </svg>
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 14,
            right: 14,
            zIndex: 2,
          }}
        >
          <div
            style={{
              color: 'white',
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '-0.01em',
              textShadow: '0 1px 6px rgba(0,0,0,0.5)',
              fontFamily: "'Geist', sans-serif",
            }}
          >
            {moment.headline}
          </div>
          {moment.caption && (
            <div
              style={{
                color: 'rgba(255,255,255,0.80)',
                fontSize: 11,
                fontWeight: 500,
                marginTop: 3,
                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                fontFamily: "'Geist', sans-serif",
              }}
            >
              {moment.caption}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
