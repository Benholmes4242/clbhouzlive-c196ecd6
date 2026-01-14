/**
 * HubGameCard - Premium game card for Hub sections
 * Echo styling with gradient icon containers
 */

import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, ChevronRight } from 'lucide-react';
import { haptic } from '@/utils/haptics';

interface HubGameCardProps {
  game: {
    id: string;
    courseName: string;
    dateTime: string;
    participantCount?: number;
    maxParticipants?: number;
    isLive?: boolean;
  };
  onTap: () => void;
}

export function HubGameCard({ game, onTap }: HubGameCardProps) {
  const showSlots = game.participantCount !== undefined && game.maxParticipants !== undefined;
  
  return (
    <motion.button
      onClick={() => {
        haptic('light');
        onTap();
      }}
      className="w-full p-4 rounded-2xl text-left"
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFBFC 100%)',
        border: '1px solid rgba(0, 0, 0, 0.04)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)',
      }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-3">
        {/* Icon container - Green for games */}
        <div
          className="w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
          }}
        >
          <MapPin className="h-5 w-5 text-green-600" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p
            className="font-semibold text-[15px] truncate"
            style={{ color: '#1e293b' }}
          >
            {game.courseName}
          </p>
          <p
            className="text-[13px]"
            style={{ color: '#64748b' }}
          >
            {game.dateTime}
          </p>
        </div>

        {/* Participant badge + Live indicator */}
        {showSlots && (
          <div className="flex items-center gap-2">
            {game.isLive && (
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            )}
            <span
              className="text-[13px] font-semibold px-2.5 py-1 rounded-full"
              style={{
                background: 'rgba(34, 197, 94, 0.1)',
                color: '#16a34a',
              }}
            >
              {game.participantCount}/{game.maxParticipants}
            </span>
          </div>
        )}

        {/* Chevron */}
        <ChevronRight className="h-5 w-5 text-slate-300" />
      </div>
    </motion.button>
  );
}
