/**
 * HubEmptyState - Premium empty states for Hub sections
 * Echo color scheme with gradient CTAs
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Flag, MapPin, Calendar, Compass, ChevronRight } from 'lucide-react';
import { haptic } from '@/utils/haptics';

interface HubEmptyStateProps {
  onCreateGame: () => void;
  onDiscover: () => void;
}

/**
 * Full page empty state - No upcoming games/trips at all
 */
export function HubEmptyState({ onCreateGame, onDiscover }: HubEmptyStateProps) {
  return (
    <div className="px-5 py-8">
      <div
        className="rounded-2xl p-8 text-center"
        style={{
          background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFBFC 100%)',
          border: '1px solid rgba(0, 0, 0, 0.04)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)',
        }}
      >
        {/* Icon */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{
            background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
          }}
        >
          <Flag className="h-7 w-7 text-green-600" />
        </div>

        {/* Title */}
        <h3
          className="text-[17px] font-semibold mb-2"
          style={{ color: '#1e293b' }}
        >
          No games or trips yet
        </h3>

        {/* Subtitle */}
        <p
          className="text-[14px] mb-6 max-w-[260px] mx-auto"
          style={{ color: '#64748b' }}
        >
          Create a game, plan a trip, or discover games near you
        </p>

        {/* CTAs */}
        <div className="flex flex-col gap-3">
          <motion.button
            onClick={() => {
              haptic('light');
              onCreateGame();
            }}
            className="w-full py-3 px-4 rounded-xl text-[14px] font-semibold text-white"
            style={{
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
            }}
            whileTap={{ scale: 0.98 }}
          >
            Create a Game
          </motion.button>

          <motion.button
            onClick={() => {
              haptic('light');
              onDiscover();
            }}
            className="w-full py-3 px-4 rounded-xl text-[14px] font-semibold"
            style={{
              background: 'rgba(34, 197, 94, 0.1)',
              color: '#16a34a',
            }}
            whileTap={{ scale: 0.98 }}
          >
            Discover Games
          </motion.button>
        </div>
      </div>
    </div>
  );
}

interface HubSectionEmptyStateProps {
  title: string;
  subtitle: string;
  actionLabel: string;
  onAction: () => void;
  variant?: 'happening' | 'world';
}

/**
 * Section empty state - For "What's Happening" or "Your World" sections
 */
export function HubSectionEmptyState({
  title,
  subtitle,
  actionLabel,
  onAction,
  variant = 'happening',
}: HubSectionEmptyStateProps) {
  const Icon = variant === 'happening' ? Compass : Calendar;
  const iconBg = variant === 'happening'
    ? 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)'
    : 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)';
  const iconColor = variant === 'happening' ? '#16a34a' : '#ea580c';

  return (
    <motion.button
      onClick={() => {
        haptic('light');
        onAction();
      }}
      className="w-full p-5 rounded-2xl text-left"
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFBFC 100%)',
        border: '1px solid rgba(0, 0, 0, 0.04)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)',
      }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-center gap-4">
        {/* Icon container */}
        <div
          className="w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg }}
        >
          <Icon className="h-5 w-5" style={{ color: iconColor }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className="text-[14px] font-medium mb-0.5"
            style={{ color: '#1e293b' }}
          >
            {title}
          </p>
          <p
            className="text-[13px]"
            style={{ color: '#64748b' }}
          >
            {subtitle}
          </p>
        </div>

        {/* Action link */}
        <div
          className="flex items-center gap-0.5 text-[13px] font-semibold flex-shrink-0"
          style={{ color: '#22c55e' }}
        >
          {actionLabel}
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>
    </motion.button>
  );
}
