/**
 * UpNextBroadcast — Oversized broadcast countdown for the next upcoming tournament.
 * Renders on the Tour Hub Overview between IntelligenceHero and ComingUpCalendar.
 *
 * Layout:
 * - Top strip (90px): real course photo + tour pill + tournament name
 * - Countdown body: DAYS / HRS / MIN / SEC with amber SEC accent
 * - Defender strip: avatar + venue + name + last-year score
 */

import { useNavigate } from 'react-router-dom';
import { useUpcomingTournaments } from '../hooks/useUpcomingTournaments';
import { useVenueImage } from '../hooks/useVenueImage';
import { useCountdown } from '@/hooks/useCountdown';
import { PlayerAvatar, formatPurse } from './shared/TourHeroHelpers';

const PAD = (n: number) => String(n).padStart(2, '0');

function formatDateRange(startDate: string, endDate: string): string {
  const s = new Date(startDate.includes('T') ? startDate : `${startDate}T12:00:00Z`);
  const e = new Date(endDate.includes('T') ? endDate : `${endDate}T12:00:00Z`);
  const sm = s.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase();
  const em = e.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase();
  const sd = s.getUTCDate();
  const ed = e.getUTCDate();
  return sm === em ? `${sm} ${sd}–${ed}` : `${sm} ${sd} – ${em} ${ed}`;
}

export function UpNextBroadcast() {
  const navigate = useNavigate();
  const { data: tournaments } = useUpcomingTournaments(1);
  const tournament = tournaments?.[0];

  const { data: venueImage } = useVenueImage(
    tournament?.venueName ?? null,
    tournament?.venueCity ?? null,
  );
  const countdown = useCountdown(tournament?.startDate);

  if (!tournament) return null;

  const photoUrl = venueImage?.imageUrl ?? null;
  const venueLine = [tournament.venueName, tournament.venueCity].filter(Boolean).join(' · ');

  return (
    <div style={{ padding: '0 16px' }}>
      {/* Section eyebrow */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 3, height: 14, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
        <span style={{
          fontSize: 9, fontWeight: 900, color: '#F7931E',
          letterSpacing: '0.16em', textTransform: 'uppercase',
        }}>
          Up Next
        </span>
      </div>

      <button
        onClick={() => navigate(`/tourhub/tournament/${tournament.id}`)}
        className="active:opacity-90 transition-opacity"
        aria-label={`Open ${tournament.name}`}
        style={{
          display: 'block',
          width: '100%',
          textAlign: 'left',
          padding: 0,
          background: 'linear-gradient(135deg, #0a1628 0%, #1e293b 100%)',
          borderRadius: 18,
          overflow: 'hidden',
          boxShadow: '0 8px 24px -8px rgba(15,23,42,0.3)',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        {/* ── TOP STRIP — 90px course photo ── */}
        <div style={{
          position: 'relative',
          height: 90,
          width: '100%',
          background: photoUrl
            ? `url(${photoUrl}) center/cover no-repeat`
            : 'linear-gradient(180deg, rgba(34,197,94,0.4) 0%, rgba(20,83,45,0.3) 50%, transparent 100%)',
          overflow: 'hidden',
        }}>
          {/* Dark scrim for legibility */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, rgba(10,22,40,0.45) 0%, rgba(10,22,40,0.85) 100%)',
          }} />

          {/* Tour pill (top-left) */}
          <div style={{
            position: 'absolute', top: 10, left: 12,
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 8px',
            background: 'rgba(10,22,40,0.7)',
            border: '1px solid rgba(247,147,30,0.5)',
            borderRadius: 6,
            backdropFilter: 'blur(8px)',
          }}>
            <span style={{
              fontSize: 8, fontWeight: 900, color: '#F7931E',
              letterSpacing: '0.12em', textTransform: 'uppercase',
            }}>
              {tournament.tourName}
            </span>
            <span style={{ width: 1, height: 8, background: 'rgba(247,147,30,0.4)' }} />
            <span style={{
              fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.85)',
              letterSpacing: '0.08em',
            }}>
              {formatDateRange(tournament.startDate, tournament.endDate)}
            </span>
          </div>

          {/* Tournament name (bottom-left) */}
          <div style={{
            position: 'absolute', bottom: 10, left: 14, right: 14,
          }}>
            <p style={{
              fontSize: 18, fontWeight: 900, color: '#FFFFFF',
              letterSpacing: '-0.02em', lineHeight: 1.15, margin: 0,
              textShadow: '0 1px 4px rgba(0,0,0,0.6)',
              overflow: 'hidden', textOverflow: 'ellipsis',
              display: '-webkit-box', WebkitBoxOrient: 'vertical' as any, WebkitLineClamp: 2,
            }}>
              {tournament.name}
            </p>
          </div>
        </div>

        {/* ── COUNTDOWN BODY ── */}
        <div style={{ padding: '20px 16px 16px' }}>
          <p style={{
            fontSize: 9, fontWeight: 900, color: '#F7931E',
            letterSpacing: '0.16em', textTransform: 'uppercase',
            textAlign: 'center', margin: '0 0 12px',
          }}>
            Tees Off In
          </p>

          {countdown ? (
            <div style={{
              display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
              gap: 8,
            }}>
              <CountdownCell value={countdown.days} label="Days" />
              <CountdownDivider />
              <CountdownCell value={countdown.hours} label="Hrs" />
              <CountdownDivider />
              <CountdownCell value={countdown.minutes} label="Min" />
              <CountdownDivider />
              <CountdownCell value={countdown.seconds} label="Sec" highlight />
            </div>
          ) : (
            <p style={{
              fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)',
              textAlign: 'center', margin: 0,
            }}>
              Tee time imminent
            </p>
          )}
        </div>

        {/* ── DEFENDER STRIP ── */}
        {tournament.defendingChampion && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 14px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}>
            <PlayerAvatar
              displayName={tournament.defendingChampion}
              photoUrl={null}
              tourCode={undefined}
              size={32}
              frosted
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{
                fontSize: 8, fontWeight: 800, color: 'rgba(247,147,30,0.85)',
                letterSpacing: '0.12em', textTransform: 'uppercase',
                display: 'block', lineHeight: 1,
              }}>
                Defending · {tournament.venueName ?? 'Last Year'}
              </span>
              <span style={{
                fontSize: 13, fontWeight: 800, color: '#FFFFFF',
                display: 'block', marginTop: 3,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {tournament.defendingChampion}
              </span>
            </div>
            {tournament.purse && (
              <span style={{
                fontSize: 16, fontWeight: 900, color: '#F7931E',
                letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
                flexShrink: 0,
              }}>
                {formatPurse(tournament.purse)}
              </span>
            )}
          </div>
        )}
      </button>
    </div>
  );
}

function CountdownCell({ value, label, highlight }: { value: number; label: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 52 }}>
      <span style={{
        fontSize: 36, fontWeight: 900,
        color: highlight ? '#F7931E' : '#FFFFFF',
        letterSpacing: '-0.05em', lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {PAD(value)}
      </span>
      <span style={{
        fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,0.5)',
        letterSpacing: '0.14em', textTransform: 'uppercase',
        marginTop: 6,
      }}>
        {label}
      </span>
    </div>
  );
}

function CountdownDivider() {
  return (
    <span style={{
      fontSize: 28, fontWeight: 900, color: 'rgba(255,255,255,0.2)',
      lineHeight: 1, paddingTop: 2,
    }}>
      :
    </span>
  );
}
