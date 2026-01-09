/**
 * PlayersCard - Tappable composer card for adding players
 * Shows chips when players selected, + Add affordance
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

  if (players.length === 0) {
    // Empty state
    return (
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.98, opacity: 0.9 }}
        onClick={() => {
          haptic('light');
          onOpenPicker();
        }}
        className="w-full p-4 rounded-2xl text-left transition-all"
        style={{
          background: 'rgba(100, 116, 139, 0.06)',
          border: '1px solid rgba(100, 116, 139, 0.12)',
        }}
      >
        <div className="flex items-center gap-3.5">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(100, 116, 139, 0.10)' }}
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
            className="w-8 h-8 rounded-full flex items-center justify-center"
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl"
      style={{
        background: 'rgba(100, 116, 139, 0.06)',
        border: '1px solid rgba(100, 116, 139, 0.12)',
      }}
    >
      <div className="flex items-start gap-3.5">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(100, 116, 139, 0.10)' }}
        >
          <Users className="w-5 h-5" style={{ color: '#64748b' }} />
        </div>
        
        <div className="flex-1 min-w-0 pt-1">
          <div className="flex flex-wrap gap-2 items-center">
            <AnimatePresence mode="popLayout">
              {displayedPlayers.map(player => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="inline-flex items-center gap-1.5 pl-2 pr-1.5 py-1.5"
                  style={{
                    background: player.isGuest 
                      ? 'rgba(147, 51, 234, 0.12)' 
                      : 'rgba(16, 185, 129, 0.12)',
                    border: player.isGuest
                      ? '1px solid rgba(147, 51, 234, 0.25)'
                      : '1px solid rgba(16, 185, 129, 0.25)',
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
                      className="w-5 h-5 flex items-center justify-center text-[10px] font-semibold rounded-md"
                      style={{ 
                        background: player.isGuest ? 'rgba(147, 51, 234, 0.15)' : 'rgba(16, 185, 129, 0.15)', 
                        color: player.isGuest ? '#9333EA' : '#10B981',
                      }}
                    >
                      {(player.display_name || player.name || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span 
                    className="text-[13px] font-semibold"
                    style={{ color: player.isGuest ? '#9333EA' : '#10B981' }}
                  >
                    {player.display_name || player.name}
                  </span>
                  <button
                    onClick={() => {
                      haptic('light');
                      onRemovePlayer(player.id);
                    }}
                    className="w-5 h-5 flex items-center justify-center rounded-md transition-all active:scale-90"
                    style={{ 
                      background: player.isGuest ? 'rgba(147, 51, 234, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    }}
                  >
                    <X 
                      className="w-3 h-3" 
                      style={{ color: player.isGuest ? '#9333EA' : '#10B981' }} 
                    />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {extraCount > 0 && (
              <button
                onClick={onOpenPicker}
                className="inline-flex items-center px-3 py-1.5 rounded-full transition-colors active:opacity-70"
                style={{ background: 'rgba(0, 0, 0, 0.05)' }}
              >
                <span className="text-[12px] font-medium" style={{ color: 'var(--hub-text-sub)' }}>
                  +{extraCount} more
                </span>
              </button>
            )}

            {canAddMore && (
              <button
                onClick={() => {
                  haptic('light');
                  onOpenPicker();
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full transition-all active:scale-[0.96]"
                style={{
                  border: '1px dashed rgba(0, 0, 0, 0.15)',
                }}
              >
                <Plus className="w-3 h-3" style={{ color: 'var(--hub-text-dim)' }} />
                <span className="text-[12px] font-medium" style={{ color: 'var(--hub-text-dim)' }}>
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
