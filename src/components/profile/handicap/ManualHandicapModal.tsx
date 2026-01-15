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
import { Trash2 } from 'lucide-react';

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
      setValue(currentHandicap !== null && currentHandicap !== undefined ? currentHandicap.toString() : '');
      setHomeClub(initialHomeClub);
    }
  }, [open, currentHandicap, initialHomeClub]);

  const handleSave = async () => {
    setIsSaving(true);

    const trimmedValue = value.trim();
    const numValue = trimmedValue === '' ? null : parseFloat(trimmedValue);

    // Validation
    if (numValue !== null) {
      if (isNaN(numValue)) {
        toast.error('Please enter a valid number');
        setIsSaving(false);
        return;
      }
      if (numValue < -10 || numValue > 54) {
        toast.error('Handicap must be between +10.0 and 54.0');
        setIsSaving(false);
        return;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-0 gap-0 rounded-2xl overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-[#e2e8f0]">
          <DialogTitle className="text-lg font-semibold text-[#1e293b]">
            {isEditing ? 'Edit Handicap' : 'Add Handicap'}
          </DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#1e293b]">
              Handicap Index
            </label>
            <Input
              type="number"
              step="0.1"
              min="-10"
              max="54"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. 12.4"
              className="h-12 text-lg font-medium"
              autoFocus
            />
            <p className="text-xs text-[#64748b]">
              Enter your handicap index. Use negative numbers for plus handicaps (e.g. -5 for +5.0).
            </p>
          </div>
          
          {/* Home Club field - only for legacy interface */}
          {showHomeClubField && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1e293b]">
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
          
          {/* Quick reference */}
          <div className="flex items-center gap-2 text-xs text-[#94a3b8] pt-1">
            <span className="px-2 py-1 bg-slate-100 rounded">
              Valid range: +10.0 to 54.0
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#f8fafc] border-t border-[#e2e8f0]">
          <div className="flex items-center justify-between">
            <div>
              {/* Clear button - only show if editing and using new interface */}
              {showClearButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  disabled={isSaving || isClearing}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1.5"
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
                className="rounded-full px-5"
              >
                Cancel
              </Button>
              
              {/* Save button */}
              <Button
                onClick={handleSave}
                disabled={isSaving || isClearing || (!showHomeClubField && value.trim() === '' && !isEditing)}
                className="rounded-full px-5 bg-[#1e293b] hover:bg-[#334155]"
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
