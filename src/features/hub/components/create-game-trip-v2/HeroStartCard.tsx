/**
 * HeroStartCard - Premium tappable hero for starting game/trip creation
 * Warm gradient background, refined icon styling, smooth press feedback
 */

import React from 'react';
import { MapPin, ChevronRight } from 'lucide-react';
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
        transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="flex items-center gap-3.5 p-4 rounded-2xl"
        style={{
          background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFBFC 100%)',
          border: '1px solid rgba(0, 0, 0, 0.04)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.02)',
        }}
      >
        {/* Course thumbnail or icon */}
        {selectedCourse.thumbnail_image ? (
          <img
            src={selectedCourse.thumbnail_image}
            alt=""
            className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
            style={{ border: '1px solid rgba(0, 0, 0, 0.04)' }}
          />
        ) : (
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ 
              background: 'linear-gradient(135deg, rgba(194, 165, 133, 0.18) 0%, rgba(194, 165, 133, 0.08) 100%)',
              border: '1px solid rgba(194, 165, 133, 0.2)',
            }}
          >
            <MapPin className="w-5 h-5" style={{ color: '#a08060' }} />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div 
            className="text-[15px] font-semibold truncate leading-tight"
            style={{ color: '#1e293b' }}
          >
            {selectedCourse.name}
          </div>
          {selectedCourse.location && (
            <div 
              className="text-[13px] truncate mt-0.5"
              style={{ color: '#64748b' }}
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
          className="text-[13px] font-medium px-3.5 py-2 rounded-xl transition-all duration-150 active:scale-[0.96] active:opacity-80"
          style={{ 
            color: '#64748b',
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
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={onTap}
      className="w-full text-left p-5 rounded-2xl transition-all group"
      style={{
        background: isGame 
          ? 'linear-gradient(180deg, #FFFFFF 0%, #FEF9F3 100%)'
          : 'linear-gradient(180deg, #FFFFFF 0%, #F5FAFF 100%)',
        border: '1px solid rgba(0, 0, 0, 0.04)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.03)',
      }}
    >
      <div className="flex items-center gap-4">
        <div 
          className="w-14 h-14 rounded-[18px] flex items-center justify-center flex-shrink-0"
          style={{ 
            background: isGame
              ? 'linear-gradient(145deg, rgba(194, 165, 133, 0.22) 0%, rgba(194, 165, 133, 0.08) 100%)'
              : 'linear-gradient(145deg, rgba(100, 140, 200, 0.18) 0%, rgba(100, 140, 200, 0.06) 100%)',
            border: isGame 
              ? '1px solid rgba(194, 165, 133, 0.25)'
              : '1px solid rgba(100, 140, 200, 0.2)',
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
            className="text-[16px] font-semibold leading-tight"
            style={{ color: '#1e293b' }}
          >
            {isGame ? 'Choose a golf club' : 'Create a golf trip'}
          </div>
          <div 
            className="text-[14px] mt-1"
            style={{ color: '#64748b' }}
          >
            {isGame ? 'Where are you playing?' : 'Add your first destination'}
          </div>
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
