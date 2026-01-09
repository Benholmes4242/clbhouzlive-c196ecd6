/**
 * GameDetailsSection - Expandable details for Game mode
 * Chevron rotates on expand, section background tinted, inputs card-like
 */

import React from 'react';
import { Plus, ChevronDown, Calendar, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { haptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      {/* Toggle header */}
      <button
        onClick={() => {
          haptic('light');
          onToggle();
        }}
        className="w-full flex items-center justify-between py-3 text-left transition-all"
      >
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: isExpanded ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <Plus 
              className="w-4 h-4"
              style={{ color: '#94a3b8' }}
            />
          </motion.div>
          <span 
            className="text-[14px]"
            style={{ color: '#64748b' }}
          >
            Add details (optional)
          </span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown 
            className="w-4 h-4"
            style={{ color: '#94a3b8' }}
          />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div 
              className="pt-3 pb-2 px-3 space-y-4 rounded-xl"
              style={{ background: 'rgba(248, 250, 252, 0.8)' }}
            >
              {/* Date & Time - combined visually into one row */}
              <div className="flex gap-2">
                <div
                  className="flex-1 flex items-center gap-2.5 px-4 py-3.5 rounded-xl"
                  style={{ 
                    background: '#FFFFFF',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                  }}
                >
                  <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: '#94a3b8' }} />
                  <input
                    type="date"
                    value={gameDate ? format(gameDate, 'yyyy-MM-dd') : ''}
                    onChange={(e) => onGameDateChange(e.target.value ? new Date(e.target.value) : null)}
                    className="flex-1 text-[14px] font-medium bg-transparent border-none outline-none appearance-none"
                    style={{ color: gameDate ? '#1e293b' : '#94a3b8' }}
                    placeholder="Date"
                  />
                </div>
                <div
                  className="flex-1 flex items-center gap-2.5 px-4 py-3.5 rounded-xl"
                  style={{ 
                    background: '#FFFFFF',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                  }}
                >
                  <Clock className="w-4 h-4 flex-shrink-0" style={{ color: '#94a3b8' }} />
                  <input
                    type="time"
                    value={gameTime}
                    onChange={(e) => onGameTimeChange(e.target.value)}
                    className="flex-1 text-[14px] font-medium bg-transparent border-none outline-none appearance-none"
                    style={{ color: gameTime ? '#1e293b' : '#94a3b8' }}
                    placeholder="Time"
                  />
                </div>
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
                    className="flex-1 py-3 rounded-xl text-[14px] font-semibold transition-all"
                    style={{
                      background: holeCount === num 
                        ? '#FFFFFF' 
                        : 'transparent',
                      border: holeCount === num
                        ? '1px solid rgba(0, 0, 0, 0.08)'
                        : '1px solid rgba(0, 0, 0, 0.06)',
                      color: holeCount === num 
                        ? '#1e293b' 
                        : '#94a3b8',
                      boxShadow: holeCount === num
                        ? '0 2px 6px rgba(0, 0, 0, 0.04)'
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
                    className="flex-1 py-3 rounded-xl text-[13px] font-semibold capitalize transition-all"
                    style={{
                      background: gameType === type 
                        ? '#FFFFFF' 
                        : 'transparent',
                      border: gameType === type
                        ? '1px solid rgba(0, 0, 0, 0.08)'
                        : '1px solid rgba(0, 0, 0, 0.06)',
                      color: gameType === type 
                        ? '#1e293b' 
                        : '#94a3b8',
                      boxShadow: gameType === type
                        ? '0 2px 6px rgba(0, 0, 0, 0.04)'
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
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-[14px] resize-none outline-none"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  color: '#1e293b',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
