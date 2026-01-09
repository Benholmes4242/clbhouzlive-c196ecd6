/**
 * TripDatesCard - Tappable card for trip date range selection
 */

import React from 'react';
import { Calendar, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { haptic } from '@/utils/haptics';

interface TripDatesCardProps {
  startDate: Date | null;
  endDate: Date | null;
  onOpenPicker: () => void;
}

export function TripDatesCard({ startDate, endDate, onOpenPicker }: TripDatesCardProps) {
  const hasRange = startDate && endDate;

  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      whileTap={{ scale: 0.98, opacity: 0.9 }}
      onClick={() => {
        haptic('light');
        onOpenPicker();
      }}
      className="w-full p-4 rounded-2xl text-left transition-all"
      style={{
        background: hasRange 
          ? 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,1) 100%)'
          : 'rgba(100, 116, 139, 0.06)',
        border: hasRange 
          ? '1px solid rgba(0, 0, 0, 0.05)'
          : '1px solid rgba(100, 116, 139, 0.1)',
        boxShadow: hasRange 
          ? '0 2px 12px rgba(0, 0, 0, 0.04)'
          : 'none',
      }}
    >
      <div className="flex items-center gap-3.5">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ 
            background: hasRange 
              ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(34, 197, 94, 0.06) 100%)'
              : 'rgba(100, 116, 139, 0.08)',
            border: hasRange ? '1px solid rgba(34, 197, 94, 0.2)' : 'none',
          }}
        >
          <Calendar 
            className="w-5 h-5" 
            style={{ color: hasRange ? '#16a34a' : '#64748b' }} 
          />
        </div>
        
        <div className="flex-1 min-w-0">
          {hasRange ? (
            <>
              <div 
                className="text-[15px] font-semibold"
                style={{ color: '#1e293b' }}
              >
                {format(startDate, 'd MMM')} → {format(endDate, 'd MMM yyyy')}
              </div>
              <div 
                className="text-[13px] mt-0.5"
                style={{ color: '#64748b' }}
              >
                Trip dates
              </div>
            </>
          ) : (
            <span 
              className="text-[15px] font-medium"
              style={{ color: '#475569' }}
            >
              Add trip dates
            </span>
          )}
        </div>
        
        <div 
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(0, 0, 0, 0.04)' }}
        >
          <ChevronRight className="w-3.5 h-3.5" style={{ color: '#94a3b8' }} />
        </div>
      </div>
    </motion.button>
  );
}
