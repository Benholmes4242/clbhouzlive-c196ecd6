/**
 * PlayersCard - Premium composer card for adding players
 * Refined chips, smooth animations, clear visual hierarchy
 */

import React from 'react';
import { Users, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { haptic } from '@/utils/haptics';
import type { SheetMode, SelectedPlayer } from './types';

interface PlayersCardProps {
  mode: SheetMode;
  players: SelectedPlayer[];
  maxPlayers?: number;
  onOpenPicker: () => void;
  onRemovePlayer: (playerId: string) => void;
}

export function PlayersCard({ 
  mode, 
  players, 
  maxPlayers = 4,
  onOpenPicker, 
  onRemovePlayer 
}: PlayersCardProps) {
  const displayedPlayers = players.slice(0, 6);
  const extraCount = players.length - 6;
  const canAddMore = mode === 'trip' || players.length < maxPlayers - 1;
  const isAtMax = mode === 'game' && players.length >= maxPlayers - 1;

  if (players.length === 0) {
    // Empty state
    return (
      <motion.button
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        whileTap={{ scale: 0.985 }}
        onClick={() => {
          haptic('light');
          onOpenPicker();
        }}
        className="w-full p-4 rounded-2xl text-left transition-all"
        style={{
          background: 'rgba(100, 116, 139, 0.05)',
          border: '1px solid rgba(100, 116, 139, 0.08)',
        }}
      >
        <div className="flex items-center gap-3.5">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(100, 116, 139, 0.08)' }}
          >
            <Users className="w-5 h-5" style={{ color: '#64748b' }} />
          </div>
          <span 
            className="flex-1 text-[15px] font-medium"
            style={{ color: '#475569' }}
          >
            {mode === 'game' ? "Who's playing?" : "Who's attending?"}
          </span>
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-200"
            style={{ background: 'rgba(100, 116, 139, 0.08)' }}
          >
            <Plus className="w-4 h-4" style={{ color: '#64748b' }} />
          </div>
        </div>
      </motion.button>
    );
  }

  // With players
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="p-4 rounded-2xl"
      style={{
        background: 'rgba(100, 116, 139, 0.05)',
        border: '1px solid rgba(100, 116, 139, 0.08)',
      }}
    >
      <div className="flex items-start gap-3.5">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(100, 116, 139, 0.08)' }}
        >
          <Users className="w-5 h-5" style={{ color: '#64748b' }} />
        </div>
        
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex flex-wrap gap-2 items-center">
            <AnimatePresence mode="popLayout">
              {displayedPlayers.map(player => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  layout
                  className="inline-flex items-center gap-1.5 pl-1.5 pr-1 py-1"
                  style={{
                    background: player.isGuest 
                      ? 'rgba(147, 51, 234, 0.08)' 
                      : 'rgba(16, 185, 129, 0.08)',
                    border: player.isGuest
                      ? '1px solid rgba(147, 51, 234, 0.15)'
                      : '1px solid rgba(16, 185, 129, 0.15)',
                    borderRadius: '10px',
                  }}
                >
                  {player.profile_photo_url && !player.isGuest ? (
                    <img 
                      src={player.profile_photo_url}
                      alt=""
                      className="w-5 h-5 rounded-md object-cover"
                    />
                  ) : (
                    <div 
                      className="w-5 h-5 flex items-center justify-center text-[10px] font-bold rounded-md"
                      style={{ 
                        background: player.isGuest ? 'rgba(147, 51, 234, 0.12)' : 'rgba(16, 185, 129, 0.12)', 
                        color: player.isGuest ? '#9333EA' : '#059669',
                      }}
                    >
                      {(player.display_name || player.name || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span 
                    className="text-[13px] font-semibold"
                    style={{ color: player.isGuest ? '#7C3AED' : '#059669' }}
                  >
                    {player.display_name || player.name}
                  </span>
                  <button
                    onClick={() => {
                      haptic('light');
                      onRemovePlayer(player.id);
                    }}
                    className="w-5 h-5 flex items-center justify-center rounded-md transition-all duration-150 active:scale-90"
                    style={{ 
                      background: player.isGuest ? 'rgba(147, 51, 234, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    }}
                  >
                    <X 
                      className="w-3 h-3" 
                      style={{ color: player.isGuest ? '#9333EA' : '#059669' }} 
                    />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {extraCount > 0 && (
              <button
                onClick={onOpenPicker}
                className="inline-flex items-center px-2.5 py-1.5 rounded-lg transition-colors active:opacity-70"
                style={{ background: 'rgba(0, 0, 0, 0.04)' }}
              >
                <span className="text-[12px] font-medium" style={{ color: '#64748b' }}>
                  +{extraCount} more
                </span>
              </button>
            )}

            {/* Ghost chip when at max */}
            {isAtMax && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="inline-flex items-center px-2.5 py-1.5 rounded-lg"
                style={{ 
                  background: 'rgba(0, 0, 0, 0.02)',
                  border: '1px dashed rgba(0, 0, 0, 0.1)',
                }}
              >
                <span className="text-[12px] font-medium" style={{ color: '#94a3b8' }}>
                  Full group
                </span>
              </motion.div>
            )}

            {canAddMore && (
              <button
                onClick={() => {
                  haptic('light');
                  onOpenPicker();
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all duration-150 active:scale-[0.96]"
                style={{
                  border: '1px dashed rgba(0, 0, 0, 0.12)',
                }}
              >
                <Plus className="w-3 h-3" style={{ color: '#94a3b8' }} />
                <span className="text-[12px] font-medium" style={{ color: '#94a3b8' }}>
                  Add
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
