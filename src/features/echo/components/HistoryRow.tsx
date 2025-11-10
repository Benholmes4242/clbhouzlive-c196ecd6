/**
 * HistoryRow - Two-line chat capsule for Echo history index
 * Apple-grade glass card with title + preview + timestamp
 */

import React from 'react';
import { GlassCard } from '@/components/shared/GlassCard';
import { formatRelativeTime } from '@/utils/dateFormat';

export interface HistoryRowProps {
  id: string;
  title: string;          // User's question (first user message)
  subtitle: string;       // First assistant reply excerpt
  createdAt: string;
  messageCount?: number;
  hasWebSources?: boolean;
  isExpanded?: boolean;
  onClick: () => void;
}

export const HistoryRow: React.FC<HistoryRowProps> = ({
  title,
  subtitle,
  createdAt,
  messageCount,
  hasWebSources,
  isExpanded,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className="w-full text-left transition-all duration-200"
      aria-expanded={isExpanded}
      style={{
        padding: '12px 16px',
        borderRadius: '18px',
        background: 'var(--hub-glass-bg)',
        border: '1px solid var(--hub-stroke)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--hub-glass-bg-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--hub-glass-bg)';
      }}
    >
      {/* Line 1: Title + Timestamp */}
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <div 
          className="text-[15px] font-medium truncate flex-1"
          style={{ color: 'var(--hub-text)' }}
        >
          {title}
        </div>
        <div 
          className="text-[12px] flex-shrink-0"
          style={{ color: 'var(--hub-text-dim)' }}
        >
          {formatRelativeTime(createdAt)}
        </div>
      </div>

      {/* Line 2: Subtitle (first assistant reply) */}
      <div 
        className="text-[13px] line-clamp-2"
        style={{ 
          color: 'var(--hub-text-sub)',
          lineHeight: '1.4'
        }}
      >
        {subtitle || '(No response yet)'}
      </div>

      {/* Meta chips (optional) */}
      {(messageCount || hasWebSources) && (
        <div className="flex items-center gap-2 mt-2">
          {messageCount && messageCount > 0 && (
            <span 
              className="text-[11px] px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(255,255,255,0.08)',
                color: 'var(--hub-text-dim)',
              }}
            >
              {messageCount} {messageCount === 1 ? 'message' : 'messages'}
            </span>
          )}
          {hasWebSources && (
            <span 
              className="text-[11px] px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(110, 146, 119, 0.15)',
                color: '#a6f5b7',
              }}
            >
              Web-sourced
            </span>
          )}
        </div>
      )}
    </button>
  );
};
