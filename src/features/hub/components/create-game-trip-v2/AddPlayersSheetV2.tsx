/**
 * AddPlayersSheetV2 - Bottom sheet for adding players
 * Search input, user list, Add Guest option
 */

import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, UserPlus, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { haptic } from '@/utils/haptics';
import type { SelectedPlayer } from './types';

interface AddPlayersSheetV2Props {
  isOpen: boolean;
  onClose: () => void;
  selectedPlayers: SelectedPlayer[];
  onAddPlayer: (player: SelectedPlayer) => void;
  maxPlayers?: number;
}

// Mock users for Phase 1
const MOCK_USERS: SelectedPlayer[] = [
  { id: '1', name: 'Alex Johnson', display_name: 'Alex', profile_photo_url: '' },
  { id: '2', name: 'Sarah Williams', display_name: 'Sarah', profile_photo_url: '' },
  { id: '3', name: 'Mike Thompson', display_name: 'Mike', profile_photo_url: '' },
  { id: '4', name: 'Emily Davis', display_name: 'Emily', profile_photo_url: '' },
  { id: '5', name: 'Chris Martin', display_name: 'Chris', profile_photo_url: '' },
];

export function AddPlayersSheetV2({ 
  isOpen, 
  onClose, 
  selectedPlayers,
  onAddPlayer,
  maxPlayers = 4,
}: AddPlayersSheetV2Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [guestName, setGuestName] = useState('');
  const [showGuestInput, setShowGuestInput] = useState(false);

  const filteredUsers = MOCK_USERS.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isSelected = (userId: string) => selectedPlayers.some(p => p.id === userId);
  const canAddMore = selectedPlayers.length < maxPlayers - 1;

  const handleAddUser = useCallback((user: SelectedPlayer) => {
    if (isSelected(user.id) || !canAddMore) return;
    haptic('light');
    onAddPlayer(user);
  }, [selectedPlayers, canAddMore, onAddPlayer]);

  const handleAddGuest = useCallback(() => {
    if (!guestName.trim() || !canAddMore) return;
    haptic('light');
    onAddPlayer({
      id: `guest-${Date.now()}`,
      name: guestName.trim(),
      display_name: guestName.trim(),
      isGuest: true,
    });
    setGuestName('');
    setShowGuestInput(false);
  }, [guestName, canAddMore, onAddPlayer]);

  const handleSheetClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/25 z-[10005]"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-x-0 bottom-0 z-[10006] rounded-t-[28px] overflow-hidden flex flex-col"
            style={{
              height: '70vh',
              background: '#F8FAFC',
              boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.08)',
              overscrollBehavior: 'contain',
            }}
            onClick={handleSheetClick}
          >
            {/* Header */}
            <div className="flex-shrink-0">
              <div className="flex justify-center pt-2.5 pb-1">
                <div className="w-8 h-[3px] rounded-full" style={{ background: 'rgba(0, 0, 0, 0.1)' }} />
              </div>

              <div className="flex items-center justify-between px-5 pb-3">
                <h2 className="text-[17px] font-semibold" style={{ color: 'var(--hub-text)' }}>
                  Add Players
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-[0.96]"
                  style={{ background: 'rgba(0, 0, 0, 0.04)' }}
                >
                  <X className="w-4 h-4" style={{ color: 'var(--hub-text-sub)' }} />
                </button>
              </div>

              {/* Search */}
              <div className="px-5 pb-3">
                <div
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl"
                  style={{
                    background: 'rgba(0, 0, 0, 0.04)',
                    border: '1px solid rgba(0, 0, 0, 0.04)',
                  }}
                >
                  <Search className="w-4 h-4" style={{ color: 'var(--hub-text-dim)' }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search players..."
                    className="flex-1 text-[14px] bg-transparent border-none outline-none"
                    style={{ color: 'var(--hub-text)' }}
                  />
                </div>
              </div>
            </div>

            {/* User list */}
            <div 
              className="flex-1 overflow-y-auto px-5"
              style={{ paddingBottom: '100px', overscrollBehavior: 'contain' }}
            >
              {/* Add Guest option */}
              {!showGuestInput ? (
                <button
                  onClick={() => {
                    haptic('light');
                    setShowGuestInput(true);
                  }}
                  disabled={!canAddMore}
                  className="w-full flex items-center gap-3 p-3 rounded-xl mb-3 transition-all active:scale-[0.98] disabled:opacity-50"
                  style={{
                    background: 'rgba(147, 51, 234, 0.06)',
                    border: '1px solid rgba(147, 51, 234, 0.12)',
                  }}
                >
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(147, 51, 234, 0.12)' }}
                  >
                    <UserPlus className="w-5 h-5" style={{ color: '#9333EA' }} />
                  </div>
                  <span className="text-[14px] font-medium" style={{ color: '#9333EA' }}>
                    Add Guest (not on app)
                  </span>
                </button>
              ) : (
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Guest name..."
                    autoFocus
                    className="flex-1 px-4 py-3 rounded-xl text-[14px] outline-none"
                    style={{
                      background: 'rgba(147, 51, 234, 0.06)',
                      border: '1px solid rgba(147, 51, 234, 0.2)',
                      color: 'var(--hub-text)',
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddGuest();
                      if (e.key === 'Escape') setShowGuestInput(false);
                    }}
                  />
                  <button
                    onClick={handleAddGuest}
                    disabled={!guestName.trim()}
                    className="px-4 py-3 rounded-xl text-[14px] font-medium transition-all active:scale-[0.96] disabled:opacity-50"
                    style={{ background: '#9333EA', color: 'white' }}
                  >
                    Add
                  </button>
                </div>
              )}

              {/* Users */}
              <div className="space-y-1">
                {filteredUsers.map(user => {
                  const selected = isSelected(user.id);
                  return (
                    <button
                      key={user.id}
                      onClick={() => handleAddUser(user)}
                      disabled={selected || !canAddMore}
                      className="w-full flex items-center gap-3 p-3 rounded-xl transition-all active:scale-[0.98] disabled:opacity-60"
                      style={{
                        background: selected ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                      }}
                    >
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ 
                          background: selected 
                            ? 'rgba(16, 185, 129, 0.15)' 
                            : 'rgba(0, 0, 0, 0.06)',
                        }}
                      >
                        {user.profile_photo_url ? (
                          <img src={user.profile_photo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <span 
                            className="text-[14px] font-semibold"
                            style={{ color: selected ? '#10B981' : 'var(--hub-text-muted)' }}
                          >
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <div 
                          className="text-[14px] font-medium"
                          style={{ color: selected ? '#10B981' : 'var(--hub-text)' }}
                        >
                          {user.name}
                        </div>
                      </div>
                      {selected && (
                        <div 
                          className="w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ background: 'rgba(16, 185, 129, 0.15)' }}
                        >
                          <Check className="w-3.5 h-3.5" style={{ color: '#10B981' }} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
