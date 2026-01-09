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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98, opacity: 0.9 }}
      onClick={() => {
        haptic('light');
        onOpenPicker();
      }}
      className="w-full p-4 rounded-2xl text-left transition-all"
      style={{
        background: hasRange 
          ? 'rgba(255, 255, 255, 0.95)'
          : 'rgba(100, 116, 139, 0.06)',
        border: hasRange 
          ? '1px solid rgba(0, 0, 0, 0.06)'
          : '1px solid rgba(100, 116, 139, 0.12)',
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
              ? 'linear-gradient(135deg, rgba(110, 146, 119, 0.12) 0%, rgba(110, 146, 119, 0.06) 100%)'
              : 'rgba(100, 116, 139, 0.10)',
            border: hasRange ? '1px solid rgba(110, 146, 119, 0.15)' : 'none',
          }}
        >
          <Calendar 
            className="w-5 h-5" 
            style={{ color: hasRange ? '#6E9277' : '#64748b' }} 
          />
        </div>
        
        <div className="flex-1 min-w-0">
          {hasRange ? (
            <>
              <div 
                className="text-[15px] font-semibold"
                style={{ color: 'var(--hub-text)' }}
              >
                {format(startDate, 'd MMM')} → {format(endDate, 'd MMM yyyy')}
              </div>
              <div 
                className="text-[13px] mt-0.5"
                style={{ color: 'var(--hub-text-dim)' }}
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
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(0, 0, 0, 0.04)' }}
        >
          <ChevronRight className="w-4 h-4" style={{ color: 'var(--hub-text-dim)', opacity: 0.6 }} />
        </div>
      </div>
    </motion.button>
  );
}
