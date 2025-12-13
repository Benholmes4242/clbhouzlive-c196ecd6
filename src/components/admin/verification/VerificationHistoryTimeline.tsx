import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Clock, ShieldOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuditEntry {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  performed_by: string | null;
  reason: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

interface VerificationHistoryTimelineProps {
  businessId: string;
}

const actionConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  approved: {
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'bg-emerald-500',
    label: 'Verified',
  },
  rejected: {
    icon: <XCircle className="h-4 w-4" />,
    color: 'bg-red-500',
    label: 'Rejected',
  },
  revoked: {
    icon: <ShieldOff className="h-4 w-4" />,
    color: 'bg-red-500',
    label: 'Verification removed',
  },
  requested: {
    icon: <Clock className="h-4 w-4" />,
    color: 'bg-amber-500',
    label: 'Verification requested',
  },
};

export function VerificationHistoryTimeline({ businessId }: VerificationHistoryTimelineProps) {
  const { data: history, isLoading } = useQuery({
    queryKey: ['verification-history', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('verification_audit_log')
        .select('*')
        .eq('entity_type', 'business')
        .eq('entity_id', businessId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AuditEntry[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No verification history found.
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <h3 className="text-sm font-semibold mb-4">Verification history</h3>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-border" />
        
        <div className="space-y-4">
          {history.map((entry, index) => {
            const config = actionConfig[entry.action] || {
              icon: <Clock className="h-4 w-4" />,
              color: 'bg-muted',
              label: entry.action,
            };

            return (
              <div key={entry.id} className="relative flex gap-3">
                {/* Timeline dot */}
                <div className={cn(
                  "relative z-10 flex h-5 w-5 items-center justify-center rounded-full text-white shrink-0",
                  config.color
                )}>
                  {config.icon}
                </div>

                {/* Content */}
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{config.label}</span>
                    {entry.action === 'revoked' && (
                      <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                        Previously verified
                      </span>
                    )}
                    {/* Cooldown bypass indicator (admin-only) */}
                    {entry.metadata?.cooldown_bypassed && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                        {entry.metadata?.is_system_account ? 'System account' : 'Cooldown bypassed (admin override)'}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(entry.created_at), 'MMM d, yyyy \'at\' h:mm a')}
                  </p>

                  {entry.reason && (
                    <p className="mt-2 text-sm text-muted-foreground bg-muted/50 rounded-sq-sm px-3 py-2">
                      "{entry.reason}"
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
