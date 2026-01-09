/**
 * TourHubNavOverlay - Full-screen frosted overlay menu for Tour Hub navigation
 * LIV-style 9-dot portal with Clbhouz watermark
 */

import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight } from 'lucide-react';
import { haptic } from '@/utils/haptics';
import type { TourHubTab } from './TourHubTabs';

interface NavItem {
  value: TourHubTab;
  label: string;
  subtitle: string;
}

const NAV_ITEMS: NavItem[] = [
  { value: 'overview', label: 'Overview', subtitle: 'Season snapshot' },
  { value: 'schedule', label: 'Schedule', subtitle: 'All events' },
  { value: 'players', label: 'Players', subtitle: 'Tour roster' },
  { value: 'player-stats', label: 'Stats', subtitle: 'Player statistics' },
  { value: 'leaderboards', label: 'Leaders', subtitle: 'Season rankings' },
  { value: 'summary', label: 'Summary', subtitle: 'Tournament recap' },
  { value: 'tee-times', label: 'Tee Times', subtitle: 'Starting times' },
  { value: 'hole-stats', label: 'Holes', subtitle: 'Course analytics' },
];

interface TourHubNavOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: TourHubTab;
  onNavigate: (tab: TourHubTab) => void;
}

export function TourHubNavOverlay({ 
  isOpen, 
  onClose, 
  activeTab, 
  onNavigate 
}: TourHubNavOverlayProps) {
  
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);
  
  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
  
  const handleItemClick = useCallback((tab: TourHubTab) => {
    haptic('light');
    onNavigate(tab);
    onClose();
    // Scroll to top on section change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [onNavigate, onClose]);
  
  if (typeof document === 'undefined') return null;
  
  const portalRoot = document.getElementById('portal-root') || document.body;
  
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with frosted glass */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            className="fixed inset-0 z-[9998]"
            style={{
              background: 'rgba(10, 20, 25, 0.72)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
            }}
            onClick={onClose}
          />
          
          {/* Clbhouz Watermark */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.04 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center"
          >
            <span 
              className="text-[120px] font-bold tracking-tighter select-none"
              style={{ 
                color: 'white',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              Clbhouz
            </span>
          </motion.div>
          
          {/* Menu Panel - slide from right */}
          <motion.div
            initial={{ x: '100%', opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.5 }}
            transition={{ 
              duration: 0.28, 
              ease: [0.2, 0.8, 0.2, 1],
            }}
            className="fixed inset-0 z-[10000] flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-safe-top py-4">
              <button
                onClick={() => {
                  haptic('light');
                  onClose();
                }}
                className="w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-95"
                style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              
              <span className="text-white/90 text-lg font-semibold tracking-tight">
                Navigate
              </span>
              
              {/* Placeholder for balance */}
              <div className="w-10" />
            </div>
            
            {/* Menu Items */}
            <div 
              className="flex-1 overflow-y-auto px-5 py-6"
              style={{ overscrollBehavior: 'contain' }}
            >
              <div className="space-y-1">
                {NAV_ITEMS.map((item, index) => {
                  const isActive = activeTab === item.value;
                  
                  return (
                    <motion.button
                      key={item.value}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ 
                        delay: 0.05 + index * 0.03,
                        duration: 0.25,
                        ease: [0.2, 0.8, 0.2, 1],
                      }}
                      onClick={() => handleItemClick(item.value)}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all active:scale-[0.98]"
                      style={{
                        background: isActive 
                          ? 'rgba(255, 255, 255, 0.12)' 
                          : 'rgba(255, 255, 255, 0.04)',
                        border: isActive 
                          ? '1px solid rgba(255, 255, 255, 0.15)'
                          : '1px solid transparent',
                      }}
                    >
                      {/* Active indicator dot */}
                      <div 
                        className="w-2 h-2 rounded-full flex-shrink-0 transition-all"
                        style={{
                          background: isActive 
                            ? 'hsl(var(--hub-accent, 28 85% 65%))' 
                            : 'rgba(255, 255, 255, 0.2)',
                          boxShadow: isActive 
                            ? '0 0 8px hsl(var(--hub-accent, 28 85% 65%) / 0.5)'
                            : 'none',
                        }}
                      />
                      
                      {/* Text content */}
                      <div className="flex-1 min-w-0">
                        <div 
                          className="text-[17px] font-semibold"
                          style={{ 
                            color: isActive ? 'white' : 'rgba(255, 255, 255, 0.85)',
                          }}
                        >
                          {item.label}
                        </div>
                        <div 
                          className="text-[13px] mt-0.5"
                          style={{ color: 'rgba(255, 255, 255, 0.5)' }}
                        >
                          {item.subtitle}
                        </div>
                      </div>
                      
                      {/* Chevron */}
                      <ChevronRight 
                        className="w-5 h-5 flex-shrink-0 transition-transform"
                        style={{ 
                          color: isActive ? 'white' : 'rgba(255, 255, 255, 0.3)',
                          transform: isActive ? 'translateX(2px)' : 'none',
                        }}
                      />
                    </motion.button>
                  );
                })}
              </div>
            </div>
            
            {/* Footer hint */}
            <div className="px-5 py-4 pb-safe-bottom text-center">
              <span 
                className="text-[12px]"
                style={{ color: 'rgba(255, 255, 255, 0.3)' }}
              >
                Swipe right or tap outside to close
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    portalRoot
  );
}
