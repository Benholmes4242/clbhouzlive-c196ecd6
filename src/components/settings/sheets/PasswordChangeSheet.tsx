import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff } from 'lucide-react';

interface PasswordChangeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PasswordChangeSheet({ open, onOpenChange }: PasswordChangeSheetProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!newPassword.trim()) {
      toast.error('Please enter a new password');
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success('Password updated');
      
      // Clear form and close
      setNewPassword('');
      setConfirmPassword('');
      onOpenChange(false);

    } catch (err: any) {
      console.error('[PasswordChange] error:', err);
      toast.error("Couldn't update password", {
        description: err.message || 'Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setNewPassword('');
      setConfirmPassword('');
      setShowPassword(false);
    }
    onOpenChange(isOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent 
        side="bottom" 
        className="rounded-t-[18px] px-4 pb-8 bg-white max-w-full"
        style={{ maxHeight: '85vh' }}
      >
        {/* Grab handle */}
        <div className="flex justify-center pt-3 pb-4">
          <div className="w-9 h-1 rounded-full bg-[#E4E6E9]" />
        </div>

        <SheetHeader className="pb-4">
          <SheetTitle className="text-center text-[#1F2428] text-lg font-semibold">
            Change password
          </SheetTitle>
          <p className="text-center text-[13px] text-[#5E666D]">
            You're signed in, so you can set a new password directly.
          </p>
        </SheetHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="new-password" className="text-[#5E666D] text-sm">
              New password
            </Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="h-12 bg-[#F8FAFC] border-[rgba(31,36,40,0.1)] focus:border-[#3A3F46] pr-10"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#97A1AA] hover:text-[#5E666D]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-[#5E666D] text-sm">
              Confirm new password
            </Label>
            <Input
              id="confirm-password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
              className="h-12 bg-[#F8FAFC] border-[rgba(31,36,40,0.1)] focus:border-[#3A3F46]"
              disabled={isSubmitting}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !newPassword || !confirmPassword}
            className="w-full h-12 mt-4 bg-[#1F2428] text-white hover:bg-[#2A3038] rounded-xl font-medium"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              'Update password'
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
