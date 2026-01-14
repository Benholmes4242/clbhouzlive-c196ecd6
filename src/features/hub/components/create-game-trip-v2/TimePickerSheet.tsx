/**
 * TimePickerSheet - Custom bottom sheet time picker
 * iOS-style scroll wheel design
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { haptic } from '@/utils/haptics';

interface TimePickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  value: string; // "HH:mm" format
  onChange: (time: string) => void;
}

export function TimePickerSheet({ 
  isOpen, 
  onClose, 
  value,
  onChange,
}: TimePickerSheetProps) {
  // Parse initial value or default to 09:00
  const parseTime = (timeStr: string) => {
    if (!timeStr) return { hour: 9, minute: 0 };
    const [h, m] = timeStr.split(':').map(Number);
    return { hour: h || 9, minute: m || 0 };
  };

  const [selectedHour, setSelectedHour] = useState(() => parseTime(value).hour);
  const [selectedMinute, setSelectedMinute] = useState(() => parseTime(value).minute);

  // Sync with value prop
  useEffect(() => {
    const { hour, minute } = parseTime(value);
    setSelectedHour(hour);
    setSelectedMinute(minute);
  }, [value]);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5); // 5-minute increments

  const handleConfirm = () => {
    haptic('medium');
    const timeStr = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
    onChange(timeStr);
    onClose();
  };

  const handleSheetClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (!isOpen) return null;

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
                Select Time
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-[0.92]"
                style={{ background: 'rgba(0, 0, 0, 0.04)' }}
              >
                <X className="w-4 h-4" style={{ color: '#64748b' }} />
              </button>
            </div>

            {/* Time picker wheels */}
            <div className="flex items-center justify-center gap-4 py-6 px-8">
              {/* Hour wheel */}
              <div className="flex-1">
                <label className="block text-center text-[12px] font-medium mb-3" style={{ color: '#94a3b8' }}>
                  Hour
                </label>
                <ScrollWheel
                  items={hours}
                  selectedValue={selectedHour}
                  onSelect={setSelectedHour}
                  formatValue={(v) => v.toString().padStart(2, '0')}
                />
              </div>

              {/* Separator */}
              <div 
                className="text-[28px] font-bold mt-6"
                style={{ color: '#1e293b' }}
              >
                :
              </div>

              {/* Minute wheel */}
              <div className="flex-1">
                <label className="block text-center text-[12px] font-medium mb-3" style={{ color: '#94a3b8' }}>
                  Min
                </label>
                <ScrollWheel
                  items={minutes}
                  selectedValue={selectedMinute}
                  onSelect={setSelectedMinute}
                  formatValue={(v) => v.toString().padStart(2, '0')}
                />
              </div>
            </div>

            {/* Confirm button */}
            <div className="px-5 pb-6">
              <button
                onClick={handleConfirm}
                className="w-full py-3.5 rounded-xl text-[15px] font-semibold transition-all active:scale-[0.98]"
                style={{
                  background: '#e2e8f0',
                  color: '#1e293b',
                }}
              >
                Confirm {selectedHour.toString().padStart(2, '0')}:{selectedMinute.toString().padStart(2, '0')}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

interface ScrollWheelProps {
  items: number[];
  selectedValue: number;
  onSelect: (value: number) => void;
  formatValue: (value: number) => string;
}

function ScrollWheel({ items, selectedValue, onSelect, formatValue }: ScrollWheelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemHeight = 44;
  const visibleItems = 5;
  const centerOffset = Math.floor(visibleItems / 2);

  // Scroll to selected item on mount and when selected changes
  useEffect(() => {
    if (containerRef.current) {
      const index = items.indexOf(selectedValue);
      if (index >= 0) {
        containerRef.current.scrollTop = index * itemHeight;
      }
    }
  }, [selectedValue, items]);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      const scrollTop = containerRef.current.scrollTop;
      const index = Math.round(scrollTop / itemHeight);
      const clampedIndex = Math.max(0, Math.min(items.length - 1, index));
      if (items[clampedIndex] !== selectedValue) {
        haptic('light');
        onSelect(items[clampedIndex]);
      }
    }
  }, [items, selectedValue, onSelect]);

  const handleItemClick = (value: number) => {
    haptic('light');
    onSelect(value);
    if (containerRef.current) {
      const index = items.indexOf(value);
      containerRef.current.scrollTo({
        top: index * itemHeight,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="relative">
      {/* Selection indicator */}
      <div 
        className="absolute left-0 right-0 rounded-xl pointer-events-none z-10"
        style={{
          top: centerOffset * itemHeight,
          height: itemHeight,
          background: 'rgba(226, 232, 240, 0.6)',
          border: '1px solid rgba(0, 0, 0, 0.04)',
        }}
      />

      {/* Scroll container */}
      <div
        ref={containerRef}
        className="overflow-y-auto scrollbar-hide"
        style={{
          height: visibleItems * itemHeight,
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'smooth',
        }}
        onScroll={handleScroll}
      >
        {/* Top padding */}
        <div style={{ height: centerOffset * itemHeight }} />

        {/* Items */}
        {items.map((item) => {
          const isSelected = item === selectedValue;
          return (
            <button
              key={item}
              onClick={() => handleItemClick(item)}
              className="w-full flex items-center justify-center transition-all"
              style={{
                height: itemHeight,
                scrollSnapAlign: 'center',
                fontSize: isSelected ? '24px' : '18px',
                fontWeight: isSelected ? 600 : 400,
                color: isSelected ? '#1e293b' : '#94a3b8',
                opacity: isSelected ? 1 : 0.6,
              }}
            >
              {formatValue(item)}
            </button>
          );
        })}

        {/* Bottom padding */}
        <div style={{ height: centerOffset * itemHeight }} />
      </div>
    </div>
  );
}