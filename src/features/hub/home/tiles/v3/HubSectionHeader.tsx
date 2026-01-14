/**
 * HubSectionHeader - Bold section headers with LIV-inspired typography
 * Optional: View all action on right
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';

interface HubSectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function HubSectionHeader({ title, actionLabel, onAction }: HubSectionHeaderProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <h2 
        className="font-bold uppercase tracking-wide"
        style={{ 
          color: 'var(--hub-text)',
          fontSize: '13px',
          letterSpacing: '0.5px',
        }}
      >
        {title}
      </h2>
      
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-0.5 text-[12px] font-medium transition-colors"
          style={{ color: 'var(--hub-text-dim)' }}
        >
          {actionLabel}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
