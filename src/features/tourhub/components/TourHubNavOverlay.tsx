/**
 * TourHubNavOverlay - Premium full-screen overlay menu for Tour Hub navigation
 * Clean design with icons, improved active states, and simplified rankings preview
 */

import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ChevronRight, 
  LayoutGrid, 
  Calendar, 
  Users, 
  Trophy, 
  FileText, 
  Clock, 
  Target,
  GraduationCap 
} from 'lucide-react';
import { haptic } from '@/utils/haptics';
import { useTopWorldRanked } from '../hooks/useWorldRankings';
import type { TourHubTab } from './TourHubTabs';

interface NavItem {
  value: TourHubTab;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
}

interface LinkItem {
  id: string;
  label: string;
  subtitle: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
}

// Clbhouz brand orange
const CLBHOUZ_ORANGE = '#F97316';

const NAV_ITEMS: NavItem[] = [
  { value: 'overview', label: 'Overview', subtitle: 'Season snapshot', icon: <LayoutGrid className="w-5 h-5" /> },
  { value: 'schedule', label: 'Schedule', subtitle: 'All events', icon: <Calendar className="w-5 h-5" /> },
  { value: 'players', label: 'Players', subtitle: 'Tour roster', icon: <Users className="w-5 h-5" /> },
  { value: 'leaderboards', label: 'Leaders', subtitle: 'Season rankings', icon: <Trophy className="w-5 h-5" /> },
  { value: 'summary', label: 'Summary', subtitle: 'Tournament recap', icon: <FileText className="w-5 h-5" /> },
  { value: 'tee-times', label: 'Tee Times', subtitle: 'Starting times', icon: <Clock className="w-5 h-5" /> },
  { value: 'hole-stats', label: 'Holes', subtitle: 'Course analytics', icon: <Target className="w-5 h-5" /> },
];

const LINK_ITEMS: LinkItem[] = [
  { 
    id: 'college-golf', 
    label: 'College Golf', 
    subtitle: 'Alumni on Tour',
    path: '/tourhub/college-golf',
    icon: <GraduationCap className="w-5 h-5" />,
    badge: 'New',
  },
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
  const navigate = useNavigate();
  const { data: topPlayers } = useTopWorldRanked(3);
  
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

  // Build simplified rankings text
  const rankingsText = topPlayers.length > 0
    ? topPlayers.map((p, i) => `#${i + 1} ${p.playerName.split(' ').pop()}`).join(' • ')
    : null;
  
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
              background: 'rgba(0, 0, 0, 0.2)',
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
              background: '#FAFBFC',
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Clbhouz Logo Mark Watermark */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 0.03, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="absolute pointer-events-none"
              style={{
                right: '-35%',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '450px',
                height: '450px',
                zIndex: 0,
              }}
            >
              <img 
                src="/assets/logomark-orange.png"
                alt=""
                className="w-full h-full object-contain"
              />
            </motion.div>
            
            {/* Header with close button */}
            <div className="flex items-center justify-between px-5 pt-safe-top py-4">
              <button
                onClick={() => {
                  haptic('light');
                  onClose();
                }}
                className="w-11 h-11 flex items-center justify-center rounded-full transition-all active:scale-95"
                style={{ 
                  background: 'rgba(0, 0, 0, 0.06)',
                }}
                aria-label="Close menu"
              >
                <X className="w-5 h-5" style={{ color: '#475569' }} />
              </button>
              
              <div className="w-11" />
            </div>
            
            {/* World Rankings - Simplified inline text */}
            {rankingsText && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="px-5 pb-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 
                      className="text-sm font-semibold mb-1"
                      style={{ color: '#1e293b' }}
                    >
                      World Rankings
                    </h3>
                    <p 
                      className="text-sm"
                      style={{ color: '#64748B' }}
                    >
                      {rankingsText}
                    </p>
                  </div>
                  
                  <button
                    onClick={handleViewAllRankings}
                    className="flex items-center gap-0.5 text-sm font-medium transition-colors hover:opacity-70 active:scale-95"
                    style={{ color: '#64748B' }}
                  >
                    View all
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
            
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
              <div className="space-y-1">
                {NAV_ITEMS.map((item, index) => {
                  const isActive = activeTab === item.value;
                  
                  return (
                    <motion.button
                      key={item.value}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ 
                        delay: 0.12 + index * 0.025,
                        duration: 0.25,
                        ease: [0.2, 0.8, 0.2, 1],
                      }}
                      onClick={() => handleItemClick(item.value)}
                      className="w-full flex items-center gap-3.5 py-3.5 px-4 rounded-xl text-left transition-all active:scale-[0.98] relative overflow-hidden"
                      style={{
                        background: isActive 
                          ? 'rgba(249, 115, 22, 0.06)' 
                          : 'transparent',
                        borderLeft: isActive 
                          ? `3px solid ${CLBHOUZ_ORANGE}`
                          : '3px solid transparent',
                      }}
                    >
                      {/* Icon */}
                      <div 
                        className="flex-shrink-0 transition-colors"
                        style={{
                          color: isActive ? CLBHOUZ_ORANGE : '#94a3b8',
                        }}
                      >
                        {item.icon}
                      </div>
                      
                      {/* Text content */}
                      <div className="flex-1 min-w-0">
                        <div 
                          className="text-[15px] font-semibold"
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
                        className="w-4.5 h-4.5 flex-shrink-0 transition-all"
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
              <div className="space-y-1">
                {LINK_ITEMS.map((item, index) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ 
                      delay: 0.12 + (NAV_ITEMS.length + index) * 0.025,
                      duration: 0.25,
                      ease: [0.2, 0.8, 0.2, 1],
                    }}
                    onClick={() => handleLinkClick(item.path)}
                    className="w-full flex items-center gap-3.5 py-3.5 px-4 rounded-xl text-left transition-all active:scale-[0.98]"
                    style={{
                      background: 'transparent',
                      borderLeft: '3px solid transparent',
                    }}
                  >
                    {/* Icon */}
                    <div 
                      className="flex-shrink-0"
                      style={{ color: '#94a3b8' }}
                    >
                      {item.icon}
                    </div>
                    
                    {/* Text content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span 
                          className="text-[15px] font-semibold"
                          style={{ color: '#475569' }}
                        >
                          {item.label}
                        </span>
                        {item.badge && (
                          <span 
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
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
                      className="w-4.5 h-4.5 flex-shrink-0"
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
