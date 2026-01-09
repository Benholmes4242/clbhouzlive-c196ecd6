/**
 * CTABar - Sticky bottom CTA with validation hints
 * Fully opaque, never translucent, gradient brand orange
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
        background: 'linear-gradient(to top, #F9FAFB 0%, #F9FAFB 85%, rgba(249, 250, 251, 0) 100%)',
        paddingTop: '28px',
      }}
    >
      <div
        style={{ 
          background: '#F9FAFB',
          borderTop: '1px solid rgba(0, 0, 0, 0.04)',
          padding: '14px 20px',
          paddingBottom: 'calc(18px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Validation hint */}
        {!isValid && validationHint && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-[13px] mb-3"
            style={{ color: '#94a3b8' }}
          >
            {validationHint}
          </motion.p>
        )}

        {/* CTA Button */}
        <motion.button
          onClick={onSubmit}
          disabled={!isValid || isSubmitting}
          whileTap={isValid ? { scale: 0.98 } : {}}
          className="w-full py-4 rounded-2xl text-[15px] font-semibold transition-all duration-150 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{
            background: isValid 
              ? 'linear-gradient(135deg, #FF9650 0%, #FF7840 100%)'
              : 'rgba(0, 0, 0, 0.06)',
            color: isValid ? 'white' : '#94a3b8',
            opacity: isSubmitting ? 0.7 : 1,
            boxShadow: isValid 
              ? '0 4px 20px rgba(255, 140, 60, 0.3), 0 2px 4px rgba(0, 0, 0, 0.1)'
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
        </motion.button>
      </div>
    </div>
  );
}
