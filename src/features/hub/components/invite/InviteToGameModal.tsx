/**
 * InviteToGameModal - Modal for inviting players to a game
 * Reuses golfers-to-follow UI pattern
 */

import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Check, Loader2, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { supabase } from '@/integrations/supabase/client';
import { useInviteSearch, InvitableUser } from '../../hooks/useInviteSearch';
import { toast } from 'sonner';
import { 
  useSendGameInviteNotification, 
  formatGameDateForNotification, 
  formatGameTimeForNotification 
} from '../../hooks/useGameNotifications';

interface InviteToGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  courseName?: string;
  startTime?: string | Date;
  onInviteSuccess?: () => void;
}

export function InviteToGameModal({
  isOpen,
  onClose,
  gameId,
  courseName,
  startTime,
  onInviteSuccess,
}: InviteToGameModalProps) {
  const { searchInput, setSearchInput, users, isLoading } = useInviteSearch(gameId);
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [gameData, setGameData] = useState<{ courseName: string; startTime: string } | null>(null);
  const sendGameInviteNotification = useSendGameInviteNotification();

  // Fetch game data if not provided via props (ensures notifications never silently fail)
  useEffect(() => {
    if (isOpen && gameId && (!courseName || !startTime)) {
      supabase
        .from('games')
        .select('course_name, start_time')
        .eq('id', gameId)
        .single()
        .then(({ data }) => {
          if (data) {
            setGameData({
              courseName: data.course_name || 'Golf Game',
              startTime: data.start_time,
            });
          }
        });
    } else if (courseName && startTime) {
      // Use props if provided
      setGameData({
        courseName,
        startTime: typeof startTime === 'string' ? startTime : startTime.toISOString(),
      });
    }
  }, [isOpen, gameId, courseName, startTime]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchInput('');
      setInvitedIds(new Set());
      setGameData(null);
    }
  }, [isOpen, setSearchInput]);

  const handleInvite = useCallback(async (user: InvitableUser) => {
    setInvitingId(user.id);
    
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('game_participants')
        .insert({
          game_id: gameId,
          user_id: user.id,
          role: 'player',
          state: 'invited',
          rsvp_status: 'invited',
          invited_by: currentUser.id,
          reserves_slot: false,
        });

      if (error) {
        if (error.code === '23505') {
          // Already invited (unique constraint)
          toast.info(`${user.displayName} is already invited`);
        } else {
          throw error;
        }
      } else {
        setInvitedIds(prev => new Set([...prev, user.id]));
        toast.success(`Invited ${user.displayName}`);
        
        // Send game invite notification (always works - uses fetched data if props missing)
        if (gameData) {
          const startDate = new Date(gameData.startTime);
          sendGameInviteNotification.mutate({
            gameId,
            invitedUserIds: [user.id],
            courseName: gameData.courseName,
            date: formatGameDateForNotification(startDate),
            time: formatGameTimeForNotification(startDate),
          });
        }
        
        onInviteSuccess?.();
      }
    } catch (error) {
      console.error('Failed to invite:', error);
      toast.error('Failed to send invite');
    } finally {
      setInvitingId(null);
    }
  }, [gameId, gameData, onInviteSuccess, sendGameInviteNotification]);

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
            className="fixed inset-0 z-[10100]"
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-x-0 bottom-0 z-[10200] rounded-t-[20px] overflow-hidden flex flex-col"
            style={{
              backgroundColor: 'hsl(var(--background))',
              boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.12)',
              height: '85vh',
              maxHeight: '85vh',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/50 flex-shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Invite Players
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Search for golfers to invite
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 -mr-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Search */}
            <div className="px-5 py-3 border-b border-border/50 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by name..."
                  className="pl-10 h-11 bg-muted/50 border-border/50 focus:border-primary/50 focus:ring-0"
                />
              </div>
            </div>

            {/* Users list */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <UserPlus className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-foreground mb-1">No golfers found</p>
                  <p className="text-sm text-muted-foreground">
                    {searchInput ? 'Try a different search' : 'Search for golfers to invite'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {users.map((user) => {
                    const isInvited = invitedIds.has(user.id);
                    const isInviting = invitingId === user.id;

                    return (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 px-5 py-3"
                      >
                        <SquircleAvatar
                          src={user.profilePhotoUrl}
                          alt={user.displayName}
                          size={48}
                          fallback={user.displayName?.charAt(0) || '?'}
                        />

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {user.displayName}
                          </p>
                          {user.username && (
                            <p className="text-xs text-muted-foreground truncate">
                              @{user.username}
                            </p>
                          )}
                          {user.homeClub && (
                            <p className="text-xs text-muted-foreground truncate">
                              {user.homeClub}
                            </p>
                          )}
                        </div>

                        <Button
                          size="sm"
                          variant={isInvited ? 'secondary' : 'default'}
                          disabled={isInvited || isInviting}
                          onClick={() => handleInvite(user)}
                          className="h-8 px-3"
                        >
                          {isInviting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : isInvited ? (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              Invited
                            </>
                          ) : (
                            'Invite'
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-border/50 flex-shrink-0">
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full"
              >
                Done
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    portalRoot
  );
}
