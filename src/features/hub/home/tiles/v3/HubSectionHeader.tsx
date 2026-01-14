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
    <div className="flex items-center justify-between pt-5 pb-2.5">
      {/* Title with accent rule */}
      <div className="flex items-center gap-3 flex-1">
        <h2 
          className="font-extrabold uppercase"
          style={{ 
            color: 'var(--hub-text)',
            fontSize: '14px',
            letterSpacing: '0.08em',
          }}
        >
          {title}
        </h2>
        
        {/* Fading accent rule */}
        <div 
          className="flex-1 h-[2px] rounded-full"
          style={{
            background: 'linear-gradient(90deg, rgba(255, 142, 61, 0.5) 0%, rgba(255, 142, 61, 0) 100%)',
            maxWidth: '80px',
          }}
        />
      </div>
      
      {/* Action link with accent color */}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-0.5 text-[12px] font-semibold transition-colors active:opacity-70"
          style={{ color: 'rgba(255, 142, 61, 0.85)' }}
        >
          {actionLabel}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
