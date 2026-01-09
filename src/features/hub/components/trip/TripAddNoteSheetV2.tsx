/**
 * TripAddNoteSheetV2 - Sheet for adding notes to trip timeline
 * V2 design language with glass styling
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { haptic } from '@/utils/haptics';
import { useTripNotes } from '../../hooks/useTripNotes';

interface TripAddNoteSheetV2Props {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
}

export function TripAddNoteSheetV2({
  isOpen,
  onClose,
  tripId,
}: TripAddNoteSheetV2Props) {
  const [text, setText] = useState('');
  const [hasTime, setHasTime] = useState(false);
  const [time, setTime] = useState('12:00');
  const [date, setDate] = useState('');
  
  const { createNote, isCreating } = useTripNotes(tripId);
  
  // Scroll lock refs
  const scrollYRef = useRef(0);
  const wasOpenRef = useRef(false);

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      scrollYRef.current = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollYRef.current}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
      wasOpenRef.current = true;
    } else if (!isOpen && wasOpenRef.current) {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollYRef.current);
      wasOpenRef.current = false;
    }

    return () => {
      if (wasOpenRef.current) {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollYRef.current);
        wasOpenRef.current = false;
      }
    };
  }, [isOpen]);

  // Reset form when sheet opens
  useEffect(() => {
    if (isOpen) {
      setText('');
      setHasTime(false);
      setTime('12:00');
      setDate('');
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    haptic('light');
    onClose();
  }, [onClose]);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    
    haptic('medium');
    
    let occursAt: Date | null = null;
    if (hasTime && date) {
      occursAt = new Date(`${date}T${time}`);
    }
    
    try {
      await createNote({
        tripId,
        text: text.trim(),
        occursAt,
      });
      onClose();
    } catch (error) {
      console.error('Failed to create note:', error);
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
            className="fixed inset-0 z-[10003]"
            style={{
              background: 'rgba(0, 0, 0, 0.25)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
            onClick={handleClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-x-0 bottom-0 z-[10004] flex flex-col rounded-t-[24px] overflow-hidden"
            style={{
              maxHeight: '70svh',
              backgroundColor: '#F9FAFB',
              boxShadow: '0 -4px 32px rgba(0, 0, 0, 0.15)',
            }}
          >
            {/* Grabber */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div 
                className="w-9 h-[3px] rounded-full"
                style={{ background: 'rgba(0, 0, 0, 0.08)' }}
              />
            </div>

            {/* Header */}
            <div 
              className="flex items-center justify-between px-4 pt-1 pb-3 flex-shrink-0"
              style={{
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
            >
              <h2 
                className="text-[17px] font-semibold"
                style={{ color: '#1e293b', letterSpacing: '-0.01em' }}
              >
                Add Note
              </h2>
              <button
                onClick={handleClose}
                className="p-2 -mr-2 rounded-full transition-colors hover:bg-black/5"
              >
                <X className="w-5 h-5" style={{ color: 'rgba(30, 41, 59, 0.5)' }} />
              </button>
            </div>

            {/* Divider */}
            <div 
              className="h-px flex-shrink-0"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.06) 15%, rgba(0,0,0,0.06) 85%, transparent 100%)',
              }}
            />

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Note text */}
              <div className="space-y-2">
                <Label htmlFor="note-text" className="text-sm font-medium text-slate-700">
                  Note
                </Label>
                <Textarea
                  id="note-text"
                  placeholder="Add a note to the timeline..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="min-h-[100px] resize-none bg-white/70 border-black/10 focus:border-primary/30"
                  autoFocus
                />
              </div>

              {/* Time toggle */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <Label htmlFor="has-time" className="text-sm font-medium text-slate-700">
                    Set a specific time
                  </Label>
                </div>
                <Switch
                  id="has-time"
                  checked={hasTime}
                  onCheckedChange={setHasTime}
                />
              </div>

              {/* Date & time inputs */}
              {hasTime && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="note-date" className="text-xs text-slate-500">
                      Date
                    </Label>
                    <Input
                      id="note-date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="bg-white/70 border-black/10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="note-time" className="text-xs text-slate-500">
                      Time
                    </Label>
                    <Input
                      id="note-time"
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="bg-white/70 border-black/10"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 pt-2 flex-shrink-0">
              <Button
                onClick={handleSubmit}
                disabled={!text.trim() || isCreating}
                className="w-full h-12 rounded-xl font-semibold"
              >
                {isCreating ? 'Adding...' : 'Add Note'}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    portalRoot
  );
}
