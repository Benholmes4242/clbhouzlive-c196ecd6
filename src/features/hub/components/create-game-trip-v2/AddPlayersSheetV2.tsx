/**
 * AddPlayersSheetV2 - Premium bottom sheet for adding players
 * Uses real user search, shows friends first, refined styling
 */

import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, UserPlus, Check, Users, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { haptic } from '@/utils/haptics';
import { usePlayerSearch } from '../../hooks/usePlayerSearch';
import { supabase } from '@/integrations/supabase/client';
import type { SelectedPlayer } from './types';

interface AddPlayersSheetV2Props {
  isOpen: boolean;
  onClose: () => void;
  selectedPlayers: SelectedPlayer[];
  onAddPlayer: (player: SelectedPlayer) => void;
  maxPlayers?: number;
}

export function AddPlayersSheetV2({ 
  isOpen, 
  onClose, 
  selectedPlayers,
  onAddPlayer,
  maxPlayers = 4,
}: AddPlayersSheetV2Props) {
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [guestName, setGuestName] = useState('');
  const [showGuestInput, setShowGuestInput] = useState(false);

  // Get current user on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id);
    });
  }, []);

  const excludeIds = selectedPlayers.filter(p => !p.isGuest).map(p => p.id);
  
  const { friends, searchResults, isLoading } = usePlayerSearch({
    currentUserId,
    excludeIds,
    searchQuery,
  });

  const isSelected = (userId: string) => selectedPlayers.some(p => p.id === userId);
  const canAddMore = selectedPlayers.length < maxPlayers - 1;
  const spotsRemaining = maxPlayers - 1 - selectedPlayers.length;

  const handleAddUser = useCallback((player: { id: string; name: string; display_name?: string; profile_photo_url?: string }) => {
    if (isSelected(player.id) || !canAddMore) return;
    haptic('light');
    onAddPlayer({
      id: player.id,
      name: player.name,
      display_name: player.display_name,
      profile_photo_url: player.profile_photo_url,
    });
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

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  if (typeof document === 'undefined') return null;

  const hasSearchQuery = searchQuery.trim().length > 0;
  const showFriendsSection = friends.length > 0;
  const showSearchResultsSection = hasSearchQuery && searchResults.length > 0;
  const showNoResults = hasSearchQuery && !isLoading && friends.length === 0 && searchResults.length === 0;

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
            className="fixed inset-0 z-[10005]"
            style={{
              background: 'rgba(0, 0, 0, 0.25)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[10006] rounded-t-[24px] overflow-hidden flex flex-col"
            style={{
              height: '70vh',
              background: '#F8FAFC',
              boxShadow: '0 -4px 32px rgba(0, 0, 0, 0.1)',
              overscrollBehavior: 'contain',
            }}
            onClick={handleSheetClick}
          >
            {/* Header */}
            <div className="flex-shrink-0">
              <div className="flex justify-center pt-2.5 pb-1">
                <div className="w-9 h-1 rounded-full" style={{ background: 'rgba(0, 0, 0, 0.1)' }} />
              </div>

              <div className="flex items-center justify-between px-5 pb-3">
                <div>
                  <h2 className="text-[17px] font-semibold" style={{ color: '#1e293b' }}>
                    Add Players
                  </h2>
                  {spotsRemaining > 0 && (
                    <p className="text-[12px] mt-0.5" style={{ color: '#94a3b8' }}>
                      {spotsRemaining} spot{spotsRemaining !== 1 ? 's' : ''} remaining
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full transition-all duration-150 active:scale-[0.92]"
                  style={{ background: 'rgba(0, 0, 0, 0.04)' }}
                >
                  <X className="w-4 h-4" style={{ color: '#64748b' }} />
                </button>
              </div>

              {/* Search with clear button */}
              <div className="px-5 pb-3">
                <div
                  className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl relative"
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
                  }}
                >
                  <Search className="w-4 h-4" style={{ color: '#94a3b8' }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search friends or all users..."
                    className="flex-1 text-[14px] bg-transparent border-none outline-none"
                    style={{ color: '#1e293b' }}
                  />
                  {searchQuery && (
                    <button
                      onClick={handleClearSearch}
                      className="p-1 rounded-full transition-all duration-150 active:scale-90"
                      style={{ background: 'rgba(0, 0, 0, 0.04)' }}
                    >
                      <X className="w-3.5 h-3.5" style={{ color: '#94a3b8' }} />
                    </button>
                  )}
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
                  className="w-full flex items-center gap-3 p-3 rounded-xl mb-3 transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.06) 0%, rgba(147, 51, 234, 0.03) 100%)',
                    border: '1px solid rgba(147, 51, 234, 0.1)',
                  }}
                >
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(147, 51, 234, 0.1)' }}
                  >
                    <UserPlus className="w-5 h-5" style={{ color: '#9333EA' }} />
                  </div>
                  <span className="text-[14px] font-medium" style={{ color: '#7C3AED' }}>
                    Add Guest (not on app)
                  </span>
                </button>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 mb-3"
                >
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Guest name..."
                    autoFocus
                    className="flex-1 px-3.5 py-3 rounded-xl text-[14px] outline-none transition-all focus:ring-2 focus:ring-purple-200"
                    style={{
                      background: 'rgba(147, 51, 234, 0.05)',
                      border: '1px solid rgba(147, 51, 234, 0.15)',
                      color: '#1e293b',
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddGuest();
                      if (e.key === 'Escape') setShowGuestInput(false);
                    }}
                  />
                  <button
                    onClick={handleAddGuest}
                    disabled={!guestName.trim()}
                    className="px-4 py-3 rounded-xl text-[14px] font-semibold transition-all duration-150 active:scale-[0.96] disabled:opacity-50"
                    style={{ 
                      background: 'linear-gradient(135deg, #9333EA 0%, #7C3AED 100%)', 
                      color: 'white',
                      boxShadow: '0 2px 8px rgba(147, 51, 234, 0.3)',
                    }}
                  >
                    Add
                  </button>
                </motion.div>
              )}

              {/* Loading state */}
              {isLoading && (
                <div className="py-10 text-center">
                  <motion.div 
                    className="w-6 h-6 border-2 border-slate-200 border-t-slate-500 rounded-full mx-auto"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  />
                  <p className="text-[13px] mt-3" style={{ color: '#94a3b8' }}>Searching...</p>
                </div>
              )}

              {/* Friends section */}
              {!isLoading && showFriendsSection && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2.5 px-1">
                    <Users className="w-3.5 h-3.5" style={{ color: '#94a3b8' }} />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.05em]" style={{ color: '#94a3b8' }}>
                      {hasSearchQuery ? 'Friends' : 'Your Friends'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {friends.map(player => (
                      <PlayerRow
                        key={player.id}
                        player={player}
                        isSelected={isSelected(player.id)}
                        canAdd={canAddMore}
                        onAdd={() => handleAddUser(player)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Search results section (non-friends) */}
              {!isLoading && showSearchResultsSection && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2.5 px-1">
                    <Globe className="w-3.5 h-3.5" style={{ color: '#94a3b8' }} />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.05em]" style={{ color: '#94a3b8' }}>
                      All Users
                    </span>
                  </div>
                  <div className="space-y-1">
                    {searchResults.map(player => (
                      <PlayerRow
                        key={player.id}
                        player={player}
                        isSelected={isSelected(player.id)}
                        canAdd={canAddMore}
                        onAdd={() => handleAddUser(player)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* No results */}
              {showNoResults && (
                <div className="py-10 text-center">
                  <p className="text-[14px] font-medium" style={{ color: '#64748b' }}>
                    No users found for "{searchQuery}"
                  </p>
                  <p className="text-[13px] mt-1" style={{ color: '#94a3b8' }}>
                    Try a different name or add as guest
                  </p>
                </div>
              )}

              {/* Empty state - no friends yet */}
              {!isLoading && !hasSearchQuery && friends.length === 0 && (
                <div className="py-10 text-center">
                  <div 
                    className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                    style={{ background: 'rgba(0, 0, 0, 0.04)' }}
                  >
                    <Users className="w-6 h-6" style={{ color: '#94a3b8' }} />
                  </div>
                  <p className="text-[14px] font-medium" style={{ color: '#64748b' }}>
                    No friends yet
                  </p>
                  <p className="text-[13px] mt-1" style={{ color: '#94a3b8' }}>
                    Search for users or add guests
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

interface PlayerRowProps {
  player: {
    id: string;
    name: string;
    display_name?: string;
    profile_photo_url?: string;
    username?: string;
  };
  isSelected: boolean;
  canAdd: boolean;
  onAdd: () => void;
}

function PlayerRow({ player, isSelected, canAdd, onAdd }: PlayerRowProps) {
  return (
    <motion.button
      onClick={onAdd}
      disabled={isSelected || !canAdd}
      whileTap={!isSelected && canAdd ? { scale: 0.98 } : {}}
      className="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-150 disabled:opacity-60"
      style={{
        background: isSelected ? 'rgba(16, 185, 129, 0.06)' : 'transparent',
      }}
    >
      <div 
        className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
        style={{ 
          background: isSelected 
            ? 'rgba(16, 185, 129, 0.12)' 
            : 'rgba(0, 0, 0, 0.05)',
          border: isSelected ? '1px solid rgba(16, 185, 129, 0.15)' : 'none',
        }}
      >
        {player.profile_photo_url ? (
          <img src={player.profile_photo_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
        ) : (
          <span 
            className="text-[14px] font-bold"
            style={{ color: isSelected ? '#059669' : '#94a3b8' }}
          >
            {player.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="flex-1 text-left min-w-0">
        <div 
          className="text-[14px] font-medium truncate"
          style={{ color: isSelected ? '#059669' : '#1e293b' }}
        >
          {player.display_name || player.name}
        </div>
        {player.username && player.username !== player.display_name && (
          <div 
            className="text-[12px] truncate"
            style={{ color: '#94a3b8' }}
          >
            @{player.username}
          </div>
        )}
      </div>
      {isSelected && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(16, 185, 129, 0.12)' }}
        >
          <Check className="w-3.5 h-3.5" style={{ color: '#059669' }} />
        </motion.div>
      )}
    </motion.button>
  );
}
