import { useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

const INK_55 = '#64748B';

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${'\u2022'.repeat(Math.max(2, local.length - 2))}@${domain}`;
}

export default function EmailPage() {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
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
      navigate(-1);
    } catch (err: any) {
      toast.error(err.message ?? 'Could not update email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ManagePageShell title="Email">
      <div className="px-4 pt-4 space-y-4">
        {/* Current email card */}
        <div className="rounded-2xl p-4" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.07)' }}>
          <p className="text-[11px] font-semibold uppercase tracking-[1.5px]" style={{ color: INK_55 }}>
            Current email
          </p>
          <p className="text-[15px] font-medium text-foreground mt-1.5">
            {user?.email ? maskEmail(user.email) : '\u2014'}
          </p>
        </div>

        {/* Change email card */}
        <div className="rounded-2xl p-4 space-y-4" style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.07)' }}>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-[1.5px]" style={{ color: INK_55 }}>
              New email
            </Label>
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
            <Label className="text-[11px] font-semibold uppercase tracking-[1.5px]" style={{ color: INK_55 }}>
              Current password
            </Label>
            <Input
              type="password"
              placeholder="Confirm with your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button
            className="w-full min-h-[44px]"
            disabled={!email || !password || isLoading}
            onClick={handleSubmit}
          >
            {isLoading ? 'Sending\u2026' : 'Send verification email'}
          </Button>
        </div>

        <p className="text-[12px] leading-relaxed px-1" style={{ color: INK_55 }}>
          You will need to confirm the change from a link sent to your new address. Until you confirm, your account email stays the same.
        </p>
      </div>
    </ManagePageShell>
  );
}
