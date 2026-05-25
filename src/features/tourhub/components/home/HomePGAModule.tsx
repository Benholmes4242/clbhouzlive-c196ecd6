/**
 * HomePGAModule — Phase 2.
 * Reuses usePGACard data and renders a card-on-light-surface module
 * (NOT the full-bleed Clubhouse PGACard layout).
 */
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { usePGACard } from '@/components/media-system/hooks/usePGACard';

const AMBER = '#F7931E';
const INK = '#0F172A';
const INK_SOFT = 'rgba(15,23,42,0.62)';
const INK_FAINT = 'rgba(15,23,42,0.45)';
const HAIRLINE = 'rgba(15,23,42,0.10)';

function fmtDateRange(start: string | null, end: string | null): string {
  if (!start) return '';
  const s = new Date(start);
  const e = end ? new Date(end) : null;
  const m = (d: Date) => d.toLocaleString('en-GB', { month: 'short' }).toUpperCase();
  if (e && s.getMonth() === e.getMonth()) {
    return `${m(s)} ${s.getDate()}–${e.getDate()}`;
  }
  if (e) return `${m(s)} ${s.getDate()} – ${m(e)} ${e.getDate()}`;
  return `${m(s)} ${s.getDate()}`;
}

export function HomePGAModule() {
  const navigate = useNavigate();
  const { session } = useSupabaseSession();
  const { pgaCard } = usePGACard(session?.user?.id);

  if (!pgaCard?.cardData) return null;
  const d = pgaCard.cardData;

  const handleTap = () => navigate('/tourhub');

  const eyebrowLabel =
    d.state === 'live' ? 'PGA TOUR · LIVE'
    : d.state === 'result' ? 'PGA TOUR · FINAL'
    : 'PGA TOUR · THIS WEEK';

  return (
    <section style={{ padding: '0 16px' }}>
      {/* Eyebrow */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 800,
            color: AMBER,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          {eyebrowLabel}
        </span>
        <button
          onClick={handleTap}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
            fontSize: 12,
            fontWeight: 700,
            color: AMBER,
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          View tournament
          <ChevronRight size={14} strokeWidth={2.4} />
        </button>
      </div>

      {/* Card */}
      <button
        onClick={handleTap}
        style={{
          display: 'block',
          width: '100%',
          textAlign: 'left',
          background: '#FFFFFF',
          borderRadius: 14,
          border: `0.5px solid ${HAIRLINE}`,
          padding: 14,
          cursor: 'pointer',
        }}
      >
        {/* Tournament name */}
        <div style={{ fontSize: 18, fontWeight: 800, color: INK, lineHeight: 1.15, letterSpacing: '-0.015em' }}>
          {d.tournamentName}
        </div>
        {(d.venueName || d.venueCity) && (
          <div style={{ marginTop: 4, fontSize: 12, color: INK_SOFT, fontWeight: 500 }}>
            {[d.venueName, d.venueCity].filter(Boolean).join(' · ')}
          </div>
        )}

        {/* State-specific body */}
        {d.state === 'upcoming' && (
          <div
            style={{
              marginTop: 12,
              display: 'inline-block',
              padding: '4px 8px',
              borderRadius: 6,
              background: 'rgba(247,147,30,0.10)',
              fontSize: 11,
              fontWeight: 800,
              color: AMBER,
              letterSpacing: '0.08em',
            }}
          >
            {d.totalRounds || 4} ROUNDS · {fmtDateRange(d.startDate, d.endDate)}
          </div>
        )}

        {d.state === 'live' && d.leader && (
          <div style={{ marginTop: 12 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: '#16A34A',
                letterSpacing: '0.14em',
                marginBottom: 6,
              }}
            >
              ● LIVE · {d.roundLabel || `ROUND ${d.currentRound}`}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {d.leader.photoUrl && (
                <img
                  src={d.leader.photoUrl}
                  alt=""
                  style={{ width: 36, height: 36, borderRadius: '34%', objectFit: 'cover', background: '#eee' }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: INK, lineHeight: 1.2 }}>
                  {d.leader.playerName}
                </div>
                <div style={{ fontSize: 11, color: INK_FAINT, fontWeight: 500 }}>
                  Thru {d.leader.thru ?? '—'}
                </div>
              </div>
              <div
                style={{
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: 18,
                  fontWeight: 800,
                  color: INK,
                  letterSpacing: '-0.02em',
                }}
              >
                {d.leader.scoreDisplay ?? '—'}
              </div>
            </div>
          </div>
        )}

        {d.state === 'result' && d.leader && (
          <div style={{ marginTop: 12 }}>
            <div
              style={{
                display: 'inline-block',
                padding: '3px 7px',
                borderRadius: 4,
                background: INK,
                color: '#FFFFFF',
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.14em',
                marginBottom: 8,
              }}
            >
              FINAL
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {d.leader.photoUrl && (
                <img
                  src={d.leader.photoUrl}
                  alt=""
                  style={{ width: 36, height: 36, borderRadius: '34%', objectFit: 'cover', background: '#eee' }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: INK, lineHeight: 1.2 }}>
                  {d.leader.playerName}
                </div>
                <div style={{ fontSize: 11, color: INK_FAINT, fontWeight: 500 }}>Champion</div>
              </div>
              <div
                style={{
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: 18,
                  fontWeight: 800,
                  color: INK,
                  letterSpacing: '-0.02em',
                }}
              >
                {d.leader.scoreDisplay ?? '—'}
              </div>
            </div>
          </div>
        )}
      </button>
    </section>
  );
}

export default HomePGAModule;
