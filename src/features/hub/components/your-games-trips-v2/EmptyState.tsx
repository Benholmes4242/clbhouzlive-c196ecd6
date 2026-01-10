/**
 * EmptyState - Premium empty states with warm, tour-grade copy
 * Soft icon, centered layout, calm tone
 */

import React from 'react';
import { CalendarDays, History, Plane } from 'lucide-react';
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
}> = {
  upcoming: {
    icon: <CalendarDays className="w-6 h-6" style={{ color: 'rgba(100, 116, 139, 0.4)' }} />,
    title: 'No upcoming games yet',
    subtitle: 'Games you\'re invited to will appear here',
  },
  past: {
    icon: <History className="w-6 h-6" style={{ color: 'rgba(100, 116, 139, 0.4)' }} />,
    title: 'No completed games',
    subtitle: 'Past rounds will live here for reference',
  },
  trips: {
    icon: <Plane className="w-6 h-6" style={{ color: 'rgba(100, 116, 139, 0.4)' }} />,
    title: 'No trips yet',
    subtitle: 'Create a trip to start building your tour.',
  },
};

export function EmptyState({ tab }: EmptyStateProps) {
  const config = CONFIG[tab];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {/* Icon container - soft glass circle */}
      <div 
        className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
        style={{
          background: 'rgba(255, 255, 255, 0.6)',
          border: '1px solid rgba(0, 0, 0, 0.04)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
        }}
      >
        {config.icon}
      </div>

      {/* Title */}
      <h3 
        className="text-[15px] font-semibold mb-1.5"
        style={{ color: '#1e293b' }}
      >
        {config.title}
      </h3>

      {/* Subtitle - warm, calm tone */}
      <p 
        className="text-[13px] max-w-[220px] leading-relaxed"
        style={{ color: 'rgba(100, 116, 139, 0.7)' }}
      >
        {config.subtitle}
      </p>
    </div>
  );
}
