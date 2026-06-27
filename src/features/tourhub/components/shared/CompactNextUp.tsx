/**
 * CompactNextUp — rich "Next Event" card shown atop Schedule tabs.
 *
 * Replaces the previous slim pill. Surfaces course substance (par / yardage /
 * purse) like the tournament detail page, keeps the warm amber identity and
 * tap-through to /tourhub/tournament/:id.
 */
import { useNavigate } from 'react-router-dom';
import { TourPill } from './TourPill';
import { formatPurse } from './TourHeroHelpers';
import { AMBER, AMBER_BORDER, INK } from '../../_shared/tokens';

interface CompactNextUpProps {
  tournamentId: string;
  tourCode: string | null | undefined;
  name: string;
  daysUntil: number;
  courseName?: string | null;
  city?: string | null;
  state?: string | null;
  par?: number | null;
  yardage?: number | null;
  purse?: number | null;
}

const MUTED = '#64748B';
const HAIRLINE = 'rgba(180,140,80,0.25)';

export function CompactNextUp({
  tournamentId,
  tourCode,
  name,
  daysUntil,
  courseName,
  city,
  state,
  par,
  yardage,
  purse,
}: CompactNextUpProps) {
  const navigate = useNavigate();

  const venueParts: string[] = [];
  if (courseName) venueParts.push(courseName);
  const locale = [city, state].filter(Boolean).join(', ');
  if (locale) venueParts.push(locale);
  const venueLine = venueParts.join(' · ');

  const stats: { label: string; value: string }[] = [];
  if (par != null) stats.push({ label: 'PAR', value: String(par) });
  if (yardage != null) stats.push({ label: 'YARDS', value: yardage.toLocaleString() });
  if (purse != null && purse > 0) stats.push({ label: 'PURSE', value: formatPurse(purse) });

  const isToday = daysUntil === 0;
  const dayLabel = daysUntil === 1 ? 'DAY' : 'DAYS';

  return (
    <button
      type="button"
      onClick={() => navigate(`/tourhub/tournament/${tournamentId}`)}
      className="active:scale-[0.99] transition-transform"
      style={{
        display: 'block',
        padding: '15px 16px',
        margin: '8px 16px 12px',
        width: 'calc(100% - 32px)',
        background: 'rgba(247,147,30,0.06)',
        border: `1px solid ${AMBER_BORDER}`,
        borderRadius: 14,
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      {/* Top row: NEXT + tour pill (left), countdown (right) */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              color: AMBER,
              letterSpacing: '0.16em',
            }}
          >
            NEXT
          </span>
          <TourPill tourCode={tourCode} />
        </div>

        <div
          style={{
            paddingLeft: 12,
            borderLeft: `1px solid ${HAIRLINE}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minWidth: 56,
          }}
        >
          {isToday ? (
            <span
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: AMBER,
                letterSpacing: '0.12em',
                lineHeight: 1,
                padding: '4px 8px',
                borderRadius: 6,
                background: 'rgba(247,147,30,0.12)',
              }}
            >
              TODAY
            </span>
          ) : (
            <>
              <span
                style={{
                  fontSize: 30,
                  fontWeight: 800,
                  color: INK,
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.02em',
                }}
              >
                {daysUntil}
              </span>
              <span
                style={{
                  fontSize: 8,
                  fontWeight: 800,
                  color: MUTED,
                  letterSpacing: '0.1em',
                  marginTop: 4,
                }}
              >
                {dayLabel}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Title */}
      <div
        style={{
          marginTop: 10,
          fontSize: 21,
          fontWeight: 800,
          color: INK,
          letterSpacing: '-0.02em',
          lineHeight: 1.15,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {name}
      </div>

      {/* Venue line */}
      {venueLine && (
        <div
          style={{
            marginTop: 4,
            fontSize: 12,
            fontWeight: 600,
            color: MUTED,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {venueLine}
        </div>
      )}

      {/* Stat strip */}
      {stats.length > 0 && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 10,
            borderTop: `1px solid ${HAIRLINE}`,
            display: 'flex',
            gap: 8,
          }}
        >
          {stats.map((s) => (
            <div
              key={s.label}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: INK,
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.01em',
                }}
              >
                {s.value}
              </span>
              <span
                style={{
                  fontSize: 8.5,
                  fontWeight: 800,
                  color: MUTED,
                  letterSpacing: '0.08em',
                }}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </button>
  );
}
