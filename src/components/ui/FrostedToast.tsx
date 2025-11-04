/**
 * FrostedToast Component
 * Apple-style frosted glass toast notifications
 */

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface ToastItem {
  id: number;
  message: string;
  type?: 'success' | 'error';
}

interface ToastProps extends ToastItem {
  onClose: () => void;
}

function Toast({ message, type = 'success', onClose }: ToastProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="px-5 py-3 rounded-2xl backdrop-blur-[28px] border border-white/20 shadow-[0_4px_18px_rgba(0,0,0,0.3)] text-white/90 text-[15px] flex items-center gap-2 cursor-pointer"
      style={{
        background:
          type === 'success'
            ? 'rgba(46, 204, 113, 0.22)'
            : 'rgba(255, 71, 71, 0.22)',
      }}
      onClick={onClose}
      role="alert"
      aria-live="polite"
    >
      {type === 'success' ? '✅' : '⚠️'}
      <span>{message}</span>
    </motion.div>
  );
}

interface ToastContainerProps {
  toasts: ToastItem[];
  removeToast: (id: number) => void;
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col gap-3 z-[999] pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <Toast {...t} onClose={() => removeToast(t.id)} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
