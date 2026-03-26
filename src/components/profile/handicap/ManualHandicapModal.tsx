import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Trash2, Plus, Minus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// New interface for direct save with userId
interface NewManualHandicapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentHandicap: number | null;
  userId: string;
  onSaved?: () => void;
}

// Legacy interface for callback-based save
interface LegacyManualHandicapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { handicapIndex: number; homeClub: string }) => void;
  initialData?: {
    handicapIndex?: number;
    homeClub?: string;
  };
}

type ManualHandicapModalProps = NewManualHandicapModalProps | LegacyManualHandicapModalProps;

// Type guard to check which interface is being used
function isNewInterface(props: ManualHandicapModalProps): props is NewManualHandicapModalProps {
  return 'userId' in props;
}

const ManualHandicapModal: React.FC<ManualHandicapModalProps> = (props) => {
  const { open, onOpenChange } = props;
  
  const [value, setValue] = useState('');
  const [isPlusHandicap, setIsPlusHandicap] = useState(false);
  const [homeClub, setHomeClub] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const queryClient = useQueryClient();

  // Determine current handicap based on interface
  const currentHandicap = isNewInterface(props) 
    ? props.currentHandicap 
    : props.initialData?.handicapIndex ?? null;
  
  const initialHomeClub = isNewInterface(props) 
    ? '' 
    : props.initialData?.homeClub ?? '';

  // Reset value when modal opens
  useEffect(() => {
    if (open) {
      if (currentHandicap !== null && currentHandicap !== undefined) {
        if (currentHandicap < 0) {
          setIsPlusHandicap(true);
          setValue(Math.abs(currentHandicap).toString());
        } else {
          setIsPlusHandicap(false);
          setValue(currentHandicap.toString());
        }
      } else {
        setValue('');
        setIsPlusHandicap(false);
      }
      setHomeClub(initialHomeClub);
    }
  }, [open, currentHandicap, initialHomeClub]);

  const handleClose = () => onOpenChange(false);

  const handleSave = async () => {
    setIsSaving(true);

    const trimmedValue = value.trim();
    let numValue: number | null = trimmedValue === '' ? null : parseFloat(trimmedValue);

    if (numValue !== null) {
      if (isNaN(numValue)) {
        toast.error('Please enter a valid number');
        setIsSaving(false);
        return;
      }
      
      numValue = Math.abs(numValue);
      
      if (isPlusHandicap) {
        if (numValue > 10) {
          toast.error('Plus handicaps cannot exceed +10.0');
          setIsSaving(false);
          return;
        }
        numValue = -numValue;
      } else {
        if (numValue > 54) {
          toast.error('Handicap cannot exceed 54.0');
          setIsSaving(false);
          return;
        }
      }
    }

    if (isNewInterface(props)) {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          eg_handicap_index: numValue,
          updated_at: new Date().toISOString(),
        })
        .eq('id', props.userId);

      if (error) {
        toast.error('Failed to update handicap');
        setIsSaving(false);
        return;
      }

      queryClient.invalidateQueries({ queryKey: ['profile'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['user-profile'], exact: false });

      toast.success(numValue !== null ? 'Handicap updated' : 'Handicap cleared');
      props.onSaved?.();
      onOpenChange(false);
    } else {
      if (numValue !== null) {
        props.onSave({
          handicapIndex: numValue,
          homeClub: homeClub,
        });
      }
      onOpenChange(false);
    }
    
    setIsSaving(false);
  };

  const handleClear = async () => {
    if (!isNewInterface(props)) return;

    setIsClearing(true);

    const { error } = await supabase
      .from('user_profiles')
      .update({
        eg_handicap_index: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', props.userId);

    if (error) {
      toast.error('Failed to clear handicap');
      setIsClearing(false);
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['profile'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['user-profile'], exact: false });

    toast.success('Handicap cleared');
    props.onSaved?.();
    onOpenChange(false);
    setIsClearing(false);
  };

  const isEditing = currentHandicap !== null && currentHandicap !== undefined;
  const showClearButton = isNewInterface(props) && isEditing;
  const showHomeClubField = !isNewInterface(props);

  const displayPreview = (() => {
    if (!value.trim()) return null;
    const num = parseFloat(value.trim());
    if (isNaN(num)) return null;
    const absNum = Math.abs(num);
    return isPlusHandicap ? `+${absNum.toFixed(1)}` : absNum.toFixed(1);
  })();

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[100]"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[101] bg-background flex flex-col"
            style={{
              borderRadius: '20px 20px 0 0',
              paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
              maxHeight: '92vh',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 80 || info.velocity.y > 400) handleClose();
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-[10px] pb-[4px]">
              <div className="w-9 h-[5px] rounded-full bg-muted-foreground/20" />
            </div>

            {/* Header */}
            <div className="relative flex items-center justify-center px-5 pb-4 pt-2 border-b border-border/50">
              <span className="text-[17px] font-semibold text-foreground">
                {isEditing ? 'Edit Handicap' : 'Add Handicap'}
              </span>
              <button
                onClick={handleClose}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center active:scale-95 transition-transform"
                style={{ backgroundColor: '#F5F5F7' }}
              >
                <X className="w-4 h-4" style={{ color: '#7A7A7A' }} />
              </button>
            </div>

            {/* Content */}
            <div className="px-5 py-5 space-y-5 overflow-y-auto">
              {/* Plus/Standard Toggle */}
              <div className="space-y-2.5">
                <label
                  className="text-[11px] font-semibold uppercase tracking-[1.5px]"
                  style={{ color: '#AEAEB2' }}
                >
                  Handicap Type
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPlusHandicap(false)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 transition-all min-h-[44px] active:scale-[0.98]',
                      !isPlusHandicap 
                        ? 'border-foreground bg-foreground/5 text-foreground' 
                        : 'border-border text-muted-foreground hover:border-border'
                    )}
                  >
                    <span className="text-sm font-medium">Standard</span>
                    <span className="text-xs text-muted-foreground/60">(0 – 54)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPlusHandicap(true)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 transition-all min-h-[44px] active:scale-[0.98]',
                      isPlusHandicap 
                        ? 'border-primary bg-primary/5 text-primary' 
                        : 'border-border text-muted-foreground hover:border-border'
                    )}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span className="text-sm font-medium">Plus</span>
                    <span className="text-xs text-muted-foreground/60">(+0.1 – +10)</span>
                  </button>
                </div>
              </div>

              {/* Handicap Value Input */}
              <div className="space-y-2.5">
                <label
                  className="text-[11px] font-semibold uppercase tracking-[1.5px]"
                  style={{ color: '#AEAEB2' }}
                >
                  Handicap Index
                </label>
                <div className="relative">
                  {isPlusHandicap && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-semibold text-primary">
                      +
                    </span>
                  )}
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max={isPlusHandicap ? "10" : "54"}
                    value={value}
                    onChange={(e) => {
                      const val = e.target.value.replace('-', '');
                      setValue(val);
                    }}
                    placeholder={isPlusHandicap ? "e.g. 4.0" : "e.g. 12.4"}
                    className={cn(
                      "w-full h-[44px] text-lg font-semibold text-foreground rounded-xl border border-border bg-background px-4 outline-none transition-all",
                      "focus:border-[hsl(38,92%,50%)] focus:ring-[3px] focus:ring-[hsla(38,92%,50%,0.10)]",
                      isPlusHandicap && "pl-8"
                    )}
                    autoFocus
                  />
                </div>
                {displayPreview && (
                  <p className="text-xs text-muted-foreground">
                    Will display as: <span className="font-semibold text-foreground">{displayPreview}</span>
                  </p>
                )}
              </div>
              
              {/* Home Club field - only for legacy interface */}
              {showHomeClubField && (
                <div className="space-y-2.5">
                  <label
                    className="text-[11px] font-semibold uppercase tracking-[1.5px]"
                    style={{ color: '#AEAEB2' }}
                  >
                    Home Club
                  </label>
                  <input
                    type="text"
                    value={homeClub}
                    onChange={(e) => setHomeClub(e.target.value)}
                    placeholder="Enter your home club"
                    className="w-full h-[44px] text-sm text-foreground rounded-xl border border-border bg-background px-4 outline-none transition-all focus:border-[hsl(38,92%,50%)] focus:ring-[3px] focus:ring-[hsla(38,92%,50%,0.10)]"
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 bg-background border-t border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  {/* Clear button - only show if editing and using new interface */}
                  {showClearButton && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClear}
                      disabled={isSaving || isClearing}
                      className="text-destructive hover:text-destructive/80 hover:bg-destructive/10 gap-1.5 min-h-[44px] active:scale-[0.95]"
                    >
                      <Trash2 className="h-4 w-4" />
                      Clear
                    </Button>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Cancel button */}
                  <button
                    onClick={handleClose}
                    disabled={isSaving || isClearing}
                    className="rounded-full px-6 min-h-[44px] bg-muted border border-border text-foreground font-semibold text-sm active:scale-[0.98] transition-transform disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  
                  {/* Save button */}
                  <button
                    onClick={handleSave}
                    disabled={isSaving || isClearing || (!showHomeClubField && value.trim() === '' && !isEditing)}
                    className="rounded-full px-6 min-h-[44px] font-semibold text-sm text-white active:scale-[0.98] transition-transform disabled:opacity-50"
                    style={{ backgroundColor: '#f59e0b' }}
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ManualHandicapModal;
