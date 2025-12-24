import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * PasswordSettingsPage - Change password detail screen
 */
export function PasswordSettingsPage() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated');
      navigate('/settings');
    } catch (err: any) {
      console.error('[PasswordSettings] error:', err);
      toast.error(err.message || 'Failed to update password');
    } finally {
      setIsUpdating(false);
    }
  };

  const isValid = newPassword.length >= 6 && newPassword === confirmPassword;

  return (
    <PageRoot className="min-h-screen bg-[#0A0A0A]">
      <header 
        className="sticky top-0 z-50 px-4 py-3 flex items-center gap-3 border-b border-white/5"
        style={{
          background: 'rgba(10,10,10,0.85)',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          paddingTop: 'max(env(safe-area-inset-top), 12px)',
        }}
      >
        <button
          onClick={() => navigate('/settings')}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-lg font-semibold text-white">Change password</h1>
      </header>

      <div className="max-w-md mx-auto px-4 md:px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Info */}
          <div 
            className="flex items-start gap-3 p-4 rounded-[14px] border border-white/5"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <Lock className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" />
            <p className="text-[13px] text-white/50 leading-relaxed">
              You're signed in, so you can set a new password directly.
            </p>
          </div>

          {/* New password */}
          <div className="space-y-2">
            <Label htmlFor="new-password" className="text-white/80">
              New password
            </Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              disabled={isUpdating}
            />
          </div>

          {/* Confirm password */}
          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-white/80">
              Confirm new password
            </Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              disabled={isUpdating}
            />
          </div>

          {/* Validation messages */}
          {newPassword && newPassword.length < 6 && (
            <p className="text-[13px] text-red-400">Password must be at least 6 characters</p>
          )}
          {newPassword && confirmPassword && newPassword !== confirmPassword && (
            <p className="text-[13px] text-red-400">Passwords don't match</p>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={!isValid || isUpdating}
            className="w-full bg-white text-black hover:bg-white/90 disabled:opacity-50"
          >
            {isUpdating ? 'Updating...' : 'Update password'}
          </Button>
        </form>
      </div>
    </PageRoot>
  );
}

export default PasswordSettingsPage;
