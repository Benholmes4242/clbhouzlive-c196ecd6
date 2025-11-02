/**
 * HubShell - Unified My Clubhouse Hub
 * 
 * Consolidates Nearby Golfers, Games, Your Games, Create Game, and Echo
 * into a single routed experience at /hub/*
 * 
 * Based on NearbyOverlay structure with routing instead of tabs.
 * 
 * @see Phase 1 Audit Report - Section 13.2: Hub Shell Component
 */

import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { TapButton } from '@/components/ui/TapButton';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { Z } from '@/config/zIndex';
import './HubShell.css';

interface HubShellProps {
  onClose?: () => void;
}

export function HubShell({ onClose }: HubShellProps) {
  const location = useLocation();
  const navigate = useNavigate();

  // Lock body scroll when hub is mounted
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Track tab switches
  useEffect(() => {
    const tab = location.pathname.split('/').pop() || 'golfers';
    console.log('[Hub] Tab switched to:', tab);
  }, [location.pathname]);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      // Default: navigate back or to clubhouse
      navigate('/clubhouse');
    }
  };

  // Determine active tab from route
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/golfers')) return 'golfers';
    if (path.includes('/games')) return 'games';
    if (path.includes('/your-games')) return 'your-games';
    if (path.includes('/create-game')) return 'create-game';
    if (path.includes('/echo')) return 'echo';
    return 'golfers';
  };

  const activeTab = getActiveTab();

  const tabs = [
    { id: 'golfers', label: 'Golfers', path: '/hub/golfers' },
    { id: 'games', label: 'Games', path: '/hub/games' },
    { id: 'your-games', label: 'Your Games', path: '/hub/your-games' },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: Z.hub,
          backgroundColor: 'rgba(0,0,0,0.65)',
          WebkitBackdropFilter: 'blur(8px)',
          backdropFilter: 'blur(8px)',
        }}
      />
      
      {/* Click catcher for close-on-backdrop */}
      <button
        aria-label="close hub"
        className="fixed inset-0"
        style={{ zIndex: Z.hub }}
        onClick={handleClose}
      />

      {/* Hub Container */}
      <div 
        className="fixed inset-0 flex items-end sm:items-center sm:justify-center animate-fade-in pointer-events-none"
        style={{ zIndex: Z.hub }}
      >
        <div
          className="hub-shell relative w-full max-w-lg flex flex-col animate-in slide-in-from-bottom-4 duration-200 pointer-events-auto"
          style={{
            height: 'calc(100vh - env(safe-area-inset-top))',
            maxHeight: '100vh',
            touchAction: 'pan-y',
            overscrollBehavior: 'contain',
            background: 'rgba(15, 15, 15, 0.75)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '0',
            boxShadow: '0 30px 80px rgba(0, 0, 0, 0.9)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-5 pt-4">
            <div className="grid grid-cols-3 items-center mb-3" style={{ userSelect: 'none' }}>
              <div />
              
              <div className="text-center">
                <h2 className="text-white text-[17px] font-semibold">
                  My Clubhouse
                </h2>
              </div>
              
              <div className="flex justify-end">
                <TapButton
                  onPointerDown={handleClose}
                  className="text-white/60 hover:text-white/90 transition-colors active:scale-95 w-11 h-11 flex items-center justify-center -mr-2"
                  aria-label="Close hub"
                >
                  <X className="w-5 h-5" />
                </TapButton>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex px-5 mt-3 border-b border-white/[0.06]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={`flex-1 py-3.5 text-sm font-medium relative transition-all duration-150 ${
                  activeTab === tab.id
                    ? 'text-white'
                    : 'text-white/55 hover:text-white/75'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div 
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-white/90 rounded-full transition-all duration-150"
                    style={{ width: '48px' }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Content Area - Routed */}
          <div 
            className="flex-1 overflow-y-auto px-5 pt-4 pb-3"
            style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
            }}
          >
            <Outlet />
          </div>
        </div>
      </div>
    </>
  );
}
