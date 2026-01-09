/**
 * TripDetailsSection - Expandable notes section for Trip mode
 * Chevron rotates on expand, tinted background
 */

import React from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { haptic } from '@/utils/haptics';

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
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
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
          <motion.div
            animate={{ rotate: isExpanded ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <Plus 
              className="w-4 h-4"
              style={{ color: '#94a3b8' }}
            />
          </motion.div>
          <span 
            className="text-[14px]"
            style={{ color: '#64748b' }}
          >
            Add details (optional)
          </span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown 
            className="w-4 h-4"
            style={{ color: '#94a3b8' }}
          />
        </motion.div>
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
            <div 
              className="pt-3 pb-2 px-3 rounded-xl"
              style={{ background: 'rgba(248, 250, 252, 0.8)' }}
            >
              <textarea
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
                placeholder="Add trip notes, itinerary details, group info..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl text-[14px] resize-none outline-none"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  color: '#1e293b',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
