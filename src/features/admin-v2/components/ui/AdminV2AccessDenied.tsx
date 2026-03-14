import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldOff, ArrowLeft } from 'lucide-react';
import type { PanelRole } from '@/hooks/usePanelRole';

export default function AdminV2AccessDenied({ role }: { role: PanelRole }) {
  const navigate = useNavigate();
  const isNetworkError = role === 'unknown';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background px-4">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'hsl(var(--destructive) / 0.1)' }}>
        <ShieldOff className="w-7 h-7" style={{ color: 'hsl(var(--destructive))' }} />
      </div>

      <div className="text-center space-y-2 max-w-sm">
        <h1 className="text-lg font-bold text-foreground">
          {isNetworkError ? 'Cannot verify access' : 'Access denied'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isNetworkError
            ? 'A network or authentication error occurred. Please check your connection and try again.'
            : "You don't have permission to access the admin console. Contact a full admin if you need access."}
        </p>
      </div>

      <button
        onClick={() => navigate('/clubhouse')}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-foreground text-background text-sm font-medium active:scale-[0.97] transition-transform"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to App
      </button>
    </div>
  );
}
