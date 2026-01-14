/**
 * CTABar - Premium sticky bottom CTA with validation hints
 * Gradient brand orange, refined loading state, smooth transitions
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SheetMode } from './types';

interface CTABarProps {
  mode: SheetMode;
  isValid: boolean;
  isSubmitting: boolean;
  validationHint?: string;
  onSubmit: () => void;
}

export function CTABar({ mode, isValid, isSubmitting, validationHint, onSubmit }: CTABarProps) {
  return (
    <div 
      className="absolute bottom-0 left-0 right-0 z-20"
      style={{ 
        background: 'linear-gradient(to top, #F9FAFB 0%, #F9FAFB 80%, rgba(249, 250, 251, 0) 100%)',
        paddingTop: '24px',
      }}
    >
      <div
        style={{ 
          background: '#F9FAFB',
          borderTop: '1px solid rgba(0, 0, 0, 0.03)',
          padding: '12px 20px',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Validation hint */}
        <AnimatePresence mode="wait">
          {!isValid && validationHint && (
            <motion.p
              key="hint"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="text-center text-[13px] mb-2.5"
              style={{ color: '#94a3b8' }}
            >
              {validationHint}
            </motion.p>
          )}
        </AnimatePresence>

        {/* CTA Button */}
        <motion.button
          onClick={onSubmit}
          disabled={!isValid || isSubmitting}
          whileTap={isValid && !isSubmitting ? { scale: 0.98 } : {}}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="w-full py-3.5 rounded-[14px] text-[15px] font-semibold transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{
            background: isValid 
              ? '#e2e8f0'
              : 'rgba(0, 0, 0, 0.05)',
            color: isValid ? '#1e293b' : '#94a3b8',
            opacity: isSubmitting ? 0.85 : 1,
            letterSpacing: '0.2px',
          }}
        >
          {isSubmitting ? (
            <>
              <motion.span 
                className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              />
              <span>Creating...</span>
            </>
          ) : (
            mode === 'game' ? 'Create Game' : 'Create Trip'
          )}
        </motion.button>
      </div>
    </div>
  );
}
