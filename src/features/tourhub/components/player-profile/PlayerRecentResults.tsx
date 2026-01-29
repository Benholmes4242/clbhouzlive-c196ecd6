/**
 * PlayerRecentResults - Recent tournament finishes for player profile
 */

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Trophy, Calendar, DollarSign, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { GlassCard } from '../premium';
import { usePlayerResults, formatPosition, formatScore, formatMoney } from '../../hooks/usePlayerResults';

interface PlayerRecentResultsProps {
  playerId: string;
  className?: string;
}

export function PlayerRecentResults({ playerId, className }: PlayerRecentResultsProps) {
  const { data: results, isLoading } = usePlayerResults(playerId, 10);
  
  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        {[...Array(3)].map((_, i) => (
          <div 
            key={i} 
            className="h-20 rounded-xl bg-white/5 animate-pulse"
          />
        ))}
      </div>
    );
  }
  
  if (!results || results.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <Trophy className="w-12 h-12 text-white/20 mx-auto mb-3" />
        <p className="text-white/60">No recent results available</p>
      </div>
    );
  }
  
  return (
    <div className={cn('space-y-3', className)}>
      {results.map((result, idx) => {
        const position = formatPosition(result.position, result.position_tied, result.status);
        const isWin = result.position === 1;
        const isTop10 = result.position && result.position <= 10;
        const isCut = result.status === 'cut' || result.status === 'MC';
        
        return (
          <motion.div
            key={result.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
          >
            <Link to={`/tourhub/event/${result.tournament_id}`}>
              <GlassCard 
                className={cn(
                  'p-4 flex items-center gap-4 group hover:bg-white/10 transition-colors',
                  isWin && 'ring-1 ring-yellow-500/30'
                )}
              >
                {/* Position */}
                <div 
                  className={cn(
                    'w-14 h-14 rounded-xl flex items-center justify-center font-bold text-lg shrink-0',
                    isWin && 'bg-gradient-to-br from-yellow-400 to-amber-600 text-black',
                    !isWin && isTop10 && 'bg-gradient-to-br from-th-accent to-blue-600 text-white',
                    !isWin && !isTop10 && !isCut && 'bg-white/10 text-white',
                    isCut && 'bg-red-500/20 text-red-400'
                  )}
                >
                  {isWin && <Trophy className="w-6 h-6" />}
                  {!isWin && position}
                </div>
                
                {/* Tournament Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-white truncate group-hover:text-th-accent transition-colors">
                    {result.tournament_name}
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-white/60 mt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {result.tournament_start_date 
                        ? format(new Date(result.tournament_start_date), 'MMM d, yyyy')
                        : 'Date TBD'
                      }
                    </span>
                  </div>
                </div>
                
                {/* Score & Earnings */}
                <div className="text-right shrink-0">
                  {result.score !== null && !isCut && (
                    <p className={cn(
                      'font-mono font-bold',
                      result.score && result.score < 0 ? 'text-green-400' : 'text-white'
                    )}>
                      {formatScore(result.score)}
                    </p>
                  )}
                  {result.money && result.money > 0 && (
                    <p className="text-sm text-white/60 flex items-center gap-1 justify-end mt-1">
                      <DollarSign className="w-3 h-3" />
                      {formatMoney(result.money)}
                    </p>
                  )}
                </div>
                
                <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white/60 transition-colors shrink-0" />
              </GlassCard>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
