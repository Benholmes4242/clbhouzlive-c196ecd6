/**
 * HubSharePanel - Post-creation share sheet
 * Allows sharing to Hub Feed, Game/Trip Timeline, copy link, external share
 */

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link2, Share2, Users, MessageSquare, Globe, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export type ShareEntityType = 'game' | 'trip' | 'moment';
export type ShareContext = 'hub' | 'trip' | 'game';

interface HubSharePanelProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: ShareEntityType;
  entityId: string;
  entityName?: string;
  tripId?: string;
  gameId?: string;
  context?: ShareContext;
  onInvitePlayers?: () => void;
}

interface ShareOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  defaultEnabled: boolean;
}

export function HubSharePanel({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityName,
  tripId,
  gameId,
  context = 'hub',
  onInvitePlayers,
}: HubSharePanelProps) {
  const [selections, setSelections] = useState<Record<string, boolean>>({});
  const [isPosting, setIsPosting] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Build share options based on entity type and context
  const shareOptions: ShareOption[] = React.useMemo(() => {
    const options: ShareOption[] = [];

    // Hub Feed option (always available)
    options.push({
      id: 'hub_feed',
      label: 'Share to Hub',
      description: 'Post to your feed for friends to see',
      icon: <Globe className="w-5 h-5" />,
      defaultEnabled: context === 'hub',
    });

    // Game Timeline (for moments created in game context)
    if (entityType === 'moment' && gameId) {
      options.push({
        id: 'game_timeline',
        label: 'Game Timeline',
        description: 'Add to this game\'s timeline',
        icon: <MessageSquare className="w-5 h-5" />,
        defaultEnabled: context === 'game',
      });
    }

    // Trip Timeline (for games/moments in trip context)
    if (tripId) {
      options.push({
        id: 'trip_timeline',
        label: 'Trip Timeline',
        description: 'Add to the trip timeline',
        icon: <MessageSquare className="w-5 h-5" />,
        defaultEnabled: context === 'trip',
      });
    }

    return options;
  }, [entityType, context, gameId, tripId]);

  // Initialize selections based on defaults
  useEffect(() => {
    if (isOpen) {
      const defaults: Record<string, boolean> = {};
      shareOptions.forEach(opt => {
        defaults[opt.id] = opt.defaultEnabled;
      });
      setSelections(defaults);
      setLinkCopied(false);
    }
  }, [isOpen, shareOptions]);

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

  const toggleSelection = useCallback((id: string) => {
    setSelections(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const getShareUrl = useCallback(() => {
    const base = window.location.origin;
    switch (entityType) {
      case 'game':
        return `${base}/game/${entityId}?tab=details`;
      case 'trip':
        return `${base}/hub/trip/${entityId}?tab=timeline`;
      case 'moment':
        return `${base}/hub/moment/${entityId}`;
      default:
        return `${base}/hub`;
    }
  }, [entityType, entityId]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setLinkCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  }, [getShareUrl]);

  const handleExternalShare = useCallback(async () => {
    const url = getShareUrl();
    const title = entityName || `Check out this ${entityType}`;
    const text = `Join me on this ${entityType}!`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (err) {
        // User cancelled or share failed
        if ((err as Error).name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  }, [getShareUrl, entityName, entityType, handleCopyLink]);

  const handlePost = useCallback(async () => {
    setIsPosting(true);
    
    try {
      // TODO: Implement actual posting logic
      // For now, just simulate success
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const selectedOptions = Object.entries(selections)
        .filter(([_, enabled]) => enabled)
        .map(([id]) => id);
      
      if (selectedOptions.length > 0) {
        toast.success('Shared');
      }
      
      onClose();
    } catch (error) {
      toast.error("Couldn't share");
    } finally {
      setIsPosting(false);
    }
  }, [selections, onClose]);

  const hasSelections = Object.values(selections).some(Boolean);
  const entityLabel = entityType === 'game' ? 'Game' : entityType === 'trip' ? 'Trip' : 'Moment';

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
              background: 'rgba(0, 0, 0, 0.4)',
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
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-x-0 bottom-0 z-[10000] rounded-t-[20px] overflow-hidden"
            style={{
              backgroundColor: '#FFFFFF',
              boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.12)',
              maxHeight: '85vh',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {entityLabel} Created! 🎉
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Share it with your golf network
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 -mr-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="px-5 py-4 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 180px)' }}>
              {/* Share Options */}
              {shareOptions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Share to
                  </p>
                  <div className="space-y-2">
                    {shareOptions.map(option => (
                      <button
                        key={option.id}
                        onClick={() => toggleSelection(option.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                          selections[option.id]
                            ? 'bg-green-50 border-2 border-green-500'
                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                        }`}
                      >
                        <div className={`flex-shrink-0 ${selections[option.id] ? 'text-green-600' : 'text-gray-400'}`}>
                          {option.icon}
                        </div>
                        <div className="flex-1 text-left">
                          <p className={`font-medium ${selections[option.id] ? 'text-green-900' : 'text-gray-900'}`}>
                            {option.label}
                          </p>
                          <p className="text-xs text-gray-500">{option.description}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          selections[option.id] ? 'bg-green-500' : 'border-2 border-gray-300'
                        }`}>
                          {selections[option.id] && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Quick Actions
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="flex-1 flex items-center justify-center gap-2 p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    {linkCopied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Link2 className="w-4 h-4 text-gray-600" />
                    )}
                    <span className="text-sm font-medium text-gray-700">
                      {linkCopied ? 'Copied!' : 'Copy Link'}
                    </span>
                  </button>
                  <button
                    onClick={handleExternalShare}
                    className="flex-1 flex items-center justify-center gap-2 p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    <Share2 className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Share</span>
                  </button>
                </div>
              </div>

              {/* Invite Players (for games) */}
              {entityType === 'game' && onInvitePlayers && (
                <button
                  onClick={onInvitePlayers}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                >
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Invite Players</span>
                </button>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-100 bg-white">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 border-gray-200"
                >
                  Skip
                </Button>
                <Button
                  onClick={handlePost}
                  disabled={!hasSelections || isPosting}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {isPosting ? 'Posting...' : 'Post Now'}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    portalRoot
  );
}
