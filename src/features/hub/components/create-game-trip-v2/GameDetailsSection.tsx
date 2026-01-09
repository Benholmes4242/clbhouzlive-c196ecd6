/**
 * GameDetailsSection - Expandable details for Game mode
 * Date, Time, 9/18 holes, Game type, Notes
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
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
          <Plus 
            className={cn(
              "w-4 h-4 transition-transform duration-200",
              isExpanded && "rotate-45"
            )}
            style={{ color: 'var(--hub-text-dim)' }}
          />
          <span 
            className="text-[14px]"
            style={{ color: 'var(--hub-text-sub)' }}
          >
            Add details (optional)
          </span>
        </div>
        <ChevronDown 
          className={cn(
            "w-4 h-4 transition-transform duration-200",
            isExpanded && "rotate-180"
          )}
          style={{ color: 'var(--hub-text-dim)', opacity: 0.5 }}
        />
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
            <div className="pt-2 pb-1 space-y-4">
              {/* Date & Time */}
              <div className="flex gap-2">
                <div
                  className="flex-1 flex items-center gap-2.5 px-4 py-3 rounded-xl"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.85)',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--hub-text-dim)' }} />
                  <input
                    type="date"
                    value={gameDate ? format(gameDate, 'yyyy-MM-dd') : ''}
                    onChange={(e) => onGameDateChange(e.target.value ? new Date(e.target.value) : null)}
                    className="flex-1 text-[14px] font-medium bg-transparent border-none outline-none appearance-none"
                    style={{ color: gameDate ? 'var(--hub-text)' : 'var(--hub-text-muted)' }}
                    placeholder="Date"
                  />
                </div>
                <div
                  className="flex-1 flex items-center gap-2.5 px-4 py-3 rounded-xl"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.85)',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <Clock className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--hub-text-dim)' }} />
                  <input
                    type="time"
                    value={gameTime}
                    onChange={(e) => onGameTimeChange(e.target.value)}
                    className="flex-1 text-[14px] font-medium bg-transparent border-none outline-none appearance-none"
                    style={{ color: gameTime ? 'var(--hub-text)' : 'var(--hub-text-muted)' }}
                    placeholder="Time"
                  />
                </div>
              </div>

              {/* Holes */}
              <div className="flex gap-2">
                {([9, 18] as HoleCount[]).map(num => (
                  <button
                    key={num}
                    onClick={() => {
                      haptic('light');
                      onHoleCountChange(num);
                    }}
                    className="flex-1 py-3 rounded-xl text-[14px] font-semibold transition-all active:scale-[0.97]"
                    style={{
                      background: holeCount === num 
                        ? 'rgba(255, 255, 255, 0.98)' 
                        : 'rgba(255, 255, 255, 0.7)',
                      border: holeCount === num
                        ? '1px solid rgba(0, 0, 0, 0.08)'
                        : '1px solid rgba(0, 0, 0, 0.04)',
                      color: holeCount === num 
                        ? 'var(--hub-text)' 
                        : 'var(--hub-text-muted)',
                      boxShadow: holeCount === num
                        ? '0 2px 6px rgba(0, 0, 0, 0.04)'
                        : 'none',
                    }}
                  >
                    {num} holes
                  </button>
                ))}
              </div>

              {/* Game type */}
              <div className="flex gap-2">
                {(['casual', 'practice', 'match'] as GameType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => {
                      haptic('light');
                      onGameTypeChange(type);
                    }}
                    className="flex-1 py-3 rounded-xl text-[13px] font-semibold capitalize transition-all active:scale-[0.97]"
                    style={{
                      background: gameType === type 
                        ? 'rgba(255, 255, 255, 0.98)' 
                        : 'rgba(255, 255, 255, 0.7)',
                      border: gameType === type
                        ? '1px solid rgba(0, 0, 0, 0.08)'
                        : '1px solid rgba(0, 0, 0, 0.04)',
                      color: gameType === type 
                        ? 'var(--hub-text)' 
                        : 'var(--hub-text-muted)',
                      boxShadow: gameType === type
                        ? '0 2px 6px rgba(0, 0, 0, 0.04)'
                        : 'none',
                    }}
                  >
                    {type}
                  </button>
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
                  background: 'rgba(255, 255, 255, 0.85)',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  color: 'var(--hub-text)',
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
