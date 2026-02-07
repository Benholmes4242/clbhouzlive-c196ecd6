/**
 * TourHubNavOverlay - Premium full-screen overlay menu for Tour Hub navigation
 * Clean design with icons, improved active states, and mini World Rankings cards
 */

import React, { useEffect, useCallback, useRef } from 'react';
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
  GraduationCap 
} from 'lucide-react';
import { haptic } from '@/utils/haptics';
import { useTopWorldRanked, toTitleCase, getInitials } from '../hooks/useWorldRankings';
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
  { value: 'overview', label: 'Overview', subtitle: 'The global golf season at a glance.', icon: <LayoutGrid className="w-5 h-5" /> },
  { value: 'schedule', label: 'Schedule', subtitle: 'What\'s happening — past, present, and upcoming.', icon: <Calendar className="w-5 h-5" /> },
  { value: 'players', label: 'Players', subtitle: 'The names shaping the season across every tour.', icon: <Users className="w-5 h-5" /> },
  { value: 'leaderboards', label: 'Leaders', subtitle: 'Who\'s on top — and who\'s chasing them.', icon: <Trophy className="w-5 h-5" /> },
];

const LINK_ITEMS: LinkItem[] = [
  { 
    id: 'college-golf', 
    label: 'College Golf', 
    subtitle: 'From campus standout to Tour contender.',
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: topPlayers, isLoading: rankingsLoading } = useTopWorldRanked(5);
  
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

  const handlePlayerClick = useCallback((playerId: string) => {
    haptic('light');
    onClose();
    navigate(`/tourhub/player/${playerId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [onClose, navigate]);
  
  if (typeof document === 'undefined') return null;
  
  const portalRoot = document.getElementById('portal-root') || document.body;

  // Take top 5 for mini cards
  const displayPlayers = topPlayers.slice(0, 5);
  
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
              background: '#F8FAFC',
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Clbhouz Logo Mark Watermark - bottom right corner */}
            <div
              className="fixed pointer-events-none"
              style={{
                right: '-100px',
                bottom: '-80px',
                width: '380px',
                height: '380px',
                zIndex: 0,
              }}
            >
              <motion.img
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 0.04, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                src="/assets/logomark-orange.png"
                alt=""
                className="w-full h-full object-contain"
              />
            </div>
            
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
            
            {/* World Rankings - Mini Cards */}
            {displayPlayers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="px-5 pb-4"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <h3 
                    className="text-sm font-semibold"
                    style={{ color: '#1e293b' }}
                  >
                    World Rankings
                  </h3>
                  
                  <button
                    onClick={handleViewAllRankings}
                    className="flex items-center gap-0.5 text-xs font-medium transition-colors hover:opacity-70 active:scale-95"
                    style={{ color: '#64748B' }}
                  >
                    View all
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                {/* Mini Cards Row */}
                <div
                  ref={scrollRef}
                  className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                  }}
                >
                  {displayPlayers.map((player, index) => {
                    const isFirst = index === 0;
                    const lastName = player.playerName.split(' ').slice(-1)[0];
                    const country = toTitleCase(player.country);
                    
                    return (
                      <motion.button
                        key={player.playerId}
                        initial={{ opacity: 0, x: 15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.12 + index * 0.04 }}
                        onClick={() => handlePlayerClick(player.playerId)}
                        className="flex-shrink-0 flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all active:scale-[0.98]"
                        style={{
                          background: isFirst 
                            ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.12) 0%, rgba(245, 158, 11, 0.08) 100%)'
                            : 'rgba(255, 255, 255, 0.9)',
                          border: isFirst 
                            ? '1.5px solid rgba(245, 158, 11, 0.35)'
                            : '1px solid rgba(0, 0, 0, 0.06)',
                          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
                          minWidth: '140px',
                        }}
                      >
                        {/* Rank Badge */}
                        <div
                          className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{
                            background: isFirst 
                              ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                              : index === 1
                              ? 'linear-gradient(135deg, #94A3B8 0%, #64748B 100%)'
                              : 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
                          }}
                        >
                          <span className="text-xs font-bold text-white">
                            {player.worldRank}
                          </span>
                        </div>
                        
                        {/* Avatar */}
                        <div 
                          className="flex-shrink-0 w-9 h-9 rounded-full overflow-hidden flex items-center justify-center"
                          style={{
                            background: isFirst 
                              ? 'linear-gradient(135deg, #FDE68A 0%, #FCD34D 100%)'
                              : 'rgba(100, 116, 139, 0.1)',
                          }}
                        >
                          {player.photoUrl ? (
                            <img 
                              src={player.photoUrl}
                              alt={player.playerName}
                              className="w-full h-full rounded-full object-cover object-top"
                            />
                          ) : (
                            <span 
                              className="text-xs font-semibold"
                              style={{ color: isFirst ? '#92400E' : '#64748B' }}
                            >
                              {getInitials(player.playerName)}
                            </span>
                          )}
                        </div>
                        
                        {/* Name & Country */}
                        <div className="flex-1 min-w-0 text-left">
                          <p 
                            className="text-sm font-semibold truncate"
                            style={{ color: '#1e293b' }}
                          >
                            {lastName}
                          </p>
                          <p 
                            className="text-[10px] truncate"
                            style={{ color: '#94a3b8' }}
                          >
                            {country || 'Unknown'}
                          </p>
                        </div>
                      </motion.button>
                    );
                  })}
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
              <div className="space-y-2">
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
                          ? 'rgba(226, 232, 240, 0.5)' 
                          : 'transparent',
                        borderLeft: isActive 
                          ? '3px solid #1e293b'
                          : '3px solid transparent',
                      }}
                    >
                      {/* Icon */}
                      <div 
                        className="flex-shrink-0 transition-colors"
                        style={{
                          color: isActive ? '#1e293b' : '#94a3b8',
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
                          className="text-[12px] mt-0.5"
                          style={{ color: '#a1a1aa' }}
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
              <div className="space-y-2">
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
