/**
 * TournamentInfoGrid — "TOURNAMENT INFO" eyebrow + 2-col label/value grid,
 * flush on SURFACE, single top hairline.
 */

import { motion } from 'framer-motion';
import { format, isSameMonth } from 'date-fns';
import type { TourTournament } from '../../hooks/useTourHubData';
import { INK, INK_FAINT, INK_MUTE, INK_TINT_07, SURFACE } from '../../_shared/tokens';

interface TournamentInfoGridProps {
  tournament: TourTournament;
  fieldSize?: number;
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isSameMonth(start, end)) return `${format(start, 'MMM d')} – ${format(end, 'd, yyyy')}`;
  return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
}

function abbrevChamp(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0][0].toUpperCase()}. ${parts[parts.length - 1]}`;
}

export function TournamentInfoGrid({ tournament, fieldSize }: TournamentInfoGridProps) {
  const items: Array<[string, string]> = [];

  if (tournament.start_date && tournament.end_date) {
    items.push(['Dates', formatDateRange(tournament.start_date, tournament.end_date)]);
  }

  const scoring = (tournament as any).scoring_system as string | undefined;
  if (scoring) {
    items.push(['Format', scoring.charAt(0).toUpperCase() + scoring.slice(1)]);
  }

  if (fieldSize && fieldSize > 0) {
    items.push(['Field', `${fieldSize} players`]);
  }

  if (tournament.defending_champion) {
    items.push(['Defending Champ', abbrevChamp(tournament.defending_champion)]);
  }

  const points = (tournament as any).points as number | undefined;
  const pointsType = (tournament as any).points_type as string | undefined;
  if (points) {
    items.push(['Points', `${points} ${pointsType || 'FedEx Cup'} pts`]);
  }

  if (items.length === 0) return null;

  return (
    <motion.div
      style={{ background: SURFACE, borderTop: `0.5px solid ${INK_TINT_07}`, padding: '14px 16px 18px' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
    >
      <div style={{ marginBottom: 12 }}>
        <span style={{
          fontSize: 9, fontWeight: 800, color: INK_MUTE,
          letterSpacing: '0.16em', textTransform: 'uppercase',
        }}>Tournament Info</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
        {items.map(([label, value]) => (
          <div key={label}>
            <span style={{
              fontSize: 9, fontWeight: 800, color: INK_FAINT,
              letterSpacing: '0.16em', textTransform: 'uppercase',
            }}>{label}</span>
            <div style={{ fontSize: 14, fontWeight: 700, color: INK, marginTop: 3 }}>
              {value}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
