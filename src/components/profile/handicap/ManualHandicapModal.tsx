import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Trash2, Plus, Minus } from 'lucide-react';
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
        // If it's a plus handicap (stored as negative), toggle on and show absolute value
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

  const handleSave = async () => {
    setIsSaving(true);

    const trimmedValue = value.trim();
    
    // Parse the absolute value
    let numValue: number | null = trimmedValue === '' ? null : parseFloat(trimmedValue);

    // Validation
    if (numValue !== null) {
      if (isNaN(numValue)) {
        toast.error('Please enter a valid number');
        setIsSaving(false);
        return;
      }
      
      // Ensure it's a positive number (absolute value)
      numValue = Math.abs(numValue);
      
      // Apply plus handicap logic: plus handicaps are stored as negative
      if (isPlusHandicap) {
        // Plus handicaps can be 0.1 to 10.0
        if (numValue > 10) {
          toast.error('Plus handicaps cannot exceed +10.0');
          setIsSaving(false);
          return;
        }
        // Store as negative
        numValue = -numValue;
      } else {
        // Standard handicaps: 0 to 54
        if (numValue > 54) {
          toast.error('Handicap cannot exceed 54.0');
          setIsSaving(false);
          return;
        }
      }
    }

    if (isNewInterface(props)) {
      // New interface: Direct save to Supabase
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

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['profile'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['user-profile'], exact: false });

      toast.success(numValue !== null ? 'Handicap updated' : 'Handicap cleared');
      props.onSaved?.();
      onOpenChange(false);
    } else {
      // Legacy interface: Call onSave callback
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
    if (!isNewInterface(props)) {
      // Legacy interface doesn't support clear
      return;
    }

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

    // Invalidate queries
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

  // Display preview of what will be saved
  const displayPreview = (() => {
    if (!value.trim()) return null;
    const num = parseFloat(value.trim());
    if (isNaN(num)) return null;
    const absNum = Math.abs(num);
    return isPlusHandicap ? `+${absNum.toFixed(1)}` : absNum.toFixed(1);
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-0 gap-0 rounded-2xl overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-border">
          <DialogTitle className="text-lg font-semibold text-foreground">
            {isEditing ? 'Edit Handicap' : 'Add Handicap'}
          </DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          {/* Plus/Standard Toggle */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Handicap Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsPlusHandicap(false)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border-2 transition-all min-h-[44px] active:scale-[0.98]',
                  !isPlusHandicap 
                    ? 'border-[#334E3D] bg-[#334E3D]/5 text-[#334E3D]' 
                    : 'border-border text-muted-foreground hover:border-border'
                )}
              >
                <span className="text-sm font-medium">Standard</span>
                <span className="text-xs text-muted-foreground/60">(0 - 54)</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPlusHandicap(true)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border-2 transition-all min-h-[44px] active:scale-[0.98]',
                  isPlusHandicap 
                    ? 'border-[#C1A84C] bg-[#C1A84C]/5 text-[#C1A84C]' 
                    : 'border-border text-muted-foreground hover:border-border'
                )}
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="text-sm font-medium">Plus</span>
                <span className="text-xs text-muted-foreground/60">(+0.1 - +10)</span>
              </button>
            </div>
          </div>

          {/* Handicap Value Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Handicap Index
            </label>
            <div className="relative">
              {isPlusHandicap && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-semibold text-[#C1A84C]">
                  +
                </span>
              )}
              <Input
                type="number"
                step="0.1"
                min="0"
                max={isPlusHandicap ? "10" : "54"}
                value={value}
                onChange={(e) => {
                  // Remove any minus signs - the toggle handles plus/minus
                  const val = e.target.value.replace('-', '');
                  setValue(val);
                }}
                placeholder={isPlusHandicap ? "e.g. 4.0" : "e.g. 12.4"}
                className={cn("h-12 text-lg font-medium", isPlusHandicap && "pl-8")}
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
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Home Club
              </label>
              <Input
                type="text"
                value={homeClub}
                onChange={(e) => setHomeClub(e.target.value)}
                placeholder="Enter your home club"
                className="h-11"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-muted border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              {/* Clear button - only show if editing and using new interface */}
              {showClearButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  disabled={isSaving || isClearing}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1.5 min-h-[44px] active:scale-[0.95]"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Cancel button */}
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving || isClearing}
                className="rounded-full px-5 min-h-[44px] active:scale-[0.98]"
              >
                Cancel
              </Button>
              
              {/* Save button */}
              <Button
                onClick={handleSave}
                disabled={isSaving || isClearing || (!showHomeClubField && value.trim() === '' && !isEditing)}
                className="rounded-full px-5 bg-secondary hover:bg-secondary/80 text-foreground min-h-[44px] active:scale-[0.98]"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManualHandicapModal;
