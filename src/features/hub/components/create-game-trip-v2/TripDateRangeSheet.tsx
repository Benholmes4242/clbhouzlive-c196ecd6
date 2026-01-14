/**
 * TripDateRangeSheet - Date range picker for trips
 * V2: Uses branded DatePickerSheet instead of native HTML inputs
 */

import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { haptic } from '@/utils/haptics';
import { DatePickerSheet } from './DatePickerSheet';

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
  const [startDate, setStartDate] = useState<Date | null>(initialStart);
  const [endDate, setEndDate] = useState<Date | null>(initialEnd);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Reset state when sheet opens with new initial values
  useEffect(() => {
    if (isOpen) {
      setStartDate(initialStart);
      setEndDate(initialEnd);
    }
  }, [isOpen, initialStart, initialEnd]);

  const handleStartDateChange = useCallback((date: Date | null) => {
    setStartDate(date);
    // If end date is before new start date, clear it
    if (date && endDate && endDate < date) {
      setEndDate(null);
    }
  }, [endDate]);

  const handleEndDateChange = useCallback((date: Date | null) => {
    setEndDate(date);
  }, []);

  const handleSave = useCallback(() => {
    if (!startDate || !endDate) return;
    haptic('medium');
    onSave(startDate, endDate);
    onClose();
  }, [startDate, endDate, onSave, onClose]);

  const handleSheetClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const isValid = startDate && endDate && startDate <= endDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

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
              <h2 className="text-[17px] font-semibold" style={{ color: '#1e293b' }}>
                Trip Dates
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-[0.96]"
                style={{ background: 'rgba(0, 0, 0, 0.04)' }}
              >
                <X className="w-4 h-4" style={{ color: '#64748b' }} />
              </button>
            </div>

            {/* Date selection */}
            <div className="px-5 pb-6 space-y-4">
              {/* Start Date */}
              <div>
                <label 
                  className="text-[12px] font-medium mb-2 block"
                  style={{ color: '#64748b' }}
                >
                  Start Date
                </label>
                <button
                  onClick={() => {
                    haptic('light');
                    setShowStartPicker(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all active:scale-[0.98]"
                  style={{
                    background: startDate 
                      ? 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,1) 100%)'
                      : 'rgba(255, 255, 255, 0.9)',
                    border: startDate 
                      ? '1px solid rgba(34, 197, 94, 0.2)'
                      : '1px solid rgba(0, 0, 0, 0.06)',
                    boxShadow: startDate ? '0 2px 8px rgba(34, 197, 94, 0.08)' : 'none',
                  }}
                >
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ 
                      background: startDate 
                        ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(34, 197, 94, 0.06) 100%)'
                        : 'rgba(0, 0, 0, 0.04)',
                    }}
                  >
                    <Calendar 
                      className="w-5 h-5" 
                      style={{ color: startDate ? '#16a34a' : '#94a3b8' }} 
                    />
                  </div>
                  <span 
                    className="flex-1 text-[15px] font-medium"
                    style={{ color: startDate ? '#1e293b' : '#94a3b8' }}
                  >
                    {startDate ? format(startDate, 'EEE, MMM d, yyyy') : 'Select start date'}
                  </span>
                  <ChevronRight className="w-4 h-4" style={{ color: '#cbd5e1' }} />
                </button>
              </div>

              {/* End Date */}
              <div>
                <label 
                  className="text-[12px] font-medium mb-2 block"
                  style={{ color: '#64748b' }}
                >
                  End Date
                </label>
                <button
                  onClick={() => {
                    haptic('light');
                    setShowEndPicker(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all active:scale-[0.98]"
                  style={{
                    background: endDate 
                      ? 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,1) 100%)'
                      : 'rgba(255, 255, 255, 0.9)',
                    border: endDate 
                      ? '1px solid rgba(34, 197, 94, 0.2)'
                      : '1px solid rgba(0, 0, 0, 0.06)',
                    boxShadow: endDate ? '0 2px 8px rgba(34, 197, 94, 0.08)' : 'none',
                  }}
                >
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ 
                      background: endDate 
                        ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(34, 197, 94, 0.06) 100%)'
                        : 'rgba(0, 0, 0, 0.04)',
                    }}
                  >
                    <Calendar 
                      className="w-5 h-5" 
                      style={{ color: endDate ? '#16a34a' : '#94a3b8' }} 
                    />
                  </div>
                  <span 
                    className="flex-1 text-[15px] font-medium"
                    style={{ color: endDate ? '#1e293b' : '#94a3b8' }}
                  >
                    {endDate ? format(endDate, 'EEE, MMM d, yyyy') : 'Select end date'}
                  </span>
                  <ChevronRight className="w-4 h-4" style={{ color: '#cbd5e1' }} />
                </button>
              </div>

              {/* Save button - Brand orange gradient */}
              <button
                onClick={handleSave}
                disabled={!isValid}
                className="w-full py-4 rounded-2xl text-[15px] font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                style={{
                  background: isValid 
                    ? 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)'
                    : 'rgba(0, 0, 0, 0.06)',
                  color: isValid ? '#FFFFFF' : '#94a3b8',
                  boxShadow: isValid ? '0 4px 16px rgba(249, 115, 22, 0.3)' : 'none',
                }}
              >
                Save Dates
              </button>
            </div>
          </motion.div>

          {/* Start Date Picker - stacks on top */}
          <DatePickerSheet
            isOpen={showStartPicker}
            onClose={() => setShowStartPicker(false)}
            value={startDate}
            onChange={handleStartDateChange}
            minDate={today}
            title="Start Date"
          />

          {/* End Date Picker - stacks on top */}
          <DatePickerSheet
            isOpen={showEndPicker}
            onClose={() => setShowEndPicker(false)}
            value={endDate}
            onChange={handleEndDateChange}
            minDate={startDate || today}
            title="End Date"
          />
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
