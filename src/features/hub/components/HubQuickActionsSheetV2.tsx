/**
 * HubQuickActionsSheetV2 - Streamlined quick actions sheet
 * Shows only: Create Game or Trip, Discover Games
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flag, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { haptic } from '@/utils/haptics';

interface HubQuickActionsSheetV2Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateGame: () => void;
  onOpenDiscoverGames: () => void;
}

export function HubQuickActionsSheetV2({
  isOpen,
  onClose,
  onOpenCreateGame,
  onOpenDiscoverGames,
}: HubQuickActionsSheetV2Props) {
  const navigate = useNavigate();

  const handleCreateGame = () => {
    haptic('light');
    onOpenCreateGame();
  };

  const handleDiscoverGames = () => {
    haptic('light');
    onClose();
    onOpenDiscoverGames();
  };

  if (!isOpen) return null;

  const portalRoot = document.getElementById('portal-root') || document.body;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999]"
            style={{
              background: 'rgba(0, 0, 0, 0.25)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
            onClick={onClose}
          />

          {/* Sheet - themed to match Create Game or Trip tile */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                onClose();
              }
            }}
            className="fixed inset-x-0 bottom-0 z-[10000] flex flex-col rounded-t-[24px] overflow-hidden"
            style={{
              backgroundColor: '#F8FAFC',
              boxShadow: '0 -4px 32px rgba(0, 0, 0, 0.12)',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            {/* Header bar */}
            <div className="flex-shrink-0">
              {/* Header */}
              <div className="flex items-center justify-between pt-3 pb-2 px-5">
                <div className="w-8" />
                <div className="w-10 h-1 rounded-full bg-slate-300" />
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-[0.96] hover:bg-slate-100"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              {/* Title */}
              <div className="px-5 pb-4">
                <h2 className="text-lg font-semibold" style={{ color: '#1e293b' }}>
                  Quick Actions
                </h2>
              </div>
            </div>

            {/* Actions */}
            <div className="px-5 pb-6 space-y-3">
              {/* Create Game or Trip */}
              <motion.button
                onClick={handleCreateGame}
                className="w-full flex items-center gap-4 p-4 rounded-xl text-left"
                style={{
                  background: 'linear-gradient(135deg, #fff9e6 0%, #ffecb3 50%, #c8e6c9 100%)',
                  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
                }}
                whileTap={{ scale: 0.98 }}
              >
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(255, 255, 255, 0.6)' }}
                >
                  <Flag className="w-6 h-6" style={{ color: '#2e7d32' }} />
                </div>
                <div className="flex-1">
                  <span className="font-semibold block text-base" style={{ color: '#1e293b' }}>
                    Create Game or Trip
                  </span>
                  <span className="text-sm" style={{ color: '#64748b' }}>
                    Start your next golf adventure
                  </span>
                </div>
              </motion.button>

              {/* Discover Games */}
              <motion.button
                onClick={handleDiscoverGames}
                className="w-full flex items-center gap-4 p-4 rounded-xl text-left"
                style={{
                  background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
                }}
                whileTap={{ scale: 0.98 }}
              >
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(255, 255, 255, 0.6)' }}
                >
                  <Compass className="w-6 h-6" style={{ color: '#1565c0' }} />
                </div>
                <div className="flex-1">
                  <span className="font-semibold block text-base" style={{ color: '#1e293b' }}>
                    Discover Games
                  </span>
                  <span className="text-sm" style={{ color: '#64748b' }}>
                    Find games near you
                  </span>
                </div>
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    portalRoot
  );
}

export default HubQuickActionsSheetV2;
