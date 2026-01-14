/**
 * HubTripCard - Premium trip card for Hub sections
 * Echo styling with gradient icon containers
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Plane, ChevronRight } from 'lucide-react';
import { haptic } from '@/utils/haptics';

interface HubTripCardProps {
  trip: {
    id: string;
    name: string;
    dateRange: string;
    location?: string;
  };
  onTap: () => void;
}

export function HubTripCard({ trip, onTap }: HubTripCardProps) {
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
        {/* Icon container - Blue for trips */}
        <div
          className="w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
          }}
        >
          <Plane className="h-5 w-5 text-blue-600" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p
            className="font-semibold text-[15px] truncate"
            style={{ color: '#1e293b' }}
          >
            {trip.name}
          </p>
          <p
            className="text-[13px]"
            style={{ color: '#64748b' }}
          >
            {trip.dateRange}
            {trip.location && ` · ${trip.location}`}
          </p>
        </div>

        {/* Chevron */}
        <ChevronRight className="h-5 w-5 text-slate-300" />
      </div>
    </motion.button>
  );
}
