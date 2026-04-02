import { useState } from 'react';
import { X } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function PasswordChangeSheet({ open, onClose }: Props) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = current && next && confirm && next === confirm && next.length >= 8;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) throw error;
      toast.success('Password updated', { description: 'Your password has been changed successfully.' });
      setCurrent(''); setNext(''); setConfirm('');
      onClose();
    } catch (err: any) {
      toast.error(err.message ?? 'Could not update password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-[20px] bg-background border-0 px-5"
        hideCloseButton
        style={{ paddingBottom: 'calc(var(--sab) + 24px)' }}
      >
        <div className="w-10 h-1 rounded-full bg-muted mx-auto mt-3 mb-4" />
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[20px] font-bold tracking-tight text-foreground">Change Password</h2>
          <button onClick={onClose} className="flex items-center justify-center min-h-[44px] min-w-[44px] text-muted-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide">Current Password</Label>
            <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide">New Password</Label>
            <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="Min. 8 characters" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide">Confirm New Password</Label>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat new password" />
          </div>
          {next && confirm && next !== confirm && (
            <p className="text-[13px] text-destructive">Passwords do not match.</p>
          )}
        </div>

        <Button className="w-full mt-6 min-h-[44px]" disabled={!canSubmit || isLoading} onClick={handleSubmit}>
          {isLoading ? 'Updating…' : 'Update Password'}
        </Button>
      </SheetContent>
    </Sheet>
  );
}
