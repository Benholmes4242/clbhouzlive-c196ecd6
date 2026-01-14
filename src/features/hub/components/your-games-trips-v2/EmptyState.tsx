/**
 * EmptyState - Premium empty states with warm, tour-grade copy
 * V2: Added CTAs for actionable empty states
 * Soft icon, centered layout, calm tone
 */

import React from 'react';
import { CalendarDays, History, Plane, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import type { SheetTab } from './types';

interface EmptyStateProps {
  tab: SheetTab;
  onCreateGame?: () => void;
  onCreateTrip?: () => void;
}

const CONFIG: Record<SheetTab, { 
  icon: React.ReactNode; 
  title: string; 
  subtitle: string;
  ctaLabel?: string;
  ctaAction?: 'game' | 'trip';
}> = {
  upcoming: {
    icon: <CalendarDays className="w-7 h-7" style={{ color: 'rgba(100, 116, 139, 0.45)' }} />,
    title: 'No upcoming games',
    subtitle: 'Create a game to play with friends or discover games nearby.',
    ctaLabel: 'Create Game',
    ctaAction: 'game',
  },
  past: {
    icon: <History className="w-7 h-7" style={{ color: 'rgba(100, 116, 139, 0.45)' }} />,
    title: 'No completed games',
    subtitle: 'Your finished rounds will appear here for easy reference.',
  },
  trips: {
    icon: <Plane className="w-7 h-7" style={{ color: 'rgba(100, 116, 139, 0.45)' }} />,
    title: 'No trips planned',
    subtitle: 'Create a trip to organize your golf adventures.',
    ctaLabel: 'Create Trip',
    ctaAction: 'trip',
  },
};

export function EmptyState({ tab, onCreateGame, onCreateTrip }: EmptyStateProps) {
  const config = CONFIG[tab];

  const handleCta = () => {
    if (config.ctaAction === 'game') onCreateGame?.();
    if (config.ctaAction === 'trip') onCreateTrip?.();
  };

  return (
    <motion.div 
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Icon container - soft glass circle */}
      <div 
        className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
        style={{
          background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.5) 100%)',
          border: '1px solid rgba(0, 0, 0, 0.04)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
        }}
      >
        {config.icon}
      </div>

      {/* Title */}
      <h3 
        className="text-[16px] font-semibold mb-1.5"
        style={{ color: '#1e293b', letterSpacing: '-0.01em' }}
      >
        {config.title}
      </h3>

      {/* Subtitle - warm, calm tone */}
      <p 
        className="text-[13px] max-w-[240px] leading-relaxed mb-5"
        style={{ color: 'rgba(100, 116, 139, 0.75)' }}
      >
        {config.subtitle}
      </p>

      {/* CTA Button */}
      {config.ctaLabel && (onCreateGame || onCreateTrip) && (
        <motion.button
          onClick={handleCta}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-150"
          style={{
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            color: 'white',
            boxShadow: '0 2px 8px rgba(249, 115, 22, 0.25), 0 1px 2px rgba(0, 0, 0, 0.06)',
          }}
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.02 }}
        >
          <Plus className="w-4 h-4" />
          {config.ctaLabel}
        </motion.button>
      )}
    </motion.div>
  );
}
