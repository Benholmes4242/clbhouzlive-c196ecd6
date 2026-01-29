import { useNavigate } from 'react-router-dom';
import { ShieldAlert, UserPlus, Clock } from 'lucide-react';
import { ActionQueueCard } from '../ActionQueueCard';
import type { ActionQueueMetrics } from '@/features/admin/hooks/useCommandCenterMetrics';

interface ActionQueuesSectionProps {
  data: ActionQueueMetrics | undefined;
  isLoading: boolean;
}

export function ActionQueuesSection({ data, isLoading }: ActionQueuesSectionProps) {
  const navigate = useNavigate();

  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground mb-4">Action Queues</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ActionQueueCard
          title="Pending Verifications"
          count={data?.pendingVerifications ?? 0}
          icon={ShieldAlert}
          variant={data?.pendingVerifications && data.pendingVerifications > 0 ? 'warning' : 'default'}
          isLoading={isLoading}
          onClick={() => navigate('/admin/verification')}
        />
        
        <ActionQueueCard
          title="Admin Invites"
          count={data?.pendingAdminInvites ?? 0}
          icon={UserPlus}
          isLoading={isLoading}
          onClick={() => navigate('/admin/team')}
        />
        
        <ActionQueueCard
          title="Expiring Access"
          count={data?.expiringAdminAccess ?? 0}
          icon={Clock}
          variant={data?.expiringAdminAccess && data.expiringAdminAccess > 0 ? 'danger' : 'default'}
          isLoading={isLoading}
          onClick={() => navigate('/admin/team')}
        />
      </div>
    </section>
  );
}
