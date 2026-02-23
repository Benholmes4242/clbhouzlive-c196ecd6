/**
 * TournamentEmptyState - Shared empty state for tournament detail tabs
 */

import { motion } from 'framer-motion';

interface TournamentEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  countdown?: string;
}

export function TournamentEmptyState({ icon, title, subtitle, countdown }: TournamentEmptyStateProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-20"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-16 h-16 flex items-center justify-center text-muted-foreground/30 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-[280px] mx-auto text-center">
        {subtitle}
        {countdown && <span className="block mt-1 font-medium">{countdown}</span>}
      </p>
    </motion.div>
  );
}
