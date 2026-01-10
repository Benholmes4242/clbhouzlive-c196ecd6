/**
 * RequestNoteModal - Modal for adding optional note when requesting to join
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/utils/haptics';

interface RequestNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (message: string | null) => void;
  isSubmitting?: boolean;
  entityType: 'game' | 'trip';
}

const MAX_CHARS = 240;

export function RequestNoteModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
  entityType,
}: RequestNoteModalProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset message when modal opens
  useEffect(() => {
    if (isOpen) {
      setMessage('');
      // Focus textarea after animation
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    haptic('medium');
    const trimmed = message.trim();
    onSubmit(trimmed.length > 0 ? trimmed : null);
  };

  const handleSkip = () => {
    haptic('light');
    onSubmit(null);
  };

  const handleClose = () => {
    haptic('light');
    onClose();
  };

  const charsRemaining = MAX_CHARS - message.length;
  const isOverLimit = charsRemaining < 0;

  if (!isOpen) return null;

  const portalRoot = document.getElementById('portal-root') || document.body;

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
            className="fixed inset-0 z-[10010] bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[10011] rounded-t-[24px] overflow-hidden bg-background"
            style={{ maxHeight: '85svh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grabber */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-9 h-[3px] rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3">
              <h2 className="text-[17px] font-semibold text-foreground">
                Send request
              </h2>
              <button
                onClick={handleClose}
                className="p-2 -mr-2 rounded-full transition-all duration-150 hover:bg-muted active:scale-95"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 pb-6">
              <p className="text-[13px] text-muted-foreground mb-3">
                Add a short note for the host (optional)
              </p>

              {/* Textarea */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, MAX_CHARS + 50))} // Allow slight overflow for UX
                  placeholder={`Introduce yourself to the ${entityType === 'game' ? 'host' : 'organizer'}…`}
                  className={cn(
                    "w-full h-28 px-4 py-3 rounded-xl text-[14px] resize-none",
                    "bg-muted/50 border border-border/50",
                    "text-foreground placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30",
                    "transition-all duration-150",
                    isOverLimit && "border-destructive focus:ring-destructive/20 focus:border-destructive"
                  )}
                />
                
                {/* Character counter */}
                <div 
                  className={cn(
                    "absolute bottom-2 right-3 text-[11px] font-medium",
                    isOverLimit ? "text-destructive" : "text-muted-foreground"
                  )}
                >
                  {charsRemaining}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleSkip}
                  disabled={isSubmitting}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-[14px] font-medium transition-all",
                    "bg-muted text-foreground hover:bg-muted/80",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  Skip
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || isOverLimit}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-[14px] font-semibold transition-all",
                    "bg-[#0F4C2E] text-white hover:bg-[#0F4C2E]/90",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "flex items-center justify-center gap-2"
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send request
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    portalRoot
  );
}
