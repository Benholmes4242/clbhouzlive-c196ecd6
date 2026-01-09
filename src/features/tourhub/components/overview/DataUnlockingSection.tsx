import { Lock, Zap, Trophy, Clock, BarChart3 } from 'lucide-react';
import { useTourHubDataStatus } from '../../hooks/useTourHubData';

interface UnlockingFeature {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: 'locked' | 'partial' | 'coming';
}

export function DataUnlockingSection() {
  const { data: status } = useTourHubDataStatus();

  // Determine which features are locked based on data status
  const features: UnlockingFeature[] = [
    {
      icon: <Trophy className="w-4 h-4" />,
      title: 'Live Leaderboards',
      description: 'Real-time tournament scoring',
      status: status?.leaderboards === 0 ? 'locked' : 'partial',
    },
    {
      icon: <Clock className="w-4 h-4" />,
      title: 'Tee Times',
      description: 'Round-by-round pairings',
      status: status?.teeTimes === 0 ? 'locked' : 'partial',
    },
    {
      icon: <BarChart3 className="w-4 h-4" />,
      title: 'Hole Statistics',
      description: 'Per-hole scoring data',
      status: status?.holeStats === 0 ? 'locked' : 'partial',
    },
    {
      icon: <Zap className="w-4 h-4" />,
      title: 'FedEx Rankings',
      description: 'Official tour rankings',
      status: 'coming',
    },
  ];

  // Only show if there are locked features
  const hasLockedFeatures = features.some(f => f.status === 'locked' || f.status === 'coming');
  
  if (!hasLockedFeatures) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-muted/50 via-muted/30 to-background border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <Lock className="w-4 h-4 text-amber-500" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">More Data Unlocking Soon</h3>
          <p className="text-xs text-muted-foreground">Premium tour feeds coming</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {features.filter(f => f.status === 'locked' || f.status === 'coming').map((feature, idx) => (
          <div
            key={idx}
            className="p-3 rounded-lg bg-background/50 border border-border/50"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div className="text-muted-foreground/60">
                {feature.icon}
              </div>
              <span className="text-xs font-medium text-foreground/70">{feature.title}</span>
            </div>
            <p className="text-[10px] text-muted-foreground/60">{feature.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-border/50">
        <p className="text-xs text-muted-foreground text-center">
          Live data feeds will unlock automatically when available
        </p>
      </div>
    </div>
  );
}
