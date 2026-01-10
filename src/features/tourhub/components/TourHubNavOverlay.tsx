/**
 * TourHubNavOverlay - Full-screen light mode overlay menu for Tour Hub navigation
 * Solid light background with Clbhouz logo mark watermark and World Rankings carousel
 */

import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, GraduationCap } from 'lucide-react';
import { haptic } from '@/utils/haptics';
import { WorldRankingsCarousel } from './WorldRankingsCarousel';
import type { TourHubTab } from './TourHubTabs';

interface NavItem {
  value: TourHubTab;
  label: string;
  subtitle: string;
}

interface LinkItem {
  id: string;
  label: string;
  subtitle: string;
  path: string;
  icon?: React.ReactNode;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { value: 'overview', label: 'Overview', subtitle: 'Season snapshot' },
  { value: 'schedule', label: 'Schedule', subtitle: 'All events' },
  { value: 'players', label: 'Players', subtitle: 'Tour roster' },
  { value: 'leaderboards', label: 'Leaders', subtitle: 'Season rankings' },
  { value: 'summary', label: 'Summary', subtitle: 'Tournament recap' },
  { value: 'tee-times', label: 'Tee Times', subtitle: 'Starting times' },
  { value: 'hole-stats', label: 'Holes', subtitle: 'Course analytics' },
];

const LINK_ITEMS: LinkItem[] = [
  { 
    id: 'college-golf', 
    label: 'College Golf', 
    subtitle: 'Alumni on Tour',
    path: '/tourhub/college-golf',
    icon: <GraduationCap className="w-4 h-4" />,
    badge: 'New',
  },
];

// Clbhouz brand orange
const CLBHOUZ_ORANGE = '#F97316';

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
  const navigate = useNavigate();
  
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

  const handleLinkClick = useCallback((path: string) => {
    haptic('light');
    onClose();
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [onClose, navigate]);

  const handleViewAllRankings = useCallback(() => {
    haptic('light');
    onNavigate('leaderboards');
    onClose();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [onNavigate, onClose]);
  
  if (typeof document === 'undefined') return null;
  
  const portalRoot = document.getElementById('portal-root') || document.body;
  
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - tap to close */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            className="fixed inset-0 z-[9998]"
            style={{
              background: 'rgba(0, 0, 0, 0.15)',
            }}
            onClick={onClose}
          />
          
          {/* Menu Panel - slide from right with solid light background */}
          <motion.div
            initial={{ x: '100%', opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.5 }}
            transition={{ 
              duration: 0.28, 
              ease: [0.2, 0.8, 0.2, 1],
            }}
            className="fixed inset-0 z-[10000] flex flex-col overflow-hidden"
            style={{
              background: '#F8FAFC',
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Clbhouz Logo Mark Watermark - large, off-screen right, orange */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 0.04, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="absolute pointer-events-none"
              style={{
                right: '-40%',
                top: 'calc(50% + 28px)',
                transform: 'translateY(-50%)',
                width: '500px',
                height: '500px',
                zIndex: 0,
              }}
            >
              <img 
                src="/assets/logomark-orange.png"
                alt=""
                className="w-full h-full object-contain"
              />
            </motion.div>
            
            {/* Close button header */}
            <div className="flex items-center justify-between px-5 pt-safe-top py-4">
              <button
                onClick={() => {
                  haptic('light');
                  onClose();
                }}
                className="w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-95"
                style={{ 
                  background: 'rgba(0, 0, 0, 0.05)',
                }}
                aria-label="Close menu"
              >
                <X className="w-5 h-5" style={{ color: '#64748B' }} />
              </button>
              
              {/* Placeholder for balance */}
              <div className="w-10" />
            </div>
            
            {/* World Rankings Carousel Header */}
            <WorldRankingsCarousel onViewAll={handleViewAllRankings} />
            
            {/* Subtle divider */}
            <div 
              className="h-px mx-5"
              style={{ background: 'rgba(0, 0, 0, 0.06)' }}
            />
            
            {/* Menu Items */}
            <div 
              className="flex-1 overflow-y-auto px-5 py-5"
              style={{ overscrollBehavior: 'contain' }}
            >
              <div className="space-y-2">
                {NAV_ITEMS.map((item, index) => {
                  const isActive = activeTab === item.value;
                  
                  return (
                    <motion.button
                      key={item.value}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ 
                        delay: 0.15 + index * 0.03,
                        duration: 0.25,
                        ease: [0.2, 0.8, 0.2, 1],
                      }}
                      onClick={() => handleItemClick(item.value)}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all active:scale-[0.98]"
                      style={{
                        background: isActive 
                          ? 'rgba(255, 255, 255, 0.9)' 
                          : 'rgba(255, 255, 255, 0.6)',
                        border: '1px solid rgba(0, 0, 0, 0.04)',
                        boxShadow: isActive
                          ? '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)'
                          : '0 1px 3px rgba(0, 0, 0, 0.03)',
                      }}
                    >
                      {/* Active indicator dot */}
                      <div 
                        className="w-2 h-2 rounded-full flex-shrink-0 transition-all"
                        style={{
                          background: isActive 
                            ? CLBHOUZ_ORANGE
                            : 'rgba(100, 116, 139, 0.25)',
                          boxShadow: isActive 
                            ? `0 0 8px ${CLBHOUZ_ORANGE}60`
                            : 'none',
                        }}
                      />
                      
                      {/* Text content */}
                      <div className="flex-1 min-w-0">
                        <div 
                          className="text-[16px] font-semibold"
                          style={{ 
                            color: isActive ? '#1e293b' : '#475569',
                          }}
                        >
                          {item.label}
                        </div>
                        <div 
                          className="text-[13px] mt-0.5"
                          style={{ color: '#94a3b8' }}
                        >
                          {item.subtitle}
                        </div>
                      </div>
                      
                      {/* Chevron */}
                      <ChevronRight 
                        className="w-5 h-5 flex-shrink-0 transition-transform"
                        style={{ 
                          color: isActive ? '#64748B' : '#CBD5E1',
                          transform: isActive ? 'translateX(2px)' : 'none',
                        }}
                      />
                    </motion.button>
                  );
                })}
              </div>

              {/* Divider before special links */}
              <div 
                className="h-px my-4"
                style={{ background: 'rgba(0, 0, 0, 0.06)' }}
              />

              {/* Special Link Items (College Golf, etc.) */}
              <div className="space-y-2">
                {LINK_ITEMS.map((item, index) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ 
                      delay: 0.15 + (NAV_ITEMS.length + index) * 0.03,
                      duration: 0.25,
                      ease: [0.2, 0.8, 0.2, 1],
                    }}
                    onClick={() => handleLinkClick(item.path)}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all active:scale-[0.98]"
                    style={{
                      background: 'rgba(255, 255, 255, 0.6)',
                      border: '1px solid rgba(0, 0, 0, 0.04)',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
                    }}
                  >
                    {/* Icon */}
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(249, 115, 22, 0.1)', color: CLBHOUZ_ORANGE }}
                    >
                      {item.icon}
                    </div>
                    
                    {/* Text content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span 
                          className="text-[16px] font-semibold"
                          style={{ color: '#475569' }}
                        >
                          {item.label}
                        </span>
                        {item.badge && (
                          <span 
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase"
                            style={{ 
                              background: CLBHOUZ_ORANGE, 
                              color: 'white',
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <div 
                        className="text-[13px] mt-0.5"
                        style={{ color: '#94a3b8' }}
                      >
                        {item.subtitle}
                      </div>
                    </div>
                    
                    {/* Chevron */}
                    <ChevronRight 
                      className="w-5 h-5 flex-shrink-0"
                      style={{ color: '#CBD5E1' }}
                    />
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    portalRoot
  );
}
