import React from 'react';
import { Shield, User, Wrench, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePanelRole } from '@/hooks/usePanelRole';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { AdminPageHeader, AdminSectionHeader, AdminButton, AdminStatusPill } from '../components/ui';

export default function SettingsPage() {
  const navigate  = useNavigate();
  const { role }  = usePanelRole();
  const { user }  = useSupabaseSession();

  return (
    <div style={{ padding: 24, background: '#F8FAFC', minHeight: '100%' }} className="max-w-3xl mx-auto space-y-8">

      <AdminPageHeader title="Settings" description="Account and admin preferences" />

      {/* Account info */}
      <div className="space-y-4">
        <AdminSectionHeader title="Your Account" />
        <div className="rounded-xl border border-border/60 bg-card divide-y divide-border/30 overflow-hidden">
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-foreground">Email</p>
              <p className="text-[12px] text-muted-foreground">{user?.email ?? '—'}</p>
            </div>
          </div>

          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Shield className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-foreground">Admin Role</p>
                <p className="text-[12px] text-muted-foreground">Your current permission level</p>
              </div>
            </div>
            <AdminStatusPill
              status={role === 'full' ? 'full' : 'limited'}
              label={role === 'full' ? 'Full Admin' : 'Limited Admin'}
            />
          </div>

          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-[13px] font-semibold text-foreground">Public Profile</p>
              <p className="text-[12px] text-muted-foreground">View your profile in the app</p>
            </div>
            <AdminButton variant="outline" size="sm" icon={ExternalLink} onClick={() => navigate('/profile')}>
              View
            </AdminButton>
          </div>
        </div>
      </div>

      {/* Navigation shortcuts */}
      <div className="space-y-4">
        <AdminSectionHeader title="Quick Links" />
        <div className="rounded-xl border border-border/60 bg-card divide-y divide-border/30 overflow-hidden">
          {[
            { label: 'Team & Roles',  desc: 'Manage admin access',      path: '/admin-v2/team'            },
            { label: 'Invites',       desc: 'Send admin invitations',   path: '/admin-v2/invites'         },
            { label: 'Audit Log',     desc: 'Review all admin actions', path: '/admin-v2/audit'           },
            { label: 'Dev Tools',     desc: 'Geocoding and test lab',   path: '/admin-v2/tools/geocoding' },
          ].map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors text-left"
            >
              <div>
                <p className="text-[13px] font-semibold text-foreground">{item.label}</p>
                <p className="text-[12px] text-muted-foreground">{item.desc}</p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Exit */}
      <div className="space-y-4">
        <AdminSectionHeader title="Navigation" />
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden p-4">
          <AdminButton
            variant="outline"
            onClick={() => navigate('/clubhouse')}
            className="w-full"
          >
            ← Back to Clbhouz App
          </AdminButton>
        </div>
      </div>

    </div>
  );
}
