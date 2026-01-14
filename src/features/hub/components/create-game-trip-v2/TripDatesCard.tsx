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
      transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileTap={{ scale: 0.985 }}
      onClick={() => {
        haptic('light');
        onOpenPicker();
      }}
      className="w-full p-4 rounded-2xl text-left transition-all group"
      style={{
        background: hasRange 
          ? 'linear-gradient(180deg, #FFFFFF 0%, #FAFBFC 100%)'
          : 'linear-gradient(180deg, #FFFFFF 0%, #F5FAFF 100%)',
        border: '1px solid rgba(0, 0, 0, 0.04)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.02)',
      }}
    >
      <div className="flex items-center gap-4">
        <div 
          className="w-14 h-14 rounded-[18px] flex items-center justify-center flex-shrink-0"
          style={{ 
            background: hasRange 
              ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.06) 100%)'
              : 'linear-gradient(145deg, rgba(100, 140, 200, 0.18) 0%, rgba(100, 140, 200, 0.06) 100%)',
            border: hasRange 
              ? '1px solid rgba(34, 197, 94, 0.25)'
              : '1px solid rgba(100, 140, 200, 0.2)',
          }}
        >
          {hasRange ? (
            <Calendar className="w-5 h-5" style={{ color: '#16a34a' }} />
          ) : (
            <span className="text-2xl">📅</span>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          {hasRange ? (
            <>
              <div 
                className="text-[16px] font-semibold leading-tight"
                style={{ color: '#1e293b' }}
              >
                {format(startDate, 'd MMM')} → {format(endDate, 'd MMM yyyy')}
              </div>
              <div 
                className="text-[14px] mt-1"
                style={{ color: '#64748b' }}
              >
                Trip dates set
              </div>
            </>
          ) : (
            <>
              <div 
                className="text-[16px] font-semibold leading-tight"
                style={{ color: '#1e293b' }}
              >
                Add trip dates
              </div>
              <div 
                className="text-[14px] mt-1"
                style={{ color: '#64748b' }}
              >
                When are you going?
              </div>
            </>
          )}
        </div>
        
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-active:scale-90"
          style={{ background: 'rgba(0, 0, 0, 0.04)' }}
        >
          <ChevronRight className="w-4 h-4" style={{ color: '#94a3b8' }} />
        </div>
      </div>
    </motion.button>
  );
}
