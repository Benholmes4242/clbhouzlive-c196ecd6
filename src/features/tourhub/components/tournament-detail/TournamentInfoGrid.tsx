/**
 * TournamentInfoGrid - Flat ruled key-value grid
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, isSameMonth } from 'date-fns';
import type { TourTournament } from '../../hooks/useTourHubData';

interface TournamentInfoGridProps {
  tournament: TourTournament;
  fieldSize?: number;
}

interface InfoItem {
  label: string;
  value: string;
  link?: string;
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isSameMonth(start, end)) {
    return `${format(start, 'MMM d')} – ${format(end, 'd, yyyy')}`;
  }
  return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
}

export function TournamentInfoGrid({ tournament, fieldSize }: TournamentInfoGridProps) {
  const items: InfoItem[] = [];
  
  if (tournament.purse) {
    items.push({
      label: 'Purse',
      value: tournament.purse >= 1_000_000
        ? `$${(tournament.purse / 1_000_000).toFixed(1)}M`
        : `$${(tournament.purse / 1_000).toFixed(0)}K`,
    });
  }
  
  if (tournament.defending_champion) {
    items.push({ label: 'Defending Champion', value: tournament.defending_champion });
  }
  
  if (fieldSize && fieldSize > 0) {
    items.push({ label: 'Field Size', value: `${fieldSize} players` });
  }
  
  items.push({ label: 'Dates', value: formatDateRange(tournament.start_date, tournament.end_date) });

  const rawData = (tournament as any).scoring_system;
  if (rawData) {
    items.push({ label: 'Format', value: rawData.charAt(0).toUpperCase() + rawData.slice(1) });
  }

  const points = (tournament as any).points;
  const pointsType = (tournament as any).points_type;
  if (points) {
    items.push({ label: 'Points', value: `${points} ${pointsType || 'FedEx Cup'} pts` });
  }
  
  if (items.length === 0) return null;
  
  return (
    <motion.div
      style={{ background: '#ffffff', borderTop: '1px solid rgba(15,23,42,0.07)', borderBottom: '1px solid rgba(15,23,42,0.07)', marginTop: '8px' }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35 }}
    >
      <div style={{ padding: '14px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <div style={{ width: 3, height: 14, background: '#0F172A', borderRadius: 1, flexShrink: 0 }} />
          <span style={{ fontSize: '9px', fontWeight: 900, color: '#0F172A', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
            Tournament Details
          </span>
        </div>
      </div>

      {items.map((item) => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', borderTop: '0.5px solid rgba(15,23,42,0.07)' }}>
          <span style={{ fontSize: '9px', fontWeight: 900, color: '#CBD5E1', letterSpacing: '0.1em', textTransform: 'uppercase' as const, width: '88px', flexShrink: 0 }}>{item.label}</span>
          {item.link ? (
            <Link to={item.link} style={{ fontSize: '13px', fontWeight: 600, color: '#F7931E', textDecoration: 'none', flex: 1 }}>
              {item.value}
            </Link>
          ) : (
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', flex: 1 }}>{item.value}</span>
          )}
        </div>
      ))}
      <div style={{ height: '6px' }} />
    </motion.div>
  );
}
