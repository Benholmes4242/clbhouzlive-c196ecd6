import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Shield, PenLine, BarChart3, User, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateInvite } from '@/hooks/useBusinessTeam';

const roles = [
  { value: 'admin', label: 'Admin', icon: Shield, description: 'Can manage team and settings' },
  { value: 'editor', label: 'Editor', icon: PenLine, description: 'Can create and edit content' },
  { value: 'analyst', label: 'Analyst', icon: BarChart3, description: 'Can view insights' },
  { value: 'member', label: 'Member', icon: User, description: 'Basic access only' },
] as const;

export default function BusinessInvitePage() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const createInvite = useCreateInvite(businessId || '');

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'editor' | 'analyst' | 'member'>('member');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    await createInvite.mutateAsync({ email, role });
    navigate(-1);
  };

  if (!businessId) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Invite teammate</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              required
            />
          </div>
          <p className="text-sm text-muted-foreground">
            They'll receive an in-app invitation to join your team.
          </p>
        </div>

        {/* Role Selection */}
        <div className="space-y-3">
          <Label>Role</Label>
          <div className="space-y-2">
            {roles.map((r) => {
              const Icon = r.icon;
              const isSelected = role === r.value;

              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`w-full flex items-center gap-3 p-4 rounded-sq-md border transition-colors text-left ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <div className={`h-10 w-10 rounded-sq-sm flex items-center justify-center ${
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{r.label}</p>
                    <p className="text-sm text-muted-foreground">{r.description}</p>
                  </div>
                  {isSelected && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full"
          disabled={!email.trim() || createInvite.isPending}
        >
          {createInvite.isPending ? 'Sending...' : 'Send invitation'}
        </Button>
      </form>
    </div>
  );
}
