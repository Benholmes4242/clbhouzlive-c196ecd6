/**
 * GameDetailsSection - Premium expandable details for Game mode
 * Smooth expand/collapse, custom date/time pickers
 */

import React, { useState } from 'react';
import { Plus, X, Calendar, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { haptic } from '@/utils/haptics';
import { DatePickerSheet } from './DatePickerSheet';
import { TimePickerSheet } from './TimePickerSheet';
import type { HoleCount, GameType } from './types';

interface GameDetailsSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  gameDate: Date | null;
  onGameDateChange: (date: Date | null) => void;
  gameTime: string;
  onGameTimeChange: (time: string) => void;
  holeCount: HoleCount;
  onHoleCountChange: (count: HoleCount) => void;
  gameType: GameType;
  onGameTypeChange: (type: GameType) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
}

export function GameDetailsSection({
  isExpanded,
  onToggle,
  gameDate,
  onGameDateChange,
  gameTime,
  onGameTimeChange,
  holeCount,
  onHoleCountChange,
  gameType,
  onGameTypeChange,
  notes,
  onNotesChange,
}: GameDetailsSectionProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Toggle header */}
      <button
        onClick={() => {
          haptic('light');
          onToggle();
        }}
        className="w-full flex items-center justify-between py-3 text-left transition-all group"
      >
        <div className="flex items-center gap-2.5">
          <motion.div
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0, 0, 0, 0.04)' }}
            animate={{ rotate: isExpanded ? 45 : 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            {isExpanded ? (
              <X className="w-3.5 h-3.5" style={{ color: '#64748b' }} />
            ) : (
              <Plus className="w-3.5 h-3.5" style={{ color: '#64748b' }} />
            )}
          </motion.div>
          <span 
            className="text-[14px] font-medium"
            style={{ color: '#64748b' }}
          >
            {isExpanded ? 'Game details' : 'Add details (optional)'}
          </span>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden"
          >
            <div 
              className="pt-2 pb-3 px-3 space-y-3 rounded-xl"
              style={{ background: 'rgba(248, 250, 252, 0.8)' }}
            >
              {/* Date & Time - tappable buttons */}
              <div className="flex gap-2">
                {/* Date picker trigger */}
                <button
                  onClick={() => {
                    haptic('light');
                    setShowDatePicker(true);
                  }}
                  className="flex-1 flex items-center gap-2.5 px-3.5 py-3 rounded-xl transition-all active:scale-[0.98]"
                  style={{ 
                    background: '#FFFFFF',
                    border: '1px solid rgba(0, 0, 0, 0.04)',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
                  }}
                >
                  <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: '#94a3b8' }} />
                  <span 
                    className="flex-1 text-left text-[14px] font-medium"
                    style={{ color: gameDate ? '#1e293b' : '#94a3b8' }}
                  >
                    {gameDate ? format(gameDate, 'EEE, MMM d') : 'Select date'}
                  </span>
                </button>

                {/* Time picker trigger */}
                <button
                  onClick={() => {
                    haptic('light');
                    setShowTimePicker(true);
                  }}
                  className="flex-1 flex items-center gap-2.5 px-3.5 py-3 rounded-xl transition-all active:scale-[0.98]"
                  style={{ 
                    background: '#FFFFFF',
                    border: '1px solid rgba(0, 0, 0, 0.04)',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
                  }}
                >
                  <Clock className="w-4 h-4 flex-shrink-0" style={{ color: '#94a3b8' }} />
                  <span 
                    className="flex-1 text-left text-[14px] font-medium"
                    style={{ color: gameTime ? '#1e293b' : '#94a3b8' }}
                  >
                    {gameTime || 'Select time'}
                  </span>
                </button>
              </div>

              {/* Holes */}
              <div className="flex gap-2">
                {([9, 18] as HoleCount[]).map(num => (
                  <motion.button
                    key={num}
                    onClick={() => {
                      haptic('light');
                      onHoleCountChange(num);
                    }}
                    whileTap={{ scale: 0.97 }}
                    className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold transition-all duration-150"
                    style={{
                      background: holeCount === num 
                        ? '#FFFFFF' 
                        : 'transparent',
                      border: holeCount === num
                        ? '1px solid rgba(0, 0, 0, 0.06)'
                        : '1px solid rgba(0, 0, 0, 0.06)',
                      color: holeCount === num 
                        ? '#1e293b' 
                        : '#94a3b8',
                      boxShadow: holeCount === num
                        ? '0 1px 3px rgba(0, 0, 0, 0.04)'
                        : 'none',
                    }}
                  >
                    {num} holes
                  </motion.button>
                ))}
              </div>

              {/* Game type */}
              <div className="flex gap-2">
                {(['casual', 'practice', 'match'] as GameType[]).map(type => (
                  <motion.button
                    key={type}
                    onClick={() => {
                      haptic('light');
                      onGameTypeChange(type);
                    }}
                    whileTap={{ scale: 0.97 }}
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold capitalize transition-all duration-150"
                    style={{
                      background: gameType === type 
                        ? '#FFFFFF' 
                        : 'transparent',
                      border: gameType === type
                        ? '1px solid rgba(0, 0, 0, 0.06)'
                        : '1px solid rgba(0, 0, 0, 0.06)',
                      color: gameType === type 
                        ? '#1e293b' 
                        : '#94a3b8',
                      boxShadow: gameType === type
                        ? '0 1px 3px rgba(0, 0, 0, 0.04)'
                        : 'none',
                    }}
                  >
                    {type}
                  </motion.button>
                ))}
              </div>

              {/* Notes */}
              <textarea
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
                placeholder="Add notes..."
                rows={2}
                className="w-full px-3.5 py-3 rounded-xl text-[14px] resize-none outline-none transition-all focus:ring-2 focus:ring-slate-200"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(0, 0, 0, 0.04)',
                  color: '#1e293b',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Date Picker Sheet */}
      <DatePickerSheet
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        value={gameDate}
        onChange={(date) => onGameDateChange(date)}
        minDate={new Date()}
      />

      {/* Time Picker Sheet */}
      <TimePickerSheet
        isOpen={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        value={gameTime}
        onChange={onGameTimeChange}
      />
    </motion.div>
  );
}