import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}

export function AdminDrawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 480,
}: AdminDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (open) drawerRef.current?.focus();
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
            className="fixed inset-0 z-50"
          />

          <motion.div
            ref={drawerRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className="fixed right-0 top-0 bottom-0 z-50 flex flex-col outline-none"
            style={{ width: `min(${width}px, 100vw)`, background: '#FFFFFF', borderLeft: '1px solid #E2E8F0', boxShadow: '0 24px 48px rgba(0,0,0,0.12)' }}
          >
            <div className="flex items-start justify-between px-6 py-5 flex-shrink-0" style={{ borderBottom: '1px solid #E2E8F0' }}>
              <div className="space-y-1">
                <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0F172A' }}>
                  {title}
                </h2>
                {subtitle && (
                  <p style={{ fontSize: 13, color: '#64748B' }}>
                    {subtitle}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-[10px] flex items-center justify-center transition-colors active:scale-95"
                style={{ color: '#64748B' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                aria-label="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {children}
            </div>

            {footer && (
              <div className="flex-shrink-0 px-6 py-4" style={{ borderTop: '1px solid #E2E8F0' }}>
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
