import React from 'react';
import { Phone, Globe, MapPin, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionItem {
  key: string;
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}

interface InsightActionBreakdownProps {
  callClicks: number;
  websiteClicks: number;
  directionsClicks: number;
  messageClicks: number;
  className?: string;
}

export function InsightActionBreakdown({
  callClicks,
  websiteClicks,
  directionsClicks,
  messageClicks,
  className,
}: InsightActionBreakdownProps) {
  const actions: ActionItem[] = [
    { key: 'website', label: 'Website', value: websiteClicks, icon: Globe, color: 'bg-blue-500' },
    { key: 'call', label: 'Call', value: callClicks, icon: Phone, color: 'bg-emerald-500' },
    { key: 'directions', label: 'Directions', value: directionsClicks, icon: MapPin, color: 'bg-amber-500' },
    { key: 'message', label: 'Message', value: messageClicks, icon: MessageSquare, color: 'bg-violet-500' },
  ];

  const total = actions.reduce((sum, a) => sum + a.value, 0);

  return (
    <div className={cn(
      "rounded-sq-md border border-border bg-card p-5",
      className
    )}>
      <div className="mb-4">
        <h3 className="font-semibold text-foreground">Action breakdown</h3>
        <p className="text-sm text-muted-foreground mt-0.5">How golfers engage with your profile</p>
      </div>

      {/* Progress bar */}
      <div className="h-3 rounded-full bg-muted overflow-hidden flex mb-5">
        {actions.map((action) => {
          const width = total > 0 ? (action.value / total) * 100 : 0;
          if (width === 0) return null;
          return (
            <div 
              key={action.key}
              className={cn("h-full", action.color)}
              style={{ width: `${width}%` }}
            />
          );
        })}
        {total === 0 && (
          <div className="h-full w-full bg-muted" />
        )}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          const percentage = total > 0 ? Math.round((action.value / total) * 100) : 0;
          
          return (
            <div key={action.key} className="flex items-center gap-3">
              <div className={cn(
                "h-8 w-8 rounded-sq-xs flex items-center justify-center",
                action.color.replace('bg-', 'bg-') + '/15'
              )}>
                <Icon className={cn("h-4 w-4", action.color.replace('bg-', 'text-'))} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{action.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {action.label} {total > 0 && `(${percentage}%)`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
