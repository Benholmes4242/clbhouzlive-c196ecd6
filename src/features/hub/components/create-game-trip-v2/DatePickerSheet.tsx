/**
 * DatePickerSheet - Custom bottom sheet date picker
 * Matches Clbhouz design, prevents past date selection
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameDay, isBefore, startOfDay, getDay } from 'date-fns';
import { haptic } from '@/utils/haptics';

interface DatePickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  value: Date | null;
  onChange: (date: Date) => void;
  minDate?: Date;
}

export function DatePickerSheet({ 
  isOpen, 
  onClose, 
  value,
  onChange,
  minDate = new Date(),
}: DatePickerSheetProps) {
  const [currentMonth, setCurrentMonth] = useState(() => value || new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(value);

  // Sync selected date when value changes
  useEffect(() => {
    setSelectedDate(value);
    if (value) {
      setCurrentMonth(value);
    }
  }, [value]);

  const today = startOfDay(new Date());
  const minDateStart = startOfDay(minDate);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get the day of week the month starts on (0 = Sunday)
  const startDayOfWeek = getDay(monthStart);

  const handlePrevMonth = () => {
    haptic('light');
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    haptic('light');
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  const handleSelectDate = (date: Date) => {
    if (isBefore(date, minDateStart)) return;
    haptic('light');
    setSelectedDate(date);
  };

  const handleConfirm = () => {
    if (selectedDate) {
      haptic('medium');
      onChange(selectedDate);
      onClose();
    }
  };

  const handleSheetClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (!isOpen) return null;

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[10200]"
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-x-0 bottom-0 z-[10201] rounded-t-[24px] overflow-hidden"
            style={{
              background: '#FFFFFF',
              boxShadow: '0 -4px 32px rgba(0, 0, 0, 0.12)',
              maxHeight: '80vh',
            }}
            onClick={handleSheetClick}
          >
            {/* Grabber */}
            <div className="flex justify-center pt-2.5 pb-1">
              <div className="w-9 h-1 rounded-full" style={{ background: 'rgba(0, 0, 0, 0.1)' }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-4">
              <h2 className="text-[17px] font-semibold" style={{ color: '#1e293b' }}>
                Select Date
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-[0.92]"
                style={{ background: 'rgba(0, 0, 0, 0.04)' }}
              >
                <X className="w-4 h-4" style={{ color: '#64748b' }} />
              </button>
            </div>

            {/* Month navigation */}
            <div className="flex items-center justify-between px-5 mb-4">
              <button
                onClick={handlePrevMonth}
                className="w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-[0.92]"
                style={{ background: 'rgba(0, 0, 0, 0.04)' }}
              >
                <ChevronLeft className="w-5 h-5" style={{ color: '#64748b' }} />
              </button>
              <span className="text-[16px] font-semibold" style={{ color: '#1e293b' }}>
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <button
                onClick={handleNextMonth}
                className="w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-[0.92]"
                style={{ background: 'rgba(0, 0, 0, 0.04)' }}
              >
                <ChevronRight className="w-5 h-5" style={{ color: '#64748b' }} />
              </button>
            </div>

            {/* Week day headers */}
            <div className="grid grid-cols-7 gap-1 px-4 mb-2">
              {weekDays.map(day => (
                <div 
                  key={day} 
                  className="text-center text-[12px] font-medium py-2"
                  style={{ color: '#94a3b8' }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1 px-4 pb-4">
              {/* Empty cells for days before month starts */}
              {Array.from({ length: startDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="h-11" />
              ))}
              
              {/* Day cells */}
              {daysInMonth.map(day => {
                const isToday = isSameDay(day, today);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isDisabled = isBefore(day, minDateStart);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => handleSelectDate(day)}
                    disabled={isDisabled}
                    className="h-11 rounded-xl flex items-center justify-center transition-all active:scale-[0.92] disabled:cursor-not-allowed"
                    style={{
                      background: isSelected 
                        ? '#e2e8f0'
                        : isToday 
                          ? 'rgba(226, 232, 240, 0.5)'
                          : 'transparent',
                      color: isDisabled 
                        ? '#cbd5e1' 
                        : isSelected 
                          ? '#1e293b'
                          : '#1e293b',
                      fontWeight: isSelected || isToday ? 600 : 400,
                      fontSize: '14px',
                    }}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>

            {/* Confirm button */}
            <div className="px-5 pb-6">
              <button
                onClick={handleConfirm}
                disabled={!selectedDate}
                className="w-full py-3.5 rounded-xl text-[15px] font-semibold transition-all active:scale-[0.98] disabled:opacity-50"
                style={{
                  background: selectedDate ? '#e2e8f0' : 'rgba(0, 0, 0, 0.05)',
                  color: selectedDate ? '#1e293b' : '#94a3b8',
                }}
              >
                {selectedDate ? `Confirm ${format(selectedDate, 'EEE, MMM d')}` : 'Select a date'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}