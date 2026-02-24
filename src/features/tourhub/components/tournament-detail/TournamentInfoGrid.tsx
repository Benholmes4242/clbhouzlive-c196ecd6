/**
 * TournamentInfoGrid - Clean data grid, no card container
 */

import { DollarSign, Trophy, Users, Calendar, Crosshair, Star, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, isSameMonth } from 'date-fns';
import type { TourTournament } from '../../hooks/useTourHubData';

interface TournamentInfoGridProps {
  tournament: TourTournament;
  fieldSize?: number;
}

interface InfoItem {
  icon: React.ReactNode;
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
      icon: <DollarSign className="w-4 h-4" />,
      label: 'Purse',
      value: `$${tournament.purse.toLocaleString()} ${tournament.currency || 'USD'}`,
    });
  }
  
  if (tournament.defending_champion) {
    items.push({
      icon: <Trophy className="w-4 h-4" />,
      label: 'Defending Champion',
      value: tournament.defending_champion,
    });
  }
  
  if (fieldSize && fieldSize > 0) {
    items.push({
      icon: <Users className="w-4 h-4" />,
      label: 'Field Size',
      value: `${fieldSize} players`,
    });
  }
  
  items.push({
    icon: <Calendar className="w-4 h-4" />,
    label: 'Dates',
    value: formatDateRange(tournament.start_date, tournament.end_date),
  });

  const rawData = (tournament as any).scoring_system;
  if (rawData) {
    items.push({
      icon: <Crosshair className="w-4 h-4" />,
      label: 'Format',
      value: rawData.charAt(0).toUpperCase() + rawData.slice(1),
    });
  }

  const points = (tournament as any).points;
  const pointsType = (tournament as any).points_type;
  if (points) {
    items.push({
      icon: <Star className="w-4 h-4" />,
      label: 'Points',
      value: `${points} ${pointsType || 'FedEx Cup'} pts`,
    });
  }
  
  if (items.length === 0) return null;
  
  return (
    <motion.div 
      className="py-6"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35 }}
    >
      <h3 className="text-[10px] font-bold tracking-[0.8px] uppercase text-muted-foreground/50 mb-4">
        Tournament Details
      </h3>
      
      <div>
        {items.map((item) => (
          <div 
            key={item.label}
            className="flex items-center gap-3 py-3"
          >
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground mb-0.5">
                {item.label}
              </p>
              <p className="text-sm font-medium text-foreground truncate">
                {item.value}
              </p>
            </div>
            {item.link && (
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
