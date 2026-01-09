/**
 * TripDetailsSection - Expandable notes section for Trip mode
 */

import React from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { haptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';

interface TripDetailsSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  notes: string;
  onNotesChange: (notes: string) => void;
}

export function TripDetailsSection({
  isExpanded,
  onToggle,
  notes,
  onNotesChange,
}: TripDetailsSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
    >
      {/* Toggle header */}
      <button
        onClick={() => {
          haptic('light');
          onToggle();
        }}
        className="w-full flex items-center justify-between py-3 text-left transition-all"
      >
        <div className="flex items-center gap-2">
          <Plus 
            className={cn(
              "w-4 h-4 transition-transform duration-200",
              isExpanded && "rotate-45"
            )}
            style={{ color: 'var(--hub-text-dim)' }}
          />
          <span 
            className="text-[14px]"
            style={{ color: 'var(--hub-text-sub)' }}
          >
            Add details (optional)
          </span>
        </div>
        <ChevronDown 
          className={cn(
            "w-4 h-4 transition-transform duration-200",
            isExpanded && "rotate-180"
          )}
          style={{ color: 'var(--hub-text-dim)', opacity: 0.5 }}
        />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-2 pb-1">
              <textarea
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
                placeholder="Add trip notes, itinerary details, group info..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl text-[14px] resize-none outline-none"
                style={{
                  background: 'rgba(255, 255, 255, 0.85)',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  color: 'var(--hub-text)',
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
