/**
 * CompactNextUp — slim Next Up pill shown on filtered Schedule tabs.
 *
 * Replaces the full Next Up header on Upcoming / Live / Completed tabs
 * to recover ~80px of vertical space. Tap → navigate to tournament detail.
 */
import { useNavigate } from 'react-router-dom';
import { TourPill } from './TourPill';

interface CompactNextUpProps {
  tournamentId: string;
  tourCode: string | null | undefined;
  name: string;
  daysUntil: number;
}

export function CompactNextUp({ tournamentId, tourCode, name, daysUntil }: CompactNextUpProps) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(`/tourhub/tournament/${tournamentId}`)}
      className="active:scale-[0.99] transition-transform"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        margin: '8px 16px 12px',
        width: 'calc(100% - 32px)',
        background: 'rgba(247,147,30,0.06)',
        border: '1px solid rgba(247,147,30,0.30)',
        borderRadius: 8,
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <span
        style={{
          fontSize: 9,
          fontWeight: 900,
          color: '#F7931E',
          letterSpacing: '0.16em',
          flexShrink: 0,
        }}
      >
        NEXT
      </span>
      <TourPill tourCode={tourCode} />
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 12,
          fontWeight: 800,
          color: '#0F172A',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          letterSpacing: -0.2,
        }}
      >
        {name}
      </span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 800,
          color: '#F7931E',
          fontVariantNumeric: 'tabular-nums',
          flexShrink: 0,
        }}
      >
        {daysUntil === 0 ? 'today' : `${daysUntil} ${daysUntil === 1 ? 'day' : 'days'}`}
      </span>
    </button>
  );
}
