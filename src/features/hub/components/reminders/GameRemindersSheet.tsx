/**
 * GameRemindersSheet - Bottom sheet for reminder settings
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useGameReminders } from '../../hooks/useGameReminders';
import { toast } from 'sonner';

interface GameRemindersSheetProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
}

export function GameRemindersSheet({ isOpen, onClose, gameId }: GameRemindersSheetProps) {
  const { settings, isLoading, updateSettings, isUpdating } = useGameReminders(gameId);
  
  const [enabled, setEnabled] = useState(true);
  const [remind24h, setRemind24h] = useState(true);
  const [remind2h, setRemind2h] = useState(true);

  // Sync local state with fetched settings
  useEffect(() => {
    if (settings) {
      setEnabled(settings.enabled);
      setRemind24h(settings.remind24h);
      setRemind2h(settings.remind2h);
    }
  }, [settings]);

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

  const handleSave = async () => {
    try {
      await updateSettings({ enabled, remind24h, remind2h });
      toast.success('Reminder settings saved');
      onClose();
    } catch (error) {
      toast.error('Failed to save settings');
    }
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
              backgroundColor: 'hsl(var(--background))',
              boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.12)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">
                  Reminders
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 -mr-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="px-5 py-4 space-y-5">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* Master toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Enable reminders</p>
                      <p className="text-sm text-muted-foreground">
                        Get notified before the game starts
                      </p>
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={setEnabled}
                    />
                  </div>

                  {/* Reminder options */}
                  <div className={`space-y-3 ${!enabled ? 'opacity-50 pointer-events-none' : ''}`}>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Notify me
                    </p>
                    
                    <label className="flex items-center gap-3 cursor-pointer">
                      <Checkbox
                        checked={remind24h}
                        onCheckedChange={(c) => setRemind24h(!!c)}
                      />
                      <span className="text-sm text-foreground">24 hours before</span>
                    </label>
                    
                    <label className="flex items-center gap-3 cursor-pointer">
                      <Checkbox
                        checked={remind2h}
                        onCheckedChange={(c) => setRemind2h(!!c)}
                      />
                      <span className="text-sm text-foreground">2 hours before</span>
                    </label>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    We'll only remind you when you're going to this game.
                  </p>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-border/50">
              <Button
                onClick={handleSave}
                disabled={isUpdating}
                className="w-full"
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Save
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    portalRoot
  );
}
