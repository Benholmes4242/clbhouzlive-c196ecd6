/**
 * HubSectionHeader - Bold LIV-inspired section headers
 * Heavy weight, accent rule, increased top spacing
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
    <div className="flex items-center justify-between pt-6 pb-3">
      {/* Title with accent rule */}
      <div className="flex items-center gap-3 flex-1">
        <h2 
          className="font-extrabold uppercase"
          style={{ 
            color: 'var(--hub-text)',
            fontSize: '13px',
            letterSpacing: '0.1em',
          }}
        >
          {title}
        </h2>
        
        {/* Fading accent rule - green for What's Happening, orange for Your World */}
        <div 
          className="flex-1 h-[2px] rounded-full"
          style={{
            background: title.toLowerCase().includes('happening') 
              ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.55) 0%, rgba(16, 185, 129, 0) 100%)'
              : 'linear-gradient(90deg, rgba(255, 142, 61, 0.55) 0%, rgba(255, 142, 61, 0) 100%)',
            maxWidth: '70px',
          }}
        />
      </div>
      
      {/* Action link with accent color */}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-0.5 text-[12px] font-semibold transition-colors active:opacity-70"
          style={{ color: 'rgba(255, 142, 61, 0.90)' }}
        >
          {actionLabel}
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
