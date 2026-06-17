import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Mail, Shield, User, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateInvite } from '@/hooks/useBusinessTeam';
import { toast } from 'sonner';

const roles = [
  { value: 'admin', label: 'Admin', icon: Shield, description: 'Can manage the business profile and post on its behalf' },
  { value: 'member', label: 'Member', icon: User, description: 'Can post on behalf of the business' },
] as const;

export default function BusinessInvitePage() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const createInvite = useCreateInvite(businessId || '');

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      await createInvite.mutateAsync({ email, role });
      toast.success('Invite sent');
      navigate(-1);
    } catch {
      toast.error('Failed to send invite');
    }
  };

  if (!businessId) return null;

  return (
    <div className="min-h-screen bg-background md:max-w-[620px] md:mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)' }}>
        <div className="flex items-center px-4 h-14">
          <button
            onClick={() => navigate(-1)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 text-foreground active:scale-[0.97] transition-transform"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-[16px] font-semibold text-foreground">Invite to Team</h1>
          </div>
          <div className="w-11" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        {/* Role Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Role</Label>
          <div className="space-y-2">
            {roles.map((r) => {
              const Icon = r.icon;
              const isSelected = role === r.value;

              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`w-full flex items-center gap-3 p-4 rounded-sq-md border transition-all text-left ${
                    isSelected
                      ? 'border-[hsl(38,92%,50%)] bg-[hsl(38,92%,50%)]/5 ring-1 ring-[hsl(38,92%,50%)]/20'
                      : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30'
                  }`}
                >
                  <div className={`h-10 w-10 rounded-sq-sm flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-[hsl(38,92%,50%)] text-white' : 'bg-muted text-muted-foreground'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[15px]">{r.label}</p>
                    <p className="text-sm text-muted-foreground">{r.description}</p>
                  </div>
                  {isSelected && (
                    <Check className="h-5 w-5 text-[hsl(38,92%,50%)]" />
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            You can change their role or remove access at any time.
          </p>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-[hsl(38,92%,50%)] hover:bg-[hsl(36,84%,46%)] text-white border-0"
            disabled={!email.trim() || createInvite.isPending}
          >
            {createInvite.isPending ? 'Sending...' : 'Send invite'}
          </Button>
        </div>
      </form>
    </div>
  );
}
