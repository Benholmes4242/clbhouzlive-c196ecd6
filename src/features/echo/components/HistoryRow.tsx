/**
 * HistoryRow - Two-line chat capsule for Echo history index
 * Apple-grade glass card with title + preview + timestamp
 */

import React from 'react';
import { Star } from 'lucide-react';
import { formatRelativeTime } from '@/utils/dateFormat';
import { cn } from '@/lib/utils';

export interface HistoryRowProps {
  id: string;
  title: string;
  subtitle?: string;
  is_starred?: boolean;
  has_response?: boolean;
  message_count?: number;
  relative_date?: string;
  last_activity_at?: string;
  mode?: 'live' | 'static';
  onClick?: () => void;
  onStarClick?: () => void;
  className?: string;
}

export const HistoryRow: React.FC<HistoryRowProps> = ({
  id,
  title,
  subtitle = '',
  is_starred,
  has_response,
  message_count,
  relative_date,
  last_activity_at,
  mode,
  onClick,
  onStarClick,
  className,
}) => {
  return (
    <button
      onClick={onClick}
      aria-label={`Open conversation: ${title}`}
      className={cn(
        'w-full text-left rounded-[18px] p-3.5 transition-transform anim-fade',
        'hover:translate-y-[-1px] focus:outline-none focus:ring-2 focus:ring-white/18',
        'border border-white/10',
        className
      )}
      style={{ background: 'rgba(255,255,255,.06)', backdropFilter: 'blur(10px)' }}
    >
      {/* Line 1: title + time + star */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="truncate font-medium text-[15px] leading-5" style={{ color: 'var(--hub-text)' }}>
              {title}
            </div>
            {relative_date && (
              <div className="text-[12px]" style={{ color: 'var(--meta-dim)' }}>
                {relative_date || (last_activity_at && formatRelativeTime(last_activity_at))}
              </div>
            )}
            {is_starred && (
              <Star
                className="shrink-0 anim-pop"
                size={14}
                aria-hidden
                style={{ color: 'var(--hub-text)', opacity: 0.9 }}
                fill="currentColor"
              />
            )}
          </div>

          {/* Line 2: subtitle/meta */}
          <div className="mt-0.5 text-[13px] leading-[18px] line-clamp-2" style={{ color: 'var(--meta-strong)' }}>
            {subtitle}
          </div>

          {/* Line 3: meta chips */}
          <div className="mt-2 flex flex-wrap gap-6 text-[12px]" style={{ color: 'var(--meta-dim)' }}>
            <span>{has_response ? 'Has response' : 'Awaiting response'}</span>
            {!!message_count && <span>{message_count} msg{message_count > 1 ? 's' : ''}</span>}
            {!!mode && <span>{mode === 'live' ? 'Live' : 'Static'}</span>}
          </div>
        </div>

        {/* Star button (desktop hover alternative) */}
        {onStarClick && (
          <div className="pl-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStarClick();
              }}
              aria-label={is_starred ? 'Unstar conversation' : 'Star conversation'}
              className="p-2 rounded-full hover:bg-white/8 focus:outline-none focus:ring-2 focus:ring-white/18"
            >
              <Star
                size={18}
                className={cn(is_starred && 'anim-pop')}
                style={{ color: 'var(--hub-text)', opacity: 0.9 }}
                {...(is_starred ? { fill: 'currentColor' } : {})}
              />
            </button>
          </div>
        )}
      </div>
    </button>
  );
};
