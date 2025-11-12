/**
 * SwipeableHistoryRow (swipe disabled)
 * We keep the component to preserve imports/props, but ignore all swipe logic.
 * Row actions are now tap-only via the star/bin buttons inside HistoryRow.
 */
import React from 'react';
import { HistoryRow } from './HistoryRow';
import { haptic } from '@/utils/haptics';
import { Star, Trash2 } from 'lucide-react';
import { echoHistoryAnalytics } from '../analytics/echoHistoryAnalytics';
import { EchoHistorySearchFilters } from '../hooks/useEchoHistorySearch';

interface SwipeableHistoryRowProps {
  item: {
    id: string;
    title: string;
    subtitle?: string;
    has_response?: boolean;
    message_count?: number;
    relative_date?: string;
    created_at?: string;
  };
  isStarred: boolean;
  onStar: () => void;
  onDelete: () => void;
  onToggle: () => void;
  listFilters?: Partial<EchoHistorySearchFilters>;
  rankIndex?: number;
  isPendingDelete?: boolean;
  children?: React.ReactNode;
}

export const SwipeableHistoryRow: React.FC<SwipeableHistoryRowProps> = ({
  item,
  isStarred,
  onStar,
  onDelete,
  onToggle,
  listFilters,
  rankIndex,
  isPendingDelete,
  children,
}) => {
  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptic('light');
    echoHistoryAnalytics.starToggled({
      thread_id: item.id,
      prev_starred: isStarred,
      next_starred: !isStarred,
      source: 'row-hover',
      list_filters: listFilters,
      rank_index: rankIndex,
    });
    onStar();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    haptic('medium');
    onDelete();
  };

  // Trailing actions (tap only)
  const trailingActions = (
    <div className="flex items-center gap-2">
      <button
        onClick={handleStarClick}
        className="p-2 rounded-full min-w-[40px] min-h-[40px] flex items-center justify-center"
        aria-label={isStarred ? 'Unstar conversation' : 'Star conversation'}
      >
        <Star 
          size={16} 
          style={{ color: 'var(--hub-text)' }}
          fill={isStarred ? 'currentColor' : 'none'}
        />
      </button>
      <button
        onClick={handleDeleteClick}
        className="p-2 rounded-full min-w-[40px] min-h-[40px] flex items-center justify-center"
        aria-label="Delete conversation"
      >
        <Trash2 
          size={16} 
          style={{ color: 'rgba(255, 59, 48, 0.9)' }}
        />
      </button>
    </div>
  );

  return (
    <div
      style={{ 
        opacity: isPendingDelete ? 0.4 : 1,
        pointerEvents: isPendingDelete ? 'none' : 'auto',
        transition: 'opacity 200ms ease-out',
      }}
    >
      <HistoryRow 
        item={item}
        onToggle={onToggle}
        trailing={trailingActions}
      >
        {children}
      </HistoryRow>
    </div>
  );
};

export default SwipeableHistoryRow;
