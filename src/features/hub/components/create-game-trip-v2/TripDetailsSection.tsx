/**
 * TripDetailsSection - Expandable notes section for Trip mode
 * Matches GameDetailsSection styling - X icon when expanded, smooth animations
 */

import React from 'react';
import { Plus, X } from 'lucide-react';
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
      transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Toggle header - matches GameDetailsSection */}
      <button
        onClick={() => {
          haptic('light');
          onToggle();
        }}
        className="w-full flex items-center justify-between py-3 text-left transition-all group"
      >
        <div className="flex items-center gap-2.5">
          <motion.div
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0, 0, 0, 0.04)' }}
            animate={{ rotate: isExpanded ? 45 : 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            {isExpanded ? (
              <X className="w-3.5 h-3.5" style={{ color: '#64748b' }} />
            ) : (
              <Plus className="w-3.5 h-3.5" style={{ color: '#64748b' }} />
            )}
          </motion.div>
          <span 
            className="text-[14px] font-medium"
            style={{ color: '#64748b' }}
          >
            {isExpanded ? 'Trip details' : 'Add details (optional)'}
          </span>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden"
          >
            <div 
              className="pt-2 pb-3 px-3 rounded-xl"
              style={{ background: 'rgba(248, 250, 252, 0.8)' }}
            >
              <textarea
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
                placeholder="Add trip notes, itinerary details, group info..."
                rows={3}
                className="w-full px-3.5 py-3 rounded-xl text-[14px] resize-none outline-none transition-all focus:ring-2 focus:ring-slate-200"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(0, 0, 0, 0.04)',
                  color: '#1e293b',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
