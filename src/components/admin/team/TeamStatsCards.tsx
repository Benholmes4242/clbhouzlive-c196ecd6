import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, ShieldCheck, Shield, Clock } from 'lucide-react';
import type { AdminTeamStats } from '@/hooks/admin/useAdminTeamDetails';

interface TeamStatsCardsProps {
  stats: AdminTeamStats;
}

export function TeamStatsCards({ stats }: TeamStatsCardsProps) {
  const cards = [
    {
      label: 'Total Admins',
      value: stats.totalAdmins,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Full Admins',
      value: stats.fullAdmins,
      icon: ShieldCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Limited Admins',
      value: stats.limitedAdmins,
      icon: Shield,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Pending Invites',
      value: stats.pendingInvites,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
