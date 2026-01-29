/**
 * ScheduleMonthHeader - Cinematic month divider (Apple-grade)
 * 
 * Features:
 * - Bold uppercase typography
 * - Elegant gradient divider line
 * - Compact event count badge
 */

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';

interface ScheduleMonthHeaderProps {
  monthLabel: string;
  eventCount: number;
  className?: string;
}

export function ScheduleMonthHeader({ 
  monthLabel, 
  eventCount,
  className 
}: ScheduleMonthHeaderProps) {
  return (
    <motion.div 
      className={cn("pt-6 pb-3 px-4", className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        {/* Month label with icon */}
        <div className="flex items-center gap-2">
          <div 
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ 
              background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
            }}
          >
            <Calendar className="w-3.5 h-3.5 text-white" />
          </div>
          <h3 
            className="font-extrabold text-slate-800 uppercase"
            style={{ 
              fontSize: '13px',
              letterSpacing: '0.1em',
            }}
          >
            {monthLabel}
          </h3>
        </div>
        
        {/* Event count badge */}
        <span 
          className="text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide"
          style={{ 
            background: 'rgba(30, 41, 59, 0.08)',
            color: '#64748b',
          }}
        >
          {eventCount} event{eventCount !== 1 ? 's' : ''}
        </span>
      </div>
      
      {/* Gradient divider */}
      <div 
        className="h-px"
        style={{
          background: 'linear-gradient(90deg, rgba(30, 41, 59, 0.2) 0%, rgba(30, 41, 59, 0.05) 100%)',
        }}
      />
    </motion.div>
  );
}
