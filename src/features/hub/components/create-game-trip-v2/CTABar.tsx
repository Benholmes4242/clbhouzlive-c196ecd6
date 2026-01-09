/**
 * CTABar - Sticky bottom CTA with validation hints
 * Glass separator, brand accent button
 */

import React from 'react';
import { motion } from 'framer-motion';
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
        background: 'linear-gradient(to top, #F8FAFC 0%, #F8FAFC 80%, rgba(248, 250, 252, 0) 100%)',
        paddingTop: '24px',
      }}
    >
      <div
        style={{ 
          background: '#F8FAFC',
          borderTop: '1px solid rgba(0, 0, 0, 0.04)',
          padding: '12px 20px',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Validation hint */}
        {!isValid && validationHint && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-[13px] mb-3"
            style={{ color: 'var(--hub-text-dim)' }}
          >
            {validationHint}
          </motion.p>
        )}

        {/* CTA Button */}
        <button
          onClick={onSubmit}
          disabled={!isValid || isSubmitting}
          className="w-full py-4 rounded-2xl text-[15px] font-semibold transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{
            background: isValid 
              ? 'linear-gradient(135deg, rgba(255, 150, 80, 0.95) 0%, rgba(255, 120, 60, 0.95) 100%)'
              : 'rgba(0, 0, 0, 0.06)',
            color: isValid ? 'white' : 'var(--hub-text-muted)',
            opacity: isSubmitting ? 0.7 : 1,
            boxShadow: isValid 
              ? '0 4px 16px rgba(255, 140, 60, 0.25), 0 1px 2px rgba(0, 0, 0, 0.1)'
              : 'none',
            letterSpacing: '0.3px',
          }}
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating...
            </>
          ) : (
            mode === 'game' ? 'Create Game' : 'Create Trip'
          )}
        </button>
      </div>
    </div>
  );
}
