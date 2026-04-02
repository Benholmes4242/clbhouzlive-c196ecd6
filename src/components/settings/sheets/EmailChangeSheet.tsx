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

export function EmailChangeSheet({ open, onClose }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) return;
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');
      const { error } = await supabase.functions.invoke('secure-email-change', {
        body: { newEmail: email, password },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      toast.success('Verification email sent', { description: 'Check your new inbox to confirm the change.' });
      setEmail('');
      setPassword('');
      onClose();
    } catch (err: any) {
      toast.error(err.message ?? 'Could not update email.');
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
          <h2 className="text-[20px] font-bold tracking-tight text-foreground">Change Email</h2>
          <button onClick={onClose} className="flex items-center justify-center min-h-[44px] min-w-[44px] text-muted-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide">New Email</Label>
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoCapitalize="none"
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide">Current Password</Label>
            <Input
              type="password"
              placeholder="Confirm with your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <Button
          className="w-full mt-6 min-h-[44px]"
          disabled={!email || !password || isLoading}
          onClick={handleSubmit}
        >
          {isLoading ? 'Sending…' : 'Send Verification Email'}
        </Button>
      </SheetContent>
    </Sheet>
  );
}
