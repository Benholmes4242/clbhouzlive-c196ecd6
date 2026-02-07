/**
 * TournamentInfoGrid - Bloomberg-style details grid
 * Semantic token compliant, with additional fields
 */

import { DollarSign, Trophy, Users, Calendar, Award, Crosshair, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import type { TourTournament } from '../../hooks/useTourHubData';

interface TournamentInfoGridProps {
  tournament: TourTournament;
  fieldSize?: number;
}

interface InfoItem {
  icon: React.ReactNode;
  label: string;
  value: string;
}

export function TournamentInfoGrid({ tournament, fieldSize }: TournamentInfoGridProps) {
  const items: InfoItem[] = [];
  
  // Purse
  if (tournament.purse) {
    items.push({
      icon: <DollarSign className="w-4 h-4" />,
      label: 'Purse',
      value: `$${tournament.purse.toLocaleString()} ${tournament.currency || 'USD'}`,
    });
  }
  
  // Defending Champion
  if (tournament.defending_champion) {
    items.push({
      icon: <Trophy className="w-4 h-4" />,
      label: 'Defending Champion',
      value: tournament.defending_champion,
    });
  }
  
  // Field size if available
  if (fieldSize && fieldSize > 0) {
    items.push({
      icon: <Users className="w-4 h-4" />,
      label: 'Field Size',
      value: `${fieldSize} players`,
    });
  }
  
  // Dates
  items.push({
    icon: <Calendar className="w-4 h-4" />,
    label: 'Dates',
    value: `${format(new Date(tournament.start_date), 'MMM d')} – ${format(new Date(tournament.end_date), 'd, yyyy')}`,
  });

  // Scoring system (if available in raw data)
  const rawData = (tournament as any).scoring_system;
  if (rawData) {
    items.push({
      icon: <Crosshair className="w-4 h-4" />,
      label: 'Format',
      value: rawData,
    });
  }

  // Points (if available)
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
      className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Award className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground">Tournament Details</h3>
      </div>
      
      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border/50">
        {items.map((item) => (
          <div 
            key={item.label}
            className="px-4 py-3 flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
              {item.icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-0.5">
                {item.label}
              </p>
              <p className="text-sm font-semibold text-foreground truncate">
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
