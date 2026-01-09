/**
 * HeroStartCard - Premium tappable hero for starting game/trip creation
 * Warm gradient, soft elevation, obvious tap target
 */

import React from 'react';
import { MapPin, Plane, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { SheetMode, SelectedCourse } from './types';

interface HeroStartCardProps {
  mode: SheetMode;
  selectedCourse: SelectedCourse | null;
  onTap: () => void;
  onChangeCourse: () => void;
}

export function HeroStartCard({ mode, selectedCourse, onTap, onChangeCourse }: HeroStartCardProps) {
  if (selectedCourse) {
    // Selected state - show course with change action
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3.5 p-4 rounded-2xl transition-all"
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        }}
      >
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ 
            background: 'linear-gradient(135deg, rgba(110, 146, 119, 0.12) 0%, rgba(110, 146, 119, 0.06) 100%)',
            border: '1px solid rgba(110, 146, 119, 0.15)',
          }}
        >
          <MapPin className="w-5 h-5" style={{ color: '#6E9277' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div 
            className="text-[15px] font-semibold truncate"
            style={{ color: 'var(--hub-text)' }}
          >
            {selectedCourse.name}
          </div>
          {selectedCourse.location && (
            <div 
              className="text-[13px] truncate mt-0.5"
              style={{ color: 'var(--hub-text-dim)' }}
            >
              {selectedCourse.location}
            </div>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onChangeCourse();
          }}
          className="text-[13px] font-medium px-3.5 py-2 rounded-xl transition-all active:scale-[0.96]"
          style={{ 
            color: 'var(--hub-text-sub)',
            background: 'rgba(0, 0, 0, 0.04)',
          }}
        >
          Change
        </button>
      </motion.div>
    );
  }

  // Empty state - show hero card
  const isGame = mode === 'game';
  
  return (
    <motion.button
      whileTap={{ scale: 0.99, opacity: 0.9 }}
      onClick={onTap}
      className="w-full text-left p-5 rounded-2xl transition-all group"
      style={{
        background: isGame 
          ? 'linear-gradient(135deg, rgba(255, 150, 80, 0.08) 0%, rgba(255, 200, 140, 0.04) 100%)'
          : 'linear-gradient(135deg, rgba(100, 140, 200, 0.08) 0%, rgba(140, 180, 220, 0.04) 100%)',
        border: '1px solid rgba(0, 0, 0, 0.04)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
      }}
    >
      <div className="flex items-center gap-4">
        <div 
          className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ 
            background: isGame
              ? 'linear-gradient(135deg, rgba(255, 150, 80, 0.16) 0%, rgba(255, 180, 120, 0.10) 100%)'
              : 'linear-gradient(135deg, rgba(100, 140, 200, 0.16) 0%, rgba(140, 180, 220, 0.10) 100%)',
            border: '1px solid rgba(0, 0, 0, 0.05)',
          }}
        >
          {isGame ? (
            <span className="text-2xl">📍</span>
          ) : (
            <span className="text-2xl">✈️</span>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div 
            className="text-[17px] font-semibold"
            style={{ color: 'var(--hub-text)' }}
          >
            {isGame ? 'Choose a golf club' : 'Create a golf trip'}
          </div>
          <div 
            className="text-[14px] mt-1"
            style={{ color: 'var(--hub-text-sub)' }}
          >
            {isGame ? 'Where are you playing?' : 'Add your destination or first course'}
          </div>
        </div>
        
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-transform group-hover:translate-x-0.5"
          style={{ background: 'rgba(0, 0, 0, 0.04)' }}
        >
          <ChevronRight className="w-4 h-4" style={{ color: 'var(--hub-text-dim)', opacity: 0.6 }} />
        </div>
      </div>
    </motion.button>
  );
}
