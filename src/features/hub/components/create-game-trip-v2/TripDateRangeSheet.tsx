/**
 * TripDateRangeSheet - Date range picker for trips
 * Phase 1: Simple date inputs
 */

import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { haptic } from '@/utils/haptics';

interface TripDateRangeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  startDate: Date | null;
  endDate: Date | null;
  onSave: (startDate: Date, endDate: Date) => void;
}

export function TripDateRangeSheet({ 
  isOpen, 
  onClose, 
  startDate: initialStart,
  endDate: initialEnd,
  onSave,
}: TripDateRangeSheetProps) {
  const [startDate, setStartDate] = useState<string>(
    initialStart ? format(initialStart, 'yyyy-MM-dd') : ''
  );
  const [endDate, setEndDate] = useState<string>(
    initialEnd ? format(initialEnd, 'yyyy-MM-dd') : ''
  );

  const handleSave = useCallback(() => {
    if (!startDate || !endDate) return;
    haptic('medium');
    onSave(new Date(startDate), new Date(endDate));
    onClose();
  }, [startDate, endDate, onSave, onClose]);

  const handleSheetClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const isValid = startDate && endDate && new Date(startDate) <= new Date(endDate);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/25 z-[10007]"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-x-0 bottom-0 z-[10008] rounded-t-[28px] overflow-hidden"
            style={{
              background: '#F8FAFC',
              boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.08)',
            }}
            onClick={handleSheetClick}
          >
            {/* Header */}
            <div className="flex justify-center pt-2.5 pb-1">
              <div className="w-8 h-[3px] rounded-full" style={{ background: 'rgba(0, 0, 0, 0.1)' }} />
            </div>

            <div className="flex items-center justify-between px-5 pb-4">
              <h2 className="text-[17px] font-semibold" style={{ color: 'var(--hub-text)' }}>
                Trip Dates
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-[0.96]"
                style={{ background: 'rgba(0, 0, 0, 0.04)' }}
              >
                <X className="w-4 h-4" style={{ color: 'var(--hub-text-sub)' }} />
              </button>
            </div>

            {/* Date inputs */}
            <div className="px-5 pb-6 space-y-4">
              <div>
                <label 
                  className="text-[12px] font-medium mb-2 block"
                  style={{ color: 'var(--hub-text-dim)' }}
                >
                  Start Date
                </label>
                <div
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl"
                  style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                  }}
                >
                  <Calendar className="w-5 h-5" style={{ color: 'var(--hub-text-dim)' }} />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex-1 text-[15px] font-medium bg-transparent border-none outline-none appearance-none"
                    style={{ color: startDate ? 'var(--hub-text)' : 'var(--hub-text-muted)' }}
                  />
                </div>
              </div>

              <div>
                <label 
                  className="text-[12px] font-medium mb-2 block"
                  style={{ color: 'var(--hub-text-dim)' }}
                >
                  End Date
                </label>
                <div
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl"
                  style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                  }}
                >
                  <Calendar className="w-5 h-5" style={{ color: 'var(--hub-text-dim)' }} />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="flex-1 text-[15px] font-medium bg-transparent border-none outline-none appearance-none"
                    style={{ color: endDate ? 'var(--hub-text)' : 'var(--hub-text-muted)' }}
                  />
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={!isValid}
                className="w-full py-4 rounded-2xl text-[15px] font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
                style={{
                  background: isValid 
                    ? 'linear-gradient(135deg, rgba(110, 146, 119, 0.95) 0%, rgba(90, 126, 99, 0.95) 100%)'
                    : 'rgba(0, 0, 0, 0.06)',
                  color: isValid ? 'white' : 'var(--hub-text-muted)',
                  boxShadow: isValid ? '0 4px 16px rgba(110, 146, 119, 0.25)' : 'none',
                }}
              >
                Save Dates
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
