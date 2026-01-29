/**
 * ScheduleEmptyMessage - Cinematic empty states (Apple-grade)
 * 
 * Features:
 * - Glassmorphic container
 * - Animated icons
 * - Clear call-to-action
 */

import { Link } from 'react-router-dom';
import { Calendar, Radio, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ScheduleEmptyMessageProps {
  variant: 'no-live' | 'no-results' | 'season-complete';
  nextTournamentName?: string;
  className?: string;
}

export function ScheduleEmptyMessage({ 
  variant, 
  nextTournamentName,
  className 
}: ScheduleEmptyMessageProps) {
  const content = {
    'no-live': {
      icon: <Radio className="w-6 h-6" />,
      title: 'No Live Events',
      message: nextTournamentName 
        ? `Check back soon — next up is ${nextTournamentName}` 
        : 'No live tournaments right now. Check back soon!',
      iconBg: 'from-emerald-500 to-teal-500',
    },
    'no-results': {
      icon: <Calendar className="w-6 h-6" />,
      title: 'No Matches',
      message: 'No tournaments match your search or filter.',
      iconBg: 'from-slate-500 to-slate-600',
    },
    'season-complete': {
      icon: <Trophy className="w-6 h-6" />,
      title: 'Season Complete',
      message: null,
      iconBg: 'from-amber-500 to-orange-500',
    },
  };

  const { icon, title, message, iconBg } = content[variant];

  return (
    <motion.div 
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-16 px-6 text-center mx-4 rounded-2xl",
        className
      )}
      style={{
        background: 'rgba(248, 250, 252, 0.8)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(226, 232, 240, 0.6)',
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Animated icon container */}
      <motion.div 
        className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br shadow-lg",
          iconBg
        )}
        initial={{ rotate: -10, scale: 0.8 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 20 }}
      >
        {icon}
      </motion.div>

      <div className="space-y-1">
        <h4 className="text-base font-bold text-slate-800">{title}</h4>
        <p className="text-sm text-slate-500 max-w-xs">
          {variant === 'season-complete' ? (
            <>
              Relive the highlights in{' '}
              <Link 
                to="/tourhub?tab=overview" 
                className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
              >
                Overview →
              </Link>
            </>
          ) : (
            message
          )}
        </p>
      </div>
    </motion.div>
  );
}
