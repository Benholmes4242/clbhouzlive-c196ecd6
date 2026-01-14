/**
 * RestoreDraftDialog - Asks user if they want to restore a saved draft
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, RefreshCw, Trash2 } from 'lucide-react';

interface RestoreDraftDialogProps {
  isOpen: boolean;
  onContinueDraft: () => void;
  onStartFresh: () => void;
}

export function RestoreDraftDialog({
  isOpen,
  onContinueDraft,
  onStartFresh,
}: RestoreDraftDialogProps) {
  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[10100]"
          />
          
          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[10101] w-[90vw] max-w-[320px]"
          >
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: '#ffffff',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              }}
            >
              {/* Header */}
              <div className="px-6 pt-6 pb-4 text-center">
                <div 
                  className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ background: 'rgba(99, 102, 241, 0.1)' }}
                >
                  <FileText className="w-7 h-7" style={{ color: '#6366f1' }} />
                </div>
                <h3 
                  className="text-[18px] font-semibold mb-2"
                  style={{ color: '#1e293b' }}
                >
                  Continue where you left off?
                </h3>
                <p 
                  className="text-[14px]"
                  style={{ color: '#64748b' }}
                >
                  You have an unsaved game draft from earlier.
                </p>
              </div>

              {/* Actions */}
              <div className="px-4 pb-4 space-y-2">
                <button
                  onClick={onContinueDraft}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[15px] font-semibold transition-all active:scale-[0.98]"
                  style={{
                    background: '#6366f1',
                    color: '#ffffff',
                  }}
                >
                  <RefreshCw className="w-4 h-4" />
                  Continue Draft
                </button>
                <button
                  onClick={onStartFresh}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[15px] font-medium transition-all active:scale-[0.98]"
                  style={{
                    background: 'rgba(0, 0, 0, 0.04)',
                    color: '#64748b',
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  Start Fresh
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
