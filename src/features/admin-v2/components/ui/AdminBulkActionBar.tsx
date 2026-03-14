import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export interface BulkAction {
  id: string;
  label: string;
  icon?: React.ElementType;
  variant?: 'default' | 'danger';
  onClick: () => void;
}

interface AdminBulkActionBarProps {
  selectedCount: number;
  actions: BulkAction[];
  onClear: () => void;
  noun?: string;
}

export function AdminBulkActionBar({
  selectedCount,
  actions,
  onClear,
  noun = 'item',
}: AdminBulkActionBarProps) {
  const isVisible = selectedCount > 0;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-foreground text-background shadow-2xl">
            {/* Count */}
            <span className="text-[13px] font-semibold tabular-nums whitespace-nowrap">
              {selectedCount} {noun}{selectedCount !== 1 ? 's' : ''} selected
            </span>

            {/* Divider */}
            <div className="w-px h-5 bg-background/20" />

            {/* Actions */}
            {actions.map(action => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={action.onClick}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-all active:scale-95',
                    action.variant === 'danger'
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-background/15 text-background hover:bg-background/25',
                  )}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  {action.label}
                </button>
              );
            })}

            {/* Divider */}
            <div className="w-px h-5 bg-background/20" />

            {/* Clear */}
            <button onClick={onClear} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-background/15 transition-colors active:scale-90" aria-label="Clear selection">
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
