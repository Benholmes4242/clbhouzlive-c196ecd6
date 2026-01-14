/**
 * RestoreDraftDialog - Premium dialog for restoring saved drafts
 * Refined styling, friendly tone, smooth animations
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ArrowRight, Trash2 } from 'lucide-react';

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
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[10100]"
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          />
          
          {/* Centering wrapper - fixed position with flexbox centering */}
          <div 
            className="fixed inset-0 z-[10101] flex items-center justify-center p-6"
            style={{ pointerEvents: 'none' }}
          >
            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: 'tween', duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
              className="w-full max-w-[320px]"
              style={{ pointerEvents: 'auto' }}
            >
              <div
                className="rounded-[20px] overflow-hidden"
                style={{
                  background: '#ffffff',
                  boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                }}
              >
                {/* Header */}
                <div className="px-6 pt-6 pb-3 text-center">
                  <div 
                    className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                    style={{ 
                      background: 'linear-gradient(135deg, rgba(255, 150, 80, 0.15) 0%, rgba(255, 120, 64, 0.1) 100%)',
                    }}
                  >
                    <FileText className="w-7 h-7" style={{ color: '#FF8840' }} />
                  </div>
                  <h3 
                    className="text-[18px] font-semibold mb-1.5"
                    style={{ color: '#1e293b' }}
                  >
                    Continue where you left off?
                  </h3>
                  <p 
                    className="text-[14px] leading-relaxed"
                    style={{ color: '#64748b' }}
                  >
                    You have an unsaved game draft from earlier.
                  </p>
                </div>

                {/* Actions */}
                <div className="px-4 pb-5 pt-2 space-y-2">
                  <button
                    onClick={onContinueDraft}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[15px] font-semibold transition-all duration-150 active:scale-[0.98]"
                    style={{
                      background: '#e2e8f0',
                      color: '#1e293b',
                    }}
                  >
                    Continue Draft
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={onStartFresh}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[15px] font-medium transition-all duration-150 active:scale-[0.98]"
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
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
